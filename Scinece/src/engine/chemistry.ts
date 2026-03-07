import { PERIODIC_BY_SYMBOL, PERIODIC_TABLE } from "./periodicTable";
import type { ElementData, Flashcard, ParsedTerm, PredictionResult, QuizQuestion } from "./types";

const SHELL_CAPACITY = [2, 8, 18, 32, 32, 18, 8];
const DIATOMIC_ELEMENTS = new Set(["H", "N", "O", "F", "Cl", "Br", "I"]);
const COVALENT_VALENCE: Record<string, number> = {
  H: 1,
  O: 2,
  N: 3,
  C: 4,
  F: 1,
  Cl: 1,
  Br: 1,
  I: 1,
  S: 2,
  P: 3
};

const IONIC_CHARGES: Record<number, number> = {
  1: 1,
  2: 2,
  13: 3,
  15: -3,
  16: -2,
  17: -1,
  18: 0
};

const gcd = (a: number, b: number): number => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x || 1;
};

const lcm = (a: number, b: number): number => Math.abs(a * b) / gcd(a, b);
const formatPositiveCharge = (charge: number): string => (charge === 1 ? "+" : `${charge}+`);
const formatNegativeCharge = (charge: number): string => (charge === 1 ? "-" : `${charge}-`);

export const getElement = (symbol: string): ElementData | undefined => PERIODIC_BY_SYMBOL.get(symbol);

export const listElements = (): ElementData[] => PERIODIC_TABLE;

export const getShellDistribution = (atomicNumber: number): number[] => {
  let remaining = atomicNumber;
  const distribution: number[] = [];

  for (const cap of SHELL_CAPACITY) {
    if (remaining <= 0) {
      break;
    }
    const fill = Math.min(cap, remaining);
    distribution.push(fill);
    remaining -= fill;
  }

  return distribution;
};

export const getValenceElectrons = (element: ElementData): number => {
  if (typeof element.commonValenceElectrons === "number") {
    return element.commonValenceElectrons;
  }

  if (element.group >= 1 && element.group <= 2) {
    return element.group;
  }

  if (element.group >= 13 && element.group <= 18) {
    return element.group - 10;
  }

  const shells = getShellDistribution(element.atomicNumber);
  return shells[shells.length - 1] ?? 0;
};

export const getLikelyIonicCharge = (element: ElementData): number => {
  return IONIC_CHARGES[element.group] ?? 0;
};

const isMetal = (element: ElementData): boolean => element.category === "metal";
const isNonMetalLike = (element: ElementData): boolean => element.category === "nonmetal" || element.category === "noble-gas";

const toSubscript = (value: number): string => (value === 1 ? "" : String(value));

const parseFormulaCounts = (formula: string): Record<string, number> => {
  const matches = [...formula.matchAll(/([A-Z][a-z]?)(\d*)/g)];
  const counts: Record<string, number> = {};

  for (const [, symbol, rawCount] of matches) {
    const amount = rawCount ? Number(rawCount) : 1;
    counts[symbol] = (counts[symbol] ?? 0) + amount;
  }

  return counts;
};

const formatTerm = (term: ParsedTerm): string => `${term.coefficient === 1 ? "" : term.coefficient}${term.formula}`;

const formatEquation = (reactants: ParsedTerm[], products: ParsedTerm[]): string => {
  return `${reactants.map(formatTerm).join(" + ")} -> ${products.map(formatTerm).join(" + ")}`;
};

const standardElementFormula = (symbol: string): string => (DIATOMIC_ELEMENTS.has(symbol) ? `${symbol}2` : symbol);

const ionicFormula = (metal: ElementData, nonmetal: ElementData): { formula: string; cationCount: number; anionCount: number } => {
  const metalCharge = getLikelyIonicCharge(metal);
  const nonmetalCharge = Math.abs(getLikelyIonicCharge(nonmetal));

  if (metalCharge <= 0 || nonmetalCharge <= 0) {
    return { formula: `${metal.symbol}${nonmetal.symbol}`, cationCount: 1, anionCount: 1 };
  }

  const chargeLcm = lcm(metalCharge, nonmetalCharge);
  const cationCount = chargeLcm / metalCharge;
  const anionCount = chargeLcm / nonmetalCharge;

  return {
    formula: `${metal.symbol}${toSubscript(cationCount)}${nonmetal.symbol}${toSubscript(anionCount)}`,
    cationCount,
    anionCount
  };
};

const preferredCovalentOrder = (a: ElementData, b: ElementData): [ElementData, ElementData] => {
  const pair = new Set([a.symbol, b.symbol]);
  if (pair.has("O") && pair.has("H")) {
    return [getElement("H") as ElementData, getElement("O") as ElementData];
  }
  if (pair.has("H") && (pair.has("F") || pair.has("Cl") || pair.has("Br") || pair.has("I"))) {
    const h = getElement("H") as ElementData;
    const halogen = a.symbol === "H" ? b : a;
    return [h, halogen];
  }
  if (pair.has("N") && pair.has("H")) {
    const n = getElement("N") as ElementData;
    const h = getElement("H") as ElementData;
    return [n, h];
  }

  if ((a.electronegativity ?? 0) < (b.electronegativity ?? 0)) {
    return [a, b];
  }

  if ((a.electronegativity ?? 0) > (b.electronegativity ?? 0)) {
    return [b, a];
  }

  return a.symbol < b.symbol ? [a, b] : [b, a];
};

const covalentFormula = (first: ElementData, second: ElementData): { formula: string; firstCount: number; secondCount: number } => {
  const aVal = COVALENT_VALENCE[first.symbol] ?? Math.max(1, 8 - getValenceElectrons(first));
  const bVal = COVALENT_VALENCE[second.symbol] ?? Math.max(1, 8 - getValenceElectrons(second));

  if (first.symbol === second.symbol) {
    if (DIATOMIC_ELEMENTS.has(first.symbol)) {
      return { formula: `${first.symbol}2`, firstCount: 2, secondCount: 0 };
    }
    return { formula: first.symbol, firstCount: 1, secondCount: 0 };
  }

  const divisor = gcd(aVal, bVal);
  const firstCount = bVal / divisor;
  const secondCount = aVal / divisor;

  return {
    formula: `${first.symbol}${toSubscript(firstCount)}${second.symbol}${toSubscript(secondCount)}`,
    firstCount,
    secondCount
  };
};

const balanceFromElements = (
  a: ElementData,
  b: ElementData,
  productFormula: string
): { reactants: ParsedTerm[]; products: ParsedTerm[]; balancedEquation: string } => {
  const counts = parseFormulaCounts(productFormula);
  const aInProduct = counts[a.symbol] ?? 0;
  const bInProduct = counts[b.symbol] ?? 0;
  const aUnit = DIATOMIC_ELEMENTS.has(a.symbol) ? 2 : 1;
  const bUnit = DIATOMIC_ELEMENTS.has(b.symbol) ? 2 : 1;

  for (let productCoef = 1; productCoef <= 12; productCoef += 1) {
    const aAtoms = productCoef * aInProduct;
    const bAtoms = productCoef * bInProduct;

    if (aAtoms % aUnit !== 0 || bAtoms % bUnit !== 0) {
      continue;
    }

    const reactants = [
      { coefficient: aAtoms / aUnit, formula: standardElementFormula(a.symbol) },
      { coefficient: bAtoms / bUnit, formula: standardElementFormula(b.symbol) }
    ];
    const products = [{ coefficient: productCoef, formula: productFormula }];

    return { reactants, products, balancedEquation: formatEquation(reactants, products) };
  }

  const fallbackReactants = [
    { coefficient: 1, formula: standardElementFormula(a.symbol) },
    { coefficient: 1, formula: standardElementFormula(b.symbol) }
  ];
  const fallbackProducts = [{ coefficient: 1, formula: productFormula }];
  return {
    reactants: fallbackReactants,
    products: fallbackProducts,
    balancedEquation: formatEquation(fallbackReactants, fallbackProducts)
  };
};

const predictMetalWaterReaction = (metal: ElementData): PredictionResult | undefined => {
  if (!isMetal(metal) || ![1, 2].includes(metal.group)) {
    return undefined;
  }

  if (metal.group === 1) {
    const reactants = [
      { coefficient: 2, formula: metal.symbol },
      { coefficient: 2, formula: "H2O" }
    ];
    const products = [
      { coefficient: 2, formula: `${metal.symbol}OH` },
      { coefficient: 1, formula: "H2" }
    ];

    return {
      bondType: "metal-water",
      reactants,
      products,
      balancedEquation: formatEquation(reactants, products),
      predictedIons: [`${metal.symbol}${formatPositiveCharge(1)}`, `OH${formatNegativeCharge(1)}`],
      explanation: [
        `${metal.symbol} is a Group 1 metal and typically forms +1 ions.`,
        "In water, Group 1 metals form metal hydroxide and hydrogen gas.",
        "Stoichiometry follows 2M + 2H2O -> 2MOH + H2."
      ],
      notes: ["Pattern rule (v2): applies to common active metals in Group 1."]
    };
  }

  const reactants = [
    { coefficient: 1, formula: metal.symbol },
    { coefficient: 2, formula: "H2O" }
  ];
  const products = [
    { coefficient: 1, formula: `${metal.symbol}(OH)2` },
    { coefficient: 1, formula: "H2" }
  ];

  return {
    bondType: "metal-water",
    reactants,
    products,
    balancedEquation: formatEquation(reactants, products),
    predictedIons: [`${metal.symbol}${formatPositiveCharge(2)}`, `OH${formatNegativeCharge(1)}`],
    explanation: [
      `${metal.symbol} is a Group 2 metal and typically forms +2 ions.`,
      "In water, Group 2 metals form metal hydroxide and hydrogen gas.",
      "Stoichiometry follows M + 2H2O -> M(OH)2 + H2."
    ],
    notes: ["Pattern rule (v2): common Group 2 behavior."]
  };
};

const explainIonic = (
  metal: ElementData,
  nonmetal: ElementData,
  cationCount: number,
  anionCount: number,
  formula: string
): string[] => {
  const metalCharge = getLikelyIonicCharge(metal);
  const nonmetalCharge = Math.abs(getLikelyIonicCharge(nonmetal));

  return [
    `${metal.symbol} (Group ${metal.group}) loses ${metalCharge} electron(s) and becomes ${metal.symbol}${metalCharge}+.`,
    `${nonmetal.symbol} (Group ${nonmetal.group}) gains ${nonmetalCharge} electron(s) and becomes ${nonmetal.symbol}${nonmetalCharge}-.`,
    `The ratio ${cationCount}:${anionCount} balances total positive and negative charge to zero, forming ${formula}.`,
    "This supports stable outer-shell configurations (octet in most main-group cases)."
  ];
};

const explainCovalent = (first: ElementData, second: ElementData, formula: string): string[] => {
  const aValence = COVALENT_VALENCE[first.symbol] ?? Math.max(1, 8 - getValenceElectrons(first));
  const bValence = COVALENT_VALENCE[second.symbol] ?? Math.max(1, 8 - getValenceElectrons(second));

  return [
    `${first.symbol} tends to make ${aValence} covalent bond(s), and ${second.symbol} tends to make ${bValence}.`,
    "Atoms share electron pairs so each atom moves toward a filled valence shell.",
    `${formula} uses the smallest whole-number ratio that satisfies those bonding needs.`
  ];
};

export const predictFromElements = (firstSymbol: string, secondSymbol: string): PredictionResult => {
  const first = getElement(firstSymbol);
  const second = getElement(secondSymbol);

  if (!first || !second) {
    return {
      bondType: "unsupported",
      reactants: [],
      products: [],
      balancedEquation: "Unsupported input",
      predictedIons: [],
      explanation: ["One or both elements are not in the main-group dataset."],
      notes: []
    };
  }

  const bothMainGroup = [1, 2, 13, 14, 15, 16, 17, 18].includes(first.group) && [1, 2, 13, 14, 15, 16, 17, 18].includes(second.group);
  if (!bothMainGroup) {
    return {
      bondType: "unsupported",
      reactants: [],
      products: [],
      balancedEquation: "Unsupported input",
      predictedIons: [],
      explanation: ["MVP supports only main-group elements (1-2, 13-18)."],
      notes: ["Transition metals and polyatomic-ion chemistry are intentionally excluded."]
    };
  }

  const ionicCandidate = isMetal(first) !== isMetal(second);

  if (ionicCandidate && !(isNonMetalLike(first) && first.group === 18) && !(isNonMetalLike(second) && second.group === 18)) {
    const metal = isMetal(first) ? first : second;
    const nonmetal = metal === first ? second : first;
    const ionic = ionicFormula(metal, nonmetal);
    const balanced = balanceFromElements(metal, nonmetal, ionic.formula);

    return {
      bondType: "ionic",
      reactants: balanced.reactants,
      products: balanced.products,
      balancedEquation: balanced.balancedEquation,
      predictedIons: [
        `${metal.symbol}${formatPositiveCharge(getLikelyIonicCharge(metal))}`,
        `${nonmetal.symbol}${formatNegativeCharge(Math.abs(getLikelyIonicCharge(nonmetal)))}`
      ],
      explanation: explainIonic(metal, nonmetal, ionic.cationCount, ionic.anionCount, ionic.formula),
      notes: ["Ionic model assumes common fixed charges by main-group number."]
    };
  }

  if (first.group === 18 || second.group === 18) {
    return {
      bondType: "unsupported",
      reactants: [{ coefficient: 1, formula: first.symbol }, { coefficient: 1, formula: second.symbol }],
      products: [],
      balancedEquation: "No reaction predicted",
      predictedIons: [],
      explanation: ["Noble gases are usually inert under standard classroom conditions."],
      notes: []
    };
  }

  const [orderedA, orderedB] = preferredCovalentOrder(first, second);
  const covalent = covalentFormula(orderedA, orderedB);
  const balanced = balanceFromElements(orderedA, orderedB, covalent.formula);

  return {
    bondType: "covalent",
    reactants: balanced.reactants,
    products: balanced.products,
    balancedEquation: balanced.balancedEquation,
    predictedIons: [],
    explanation: explainCovalent(orderedA, orderedB, covalent.formula),
    notes: ["Covalent prediction uses common valence patterns for simple molecules."]
  };
};

const parseTerm = (raw: string): ParsedTerm | null => {
  const cleaned = raw.trim();
  if (!cleaned) {
    return null;
  }

  const match = cleaned.match(/^(\d+)?\s*([A-Za-z0-9()]+)$/);
  if (!match) {
    return null;
  }

  return {
    coefficient: match[1] ? Number(match[1]) : 1,
    formula: match[2]
  };
};

export const parseReactantsInput = (input: string): ParsedTerm[] => {
  const leftSide = input.split("->")[0]?.trim() ?? input.trim();
  return leftSide
    .split("+")
    .map(parseTerm)
    .filter((term): term is ParsedTerm => term !== null);
};

const symbolFromFormula = (formula: string): string | undefined => {
  const elementalMatch = formula.match(/^([A-Z][a-z]?)(\d*)$/);
  if (!elementalMatch) {
    return undefined;
  }

  const [, symbol, count] = elementalMatch;
  if (!count || count === "1" || count === "2") {
    return symbol;
  }

  return undefined;
};

const sortedElementSymbolsFromTerms = (terms: ParsedTerm[]): string[] => {
  const symbols = terms
    .map((t) => symbolFromFormula(t.formula))
    .filter((s): s is string => Boolean(s));

  return [...new Set(symbols)];
};

export const predictFromInput = (input: string): PredictionResult => {
  const terms = parseReactantsInput(input);

  if (terms.length === 2) {
    const waterTerm = terms.find((t) => t.formula === "H2O");
    const otherTerm = terms.find((t) => t.formula !== "H2O");

    if (waterTerm && otherTerm) {
      const maybeMetal = getElement(otherTerm.formula);
      if (maybeMetal) {
        const waterResult = predictMetalWaterReaction(maybeMetal);
        if (waterResult) {
          return waterResult;
        }
      }
    }
  }

  const symbols = sortedElementSymbolsFromTerms(terms);
  if (symbols.length >= 2) {
    return predictFromElements(symbols[0], symbols[1]);
  }

  return {
    bondType: "unsupported",
    reactants: terms,
    products: [],
    balancedEquation: "Unsupported input",
    predictedIons: [],
    explanation: ["Use two elemental reactants (e.g., Na + Cl2) or supported water patterns (e.g., K + H2O)."],
    notes: ["Equation parser is intentionally simple in MVP."]
  };
};

export const buildFlashcards = (prediction: PredictionResult): Flashcard[] => {
  const productSummary = prediction.products.length > 0 ? prediction.products.map(formatTerm).join(" + ") : "No product predicted";

  return [
    {
      question: "What bond type is predicted?",
      answer: prediction.bondType
    },
    {
      question: "What is the balanced equation?",
      answer: prediction.balancedEquation
    },
    {
      question: "What product(s) form?",
      answer: productSummary
    },
    {
      question: "Why this formula ratio?",
      answer: prediction.explanation.join(" ")
    }
  ];
};

export const buildQuiz = (prediction: PredictionResult): QuizQuestion[] => {
  const productFormula = prediction.products[0]?.formula ?? "none";

  const mcq: QuizQuestion[] = [
    {
      type: "mcq",
      prompt: "What is the predicted bond type?",
      options: [prediction.bondType, "metallic", "hydrogen-bond only", "no interaction"],
      answer: prediction.bondType
    },
    {
      type: "mcq",
      prompt: "Which statement best explains the product ratio?",
      options: [
        "Charge or valence balance requires the smallest whole-number ratio",
        "Products always copy reactant coefficients",
        "All atoms must have exactly 8 total electrons",
        "The larger atom gets more subscript"
      ],
      answer: "Charge or valence balance requires the smallest whole-number ratio"
    },
    {
      type: "mcq",
      prompt: "Which is the main product formula?",
      options: [productFormula, "AB", "A2B2", "A3B"],
      answer: productFormula
    },
    {
      type: "mcq",
      prompt: "For ionic bonding, electrons are typically...",
      options: ["transferred", "equally shared", "destroyed", "not involved"],
      answer: "transferred"
    },
    {
      type: "mcq",
      prompt: "For covalent bonding, electrons are typically...",
      options: ["shared", "fully transferred", "removed by catalyst", "in atomic nucleus"],
      answer: "shared"
    },
    {
      type: "mcq",
      prompt: "Why do atoms form bonds in these models?",
      options: [
        "To reach more stable outer-shell electron arrangements",
        "To increase atomic number",
        "To become noble gases",
        "To remove protons"
      ],
      answer: "To reach more stable outer-shell electron arrangements"
    }
  ];

  const shortAnswer: QuizQuestion[] = [
    {
      type: "short",
      prompt: "Write the balanced equation for this reaction.",
      answer: prediction.balancedEquation
    },
    {
      type: "short",
      prompt: "Explain why this product ratio forms using charge or valence logic.",
      answer: prediction.explanation.join(" ")
    },
    {
      type: "short",
      prompt: "Describe what happens to valence electrons during this reaction.",
      answer:
        prediction.bondType === "ionic"
          ? "Valence electron(s) move from the metal to the nonmetal to make ions."
          : "Atoms share valence electron pairs to fill outer shells."
    }
  ];

  return [...mcq, ...shortAnswer];
};

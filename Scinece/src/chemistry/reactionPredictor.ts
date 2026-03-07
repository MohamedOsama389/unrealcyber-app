import { canDisplaceHalogen, canDisplaceMetal, canMetalDisplaceHydrogen } from "./activitySeries";
import { balanceEquationTerms } from "./balanceEquation";
import { buildIonicFormula, ionCharge, isAcid, isBase, isElemental, normalizeDiatomicElement, splitIonicCompound } from "./compoundUtils";
import { formatEquation, parseEquationInput } from "./equationParser";
import { analyzeRedox } from "./redoxAgents";
import { predictSolubility } from "./solubility";
import type { EquationTerm, ReactionConditions, ReactionPrediction } from "./types";
import { getElement, getLikelyIonicCharge } from "../engine/chemistry";

const withFormula = (formula: string, state?: string): EquationTerm => ({ coefficient: 1, formula, state });
const symbolFromElemental = (formula: string): string | undefined => formula.match(/^([A-Z][a-z]?)/)?.[1];
const isHalogenDiatomic = (formula: string): boolean => ["F2", "Cl2", "Br2", "I2"].includes(formula);
const halogenSymbol = (diatomic: string): string => diatomic.replace("2", "");

const classifyGasPatterns = (r1: string, r2: string): { products: EquationTerm[]; reason: string } | undefined => {
  const i1 = splitIonicCompound(r1);
  const i2 = splitIonicCompound(r2);

  const acid = isAcid(r1) ? { acid: r1, other: r2, ionOther: i2, acidIons: i1 } : isAcid(r2) ? { acid: r2, other: r1, ionOther: i1, acidIons: i2 } : undefined;

  if (!acid || !acid.ionOther || !acid.acidIons) {
    return undefined;
  }

  const baseCation = acid.ionOther.cation;
  const acidAnion = acid.acidIons.anion;
  const salt = buildIonicFormula(baseCation, acidAnion);
  const otherAnion = acid.ionOther.anion.formula;

  if (otherAnion === "CO3" || otherAnion === "HCO3") {
    return {
      products: [withFormula(salt, "aq"), withFormula("H2O", "l"), withFormula("CO2", "g")],
      reason: "Carbonate/bicarbonate + acid forms CO2 gas and water."
    };
  }

  if (otherAnion === "SO3") {
    return {
      products: [withFormula(salt, "aq"), withFormula("H2O", "l"), withFormula("SO2", "g")],
      reason: "Sulfite + acid forms SO2 gas and water."
    };
  }

  if (otherAnion === "S") {
    return {
      products: [withFormula(salt, "aq"), withFormula("H2S", "g")],
      reason: "Sulfide + acid forms H2S gas."
    };
  }

  return undefined;
};

const classifyAmmoniumBaseGas = (r1: string, r2: string): { products: EquationTerm[]; reason: string } | undefined => {
  const i1 = splitIonicCompound(r1);
  const i2 = splitIonicCompound(r2);
  if (!i1 || !i2) {
    return undefined;
  }

  const pattern = i1.cation.formula === "NH4" && i2.anion.formula === "OH" ? { ammonium: i1, base: i2 } : i2.cation.formula === "NH4" && i1.anion.formula === "OH" ? { ammonium: i2, base: i1 } : undefined;

  if (!pattern) {
    return undefined;
  }

  const salt = buildIonicFormula(pattern.base.cation, pattern.ammonium.anion);
  return {
    products: [withFormula(salt, "aq"), withFormula("NH3", "g"), withFormula("H2O", "l")],
    reason: "Ammonium salt + strong base forms NH3 gas and water."
  };
};

const predictElementCombination = (reactants: EquationTerm[]): ReactionPrediction | undefined => {
  if (reactants.length !== 2) {
    return undefined;
  }

  const [a, b] = reactants;
  if (!isElemental(a.formula) || !isElemental(b.formula)) {
    return undefined;
  }

  const symbolA = symbolFromElemental(a.formula);
  const symbolB = symbolFromElemental(b.formula);
  if (!symbolA || !symbolB) {
    return undefined;
  }

  const elementA = getElement(symbolA);
  const elementB = getElement(symbolB);
  if (!elementA || !elementB) {
    return undefined;
  }

  if (elementA.category === "noble-gas" || elementB.category === "noble-gas") {
    return {
      input: "",
      reactionType: "no_reaction",
      occurred: false,
      reactants,
      products: [],
      balancedEquation: "No reaction",
      molecularEquation: "No reaction",
      reason: ["Noble gases are usually inert under normal classroom conditions."],
      drivingForce: [],
      redox: { isRedox: false, changes: [], explanation: ["No reaction predicted."] },
      visualizationHint: "none",
      patternMatched: "element + element inert case"
    };
  }

  const aIsMetal = elementA.category === "metal";
  const bIsMetal = elementB.category === "metal";

  if (aIsMetal !== bIsMetal) {
    const cation = aIsMetal ? elementA : elementB;
    const anion = aIsMetal ? elementB : elementA;
    const cationCharge = getLikelyIonicCharge(cation);
    const anionCharge = getLikelyIonicCharge(anion);
    if (cationCharge <= 0 || anionCharge >= 0) {
      return undefined;
    }

    const formula = buildIonicFormula(
      { formula: cation.symbol, charge: cationCharge, type: "cation" },
      { formula: anion.symbol, charge: anionCharge, type: "anion" }
    );
    const products = [withFormula(formula)];
    const normalizedReactants = [
      { ...a },
      { ...b }
    ];
    const balanced = balanceEquationTerms(normalizedReactants, products);
    const redox = analyzeRedox(balanced.reactants, balanced.products);

    return {
      input: "",
      reactionType: "synthesis",
      occurred: true,
      reactants: balanced.reactants,
      products: balanced.products,
      balancedEquation: formatEquation(balanced.reactants, balanced.products),
      molecularEquation: formatEquation(normalizedReactants, products),
      reason: [
        `${cation.symbol} (metal) transfers valence electron(s) to ${anion.symbol} (nonmetal).`,
        "Ionic charges balance to make a neutral formula."
      ],
      drivingForce: ["Electron transfer", "Stable outer-shell arrangement"],
      redox,
      visualizationHint: "electron_transfer",
      patternMatched: "element + element ionic synthesis"
    };
  }

  const simpleValence: Record<string, number> = { H: 1, O: 2, N: 3, C: 4, F: 1, Cl: 1, Br: 1, I: 1, S: 2, P: 3 };
  const vA = simpleValence[symbolA];
  const vB = simpleValence[symbolB];
  if (!vA || !vB) {
    return undefined;
  }

  const gcd = (x: number, y: number): number => {
    let aVal = Math.abs(x);
    let bVal = Math.abs(y);
    while (bVal !== 0) {
      const t = bVal;
      bVal = aVal % bVal;
      aVal = t;
    }
    return aVal || 1;
  };
  const divisor = gcd(vA, vB);
  const aCount = vB / divisor;
  const bCount = vA / divisor;
  const productFormula = `${symbolA}${aCount === 1 ? "" : aCount}${symbolB}${bCount === 1 ? "" : bCount}`;
  const products = [withFormula(productFormula)];
    const normalizedReactants = [
      { ...a },
      { ...b }
    ];
  const balanced = balanceEquationTerms(normalizedReactants, products);
  const redox = analyzeRedox(balanced.reactants, balanced.products);

  return {
    input: "",
    reactionType: "synthesis",
    occurred: true,
    reactants: balanced.reactants,
    products: balanced.products,
    balancedEquation: formatEquation(balanced.reactants, balanced.products),
    molecularEquation: formatEquation(normalizedReactants, products),
    reason: [
      `${symbolA} and ${symbolB} are treated as a simple covalent combination in MVP rules.`,
      "Product ratio uses common classroom valence values."
    ],
    drivingForce: ["Shared electron pairs"],
    redox,
    visualizationHint: "electron_transfer",
    patternMatched: "element + element covalent synthesis"
  };
};

const predictSingle = (reactants: EquationTerm[]): ReactionPrediction | undefined => {
  if (reactants.length !== 2) {
    return undefined;
  }

  const [a, b] = reactants;
  const elementalA = isElemental(a.formula);
  const elementalB = isElemental(b.formula);

  const elementFirst = elementalA ? a : elementalB ? b : undefined;
  const compoundSecond = elementalA ? b : elementalB ? a : undefined;

  if (!elementFirst || !compoundSecond) {
    return undefined;
  }

  const incomingSymbol = symbolFromElemental(elementFirst.formula);
  if (!incomingSymbol) {
    return undefined;
  }

  if (isAcid(compoundSecond.formula)) {
    const compare = canMetalDisplaceHydrogen(incomingSymbol);
    const acidIons = splitIonicCompound(compoundSecond.formula);
    if (!acidIons) {
      return undefined;
    }
    if (!compare.canDisplace) {
      return {
        input: "",
        reactionType: "no_reaction",
        occurred: false,
        reactants,
        products: [],
        balancedEquation: "No reaction",
        molecularEquation: "No reaction",
        reason: [compare.reason, "Metal cannot reduce H+ under this activity-series rule."],
        drivingForce: [],
        redox: { isRedox: false, changes: [], explanation: ["No reaction, so no redox change."] },
        visualizationHint: "none"
      };
    }

    const incomingCharge = ionCharge(incomingSymbol);
    if (!incomingCharge) {
      return undefined;
    }

    const salt = buildIonicFormula({ formula: incomingSymbol, charge: incomingCharge, type: "cation" }, acidIons.anion);
    const products = [withFormula(salt, "aq"), withFormula("H2", "g")];
    const balanced = balanceEquationTerms(reactants, products);
    const redox = analyzeRedox(balanced.reactants, balanced.products);

    return {
      input: "",
      reactionType: "single_substitution",
      occurred: true,
      reactants: balanced.reactants,
      products: balanced.products,
      balancedEquation: formatEquation(balanced.reactants, balanced.products),
      molecularEquation: formatEquation(reactants, products),
      reason: [compare.reason, "Metal displaces hydrogen from acid to form salt + H2."],
      drivingForce: ["Hydrogen gas evolution", "Redox electron transfer"],
      redox,
      visualizationHint: "electron_transfer",
      patternMatched: "metal + acid -> salt + H2"
    };
  }

  if (compoundSecond.formula === "H2O") {
    const charge = ionCharge(incomingSymbol);
    const group1 = ["Li", "Na", "K", "Rb", "Cs"].includes(incomingSymbol);
    const group2 = ["Ca", "Sr", "Ba", "Mg"].includes(incomingSymbol);
    if (!group1 && !group2) {
      const compareWithHydrogen = canMetalDisplaceHydrogen(incomingSymbol);
      return {
        input: "",
        reactionType: "no_reaction",
        occurred: false,
        reactants,
        products: [],
        balancedEquation: "No reaction",
        molecularEquation: "No reaction",
        reason: [
          `${incomingSymbol} does not react with water under normal high-school conditions.`,
          compareWithHydrogen.reason
        ],
        drivingForce: [],
        redox: { isRedox: false, changes: [], explanation: ["No reaction predicted in MVP pattern rules."] },
        visualizationHint: "none",
        patternMatched: "metal + water check"
      };
    }

    if (!charge) {
      return undefined;
    }

    const hydroxide = buildIonicFormula({ formula: incomingSymbol, charge, type: "cation" }, { formula: "OH", charge: -1, type: "anion" });
    const products = [withFormula(hydroxide, "aq"), withFormula("H2", "g")];
    const balanced = balanceEquationTerms(reactants, products);
    const redox = analyzeRedox(balanced.reactants, balanced.products);
    return {
      input: "",
      reactionType: "metal_water",
      occurred: true,
      reactants: balanced.reactants,
      products: balanced.products,
      balancedEquation: formatEquation(balanced.reactants, balanced.products),
      molecularEquation: formatEquation(reactants, products),
      reason: [`${incomingSymbol} follows active-metal + water displacement pattern.`],
      drivingForce: ["Hydrogen gas evolution", "Redox electron transfer"],
      redox,
      visualizationHint: "electron_transfer",
      patternMatched: "metal + water -> hydroxide + H2"
    };
  }

  if (isHalogenDiatomic(elementFirst.formula)) {
    const ionic = splitIonicCompound(compoundSecond.formula);
    if (!ionic || !["F", "Cl", "Br", "I"].includes(ionic.anion.formula)) {
      return undefined;
    }
    const compare = canDisplaceHalogen(elementFirst.formula, ionic.anion.formula);
    if (!compare.canDisplace) {
      return {
        input: "",
        reactionType: "no_reaction",
        occurred: false,
        reactants,
        products: [],
        balancedEquation: "No reaction",
        molecularEquation: "No reaction",
        reason: [compare.reason],
        drivingForce: [],
        redox: { isRedox: false, changes: [], explanation: ["No displacement, so no redox reaction."] },
        visualizationHint: "none"
      };
    }

    const incomingHalide = halogenSymbol(elementFirst.formula);
    const newSalt = buildIonicFormula(ionic.cation, { formula: incomingHalide, charge: -1, type: "anion" });
    const displaced = normalizeDiatomicElement(ionic.anion.formula);
    const products = [withFormula(newSalt, "aq"), withFormula(displaced)];
    const balanced = balanceEquationTerms(reactants, products);
    const redox = analyzeRedox(balanced.reactants, balanced.products);

    return {
      input: "",
      reactionType: "single_substitution",
      occurred: true,
      reactants: balanced.reactants,
      products: balanced.products,
      balancedEquation: formatEquation(balanced.reactants, balanced.products),
      molecularEquation: formatEquation(reactants, products),
      reason: [compare.reason, "More reactive halogen displaces less reactive halide."],
      drivingForce: ["Halogen reactivity series", "Redox electron transfer"],
      redox,
      visualizationHint: "electron_transfer",
      patternMatched: "halogen displacement"
    };
  }

  const targetIonic = splitIonicCompound(compoundSecond.formula);
  if (targetIonic) {
    const compare = canDisplaceMetal(incomingSymbol, targetIonic.cation.formula);
    if (!compare.canDisplace) {
      const noReactionReason = `No reaction: ${incomingSymbol} is less reactive than ${targetIonic.cation.formula}, so it cannot replace it.`;
      return {
        input: "",
        reactionType: "no_reaction",
        occurred: false,
        reactants,
        products: [],
        balancedEquation: "No reaction",
        molecularEquation: "No reaction",
        reason: [noReactionReason, compare.reason],
        drivingForce: [],
        redox: { isRedox: false, changes: [], explanation: ["No displacement, so no redox reaction."] },
        visualizationHint: "none"
      };
    }

    const incomingCharge = ionCharge(incomingSymbol);
    if (!incomingCharge) {
      return undefined;
    }

    const newSalt = buildIonicFormula({ formula: incomingSymbol, charge: incomingCharge, type: "cation" }, targetIonic.anion);
    const products = [withFormula(newSalt, "aq"), withFormula(targetIonic.cation.formula, "s")];
    const balanced = balanceEquationTerms(reactants, products);
    const redox = analyzeRedox(balanced.reactants, balanced.products);

    return {
      input: "",
      reactionType: "single_substitution",
      occurred: true,
      reactants: balanced.reactants,
      products: balanced.products,
      balancedEquation: formatEquation(balanced.reactants, balanced.products),
      molecularEquation: formatEquation(reactants, products),
      reason: [compare.reason, `${incomingSymbol} displaces ${targetIonic.cation.formula} from solution.`],
      drivingForce: ["Activity series", "Redox electron transfer"],
      redox,
      visualizationHint: "electron_transfer",
      patternMatched: "metal + salt displacement"
    };
  }

  return undefined;
};

const predictDouble = (reactants: EquationTerm[]): ReactionPrediction | undefined => {
  if (reactants.length !== 2) {
    return undefined;
  }
  const [a, b] = reactants;

  const neutralization = (isAcid(a.formula) && isBase(b.formula)) || (isAcid(b.formula) && isBase(a.formula));
  if (neutralization) {
    const acid = isAcid(a.formula) ? splitIonicCompound(a.formula) : splitIonicCompound(b.formula);
    const base = isBase(a.formula) ? splitIonicCompound(a.formula) : splitIonicCompound(b.formula);
    if (!acid || !base) {
      return undefined;
    }
    const salt = buildIonicFormula(base.cation, acid.anion);
    const products = [withFormula(salt, "aq"), withFormula("H2O", "l")];
    const balanced = balanceEquationTerms(reactants, products);
    return {
      input: "",
      reactionType: "acid_base_neutralization",
      occurred: true,
      reactants: balanced.reactants,
      products: balanced.products,
      balancedEquation: formatEquation(balanced.reactants, balanced.products),
      molecularEquation: formatEquation(reactants, products),
      netIonicEquation: "H+ + OH- -> H2O",
      reason: ["Acid-base neutralization forms water."],
      drivingForce: ["Water formation"],
      redox: analyzeRedox(balanced.reactants, balanced.products),
      visualizationHint: "neutralization",
      patternMatched: "acid + base neutralization"
    };
  }

  const gasPattern = classifyGasPatterns(a.formula, b.formula) ?? classifyAmmoniumBaseGas(a.formula, b.formula);
  if (gasPattern) {
    const balanced = balanceEquationTerms(reactants, gasPattern.products);
    return {
      input: "",
      reactionType: "double_substitution",
      occurred: true,
      reactants: balanced.reactants,
      products: balanced.products,
      balancedEquation: formatEquation(balanced.reactants, balanced.products),
      molecularEquation: formatEquation(reactants, gasPattern.products),
      reason: [gasPattern.reason],
      drivingForce: ["Gas formation"],
      redox: analyzeRedox(balanced.reactants, balanced.products),
      visualizationHint: "precipitation",
      patternMatched: "double substitution with gas evolution"
    };
  }

  const ionicA = splitIonicCompound(a.formula);
  const ionicB = splitIonicCompound(b.formula);
  if (!ionicA || !ionicB) {
    return undefined;
  }

  const product1 = buildIonicFormula(ionicA.cation, ionicB.anion);
  const product2 = buildIonicFormula(ionicB.cation, ionicA.anion);

  const sol1 = predictSolubility(product1);
  const sol2 = predictSolubility(product2);

  if (sol1.soluble && sol2.soluble) {
    return {
      input: "",
      reactionType: "no_reaction",
      occurred: false,
      reactants,
      products: [],
      balancedEquation: "No reaction",
      molecularEquation: "No reaction",
      reason: ["Ion exchange gives only soluble products, so no driving force."],
      drivingForce: [],
      redox: { isRedox: false, changes: [], explanation: ["No reaction predicted."] },
      visualizationHint: "none"
    };
  }

  const products = [withFormula(product1, sol1.soluble ? "aq" : "s"), withFormula(product2, sol2.soluble ? "aq" : "s")];
  const balanced = balanceEquationTerms(reactants, products);

  const netIonic = !sol1.soluble
    ? `${splitIonicCompound(product1)?.cation.formula}+ + ${splitIonicCompound(product1)?.anion.formula}- -> ${product1}(s)`
    : !sol2.soluble
      ? `${splitIonicCompound(product2)?.cation.formula}+ + ${splitIonicCompound(product2)?.anion.formula}- -> ${product2}(s)`
      : undefined;

  return {
    input: "",
    reactionType: "double_substitution",
    occurred: true,
    reactants: balanced.reactants,
    products: balanced.products,
    balancedEquation: formatEquation(balanced.reactants, balanced.products),
    molecularEquation: formatEquation(reactants, products),
    netIonicEquation: netIonic,
    reason: ["Double substitution swaps ions between the two compounds."],
    drivingForce: [!sol1.soluble ? `${product1} precipitates (${sol1.reason})` : "", !sol2.soluble ? `${product2} precipitates (${sol2.reason})` : ""].filter(Boolean),
    redox: analyzeRedox(balanced.reactants, balanced.products),
    visualizationHint: "precipitation",
    patternMatched: "double substitution precipitate"
  };
};

const classifyTypeFallback = (prediction: ReactionPrediction): ReactionPrediction => {
  if (prediction.reactionType !== "unsupported") {
    return prediction;
  }
  return {
    ...prediction,
    reason: [...prediction.reason, "Advanced case not supported yet in MVP."],
    visualizationHint: "none"
  };
};

export const predictReaction = (input: string, _conditions?: ReactionConditions): ReactionPrediction => {
  const parsed = parseEquationInput(input);
  if (!parsed.ok) {
    return {
      input,
      reactionType: "unsupported",
      occurred: false,
      reactants: [],
      products: [],
      balancedEquation: "Unsupported input",
      molecularEquation: "Unsupported input",
      reason: [parsed.error ?? "Could not parse equation."],
      drivingForce: [],
      redox: { isRedox: false, changes: [], explanation: ["No analyzable reaction."] },
      visualizationHint: "none",
      parserError: parsed.error
    };
  }

  const reactants = parsed.reactants.map((r) => ({ ...r }));
  const typedProducts = parsed.products.map((p) => ({ ...p }));

  if (!reactants.length) {
    return {
      input: parsed.normalized,
      reactionType: "unsupported",
      occurred: false,
      reactants: [],
      products: [],
      balancedEquation: "Unsupported input",
      molecularEquation: "Unsupported input",
      reason: ["Please provide reactants like Zn + CuSO4 -> ?"],
      drivingForce: [],
      redox: { isRedox: false, changes: [], explanation: ["No analyzable reaction."] },
      visualizationHint: "none"
    };
  }

  if (typedProducts.length) {
    const balanced = balanceEquationTerms(reactants, typedProducts);
    const redox = analyzeRedox(balanced.reactants, balanced.products);
    return {
      input: parsed.normalized,
      reactionType: "unsupported",
      occurred: true,
      reactants: balanced.reactants,
      products: balanced.products,
      balancedEquation: formatEquation(balanced.reactants, balanced.products),
      molecularEquation: formatEquation(reactants, typedProducts),
      reason: ["Using provided products and balancing them."],
      drivingForce: [],
      redox,
      visualizationHint: redox.isRedox ? "electron_transfer" : "none"
    };
  }

  const elementSynthesis = predictElementCombination(reactants);
  if (elementSynthesis) {
    return classifyTypeFallback({ ...elementSynthesis, input: parsed.normalized });
  }

  const single = predictSingle(reactants);
  if (single) {
    return classifyTypeFallback({ ...single, input: parsed.normalized });
  }

  const double = predictDouble(reactants);
  if (double) {
    return classifyTypeFallback({ ...double, input: parsed.normalized });
  }

  return {
    input: parsed.normalized,
    reactionType: "unsupported",
    occurred: false,
    reactants,
    products: [],
    balancedEquation: "Unsupported in MVP",
    molecularEquation: "Unsupported in MVP",
    reason: ["Reaction pattern not recognized by MVP predictor."],
    drivingForce: [],
    redox: { isRedox: false, changes: [], explanation: ["Could not evaluate redox for this pattern."] },
    visualizationHint: "none"
  };
};

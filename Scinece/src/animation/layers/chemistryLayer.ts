import { isElemental, parseFormula, splitIonicCompound } from "../../chemistry";
import type { EquationTerm, ReactionPrediction } from "../../chemistry";

export type ChemistrySpeciesType = "atom" | "polyatomic" | "molecule";
export type ChemistryTermKind = "elemental" | "ionic" | "molecular";

export interface ChemistrySpecies {
  id: string;
  symbol: string;
  speciesType: ChemistrySpeciesType;
  charge: number;
  count: number;
  role: "cation" | "anion" | "atom" | "molecule";
}

export interface ChemistryTermModel {
  id: string;
  side: "reactant" | "product";
  index: number;
  formula: string;
  coefficient: number;
  kind: ChemistryTermKind;
  species: ChemistrySpecies[];
}

export interface ChemistryLayerModel {
  equation: string;
  reactionType: ReactionPrediction["reactionType"];
  occurred: boolean;
  reactants: ChemistryTermModel[];
  products: ChemistryTermModel[];
}

const POLYATOMIC_IONS = new Set([
  "SO4", "OH", "NO3", "CO3", "PO4", "HCO3", "NH4", "SO3", "NO2", "CN", "ClO3", "ClO4", "C2H3O2"
]);

const isPolyatomic = (symbol: string): boolean => POLYATOMIC_IONS.has(symbol);

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const multiplicityInFormula = (formula: string, species: string): number => {
  const normalized = formula.replace(/\(aq\)|\(s\)|\(l\)|\(g\)/g, "");
  if (/^[A-Z][a-z]?$/.test(species)) {
    return parseFormula(normalized)[species] ?? 1;
  }

  const parenPattern = new RegExp(`\\(${escapeRegExp(species)}\\)(\\d+)`);
  const parenMatch = normalized.match(parenPattern);
  if (parenMatch) {
    return Number(parenMatch[1]);
  }

  const directPattern = new RegExp(`${escapeRegExp(species)}(\\d*)`);
  const directMatch = normalized.match(directPattern);
  if (!directMatch) {
    return 1;
  }
  return directMatch[1] ? Number(directMatch[1]) : 1;
};

const buildTermModel = (term: EquationTerm, side: "reactant" | "product", index: number): ChemistryTermModel => {
  const baseId = `${side}-${index}-${term.formula}`;
  const ionic = splitIonicCompound(term.formula);
  if (ionic) {
    const cationCount = multiplicityInFormula(term.formula, ionic.cation.formula) * term.coefficient;
    const anionCount = multiplicityInFormula(term.formula, ionic.anion.formula) * term.coefficient;
    return {
      id: baseId,
      side,
      index,
      formula: term.formula,
      coefficient: term.coefficient,
      kind: "ionic",
      species: [
        {
          id: `${baseId}-cation`,
          symbol: ionic.cation.formula,
          speciesType: isPolyatomic(ionic.cation.formula) ? "polyatomic" : "atom",
          charge: ionic.cation.charge,
          count: cationCount,
          role: "cation"
        },
        {
          id: `${baseId}-anion`,
          symbol: ionic.anion.formula,
          speciesType: isPolyatomic(ionic.anion.formula) ? "polyatomic" : "atom",
          charge: ionic.anion.charge,
          count: anionCount,
          role: "anion"
        }
      ]
    };
  }

  if (isElemental(term.formula)) {
    const parsed = parseFormula(term.formula);
    const entries = Object.entries(parsed);
    const symbol = entries[0]?.[0] ?? term.formula;
    const count = (entries[0]?.[1] ?? 1) * term.coefficient;
    return {
      id: baseId,
      side,
      index,
      formula: term.formula,
      coefficient: term.coefficient,
      kind: "elemental",
      species: [
        {
          id: `${baseId}-atom`,
          symbol,
          speciesType: "atom",
          charge: 0,
          count,
          role: "atom"
        }
      ]
    };
  }

  return {
    id: baseId,
    side,
    index,
    formula: term.formula,
    coefficient: term.coefficient,
    kind: "molecular",
    species: [
      {
        id: `${baseId}-molecule`,
        symbol: term.formula,
        speciesType: "molecule",
        charge: 0,
        count: term.coefficient,
        role: "molecule"
      }
    ]
  };
};

export const buildChemistryLayerModel = (prediction: ReactionPrediction): ChemistryLayerModel => ({
  equation: prediction.balancedEquation,
  reactionType: prediction.reactionType,
  occurred: prediction.occurred,
  reactants: prediction.reactants.map((term, index) => buildTermModel(term, "reactant", index)),
  products: prediction.products.map((term, index) => buildTermModel(term, "product", index))
});

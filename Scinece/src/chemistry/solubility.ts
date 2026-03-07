import rulesRaw from "./datasets/solubilityRules.json";
import { splitIonicCompound } from "./compoundUtils";

interface SolubilityRules {
  alwaysSolubleAnions: string[];
  alwaysSolubleCations: string[];
  chlorideExceptions: string[];
  sulfateExceptions: string[];
  insolubleFamilies: string[];
  insolubleFamilyExceptions: string[];
}

const rules = rulesRaw as SolubilityRules;

export const predictSolubility = (formula: string): { soluble: boolean; reason: string } => {
  const ionic = splitIonicCompound(formula);
  if (!ionic) {
    return { soluble: true, reason: "Compound treated as molecular/non-ionic in MVP." };
  }

  const { cation, anion } = ionic;

  if (rules.alwaysSolubleCations.includes(cation.formula)) {
    return { soluble: true, reason: `${cation.formula}+ salts are generally soluble.` };
  }

  if (rules.alwaysSolubleAnions.includes(anion.formula)) {
    return { soluble: true, reason: `${anion.formula}- salts are generally soluble.` };
  }

  if (anion.formula === "Cl" || anion.formula === "Br" || anion.formula === "I") {
    if (rules.chlorideExceptions.includes(cation.formula)) {
      return { soluble: false, reason: `${formula} is a halide with an exception cation (${cation.formula}).` };
    }
    return { soluble: true, reason: "Most chlorides/bromides/iodides are soluble." };
  }

  if (anion.formula === "SO4") {
    if (rules.sulfateExceptions.includes(cation.formula)) {
      return { soluble: false, reason: `${formula} is a sulfate exception (low solubility).` };
    }
    return { soluble: true, reason: "Most sulfates are soluble." };
  }

  if (rules.insolubleFamilies.includes(anion.formula)) {
    if (rules.insolubleFamilyExceptions.includes(cation.formula)) {
      return { soluble: true, reason: `${anion.formula}- is usually insoluble, but ${cation.formula}+ is an exception.` };
    }
    return { soluble: false, reason: `${anion.formula}- salts are generally insoluble.` };
  }

  return { soluble: true, reason: "No insolubility rule triggered in MVP dataset." };
};

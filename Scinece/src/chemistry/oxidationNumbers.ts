import { splitIonicCompound } from "./compoundUtils";
import { parseFormula } from "./parseFormula";
import { getElement } from "../engine/chemistry";

const anionOxidationTemplates: Record<string, Record<string, number>> = {
  Cl: { Cl: -1 },
  Br: { Br: -1 },
  I: { I: -1 },
  F: { F: -1 },
  OH: { O: -2, H: 1 },
  NO3: { N: 5, O: -2 },
  SO4: { S: 6, O: -2 },
  SO3: { S: 4, O: -2 },
  CO3: { C: 4, O: -2 },
  HCO3: { H: 1, C: 4, O: -2 },
  PO4: { P: 5, O: -2 },
  S: { S: -2 }
};

const groupOxidation = (symbol: string): number | undefined => {
  const element = getElement(symbol);
  if (!element) {
    return undefined;
  }
  if (element.group === 1) {
    return 1;
  }
  if (element.group === 2) {
    return 2;
  }
  if (element.group === 13) {
    return 3;
  }
  return undefined;
};

const isElementalForm = (formula: string): boolean => /^([A-Z][a-z]?)(\d*)$/.test(formula);

export const oxidationNumbersForFormula = (formula: string): Record<string, number> | undefined => {
  if (isElementalForm(formula)) {
    const symbol = formula.match(/^([A-Z][a-z]?)/)?.[1];
    return symbol ? { [symbol]: 0 } : undefined;
  }

  const ionic = splitIonicCompound(formula);
  if (ionic) {
    const result: Record<string, number> = {};

    if (/^[A-Z][a-z]?$/.test(ionic.cation.formula)) {
      result[ionic.cation.formula] = ionic.cation.charge;
    }

    const anionTemplate = anionOxidationTemplates[ionic.anion.formula];
    if (anionTemplate) {
      for (const [el, on] of Object.entries(anionTemplate)) {
        result[el] = on;
      }
      return result;
    }
  }

  const counts = parseFormula(formula);
  const elements = Object.keys(counts);
  if (!elements.length) {
    return undefined;
  }

  const values: Record<string, number | undefined> = {};

  for (const element of elements) {
    if (element === "F") {
      values[element] = -1;
      continue;
    }
    if (element === "O") {
      values[element] = -2;
      continue;
    }
    if (element === "H") {
      values[element] = 1;
      continue;
    }
    if (["Cl", "Br", "I"].includes(element)) {
      values[element] = -1;
      continue;
    }

    const groupValue = groupOxidation(element);
    if (groupValue !== undefined) {
      values[element] = groupValue;
    }
  }

  const unknown = elements.filter((e) => values[e] === undefined);
  if (unknown.length > 1) {
    return undefined;
  }

  const knownSum = elements.reduce((sum, el) => sum + (values[el] ?? 0) * counts[el], 0);
  if (unknown.length === 1) {
    const el = unknown[0];
    values[el] = -knownSum / counts[el];
  }

  if (unknown.length === 0 && knownSum !== 0) {
    return undefined;
  }

  const out: Record<string, number> = {};
  for (const element of elements) {
    if (values[element] === undefined) {
      return undefined;
    }
    out[element] = values[element] as number;
  }
  return out;
};

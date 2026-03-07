import polyatomicRaw from "./datasets/polyatomicIons.json";
import { getElement } from "../engine/chemistry";

export interface IonInfo {
  formula: string;
  charge: number;
  type: "cation" | "anion";
  name?: string;
}

interface PolyIon {
  name: string;
  formula: string;
  charge: number;
  type: "cation" | "anion";
}

const polyatomic = polyatomicRaw as PolyIon[];
const polyAnions = polyatomic.filter((i) => i.type === "anion");

const fixedCharges: Record<string, number> = {
  Li: 1,
  Na: 1,
  K: 1,
  Rb: 1,
  Cs: 1,
  Mg: 2,
  Ca: 2,
  Sr: 2,
  Ba: 2,
  Al: 3,
  Zn: 2,
  Fe: 2,
  Cu: 2,
  Ag: 1,
  Pb: 2,
  Sn: 2,
  Hg: 2,
  H: 1,
  Cl: -1,
  Br: -1,
  I: -1,
  F: -1,
  O: -2,
  S: -2,
  N: -3,
  P: -3
};

const monatomic = /^[A-Z][a-z]?$/;
const needParens = (formula: string): boolean => !monatomic.test(formula);

const gcd = (a: number, b: number): number => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
};

export const ionCharge = (symbol: string): number | undefined => {
  const poly = polyatomic.find((i) => i.formula === symbol);
  if (poly) {
    return poly.charge;
  }
  if (fixedCharges[symbol] !== undefined) {
    return fixedCharges[symbol];
  }
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
  if (element.group === 17) {
    return -1;
  }
  if (element.group === 16) {
    return -2;
  }
  return undefined;
};

const removeOuterParens = (raw: string): string => {
  if (raw.startsWith("(") && raw.endsWith(")")) {
    return raw.slice(1, -1);
  }
  return raw;
};

const parseCountedIon = (raw: string): { formula: string; count: number } => {
  const parenMatch = raw.match(/^\(([^)]+)\)(\d+)$/);
  if (parenMatch) {
    return { formula: parenMatch[1], count: Number(parenMatch[2]) };
  }
  const plainMatch = raw.match(/^([A-Za-z0-9]+?)(\d*)$/);
  if (!plainMatch) {
    return { formula: removeOuterParens(raw), count: 1 };
  }
  return {
    formula: removeOuterParens(plainMatch[1]),
    count: plainMatch[2] ? Number(plainMatch[2]) : 1
  };
};

export const buildIonicFormula = (cation: IonInfo, anion: IonInfo): string => {
  const c = Math.abs(cation.charge);
  const a = Math.abs(anion.charge);
  const divisor = gcd(c, a);
  const cCount = a / divisor;
  const aCount = c / divisor;

  const cText = `${needParens(cation.formula) && cCount > 1 ? `(${cation.formula})` : cation.formula}${cCount === 1 ? "" : cCount}`;
  const aText = `${needParens(anion.formula) && aCount > 1 ? `(${anion.formula})` : anion.formula}${aCount === 1 ? "" : aCount}`;
  return `${cText}${aText}`;
};

export const splitIonicCompound = (formula: string): { cation: IonInfo; anion: IonInfo } | undefined => {
  const normalized = formula.replace(/\(aq\)|\(s\)|\(l\)|\(g\)/g, "").trim();

  for (const anion of [...polyAnions].sort((a, b) => b.formula.length - a.formula.length)) {
    const direct = new RegExp(`^(.*)(${anion.formula})(\\d*)$`);
    const paren = new RegExp(`^(.*)\\((${anion.formula})\\)(\\d+)$`);
    const match = normalized.match(paren) ?? normalized.match(direct);
    if (!match || !match[1]) {
      continue;
    }

    const cationRaw = parseCountedIon(match[1]);
    const cCharge = ionCharge(cationRaw.formula);
    if (!cCharge || cCharge <= 0) {
      continue;
    }

    return {
      cation: { formula: cationRaw.formula, charge: cCharge, type: "cation" },
      anion: { formula: anion.formula, charge: anion.charge, type: "anion" }
    };
  }

  const binaryMatch = normalized.match(/^([A-Z][a-z]?)(\d*)([A-Z][a-z]?)(\d*)$/);
  if (binaryMatch) {
    const cSymbol = binaryMatch[1];
    const aSymbol = binaryMatch[3];
    const cCharge = ionCharge(cSymbol);
    const aCharge = ionCharge(aSymbol);
    if (cCharge && aCharge && cCharge > 0 && aCharge < 0) {
      return {
        cation: { formula: cSymbol, charge: cCharge, type: "cation" },
        anion: { formula: aSymbol, charge: aCharge, type: "anion" }
      };
    }
  }

  return undefined;
};

export const isAcid = (formula: string): boolean => /^H[A-Za-z0-9()]*$/.test(formula) && formula !== "H2O";
export const isBase = (formula: string): boolean => formula.endsWith("OH") || formula.endsWith("(OH)2") || formula.endsWith("(OH)3");
export const isElemental = (formula: string): boolean => /^([A-Z][a-z]?)(\d*)$/.test(formula) && !formula.includes("(");
export const normalizeDiatomicElement = (symbol: string): string => (["H", "N", "O", "F", "Cl", "Br", "I"].includes(symbol) ? `${symbol}2` : symbol);

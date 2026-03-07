import { PERIODIC_BY_SYMBOL } from "../engine/periodicTable";
import { parseFormula } from "./parseFormula";
import type { EquationTerm, ParseEquationResult } from "./types";

const EXTRA_VALID_SYMBOLS = new Set(["Fe", "Cu", "Zn", "Ag", "Pb", "Sn", "Hg", "Au", "Ba", "Sr", "Mn", "Cr", "Ni", "Co"]);

const normalizeSubscripts = (value: string): string => {
  return value
    .replace(/\u2080/g, "0")
    .replace(/\u2081/g, "1")
    .replace(/\u2082/g, "2")
    .replace(/\u2083/g, "3")
    .replace(/\u2084/g, "4")
    .replace(/\u2085/g, "5")
    .replace(/\u2086/g, "6")
    .replace(/\u2087/g, "7")
    .replace(/\u2088/g, "8")
    .replace(/\u2089/g, "9");
};

export const normalizeEquationInput = (input: string): string => {
  const withDigits = normalizeSubscripts(input);
  const withArrow = withDigits.replace(/=>|->|=|\u2192/g, "->");
  return withArrow.replace(/\s+/g, " ").trim();
};

const stripState = (raw: string): string => raw.replace(/\((aq|s|l|g)\)/gi, "");

const validateFormulaSymbols = (formula: string): string | undefined => {
  try {
    const counts = parseFormula(formula);
    for (const symbol of Object.keys(counts)) {
      if (!PERIODIC_BY_SYMBOL.has(symbol) && !EXTRA_VALID_SYMBOLS.has(symbol)) {
        return `Unknown symbol: ${symbol}`;
      }
    }
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : "Invalid formula";
  }
};

const parseTerm = (raw: string): { ok: boolean; term?: EquationTerm; error?: string } => {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "?") {
    return { ok: true };
  }

  const match = trimmed.match(/^(\d+)?\s*([A-Za-z][A-Za-z0-9()]*)(?:\((aq|s|l|g)\))?$/i);
  if (!match) {
    return { ok: false, error: `I couldn't read this term: '${trimmed}'` };
  }

  const formula = stripState(match[2]);
  const formulaValidation = validateFormulaSymbols(formula);
  if (formulaValidation) {
    if (formulaValidation.includes("Unsupported character")) {
      return { ok: false, error: `I couldn't read this term: '${trimmed}'` };
    }
    if (formulaValidation.includes("Unmatched")) {
      return { ok: false, error: "Unmatched parentheses in a formula." };
    }
    return { ok: false, error: formulaValidation };
  }

  return {
    ok: true,
    term: {
      coefficient: match[1] ? Number(match[1]) : 1,
      formula,
      state: match[3]?.toLowerCase()
    }
  };
};

export const parseEquationInput = (input: string): ParseEquationResult => {
  const normalized = normalizeEquationInput(input);
  if (!normalized.includes("->")) {
    return {
      ok: false,
      reactants: [],
      products: [],
      normalized,
      error: "Missing arrow between reactants and products.",
      hint: "Try: Zn + CuSO4 -> ?"
    };
  }

  const [left, right] = normalized.split("->").map((part) => part.trim());
  if (!left) {
    return {
      ok: false,
      reactants: [],
      products: [],
      normalized,
      error: "Reactant side is empty.",
      hint: "Try: Zn + CuSO4 -> ?"
    };
  }

  const reactants: EquationTerm[] = [];
  for (const rawTerm of left.split("+")) {
    const parsed = parseTerm(rawTerm);
    if (!parsed.ok) {
      return { ok: false, reactants: [], products: [], normalized, error: parsed.error, hint: "Try: Zn + CuSO4 -> ?" };
    }
    if (parsed.term) {
      reactants.push(parsed.term);
    }
  }

  const products: EquationTerm[] = [];
  for (const rawTerm of (right || "?").split("+")) {
    const parsed = parseTerm(rawTerm);
    if (!parsed.ok) {
      return { ok: false, reactants: [], products: [], normalized, error: parsed.error, hint: "Try: Zn + CuSO4 -> ?" };
    }
    if (parsed.term) {
      products.push(parsed.term);
    }
  }

  return { ok: true, reactants, products, normalized };
};

export const formatEquation = (reactants: EquationTerm[], products: EquationTerm[]): string => {
  const formatTerm = (t: EquationTerm) => `${t.coefficient === 1 ? "" : t.coefficient}${t.formula}`;
  return `${reactants.map(formatTerm).join(" + ")} -> ${products.map(formatTerm).join(" + ")}`;
};

export type ElementCountMap = Record<string, number>;

const mergeCounts = (target: ElementCountMap, source: ElementCountMap, multiplier: number): void => {
  for (const [element, count] of Object.entries(source)) {
    target[element] = (target[element] ?? 0) + count * multiplier;
  }
};

const parseNumber = (formula: string, index: number): { value: number; next: number } => {
  let cursor = index;
  let raw = "";
  while (cursor < formula.length && /\d/.test(formula[cursor])) {
    raw += formula[cursor];
    cursor += 1;
  }
  return { value: raw ? Number(raw) : 1, next: cursor };
};

const parseGroup = (formula: string, start = 0, inParentheses = false): { counts: ElementCountMap; next: number } => {
  const counts: ElementCountMap = {};
  let i = start;

  while (i < formula.length) {
    const ch = formula[i];
    if (ch === ")") {
      if (!inParentheses) {
        throw new Error("Unmatched parentheses in formula.");
      }
      return { counts, next: i + 1 };
    }

    if (ch === "(") {
      const inner = parseGroup(formula, i + 1, true);
      const multiplier = parseNumber(formula, inner.next);
      mergeCounts(counts, inner.counts, multiplier.value);
      i = multiplier.next;
      continue;
    }

    if (/[A-Z]/.test(ch)) {
      let symbol = ch;
      if (i + 1 < formula.length && /[a-z]/.test(formula[i + 1])) {
        symbol += formula[i + 1];
        i += 1;
      }
      const amount = parseNumber(formula, i + 1);
      counts[symbol] = (counts[symbol] ?? 0) + amount.value;
      i = amount.next;
      continue;
    }

    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }

    throw new Error(`Unsupported character '${ch}' in formula '${formula}'`);
  }

  if (inParentheses) {
    throw new Error("Unmatched parentheses in formula.");
  }

  return { counts, next: i };
};

export const parseFormula = (formula: string): ElementCountMap => {
  const sanitized = formula.replace(/\(aq\)|\(s\)|\(l\)|\(g\)/g, "").trim();
  if (!sanitized) {
    return {};
  }
  const result = parseGroup(sanitized);
  return result.counts;
};

export const elementListFromTerms = (terms: { formula: string }[]): string[] => {
  const set = new Set<string>();
  for (const term of terms) {
    const counts = parseFormula(term.formula);
    Object.keys(counts).forEach((element) => set.add(element));
  }
  return [...set];
};

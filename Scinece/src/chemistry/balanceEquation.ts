import { elementListFromTerms, parseFormula } from "./parseFormula";
import type { EquationTerm } from "./types";

interface Fraction {
  n: bigint;
  d: bigint;
}

const bgcd = (a: bigint, b: bigint): bigint => {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1n;
};

const make = (n: bigint, d: bigint = 1n): Fraction => {
  if (d === 0n) {
    throw new Error("Division by zero");
  }
  const sign = d < 0n ? -1n : 1n;
  const nn = n * sign;
  const dd = d * sign;
  const g = bgcd(nn, dd);
  return { n: nn / g, d: dd / g };
};

const sub = (a: Fraction, b: Fraction): Fraction => make(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a: Fraction, b: Fraction): Fraction => make(a.n * b.n, a.d * b.d);
const div = (a: Fraction, b: Fraction): Fraction => make(a.n * b.d, a.d * b.n);
const isZero = (a: Fraction): boolean => a.n === 0n;

const lcm = (a: bigint, b: bigint): bigint => (a * b) / bgcd(a, b);

const buildMatrix = (reactants: EquationTerm[], products: EquationTerm[]): { matrix: number[][]; elements: string[] } => {
  const compounds = [...reactants, ...products];
  const elements = elementListFromTerms(compounds);
  const matrix = elements.map((el) =>
    compounds.map((compound, idx) => {
      const counts = parseFormula(compound.formula);
      const sign = idx < reactants.length ? 1 : -1;
      return (counts[el] ?? 0) * sign;
    })
  );
  return { matrix, elements };
};

const solveHomogeneous = (a: number[][]): number[] => {
  const rows = a.length;
  const cols = a[0]?.length ?? 0;
  if (cols < 2) {
    return [1];
  }

  const vars = cols - 1;
  const m: Fraction[][] = a.map((row) => row.slice(0, vars).map((v) => make(BigInt(v))));
  const b: Fraction[] = a.map((row) => make(BigInt(-row[cols - 1])));

  let pivotRow = 0;
  const pivotCols: number[] = [];

  for (let col = 0; col < vars && pivotRow < rows; col += 1) {
    let candidate = -1;
    for (let r = pivotRow; r < rows; r += 1) {
      if (!isZero(m[r][col])) {
        candidate = r;
        break;
      }
    }
    if (candidate === -1) {
      continue;
    }

    [m[pivotRow], m[candidate]] = [m[candidate], m[pivotRow]];
    [b[pivotRow], b[candidate]] = [b[candidate], b[pivotRow]];

    const pivot = m[pivotRow][col];
    for (let c = col; c < vars; c += 1) {
      m[pivotRow][c] = div(m[pivotRow][c], pivot);
    }
    b[pivotRow] = div(b[pivotRow], pivot);

    for (let r = 0; r < rows; r += 1) {
      if (r === pivotRow || isZero(m[r][col])) {
        continue;
      }
      const factor = m[r][col];
      for (let c = col; c < vars; c += 1) {
        m[r][c] = sub(m[r][c], mul(factor, m[pivotRow][c]));
      }
      b[r] = sub(b[r], mul(factor, b[pivotRow]));
    }

    pivotCols.push(col);
    pivotRow += 1;
  }

  const x: Fraction[] = Array.from({ length: vars }, () => make(0n));
  for (let r = 0; r < pivotCols.length; r += 1) {
    x[pivotCols[r]] = b[r];
  }

  const all = [...x, make(1n)];
  let denLcm = 1n;
  all.forEach((f) => {
    denLcm = lcm(denLcm, f.d);
  });

  let ints = all.map((f) => Number((f.n * denLcm) / f.d));
  const sign = ints.find((v) => v !== 0) ?? 1;
  if (sign < 0) {
    ints = ints.map((v) => -v);
  }

  const absGcd = ints.reduce((acc, value) => {
    const av = Math.abs(value);
    if (av === 0) {
      return acc;
    }
    let a1 = acc || av;
    let b1 = av;
    while (b1 !== 0) {
      const t = b1;
      b1 = a1 % b1;
      a1 = t;
    }
    return a1;
  }, 0);

  if (absGcd > 1) {
    ints = ints.map((v) => v / absGcd);
  }

  return ints;
};

export const balanceEquationTerms = (reactants: EquationTerm[], products: EquationTerm[]): { reactants: EquationTerm[]; products: EquationTerm[] } => {
  const { matrix } = buildMatrix(reactants, products);
  const coeffs = solveHomogeneous(matrix);
  const left = reactants.map((term, idx) => ({ ...term, coefficient: Math.abs(coeffs[idx]) || 1 }));
  const right = products.map((term, idx) => ({ ...term, coefficient: Math.abs(coeffs[idx + reactants.length]) || 1 }));
  return { reactants: left, products: right };
};

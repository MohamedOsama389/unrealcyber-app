export type BondType = "ionic" | "covalent" | "unsupported" | "metal-water";

export interface ElementData {
  atomicNumber: number;
  symbol: string;
  name: string;
  group: number;
  period: number;
  category: "metal" | "nonmetal" | "metalloid" | "noble-gas";
  commonValenceElectrons?: number;
  electronegativity?: number;
}

export interface ParsedTerm {
  coefficient: number;
  formula: string;
}

export interface PredictionResult {
  bondType: BondType;
  reactants: ParsedTerm[];
  products: ParsedTerm[];
  balancedEquation: string;
  predictedIons: string[];
  explanation: string[];
  notes: string[];
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface QuizQuestion {
  type: "mcq" | "short";
  prompt: string;
  options?: string[];
  answer: string;
}
export interface EquationTerm {
  coefficient: number;
  formula: string;
  state?: string;
}

export interface ReactionConditions {
  water: "none" | "cold" | "hot" | "steam";
  medium: "none" | "aqueous" | "acidic" | "basic";
  acid: "none" | "HCl" | "H2SO4_dilute";
  base: "none" | "NaOH" | "KOH" | "Ca(OH)2";
  temperature: "room" | "heated";
}

export type ReactionType =
  | "single_substitution"
  | "double_substitution"
  | "acid_base_neutralization"
  | "metal_water"
  | "synthesis"
  | "no_reaction"
  | "unsupported";

export interface OxidationChange {
  element: string;
  from: number;
  to: number;
  oxidation: boolean;
  reduction: boolean;
  reactantSpecies: string;
  productSpecies: string;
}

export interface RedoxAnalysis {
  isRedox: boolean;
  changes: OxidationChange[];
  oxidizingAgent?: string;
  reducingAgent?: string;
  explanation: string[];
}

export interface ReactionPrediction {
  input: string;
  reactionType: ReactionType;
  occurred: boolean;
  reactants: EquationTerm[];
  products: EquationTerm[];
  balancedEquation: string;
  molecularEquation: string;
  netIonicEquation?: string;
  reason: string[];
  drivingForce: string[];
  redox: RedoxAnalysis;
  visualizationHint: "electron_transfer" | "precipitation" | "neutralization" | "none";
  patternMatched?: string;
  parserError?: string;
}

export interface ParseEquationResult {
  ok: boolean;
  reactants: EquationTerm[];
  products: EquationTerm[];
  normalized: string;
  error?: string;
  hint?: string;
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

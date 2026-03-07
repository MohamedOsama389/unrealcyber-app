import type { Flashcard, QuizQuestion, ReactionPrediction } from "../chemistry";

export type ReactionMode = "NONE" | "WATER" | "DILUTE_HCL";

export interface ReactantSelection {
  kind: "element" | "compound";
  formula: string;
  display: string;
  meta?: Record<string, unknown>;
}

export interface ReactionInput {
  reactantA: ReactantSelection | null;
  reactantB: ReactantSelection | null;
  reactantACount: number;
  reactantBCount: number;
  mode: ReactionMode;
}

export interface CurrentResult {
  id: string;
  title: string;
  prediction: ReactionPrediction;
}

export interface StudyContent {
  resultId: string | null;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}

export const defaultReactionInput: ReactionInput = {
  reactantA: null,
  reactantB: null,
  reactantACount: 1,
  reactantBCount: 1,
  mode: "NONE"
};

const hashString = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

export const buildEquationPreview = (input: ReactionInput): string => {
  const a = input.reactantA ? `${input.reactantACount > 1 ? input.reactantACount : ""}${input.reactantA.formula}` : "A";
  if (input.mode === "WATER") {
    return `${a} + H2O -> ?`;
  }
  if (input.mode === "DILUTE_HCL") {
    return `${a} + HCl -> ?`;
  }
  const b = input.reactantB ? `${input.reactantBCount > 1 ? input.reactantBCount : ""}${input.reactantB.formula}` : "B";
  return `${a} + ${b} -> ?`;
};

export const buildResultId = (prediction: ReactionPrediction, input: ReactionInput): string => {
  const payload = JSON.stringify({
    input,
    balanced: prediction.balancedEquation,
    products: prediction.products,
    type: prediction.reactionType
  });
  return `r_${hashString(payload)}`;
};

export const reactionTitle = (prediction: ReactionPrediction): string => {
  if (!prediction.occurred) {
    return `${prediction.input} -> No reaction`;
  }
  return prediction.balancedEquation;
};

export const invalidateDerivedState = (): { currentResult: null; study: StudyContent } => ({
  currentResult: null,
  study: { resultId: null, flashcards: [], quiz: [] }
});

export const isStudyContentCurrent = (study: StudyContent, currentResult: CurrentResult | null): boolean => {
  if (!currentResult || !study.resultId) {
    return false;
  }
  return study.resultId === currentResult.id;
};

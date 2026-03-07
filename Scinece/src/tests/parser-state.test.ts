import { buildResultId, defaultReactionInput, invalidateDerivedState, isStudyContentCurrent } from "../app/reactionState";
import { parseEquationInput, normalizeEquationInput, predictReaction } from "../chemistry";

describe("parser normalization", () => {
  test("accepts unicode subscripts and arrow variations", () => {
    expect(normalizeEquationInput("H\u2082SO\u2084 + NaOH \u2192 ?")).toBe("H2SO4 + NaOH -> ?");
    expect(parseEquationInput("2H2O => ?").ok).toBe(true);
    expect(parseEquationInput("2 H2O = ?").ok).toBe(true);
  });

  test("returns friendly unknown symbol error", () => {
    const parsed = parseEquationInput("Xx + H2O -> ?");
    expect(parsed.ok).toBe(false);
    expect(parsed.error).toContain("Unknown symbol");
  });
});

describe("study state guards", () => {
  test("input change invalidates result and study", () => {
    const cleared = invalidateDerivedState();
    expect(cleared.currentResult).toBeNull();
    expect(cleared.study.flashcards).toEqual([]);
    expect(cleared.study.quiz).toEqual([]);
  });

  test("study content only shown for matching resultId", () => {
    const p1 = predictReaction("Zn + CuSO4 -> ?");
    const p2 = predictReaction("Cu + H2O -> ?");

    const r1 = { id: buildResultId(p1, defaultReactionInput), title: p1.balancedEquation, prediction: p1 };
    const r2 = { id: buildResultId(p2, defaultReactionInput), title: p2.balancedEquation, prediction: p2 };

    const study = { resultId: r1.id, flashcards: [{ question: "Q", answer: "A" }], quiz: [] };
    expect(isStudyContentCurrent(study, r1)).toBe(true);
    expect(isStudyContentCurrent(study, r2)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { predictReaction } from "../chemistry";
import { buildReactionAnimationPlan } from "../animation/planner";

describe("reaction animation planner", () => {
  it("always builds the three-stage flow", () => {
    const prediction = predictReaction("2NaOH + CuSO4 -> ?");
    const plan = buildReactionAnimationPlan(prediction);

    expect(plan.stages).toEqual(["before", "reaction", "after"]);
    expect(plan.reactionType).toBe("doubleSubstitution");
  });

  it("builds a single substitution replacement story with explicit charges", () => {
    const prediction = predictReaction("Zn + CuSO4 -> ?");
    const plan = buildReactionAnimationPlan(prediction);

    expect(plan.reactionType).toBe("singleSubstitution");
    expect(plan.summary).toContain("replaces");
    expect(plan.atoms.some((atom) => atom.symbol === "SO4" && atom.renderStyle === "polyatomic")).toBe(true);
    expect(plan.electronPaths.length).toBeGreaterThan(0);
  });

  it("renders polyatomic ions as grouped nodes and balances duplicate atoms", () => {
    const prediction = predictReaction("2Na + CuSO4 -> ?");
    const plan = buildReactionAnimationPlan(prediction);

    const sulfate = plan.atoms.find((atom) => atom.symbol === "SO4");
    const sodiums = plan.atoms.filter((atom) => atom.symbol === "Na" && atom.id.startsWith("incoming-"));

    expect(sulfate?.renderStyle).toBe("polyatomic");
    expect(sodiums.length).toBe(2);
    expect(Math.abs(sodiums[0].states.after.x - sodiums[1].states.after.x)).toBeGreaterThan(80);
  });

  it("builds a no-reaction single-substitution attempt", () => {
    const prediction = predictReaction("Mg + NaCl -> ?");
    const plan = buildReactionAnimationPlan(prediction);

    expect(plan.reactionType).toBe("singleSubstitution");
    expect(plan.summary).toContain("No reaction");
    expect(plan.electronPaths.length).toBe(0);
  });

  it("keeps fallback plans valid for other reaction families", () => {
    const prediction = predictReaction("2Na + H2SO4 -> ?");
    const plan = buildReactionAnimationPlan(prediction);

    expect(plan.stages).toEqual(["before", "reaction", "after"]);
    expect(plan.reactionType).toBe("acidMetal");
  });

  it("keeps neutralization reactions compatible", () => {
    const prediction = predictReaction("KOH + HCl -> ?");
    const plan = buildReactionAnimationPlan(prediction);

    expect(plan.reactionType).toBe("doubleSubstitution");
    expect(plan.equation).toContain("KOH");
  });

  it("matches Na2SO4 acceptance data (Na+, SO4 2-, Cu neutral)", () => {
    const prediction = predictReaction("2Na + CuSO4 -> ?");
    const plan = buildReactionAnimationPlan(prediction);

    const sodiumAfter = plan.atoms.filter((atom) => atom.symbol === "Na").map((atom) => atom.states.after.charge);
    const sulfate = plan.atoms.find((atom) => atom.symbol === "SO4");
    const displacedCu = plan.atoms.find((atom) => atom.symbol === "Cu" && atom.id.startsWith("displaced-"));

    expect(sodiumAfter.some((charge) => charge === 1)).toBe(true);
    expect(sulfate?.renderStyle).toBe("polyatomic");
    expect(sulfate?.states.after.charge).toBe(-2);
    expect(displacedCu?.states.after.charge).toBe(0);
    expect(plan.productGroups.some((group) => group.label === "Na2SO4")).toBe(true);
  });
});

import { balanceEquationTerms, parseEquationInput, parseFormula, predictReaction, predictSolubility } from "../chemistry";
import { canDisplaceMetal } from "../chemistry/activitySeries";

describe("formula parsing", () => {
  test("parses parenthesis compounds", () => {
    expect(parseFormula("Ca(OH)2")).toEqual({ Ca: 1, O: 2, H: 2 });
  });
});

describe("balancer", () => {
  test("balances Fe + HCl", () => {
    const parsed = parseEquationInput("Fe + HCl -> FeCl2 + H2");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const balanced = balanceEquationTerms(parsed.reactants, parsed.products);
    expect(balanced.reactants[0].coefficient).toBe(1);
    expect(balanced.reactants[1].coefficient).toBe(2);
    expect(balanced.products[0].coefficient).toBe(1);
    expect(balanced.products[1].coefficient).toBe(1);
  });
});

describe("solubility", () => {
  test("AgCl insoluble", () => {
    const s = predictSolubility("AgCl");
    expect(s.soluble).toBe(false);
  });
});

describe("activity series", () => {
  test("Zn displaces Cu", () => {
    expect(canDisplaceMetal("Zn", "Cu").canDisplace).toBe(true);
    expect(canDisplaceMetal("Cu", "Zn").canDisplace).toBe(false);
  });
});

describe("acceptance reactions", () => {
  test("element combination in build mode style input (Na + Cl)", () => {
    const result = predictReaction("Na + Cl -> ?");
    expect(result.occurred).toBe(true);
    expect(result.balancedEquation).toContain("NaCl");
  });

  test("1) Zn + CuSO4", () => {
    const result = predictReaction("Zn + CuSO4 -> ?");
    expect(result.balancedEquation).toBe("Zn + CuSO4 -> ZnSO4 + Cu");
    expect(result.reactionType).toBe("single_substitution");
    expect(result.redox.isRedox).toBe(true);
  });

  test("2) Cu + ZnSO4 no reaction", () => {
    const result = predictReaction("Cu + ZnSO4 -> ?");
    expect(result.reactionType).toBe("no_reaction");
    expect(result.occurred).toBe(false);
  });

  test("metal + salt no reaction when incoming is less reactive (Mg + NaCl)", () => {
    const result = predictReaction("Mg + NaCl -> ?");
    expect(result.reactionType).toBe("no_reaction");
    expect(result.occurred).toBe(false);
    expect(result.reason[0]).toContain("No reaction: Mg is less reactive than Na");
  });

  test("3) Cl2 + 2KBr", () => {
    const result = predictReaction("Cl2 + KBr -> ?");
    expect(result.balancedEquation).toBe("Cl2 + 2KBr -> 2KCl + Br2");
    expect(result.redox.isRedox).toBe(true);
  });

  test("4) AgNO3 + NaCl", () => {
    const result = predictReaction("AgNO3 + NaCl -> ?");
    expect(result.balancedEquation).toBe("AgNO3 + NaCl -> AgCl + NaNO3");
    expect(result.drivingForce.join(" ")).toContain("precipitates");
  });

  test("5) HCl + NaOH", () => {
    const result = predictReaction("HCl + NaOH -> ?");
    expect(result.balancedEquation).toBe("HCl + NaOH -> NaCl + H2O");
    expect(result.netIonicEquation).toBe("H+ + OH- -> H2O");
  });

  test("6) Na2CO3 + HCl", () => {
    const result = predictReaction("Na2CO3 + HCl -> ?");
    expect(result.balancedEquation).toBe("Na2CO3 + 2HCl -> 2NaCl + H2O + CO2");
  });

  test("7) Fe + HCl", () => {
    const result = predictReaction("Fe + HCl -> ?");
    expect(result.balancedEquation).toBe("Fe + 2HCl -> FeCl2 + H2");
    expect(result.redox.isRedox).toBe(true);
  });

  test("8) Na + H2O", () => {
    const result = predictReaction("Na + H2O -> ?");
    expect(result.balancedEquation).toBe("2Na + 2H2O -> 2NaOH + H2");
    expect(result.redox.isRedox).toBe(true);
  });

  test("metal + acid storyboard example (Na + H2SO4)", () => {
    const result = predictReaction("Na + H2SO4 -> ?");
    expect(result.reactionType).toBe("single_substitution");
    expect(result.occurred).toBe(true);
    expect(result.balancedEquation).toBe("2Na + H2SO4 -> Na2SO4 + H2");
  });
});

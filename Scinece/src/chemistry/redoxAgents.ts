import { oxidationNumbersForFormula } from "./oxidationNumbers";
import type { EquationTerm, OxidationChange, RedoxAnalysis } from "./types";

export const analyzeRedox = (reactants: EquationTerm[], products: EquationTerm[]): RedoxAnalysis => {
  const reactantON = reactants.map((r) => ({ formula: r.formula, on: oxidationNumbersForFormula(r.formula) }));
  const productON = products.map((p) => ({ formula: p.formula, on: oxidationNumbersForFormula(p.formula) }));

  const changes: OxidationChange[] = [];

  for (const r of reactantON) {
    if (!r.on) {
      continue;
    }
    for (const [element, from] of Object.entries(r.on)) {
      for (const p of productON) {
        if (!p.on || p.on[element] === undefined) {
          continue;
        }
        const to = p.on[element];
        if (to !== from) {
          changes.push({
            element,
            from,
            to,
            oxidation: to > from,
            reduction: to < from,
            reactantSpecies: r.formula,
            productSpecies: p.formula
          });
        }
      }
    }
  }

  const unique = changes.filter(
    (item, idx, arr) =>
      arr.findIndex((x) => x.element === item.element && x.reactantSpecies === item.reactantSpecies && x.productSpecies === item.productSpecies && x.from === item.from && x.to === item.to) === idx
  );

  const oxidation = unique.find((c) => c.oxidation);
  const reduction = unique.find((c) => c.reduction);

  const explanation: string[] = [];
  if (oxidation) {
    explanation.push(`${oxidation.element} is oxidized (${oxidation.from} -> ${oxidation.to}) in ${oxidation.reactantSpecies}.`);
  }
  if (reduction) {
    explanation.push(`${reduction.element} is reduced (${reduction.from} -> ${reduction.to}) in ${reduction.reactantSpecies}.`);
  }

  if (oxidation && reduction) {
    explanation.push(`${oxidation.reactantSpecies} acts as the reducing agent.`);
    explanation.push(`${reduction.reactantSpecies} acts as the oxidizing agent.`);
  } else {
    explanation.push("No clear oxidation-number change detected for MVP rules.");
  }

  return {
    isRedox: Boolean(oxidation && reduction),
    changes: unique,
    reducingAgent: oxidation?.reactantSpecies,
    oxidizingAgent: reduction?.reactantSpecies,
    explanation
  };
};

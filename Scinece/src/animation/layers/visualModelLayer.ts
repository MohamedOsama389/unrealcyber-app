import { getElement, getShellDistribution, getValenceElectrons } from "../../engine/chemistry";
import type { ChemistryLayerModel, ChemistrySpecies, ChemistryTermModel } from "./chemistryLayer";

export interface VisualSpeciesNode {
  id: string;
  symbol: string;
  charge: number;
  count: number;
  role: ChemistrySpecies["role"];
  side: "reactant" | "product";
  termId: string;
  termFormula: string;
  termKind: ChemistryTermModel["kind"];
  renderStyle: "atom" | "polyatomic" | "molecule";
  shellCount: number;
  valenceElectrons: number;
  badgeLabel?: string;
}

export interface VisualModel {
  equation: string;
  reactionType: ChemistryLayerModel["reactionType"];
  occurred: boolean;
  reactants: VisualSpeciesNode[];
  products: VisualSpeciesNode[];
}

const toVisualSpecies = (term: ChemistryTermModel, species: ChemistrySpecies): VisualSpeciesNode => {
  if (species.speciesType === "polyatomic") {
    return {
      id: species.id,
      symbol: species.symbol,
      charge: species.charge,
      count: species.count,
      role: species.role,
      side: term.side,
      termId: term.id,
      termFormula: term.formula,
      termKind: term.kind,
      renderStyle: "polyatomic",
      shellCount: 0,
      valenceElectrons: 0,
      badgeLabel: species.symbol
    };
  }

  if (species.speciesType === "molecule") {
    return {
      id: species.id,
      symbol: species.symbol,
      charge: species.charge,
      count: species.count,
      role: species.role,
      side: term.side,
      termId: term.id,
      termFormula: term.formula,
      termKind: term.kind,
      renderStyle: "molecule",
      shellCount: 1,
      valenceElectrons: 0
    };
  }

  const element = getElement(species.symbol);
  return {
    id: species.id,
    symbol: species.symbol,
    charge: species.charge,
    count: species.count,
    role: species.role,
    side: term.side,
    termId: term.id,
    termFormula: term.formula,
    termKind: term.kind,
    renderStyle: "atom",
    shellCount: element ? Math.max(1, Math.min(4, getShellDistribution(element.atomicNumber).length)) : 2,
    valenceElectrons: element ? Math.max(0, Math.min(8, getValenceElectrons(element))) : 4
  };
};

export const buildVisualModel = (chemistry: ChemistryLayerModel): VisualModel => ({
  equation: chemistry.equation,
  reactionType: chemistry.reactionType,
  occurred: chemistry.occurred,
  reactants: chemistry.reactants.flatMap((term) => term.species.map((species) => toVisualSpecies(term, species))),
  products: chemistry.products.flatMap((term) => term.species.map((species) => toVisualSpecies(term, species)))
});

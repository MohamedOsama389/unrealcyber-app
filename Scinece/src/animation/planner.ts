import type { ReactionPrediction } from "../chemistry";
import type {
  AnimationStage,
  AtomActor,
  BondActor,
  ElectronPathActor,
  ReactionAnimationPlan,
  ReactionAnimationType
} from "./types";
import { buildChemistryLayerModel } from "./layers/chemistryLayer";
import { buildVisualModel, type VisualSpeciesNode } from "./layers/visualModelLayer";

const STAGES: AnimationStage[] = ["before", "reaction", "after"];
const DURATION: Record<AnimationStage, number> = { before: 1700, reaction: 1800, after: 1700 };
const LAYOUT = { width: 960, height: 420 };
const GAS_FORMULAS = new Set(["H2", "CO2", "SO2", "NH3", "H2S", "O2", "N2", "Cl2", "Br2", "I2"]);

const cl = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));
const valenceForCharge = (base: number, charge: number): number => (
  charge > 0 ? cl(base - charge, 0, 8) : charge < 0 ? cl(base + Math.abs(charge), 0, 8) : cl(base, 0, 8)
);
const outerShellRadius = (shellCount: number): number => 26 + 14 * (Math.max(1, shellCount) - 1);
const nodeRenderRadius = (node: VisualSpeciesNode): number => node.renderStyle === "polyatomic" ? 38 : outerShellRadius(node.shellCount) + 12;

const atomActor = (
  id: string,
  node: VisualSpeciesNode,
  before: { x: number; y: number; charge?: number; scale?: number; opacity?: number; valenceElectrons?: number },
  reaction: { x: number; y: number; charge?: number; scale?: number; opacity?: number; valenceElectrons?: number },
  after: { x: number; y: number; charge?: number; scale?: number; opacity?: number; valenceElectrons?: number }
): AtomActor => ({
  id,
  symbol: node.symbol,
  category: node.role === "cation" || node.role === "atom"
    ? "metal"
    : node.renderStyle === "polyatomic"
      ? "ion"
      : "nonmetal",
  renderStyle: node.renderStyle === "polyatomic" ? "polyatomic" : "atom",
  badgeLabel: node.renderStyle === "polyatomic" ? node.badgeLabel : undefined,
  shellCount: node.renderStyle === "atom" ? node.shellCount : 0,
  states: {
    before: {
      x: before.x,
      y: before.y,
      opacity: before.opacity ?? 1,
      scale: before.scale ?? 1,
      charge: before.charge ?? node.charge,
      valenceElectrons: node.renderStyle === "atom"
        ? (before.valenceElectrons ?? valenceForCharge(node.valenceElectrons, before.charge ?? node.charge))
        : 0
    },
    reaction: {
      x: reaction.x,
      y: reaction.y,
      opacity: reaction.opacity ?? 1,
      scale: reaction.scale ?? 1,
      charge: reaction.charge ?? node.charge,
      valenceElectrons: node.renderStyle === "atom"
        ? (reaction.valenceElectrons ?? valenceForCharge(node.valenceElectrons, reaction.charge ?? node.charge))
        : 0
    },
    after: {
      x: after.x,
      y: after.y,
      opacity: after.opacity ?? 1,
      scale: after.scale ?? 1,
      charge: after.charge ?? node.charge,
      valenceElectrons: node.renderStyle === "atom"
        ? (after.valenceElectrons ?? valenceForCharge(node.valenceElectrons, after.charge ?? node.charge))
        : 0
    }
  }
});

const bond = (
  id: string,
  fromAtomId: string,
  toAtomId: string,
  beforeOpacity: number,
  reactionOpacity: number,
  afterOpacity: number,
  order: 1 | 2 | 3 = 1,
  thickness = 2.4
): BondActor => ({
  id,
  fromAtomId,
  toAtomId,
  order,
  states: {
    before: { opacity: beforeOpacity, thickness },
    reaction: { opacity: reactionOpacity, thickness },
    after: { opacity: afterOpacity, thickness }
  }
});

const electronPath = (
  id: string,
  fromAtomId: string,
  toAtomId: string,
  fromAngle: number,
  toAngle: number,
  curvature: number
): ElectronPathActor => ({
  id,
  fromAtomId,
  toAtomId,
  fromAngle,
  toAngle,
  curvature,
  targetMix: 1,
  states: {
    before: { progress: 0, opacity: 0 },
    reaction: { progress: 1, opacity: 1 },
    after: { progress: 1, opacity: 0 }
  }
});

const detectType = (prediction: ReactionPrediction): ReactionAnimationType => {
  if (prediction.reactionType === "synthesis") {
    const chemistry = buildChemistryLayerModel(prediction);
    const visual = buildVisualModel(chemistry);
    const reactantAtoms = visual.reactants.filter((v) => v.termKind === "elemental" && v.renderStyle === "atom");
    const hasMetalCationInProduct = visual.products.some((v) => v.termKind === "ionic" && v.role === "cation");
    const hasAnionInProduct = visual.products.some((v) => v.termKind === "ionic" && v.role === "anion");
    if (reactantAtoms.length >= 2 && hasMetalCationInProduct && hasAnionInProduct) {
      return "ionic";
    }
    return "covalent";
  }
  if (prediction.reactionType === "single_substitution" && prediction.products.some((p) => p.formula === "H2")) return "acidMetal";
  if (prediction.reactionType === "metal_water") return "gasFormation";
  if (prediction.reactionType === "double_substitution" && prediction.products.some((p) => GAS_FORMULAS.has(p.formula) || p.state === "g")) return "gasFormation";
  if (prediction.reactionType === "double_substitution" || prediction.reactionType === "acid_base_neutralization") return "doubleSubstitution";
  if (prediction.reactionType === "single_substitution" || prediction.reactionType === "no_reaction") return "singleSubstitution";
  return "covalent";
};

const buildSingleSubstitutionPlan = (prediction: ReactionPrediction): ReactionAnimationPlan | undefined => {
  const chemistry = buildChemistryLayerModel(prediction);
  const visual = buildVisualModel(chemistry);

  const incoming = visual.reactants.find((v) => v.termKind === "elemental" && v.role === "atom");
  const reactantCation = visual.reactants.find((v) => v.termKind === "ionic" && v.role === "cation");
  const reactantAnion = visual.reactants.find((v) => v.termKind === "ionic" && v.role === "anion");
  if (!incoming || !reactantCation || !reactantAnion) return undefined;

  const productCation = visual.products.find((v) => v.termKind === "ionic" && v.role === "cation");
  const displaced = visual.products.find((v) => v.termKind === "elemental" && v.symbol !== incoming.symbol);

  const happened = chemistry.occurred && Boolean(productCation && displaced);
  const cationCharge = productCation?.charge ?? reactantCation.charge;
  const cationCount = cl(productCation?.count ?? incoming.count, 1, 3);
  const incomingCount = cl(incoming.count, 1, 3);
  const displacedCount = cl(displaced?.count ?? 1, 1, 3);
  const polyAnion = reactantAnion.renderStyle === "polyatomic";

  const incomingOffsets = incomingCount === 1 ? [0] : incomingCount === 2 ? [-34, 34] : [-56, 0, 56];
  const cationAfterOffsets = cationCount === 1
    ? [0]
    : cationCount === 2
      ? [-96, 96]
      : [-104, 0, 104];
  const displacedOffsets = displacedCount === 1 ? [0] : displacedCount === 2 ? [-30, 30] : [-50, 0, 50];

  const atoms: AtomActor[] = [
    ...incomingOffsets.map((offset, i) => atomActor(
      `incoming-${i}`,
      incoming,
      { x: 190 + offset, y: 230, charge: 0 },
      { x: happened ? 390 + offset * 0.4 : 310 + offset * 0.25, y: 220, charge: 0, scale: 1.03 },
      {
        x: happened
          ? (polyAnion ? 520 + cationAfterOffsets[i % cationAfterOffsets.length] : 470 + offset * 0.4)
          : 190 + offset,
        y: happened && polyAnion ? 240 : 220,
        charge: happened ? cationCharge : 0,
        scale: happened ? 1.02 : 1
      }
    )),
    atomActor(
      "anion",
      reactantAnion,
      { x: 730, y: 255, charge: reactantAnion.charge, scale: polyAnion ? 1.04 : 1 },
      { x: happened ? 610 : 730, y: 248, charge: reactantAnion.charge, scale: polyAnion ? 1.05 : 1 },
      { x: happened ? (polyAnion ? 520 : 560) : 730, y: happened ? (polyAnion ? 240 : 255) : 255, charge: reactantAnion.charge, scale: polyAnion ? 1.06 : 1 }
    ),
    ...displacedOffsets.map((offset, i) => atomActor(
      `displaced-${i}`,
      displaced ?? reactantCation,
      { x: 620 + offset, y: 190, charge: reactantCation.charge },
      { x: happened ? 760 + offset * 0.45 : 620 + offset, y: happened ? 170 : 190, charge: reactantCation.charge, scale: 1.03 },
      { x: happened ? 780 + offset * 0.5 : 620 + offset, y: happened ? 190 : 190, charge: happened ? 0 : reactantCation.charge }
    ))
  ];

  const bonds: BondActor[] = !polyAnion
    ? [
      ...displacedOffsets.map((_, i) => bond(`old-${i}`, `displaced-${i}`, "anion", 1, happened ? 0.25 : 1, happened ? 0 : 1)),
      ...incomingOffsets.map((_, i) => bond(`new-${i}`, `incoming-${i}`, "anion", 0, happened ? 0.45 : 0, happened ? 1 : 0))
    ]
    : [];

  const transferCount = cl(Math.abs(cationCharge), 1, 2);
  const electronPaths: ElectronPathActor[] = happened
    ? Array.from({ length: transferCount }, (_, i) => electronPath(`e-${i}`, `incoming-${i % incomingCount}`, `displaced-${i % displacedCount}`, 0.18 + i * 0.22, Math.PI - i * 0.2, -90 + i * 25))
    : [];

  return {
    id: `single:${chemistry.equation}`,
    reactionType: "singleSubstitution",
    equation: chemistry.equation,
    stages: STAGES,
    stageDurationMs: DURATION,
    layout: LAYOUT,
    atoms,
    bonds,
    electronPaths,
    sharedPairs: [],
    gasBubbles: [],
    productGroups: happened && polyAnion
      ? [{
        id: "final-compound",
        label: productCation?.termFormula ?? chemistry.products.find((t) => t.kind === "ionic")?.formula ?? `${incoming.symbol}${reactantAnion.symbol}`,
        atomIds: [...incomingOffsets.map((_, i) => `incoming-${i}`), "anion"],
        states: {
          before: { opacity: 0 },
          reaction: { opacity: 0.2 },
          after: { opacity: 1 }
        }
      }]
      : [],
    stageCaption: happened
      ? {
        before: `${incoming.count > 1 ? `${incoming.count}${incoming.symbol}` : incoming.symbol} and ${reactantCation.symbol}${reactantAnion.symbol} are separated with clean spacing.`,
        reaction: `${incoming.symbol} displaces ${reactantCation.symbol}; the displaced metal moves away.`,
        after: polyAnion
          ? `${reactantAnion.symbol}^${reactantAnion.charge < 0 ? `${Math.abs(reactantAnion.charge)}-` : `${reactantAnion.charge}+`} stays as one ion group, and ${productCation?.symbol ?? incoming.symbol}+ ions arrange symmetrically.`
          : `${productCation?.symbol ?? incoming.symbol}+ bonds with ${reactantAnion.symbol}.`
      }
      : {
        before: `${incoming.symbol} approaches the ionic reactant.`,
        reaction: `${incoming.symbol} cannot replace ${reactantCation.symbol}.`,
        after: "No net substitution occurs."
      },
    summary: happened
      ? `${productCation?.symbol ?? incoming.symbol} replaces ${reactantCation.symbol}.`
      : `No reaction: ${incoming.symbol} does not replace ${reactantCation.symbol}.`
  };
};

const buildIonicPlan = (prediction: ReactionPrediction): ReactionAnimationPlan | undefined => {
  const chemistry = buildChemistryLayerModel(prediction);
  const visual = buildVisualModel(chemistry);

  const cation = visual.products.find((v) => v.termKind === "ionic" && v.role === "cation");
  const anion = visual.products.find((v) => v.termKind === "ionic" && v.role === "anion");
  if (!cation || !anion) return undefined;

  const metalReactant = visual.reactants.find((v) => v.symbol === cation.symbol) ?? visual.reactants[0];
  const nonmetalReactant = visual.reactants.find((v) => v.symbol === anion.symbol) ?? visual.reactants[1] ?? anion;
  if (!metalReactant || !nonmetalReactant) return undefined;

  const gap = 4;
  const touchDistance = nodeRenderRadius(metalReactant) + nodeRenderRadius(nonmetalReactant) + gap;
  const centerX = 480;
  const leftAfterX = centerX - touchDistance / 2;
  const rightAfterX = centerX + touchDistance / 2;

  const atoms: AtomActor[] = [
    atomActor(
      "metal",
      metalReactant,
      { x: 250, y: 220, charge: 0 },
      { x: centerX - touchDistance / 2 - 32, y: 220, charge: 0, scale: 1.03 },
      { x: leftAfterX, y: 220, charge: cation.charge, valenceElectrons: 0, scale: 1.02 }
    ),
    atomActor(
      "nonmetal",
      nonmetalReactant,
      { x: 710, y: 220, charge: 0 },
      { x: centerX + touchDistance / 2 + 32, y: 220, charge: 0, scale: 1.03 },
      { x: rightAfterX, y: 220, charge: anion.charge, scale: 1.02 }
    )
  ];

  const transferCount = cl(Math.abs(cation.charge), 1, 2);
  const electronPaths = Array.from({ length: transferCount }, (_, i) => (
    electronPath(`ionic-e-${i}`, "metal", "nonmetal", 0.18 + i * 0.22, Math.PI - i * 0.2, -110 + i * 24)
  ));

  return {
    id: `ionic:${chemistry.equation}`,
    reactionType: "ionic",
    equation: chemistry.equation,
    stages: STAGES,
    stageDurationMs: DURATION,
    layout: LAYOUT,
    atoms,
    bonds: [bond("ionic-final", "metal", "nonmetal", 0, 0.3, 0.85, 1, 2)],
    electronPaths,
    sharedPairs: [],
    gasBubbles: [],
    productGroups: [],
    stageCaption: {
      before: `${metalReactant.symbol} and ${nonmetalReactant.symbol} are separated with visible valence electrons.`,
      reaction: `Electron transfer occurs from ${metalReactant.symbol} to ${nonmetalReactant.symbol}.`,
      after: `${cation.symbol}+ and ${anion.symbol}${anion.charge < 0 ? `${Math.abs(anion.charge)}-` : `${anion.charge}+`} touch at the outer-shell boundary.`
    },
    summary: `Ionic bond forms by electron transfer from ${metalReactant.symbol} to ${nonmetalReactant.symbol}.`
  };
};

const fallbackPlan = (prediction: ReactionPrediction, type: ReactionAnimationType): ReactionAnimationPlan => {
  const chemistry = buildChemistryLayerModel(prediction);
  const visual = buildVisualModel(chemistry);
  const left = visual.reactants[0];
  const right = visual.reactants[1] ?? visual.products[0] ?? left;
  const touchDistance = nodeRenderRadius(left) + nodeRenderRadius(right) + 4;
  const centerX = 480;

  const atoms: AtomActor[] = [
    atomActor(
      "left",
      left,
      { x: 260, y: 220, charge: left.charge },
      { x: centerX - touchDistance / 2 - 30, y: 220, charge: left.charge, scale: 1.03 },
      { x: chemistry.occurred ? centerX - touchDistance / 2 : 260, y: 220, charge: left.charge }
    ),
    atomActor(
      "right",
      right,
      { x: 700, y: 220, charge: right.charge },
      { x: centerX + touchDistance / 2 + 30, y: 220, charge: right.charge, scale: 1.03 },
      { x: chemistry.occurred ? centerX + touchDistance / 2 : 700, y: 220, charge: right.charge }
    )
  ];

  return {
    id: `fallback:${chemistry.equation}`,
    reactionType: type,
    equation: chemistry.equation,
    stages: STAGES,
    stageDurationMs: DURATION,
    layout: LAYOUT,
    atoms,
    bonds: chemistry.occurred ? [bond("f", "left", "right", 0, 0.35, 1)] : [],
    electronPaths: [],
    sharedPairs: [],
    gasBubbles: [],
    productGroups: [],
    stageCaption: chemistry.occurred
      ? {
        before: "Reactants are separated.",
        reaction: "Particles move and react.",
        after: "Products stabilize in clean positions."
      }
      : {
        before: "Reactants are separated.",
        reaction: "Particles approach.",
        after: "No reaction."
      },
    summary: chemistry.occurred ? "Reaction occurs." : "No reaction."
  };
};

export const buildReactionAnimationPlan = (prediction: ReactionPrediction): ReactionAnimationPlan => {
  const type = detectType(prediction);

  if (type === "ionic") {
    const ionic = buildIonicPlan(prediction);
    if (ionic) return ionic;
  }

  if (type === "singleSubstitution") {
    const single = buildSingleSubstitutionPlan(prediction);
    if (single) return single;
  }

  return fallbackPlan(prediction, type);
};

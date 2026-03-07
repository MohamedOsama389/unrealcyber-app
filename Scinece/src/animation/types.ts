export type AnimationStage = "before" | "reaction" | "after";

export type ReactionAnimationType =
  | "ionic"
  | "covalent"
  | "singleSubstitution"
  | "doubleSubstitution"
  | "acidMetal"
  | "gasFormation";

export interface AtomState {
  x: number;
  y: number;
  opacity: number;
  scale: number;
  valenceElectrons: number;
  charge: number;
}

export interface AtomActor {
  id: string;
  symbol: string;
  shellCount: number;
  category: "metal" | "nonmetal" | "ion" | "molecule";
  renderStyle: "atom" | "polyatomic";
  badgeLabel?: string;
  states: Record<AnimationStage, AtomState>;
}

export interface BondState {
  opacity: number;
  thickness: number;
}

export interface BondActor {
  id: string;
  fromAtomId: string;
  toAtomId: string;
  order: 1 | 2 | 3;
  states: Record<AnimationStage, BondState>;
}

export interface ElectronPathState {
  progress: number;
  opacity: number;
}

export interface ElectronPathActor {
  id: string;
  fromAtomId: string;
  toAtomId: string;
  fromAngle: number;
  toAngle: number;
  curvature: number;
  targetMix: number;
  states: Record<AnimationStage, ElectronPathState>;
}

export interface SharedPairState {
  opacity: number;
  spread: number;
}

export interface SharedPairActor {
  id: string;
  leftAtomId: string;
  rightAtomId: string;
  pairCount: number;
  states: Record<AnimationStage, SharedPairState>;
}

export interface GasBubbleState {
  x: number;
  y: number;
  opacity: number;
  scale: number;
}

export interface GasBubbleActor {
  id: string;
  label: string;
  states: Record<AnimationStage, GasBubbleState>;
}

export interface ProductGroupState {
  opacity: number;
}

export interface ProductGroupActor {
  id: string;
  label: string;
  atomIds: string[];
  states: Record<AnimationStage, ProductGroupState>;
}

export interface SceneLayout {
  width: number;
  height: number;
}

export interface ReactionAnimationPlan {
  id: string;
  reactionType: ReactionAnimationType;
  equation: string;
  stages: AnimationStage[];
  stageDurationMs: Record<AnimationStage, number>;
  layout: SceneLayout;
  atoms: AtomActor[];
  bonds: BondActor[];
  electronPaths: ElectronPathActor[];
  sharedPairs: SharedPairActor[];
  gasBubbles: GasBubbleActor[];
  productGroups: ProductGroupActor[];
  stageCaption: Record<AnimationStage, string>;
  summary: string;
}

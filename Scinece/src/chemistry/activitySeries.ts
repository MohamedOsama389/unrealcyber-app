import activitySeriesRaw from "./datasets/activitySeries.json";
import halogenSeriesRaw from "./datasets/halogenSeries.json";

const activitySeries = activitySeriesRaw as string[];
const halogenSeries = halogenSeriesRaw as string[];

const rank = (series: string[], item: string): number => series.indexOf(item);

export const canDisplaceMetal = (incoming: string, target: string): { canDisplace: boolean; reason: string } => {
  const incomingRank = rank(activitySeries, incoming);
  const targetRank = rank(activitySeries, target);

  if (incomingRank === -1 || targetRank === -1) {
    return { canDisplace: false, reason: "Activity-series comparison unavailable for one of the metals." };
  }

  const can = incomingRank < targetRank;
  return {
    canDisplace: can,
    reason: `${incoming} is ${can ? "above" : "below"} ${target} in the activity series.`
  };
};

export const canMetalDisplaceHydrogen = (metal: string): { canDisplace: boolean; reason: string } => {
  return canDisplaceMetal(metal, "H");
};

export const canDisplaceHalogen = (incomingDiatomic: string, leaving: string): { canDisplace: boolean; reason: string } => {
  const incomingRank = rank(halogenSeries, incomingDiatomic);
  const targetRank = rank(halogenSeries, `${leaving}2`);
  if (incomingRank === -1 || targetRank === -1) {
    return { canDisplace: false, reason: "Halogen-series comparison unavailable." };
  }
  const can = incomingRank < targetRank;
  return {
    canDisplace: can,
    reason: `${incomingDiatomic} is ${can ? "more reactive than" : "less reactive than"} ${leaving}2.`
  };
};

export const getSeries = () => ({ activitySeries, halogenSeries });

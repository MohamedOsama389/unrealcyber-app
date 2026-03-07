import periodicTableData from "../data/periodic-table.json";
import type { ElementData } from "./types";

export const PERIODIC_TABLE: ElementData[] = periodicTableData as ElementData[];

export const PERIODIC_BY_SYMBOL = new Map(PERIODIC_TABLE.map((el) => [el.symbol, el]));

export const MAIN_GROUP_ELEMENTS = PERIODIC_TABLE.filter((el) => [1, 2, 13, 14, 15, 16, 17, 18].includes(el.group));
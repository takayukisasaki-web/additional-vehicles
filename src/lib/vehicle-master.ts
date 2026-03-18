import { VehicleMasterEntry, cmToCells } from "./models/vehicle";

function entry(
  id: string,
  typeName: string,
  lengthCm: number,
  widthCm: number
): VehicleMasterEntry {
  return {
    id,
    typeName,
    lengthCm,
    widthCm,
    lengthCells: cmToCells(lengthCm),
    widthCells: cmToCells(widthCm),
  };
}

/** 車種マスタデータ（一般的な事業用トラック） */
export const VEHICLE_MASTER: VehicleMasterEntry[] = [
  entry("kei-truck", "軽トラック", 340, 148),
  entry("2t-truck", "2tトラック", 470, 170),
  entry("4t-truck", "4tトラック", 620, 215),
  entry("large-truck", "大型トラック(10t)", 850, 250),
  entry("trailer", "トレーラー", 1200, 250),
  entry("car", "普通乗用車", 470, 180),
  entry("van", "ハイエース/バン", 485, 170),
  entry("small-truck", "小型トラック(1.5t)", 430, 170),
];

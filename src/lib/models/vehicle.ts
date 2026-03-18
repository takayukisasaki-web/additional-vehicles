import { CELL_SIZE_CM } from "./parking-lot";

export interface VehicleDimensions {
  /** 全長（グリッドセル数） */
  lengthCells: number;
  /** 全幅（グリッドセル数） */
  widthCells: number;
  /** 全長（cm） */
  lengthCm: number;
  /** 全幅（cm） */
  widthCm: number;
}

export interface Vehicle {
  id: string;
  /** 表示番号 */
  number: number;
  /** 車種名 */
  typeName: string;
  dimensions: VehicleDimensions;
  /** existing=既存, new=増車分 */
  status: "existing" | "new";
}

export interface VehicleMasterEntry {
  id: string;
  typeName: string;
  lengthCm: number;
  widthCm: number;
  lengthCells: number;
  widthCells: number;
}

/** cmからセル数に変換（切り上げ） */
export function cmToCells(cm: number): number {
  return Math.ceil(cm / CELL_SIZE_CM);
}

/** VehicleDimensionsを作成 */
export function createDimensions(
  lengthCm: number,
  widthCm: number
): VehicleDimensions {
  return {
    lengthCm,
    widthCm,
    lengthCells: cmToCells(lengthCm),
    widthCells: cmToCells(widthCm),
  };
}

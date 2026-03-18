/** 1セル = 50cm × 50cm */
export const CELL_SIZE_CM = 50;

/** セルのキー生成 */
export function cellKey(col: number, row: number): string {
  return `${col},${row}`;
}

/** セルキーからcol,rowを取得 */
export function parseKey(key: string): [number, number] {
  const [c, r] = key.split(",").map(Number);
  return [c, r];
}

/** シリアライズ可能な駐車場データ */
export interface ParkingLotData {
  id: string;
  name: string;
  cols: number;
  rows: number;
  /** [col, row] のタプル配列 */
  activeCells: [number, number][];
}

/** デフォルト駐車場 */
export function createDefaultParkingLot(id: string): ParkingLotData {
  return {
    id,
    name: "駐車場",
    cols: 50,
    rows: 50,
    activeCells: [],
  };
}

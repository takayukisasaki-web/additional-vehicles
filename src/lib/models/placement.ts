export interface PlacedVehicle {
  vehicleId: string;
  /** 左上セルの列 */
  col: number;
  /** 左上セルの行 */
  row: number;
  /** 90度回転しているか */
  rotated: boolean;
  /** 回転後の列方向セル数 */
  effectiveCols: number;
  /** 回転後の行方向セル数 */
  effectiveRows: number;
}

export interface PlacementResult {
  success: boolean;
  placements: PlacedVehicle[];
  /** 配置できなかった車両ID */
  unplacedIds: string[];
  /** 面積利用率 (0-100) */
  utilizationPercent: number;
}

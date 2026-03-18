import { cellKey } from "../models/parking-lot";
import { PlacedVehicle } from "../models/placement";

/** 占有グリッド: true = 空き */
export type OccupancyGrid = boolean[][];

/**
 * 配置ルールで必要なマージン（セル数）
 * 1セル = 50cm → 壁から50cm離す / 車両間50cm離す
 *
 * canPlace が車両+周囲marginセルの空きを検査することで:
 * - 壁マージン: 非アクティブセル/グリッド境界から margin セル離れる
 * - 車両間マージン: 占有セルから margin セル離れる
 * markPlacement は車両本体のみマーク（バッファを付けない）。
 * こうすることで車両間の実距離はちょうど margin セル（50cm）になる。
 */
export const PLACEMENT_MARGIN = 1;

/** 占有グリッドを構築 */
export function buildOccupancyGrid(
  cols: number,
  rows: number,
  activeCells: [number, number][],
  existingPlacements: PlacedVehicle[]
): OccupancyGrid {
  const grid: OccupancyGrid = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  );

  // アクティブセルを空きにする
  const activeSet = new Set(activeCells.map(([c, r]) => cellKey(c, r)));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      grid[r][c] = activeSet.has(cellKey(c, r));
    }
  }

  // 既存配置分を埋める（本体のみ、マージンなし）
  for (const p of existingPlacements) {
    markPlacement(grid, p.col, p.row, p.effectiveCols, p.effectiveRows);
  }

  return grid;
}

/**
 * 指定位置に車両を配置可能かチェック（マージン付き）
 *
 * 車両本体 + 周囲 margin セルがすべて空き（true）であることを要求。
 * - 壁マージン: マージン範囲が非アクティブセルやグリッド外に重なるとNG
 * - 車両間マージン: 近くの車両が占有しているとマージン範囲内でNG
 */
export function canPlace(
  grid: OccupancyGrid,
  col: number,
  row: number,
  w: number,
  h: number,
  margin: number = PLACEMENT_MARGIN
): boolean {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  const startR = row - margin;
  const endR = row + h + margin;
  const startC = col - margin;
  const endC = col + w + margin;

  if (startR < 0 || endR > rows || startC < 0 || endC > cols) return false;

  for (let r = startR; r < endR; r++) {
    for (let c = startC; c < endC; c++) {
      if (!grid[r][c]) return false;
    }
  }
  return true;
}

/** 配置のスコアを計算（高い方が良い） */
export function scorePosition(
  _grid: OccupancyGrid,
  col: number,
  row: number,
  _w: number,
  _h: number
): number {
  let score = 0;
  // 左上に寄せる
  score -= row * 0.5 + col * 0.05;
  return score;
}

/**
 * グリッドに配置をマーク（車両本体のみ）
 *
 * マージンバッファは付けない。canPlace のマージン検査で
 * 車両間50cm（1セル）の間隔を自然に保証する。
 */
export function markPlacement(
  grid: OccupancyGrid,
  col: number,
  row: number,
  w: number,
  h: number
): void {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  for (let r = row; r < Math.min(rows, row + h); r++) {
    for (let c = col; c < Math.min(cols, col + w); c++) {
      grid[r][c] = false;
    }
  }
}

interface VehicleToPlace {
  id: string;
  lengthCells: number;
  widthCells: number;
}

export interface PackResult {
  placed: PlacedVehicle[];
  unplacedIds: string[];
}

/** 貪欲法で車両を配置（マージンルール適用） */
export function greedyPack(
  grid: OccupancyGrid,
  vehiclesToPlace: VehicleToPlace[],
  margin: number = PLACEMENT_MARGIN
): PackResult {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  // 面積降順でソート
  const sorted = [...vehiclesToPlace].sort(
    (a, b) => b.lengthCells * b.widthCells - a.lengthCells * a.widthCells
  );

  const placed: PlacedVehicle[] = [];
  const unplacedIds: string[] = [];

  for (const vehicle of sorted) {
    let bestScore = -Infinity;
    let bestPos: { col: number; row: number; rotated: boolean } | null = null;

    const orientations: [number, number, boolean][] = [
      [vehicle.lengthCells, vehicle.widthCells, false],
      [vehicle.widthCells, vehicle.lengthCells, true],
    ];

    for (const [w, h, rotated] of orientations) {
      for (let r = 0; r <= rows - h; r++) {
        for (let c = 0; c <= cols - w; c++) {
          if (canPlace(grid, c, r, w, h, margin)) {
            const score = scorePosition(grid, c, r, w, h);
            if (score > bestScore) {
              bestScore = score;
              bestPos = { col: c, row: r, rotated };
            }
          }
        }
      }
    }

    if (bestPos) {
      const w = bestPos.rotated ? vehicle.widthCells : vehicle.lengthCells;
      const h = bestPos.rotated ? vehicle.lengthCells : vehicle.widthCells;
      // 車両本体のみマーク（マージンバッファなし）
      markPlacement(grid, bestPos.col, bestPos.row, w, h);
      placed.push({
        vehicleId: vehicle.id,
        col: bestPos.col,
        row: bestPos.row,
        rotated: bestPos.rotated,
        effectiveCols: w,
        effectiveRows: h,
      });
    } else {
      unplacedIds.push(vehicle.id);
    }
  }

  return { placed, unplacedIds };
}

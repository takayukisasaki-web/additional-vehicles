import { describe, it, expect } from "vitest";
import {
  buildOccupancyGrid,
  canPlace,
  greedyPack,
  markPlacement,
  PLACEMENT_MARGIN,
} from "../../src/lib/algorithm/bin-pack-grid";

describe("PLACEMENT_MARGIN", () => {
  it("should be 1 (50cm = 1 cell)", () => {
    expect(PLACEMENT_MARGIN).toBe(1);
  });
});

describe("canPlace with margin", () => {
  const makeGrid = (rows: number, cols: number) =>
    Array.from({ length: rows }, () => Array(cols).fill(true));

  it("should reject placement at row=0 (too close to top wall)", () => {
    const grid = makeGrid(6, 6);
    expect(canPlace(grid, 1, 0, 2, 2, 1)).toBe(false);
  });

  it("should reject placement at col=0 (too close to left wall)", () => {
    const grid = makeGrid(6, 6);
    expect(canPlace(grid, 0, 1, 2, 2, 1)).toBe(false);
  });

  it("should reject placement at bottom edge", () => {
    const grid = makeGrid(6, 6);
    expect(canPlace(grid, 1, 4, 2, 2, 1)).toBe(false);
  });

  it("should reject placement at right edge", () => {
    const grid = makeGrid(6, 6);
    expect(canPlace(grid, 4, 1, 2, 2, 1)).toBe(false);
  });

  it("should allow placement with proper wall margin", () => {
    const grid = makeGrid(6, 6);
    expect(canPlace(grid, 1, 1, 2, 2, 1)).toBe(true);
  });

  it("should allow placement with margin=0 at edge", () => {
    const grid = makeGrid(4, 4);
    expect(canPlace(grid, 0, 0, 2, 2, 0)).toBe(true);
  });
});

describe("markPlacement (vehicle body only, no buffer)", () => {
  it("should mark only the vehicle cells as occupied", () => {
    const grid = Array.from({ length: 6 }, () => Array(6).fill(true));
    markPlacement(grid, 2, 2, 2, 1);

    // 車両本体はfalse
    expect(grid[2][2]).toBe(false);
    expect(grid[2][3]).toBe(false);
    // 周囲はtrue（バッファなし）
    expect(grid[1][2]).toBe(true);
    expect(grid[1][3]).toBe(true);
    expect(grid[2][1]).toBe(true);
    expect(grid[2][4]).toBe(true);
    expect(grid[3][2]).toBe(true);
    expect(grid[3][3]).toBe(true);
  });
});

describe("greedyPack - vehicle gap is exactly 1 cell (50cm)", () => {
  it("should place two vehicles with exactly 1-cell gap", () => {
    // 10x4 全アクティブ、margin=1
    // 有効配置領域: col 1~8, row 1~2 (壁マージン除く)
    const grid = Array.from({ length: 4 }, () => Array(10).fill(true));
    const result = greedyPack(
      grid,
      [
        { id: "v1", lengthCells: 3, widthCells: 1 },
        { id: "v2", lengthCells: 3, widthCells: 1 },
      ],
      1
    );
    expect(result.placed).toHaveLength(2);

    // 面積降順 → 同面積なので順序通り v1, v2
    const p1 = result.placed.find((p) => p.vehicleId === "v1")!;
    const p2 = result.placed.find((p) => p.vehicleId === "v2")!;

    // 同じ行に並ぶ場合、間隔は1セル（50cm）
    if (p1.row === p2.row) {
      const gap =
        Math.max(p1.col, p2.col) -
        Math.min(p1.col + p1.effectiveCols, p2.col + p2.effectiveCols);
      expect(gap).toBe(1); // ちょうど1セル = 50cm
    }
    // 別の行に並ぶ場合、行間隔は1セル
    if (p1.col === p2.col) {
      const gap =
        Math.max(p1.row, p2.row) -
        Math.min(p1.row + p1.effectiveRows, p2.row + p2.effectiveRows);
      expect(gap).toBeGreaterThanOrEqual(1);
    }
  });

  it("should fail when grid too small for vehicle + wall margins", () => {
    // 4x4, margin=1 → 有効は2x2 → 3x3車両は入らない
    const grid = Array.from({ length: 4 }, () => Array(4).fill(true));
    const result = greedyPack(
      grid,
      [{ id: "v1", lengthCells: 3, widthCells: 3 }],
      1
    );
    expect(result.placed).toHaveLength(0);
    expect(result.unplacedIds).toEqual(["v1"]);
  });

  it("should place small vehicle in minimal space", () => {
    // 3x3, margin=1 → 有効は1x1 → 1x1車両は入る
    const grid = Array.from({ length: 3 }, () => Array(3).fill(true));
    const result = greedyPack(
      grid,
      [{ id: "v1", lengthCells: 1, widthCells: 1 }],
      1
    );
    expect(result.placed).toHaveLength(1);
    expect(result.placed[0].col).toBe(1);
    expect(result.placed[0].row).toBe(1);
  });

  it("should fit 3 vehicles in a row with 1-cell gaps", () => {
    // 13x3 grid, margin=1
    // 有効列: 1~11 (11列), 有効行: 1 (1行)
    // 3x1車両 × 3台: (3+1) + (3+1) + 3 = 11 → ぴったり入る
    const grid = Array.from({ length: 3 }, () => Array(13).fill(true));
    const result = greedyPack(
      grid,
      [
        { id: "v1", lengthCells: 3, widthCells: 1 },
        { id: "v2", lengthCells: 3, widthCells: 1 },
        { id: "v3", lengthCells: 3, widthCells: 1 },
      ],
      1
    );
    expect(result.placed).toHaveLength(3);
    expect(result.unplacedIds).toHaveLength(0);
  });
});

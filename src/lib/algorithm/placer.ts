import { ParkingLotData } from "../models/parking-lot";
import { Vehicle } from "../models/vehicle";
import { PlacedVehicle, PlacementResult } from "../models/placement";
import { buildOccupancyGrid, greedyPack, PLACEMENT_MARGIN } from "./bin-pack-grid";

/**
 * 自動配置を実行
 * existing車両の既存配置を維持しつつ、new車両を配置する
 */
export function runAutoPlacement(
  parkingLot: ParkingLotData,
  vehicles: Vehicle[],
  currentPlacements: PlacedVehicle[]
): PlacementResult {
  const existingVehicles = vehicles.filter((v) => v.status === "existing");
  const newVehicles = vehicles.filter((v) => v.status === "new");

  const existingPlacementIds = new Set(existingVehicles.map((v) => v.id));
  const existingPlacements = currentPlacements.filter((p) =>
    existingPlacementIds.has(p.vehicleId)
  );

  // 占有グリッドを構築（既存車両は本体のみマーク）
  const grid = buildOccupancyGrid(
    parkingLot.cols,
    parkingLot.rows,
    parkingLot.activeCells,
    existingPlacements
  );

  // 新規車両を配置（canPlaceのマージン検査で壁50cm・車両間50cmを保証）
  const vehiclesToPlace = newVehicles.map((v) => ({
    id: v.id,
    lengthCells: v.dimensions.lengthCells,
    widthCells: v.dimensions.widthCells,
  }));

  const result = greedyPack(grid, vehiclesToPlace, PLACEMENT_MARGIN);

  const allPlacements = [...existingPlacements, ...result.placed];

  const totalActiveCells = parkingLot.activeCells.length;
  const usedCells = allPlacements.reduce(
    (sum, p) => sum + p.effectiveCols * p.effectiveRows,
    0
  );
  const utilizationPercent =
    totalActiveCells > 0
      ? Math.round((usedCells / totalActiveCells) * 100)
      : 0;

  return {
    success: result.unplacedIds.length === 0,
    placements: allPlacements,
    unplacedIds: result.unplacedIds,
    utilizationPercent,
  };
}

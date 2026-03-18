import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { ParkingLotData, createDefaultParkingLot, cellKey } from "./models/parking-lot";
import { Vehicle, VehicleMasterEntry, createDimensions } from "./models/vehicle";
import { PlacedVehicle, PlacementResult } from "./models/placement";
import { runAutoPlacement } from "./algorithm/placer";

export type WizardStep = 1 | 2 | 3;

interface AppState {
  // Wizard
  step: WizardStep;
  setStep: (step: WizardStep) => void;

  // Step 1: 駐車場
  parkingLot: ParkingLotData;
  setParkingLotName: (name: string) => void;
  setGridSize: (cols: number, rows: number) => void;
  toggleCell: (col: number, row: number) => void;
  setCell: (col: number, row: number, active: boolean) => void;
  setCells: (cells: [number, number][], active: boolean) => void;
  clearAllCells: () => void;
  fillRect: (
    col1: number,
    row1: number,
    col2: number,
    row2: number
  ) => void;

  // Step 2: 車両
  vehicles: Vehicle[];
  addVehicleFromMaster: (master: VehicleMasterEntry, status: Vehicle["status"]) => void;
  addCustomVehicle: (
    typeName: string,
    lengthCm: number,
    widthCm: number,
    status: Vehicle["status"]
  ) => void;
  removeVehicle: (id: string) => void;
  copyVehicle: (id: string) => void;
  updateVehicleStatus: (id: string, status: Vehicle["status"]) => void;

  // Step 3: 配置
  placements: PlacedVehicle[];
  placementResult: PlacementResult | null;
  executePlacement: () => void;
  setPlacement: (vehicleId: string, col: number, row: number, rotated: boolean) => void;
  removePlacement: (vehicleId: string) => void;
  clearPlacements: () => void;
}

function nextVehicleNumber(vehicles: Vehicle[]): number {
  if (vehicles.length === 0) return 1;
  return Math.max(...vehicles.map((v) => v.number)) + 1;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Wizard
      step: 1,
      setStep: (step) => set({ step }),

      // Step 1
      parkingLot: createDefaultParkingLot(uuidv4()),
      setParkingLotName: (name) =>
        set((s) => ({ parkingLot: { ...s.parkingLot, name } })),
      setGridSize: (cols, rows) =>
        set((s) => ({
          parkingLot: {
            ...s.parkingLot,
            cols: Math.max(1, cols),
            rows: Math.max(1, rows),
          },
        })),
      toggleCell: (col, row) =>
        set((s) => {
          const cells = new Set(
            s.parkingLot.activeCells.map(([c, r]) => cellKey(c, r))
          );
          const key = cellKey(col, row);
          let newCells: [number, number][];
          if (cells.has(key)) {
            newCells = s.parkingLot.activeCells.filter(
              ([c, r]) => !(c === col && r === row)
            );
          } else {
            newCells = [...s.parkingLot.activeCells, [col, row]];
          }
          return { parkingLot: { ...s.parkingLot, activeCells: newCells } };
        }),
      setCell: (col, row, active) =>
        set((s) => {
          const cells = new Set(
            s.parkingLot.activeCells.map(([c, r]) => cellKey(c, r))
          );
          const key = cellKey(col, row);
          const exists = cells.has(key);
          if (active && !exists) {
            return {
              parkingLot: {
                ...s.parkingLot,
                activeCells: [...s.parkingLot.activeCells, [col, row]],
              },
            };
          } else if (!active && exists) {
            return {
              parkingLot: {
                ...s.parkingLot,
                activeCells: s.parkingLot.activeCells.filter(
                  ([c, r]) => !(c === col && r === row)
                ),
              },
            };
          }
          return {};
        }),
      setCells: (cells, active) =>
        set((s) => {
          const existing = new Set(
            s.parkingLot.activeCells.map(([c, r]) => cellKey(c, r))
          );
          let newCells = [...s.parkingLot.activeCells];
          for (const [col, row] of cells) {
            const key = cellKey(col, row);
            if (active && !existing.has(key)) {
              newCells.push([col, row]);
              existing.add(key);
            } else if (!active && existing.has(key)) {
              newCells = newCells.filter(
                ([c, r]) => !(c === col && r === row)
              );
              existing.delete(key);
            }
          }
          return { parkingLot: { ...s.parkingLot, activeCells: newCells } };
        }),
      clearAllCells: () =>
        set((s) => ({
          parkingLot: { ...s.parkingLot, activeCells: [] },
        })),
      fillRect: (col1, row1, col2, row2) =>
        set((s) => {
          const minCol = Math.min(col1, col2);
          const maxCol = Math.max(col1, col2);
          const minRow = Math.min(row1, row2);
          const maxRow = Math.max(row1, row2);
          const existing = new Set(
            s.parkingLot.activeCells.map(([c, r]) => cellKey(c, r))
          );
          const newCells = [...s.parkingLot.activeCells];
          for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
              const key = cellKey(c, r);
              if (!existing.has(key)) {
                newCells.push([c, r]);
                existing.add(key);
              }
            }
          }
          return { parkingLot: { ...s.parkingLot, activeCells: newCells } };
        }),

      // Step 2
      vehicles: [],
      addVehicleFromMaster: (master, status) =>
        set((s) => ({
          vehicles: [
            ...s.vehicles,
            {
              id: uuidv4(),
              number: nextVehicleNumber(s.vehicles),
              typeName: master.typeName,
              dimensions: createDimensions(master.lengthCm, master.widthCm),
              status,
            },
          ],
        })),
      addCustomVehicle: (typeName, lengthCm, widthCm, status) =>
        set((s) => ({
          vehicles: [
            ...s.vehicles,
            {
              id: uuidv4(),
              number: nextVehicleNumber(s.vehicles),
              typeName,
              dimensions: createDimensions(lengthCm, widthCm),
              status,
            },
          ],
        })),
      removeVehicle: (id) =>
        set((s) => {
          const filtered = s.vehicles.filter((v) => v.id !== id);
          // 番号を振り直す
          const renumbered = filtered.map((v, i) => ({ ...v, number: i + 1 }));
          return {
            vehicles: renumbered,
            placements: s.placements.filter((p) => p.vehicleId !== id),
          };
        }),
      copyVehicle: (id) =>
        set((s) => {
          const source = s.vehicles.find((v) => v.id === id);
          if (!source) return {};
          return {
            vehicles: [
              ...s.vehicles,
              {
                ...source,
                id: uuidv4(),
                number: nextVehicleNumber(s.vehicles),
              },
            ],
          };
        }),
      updateVehicleStatus: (id, status) =>
        set((s) => ({
          vehicles: s.vehicles.map((v) =>
            v.id === id ? { ...v, status } : v
          ),
        })),

      // Step 3
      placements: [],
      placementResult: null,
      executePlacement: () => {
        const state = get();
        const result = runAutoPlacement(
          state.parkingLot,
          state.vehicles,
          state.placements
        );
        set({
          placements: result.placements,
          placementResult: result,
        });
      },
      setPlacement: (vehicleId, col, row, rotated) =>
        set((s) => {
          const vehicle = s.vehicles.find((v) => v.id === vehicleId);
          if (!vehicle) return {};
          const effectiveCols = rotated
            ? vehicle.dimensions.widthCells
            : vehicle.dimensions.lengthCells;
          const effectiveRows = rotated
            ? vehicle.dimensions.lengthCells
            : vehicle.dimensions.widthCells;
          const existing = s.placements.filter(
            (p) => p.vehicleId !== vehicleId
          );
          return {
            placements: [
              ...existing,
              { vehicleId, col, row, rotated, effectiveCols, effectiveRows },
            ],
          };
        }),
      removePlacement: (vehicleId) =>
        set((s) => ({
          placements: s.placements.filter((p) => p.vehicleId !== vehicleId),
        })),
      clearPlacements: () => set({ placements: [], placementResult: null }),
    }),
    {
      name: "zosha-todoke-storage",
      partialize: (state) => ({
        parkingLot: state.parkingLot,
        vehicles: state.vehicles,
        placements: state.placements,
        step: state.step,
      }),
    }
  )
);

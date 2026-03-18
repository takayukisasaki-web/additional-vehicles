"use client";

import { useState } from "react";
import ParkingLotCanvas, { DrawMode } from "../grid/ParkingLotCanvas";
import { useAppStore } from "@/lib/store";

type DrawModeOption = { mode: DrawMode; label: string; desc: string };

const DRAW_MODES: DrawModeOption[] = [
  { mode: "draw", label: "描画", desc: "クリック/ドラッグで塗りつぶし" },
  { mode: "erase", label: "消去", desc: "クリック/ドラッグで消去" },
  { mode: "rect", label: "矩形", desc: "ドラッグで矩形範囲を塗りつぶし" },
];

export default function Step1ParkingLot() {
  const [drawMode, setDrawMode] = useState<DrawMode>("draw");
  const { parkingLot, setParkingLotName, setGridSize, clearAllCells } =
    useAppStore();

  return (
    <div className="space-y-2">
      {/* ツールバー1行 */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-lg border border-gray-200 px-3 py-2">
        <label className="text-sm text-gray-600">駐車場名:</label>
        <input
          type="text"
          value={parkingLot.name}
          onChange={(e) => setParkingLotName(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm w-36"
          placeholder="駐車場名"
        />

        <div className="w-px h-5 bg-gray-300" />

        <div className="flex gap-1">
          {DRAW_MODES.map(({ mode, label, desc }) => (
            <button
              key={mode}
              onClick={() => setDrawMode(mode)}
              title={desc}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                drawMode === mode
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-300" />

        <div className="flex items-center gap-1.5 text-sm">
          <label className="text-gray-600">列:</label>
          <input
            type="number"
            min={1}
            max={80}
            value={parkingLot.cols}
            onChange={(e) =>
              setGridSize(parseInt(e.target.value) || 1, parkingLot.rows)
            }
            className="w-14 px-1.5 py-1 border border-gray-300 rounded text-center text-sm"
          />
          <label className="text-gray-600">行:</label>
          <input
            type="number"
            min={1}
            max={80}
            value={parkingLot.rows}
            onChange={(e) =>
              setGridSize(parkingLot.cols, parseInt(e.target.value) || 1)
            }
            className="w-14 px-1.5 py-1 border border-gray-300 rounded text-center text-sm"
          />
        </div>

        <div className="w-px h-5 bg-gray-300" />

        <button
          onClick={clearAllCells}
          className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
        >
          全消去
        </button>

        <span className="ml-auto text-sm text-gray-500">
          {parkingLot.activeCells.length}セル（
          {(parkingLot.activeCells.length * 0.25).toFixed(1)}m²）| 1セル=50cm
        </span>
      </div>

      {/* グリッド */}
      <div className="overflow-auto border border-gray-200 rounded-lg p-1 bg-white">
        <ParkingLotCanvas drawMode={drawMode} cellSize={16} />
      </div>
    </div>
  );
}

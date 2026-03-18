"use client";

import { DrawMode } from "./ParkingLotCanvas";
import { useAppStore } from "@/lib/store";

interface Props {
  drawMode: DrawMode;
  onDrawModeChange: (mode: DrawMode) => void;
}

export default function GridToolbar({ drawMode, onDrawModeChange }: Props) {
  const { parkingLot, setGridSize, clearAllCells } = useAppStore();

  const modes: { mode: DrawMode; label: string; desc: string }[] = [
    { mode: "draw", label: "描画", desc: "クリック/ドラッグで塗りつぶし" },
    { mode: "erase", label: "消去", desc: "クリック/ドラッグで消去" },
    { mode: "rect", label: "矩形", desc: "ドラッグで矩形範囲を塗りつぶし" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
      {/* 描画モード */}
      <div className="flex gap-1">
        {modes.map(({ mode, label, desc }) => (
          <button
            key={mode}
            onClick={() => onDrawModeChange(mode)}
            title={desc}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              drawMode === mode
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* グリッドサイズ */}
      <div className="flex items-center gap-2 text-sm">
        <label className="text-gray-600">列:</label>
        <input
          type="number"
          min={1}
          max={50}
          value={parkingLot.cols}
          onChange={(e) =>
            setGridSize(parseInt(e.target.value) || 1, parkingLot.rows)
          }
          className="w-14 px-2 py-1 border border-gray-300 rounded text-center"
        />
        <label className="text-gray-600">行:</label>
        <input
          type="number"
          min={1}
          max={50}
          value={parkingLot.rows}
          onChange={(e) =>
            setGridSize(parkingLot.cols, parseInt(e.target.value) || 1)
          }
          className="w-14 px-2 py-1 border border-gray-300 rounded text-center"
        />
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* クリアボタン */}
      <button
        onClick={clearAllCells}
        className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
      >
        全消去
      </button>

      {/* セル数表示 */}
      <span className="ml-auto text-sm text-gray-500">
        {parkingLot.activeCells.length} セル（
        {(parkingLot.activeCells.length * 0.25).toFixed(1)} m²）
      </span>
    </div>
  );
}

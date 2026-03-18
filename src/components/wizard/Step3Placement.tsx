"use client";

import { useState, useMemo } from "react";
import ParkingLotCanvas from "../grid/ParkingLotCanvas";
import PlacementControls from "../placement/PlacementControls";
import { useAppStore } from "@/lib/store";
import { generatePdf } from "@/lib/pdf/generate";
import { buildTypeColorMap } from "@/lib/vehicle-colors";

export default function Step3Placement() {
  const { parkingLot, vehicles, placements } = useAppStore();
  const [generating, setGenerating] = useState(false);
  const typeColorMap = useMemo(() => buildTypeColorMap(vehicles), [vehicles]);

  const existingVehicles = vehicles.filter((v) => v.status === "existing");
  const newVehicles = vehicles.filter((v) => v.status === "new");

  const handleGeneratePdf = async () => {
    setGenerating(true);
    try {
      const pdfBytes = await generatePdf(parkingLot, vehicles, placements);
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${parkingLot.name || "増車配置"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF生成エラー:", err);
      alert("PDF生成中にエラーが発生しました");
    } finally {
      setGenerating(false);
    }
  };

  const renderList = (
    list: typeof vehicles,
    label: string,
    color: string
  ) => {
    if (list.length === 0) return null;
    return (
      <div className="space-y-1">
        <h4 className={`text-xs font-medium px-2 py-0.5 rounded ${color}`}>
          {label}（{list.length}台）
        </h4>
        {list.map((v) => (
          <div
            key={v.id}
            className="flex items-center gap-1.5 px-2 py-1 bg-white rounded border border-gray-200"
          >
            <span
              className="w-5 h-5 flex items-center justify-center rounded text-xs font-bold shrink-0"
              style={{ backgroundColor: typeColorMap.get(v.typeName)?.fill ?? "#e5e7eb" }}
            >
              {v.number}
            </span>
            <span className="text-sm font-medium">{v.typeName}</span>
            <span className="text-xs text-gray-400 ml-auto shrink-0">
              {v.dimensions.lengthCm}x{v.dimensions.widthCm}cm
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr_300px] gap-3">
      {/* 左: 配置操作 */}
      <div className="space-y-3">
        <PlacementControls />
        <button
          onClick={handleGeneratePdf}
          disabled={generating || placements.length === 0}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
        >
          {generating ? "PDF生成中..." : "PDF出力"}
        </button>
      </div>

      {/* 中央: 配置プレビュー */}
      <div className="overflow-auto border border-gray-200 rounded-lg p-1 bg-white">
        <ParkingLotCanvas
          drawMode="none"
          cellSize={16}
          showVehicles={true}
        />
      </div>

      {/* 右: 登録車両一覧 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 border-b pb-1">
          登録車両一覧
        </h3>
        <div className="text-sm text-gray-600">
          合計: {vehicles.length}台（既存{existingVehicles.length} / 増車{newVehicles.length}）
        </div>
        {renderList(existingVehicles, "既存車両", "bg-gray-100 text-gray-700")}
        {renderList(newVehicles, "増車車両", "bg-yellow-100 text-yellow-800")}
      </div>
    </div>
  );
}

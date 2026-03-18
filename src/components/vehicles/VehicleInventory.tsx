"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { buildTypeColorMap } from "@/lib/vehicle-colors";

export default function VehicleInventory() {
  const { vehicles, removeVehicle, copyVehicle, updateVehicleStatus } =
    useAppStore();
  const typeColorMap = useMemo(() => buildTypeColorMap(vehicles), [vehicles]);

  if (vehicles.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        車両が登録されていません
      </div>
    );
  }

  const existingVehicles = vehicles.filter((v) => v.status === "existing");
  const newVehicles = vehicles.filter((v) => v.status === "new");

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
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">{v.typeName}</span>
              <span className="text-xs text-gray-400 ml-1">
                {v.dimensions.lengthCm}x{v.dimensions.widthCm}cm
              </span>
            </div>
            <button
              onClick={() => copyVehicle(v.id)}
              className="px-1.5 py-0.5 text-xs rounded border border-blue-300 text-blue-600 hover:bg-blue-50 shrink-0"
              title="車両コピー"
            >
              コピー
            </button>
            <button
              onClick={() =>
                updateVehicleStatus(
                  v.id,
                  v.status === "existing" ? "new" : "existing"
                )
              }
              className="px-1.5 py-0.5 text-xs rounded border border-gray-300 hover:bg-gray-100 shrink-0"
              title="区分切替"
            >
              {v.status === "existing" ? "既存" : "増車"}
            </button>
            <button
              onClick={() => removeVehicle(v.id)}
              className="text-red-400 hover:text-red-600 text-sm shrink-0"
              title="削除"
            >
              x
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">
        合計: {vehicles.length}台（既存{existingVehicles.length} / 増車
        {newVehicles.length}）
      </div>
      {renderList(existingVehicles, "既存車両", "bg-gray-100 text-gray-700")}
      {renderList(newVehicles, "増車車両", "bg-yellow-100 text-yellow-800")}
    </div>
  );
}

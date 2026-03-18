"use client";

import { VEHICLE_MASTER } from "@/lib/vehicle-master";
import { VehicleMasterEntry } from "@/lib/models/vehicle";
import { useAppStore } from "@/lib/store";
import { Vehicle } from "@/lib/models/vehicle";
import { useState } from "react";
import VehicleSizePreview from "./VehicleSizePreview";

interface Props {
  defaultStatus?: Vehicle["status"];
}

export default function VehicleMasterList({ defaultStatus = "new" }: Props) {
  const { addVehicleFromMaster } = useAppStore();
  const [status, setStatus] = useState<Vehicle["status"]>(defaultStatus);
  const [selected, setSelected] = useState<VehicleMasterEntry | null>(null);

  const handleClick = (master: VehicleMasterEntry) => {
    setSelected(master);
  };

  const handleAdd = () => {
    if (selected) {
      addVehicleFromMaster(selected, status);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <label className="text-gray-600">区分:</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Vehicle["status"])}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="existing">既存車両</option>
          <option value="new">増車</option>
        </select>
        {selected && (
          <button
            onClick={handleAdd}
            className="ml-auto px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          >
            「{selected.typeName}」を追加
          </button>
        )}
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-3">
        {/* 左: 車種リスト（コンパクト） */}
        <div className="grid grid-cols-1 gap-1 content-start">
          {VEHICLE_MASTER.map((master) => (
            <button
              key={master.id}
              onClick={() => handleClick(master)}
              onDoubleClick={() => {
                setSelected(master);
                addVehicleFromMaster(master, status);
              }}
              className={`px-2 py-1.5 text-left rounded border transition-colors ${
                selected?.id === master.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-sm">{master.typeName}</span>
                <span className="text-xs text-gray-400 shrink-0">
                  {master.lengthCm}x{master.widthCm}cm
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* 右: サイズプレビュー（大きく） */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-sm text-gray-600 font-medium">サイズプレビュー</div>
          {selected ? (
            <VehicleSizePreview
              lengthCells={selected.lengthCells}
              widthCells={selected.widthCells}
              label={selected.typeName}
            />
          ) : (
            <div className="w-full h-[364px] border border-dashed border-gray-300 rounded flex items-center justify-center text-sm text-gray-400 bg-gray-50">
              車種を選択するとプレビューが表示されます
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Vehicle, cmToCells } from "@/lib/models/vehicle";

export default function VehicleCustomForm() {
  const { addCustomVehicle } = useAppStore();
  const [typeName, setTypeName] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [widthCm, setWidthCm] = useState("");
  const [status, setStatus] = useState<Vehicle["status"]>("new");

  const lengthVal = parseInt(lengthCm) || 0;
  const widthVal = parseInt(widthCm) || 0;
  const isValid = typeName.trim() && lengthVal > 0 && widthVal > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    addCustomVehicle(typeName.trim(), lengthVal, widthVal, status);
    setTypeName("");
    setLengthCm("");
    setWidthCm("");
  };

  return (
    <form onSubmit={handleSubmit} className="p-2 bg-gray-50 rounded-lg space-y-2">
      <div>
        <label className="text-xs text-gray-500">車種名</label>
        <input
          type="text"
          placeholder="車種名"
          value={typeName}
          onChange={(e) => setTypeName(e.target.value)}
          className="block w-72 px-2 py-1 text-sm border border-gray-300 rounded"
        />
      </div>
      <div className="flex flex-nowrap items-end gap-2">
        <div className="shrink-0">
          <label className="text-xs text-gray-500">全長(cm){lengthVal > 0 ? ` … ${cmToCells(lengthVal)}セル` : ""}</label>
          <input
            type="number"
            placeholder="620"
            value={lengthCm}
            onChange={(e) => setLengthCm(e.target.value)}
            className="block w-20 px-2 py-1 text-sm border border-gray-300 rounded"
          />
        </div>
        <div className="shrink-0">
          <label className="text-xs text-gray-500">全幅(cm){widthVal > 0 ? ` … ${cmToCells(widthVal)}セル` : ""}</label>
          <input
            type="number"
            placeholder="215"
            value={widthCm}
            onChange={(e) => setWidthCm(e.target.value)}
            className="block w-20 px-2 py-1 text-sm border border-gray-300 rounded"
          />
        </div>
        <div className="shrink-0">
          <label className="text-xs text-gray-500">区分</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Vehicle["status"])}
            className="block w-16 px-1 py-1 text-sm border border-gray-300 rounded"
          >
            <option value="existing">既存</option>
            <option value="new">増車</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={!isValid}
          className="shrink-0 px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          追加
        </button>
      </div>
    </form>
  );
}

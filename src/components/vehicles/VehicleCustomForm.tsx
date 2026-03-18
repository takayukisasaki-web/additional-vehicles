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
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-2 bg-gray-50 rounded-lg">
      <div>
        <label className="text-xs text-gray-500">車種名</label>
        <input
          type="text"
          placeholder="車種名"
          value={typeName}
          onChange={(e) => setTypeName(e.target.value)}
          className="block w-28 px-2 py-1 text-sm border border-gray-300 rounded"
        />
      </div>
      <div>
        <label className="text-xs text-gray-500">全長(cm)</label>
        <input
          type="number"
          placeholder="620"
          value={lengthCm}
          onChange={(e) => setLengthCm(e.target.value)}
          className="block w-20 px-2 py-1 text-sm border border-gray-300 rounded"
        />
        {lengthVal > 0 && (
          <span className="text-xs text-gray-400">{cmToCells(lengthVal)}セル</span>
        )}
      </div>
      <div>
        <label className="text-xs text-gray-500">全幅(cm)</label>
        <input
          type="number"
          placeholder="215"
          value={widthCm}
          onChange={(e) => setWidthCm(e.target.value)}
          className="block w-20 px-2 py-1 text-sm border border-gray-300 rounded"
        />
        {widthVal > 0 && (
          <span className="text-xs text-gray-400">{cmToCells(widthVal)}セル</span>
        )}
      </div>
      <div>
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
        className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        追加
      </button>
    </form>
  );
}

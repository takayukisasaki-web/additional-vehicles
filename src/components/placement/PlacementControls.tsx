"use client";

import { useAppStore } from "@/lib/store";

export default function PlacementControls() {
  const { vehicles, executePlacement, clearPlacements, placementResult } =
    useAppStore();

  const newVehicles = vehicles.filter((v) => v.status === "new");
  const existingVehicles = vehicles.filter((v) => v.status === "existing");
  const hasVehicles = vehicles.length > 0;

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">
        既存: {existingVehicles.length}台 / 増車: {newVehicles.length}台
      </div>

      <div className="flex gap-2">
        <button
          onClick={executePlacement}
          disabled={!hasVehicles}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          自動配置実行
        </button>
        <button
          onClick={clearPlacements}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          リセット
        </button>
      </div>

      {placementResult && (
        <PlacementResultDisplay result={placementResult} />
      )}
    </div>
  );
}

function PlacementResultDisplay({
  result,
}: {
  result: NonNullable<ReturnType<typeof useAppStore.getState>["placementResult"]>;
}) {
  if (!result) return null;

  return (
    <div
      className={`p-3 rounded-lg border ${
        result.success
          ? "bg-green-50 border-green-300"
          : "bg-red-50 border-red-300"
      }`}
    >
      <div
        className={`font-medium text-sm ${
          result.success ? "text-green-800" : "text-red-800"
        }`}
      >
        {result.success
          ? "全車両の配置に成功しました"
          : `${result.unplacedIds.length}台の車両が配置できません`}
      </div>
      <div className="text-xs text-gray-600 mt-1">
        配置台数: {result.placements.length}台 / 面積利用率:{" "}
        {result.utilizationPercent}%
      </div>
    </div>
  );
}

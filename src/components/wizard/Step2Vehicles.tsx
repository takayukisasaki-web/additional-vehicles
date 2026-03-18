"use client";

import VehicleMasterList from "../vehicles/VehicleMasterList";
import VehicleCustomForm from "../vehicles/VehicleCustomForm";
import VehicleInventory from "../vehicles/VehicleInventory";

export default function Step2Vehicles() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
      {/* 左: 車両追加 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 border-b pb-1">
          車種マスタから追加（クリックで選択、ダブルクリックで即追加）
        </h3>
        <VehicleMasterList />

        <h3 className="text-sm font-medium text-gray-700 border-b pb-1">
          カスタム入力
        </h3>
        <VehicleCustomForm />
      </div>

      {/* 右: 車両一覧 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 border-b pb-1">
          登録車両一覧
        </h3>
        <VehicleInventory />
      </div>
    </div>
  );
}

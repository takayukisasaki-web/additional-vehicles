"use client";

import { useAppStore, WizardStep } from "@/lib/store";
import Step1ParkingLot from "@/components/wizard/Step1ParkingLot";
import Step2Vehicles from "@/components/wizard/Step2Vehicles";
import Step3Placement from "@/components/wizard/Step3Placement";

const STEPS: { step: WizardStep; title: string }[] = [
  { step: 1, title: "駐車場形状" },
  { step: 2, title: "車両登録" },
  { step: 3, title: "配置・出力" },
];

export default function Home() {
  const { step, setStep, parkingLot, vehicles } = useAppStore();

  const canGoNext = () => {
    if (step === 1) return parkingLot.activeCells.length > 0;
    if (step === 2) return vehicles.length > 0;
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ヘッダー + ステップタブ を1行に */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4">
        <h1 className="text-lg font-bold text-gray-800 shrink-0">
          増車届 図面作成ツール
        </h1>

        <nav className="flex gap-1 ml-4">
          {STEPS.map(({ step: s, title }) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
                step === s
                  ? "bg-blue-50 border border-blue-500 font-medium"
                  : "bg-gray-50 border border-transparent hover:bg-gray-100"
              }`}
            >
              <span
                className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${
                  step === s
                    ? "bg-blue-600 text-white"
                    : step > s
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-white"
                }`}
              >
                {step > s ? "\u2713" : s}
              </span>
              {title}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setStep((step - 1) as WizardStep)}
            disabled={step === 1}
            className="px-4 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            前へ
          </button>
          <button
            onClick={() => setStep((step + 1) as WizardStep)}
            disabled={step === 3 || !canGoNext()}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            次へ
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-3 overflow-auto">
        {step === 1 && <Step1ParkingLot />}
        {step === 2 && <Step2Vehicles />}
        {step === 3 && <Step3Placement />}
      </main>
    </div>
  );
}

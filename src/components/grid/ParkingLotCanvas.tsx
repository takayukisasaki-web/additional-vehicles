"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { cellKey } from "@/lib/models/parking-lot";
import { Vehicle } from "@/lib/models/vehicle";
import { buildTypeColorMap } from "@/lib/vehicle-colors";

/** 描画モード */
export type DrawMode = "draw" | "erase" | "rect" | "none";

interface Props {
  drawMode: DrawMode;
  cellSize?: number;
  showVehicles?: boolean;
  onCellHover?: (col: number, row: number) => void;
  onVehicleDragStart?: (vehicleId: string) => void;
}

/** 色定義 */
const COLORS = {
  background: "#ffffff",
  gridLine: "#cccccc",
  activeCell: "#e8e8e8",
  activeBorder: "#333333",
  vehicleFill: "#ffff00",
  vehicleBorder: "#999900",
  vehicleText: "#333333",
  hoverCell: "rgba(100, 150, 255, 0.3)",
  headerBg: "#f0f0f0",
  headerText: "#666666",
  meterBg: "#e0e8f0",
  meterText: "#3366aa",
  meterLine: "#3366aa",
};

export default function ParkingLotCanvas({
  drawMode,
  cellSize = 16,
  showVehicles = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { parkingLot, setCell, vehicles, placements, fillRect } = useAppStore();
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingValue, setDrawingValue] = useState(true);
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);
  const [rectStart, setRectStart] = useState<[number, number] | null>(null);

  // ヘッダーサイズ: メーター表示 + セル番号
  const meterHeaderSize = 18;
  const cellHeaderSize = 20;
  const totalHeaderSize = meterHeaderSize + cellHeaderSize;

  const gridWidth = parkingLot.cols * cellSize;
  const gridHeight = parkingLot.rows * cellSize;
  const totalWidth = gridWidth + totalHeaderSize;
  const totalHeight = gridHeight + totalHeaderSize;

  const activeCellSet = new Set(
    parkingLot.activeCells.map(([c, r]) => cellKey(c, r))
  );

  const typeColorMap = useMemo(() => buildTypeColorMap(vehicles), [vehicles]);

  // グリッド領域の左上座標
  const gridOriginX = totalHeaderSize;
  const gridOriginY = totalHeaderSize;

  // マウス座標からセルを取得
  const getCellFromMouse = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): [number, number] | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX - gridOriginX;
      const y = (e.clientY - rect.top) * scaleY - gridOriginY;
      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);
      if (col < 0 || col >= parkingLot.cols || row < 0 || row >= parkingLot.rows)
        return null;
      return [col, row];
    },
    [cellSize, parkingLot.cols, parkingLot.rows, gridOriginX, gridOriginY]
  );

  // 描画
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // === ヘッダー背景 ===
    // メーター行（上）
    ctx.fillStyle = COLORS.meterBg;
    ctx.fillRect(gridOriginX, 0, gridWidth, meterHeaderSize);
    // メーター列（左）
    ctx.fillRect(0, gridOriginY, meterHeaderSize, gridHeight);
    // セル番号行（上）
    ctx.fillStyle = COLORS.headerBg;
    ctx.fillRect(gridOriginX, meterHeaderSize, gridWidth, cellHeaderSize);
    // セル番号列（左）
    ctx.fillRect(meterHeaderSize, gridOriginY, cellHeaderSize, gridHeight);
    // 左上コーナー
    ctx.fillStyle = COLORS.meterBg;
    ctx.fillRect(0, 0, meterHeaderSize, meterHeaderSize);
    ctx.fillStyle = COLORS.headerBg;
    ctx.fillRect(meterHeaderSize, meterHeaderSize, cellHeaderSize, cellHeaderSize);

    // === メーター表示（上側 - 2セルごとに1m）===
    ctx.fillStyle = COLORS.meterText;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const meterFontSize = Math.max(7, Math.min(11, meterHeaderSize * 0.6));
    ctx.font = `bold ${meterFontSize}px sans-serif`;
    for (let m = 0; m * 2 < parkingLot.cols; m++) {
      const startCol = m * 2;
      const spanCols = Math.min(2, parkingLot.cols - startCol);
      const x = gridOriginX + startCol * cellSize + (spanCols * cellSize) / 2;
      ctx.fillText(`${m + 1}`, x, meterHeaderSize / 2);
    }

    // === メーター表示（左側 - 2セルごとに1m）===
    for (let m = 0; m * 2 < parkingLot.rows; m++) {
      const startRow = m * 2;
      const spanRows = Math.min(2, parkingLot.rows - startRow);
      const y = gridOriginY + startRow * cellSize + (spanRows * cellSize) / 2;
      ctx.fillText(`${m + 1}`, meterHeaderSize / 2, y);
    }

    // メーター区切り線（上側）
    ctx.strokeStyle = COLORS.meterLine;
    ctx.lineWidth = 0.5;
    for (let m = 0; m * 2 <= parkingLot.cols; m++) {
      const x = gridOriginX + m * 2 * cellSize;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, meterHeaderSize);
      ctx.stroke();
    }
    // メーター区切り線（左側）
    for (let m = 0; m * 2 <= parkingLot.rows; m++) {
      const y = gridOriginY + m * 2 * cellSize;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(meterHeaderSize, y);
      ctx.stroke();
    }

    // === セル番号（上側 - 列番号）===
    ctx.fillStyle = COLORS.headerText;
    const cellFontSize = Math.max(6, Math.min(10, cellSize * 0.65));
    ctx.font = `${cellFontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let c = 0; c < parkingLot.cols; c++) {
      ctx.fillText(
        String(c + 1),
        gridOriginX + c * cellSize + cellSize / 2,
        meterHeaderSize + cellHeaderSize / 2
      );
    }

    // === セル番号（左側 - 行番号）===
    for (let r = 0; r < parkingLot.rows; r++) {
      ctx.fillText(
        String(r + 1),
        meterHeaderSize + cellHeaderSize / 2,
        gridOriginY + r * cellSize + cellSize / 2
      );
    }

    // === アクティブセル塗りつぶし ===
    for (const [c, r] of parkingLot.activeCells) {
      ctx.fillStyle = COLORS.activeCell;
      ctx.fillRect(
        gridOriginX + c * cellSize,
        gridOriginY + r * cellSize,
        cellSize,
        cellSize
      );
    }

    // === 車両描画 ===
    if (showVehicles) {
      const vehicleMap = new Map<string, Vehicle>();
      for (const v of vehicles) vehicleMap.set(v.id, v);

      for (const p of placements) {
        const vehicle = vehicleMap.get(p.vehicleId);
        if (!vehicle) continue;
        const x = gridOriginX + p.col * cellSize;
        const y = gridOriginY + p.row * cellSize;
        const w = p.effectiveCols * cellSize;
        const h = p.effectiveRows * cellSize;

        // 車種別カラー
        const typeColor = typeColorMap.get(vehicle.typeName);
        const fillColor = typeColor?.fill ?? COLORS.vehicleFill;
        const borderColor = typeColor?.border ?? COLORS.vehicleBorder;

        // 背景
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);

        // 枠線
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, w, h);

        // セル内の50表示
        ctx.fillStyle = COLORS.vehicleText;
        const cellTextSize = Math.max(5, Math.min(9, cellSize * 0.5));
        ctx.font = `${cellTextSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let dr = 0; dr < p.effectiveRows; dr++) {
          for (let dc = 0; dc < p.effectiveCols; dc++) {
            ctx.fillText(
              "50",
              x + dc * cellSize + cellSize / 2,
              y + dr * cellSize + cellSize / 2
            );
          }
        }

        // 車両番号（中央に大きく）
        ctx.fillStyle = COLORS.vehicleText;
        const numSize = Math.max(10, Math.min(24, cellSize * 1.2));
        ctx.font = `bold ${numSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(vehicle.number), x + w / 2, y + h / 2);
      }
    }

    // === グリッド線 ===
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= parkingLot.cols; c++) {
      ctx.beginPath();
      ctx.moveTo(gridOriginX + c * cellSize, gridOriginY);
      ctx.lineTo(gridOriginX + c * cellSize, gridOriginY + gridHeight);
      ctx.stroke();
    }
    for (let r = 0; r <= parkingLot.rows; r++) {
      ctx.beginPath();
      ctx.moveTo(gridOriginX, gridOriginY + r * cellSize);
      ctx.lineTo(gridOriginX + gridWidth, gridOriginY + r * cellSize);
      ctx.stroke();
    }

    // === 駐車場境界線（太線）===
    ctx.strokeStyle = COLORS.activeBorder;
    ctx.lineWidth = 2;
    for (const [c, r] of parkingLot.activeCells) {
      const x = gridOriginX + c * cellSize;
      const y = gridOriginY + r * cellSize;
      if (!activeCellSet.has(cellKey(c, r - 1))) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + cellSize, y);
        ctx.stroke();
      }
      if (!activeCellSet.has(cellKey(c, r + 1))) {
        ctx.beginPath();
        ctx.moveTo(x, y + cellSize);
        ctx.lineTo(x + cellSize, y + cellSize);
        ctx.stroke();
      }
      if (!activeCellSet.has(cellKey(c - 1, r))) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + cellSize);
        ctx.stroke();
      }
      if (!activeCellSet.has(cellKey(c + 1, r))) {
        ctx.beginPath();
        ctx.moveTo(x + cellSize, y);
        ctx.lineTo(x + cellSize, y + cellSize);
        ctx.stroke();
      }
    }

    // === ホバーセル ===
    if (hoverCell && drawMode !== "none") {
      const [hc, hr] = hoverCell;
      ctx.fillStyle = COLORS.hoverCell;
      if (drawMode === "rect" && rectStart) {
        const [sc, sr] = rectStart;
        const minC = Math.min(sc, hc);
        const maxC = Math.max(sc, hc);
        const minR = Math.min(sr, hr);
        const maxR = Math.max(sr, hr);
        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            ctx.fillRect(
              gridOriginX + c * cellSize,
              gridOriginY + r * cellSize,
              cellSize,
              cellSize
            );
          }
        }
      } else {
        ctx.fillRect(
          gridOriginX + hc * cellSize,
          gridOriginY + hr * cellSize,
          cellSize,
          cellSize
        );
      }
    }
  }, [
    parkingLot,
    activeCellSet,
    vehicles,
    placements,
    showVehicles,
    typeColorMap,
    cellSize,
    gridWidth,
    gridHeight,
    totalWidth,
    totalHeight,
    gridOriginX,
    gridOriginY,
    meterHeaderSize,
    cellHeaderSize,
    hoverCell,
    drawMode,
    rectStart,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawMode === "none") return;
    const cell = getCellFromMouse(e);
    if (!cell) return;
    const [col, row] = cell;

    if (drawMode === "rect") {
      setRectStart([col, row]);
      setIsDrawing(true);
      return;
    }

    const shouldActivate = drawMode === "draw";
    setDrawingValue(shouldActivate);
    setIsDrawing(true);
    setCell(col, row, shouldActivate);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCellFromMouse(e);
    setHoverCell(cell);

    if (!isDrawing || !cell) return;
    const [col, row] = cell;

    if (drawMode === "rect") return;
    setCell(col, row, drawingValue);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawMode === "rect" && rectStart && isDrawing) {
      const cell = getCellFromMouse(e);
      if (cell) {
        fillRect(rectStart[0], rectStart[1], cell[0], cell[1]);
      }
      setRectStart(null);
    }
    setIsDrawing(false);
  };

  const handleMouseLeave = () => {
    setHoverCell(null);
    if (isDrawing && drawMode !== "rect") {
      setIsDrawing(false);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={totalWidth}
      height={totalHeight}
      className="border border-gray-300 cursor-crosshair"
      style={{ maxWidth: "100%", height: "auto" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
}

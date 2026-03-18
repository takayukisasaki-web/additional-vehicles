"use client";

import { useRef, useEffect } from "react";

interface Props {
  lengthCells: number;
  widthCells: number;
  label?: string;
}

const PREVIEW_CELL = 18;
const PARKING_COLS = 30;
const PARKING_ROWS = 18;
const MARGIN = 40;

/** 車両サイズを簡易駐車場グリッド上にプレビュー表示 */
export default function VehicleSizePreview({
  lengthCells,
  widthCells,
  label,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasW = PARKING_COLS * PREVIEW_CELL + MARGIN;
  const canvasH = PARKING_ROWS * PREVIEW_CELL + MARGIN;
  const gridW = PARKING_COLS * PREVIEW_CELL;
  const gridH = PARKING_ROWS * PREVIEW_CELL;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasW, canvasH);

    // 駐車場背景
    ctx.fillStyle = "#f3f3f3";
    ctx.fillRect(0, 0, gridW, gridH);

    // グリッド線
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= PARKING_COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * PREVIEW_CELL, 0);
      ctx.lineTo(c * PREVIEW_CELL, gridH);
      ctx.stroke();
    }
    for (let r = 0; r <= PARKING_ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * PREVIEW_CELL);
      ctx.lineTo(gridW, r * PREVIEW_CELL);
      ctx.stroke();
    }

    // 車両配置（中央）
    const vx = Math.floor((PARKING_COLS - lengthCells) / 2);
    const vy = Math.floor((PARKING_ROWS - widthCells) / 2);
    const px = Math.max(0, vx) * PREVIEW_CELL;
    const py = Math.max(0, vy) * PREVIEW_CELL;
    const pw = Math.min(lengthCells, PARKING_COLS) * PREVIEW_CELL;
    const ph = Math.min(widthCells, PARKING_ROWS) * PREVIEW_CELL;

    ctx.fillStyle = "#ffff00";
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = "#999900";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px, py, pw, ph);

    // セル内に50
    ctx.fillStyle = "#888";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const drawCols = Math.min(lengthCells, PARKING_COLS);
    const drawRows = Math.min(widthCells, PARKING_ROWS);
    for (let dr = 0; dr < drawRows; dr++) {
      for (let dc = 0; dc < drawCols; dc++) {
        ctx.fillText(
          "50",
          px + dc * PREVIEW_CELL + PREVIEW_CELL / 2,
          py + dr * PREVIEW_CELL + PREVIEW_CELL / 2
        );
      }
    }

    // ラベル
    if (label) {
      ctx.font = "bold 14px sans-serif";
      const metrics = ctx.measureText(label);
      const lw = metrics.width + 16;
      const lh = 22;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillRect(px + pw / 2 - lw / 2, py + ph / 2 - lh / 2, lw, lh);
      ctx.fillStyle = "#222";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, px + pw / 2, py + ph / 2);
    }

    // 寸法線（下側: 全長）
    const dimY = py + ph + 14;
    ctx.strokeStyle = "#3366aa";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, dimY);
    ctx.lineTo(px + pw, dimY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px, dimY - 5);
    ctx.lineTo(px, dimY + 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px + pw, dimY - 5);
    ctx.lineTo(px + pw, dimY + 5);
    ctx.stroke();
    ctx.fillStyle = "#3366aa";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `${lengthCells * 50}cm (${(lengthCells * 50 / 100).toFixed(1)}m)`,
      px + pw / 2,
      dimY + 16
    );

    // 寸法線（右側: 全幅）
    const dimX = px + pw + 14;
    ctx.beginPath();
    ctx.moveTo(dimX, py);
    ctx.lineTo(dimX, py + ph);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dimX - 5, py);
    ctx.lineTo(dimX + 5, py);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dimX - 5, py + ph);
    ctx.lineTo(dimX + 5, py + ph);
    ctx.stroke();
    ctx.save();
    ctx.translate(dimX + 16, py + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(
      `${widthCells * 50}cm (${(widthCells * 50 / 100).toFixed(1)}m)`,
      0,
      0
    );
    ctx.restore();
  }, [lengthCells, widthCells, label, canvasW, canvasH, gridW, gridH]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasW}
      height={canvasH}
      className="border border-gray-200 rounded bg-white"
    />
  );
}

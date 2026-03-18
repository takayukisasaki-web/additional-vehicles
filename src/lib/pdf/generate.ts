import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { ParkingLotData, cellKey } from "../models/parking-lot";
import { Vehicle } from "../models/vehicle";
import { PlacedVehicle } from "../models/placement";
import { buildTypeColorMap } from "../vehicle-colors";

/** A4サイズ（ポイント） */
const A4_W = 595.28;
const A4_H = 841.89;

/** 基本サイズ（スケーリング前） */
const BASE_HEADER_SIZE = 20;
const BASE_METER_HEADER = 16;
const BASE_TOTAL_HEADER = BASE_HEADER_SIZE + BASE_METER_HEADER;
const BASE_MARGIN = 40;
const BASE_LEGEND_WIDTH = 220;
const BASE_TITLE_HEIGHT = 25;

export type PdfOrientation = "portrait" | "landscape";

/** フォントキャッシュ */
let fontCache: ArrayBuffer | null = null;

function getBasePath(): string {
  return process.env.NEXT_PUBLIC_REPO_NAME
    ? `/${process.env.NEXT_PUBLIC_REPO_NAME}`
    : (process.env.NODE_ENV === "production" ? "/additional-vehicles" : "");
}

async function loadJapaneseFont(): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;
  const basePath = getBasePath();
  const res = await fetch(`${basePath}/fonts/NotoSansJP-Regular.ttf`);
  if (!res.ok) throw new Error("Failed to load Japanese font");
  fontCache = await res.arrayBuffer();
  return fontCache;
}

export async function generatePdf(
  parkingLot: ParkingLotData,
  vehicles: Vehicle[],
  placements: PlacedVehicle[],
  orientation: PdfOrientation = "landscape"
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // fontkit登録 + 日本語フォント埋め込み
  pdfDoc.registerFontkit(fontkit);
  const fontBytes = await loadJapaneseFont();
  const jpFont = await pdfDoc.embedFont(fontBytes);

  // A4ページサイズ
  const pageWidth = orientation === "landscape" ? A4_H : A4_W;
  const pageHeight = orientation === "landscape" ? A4_W : A4_H;

  // ヘッダー・マージンは固定サイズ（スケールしない）
  const PDF_HEADER_SIZE = BASE_HEADER_SIZE;
  const PDF_METER_HEADER = BASE_METER_HEADER;
  const PDF_TOTAL_HEADER = PDF_HEADER_SIZE + PDF_METER_HEADER;
  const PDF_MARGIN = BASE_MARGIN;

  // 凡例は右1/3
  const legendWidth = Math.floor(pageWidth / 3);
  const legendGap = 20;

  // グリッド利用可能領域
  const availW = pageWidth - PDF_MARGIN * 2 - PDF_TOTAL_HEADER - legendWidth - legendGap;
  const availH = pageHeight - PDF_MARGIN * 2 - PDF_TOTAL_HEADER - BASE_TITLE_HEIGHT;
  const scaleX = availW / (parkingLot.cols * 28);
  const scaleY = availH / (parkingLot.rows * 28);
  const scale = Math.min(scaleX, scaleY, 1);

  const PDF_CELL_SIZE = 28 * scale;
  const gridWidth = parkingLot.cols * PDF_CELL_SIZE;
  const gridHeight = parkingLot.rows * PDF_CELL_SIZE;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // グリッド左上の起点
  const originX = PDF_MARGIN + PDF_TOTAL_HEADER;
  const topY = page.getHeight() - PDF_MARGIN - BASE_TITLE_HEIGHT;
  const originY = topY - PDF_TOTAL_HEADER;

  // タイトル
  page.drawText("増車届 配置図", {
    x: PDF_MARGIN,
    y: page.getHeight() - PDF_MARGIN,
    size: 14,
    font: jpFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  // 駐車場名
  page.drawText(parkingLot.name || "駐車場", {
    x: PDF_MARGIN + 120,
    y: page.getHeight() - PDF_MARGIN,
    size: 12,
    font: jpFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  const activeCellSet = new Set(
    parkingLot.activeCells.map(([c, r]) => cellKey(c, r))
  );

  // 車両マップ・カラーマップ作成
  const vehicleMap = new Map<string, Vehicle>();
  for (const v of vehicles) vehicleMap.set(v.id, v);
  const typeColorMap = buildTypeColorMap(vehicles);

  // セル座標計算（PDF座標系: 左下原点）
  // cellX(col) = グリッド列colの左端X
  // cellY(row) = グリッド行rowの上端Y
  const cellX = (col: number) => originX + col * PDF_CELL_SIZE;
  const cellY = (row: number) => originY - row * PDF_CELL_SIZE;

  // === メーターヘッダー背景 ===
  const meterColor = rgb(0.88, 0.91, 0.94); // #e0e8f0
  const meterTextColor = rgb(0.2, 0.4, 0.67); // #3366aa

  // 上側メーターバンド
  page.drawRectangle({
    x: originX,
    y: originY + PDF_HEADER_SIZE,
    width: gridWidth,
    height: PDF_METER_HEADER,
    color: meterColor,
  });
  // 左側メーターバンド
  page.drawRectangle({
    x: PDF_MARGIN,
    y: originY - gridHeight,
    width: PDF_METER_HEADER,
    height: gridHeight,
    color: meterColor,
  });

  // === セル番号ヘッダー背景 ===
  const headerColor = rgb(0.94, 0.94, 0.94); // #f0f0f0

  // 上側セル番号バンド
  page.drawRectangle({
    x: originX,
    y: originY,
    width: gridWidth,
    height: PDF_HEADER_SIZE,
    color: headerColor,
  });
  // 左側セル番号バンド
  page.drawRectangle({
    x: PDF_MARGIN + PDF_METER_HEADER,
    y: originY - gridHeight,
    width: PDF_HEADER_SIZE,
    height: gridHeight,
    color: headerColor,
  });

  // フォントサイズ — セル幅に合わせて調整
  const headerFontSize = Math.max(4, Math.min(8, PDF_CELL_SIZE * 0.7));
  const meterFontSize = Math.max(4, Math.min(8, PDF_CELL_SIZE * 2 * 0.5));
  const cellFontSize = Math.max(4, 7 * scale);
  const numFontSize = Math.max(8, 18 * scale);
  const numCircleSize = Math.max(6, 12 * scale);

  // 間引き — 最大桁数のテキスト幅がセル幅を超える場合にステップを計算
  const maxColText = String(parkingLot.cols);
  const maxColTw = jpFont.widthOfTextAtSize(maxColText, headerFontSize);
  const colLabelStep = maxColTw > PDF_CELL_SIZE ? Math.ceil(maxColTw / PDF_CELL_SIZE) + 1 : 1;
  const maxRowText = String(parkingLot.rows);
  const maxRowTw = jpFont.widthOfTextAtSize(maxRowText, headerFontSize);
  const rowLabelStep = maxRowTw > PDF_CELL_SIZE ? Math.ceil(maxRowTw / PDF_CELL_SIZE) + 1 : 1;
  // メーター — 1m表示幅(2セル分)に対するテキスト幅
  const meterCellSpan = PDF_CELL_SIZE * 2;
  const maxMeterText = String(Math.ceil(Math.max(parkingLot.cols, parkingLot.rows) / 2));
  const maxMeterTw = jpFont.widthOfTextAtSize(maxMeterText, meterFontSize);
  const meterStep = maxMeterTw > meterCellSpan ? Math.ceil(maxMeterTw / meterCellSpan) + 1 : 1;

  // === メーター表示（上側 - 2セルごとに1m）===
  for (let m = 0; m * 2 < parkingLot.cols; m++) {
    const startCol = m * 2;

    // 区切り線（常に描画）
    const lineX = originX + startCol * PDF_CELL_SIZE;
    page.drawLine({
      start: { x: lineX, y: originY + PDF_HEADER_SIZE },
      end: { x: lineX, y: originY + PDF_HEADER_SIZE + PDF_METER_HEADER },
      thickness: 0.5,
      color: meterTextColor,
    });

    // テキスト（間引き）
    if (m % meterStep === 0) {
      const spanCols = Math.min(2, parkingLot.cols - startCol);
      const cx = originX + startCol * PDF_CELL_SIZE + (spanCols * PDF_CELL_SIZE) / 2;
      const cy = originY + PDF_HEADER_SIZE + PDF_METER_HEADER / 2;
      const text = String(m + 1);
      const tw = jpFont.widthOfTextAtSize(text, meterFontSize);
      page.drawText(text, {
        x: cx - tw / 2,
        y: cy - 3,
        size: meterFontSize,
        font: jpFont,
        color: meterTextColor,
      });
    }
  }
  // 最後の区切り線
  {
    const lastM = Math.ceil(parkingLot.cols / 2);
    const lineX = originX + Math.min(lastM * 2, parkingLot.cols) * PDF_CELL_SIZE;
    page.drawLine({
      start: { x: lineX, y: originY + PDF_HEADER_SIZE },
      end: { x: lineX, y: originY + PDF_HEADER_SIZE + PDF_METER_HEADER },
      thickness: 0.5,
      color: meterTextColor,
    });
  }

  // === メーター表示（左側 - 2セルごとに1m）===
  for (let m = 0; m * 2 < parkingLot.rows; m++) {
    const startRow = m * 2;

    // 区切り線（常に描画）
    const lineY = originY - startRow * PDF_CELL_SIZE;
    page.drawLine({
      start: { x: PDF_MARGIN, y: lineY },
      end: { x: PDF_MARGIN + PDF_METER_HEADER, y: lineY },
      thickness: 0.5,
      color: meterTextColor,
    });

    // テキスト（間引き）
    if (m % meterStep === 0) {
      const spanRows = Math.min(2, parkingLot.rows - startRow);
      const cx = PDF_MARGIN + PDF_METER_HEADER / 2;
      const cy = originY - startRow * PDF_CELL_SIZE - (spanRows * PDF_CELL_SIZE) / 2;
      const text = String(m + 1);
      const tw = jpFont.widthOfTextAtSize(text, meterFontSize);
      page.drawText(text, {
        x: cx - tw / 2,
        y: cy - 3,
        size: meterFontSize,
        font: jpFont,
        color: meterTextColor,
      });
    }
  }
  // 最後の区切り線
  {
    const lastM = Math.ceil(parkingLot.rows / 2);
    const lineY = originY - Math.min(lastM * 2, parkingLot.rows) * PDF_CELL_SIZE;
    page.drawLine({
      start: { x: PDF_MARGIN, y: lineY },
      end: { x: PDF_MARGIN + PDF_METER_HEADER, y: lineY },
      thickness: 0.5,
      color: meterTextColor,
    });
  }

  // === アクティブセル塗りつぶし（薄灰色）===
  for (const [c, r] of parkingLot.activeCells) {
    page.drawRectangle({
      x: cellX(c),
      y: cellY(r) - PDF_CELL_SIZE,
      width: PDF_CELL_SIZE,
      height: PDF_CELL_SIZE,
      color: rgb(0.93, 0.93, 0.93),
    });
  }

  // === 車両描画（車種別カラー）===
  for (const p of placements) {
    const vehicle = vehicleMap.get(p.vehicleId);
    if (!vehicle) continue;

    const typeColor = typeColorMap.get(vehicle.typeName);
    const fillRgb = typeColor?.fillRgb ?? [1, 1, 0] as [number, number, number];

    // 車両矩形のPDF座標（bottom-left）
    const rectX = cellX(p.col);
    const rectY = cellY(p.row) - p.effectiveRows * PDF_CELL_SIZE;
    const rectW = p.effectiveCols * PDF_CELL_SIZE;
    const rectH = p.effectiveRows * PDF_CELL_SIZE;

    // 背景
    page.drawRectangle({
      x: rectX,
      y: rectY,
      width: rectW,
      height: rectH,
      color: rgb(fillRgb[0], fillRgb[1], fillRgb[2]),
    });

    // セル内に「50」を描画
    for (let dr = 0; dr < p.effectiveRows; dr++) {
      for (let dc = 0; dc < p.effectiveCols; dc++) {
        const cx = cellX(p.col + dc) + PDF_CELL_SIZE / 2;
        const cy = cellY(p.row + dr) - PDF_CELL_SIZE / 2;
        const text = "50";
        const textWidth = jpFont.widthOfTextAtSize(text, cellFontSize);
        page.drawText(text, {
          x: cx - textWidth / 2,
          y: cy - cellFontSize / 2,
          size: cellFontSize,
          font: jpFont,
          color: rgb(0.3, 0.3, 0.3),
        });
      }
    }

    // 車両番号（中央に大きく）
    const numText = String(vehicle.number);
    const numWidth = jpFont.widthOfTextAtSize(numText, numFontSize);
    const centerX = rectX + rectW / 2;
    const centerY = rectY + rectH / 2;

    // 白い背景丸
    page.drawCircle({
      x: centerX,
      y: centerY,
      size: numCircleSize,
      color: rgb(1, 1, 1),
      opacity: 0.85,
    });
    page.drawText(numText, {
      x: centerX - numWidth / 2,
      y: centerY - numFontSize / 3,
      size: numFontSize,
      font: jpFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    // 車両枠線
    const borderRgb = typeColor?.borderRgb ?? [0.6, 0.6, 0] as [number, number, number];
    page.drawRectangle({
      x: rectX,
      y: rectY,
      width: rectW,
      height: rectH,
      borderColor: rgb(borderRgb[0], borderRgb[1], borderRgb[2]),
      borderWidth: 1,
    });
  }

  // === グリッド線 ===
  for (let c = 0; c <= parkingLot.cols; c++) {
    page.drawLine({
      start: { x: cellX(c), y: originY },
      end: { x: cellX(c), y: originY - gridHeight },
      thickness: 0.3,
      color: rgb(0.8, 0.8, 0.8),
    });
  }
  for (let r = 0; r <= parkingLot.rows; r++) {
    page.drawLine({
      start: { x: originX, y: cellY(r) },
      end: { x: originX + gridWidth, y: cellY(r) },
      thickness: 0.3,
      color: rgb(0.8, 0.8, 0.8),
    });
  }

  // === 駐車場境界線（太線）===
  for (const [c, r] of parkingLot.activeCells) {
    const x = cellX(c);
    const y = cellY(r);

    if (!activeCellSet.has(cellKey(c, r - 1))) {
      page.drawLine({
        start: { x, y },
        end: { x: x + PDF_CELL_SIZE, y },
        thickness: 2,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
    if (!activeCellSet.has(cellKey(c, r + 1))) {
      page.drawLine({
        start: { x, y: y - PDF_CELL_SIZE },
        end: { x: x + PDF_CELL_SIZE, y: y - PDF_CELL_SIZE },
        thickness: 2,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
    if (!activeCellSet.has(cellKey(c - 1, r))) {
      page.drawLine({
        start: { x, y },
        end: { x, y: y - PDF_CELL_SIZE },
        thickness: 2,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
    if (!activeCellSet.has(cellKey(c + 1, r))) {
      page.drawLine({
        start: { x: x + PDF_CELL_SIZE, y },
        end: { x: x + PDF_CELL_SIZE, y: y - PDF_CELL_SIZE },
        thickness: 2,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
  }

  // === 列番号（セル番号ヘッダー内、間引き対応）===
  for (let c = 0; c < parkingLot.cols; c++) {
    if ((c + 1) % colLabelStep !== 0 && c !== 0) continue;
    const text = String(c + 1);
    const textWidth = jpFont.widthOfTextAtSize(text, headerFontSize);
    page.drawText(text, {
      x: cellX(c) + PDF_CELL_SIZE / 2 - textWidth / 2,
      y: originY + PDF_HEADER_SIZE / 2 - headerFontSize / 3,
      size: headerFontSize,
      font: jpFont,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  // === 行番号（セル番号ヘッダー内、間引き対応）===
  for (let r = 0; r < parkingLot.rows; r++) {
    if ((r + 1) % rowLabelStep !== 0 && r !== 0) continue;
    const text = String(r + 1);
    const textWidth = jpFont.widthOfTextAtSize(text, headerFontSize);
    page.drawText(text, {
      x: PDF_MARGIN + PDF_METER_HEADER + PDF_HEADER_SIZE / 2 - textWidth / 2,
      y: cellY(r) - PDF_CELL_SIZE / 2 - headerFontSize / 3,
      size: headerFontSize,
      font: jpFont,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  // === 車両一覧（凡例）— ページ右1/3 ===
  const legendX = pageWidth - legendWidth - PDF_MARGIN + 10;
  let legendY = originY - 5;
  const legendColW = 14;
  const legendRowH = 16;

  page.drawText("車両一覧", {
    x: legendX,
    y: legendY,
    size: 10,
    font: jpFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  legendY -= 18;

  const existingVehicles = vehicles.filter((v) => v.status === "existing");
  const newVehicles = vehicles.filter((v) => v.status === "new");

  const drawLegendSection = (
    list: Vehicle[],
    label: string
  ) => {
    if (list.length === 0) return;
    page.drawText(`${label}（${list.length}台）`, {
      x: legendX,
      y: legendY,
      size: 8,
      font: jpFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    legendY -= 14;

    for (const v of list) {
      const tc = typeColorMap.get(v.typeName);
      const fr = tc?.fillRgb ?? [1, 1, 0] as [number, number, number];
      const br = tc?.borderRgb ?? [0.6, 0.6, 0] as [number, number, number];

      // 色見本
      page.drawRectangle({
        x: legendX,
        y: legendY - 2,
        width: legendColW,
        height: 12,
        color: rgb(fr[0], fr[1], fr[2]),
        borderColor: rgb(br[0], br[1], br[2]),
        borderWidth: 0.5,
      });

      // 番号
      const numStr = String(v.number);
      const nw = jpFont.widthOfTextAtSize(numStr, 8);
      page.drawText(numStr, {
        x: legendX + legendColW / 2 - nw / 2,
        y: legendY,
        size: 8,
        font: jpFont,
        color: rgb(0.1, 0.1, 0.1),
      });

      // 車種名 + サイズ
      const infoText = `${v.typeName} ${v.dimensions.lengthCm}×${v.dimensions.widthCm}cm`;
      page.drawText(infoText, {
        x: legendX + legendColW + 6,
        y: legendY,
        size: 8,
        font: jpFont,
        color: rgb(0.2, 0.2, 0.2),
      });

      legendY -= legendRowH;
    }
    legendY -= 4;
  };

  drawLegendSection(existingVehicles, "既存車両");
  drawLegendSection(newVehicles, "増車車両");

  return pdfDoc.save();
}

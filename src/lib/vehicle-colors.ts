/**
 * 車種名ごとに色を割り当てるユーティリティ
 * Canvas描画とPDF出力の両方で共通使用
 */

export interface VehicleColor {
  fill: string;
  border: string;
  /** pdf-lib用 RGB (0-1) */
  fillRgb: [number, number, number];
  borderRgb: [number, number, number];
}

const PALETTE: VehicleColor[] = [
  { fill: "#ffff00", border: "#999900", fillRgb: [1, 1, 0], borderRgb: [0.6, 0.6, 0] },
  { fill: "#87ceeb", border: "#4682b4", fillRgb: [0.53, 0.81, 0.92], borderRgb: [0.27, 0.51, 0.71] },
  { fill: "#90ee90", border: "#3cb371", fillRgb: [0.56, 0.93, 0.56], borderRgb: [0.24, 0.70, 0.44] },
  { fill: "#ffa07a", border: "#cd5c5c", fillRgb: [1, 0.63, 0.48], borderRgb: [0.80, 0.36, 0.36] },
  { fill: "#dda0dd", border: "#9370db", fillRgb: [0.87, 0.63, 0.87], borderRgb: [0.58, 0.44, 0.86] },
  { fill: "#f0e68c", border: "#bdb76b", fillRgb: [0.94, 0.90, 0.55], borderRgb: [0.74, 0.72, 0.42] },
  { fill: "#b0c4de", border: "#6495ed", fillRgb: [0.69, 0.77, 0.87], borderRgb: [0.39, 0.58, 0.93] },
  { fill: "#ffc0cb", border: "#db7093", fillRgb: [1, 0.75, 0.80], borderRgb: [0.86, 0.44, 0.58] },
  { fill: "#66cdaa", border: "#2e8b57", fillRgb: [0.40, 0.80, 0.67], borderRgb: [0.18, 0.55, 0.34] },
  { fill: "#f4a460", border: "#cd853f", fillRgb: [0.96, 0.64, 0.38], borderRgb: [0.80, 0.52, 0.25] },
  { fill: "#add8e6", border: "#4169e1", fillRgb: [0.68, 0.85, 0.90], borderRgb: [0.25, 0.41, 0.88] },
  { fill: "#e6e6fa", border: "#7b68ee", fillRgb: [0.90, 0.90, 0.98], borderRgb: [0.48, 0.41, 0.93] },
];

/**
 * 車両リストから typeName → カラーのマッピングを構築
 * 同一車種名には同じ色を割り当てる
 */
export function buildTypeColorMap(
  vehicles: { typeName: string }[]
): Map<string, VehicleColor> {
  const map = new Map<string, VehicleColor>();
  let colorIndex = 0;
  for (const v of vehicles) {
    if (!map.has(v.typeName)) {
      map.set(v.typeName, PALETTE[colorIndex % PALETTE.length]);
      colorIndex++;
    }
  }
  return map;
}

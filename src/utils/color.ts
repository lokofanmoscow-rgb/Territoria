// Умножает RGB-каналы hex-цвета на factor (< 1 темнее, > 1 светлее) —
// используется, чтобы значки рельефа (деревья, горы...) были оттенком того
// же биома, на котором стоят, а не случайным цветом поверх.
export function shade(hex: string, factor: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const r = Math.max(0, Math.min(255, Math.round(((num >> 16) & 255) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(((num >> 8) & 255) * factor)));
  const b = Math.max(0, Math.min(255, Math.round((num & 255) * factor)));
  return `rgb(${r}, ${g}, ${b})`;
}

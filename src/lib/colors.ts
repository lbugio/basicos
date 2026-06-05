// Mapa de nombres de color (los que devuelve WooCommerce / el mock) a hex
// para pintar los swatches. Antes vivía duplicado en ProductCard y
// ProductDetail; centralizado acá para una sola fuente de verdad.
const COLOR_HEX: Record<string, string> = {
  white: "#ffffff",
  black: "#000000",
  gray: "#6b7280",
  navy: "#1e3a8a",
  "forest green": "#166534",
  cream: "#f5ecd7",
  pink: "#f472b6",
  lavender: "#c4b5fd",
  "light gray": "#d1d5db",
  olive: "#65a30d",
  burgundy: "#7c2d12",
  "dusty pink": "#f9a8d4",
  "sage green": "#84cc16",
};

const FALLBACK = "#9ca3af";

export function swatchColor(color: string): string {
  return COLOR_HEX[color.toLowerCase()] ?? FALLBACK;
}

// Formateador de precios canónico de Basicos. Locale argentino, pesos,
// símbolo antes del importe ("$ 29.999"), sin decimales en montos enteros.
// Única fuente de verdad para que carrito, checkout y landing nunca se desfasen.
export function formatPrice(value: number): string {
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}

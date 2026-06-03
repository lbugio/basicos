// Canonical price formatter for the Basicos storefront. Spanish locale, euros,
// symbol after the amount ("29,99 €"), drops decimals on whole numbers.
// Single source of truth so cart, checkout and landing never drift apart.
export function formatPrice(value: number): string {
  return value.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}

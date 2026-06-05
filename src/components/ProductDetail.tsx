import { useEffect, useState } from 'react';
import { Product } from '../types/woocommerce';
import { X, Check, Sparkles, ArrowRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { formatPrice } from '../lib/format';
import { swatchColor } from '../lib/colors';

interface ProductDetailProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, color: string) => void;
  onTryOn: (product: Product, size?: string, color?: string) => void;
}

export function ProductDetail({ product, isOpen, onClose, onAddToCart, onTryOn }: ProductDetailProps) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  // Cerrar con Escape y bloquear el scroll del body mientras está abierto.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  // Escasez honesta: solo avisamos cuando de verdad queda poco.
  const isLowStock =
    product.inStock &&
    typeof product.stockQuantity === 'number' &&
    product.stockQuantity > 0 &&
    product.stockQuantity <= 5;

  const canAdd = product.inStock && !!selectedSize && !!selectedColor;

  const handleAddToCart = () => {
    if (!canAdd) return;
    onAddToCart(product, selectedSize, selectedColor);
    onClose();
  };

  return (
    <div
      className="tw-landing fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      <div
        className="tw-veil tw-veil-tint absolute inset-0"
        onClick={onClose}
      />

      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-full items-start justify-center px-3 py-6 sm:px-6 sm:py-10 lg:items-center">
          <div className="tw-panel-rise relative grid w-full max-w-[1180px] overflow-hidden rounded-[3px] bg-[var(--tw-paper)] text-[var(--tw-ink)] shadow-[0_40px_90px_-50px_oklch(0.22_0.015_50_/_0.5)] lg:grid-cols-[1.05fr_0.95fr]">
            {/* Imagen */}
            <div className="tw-media relative aspect-[4/5] w-full overflow-clip bg-[var(--tw-paper-deep)] lg:aspect-auto lg:min-h-[640px]">
              <ImageWithFallback
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute left-4 top-4 flex flex-col gap-2">
                {product.featured && (
                  <span className="bg-[var(--tw-ink)] px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-[var(--tw-paper)]">
                    Destacada
                  </span>
                )}
                {hasDiscount && (
                  <span className="bg-[var(--tw-clay)] px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-[var(--tw-paper)]">
                    −{discountPercent}%
                  </span>
                )}
              </div>
            </div>

            {/* Contenido */}
            <div className="flex max-h-[calc(100vh-3rem)] flex-col overflow-y-auto p-6 sm:p-8 lg:p-10">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-[clamp(1.7rem,3vw,2.4rem)] font-semibold leading-[1.05] tracking-[-0.02em]">
                  {product.name}
                </h1>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="-mr-2 -mt-1 grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full text-[var(--tw-ink-soft)] transition-colors hover:text-[var(--tw-ink)]"
                >
                  <X className="h-[1.15rem] w-[1.15rem]" />
                </button>
              </div>

              {/* Precio */}
              <div className="mt-4 flex flex-wrap items-baseline gap-3">
                <span className="text-[1.7rem] font-semibold tabular-nums tracking-[-0.01em]">
                  {formatPrice(product.price)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-[1.05rem] text-[var(--tw-ink-soft)] line-through tabular-nums">
                      {formatPrice(product.originalPrice!)}
                    </span>
                    <span className="bg-[var(--tw-clay)] px-2.5 py-1 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-[var(--tw-paper)]">
                      Ahorrás {formatPrice(product.originalPrice! - product.price)}
                    </span>
                  </>
                )}
              </div>
              {hasDiscount && (
                <p className="mt-2 text-[0.85rem] text-[var(--tw-ink-soft)]">
                  Hasta 3 cuotas sin interés con Mercado Pago.
                </p>
              )}

              <div className="my-6 h-px w-full bg-[var(--tw-line)]" />

              {/* Descripción */}
              <div>
                <h3 className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[var(--tw-ink-soft)]">
                  Descripción
                </h3>
                <p className="mt-2.5 text-[0.95rem] leading-relaxed text-[var(--tw-ink-soft)]">
                  {product.description}
                </p>
              </div>

              {/* Talle */}
              <div className="mt-7">
                <h3 className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[var(--tw-ink-soft)]">
                  Talle
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const active = selectedSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        aria-pressed={active}
                        className={`min-w-[3rem] rounded-full border px-4 py-2 text-[0.88rem] font-medium transition-colors ${
                          active
                            ? 'border-[var(--tw-ink)] bg-[var(--tw-ink)] text-[var(--tw-paper)]'
                            : 'border-[var(--tw-line)] text-[var(--tw-ink)] hover:border-[var(--tw-ink)]'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color */}
              <div className="mt-7">
                <h3 className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[var(--tw-ink-soft)]">
                  Color
                </h3>
                <div className="mt-3 space-y-2.5">
                  {product.colors.map((color) => {
                    const active = selectedColor === color;
                    return (
                      <label
                        key={color}
                        className="group flex cursor-pointer items-center gap-3"
                      >
                        <span className="relative grid place-items-center">
                          <span
                            className={`h-7 w-7 rounded-full ring-1 ring-inset transition-[box-shadow] ${
                              active
                                ? 'ring-2 ring-[var(--tw-ink)]'
                                : 'ring-[var(--tw-line)] group-hover:ring-[var(--tw-ink)]'
                            }`}
                            style={{ backgroundColor: swatchColor(color) }}
                          />
                          {active && (
                            <Check
                              className="absolute h-3.5 w-3.5 text-[var(--tw-paper)] mix-blend-difference"
                              strokeWidth={2.5}
                            />
                          )}
                        </span>
                        <span
                          className={`text-[0.92rem] transition-colors ${
                            active ? 'font-semibold text-[var(--tw-ink)]' : 'text-[var(--tw-ink-soft)] group-hover:text-[var(--tw-ink)]'
                          }`}
                        >
                          {color}
                        </span>
                        <input
                          type="radio"
                          name="color"
                          value={color}
                          checked={active}
                          onChange={() => setSelectedColor(color)}
                          className="sr-only"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Stock */}
              <div className="mt-7 flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: !product.inStock
                      ? 'var(--destructive)'
                      : isLowStock
                        ? 'var(--tw-clay)'
                        : 'oklch(0.62 0.15 150)',
                  }}
                />
                <span className="text-[0.85rem] text-[var(--tw-ink-soft)]">
                  {!product.inStock
                    ? 'Sin stock por ahora'
                    : isLowStock
                      ? `Quedan ${product.stockQuantity} — vuela`
                      : 'En stock, listo para enviar'}
                </span>
              </div>

              {/* Acciones */}
              <div className="mt-8 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() =>
                    onTryOn(
                      product,
                      selectedSize || undefined,
                      selectedColor || undefined
                    )
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--tw-ink)] py-3.5 text-[0.92rem] font-medium text-[var(--tw-ink)] transition-colors hover:bg-[var(--tw-ink)] hover:text-[var(--tw-paper)]"
                >
                  <Sparkles className="h-4 w-4" />
                  Probármelo con IA
                </button>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!canAdd}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--tw-ink)] py-3.5 text-[0.92rem] font-medium text-[var(--tw-paper)] transition-colors hover:bg-[var(--tw-clay-deep)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--tw-ink)]"
                >
                  {!product.inStock
                    ? 'Sin stock por ahora'
                    : !selectedSize || !selectedColor
                      ? 'Elegí talle y color'
                      : 'Sumar a la bolsa'}
                  {canAdd && (
                    <ArrowRight className="size-4 transition-transform duration-500 ease-out group-hover:translate-x-0.5" />
                  )}
                </button>

                {product.inStock && (!selectedSize || !selectedColor) && (
                  <p className="text-center text-[0.82rem] text-[var(--tw-ink-soft)]">
                    Elegí {!selectedSize ? 'talle' : 'color'} para seguir
                  </p>
                )}
                {canAdd && (
                  <p className="text-center text-[0.82rem] text-[var(--tw-ink-soft)]">
                    Cambio gratis si no era tu talle · Te devolvemos la plata si no te convence
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

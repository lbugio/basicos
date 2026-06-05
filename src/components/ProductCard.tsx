import { Product } from "../types/woocommerce";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { stripHtml } from "../lib/utils";
import { formatPrice } from "../lib/format";
import { swatchColor } from "../lib/colors";
import { Sparkles, ArrowRight } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
  onTryOn: (product: Product) => void;
}

export function ProductCard({
  product,
  onAddToCart,
  onProductClick,
  onTryOn,
}: ProductCardProps) {
  const hasDiscount =
    product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.originalPrice! - product.price) / product.originalPrice!) *
          100
      )
    : 0;

  return (
    <article className="tw-zoom group flex flex-col">
      {/* Imagen: hairline + zoom editorial, sin sombras blandas */}
      <button
        type="button"
        onClick={() => onProductClick(product)}
        aria-label={`Ver ${product.name}`}
        className="tw-media relative aspect-[4/5] w-full overflow-clip rounded-[1px] bg-[var(--tw-paper-deep)]"
      >
        <ImageWithFallback
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover"
        />

        {/* Badges editoriales: terracota, no rojo de error */}
        <div className="absolute left-3 top-3 flex flex-col gap-2">
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

        {!product.inStock && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "oklch(0.22 0.015 50 / 0.45)" }}
          >
            <span className="bg-[var(--tw-paper)] px-3 py-1.5 text-[0.78rem] font-medium uppercase tracking-[0.14em] text-[var(--tw-ink)]">
              Sin stock
            </span>
          </div>
        )}
      </button>

      <div className="mt-4 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => onProductClick(product)}
          className="text-left"
        >
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-[1.1rem] font-medium tracking-[-0.01em] transition-colors group-hover:text-[var(--tw-clay-deep)]">
              {product.name}
            </h3>
            <div className="flex shrink-0 items-baseline gap-2">
              <span className="tabular-nums text-[1.02rem] font-semibold">
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-[0.82rem] text-[var(--tw-ink-soft)] line-through tabular-nums">
                  {formatPrice(product.originalPrice!)}
                </span>
              )}
            </div>
          </div>
          <p className="mt-1.5 line-clamp-2 max-w-[40ch] text-[0.88rem] leading-relaxed text-[var(--tw-ink-soft)]">
            {stripHtml(product.description)}
          </p>
        </button>

        {/* Swatches de color */}
        <div className="flex items-center gap-2">
          {product.colors.slice(0, 5).map((color, index) => (
            <span
              key={index}
              className="h-3.5 w-3.5 rounded-full ring-1 ring-inset ring-[var(--tw-line)]"
              style={{ backgroundColor: swatchColor(color) }}
              title={color}
            />
          ))}
          {product.colors.length > 5 && (
            <span className="text-[0.75rem] text-[var(--tw-ink-soft)]">
              +{product.colors.length - 5}
            </span>
          )}
        </div>

        {/* Acciones: pill terracota como en la landing + probador */}
        <div className="mt-1 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTryOn(product);
            }}
            aria-label={`Probarme ${product.name}`}
            className="tw-link inline-flex items-center gap-1.5 text-[0.85rem] font-medium text-[var(--tw-clay-deep)]"
          >
            <Sparkles className="size-3.5" />
            Probármelo
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            disabled={!product.inStock}
            className="group/btn inline-flex items-center gap-2 rounded-full bg-[var(--tw-ink)] px-5 py-2.5 text-[0.85rem] font-medium text-[var(--tw-paper)] transition-colors hover:bg-[var(--tw-clay-deep)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--tw-ink)]"
          >
            Sumar
            <ArrowRight className="size-3.5 transition-transform duration-500 ease-out group-hover/btn:translate-x-0.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

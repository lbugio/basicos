import { useEffect } from "react";
import { CartItem } from "../types/woocommerce";
import { Minus, Plus, X, ArrowUpRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { formatPrice } from "../lib/format";

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (cartKey: string, quantity: number) => void;
  onRemoveItem: (cartKey: string) => void;
  onCheckout?: () => void;
  checkoutUrl: string;
}

export function Cart({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  checkoutUrl,
}: CartProps) {
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Close on Escape, lock body scroll while the drawer is open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout();
    } else {
      window.open(checkoutUrl, "_blank");
    }
  };

  const keyFor = (item: CartItem) =>
    item.cartKey ||
    `${item.product.id}-${item.selectedSize}-${item.selectedColor}`;

  if (!isOpen) return null;

  return (
    <div
      className="tw-landing fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Tu bolsa"
    >
      <div
        className="tw-veil tw-veil-tint absolute inset-0"
        onClick={onClose}
      />

      <div className="tw-panel absolute right-0 top-0 flex h-full w-full max-w-[27rem] flex-col bg-[var(--tw-paper)] text-[var(--tw-ink)] shadow-[-24px_0_60px_-30px_oklch(0.22_0.015_50_/_0.4)]">
        {/* Header */}
        <header className="flex items-baseline justify-between px-7 pb-5 pt-7">
          <div className="flex items-baseline gap-3">
            <h2 className="text-[1.35rem] font-semibold tracking-[-0.01em]">
              Tu bolsa
            </h2>
            {totalItems > 0 && (
              <span className="text-[0.8rem] text-[var(--tw-ink-soft)]">
                {totalItems} {totalItems === 1 ? "pieza" : "piezas"}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar la bolsa"
            className="-mr-2.5 grid h-[44px] w-[44px] place-items-center rounded-full text-[var(--tw-ink-soft)] transition-colors hover:text-[var(--tw-ink)]"
          >
            <X className="h-[1.15rem] w-[1.15rem]" />
          </button>
        </header>

        <div
          className="h-px w-full"
          style={{ background: "var(--tw-line)" }}
        />

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-7">
          {cartItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center pb-16 text-center">
              <p className="tw-display text-[1.6rem] italic">
                Todavía no hay nada acá.
              </p>
              <p className="mt-3 max-w-[26ch] text-[0.92rem] text-[var(--tw-ink-soft)]">
                Lo que vayas eligiendo se guarda en tu bolsa mientras lo
                pensás.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="tw-link mt-7 text-[0.9rem] font-medium text-[var(--tw-clay-deep)]"
              >
                Ver la colección
              </button>
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--tw-line)" }}>
              {cartItems.map((item) => {
                const key = keyFor(item);
                return (
                  <li key={key} className="flex gap-4 py-6">
                    <div className="tw-media h-28 w-[5.5rem] flex-shrink-0 rounded-[3px] bg-[var(--tw-paper-deep)]">
                      <ImageWithFallback
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-[0.95rem] font-medium leading-snug">
                          {item.product.name}
                        </h3>
                        <span className="whitespace-nowrap text-[0.95rem] font-semibold tabular-nums">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>

                      <p className="mt-1 text-[0.8rem] text-[var(--tw-ink-soft)]">
                        {item.selectedSize} · {item.selectedColor}
                      </p>

                      <div className="mt-auto flex items-center justify-between pt-3">
                        <div
                          className="flex items-center rounded-full"
                          style={{ border: "1px solid var(--tw-line)" }}
                        >
                          <button
                            type="button"
                            aria-label="Quitar una unidad"
                            onClick={() =>
                              onUpdateQuantity(
                                key,
                                Math.max(0, item.quantity - 1)
                              )
                            }
                            className="grid h-[44px] w-[44px] place-items-center rounded-full text-[var(--tw-ink-soft)] transition-colors hover:text-[var(--tw-ink)]"
                          >
                            <Minus className="h-[0.85rem] w-[0.85rem]" />
                          </button>
                          <span className="w-7 text-center text-[0.85rem] font-medium tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Sumar una unidad"
                            onClick={() =>
                              onUpdateQuantity(key, item.quantity + 1)
                            }
                            className="grid h-[44px] w-[44px] place-items-center rounded-full text-[var(--tw-ink-soft)] transition-colors hover:text-[var(--tw-ink)]"
                          >
                            <Plus className="h-[0.85rem] w-[0.85rem]" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(key)}
                          className="tw-link text-[0.78rem] text-[var(--tw-ink-soft)] hover:text-[var(--tw-clay-deep)]"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <footer className="px-7 pb-7 pt-5">
            <div
              className="h-px w-full"
              style={{ background: "var(--tw-line)" }}
            />
            <div className="flex items-baseline justify-between pb-1 pt-5">
              <span className="text-[0.95rem] text-[var(--tw-ink-soft)]">
                Total
              </span>
              <span className="text-[1.4rem] font-semibold tabular-nums tracking-[-0.01em]">
                {formatPrice(totalAmount)}
              </span>
            </div>
            <p className="mb-5 text-[0.78rem] text-[var(--tw-ink-soft)]">
              Impuestos incluidos. El envío se calcula en el checkout.
            </p>

            <button
              type="button"
              onClick={handleCheckout}
              className="group flex w-full items-center justify-center gap-2 rounded-full bg-[var(--tw-ink)] py-3.5 text-[0.92rem] font-medium text-[var(--tw-paper)] transition-colors hover:bg-[var(--tw-clay-deep)]"
            >
              Finalizar compra
              {!onCheckout && (
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="tw-link mx-auto mt-4 block text-[0.85rem] text-[var(--tw-ink-soft)] hover:text-[var(--tw-ink)]"
            >
              Seguir comprando
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}

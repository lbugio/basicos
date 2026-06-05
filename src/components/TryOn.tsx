"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Camera, RotateCcw, ShoppingBag, Sparkles, Upload, X } from "lucide-react";
import { Product } from "@/types/woocommerce";
import { useTryOn } from "@/hooks/useTryOn";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

interface TryOnProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, size?: string, color?: string) => void;
  initialSize?: string;
  initialColor?: string;
}

export function TryOn({
  product,
  isOpen,
  onClose,
  onAddToCart,
  initialSize,
  initialColor,
}: TryOnProps) {
  const { status, resultImage, error, generate, reset } = useTryOn();
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState(initialSize || product.sizes[0] || "");
  const [selectedColor, setSelectedColor] = useState(
    initialColor || product.colors[0] || ""
  );
  // El botón "Sacar foto" usa <input capture>, que solo abre la cámara en
  // dispositivos con cámara integrada (mobile/tablet). En desktop el navegador
  // lo ignora y cae al file picker, duplicando "Subir foto". Lo mostramos solo
  // cuando detectamos una cámara real. Por defecto oculto hasta confirmar.
  const [hasCamera, setHasCamera] = useState(false);

  const isGenerating = status === "generating";
  const canGenerate = !!photo && !isGenerating;
  const canAddToCart = product.inStock && !!selectedSize && !!selectedColor;

  const pickerLabel = useMemo(() => {
    if (!photo) return "Elegí una foto para empezar";
    if (status === "done") return "Resultado listo";
    return "Foto lista";
  }, [photo, status]);

  useEffect(() => {
    setSelectedSize(initialSize || product.sizes[0] || "");
    setSelectedColor(initialColor || product.colors[0] || "");
  }, [initialColor, initialSize, product]);

  useEffect(() => {
    let cancelled = false;
    const devices = navigator.mediaDevices;
    if (!devices?.enumerateDevices) return;

    devices
      .enumerateDevices()
      .then((list) => {
        if (!cancelled) {
          setHasCamera(list.some((d) => d.kind === "videoinput"));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(photo);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  if (!isOpen) return null;

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPhoto(file);
    reset();
  };

  const handleGenerate = () => {
    if (!photo) return;
    generate(photo, product, { size: selectedSize, color: selectedColor });
  };

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    onAddToCart(product, selectedSize, selectedColor);
    onClose();
  };

  const handleResetPhoto = () => {
    setPhoto(null);
    reset();
  };

  return (
    <div className="tw-landing fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={`Probador de ${product.name}`}>
      <div
        className="tw-veil tw-veil-tint absolute inset-0"
        onClick={onClose}
      />

      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-full items-start justify-center px-3 py-6 sm:px-6 sm:py-10 lg:items-center">
          <div className="tw-panel-rise relative grid w-full max-w-[1180px] overflow-hidden rounded-[3px] bg-[var(--tw-paper)] text-[var(--tw-ink)] shadow-[0_40px_90px_-50px_oklch(0.22_0.015_50_/_0.5)] lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)]">
            <div className="tw-media relative min-h-[320px] overflow-clip bg-[var(--tw-paper-deep)] lg:min-h-[640px]">
              <ImageWithFallback
                src={resultImage || previewUrl || product.image}
                alt={resultImage ? `Probador de ${product.name}` : product.name}
                className="h-full min-h-[320px] w-full object-cover lg:min-h-[640px]"
              />
              <div className="absolute left-4 top-4 bg-[var(--tw-clay)] px-3 py-1.5 text-[0.72rem] font-medium uppercase tracking-[0.12em] text-[var(--tw-paper)]">
                {pickerLabel}
              </div>
            </div>

            <div className="flex max-h-[calc(100vh-3rem)] flex-col overflow-y-auto p-5 sm:p-6 lg:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.78rem] uppercase tracking-[0.18em] text-[var(--tw-clay-deep)]">
                    Probador virtual
                  </p>
                  <h2 className="mt-1.5 text-[clamp(1.5rem,2.5vw,2rem)] font-semibold tracking-[-0.02em]">
                    {product.name}
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="Cerrar probador"
                  onClick={onClose}
                  className="-mr-2 -mt-1 grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full text-[var(--tw-ink-soft)] transition-colors hover:text-[var(--tw-ink)]"
                >
                  <X className="h-[1.15rem] w-[1.15rem]" />
                </button>
              </div>

              <div className="mt-6 space-y-6">
                <div className={`grid gap-3 ${hasCamera ? "grid-cols-2" : "grid-cols-1"}`}>
                  <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--tw-line)] text-[0.88rem] font-medium text-[var(--tw-ink)] transition-colors hover:border-[var(--tw-ink)]">
                    <Upload className="h-4 w-4" />
                    Subir foto
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={handlePhotoChange}
                    />
                  </label>

                  {hasCamera && (
                    <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--tw-line)] text-[0.88rem] font-medium text-[var(--tw-ink)] transition-colors hover:border-[var(--tw-ink)]">
                      <Camera className="h-4 w-4" />
                      Sacar foto
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        capture="user"
                        className="sr-only"
                        onChange={handlePhotoChange}
                      />
                    </label>
                  )}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="mb-2.5 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[var(--tw-ink-soft)]">
                      Talle
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => {
                        const active = selectedSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            aria-pressed={active}
                            className={`min-w-[2.75rem] rounded-full border px-3.5 py-1.5 text-[0.85rem] font-medium transition-colors ${
                              active
                                ? "border-[var(--tw-ink)] bg-[var(--tw-ink)] text-[var(--tw-paper)]"
                                : "border-[var(--tw-line)] text-[var(--tw-ink)] hover:border-[var(--tw-ink)]"
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2.5 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[var(--tw-ink-soft)]">
                      Color
                    </p>
                    <select
                      value={selectedColor}
                      onChange={(event) => setSelectedColor(event.target.value)}
                      className="h-10 w-full rounded-full border border-[var(--tw-line)] bg-transparent px-4 text-[0.88rem] text-[var(--tw-ink)] outline-none transition-colors focus:border-[var(--tw-clay-deep)]"
                    >
                      {product.colors.map((color) => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-[3px] border border-[var(--tw-line)] bg-[var(--tw-paper-deep)] p-4 text-[0.85rem] text-[var(--tw-ink-soft)]">
                  <p className="font-medium text-[var(--tw-ink)]">Foto recomendada</p>
                  <p className="mt-1.5 leading-relaxed">
                    De frente, desde la cintura o pecho completo, con hombros y
                    brazos visibles. Cuanto menos recortada esté la foto, mejor
                    queda la prueba.
                  </p>
                  <p className="mt-3 leading-relaxed">
                    Tu foto se usa solo para generar esta prueba y no se guarda.
                  </p>
                </div>

                {status === "error" && error && (
                  <div
                    className="rounded-[3px] border p-4 text-[0.85rem]"
                    style={{
                      borderColor: "var(--destructive)",
                      color: "var(--destructive)",
                      background: "oklch(0.55 0.16 25 / 0.08)",
                    }}
                  >
                    {error}
                  </div>
                )}

                {isGenerating && (
                  <div className="flex items-center gap-3 rounded-[3px] border border-[var(--tw-line)] p-4 text-[0.88rem] text-[var(--tw-ink)]">
                    <Sparkles className="h-4 w-4 animate-pulse text-[var(--tw-clay-deep)]" />
                    Probándote la prenda…
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-col gap-3">
                {status === "done" ? (
                  <>
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={!canAddToCart}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--tw-ink)] py-3.5 text-[0.92rem] font-medium text-[var(--tw-paper)] transition-colors hover:bg-[var(--tw-clay-deep)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--tw-ink)]"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Sumar a la bolsa
                    </button>
                    <button
                      type="button"
                      onClick={handleResetPhoto}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--tw-line)] py-3 text-[0.9rem] font-medium text-[var(--tw-ink)] transition-colors hover:border-[var(--tw-ink)]"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Probar con otra foto
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--tw-ink)] py-3.5 text-[0.92rem] font-medium text-[var(--tw-paper)] transition-colors hover:bg-[var(--tw-clay-deep)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--tw-ink)]"
                  >
                    <Sparkles className="h-4 w-4" />
                    {isGenerating ? "Generando…" : "Probármelo"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

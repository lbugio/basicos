import Image from "next/image";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { Product } from "@/types/woocommerce";
import { formatPrice } from "@/lib/format";

interface LandingProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onShopCategory: (category: string) => void;
  onShopAll: () => void;
}

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=80";

const CATEGORIES: {
  slug: string;
  label: string;
  count: string;
  image: string;
}[] = [
  {
    slug: "t-shirts",
    label: "Camisetas",
    count: "Algodón peinado",
    image:
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "sweatshirts",
    label: "Sudaderas",
    count: "Felpa cepillada",
    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "hoodies",
    label: "Hoodies",
    count: "Cortes oversize",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "tank-tops",
    label: "Tank tops",
    count: "Punto ligero",
    image:
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=80",
  },
];


export function Landing({
  products,
  onProductClick,
  onAddToCart,
  onShopCategory,
  onShopAll,
}: LandingProps) {
  const featured = products.filter((p) => p.featured).slice(0, 3);

  return (
    <div className="tw-landing">
      {/* ---------- HERO ---------- */}
      <section className="relative mx-auto grid max-w-[1400px] gap-y-10 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-x-16 lg:px-12 lg:pb-28 lg:pt-16">
        <div className="flex flex-col justify-center">
          <span
            className="tw-rise text-[0.78rem] uppercase tracking-[0.32em] text-[var(--tw-ink-soft)]"
            style={{ ["--d" as string]: "0ms" }}
          >
            Esenciales, hechos para durar
          </span>

          <h1
            className="tw-rise mt-6 text-[clamp(3rem,9vw,7.5rem)] font-semibold leading-[0.92] tracking-[-0.03em]"
            style={{ ["--d" as string]: "90ms" }}
          >
            Lo básico,
            <br />
            <span className="tw-display text-[var(--tw-clay-deep)]">
              sin lo básico.
            </span>
          </h1>

          <p
            className="tw-rise mt-8 max-w-[42ch] text-[1.05rem] leading-relaxed text-[var(--tw-ink-soft)]"
            style={{ ["--d" as string]: "180ms" }}
          >
            Una colección corta de piezas que ya tienen su lugar en tu armario:
            algodón honesto, cortes que sientan bien y nada que sobre.
          </p>

          <div
            className="tw-rise mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
            style={{ ["--d" as string]: "270ms" }}
          >
            <button
              type="button"
              onClick={onShopAll}
              className="group inline-flex items-center gap-3 rounded-full bg-[var(--tw-ink)] px-7 py-3.5 text-[0.95rem] font-medium text-[var(--tw-paper)] transition-colors hover:bg-[var(--tw-clay-deep)]"
            >
              Ver la colección
              <ArrowRight className="size-4 transition-transform duration-500 ease-out group-hover:translate-x-1" />
            </button>
            <button
              type="button"
              onClick={() => onShopCategory("hoodies")}
              className="tw-link text-[0.95rem] font-medium"
            >
              Lo nuevo en hoodies
            </button>
          </div>
        </div>

        <div className="relative">
          <div
            className="tw-rise tw-media relative aspect-[4/5] w-full rounded-[2px] bg-[var(--tw-paper-deep)]"
            style={{ ["--d" as string]: "160ms" }}
          >
            <Image
              src={HERO_IMAGE}
              alt="Perchero con prendas básicas en tonos neutros bajo luz natural"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
          <span
            className="tw-rise tw-display absolute -left-3 bottom-6 hidden text-[1.4rem] text-[var(--tw-ink)] lg:block"
            style={{ ["--d" as string]: "360ms" }}
          >
            est. 2025
          </span>
        </div>
      </section>

      {/* ---------- TIRA DE CATEGORÍAS ---------- */}
      <section className="border-y border-[var(--tw-line)] bg-[var(--tw-paper-deep)]">
        <div className="mx-auto max-w-[1400px] px-5 py-6 sm:px-8 lg:px-12">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[0.78rem] uppercase tracking-[0.3em] text-[var(--tw-ink-soft)]">
              Por categoría
            </h2>
            <button
              type="button"
              onClick={onShopAll}
              className="tw-link text-[0.85rem] font-medium"
            >
              Ver todo
            </button>
          </div>
        </div>
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-px bg-[var(--tw-line)] lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => onShopCategory(cat.slug)}
              className="tw-zoom group relative flex flex-col bg-[var(--tw-paper-deep)] px-5 pb-6 pt-5 text-left transition-colors hover:bg-[var(--tw-paper)] sm:px-8 lg:px-12"
            >
              <div className="tw-media relative aspect-[3/4] w-full overflow-clip rounded-[1px]">
                <Image
                  src={cat.image}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <span className="block text-[1.35rem] font-semibold leading-tight tracking-[-0.01em]">
                    {cat.label}
                  </span>
                  <span className="mt-1 block text-[0.82rem] text-[var(--tw-ink-soft)]">
                    {cat.count}
                  </span>
                </div>
                <ArrowUpRight className="size-5 shrink-0 text-[var(--tw-ink-soft)] transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[var(--tw-clay-deep)]" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ---------- DESTACADOS (ritmo editorial, no grid uniforme) ---------- */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="max-w-[18ch] text-[clamp(1.9rem,4vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.025em]">
              Las que no nos cansamos de
              <span className="tw-display text-[var(--tw-clay-deep)]">
                {" "}
                recomendar
              </span>
              .
            </h2>
            <button
              type="button"
              onClick={onShopAll}
              className="tw-link self-start text-[0.95rem] font-medium sm:self-auto"
            >
              Toda la colección
            </button>
          </div>

          <div className="mt-14 grid gap-x-8 gap-y-14 lg:grid-cols-12">
            {featured.map((product, i) => {
              // Composición asimétrica: la primera pieza ocupa más y baja.
              const layout =
                i === 0
                  ? "lg:col-span-5"
                  : i === 1
                    ? "lg:col-span-4 lg:col-start-7 lg:mt-24"
                    : "lg:col-span-3 lg:col-start-11 lg:-mt-10";
              return (
                <article key={product.id} className={layout}>
                  <button
                    type="button"
                    onClick={() => onProductClick(product)}
                    className="tw-zoom group block w-full text-left"
                  >
                    <div className="tw-media relative aspect-[4/5] w-full rounded-[1px] bg-[var(--tw-paper-deep)]">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 1024px) 100vw, 40vw"
                        className="object-cover"
                      />
                      {product.originalPrice &&
                        product.originalPrice > product.price && (
                          <span className="absolute left-3 top-3 bg-[var(--tw-clay)] px-2.5 py-1 text-[0.72rem] font-medium uppercase tracking-[0.12em] text-[var(--tw-paper)]">
                            Oferta
                          </span>
                        )}
                    </div>
                    <div className="mt-4 flex items-baseline justify-between gap-4">
                      <h3 className="text-[1.15rem] font-medium tracking-[-0.01em]">
                        {product.name}
                      </h3>
                      <span className="shrink-0 tabular-nums text-[1.05rem]">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                    <p className="mt-1.5 max-w-[36ch] text-[0.9rem] leading-relaxed text-[var(--tw-ink-soft)]">
                      {product.description}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddToCart(product)}
                    className="mt-4 inline-flex items-center gap-2 text-[0.88rem] font-medium text-[var(--tw-clay-deep)] tw-link"
                  >
                    Añadir a la cesta
                    <ArrowRight className="size-3.5" />
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ---------- MANIFIESTO ---------- */}
      <section className="border-y border-[var(--tw-line)] bg-[var(--tw-ink)] text-[var(--tw-paper)]">
        <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
          <p className="max-w-[20ch] text-[0.78rem] uppercase tracking-[0.3em] text-[var(--tw-paper)]/55">
            Nuestra forma de hacer
          </p>
          <p className="mt-8 max-w-[24ch] text-[clamp(2rem,5.5vw,4.5rem)] font-semibold leading-[1.04] tracking-[-0.03em] sm:max-w-[28ch]">
            Pocas piezas, bien hechas, pensadas para repetirse{" "}
            <span className="tw-display text-[var(--tw-clay)]">
              temporada tras temporada.
            </span>
          </p>

          <dl className="mt-16 grid gap-x-12 gap-y-10 border-t border-[var(--tw-paper)]/15 pt-12 sm:grid-cols-3">
            {[
              {
                k: "Material",
                v: "Algodón orgánico y mezclas honestas. Sin trucos, sin etiquetas que prometen de más.",
              },
              {
                k: "Corte",
                v: "Patrones probados en cuerpos reales hasta que sientan bien de verdad.",
              },
              {
                k: "Ritmo",
                v: "Colecciones cortas. Reponemos lo que funciona en vez de inventar lo que no.",
              },
            ].map((item) => (
              <div key={item.k}>
                <dt className="text-[0.82rem] uppercase tracking-[0.18em] text-[var(--tw-clay)]">
                  {item.k}
                </dt>
                <dd className="mt-3 text-[1rem] leading-relaxed text-[var(--tw-paper)]/80">
                  {item.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------- CIERRE ---------- */}
      <section className="mx-auto max-w-[1400px] px-5 py-24 text-center sm:px-8 lg:px-12 lg:py-32">
        <h2 className="mx-auto max-w-[16ch] text-[clamp(2.2rem,6vw,5rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
          Empieza por lo
          <span className="tw-display text-[var(--tw-clay-deep)]">
            {" "}
            esencial.
          </span>
        </h2>
        <button
          type="button"
          onClick={onShopAll}
          className="group mt-10 inline-flex items-center gap-3 rounded-full bg-[var(--tw-ink)] px-8 py-4 text-[0.98rem] font-medium text-[var(--tw-paper)] transition-colors hover:bg-[var(--tw-clay-deep)]"
        >
          Explorar la colección
          <ArrowRight className="size-4 transition-transform duration-500 ease-out group-hover:translate-x-1" />
        </button>
      </section>
    </div>
  );
}

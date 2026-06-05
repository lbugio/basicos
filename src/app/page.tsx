"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { ClientOnly } from "@/components/ClientOnly";
import { Landing } from "@/components/landing/Landing";
import { Button } from "@/components/ui/button";
import { useWooCommerce } from "@/hooks/useWooCommerce";
import { Product } from "@/types/woocommerce";

// Superficies que se abren bajo demanda (drawer, modales, configuración):
// fuera del bundle inicial, se cargan al montarse. Ya viven dentro de
// <ClientOnly> y solo se renderizan al abrirse, así que ssr:false es seguro.
const Cart = dynamic(
  () => import("@/components/Cart").then((m) => m.Cart),
  { ssr: false }
);
const Checkout = dynamic(
  () => import("@/components/Checkout").then((m) => m.Checkout),
  { ssr: false }
);
const ProductDetail = dynamic(
  () => import("@/components/ProductDetail").then((m) => m.ProductDetail),
  { ssr: false }
);
const TryOn = dynamic(
  () => import("@/components/TryOn").then((m) => m.TryOn),
  { ssr: false }
);
const WooCommerceConfig = dynamic(
  () => import("@/components/WooCommerceConfig").then((m) => m.WooCommerceConfig),
  { ssr: false }
);

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [tryOnProduct, setTryOnProduct] = useState<Product | null>(null);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [tryOnSize, setTryOnSize] = useState<string | undefined>();
  const [tryOnColor, setTryOnColor] = useState<string | undefined>();
  const [showConfig, setShowConfig] = useState(false);
  const catalogRef = useRef<HTMLElement>(null);

  const {
    products,
    cartItems,
    loading,
    cartItemCount,
    loadProducts,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    getCheckoutUrl,
    processCheckout,
    isWooCommerceConfigured,
  } = useWooCommerce();

  // Filter products based on category and search
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // La landing (vitrina de marca) solo en la vista inicial sin filtros.
  const showLanding = selectedCategory === "all" && searchQuery === "";

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Solo actualizan estado; el fetch lo dispara el efecto debounced de abajo.
  // El input se mantiene responsivo aunque la red vaya diferida.
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // El hook ya hace la carga inicial; este efecto solo responde a cambios
  // posteriores de búsqueda/categoría. Sin esta guardia, dispararía un fetch
  // duplicado en el montaje.
  const didMountRef = useRef(false);

  // Búsqueda/categoría con debounce: agrupa ráfagas de teclas en una sola
  // petición. loadProducts cancela la anterior (AbortController) y descarta
  // respuestas obsoletas, eliminando request storms y stale races.
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    const query = searchQuery.trim();
    const delay = query ? 350 : 0; // categoría: inmediato; tecleo: diferido.

    const timer = setTimeout(() => {
      if (query) {
        loadProducts(undefined, query);
      } else {
        loadProducts(selectedCategory === "all" ? undefined : selectedCategory);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, loadProducts]);

  const handleAddToCart = (product: Product, size?: string, color?: string) => {
    addToCart(product, size, color);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailOpen(true);
  };

  const handleOpenTryOn = (
    product: Product,
    size?: string,
    color?: string
  ) => {
    setTryOnProduct(product);
    setTryOnSize(size);
    setTryOnColor(color);
    setIsTryOnOpen(true);
  };

  const handleCloseTryOn = () => {
    setIsTryOnOpen(false);
    setTryOnProduct(null);
    setTryOnSize(undefined);
    setTryOnColor(undefined);
  };

  const handleOpenCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handlePlaceOrder = async (checkoutData: Parameters<typeof processCheckout>[0]) => {
    return processCheckout(checkoutData);
  };

  // Desde la landing: filtra por categoría y baja al catálogo.
  const handleShopCategory = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery("");
    requestAnimationFrame(scrollToCatalog);
  };

  const handleShopAll = () => {
    setSelectedCategory("all");
    setSearchQuery("");
    requestAnimationFrame(scrollToCatalog);
  };

  const categoryLabels: Record<string, string> = {
    all: "Toda la colección",
    "t-shirts": "Remeras",
    sweatshirts: "Buzos",
    hoodies: "Hoodies",
    "tank-tops": "Musculosas",
  };

  if (showConfig) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Basicos · Configuración</h1>
            <Button variant="outline" onClick={() => setShowConfig(false)}>
              Volver a la tienda
            </Button>
          </div>
          <WooCommerceConfig
            onConfigSave={() => {
              setShowConfig(false);
              loadProducts(
                selectedCategory === "all" ? undefined : selectedCategory
              );
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="tw-landing min-h-screen bg-[var(--tw-paper)]">
      <Header
        cartItemCount={cartItemCount}
        activeCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        onCartClick={() => setIsCartOpen(true)}
        onSearchChange={handleSearchChange}
      />

      {showLanding && (
        <Landing
          products={products}
          onProductClick={handleProductClick}
          onAddToCart={(product) => handleAddToCart(product)}
          onShopCategory={handleShopCategory}
          onShopAll={handleShopAll}
        />
      )}

      <main
        ref={catalogRef}
        className="tw-landing mx-auto max-w-[1400px] scroll-mt-20 px-5 py-16 sm:px-8 lg:px-12"
      >
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--tw-line)] pb-6">
          <div className="flex items-baseline gap-4">
            <h2 className="text-[clamp(1.6rem,3.5vw,2.5rem)] font-semibold tracking-[-0.02em]">
              {categoryLabels[selectedCategory] ?? "Colección"}
            </h2>
            <span className="text-[0.85rem] text-[var(--tw-ink-soft)]">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "pieza" : "piezas"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {searchQuery && (
              <span className="bg-[var(--tw-paper-deep)] px-3 py-1 text-[0.78rem] font-medium text-[var(--tw-ink-soft)]">
                &ldquo;{searchQuery}&rdquo;
              </span>
            )}
            {loading && (
              <span className="inline-flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.14em] text-[var(--tw-ink-soft)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--tw-clay)]" />
                Cargando
              </span>
            )}
          </div>
        </div>

        {loading ? (
          // Skeleton con el mismo ritmo que el grid real, para evitar el salto
          // de layout cuando llegan los productos.
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col">
                <div className="aspect-[4/5] w-full animate-pulse rounded-[1px] bg-[var(--tw-paper-deep)]" />
                <div className="mt-4 h-4 w-2/3 animate-pulse rounded-full bg-[var(--tw-paper-deep)]" />
                <div className="mt-2.5 h-3 w-full animate-pulse rounded-full bg-[var(--tw-paper-deep)]" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-28 text-center">
            <p className="tw-display text-[1.7rem] italic text-[var(--tw-ink)]">
              No encontramos esa pieza.
            </p>
            <p className="mx-auto mt-3 max-w-[34ch] text-[0.92rem] text-[var(--tw-ink-soft)]">
              Probá con otra búsqueda o mirá toda la colección.
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="tw-link mt-6 text-[0.92rem] font-medium text-[var(--tw-clay-deep)]"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product, i) => (
              <div
                key={product.id}
                className="tw-rise"
                style={{ ["--d" as string]: `${Math.min(i, 8) * 60}ms` }}
              >
                <ProductCard
                  product={product}
                  onAddToCart={(product) => handleAddToCart(product)}
                  onProductClick={handleProductClick}
                  onTryOn={handleOpenTryOn}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="tw-landing border-t border-[var(--tw-line)] bg-[var(--tw-paper-deep)] py-16">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-10 px-5 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-12">
          <div>
            <p className="text-[2rem] font-semibold uppercase tracking-[0.18em]">
              Basicos
            </p>
            <p className="mt-2 max-w-[34ch] text-[0.95rem] text-[var(--tw-ink-soft)]">
              Esenciales atemporales para tu día a día. Calidad honesta, envíos
              a todo el país y cambios sin drama.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-[0.85rem] text-[var(--tw-ink-soft)] lg:items-end">
            <button
              type="button"
              onClick={() => setShowConfig(true)}
              className="tw-link self-start lg:self-end"
            >
              Configurar WooCommerce
            </button>
            <span>© 2025 Basicos · Hecho en Argentina</span>
            <ClientOnly>
              {isWooCommerceConfigured() && <span>Conectado con WooCommerce</span>}
            </ClientOnly>
          </div>
        </div>
      </footer>

      {/* Montaje condicional: el chunk dinámico de cada overlay se descarga
          al abrirse, no en la carga inicial. Ningún overlay tiene animación
          de salida dependiente del montaje, así que desmontar al cerrar es
          seguro y reinicia limpio la animación de entrada. */}
      <ClientOnly>
        {isCartOpen && (
          <Cart
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cartItems={cartItems}
            onUpdateQuantity={updateCartQuantity}
            onRemoveItem={removeFromCart}
            onCheckout={handleOpenCheckout}
            checkoutUrl={getCheckoutUrl()}
          />
        )}

        {isCheckoutOpen && (
          <Checkout
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            cartItems={cartItems}
            onPlaceOrder={handlePlaceOrder}
            loading={loading}
          />
        )}

        {isProductDetailOpen && selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            isOpen={isProductDetailOpen}
            onClose={() => setIsProductDetailOpen(false)}
            onAddToCart={handleAddToCart}
            onTryOn={handleOpenTryOn}
          />
        )}

        {isTryOnOpen && tryOnProduct && (
          <TryOn
            product={tryOnProduct}
            isOpen={isTryOnOpen}
            onClose={handleCloseTryOn}
            onAddToCart={handleAddToCart}
            initialSize={tryOnSize}
            initialColor={tryOnColor}
          />
        )}
      </ClientOnly>
    </div>
  );
}

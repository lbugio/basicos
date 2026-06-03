"use client";
import { useState, useMemo, useRef } from "react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Cart } from "@/components/Cart";
import { ProductDetail } from "@/components/ProductDetail";
import { WooCommerceConfig } from "@/components/WooCommerceConfig";
import { Checkout } from "@/components/Checkout";
import { ClientOnly } from "@/components/ClientOnly";
import { Landing } from "@/components/landing/Landing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWooCommerce } from "@/hooks/useWooCommerce";
import { Product } from "@/types/woocommerce";

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
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

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      loadProducts(undefined, query);
    } else {
      loadProducts(selectedCategory === "all" ? undefined : selectedCategory);
    }
  };

  const handleAddToCart = (product: Product, size?: string, color?: string) => {
    addToCart(product, size, color);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailOpen(true);
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
    "t-shirts": "Camisetas",
    sweatshirts: "Sudaderas",
    hoodies: "Hoodies",
    "tank-tops": "Tank tops",
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
    <div className="min-h-screen bg-[oklch(0.972_0.012_75)]">
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
              <Badge variant="secondary">
                &ldquo;{searchQuery}&rdquo;
              </Badge>
            )}
            {loading && <Badge variant="outline">Cargando…</Badge>}
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center text-[var(--tw-ink-soft)]">
            Cargando productos…
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-[var(--tw-ink-soft)]">
              No encontramos piezas para esta búsqueda.
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                className="mt-5"
                onClick={() => handleSearchChange("")}
              >
                Limpiar búsqueda
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={(product) => handleAddToCart(product)}
                onProductClick={handleProductClick}
              />
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
              Esenciales atemporales para tu día a día. Calidad honesta, envío
              gratuito.
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
            <span>© 2025 Basicos · Calidad garantizada</span>
            <ClientOnly>
              {isWooCommerceConfigured() && <span>Conectado con WooCommerce</span>}
            </ClientOnly>
          </div>
        </div>
      </footer>

      <ClientOnly>
        <Cart
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={updateCartQuantity}
          onRemoveItem={removeFromCart}
          onCheckout={handleOpenCheckout}
          checkoutUrl={getCheckoutUrl()}
        />

        <Checkout
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          cartItems={cartItems}
          onPlaceOrder={handlePlaceOrder}
          loading={loading}
        />

        <ProductDetail
          product={selectedProduct}
          isOpen={isProductDetailOpen}
          onClose={() => setIsProductDetailOpen(false)}
          onAddToCart={handleAddToCart}
        />
      </ClientOnly>
    </div>
  );
}

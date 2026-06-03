import { useState, useEffect } from "react";
import { Search, ShoppingBag, Menu, X } from "lucide-react";

interface HeaderProps {
  cartItemCount: number;
  activeCategory?: string;
  onCategoryChange: (category: string) => void;
  onCartClick: () => void;
  onSearchChange: (query: string) => void;
}

const CATEGORIES = [
  { id: "all", label: "Todo" },
  { id: "t-shirts", label: "Camisetas" },
  { id: "sweatshirts", label: "Sudaderas" },
  { id: "hoodies", label: "Hoodies" },
  { id: "tank-tops", label: "Tank tops" },
];

export function Header({
  cartItemCount,
  activeCategory = "all",
  onCategoryChange,
  onCartClick,
  onSearchChange,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Avoid a hydration mismatch: the cart count comes from localStorage.
  const safeCartItemCount = isHydrated ? cartItemCount : 0;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearchChange(query);
  };

  return (
    <header className="tw-landing sticky top-0 z-50 border-b border-[var(--tw-line)] bg-[var(--tw-paper)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-[4.5rem] max-w-[1400px] items-center gap-6 px-5 sm:px-8 lg:px-12">
        {/* Wordmark */}
        <button
          type="button"
          onClick={() => onCategoryChange("all")}
          className="flex-shrink-0 text-[1.3rem] font-semibold uppercase tracking-[0.2em] text-[var(--tw-ink)]"
          aria-label="Basicos, ir al inicio"
        >
          Basicos
        </button>

        {/* Desktop categories */}
        <nav className="hidden flex-1 items-center justify-center gap-7 md:flex">
          {CATEGORIES.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(category.id)}
                aria-current={isActive ? "page" : undefined}
                className={`tw-link text-[0.92rem] transition-colors ${
                  isActive
                    ? "font-medium text-[var(--tw-ink)]"
                    : "text-[var(--tw-ink-soft)] hover:text-[var(--tw-ink)]"
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </nav>

        {/* Desktop search */}
        <div className="ml-auto hidden w-full max-w-[15rem] lg:block">
          <SearchField value={searchQuery} onChange={handleSearchChange} />
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onCartClick}
            aria-label={`Abrir la cesta${
              safeCartItemCount > 0 ? `, ${safeCartItemCount} artículos` : ""
            }`}
            className="relative grid h-[44px] w-[44px] place-items-center rounded-full text-[var(--tw-ink)] transition-colors hover:text-[var(--tw-clay-deep)]"
          >
            <ShoppingBag className="h-[1.2rem] w-[1.2rem]" strokeWidth={1.6} />
            {safeCartItemCount > 0 && (
              <span className="absolute right-1.5 top-1.5 grid h-[1.1rem] min-w-[1.1rem] place-items-center rounded-full bg-[var(--tw-clay)] px-1 text-[0.65rem] font-semibold tabular-nums text-[var(--tw-paper)]">
                {safeCartItemCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Cerrar el menú" : "Abrir el menú"}
            aria-expanded={isMenuOpen}
            className="grid h-[44px] w-[44px] place-items-center rounded-full text-[var(--tw-ink)] transition-colors hover:text-[var(--tw-clay-deep)] md:hidden"
          >
            {isMenuOpen ? (
              <X className="h-[1.2rem] w-[1.2rem]" strokeWidth={1.6} />
            ) : (
              <Menu className="h-[1.2rem] w-[1.2rem]" strokeWidth={1.6} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {isMenuOpen && (
        <div className="border-t border-[var(--tw-line)] px-5 pb-6 pt-4 sm:px-8 md:hidden">
          <SearchField value={searchQuery} onChange={handleSearchChange} />

          <nav className="mt-5 flex flex-col">
            {CATEGORIES.map((category) => {
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    onCategoryChange(category.id);
                    setIsMenuOpen(false);
                  }}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center justify-between border-b border-[var(--tw-line)] py-3.5 text-left text-[1.05rem] transition-colors last:border-b-0 ${
                    isActive
                      ? "font-medium text-[var(--tw-ink)]"
                      : "text-[var(--tw-ink-soft)]"
                  }`}
                >
                  {category.label}
                  {isActive && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: "var(--tw-clay)" }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

function SearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="relative w-full">
      <Search
        className="pointer-events-none absolute left-0 top-1/2 h-[1.05rem] w-[1.05rem] -translate-y-1/2 text-[var(--tw-ink-soft)]"
        strokeWidth={1.6}
      />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder="Buscar"
        aria-label="Buscar productos"
        className="w-full border-b border-[var(--tw-line)] bg-transparent py-2.5 pl-7 text-[0.92rem] text-[var(--tw-ink)] placeholder:text-[var(--tw-ink-soft)] focus:border-[var(--tw-clay-deep)] focus:outline-none"
      />
    </div>
  );
}

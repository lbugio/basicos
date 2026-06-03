import { useState, useEffect, useCallback } from "react";
import { wooCommerceService } from "../services/woocommerce";
import { Product, CartItem } from "../types/woocommerce";

export function useWooCommerce() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Load products
  const loadProducts = useCallback(
    async (category?: string, searchQuery?: string) => {
      setLoading(true);
      setError(null);

      try {
        let fetchedProducts: Product[] = [];

        if (wooCommerceService.isConfigured()) {
          if (searchQuery) {
            fetchedProducts = await wooCommerceService.searchProducts(
              searchQuery
            );
          } else {
            fetchedProducts = await wooCommerceService.getProducts(
              1,
              50,
              category
            );
          }
          setProducts(fetchedProducts);
        } else {
          // WooCommerce not configured: use mock data. getMockProducts runs the
          // same convertProduct() pipeline as the live API, so the shape is
          // identical to real WooCommerce data.
          setProducts(
            wooCommerceService.getMockProducts(category, searchQuery)
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error loading products";
        setError(errorMessage);

        // Fallback to mock data if a configured WooCommerce call fails.
        setProducts(wooCommerceService.getMockProducts(category, searchQuery));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load cart from localStorage
  const loadCart = useCallback(() => {
    // Only load cart on client side
    if (typeof window === "undefined") {
      return;
    }

    try {
      const wooCartItems = wooCommerceService.getLocalCart();

      // Convert WooCommerce cart items to our CartItem format
      const convertedItems: CartItem[] = wooCartItems.map((wooItem: any) => {
        // Create a product object from cart item data
        const product: Product = {
          id: wooItem.id.toString(),
          name: wooItem.name,
          price: wooItem.price,
          description: "",
          image: wooItem.images[0]?.src || "",
          category: "t-shirts", // Default category
          sizes: ["S", "M", "L", "XL"],
          colors: ["Black", "White"],
          inStock: true,
          sku: wooItem.sku,
        };

        return {
          product,
          quantity: wooItem.quantity,
          selectedSize:
            wooItem.variation.find((v: any) => v.attribute === "Size")?.value ||
            "M",
          selectedColor:
            wooItem.variation.find((v: any) => v.attribute === "Color")
              ?.value || "Black",
          cartKey: wooItem.key,
        };
      });

      setCartItems(convertedItems);
    } catch (err) {
      console.error("Error loading cart:", err);
      setCartItems([]);
    }
  }, []);

  // Add item to cart
  const addToCart = useCallback(
    async (product: Product, size?: string, color?: string) => {
      try {
        const selectedSize = size || product.sizes[0];
        const selectedColor = color || product.colors[0];

        await wooCommerceService.addToCart(product.id, 1, {
          size: selectedSize,
          color: selectedColor,
        });

        // Reload cart
        loadCart();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error adding to cart";
        setError(errorMessage);
        console.error("Error adding to cart:", err);
      }
    },
    [loadCart]
  );

  // Update cart item quantity
  const updateCartQuantity = useCallback(
    async (cartKey: string, quantity: number) => {
      try {
        if (quantity === 0) {
          await wooCommerceService.removeCartItem(cartKey);
        } else {
          await wooCommerceService.updateCartItem(cartKey, quantity);
        }

        // Reload cart
        loadCart();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error updating cart";
        setError(errorMessage);
        console.error("Error updating cart:", err);
      }
    },
    [loadCart]
  );

  // Remove item from cart
  const removeFromCart = useCallback(
    async (cartKey: string) => {
      try {
        await wooCommerceService.removeCartItem(cartKey);

        // Reload cart
        loadCart();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error removing from cart";
        setError(errorMessage);
        console.error("Error removing from cart:", err);
      }
    },
    [loadCart]
  );

  // Calculate cart totals
  const cartTotal = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
  const cartItemCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // Get checkout URL
  const getCheckoutUrl = useCallback(() => {
    return wooCommerceService.getCheckoutUrl();
  }, []);

  // Process checkout order
  const processCheckout = useCallback(
    async (checkoutData: any) => {
      try {
        setLoading(true);
        setError(null);

        // Get current cart items in the format expected by the service
        const wooCartItems = wooCommerceService.getLocalCart();

        // Create the order
        const order = await wooCommerceService.createOrder(
          checkoutData,
          wooCartItems
        );

        // Clear the cart and reload
        setCartItems([]);
        loadCart();

        return order;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error processing checkout";
        setError(errorMessage);
        console.error("Error processing checkout:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadCart]
  );

  // Check if WooCommerce is configured
  const isWooCommerceConfigured = useCallback(() => {
    return wooCommerceService.isConfigured();
  }, []);

  // Load initial data only after hydration
  useEffect(() => {
    if (isHydrated) {
      loadProducts();
      loadCart();
    }
  }, [isHydrated, loadProducts, loadCart]);

  return {
    products,
    cartItems,
    loading,
    error,
    cartTotal,
    cartItemCount,
    loadProducts,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    getCheckoutUrl,
    processCheckout,
    isWooCommerceConfigured,
  };
}

import {
  WooCommerceProduct,
  WooCommerceVariation,
  WooCommerceCart,
  Product,
  ProductVariation,
} from "../types/woocommerce";
import { mockWooCommerceProducts } from "../data/mock-woocommerce";

// The browser talks only to our same-origin proxy at /api/woocommerce/*.
// OAuth signing and the consumer key/secret live server-side in the route
// handler, so no credentials are ever shipped to the client and there is no
// cross-origin (CORS) request to the WordPress host.
const PROXY_BASE = "/api/woocommerce";

// The store URL is public (used for checkout links). A separate boolean flag
// signals whether the server has WooCommerce credentials configured, so the
// client can decide between live data and mock data without seeing secrets.
const STORE_URL = process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL || "";
const WOO_ENABLED = process.env.NEXT_PUBLIC_WOOCOMMERCE_ENABLED === "true";

class WooCommerceService {
  private storeURL: string;

  constructor() {
    this.storeURL = STORE_URL;
  }

  isConfigured(): boolean {
    return WOO_ENABLED;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error("WooCommerce is not configured");
    }

    // endpoint starts with "/", e.g. "/products?per_page=20"
    const url = `${PROXY_BASE}${endpoint}`;
    const method = (options.method || "GET") as string;

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: options.body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("WooCommerce API Error Response:", errorText);
      throw new Error(
        `WooCommerce API Error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return response.json();
  }

  // Convert WooCommerce product to our Product type
  private convertProduct(wcProduct: WooCommerceProduct): Product {
    // Extract size and color attributes
    const sizeAttribute = wcProduct.attributes.find(
      (attr) =>
        attr.name.toLowerCase().includes("size") ||
        attr.name.toLowerCase().includes("talla")
    );
    const colorAttribute = wcProduct.attributes.find(
      (attr) =>
        attr.name.toLowerCase().includes("color") ||
        attr.name.toLowerCase().includes("colour")
    );

    // Get category name (clothing categories)
    const category =
      wcProduct.categories.length > 0
        ? wcProduct.categories[0].slug
        : "clothing";

    return {
      id: wcProduct.id.toString(),
      name: wcProduct.name,
      price: parseFloat(wcProduct.price || wcProduct.regular_price),
      originalPrice: wcProduct.sale_price
        ? parseFloat(wcProduct.regular_price)
        : undefined,
      description: wcProduct.short_description || wcProduct.description,
      image: wcProduct.images.length > 0 ? wcProduct.images[0].src : "",
      category: this.mapCategory(category),
      sizes: sizeAttribute?.options || ["S", "M", "L", "XL"],
      colors: colorAttribute?.options || ["Black", "White"],
      inStock: wcProduct.stock_status === "instock",
      featured: wcProduct.featured,
      sku: wcProduct.sku,
    };
  }

  private mapCategory(wcCategory: string): string {
    const categoryMap: Record<string, string> = {
      camisetas: "t-shirts",
      "t-shirts": "t-shirts",
      tshirts: "t-shirts",
      sudaderas: "sweatshirts",
      sweatshirts: "sweatshirts",
      hoodies: "hoodies",
      "sudaderas-con-capucha": "hoodies",
      "tank-tops": "tank-tops",
      "camisetas-tirantes": "tank-tops",
    };

    return categoryMap[wcCategory] || "t-shirts";
  }

  // --- Mock data ---------------------------------------------------------
  // These run the SAME convertProduct() pipeline as the live API, so the rest
  // of the app behaves identically whether data comes from WooCommerce or the
  // local mock. Used as a fallback when WooCommerce is not configured / down.

  getMockProducts(category?: string, searchQuery?: string): Product[] {
    let wcProducts = mockWooCommerceProducts;

    if (category && category !== "all") {
      const wcCategoryMap: Record<string, string> = {
        "t-shirts": "camisetas",
        sweatshirts: "sudaderas",
        hoodies: "hoodies",
        "tank-tops": "tank-tops",
      };
      const wcCategory = wcCategoryMap[category] || category;
      wcProducts = wcProducts.filter((p) =>
        p.categories.some((c) => c.slug === wcCategory)
      );
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      wcProducts = wcProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.short_description.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    return wcProducts.map((product) => this.convertProduct(product));
  }

  getMockProduct(productId: string): Product | null {
    const wcProduct = mockWooCommerceProducts.find(
      (p) => p.id.toString() === productId
    );
    return wcProduct ? this.convertProduct(wcProduct) : null;
  }

  // Get all products
  async getProducts(
    page: number = 1,
    perPage: number = 20,
    category?: string
  ): Promise<Product[]> {
    try {
      if (!this.isConfigured()) {
        throw new Error("WooCommerce not configured");
      }

      let endpoint = `/products?page=${page}&per_page=${perPage}&status=publish`;

      if (category && category !== "all") {
        // Map our category to WooCommerce category
        const wcCategoryMap: Record<string, string> = {
          "t-shirts": "camisetas",
          sweatshirts: "sudaderas",
          hoodies: "hoodies",
          "tank-tops": "tank-tops",
        };
        const wcCategory = wcCategoryMap[category] || category;
        endpoint += `&category=${wcCategory}`;
      }

      const wcProducts: WooCommerceProduct[] = await this.request(endpoint);
      return wcProducts.map((product) => this.convertProduct(product));
    } catch (error) {
      console.error("Error fetching products:", error);
      // Return empty array so the hook can fallback to mock data
      throw error;
    }
  }

  // Get single product with variations
  async getProduct(productId: string): Promise<Product | null> {
    try {
      if (!this.isConfigured()) {
        throw new Error("WooCommerce not configured");
      }

      const wcProduct: WooCommerceProduct = await this.request(
        `/products/${productId}`
      );

      let variations: ProductVariation[] = [];
      if (wcProduct.variations && wcProduct.variations.length > 0) {
        const wcVariations: WooCommerceVariation[] = await this.request(
          `/products/${productId}/variations`
        );

        variations = wcVariations.map((variation) => ({
          id: variation.id.toString(),
          sku: variation.sku,
          price: parseFloat(variation.price),
          regularPrice: parseFloat(variation.regular_price),
          attributes: {
            size: variation.attributes.find((attr) =>
              attr.name.toLowerCase().includes("size")
            )?.option,
            color: variation.attributes.find((attr) =>
              attr.name.toLowerCase().includes("color")
            )?.option,
          },
          inStock: variation.stock_status === "instock",
          stockQuantity: variation.stock_quantity ?? undefined,
        }));
      }

      const product = this.convertProduct(wcProduct);
      product.variations = variations;

      return product;
    } catch (error) {
      console.error("Error fetching product:", error);
      throw error;
    }
  }

  // Search products
  async searchProducts(query: string): Promise<Product[]> {
    try {
      if (!this.isConfigured()) {
        throw new Error("WooCommerce not configured");
      }

      const wcProducts: WooCommerceProduct[] = await this.request(
        `/products?search=${encodeURIComponent(query)}&status=publish`
      );
      return wcProducts.map((product) => this.convertProduct(product));
    } catch (error) {
      console.error("Error searching products:", error);
      throw error;
    }
  }

  // Add item to cart (requires WooCommerce Store API or custom endpoint)
  async addToCart(
    productId: string,
    quantity: number = 1,
    variation?: { size?: string; color?: string }
  ) {
    try {
      // This would typically use the WooCommerce Store API
      // For now, we'll use localStorage to simulate cart functionality
      const cartKey = `${productId}-${variation?.size || "default"}-${
        variation?.color || "default"
      }`;

      const cartItems = this.getLocalCart();
      interface CartItem {
        key: string;
        id: number;
        quantity: number;
        name: string;
        sku: string;
        permalink: string;
        images: Array<{
          id: number;
          src: string;
          name: string;
          alt: string;
        }>;
        price: number;
        line_price: number;
        variation: Array<{
          attribute: string;
          value: string;
        }>;
      }

            const existingItem: CartItem | undefined = cartItems.find((item: CartItem) => item.key === cartKey);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        // Try to get product details: live WooCommerce first, then mock.
        let product;
        if (this.isConfigured()) {
          try {
            product = await this.getProduct(productId);
          } catch (error) {
            console.warn(
              "Could not fetch product from WooCommerce, using fallback"
            );
          }
        }
        if (!product) {
          product = this.getMockProduct(productId);
        }

        // If we still have no product, create a basic placeholder object
        if (!product) {
          product = {
            id: productId,
            name: "Product",
            price: 0,
            description: "",
            image: "",
            category: "t-shirts",
            sizes: ["S", "M", "L", "XL"],
            colors: ["Black", "White"],
            inStock: true,
          };
        }

        cartItems.push({
          key: cartKey,
          id: parseInt(productId),
          quantity,
          name: product.name,
          sku: product.sku || "",
          permalink: "",
          images: [
            {
              id: 0,
              src: product.image,
              name: product.name,
              alt: product.name,
            },
          ],
          price: product.price,
          line_price: product.price * quantity,
          variation: [
            ...(variation?.size
              ? [{ attribute: "Size", value: variation.size }]
              : []),
            ...(variation?.color
              ? [{ attribute: "Color", value: variation.color }]
              : []),
          ],
        });
      }

      localStorage.setItem("woo_cart", JSON.stringify(cartItems));
      return { success: true, cartKey };
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  }

  // Update cart item quantity
  async updateCartItem(cartKey: string, quantity: number) {
    try {
      const cartItems = this.getLocalCart();
      interface CartItem {
        key: string;
        id: number;
        quantity: number;
        name: string;
        sku: string;
        permalink: string;
        images: Array<{
          id: number;
          src: string;
          name: string;
          alt: string;
        }>;
        price: number;
        line_price: number;
        variation: Array<{
          attribute: string;
          value: string;
        }>;
      }

      const itemIndex: number = cartItems.findIndex((item: CartItem) => item.key === cartKey);

      if (itemIndex >= 0) {
        if (quantity > 0) {
          cartItems[itemIndex].quantity = quantity;
          cartItems[itemIndex].line_price =
            cartItems[itemIndex].price * quantity;
        } else {
          cartItems.splice(itemIndex, 1);
        }

        localStorage.setItem("woo_cart", JSON.stringify(cartItems));
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating cart item:", error);
      throw error;
    }
  }

  // Remove item from cart
  async removeCartItem(cartKey: string) {
    try {
      const cartItems = this.getLocalCart();
      interface CartItem {
        key: string;
        id: number;
        quantity: number;
        name: string;
        sku: string;
        permalink: string;
        images: Array<{
          id: number;
          src: string;
          name: string;
          alt: string;
        }>;
        price: number;
        line_price: number;
        variation: Array<{
          attribute: string;
          value: string;
        }>;
      }

      const filteredItems: CartItem[] = cartItems.filter((item: CartItem) => item.key !== cartKey);
      localStorage.setItem("woo_cart", JSON.stringify(filteredItems));
      return { success: true };
    } catch (error) {
      console.error("Error removing cart item:", error);
      throw error;
    }
  }

  // Get cart contents
  getLocalCart() {
    try {
      const cart = localStorage.getItem("woo_cart");
      return cart ? JSON.parse(cart) : [];
    } catch {
      return [];
    }
  }

  // Create checkout URL
  getCheckoutUrl(): string {
    return this.storeURL ? `${this.storeURL}/checkout/` : "#";
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        return false;
      }

      await this.request("/products");
      return true;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  }

  // Create order (this would typically be handled by WooCommerce checkout)
  async createOrder(checkoutData: any, cartItems: any[]) {
    try {
      if (!this.isConfigured()) {
        // If WooCommerce is not configured, create a mock order
        const mockOrder = {
          id: Math.floor(Math.random() * 10000),
          number: `ORD-${Date.now()}`,
          status: 'processing',
          currency: 'EUR',
          total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2),
          billing: checkoutData.billing,
          shipping: checkoutData.shipping,
          payment_method: checkoutData.payment_method,
          payment_method_title: checkoutData.payment_method_title,
          date_created: new Date().toISOString(),
          line_items: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            product_id: item.id,
            quantity: item.quantity,
            total: (item.price * item.quantity).toFixed(2),
          })),
        };

        // Clear the cart after successful order
        if (typeof window !== 'undefined') {
          localStorage.removeItem("woo_cart");
        }

        return mockOrder;
      }

      // Real WooCommerce order creation with proper data types
      const orderData = {
        payment_method: checkoutData.payment_method || 'cod',
        payment_method_title: checkoutData.payment_method_title || 'Contra reembolso',
        set_paid: false,
        billing: {
          first_name: checkoutData.billing?.firstName || '',
          last_name: checkoutData.billing?.lastName || '',
          address_1: checkoutData.billing?.address || '',
          address_2: checkoutData.billing?.address2 || '',
          city: checkoutData.billing?.city || '',
          state: checkoutData.billing?.state || '',
          postcode: checkoutData.billing?.postalCode || '',
          country: checkoutData.billing?.country || 'ES',
          email: checkoutData.billing?.email || '',
          phone: checkoutData.billing?.phone || '',
        },
        shipping: {
          first_name: checkoutData.shipping?.firstName || checkoutData.billing?.firstName || '',
          last_name: checkoutData.shipping?.lastName || checkoutData.billing?.lastName || '',
          address_1: checkoutData.shipping?.address || checkoutData.billing?.address || '',
          address_2: checkoutData.shipping?.address2 || checkoutData.billing?.address2 || '',
          city: checkoutData.shipping?.city || checkoutData.billing?.city || '',
          state: checkoutData.shipping?.state || checkoutData.billing?.state || '',
          postcode: checkoutData.shipping?.postalCode || checkoutData.billing?.postalCode || '',
          country: checkoutData.shipping?.country || checkoutData.billing?.country || 'ES',
        },
        customer_note: checkoutData.customer_note || '',
        line_items: cartItems.map((item) => {
          const lineItem: any = {
            product_id: parseInt(item.id.toString()),
            quantity: parseInt(item.quantity.toString()),
          };

          // Only include variation_id if it exists and is not 0
          if (item.variation_id && item.variation_id !== 0) {
            lineItem.variation_id = parseInt(item.variation_id.toString());
          }

          // Add meta data for variations if they exist
          if (item.variation && Array.isArray(item.variation) && item.variation.length > 0) {
            lineItem.meta_data = item.variation.map((v: any) => ({
              key: v.attribute || 'attribute',
              value: v.value || ''
            }));
          }

          return lineItem;
        }),
        shipping_lines: [
          {
            method_id: 'flat_rate',
            method_title: 'Envío estándar',
            total: '5.00'
          }
        ]
      };

      console.log('Creating WooCommerce order, item count:', orderData.line_items.length);

      const order = await this.request("/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
      });

      // Clear the cart after successful order
      if (typeof window !== 'undefined') {
        localStorage.removeItem("woo_cart");
      }

      return order;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }
}

export const wooCommerceService = new WooCommerceService();

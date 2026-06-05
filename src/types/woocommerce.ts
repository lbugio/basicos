// WooCommerce API types
export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  status: 'draft' | 'pending' | 'private' | 'publish';
  featured: boolean;
  catalog_visibility: 'visible' | 'catalog' | 'search' | 'hidden';
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
  manage_stock: boolean;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  images: Array<{
    id: number;
    src: string;
    name: string;
    alt: string;
  }>;
  attributes: Array<{
    id: number;
    name: string;
    position: number;
    visible: boolean;
    variation: boolean;
    options: string[];
  }>;
  variations: number[];
  meta_data: Array<{
    id: number;
    key: string;
    value: string;
  }>;
}

export interface WooCommerceVariation {
  id: number;
  date_created: string;
  date_modified: string;
  description: string;
  permalink: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  status: 'draft' | 'pending' | 'private' | 'publish';
  purchasable: boolean;
  virtual: boolean;
  downloadable: boolean;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
  manage_stock: boolean;
  attributes: Array<{
    id: number;
    name: string;
    option: string;
  }>;
  image: {
    id: number;
    src: string;
    name: string;
    alt: string;
  } | null;
}

export interface WooCommerceCartItem {
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

export interface WooCommerceCart {
  coupons: any[];
  shipping_rates: any[];
  shipping_address: any;
  billing_address: any;
  items: WooCommerceCartItem[];
  items_count: number;
  items_weight: number;
  cross_sells: any[];
  needs_payment: boolean;
  needs_shipping: boolean;
  has_calculated_shipping: boolean;
  fees: any[];
  totals: {
    currency_code: string;
    currency_symbol: string;
    currency_minor_unit: number;
    currency_decimal_separator: string;
    currency_thousand_separator: string;
    currency_prefix: string;
    currency_suffix: string;
    total_items: string;
    total_items_tax: string;
    total_fees: string;
    total_fees_tax: string;
    total_discount: string;
    total_discount_tax: string;
    total_shipping: string;
    total_shipping_tax: string;
    total_price: string;
    total_tax: string;
    tax_lines: any[];
  };
}

// Converted types for our application
export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  image: string;
  category: string;
  sizes: string[];
  colors: string[];
  inStock: boolean;
  stockQuantity?: number;
  featured?: boolean;
  sku?: string;
  variations?: ProductVariation[];
}

export interface ProductVariation {
  id: string;
  sku: string;
  price: number;
  regularPrice: number;
  attributes: {
    size?: string;
    color?: string;
  };
  inStock: boolean;
  stockQuantity?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
  cartKey?: string;
  variationId?: string;
}
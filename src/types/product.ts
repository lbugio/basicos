export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  image: string;
  category: 't-shirts' | 'sweatshirts' | 'hoodies' | 'tank-tops';
  sizes: Array<'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'>;
  colors: string[];
  inStock: boolean;
  featured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}
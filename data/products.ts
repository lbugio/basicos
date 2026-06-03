import { Product } from "@/types/woocommerce";

export const products: Product[] = [
  {
    id: '1',
    name: 'Classic White Tee',
    price: 29.99,
    originalPrice: 39.99,
    description: 'Premium cotton t-shirt with a relaxed fit. Perfect for everyday wear.',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop',
    category: 't-shirts',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['White', 'Black', 'Gray'],
    inStock: true,
    featured: true
  },
  {
    id: '2',
    name: 'Oversized Hoodie',
    price: 79.99,
    description: 'Cozy oversized hoodie made from organic cotton blend. Perfect for layering.',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=500&fit=crop',
    category: 'hoodies',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Navy', 'Forest Green', 'Cream'],
    inStock: true,
    featured: true
  },
  {
    id: '3',
    name: 'Crew Neck Sweatshirt',
    price: 59.99,
    description: 'Classic crew neck sweatshirt with ribbed collar and cuffs.',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=500&fit=crop',
    category: 'sweatshirts',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Gray', 'Black', 'White', 'Navy'],
    inStock: true
  },
  {
    id: '4',
    name: 'Vintage Tank Top',
    price: 24.99,
    originalPrice: 34.99,
    description: 'Soft vintage-style tank top with a comfortable loose fit.',
    image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=500&fit=crop',
    category: 'tank-tops',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['White', 'Black', 'Dusty Pink', 'Sage Green'],
    inStock: true
  },
  {
    id: '5',
    name: 'Pocket Tee',
    price: 34.99,
    description: 'Relaxed fit t-shirt with chest pocket detail.',
    image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&h=500&fit=crop',
    category: 't-shirts',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['White', 'Black', 'Olive', 'Burgundy'],
    inStock: true
  },
  {
    id: '6',
    name: 'Zip-Up Hoodie',
    price: 89.99,
    description: 'Full-zip hoodie with kangaroo pocket and adjustable drawstring.',
    image: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=400&h=500&fit=crop',
    category: 'hoodies',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Gray', 'Navy'],
    inStock: true,
    featured: true
  },
  {
    id: '7',
    name: 'Cropped Sweatshirt',
    price: 49.99,
    description: 'Trendy cropped sweatshirt with dropped shoulders.',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop',
    category: 'sweatshirts',
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Pink', 'Lavender', 'Cream', 'Light Gray'],
    inStock: true
  },
  {
    id: '8',
    name: 'Basic Long Sleeve',
    price: 39.99,
    description: 'Essential long sleeve tee in soft cotton jersey.',
    image: 'https://images.unsplash.com/photo-1622519407650-3df9883f76a4?w=400&h=500&fit=crop',
    category: 't-shirts',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['White', 'Black', 'Navy', 'Forest Green'],
    inStock: true
  }
];
import { useState } from 'react';
import { Product } from '../types/woocommerce';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { X, Check } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProductDetailProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, color: string) => void;
}

export function ProductDetail({ product, isOpen, onClose, onAddToCart }: ProductDetailProps) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  if (!isOpen || !product) return null;

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) return;
    onAddToCart(product, selectedSize, selectedColor);
    onClose();
  };

  const getColorStyle = (color: string) => ({
    backgroundColor: color.toLowerCase() === 'white' ? '#ffffff' :
                    color.toLowerCase() === 'black' ? '#000000' :
                    color.toLowerCase() === 'gray' ? '#6b7280' :
                    color.toLowerCase() === 'navy' ? '#1e3a8a' :
                    color.toLowerCase() === 'forest green' ? '#166534' :
                    color.toLowerCase() === 'cream' ? '#fef3c7' :
                    color.toLowerCase() === 'pink' ? '#f472b6' :
                    color.toLowerCase() === 'lavender' ? '#c4b5fd' :
                    color.toLowerCase() === 'light gray' ? '#d1d5db' :
                    color.toLowerCase() === 'olive' ? '#65a30d' :
                    color.toLowerCase() === 'burgundy' ? '#7c2d12' :
                    color.toLowerCase() === 'dusty pink' ? '#f9a8d4' :
                    color.toLowerCase() === 'sage green' ? '#84cc16' :
                    '#9ca3af'
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="absolute inset-4 md:inset-8 lg:inset-16 bg-background rounded-lg shadow-xl overflow-hidden">
        <div className="h-full flex flex-col lg:flex-row">
          {/* Image Section */}
          <div className="lg:w-1/2 relative">
            <ImageWithFallback
              src={product.image}
              alt={product.name}
              className="w-full h-64 lg:h-full object-cover"
            />
            
            {/* Badges */}
            <div className="absolute top-4 left-4 space-y-2">
              {product.featured && (
                <Badge variant="destructive">Featured</Badge>
              )}
              {hasDiscount && (
                <Badge variant="secondary">-{discountPercent}%</Badge>
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 bg-background/80 backdrop-blur"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content Section */}
          <div className="lg:w-1/2 p-6 lg:p-8 overflow-y-auto">
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">{product.name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-2xl font-bold text-primary">${product.price}</span>
                  {hasDiscount && (
                    <span className="text-lg text-muted-foreground line-through">
                      ${product.originalPrice}
                    </span>
                  )}
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{product.description}</p>
              </div>

              {/* Size Selection */}
              <div>
                <h3 className="font-semibold mb-3">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedSize(size)}
                      className="min-w-[3rem]"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <h3 className="font-semibold mb-3">Color</h3>
                <div className="space-y-3">
                  {product.colors.map((color) => (
                    <label
                      key={color}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="relative">
                        <div
                          className="w-8 h-8 rounded-full border-2 border-border group-hover:border-foreground transition-colors"
                          style={getColorStyle(color)}
                        />
                        {selectedColor === color && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white drop-shadow-lg" />
                          </div>
                        )}
                      </div>
                      <span 
                        className={`${selectedColor === color ? 'font-semibold' : ''} group-hover:text-foreground transition-colors`}
                      >
                        {color}
                      </span>
                      <input
                        type="radio"
                        name="color"
                        value={color}
                        checked={selectedColor === color}
                        onChange={() => setSelectedColor(color)}
                        className="sr-only"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${product.inStock ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-muted-foreground">
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              {/* Add to Cart */}
              <div className="space-y-3 pt-4">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={!product.inStock || !selectedSize || !selectedColor}
                >
                  Add to Cart
                </Button>
                {(!selectedSize || !selectedColor) && (
                  <p className="text-sm text-muted-foreground text-center">
                    Please select size and color
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
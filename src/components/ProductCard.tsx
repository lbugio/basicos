import { Product } from "../types/woocommerce";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
}

export function ProductCard({
  product,
  onAddToCart,
  onProductClick,
}: ProductCardProps) {
  const hasDiscount =
    product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.originalPrice! - product.price) / product.originalPrice!) *
          100
      )
    : 0;

  return (
    <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300">
      <CardContent className="p-0">
        <div
          className="relative overflow-hidden aspect-[4/5] rounded-t-lg"
          onClick={() => onProductClick(product)}
        >
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 space-y-2">
            {product.featured && (
              <Badge variant="destructive" className="text-xs">
                Featured
              </Badge>
            )}
            {hasDiscount && (
              <Badge variant="secondary" className="text-xs">
                -{discountPercent}%
              </Badge>
            )}
          </div>

          {/* Stock status */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="outline" className="bg-background">
                Out of Stock
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div onClick={() => onProductClick(product)}>
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <div 
              className="text-sm text-muted-foreground line-clamp-2 mt-1"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>

          {/* Colors */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Colors:</span>
            <div className="flex gap-1">
              {product.colors.slice(0, 4).map((color, index) => (
                <div
                  key={index}
                  className="w-4 h-4 rounded-full border border-border"
                  style={{
                    backgroundColor:
                      color.toLowerCase() === "white"
                        ? "#ffffff"
                        : color.toLowerCase() === "black"
                        ? "#000000"
                        : color.toLowerCase() === "gray"
                        ? "#6b7280"
                        : color.toLowerCase() === "navy"
                        ? "#1e3a8a"
                        : color.toLowerCase() === "forest green"
                        ? "#166534"
                        : color.toLowerCase() === "cream"
                        ? "#fef3c7"
                        : color.toLowerCase() === "pink"
                        ? "#f472b6"
                        : color.toLowerCase() === "lavender"
                        ? "#c4b5fd"
                        : color.toLowerCase() === "light gray"
                        ? "#d1d5db"
                        : color.toLowerCase() === "olive"
                        ? "#65a30d"
                        : color.toLowerCase() === "burgundy"
                        ? "#7c2d12"
                        : color.toLowerCase() === "dusty pink"
                        ? "#f9a8d4"
                        : color.toLowerCase() === "sage green"
                        ? "#84cc16"
                        : "#9ca3af",
                  }}
                  title={color}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-xs text-muted-foreground">
                  +{product.colors.length - 4}
                </span>
              )}
            </div>
          </div>

          {/* Price and Add to Cart */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  ${product.price}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${product.originalPrice}
                  </span>
                )}
              </div>
            </div>

            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              disabled={!product.inStock}
              className="min-w-fit"
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

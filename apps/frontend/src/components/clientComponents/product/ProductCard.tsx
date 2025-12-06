import { BASE_SERVER_URL } from '@/config';
import { ImageOff, Store } from 'lucide-react';

export interface ClientProduct {
  productId: string;
  name: string;
  description: string;
  price: number;
  amount: number;
  imageUrl?: string;
  merchantId: string;
  merchantName: string;
}

interface ProductCardProps {
  product: ClientProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group relative w-full cursor-pointer overflow-hidden rounded-xl bg-white transition-all duration-300 hover:shadow-xl">
      {/* Background Image */}
      <div className="inset-0 h-[300px]">
        {product.imageUrl ? (
          <img
            src={`${BASE_SERVER_URL}${product.imageUrl}`}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gray-200">
            <ImageOff size={40} className="text-gray-500" />
            <p className="text-md text-gray-600">商品暂无图片</p>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="mb-1 line-clamp-1 text-xl font-bold text-balance">{product.name}</h3>
          <p className="text-lg text-balance">
            ¥ {typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
          </p>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Store size={16} />
          <p className="text-md line-clamp-1">{product.merchantName}</p>
        </div>
      </div>
    </div>
  );
}

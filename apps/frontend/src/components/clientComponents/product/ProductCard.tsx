import { BASE_SERVER_URL } from '@/config';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { ImageOff, Store } from 'lucide-react';
import type { ClientProduct } from '@/types/product';
import { useCartStore } from '@/store/useCartStore';

interface ProductCardProps {
  product: ClientProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addProduct, updateProductQuantity, removeProduct, products } = useCartStore();
  const cartItem = products.find((p) => p.productId === product.productId);
  const currentQty = cartItem?.quantity ?? 0;

  const handleQtyChange = (product: ClientProduct, value: number | null) => {
    if (typeof value === 'number') {
      if (value >= 1) updateProductQuantity(product.productId, value);
      else if (value === 0) removeProduct(product);
    }
  };

  return (
    <div className="group coverflow-hidden relative w-full overflow-hidden rounded-xl bg-white transition-all duration-300">
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
        <div className="flex justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <Store size={16} />
            <p className="text-md line-clamp-1">{product.merchantName}</p>
          </div>
          <div className="flex items-center gap-2">
            {currentQty > 0 ? (
              <>
                <Button
                  type="default"
                  icon={<MinusOutlined />}
                  onClick={() => handleQtyChange(product, currentQty - 1)}
                  size="small"
                  disabled={currentQty <= 0}
                />
                <p className="text-md text-balance">{currentQty}</p>
              </>
            ) : null}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => addProduct(product)}
              size="small"
              disabled={currentQty >= product.amount || product.amount <= 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

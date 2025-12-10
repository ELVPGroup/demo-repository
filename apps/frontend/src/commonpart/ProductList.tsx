import React from 'react';
import { Card, Typography, Empty, Image } from 'antd';
import type { OrderProduct } from '@/types/orderDetailInterface';
import { BASE_SERVER_URL } from '@/config';

const { Title, Text } = Typography;

/**
 * 商品清单组件
 * 展示订单中的商品列表和总价
 */

interface ProductListProps {
  products: OrderProduct[];
}

const ProductList: React.FC<ProductListProps> = ({ products = [] }) => {
  return (
    <Card
      variant="borderless"
      title={
        <Title level={4} style={{ margin: 0 }}>
          商品清单
        </Title>
      }
      style={{
        margin: '20px 0',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
    >
      {products.length === 0 ? (
        <Empty description="未找到商品" />
      ) : (
        <div>
          {products.map((product, index) => (
            <div
              key={product.productId || index}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: index < products.length - 1 ? '1px solid #f0f0f0' : 'none',
              }}
            >
              {/* 商品图片占位 */}
              <div className="mr-3">
                {product.imageUrl ? (
                  <Image
                    src={`${BASE_SERVER_URL}${product.imageUrl}`}
                    width={56}
                    height={56}
                    style={{ objectFit: 'cover', borderRadius: 8, marginRight: 12 }}
                    preview={false}
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-md bg-gray-100 font-semibold">
                    {product.name.slice(0, 1)}
                  </div>
                )}
              </div>

              {/* 商品信息 */}
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '4px' }}>{product.name}</div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  {product.description}
                </div>
                <Text type="secondary">x{product.quantity}</Text>
              </div>

              {/* 商品价格 */}
              <div style={{ fontWeight: '500', color: '#333' }}>
                ¥{(product.price || 0).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default ProductList;

 import React from 'react';
import { Card, Typography, Empty } from 'antd';
import type { OrderProduct } from '@/types/orderDetailInterface';

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
      title={
        <Title level={4} style={{ margin: 0 }}>商品清单</Title>
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
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                  borderRadius: '4px',
                  color: '#999',
                }}
              >
                Img
              </div>
              
              {/* 商品信息 */}
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '4px' }}>{product.name}</div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{product.description}</div>
                <Text type="secondary">x{product.amount}</Text>
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
}

export default ProductList;

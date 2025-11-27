import React, { useState, useEffect } from 'react';
import { Card, Typography, Empty, Spin } from 'antd';

const { Title, Text } = Typography;

/**
 * 商品清单组件
 * 展示订单中的商品列表和总价
 */


function ProductList({ products: propProducts }) {
  // 优先使用props中的数据，如果没有则初始化为空数组
  const [products, setProducts] = useState(propProducts || []);
  const [loading, setLoading] = useState(!propProducts); // 只有当没有props数据时才显示加载状态

  // ProductList组件的BaseUrl
  const baseUrl = 'http://127.0.0.1:4523/m1/7446832-7180926-6608925';

  useEffect(() => {
    // 只有当没有通过props传入数据时，才从API获取数据
    if (!propProducts) {
      const fetchProducts = async () => {
        try {
          setLoading(true);
          const response = await fetch(`${baseUrl}/products`);
          if (!response.ok) {
            throw new Error('网络响应异常');
          }
          const data = await response.json();
          setProducts(data);
        } catch (error) {
          console.error('获取商品清单失败:', error);
          // 发生错误时保持products为空数组
        } finally {
          setLoading(false);
        }
      };

      fetchProducts();
    }
  }, [propProducts]);

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
      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <Spin>
            <div style={{ color: '#999', marginTop: '16px' }}>加载中...</div>
          </Spin>
        </div>
      ) : (
        <>
      {products.length === 0 ? (
        <Empty description="未找到商品" />
      ) : (
        <div>
          {products.map((product, index) => (
            <div
              key={product.productId}
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
                ¥{product.price.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </Card>
  );
}

export default ProductList;
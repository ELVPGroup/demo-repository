import { Card, Col, Empty, Popconfirm, Row, Space, Tag, Typography, Button, Image } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { MerchantProduct } from './ProductFormModal';
import { BASE_SERVER_URL } from '@/config';

interface ProductCardGridProps {
  products: MerchantProduct[];
  onEdit: (product: MerchantProduct) => void;
  onDelete: (productId: string) => void;
}

export default function ProductCardGrid(props: ProductCardGridProps) {
  const { products, onEdit, onDelete } = props;
  if (!products.length) return <Empty description="暂无商品" />;
  return (
    <Row gutter={[16, 16]}>
      {products.map((product) => (
        <Col key={product.productId} xs={24} sm={12} md={8} lg={6} xl={6}>
          <Card
            className="overflow-hidden"
            variant="borderless"
            cover={
              product.imageUrl ? (
                <Image
                  src={`${BASE_SERVER_URL}${product.imageUrl}`}
                  height={180}
                  preview={false}
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    height: 180,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.03)',
                  }}
                >
                  <Typography.Text type="secondary">无图片</Typography.Text>
                </div>
              )
            }
            actions={[
              <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(product)}>
                编辑
              </Button>,
              <Popconfirm
                title="确认删除该商品？"
                onConfirm={() => onDelete(product.productId!)}
                okText="确认"
                cancelText="取消"
              >
                <Button type="text" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>,
            ]}
          >
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Typography.Title level={5} style={{ margin: 0 }}>
                {product.name}
              </Typography.Title>
              {product.description ? (
                <Typography.Paragraph ellipsis={{ rows: 1 }} style={{ margin: 0 }}>
                  {product.description}
                </Typography.Paragraph>
              ) : null}
              <Space>
                <Tag color="blue">¥{Number(product.price).toFixed(2)}</Tag>
                <Tag color={product.amount > 5 ? 'green' : 'red'}>
                  库存 {Number(product.amount)}
                </Tag>
              </Space>
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

import { Card, Popconfirm, Space, Tag, Typography, Button, Image, InputNumber } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { MerchantProduct } from './ProductFormModal';
import { BASE_SERVER_URL } from '@/config';

interface ProductCardProps {
  product: MerchantProduct;
  onEdit?: (product: MerchantProduct) => void;
  onDelete?: (productId: string) => void;
  mode?: 'default' | 'selection';
  selected?: boolean;
  selectionQuantity?: number;
  onSelect?: (selected: boolean) => void;
  onQuantityChange?: (quantity: number) => void;
}

export default function ProductCard(props: ProductCardProps) {
  const {
    product,
    onEdit,
    onDelete,
    mode = 'default',
    selected = false,
    selectionQuantity = 1,
    onSelect,
    onQuantityChange,
  } = props;
  return (
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
      actions={
        mode === 'default'
          ? [
              <Button
                key="edit"
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEdit?.(product)}
              >
                编辑
              </Button>,
              <Popconfirm
                key="delete"
                title="确认删除该商品？"
                onConfirm={() => onDelete?.(product.productId!)}
                okText="确认"
                cancelText="取消"
              >
                <Button type="text" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>,
            ]
          : [
              <div
                key="selection"
                style={{
                  padding: '0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <InputNumber
                  min={1}
                  max={product.amount}
                  value={selectionQuantity}
                  onChange={(v) => onQuantityChange?.(v || 1)}
                  size="small"
                  style={{ width: 80 }}
                />
                <Button
                  type={selected ? 'primary' : 'default'}
                  size="small"
                  onClick={() => onSelect?.(!selected)}
                >
                  {selected ? '已选' : '选择'}
                </Button>
              </div>,
            ]
      }
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
          <Tag color={product.amount > 5 ? 'green' : 'red'}>库存 {Number(product.amount)}</Tag>
        </Space>
      </Space>
    </Card>
  );
}

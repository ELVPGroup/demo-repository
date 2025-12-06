import { Table, Image, Button, Popconfirm, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MerchantProduct } from './ProductFormModal';
import { BASE_SERVER_URL } from '@/config';

interface ProductListTableProps {
  products: MerchantProduct[];
  loading?: boolean;
  onEdit: (product: MerchantProduct) => void;
  onDelete: (productId: string) => void;
}

export default function ProductListTable(props: ProductListTableProps) {
  const { products, loading, onEdit, onDelete } = props;
  const columns: ColumnsType<MerchantProduct> = [
    {
      title: '图片',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 100,
      render: (url: string) =>
        url ? (
          <Image
            src={`${BASE_SERVER_URL}${url}`}
            width={64}
            height={64}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <Typography.Text type="secondary">无</Typography.Text>
        ),
    },
    { title: '名称', dataIndex: 'name', key: 'name', width: 300 },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (v: number) => `¥${Number(v).toFixed(2)}`,
    },
    { title: '库存', dataIndex: 'amount', key: 'amount', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => onEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除该商品？"
            onConfirm={() => onDelete(record.productId!)}
            okText="确认"
            cancelText="取消"
          >
            <Button danger type="link">
              删除
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <Table
      rowKey={(r) => String(r.productId)}
      columns={columns}
      dataSource={products}
      loading={loading}
      pagination={{ pageSize: 10 }}
    />
  );
}

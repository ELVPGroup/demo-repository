import React from 'react';
import { Table, Button, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router';
import { useOrderStore } from '@/store/useOrderStore';
import type { OrderItem } from '@/types/order';
import { orderStatusColors } from '@/theme/theme';
import { normalizeOrderStatus } from '@/utils/general';

const OrderList: React.FC = () => {
  const { orders } = useOrderStore();
  const navigate = useNavigate();

  const handleDetailClick = (orderId: string) => {
    navigate(`/merchant/orders/${orderId}`);
  };

  const columns: ColumnsType<OrderItem> = [
    {
      title: '订单编号',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 180,
      fixed: 'left',
      render: (text: string) => (
        <span className="font-medium" style={{ color: 'var(--color-text)' }}>
          {text}
        </span>
      ),
    },
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 120,
    },
    {
      title: '用户姓名',
      dataIndex: 'userName',
      key: 'userName',
      width: 120,
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        // 标准化订单状态，将"已签收"等状态统一为"已送达"
        const normalizedStatus = normalizeOrderStatus(status);
        const buttonStyle =
          orderStatusColors[normalizedStatus as keyof typeof orderStatusColors] ||
          orderStatusColors.default;
        return (
          <Tag
            style={{
              backgroundColor: buttonStyle.bg,
              color: buttonStyle.text,
              border: buttonStyle.border,
              borderRadius: '9999px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            {normalizedStatus}
          </Tag>
        );
      },
    },
    {
      title: '商品数量',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      align: 'center',
    },
    {
      title: '订单金额',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 120,
      align: 'right',
      render: (price: number) => (
        <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
          ¥{price.toFixed(2)}
        </span>
      ),
    },
    {
      title: '下单时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_: unknown, record: OrderItem) => (
        <Button
          type="link"
          onClick={() => handleDetailClick(record.orderId)}
          style={{ padding: 0 }}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div className="mt-6">
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="orderId"
        pagination={false}
        scroll={{ x: 1000 }}
        style={{
          backgroundColor: 'var(--color-bg-container)',
          borderRadius: '8px',
        }}
        onRow={(record) => ({
          onClick: () => handleDetailClick(record.orderId),
          style: { cursor: 'pointer' },
          onMouseEnter: (e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-layout)';
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          },
        })}
      />
    </div>
  );
};

export default OrderList;


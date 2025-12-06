import React from 'react';
import { useNavigate } from 'react-router';
import type { OrderItem } from '@/types/order';
import { orderStatusColors } from '@/theme/theme';
import { Button } from 'antd';

interface OrderCardProps {
  order: OrderItem;
}


export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const navigate = useNavigate();

  const handleDetailClick = () => {
    navigate(`/merchant/orders/${order.orderId}`);
  };
  const buttonStyle = orderStatusColors[order?.status as keyof typeof orderStatusColors]|| orderStatusColors.default;

  return (
    <div className="flex flex-col justify-between rounded-2xl bg-blue-50 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">订单编号：{order.orderId}</h2>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style = {{
            backgroundColor: buttonStyle.bg,
            color: buttonStyle.text,
            border: buttonStyle.border,
        }}
        >
          {order.status}
        </span>
      </div>

      <p className="mt-2 text-sm text-gray-500">用户ID：{order.userId}</p>
      <p className="mt-4 text-sm text-gray-600">下单时间：{order.createdAt}</p>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xl font-bold">¥{order.totalPrice}</p>
        <Button
          onClick={handleDetailClick}
          type='link'
        >
          详情
        </Button>
      </div>
    </div>
  );
};

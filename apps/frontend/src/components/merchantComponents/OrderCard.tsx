import React from 'react';
import { useNavigate } from 'react-router';
import type { OrderItem } from '@/pages/merchant/OrdersPage';

interface OrderCardProps {
  order: OrderItem;
}

const getStatusConfig = (status: OrderItem['status']) => {
  switch (status) {
    case 'pending':
      return {
        text: '待处理',
        className: 'bg-rose-400 text-rose-900',
      };
    case 'confirmed':
      return {
        text: '已确认',
        className: 'bg-blue-400 text-blue-900',
      };
    case 'delivered':
      return {
        text: '已送达',
        className: 'bg-green-400 text-green-900',
      };
    default:
      return {
        text: '未知',
        className: 'bg-gray-400 text-gray-900',
      };
  }
};

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const navigate = useNavigate();
  const statusConfig = getStatusConfig(order.status);

  const handleDetailClick = () => {
    navigate(`/merchant/orders/${order.id}`);
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl bg-blue-50 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{order.id}</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusConfig.className}`}
        >
          {statusConfig.text}
        </span>
      </div>

      <p className="mt-2 text-sm text-gray-500">{order.productName}</p>
      <p className="mt-4 text-sm text-gray-600">下单时间：{order.orderTime}</p>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xl font-bold">¥{order.amount}</p>
        <button
          onClick={handleDetailClick}
          className="
            text-primary 
            text-sm
            hover:underline 
            hover:text-primary-hover
            focus:outline-none
          "
        >
          详情
        </button>
      </div>
    </div>
  );
};

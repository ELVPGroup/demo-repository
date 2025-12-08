import React from "react";
import { OrderCard } from "./OrderCard";
import { useOrderStore } from "@/store/useOrderStore";
import type { OrderItem } from "@/types/order";

interface CardGridProps {
  orders?: OrderItem[]; // 可选，如果不传则从 store 获取
}

const CardGrid: React.FC<CardGridProps> = ({ orders: ordersProp }) => {
  // 如果传入了 orders，使用传入的；否则从 store 获取
  const { orders: ordersFromStore } = useOrderStore();
  const orders = ordersProp || ordersFromStore;

  return (
    <div className="grid grid-cols-3 gap-6 p-2">
      {orders.map((item: OrderItem) => (
        <OrderCard key={item.orderId} order={item} />
      ))}
    </div>
  );
};

export default CardGrid;

import React from "react";
import { OrderCard } from "./OrderCard";
import type { OrderItem } from "@/pages/merchant/OrdersPage";

interface CardGridProps {
  orders: OrderItem[];
}

const CardGrid: React.FC<CardGridProps> = ({ orders }) => {
  return (
    <div className="grid grid-cols-3 gap-6 p-4">
      {orders.map((item) => (
        <OrderCard key={item.id} order={item} />
      ))}
    </div>
  );
};

export default CardGrid;

import React from "react";
import { OrderCard } from "./OrderCard";
import { useOrderStore } from "@/store/useOrderStore";

const CardGrid: React.FC = () => {
  const { orders } = useOrderStore();

  return (
    <div className="grid grid-cols-3 gap-6 p-2">
      {orders.map((item) => (
        <OrderCard key={item.orderId} order={item} />
      ))}
    </div>
  );
};

export default CardGrid;

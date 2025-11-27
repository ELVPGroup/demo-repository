import { create } from 'zustand';
import { merchantAxiosInstance } from '../utils/axios';

// 引入接口类型
import type { OrderDetailResponse, OrderDetail } from '../types/orderDetailInterface';

interface OrderDetailStore {
  order: OrderDetail | null;
  loading: boolean;
  error: string | null;

  // actions
  fetchOrderDetail: (orderId: string) => Promise<void>;
  updateOrder: (order: OrderDetail) => Promise<void>;
  clearOrder: () => void;
}

export const useOrderDetailStore = create<OrderDetailStore>((set) => ({
  order: null,
  loading: false,
  error: null,

  // 获取订单详情
  fetchOrderDetail: async (orderId: string) => {
    set({ loading: true, error: null });

    try {
      const res = await merchantAxiosInstance.get<OrderDetailResponse>(`/orders/detail/${orderId}`);
      console.log(res.data.data);

      set({
        order: res.data.data,
        loading: false,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '获取订单失败';
      set({
        loading: false,
        error: errorMessage,
      });
    }
  },

  //更新订单信息
  updateOrder: async (order: OrderDetail) => {
    set({ order });

    try {
      const res = await merchantAxiosInstance.put<OrderDetailResponse>(
        `/orders/${order.orderId}`,
        order
      );
      set({
        loading: false,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '更新订单失败';
      set({
        loading: false,
        error: errorMessage,
      });
    }
  },

  // 清空订单信息
  clearOrder: () => set({ order: null }),
}));

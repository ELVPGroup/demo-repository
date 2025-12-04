import { create } from 'zustand';
import { merchantAxiosInstance, clientAxiosInstance } from '../utils/axios';
import { useUserStore } from "./userStore";

// 引入接口类型
import type { OrderDetailResponse, OrderDetail } from '../types/orderDetailInterface';

interface OrderDetailStore {
  order: OrderDetail | null;
  loading: boolean;
  error: string | null;

  // actions
  fetchOrderDetail: (orderId: string) => Promise<void>;
  updateOrder: (order: OrderDetail) => Promise<void>;
  shipOrder: (orderId: string) => Promise<void>;
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
      const { side } = useUserStore.getState();
      const axiosInstance = side === 'client' ? clientAxiosInstance : merchantAxiosInstance;
      
      const res = await axiosInstance.get<OrderDetailResponse>(`/orders/detail/${orderId}`);
      const data = res.data.data as unknown as Record<string, unknown>;
      const defaultAddr = {
        addressInfoId: '',
        name: '',
        phone: '',
        address: '',
        location: [0, 0] as [number, number],
      };
      const normalized = {
        ...(data as OrderDetail),
        addressInfo:
          (data['addressInfo'] as OrderDetail['addressInfo']) ??
          (data['shippingTo'] as OrderDetail['addressInfo']) ??
          defaultAddr,
      } as OrderDetail;

      set({
        order: normalized,
        loading: false,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取订单失败';
      set({
        loading: false,
        error: errorMessage,
      });
    }
  },

  //更新订单信息
  updateOrder: async (order: OrderDetail) => {
    set({ loading: true, error: null, order });

    try {
      await merchantAxiosInstance.put<OrderDetailResponse>(`/orders/${order.orderId}`, order);
      set({
        loading: false,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新订单失败';
      set({
        loading: false,
        error: errorMessage,
      });
    }
  },

  // 模拟发货
  shipOrder: async (orderId: string) => {
    set({ loading: true, error: null });

    try {
      await merchantAxiosInstance.post(`/orders/${orderId}/ship`);

      // 发货成功后重新获取订单详情
      const res = await merchantAxiosInstance.get<OrderDetailResponse>(`/orders/detail/${orderId}`);
      const data = res.data.data as unknown as Record<string, unknown>;
      const defaultAddr = {
        addressInfoId: '',
        name: '',
        phone: '',
        address: '',
        location: [0, 0] as [number, number],
      };
      const normalized = {
        ...(data as OrderDetail),
        addressInfo:
          (data['addressInfo'] as OrderDetail['addressInfo']) ??
          (data['shippingTo'] as OrderDetail['addressInfo']) ??
          defaultAddr,
      } as OrderDetail;

      set({
        order: normalized,
        loading: false,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发货失败';
      set({
        loading: false,
        error: errorMessage,
      });
    }
  },

  // 清空订单信息
  clearOrder: () => set({ order: null }),
}));

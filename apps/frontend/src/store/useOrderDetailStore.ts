import { create } from 'zustand';
import { merchantAxiosInstance, clientAxiosInstance } from '../utils/axios';
import { useUserStore } from './userStore';

// 引入接口类型
import type { OrderDetailResponse, OrderDetail } from '../types/orderDetailInterface';

interface OrderDetailStore {
  order: OrderDetail | null;
  loading: boolean;
  error: string | null;

  // actions
  fetchOrderDetail: (orderId: string) => Promise<void>;
  updateOrder: (order: OrderDetail) => Promise<void>;
  shipOrder: (params: ShipOrderParams) => Promise<void>;
  clearOrder: () => void;
}

// 模拟发货接口请求参数类型
export interface ShipOrderParams {
  orderId: string;
  logisticsId: string;
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
      const data = res.data.data;
      const defaultAddr = {
        addressInfoId: '',
        name: '',
        phone: '',
        address: '',
        location: [0, 0] as [number, number],
      };
      const normalized = {
        ...(data as OrderDetail),
        shippingFrom: (data['shippingFrom'] as OrderDetail['shippingFrom']) ?? defaultAddr,
        shippingTo: (data['shippingTo'] as OrderDetail['shippingTo']) ?? defaultAddr,
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
    set({ loading: true, error: null });

    try {
      const res = await merchantAxiosInstance.put<OrderDetailResponse>(
        `/orders/${order.orderId}`,
        order
      );
      const data = res.data.data;
      const defaultAddr = {
        addressInfoId: '',
        name: '',
        phone: '',
        address: '',
      };
      const normalized = {
        ...(data as OrderDetail),
        shippingFrom: (data['shippingFrom'] as OrderDetail['shippingFrom']) ?? defaultAddr,
        shippingTo: (data['shippingTo'] as OrderDetail['shippingTo']) ?? defaultAddr,
      } as OrderDetail;

      set({
        order: normalized,
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
  shipOrder: async (params: ShipOrderParams) => {
    set({ loading: true, error: null });

    try {
      await merchantAxiosInstance.post('/shipping/send', params);

      // 发货成功后重新获取订单详情
      const res = await merchantAxiosInstance.get<OrderDetailResponse>(
        `/orders/detail/${params.orderId}`
      );
      const data = res.data.data;
      const defaultAddr = {
        addressInfoId: '',
        name: '',
        phone: '',
        address: '',
        location: [0, 0] as [number, number],
      };
      const normalized = {
        ...(data as OrderDetail),
        shippingFrom: (data['shippingFrom'] as OrderDetail['shippingFrom']) ?? defaultAddr,
        shippingTo: (data['shippingTo'] as OrderDetail['shippingTo']) ?? defaultAddr,
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

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
  confirmReceipt: (orderId: string) => Promise<void>;
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

      // 本地状态覆盖：如果本地已确认收货，则覆盖状态为已签收
      try {
        const overridesStr = localStorage.getItem('clientOrderStatusOverrides') || '{}';
        const overrides = JSON.parse(overridesStr) as Record<string, { status: string; confirmedAt: number }>;
        const override = overrides[orderId];
        if (override?.status === '已签收') {
          normalized.status = '已签收';
        }
      } catch {
        // Ignore JSON parse error
      }

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

  // 确认收货
  confirmReceipt: async (orderId: string) => {
    set({ loading: true, error: null });

    try {
      // 正确路径：clientAxiosInstance 的 baseURL 已是 /api/client
      // 因此仅需调用 /orders/:orderId/confirm
      await clientAxiosInstance.post('/orders/confirm', { orderId });

      // 本地立即更新状态为已签收并写入本地覆盖
      const current = useOrderDetailStore.getState().order;
      if (current && current.orderId === orderId) {
        set({ order: { ...current, status: '已签收' } });
      }

      try {
        const overridesStr = localStorage.getItem('clientOrderStatusOverrides') || '{}';
        const overrides = JSON.parse(overridesStr) as Record<string, { status: string; confirmedAt: number }>;
        overrides[orderId] = { status: '已签收', confirmedAt: Date.now() };
        localStorage.setItem('clientOrderStatusOverrides', JSON.stringify(overrides));
      } catch {
        // Ignore JSON parse error or storage quota error
      }

      // 重新获取订单详情以同步其他字段（时间线、位置等）
      await useOrderDetailStore.getState().fetchOrderDetail(orderId);
      
      set({ loading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '确认收货失败';
      set({
        loading: false,
        error: errorMessage,
      });
      throw err;
    }
  },

  // 清空订单信息
  clearOrder: () => set({ order: null }),
}));

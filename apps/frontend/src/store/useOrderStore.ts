// src/store/useOrderStore.ts
import { create } from 'zustand';
import { merchantAxiosInstance, clientAxiosInstance } from '@/utils/axios';
import { useUserStore } from './userStore';
import type { OrderQueryParams, OrderItem, OrderListResponse } from '../types/order';
import { debounced } from '@/utils/general';

interface OrderStore {
  params: OrderQueryParams;
  orders: OrderItem[];
  total: number;
  loading: boolean;

  // 更新查询参数
  setParams: (newParams: Partial<OrderQueryParams>) => void;

  // 请求订单
  fetchOrders: () => Promise<void>;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  params: {
    sort: 'asc',
    sortBy: 'createdAt',
    limit: 10,
    offset: 0,
    status: '',
    customerName: ''
  },
  orders: [],
  total: 0,
  loading: false,

  setParams: (newParams) =>
    set((state) => ({
      params: { ...state.params, ...newParams },
    })),

  fetchOrders: 
    async () => {
      set({ loading: true });
      try {
        const { params } = get();
        const { side } = useUserStore.getState();
        const axiosInstance = side === 'client' ? clientAxiosInstance : merchantAxiosInstance;

        const requestBody = { ...params };

        const res = await axiosInstance.post<OrderListResponse>('/orders/list', requestBody);

        // 根据后端返回的数据结构：data 是 OrderItem[] 数组
        const orders = res.data.data || [];

        set({
          orders,
          total: orders.length, // 如果后端没有返回总数，使用当前数组长度
        });

        console.log(res);
        console.log(orders);
      } catch (err) {
        console.error('获取订单列表失败:', err);
        set({
          orders: [],
          total: 0,
        });
      } finally {
        set({ loading: false });
      }
    },
}));

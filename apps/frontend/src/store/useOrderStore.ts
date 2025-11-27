// src/store/useOrderStore.ts
import { create } from "zustand";
import {merchantAxiosInstance} from "@/utils/axios";
import type { OrderQueryParams, OrderItem, OrderListResponse } from "../types/order";

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
        status: '',
        customerName: '',
        limit: 10,
        offset: 0,
        sort: 'asc',
        sortBy: 'createdAt'
    },
    orders: [],
    total: 0,
    loading: false,

    setParams: (newParams) =>
        set((state) => ({
            params: { ...state.params, ...newParams }
        })),

    fetchOrders: async () => {
        set({ loading: true });
        try {
            const { params } = get();
            const res = await merchantAxiosInstance.post<OrderListResponse>("/orders/list", { params });
            
            // 根据后端返回的数据结构：data 是 OrderItem[] 数组
            const orders = res.data.data || [];
            
            set({
                orders,
                total: orders.length, // 如果后端没有返回总数，使用当前数组长度
            });

            console.log(res);
            console.log(orders);

        } catch (err) {
            console.error("获取订单列表失败:", err);
            set({
                orders: [],
                total: 0,
            });
        } finally {
            set({ loading: false });
        }
    }
}));

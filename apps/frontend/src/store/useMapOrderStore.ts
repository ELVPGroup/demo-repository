// src/store/useMapOrderStore.ts
import { create } from 'zustand';
import { merchantAxiosInstance, clientAxiosInstance } from '@/utils/axios';
import { useUserStore } from './userStore';
import type { OrderItem, OrderListResponse } from '../types/order';
import { debounced } from '@/utils/general';

// 地图坐标参数接口
interface MapBoundsParams {
  northEast: {
    lat: number;
    lng: number;
  };
  southWest: {
    lat: number;
    lng: number;
  };
  limit?: number;
  offset?: number;
}

interface MapOrderStore {
  // 地图边界参数
  boundsParams: MapBoundsParams;

  // 当前显示区域内的订单
  mapOrders: OrderItem[];

  // 订单总数（可能用于分页）
  total: number;

  // 加载状态
  loading: boolean;

  // 更新地图边界参数
  setBoundsParams: (newParams: Partial<MapBoundsParams>) => void;

  // 重置地图边界参数
  resetBoundsParams: () => void;

  // 根据地图边界获取订单
  fetchOrdersByBounds: () => Promise<void>;
}

export const useMapOrderStore = create<MapOrderStore>((set, get) => ({
  boundsParams: {
    northEast: {
      lat: 0,
      lng: 0,
    },
    southWest: {
      lat: 0,
      lng: 0,
    },
    limit: 50, // 地图显示通常需要更多数据
    offset: 0,
  },

  mapOrders: [],
  total: 0,
  loading: false,

  // 更新地图边界参数
  setBoundsParams: (newParams) =>
    set((state) => ({
      boundsParams: { ...state.boundsParams, ...newParams },
    })),

  // 重置参数
  resetBoundsParams: () =>
    set({
      boundsParams: {
        northEast: { lat: 0, lng: 0 },
        southWest: { lat: 0, lng: 0 },
        limit: 50,
        offset: 0,
      },
    }),

  // 根据地图边界获取订单
  fetchOrdersByBounds: debounced(
    async () => {
      set({ loading: true });
      try {
        const { boundsParams } = get();

        // 验证坐标参数
        if (
          !boundsParams.northEast ||
          !boundsParams.southWest ||
          boundsParams.northEast.lat === boundsParams.southWest.lat ||
          boundsParams.northEast.lng === boundsParams.southWest.lng
        ) {
          console.warn('无效的地图边界参数');
          set({ mapOrders: [], total: 0 });
          return;
        }

        const { side } = useUserStore.getState();
        const axiosInstance = side === 'client' ? clientAxiosInstance : merchantAxiosInstance;

        // 构建请求体
        const requestBody = {
          mapViewport: [
            // 地图矩形对角线点1 [经度, 纬度] 坐标
            [boundsParams.northEast.lng, boundsParams.northEast.lat],
            // 地图矩形对角线点2 [经度, 纬度] 坐标
            [boundsParams.southWest.lng, boundsParams.southWest.lat],
          ],
          limit: boundsParams.limit,
          offset: boundsParams.offset,
        };

        // 调用地图订单查询接口
        const res = await axiosInstance.post<OrderListResponse>(
          '/orders/delivery-area',
          requestBody
        );

        const orders = res.data.data || [];

        set({
          mapOrders: orders,
          total: orders.length,
        });

        console.log('地图区域订单查询结果:', orders.length, '条订单');
      } catch (err) {
        console.error('获取地图区域订单失败:', err);
        set({
          mapOrders: [],
          total: 0,
        });
      } finally {
        set({ loading: false });
      }
    },
    500, // 防抖延迟
    true // 立即执行
  ),
}));

// 辅助函数：检查点是否在矩形区域内
export const isPointInBounds = (
  point: { lat: number; lng: number },
  bounds: { northEast: { lat: number; lng: number }; southWest: { lat: number; lng: number } }
): boolean => {
  return (
    point.lat <= bounds.northEast.lat &&
    point.lat >= bounds.southWest.lat &&
    point.lng <= bounds.northEast.lng &&
    point.lng >= bounds.southWest.lng
  );
};

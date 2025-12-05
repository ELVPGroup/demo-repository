// src/store/useDeliveryAreaStore.ts - 添加更新函数
import { create } from "zustand";
import { merchantAxiosInstance } from "@/utils/axios";
import type { DeliveryAreaData, DeliveryAreaResponse } from "@/types/delivery";

interface DeliveryAreaStore {
  // 配送区域数据
  deliveryArea: DeliveryAreaData | null;
  
  // 加载状态
  loading: boolean;
  
  // 更新状态
  updating: boolean;
  
  // 错误信息
  error: string | null;
  
  // 获取配送区域信息
  fetchDeliveryArea: (merchantId?: string) => Promise<void>;
  
  // 更新配送区域（完整更新）
  updateDeliveryArea: (data: Partial<DeliveryAreaData>) => Promise<boolean>;
  
  // 快速更新半径（优化版本）
  updateRadius: (radius: number) => Promise<boolean>;
  
  // 快速更新中心点
  updateCenter: (center: [number, number]) => Promise<boolean>;
  
  // 本地更新半径（不调用API，用于即时UI响应）
  updateRadiusLocal: (radius: number) => void;
  
  // 重置状态
  reset: () => void;
}

const DEFAULT_CENTER: [number, number] = [114.305539, 30.593175];
const DEFAULT_RADIUS = 5;

export const useDeliveryAreaStore = create<DeliveryAreaStore>((set, get) => ({
  deliveryArea: null,
  loading: false,
  updating: false,
  error: null,

 // src/store/useDeliveryAreaStore.ts - 修改fetchDeliveryArea方法
  fetchDeliveryArea: async (merchantId?: string) => {
  set({ loading: true, error: null });
  
  try {
    // 方法1：使用GET方法（推荐）
    const res = await merchantAxiosInstance.get<DeliveryAreaResponse>(
      "/delivery-area"
    );
    
    // 或者方法2：如果需要在URL中传递参数
    // const url = merchantId 
    //   ? `/merchant/delivery-area?merchantId=${merchantId}`
    //   : "/merchant/delivery-area";
    // const res = await merchantAxiosInstance.get<DeliveryAreaResponse>(url);
    
    console.log("配送区域接口响应:", res.data);
    
    if (res.data.status === 200 && res.data.data) {
      set({
        deliveryArea: res.data.data,
        error: null,
      });
      return true;
    } else {
      console.warn("获取配送区域失败:", res.data.message);
      set({
        deliveryArea: {
          merchantId: merchantId || "default",
          center: DEFAULT_CENTER,
          radius: DEFAULT_RADIUS,
        },
        error: res.data.message || "获取配送区域失败",
      });
      return false;
    }
  } catch (err: unknown) {
    console.error("获取配送区域信息失败:", err);
    
    let errorMessage = "获取配送区域失败";
    
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    } else if (err && typeof err === 'object' && 'message' in err) {
      errorMessage = String((err as { message: unknown }).message);
    }
    
    set({
      deliveryArea: {
        merchantId: merchantId || "default",
        center: DEFAULT_CENTER,
        radius: DEFAULT_RADIUS,
      },
      error: errorMessage,
    });
    return false;
  } finally {
    set({ loading: false });
  }
},

  updateDeliveryArea: async (data: Partial<DeliveryAreaData>) => {
    set({ updating: true, error: null });
    
    try {
      const currentData = get().deliveryArea;
      if (!currentData) {
        throw new Error("未获取到配送区域数据");
      }
      
      // 合并当前数据和更新数据
      const updateData = {
        center: data.center || currentData.center,
        radius: data.radius || currentData.radius,
      };
      
      // 如果需要格式化坐标到6位小数
      const formatCoordinates = (coords: [number, number]): [number, number] => {
        return [
          parseFloat(coords[0].toFixed(6)),
          parseFloat(coords[1].toFixed(6))
        ];
      };
      
      const formattedUpdateData = {
        ...updateData,
        center: formatCoordinates(updateData.center),
      };
      
      console.log("更新配送区域请求数据:", formattedUpdateData);
      
      // 使用POST方法（根据你的后端API）
      const res = await merchantAxiosInstance.post<DeliveryAreaResponse>(
        "/delivery-area",
        formattedUpdateData
      );
      
      console.log("更新配送区域响应:", res.data);
      
      if (res.data.status === 200 && res.data.data) {
        set({
          deliveryArea: {
            ...currentData,
            center: res.data.data.center,
            radius: res.data.data.radius,
          },
          error: null,
        });
        return true;
      } else {
        set({
          error: res.data.message || "更新配送区域失败",
        });
        return false;
      }
    } catch (err) {
      console.error("更新配送区域失败:", err);
      
      // 只记录基本信息
      if (err && typeof err === 'object') {
        const errorObj = err as Record<string, unknown>;
        const response = errorObj.response as Record<string, unknown> | undefined;
        
        if (response) {
          console.log("API错误:", response.status, response.data);
        }
      }
      
      set({
        error: err instanceof Error ? err.message : "更新配送区域失败，请检查网络连接",
      });
      return false;
    } finally {
      set({ updating: false });
    }
  },

  updateRadius: async (radius: number) => {
    set({ updating: true, error: null });
    
    try {
      const currentData = get().deliveryArea;
      if (!currentData) {
        throw new Error("未获取到配送区域数据");
      }
      
      // 根据接口文档，需要传递center和radius参数
      const updateData = {
        center: currentData.center, // 当前的center坐标
        radius: radius,             // 新的radius值
      };
      
      console.log("更新半径请求数据:", updateData);
      
      // 使用PUT或PATCH方法（根据后端API决定）
      const res = await merchantAxiosInstance.put<DeliveryAreaResponse>(
        "/merchant/delivery-area",
        updateData
      );
      
      // 或者用PATCH（如果支持部分更新）
      // const res = await merchantAxiosInstance.patch<DeliveryAreaResponse>(
      //   "/merchant/delivery-area",
      //   updateData
      // );
      
      console.log("更新半径响应:", res.data);
      
      if (res.data.status === 200 && res.data.data) {
        set({
          deliveryArea: res.data.data,
          error: null,
        });
        return true;
      } else {
        set({
          error: res.data.message || "更新半径失败",
        });
        return false;
      }
    } catch (err) {
      console.error("更新半径失败:", err);
      
      // 使用类型断言
      const error = err as {
        response?: {
          status: number;
          data: unknown;
        };
        config?: {
          data?: unknown;
        };
        message: string;
      };
      
      // 详细的错误信息
      if (error.response) {
        console.log("错误状态码:", error.response.status);
        console.log("错误响应数据:", error.response.data);
        console.log("请求数据:", error.config?.data);
      }
      
      set({
        error: error.message || "更新半径失败，请检查网络连接",
      });
      return false;
    } finally {
      set({ updating: false });
    }
  },

  updateCenter: async (center: [number, number]) => {
    set({ updating: true, error: null });
    
    try {
      const currentData = get().deliveryArea;
      if (!currentData) {
        throw new Error("未获取到配送区域数据");
      }
      
      const updateData = {
        merchantId: currentData.merchantId,
        center,
      };
      
      const res = await merchantAxiosInstance.post<DeliveryAreaResponse>(
        "/delivery-area",
        updateData
      );
      
      if (res.data.status === 200 && res.data.data) {
        set({
          deliveryArea: {
            ...currentData,
            center: res.data.data.center,
          },
          error: null,
        });
        return true;
      } else {
        set({
          error: res.data.message || "更新中心点失败",
        });
        return false;
      }
    } catch (err) {
      console.error("更新中心点失败:", err);
      
      // 直接使用 Error 类型
      const errorMessage = err instanceof Error 
        ? err.message 
        : "更新中心点失败，请检查网络连接";
      
      set({
        error: errorMessage,
      });
      return false;
    } finally {
      set({ updating: false });
    }
  },

  updateRadiusLocal: (radius: number) => {
    const currentData = get().deliveryArea;
    if (currentData) {
      set({
        deliveryArea: {
          ...currentData,
          radius,
        },
      });
    }
  },

  reset: () => {
    set({
      deliveryArea: null,
      loading: false,
      updating: false,
      error: null,
    });
  },
}));
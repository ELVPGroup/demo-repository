import { create } from 'zustand';
import type { AddressInfo, CreateAddressRequest, UpdateAddressRequest } from '../types/orderDetailInterface';
import type { LogisticsProvider } from '../types/index';
import { commonAxiosInstance, merchantAxiosInstance } from '../utils/axios';


interface ShippingStore {
    shippingList: AddressInfo[];
    defaultAddress: AddressInfo | null;
    loading: boolean;
    error: string | null;
    logisticsProviderList: LogisticsProvider[];

    // actions
    fetchShippingList: () => Promise<void>;
    fetchDefaultAddress: () => Promise<void>;
    setDefaultAddress: (addressInfoId: string) => Promise<void>;
    addShipping: (shipping: CreateAddressRequest) => Promise<AddressInfo>;
    updateShipping: (shipping: UpdateAddressRequest) => Promise<AddressInfo>;
    deleteShipping: (shippingId: string) => Promise<void>;

    //get logistics provider list
    getLogisticsProviderList: () => Promise<void>;
}

export const useShippingStore = create<ShippingStore>((set) => ({
    shippingList: [],
    defaultAddress: null,
    loading: false,
    error: null,
    logisticsProviderList: [],

    fetchShippingList: async () => {
        set({ loading: true });
        try {
            const response = await commonAxiosInstance.get('/shipping/list');

            set({ shippingList: response.data.data });

        } catch (error) {
            set({ error: error as string });
        } finally {
            set({ loading: false });
        }
    },
    fetchDefaultAddress: async () => {
        try {
            const response = await commonAxiosInstance.get('/shipping/default');
            set({ defaultAddress: response.data.data });
        } catch (error) {
            // 如果没有默认地址（400），忽略错误
            set({ defaultAddress: null });
        }
    },
    setDefaultAddress: async (addressInfoId: string) => {
        set({ loading: true });
        try {
            const response = await commonAxiosInstance.post('/shipping/default', { addressInfoId });
            set({ defaultAddress: response.data.data });
        } catch (error) {
            set({ error: error as string });
            throw error;
        } finally {
            set({ loading: false });
        }
    },
    addShipping: async (shipping: CreateAddressRequest) => {
        set({ loading: true });
        try {
            // 前端只发送 name, phone, address
            const response = await commonAxiosInstance.post<{ data: AddressInfo }>('/shipping/list', shipping);

            // 后端返回完整数据：name, phone, address + id + location
            const newAddress = response.data.data;

            // 更新 store，使用后端返回的完整数据
            set((state) => ({ shippingList: [...state.shippingList, newAddress] }));

            return newAddress;
        } catch (error) {
            set({ error: error as string });
            throw error;
        } finally {
            set({ loading: false });
        }
    },
    updateShipping: async (shipping: UpdateAddressRequest) => {
        set({ loading: true });
        try {
            // 前端发送包含 addressInfoId, name, phone, address 的完整对象
            await commonAxiosInstance.put('/shipping/list', shipping);

            // 后端不返回数据，使用前端发送的数据更新 store
            // 保留原有的 location（如果存在）
            let updatedAddress: AddressInfo | undefined;

            set((state) => {
                const updatedList: AddressInfo[] = state.shippingList.map((item: AddressInfo) => {
                    if (item.addressInfoId === shipping.addressInfoId) {
                        // 合并前端数据和原有数据，保留 location
                        const updated: AddressInfo = {
                            ...item,
                            name: shipping.name,
                            phone: shipping.phone,
                            address: shipping.address,
                            // location 保持不变（后端可能会更新，但前端暂时保留原值）
                        };
                        updatedAddress = updated;
                        return updated;
                    }
                    return item;
                });

                return { shippingList: updatedList };
            });

            if (!updatedAddress) {
                throw new Error('未找到要更新的地址');
            }

            return updatedAddress;
        } catch (error) {
            set({ error: error as string });
            throw error;
        } finally {
            set({ loading: false });
        }
    },
    deleteShipping: async (shippingId: string) => {
        set({ loading: true });
        try {
            await commonAxiosInstance.delete(`/shipping/list/${shippingId}`);
            set((state) => ({ shippingList: state.shippingList.filter((shipping) => shipping.addressInfoId !== shippingId) }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            set({ error: errorMessage });
        } finally {
            set({ loading: false });
        }
    },
    getLogisticsProviderList: async () => {
        set({ loading: true });
        try {
            const response = await merchantAxiosInstance.get('/logistics-provider');
            set({ logisticsProviderList: response.data.data });
        } catch (error) {
            set({ error: error as string });
        } finally {
            set({ loading: false });
        }
    }
}));
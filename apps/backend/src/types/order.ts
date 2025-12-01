export type OrderStatus = 'PENDING' | 'SHIPPED' | 'COMPLETED' | 'CANCELED';
import type { Optional, PaginationParams, SortParams } from './index.js';
import type { Product } from './product.js';
import type { Address } from './address.js';

export type MerchantOrderListParams = {
  merchantId: number;
} & Partial<SortParams & PaginationParams>;

export type MerchantOrderListFilterParams = {
  status?: OrderStatus;
  customerName?: string;
};

export type ClientOrderListParams = {
  userId: number;
} & Partial<SortParams & PaginationParams>;

export type ClientOrderListFilterParams = {
  status?: OrderStatus;
  productName?: string;
  orderId?: number;
};

export type CreateOrderItemInput = {
  productId: number;
  quantity: number;
};

export type CreateShippingToInput = {
  name: string;
  phone: string;
  address: string;
  longitude?: number;
  latitude?: number;
};

export type CreateOrderPayload = {
  userId: number;
  merchantId: number;
  shippingFromId: number;
  shippingTo: CreateShippingToInput;
  items: CreateOrderItemInput[];
  description?: string;
};

export type CreateOrderBody = {
  userId: string;
  amount: number;
  totalPrice: number;
  shippingFromId: string;
  shippingTo: Omit<Address, 'addressInfoId' | 'position'> & {
    addressInfoId: string; // 接收地址服务ID（string）
  };
  products: Array<
    Product & {
      productId: string; // 接收商品服务ID（string）
    }
  >;
  description?: string;
};

export type UpdateOrderServicePayload = {
  status?: OrderStatus | undefined;
  totalPrice?: number | undefined;
  shippingInfo?: Optional<Address, 'name' | 'phone' | 'address'> | undefined;
  products?: Array<Product> | undefined;
};

export type UpdateOrderBody = {
  status?: OrderStatus;
  totalPrice?: number;
  shippingInfo?: Optional<Address, 'name' | 'phone' | 'address'> & {
    addressInfoId: string; // 接收地址服务ID（string）
  };
  products?: Array<
    Optional<Product, 'name' | 'description' | 'price'> & {
      productId: string; // 接收商品服务ID（string）
    }
  >;
};

export type OrderStatus = 'PENDING' | 'SHIPPED' | 'COMPLETED' | 'CANCELED';
import type { ShippingStatus } from 'generated/prisma/enums.js';
import type { PaginationParams, SortParams } from './index.js';

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
  shippingTo: {
    name: string;
    phone: string;
    address: string;
    location?: [number, number];
  };
  products: Array<{
    productId: string;
    name: string;
    description: string;
    price: number;
    amount: number; // 作为下单数量
  }>;
  description?: string;
};

export type OrderDetailShape = {
  user: { name: string };
  merchant: { name: string };
  userId: number;
  merchantId: number;
  orderId: number;
  status: OrderStatus;
  createdAt: Date;
  detail?: {
    addressFrom?: {
      addressInfoId: number;
      name: string;
      phone: string;
      address: string;
      longitude: number;
      latitude: number;
    };
    addressTo?: {
      addressInfoId: number;
      name: string;
      phone: string;
      address: string;
      longitude: number;
      latitude: number;
    };
    timelineItems: Array<{ shippingStatus: ShippingStatus; time: Date; description?: string }>;
  };
  orderItems: Array<{
    quantity: number;
    product: { productId: number; name: string; price: unknown };
  }>;
};

import type { OrderStatus } from 'generated/prisma/enums.js';
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

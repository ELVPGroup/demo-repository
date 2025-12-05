export interface OrderQueryParams {
  status?: string;
  customerName?: string;
  orderId?: string;
  productName?: string;
  limit?: number;
  offset?: number;
  sort?: 'asc' | 'desc';
  sortBy?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'delivered';

export interface OrderItem {
  orderId: string;
  merchantId: string;
  userId: string;
  userName: string;
  status: OrderStatus; // "待发货" | "已发货" | "已完成" | ...
  amount: number;
  createdAt: string;
  totalPrice: number;
}

// 后端响应类型
export interface OrderListResponse {
  title: string;
  status: number;
  message: string;
  data: OrderItem[];
}

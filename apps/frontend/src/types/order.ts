export interface OrderQueryParams {
  sort?: 'asc' | 'desc';
  sortBy?: string;
  limit?: number;
  offset?: number;
  status?: string;
  customerName?: string;
}

export type OrderStatus = '待发货' | '运输中' | '已送达' | '已完成';

export interface OrderItem {
  orderId: string;
  merchantId: string;
  userId: string;
  userName: string;
  status: OrderStatus;
  amount: number; // 订单商品总数量
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

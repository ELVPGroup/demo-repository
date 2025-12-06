// 订单产品
export interface OrderProduct {
  productId: string;
  name: string;
  description: string;
  price: number;
  amount: number;
}

// 地址信息（完整数据，包含后端返回的所有字段）
export interface AddressInfo {
  addressInfoId: string;
  name: string;
  phone: string;
  address: string;
  location: [number, number];
}

// 创建地址的请求数据（前端只发送这三个字段）
export interface CreateAddressRequest {
  name: string;
  phone: string;
  address: string;
}

// 更新地址的请求数据（前端只发送这三个字段）
export interface UpdateAddressRequest {
  addressInfoId: string;
  name: string;
  phone: string;
  address: string;
}

// 时间线
export interface OrderTimelineItem {
  shippingStatus: string;
  time: string;
  description: string;
}

export type ShippingStatus = '待发货' | '已揽收' | '运输中' | '派送中' | '已签收';

// 订单主体
export interface OrderDetail {
  orderId: string;
  merchantId: string;
  userId: string;
  userName: string;
  status: string;
  amount: number;
  createdAt: string;
  totalPrice: number;
  shippingFrom: AddressInfo;
  shippingTo: AddressInfo;
  products: OrderProduct[];
  shippingStatus: ShippingStatus;
  timeline: OrderTimelineItem[];
}

// 接口返回格式
export interface OrderDetailResponse {
  title: string;
  status: number;
  message: string;
  data: OrderDetail;
}

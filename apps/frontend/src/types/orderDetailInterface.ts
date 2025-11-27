// 订单产品
export interface OrderProduct {
  productId: string;
  name: string;
  description: string;
  price: number;
  amount: number;
}

// 地址信息
export interface AddressInfo {
  addressInfoId: string;
  name: string;
  phone: string;
  address: string;
  location: [number, number];
}

// 时间线
export interface OrderTimelineItem {
  shippingStatus: string;
  time: string;
  description: string;
}

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
  addressInfo: AddressInfo;
  products: OrderProduct[];
  shippingStatus: string;
  timeline: OrderTimelineItem[];
}

// 接口返回格式
export interface OrderDetailResponse {
  title: string;
  status: number;
  message: string;
  data: OrderDetail;
}

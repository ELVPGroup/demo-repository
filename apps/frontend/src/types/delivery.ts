export interface DeliveryAreaData {
  merchantId: string;
  center: [number, number]; // [经度, 纬度]
  radius: number; // 公里
}

export interface DeliveryAreaResponse {
  title: string;
  status: number;
  message: string;
  data: DeliveryAreaData;
}
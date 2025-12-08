export type GeoPoint = [number, number];

export type OrderStatus = 'PENDING' | 'SHIPPED' | 'COMPLETED' | 'CANCELED';

export type ShippingStatus =
  | 'PENDING'
  | 'PACKING'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELED';

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
}

export interface SimulationConfig {
  speedKmh: number;
  tickMs: number;
  variance: number;
}

export interface SimulationState {
  progress: number;
  location: GeoPoint;
  totalDistanceMeters: number;
  remainingDistanceMeters: number;
  startedAt: number; // 模拟开始时间戳
  baseSpeedKmh: number;
  plannedArrivalTime: number; // 计划到达时间戳
}

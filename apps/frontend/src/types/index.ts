export interface Coordinate {
  x: number; // km from center
  y: number; // km from center
}

export enum OrderStatus {
  DELIVERABLE = 'DELIVERABLE', // Within range and time
  TIME_RISK = 'TIME_RISK', // Within range but slow
  OUT_OF_RANGE = 'OUT_OF_RANGE', // Outside radius
}

export interface Order {
  id: string;
  location: Coordinate;
  distance: number; // Calculated distance from center
  status: OrderStatus;
  estimatedTime: number; // Minutes
  customerName?: string;
}

export interface LogisticsProvider {
  logisticsId: string; // 后端返回的字段名
  name: string;
  speed: number; // km/h
  // 以下字段为可选，因为后端可能不返回
  type?: 'EV' | 'Truck' | 'Drone';
  maxRange?: number; // km
  color?: string;
}

export interface DashboardStats {
  total: number;
  deliverable: number;
  outOfRange: number;
  risk: number;
}

// --- New Types for Client Tracker ---

export interface TrackingStep {
  id: string;
  status: string;
  date: string;
  time: string;
  description: string;
  completed: boolean;
  currentLocation: boolean;
}

export interface PackageData {
  id: string;
  source: string;
  currentLocation: string;
  eta: string;
  remaining: string;
  steps: TrackingStep[];
  currentLocationCoords?: [number, number];
}

// 在 types.ts 中添加
export interface RouteData {
  from: [number, number];
  to: [number, number];
  waypoints: [number, number][];
  distance: number;
  duration: number;
}

export interface AMapVisualizationProps {
  // ... 其他属性
  route?: RouteData;
  showRoute?: boolean;
  currentLocation?: [number, number];
}

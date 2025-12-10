export interface DashboardStats {
  todayOrderCount: number;
  todaySalesAmount: number;
  toHandleOrderCount: number;
  abnormalOrderCount: number;
  orderIncreaseCount: number;
  salesIncreaseAmount: number;
}

export interface SalesTrendItem {
  date: string;
  amount: number;
}

export interface DeliveryEfficiencyItem {
  date: string;
  avgDeliveryTime: number;
}

export interface OrderStatusDistributionItem {
  name: string;
  value: number;
}

export interface DashboardData {
  stats: DashboardStats;
  charts: {
    salesTrend: SalesTrendItem[];
    deliveryEfficiency: DeliveryEfficiencyItem[];
    orderStatusDistribution: OrderStatusDistributionItem[];
  };
}

export interface DashboardResponse {
  data: DashboardData;
  message: string;
}

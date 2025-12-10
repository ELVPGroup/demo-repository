import { useEffect, useState } from 'react';
import { TopBar } from '@/components/merchantComponents/TopBar';
import KPISection from '@/components/charts/KPISection';
import SalesBarChart from '@/components/charts/SalesBarChart';
import OrderLineChart from '@/components/charts/OrderLineChart';
import OrderStatusPieChart from '@/components/charts/OrderStatusPieChart';
import OrderAmountHeatmap from '@/components/charts/OrderAmountHeatmap';
import type { DashboardData } from '@/types/dashboard';
import { merchantAxiosInstance } from '@/utils/axios';

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await merchantAxiosInstance.get('/dashboard');
        setDashboardData(response.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Error handling is already done in axios interceptor mostly, but just in case
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="ml-60 px-10 py-6">
        <TopBar title={`数据分析仪表盘`} />

        {loading ? (
          <div className="flex h-64 items-center justify-center">Loading...</div>
        ) : (
          <>
            <KPISection stats={dashboardData?.stats} />

            {/* 图表区域 */}
            <div className="grid grid-cols-2 gap-6">
              <SalesBarChart data={dashboardData?.charts.salesTrend} />
              <OrderLineChart data={dashboardData?.charts.deliveryEfficiency} />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-6">
              <OrderStatusPieChart data={dashboardData?.charts.orderStatusDistribution} />
              <OrderAmountHeatmap />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;

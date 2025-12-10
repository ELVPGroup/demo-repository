import { TopBar } from '@/components/merchantComponents/TopBar';
import KPISection from '@/components/charts/KPISection';
import SalesBarChart from '@/components/charts/SalesBarChart';
import OrderLineChart from '@/components/charts/OrderLineChart';
import CategoryPieChart from '@/components/charts/CategoryPieChart';
// import OrderAmountHeatmap from '@/components/charts/OrderAmountHeatmap';
// import { MOCK_ORDER_HEATMAP_DATA } from '@/components/charts/mockOrderAmountData';

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="ml-60 px-10 py-6">
        <TopBar title={`数据分析仪表盘`} />

        <KPISection />

        {/* 图表区域 */}
        <div className="grid grid-cols-2 gap-6">
          <SalesBarChart />
          <OrderLineChart />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <CategoryPieChart />
          {/* <OrderAmountHeatmap data={MOCK_ORDER_HEATMAP_DATA} /> */}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;

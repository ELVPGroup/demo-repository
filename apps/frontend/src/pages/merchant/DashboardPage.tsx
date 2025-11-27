import Sidebar from '@/components/merchantComponents/Sidebar';
import { TopBar } from '@/components/merchantComponents/TopBar';
import KPISection from '@/components/charts/KPISection';
import SalesBarChart from '@/components/charts/SalesBarChart';
import OrderLineChart from '@/components/charts/OrderLineChart';
import CategoryPieChart from '@/components/charts/CategoryPieChart';
import RegionHeatMap from '@/components/charts/RegionHeatMap';

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">

      <main className="ml-60 px-10 py-6">

        <TopBar title={`数据分析仪表盘`} />

        <Sidebar />

        <KPISection />

        {/* 图表区域 */}
        <div className="grid grid-cols-2 gap-6">
          <SalesBarChart />
          <OrderLineChart />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <CategoryPieChart />
          <RegionHeatMap />
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;

import ReactECharts from 'echarts-for-react';
import type { OrderStatusDistributionItem } from '../../types/dashboard';

interface OrderStatusPieChartProps {
  data?: OrderStatusDistributionItem[];
}

const OrderStatusPieChart = ({ data }: OrderStatusPieChartProps) => {
  if (!data) return null;

  const option = {
    title: { text: '订单状态占比', left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: '60%',
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <ReactECharts option={option} style={{ height: 320 }} />
    </div>
  );
};

export default OrderStatusPieChart;

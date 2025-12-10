import ReactECharts from 'echarts-for-react';
import type { SalesTrendItem } from '@/types/dashboard';

interface SalesBarChartProps {
  data?: SalesTrendItem[];
}

const SalesBarChart = ({ data }: SalesBarChartProps) => {
  if (!data) return null;

  const option = {
    title: { text: '7日内订单总额视图' },
    tooltip: {},
    xAxis: {
      type: 'category',
      data: data.map((item) => item.date),
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '销售额',
        type: 'bar',
        data: data.map((item) => item.amount),
      },
    ],
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <ReactECharts option={option} style={{ height: 320 }} />
    </div>
  );
};

export default SalesBarChart;

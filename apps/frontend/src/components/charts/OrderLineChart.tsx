import ReactECharts from 'echarts-for-react';
import type { DeliveryEfficiencyItem } from '../../types/dashboard';

interface OrderLineChartProps {
  data?: DeliveryEfficiencyItem[];
}

const OrderLineChart = ({ data }: OrderLineChartProps) => {
  if (!data) return null;

  const option = {
    title: { text: '配送时效分析视图 (平均配送时长/小时)' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: data.map((item) => item.date),
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '平均配送时长(小时)',
        type: 'line',
        smooth: true,
        data: data.map((item) => item.avgDeliveryTime),
      },
    ],
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <ReactECharts option={option} style={{ height: 320 }} />
    </div>
  );
};

export default OrderLineChart;

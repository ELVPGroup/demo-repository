import ReactECharts from "echarts-for-react";

const OrderLineChart = () => {
  const option = {
    title: { text: "订单数量变化（折线图）" },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: ["1日", "2日", "3日", "4日", "5日", "6日", "7日"] },
    yAxis: { type: "value" },
    series: [
      {
        name: "订单数",
        type: "line",
        smooth: true,
        data: [120, 98, 150, 180, 160, 200, 230],
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <ReactECharts option={option} style={{ height: 320 }} />
    </div>
  );
};

export default OrderLineChart;

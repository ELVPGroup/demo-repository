import ReactECharts from "echarts-for-react";

const SalesBarChart = () => {
  const option = {
    title: { text: "订单总额变化（柱状图）" },
    tooltip: {},
    xAxis: {
      type: "category",
      data: ["1日", "2日", "3日", "4日", "5日", "6日", "7日"],
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "销售额",
        type: "bar",
        data: [4300, 5800, 6100, 7400, 6900, 7800, 8200],
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <ReactECharts option={option} style={{ height: 320 }} />
    </div>
  );
};

export default SalesBarChart;

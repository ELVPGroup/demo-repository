import ReactECharts from "echarts-for-react";

const CategoryPieChart = () => {
  const option = {
    title: { text: "商品种类占比", left: "center" },
    tooltip: { trigger: "item" },
    legend: { bottom: 0 },
    series: [
      {
        type: "pie",
        radius: "60%",
        data: [
          { value: 40, name: "饮料类" },
          { value: 35, name: "小吃类" },
          { value: 15, name: "套餐类" },
          { value: 10, name: "其他" },
        ],
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <ReactECharts option={option} style={{ height: 320 }} />
    </div>
  );
};

export default CategoryPieChart;

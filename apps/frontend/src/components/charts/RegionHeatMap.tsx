import ReactECharts from "echarts-for-react";

// 注意：echarts 6.0 中地图数据需要通过在线资源获取
// 如果需要完整地图功能，可以从以下地址获取：https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json

const RegionHeatMap = () => {
  // 使用地理坐标散点图作为替代方案，不依赖地图 JSON 文件
  const option = {
    title: { text: "订单地区分布热力图" },
    tooltip: { trigger: "item" },
    visualMap: {
      min: 0,
      max: 500,
      left: "left",
      bottom: "10%",
      text: ["高", "低"],
      calculable: true,
      inRange: {
        color: ["#50a3ba", "#eac736", "#d94e5d"],
      },
    },
    geo: {
      map: "china",
      roam: true,
      itemStyle: {
        areaColor: "#f0f0f0",
        borderColor: "#999",
      },
    },
    series: [
      {
        name: "订单量",
        type: "scatter",
        coordinateSystem: "geo",
        data: [
          { name: "广东", value: [113.23, 23.16, 320] },
          { name: "浙江", value: [120.19, 30.26, 210] },
          { name: "江苏", value: [118.78, 32.04, 180] },
          { name: "上海", value: [121.48, 31.22, 160] },
        ],
        symbolSize: (val: number[]) => val[2] / 10,
        itemStyle: {
          color: "#d94e5d",
        },
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <ReactECharts option={option} style={{ height: 320 }} />
    </div>
  );
};

export default RegionHeatMap;

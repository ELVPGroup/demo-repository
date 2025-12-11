import React, { useEffect, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { merchantAxiosInstance } from '@/utils/axios';
import { message } from 'antd';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point, polygon, multiPolygon } from '@turf/helpers';
import type { FeatureCollection, Feature, Geometry } from 'geojson';

// GeoJSON URL
const CHINA_GEOJSON_URL = '/map_100000_full.json';

interface DeliveryAreaOrder {
  amount: number;
  createdAt: string;
  distance: number;
  distanceKm: number;
  inRange: boolean;
  location: [number, number]; // [lng, lat]
  merchantId: string;
  orderId: string;
  status: string;
  totalPrice: number;
  userId: string;
  userName: string;
}

const OrderAmountHeatmap: React.FC = () => {
  const [geoJson, setGeoJson] = useState<FeatureCollection | null>(null);
  const [orders, setOrders] = useState<DeliveryAreaOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 获取中国地图GeoJSON数据
  useEffect(() => {
    const fetchGeoJson = async () => {
      try {
        const response = await fetch(CHINA_GEOJSON_URL);
        const data = await response.json();
        echarts.registerMap('china', data);
        setGeoJson(data);
      } catch (error) {
        console.error('Failed to fetch China GeoJSON:', error);
        message.error('地图数据加载失败');
      }
    };

    fetchGeoJson();
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await merchantAxiosInstance.post('/orders/delivery-area', {});

        const data = response.data as { data: DeliveryAreaOrder[] };
        let orderList: DeliveryAreaOrder[] = [];
        orderList = data.data;

        setOrders(orderList);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        message.error('订单数据加载失败');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // 处理数据，将订单按省份聚合
  const chartOption = useMemo(() => {
    if (!geoJson || !orders.length) return null;

    const provinceData: Record<string, { totalAmount: number; count: number }> = {};

    geoJson.features.forEach((feature: Feature) => {
      if (feature.properties && feature.properties['name']) {
        provinceData[feature.properties['name']] = { totalAmount: 0, count: 0 };
      }
    });

    orders.forEach((order) => {
      const pt = point(order.location);

      for (const feature of geoJson.features) {
        if (!feature.geometry || !feature.properties?.['name']) continue;

        let isInside = false;
        try {
          if (feature.geometry.type === 'Polygon') {
            const poly = polygon(
              (feature.geometry as Geometry & { coordinates: number[][][] }).coordinates
            );
            isInside = booleanPointInPolygon(pt, poly);
          } else if (feature.geometry.type === 'MultiPolygon') {
            const poly = multiPolygon(
              (feature.geometry as Geometry & { coordinates: number[][][][] }).coordinates
            );
            isInside = booleanPointInPolygon(pt, poly);
          }
        } catch {
          // 忽略无效的几何对象
        }

        if (isInside) {
          const provinceName = feature.properties['name'];
          if (provinceData[provinceName]) {
            provinceData[provinceName].totalAmount += order.totalPrice;
            provinceData[provinceName].count += 1;
          }
          break;
        }
      }
    });

    // 准备地图数据（按省份聚合）
    const mapData = Object.entries(provinceData).map(([name, stats]) => ({
      name,
      value: stats.count, // Use count for coloring
      totalAmount: stats.totalAmount,
    }));

    // 准备订单散点数据（每个订单一个点，包含用户信息和订单金额）
    const scatterData = orders.map((order) => ({
      name: order.userName,
      value: [...order.location, order.totalPrice], // [lng, lat, price]
      originalOrder: order,
    }));

    const maxVal = Math.max(...mapData.map((d) => d.value), 10); // 订单数量的最大值，默认10

    return {
      title: {
        text: '各省份订单分布与统计',
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as {
            seriesType: string;
            name: string;
            data: { value?: number; totalAmount?: number; originalOrder?: DeliveryAreaOrder };
          };
          if (p.seriesType === 'map') {
            const data = p.data;
            return `${p.name}<br/>订单数量: ${data?.value || 0} 单<br/>订单总额: ${data?.totalAmount || 0} 元`;
          } else {
            const order = p.data.originalOrder as DeliveryAreaOrder;
            if (!order) return '';
            return `
              <b>订单详情</b><br/>
              用户: ${order.userName}<br/>
              金额: ${order.totalPrice} 元<br/>
              状态: ${order.status}<br/>
              时间: ${order.createdAt}
            `;
          }
        },
      },
      geo: {
        map: 'china',
        roam: true,
        zoom: 1.6, // 默认放大1.6倍
        center: [104.195397, 35.86166], // 默认中心点偏移（略微调整以更好地居中）
        scaleLimit: {
          min: 1.2, // 最小缩放比例，防止过小
          max: 5, // 最大缩放比例
        },
        itemStyle: {
          areaColor: '#f5f5f5',
          borderColor: '#999',
        },
        emphasis: {
          itemStyle: {
            areaColor: '#e0ffff',
          },
        },
      },
      visualMap: {
        min: 0,
        max: maxVal,
        left: 'left',
        top: 'bottom',
        text: ['订单多', '订单少'],
        calculable: true,
        inRange: {
          color: ['#ffffff', '#006edd'],
        },
        seriesIndex: 0, // Apply visualMap to map series (index 0)
      },
      series: [
        {
          name: '各省统计',
          type: 'map',
          geoIndex: 0,
          data: mapData,
          emphasis: {
            label: {
              show: true,
            },
          },
        },
        {
          name: '订单点',
          type: 'scatter',
          coordinateSystem: 'geo',
          data: scatterData,
          symbolSize: 6,
          itemStyle: {
            color: '#FF5722', // 订单点颜色
            opacity: 0.8,
            shadowBlur: 2,
            shadowColor: '#333',
          },
          emphasis: {
            scale: true,
            itemStyle: {
              color: '#D84315',
            },
          },
        },
      ],
    };
  }, [geoJson, orders]);

  if (loading || !geoJson) {
    return <div className="flex h-64 w-full items-center justify-center">加载地图数据中...</div>;
  }

  return (
    <div className="h-[400px] w-full rounded-lg bg-white p-4 shadow-sm">
      <ReactECharts
        option={chartOption || {}}
        style={{ height: '100%', width: '100%' }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
};

export default OrderAmountHeatmap;

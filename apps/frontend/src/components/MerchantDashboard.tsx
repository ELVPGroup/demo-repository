import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_PROVIDERS } from '../constants';
import { type Order, OrderStatus, type DashboardStats } from '../types';
import AMapVisualization from './AMapVisualization';
import { generateRandomLocations, calculateDistance } from '../utils/locationUtils';
import { CheckCircle2, Navigation, MapPin } from 'lucide-react';

// 生成武汉周边的随机收货地址
const WUHAN_CENTER: [number, number] = [114.335539, 30.593175];
const RANDOM_LOCATIONS = generateRandomLocations(WUHAN_CENTER, 30, 30); // 30个点，最大半径30公里

const MerchantDashboard: React.FC = () => {
  // --- State ---
  const [radius, setRadius] = useState<number>(13.6);
  const [selectedProviderId, setSelectedProviderId] = useState<string>(MOCK_PROVIDERS[0].id);
  const [orders, setOrders] = useState<Order[]>([]);

  // Derived State
  const currentProvider = useMemo(
    () => MOCK_PROVIDERS.find((p) => p.id === selectedProviderId) || MOCK_PROVIDERS[0],
    [selectedProviderId]
  );

  // 初始化订单数据
  useEffect(() => {
    const initialOrders: Order[] = RANDOM_LOCATIONS.map((location, index) => {
      const distance = calculateDistance(WUHAN_CENTER, location);

      return {
        id: `ORD${String(index + 1).padStart(4, '0')}`,
        customerName: `客户${index + 1}`,
        address: `武汉市某区某街道${index + 1}号`,
        location: { x: location[0], y: location[1] },
        distance,
        estimatedTime: 0,
        status: OrderStatus.OUT_OF_RANGE,
      };
    });

    setOrders(initialOrders);
  }, []);

  // --- Logic: Recalculate Order Statuses ---
  useEffect(() => {
    if (orders.length === 0) return;

    const updatedOrders = orders.map((order) => {
      const distance = order.distance;
      const time = (distance / currentProvider.speed) * 60 + 10; // 基础时间+10分钟

      let status = OrderStatus.OUT_OF_RANGE;

      if (distance <= radius) {
        if (time > 90) {
          status = OrderStatus.TIME_RISK;
        } else {
          status = OrderStatus.DELIVERABLE;
        }
      }

      return {
        ...order,
        estimatedTime: time,
        status,
      };
    });

    setOrders(updatedOrders);
  }, [radius, currentProvider, orders.length]);

  // --- Stats Calculation ---
  const stats: DashboardStats = useMemo(() => {
    return {
      total: orders.length,
      deliverable: orders.filter((o) => o.status === OrderStatus.DELIVERABLE).length,
      outOfRange: orders.filter((o) => o.status === OrderStatus.OUT_OF_RANGE).length,
      risk: orders.filter((o) => o.status === OrderStatus.TIME_RISK).length,
    };
  }, [orders]);

  // 准备地图标记数据
  const mapMarkers = useMemo(() => {
    return orders.map((order) => ({
      id: order.id,
      position: [order.location.x, order.location.y] as [number, number],
      color:
        order.status === OrderStatus.DELIVERABLE
          ? 'green'
          : order.status === OrderStatus.TIME_RISK
            ? 'orange'
            : 'red',
    }));
  }, [orders]);

  return (
    <div className="flex h-full w-full bg-gray-100">
      {/* --- LEFT SIDEBAR --- */}
      <div className="z-20 flex h-full w-96 flex-col border-r border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-100 bg-blue-600 p-6 text-white">
          <div className="mb-1 flex items-center gap-2">
            <Navigation className="h-6 w-6" />
            <h1 className="text-xl font-bold">商家配送管理</h1>
          </div>
          <p className="text-sm text-blue-100 opacity-90">武汉地区配送范围优化</p>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto">
          <div className="space-y-8 p-6">
            {/* 1. Provider Selection */}
            <section>
              <h2 className="mb-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                物流服务商
              </h2>
              <div className="space-y-3">
                {MOCK_PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => setSelectedProviderId(provider.id)}
                    className={`group flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all ${
                      selectedProviderId === provider.id
                        ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-200'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-gray-800">{provider.name}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        速度: <span className="font-medium">{provider.speed} km/h</span>
                      </div>
                    </div>
                    {selectedProviderId === provider.id && (
                      <div className="rounded-full bg-blue-100 p-1 text-blue-600">
                        <CheckCircle2 size={16} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* 2. Zone Controls */}
            <section>
              <div className="mb-3 flex items-end justify-between">
                <h2 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  配送半径
                </h2>
                <span className="text-2xl font-bold text-blue-600">
                  {radius.toFixed(1)} <span className="text-sm font-normal text-gray-500">km</span>
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="50"
                step="0.1"
                value={radius}
                onChange={(e) => setRadius(parseFloat(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600"
              />
              <div className="mt-2 flex justify-between text-xs text-gray-400">
                <span>1 km</span>
                <span>50 km</span>
              </div>

              <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <MapPin size={16} />
                  <span>
                    覆盖 {stats.deliverable} / {stats.total} 个地址
                  </span>
                </div>
                <div className="mt-1 text-xs text-blue-600">
                  {((stats.deliverable / stats.total) * 100).toFixed(1)}% 的地址在配送范围内
                </div>
              </div>
            </section>

            {/* 3. Stats Overview */}
            <section className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center">
                <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                <div className="text-xs text-gray-500 uppercase">总订单</div>
              </div>
              <div className="rounded-lg border border-green-100 bg-green-50 p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.deliverable}</div>
                <div className="text-xs text-green-600 uppercase">可配送</div>
              </div>
              <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.outOfRange}</div>
                <div className="text-xs text-red-600 uppercase">范围外</div>
              </div>
              <div className="rounded-lg border border-orange-100 bg-orange-50 p-3 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.risk}</div>
                <div className="text-xs text-orange-600 uppercase">时效风险</div>
              </div>
            </section>
          </div>

          {/* Order List Snippet */}
          <div className="border-t border-gray-200">
            <div className="border-b border-gray-200 bg-gray-50 p-4 text-sm font-semibold text-gray-600">
              订单详情 ({stats.total})
            </div>
            <div className="max-h-96 divide-y divide-gray-100 overflow-y-auto">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 transition-colors hover:bg-blue-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-800">{order.id}</div>
                    <div className="mt-0.5 truncate text-xs text-gray-500">
                      {order.customerName} • {order.distance.toFixed(1)}km
                    </div>
                    <div className="mt-0.5 text-xs text-gray-400">
                      预计: {Math.round(order.estimatedTime)} 分钟
                    </div>
                  </div>
                  <div
                    className={`rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap ${
                      order.status === OrderStatus.DELIVERABLE
                        ? 'bg-green-100 text-green-700'
                        : order.status === OrderStatus.TIME_RISK
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {order.status === OrderStatus.DELIVERABLE
                      ? '可配送'
                      : order.status === OrderStatus.TIME_RISK
                        ? '时效风险'
                        : '范围外'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- RIGHT MAP AREA --- */}
      <div className="relative h-full flex-1">
        <AMapVisualization
          center={WUHAN_CENTER}
          radius={radius}
          setRadius={setRadius}
          markers={mapMarkers}
          showCircle={true}
          showRoute={false}
        />
      </div>
    </div>
  );
};

export default MerchantDashboard;

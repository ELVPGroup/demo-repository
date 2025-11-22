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
  const currentProvider = useMemo(() =>
    MOCK_PROVIDERS.find(p => p.id === selectedProviderId) || MOCK_PROVIDERS[0],
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
        status: OrderStatus.OUT_OF_RANGE
      };
    });

    setOrders(initialOrders);
  }, []);

  // --- Logic: Recalculate Order Statuses ---
  useEffect(() => {
    if (orders.length === 0) return;

    const updatedOrders = orders.map(order => {
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
        status
      };
    });

    setOrders(updatedOrders);
  }, [radius, currentProvider, orders.length]);

  // --- Stats Calculation ---
  const stats: DashboardStats = useMemo(() => {
    return {
      total: orders.length,
      deliverable: orders.filter(o => o.status === OrderStatus.DELIVERABLE).length,
      outOfRange: orders.filter(o => o.status === OrderStatus.OUT_OF_RANGE).length,
      risk: orders.filter(o => o.status === OrderStatus.TIME_RISK).length,
    };
  }, [orders]);

  // 准备地图标记数据
  const mapMarkers = useMemo(() => {
    return orders.map(order => ({
      id: order.id,
      position: [order.location.x, order.location.y] as [number, number],
      color: order.status === OrderStatus.DELIVERABLE ? 'green' :
        order.status === OrderStatus.TIME_RISK ? 'orange' : 'red'
    }));
  }, [orders]);

  return (
    <div className="flex h-full w-full bg-gray-100">
      {/* --- LEFT SIDEBAR --- */}
      <div className="w-96 bg-white shadow-xl z-20 flex flex-col h-full border-r border-gray-200">

        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-blue-600 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Navigation className="w-6 h-6" />
            <h1 className="text-xl font-bold">商家配送管理</h1>
          </div>
          <p className="text-blue-100 text-sm opacity-90">武汉地区配送范围优化</p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-8">

            {/* 1. Provider Selection */}
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">物流服务商</h2>
              <div className="space-y-3">
                {MOCK_PROVIDERS.map(provider => (
                  <button
                    key={provider.id}
                    onClick={() => setSelectedProviderId(provider.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group ${selectedProviderId === provider.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                  >
                    <div>
                      <div className="font-semibold text-gray-800">{provider.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        速度: <span className="font-medium">{provider.speed} km/h</span>
                      </div>
                    </div>
                    {selectedProviderId === provider.id && (
                      <div className="bg-blue-100 text-blue-600 p-1 rounded-full">
                        <CheckCircle2 size={16} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* 2. Zone Controls */}
            <section>
              <div className="flex justify-between items-end mb-3">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">配送半径</h2>
                <span className="text-2xl font-bold text-blue-600">{radius.toFixed(1)} <span className="text-sm text-gray-500 font-normal">km</span></span>
              </div>

              <input
                type="range"
                min="1"
                max="50"
                step="0.1"
                value={radius}
                onChange={(e) => setRadius(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>1 km</span>
                <span>50 km</span>
              </div>

              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700 text-sm">
                  <MapPin size={16} />
                  <span>覆盖 {stats.deliverable} / {stats.total} 个地址</span>
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {((stats.deliverable / stats.total) * 100).toFixed(1)}% 的地址在配送范围内
                </div>
              </div>
            </section>

            {/* 3. Stats Overview */}
            <section className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-center">
                <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                <div className="text-xs text-gray-500 uppercase">总订单</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-100 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.deliverable}</div>
                <div className="text-xs text-green-600 uppercase">可配送</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.outOfRange}</div>
                <div className="text-xs text-red-600 uppercase">范围外</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.risk}</div>
                <div className="text-xs text-orange-600 uppercase">时效风险</div>
              </div>
            </section>
          </div>

          {/* Order List Snippet */}
          <div className="border-t border-gray-200">
            <div className="p-4 bg-gray-50 border-b border-gray-200 font-semibold text-sm text-gray-600">
              订单详情 ({stats.total})
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {orders.map((order) => (
                <div key={order.id} className="p-3 hover:bg-blue-50 transition-colors flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{order.id}</div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      {order.customerName} • {order.distance.toFixed(1)}km
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      预计: {Math.round(order.estimatedTime)} 分钟
                    </div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap
                    ${order.status === OrderStatus.DELIVERABLE ? 'bg-green-100 text-green-700' :
                      order.status === OrderStatus.TIME_RISK ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'}`}
                  >
                    {order.status === OrderStatus.DELIVERABLE ? '可配送' :
                      order.status === OrderStatus.TIME_RISK ? '时效风险' : '范围外'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- RIGHT MAP AREA --- */}
      <div className="flex-1 relative h-full">
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

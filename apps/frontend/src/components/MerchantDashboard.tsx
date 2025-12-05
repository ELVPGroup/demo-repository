/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MOCK_PROVIDERS } from '../constants';
import { type Order, OrderStatus, type DashboardStats } from '../types';
import AMapVisualization from './AMapVisualization';
import { generateRandomLocations, calculateDistance } from '../utils/locationUtils';
import { CheckCircle2, Navigation, MapPin, Loader2, Save, AlertCircle } from 'lucide-react';
import { useDeliveryAreaStore } from "@/store/useDeliveryArea";
import { message } from 'antd';

const DEFAULT_CENTER: [number, number] = [114.335539, 30.593175];
const DEFAULT_RADIUS = 13.6;

const MerchantDashboard: React.FC = () => {
  // --- State ---
  const [radius, setRadius] = useState<number>(DEFAULT_RADIUS);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [selectedProviderId, setSelectedProviderId] = useState<string>(MOCK_PROVIDERS[0].id);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  // 使用防抖ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 使用配送区域store
  const { 
    deliveryArea, 
    loading: areaLoading, 
    updating: areaUpdating,
    error: areaError, 
    fetchDeliveryArea,
    updateDeliveryArea,
    updateRadiusLocal
  } = useDeliveryAreaStore();

  // 初始化：获取配送区域信息
  useEffect(() => {
    fetchDeliveryArea();
  }, [fetchDeliveryArea]);

  // 当配送区域数据加载完成时，更新center和radius
  useEffect(() => {
    if (deliveryArea) {
      setCenter(deliveryArea.center);
      setRadius(deliveryArea.radius);
      console.log('配送区域加载完成:', deliveryArea);
    }
  }, [deliveryArea]);

  // 处理半径变化（带防抖和同步）
  const handleRadiusChange = useCallback(async (newRadius: number) => {
    // 立即更新本地状态以获得即时UI响应
    setRadius(newRadius);
    updateRadiusLocal(newRadius);
    
    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // 设置新的防抖定时器
    debounceTimerRef.current = setTimeout(async () => {
      if (!deliveryArea) {
        message.warning('未加载配送区域数据，无法同步');
        return;
      }
      
      setIsSyncing(true);
      try {
        // 传递当前的center和新的radius
        const success = await updateDeliveryArea({
          center: deliveryArea.center, // 传递当前的center
          radius: newRadius,           // 传递新的radius
        });
        
        if (success) {
          message.success('配送半径已更新');
        } else {
          message.error(areaError || '更新失败');
          // 恢复原来的值
          if (deliveryArea) {
            setRadius(deliveryArea.radius);
            updateRadiusLocal(deliveryArea.radius);
          }
        }
      } catch (err) {
        console.error('同步半径失败:', err);
        message.error('同步失败，请检查网络');
        // 恢复原来的值
        if (deliveryArea) {
          setRadius(deliveryArea.radius);
          updateRadiusLocal(deliveryArea.radius);
        }
      } finally {
        setIsSyncing(false);
      }
    }, 800); // 800ms防抖
  }, [deliveryArea, updateDeliveryArea, updateRadiusLocal, areaError]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Derived State
  const currentProvider = useMemo(
    () => MOCK_PROVIDERS.find((p) => p.id === selectedProviderId) || MOCK_PROVIDERS[0],
    [selectedProviderId]
  );

  // 初始化订单数据（基于当前center）
  useEffect(() => {
    if (center) {
      const RANDOM_LOCATIONS = generateRandomLocations(center, 30, 30);
      
      const initialOrders: Order[] = RANDOM_LOCATIONS.map((location, index) => {
        const distance = calculateDistance(center, location);

        return {
          id: `ORD${String(index + 1).padStart(4, '0')}`,
          customerName: `客户${index + 1}`,
          address: `某区某街道${index + 1}号`,
          location: { x: location[0], y: location[1] },
          distance,
          estimatedTime: 0,
          status: OrderStatus.OUT_OF_RANGE,
        };
      });

      setOrders(initialOrders);
    }
  }, [center]);

  // --- Logic: Recalculate Order Statuses ---
  useEffect(() => {
    if (orders.length === 0) return;

    const updatedOrders = orders.map((order) => {
      const distance = order.distance;
      const time = (distance / currentProvider.speed) * 60 + 10;

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

  // 当前使用的center和radius
  const currentCenter = deliveryArea?.center || center;
  const currentRadius = deliveryArea?.radius || radius;

  // 如果正在加载配送区域数据
  if (areaLoading && !deliveryArea) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-gray-600">正在加载配送区域信息...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-gray-100">
      {/* --- LEFT SIDEBAR --- */}
      <div className="z-20 flex h-full w-96 flex-col border-r border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-100 bg-blue-600 p-6 text-white">
          <div className="mb-1 flex items-center gap-2">
            <Navigation className="h-6 w-6" />
            <h1 className="text-xl font-bold">商家配送管理</h1>
            {(isSyncing || areaUpdating) && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
          </div>
          {/* <p className="text-sm text-blue-100 opacity-90">
            {deliveryArea?.merchantId ? `${deliveryArea.merchantId} 配送范围优化` : '配送范围优化'}
          </p> */}
          
          {/* 错误提示 */}
          {areaError && (
            <div className="mt-2 flex items-start gap-2 rounded bg-blue-500/20 p-2 text-xs">
              <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
              <div>
                <p className="font-medium">警告</p>
                <p className="opacity-80">{areaError}</p>
              </div>
            </div>
          )}
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
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {currentRadius.toFixed(1)} <span className="text-sm font-normal text-gray-500">km</span>
                  </span>
                  {(isSyncing || areaUpdating) && (
                    <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                  )}
                </div>
              </div>

              <div className="relative">
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="0.1"
                  value={currentRadius}
                  onChange={(e) => handleRadiusChange(parseFloat(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600"
                  disabled={isSyncing || areaUpdating}
                />
                {isSyncing && (
                  <div className="absolute -top-6 right-0 flex items-center gap-1 text-xs text-blue-600">
                    <Save className="h-3 w-3" />
                    同步中...
                  </div>
                )}
              </div>
              
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
                {deliveryArea && (
                  <div className="mt-1 text-xs text-blue-500">
                    中心坐标: [{currentCenter[0].toFixed(6)}, {currentCenter[1].toFixed(6)}]
                  </div>
                )}
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
          center={currentCenter}
          radius={currentRadius}
          setRadius={handleRadiusChange}
          markers={mapMarkers}
          showCircle={true}
          showRoute={false}
        />
        
        {/* 地图图例 */}
        <div className="absolute top-4 left-4 rounded-lg border border-gray-200 bg-white p-3 shadow-md z-10">
          <div className="mb-2 text-sm font-semibold text-gray-700">图例</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full border border-white bg-blue-500"></div>
              <span className="text-gray-600">配送中心</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full border border-white bg-green-500"></div>
              <span className="text-gray-600">可配送地址</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full border border-white bg-orange-500"></div>
              <span className="text-gray-600">时效风险地址</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full border border-white bg-red-500"></div>
              <span className="text-gray-600">范围外地址</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-4 rounded bg-blue-500"></div>
              <span className="text-gray-600">配送范围 ({currentRadius.toFixed(1)}km)</span>
            </div>
          </div>
        </div>

        {/* 半径信息 */}
        <div className="absolute bottom-4 left-4 rounded-lg border border-gray-200 bg-white p-3 shadow-md z-10">
          <div className="text-sm font-semibold text-blue-600">
            当前配送半径: <span className="text-lg">{currentRadius.toFixed(1)} km</span>
            {(isSyncing || areaUpdating) && (
              <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />
            )}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            覆盖 {mapMarkers.filter((m) => m.color === 'green').length} / {mapMarkers.length} 个地址
          </div>
          {deliveryArea && (
            <div className="mt-1 text-xs text-blue-500">
              商家ID: {deliveryArea.merchantId}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MerchantDashboard;
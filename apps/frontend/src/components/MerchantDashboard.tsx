import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MOCK_PROVIDERS } from '../constants';
import { type Order, OrderStatus, type DashboardStats } from '../types';
import AMapVisualization from './AMapVisualization';
import { calculateDistance } from '../utils/locationUtils';
import { CheckCircle2, Navigation, MapPin, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useDeliveryAreaStore } from '@/store/useDeliveryArea';
import { useMapOrderStore } from '@/store/useMapOrderStore';
import { message } from 'antd';

const DEFAULT_CENTER: [number, number] = [114.335539, 30.593175];
const DEFAULT_RADIUS = 13.6;

const MerchantDashboard: React.FC = () => {
  // --- State ---
  const [radius, setRadius] = useState<number>(DEFAULT_RADIUS);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    MOCK_PROVIDERS[0].logisticsId
  );
  const [, setIsSyncing] = useState<boolean>(false);

  // 使用防抖ref
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 使用配送区域store
  const {
    deliveryArea,
    logisticsSuppliers,
    suppliersLoading,
    loading: areaLoading,
    // updating: areaUpdating,
    error: areaError,
    fetchDeliveryArea,
    fetchLogisticsSuppliers,
    updateDeliveryArea,
    updateRadiusLocal,
  } = useDeliveryAreaStore();

  // 使用地图订单store
  const {
    boundsParams,
    mapOrders: ordersFromAPI,
    total: apiTotal,
    loading: ordersLoading,
    setBoundsParams,
    fetchOrdersByBounds,
  } = useMapOrderStore();

  // 转换后的订单状态
  const [orders, setOrders] = useState<Order[]>([]);

  // 初始化：获取配送区域信息
  useEffect(() => {
    fetchDeliveryArea();
  }, [fetchDeliveryArea]);

  // 初始化：获取物流服务商列表
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        await fetchLogisticsSuppliers();
      } catch (error) {
        console.error('获取物流服务商失败:', error);
        message.error('获取物流服务商失败');
      }
    };

    loadSuppliers();
  }, [fetchLogisticsSuppliers]);

  // 当配送区域数据加载完成时，更新center和radius
  useEffect(() => {
    if (deliveryArea) {
      const newCenter = deliveryArea.center;
      const newRadius = deliveryArea.radius;

      setCenter(newCenter);
      setRadius(newRadius);

      // 当center变化时，自动设置地图边界并获取订单
      const bounds = calculateMapBounds(newCenter, newRadius);
      setBoundsParams({
        northEast: bounds.northEast,
        southWest: bounds.southWest,
      });

      console.log('配送区域加载完成:', deliveryArea);
    }
  }, [deliveryArea, setBoundsParams]);

  // 当供应商列表加载完成后，设置默认选中的服务商
  useEffect(() => {
    if (logisticsSuppliers.length > 0 && !selectedProviderId) {
      setSelectedProviderId(logisticsSuppliers[0].logisticsId);
    }
  }, [logisticsSuppliers, selectedProviderId]);

  // 当前选中的物流服务商
  const currentProvider = useMemo(() => {
    if (!selectedProviderId || logisticsSuppliers.length === 0) {
      return MOCK_PROVIDERS[0];
    }

    const provider = logisticsSuppliers.find((p) => p.logisticsId === selectedProviderId);
    if (!provider) {
      return logisticsSuppliers[0];
    }

    return {
      id: provider.logisticsId,
      name: provider.name,
      speed: provider.speed,
      variance: provider.variance,
    };
  }, [selectedProviderId, logisticsSuppliers]);

  // 处理半径变化（带防抖和同步）
  const handleRadiusChange = useCallback(
    async (newRadius: number) => {
      console.debug('handleRadiusChange called', {
        newRadius,
        ordersLoading,
        deliveryAreaLoaded: !!deliveryArea,
      });
      // 立即更新本地状态以获得即时UI响应
      setRadius(newRadius);
      updateRadiusLocal(newRadius);

      // 清除之前的定时器
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // 设置新的防抖定时器
      console.debug('scheduling debounce timer');
      debounceTimerRef.current = setTimeout(async () => {
        console.debug('debounce timer fired', { newRadius });
        if (!deliveryArea) {
          message.warning('未加载配送区域数据，无法同步');
          return;
        }

        setIsSyncing(true);
        try {
          // 传递当前的center和新的radius
          console.log('同步更新配送半径:', newRadius);
          const success = await updateDeliveryArea({
            center: deliveryArea.center,
            radius: newRadius,
          });

          if (success) {
            message.success('配送半径已更新');

            // 半径更新后直接使用当前地图视口边界获取订单（由 AMapVisualization 的 onBoundsChange 更新 boundsParams）
            // 直接调用 fetchOrdersByBounds，以确保以当前视口为准
            setTimeout(() => {
              fetchOrdersByBounds();
            }, 100);
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
          if (deliveryArea) {
            setRadius(deliveryArea.radius);
            updateRadiusLocal(deliveryArea.radius);
          }
        } finally {
          setIsSyncing(false);
        }
      }, 800);
    },
    [
      deliveryArea,
      updateDeliveryArea,
      updateRadiusLocal,
      areaError,
      setBoundsParams,
      fetchOrdersByBounds,
    ]
  );

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // 将API返回的订单转换为前端需要的格式
  useEffect(() => {
    if (ordersFromAPI.length === 0 || !deliveryArea?.center) return;

    const centerCoords = deliveryArea.center;
    const activeRadius = deliveryArea?.radius ?? radius;

    const convertedOrders: Order[] = ordersFromAPI.map((apiOrder, index) => {
      // 从API订单中提取经纬度
      const latitude = apiOrder.location[1] || 0;
      const longitude = apiOrder.location[0] || 0;
      const location: [number, number] = [longitude, latitude];

      const distance = calculateDistance(centerCoords, location);
      const time = (distance / currentProvider.speed) * 60 + 10;

      let status = OrderStatus.OUT_OF_RANGE;
      if (distance <= activeRadius) {
        if (time > 1000) {
          status = OrderStatus.TIME_RISK;
        } else {
          status = OrderStatus.DELIVERABLE;
        }
      }

      return {
        id: apiOrder.orderId || `ORD${String(index + 1).padStart(4, '0')}`,
        customerName: apiOrder.userName || `客户${index + 1}`,
        deliverStatus: apiOrder.status || `未知状态${index + 1}`,
        location: { x: longitude, y: latitude },
        distance,
        estimatedTime: time,
        status,
        // 保留原始数据
        rawData: apiOrder,
      };
    });

    setOrders(convertedOrders);
    console.debug('convertedOrders (sample):', convertedOrders);
  }, [ordersFromAPI, deliveryArea, radius, currentProvider]);

  // 手动刷新订单
  const handleRefreshOrders = useCallback(() => {
    // 直接使用当前地图视口的 boundsParams（由 `AMapVisualization` 在地图交互时更新）来刷新订单
    fetchOrdersByBounds();
  }, [deliveryArea, radius, setBoundsParams, fetchOrdersByBounds]);

  // 当地图边界变化时获取订单（监听地图拖拽/缩放）
  useEffect(() => {
    // 如果已经有了有效的边界参数，自动获取一次订单
    if (boundsParams.northEast.lat !== 0 && boundsParams.southWest.lat !== 0) {
      fetchOrdersByBounds();
    }
  }, [boundsParams, fetchOrdersByBounds]);

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
    const markers = orders.map((order) => {
      const lng = Number(order.location.x);
      const lat = Number(order.location.y);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;

      return {
        id: order.id,
        position: [lng, lat] as [number, number],
        color:
          order.status === OrderStatus.DELIVERABLE
            ? 'green'
            : order.status === OrderStatus.TIME_RISK
              ? 'orange'
              : 'red',
        title: `${order.id} - ${order.customerName}`,
        content: `
            <div style="padding: 5px;">
              <strong>${order.id}</strong><br/>
              ${order.customerName}<br/>
              距离: ${order.distance.toFixed(1)}km<br/>
              状态: ${
                order.status === OrderStatus.DELIVERABLE
                  ? '可配送'
                  : order.status === OrderStatus.TIME_RISK
                    ? '时效风险'
                    : '范围外'
              }
            </div>
          `,
      };
    });

    console.debug(
      'mapMarkers generated count:',
      markers.filter(Boolean).length,
      'orders count:',
      orders.length
    );
    return markers.filter(
      (
        m
      ): m is {
        id: string;
        position: [number, number];
        color: string;
        title: string;
        content: string;
      } => m !== null
    );
  }, [orders]);

  // 当前使用的center和radius
  const currentCenter: [number, number] = deliveryArea?.center ?? center ?? DEFAULT_CENTER;
  const currentRadius: number = (deliveryArea?.radius ?? radius ?? DEFAULT_RADIUS) as number;

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
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="h-6 w-6" />
              <h1 className="text-xl font-bold">商家配送管理</h1>
            </div>
            <button
              onClick={handleRefreshOrders}
              disabled={ordersLoading}
              className="flex items-center gap-1 rounded bg-white/20 px-2 py-1 text-xs hover:bg-white/30 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${ordersLoading ? 'animate-spin' : ''}`} />
              刷新订单
            </button>
          </div>
          <p className="text-sm text-blue-100 opacity-90">共 {apiTotal} 个订单在可视区域内</p>

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
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  物流服务商
                </h2>
                {suppliersLoading && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
              </div>

              {suppliersLoading && logisticsSuppliers.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-gray-500">加载中...</span>
                </div>
              ) : logisticsSuppliers.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">暂无物流服务商</p>
                  <button
                    onClick={() => fetchLogisticsSuppliers()}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    重新加载
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {logisticsSuppliers.map((provider) => (
                    <button
                      key={provider.logisticsId}
                      onClick={() => setSelectedProviderId(provider.logisticsId)}
                      className={`group flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all ${
                        selectedProviderId === provider.logisticsId
                          ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-200'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-gray-800">{provider.name}</div>
                        <div className="mt-1 space-y-1 text-xs text-gray-500">
                          <div className="flex items-center gap-2">
                            <span>速度:</span>
                            <span className="font-medium">{provider.speed} km/h</span>
                          </div>
                        </div>
                      </div>
                      {selectedProviderId === provider.logisticsId && (
                        <div className="rounded-full bg-blue-100 p-1 text-blue-600">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* 2. Zone Controls */}
            <section>
              <div className="mb-3 flex items-end justify-between">
                <h2 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  配送半径
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {currentRadius.toFixed(1)}{' '}
                    <span className="text-sm font-normal text-gray-500">km</span>
                  </span>
                  {ordersLoading && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                </div>
              </div>

              <div className="relative">
                <input
                  type="range"
                  min="1"
                  max="1500"
                  step="0.1"
                  value={currentRadius}
                  onChange={(e) => handleRadiusChange(parseFloat(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600"
                  disabled={ordersLoading}
                />
              </div>

              <div className="mt-2 flex justify-between text-xs text-gray-400">
                <span>1 km</span>
                <span>1500 km</span>
              </div>

              <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <MapPin size={16} />
                  <span>
                    覆盖 {stats.deliverable} / {stats.total} 个地址
                  </span>
                </div>
                <div className="mt-1 text-xs text-blue-600">
                  {stats.total > 0 ? ((stats.deliverable / stats.total) * 100).toFixed(1) : 0}%
                  的地址在配送范围内
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
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-600">
                订单详情 ({stats.total})
                {ordersLoading && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />}
              </div>
              <div className="text-xs text-gray-500">共 {apiTotal} 个订单</div>
            </div>
            <div className="max-h-96 divide-y divide-gray-100 overflow-y-auto">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                  {ordersLoading ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <p className="mt-2">正在加载订单...</p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-8 w-8" />
                      <p className="mt-2">暂无订单数据</p>
                      <button
                        onClick={handleRefreshOrders}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        点击刷新
                      </button>
                    </>
                  )}
                </div>
              ) : (
                orders.map((order) => (
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
                        预计: {Math.round(order.estimatedTime)} 分钟 • {order.status}
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
                ))
              )}
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
          onBoundsChange={(
            northEast: { lat: number; lng: number },
            southWest: { lat: number; lng: number }
          ) => {
            // 当地图视野变化时，更新边界参数并获取订单
            setBoundsParams({ northEast, southWest });
          }}
        />

        {/* 地图图例 */}
        <div className="absolute top-4 left-4 z-10 rounded-lg border border-gray-200 bg-white p-3 shadow-md">
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

        {/* 半径信息和刷新按钮 */}
        <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-gray-200 bg-white p-3 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-blue-600">
                当前配送半径: <span className="text-lg">{currentRadius.toFixed(1)} km</span>
                {ordersLoading && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                覆盖 {stats.deliverable} / {stats.total} 个地址
              </div>
            </div>
            <button
              onClick={handleRefreshOrders}
              disabled={ordersLoading}
              className="ml-4 rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {ordersLoading ? '加载中...' : '刷新订单'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 辅助函数：根据中心点和半径计算地图边界
const calculateMapBounds = (
  center: [number, number],
  radius: number
): { northEast: { lat: number; lng: number }; southWest: { lat: number; lng: number } } => {
  // 1度纬度约等于111公里，1度经度在赤道约等于111公里，随纬度变化
  const latDelta = radius / 111.0;
  const lngDelta = radius / (111.0 * Math.cos((center[1] * Math.PI) / 180));

  return {
    northEast: {
      lat: center[1] + latDelta,
      lng: center[0] + lngDelta,
    },
    southWest: {
      lat: center[1] - latDelta,
      lng: center[0] - lngDelta,
    },
  };
};

export default MerchantDashboard;

import React, { useState } from 'react';
import AMapVisualization from './AMapVisualization';

// 定义组件的 Props 类型
interface RouteMapProps {
  // 必需的起始和结束位置
  startLocation: {
    name: string;
    coords: [number, number];
  };
  endLocation: {
    name: string;
    coords: [number, number];
  };

  status: string;

  // 可选的当前车辆位置
  currentLocation?: [number, number];

  // 可选的路线数据
  routeData?: {
    waypoints?: [number, number][];
    distance?: number;
    duration?: number;
  };

  // 可选的距离和预计时间
  distance?: number;
  estimatedTime?: string;
  orderId?: string;

  // 可选的UI配置
  showControls?: boolean;
  showInfoCard?: boolean;
  showProgressIndicator?: boolean;

  // 可选的样式配置
  className?: string;
  style?: React.CSSProperties;

  // 可选的回调函数
  onZoomChange?: (zoom: number) => void;
  onMapClick?: (coords: [number, number]) => void;
}

const RouteMap: React.FC<RouteMapProps> = ({
  startLocation,
  endLocation,
  status,
  currentLocation,
  distance,
  estimatedTime,
  routeData = {},
  orderId,
  // showControls = true,
  showInfoCard = true,
  showProgressIndicator = true,
  className = '',
  style = {},
  // onZoomChange,
  onMapClick,
}) => {
  // const [zoom, setZoom] = useState(1);

  // 生成路线点的函数
  const generateWaypoints = (start: [number, number], end: [number, number], count: number = 4) => {
    const waypoints: [number, number][] = [];
    const [startLng, startLat] = start;
    const [endLng, endLat] = end;

    for (let i = 1; i <= count; i++) {
      const ratio = i / (count + 1);
      const lng = startLng + (endLng - startLng) * ratio;
      const lat = startLat + (endLat - startLat) * ratio;
      // 添加一些随机偏移，使路线更自然
      const offsetLng = (Math.random() - 0.5) * 0.02;
      const offsetLat = (Math.random() - 0.5) * 0.02;
      waypoints.push([lng + offsetLng, lat + offsetLat]);
    }

    return waypoints;
  };

  // 直接在useState初始化函数中计算路线数据
  const [mapRouteData] = useState(() => {
    // 如果有传入的路线点，使用传入的；否则生成新的
    const waypoints =
      routeData.waypoints && routeData.waypoints.length > 0
        ? routeData.waypoints
        : generateWaypoints(startLocation.coords, endLocation.coords);

    return {
      from: startLocation.coords,
      to: endLocation.coords,
      waypoints,
      distance: routeData.distance || 120,
      duration: routeData.duration || 2,
    };
  });

  // 如果没有传入当前位置，使用起点
  const defaultCurrentLocation = currentLocation || startLocation.coords;

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-[#f0f0f0] ${className}`}
      style={style}
    >
      {/* 地图可视化组件 */}
      <AMapVisualization
        radius={5}
        showCircle={false}
        route={mapRouteData}
        showRoute={true}
        currentLocation={defaultCurrentLocation}
        orderId={orderId}
        onMapClick={onMapClick}
        enableLocationTracking={true} // 启用实时位置跟踪
      />

      {/* 可选的浮动信息卡片 */}
      {showInfoCard && (
        <div className="absolute top-4 right-4 w-64 rounded-lg border border-gray-100 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <div className="text-xs text-gray-500">路线信息</div>
              <div className="text-md font-bold text-blue-900">
                {startLocation.name} → {endLocation.name}
              </div>
            </div>
            <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
              {status}
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">距离:</span>
              <span className="font-medium">{(Number(distance) || 0).toFixed(2)} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">预计时间:</span>
              <span className="font-medium">{estimatedTime} </span>
            </div>
          </div>

          {/* 进度条 */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full animate-pulse rounded-full bg-blue-600 ${
                (Number(distance) || 0) > 1000
                  ? 'w-1/20' // 需要自定义或在 tailwind.config.js 中配置
                  : (Number(distance) || 0) < 100
                    ? 'w-full' // 100%
                    : 'w-1/2' // 50%
              }`}
            ></div>
          </div>
        </div>
      )}

      {/* 可选的缩放控件 */}
      {/* {showControls && (
        <div className="absolute right-4 bottom-4 flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white shadow-md">
          <button
            onClick={handleZoomIn}
            className="p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            title="放大"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            title="缩小"
          >
            <Minus size={18} />
          </button>
        </div>
      )} */}

      {/* 可选的路线进度指示器 */}
      {showProgressIndicator && (
        <div className="absolute bottom-4 left-4 rounded-lg border border-gray-200 bg-white p-3 shadow-md">
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
              <div className="mt-1 text-xs text-gray-500">{startLocation.name}</div>
            </div>
            <div className="relative h-0.5 flex-1 bg-gray-200">
              <div className="absolute top-0 left-0 h-full w-1/4 bg-blue-500"></div>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500"></div>
              <div className="mt-1 text-xs text-gray-500">{endLocation.name}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteMap;

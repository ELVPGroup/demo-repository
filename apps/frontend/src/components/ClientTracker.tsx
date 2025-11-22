/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { type PackageData } from '../types';
import { MOCK_PACKAGE_DATA } from '../constants';
import { Search, Truck, Plus, Minus, Headphones } from 'lucide-react';
import AMapVisualization from './AMapVisualization';

const ClientTracker: React.FC = () => {
  const [packageId, setPackageId] = useState(MOCK_PACKAGE_DATA.id);
  const [trackingData, setTrackingData] = useState<PackageData>(MOCK_PACKAGE_DATA);
  const [zoom, setZoom] = useState(1);

  // 路线数据
  const [routeData, setRouteData] = useState({
    from: [114.305539, 30.593175] as [number, number], // 武汉
    to: [114.872389, 30.453667] as [number, number], // 黄冈
    waypoints: [] as [number, number][],
    distance: 120, // 公里
    duration: 2, // 分钟
  });

  // 模拟路线点（实际应该从高德地图API获取）
  useEffect(() => {
    // 这里可以调用高德地图路径规划API
    // 暂时使用模拟的路线点
    const waypoints: [number, number][] = [
      [114.355539, 30.573175], // 武汉出城方向
      [114.455539, 30.543175],
      [114.555539, 30.513175],
      [114.655539, 30.483175],
      [114.755539, 30.463175], // 接近黄冈
      [114.832389, 30.458667], // 黄冈入口
    ];

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRouteData((prev) => ({
      ...prev,
      waypoints,
    }));
  }, []);

  const handleSearch = () => {
    // 在实际应用中，这里应该调用API获取路线数据
    console.log('Searching for', packageId);
  };

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Top Header */}
      <header className="z-30 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-600 p-1.5">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-gray-800">
            Fast Delivery <span className="text-blue-600">Logistics Tracking</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Headphones className="h-4 w-4" />
          <span>Customer Service: 95500</span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Map Visualization */}
        <div className="relative flex-1 overflow-hidden bg-[#f0f0f0]">
          <AMapVisualization
            radius={5}
            showCircle={false}
            route={routeData}
            showRoute={true}
            currentLocation={trackingData.currentLocationCoords} // 需要确保类型中有这个字段
          />

          {/* Floating Info Card */}
          <div className="absolute top-8 right-8 w-72 rounded-xl border border-gray-100 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-500">Route Information</div>
                <div className="text-lg font-bold text-blue-900">武汉 → 黄冈</div>
              </div>
              <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                In Transit
              </div>
            </div>

            <div className="mb-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Distance:</span>
                <span className="font-medium">{routeData.distance} km</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Est. Duration:</span>
                <span className="font-medium">{routeData.duration} 天</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Remaining:</span>
                <span className="font-medium text-blue-600">{trackingData.remaining}</span>
              </div>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-3/4 animate-pulse rounded-full bg-blue-600"></div>
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute right-8 bottom-8 flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white shadow-md">
            <button
              onClick={() => setZoom(Math.min(zoom + 0.2, 2))}
              className="p-2 text-gray-600 hover:bg-gray-50"
            >
              <Plus size={20} />
            </button>
            <button
              onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))}
              className="p-2 text-gray-600 hover:bg-gray-50"
            >
              <Minus size={20} />
            </button>
          </div>

          {/* Route Progress Indicator */}
          <div className="absolute bottom-8 left-8 rounded-xl border border-gray-200 bg-white p-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <div className="mt-1 text-xs text-gray-500">武汉</div>
              </div>
              <div className="relative h-0.5 flex-1 bg-gray-200">
                <div className="absolute top-0 left-0 h-full w-3/4 bg-blue-500"></div>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                <div className="mt-1 text-xs text-gray-500">黄冈</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Info Panel */}
        <div className="z-20 flex w-96 flex-col border-l border-gray-200 bg-white shadow-xl">
          {/* Search Section */}
          <div className="border-b border-gray-100 p-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Track Your Package
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-9 text-sm transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="Tracking Number"
                />
              </div>
              <button
                onClick={handleSearch}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Track
              </button>
            </div>
          </div>

          {/* Route Details */}
          <div className="border-b border-gray-100 p-6">
            <h3 className="mb-3 text-sm font-bold text-gray-800">Delivery Route</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Departure</div>
                  <div className="text-xs text-gray-500">武汉市中心</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Destination</div>
                  <div className="text-xs text-gray-500">黄冈市黄州区</div>
                </div>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 text-sm">
                <span>Distance:</span>
                <span className="font-medium">{routeData.distance} km</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Est. Time:</span>
                <span className="font-medium">{routeData.duration} min</span>
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div className="grid grid-cols-2 gap-4 border-b border-gray-100 p-6">
            <div>
              <div className="mb-1 text-xs text-gray-400">Carrier Source</div>
              <div className="text-sm font-medium text-gray-800">{trackingData.source}</div>
            </div>
            <div>
              <div className="mb-1 text-xs text-gray-400">Current Location</div>
              <div className="text-sm font-medium text-gray-800">
                {trackingData.currentLocation}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
            <h3 className="mb-4 text-sm font-bold text-gray-800">Logistics Status</h3>
            <div className="relative space-y-8 pl-4">
              {/* Vertical Line */}
              <div className="absolute top-2 bottom-2 left-[19px] w-0.5 bg-gray-200"></div>

              {trackingData.steps.map((step) => (
                <div key={step.id} className="group relative flex gap-4">
                  {/* Node */}
                  <div
                    className={`relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 ${
                      step.current
                        ? 'scale-125 border-blue-100 bg-blue-600 ring-4 ring-blue-50'
                        : 'border-white bg-gray-300'
                    }`}
                  ></div>

                  {/* Content */}
                  <div className={`${step.current ? 'opacity-100' : 'opacity-70'}`}>
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className={`text-sm font-bold ${step.current ? 'text-blue-600' : 'text-gray-700'}`}
                      >
                        {step.status}
                      </span>
                      <div className="text-right text-xs leading-tight text-gray-400">
                        <div>{step.time}</div>
                        <div className="origin-right scale-90">{step.date}</div>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-gray-500">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Ad/Info */}
          <div className="border-t border-gray-200 bg-gray-50 p-4 text-center text-xs text-gray-400">
            Powered by Smart Delivery Logistics Network
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientTracker;

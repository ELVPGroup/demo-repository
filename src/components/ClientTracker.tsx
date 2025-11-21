import React, { useState, useEffect } from 'react';
import { PackageData } from '../types';
import { MOCK_PACKAGE_DATA } from '../constants';
import { Search, Truck, User, Package, MapPin, Plus, Minus, Headphones } from 'lucide-react';
import AMapVisualization from './AMapVisualization';

const ClientTracker: React.FC = () => {
  const [packageId, setPackageId] = useState(MOCK_PACKAGE_DATA.id);
  const [trackingData, setTrackingData] = useState<PackageData>(MOCK_PACKAGE_DATA);
  const [zoom, setZoom] = useState(1);

  // 路线数据
  const [routeData, setRouteData] = useState({
    from: [114.305539, 30.593175] as [number, number], // 武汉
    to: [114.872389, 30.453667] as [number, number],   // 黄冈
    waypoints: [] as [number, number][],
    distance: 120, // 公里
    duration: 2   // 分钟
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
      [114.832389, 30.458667]  // 黄冈入口
    ];

    setRouteData(prev => ({
      ...prev,
      waypoints
    }));
  }, []);

  const handleSearch = () => {
    // 在实际应用中，这里应该调用API获取路线数据
    console.log("Searching for", packageId);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Truck className="text-white w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-gray-800 tracking-tight">
            Fast Delivery <span className="text-blue-600">Logistics Tracking</span>
          </h1>
        </div>
        <div className="flex items-center text-gray-500 text-sm gap-2">
          <Headphones className="w-4 h-4" />
          <span>Customer Service: 95500</span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: Map Visualization */}
        <div className="flex-1 relative bg-[#f0f0f0] overflow-hidden">
          <AMapVisualization
            radius={5}
            showCircle={false}
            route={routeData}
            showRoute={true}
            currentLocation={trackingData.currentLocationCoords} // 需要确保类型中有这个字段
          />

          {/* Floating Info Card */}
          <div className="absolute top-8 right-8 bg-white p-4 rounded-xl shadow-xl border border-gray-100 w-72">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-xs text-gray-500">Route Information</div>
                <div className="text-lg font-bold text-blue-900">武汉 → 黄冈</div>
              </div>
              <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                In Transit
              </div>
            </div>

            <div className="space-y-2 mb-3">
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

            <div className="h-1.5 bg-gray-100 rounded-full w-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full w-3/4 animate-pulse"></div>
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute bottom-8 right-8 flex flex-col bg-white rounded-lg shadow-md border border-gray-200 divide-y divide-gray-100">
            <button
              onClick={() => setZoom(Math.min(zoom + 0.2, 2))}
              className="p-2 hover:bg-gray-50 text-gray-600"
            >
              <Plus size={20} />
            </button>
            <button
              onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))}
              className="p-2 hover:bg-gray-50 text-gray-600"
            >
              <Minus size={20} />
            </button>
          </div>

          {/* Route Progress Indicator */}
          <div className="absolute bottom-8 left-8 bg-white p-4 rounded-xl shadow-md border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="text-xs text-gray-500 mt-1">武汉</div>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200 relative">
                <div className="absolute top-0 left-0 h-full bg-blue-500 w-3/4"></div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div className="text-xs text-gray-500 mt-1">黄冈</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Info Panel */}
        <div className="w-96 bg-white shadow-xl z-20 flex flex-col border-l border-gray-200">
          {/* Search Section */}
          <div className="p-6 border-b border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">Track Your Package</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Tracking Number"
                />
              </div>
              <button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Track
              </button>
            </div>
          </div>

          {/* Route Details */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 mb-3">Delivery Route</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Departure</div>
                  <div className="text-xs text-gray-500">武汉市中心</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Destination</div>
                  <div className="text-xs text-gray-500">黄冈市黄州区</div>
                </div>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
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
          <div className="p-6 border-b border-gray-100 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-400 mb-1">Carrier Source</div>
              <div className="text-sm font-medium text-gray-800">{trackingData.source}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Current Location</div>
              <div className="text-sm font-medium text-gray-800">{trackingData.currentLocation}</div>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Logistics Status</h3>
            <div className="relative pl-4 space-y-8">
              {/* Vertical Line */}
              <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-200"></div>

              {trackingData.steps.map((step, idx) => (
                <div key={step.id} className="relative flex gap-4 group">
                  {/* Node */}
                  <div className={`relative z-10 w-3 h-3 rounded-full mt-1.5 shrink-0 border-2 
                    ${step.current
                      ? 'bg-blue-600 border-blue-100 ring-4 ring-blue-50 scale-125'
                      : 'bg-gray-300 border-white'}`}
                  ></div>

                  {/* Content */}
                  <div className={`${step.current ? 'opacity-100' : 'opacity-70'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold text-sm ${step.current ? 'text-blue-600' : 'text-gray-700'}`}>
                        {step.status}
                      </span>
                      <div className="text-xs text-gray-400 text-right leading-tight">
                        <div>{step.time}</div>
                        <div className="scale-90 origin-right">{step.date}</div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Ad/Info */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-400 text-center">
            Powered by Smart Delivery Logistics Network
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientTracker;
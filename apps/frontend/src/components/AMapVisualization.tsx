/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';

type LngLat = [number, number];

interface AMapVisualizationProps {
  center?: LngLat;
  radius: number;
  setRadius?: (km: number) => void;
  markers?: Array<{ id: string; position: LngLat; color?: string }>;
  showCircle?: boolean;
  route?: { from: LngLat; to: LngLat } | null;
  showRoute?: boolean;
  currentLocation?: LngLat;
  animateRoute?: boolean;
}

// 配置高德地图安全密钥
(window as any)._AMapSecurityConfig = {
  securityJsCode: '62a53a60d4e16d8e56799ce3044c6975',
};

const loadAMap = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const g: any = globalThis as any;

    if (g.AMap) {
      resolve(g.AMap);
      return;
    }

    // 使用您的高德地图Key
    const key = '2ddcb59b4e3fc0976cf007feabf43fdb';

    const src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.Driving`;
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => {
      if (g.AMap) {
        // 确保Driving插件加载
        g.AMap.plugin('AMap.Driving', () => {
          resolve(g.AMap);
        });
      } else {
        reject(new Error('AMap script loaded but global AMap not found'));
      }
    };
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
};

// 模拟路线数据（当API调用失败时使用）
const getSimulatedRoute = (from: LngLat, to: LngLat): LngLat[] => {
  // 简单的线性插值生成路径点
  const steps = 20;
  const path: LngLat[] = [];

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const lng = from[0] + (to[0] - from[0]) * progress;
    const lat = from[1] + (to[1] - from[1]) * progress;
    // 添加一些弯曲使路线更自然
    const curve = Math.sin(progress * Math.PI) * 0.02;
    path.push([lng + curve, lat - curve]);
  }

  return path;
};

const AMapVisualization: React.FC<AMapVisualizationProps> = ({
  center = [114.305539, 30.593175],
  radius,
  setRadius,
  markers = [],
  showCircle = true,
  route = null,
  showRoute = false,
  currentLocation,
  animateRoute = true,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const amapRef = useRef<any>(null);
  const movingMarkerRef = useRef<any>(null);
  const animationRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const mapMarkersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routePath, setRoutePath] = useState<LngLat[]>([]);

  // 轨迹动画
  const startRouteAnimation = (AMap: any, map: any, path: LngLat[]) => {
    if (!path.length || !animateRoute) return;

    // 清除之前的动画
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
    if (movingMarkerRef.current) {
      map.remove(movingMarkerRef.current);
    }

    // 创建移动的圆点标记
    const movingMarker = new AMap.Marker({
      position: path[0],
      icon: new AMap.Icon({
        size: new AMap.Size(20, 20),
        image:
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="8" fill="%23FF6B35" stroke="%23FFFFFF" stroke-width="2"/></svg>',
        imageSize: new AMap.Size(20, 20),
      }),
      offset: new AMap.Pixel(-10, -10),
    });

    map.add(movingMarker);
    movingMarkerRef.current = movingMarker;

    // 计算中间位置（大约在路线的1/3处）
    const middleIndex = Math.floor(path.length * 0.3);

    let currentIndex = 0;
    const totalSteps = middleIndex;
    const animationDuration = 3000;

    const animate = () => {
      if (currentIndex <= totalSteps) {
        const currentPoint = path[currentIndex];
        movingMarker.setPosition(currentPoint);
        currentIndex++;
      } else {
        clearInterval(animationRef.current);
        // 动画完成后添加脉冲效果
        addPulseEffect(AMap, map, path[middleIndex]);
      }
    };

    const stepTime = animationDuration / totalSteps;
    animationRef.current = setInterval(animate, stepTime);
  };

  // 添加脉冲效果
  const addPulseEffect = (AMap: any, map: any, position: LngLat) => {
    const pulseCircle = new AMap.Circle({
      center: position,
      radius: 10,
      strokeColor: '#FF6B35',
      strokeWeight: 2,
      strokeOpacity: 0.8,
      fillColor: '#FF6B35',
      fillOpacity: 0.3,
    });

    map.add(pulseCircle);

    let currentRadius = 10;
    const pulseAnimation = () => {
      currentRadius += 2;
      if (currentRadius > 30) currentRadius = 10;
      pulseCircle.setRadius(currentRadius);
      setTimeout(pulseAnimation, 100);
    };
    pulseAnimation();
  };

  // 绘制配送范围圆圈
  const drawDeliveryCircle = (AMap: any, map: any, center: LngLat, radius: number) => {
    // 清除现有圆圈
    if (circleRef.current) {
      map.remove(circleRef.current);
    }

    const circle = new AMap.Circle({
      center: center,
      radius: radius * 1000, // 转换为米
      strokeColor: '#3b82f6',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: 'rgba(59, 130, 246, 0.1)',
      fillOpacity: 0.4,
      strokeStyle: 'solid',
      strokeDasharray: [5, 5], // 虚线样式
    });

    circle.setMap(map);
    circleRef.current = circle;

    // 添加中心点标记
    const centerMarker = new AMap.Marker({
      position: center,
      icon: new AMap.Icon({
        size: new AMap.Size(25, 25),
        image:
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25"><circle cx="12.5" cy="12.5" r="10" fill="%233b82f6" stroke="%23FFFFFF" stroke-width="2"/></svg>',
        imageSize: new AMap.Size(25, 25),
      }),
      title: '配送中心',
    });
    centerMarker.setMap(map);

    return circle;
  };

  // 绘制地址标记
  const drawMarkers = (
    AMap: any,
    map: any,
    markers: Array<{ id: string; position: LngLat; color?: string }>
  ) => {
    // 清除现有标记
    mapMarkersRef.current.forEach((marker) => {
      map.remove(marker);
    });
    mapMarkersRef.current = [];

    markers.forEach((marker) => {
      const markerColor = marker.color || '#3366FF';
      const markerObj = new AMap.Marker({
        position: marker.position,
        title: marker.id,
        icon: new AMap.Icon({
          size: new AMap.Size(12, 12),
          image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><circle cx="6" cy="6" r="5" fill="${markerColor}" stroke="white" stroke-width="1"/></svg>`,
          imageSize: new AMap.Size(12, 12),
        }),
      });

      // 添加点击事件
      markerObj.on('click', () => {
        const infoWindow = new AMap.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${marker.id}</div>
              <div style="font-size: 12px; color: #666;">
                经度: ${marker.position[0].toFixed(6)}<br/>
                纬度: ${marker.position[1].toFixed(6)}
              </div>
            </div>
          `,
          offset: new AMap.Pixel(0, -10),
        });
        infoWindow.open(map, marker.position);
      });

      markerObj.setMap(map);
      mapMarkersRef.current.push(markerObj);
    });
  };

  // 绘制路线
  const drawRoute = (AMap: any, map: any, from: LngLat, to: LngLat) => {
    try {
      // 清除现有路线
      const existingOverlays = map.getAllOverlays();
      existingOverlays.forEach((overlay: any) => {
        if (overlay instanceof AMap.Polyline) {
          map.remove(overlay);
        }
      });

      // 添加起点和终点标记
      const startMarker = new AMap.Marker({
      position: from,
      content: `
        <div style="
          width: 20px;
          height: 20px;
          background: #4CAF50;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      // offset设置为标记中心点
      offset: new AMap.Pixel(-10, -10), // 调整为标记大小的一半
    });

    const endMarker = new AMap.Marker({
      position: to,
      content: `
        <div style="
          width: 20px;
          height: 20px;
          background: #2196F3; /* 改为蓝色 */
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      offset: new AMap.Pixel(-10, -10), // 调整为标记大小的一半
    });

      map.add([startMarker, endMarker]);

      // 尝试使用高德地图路线规划
      AMap.plugin('AMap.Driving', () => {
        const driving = new AMap.Driving({
          policy: AMap.DrivingPolicy.LEAST_TIME,
          hideMarkers: true,
          showTraffic: false,
        });

        driving.search(from, to, (status: string, result: any) => {
          if (status === 'complete') {
            console.log('路线规划成功');
            const path = result.routes[0].steps.flatMap((step: any) => step.path);
            setRoutePath(path);

            // 绘制路线
            const polyline = new AMap.Polyline({
              path: path,
              strokeColor: '#3366FF',
              strokeWeight: 6,
              strokeOpacity: 0.7,
              strokeStyle: 'solid',
            });

            map.add(polyline);

            // 开始动画
            setTimeout(() => {
              startRouteAnimation(AMap, map, path);
            }, 1000);

            map.setFitView();
          } else {
            console.log('使用模拟路线数据');
            // 使用模拟路线数据
            const simulatedPath = getSimulatedRoute(from, to);
            setRoutePath(simulatedPath);

            const polyline = new AMap.Polyline({
              path: simulatedPath,
              strokeColor: '#3366FF',
              strokeWeight: 6,
              strokeOpacity: 0.7,
              strokeStyle: 'dashed', // 虚线表示模拟路线
            });

            map.add(polyline);

            setTimeout(() => {
              startRouteAnimation(AMap, map, simulatedPath);
            }, 1000);

            map.setFitView();
          }
        });
      });
    } catch (error) {
      console.error('路线绘制错误:', error);
      // 出错时使用最简单的直线
      const simplePath = [from, to];
      setRoutePath(simplePath);

      const polyline = new AMap.Polyline({
        path: simplePath,
        strokeColor: '#3366FF',
        strokeWeight: 6,
        strokeOpacity: 0.7,
      });

      map.add(polyline);
      map.setFitView();
    }
  };

  // 绘制当前位置标记
  const drawCurrentLocation = (AMap: any, map: any, location: LngLat) => {
    const currentLocationMarker = new AMap.Marker({
      position: location,
      icon: new AMap.Icon({
        size: new AMap.Size(30, 30),
        image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
        imageSize: new AMap.Size(30, 30),
      }),
      title: '当前位置',
    });

    map.add(currentLocationMarker);
  };

  // 初始化地图
  useEffect(() => {
    let mounted = true;

    loadAMap()
      .then((AMap) => {
        if (!mounted || !ref.current) return;

        const map = new AMap.Map(ref.current, {
          center: showRoute && route ? route.from : center,
          zoom: 11,
          viewMode: '2D',
        });

        amapRef.current = map;
        setMapLoaded(true);

        map.on('complete', () => {
          try {
            // 绘制配送范围圆圈
            if (showCircle) {
              drawDeliveryCircle(AMap, map, center, radius);
            }

            // 绘制地址标记
            if (markers.length > 0) {
              drawMarkers(AMap, map, markers);
            }

            // 绘制当前位置
            if (currentLocation) {
              drawCurrentLocation(AMap, map, currentLocation);
            }

            // 绘制路线
            if (showRoute && route) {
              drawRoute(AMap, map, route.from, route.to);
            }

            // 调整视图以显示所有内容
            if (markers.length > 0 || showRoute) {
              setTimeout(() => {
                map.setFitView();
              }, 500);
            }
          } catch (error) {
            console.error('地图初始化错误:', error);
          }
        });
      })
      .catch((err) => {
        console.error('加载高德地图失败:', err);
      });

    return () => {
      mounted = false;
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
      if (amapRef.current) {
        amapRef.current.destroy();
      }
    };
  }, []);

  // 当半径变化时更新圆圈
  useEffect(() => {
    if (!mapLoaded || !amapRef.current || !showCircle) return;

    const AMap = (window as any).AMap;
    if (AMap) {
      drawDeliveryCircle(AMap, amapRef.current, center, radius);
    }
  }, [mapLoaded, radius, showCircle, center]);

  // 当标记变化时更新
  useEffect(() => {
    if (!mapLoaded || !amapRef.current || markers.length === 0) return;

    const AMap = (window as any).AMap;
    if (AMap) {
      drawMarkers(AMap, amapRef.current, markers);
    }
  }, [mapLoaded, markers]);

  // 当路线变化时更新
  useEffect(() => {
    if (!mapLoaded || !amapRef.current || !showRoute || !route) return;

    const AMap = (window as any).AMap;
    if (AMap) {
      drawRoute(AMap, amapRef.current, route.from, route.to);
    }
  }, [mapLoaded, showRoute, route]);

  // 当当前位置变化时更新
  useEffect(() => {
    if (!mapLoaded || !amapRef.current || !currentLocation) return;

    const AMap = (window as any).AMap;
    if (AMap) {
      drawCurrentLocation(AMap, amapRef.current, currentLocation);
    }
  }, [mapLoaded, currentLocation]);

  return (
    <div className="absolute inset-0">
      <div ref={ref} style={{ width: '100%', height: '100%' }} />

      {/* 地图图例 */}
      {/* <div className="absolute top-4 left-4 rounded-lg border border-gray-200 bg-white p-3 shadow-md">
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
            <span className="text-gray-600">配送范围 ({radius}km)</span>
          </div>
        </div>
      </div> */}

      {/* 半径信息 */}
      {/* <div className="absolute bottom-4 left-4 rounded-lg border border-gray-200 bg-white p-3 shadow-md">
        <div className="text-sm font-semibold text-blue-600">
          当前配送半径: <span className="text-lg">{radius} km</span>
        </div>
        <div className="mt-1 text-xs text-gray-500">
          覆盖 {markers.filter((m) => m.color === 'green').length} / {markers.length} 个地址
        </div>
      </div> */}
    </div>
  );
};

export default AMapVisualization;

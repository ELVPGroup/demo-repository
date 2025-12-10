/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import { useWebSocket, MessageTypeEnum } from '@/hooks/useWebSocket';

type LngLat = [number, number];

export interface RealtimeLocation {
  location: LngLat;
  timestamp: string;
  shippingStatus: string;
  progress: number;
}

interface Message {
  type: MessageTypeEnum;
  data?: RealtimeLocation;
}

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
  animationDurationMs?: number;
  currentLocationOffsetX?: number;
  onBoundsChange?: (
    northEast: { lat: number; lng: number },
    southWest: { lat: number; lng: number }
  ) => void;
  orderId?: string; // 添加订单ID参数
  enableLocationTracking?: boolean; // 是否启用位置跟踪
  onMapClick?: (lngLat: LngLat) => void; // 点击地图回调
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
  // setRadius,
  markers = [],
  showCircle = true,
  route = null,
  showRoute = false,
  currentLocation,
  animateRoute = true,
  // animationDurationMs = 30,
  currentLocationOffsetX = 6,
  onBoundsChange,
  orderId, // 从父组件传入订单ID
  // enableLocationTracking = false, // 默认不启用位置跟踪
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const amapRef = useRef<any>(null);
  const boundsHandlerRef = useRef<((...args: any[]) => void) | null>(null);
  const movingMarkerRef = useRef<any>(null);
  const animationRef = useRef<any>(null);
  const currentLocationMarkerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const centerMarkerRef = useRef<any>(null);
  const mapMarkersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [, setRoutePath] = useState<LngLat[]>([]);
  const [, setMessages] = useState<Message[]>([]);
  const previousLocationRef = useRef<LngLat | null>(null);

  // 连接 WebSocket 服务器，第一个参数为空字符串表示连接到 base_ws_url；
  // 第二个参数为消息处理函数，用于接收服务器传来消息，并作处理
  const { sendMessage, connected } = useWebSocket('', (msg) => {
    // 添加 console.log 来记录新消息
    // console.log('收到新的 WebSocket 消息:', msg);
    // console.log('收到新的 WebSocket 消息:', msg.data.location);

    // 获取新位置
    if (msg && (msg as Message).data?.location) {
      const newLocation = (msg as Message).data?.location as LngLat;
      console.log('新位置:', newLocation);

      // 添加到消息列表
      setMessages((prev) => {
        const newMessages = [...prev, msg as Message];
        // 也可以在这里添加 console.log，显示更新后的消息数量
        // console.log(`消息数量更新: ${prev} -> ${newMessages}`);
        return newMessages;
      });

      // 如果有上一个位置，执行动画
      if (previousLocationRef.current) {
        animateMove(previousLocationRef.current, newLocation);
      } else {
        // 第一次收到位置，直接设置
        updateMarkerPosition(newLocation);
      }

      // 保存为上一个位置
      previousLocationRef.current = newLocation;
    }
  });

  // 动画函数：从一个位置移动到另一个位置
  const animateMove = (from: LngLat, to: LngLat) => {
    if (!movingMarkerRef.current || !amapRef.current) return;

    // 清除之前的动画
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startTime = Date.now();
    const duration = 2000; // 2秒动画，可根据需要调整

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 线性插值计算当前位置
      const currentLng = from[0] + (to[0] - from[0]) * progress;
      const currentLat = from[1] + (to[1] - from[1]) * progress;

      // 更新标记位置
      movingMarkerRef.current.setPosition(new (window as any).AMap.LngLat(currentLng, currentLat));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  // 更新标记位置的函数
  const updateMarkerPosition = (position: LngLat) => {
    if (movingMarkerRef.current && amapRef.current) {
      movingMarkerRef.current.setPosition(
        new (window as any).AMap.LngLat(position[0], position[1])
      );
    }
  };

  useEffect(() => {
    if (!connected) {
      return;
    }
    // 订阅物流更新
    sendMessage(MessageTypeEnum.ShippingSubscribe, orderId);
    return () => {
      // 销毁时取消订阅物流更新
      sendMessage(MessageTypeEnum.ShippingUnsubscribe, orderId);
    };
  }, [sendMessage, connected, orderId]);

  // 轨迹动画
  const startRouteAnimation = (AMap: any, map: any, path: LngLat[], currentLocation?: LngLat) => {
    console.debug('startRouteAnimation called', {
      pathLength: path.length,
      animateRoute,
      currentLocation,
    });
    // console.log('startRouteAnimation called', path);
    // currentLocation = [
    //             114.424376,
    //             30.607375
    //         ]; // for debug
    if (!path.length || !animateRoute) {
      console.debug('startRouteAnimation aborted: no path or animateRoute disabled');
      return;
    }

    // 清除之前的动画
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
    if (movingMarkerRef.current) {
      map.remove(movingMarkerRef.current);
    }

    // 动画目标：如果提供 currentLocation，则把动画从起点(0)走到与 currentLocation 最近的路径点
    let startIndex = 0;
    let endIndex = 0;
    // 修改确定 endIndex 的逻辑
    if (currentLocation) {
      let minDist = Infinity;
      let minIdx = 0;
      for (let i = 0; i < path.length; i++) {
        const dx = path[i][0] - currentLocation[0];
        const dy = path[i][1] - currentLocation[1];
        const d = dx * dx + dy * dy;
        if (d < minDist) {
          minDist = d;
          minIdx = i;
        }
      }
      endIndex = minIdx;
      startIndex = Math.max(0, endIndex - 1000); // 最多回溯1000个点以加快动画
      console.debug(
        'Determined endIndex for animation based on currentLocation:',
        startIndex,
        endIndex
      );
    }

    // 创建移动的圆点标记（从计算的起始位置开始）
    const initialPos = path[Math.max(0, Math.min(path.length - 1, startIndex))];
    const movingMarker = new AMap.Marker({
      position: initialPos,
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

    // 计算动画的结束索引（endIndex 可能等于 startIndex）
    const middleIndex = endIndex;

    console.log('Route animation from index', startIndex, 'to', middleIndex);
    let currentIndex = startIndex;
    const totalSteps = Math.max(1, middleIndex - startIndex);
    const animationDuration = 1000;
    const stepTime = Math.max(5, Math.floor(animationDuration / Math.max(1, totalSteps)));
    console.debug('route animation timing', { totalSteps, animationDuration, stepTime });
    const animate = () => {
      if (currentIndex <= middleIndex) {
        const currentPoint = path[currentIndex];
        movingMarker.setPosition(currentPoint);
        currentIndex++;
      } else {
        clearInterval(animationRef.current);
        // 动画完成后添加脉冲效果
        addPulseEffect(AMap, map, path[middleIndex]);
      }
    };

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

    // 移除之前的中心标记（如果存在），避免残留或错位
    if (centerMarkerRef.current) {
      try {
        map.remove(centerMarkerRef.current);
      } catch (e) {
        // ignore
      }
      centerMarkerRef.current = null;
    }

    // 添加中心点标记（设置 offset 以确保图标居中）
    const markerSize = 25;
    const centerMarker = new AMap.Marker({
      position: center,
      icon: new AMap.Icon({
        size: new AMap.Size(markerSize, markerSize),
        image:
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25"><circle cx="12.5" cy="12.5" r="10" fill="%233b82f6" stroke="%23FFFFFF" stroke-width="2"/></svg>',
        imageSize: new AMap.Size(markerSize, markerSize),
      }),
      title: '配送中心',
      offset: new AMap.Pixel(-markerSize / 2, -markerSize / 2),
    });
    centerMarker.setMap(map);
    centerMarkerRef.current = centerMarker;

    return circle;
  };

  // 绘制地址标记 - 修改版本
  const drawMarkers = (
    AMap: any,
    map: any,
    markers: Array<{ id: string; position: LngLat; color?: string }>
  ) => {
    console.debug('drawMarkers called, markers count:', markers?.length, 'first:', markers?.[0]);
    // 清除现有标记
    mapMarkersRef.current.forEach((marker) => {
      map.remove(marker);
    });
    mapMarkersRef.current = [];

    // 统计每个位置的点数量
    const positionCountMap = new Map<string, number>();
    const positionOffsetMap = new Map<string, { offset: LngLat; index: number }>();

    // 第一次遍历：统计每个位置的数量
    markers.forEach((marker) => {
      const key = `${marker.position[0].toFixed(6)}_${marker.position[1].toFixed(6)}`;
      positionCountMap.set(key, (positionCountMap.get(key) || 0) + 1);
    });

    // 第二次遍历：绘制标记
    markers.forEach((marker) => {
      const key = `${marker.position[0].toFixed(6)}_${marker.position[1].toFixed(6)}`;
      const count = positionCountMap.get(key) || 1;

      let finalPosition: LngLat;

      // 如果只有一个点，使用原位置
      if (count === 1) {
        finalPosition = marker.position;
      } else {
        // 如果有多个点，计算偏移位置
        let offsetInfo = positionOffsetMap.get(key);
        if (!offsetInfo) {
          offsetInfo = { offset: [0, 0], index: 0 };
          positionOffsetMap.set(key, offsetInfo);
        }

        // 计算偏移（使用环形布局）
        const angle = (offsetInfo.index / count) * 2 * Math.PI;
        const radius = 0.00015; // 偏移半径（约15米）

        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;

        finalPosition = [marker.position[0] + offsetX, marker.position[1] + offsetY];

        offsetInfo.index++;
      }

      const markerColor = marker.color || '#3366FF';

      // 创建标记
      const markerObj = new AMap.Marker({
        position: finalPosition,
        title: `${marker.id} (${count > 1 ? '共' + count + '个点' : ''})`,
        zIndex: 100 + (count > 1 ? 1 : 0), // 重叠点显示在最上层
        icon: new AMap.Icon({
          size: new AMap.Size(count > 1 ? 14 : 12, count > 1 ? 14 : 12),
          image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${count > 1 ? 14 : 12}" height="${count > 1 ? 14 : 12}">
            <circle cx="${count > 1 ? 7 : 6}" cy="${count > 1 ? 7 : 6}" r="${count > 1 ? 6 : 5}" 
              fill="${markerColor}" stroke="white" stroke-width="${count > 1 ? '2' : '1'}"/>
            ${count > 1 ? `<text x="7" y="9" font-size="6" fill="white" text-anchor="middle" font-weight="bold">${count}</text>` : ''}
          </svg>`,
          imageSize: new AMap.Size(count > 1 ? 14 : 12, count > 1 ? 14 : 12),
        }),
        // 添加自定义数据
        extData: {
          originalPosition: marker.position,
          isCluster: count > 1,
          count: count,
        },
      });
      // console.debug('Adding marker:', markerObj);
      // 添加点击事件
      markerObj.on('click', (e: any) => {
        const targetMarker = e.target;
        const extData = targetMarker.getExtData();

        let content = `
          <div style="padding: 8px; max-width: 250px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${marker.id}</div>
        `;

        if (extData.isCluster) {
          // 如果是聚合点，显示所有订单
          const clusterMarkers = markers.filter(
            (m) => `${m.position[0].toFixed(6)}_${m.position[1].toFixed(6)}` === key
          );

          content += `
            <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
              该位置有 ${extData.count} 个订单：
            </div>
            <div style="max-height: 200px; overflow-y: auto;">
          `;

          clusterMarkers.forEach((m, index) => {
            content += `
              <div style="padding: 4px; border-bottom: 1px solid #eee;">
                <div style="font-size: 11px;">
                  <strong>订单 ${index + 1}:</strong> ${m.id}
                </div>
                <div style="font-size: 10px; color: #888;">
                  经度: ${m.position[0].toFixed(6)}<br/>
                  纬度: ${m.position[1].toFixed(6)}
                </div>
              </div>
            `;
          });

          content += `</div>`;
        } else {
          // 单个点
          content += `
            <div style="font-size: 12px; color: #666;">
              经度: ${marker.position[0].toFixed(6)}<br/>
              纬度: ${marker.position[1].toFixed(6)}
            </div>
          `;
        }

        content += `</div>`;

        const infoWindow = new AMap.InfoWindow({
          content: content,
          offset: new AMap.Pixel(0, -20),
        });

        infoWindow.open(map, finalPosition);
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

            // 开始动画（传入当前定位以便从当前位置开始）
            setTimeout(() => {
              startRouteAnimation(AMap, map, path, currentLocation);
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
              startRouteAnimation(AMap, map, simulatedPath, currentLocation);
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
    // 移除旧的当前位置标记，避免重复
    if (currentLocationMarkerRef.current) {
      try {
        map.remove(currentLocationMarkerRef.current);
      } catch {
        // ignore
      }
      currentLocationMarkerRef.current = null;
    }

    const size = 20;
    const currentLocationMarker = new AMap.Marker({
      position: location,
      icon: new AMap.Icon({
        size: new AMap.Size(size, size),
        image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
        imageSize: new AMap.Size(size, size),
      }),
      title: '当前位置',
      // 偏移量：水平向左半个宽度，垂直向上整个高度，使图标底部与坐标对齐
      offset: new AMap.Pixel(-size / 2 - currentLocationOffsetX, -size),
    });

    map.add(currentLocationMarker);
    currentLocationMarkerRef.current = currentLocationMarker;
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

            // 绑定视口变化回调，向父组件报告 NE/SW
            const emitBounds = () => {
              try {
                const bounds = map.getBounds();
                if (!bounds) return;
                const ne = bounds.getNorthEast();
                const sw = bounds.getSouthWest();
                if (onBoundsChange) {
                  onBoundsChange({ lat: ne.lat, lng: ne.lng }, { lat: sw.lat, lng: sw.lng });
                }
              } catch {
                // ignore
              }
            };

            boundsHandlerRef.current = emitBounds;
            map.on('moveend', emitBounds);
            map.on('zoomend', emitBounds);
            map.on('dragend', emitBounds);

            // 触发一次初始边界回调
            emitBounds();
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

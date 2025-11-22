type LngLat = [number, number];

/**
 * 生成武汉周边的随机经纬度
 * @param center 中心点坐标 [经度, 纬度]
 * @param count 生成的数量
 * @param maxRadius 最大半径（公里）
 * @returns 随机坐标数组
 */
export const generateRandomLocations = (
  center: LngLat = [114.305539, 30.593175],
  count: number = 30,
  maxRadius: number = 50
): LngLat[] => {
  const locations: LngLat[] = [];

  for (let i = 0; i < count; i++) {
    // 生成随机距离（0到maxRadius公里）
    const distance = Math.random() * maxRadius;
    // 生成随机角度（0到360度）
    const bearing = Math.random() * 360;

    const location = calculateDestination(center, distance, bearing);
    locations.push(location);
  }

  return locations;
};

/**
 * 根据起点、距离和方向计算终点坐标
 */
const calculateDestination = (start: LngLat, distance: number, bearing: number): LngLat => {
  const R = 6371; // 地球半径（公里）
  const δ = distance / R; // 角距离
  const θ = (bearing * Math.PI) / 180; // 转换为弧度

  const φ1 = (start[1] * Math.PI) / 180;
  const λ1 = (start[0] * Math.PI) / 180;

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) +
    Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  );

  const λ2 = λ1 + Math.atan2(
    Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
    Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
  );

  const lng = ((λ2 * 180) / Math.PI + 540) % 360 - 180;
  const lat = (φ2 * 180) / Math.PI;

  return [lng, lat];
};

/**
 * 计算两点之间的距离（公里）
 */
export const calculateDistance = (point1: LngLat, point2: LngLat): number => {
  const R = 6371; // 地球半径（公里）
  const φ1 = (point1[1] * Math.PI) / 180;
  const φ2 = (point2[1] * Math.PI) / 180;
  const Δφ = ((point2[1] - point1[1]) * Math.PI) / 180;
  const Δλ = ((point2[0] - point1[0]) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};
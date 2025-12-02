// 通用工具函数

/**
 * 获取对象中 null 或 undefined 的字段
 * @param obj 输入对象
 * @returns 非 null 或 undefined 字段组成的对象
 */
export function getDefinedKeyValues(obj: object) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined && value !== null)
  );
}

/**
 * 地球半径（米）
 */
export const EARTH_RADIUS_M = 6371000;
/**
 * 赤道上每度纬度的距离（米）
 */
export const METERS_PER_DEGREE_LAT = 111320;
/**
 * 纬度上对应每度经度的距离（米）
 * @param lat 纬度（单位：度）
 * @returns 每度经度的距离（米）
 */
export function metersPerDegreeLonAtLat(lat: number) {
  return METERS_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180);
}

/**
 * 计算两个经纬度点之间的距离（单位：米）
 * @param origin 原点 [经度, 纬度]
 * @param dest 目标点 [经度, 纬度]
 * @returns 距离（米）
 */
export function haversineDistanceMeters(origin: [number, number], dest: [number, number]) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const [lon1, lat1] = origin;
  const [lon2, lat2] = dest;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

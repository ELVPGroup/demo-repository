// 通用工具函数

import type { GeoPoint } from '../types/index.js';

/**
 * 获取对象中非 null 或 undefined 的字段
 * @param obj 输入对象
 * @returns 非 null 或 undefined 字段组成的对象
 */
export function getDefinedKeyValues(obj: object) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined && value !== null)
  );
}

/**
 * 获取对象中非 falsy 的字段
 * @param obj 输入对象
 * @returns 非 falsy 字段组成的对象
 */
export function getTruthyKeyValues(obj: object) {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value));
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
 * 计算球面上两个经纬度点之间的距离（单位：米）
 * @param origin 原点 [经度, 纬度]
 * @param dest 目标点 [经度, 纬度]
 * @returns 距离（米）
 */
export function haversineDistanceMeters(origin: GeoPoint, dest: GeoPoint) {
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

/**
 * 解析高德地图折线编码
 * @param line 折线编码字符串
 * @returns 解析后的坐标数组，每个元素为 [经度, 纬度]
 */
export function parseAmapPolyline(line: string): GeoPoint[] {
  return line
    .split(';')
    .map((f) => f.trim())
    .filter(Boolean)
    .map((p) => p.split(',').map(Number) as GeoPoint);
}

/**
 * km/h 转换为 m/s
 * @param kmh 速度（单位：千米/小时）
 * @returns 速度（单位：米/秒）
 */
export function kmhToMps(kmh: number) {
  return (kmh * 1000) / 3600;
}

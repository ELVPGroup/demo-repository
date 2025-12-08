import type { GeoPoint } from '../types/index.js';

/**
 * 高德 WebAPI 客户端（服务端调用）
 * - 统一封装对高德API的GET请求、状态校验与错误处理
 * - 提供地理/逆地理编码与驾车路径规划能力
 *
 * 使用须知：
 * - 在运行环境中配置 AMAP_API_KEY 为 Web 服务密钥
 * - 所有坐标均使用 [longitude, latitude]（经度, 纬度）顺序
 */
type AMapBaseResponse = { status: string; info?: string };

/** 地理编码响应（地址到坐标） */
type GeocodeResponse = AMapBaseResponse & {
  count?: string;
  geocodes?: Array<{ location?: string }>;
};

/** 逆地理编码响应（坐标到地址） */
type ReverseGeocodeResponse = AMapBaseResponse & {
  regeocode?: { formatted_address?: string };
};

/** 驾车路径规划响应 */
export type DirectionDrivingResponse = AMapBaseResponse & {
  route?: {
    paths?: Array<{
      distance?: string;
      duration?: string;
      steps?: Array<{ polyline?: string }>;
    }>;
  };
};

export class AMapClient {
  private base = 'https://restapi.amap.com';
  private key = process.env['AMAP_API_KEY'] || '';

  /**
   * 统一 GET 请求入口
   * @param path API 路径
   * @param params 查询参数（自动附加 `key`）
   * @throws 当响应状态非 200 或高德返回 `status !== '1'` 时抛出错误
   */
  private async request<T>(path: string, params: Record<string, string>) {
    if (!this.key) {
      throw new Error('AMAP_API_KEY is not configured');
    }
    const url = new URL(this.base + path);
    const search = { ...params, key: this.key };
    Object.entries(search).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      throw new Error('AMap request failed: ' + res.status);
    }
    const data = (await res.json()) as T;
    const status = (data as AMapBaseResponse).status;
    if (status !== '1') {
      const info = (data as AMapBaseResponse).info || 'unknown';
      console.error('AMap error: ' + info + ' path: ' + path);
      throw new Error('请输入有效的地址');
    }
    return data;
  }

  /**
   * 地理编码
   * @param address 地址文本
   * @param city 可选城市，用于限定范围
   * @returns `location`: 坐标点（经度, 纬度）；`raw`: 原始响应
   */
  async geocode(address: string, city?: string) {
    const data = await this.request<GeocodeResponse>('/v3/geocode/geo', {
      address,
      ...(city ? { city } : {}),
    });
    const loc = data.geocodes && data.geocodes[0]?.location;
    const point = loc ? (loc.split(',').map((n) => Number(n)) as GeoPoint) : undefined;
    return { location: point, raw: data };
  }

  /**
   * 逆地理编码
   * @param location 坐标点（经度, 纬度）
   * @returns `address`: 格式化地址；`raw`: 原始响应
   */
  async reverseGeocode(location: GeoPoint) {
    const data = await this.request<ReverseGeocodeResponse>('/v3/geocode/regeo', {
      location: `${location[0]},${location[1]}`,
    });
    const addr = data.regeocode?.formatted_address || '';
    return { address: addr, raw: data };
  }

  /**
   * 驾车路径规划
   * @param origin 起点坐标（经度, 纬度）
   * @param destination 终点坐标（经度, 纬度）
   * @param strategy 策略（高德驾车策略编码，可选）
   */
  async directionDriving(origin: GeoPoint, destination: GeoPoint, strategy?: number) {
    const data = await this.request<DirectionDrivingResponse>('/v3/direction/driving', {
      origin: `${origin[0]},${origin[1]}`,
      destination: `${destination[0]},${destination[1]}`,
      ...(strategy !== undefined ? { strategy: String(strategy) } : {}),
    });
    const route = data.route?.paths?.[0];
    return {
      distance: Number(route?.distance || 0),
      duration: Number(route?.duration || 0),
      polyline: route?.steps?.map((step) => step.polyline).join(';') || '',
      raw: data,
    };
  }
}

export const amapClient = new AMapClient();

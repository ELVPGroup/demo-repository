/**
 * 服务类型
 */
export enum ServiceKey {
  client = 'USER',
  merchant = 'MER',
  order = 'ORD',
}

const MIN_ID_LENGTH = 6;

/**
 * 生成服务ID
 * @param rawId 原始ID
 * @param key 服务类型
 * @returns 服务ID (格式：KEY-XXXXXX，若原始ID长度不足6位，则前面填充0)
 */
export function generateServiceId(rawId: number, key: ServiceKey) {
  const paddedId =
    String(rawId).length > MIN_ID_LENGTH
      ? rawId
      : Number(rawId).toString().padStart(MIN_ID_LENGTH, '0');
  return `${key}-${paddedId}`;
}

/**
 * 解析服务ID
 * @param serviceId 服务ID (格式：KEY-XXXXXX)
 * @returns key, id对象
 */
export function parseServiceId(serviceId: string) {
  const [key, id] = serviceId.split('-');
  return { key: key as ServiceKey, id: Number(id) };
}

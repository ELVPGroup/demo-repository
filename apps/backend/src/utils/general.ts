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

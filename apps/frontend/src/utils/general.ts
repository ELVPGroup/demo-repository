/**
 * 防抖函数
 * @param func 要支持防抖的函数
 * @param delay 防抖延迟时间（毫秒）
 * @param leading 是否启用首次立即执行（默认 false）。为 true 时首次立即执行，后续在延迟窗口内只执行一次（取最后一次调用的参数）。
 * @returns 支持防抖后的函数，包含取消方法（取消会清空定时器并重置内部状态）
 */
export function debounced<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
  leading = false
) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const invoke = () => {
    if (lastArgs) func(...lastArgs);
    lastArgs = null;
  };

  const debouncedFn = (...args: Parameters<T>) => {
    const isInvokingNow = leading && timeoutId === null; // 是否立即执行

    lastArgs = args;

    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      timeoutId = null;
      invoke();
    }, delay);

    if (isInvokingNow) {
      func(...args);
      lastArgs = null; // 立即执行时不保留 args
    }
  };

  debouncedFn.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = null;
    lastArgs = null;
  };

  return debouncedFn as T & { cancel: () => void };
}

/**
 * 节流函数
 * @param func 要支持节流的函数
 * @param delay 节流延迟时间（毫秒）
 * @returns 支持节流后的函数，包含取消方法
 */
export function throttled<T extends (...args: unknown[]) => unknown>(func: T, delay: number) {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const throttledFn = (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = delay - (now - lastCall);

    if (remaining <= 0) {
      // 可以立即执行
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      func(...args);
    } else if (!timeoutId) {
      // 设置 trailing 调用
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        func(...args);
      }, remaining);
    }
  };

  throttledFn.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = null;
    lastCall = 0; // 重置，允许下一次立即执行
  };

  return throttledFn as T & { cancel: () => void };
}

/**
 * 标准化订单状态，将各种可能的状态值统一映射到标准状态
 * @param status 原始状态值
 * @returns 标准化后的状态值
 */
export function normalizeOrderStatus(status: string): '待发货' | '运输中' | '已送达' | '已完成' {
  const statusLower = status.toLowerCase();
  
  // 待发货
  if (status === '待发货' || statusLower === 'pending') {
    return '待发货';
  }
  
  // 运输中
  if (status === '运输中' || statusLower === 'shipped' || status === '已发货' || status === '已揽收') {
    return '运输中';
  }
  
  // 已送达 - 包含已签收状态
  if (
    status === '已送达' || 
    status === '已签收' ||
    statusLower === 'delivered' || 
    statusLower.includes('已送达') ||
    statusLower.includes('已签收') ||
    status === 'DELIVERED'
  ) {
    return '已送达';
  }
  
  // 已完成
  if (status === '已完成' || statusLower === 'completed') {
    return '已完成';
  }
  
  // 默认返回待发货
  return '待发货';
}

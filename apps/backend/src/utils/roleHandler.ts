export interface ContextUserState {
  side: string;
  id: number;
}

/**
 * 从上下文状态中提取角色ID
 * @param ctxUserState - 上下文状态，包含用户角色和ID
 * @returns 包含userId或merchantId的对象
 * @throws 如果角色不是client或merchant，则抛出错误
 */
export function extractRoleId(ctxUserState: ContextUserState) {
  if (ctxUserState.side === 'client') {
    return { userId: ctxUserState.id };
  } else if (ctxUserState.side === 'merchant') {
    return { merchantId: ctxUserState.id };
  }
  throw new Error('Invalid payload: userId or merchantId is required');
}

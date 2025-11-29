import '@koa/router';

declare module 'koa' {
  interface DefaultContext {
    params: Record<string, string>;
  }
}

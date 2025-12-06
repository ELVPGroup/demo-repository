import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import './index.css';
import App from './App.tsx';
// 商家端
const DashboardPage = lazy(() => import('@/pages/merchant/DashboardPage.tsx'));
const DeliveryManagementPage = lazy(() => import('@/pages/merchant/DeliveryManagementPage.tsx'));
const MerchantOrderDetailPage = lazy(() => import('@/pages/merchant/OrderDetailPage.tsx'));
const OrdersPage = lazy(() => import('./pages/merchant/OrdersPage.tsx'));
const ShippingPage = lazy(() => import('./pages/merchant/ShippingPage.tsx'));
const ProductsPage = lazy(() => import('./pages/merchant/ProductsPage.tsx'));
import MerchantLayout from '@/layouts/MerchantLayout.tsx';
// 用户端
import ClientLayout from '@/layouts/ClientLayout.tsx';
const MyOrdersPage = lazy(() => import('@/pages/client/MyOrdersPage.tsx'));
const ClientOrderDetailPage = lazy(() => import('@/pages/client/OrderDetailPage.tsx'));
const ClientProductsPage = lazy(() => import('@/pages/client/ProductsPage.tsx'));

//为AntD配置样式
import { ConfigProvider } from 'antd';
import { themeTokens } from '@/theme/theme';
import DemoWebSocketPage from './pages/demo/DemoWebSocketPage.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider theme={themeTokens}>
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="flex h-screen items-center justify-center">
              {' '}
              <Spin size="large" />
            </div>
          }
        >
          <Routes>
            {/* 项目根目录，目前为示例页面 */}
            <Route index element={<App />} />

            {/* WebSocket 演示路由，用于开发演示 */}
            <Route path="/demo/ws" element={<DemoWebSocketPage />} />

            {/* 商家端路由 */}
            <Route path="/merchant" element={<MerchantLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="orders/list" element={<OrdersPage />} />
              <Route path="orders/:orderId" element={<MerchantOrderDetailPage />} />
              <Route path="delivery-management" element={<DeliveryManagementPage />} />
              <Route path="shipping/list" element={<ShippingPage />} />
              <Route path="products/list" element={<ProductsPage />} />
            </Route>
            {/* 用户端路由 */}
            <Route path="/client" element={<ClientLayout />}>
              <Route index element={<ClientProductsPage />} />
              <Route path="orders" element={<MyOrdersPage />} />
              <Route path="orders/:orderId" element={<ClientOrderDetailPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ConfigProvider>
  </StrictMode>
);

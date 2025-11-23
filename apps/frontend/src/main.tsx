import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import './index.css';
import App from './App.tsx';
// 商家端
import MerchantLayout from '@/layouts/MerchantLayout.tsx';
import DashboardPage from '@/pages/merchant/DashboardPage.tsx';
import DeliveryManagementPage from '@/pages/merchant/DeliveryManagementPage.tsx';
import MerchantOrderDetailPage from '@/pages/merchant/OrderDetailPage.tsx';
// 用户端
import ClientLayout from '@/layouts/ClientLayout.tsx';
import MyOrdersPage from '@/pages/client/MyOrdersPage.tsx';
import ClientOrderDetailPage from '@/pages/client/OrderDetailPage.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* 项目根目录，目前为示例页面 */}
        <Route index element={<App />} />
        {/* 商家端路由 */}
        <Route path="merchant" element={<MerchantLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="orders/:orderId" element={<MerchantOrderDetailPage />} />
          <Route path="delivery-management" element={<DeliveryManagementPage />} />
        </Route>
        {/* 用户端路由 */}
        <Route path="client" element={<ClientLayout />}>
          <Route index element={<MyOrdersPage />} />
          <Route path="orders/:orderId" element={<ClientOrderDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);

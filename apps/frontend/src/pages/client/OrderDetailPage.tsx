import { TopBar } from '@/components/merchantComponents/TopBar';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Hash, Truck, MapPin, LogOut } from 'lucide-react';
import { Alert, Button, message } from 'antd';
import { useEffect } from 'react';
import { useOrderDetailStore } from '@/store/useOrderDetailStore';
import React from 'react';
import ProductList from '@/commonpart/ProductList';
import RecipientInfo from '@/commonpart/RecipientInfo';
import ShippingTimeline from '@/commonpart/ShippingTimeline';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  // 使用订单详情 Store
  const { order, loading, error, fetchOrderDetail } = useOrderDetailStore();

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail(orderId);
    }
  }, [orderId, fetchOrderDetail]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="ml-60 px-10 py-6">
        <div className="flex flex-row justify-between gap-4">
          <TopBar title={`订单详情 - ${orderId || ''}`} />

          <div className="flex flex-row gap-4">
            {/* 返回到客户端订单列表 */}
            <Button onClick={() => navigate('/client')} color="primary">
              <ArrowLeft size={18} />
              <span>返回订单列表</span>
            </Button>

            {/* 退出登录，返回首页 */}
            <Button
              danger
              icon={<LogOut size={16} />}
              onClick={() => {
                // 清除本地存储的认证信息
                localStorage.removeItem('token');
                localStorage.removeItem('userInfo');
                sessionStorage.clear();
                // 显示成功消息
                message.success('已成功退出登录');
                // 跳转到首页
                navigate('/');
              }}
              className="flex items-center gap-2"
            >
              退出登录
            </Button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mt-4">
            <Alert title="Error" description={error} type="error" showIcon />
          </div>
        )}

        {loading ? (
          <div className="mt-6 text-center" style={{ color: 'var(--color-text-secondary)' }}>
            加载中...
          </div>
        ) : !order ? (
          <div className="mt-6 text-center" style={{ color: 'var(--color-text-secondary)' }}>
            暂无订单数据
          </div>
        ) : (
          /* 调整布局：移除了原来的 grid-cols-3，改为单列或最大宽度限制的布局 */
          <div className="mx-auto mt-6 max-w-4xl space-y-6">
            <ProductList products={order.products} />

            <RecipientInfo addressInfo={order.addressInfo} />

            <ShippingTimeline timeline={order.timeline} />

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold">配送轨迹</h2>
              </div>
              <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
                <div className="text-center">
                  <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">配送轨迹地图占位</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderDetailPage;

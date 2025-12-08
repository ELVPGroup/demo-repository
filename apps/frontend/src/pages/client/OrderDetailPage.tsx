import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Hash, Truck, MapPin, LogOut } from 'lucide-react';
import { Alert, Button, message } from 'antd';
import { useEffect } from 'react';
import { useOrderDetailStore } from '@/store/useOrderDetailStore';
import React from 'react';
import ProductList from '@/commonpart/ProductList';
import RecipientInfo from '@/commonpart/RecipientInfo';
import ShippingTimeline from '@/commonpart/ShippingTimeline';
import RouteMap from '@/components/RouteMap';
import ClientTopBar from '@/components/clientComponents/ClientTopBar';

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

  // 根据订单状态和发货状态确定当前位置
  const getCurrentLocation = () => {
    if (!order) return null;

    // 如果订单已送达，使用收货地址作为当前位置
    if (order.status === '已签收' || order.status === 'delivered') {
      return order.shippingTo?.location || order.shippingTo?.location;
    }

    // 如果订单已发货但未送达，使用发货地址作为起点（或根据实际情况调整）
    if (order.status === '运输中' || order.status === '已发货') {
      return order.currentLocation;
    }

    // 默认使用发货地址
    return order.shippingFrom?.location;
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50">
      <main className="max-w-4xl px-10 py-6">
        <div className="flex flex-row justify-between gap-4">
          <ClientTopBar title={`订单详情 - ${orderId || ''}`} />

          {/* 返回到客户端订单列表 */}
          <Button onClick={() => navigate('/client/orders')} color="primary">
            <ArrowLeft size={18} />
            <span>返回订单列表</span>
          </Button>
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
          <div className="mx-auto mt-6 space-y-6">
            <ProductList products={order.products} />

            <RecipientInfo addressInfo={order.shippingTo} />

            <ShippingTimeline timeline={order.timeline} />

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold">配送轨迹</h2>
              </div>
              <div className="h-96 overflow-hidden rounded-lg border border-gray-200">
                  {/* 判断是否有发货地址和收货地址 */}
                  {order.shippingFrom?.address && order.shippingTo?.address ? (
                    <RouteMap
                      startLocation={{
                        name: order.shippingFrom.address,
                        coords: order.shippingFrom.location || [114.305539, 30.593175], // 默认武汉坐标
                      }}
                      endLocation={{
                        name: order.shippingTo.address,
                        coords: order.shippingTo.location || [114.872389, 30.453667], // 默认黄冈坐标
                      }}
                      status={order.status}
                      currentLocation={getCurrentLocation()}
                      showControls={true}
                      distance={order.distance}
                      estimatedTime={order.estimatedTime}
                      showInfoCard={true}
                      showProgressIndicator={true}
                      className="h-full"
                      onMapClick={(coords) => {
                        console.log('地图点击坐标:', coords);
                      }}
                      onZoomChange={(zoom) => {
                        console.log('地图缩放级别:', zoom);
                      }}
                    />
                  ) : order.shippingTo?.address ? (
                    // 如果没有发货地址，但有一个收货地址，可以显示从默认位置到收货地址的路线
                    <RouteMap
                      startLocation={{
                        name: '发货仓库',
                        coords: [114.305539, 30.593175], // 默认发货坐标
                      }}
                      endLocation={{
                        name: order.shippingTo.address,
                        coords: order.shippingTo.location || [114.872389, 30.453667],
                      }}
                      currentLocation={getCurrentLocation()}
                      showControls={true}
                      showInfoCard={true}
                      showProgressIndicator={true}
                      className="h-full"
                    />
                  ) : (
                    // 如果没有任何地址信息，显示提示
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-gray-500">暂无配送地址信息</p>
                      </div>
                    </div>
                  )}
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderDetailPage;

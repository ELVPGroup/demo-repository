import { TopBar } from '@/components/merchantComponents/TopBar';
import { useParams, useNavigate } from 'react-router';
import Sidebar from '@/components/merchantComponents/Sidebar';
import { ArrowLeft, Package, MapPin, Truck, Hash } from 'lucide-react';
import { TimeLine } from '@/components/merchantComponents/TimeLine';
import { MOCK_PACKAGE_DATA } from '@/constants';
import { Button } from 'antd';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-60 px-10 py-6">
        <div className='flex flex-row gap-4 justify-between'>
          <TopBar title={`订单详情 - ${orderId}`} />
          <Button
            onClick={() => navigate('/merchant/orders')}
            color='primary'
          >
            <ArrowLeft size={18} />
            <span>返回订单列表</span>
          </Button>
        </div>



        <div className="grid grid-cols-3 gap-6">
          {/* 左侧：商品清单和配送轨迹 */}
          <div className="col-span-2 space-y-6">
            {/* 商品清单 */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold">商品清单</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Wireless Headphones</div>
                    <div className="mt-1 text-sm text-gray-500">数量：x1</div>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">¥99.99</div>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Phone Case</div>
                    <div className="mt-1 text-sm text-gray-500">数量：x2</div>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">¥39.98</div>
                </div>
                <div className="flex items-center justify-between border-t-2 border-gray-200 pt-4">
                  <span className="text-lg font-semibold text-gray-700">总计</span>
                  <span className="text-2xl font-bold text-blue-600">¥139.97</span>
                </div>
              </div>
            </div>

            {/* 配送轨迹 */}
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

          {/* 右侧：订单信息和配送信息 */}
          <div className="space-y-6">
            {/* 订单信息 */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Hash className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold">订单信息</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">订单号</span>
                  <span className="font-medium text-gray-900">{orderId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">下单时间</span>
                  <span className="font-medium text-gray-900">2025/11/20 10:30</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">订单状态</span>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    配送中
                  </span>
                </div>
              </div>
            </div>

            {/* 收件人信息 */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold">收件人信息</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">姓名</div>
                  <div className="mt-1 font-medium text-gray-900">Alice Smith</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">地址</div>
                  <div className="mt-1 font-medium text-gray-900">
                    100 Main St, Cityville, ST 12345
                  </div>
                </div>
              </div>
            </div>

            {/* 配送信息 */}
            {/* <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold">配送信息</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">配送状态</div>
                  <div className="mt-1">
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                      配送中
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">追踪号</div>
                  <div className="mt-1 font-medium text-gray-900">TRK-888000</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">发货时间</div>
                  <div className="mt-1 font-medium text-gray-900">2025/11/20 14:53:35</div>
                </div>
              </div>
            </div> */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <TimeLine steps={MOCK_PACKAGE_DATA.steps} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderDetailPage;

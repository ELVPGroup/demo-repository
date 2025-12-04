import { TopBar } from '@/components/merchantComponents/TopBar';
import { useParams, useNavigate } from 'react-router';
import Sidebar from '@/components/merchantComponents/Sidebar';
import { ArrowLeft, Package, MapPin, Truck, Hash } from 'lucide-react';
import { TimeLine } from '@/components/merchantComponents/TimeLine';
import { MOCK_PACKAGE_DATA } from '@/constants';
import { Alert, Button, Form, Modal, Input, InputNumber, Space, Card, message } from 'antd';
import { useEffect, useState } from 'react';
import { Plus, Minus } from 'lucide-react';

import { useOrderDetailStore } from '@/store/useOrderDetailStore';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [editVisible, setEditVisible] = useState(false);
  const [form] = Form.useForm();

  const { order, loading, error, fetchOrderDetail, updateOrder, shipOrder } = useOrderDetailStore();

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail(orderId);
      console.log(order?.status);
    }
  }, [orderId, fetchOrderDetail]);

  // 打开编辑 Modal 时初始化表单
  useEffect(() => {
    if (editVisible && order) {
      form.setFieldsValue({
        amount: order.amount,
        totalPrice: order.totalPrice,
        addressInfoId: order.addressInfo?.addressInfoId,
        name: order.addressInfo?.name,
        phone: order.addressInfo?.phone,
        address: order.addressInfo?.address,
        location: order.addressInfo?.location || [0, 0],
        products: order.products || [],
      });
    }
  }, [editVisible, order, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (!order) return;

      const updatedOrder = {
        ...order,
        amount: values.amount,
        totalPrice: values.totalPrice,
        addressInfo: {
          addressInfoId: values.addressInfoId,
          name: values.name,
          phone: values.phone,
          address: values.address,
          location: values.location,
        },
        products: values.products,
      };

      await updateOrder(updatedOrder);
      setEditVisible(false);
      message.success('订单信息更新成功');
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleShipOrder = async () => {
    if (!orderId) return;

    try {
      await shipOrder(orderId);
      message.success('订单发货成功');
    } catch (err) {
      message.error('发货失败，请重试');
    }
  };

  // 判断是否可以发货（待处理或已确认状态）
  const canShip = order && order.shippingStatus === '待发货';
  console.log(canShip);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 编辑订单信息模态框 */}
      <Modal
        title="编辑订单信息"
        open={editVisible}
        onCancel={() => {
          setEditVisible(false);
          form.resetFields();
        }}
        okText="保存"
        cancelText="取消"
        onOk={handleSave}
        width={800}
        style={{ top: 20 }}
      >
        <Form form={form} layout="vertical" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* 订单金额信息 */}
          <Card size="small" title="订单金额" style={{ marginBottom: 16 }}>
            <Form.Item
              label="数量"
              name="amount"
              rules={[{ required: true, message: '请输入数量' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="总价"
              name="totalPrice"
              rules={[{ required: true, message: '请输入总价' }]}
            >
              <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
            </Form.Item>
          </Card>

          {/* 配送信息 */}
          <Card size="small" title="配送信息" style={{ marginBottom: 16 }}>
            <Form.Item label="地址信息ID" name="addressInfoId">
              <Input placeholder="地址信息ID" />
            </Form.Item>

            <Form.Item
              label="收件人姓名"
              name="name"
              rules={[{ required: true, message: '请输入收件人姓名' }]}
            >
              <Input placeholder="收件人姓名" />
            </Form.Item>

            <Form.Item
              label="联系电话"
              name="phone"
              rules={[{ required: true, message: '请输入联系电话' }]}
            >
              <Input placeholder="联系电话" />
            </Form.Item>

            <Form.Item
              label="详细地址"
              name="address"
              rules={[{ required: true, message: '请输入详细地址' }]}
            >
              <Input.TextArea rows={2} placeholder="详细地址" />
            </Form.Item>

            <Form.Item label="位置坐标" required>
              <Space>
                <Form.Item
                  name={['location', 0]}
                  rules={[{ required: true, message: '请输入经度' }]}
                  noStyle
                >
                  <InputNumber placeholder="经度" style={{ width: 150 }} />
                </Form.Item>
                <span>，</span>
                <Form.Item
                  name={['location', 1]}
                  rules={[{ required: true, message: '请输入纬度' }]}
                  noStyle
                >
                  <InputNumber placeholder="纬度" style={{ width: 150 }} />
                </Form.Item>
              </Space>
            </Form.Item>
          </Card>

          {/* 商品列表 */}
          <Card size="small" title="商品列表">
            <Form.List name="products">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card
                      key={key}
                      size="small"
                      style={{ marginBottom: 16 }}
                      extra={
                        fields.length > 1 ? (
                          <Button
                            type="text"
                            danger
                            icon={<Minus size={16} />}
                            onClick={() => remove(name)}
                          />
                        ) : null
                      }
                    >
                      <Form.Item
                        {...restField}
                        name={[name, 'productId']}
                        label="商品ID"
                        rules={[{ required: true, message: '请输入商品ID' }]}
                      >
                        <Input placeholder="商品ID" />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        label="商品名称"
                        rules={[{ required: true, message: '请输入商品名称' }]}
                      >
                        <Input placeholder="商品名称" />
                      </Form.Item>

                      <Form.Item {...restField} name={[name, 'description']} label="商品描述">
                        <Input.TextArea rows={2} placeholder="商品描述" />
                      </Form.Item>

                      <Space style={{ width: '100%' }} size="middle">
                        <Form.Item
                          {...restField}
                          name={[name, 'price']}
                          label="单价"
                          rules={[{ required: true, message: '请输入单价' }]}
                          style={{ flex: 1 }}
                        >
                          <InputNumber
                            min={0}
                            precision={2}
                            style={{ width: '100%' }}
                            prefix="¥"
                            placeholder="单价"
                          />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'amount']}
                          label="数量"
                          rules={[{ required: true, message: '请输入数量' }]}
                          style={{ flex: 1 }}
                        >
                          <InputNumber min={1} style={{ width: '100%' }} placeholder="数量" />
                        </Form.Item>
                      </Space>
                    </Card>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<Plus size={16} />}>
                      添加商品
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Card>
        </Form>
      </Modal>

      {/* 错误提示 */}
      {error && <Alert title="Error" description={error} type="error" showIcon />}

      <main className="ml-60 px-10 py-6">
        <div className="flex flex-row justify-between gap-4">
          <TopBar title={`订单详情 - ${orderId || ''}`} />

          <div className="flex flex-row gap-4">
            {/* 返回订单列表按钮 */}
            <Button onClick={() => navigate('/merchant/orders/list')} color="primary">
              <ArrowLeft size={18} />
              <span>返回订单列表</span>
            </Button>

            {/* 编辑按钮 */}
            <Button
              type="primary"
              onClick={() => setEditVisible(true)}
              disabled={!order || loading}
            >
              编辑订单
            </Button>

            {/* 模拟发货按钮 */}
            {canShip && (
              <Button
                type="primary"
                danger
                icon={<Truck size={18} />}
                onClick={handleShipOrder}
                disabled={loading}
                loading={loading}
              >
                模拟发货
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="mt-6 text-center" style={{ color: 'var(--color-text-secondary)' }}>
            加载中...
          </div>
        ) : !order ? (
          <div className="mt-6 text-center" style={{ color: 'var(--color-text-secondary)' }}>
            暂无订单数据
          </div>
        ) : (
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
                  {order.products && order.products.length > 0 ? (
                    <>
                      {order.products.map((product, index) => (
                        <div
                          key={product.productId || index}
                          className="flex items-center justify-between border-b border-gray-100 pb-4"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{product.name}</div>
                            {product.description && (
                              <div className="mt-1 text-sm text-gray-500">
                                {product.description}
                              </div>
                            )}
                            <div className="mt-1 text-sm text-gray-500">
                              数量：x{product.amount}
                            </div>
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            ¥{product.price.toFixed(2)}
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between border-t-2 border-gray-200 pt-4">
                        <span className="text-lg font-semibold text-gray-700">总计</span>
                        <span className="text-2xl font-bold text-blue-600">
                          ¥{order.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="py-4 text-center text-gray-500">暂无商品信息</div>
                  )}
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
                    <span className="font-medium text-gray-900">{order.orderId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">下单时间</span>
                    <span className="font-medium text-gray-900">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString('zh-CN') : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">订单状态</span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : order.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-700'
                            : order.status === 'delivered'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {order.status === 'pending'
                        ? '待处理'
                        : order.status === 'confirmed'
                          ? '已确认'
                          : order.status === 'delivered'
                            ? '已送达'
                            : order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">用户名称</span>
                    <span className="font-medium text-gray-900">{order.userName || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">商品数量</span>
                    <span className="font-medium text-gray-900">{order.amount || 0}</span>
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
                  {order.addressInfo ? (
                    <>
                      <div>
                        <div className="text-sm text-gray-500">姓名</div>
                        <div className="mt-1 font-medium text-gray-900">
                          {order.addressInfo.name || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">联系电话</div>
                        <div className="mt-1 font-medium text-gray-900">
                          {order.addressInfo.phone || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">地址</div>
                        <div className="mt-1 font-medium text-gray-900">
                          {order.addressInfo.address || '-'}
                        </div>
                      </div>
                      {order.addressInfo.location && (
                        <div>
                          <div className="text-sm text-gray-500">位置坐标</div>
                          <div className="mt-1 font-medium text-gray-900">
                            [{order.addressInfo.location[0]}, {order.addressInfo.location[1]}]
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-4 text-center text-gray-500">暂无收件人信息</div>
                  )}
                </div>
              </div>

              {/* 配送时间线 */}
              <div className="rounded-xl bg-white p-6 shadow-sm">
                {order.timeline && order.timeline.length > 0 ? (
                  <TimeLine
                    steps={order.timeline.map((item, index) => {
                      const timeStr = item.time || '';
                      const timeParts = timeStr.split(' ');
                      const isLast = index === order.timeline.length - 1;
                      return {
                        id: `${item.shippingStatus}-${index}`,
                        status: item.shippingStatus,
                        date: timeParts[0] || timeStr.split('T')[0] || '',
                        time: timeParts[1] || timeStr.split('T')[1]?.split('.')[0] || timeStr,
                        description: item.description || '',
                        completed: !isLast,
                        current: isLast,
                      };
                    })}
                  />
                ) : (
                  <TimeLine steps={MOCK_PACKAGE_DATA.steps} />
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

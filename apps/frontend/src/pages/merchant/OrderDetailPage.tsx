import { TopBar } from '@/components/merchantComponents/TopBar';
import { useParams, useNavigate } from 'react-router';
import Sidebar from '@/components/merchantComponents/Sidebar';
import { ArrowLeft, Package, MapPin, Truck, Hash } from 'lucide-react';
import { TimeLine } from '@/components/merchantComponents/TimeLine';
import { MOCK_PACKAGE_DATA } from '@/constants';
import { Button, Form, Modal, Input, InputNumber, Space, Card, message, Select } from 'antd';
import { useEffect, useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useShippingStore } from '@/store/useShippingStore';//import shipping store
import { useOrderDetailStore } from '@/store/useOrderDetailStore';//import order detail store

import RouteMap from '@/components/RouteMap'; // 导入RouteMap组件
import { orderStatusColors } from '@/theme/theme';
import type { ShipOrderParams } from '@/store/useOrderDetailStore';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [editVisible, setEditVisible] = useState(false);
  const [shipModalVisible, setShipModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [shipForm] = Form.useForm();

  const { order, loading, fetchOrderDetail, updateOrder, shipOrder } = useOrderDetailStore();
  const { logisticsProviderList, getLogisticsProviderList } = useShippingStore();

  const buttonStyle = orderStatusColors[order?.status as keyof typeof orderStatusColors] || orderStatusColors.default;

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
        
        name: order.shippingTo?.name,
        phone: order.shippingTo?.phone,
        address: order.shippingTo?.address,
        location: order.shippingTo?.location || [0, 0],
        products: order.products || [],
      });
    }
  }, [editVisible, order, form]);

  // 当发货弹窗打开且供应商列表加载完成时，自动选中第一个供应商
  useEffect(() => {
    if (shipModalVisible && logisticsProviderList.length > 0) {
      // 确保在下一个事件循环中设置值，让 Modal 和 Form 完全渲染
      const timer = setTimeout(() => {
        const currentValue = shipForm.getFieldValue('logisticsId');
        const firstProvider = logisticsProviderList[0];
        const firstId = String(firstProvider.logisticsId); // 使用 logisticsId 而不是 id
        
        console.log('=== Select Value Debug ===');
        console.log('Current form value:', currentValue, 'type:', typeof currentValue);
        console.log('First provider:', firstProvider.name, 'logisticsId:', firstId, 'original id type:', typeof firstProvider.logisticsId);
        console.log('All providers:', logisticsProviderList.map(p => ({ name: p.name, logisticsId: String(p.logisticsId) })));
        
        // 如果当前没有值，则设置为第一个供应商
        if (!currentValue) {
          console.log('Setting form value to:', firstId);
          shipForm.setFieldsValue({ logisticsId: firstId });
          
          // 验证设置是否成功
          setTimeout(() => {
            const newValue = shipForm.getFieldValue('logisticsId');
            console.log('After setFieldsValue, form value is:', newValue, 'type:', typeof newValue);
          }, 50);
        } else {
          console.log('Form already has value:', currentValue);
        }
      }, 150);
      return () => clearTimeout(timer);
    } else if (shipModalVisible && logisticsProviderList.length === 0) {
      // 如果弹窗打开但没有供应商，清空表单
      shipForm.setFieldsValue({ logisticsId: undefined });
    }
  }, [shipModalVisible, logisticsProviderList, shipForm]);

  // 根据订单状态和发货状态确定当前位置
  const getCurrentLocation = () => {
    if (!order) return null;

    // 如果订单已送达，使用收货地址作为当前位置
    if (order.status === '已签收' || order.status === 'delivered') {
      return order.shippingTo?.location || order.shippingTo?.location;
    }

    // 如果订单已发货但未送达，使用发货地址作为起点（或根据实际情况调整）
    if (order.status === '运输中' || order.status === '已发货') {
      return order.shippingFrom?.location || order.shippingFrom?.location;
    }

    // 默认使用发货地址
    return order.shippingFrom?.location || order.addressInfo?.location;
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (!order) return;

      const updatedOrder = {
        ...order,
        amount: values.amount,
        totalPrice: values.totalPrice,
        shippingTo: {
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

  // 打开发货弹窗
  const handleOpenShipModal = async () => {
    setShipModalVisible(true);
    shipForm.resetFields();
  
    try {
      await getLogisticsProviderList(); // 加载供应商列表
      
      // 获取最新的供应商列表
      const list = useShippingStore.getState().logisticsProviderList;
      console.log('供应商列表:', list);
  
      if (list.length === 0) {
        message.warning("暂无物流供应商，请添加后再发货");
      }
      // 注意：初始值设置已移至 useEffect，这里不需要手动设置
  
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : err instanceof Error
          ? err.message
          : '获取供应商失败';
      message.error(errorMessage);
    }
  };
  

  // 关闭发货弹窗
  const handleCloseShipModal = () => {
    setShipModalVisible(false);
    shipForm.resetFields();
  };

  // 提交发货
  const handleShipOrder = async () => {
    if (!orderId) return;

    try {
      // 验证表单并获取值
      const values = await shipForm.validateFields();
      
      if (!values.logisticsId) {
        message.error("请选择物流供应商");
        return;
      }

      const params: ShipOrderParams = {
        orderId: orderId,
        logisticsId: values.logisticsId,
      };

      await shipOrder(params);
      message.success('订单发货成功');
      handleCloseShipModal();
      // shipOrder 方法内部已经会自动重新获取订单详情
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        // 表单验证错误，不需要显示错误消息
        return;
      }
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : err instanceof Error
          ? err.message
          : '发货失败，请重试';
      message.error(errorMessage);
    }
  };

  // 判断是否可以发货（待处理或已确认状态）
  const canShip = order && order.shippingStatus === '待发货';


  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      {/* 发货弹窗 */}
      <Modal
        title="订单发货"
        open={shipModalVisible}
        onCancel={handleCloseShipModal}
        onOk={handleShipOrder}
        okText="确认发货"
        cancelText="取消"
        confirmLoading={loading}
        width={500}
      >
        <Form form={shipForm} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            label="物流供应商"
            name="logisticsId"
            rules={[{ required: true, message: '请选择物流供应商' }]}
          >
            <Select
              placeholder="请选择物流供应商"
              style={{ width: "100%" }}
              loading={loading}
              showSearch={false}
              allowClear={false}
              notFoundContent={loading ? '加载中...' : '暂无物流供应商'}
              options={logisticsProviderList?.map(p => {
                const id = String(p.logisticsId); // 使用 logisticsId 而不是 id
                console.log('Mapping provider:', p.name, 'logisticsId:', id, 'original id type:', typeof p.logisticsId);
                return {
                  label: p.name,
                  value: id,
                };
              }) || []}
            />
          </Form.Item>
          {logisticsProviderList.length === 0 && !loading && (
            <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fff7e6', borderRadius: 4, border: '1px solid #ffd591' }}>
              <div style={{ fontSize: 12, color: '#d46b08' }}>
                提示：暂无物流供应商，请先添加物流供应商
              </div>
            </div>
          )}
        </Form>
      </Modal>

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
                onClick={handleOpenShipModal}
                disabled={loading}
              >
                发货
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

              {/* 配送轨迹 - 替换为RouteMap组件 */}
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
                      showInfoCard={true}
                      distance={order.distance}
                      estimatedTime={order.estimatedTime}
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
                <div className="mt-4 text-sm text-gray-500">
                  {order.status === '待发货'
                    ? '等待发货'
                    : order.status === '已揽收'
                      ? '包裹已发出，正在运输中'
                      : order.status === '运输中'
                        ? '包裹正在运输途中'
                        : order.status === '已签收'
                          ? '包裹已送达'
                          : '配送状态未知'}
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
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor: buttonStyle.bg,
                        color: buttonStyle.text,
                        border: buttonStyle.border,
                      }}

                    >
                      {order.shippingStatus || '未知'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">用户名称</span>
                    <span className="font-medium text-gray-900">{order.userName || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">用户ID</span>
                    <span className="font-medium text-gray-900">{order.userId || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">商品数量</span>
                    <span className="font-medium text-gray-900">{order.amount || 0}</span>
                  </div>
                </div>
              </div>

              {/* 发货地址和收货地址信息 */}
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  <h2 className="text-xl font-semibold">配送地址</h2>
                </div>
                <div className="space-y-4">
                  {/* 发货地址 */}
                  {order.shippingFrom && (
                    <div>
                      <div className="mb-3 text-sm font-medium text-gray-700">发货地址</div>
                      <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
                        {order.shippingFrom.name && (
                          <div>
                            <div className="text-xs text-gray-500">联系人</div>
                            <div className="mt-1 text-sm font-medium text-gray-900">
                              {order.shippingFrom.name}
                            </div>
                          </div>
                        )}
                        {order.shippingFrom.phone && (
                          <div>
                            <div className="text-xs text-gray-500">联系电话</div>
                            <div className="mt-1 text-sm font-medium text-gray-900">
                              {order.shippingFrom.phone}
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-xs text-gray-500">详细地址</div>
                          <div className="mt-1 text-sm font-medium text-gray-900">
                            {order.shippingFrom.address || '-'}
                          </div>
                        </div>
                    
                      </div>
                    </div>
                  )}

                  {/* 收货地址 */}
                  {order.shippingTo && (
                    <div>
                      <div className="mb-3 text-sm font-medium text-gray-700">收货地址</div>
                      <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
                        <div>
                          <div className="text-xs text-gray-500">收件人姓名</div>
                          <div className="mt-1 text-sm font-medium text-gray-900">
                            {order.shippingTo.name || '-'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">联系电话</div>
                          <div className="mt-1 text-sm font-medium text-gray-900">
                            {order.shippingTo.phone || '-'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">详细地址</div>
                          <div className="mt-1 text-sm font-medium text-gray-900">
                            {order.shippingTo.address || '-'}
                          </div>
                        </div>
    
                      </div>
                    </div>
                  )}

                  {/* 如果没有独立的发货/收货地址，显示收件人信息 */}
                  {!order.shippingFrom && !order.shippingTo && order.addressInfo && (
                    <div>
                      <div className="mb-2 text-sm font-medium text-gray-700">收件人信息</div>
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm text-gray-500">姓名</div>
                          <div className="mt-1 font-medium text-gray-900">
                            {order.shippingTo.name || '-'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">联系电话</div>
                          <div className="mt-1 font-medium text-gray-900">
                            {order.shippingTo.phone || '-'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">地址</div>
                          <div className="mt-1 font-medium text-gray-900">
                            {order.shippingTo.address || '-'}
                          </div>
                        </div>
                      
                      </div>
                    </div>
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

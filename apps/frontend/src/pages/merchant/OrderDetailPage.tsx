import { TopBar } from '@/components/merchantComponents/TopBar';
import { useParams, useNavigate } from 'react-router';
import Sidebar from '@/components/merchantComponents/Sidebar';
import { ArrowLeft, Package, MapPin, Truck, Hash, Save, X } from 'lucide-react';
import { TimeLine } from '@/components/merchantComponents/TimeLine';
import { MOCK_PACKAGE_DATA } from '@/constants';
import {
  Button,
  Form,
  Modal,
  Input,
  InputNumber,
  message,
  Select,
  Tooltip,
  Drawer,
  Space,
} from 'antd';
import { Plus } from 'lucide-react';
import ProductCard from '@/components/merchantComponents/product/ProductCard';
import type { MerchantProduct } from '@/components/merchantComponents/product/ProductFormModal';
import { merchantAxiosInstance } from '@/utils/axios';
import { useEffect, useState } from 'react';
import { useShippingStore } from '@/store/useShippingStore'; //import shipping store
import { useOrderDetailStore } from '@/store/useOrderDetailStore'; //import order detail store

import RouteMap from '@/components/RouteMap'; // 导入RouteMap组件
import { orderStatusColors } from '@/theme/theme';
import type { ShipOrderParams } from '@/store/useOrderDetailStore';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [shipModalVisible, setShipModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [shipForm] = Form.useForm();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [merchantProducts, setMerchantProducts] = useState<MerchantProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { order, loading, fetchOrderDetail, updateOrder, shipOrder } = useOrderDetailStore();
  const { logisticsProviderList, getLogisticsProviderList } = useShippingStore();

  const buttonStyle =
    orderStatusColors[order?.status as keyof typeof orderStatusColors] || orderStatusColors.default;

  const fetchMerchantProducts = async () => {
    try {
      const res = await merchantAxiosInstance.get('/products');
      const products = (res.data?.data || []) as MerchantProduct[];
      setMerchantProducts(products);
      return products;
    } catch {
      message.error('获取商品列表失败');
      return [];
    }
  };

  const handleOpenDrawer = () => {
    setDrawerVisible(true);
    fetchMerchantProducts();
    setSelectedIds(new Set());
    setQuantities({});
  };

  const handleDrawerSubmit = () => {
    const currentProducts = form.getFieldValue('products') || [];
    const newProducts = [];

    for (const id of selectedIds) {
      const product = merchantProducts.find((p) => p.productId === id);
      if (product) {
        newProducts.push({
          productId: product.productId,
          name: product.name,
          price: product.price,
          quantity: quantities[id] || 1,
          description: product.description,
          amount: product.amount, // 添加库存数量
        });
      }
    }

    const merged = [...currentProducts];
    newProducts.forEach((newItem) => {
      const index = merged.findIndex((item) => item.productId === newItem.productId);
      if (index >= 0) {
        merged[index] = {
          ...merged[index],
          quantity: (merged[index].quantity || 0) + newItem.quantity,
          amount: newItem.amount, // 更新库存数量
        };
      } else {
        merged.push(newItem);
      }
    });

    form.setFieldValue('products', merged);
    setDrawerVisible(false);
    message.success(`已添加 ${newProducts.length} 个商品`);
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail(orderId);
      console.log(order?.status);
    }
  }, [orderId, fetchOrderDetail, order?.status]);

  // 当进入编辑模式时，初始化表单数据
  useEffect(() => {
    let mounted = true;

    const initForm = async () => {
      if (isEditing && order) {
        // 获取最新的商品列表以补充库存信息
        const products = await fetchMerchantProducts();
        if (!mounted) return;

        form.setFieldsValue({
          products:
            order.products?.map((p) => {
              const merchantProduct = products.find((mp) => mp.productId === p.productId);
              return {
                productId: p.productId,
                quantity: p.quantity,
                name: p.name,
                price: p.price,
                description: p.description,
                amount: merchantProduct?.amount, // 库存数量
              };
            }) || [],
        });
      }
    };

    initForm();

    return () => {
      mounted = false;
    };
  }, [isEditing, order, form]);

  // 当发货弹窗打开且供应商列表加载完成时，自动选中第一个供应商
  useEffect(() => {
    if (shipModalVisible && logisticsProviderList.length > 0) {
      // 确保在下一个事件循环中设置值，让 Modal 和 Form 完全渲染
      const timer = setTimeout(() => {
        const currentValue = shipForm.getFieldValue('logisticsId');
        const firstProvider = logisticsProviderList[0];
        const firstId = String(firstProvider.logisticsId); // 使用 logisticsId 而不是 id

        // 如果当前没有值，则设置为第一个供应商
        if (!currentValue) {
          shipForm.setFieldsValue({ logisticsId: firstId });
        }
      }, 150);
      return () => clearTimeout(timer);
    } else if (shipModalVisible && logisticsProviderList.length === 0) {
      // 如果弹窗打开但没有供应商，清空表单
      shipForm.setFieldsValue({ logisticsId: undefined });
    }
  }, [shipModalVisible, logisticsProviderList, shipForm]);

  // 根据订单状态和发货状态确定当前位置
  const getCurrentLocation = (): [number, number] | undefined => {
    if (!order) return undefined;

    // 如果订单已送达，使用收货地址作为当前位置
    if (order.status === '已签收' || order.status === 'delivered') {
      return order.shippingTo?.location;
    }

    // 如果订单已发货但未送达，使用发货地址作为起点（或根据实际情况调整）
    if (order.status === '运输中' || order.status === '已发货') {
      return order.shippingFrom?.location;
    }

    // 默认使用发货地址
    return order.shippingFrom?.location;
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (!order) return;

      const updatedOrder = {
        ...order,
        products: values.products,
      };

      console.log('updatedOrder', updatedOrder);

      await updateOrder(updatedOrder);
      setIsEditing(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    form.resetFields();
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
        message.warning('暂无物流供应商，请添加后再发货');
      }
      // 注意：初始值设置已移至 useEffect，这里不需要手动设置
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'response' in err
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
        message.error('请选择物流供应商');
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
      const errorMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : '发货失败，请重试';
      message.error(errorMessage);
    }
  };

  // 判断是否可以发货（待处理或已确认状态）
  const canShip = order && order.shippingStatus === '待发货';
  // 判断是否可以编辑（只有待发货状态可以编辑）
  const canEdit = order && (order.status === '待发货' || order.status === 'PENDING');

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
              style={{ width: '100%' }}
              loading={loading}
              showSearch={false}
              allowClear={false}
              notFoundContent={loading ? '加载中...' : '暂无物流供应商'}
              options={
                logisticsProviderList?.map((p) => {
                  const id = String(p.logisticsId); // 使用 logisticsId 而不是 id
                  return {
                    label: p.name,
                    value: id,
                  };
                }) || []
              }
            />
          </Form.Item>
          {logisticsProviderList.length === 0 && !loading && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                backgroundColor: '#fff7e6',
                borderRadius: 4,
                border: '1px solid #ffd591',
              }}
            >
              <div style={{ fontSize: 12, color: '#d46b08' }}>
                提示：暂无物流供应商，请先添加物流供应商
              </div>
            </div>
          )}
        </Form>
      </Modal>

      {/* 选择商品抽屉 */}
      <Drawer
        title="选择商品"
        size={400}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        extra={
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleDrawerSubmit}>
              确认添加 ({selectedIds.size})
            </Button>
          </Space>
        }
      >
        {merchantProducts.map((p) => (
          <div className="mb-4">
            <ProductCard
              key={p.productId}
              product={p}
              mode="selection"
              selected={selectedIds.has(p.productId!)}
              selectionQuantity={quantities[p.productId!] || 1}
              onSelect={(selected) => {
                const newSet = new Set(selectedIds);
                if (selected) newSet.add(p.productId!);
                else newSet.delete(p.productId!);
                setSelectedIds(newSet);

                if (selected && !quantities[p.productId!]) {
                  setQuantities((prev) => ({ ...prev, [p.productId!]: 1 }));
                }
              }}
              onQuantityChange={(q) => {
                setQuantities((prev) => ({ ...prev, [p.productId!]: q }));
              }}
            />
          </div>
        ))}
      </Drawer>

      {/* 编辑订单信息模态框 */}
      {/* <EditOrderModal ... /> */}

      <main className="ml-60 px-10 py-6">
        <div className="flex flex-row justify-between gap-4">
          <TopBar title={`订单详情 - ${orderId || ''}`} />

          <div className="flex flex-row gap-4">
            {/* 返回订单列表按钮 */}
            <Button onClick={() => navigate('/merchant/orders/list')} color="primary">
              <ArrowLeft size={18} />
              <span>返回订单列表</span>
            </Button>

            {/* 编辑/保存按钮 */}
            {isEditing ? (
              <>
                <Button onClick={handleCancelEdit}>
                  <X size={18} className="mr-1" />
                  取消
                </Button>
                <Button type="primary" onClick={handleSave} loading={loading}>
                  <Save size={18} className="mr-1" />
                  保存
                </Button>
              </>
            ) : (
              <Tooltip title={!canEdit ? '当前订单状态不可编辑' : ''}>
                <Button
                  type="primary"
                  onClick={() => setIsEditing(true)}
                  disabled={!canEdit || loading}
                >
                  编辑订单
                </Button>
              </Tooltip>
            )}

            {/* 模拟发货按钮 */}
            {canShip && !isEditing && (
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
                  {isEditing ? (
                    <Form form={form} component={false}>
                      <Form.List name="products">
                        {(fields) => (
                          <>
                            {fields.map(({ key, name, ...restField }) => {
                              const product = form.getFieldValue(['products', name]);
                              console.log('product', product);
                              return (
                                <div
                                  key={key}
                                  className="flex items-center justify-between border-b border-gray-100 pb-4"
                                >
                                  <div className="flex-1">
                                    {/* 隐藏字段存储必要信息 */}
                                    <Form.Item {...restField} name={[name, 'productId']} hidden>
                                      <Input />
                                    </Form.Item>
                                    <div className="font-medium text-gray-900">{product?.name}</div>
                                    {product?.description && (
                                      <div className="mt-1 text-sm text-gray-500">
                                        {product.description}
                                      </div>
                                    )}
                                    <div className="mt-2 flex items-center gap-2">
                                      <span className="text-sm text-gray-500">数量：</span>
                                      <Form.Item
                                        {...restField}
                                        name={[name, 'quantity']}
                                        rules={[{ required: true, message: '请输入数量' }]}
                                        style={{ marginBottom: 0 }}
                                      >
                                        <InputNumber
                                          min={1}
                                          max={product.amount + product.quantity}
                                          size="small"
                                        />
                                      </Form.Item>
                                    </div>
                                  </div>
                                  <div className="text-lg font-semibold text-gray-900">
                                    ¥{Number(product?.price || 0).toFixed(2)}
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        )}
                      </Form.List>
                      <Button
                        type="dashed"
                        onClick={handleOpenDrawer}
                        block
                        icon={<Plus size={16} />}
                        style={{ marginTop: 16 }}
                      >
                        添加商品
                      </Button>
                    </Form>
                  ) : order.products && order.products.length > 0 ? (
                    <>
                      {order.products.map((product, index, arr) => (
                        <div
                          key={product.productId || index}
                          className={`flex items-center justify-between border-gray-100 ${
                            index !== arr.length - 1 ? 'border-b pb-4' : ''
                          }`}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{product.name}</div>
                            {product.description && (
                              <div className="mt-1 text-sm text-gray-500">
                                {product.description}
                              </div>
                            )}
                            <div className="mt-1 text-sm text-gray-500">
                              数量：x{product.quantity}
                            </div>
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            ¥{Number(product?.price || 0).toFixed(2)}
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
                      orderId={order.orderId}
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
                      status={order.status}
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
                      {order.status || '未知'}
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
                        currentLocation: false,
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

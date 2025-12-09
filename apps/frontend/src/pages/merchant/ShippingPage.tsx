import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Input, message, Popconfirm, Empty, Spin, Tag } from 'antd';
import { Plus, Edit, Trash2, MapPin, User, Phone } from 'lucide-react';
import { TopBar } from '@/components/merchantComponents/TopBar';
import { useShippingStore } from '@/store/useShippingStore';
import type {
  AddressInfo,
  CreateAddressRequest,
  UpdateAddressRequest,
} from '@/types/orderDetailInterface';

const ShippingPage: React.FC = () => {
  const [editVisible, setEditVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressInfo | null>(null);
  const [form] = Form.useForm();

  const {
    shippingList,
    loading,
    fetchShippingList,
    addShipping,
    updateShipping,
    deleteShipping,
    defaultAddress,
    fetchDefaultAddress,
    setDefaultAddress,
  } = useShippingStore();

  // 组件挂载时获取地址列表和默认地址
  useEffect(() => {
    fetchShippingList();
    fetchDefaultAddress();
  }, [fetchShippingList, fetchDefaultAddress]);

  // 打开添加地址模态框
  const handleAdd = () => {
    setEditingAddress(null);
    form.resetFields();
    setEditVisible(true);
  };

  // 打开编辑地址模态框
  const handleEdit = (address: AddressInfo) => {
    setEditingAddress(address);
    form.setFieldsValue({
      name: address.name,
      phone: address.phone,
      address: address.address,
    });
    setEditVisible(true);
  };

  // 保存地址（新增或编辑）
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (editingAddress) {
        // 编辑模式：传入包含 addressInfoId, name, phone, address 的完整对象
        const updateData: UpdateAddressRequest = {
          addressInfoId: editingAddress.addressInfoId,
          name: values.name,
          phone: values.phone,
          address: values.address,
        };
        await updateShipping(updateData);
        message.success('地址更新成功');
      } else {
        // 新增模式：只发送 name, phone, address 三个字段
        const createData: CreateAddressRequest = {
          name: values.name,
          phone: values.phone,
          address: values.address,
        };
        await addShipping(createData);
        message.success('地址添加成功');
      }

      setEditVisible(false);
      form.resetFields();
      setEditingAddress(null);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || '操作失败';
      message.error(errorMessage);
      console.error('保存地址失败:', error);
    }
  };

  // 删除地址
  const handleDelete = async (addressId: string) => {
    try {
      await deleteShipping(addressId);
      message.success('地址删除成功');
    } catch (error) {
      message.error('删除失败，请重试');
    }
  };

  // 设为默认地址
  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefaultAddress(addressId);
      message.success('设置默认地址成功');
    } catch (error) {
      message.error('设置失败，请重试');
    }
  };

  // 取消编辑
  const handleCancel = () => {
    setEditVisible(false);
    form.resetFields();
    setEditingAddress(null);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-layout)' }}>
      <main className="ml-60 flex-1 px-10 py-6">
        <div className="mb-8 flex items-center justify-between">
          <TopBar title="发货地址管理" />
          <Button type="primary" icon={<Plus size={18} />} onClick={handleAdd} size="large">
            添加地址
          </Button>
        </div>

        {/* 加载状态 */}
        {loading && shippingList.length === 0 ? (
          <div className="mt-6 flex justify-center">
            <Spin size="large" />
          </div>
        ) : shippingList.length === 0 ? (
          <Empty
            description="暂无地址数据"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 60 }}
          >
            <Button type="primary" icon={<Plus size={18} />} onClick={handleAdd}>
              添加第一个地址
            </Button>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {shippingList.map((address) => (
              <Card
                key={address.addressInfoId}
                className="transition-shadow hover:shadow-lg"
                variant="borderless"
                actions={[
                  <Button
                    key="edit"
                    type="text"
                    icon={<Edit size={16} />}
                    onClick={() => handleEdit(address)}
                  >
                    编辑
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title="确定要删除这个地址吗？"
                    description="删除后无法恢复"
                    onConfirm={() => handleDelete(address.addressInfoId)}
                    okText="确定"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                  >
                    <Button type="text" danger icon={<Trash2 size={16} />}>
                      删除
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <div className="space-y-3">
                  {/* 收件人信息 */}
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-blue-100 p-2">
                      <User className="var(--color-primary) h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-gray-900">{address.name}</div>
                        {defaultAddress?.addressInfoId === address.addressInfoId && (
                          <Tag color="blue" className="rounded-full px-2 text-xs">
                            默认
                          </Tag>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                        <Phone className="h-3 w-3" />
                        <span>{address.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* 地址信息 */}
                  <div className="flex items-start gap-3 border-t border-gray-100 pt-3">
                    <div className="rounded-full bg-green-100 p-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                    </div>

                    <div className="flex-1 text-sm text-gray-700">{address.address}</div>

                    {defaultAddress?.addressInfoId !== address.addressInfoId && (
                      <Button size="small" onClick={() => handleSetDefault(address.addressInfoId)}>
                        设为默认
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 编辑/添加地址模态框 */}
        <Modal
          title={editingAddress ? '编辑地址' : '添加地址'}
          open={editVisible}
          onCancel={handleCancel}
          onOk={handleSave}
          okText="保存"
          cancelText="取消"
          width={600}
          confirmLoading={loading}
        >
          <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
            <Form.Item
              label="收件人姓名"
              name="name"
              rules={[
                { required: true, message: '请输入收件人姓名' },
                { max: 50, message: '姓名不能超过50个字符' },
              ]}
            >
              <Input placeholder="请输入收件人姓名" prefix={<User size={16} />} />
            </Form.Item>

            <Form.Item
              label="联系电话"
              name="phone"
              rules={[
                { required: true, message: '请输入联系电话' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' },
              ]}
            >
              <Input placeholder="请输入手机号码" prefix={<Phone size={16} />} />
            </Form.Item>

            <Form.Item
              label="详细地址"
              name="address"
              rules={[
                { required: true, message: '请输入详细地址' },
                { max: 200, message: '地址不能超过200个字符' },
              ]}
            >
              <Input.TextArea rows={3} placeholder="请输入详细地址" showCount maxLength={200} />
            </Form.Item>
          </Form>
        </Modal>
      </main>
    </div>
  );
};

export default ShippingPage;

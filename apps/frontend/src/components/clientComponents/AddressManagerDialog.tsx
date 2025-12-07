import { useEffect, useState } from 'react';
import { Drawer, Button, Empty, Form, Input, Popconfirm, Spin, message } from 'antd';
import { Plus, MapPin, User, Phone, Search } from 'lucide-react';
import { useShippingStore } from '@/store/useShippingStore';
import type {
  AddressInfo,
  CreateAddressRequest,
  UpdateAddressRequest,
} from '@/types/orderDetailInterface';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';

interface AddressManagerDialogProps {
  open: boolean;
  onClose: () => void;
  isSelect?: boolean;
  onSelect?: (address: AddressInfo) => void;
}

function AddressManagerDialog({
  open,
  onClose,
  isSelect = false,
  onSelect,
}: AddressManagerDialogProps) {
  const {
    shippingList,
    loading,
    error,
    fetchShippingList,
    addShipping,
    updateShipping,
    deleteShipping,
  } = useShippingStore();
  const [form] = Form.useForm();
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [editingAddress, setEditingAddress] = useState<AddressInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchShippingList();
    }
  }, [open, fetchShippingList]);

  useEffect(() => {
    if (error) {
      message.error(String(error));
    }
  }, [error]);

  const handleAdd = () => {
    setEditingAddress(null);
    form.resetFields();
    setMode('form');
  };

  const handleEdit = (address: AddressInfo) => {
    setEditingAddress(address);
    form.setFieldsValue({ name: address.name, phone: address.phone, address: address.address });
    setMode('form');
  };

  const handleDelete = async (id: string) => {
    await deleteShipping(id);
  };

  const handleCardClick = (address: AddressInfo) => {
    if (!isSelect) return;
    setSelectedAddressId(address.addressInfoId);
    if (onSelect) {
      onSelect(address);
      onClose();
    }
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    if (editingAddress) {
      const data: UpdateAddressRequest = {
        addressInfoId: editingAddress.addressInfoId,
        name: values.name,
        phone: values.phone,
        address: values.address,
      };
      const updated = await updateShipping(data);
      setEditingAddress(updated);
    } else {
      const data: CreateAddressRequest = {
        name: values.name,
        phone: values.phone,
        address: values.address,
      };
      await addShipping(data);
    }
    setMode('list');
    form.resetFields();
    setEditingAddress(null);
  };

  const handleCancelForm = () => {
    setMode('list');
    form.resetFields();
    setEditingAddress(null);
  };

  const filteredList = shippingList.filter((addr) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      addr.name.toLowerCase().includes(q) ||
      addr.phone.includes(searchQuery) ||
      addr.address.toLowerCase().includes(q)
    );
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      closable={{ placement: 'end' }}
      title="地址管理"
      placement="right"
      size={500}
      destroyOnHidden
    >
      {mode === 'list' ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Input
                placeholder="搜索姓名、电话或地址..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                prefix={<Search className="h-4 w-4 text-gray-400" />}
              />
            </div>
            <Button type="primary" icon={<Plus size={16} />} onClick={handleAdd} className="gap-2">
              添加地址
            </Button>
          </div>

          {loading && shippingList.length === 0 ? (
            <div className="mt-6 flex justify-center">
              <Spin size="large" />
            </div>
          ) : filteredList.length === 0 ? (
            <Empty description="暂无地址" image={Empty.PRESENTED_IMAGE_SIMPLE}>
              <Button type="primary" icon={<Plus size={16} />} onClick={handleAdd}>
                添加第一个地址
              </Button>
            </Empty>
          ) : (
            <div className="space-y-4">
              {filteredList.map((address) => (
                <div
                  key={address.addressInfoId}
                  className={
                    `cursor-pointer rounded-xl bg-white p-4 shadow-sm ` +
                    (isSelect && selectedAddressId === address.addressInfoId
                      ? 'ring-2 ring-blue-500'
                      : '')
                  }
                  onClick={() => handleCardClick(address)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{address.name}</h3>
                        </div>
                      </div>
                      <div className="space-y-2 pl-2">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Phone className="h-4 w-4 shrink-0" />
                          <span className="text-sm">{address.phone}</span>
                        </div>
                        <div className="flex items-start gap-2 text-gray-500">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                          <span className="text-sm">{address.address}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!isSelect && (
                        <Button
                          type="default"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(address);
                          }}
                          className="hover:bg-gray-100"
                          icon={<EditOutlined />}
                        />
                      )}
                      <Popconfirm
                        title="确定删除此地址？"
                        placement="bottomRight"
                        onConfirm={() => handleDelete(address.addressInfoId)}
                        okText="确定"
                        cancelText="取消"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          type="default"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Popconfirm>
                      {isSelect && (
                        <Button
                          type="primary"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelect) {
                              onSelect(address);
                              onClose();
                            }
                          }}
                        >
                          选择
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
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
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button onClick={handleCancelForm}>取消</Button>
            <Button type="primary" loading={loading} onClick={handleSave}>
              保存
            </Button>
          </div>
        </Form>
      )}
    </Drawer>
  );
}

export default AddressManagerDialog;

import { Modal, Form, Card, Input, InputNumber, Button, Space, type FormInstance } from 'antd';
import { Minus, Plus } from 'lucide-react';
import React, { useEffect } from 'react';
import type { OrderDetail } from '@/types/orderDetailInterface';

interface EditOrderModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: () => void;
  form: FormInstance;
  order: OrderDetail | null;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({ open, onCancel, onOk, form, order }) => {
  // 当 Modal 打开时初始化表单数据
  useEffect(() => {
    if (open && order) {
      form.setFieldsValue({
        totalAmount: order.amount,
        totalPrice: order.totalPrice,

        addressInfoId: order.shippingTo?.addressInfoId,
        name: order.shippingTo?.name,
        phone: order.shippingTo?.phone,
        address: order.shippingTo?.address,
        location: order.shippingTo?.location || [0, 0],
        products: order.products || [],
      });
    }
  }, [open, order, form]);

  return (
    <Modal
      title="编辑订单信息"
      open={open}
      onCancel={onCancel}
      okText="保存"
      cancelText="取消"
      onOk={onOk}
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
                        name={[name, 'quantity']}
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
  );
};

export default EditOrderModal;

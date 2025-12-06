import { useEffect, useMemo, useState } from 'react';
import { Modal, Form, Input, InputNumber, Upload, Space, Image } from 'antd';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { merchantAxiosInstance, commonAxiosInstance } from '@/utils/axios';
import { BASE_SERVER_URL } from '@/config';

export interface MerchantProduct {
  productId?: string;
  name: string;
  description?: string;
  price: number;
  amount: number;
  imageUrl?: string;
  merchantId?: string;
}

interface ProductFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialProduct?: MerchantProduct | null;
  onCancel: () => void;
  onSuccess: (product: MerchantProduct) => void;
}

export default function ProductFormModal(props: ProductFormModalProps) {
  const { open, mode, initialProduct, onCancel, onSuccess } = props;
  const [form] = Form.useForm<MerchantProduct>();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const previewUrl = Form.useWatch('imageUrl', form);
  const isEdit = useMemo(() => mode === 'edit', [mode]);

  useEffect(() => {
    if (open) {
      if (initialProduct) {
        form.setFieldsValue({
          productId: initialProduct.productId,
          name: initialProduct.name,
          description: initialProduct.description,
          price: initialProduct.price,
          amount: initialProduct.amount,
          imageUrl: initialProduct.imageUrl,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, initialProduct, form]);

  async function handleSubmit() {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload: Record<string, unknown> = {
        name: values.name.trim(),
        description: values.description ?? undefined,
        price: Number(values.price),
        amount: Number(values.amount),
        imageUrl: values.imageUrl ?? undefined,
      };
      if (isEdit && initialProduct?.productId) {
        payload['productId'] = initialProduct.productId;
      }
      const res = await merchantAxiosInstance.post('/products', payload);
      const product = (res.data?.data || payload) as MerchantProduct;
      onSuccess(product);
    } finally {
      setSubmitting(false);
    }
  }

  async function uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const res = await commonAxiosInstance.post('/upload/product', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.url as string;

      if (url) {
        form.setFieldsValue({ imageUrl: url });
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? '编辑商品' : '新增商品'}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText={isEdit ? '保存' : '创建'}
      cancelText="取消"
      destroyOnHidden
      width={640}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="商品名称"
          rules={[{ required: true, message: '请输入商品名称' }]}
        >
          <Input maxLength={100} allowClear />
        </Form.Item>
        <Form.Item name="description" label="商品描述">
          <Input.TextArea rows={3} maxLength={500} allowClear />
        </Form.Item>
        <Space size="large" style={{ width: '100%' }}>
          <Form.Item
            style={{ flex: 1 }}
            name="price"
            label="价格"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} precision={2} />
          </Form.Item>
          <Form.Item
            style={{ flex: 1 }}
            name="amount"
            label="库存"
            rules={[{ required: true, message: '请输入库存' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} precision={0} />
          </Form.Item>
        </Space>
        <Form.Item name="imageUrl" label="商品图片">
          <Space>
            <Upload
              name="avatar"
              listType="picture-card"
              accept="image/*"
              showUploadList={false}
              customRequest={async (options) => {
                const { file, onError, onSuccess } = options;
                try {
                  await uploadImage(file as File);
                  onSuccess?.({}, new XMLHttpRequest());
                } catch (e) {
                  onError?.(e as Error);
                }
              }}
            >
              <button style={{ border: 0, background: 'none' }} type="button">
                {uploading ? <LoadingOutlined /> : <PlusOutlined />}
                <div style={{ marginTop: 8 }}>
                  {uploading ? '上传中' : previewUrl ? '更新商品图片' : '上传商品图片'}
                </div>
              </button>
            </Upload>
            {previewUrl ? (
              <Image
                width={96}
                height={96}
                src={`${BASE_SERVER_URL}${previewUrl}`}
                style={{ objectFit: 'cover' }}
              />
            ) : null}
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}

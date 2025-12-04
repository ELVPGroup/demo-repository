import { Form, Input, Button } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { commonAxiosInstance } from '../utils/axios';
import { useUserStore } from '../store/userStore';

type RegisterFieldType = {
  name?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
};

interface RegisterFormProps {
  role: string;
}

export function RegisterForm({ role }: RegisterFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (values: RegisterFieldType) => {
    try {
      setLoading(true);
      const response = await commonAxiosInstance.post('/register', {
        name: values.name,
        phone: values.phone,
        password: values.password,
        side: role,
      });
      const result = response.data;
      if (!result || !result.data) {
        return;
      }
      const { id, name, side, token } = result.data;
      useUserStore.getState().login({ id, name, side, token }, false);
      navigate(`/${side}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form<RegisterFieldType>
      form={form}
      name="register"
      layout="vertical"
      onFinish={handleRegister}
    >
      <Form.Item<RegisterFieldType>
        label="姓名"
        name="name"
        rules={[{ required: true, message: '请输入姓名' }]}
      >
        <Input placeholder="请输入姓名" />
      </Form.Item>

      <Form.Item<RegisterFieldType>
        label="手机号"
        name="phone"
        rules={[
          { required: true, message: '请输入手机号' },
          {
            pattern: /^1[3-9]\d{9}$/,
            message: '请输入有效的手机号',
          },
        ]}
      >
        <Input placeholder="请输入手机号" />
      </Form.Item>

      <Form.Item<RegisterFieldType>
        label="密码"
        name="password"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6个字符' },
        ]}
      >
        <Input.Password placeholder="请输入密码" />
      </Form.Item>

      <Form.Item<RegisterFieldType>
        label="确认密码"
        name="confirmPassword"
        rules={[
          { required: true, message: '请确认密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('两次输入密码不一致'));
            },
          }),
        ]}
      >
        <Input.Password placeholder="请再次输入密码" />
      </Form.Item>

      <Form.Item label={null}>
        <Button type="primary" htmlType="submit" loading={loading} block>
          注册
        </Button>
      </Form.Item>
    </Form>
  );
}

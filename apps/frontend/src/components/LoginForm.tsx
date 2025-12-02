import { Form, Input, Checkbox, Button } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { apiAxiosInstance } from '../utils/axios';
import { useUserStore } from '../store/userStore';

type LoginFieldType = {
  phone?: string;
  password?: string;
  remember?: boolean;
};

interface LoginFormProps {
  role: string;
}

export function LoginForm({ role }: LoginFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (values: LoginFieldType) => {
    try {
      setLoading(true);
      const response = await apiAxiosInstance.post('/login', {
        phone: values.phone,
        password: values.password,
        side: role,
      });
      const result = response.data;
      if (!result || !result.data) {
        return;
      }
      const { id, name, side, token } = result.data;
      const remember = Boolean(values.remember);
      useUserStore.getState().login({ id, name, side, token }, remember);
      navigate(`/${side}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form<LoginFieldType> form={form} name="login" layout="vertical" onFinish={handleLogin}>
      <Form.Item<LoginFieldType>
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

      <Form.Item<LoginFieldType>
        label="密码"
        name="password"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Input.Password placeholder="请输入密码" />
      </Form.Item>

      <Form.Item<LoginFieldType> name="remember" valuePropName="checked" label={null}>
        <Checkbox>7天内保持登录</Checkbox>
      </Form.Item>

      <Form.Item label={null}>
        <Button type="primary" htmlType="submit" loading={loading} block>
          登录
        </Button>
      </Form.Item>
    </Form>
  );
}

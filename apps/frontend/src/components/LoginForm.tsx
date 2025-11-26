import { Form, Input, Checkbox, Button, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router';

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
      // 暂时使用fetch，后续接入axios
      const response = await fetch('/baseUrl/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: values.phone,
          password: values.password,
          side: role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        message.error(data.message || '登录失败');
        return;
      }

      message.success('登录成功');
      // 保存 token
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      // 跳转到对应的页面
      navigate(`/${role}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '登录失败');
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

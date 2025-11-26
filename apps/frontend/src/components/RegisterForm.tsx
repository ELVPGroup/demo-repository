import { Form, Input, Button, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router';

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
      // 暂时使用fetch，后续接入axios
      const response = await fetch('/baseUrl/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          phone: values.phone,
          password: values.password,
          side: role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        message.error(data.message || '注册失败');
        return;
      }

      message.success('注册成功');
      // 保存 token
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      // 跳转到对应的页面
      navigate(`/${role}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '注册失败');
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

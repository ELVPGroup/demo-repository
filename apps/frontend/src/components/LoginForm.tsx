import { Form, Input, Checkbox, Button, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { commonAxiosInstance } from '@/utils/axios';

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
      
      // 使用 axios 发送登录请求
      const response = await commonAxiosInstance.post('/login', {
        phone: values.phone,
        password: values.password,
        side: role,
      });

      const data = response.data.data;

      // 检查响应数据
      if (data.token) {
        // 保存 token 到 localStorage
        localStorage.setItem('token', data.token);
        
        // 如果勾选了"7天内保持登录"，可以设置过期时间
        if (values.remember) {
          // 可以在这里添加额外的逻辑，比如设置 token 过期时间
          localStorage.setItem('token_expires', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
        }
        
        message.success('登录成功');
        // 跳转到对应的页面
        navigate(`/${role}`);
      } else {
        message.error(data.message || '登录失败：未获取到 token');
      }
    } catch (error: unknown) {
      // 处理错误响应
      let errorMessage = '登录失败，请重试';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
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

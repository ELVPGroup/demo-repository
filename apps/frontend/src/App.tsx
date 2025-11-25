import { Card, Segmented, type SegmentedProps, Form, Input, Checkbox, Button, Select } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router';

const options: SegmentedProps['options'] = [
  {
    label: '登录',
    value: 'login',
  },
  {
    label: '注册',
    value: 'register',
  },
];

type FieldType = {
  phone?: string;
  password?: string;
  remember?: string;
};

function App() {
  const [value, setValue] = useState<SegmentedProps['value']>('login');
  const [role, setRole] = useState<string>('merchant');
  const navigate = useNavigate();

  return (
    <>
      <Select
        defaultValue={role}
        style={{ width: 120 }}
        onChange={setRole}
        className="absolute top-4 left-4"
        options={[
          { value: 'merchant', label: '商家端' },
          { value: 'client', label: '用户端' },
        ]}
      />
      <main className="flex h-screen flex-col items-center justify-center">
        <h1 className="mb-4 text-2xl font-bold">电商物流配送可视化平台</h1>

        <Card style={{ width: 500 }}>
          <Segmented options={options} block value={value} onChange={setValue} />
          {value === 'login' ? (
            <section className="mt-4">
              <Form name="login" layout="vertical">
                <Form.Item<FieldType> label="手机号" name="phone">
                  <Input />
                </Form.Item>
                <Form.Item<FieldType> label="密码" name="password">
                  <Input.Password />
                </Form.Item>
                <Form.Item<FieldType> name="remember" valuePropName="checked" label={null}>
                  <Checkbox>7天内保持登录</Checkbox>
                </Form.Item>
                <Form.Item label={null}>
                  <Button type="primary" htmlType="submit" onClick={() => navigate(`/${role}`)}>
                    登录
                  </Button>
                </Form.Item>
              </Form>
            </section>
          ) : (
            <div>
              <p>TODO：注册表单</p>
            </div>
          )}
        </Card>
      </main>
    </>
  );
}

export default App;

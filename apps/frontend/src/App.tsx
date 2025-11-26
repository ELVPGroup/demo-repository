import { Button, Card, Segmented, type SegmentedProps, Select } from 'antd';
import { useState } from 'react';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
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

function App() {
  const [value, setValue] = useState<SegmentedProps['value']>('login');
  const [role, setRole] = useState<string>('merchant');
  const navigate = useNavigate();

  return (
    <>
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <Select
          defaultValue={role}
          style={{ width: 120 }}
          onChange={setRole}
          options={[
            { value: 'merchant', label: '商家端' },
            { value: 'client', label: '用户端' },
          ]}
        />
        {/* 开发阶段跳转用 */}
        <Button size="small" onClick={() => navigate(`/${role}`)}>
          不登录进入
        </Button>
      </div>
      <main className="flex h-screen flex-col items-center justify-center">
        <h1 className="mb-4 text-2xl font-bold">电商物流配送可视化平台</h1>

        <Card style={{ width: 500 }}>
          <Segmented options={options} block value={value} onChange={setValue} />
          <section className="mt-4">
            {value === 'login' ? <LoginForm role={role} /> : <RegisterForm role={role} />}
          </section>
        </Card>
      </main>
    </>
  );
}

export default App;

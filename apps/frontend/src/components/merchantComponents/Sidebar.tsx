import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Layout, Menu, Button } from 'antd';
import type { MenuProps } from 'antd';
import { Home, ClipboardList, Package, LogOut, MapPinHouse } from 'lucide-react';
import { Logo } from './Logo';
import { useUserStore } from '@/store/userStore';

const { Sider } = Layout;

const Sidebar: React.FC = () => {
  const base = '/merchant';
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // 清除本地存储的认证信息（如果有）
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    sessionStorage.clear();
    useUserStore.getState().logout();

    // 跳转到首页
    navigate('/');
  };

  // 根据当前路径确定选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === `${base}` || path === `${base}/`) {
      return 'dashboard';
    } else if (path.startsWith(`${base}/orders`)) {
      return 'orders';
    } else if (path.startsWith(`${base}/delivery-management`)) {
      return 'delivery';
    } else if (path.startsWith(`${base}/shipping`)) {
      return 'shipping';
    }
    return 'dashboard';
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <Home size={20} />,
      label: '数据分析',
      onClick: () => navigate(`${base}`),
    },
    {
      key: 'orders',
      icon: <ClipboardList size={20} />,
      label: '订单管理',
      onClick: () => navigate(`${base}/orders/list`),
    },
    {
      key: 'delivery',
      icon: <Package size={20} />,
      label: '配送管理',
      onClick: () => navigate(`${base}/delivery-management`),
    },
    {
      key: 'shipping',
      icon: <MapPinHouse size={20} />,
      label: '地址管理',
      onClick: () => navigate(`${base}/shipping`),
    },
  ];

  return (
    <Sider
      width={240}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        height: '100vh',
        backgroundColor: '#F3F4F6',
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: '16px',
        }}
      >
        {/* LOGO */}
        <div style={{ marginBottom: '32px' }}>
          <Logo />
        </div>

        {/* 导航菜单 */}
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            flex: 1,
          }}
        />

        {/* 底部 logout */}
        <Button
          type="default"
          danger
          icon={<LogOut size={18} />}
          onClick={handleLogout}
          block
          style={{
            marginTop: 'auto',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          退出登录
        </Button>
      </div>
    </Sider>
  );
};

export default Sidebar;

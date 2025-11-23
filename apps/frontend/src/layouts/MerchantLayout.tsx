import { NavLink, Outlet } from 'react-router';

const MerchantLayout = () => {
  const orderId = 'ORD-123456';
  return (
    <div>
      <header className="flex gap-4">
        <nav>
          <NavLink to="/merchant">商家端Layout</NavLink>
        </nav>
        <nav>
          <NavLink to="/merchant/delivery-management">配送管理</NavLink>
        </nav>
        <nav>
          <NavLink to={`/merchant/orders/${orderId}`}>订单详情（{orderId}）</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default MerchantLayout;

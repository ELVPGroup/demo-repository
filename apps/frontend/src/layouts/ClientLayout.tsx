import { Outlet } from 'react-router';
import { NavLink } from 'react-router';

const ClientLayout = () => {
  const orderId = 'ORD-123456';
  return (
    <div>
      <header className="flex gap-4">
        <nav>
          <NavLink to="/client">用户端 Layout</NavLink>
        </nav>
        <nav>
          <NavLink to={`/client/orders/${orderId}`}>订单详情（{orderId}）</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default ClientLayout;

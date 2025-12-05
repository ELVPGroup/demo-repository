import { Outlet } from 'react-router';

const ClientLayout = () => {
  return (
    <div>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default ClientLayout;

import { Sidebar } from 'lucide-react';
import { Outlet } from 'react-router';


const MerchantLayout = () => {
  return (
    <div>
      <Sidebar />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default MerchantLayout;

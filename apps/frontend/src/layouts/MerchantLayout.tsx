import Sidebar from "@/components/merchantComponents/Sidebar";
import { Outlet } from "react-router";

const MerchantLayout: React.FC = () => {
  return(
  <div>
    <Sidebar />
    <main>
        <Outlet />
    </main>
  </div>
  );
};

export default MerchantLayout;
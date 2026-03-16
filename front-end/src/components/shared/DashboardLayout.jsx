import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import "./DashboardLayout.css";

const DashboardLayout = ({ children, sidebarLinks }) => {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        {sidebarLinks && <Sidebar links={sidebarLinks} />}
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;

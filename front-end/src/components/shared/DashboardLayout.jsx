import Navbar from "./Navbar";
import "./DashboardLayout.css";

const DashboardLayout = ({ children }) => {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <main className="dashboard-main">
        <div className="dashboard-content page-enter">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

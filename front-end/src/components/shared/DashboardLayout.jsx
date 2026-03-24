import Navbar from "./Navbar";
import "./DashboardLayout.css";

const DashboardLayout = ({ children }) => (
  <div className="dashboard-layout">
    <Navbar />
    <main className="dashboard-layout__main">{children}</main>
    <footer className="dashboard-layout__footer">
      <p>Tutoring App</p>
    </footer>
  </div>
);

export default DashboardLayout;

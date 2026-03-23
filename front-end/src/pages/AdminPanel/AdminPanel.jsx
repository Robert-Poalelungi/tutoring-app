import { useState } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import UsersTab from "./components/UsersTab";
import FacultiesTab from "./components/FacultiesTab";
import SpecializationsTab from "./components/SpecializationsTab";
import CoursesTab from "./components/CoursesTab";
import ConsultationsTab from "./components/ConsultationsTab";
import SettingsTab from "./components/SettingsTab";
import "./AdminPanel.css";

const TABS = [
  { key: "utilizatori", label: "Utilizatori" },
  { key: "facultati", label: "Facultăți" },
  { key: "specializari", label: "Specializări" },
  { key: "materii", label: "Materii" },
  { key: "consultatii", label: "Consultații" },
  { key: "setari", label: "Setări" },
];

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("utilizatori");

  return (
    <DashboardLayout>
      <div className="admin-panel">
        <div className="admin-panel__header">
          <h1 className="admin-panel__title">Panou administrare</h1>
        </div>
        <div className="admin-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`admin-tab ${activeTab === tab.key ? "admin-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="admin-panel__content">
          {activeTab === "utilizatori" && <UsersTab />}
          {activeTab === "facultati" && <FacultiesTab />}
          {activeTab === "specializari" && <SpecializationsTab />}
          {activeTab === "materii" && <CoursesTab />}
          {activeTab === "consultatii" && <ConsultationsTab />}
          {activeTab === "setari" && <SettingsTab />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminPanel;

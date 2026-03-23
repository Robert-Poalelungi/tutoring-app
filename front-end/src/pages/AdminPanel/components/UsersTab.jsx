import { useState, useEffect } from "react";
import { getUsers, updateUserRole, deleteUser } from "../../../services/adminService";
import "./AdminTab.css";

const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (userId, role) => {
    try {
      await updateUserRole(userId, role);
      load();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Ștergi utilizatorul?")) return;
    try {
      await deleteUser(userId);
      load();
    } catch (err) { console.error(err); }
  };

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="admin-tab__loading">Se încarcă...</div>;

  return (
    <div className="admin-tab-content">
      <div className="admin-toolbar">
        <input
          className="admin-search"
          type="text"
          placeholder="Caută după nume sau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="admin-count">{filtered.length} utilizatori</span>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nume</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Onboarding</th>
              <th>Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>{u.name || "—"}</td>
                <td className="admin-table__email">{u.email}</td>
                <td>
                  <select
                    className="admin-role-select"
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  >
                    <option value="student">Student</option>
                    <option value="professor">Profesor</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <span className={`admin-badge ${u.onboardingCompleted ? "admin-badge--success" : "admin-badge--warning"}`}>
                    {u.onboardingCompleted ? "Da" : "Nu"}
                  </span>
                </td>
                <td>
                  <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleDelete(u.id)}>
                    Șterge
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTab;

import { useState, useEffect } from "react";
import { getFaculties, createFaculty, updateFaculty, deleteFaculty } from "../../../services/adminService";
import "./AdminTab.css";

const FacultiesTab = () => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", abbreviation: "" });
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    try {
      const res = await getFaculties();
      setFaculties(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateFaculty(editingId, form);
        setEditingId(null);
      } else {
        await createFaculty(form);
      }
      setForm({ name: "", abbreviation: "" });
      load();
    } catch (err) { console.error(err); }
  };

  const startEdit = (f) => {
    setEditingId(f.id);
    setForm({ name: f.name, abbreviation: f.abbreviation });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ștergi facultatea?")) return;
    try { await deleteFaculty(id); load(); } catch (err) { console.error(err); }
  };

  if (loading) return <div className="admin-tab__loading">Se încarcă...</div>;

  return (
    <div className="admin-tab">
      <form className="admin-inline-form" onSubmit={handleSubmit}>
        <input className="admin-input" type="text" placeholder="Nume facultate" value={form.name} onChange={set("name")} required />
        <input className="admin-input admin-input--short" type="text" placeholder="Abrev." value={form.abbreviation} onChange={set("abbreviation")} required />
        <button type="submit" className="admin-btn admin-btn--primary">{editingId ? "Salvează" : "+ Adaugă"}</button>
        {editingId && <button type="button" className="admin-btn admin-btn--secondary" onClick={() => { setEditingId(null); setForm({ name: "", abbreviation: "" }); }}>Anulează</button>}
      </form>
      <div className="admin-list">
        {faculties.map((f) => (
          <div key={f.id} className="admin-list-item">
            <span className="admin-list-item__abbr">{f.abbreviation}</span>
            <span className="admin-list-item__name">{f.name}</span>
            <div className="admin-list-item__actions">
              <button className="admin-action-btn" onClick={() => startEdit(f)}>Editează</button>
              <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleDelete(f.id)}>Șterge</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FacultiesTab;

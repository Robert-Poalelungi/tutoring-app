import { useState, useEffect } from "react";
import { getCourses, createCourse, updateCourse, deleteCourse } from "../../../services/adminService";
import "./AdminTab.css";

const CoursesTab = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", abbreviation: "" });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    try { const res = await getCourses(); setCourses(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) { await updateCourse(editingId, form); setEditingId(null); }
      else { await createCourse(form); }
      setForm({ name: "", abbreviation: "" });
      load();
    } catch (err) { console.error(err); }
  };

  const startEdit = (c) => { setEditingId(c.id); setForm({ name: c.name, abbreviation: c.abbreviation || "" }); };
  const handleDelete = async (id) => {
    if (!window.confirm("Ștergi materia?")) return;
    try { await deleteCourse(id); load(); } catch (err) { console.error(err); }
  };

  const filtered = courses.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="admin-tab__loading">Se încarcă...</div>;

  return (
    <div className="admin-tab">
      <form className="admin-inline-form" onSubmit={handleSubmit}>
        <input className="admin-input" type="text" placeholder="Nume materie" value={form.name} onChange={set("name")} required />
        <input className="admin-input admin-input--short" type="text" placeholder="Abrev." value={form.abbreviation} onChange={set("abbreviation")} />
        <button type="submit" className="admin-btn admin-btn--primary">{editingId ? "Salvează" : "+ Adaugă"}</button>
        {editingId && <button type="button" className="admin-btn admin-btn--secondary" onClick={() => { setEditingId(null); setForm({ name: "", abbreviation: "" }); }}>Anulează</button>}
      </form>
      <div className="admin-filter-row">
        <input className="admin-search" type="text" placeholder="Caută materie..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="admin-list">
        {filtered.map((c) => (
          <div key={c.id} className="admin-list-item">
            <span className="admin-list-item__abbr">{c.abbreviation || "—"}</span>
            <span className="admin-list-item__name">{c.name}</span>
            <div className="admin-list-item__actions">
              <button className="admin-action-btn" onClick={() => startEdit(c)}>Editează</button>
              <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleDelete(c.id)}>Șterge</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoursesTab;

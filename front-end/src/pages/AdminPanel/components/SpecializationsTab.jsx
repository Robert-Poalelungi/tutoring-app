import { useState, useEffect } from "react";
import { getSpecializations, createSpecialization, updateSpecialization, deleteSpecialization, getFaculties } from "../../../services/adminService";
import "./AdminTab.css";

const SpecializationsTab = () => {
  const [specializations, setSpecializations] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", abbreviation: "", facultyId: "" });
  const [editingId, setEditingId] = useState(null);
  const [filterFacultyId, setFilterFacultyId] = useState("");

  const load = async () => {
    try {
      const [specRes, facRes] = await Promise.all([getSpecializations(), getFaculties()]);
      setSpecializations(specRes.data);
      setFaculties(facRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) { await updateSpecialization(editingId, form); setEditingId(null); }
      else { await createSpecialization(form); }
      setForm({ name: "", abbreviation: "", facultyId: "" });
      load();
    } catch (err) { console.error(err); }
  };

  const startEdit = (s) => { setEditingId(s.id); setForm({ name: s.name, abbreviation: s.abbreviation, facultyId: s.facultyId }); };
  const handleDelete = async (id) => { if (!window.confirm("Ștergi specializarea?")) return; try { await deleteSpecialization(id); load(); } catch (err) { console.error(err); } };

  const filtered = filterFacultyId ? specializations.filter((s) => String(s.facultyId) === filterFacultyId) : specializations;

  if (loading) return <div className="admin-tab__loading">Se încarcă...</div>;

  return (
    <div className="admin-tab">
      <form className="admin-inline-form" onSubmit={handleSubmit}>
        <select className="admin-input" value={form.facultyId} onChange={set("facultyId")} required>
          <option value="">Selectează facultatea</option>
          {faculties.map((f) => <option key={f.id} value={f.id}>{f.abbreviation} — {f.name}</option>)}
        </select>
        <input className="admin-input" type="text" placeholder="Nume specializare" value={form.name} onChange={set("name")} required />
        <input className="admin-input admin-input--short" type="text" placeholder="Abrev." value={form.abbreviation} onChange={set("abbreviation")} required />
        <button type="submit" className="admin-btn admin-btn--primary">{editingId ? "Salvează" : "+ Adaugă"}</button>
        {editingId && <button type="button" className="admin-btn admin-btn--secondary" onClick={() => { setEditingId(null); setForm({ name: "", abbreviation: "", facultyId: "" }); }}>Anulează</button>}
      </form>
      <div className="admin-filter-row">
        <select className="admin-input admin-input--filter" value={filterFacultyId} onChange={(e) => setFilterFacultyId(e.target.value)}>
          <option value="">Toate facultățile</option>
          {faculties.map((f) => <option key={f.id} value={f.id}>{f.abbreviation}</option>)}
        </select>
      </div>
      <div className="admin-list">
        {filtered.map((s) => (
          <div key={s.id} className="admin-list-item">
            <span className="admin-list-item__abbr">{s.abbreviation}</span>
            <span className="admin-list-item__name">{s.name}</span>
            <span className="admin-list-item__meta">{faculties.find((f) => f.id === s.facultyId)?.abbreviation}</span>
            <div className="admin-list-item__actions">
              <button className="admin-action-btn" onClick={() => startEdit(s)}>Editează</button>
              <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleDelete(s.id)}>Șterge</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpecializationsTab;

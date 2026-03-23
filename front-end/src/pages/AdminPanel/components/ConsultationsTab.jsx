import { useState, useEffect } from "react";
import { getUsers } from "../../../services/adminService";
import { getCourses, getAdminConsultations, adminCreateConsultation, adminCancelConsultation, adminDeleteConsultation } from "../../../services/adminService";
import "./AdminTab.css";

const STATUS_LABELS = {
  published: "Publicată",
  cancelled: "Anulată",
  completed: "Finalizată",
  draft: "Draft",
};

const STATUS_CLASS = {
  published: "badge--completed",
  cancelled: "badge--danger",
  completed: "badge--student",
  draft: "badge--draft",
};

const defaultForm = {
  professorId: "",
  courseId: "",
  date: "",
  time: "",
  duration: "120",
  type: "online",
  room: "",
  meetingLink: "",
  serie: "Toate",
};

const ConsultationsTab = () => {
  const [consultations, setConsultations] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      const [consRes, usersRes, coursesRes] = await Promise.all([
        getAdminConsultations(),
        getUsers(),
        getCourses(),
      ]);
      setConsultations(Array.isArray(consRes.data) ? consRes.data : []);
      setProfessors((usersRes.data || []).filter((u) => u.role === "professor"));
      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminCreateConsultation({
        professorId: Number(form.professorId),
        courseId: Number(form.courseId),
        date: form.date,
        time: form.time,
        duration: Number(form.duration) || 120,
        type: form.type,
        room: form.type === "fizic" ? form.room : undefined,
        meetingLink: form.type === "online" ? form.meetingLink : undefined,
        serie: form.serie || "Toate",
        status: "published",
      });
      setForm(defaultForm);
      setShowForm(false);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Anulezi această consultație?")) return;
    try { await adminCancelConsultation(id); load(); } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ștergi definitiv această consultație?")) return;
    try { await adminDeleteConsultation(id); load(); } catch (err) { console.error(err); }
  };

  const filtered = consultations.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.course?.name?.toLowerCase().includes(q) ||
      `${c.professor?.firstName || ""} ${c.professor?.lastName || ""}`.toLowerCase().includes(q) ||
      c.date?.includes(q)
    );
  });

  if (loading) return <div className="admin-tab__loading">Se încarcă...</div>;

  return (
    <div className="admin-tab-content">
      <div className="admin-filter-row">
        <input
          className="admin-search"
          type="text"
          placeholder="Caută după materie, profesor, dată..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="admin-btn admin-btn--primary"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Închide" : "+ Consultație nouă"}
        </button>
      </div>

      {showForm && (
        <form className="admin-consultation-form" onSubmit={handleSubmit}>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Profesor</label>
              <select value={form.professorId} onChange={set("professorId")} required>
                <option value="">Selectează profesorul</option>
                {professors.map((p) => (
                  <option key={p.id} value={p.id}>
                    {`${p.firstName || ""} ${p.lastName || ""}`.trim() || p.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-form-group">
              <label>Materie</label>
              <select value={form.courseId} onChange={set("courseId")} required>
                <option value="">Selectează materia</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="admin-form-group">
              <label>Seria</label>
              <input type="text" value={form.serie} onChange={set("serie")} placeholder="ex: A sau Toate" />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Data</label>
              <input type="date" value={form.date} onChange={set("date")} required min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="admin-form-group">
              <label>Ora</label>
              <input type="time" value={form.time} onChange={set("time")} required />
            </div>
            <div className="admin-form-group">
              <label>Durată (min)</label>
              <input type="number" value={form.duration} onChange={set("duration")} min="15" step="15" />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Tip</label>
              <div className="admin-type-toggle">
                {["online", "fizic"].map((t) => (
                  <label key={t} className={`admin-type-option ${form.type === t ? "admin-type-option--active" : ""}`}>
                    <input type="radio" name="cons-type" value={t} checked={form.type === t} onChange={set("type")} />
                    {t === "online" ? "Online" : "Fizic"}
                  </label>
                ))}
              </div>
            </div>
            <div className="admin-form-group">
              <label>{form.type === "online" ? "Link întâlnire" : "Sală"}</label>
              {form.type === "online" ? (
                <input type="url" value={form.meetingLink} onChange={set("meetingLink")} placeholder="https://meet.google.com/..." />
              ) : (
                <input type="text" value={form.room} onChange={set("room")} placeholder="ex: A101" />
              )}
            </div>
          </div>
          <div className="admin-form-actions">
            <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setShowForm(false)}>Anulează</button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={submitting}>
              {submitting ? "Se creează..." : "Creează consultație"}
            </button>
          </div>
        </form>
      )}

      <div className="admin-list">
        {filtered.length === 0 && (
          <div className="admin-empty">Nu există consultații.</div>
        )}
        {filtered.map((c) => (
          <div key={c.id} className="admin-list-item admin-list-item--consultation">
            <div className="admin-list-item__meta">
              <span className={`badge ${STATUS_CLASS[c.status] || "badge--draft"}`}>
                {STATUS_LABELS[c.status] || c.status}
              </span>
              <span className="admin-list-item__date">{c.date} {c.time?.slice(0, 5)}</span>
            </div>
            <div className="admin-list-item__main">
              <span className="admin-list-item__name">{c.course?.name || "—"}</span>
              <span className="admin-list-item__sub">
                Prof. {`${c.professor?.firstName || ""} ${c.professor?.lastName || ""}`.trim() || "—"} · {c.type} · Seria {c.serie}
              </span>
            </div>
            <div className="admin-list-item__actions">
              {c.status === "published" && (
                <button className="admin-action-btn" onClick={() => handleCancel(c.id)}>Anulează</button>
              )}
              <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleDelete(c.id)}>Șterge</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConsultationsTab;

import { useState, useEffect } from "react";
import { getSettings, updateSettings } from "../../../services/adminService";
import "./AdminTab.css";

const SettingsTab = () => {
  const [form, setForm] = useState({ winterStart: "", winterEnd: "", summerStart: "", summerEnd: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings()
      .then((res) => {
        const s = res.data;
        setForm({
          winterStart: s.winterStart?.slice(0, 10) || "",
          winterEnd: s.winterEnd?.slice(0, 10) || "",
          summerStart: s.summerStart?.slice(0, 10) || "",
          summerEnd: s.summerEnd?.slice(0, 10) || "",
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await updateSettings(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="admin-tab__loading">Se încarcă...</div>;

  return (
    <div className="admin-tab">
      <div className="settings-card">
        <h3 className="settings-card__title">Sesiunea activă</h3>
        <p className="settings-card__desc">Configurează datele sesiunilor de examene în care apar consultațiile în calendar.</p>
        <form className="settings-form" onSubmit={handleSave}>
          <div className="settings-row">
            <div className="form-group">
              <label>Sesiune iarnă — start</label>
              <input type="date" value={form.winterStart} onChange={set("winterStart")} />
            </div>
            <div className="form-group">
              <label>Sesiune iarnă — final</label>
              <input type="date" value={form.winterEnd} onChange={set("winterEnd")} />
            </div>
          </div>
          <div className="settings-row">
            <div className="form-group">
              <label>Sesiune vară — start</label>
              <input type="date" value={form.summerStart} onChange={set("summerStart")} />
            </div>
            <div className="form-group">
              <label>Sesiune vară — final</label>
              <input type="date" value={form.summerEnd} onChange={set("summerEnd")} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              {saving ? "Se salvează..." : "Salvează setările"}
            </button>
            {saved && <span style={{ color: "#27ae60", fontSize: "13px", fontWeight: 600 }}>✓ Salvat!</span>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsTab;

import "./ProfileForm.css";

const ProfileForm = ({ form, setForm, faculties, specializations, onSave, saving, saved, userRole }) => {
  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  return (
    <div className="profile-form card">
      <div className="profile-form__title-block">
        <h2 className="profile-form__title">Informații personale</h2>
      </div>
      <form className="profile-form__body" onSubmit={onSave}>
        <div className="form-group">
          <label>Nume complet</label>
          <input
            type="text"
            value={form.name}
            onChange={set("name")}
            placeholder="Prenume Nume"
            required
          />
        </div>

        {userRole === "student" && (
          <>
            <div className="profile-form__row">
              <div className="form-group">
                <label>An de studiu</label>
                <select value={form.studyYear} onChange={set("studyYear")}>
                  <option value="">—</option>
                  {[1,2,3,4].map((y) => <option key={y} value={String(y)}>Anul {y}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Seria</label>
                <input
                  type="text"
                  value={form.serie}
                  onChange={set("serie")}
                  placeholder="ex: A"
                  maxLength={5}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Facultate</label>
              <select value={form.facultyId} onChange={(e) => {
                setForm((p) => ({ ...p, facultyId: e.target.value, specializationId: "" }));
              }}>
                <option value="">Selectează facultatea</option>
                {faculties.map((f) => <option key={f.id} value={String(f.id)}>{f.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Specializare</label>
              <select
                value={form.specializationId}
                onChange={set("specializationId")}
                disabled={!form.facultyId || specializations.length === 0}
              >
                <option value="">
                  {!form.facultyId ? "Alege mai întâi facultatea" : "Selectează specializarea"}
                </option>
                {specializations.map((s) => (
                  <option key={s.id} value={String(s.id)}>{s.name}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="profile-form__actions">
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? "Se salvează..." : saved ? "✓ Salvat!" : "Salvează modificările"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;

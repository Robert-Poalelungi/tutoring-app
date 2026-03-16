import "./ProfileForm.css";

const ProfileForm = ({ form, setForm, faculties, specializations, onSave, saving, userRole }) => {
  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const isStudent = userRole === "student";

  return (
    <form className="profile-form" onSubmit={onSave}>
      <h2 className="profile-form__title">Informații personale</h2>

      <div className="profile-form__grid">
        <div className="form-group">
          <label>Nume complet</label>
          <input
            type="text"
            value={form.name}
            onChange={set("name")}
            placeholder="ex: Ionescu Maria"
          />
        </div>

        {isStudent && (
          <>
            <div className="form-group">
              <label>An de studiu</label>
              <select value={form.studyYear} onChange={set("studyYear")}>
                <option value="">Selectează</option>
                {[1, 2, 3, 4].map((y) => (
                  <option key={y} value={y}>Anul {y}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Seria</label>
              <input
                type="text"
                value={form.serie}
                onChange={set("serie")}
                placeholder="ex: A sau Toate"
              />
            </div>

            <div className="form-group">
              <label>Facultate</label>
              <select value={form.facultyId} onChange={set("facultyId")}>
                <option value="">Selectează facultatea</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Specializare</label>
              <select
                value={form.specializationId}
                onChange={set("specializationId")}
                disabled={!form.facultyId}
              >
                <option value="">Selectează specializarea</option>
                {specializations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      <div className="profile-form__actions">
        <button type="submit" className="btn-save" disabled={saving}>
          {saving ? "Se salvează..." : "Salvează modificările"}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;

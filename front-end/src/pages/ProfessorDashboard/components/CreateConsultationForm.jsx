import { useState } from "react";
import "./CreateConsultationForm.css";

const defaultForm = {
  courseId: "",
  date: "",
  startTime: "",
  endTime: "",
  type: "online",
  location: "",
  studyYear: "1",
  serie: "Toate",
  maxParticipants: "",
  notes: "",
};

const CreateConsultationForm = ({ courses, initialData, onSubmit, onCancel }) => {
  const [form, setForm] = useState(
    initialData
      ? {
          courseId: initialData.courseId || "",
          date: initialData.date || "",
          startTime: initialData.startTime || "",
          endTime: initialData.endTime || "",
          type: initialData.type || "online",
          location: initialData.location || "",
          studyYear: String(initialData.studyYear || "1"),
          serie: initialData.serie || "Toate",
          maxParticipants: initialData.maxParticipants || "",
          notes: initialData.notes || "",
        }
      : defaultForm
  );

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="create-form">
      <div className="create-form__header">
        <h3>{initialData ? "Editează consultație" : "Consultație nouă"}</h3>
        <button type="button" className="create-form__close" onClick={onCancel}>
          <i className="fa-solid fa-xmark" />
        </button>
      </div>
      <form className="create-form__body" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Materie</label>
            <select value={form.courseId} onChange={set("courseId")} required>
              <option value="">Selectează materia</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>An de studiu</label>
            <select value={form.studyYear} onChange={set("studyYear")} required>
              {[1, 2, 3].map((y) => (
                <option key={y} value={y}>
                  Anul {y}
                </option>
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
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Data</label>
            <input
              type="date"
              value={form.date}
              onChange={set("date")}
              min={new Date().toISOString().split("T")[0]}
              required
            />
          </div>
          <div className="form-group">
            <label>Ora start</label>
            <input
              type="time"
              value={form.startTime}
              onChange={set("startTime")}
              required
            />
          </div>
          <div className="form-group">
            <label>Ora final</label>
            <input
              type="time"
              value={form.endTime}
              onChange={set("endTime")}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tip consultație</label>
            <div className="type-toggle">
              {["online", "fizic"].map((t) => (
                <label
                  key={t}
                  className={`type-option ${form.type === t ? "type-option--active" : ""}`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={form.type === t}
                    onChange={set("type")}
                  />
                  {t === "online" ? "Online" : "Fizic"}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>{form.type === "online" ? "Link întâlnire" : "Sală / Locație"}</label>
            <input
              type="text"
              value={form.location}
              onChange={set("location")}
              placeholder={
                form.type === "online"
                  ? "https://meet.google.com/..."
                  : "ex: Sala A101"
              }
            />
          </div>
          <div className="form-group">
            <label>Participanți max</label>
            <input
              type="number"
              value={form.maxParticipants}
              onChange={set("maxParticipants")}
              min="1"
              placeholder="fără limită"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Notițe</label>
          <textarea
            value={form.notes}
            onChange={set("notes")}
            rows={3}
            placeholder="Informații adiționale..."
          />
        </div>

        <div className="create-form__actions">
          <button type="button" className="create-form__btn-cancel" onClick={onCancel}>
            Anulează
          </button>
          <button type="submit" className="create-form__btn-submit">
            {initialData ? "Salvează" : "Creează"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateConsultationForm;

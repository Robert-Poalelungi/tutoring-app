import { useState } from "react";
import { formatDate, getDayName, formatTime } from "../../../utils/formatDate";
import ConsultationDetailsModal from "./ConsultationDetailsModal";
import "./DayConsultationsPanel.css";

const DayConsultationsPanel = ({ date, consultations, loading, user }) => {
  const [selected, setSelected] = useState(null);
  const dateStr = date.toISOString().split("T")[0];

  return (
    <>
      <div className="day-panel card">
        <div className="day-panel__header">
          <div className="day-panel__date-block">
            <p className="day-panel__day-name">{getDayName(dateStr)}</p>
            <h2 className="day-panel__date">{formatDate(dateStr)}</h2>
          </div>
          <div className="day-panel__count-badge">
            {loading ? "…" : consultations.length}
          </div>
        </div>

        <div className="day-panel__list">
          {loading && (
            <div className="loading-spinner" />
          )}

          {!loading && consultations.length === 0 && (
            <div className="empty-state">
              <span className="empty-state__icon">📅</span>
              <span className="empty-state__title">Nicio consultație</span>
              <span>Nu sunt consultații programate pentru această zi.</span>
            </div>
          )}

          {!loading && consultations.map((c) => (
            <div
              key={c.id}
              className={[
                "consult-card",
                c.status === "cancelled" ? "consult-card--cancelled" : "",
                c.status === "completed" ? "consult-card--completed" : "",
                c.type === "online" ? "consult-card--online" : "consult-card--fizic",
              ].filter(Boolean).join(" ")}
            >
              <div className="consult-card__accent" />
              <div className="consult-card__body">
                <div className="consult-card__top">
                  <span className="consult-card__time">
                    {formatTime(c.startTime || c.time)}
                    {c.endTime ? ` – ${formatTime(c.endTime)}` : ""}
                  </span>
                  <div className="consult-card__badges">
                    <span className={`badge badge--${c.type}`}>
                      {c.type === "online" ? "Online" : "Fizic"}
                    </span>
                    {c.status === "cancelled" && (
                      <span className="badge badge--cancelled">Anulat</span>
                    )}
                    {c.status === "completed" && (
                      <span className="badge badge--completed">Finalizat</span>
                    )}
                  </div>
                </div>
                <p className="consult-card__course">{c.course?.name || c.courseName}</p>
                <p className="consult-card__professor">
                  {c.professor?.firstName
                    ? `${c.professor.firstName} ${c.professor.lastName}`
                    : c.professorName || ""}
                </p>
                <button
                  className="consult-card__details-btn"
                  onClick={() => setSelected(c)}
                >
                  Detalii →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <ConsultationDetailsModal
          consultation={selected}
          user={user}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
};

export default DayConsultationsPanel;

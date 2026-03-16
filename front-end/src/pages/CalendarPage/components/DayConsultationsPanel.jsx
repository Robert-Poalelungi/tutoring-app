import { useState } from "react";
import { formatDate, getDayName, formatTime } from "../../../utils/formatDate";
import ConsultationDetailsModal from "./ConsultationDetailsModal";
import "./DayConsultationsPanel.css";

const DayConsultationsPanel = ({ date, consultations, loading, user }) => {
  const [selected, setSelected] = useState(null);

  const dateStr = date.toISOString().split("T")[0];

  return (
    <>
      <div className="day-panel">
        <div className="day-panel__header">
          <p className="day-panel__day-name">{getDayName(dateStr)}</p>
          <h2 className="day-panel__date">{formatDate(dateStr)}</h2>
          <p className="day-panel__count">
            {loading
              ? "Se încarcă..."
              : consultations.length === 0
              ? "Nicio consultație"
              : `${consultations.length} consultație${consultations.length !== 1 ? " " : ""}${consultations.length !== 1 ? "i" : ""}`}
          </p>
        </div>

        <div className="day-panel__list">
          {!loading && consultations.length === 0 && (
            <p className="day-panel__empty">
              Nu există consultații programate pentru această zi.
            </p>
          )}

          {consultations.map((c) => (
            <div
              key={c.id}
              className={[
                "consultation-card-mini",
                c.status === "cancelled" ? "consultation-card-mini--cancelled" : "",
                c.status === "completed" ? "consultation-card-mini--completed" : "",
                c.type === "online" ? "consultation-card-mini--online" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="consultation-card-mini__info">
                <p className="consultation-card-mini__course">
                  {c.course?.name}
                </p>
                <p className="consultation-card-mini__professor">
                  {c.professor?.firstName} {c.professor?.lastName}
                </p>
                <p className="consultation-card-mini__time">
                  {formatTime(c.time)}
                  {c.status === "cancelled" && (
                    <span className="status-badge status-badge--cancelled">Anulat</span>
                  )}
                  {c.status === "completed" && (
                    <span className="status-badge status-badge--completed">Finalizat</span>
                  )}
                </p>
              </div>
              <button
                className="consultation-card-mini__btn"
                onClick={() => setSelected(c)}
              >
                Detalii
              </button>
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

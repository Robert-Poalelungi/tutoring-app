import ConsultationCard from "./ConsultationCard";
import "./ConsultationsContainer.css";

const ConsultationsContainer = ({ consultations, onSelect, emptyIcon = "🗓️", emptyTitle, emptyText, isPast }) => {
  if (!consultations.length) {
    return (
      <div className="empty-state">
        <span className="empty-state__icon">{emptyIcon}</span>
        {emptyTitle && <span className="empty-state__title">{emptyTitle}</span>}
        {emptyText && <span>{emptyText}</span>}
      </div>
    );
  }

  return (
    <div className="consultations-grid">
      {consultations.map((c) => (
        <ConsultationCard key={c.id} consultation={c} onClick={() => onSelect(c)} isPast={isPast} />
      ))}
    </div>
  );
};

export default ConsultationsContainer;

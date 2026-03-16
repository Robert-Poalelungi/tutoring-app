import ConsultationCard from "./ConsultationCard";
import "./ConsultationsContainer.css";

const ConsultationsContainer = ({ consultations, onSelect, emptyMessage }) => {
  if (!consultations || consultations.length === 0) {
    return (
      <div className="consultations-empty">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="consultations-grid">
      {consultations.map((consultation) => (
        <ConsultationCard
          key={consultation.id}
          consultation={consultation}
          onClick={() => onSelect(consultation)}
        />
      ))}
    </div>
  );
};

export default ConsultationsContainer;

import "./ConsultationLegend.css";

const items = [
  { color: "#667eea", label: "Consultație online" },
  { color: "#2e7d32", label: "Consultație fizică" },
  { color: "#c0392b", label: "Anulată" },
  { color: "#27ae60", label: "Finalizată" },
];

const ConsultationLegend = () => {
  return (
    <div className="legend">
      {items.map((item) => (
        <div key={item.label} className="legend__item">
          <span className="legend__dot" style={{ background: item.color }} />
          <span className="legend__label">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default ConsultationLegend;

import "./ConsultationLegend.css";

const LEGEND = [
  { label: "Online", color: "#2e6cb5" },
  { label: "Fizic", color: "#ff9f2f" },
  { label: "Anulat", color: "#e53e3e" },
  { label: "Finalizat", color: "#38a169" },
];

const ConsultationLegend = () => (
  <div className="consult-legend">
    {LEGEND.map(({ label, color }) => (
      <div key={label} className="consult-legend__item">
        <span className="consult-legend__dot" style={{ background: color }} />
        <span>{label}</span>
      </div>
    ))}
  </div>
);

export default ConsultationLegend;

import "./EmailNotificationsToggle.css";

const EmailNotificationsToggle = ({ enabled, onToggle }) => {
  return (
    <div className="email-toggle-card">
      <div className="email-toggle-card__info">
        <h4>Notificări email</h4>
        <p>Primești email-uri cu 24h și 1h înainte de consultație.</p>
      </div>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={!!enabled}
          onChange={onToggle}
        />
        <span className="toggle-slider" />
      </label>
    </div>
  );
};

export default EmailNotificationsToggle;

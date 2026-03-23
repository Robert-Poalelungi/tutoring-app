import "./EmailNotificationsToggle.css";

const EmailNotificationsToggle = ({ enabled, onToggle }) => {
  return (
    <div className="email-toggle card">
      <div className="email-toggle__info">
        <h3 className="email-toggle__title">Notificări email</h3>
        <p className="email-toggle__desc">
          Primești email-uri de reminder cu 24h și 1h înainte de fiecare consultație.
        </p>
      </div>
      <label className="toggle-switch" aria-label="Activează notificările email">
        <input type="checkbox" checked={!!enabled} onChange={onToggle} />
        <span className="toggle-slider" />
      </label>
    </div>
  );
};

export default EmailNotificationsToggle;

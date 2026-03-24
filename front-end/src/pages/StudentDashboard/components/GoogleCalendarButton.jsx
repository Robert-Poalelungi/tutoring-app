import { useState } from "react";
import { disconnectCalendar } from "../../../services/calendarService";
import "./GoogleCalendarButton.css";

const GoogleCalendarButton = ({ status, onStatusChange }) => {
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    window.location.href = "/api/google-calendar/connect";
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await disconnectCalendar();
      onStatusChange({ connected: false });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gcal-card">
      <div className="gcal-card__info">
        <span className="gcal-card__label">
          <i className="fa-brands fa-google" /> Google Calendar
        </span>
        {status.connected ? (
          <span className="gcal-badge gcal-badge--connected">Sincronizat ✓</span>
        ) : (
          <span className="gcal-badge gcal-badge--disconnected">Neconectat</span>
        )}
        {status.connected && (status.email || status.googleEmail) && (
          <span className="gcal-card__email">{status.email || status.googleEmail}</span>
        )}
      </div>
      <div className="gcal-card__actions">
        {!status.connected ? (
          <button type="button" className="gcal-btn gcal-btn--connect" onClick={handleConnect} disabled={loading}>
            Conectează Calendar
          </button>
        ) : (
          <button type="button" className="gcal-btn gcal-btn--disconnect" onClick={handleDisconnect} disabled={loading}>
            Deconectează
          </button>
        )}
      </div>
    </div>
  );
};

export default GoogleCalendarButton;

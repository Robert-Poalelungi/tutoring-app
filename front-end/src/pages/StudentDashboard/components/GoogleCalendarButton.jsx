import "./GoogleCalendarButton.css";

const GoogleCalendarButton = ({ connected, onSync, onDisconnect }) => {
  if (!connected) {
    return (
      <div className="gcal-btn-group">
        <button
          className="gcal-btn gcal-btn--connect"
          onClick={() => {
            window.location.href = "http://localhost:5000/api/auth/google/calendar";
          }}
        >
          <span>📅</span>
          Conectează Google Calendar
        </button>
      </div>
    );
  }

  return (
    <div className="gcal-btn-group">
      <button className="gcal-btn gcal-btn--sync" onClick={onSync}>
        Sincronizează
      </button>
      <button className="gcal-btn gcal-btn--disconnect" onClick={onDisconnect}>
        Deconectează
      </button>
    </div>
  );
};

export default GoogleCalendarButton;

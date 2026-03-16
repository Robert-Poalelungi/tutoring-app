import "./GoogleCalendarSection.css";

const GoogleCalendarSection = ({ connected, onSync, onDisconnect }) => {
  const handleConnect = () => {
    window.location.href = "http://localhost:5000/api/auth/google/calendar";
  };

  return (
    <div className="gcal-card">
      <div className="gcal-card__header">
        <span className="gcal-card__title">Google Calendar</span>
        {connected && (
          <span className="gcal-badge--connected">Conectat</span>
        )}
      </div>

      {connected ? (
        <>
          <p className="gcal-card__desc">
            Consultațiile tale sunt sincronizate automat.
          </p>
          <div className="gcal-card__actions">
            <button className="gcal-btn gcal-btn--sync" onClick={onSync}>
              Sincronizează acum
            </button>
            <button className="gcal-btn gcal-btn--disconnect" onClick={onDisconnect}>
              Deconectează
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="gcal-card__desc">
            Conectează-ți Google Calendar pentru a primi consultațiile direct în calendar.
          </p>
          <div className="gcal-card__actions">
            <button className="gcal-btn gcal-btn--connect" onClick={handleConnect}>
              Conectează Google Calendar
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default GoogleCalendarSection;

import "./GoogleCalendarSection.css";

const GoogleCalendarSection = ({ status, onSync, onDisconnect }) => {
  const { connected, googleEmail, email, lastSynced, lastSyncedAt } = status || {};
  const displayEmail = googleEmail || email;
  const displayLastSynced = lastSyncedAt || lastSynced;

  return (
    <div className="gcal-section card">
      <div className="gcal-section__header">
        <div>
          <h3 className="gcal-section__title">Google Calendar</h3>
          {connected ? (
            <span className="badge badge--completed">Conectat</span>
          ) : (
            <span className="badge badge--draft">Neconectat</span>
          )}
        </div>
      </div>

      {connected ? (
        <div className="gcal-section__connected">
          {displayEmail && (
            <p className="gcal-section__email">
              <span>Cont:</span> {displayEmail}
            </p>
          )}
          {displayLastSynced && (
            <p className="gcal-section__synced">
              Ultima sincronizare: {new Date(displayLastSynced).toLocaleString("ro-RO")}
            </p>
          )}
          <p className="gcal-section__desc">
            Consultațiile tale sunt sincronizate automat cu Google Calendar.
          </p>
          <div className="gcal-section__actions">
            <button className="btn btn--ghost btn--sm" onClick={onSync}>
              Sincronizează acum
            </button>
            <button className="btn btn--danger btn--sm" onClick={onDisconnect}>
              Deconectează
            </button>
          </div>
        </div>
      ) : (
        <div className="gcal-section__disconnected">
          <p className="gcal-section__desc">
            Conectează-ți Google Calendar pentru a primi consultațiile direct în calendar și a nu rata nicio sesiune.
          </p>
          <button
            className="btn btn--primary"
            onClick={() => { window.location.href = `${import.meta.env.VITE_API_URL}/api/google-calendar/connect`; }}
          >
            Conectează Google Calendar
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleCalendarSection;

import React, { useEffect, useState } from 'react';
import { googleCalendarApi, profileApi } from '../../api';
import AppFooter from '../../components/AppFooter';
import { AppBottomNav, AppNavbar } from '../../components/AppNavbar';
import { useAuth } from '../../context/useAuth';
import '../../css/reset.css';
import '../../css/components/navbar.css';
import '../../css/components/section.css';
import '../../css/components/forms.css';
import '../student/student.css';
import './setari.css';

function Setari() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarLastSyncedAt, setCalendarLastSyncedAt] = useState(null);
  const [isCalendarSyncing, setIsCalendarSyncing] = useState(false);
  const [isCalendarDisconnecting, setIsCalendarDisconnecting] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(Boolean(user?.emailNotificationsEnabled));
  const [notificationSettings, setNotificationSettings] = useState({
    reminder1hour: true,
    reminder1day: true,
    cancellation: true,
  });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadCalendarStatus = async () => {
      if (!isStudent) {
        if (isMounted) {
          setCalendarConnected(false);
          setCalendarLastSyncedAt(null);
        }
        return;
      }

      try {
        const status = await googleCalendarApi.getStatus();
        if (!isMounted) return;
        setCalendarConnected(Boolean(status?.connected));
        setCalendarLastSyncedAt(status?.lastSyncedAt || null);
      } catch {
        if (!isMounted) return;
        setCalendarConnected(false);
        setCalendarLastSyncedAt(null);
      }
    };

    loadCalendarStatus();

    return () => {
      isMounted = false;
    };
  }, [isStudent]);

  useEffect(() => {
    let isMounted = true;

    const loadNotificationSettings = async () => {
      try {
        const settings = await profileApi.getNotificationSettings();
        if (!isMounted) return;
        setNotificationSettings({
          reminder1hour: settings?.reminder1hour ?? true,
          reminder1day: settings?.reminder1day ?? true,
          cancellation: settings?.cancellation ?? true,
        });
      } catch {
        if (!isMounted) return;
        setNotificationSettings({ reminder1hour: true, reminder1day: true, cancellation: true });
      }
    };

    loadNotificationSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setNotificationsEnabled(Boolean(user?.emailNotificationsEnabled));
  }, [user?.emailNotificationsEnabled]);

  const handleConnectCalendar = () => {
    if (!isStudent) return;
    window.location.assign(googleCalendarApi.connectUrl());
  };

  const handleDisconnectCalendar = async () => {
    if (!isStudent || !calendarConnected) return;

    setIsCalendarDisconnecting(true);
    setError('');
    try {
      await googleCalendarApi.disconnect();
      setCalendarConnected(false);
      setCalendarLastSyncedAt(null);
    } catch (disconnectError) {
      setError(disconnectError.message || 'Nu am putut deconecta Google Calendar.');
    } finally {
      setIsCalendarDisconnecting(false);
    }
  };

  const handleManualSync = async () => {
    if (!isStudent || !calendarConnected) return;

    setIsCalendarSyncing(true);
    setError('');
    try {
      await googleCalendarApi.sync();
      const status = await googleCalendarApi.getStatus();
      setCalendarLastSyncedAt(status?.lastSyncedAt || new Date().toISOString());
    } catch (syncError) {
      setError(syncError.message || 'Nu am putut sincroniza manual calendarul.');
    } finally {
      setIsCalendarSyncing(false);
    }
  };

  const handleNotificationToggle = async (enabled) => {
    setIsSavingNotifications(true);
    setError('');
    setNotificationMessage('');

    try {
      const response = await profileApi.updateEmailNotifications(enabled);
      const nextEnabled = typeof response?.emailNotificationsEnabled === 'boolean'
        ? response.emailNotificationsEnabled
        : enabled;
      setNotificationsEnabled(nextEnabled);
      setNotificationMessage(nextEnabled ? 'Notificările au fost activate.' : 'Notificările au fost dezactivate.');
    } catch (toggleError) {
      setError(toggleError.message || 'Nu am putut actualiza starea notificărilor.');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleNotificationTypeChange = async (nextSettings) => {
    setIsSavingNotifications(true);
    setError('');
    setNotificationMessage('');

    try {
      const response = await profileApi.updateNotificationSettings(nextSettings);
      const settings = response?.settings || nextSettings;
      setNotificationSettings({
        reminder1hour: settings.reminder1hour,
        reminder1day: settings.reminder1day,
        cancellation: settings.cancellation,
      });
      setNotificationMessage('Preferințele de notificare au fost actualizate.');
    } catch (settingsError) {
      setError(settingsError.message || 'Nu am putut actualiza tipurile de notificări.');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const applyAllNotificationTypes = () => {
    handleNotificationTypeChange({ reminder1hour: true, reminder1day: true, cancellation: true });
  };

  return (
    <div className="setari-body has-navbar app-background">
      <AppNavbar active="" profileMenuActive />
      <div className="setari-container">
        <div className="setari-section">
          <div className="section-header setari-header-row">
            <h3>Google Calendar</h3>
            <span className="setari-status-badge">
              {!isStudent ? 'Disponibil doar pentru studenți' : calendarConnected ? 'Calendar conectat' : 'Calendar neconectat'}
            </span>
          </div>
          <div className="setari-card-body">
            <p className="setari-text">
              {isStudent
                ? 'Conectează-ți Google Calendar pentru a primi consultațiile direct în calendar și a nu rata nicio sesiune.'
                : 'Sincronizarea Google Calendar este activă doar pentru conturile de student.'}
            </p>

            {isStudent && calendarConnected ? (
              <>
                <div className="setari-actions-row">
                  <button
                    className="setari-btn"
                    type="button"
                    onClick={handleManualSync}
                    disabled={isCalendarSyncing}
                  >
                    {isCalendarSyncing ? 'Se sincronizează...' : 'Sincronizare manuală'}
                  </button>
                  <button
                    className="setari-btn setari-btn-danger"
                    type="button"
                    onClick={handleDisconnectCalendar}
                    disabled={isCalendarDisconnecting}
                  >
                    {isCalendarDisconnecting ? 'Se deconectează...' : 'Deconectează'}
                  </button>
                </div>
                <p className="setari-subtle-text">
                  Ultima sincronizare: {calendarLastSyncedAt ? new Date(calendarLastSyncedAt).toLocaleString('ro-RO') : 'Nedisponibil'}
                </p>
              </>
            ) : (
              <button
                className="setari-btn"
                type="button"
                onClick={handleConnectCalendar}
                disabled={!isStudent}
              >
                Conectează Google Calendar
              </button>
            )}
          </div>
        </div>

        <div className="setari-section">
          <div className="section-header setari-header-row">
            <h3>Notificări email</h3>
            <span className="setari-status-badge">
              {notificationsEnabled ? 'Notificări active' : 'Notificări inactive'}
            </span>
          </div>
          <div className="setari-card-body">
            <p className="setari-text">
              Alege ce notificări vrei să primești: cu 1 oră înainte, cu 1 zi înainte, la anulare sau toate.
            </p>

            <div className="setari-actions-row">
              <button
                className="setari-btn"
                type="button"
                onClick={applyAllNotificationTypes}
                disabled={isSavingNotifications || !notificationsEnabled}
              >
                Toate
              </button>
              <button
                className={`setari-btn ${notificationsEnabled ? 'setari-btn-danger' : ''}`}
                type="button"
                onClick={() => handleNotificationToggle(!notificationsEnabled)}
                disabled={isSavingNotifications}
              >
                {notificationsEnabled ? 'Dezactivează notificări' : 'Activează notificări'}
              </button>
            </div>

            <div className="setari-notification-grid">
              <label className="setari-notification-item">
                <input
                  type="checkbox"
                  checked={notificationSettings.reminder1hour}
                  disabled={isSavingNotifications || !notificationsEnabled}
                  onChange={(event) =>
                    handleNotificationTypeChange({
                      ...notificationSettings,
                      reminder1hour: event.target.checked,
                    })}
                />
                <span>1 oră înainte</span>
              </label>

              <label className="setari-notification-item">
                <input
                  type="checkbox"
                  checked={notificationSettings.reminder1day}
                  disabled={isSavingNotifications || !notificationsEnabled}
                  onChange={(event) =>
                    handleNotificationTypeChange({
                      ...notificationSettings,
                      reminder1day: event.target.checked,
                    })}
                />
                <span>1 zi înainte</span>
              </label>

              <label className="setari-notification-item">
                <input
                  type="checkbox"
                  checked={notificationSettings.cancellation}
                  disabled={isSavingNotifications || !notificationsEnabled}
                  onChange={(event) =>
                    handleNotificationTypeChange({
                      ...notificationSettings,
                      cancellation: event.target.checked,
                    })}
                />
                <span>Anulare / Reactivare</span>
              </label>
            </div>

            {notificationMessage ? <p className="setari-inline-message">{notificationMessage}</p> : null}
            {error ? <p className="setari-inline-error">{error}</p> : null}
          </div>
        </div>
      </div>

      <AppBottomNav active="" />
      <AppFooter />
    </div>
  );
}

export default Setari;

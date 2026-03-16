import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../components/shared/DashboardLayout";
import ProfileForm from "./components/ProfileForm";
import EmailNotificationsToggle from "./components/EmailNotificationsToggle";
import GoogleCalendarSection from "./components/GoogleCalendarSection";
import { updateProfile, toggleEmailNotifications } from "../../services/userService";
import { getCalendarStatus, disconnectCalendar, syncCalendar } from "../../services/calendarService";
import api from "../../services/axiosInstance";
import "./ProfilePage.css";

const ProfilePage = () => {
  const { user, fetchUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    studyYear: "",
    serie: "",
    facultyId: "",
    specializationId: "",
  });
  const [saving, setSaving] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [faculties, setFaculties] = useState([]);
  const [specializations, setSpecializations] = useState([]);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        studyYear: user.studyYear || "",
        serie: user.serie || "",
        facultyId: user.facultyId || "",
        specializationId: user.specializationId || "",
      });
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      try {
        const [facRes, calRes] = await Promise.all([
          api.get("/faculties"),
          getCalendarStatus(),
        ]);
        setFaculties(facRes.data);
        setCalendarConnected(calRes.data.connected);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!form.facultyId) { setSpecializations([]); return; }
    api.get(`/specializations?facultyId=${form.facultyId}`)
      .then((res) => setSpecializations(res.data))
      .catch(() => setSpecializations([]));
  }, [form.facultyId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      await fetchUser();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotifications = async () => {
    try {
      await toggleEmailNotifications();
      await fetchUser();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCalendarDisconnect = async () => {
    try {
      await disconnectCalendar();
      setCalendarConnected(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCalendarSync = async () => {
    try {
      await syncCalendar();
    } catch (err) {
      console.error(err);
    }
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <DashboardLayout>
      <div className="profile-page">
        <div className="profile-page__hero">
          <div className="profile-page__avatar">{initials}</div>
          <div>
            <h1 className="profile-page__name">{user?.name || "—"}</h1>
            <p className="profile-page__email">{user?.email}</p>
            <span className="profile-page__role-badge">
              {user?.role === "student" ? "Student" : user?.role === "professor" ? "Profesor" : "Admin"}
            </span>
          </div>
        </div>

        <ProfileForm
          form={form}
          setForm={setForm}
          faculties={faculties}
          specializations={specializations}
          onSave={handleSave}
          saving={saving}
          userRole={user?.role}
        />

        {user?.role === "student" && (
          <EmailNotificationsToggle
            enabled={user?.emailNotifications}
            onToggle={handleToggleNotifications}
          />
        )}

        <GoogleCalendarSection
          connected={calendarConnected}
          onSync={handleCalendarSync}
          onDisconnect={handleCalendarDisconnect}
        />
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;

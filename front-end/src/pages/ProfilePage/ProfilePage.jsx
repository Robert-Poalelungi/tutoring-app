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
  const [form, setForm] = useState({ name: "", studyYear: "", serie: "", facultyId: "", specializationId: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState({ connected: false });
  const [faculties, setFaculties] = useState([]);
  const [specializations, setSpecializations] = useState([]);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        studyYear: user.studyYear ? String(user.studyYear) : "",
        serie: user.serie || "",
        facultyId: user.facultyId ? String(user.facultyId) : "",
        specializationId: user.specializationId ? String(user.specializationId) : "",
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
        setCalendarStatus(calRes.data);
      } catch (err) { console.error(err); }
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
      const nameParts = form.name.trim().split(" ");
      const firstName = nameParts.slice(0, -1).join(" ") || nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
      await updateProfile({
        firstName,
        lastName,
        studyYear: form.studyYear ? Number(form.studyYear) : undefined,
        serie: form.serie || undefined,
        facultyId: form.facultyId ? Number(form.facultyId) : undefined,
        specializationId: form.specializationId ? Number(form.specializationId) : undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await fetchUser();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleToggleNotifications = async () => {
    try {
      await toggleEmailNotifications(!user?.emailNotificationsEnabled);
      await fetchUser();
    } catch (err) { console.error(err); }
  };

  const handleCalendarSync = async () => {
    try { await syncCalendar(); } catch (err) { console.error(err); }
  };

  const handleCalendarDisconnect = async () => {
    try {
      await disconnectCalendar();
      setCalendarStatus({ connected: false });
    } catch (err) { console.error(err); }
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const roleLabel = { student: "Student", professor: "Profesor", admin: "Administrator" };

  return (
    <DashboardLayout>
      <div className="profile-page">
        {/* Hero */}
        <div className="profile-hero card">
          <div className="profile-hero__avatar">{initials}</div>
          <div className="profile-hero__info">
            <h1 className="profile-hero__name">{user?.name || "—"}</h1>
            <p className="profile-hero__email">{user?.email}</p>
            <span className={`badge badge--${user?.role}`}>
              {roleLabel[user?.role] || user?.role}
            </span>
          </div>
        </div>

        {/* Profile form */}
        <ProfileForm
          form={form}
          setForm={setForm}
          faculties={faculties}
          specializations={specializations}
          onSave={handleSave}
          saving={saving}
          saved={saved}
          userRole={user?.role}
        />

        {/* Email notifications (students only) */}
        {user?.role === "student" && (
          <EmailNotificationsToggle
            enabled={user?.emailNotificationsEnabled}
            onToggle={handleToggleNotifications}
          />
        )}

        {/* Google Calendar */}
        {user?.role === "student" && (
          <GoogleCalendarSection
            status={calendarStatus}
            onSync={handleCalendarSync}
            onDisconnect={handleCalendarDisconnect}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;

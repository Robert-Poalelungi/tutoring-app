import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../components/shared/DashboardLayout";
import CreateConsultationForm from "./components/CreateConsultationForm";
import ConsultationList from "./components/ConsultationList";
import api from "../../services/axiosInstance";
import {
  getMyConsultations,
  createConsultation,
  updateConsultation,
  cancelConsultation,
  completeConsultation,
  deleteConsultation,
} from "../../services/consultationService";
import "./ProfessorDashboard.css";

const ProfessorDashboard = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingConsultation, setEditingConsultation] = useState(null);

  const load = async () => {
    try {
      const [consultRes, coursesRes] = await Promise.all([
        getMyConsultations(),
        api.get(`/professors/${user.id}/courses`),
      ]);
      setConsultations(consultRes.data);
      setCourses(coursesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) load();
  }, [user]);

  const handleCreate = async (formData) => {
    try {
      await createConsultation(formData);
      setShowCreateForm(false);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (id, formData) => {
    try {
      await updateConsultation(id, formData);
      setEditingConsultation(null);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Anulezi această consultație?")) return;
    try {
      await cancelConsultation(id);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async (id) => {
    try {
      await completeConsultation(id);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ștergi definitiv această consultație?")) return;
    try {
      await deleteConsultation(id);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <DashboardLayout>
        <div className="professor-dashboard">
          <p>Se încarcă...</p>
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="professor-dashboard">
        <div className="professor-dashboard__header">
          <div>
            <h1 className="professor-dashboard__title">Dashboard Profesor</h1>
            <p className="professor-dashboard__subtext">
              Bună, {user?.name?.split(" ")[0]}! Gestionează consultațiile tale.
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setShowCreateForm(true);
              setEditingConsultation(null);
            }}
          >
            + Consultație nouă
          </button>
        </div>

        {(showCreateForm || editingConsultation) && (
          <CreateConsultationForm
            courses={courses}
            initialData={editingConsultation}
            onSubmit={
              editingConsultation
                ? (data) => handleUpdate(editingConsultation.id, data)
                : handleCreate
            }
            onCancel={() => {
              setShowCreateForm(false);
              setEditingConsultation(null);
            }}
          />
        )}

        <ConsultationList
          consultations={consultations}
          onEdit={(c) => {
            setEditingConsultation(c);
            setShowCreateForm(false);
          }}
          onCancel={handleCancel}
          onComplete={handleComplete}
          onDelete={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
};

export default ProfessorDashboard;

const User = require("./user");
const Faculty = require("./faculty");
const Specialization = require("./specialization");
const Course = require("./course");
const Consultation = require("./consultation");
const ProfessorCourse = require("./professorCourse");
const UserConsultation = require("./userConsultation");
const GoogleCalendarConnection = require("./googleCalendarConnection");
const ConsultationCalendarSync = require("./consultationCalendarSync");
const CalendarSessions = require("./calendarSessions");

// ─── Facultate → Specializări (one-to-many) ───
Faculty.hasMany(Specialization, { foreignKey: "facultyId", as: "specializations" });
Specialization.belongsTo(Faculty, { foreignKey: "facultyId", as: "faculty" });

// ─── Facultate → Users (one-to-many) ───
Faculty.hasMany(User, { foreignKey: "facultyId", as: "users" });
User.belongsTo(Faculty, { foreignKey: "facultyId", as: "faculty" });

// ─── Specializare → Users (one-to-many) ───
Specialization.hasMany(User, { foreignKey: "specializationId", as: "users" });
User.belongsTo(Specialization, { foreignKey: "specializationId", as: "specialization" });

// ─── Facultate → Courses (one-to-many) ───
Faculty.hasMany(Course, { foreignKey: "facultyId", as: "courses" });
Course.belongsTo(Faculty, { foreignKey: "facultyId", as: "faculty" });

// ─── Specializare → Courses (one-to-many) ───
Specialization.hasMany(Course, { foreignKey: "specializationId", as: "courses" });
Course.belongsTo(Specialization, { foreignKey: "specializationId", as: "specialization" });

// ─── Profesor ↔ Materii (many-to-many prin ProfessorCourse) ───
User.belongsToMany(Course, {
  through: ProfessorCourse,
  foreignKey: "professorId",
  as: "courses",
});
Course.belongsToMany(User, {
  through: ProfessorCourse,
  foreignKey: "courseId",
  as: "professors",
});

// ─── Consultație → Materie (many-to-one) ───
Consultation.belongsTo(Course, { foreignKey: "courseId", as: "course" });
Course.hasMany(Consultation, { foreignKey: "courseId", as: "consultations" });

// ─── Consultație → Profesor (many-to-one) ───
Consultation.belongsTo(User, { foreignKey: "professorId", as: "professor" });
User.hasMany(Consultation, { foreignKey: "professorId", as: "consultations" });

// ─── Student ↔ Consultație (many-to-many prin UserConsultation) ───
User.belongsToMany(Consultation, {
  through: UserConsultation,
  foreignKey: "userId",
  as: "enrolledConsultations",
});
Consultation.belongsToMany(User, {
  through: UserConsultation,
  foreignKey: "consultationId",
  as: "students",
});

// ─── UserConsultation → User / Consultation (directe, pentru include din join table) ───
UserConsultation.belongsTo(User, { foreignKey: "userId", as: "user" });
UserConsultation.belongsTo(Consultation, { foreignKey: "consultationId", as: "consultation" });

// ─── User → Google Calendar Connection (one-to-one) ───
User.hasOne(GoogleCalendarConnection, { foreignKey: "userId", as: "calendarConnection" });
GoogleCalendarConnection.belongsTo(User, { foreignKey: "userId", as: "user" });

// ─── Consultation Calendar Sync → Consultation + User ───
ConsultationCalendarSync.belongsTo(Consultation, { foreignKey: "consultationId", as: "consultation" });
Consultation.hasMany(ConsultationCalendarSync, { foreignKey: "consultationId", as: "calendarSyncs" });

ConsultationCalendarSync.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(ConsultationCalendarSync, { foreignKey: "userId", as: "calendarSyncs" });

// ─── Calendar Sessions → Updated By (admin) ───
CalendarSessions.belongsTo(User, { foreignKey: "updatedBy", as: "admin" });

module.exports = {
  User,
  Faculty,
  Specialization,
  Course,
  Consultation,
  ProfessorCourse,
  UserConsultation,
  GoogleCalendarConnection,
  ConsultationCalendarSync,
  CalendarSessions,
};

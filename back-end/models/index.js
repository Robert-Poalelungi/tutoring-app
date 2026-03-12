const User = require("./user");
const Course = require("./course");
const Consultation = require("./consultation");
const ProfessorCourse = require("./professorCourse");
const UserConsultation = require("./userConsultation");

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

module.exports = {
  User,
  Course,
  Consultation,
  ProfessorCourse,
  UserConsultation,
};

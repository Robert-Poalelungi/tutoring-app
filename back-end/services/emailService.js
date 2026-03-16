const nodemailer = require("nodemailer");

// Configurare transport SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true pentru 465, false pentru alte porturi
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Trimite un email
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error(`Eroare la trimiterea emailului către ${to}:`, error.message);
  }
};

// Formatează emailul de reminder (1 zi sau 1 oră)
const sendReminderEmail = async (studentEmail, consultation, type) => {
  const course = consultation.course;
  const professor = consultation.professor;

  const subject = type === "1day"
    ? `Mâine: Consultație ${course.name}`
    : `În curând: Consultație ${course.name}`;

  const html = `
    <h2>${subject}</h2>
    <p><strong>Disciplina:</strong> ${course.name}</p>
    <p><strong>Profesor:</strong> ${professor.firstName} ${professor.lastName}</p>
    <p><strong>Data:</strong> ${consultation.date}</p>
    <p><strong>Ora:</strong> ${consultation.time}</p>
    <p><strong>Durata:</strong> ${consultation.duration} minute</p>
    <p><strong>Tip:</strong> ${consultation.type === "online" ? "Online" : "Fizic"}</p>
    ${consultation.type === "online" && consultation.meetingLink
      ? `<p><strong>Link meeting:</strong> <a href="${consultation.meetingLink}">${consultation.meetingLink}</a></p>`
      : ""}
    ${consultation.type === "fizic" && consultation.room
      ? `<p><strong>Sala:</strong> ${consultation.room}</p>`
      : ""}
    ${consultation.materialsLink
      ? `<p><strong>Materiale:</strong> <a href="${consultation.materialsLink}">Deschide materiale</a></p>`
      : ""}
  `;

  await sendEmail(studentEmail, subject, html);
};

// Formatează emailul de anulare
const sendCancellationEmail = async (studentEmail, consultation) => {
  const course = consultation.course;
  const professor = consultation.professor;

  const subject = `Anulată: Consultație ${course.name}`;

  const html = `
    <h2>${subject}</h2>
    <p>Consultația de mai jos a fost anulată.</p>
    <p><strong>Disciplina:</strong> ${course.name}</p>
    <p><strong>Profesor:</strong> ${professor.firstName} ${professor.lastName}</p>
    <p><strong>Data:</strong> ${consultation.date}</p>
    <p><strong>Ora:</strong> ${consultation.time}</p>
    ${consultation.cancellationReason
      ? `<p><strong>Motivul anulării:</strong> ${consultation.cancellationReason}</p>`
      : ""}
  `;

  await sendEmail(studentEmail, subject, html);
};

module.exports = {
  sendEmail,
  sendReminderEmail,
  sendCancellationEmail,
};

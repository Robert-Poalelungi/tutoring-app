# Tutoring App — Documentație Completă

---

## Cuprins

1. [Descriere Generală](#1-descriere-generală)
2. [Roluri Utilizatori (RBAC)](#2-roluri-utilizatori-rbac)
3. [Arhitectura Aplicației](#3-arhitectura-aplicației)
4. [Structura Aplicației — Fluxuri și Pagini](#4-structura-aplicației--fluxuri-și-pagini)
5. [Structura Componentelor React](#5-structura-componentelor-react)
6. [Structura Bazei de Date](#6-structura-bazei-de-date)
7. [API Endpoints](#7-api-endpoints)
8. [Tehnologii Utilizate](#8-tehnologii-utilizate)
9. [Structura Proiectului](#9-structura-proiectului)
10. [Setup & Development](#10-setup--development)

---

## 1. Descriere Generală

Tutoring App este o aplicație web dedicată organizării consultațiilor universitare, concepută pentru a facilita interacțiunea dintre studenți și cadre didactice. Platforma centralizează informațiile relevante despre sesiunile de tutoring și oferă un cadru unitar pentru planificarea, accesarea și administrarea acestora.

Aplicația permite:

- **Studenților** să vizualizeze consultațiile disponibile pentru anul și specializarea lor, dar și să adauge consultații din alți ani în cazul în care au restanțe sau trebuie să refacă anumite discipline.
- **Profesorilor** să organizeze consultații pentru materiile pe care le predau, să le editeze și să adauge materiale.
- **Administratorilor** să gestioneze utilizatorii, materiile și consultațiile la nivelul întregului sistem.

Scopul aplicației este de a îmbunătăți organizarea activităților de tutoring, de a crește accesibilitatea informațiilor și de a susține o desfășurare mai eficientă a procesului educațional.

---

## 2. Roluri Utilizatori (RBAC)

Aplicația folosește un sistem **RBAC (Role Based Access Control)** cu trei tipuri de utilizatori: `student`, `professor`, `admin`.

### 2.1 Student

Studentul poate:

- Vedea consultațiile corespunzătoare anului și specializării sale.
- Deschide detaliile unei consultații (disciplină, profesor, dată, oră, tip, sală/link, materiale).
- Accesa linkul sesiunii online (Zoom / Google Meet) sau informațiile despre sala fizică.
- Adăuga consultații din alți ani pentru recuperări sau restanțe.

### 2.2 Profesor

Profesorul poate:

- Vedea materiile care i-au fost atribuite.
- Crea consultații pentru materiile sale (selectând materia, data, ora, tipul, sala/link, materiale).
- Edita consultațiile create.
- Adăuga link-uri către materiale (Google Drive).

### 2.3 Admin

Administratorul are acces total la sistem. Adminul poate:

- Crea utilizatori (student / profesor / admin).
- Modifica rolurile utilizatorilor.
- Atribui materii profesorilor.
- Crea și edita consultații pentru profesori.
- Crea și modifica materii.
- Vizualiza toate datele aplicației.

---

## 3. Arhitectura Aplicației

Aplicația folosește o **arhitectură client-server**. Frontend-ul și backend-ul sunt separate și comunică prin API REST.

### 3.1 Frontend

**Tehnologii:** React, Vite, JavaScript, CSS

Frontend-ul gestionează:

- Interfața utilizatorului (UI).
- Routing-ul aplicației.
- Apelurile către API-ul backend-ului.

### 3.2 Backend

**Tehnologii:** Node.js, Express.js, Sequelize ORM, MySQL

Backend-ul este organizat în structura **MVC** (Models — Controllers — Routes) și gestionează:

- Autentificarea utilizatorilor (Google OAuth 2.0 via Passport.js).
- Sesiuni și autorizare prin JWT stocat în httpOnly cookie (expiră după 5 ore).
- Gestionarea rolurilor (RBAC) prin middleware (`isAuthenticated`, `hasRole`).
- Gestionarea consultațiilor (CRUD complet).
- Gestionarea materiilor și atribuirea lor profesorilor.
- Detecția automată a anului de studiu din emailul instituțional.

#### Fluxul complet de autentificare și autorizare

```
1. Utilizatorul apasă "Login cu Google"
       ↓
2. Redirect → Google OAuth 2.0 (orice cont Google funcționează)
       ↓
3. Google returnează profilul (email, nume) → callback backend
       ↓
4. Backend verifică dacă emailul există în DB:
   • NU există → Crează cont nou (rol implicit: "student")
   • EXISTĂ → Returnează contul existent
       ↓
5. Backend generează JWT (conține: id, email, rol) și îl setează ca httpOnly cookie
       ↓
6. Redirect pe baza stării contului:
   • Profil incomplet → /onboarding
   • Student → /student/dashboard
   • Profesor → /professor/dashboard
   • Admin → /admin
```

**Important:** Orice cont Google poate fi utilizat pentru autentificare — nu este obligatoriu să fie un email instituțional. Emailul instituțional (`XX@stud.ase.ro`) este **recomandat** deoarece permite detecția automată a anului de studiu, dar nu este o cerință.

#### Cum se atribuie rolurile

- **Student** — rolul implicit la crearea oricărui cont nou prin Google OAuth.
- **Profesor** — un administrator schimbă rolul unui utilizator existent din `student` în `professor` prin ruta `PUT /api/admin/users/:id/role`.
- **Admin** — un administrator existent promovează un alt utilizator la rol de `admin` prin aceeași rută.

Nu există auto-înregistrare ca profesor sau admin. Primul admin trebuie creat manual în baza de date.

#### Cum funcționează protecția rutelor (RBAC)

Fiecare request către o rută protejată trece prin două middleware-uri:

1. **`isAuthenticated`** — extrage JWT-ul din cookie-ul `access_token`, îl verifică cu `JWT_SECRET`, și atașează utilizatorul la `req.user`. Dacă token-ul lipsește sau este invalid → `401 Unauthorized`.
2. **`hasRole(...roles)`** — verifică dacă `req.user.role` se află în lista de roluri permise. Dacă nu → `403 Forbidden`.

Exemplu: ruta `POST /api/consultations/create` folosește `isAuthenticated, hasRole("professor", "admin")` — doar profesorii și adminii pot crea consultații.

**Structura backend-ului:**

```
back-end/
├── server.js              # Entry point — Express, middleware, sync DB
├── config/
│   ├── db.js              # Conexiune Sequelize → MySQL
│   └── auth.js            # Google OAuth (Passport.js)
├── models/
│   ├── index.js           # Relații între modele
│   ├── user.js            # Student / Professor / Admin
│   ├── course.js          # Materii
│   ├── consultation.js    # Consultații
│   ├── professorCourse.js # Join: profesor ↔ materie
│   └── userConsultation.js# Join: student ↔ consultație
├── controllers/
│   ├── user.js            # Profil, onboarding, detectStudyYear
│   ├── course.js          # Materii (listare, filtrare)
│   ├── consultation.js    # CRUD consultații + enroll/unenroll
│   └── admin.js           # CRUD users, courses, assign courses
├── routes/
│   ├── index.js           # Montează toate sub-rutele pe /api
│   ├── auth.js            # /api/auth — Google OAuth
│   ├── user.js            # /api/user — profil utilizator
│   ├── course.js          # /api/courses — materii
│   ├── consultation.js    # /api/consultations — consultații
│   └── admin.js           # /api/admin — administrare
└── middleware/
    └── auth.js            # isAuthenticated + hasRole(...)
```

### 3.3 Detecția Automată a Anului de Studiu

Această funcționalitate este disponibilă **doar pentru emailurile instituționale** cu formatul `XX@stud.ase.ro`. Dacă utilizatorul s-a autentificat cu un email personal (ex: `@gmail.com`), anul de studiu nu va fi detectat automat și va trebui setat manual la onboarding.

**Cum funcționează:**

- `poalelungirobert23@stud.ase.ro` → extrage `23` → a început în 2023 → **Anul 3** (în 2026).
- Formula: `anul_curent - (2000 + cifre_din_email)`, cu ajustare pentru luna curentă (anul universitar începe în octombrie).
- Dacă rezultatul este în afara intervalului 1–4, se consideră absolvent (`null`).
- Anul detectat este setat automat la crearea contului și trimis ca `detectedStudyYear` spre frontend la onboarding, unde studentul poate modifica manual dacă repetă anul.

**Email instituțional vs. email personal:**

| Tip email | Login | Detecție an | Exemplu |
|---|---|---|---|
| Instituțional (`@stud.ase.ro`) | ✅ Funcționează | ✅ Automat | `poalelungirobert23@stud.ase.ro` |
| Personal (`@gmail.com`, etc.) | ✅ Funcționează | ❌ Manual la onboarding | `robertpoalelungi@gmail.com` |

### 3.4 Integrare Servicii Externe

- **Google Authentication** — autentificare cu orice cont Google (OAuth 2.0 via Passport.js). Emailul instituțional este recomandat dar nu obligatoriu.
- **Google Drive** — stocare și partajare de materiale pentru consultații.
- **Zoom / Google Meet** — link-uri pentru sesiunile de consultație online.

---

## 4. Structura Aplicației — Fluxuri și Pagini

### 4.1 Calendar Page (Home / Public)

Pagina de Calendar este pagina principală (home) a aplicației. Aceasta este pagina pe care o vede orice vizitator care nu este autentificat. Dacă un utilizator nelogat accesează aplicația, este redirecționat automat către această pagină.

**Scop:** Afișarea tuturor consultațiilor de tutoring disponibile într-un format de calendar, accesibil publicului larg, fără a necesita autentificare.

#### Layout — Două Panouri

Pagina este împărțită în două secțiuni principale, afișate side-by-side:

**Panoul din stânga — Detalii Consultație:**

- Când utilizatorul selectează o consultație din calendar (click pe un eveniment), în panoul din stânga apar detaliile complete ale consultației selectate.
- Informații afișate: numele disciplinei, numele profesorului, data și ora, tipul consultației (online / fizic), sala sau link-ul de meeting, link-ul către materiale (Google Drive).
- Dacă nicio consultație nu este selectată, panoul afișează un mesaj implicit (ex: „Selectează o consultație din calendar pentru a vedea detaliile").

**Panoul din dreapta — Calendarul:**

- Un calendar interactiv care afișează consultațiile sub formă de evenimente.
- Utilizatorul poate naviga între luni / săptămâni.
- Click pe un eveniment din calendar → detaliile apar în panoul din stânga.

#### Filtrare — Butoane de An și Selector Facultate

Pentru a evita aglomerarea interfeței, calendarul include un sistem de filtrare:

**3 Butoane de An (Anul 1, Anul 2, Anul 3):**

- Afișate în partea de sus a calendarului.
- Permit filtrarea consultațiilor afișate în funcție de anul de studiu.
- La un moment dat, doar un singur an poate fi selectat (toggle / radio behaviour).
- Implicit poate fi selectat Anul 1 sau niciun an (afișând toate consultațiile).

**Buton Selectare Facultate:**

- Un buton care deschide o **modală** cu cele 12 facultăți disponibile.
- Utilizatorul selectează facultatea dorită, iar calendarul se filtrează corespunzător.
- Facultatea selectată este **salvată în cookies**, astfel încât la revenirea pe pagină, utilizatorul nu trebuie să o selecteze din nou.
- Dacă nicio facultate nu a fost selectată anterior (cookies gol), modala se poate deschide automat la prima vizită sau se afișează toate consultațiile.

#### Comportament și Navigare

- Utilizatorii neautentificați sunt redirecționați către această pagină.
- Pagina este complet funcțională fără autentificare — este publică.
- Din această pagină, utilizatorul poate accesa pagina de **Login** pentru a se autentifica și a primi funcționalități suplimentare (dashboard personalizat, adăugare consultații de recuperare, etc.).

---

### 4.2 Login

Pagina de login reprezintă punctul de intrare în aplicație pentru utilizatorii autentificați.

**Elemente:**

- Logo-ul aplicației.
- Buton de autentificare cu Google (orice cont Google — instituțional sau personal).

**Ce se întâmplă la click pe butonul de login:**

1. Utilizatorul este redirecționat către pagina de consimțământ Google OAuth.
2. După autorizare, Google trimite datele profilului (email, nume, prenume) către backend.
3. Backend-ul caută emailul în baza de date:
   - **Cont nou** → se creează automat cu rolul `student`. Dacă emailul este instituțional (`XX@stud.ase.ro`), anul de studiu este detectat automat.
   - **Cont existent** → se folosește contul deja existent, cu rolul atribuit anterior.
4. Se generează un **JWT** (JSON Web Token) care conține ID-ul, emailul și rolul utilizatorului. Token-ul este stocat într-un cookie `httpOnly` (nu este accesibil din JavaScript, protejând împotriva XSS).
5. Utilizatorul este redirecționat în funcție de starea contului:
   - Profil incomplet (`isProfileCompleted: false`) → **Onboarding**
   - `student` → **Student Dashboard**
   - `professor` → **Professor Dashboard**
   - `admin` → **Admin Panel**

**Notă:** Nu există un formular clasic de login (email + parolă). Singura metodă de autentificare este prin Google OAuth 2.0.

---

### 4.3 Onboarding

Procesul de onboarding are rolul de a colecta informațiile academice necesare pentru personalizarea aplicației. Este format din mai multe etape:

#### 4.3.1 Selectarea Facultății

Prima etapă constă în selectarea facultății din cadrul universității.

**Interfață:**

- 12 cartonașe (cards), câte unul pentru fiecare facultate:
  1. Administrarea Afacerilor, cu predare în limbi străine (FABIZ)
  2. Administrație și Management Public (AMP)
  3. Business și Turism (BT)
  4. Cibernetică, Statistică și Informatică Economică (CSIE)
  5. Contabilitate și Informatică de Gestiune (CIG)
  6. Drept
  7. Economie și Comunicare în Afaceri (ECA)
  8. Economie Agroalimentară și a Mediului (EAM)
  9. Finanțe, Asigurări, Bănci și Burse de Valori (FABBV)
  10. Management (MAN)
  11. Marketing (MK)
  12. Relații Economice Internaționale (REI)
- Fiecare cartonaș conține numele facultății.
- Buton pentru confirmarea selecției.

Această informație este utilizată ulterior pentru filtrarea consultațiilor.

#### 4.3.2 Completarea Datelor Personale

În această etapă sunt introduse informațiile principale despre utilizator.

**Câmpuri:**

- **Email** — preluat automat din autentificare, afișat read-only.
- **Nume** — câmp editabil.
- **Prenume** — câmp editabil.
- **Anul de studiu** — detectat automat pe baza emailului instituțional; poate fi modificat manual în cazul repetării anului.
- **Specializarea** — câmp editabil / dropdown.

Scopul acestei pagini este verificarea și completarea informațiilor academice.

#### 4.3.3 Selectarea Disciplinelor de Interes (Opțional)

Această etapă permite studentului să selecteze discipline suplimentare pentru care dorește să urmărească consultațiile.

Funcționalitate utilă pentru studenții care:

- Au restanțe.
- Refac anumite examene.
- Sunt interesați de consultații din alți ani.

**Interfață:**

- Câmp de selecție pentru discipline.
- Disciplinele selectate sunt afișate sub formă de etichete (chips).
- Fiecare disciplină poate fi eliminată individual.
- Buton **Skip** — pentru situațiile în care studentul nu dorește să selecteze discipline suplimentare.

---

### 4.4 Student Dashboard

Dashboard-ul reprezintă pagina principală a aplicației pentru student. Oferă o vedere de ansamblu asupra consultațiilor relevante.

#### 4.4.1 Consultațiile pentru Anul Studentului

În partea superioară a dashboard-ului sunt afișate consultațiile corespunzătoare anului și specializării studentului. Consultațiile sunt afișate sub forma unor cartonașe (cards) într-un container organizat într-un grid.

**Informații afișate pe card:**

- Numele disciplinei.
- Numele profesorului.
- Data consultației.
- Ora consultației.
- Buton **Detalii**.

#### 4.4.2 Modalul de Detalii ale Consultației

Când utilizatorul apasă pe butonul **Detalii**, se deschide o fereastră modală cu toate informațiile despre consultație:

- Numele disciplinei.
- Numele profesorului.
- Data consultației.
- Ora consultației.
- Tipul consultației (online / fizic).

**Consultații online:**

- Link către Zoom sau Google Meet.
- Buton pentru accesarea rapidă a sesiunii.

**Consultații fizice:**

- Numărul sălii.
- Clădirea (dacă este disponibilă).

**Materiale pentru consultație:**

- Link către un folder Google Drive unde profesorul poate încărca prezentări, documente, materiale suplimentare.

#### 4.4.3 Consultații pentru Recuperări sau Restanțe

Sub containerul principal se află o secțiune dedicată consultațiilor care nu aparțin anului studentului. Destinată situațiilor în care studentul are restanțe, reface examene sau dorește să participe la consultații din alți ani.

Studentul poate adăuga manual aceste consultații în dashboard. Consultațiile adăugate apar într-un container separat, dar folosesc același tip de card pentru consistența interfeței.

---

### 4.5 Profesor Dashboard

Profesorul poate:

- Vizualiza materiile atribuite.
- Crea consultații noi.
- Gestiona consultațiile existente (editare, ștergere).

**Crearea unei consultații — câmpuri:**

- Materia (dropdown din materiile atribuite).
- Data.
- Ora.
- Tip consultație (online / fizic).
- Sală (dacă fizic) sau link meeting (dacă online).
- Link materiale (Google Drive).

---

### 4.6 Admin Panel

Adminul gestionează întregul sistem prin mai multe secțiuni:

#### Users

- Vedea lista utilizatorilor.
- Adăuga utilizatori noi.
- Modifica rolurile utilizatorilor.

#### Courses (Materii)

- Crea materii noi.
- Modifica materii existente.

#### Professors

- Atribui materii profesorilor.

#### Consultations

- Crea consultații pentru profesori.
- Edita consultații existente.

---

## 5. Structura Componentelor React

### 5.1 Ierarhia Completă a Componentelor

```
App
├── CalendarPage (Home / Public)
│   ├── FacultySelectModal
│   ├── YearFilterButtons
│   ├── CalendarView
│   └── ConsultationDetailsPanel
│
├── LoginPage
├── OnboardingFaculty
├── OnboardingProfile
├── OnboardingInterests
│
├── StudentDashboard
│   ├── ConsultationsContainer
│   │   └── ConsultationCard
│   ├── RecoveryConsultationsContainer
│   │   └── ConsultationCard
│   └── ConsultationDetailsModal
│
├── ProfessorDashboard
│   ├── ProfessorCourses
│   ├── CreateConsultationForm
│   └── ConsultationList
│
├── AdminPanel
│   ├── UsersTable
│   ├── AddUserModal
│   ├── ProfessorCoursesManager
│   └── ConsultationsManager
│
└── Layout
    ├── Navbar
    ├── Sidebar
    └── DashboardLayout
```

---

### 5.2 Pagini (Pages)

| Pagină | Descriere |
|---|---|
| `CalendarPage` | Pagina de home (publică) — calendar cu toate consultațiile, filtrare pe an și facultate. |
| `LoginPage` | Pagina de autentificare cu Google. |
| `OnboardingFaculty` | Selectarea facultății (12 carduri). |
| `OnboardingProfile` | Completarea datelor personale (email, nume, prenume, an, specializare). |
| `OnboardingInterests` | Selectarea disciplinelor de interes suplimentare (opțional). |
| `StudentDashboard` | Pagina principală a studentului — consultații an curent + recuperări. |
| `ProfessorDashboard` | Pagina principală a profesorului — materii, creare și gestionare consultații. |
| `AdminPanel` | Panoul de administrare — utilizatori, materii, profesori, consultații. |

---

### 5.3 Componente Calendar Page

| Componentă | Descriere |
|---|---|
| `CalendarView` | Calendarul interactiv care afișează consultațiile ca evenimente (navigare luni/săptămâni). |
| `ConsultationDetailsPanel` | Panoul din stânga care afișează detaliile consultației selectate din calendar. |
| `YearFilterButtons` | Cele 3 butoane de filtrare pe an (Anul 1, Anul 2, Anul 3) — toggle/radio behaviour. |
| `FacultySelectModal` | Modala cu cele 12 facultăți — selecția se salvează în cookies. |

---

### 5.4 Componente Student

| Componentă | Descriere |
|---|---|
| `ConsultationsContainer` | Container pentru consultațiile din anul studentului, afișate într-un grid de carduri. |
| `ConsultationCard` | Card individual pentru o consultație. Conține: numele disciplinei, numele profesorului, data, ora, buton detalii. |
| `ConsultationDetailsModal` | Fereastra modală cu toate detaliile consultației: tip, sală/link meeting, materiale. |
| `RecoveryConsultationsContainer` | Container pentru consultațiile adăugate manual pentru recuperări/restanțe. |

---

### 5.5 Componente Profesor

| Componentă | Descriere |
|---|---|
| `ProfessorCourses` | Vizualizarea materiilor atribuite profesorului. |
| `CreateConsultationForm` | Formular pentru crearea unei consultații noi (materie, data, ora, tip, sală/link, materiale). |
| `ConsultationList` | Lista consultațiilor create de profesor, cu opțiuni de editare. |

---

### 5.6 Componente Admin

| Componentă | Descriere |
|---|---|
| `UsersTable` | Tabel cu toți utilizatorii din sistem (student, profesor, admin). |
| `AddUserModal` | Modal pentru adăugarea unui utilizator nou. |
| `ProfessorCoursesManager` | Interfață pentru atribuirea materiilor către profesori. |
| `ConsultationsManager` | Interfață pentru crearea și editarea consultațiilor la nivel de admin. |

---

### 5.7 Componente Layout

| Componentă | Descriere |
|---|---|
| `Navbar` | Navigare principală (header). |
| `Sidebar` | Meniu lateral pentru navigare rapidă între secțiuni. |
| `DashboardLayout` | Layout comun care include Navbar + Sidebar + conținutul paginii. |

---

### 5.8 State Management

Aplicația folosește:

- **React Context** — pentru gestionarea datelor utilizatorului (rol, profil, stare autentificare).
- **useState** — pentru starea locală a componentelor.
- **useEffect** — pentru apeluri API și side effects.

---

## 6. Structura Bazei de Date

### 6.1 Diagrama Relațiilor

```
users ──< user_consultations >── consultations ──> courses
  │                                    │
  │ (role = professor)                 │
  └──< professor_courses >── courses ──┘
```

---

### 6.2 Tabela `users`

Stochează informațiile despre toți utilizatorii aplicației (studenți, profesori, admini).

| Câmp | Tip | Descriere |
|---|---|---|
| `id` | integer (PK) | ID unic utilizator |
| `email` | varchar | Email instituțional |
| `first_name` | varchar | Prenume |
| `last_name` | varchar | Nume |
| `role` | enum(`student`, `professor`, `admin`) | Rolul utilizatorului în sistem |
| `faculty` | varchar | Facultatea |
| `specialization` | varchar | Specializarea |
| `study_year` | integer | Anul de studiu (relevant pentru studenți) |
| `is_profile_completed` | boolean | Indică dacă utilizatorul a finalizat procesul de onboarding |
| `created_at` | timestamp | Data și ora creării contului |

---

### 6.3 Tabela `courses`

Conține toate disciplinele disponibile în aplicație.

| Câmp | Tip | Descriere |
|---|---|---|
| `id` | integer (PK) | ID unic disciplină |
| `name` | varchar | Numele disciplinei |
| `specialization` | varchar | Specializarea căreia îi aparține disciplina |
| `study_year` | integer | Anul în care se predă disciplina |

---

### 6.4 Tabela `professor_courses`

Tabel de legătură care definește ce materii sunt atribuite fiecărui profesor.

| Câmp | Tip | Descriere |
|---|---|---|
| `id` | integer (PK) | ID unic |
| `professor_id` | integer (FK → `users.id`) | Profesorul căruia i se atribuie materia |
| `course_id` | integer (FK → `courses.id`) | Materia atribuită |

---

### 6.5 Tabela `consultations`

Stochează toate consultațiile create în aplicație.

| Câmp | Tip | Descriere |
|---|---|---|
| `id` | integer (PK) | ID unic consultație |
| `course_id` | integer (FK → `courses.id`) | Disciplina pentru care se ține consultația |
| `professor_id` | integer (FK → `users.id`) | Profesorul care ține consultația |
| `date` | date | Data consultației |
| `time` | time | Ora consultației |
| `type` | varchar | Tipul consultației: `online` sau `fizic` |
| `room` | varchar | Numărul sălii (pentru consultații fizice) |
| `meeting_link` | varchar | Link Zoom / Google Meet (pentru consultații online) |
| `materials_link` | varchar | Link către folderul Google Drive cu materiale |

---

### 6.6 Tabela `user_consultations`

Tabel de legătură care definește relația student — consultație (la ce consultații participă fiecare student).

| Câmp | Tip | Descriere |
|---|---|---|
| `id` | integer (PK) | ID unic |
| `user_id` | integer (FK → `users.id`) | Studentul |
| `consultation_id` | integer (FK → `consultations.id`) | Consultația la care participă |
| `source` | varchar | Sursa: `auto` (generată automat pe baza anului/specializării) sau `manual` (adăugată de student pentru recuperări) |

---

## 7. API Endpoints

### 7.1 Autentificare (`/api/auth`)

| Metodă | Endpoint | Descriere |
|---|---|---|
| `GET` | `/api/auth/google` | Inițiază autentificarea Google OAuth 2.0. Redirect către Google cu scope `profile` + `email`. |
| `GET` | `/api/auth/google/callback` | Callback OAuth — primește profilul de la Google, creează/găsește user în DB, generează JWT, setează cookie `access_token`, redirecționează pe baza rolului și `isProfileCompleted`. |
| `GET` | `/api/auth/logout` | Logout — șterge cookie-ul `access_token` și redirecționează către `ORIGIN_SITE`. |

**Detalii callback (`/api/auth/google/callback`):**

- Dacă utilizatorul nu există → creează cont cu `role: "student"`, `isProfileCompleted: false`, și `studyYear` detectat automat (dacă email instituțional).
- Dacă utilizatorul există dar nu are `studyYear` → îl detectează și actualizează automat.
- Generează JWT cu payload: `{ id, email, role }`, expiră în 5 ore.
- Cookie `access_token`: `httpOnly: true`, `maxAge: 5h`. În producție: `secure: true`, `sameSite: "none"`.
- Redirecționare: dacă `isProfileCompleted === false` → `/onboarding`. Altfel, pe baza rolului → `/student/dashboard`, `/professor/dashboard`, sau `/admin`.

### 7.2 Utilizator (`/api/user`)

| Metodă | Endpoint | Acces | Descriere |
|---|---|---|---|
| `GET` | `/api/user/me` | Public | Returnează datele utilizatorului autentificat + `detectedStudyYear`. |
| `PUT` | `/api/user/complete-profile` | Autentificat | Completarea profilului (onboarding). |
| `PUT` | `/api/user/update-profile` | Autentificat | Actualizare profil. |

### 7.3 Materii (`/api/courses`)

| Metodă | Endpoint | Acces | Descriere |
|---|---|---|---|
| `GET` | `/api/courses` | Public | Returnează toate materiile. |
| `GET` | `/api/courses/filter?studyYear=&specialization=` | Public | Materii filtrate pe an și specializare. |
| `GET` | `/api/courses/my` | Profesor | Materiile atribuite profesorului autentificat. |
| `GET` | `/api/courses/:id` | Public | O materie după ID (include profesorii atribuiți). |

### 7.4 Consultații (`/api/consultations`)

| Metodă | Endpoint | Acces | Descriere |
|---|---|---|---|
| `GET` | `/api/consultations` | Public | Toate consultațiile (pentru calendarul public), cu filtrare opțională pe `studyYear` și `specialization`. |
| `GET` | `/api/consultations/:id` | Public | O consultație după ID cu detalii complete. |
| `GET` | `/api/consultations/student/my` | Student | Consultațiile studentului (`auto` pe baza anului/specializării + `manual` pentru recuperări). |
| `POST` | `/api/consultations/student/enroll` | Student | Înscriere la o consultație pentru recuperare (sursa: `manual`). |
| `DELETE` | `/api/consultations/student/unenroll/:id` | Student | Eliminare consultație manuală din lista studentului. |
| `GET` | `/api/consultations/professor/my` | Profesor / Admin | Consultațiile create de profesorul autentificat. |
| `POST` | `/api/consultations/create` | Profesor / Admin | Creează o consultație nouă (validare: link obligatoriu dacă online, sală dacă fizic). |
| `PUT` | `/api/consultations/update/:id` | Profesor / Admin | Editează o consultație (profesorul poate edita doar consultațiile proprii). |
| `DELETE` | `/api/consultations/delete/:id` | Profesor / Admin | Șterge o consultație. |

### 7.5 Admin (`/api/admin`)

Toate rutele de admin necesită autentificare + rol `admin`.

| Metodă | Endpoint | Descriere |
|---|---|---|
| `GET` | `/api/admin/users` | Returnează toți utilizatorii. |
| `GET` | `/api/admin/users/:id` | Returnează un utilizator după ID. |
| `POST` | `/api/admin/users` | Creează un utilizator nou. |
| `PUT` | `/api/admin/users/:id/role` | Modifică rolul unui utilizator. |
| `DELETE` | `/api/admin/users/:id` | Șterge un utilizator. |
| `POST` | `/api/admin/courses` | Creează o materie nouă. |
| `PUT` | `/api/admin/courses/:id` | Editează o materie. |
| `DELETE` | `/api/admin/courses/:id` | Șterge o materie. |
| `POST` | `/api/admin/professors/:id/courses` | Atribuie o materie unui profesor. |
| `DELETE` | `/api/admin/professors/:id/courses` | Elimină atribuirea unei materii de la un profesor. |

---

## 8. Tehnologii Utilizate

| Categorie | Tehnologie | Detalii |
|---|---|---|
| **Frontend** | React | Bibliotecă UI pentru componente reutilizabile |
| **Frontend** | Vite | Build tool rapid cu HMR (Hot Module Replacement) |
| **Frontend** | JavaScript | Limbajul de programare principal |
| **Frontend** | CSS | Stilizare componente |
| **Backend** | Node.js + Express.js | Runtime JavaScript server-side + framework HTTP |
| **Backend** | Sequelize | ORM pentru MySQL — modele, relații, migrări |
| **Backend** | MySQL | Baza de date relațională |
| **Auth** | Google OAuth 2.0 | Autentificare cu orice cont Google (via Passport.js). Email instituțional recomandat, nu obligatoriu. |
| **Auth** | JWT | Token de sesiune stocat în httpOnly cookie (5h expiry) |
| **Storage** | Google Drive | Materiale și documente pentru consultații |
| **Meeting** | Zoom / Google Meet | Sesiuni de consultație online |

---

## 9. Structura Proiectului

```
tutoring-app/
├── back-end/              # API REST (Express.js + Sequelize + MySQL)
│   ├── server.js
│   ├── config/
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   └── middleware/
├── front-end/             # SPA (React + Vite)
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── README.md
├── COMPONENTS.md
└── DATABASE_STRUCTURE.md
```

---

## 10. Setup & Development

### Backend

```bash
cd back-end

# Configurare — copiază și completează variabilele de mediu
cp .env.example .env

# Instalare dependențe
npm install

# Pornire server (port 5000)
npm run dev
```

**Variabile de mediu necesare:** `DB_NAME`, `DB_USER`, `DB_PASS`, `PORT`, `ORIGIN_SITE`, `SESSION_SECRET`, `JWT_SECRET`, `CLIENT_ID`, `CLIENT_SECRET`, `CALLBACK_URL`, `COOKIE_AGE`, `SITE_MODE`.

**Prerequisite:** MySQL activ (Laragon sau alt server MySQL pe localhost:3306). Baza de date se creează automat la prima pornire (`sequelize.sync({ alter: true })`).

### Frontend

```bash
cd front-end

# Instalare dependențe
npm install

# Pornire server development (port 5173)
npm run dev

# Build pentru producție
npm run build
```

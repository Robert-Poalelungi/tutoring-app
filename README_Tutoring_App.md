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
9. [Setup & Development](#9-setup--development)

---

## 1. Descriere Generală

Tutoring App este o aplicație web destinată studenților universitari care facilitează gestionarea și participarea la sesiuni de tutoring sau consultații organizate de cadrele didactice.

Aplicația permite:

- **Studenților** să vizualizeze consultațiile disponibile pentru anul și specializarea lor, dar și să adauge consultații din alți ani în cazul în care au restanțe sau trebuie să refacă anumite discipline.
- **Profesorilor** să organizeze consultații pentru materiile pe care le predau, să le editeze și să adauge materiale.
- **Administratorilor** să gestioneze utilizatorii, materiile și consultațiile la nivelul întregului sistem.

Scopul aplicației este de a centraliza informațiile despre consultații și de a oferi un mod simplu și organizat prin care studenții pot afla când au loc acestea și cum pot participa.

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

**Tehnologie:** Node.js

Backend-ul gestionează:

- Autentificarea utilizatorilor.
- Gestionarea rolurilor (RBAC).
- Gestionarea consultațiilor (CRUD).
- Gestionarea materiilor și atribuirea lor profesorilor.

### 3.3 Integrare Servicii Externe

- **Google Authentication** — autentificare cu contul instituțional.
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
- Buton de autentificare cu Google (cont instituțional).

După autentificare, aplicația verifică rolul utilizatorului și îl redirecționează:

- `student` → Student Dashboard
- `professor` → Professor Dashboard
- `admin` → Admin Panel

Dacă utilizatorul este nou (profilul nu este completat), este direcționat către procesul de **Onboarding**.

---

### 4.3 Onboarding

Procesul de onboarding are rolul de a colecta informațiile academice necesare pentru personalizarea aplicației. Este format din mai multe etape:

#### 4.3.1 Selectarea Facultății

Prima etapă constă în selectarea facultății din cadrul universității.

**Interfață:**

- 12 cartonașe (cards), câte unul pentru fiecare facultate.
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

### 6.2 Tabelul `users`

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

### 6.3 Tabelul `courses`

Conține toate disciplinele disponibile în aplicație.

| Câmp | Tip | Descriere |
|---|---|---|
| `id` | integer (PK) | ID unic disciplină |
| `name` | varchar | Numele disciplinei |
| `specialization` | varchar | Specializarea căreia îi aparține disciplina |
| `study_year` | integer | Anul în care se predă disciplina |

---

### 6.4 Tabelul `professor_courses`

Tabel de legătură care definește ce materii sunt atribuite fiecărui profesor.

| Câmp | Tip | Descriere |
|---|---|---|
| `id` | integer (PK) | ID unic |
| `professor_id` | integer (FK → `users.id`) | Profesorul căruia i se atribuie materia |
| `course_id` | integer (FK → `courses.id`) | Materia atribuită |

---

### 6.5 Tabelul `consultations`

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

### 6.6 Tabelul `user_consultations`

Tabel de legătură care definește relația student — consultație (la ce consultații participă fiecare student).

| Câmp | Tip | Descriere |
|---|---|---|
| `id` | integer (PK) | ID unic |
| `user_id` | integer (FK → `users.id`) | Studentul |
| `consultation_id` | integer (FK → `consultations.id`) | Consultația la care participă |
| `source` | varchar | Sursa: `auto` (generată automat pe baza anului/specializării) sau `manual` (adăugată de student pentru recuperări) |

---

## 7. API Endpoints

### 7.1 Autentificare & Profil

| Metodă | Endpoint | Descriere |
|---|---|---|
| `GET` | `/api/me` | Returnează datele utilizatorului autentificat (profil, rol). |

### 7.2 Consultații

| Metodă | Endpoint | Descriere |
|---|---|---|
| `GET` | `/api/consultations` | Returnează consultațiile relevante pentru utilizatorul curent. |
| `POST` | `/api/consultations` | Creează o consultație nouă (profesor / admin). |

### 7.3 Admin

| Metodă | Endpoint | Descriere |
|---|---|---|
| `POST` | `/api/admin/users` | Creează un utilizator nou (admin). |
| `POST` | `/api/admin/professors/:id/courses` | Atribuie o materie unui profesor (admin). |

---

## 8. Tehnologii Utilizate

| Categorie | Tehnologie | Detalii |
|---|---|---|
| **Frontend** | React | Bibliotecă UI pentru componente reutilizabile |
| **Frontend** | Vite | Build tool rapid cu HMR (Hot Module Replacement) |
| **Frontend** | JavaScript | Limbajul de programare principal |
| **Frontend** | CSS | Stilizare componente |
| **Backend** | Node.js | Runtime JavaScript server-side |
| **Auth** | Google Authentication | Autentificare cu cont instituțional |
| **Storage** | Google Drive | Materiale și documente pentru consultații |
| **Meeting** | Zoom / Google Meet | Sesiuni de consultație online |

### Vite Plugins Disponibile

- `@vitejs/plugin-react` — folosește Babel (sau oxc cu rolldown-vite) pentru Fast Refresh.
- `@vitejs/plugin-react-swc` — folosește SWC pentru Fast Refresh.

### ESLint

Proiectul poate fi extins cu TypeScript și reguli de lint type-aware folosind `typescript-eslint`.

---

## 9. Setup & Development

Proiectul folosește template-ul **React + Vite**.

```bash
# Instalare dependențe
npm install

# Pornire server development
npm run dev

# Build pentru producție
npm run build

# Preview build
npm run preview
```

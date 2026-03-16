# Tutoring App — Documentație

---

## Cuprins

1. [Descriere Generală](#1-descriere-generală)
2. [Roluri Utilizatori (RBAC)](#2-roluri-utilizatori-rbac)
3. [Back-end](#3-back-end)
   - [3.1 Arhitectura](#31-arhitectura)
   - [3.2 Autentificare și Autorizare](#32-autentificare-și-autorizare)
   - [3.3 Detecția Automată a Anului de Studiu](#33-detecția-automată-a-anului-de-studiu)
   - [3.4 Reguli de Înscriere ale Studentului](#34-reguli-de-înscriere-ale-studentului)
   - [3.5 Ciclul de Viață al Consultației](#35-ciclul-de-viață-al-consultației)
   - [3.6 Structura Bazei de Date](#36-structura-bazei-de-date)
   - [3.7 API Endpoints](#37-api-endpoints)
   - [3.8 Integrare Google Calendar](#38-integrare-google-calendar)
   - [3.9 Notificări pe Email](#39-notificări-pe-email)
   - [3.10 Structura Proiectului](#310-structura-proiectului)
   - [3.11 Tehnologii](#311-tehnologii)
   - [3.12 Setup & Development](#312-setup--development)
4. [Front-end](#4-front-end)
   - [4.1 Arhitectura](#41-arhitectura)
   - [4.2 Fluxuri și Pagini](#42-fluxuri-și-pagini)
   - [4.3 Structura Componentelor React](#43-structura-componentelor-react)
   - [4.4 Integrare Google Calendar — Interfață](#44-integrare-google-calendar--interfață)
   - [4.5 Structura Proiectului](#45-structura-proiectului)
   - [4.6 Tehnologii](#46-tehnologii)
   - [4.7 Setup & Development](#47-setup--development)

---

## 1. Descriere Generală

Tutoring App este o aplicație web dedicată organizării consultațiilor universitare, concepută pentru a facilita interacțiunea dintre studenți și cadre didactice. Platforma centralizează informațiile relevante despre sesiunile de tutoring și oferă un cadru unitar pentru planificarea, accesarea și administrarea acestora.

Aplicația folosește o **arhitectură client-server**. Frontend-ul și backend-ul sunt separate și comunică prin API REST.

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
- Gestiona facultățile și specializările.
- Vizualiza toate datele aplicației.

---

## 3. Back-end

### 3.1 Arhitectura

**Tehnologii:** Node.js, Express.js, Sequelize ORM, MySQL

Backend-ul este organizat în structura **MVC** (Models — Controllers — Routes) și gestionează:

- Autentificarea utilizatorilor (Google OAuth 2.0 via Passport.js).
- Sesiuni și autorizare prin JWT stocat în httpOnly cookie (expiră după 5 ore).
- Gestionarea rolurilor (RBAC) prin middleware (`isAuthenticated`, `hasRole`).
- Gestionarea consultațiilor (CRUD complet).
- Gestionarea materiilor și atribuirea lor profesorilor.
- Detecția automată a anului de studiu din emailul instituțional.
- Sincronizarea consultațiilor cu Google Calendar (opțional, per student).
- Notificări pe email pentru studenți (reminder-e și anulări de consultații, via Nodemailer + Gmail SMTP).

#### Integrare Servicii Externe

- **Google Authentication** — autentificare cu orice cont Google (OAuth 2.0 via Passport.js). Emailul instituțional este recomandat dar nu obligatoriu.
- **Google Calendar API v3** — sincronizare automată a consultațiilor în calendarul personal al studentului (via `googleapis`).
- **Google Drive** — stocare și partajare de materiale pentru consultații.
- **Zoom / Google Meet** — link-uri pentru sesiunile de consultație online.

---

### 3.2 Autentificare și Autorizare

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
   • Student → /dashboard
   • Profesor → /professor
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

---

### 3.3 Detecția Automată a Anului de Studiu

Această funcționalitate este disponibilă **doar pentru emailurile instituționale** cu formatul `XX@stud.ase.ro`. Dacă utilizatorul s-a autentificat cu un email personal (ex: `@gmail.com`), anul de studiu nu va fi detectat automat și va trebui setat manual la onboarding.

**Cum funcționează:**

- `poalelungirobert23@stud.ase.ro` → extrage `23` → a început în 2023 → **Anul 3** (în 2026).
- Formula: `anul_curent - (2000 + cifre_din_email)`, cu ajustare pentru luna curentă (anul universitar începe în octombrie).
- Dacă rezultatul este în afara intervalului 1–4, se consideră absolvent (`null`).
- Anul detectat este setat automat la crearea contului și trimis ca `detectedStudyYear` spre frontend la onboarding, unde studentul poate modifica manual în caz de repetare a anului universitar.

**Email instituțional vs. email personal:**

| Tip email | Login | Detecție an | Exemplu |
|---|---|---|---|
| Instituțional (`@stud.ase.ro`) | ✅ Funcționează | ✅ Automat | `poalelungirobert23@stud.ase.ro` |
| Personal (`@gmail.com`, etc.) | ✅ Funcționează | ❌ Manual la onboarding | `robertpoalelungi@gmail.com` |

---

### 3.4 Reguli de Înscriere ale Studentului

Platforma folosește două tipuri de asociere între student și consultație, definite prin câmpul `source` din tabela `user_consultations`.

#### Consultații automate (`source: auto`)

Consultațiile relevante pentru profilul academic al studentului sunt generate automat pe baza specializării, anului de studiu și seriei. Acestea apar implicit în dashboard fără intervenția studentului.

**Reguli:**

- La finalizarea onboarding-ului, sistemul asociază automat studentului consultațiile care corespund profilului său.
- Consultațiile automate sunt recalculate dacă studentul își modifică profilul academic (an de studiu, facultate, specializare).
- Sistemul evită duplicarea — dacă o consultație este deja asociată studentului, nu se creează o a doua înregistrare.
- Consultațiile automate nu pot fi eliminate manual de student din dashboard.

**Filtrare pe serie:**

- Consultațiile cu `serie = Toate` sunt vizibile și atribuite automat tuturor studenților care corespund anului și specializării, indiferent de serie.
- Consultațiile cu o serie specifică (ex: `serie = A`) sunt atribuite automat doar studenților din acea serie.
- Dacă studentul nu are seria completată în profil, vede doar consultațiile cu `serie = Toate`.

#### Consultații manuale (`source: manual`)

Studentul poate adăuga explicit consultații suplimentare care nu aparțin traseului său academic implicit. Acestea sunt destinate recuperărilor, restanțelor sau interesului pentru discipline din alți ani.

**Reguli:**

- Înscrierea manuală se face prin `POST /api/consultations/student/enroll`.
- Studentul poate elimina oricând o consultație manuală prin `DELETE /api/consultations/student/unenroll/:id`.
- Consultațiile manuale nu sunt afectate de schimbarea profilului academic — ele sunt păstrate indiferent de modificări.
- Consultațiile manuale sunt afișate într-un container separat în dashboard.

#### Comportament la schimbarea profilului

Dacă un student își modifică anul de studiu, facultatea sau specializarea:

1. Consultațiile cu `source: auto` sunt **recalculate** — cele care nu mai corespund noului profil sunt dezactivate, iar cele relevante pentru noul profil sunt adăugate.
2. Consultațiile cu `source: manual` sunt **păstrate** fără modificări.
3. Lista consultațiilor relevante este actualizată automat în dashboard.

#### Reguli de eligibilitate

- Studentul nu se poate înscrie la o consultație anulată sau finalizată.
- Un student nu poate fi înscris de două ori la aceeași consultație.

---

### 3.5 Ciclul de Viață al Consultației

O consultație nu este un simplu obiect CRUD — ea trece prin mai multe stări care influențează afișarea în calendar, înscrierea studenților, notificările pe email și sincronizarea cu Google Calendar.

#### Stări posibile

| Stare | Descriere | Vizibilă pentru student |
|---|---|---|
| `draft` | Consultația a fost creată dar nu este vizibilă pentru studenți. Profesorul sau adminul poate salva temporar datele fără publicare. | Nu |
| `published` | Consultația este publică — vizibilă în calendar și în dashboard-uri. Studenții o pot vedea și se pot înscrie. Editarea nu schimbă starea. | Da |
| `cancelled` | Consultația nu mai are loc. Nu mai permite înscrieri. Studenții înscriși sunt notificați pe email. | Da |
| `completed` | Consultația a avut loc și este considerată încheiată. Utilă pentru istoric. | Da |

#### Vizibilitate per rol

| Rol | Stări vizibile |
|---|---|
| Student | `published`, `cancelled`, `completed` |
| Profesor | Toate (`draft`, `published`, `cancelled`, `completed`) |
| Admin | Toate |

#### Tranziții între stări

```
  Creare ──► draft ──► published ──► completed
                          │
                          └──► cancelled
```

1. Profesorul sau adminul creează consultația → `draft` sau direct `published`.
2. Consultația este publicată → `published`. Din acest moment studenții o văd și se pot înscrie.
3. Consultația poate fi editată oricând cât este `published` — starea rămâne `published`. Google Calendar este re-sincronizat.
4. Consultația este anulată → `cancelled`. Studenții înscriși sunt notificați pe email. Evenimentele Google Calendar sunt șterse.
5. Consultația trece de momentul programat → `completed`. Poate fi marcată automat printr-un job periodic sau manual de profesor/admin.

#### Evenimente din lifecycle și efectele lor

| Eveniment | Efecte |
|---|---|
| Creare consultație | Salvare în baza de date cu `status = draft` sau `published`. |
| Publicare consultație | `status` devine `published`. Devine vizibilă pentru studenți. |
| Editare consultație | `status` rămâne `published`. Re-sincronizare Google Calendar (update eveniment). |
| Înscriere student | Înregistrare în `user_consultations`. Creare eveniment Google Calendar (dacă studentul are calendar conectat). |
| Retragere student | Actualizare `status` în `user_consultations` → `withdrawn`. Ștergere eveniment Google Calendar. |
| Anulare consultație | `status` devine `cancelled`. `cancelled_at` și `cancellation_reason` sunt completate. Email de anulare trimis studenților înscriși. Ștergere evenimente Google Calendar. |
| Finalizare consultație | `status` devine `completed`. `completed_at` este completat. Consultația trece în istoric. |

#### Reguli funcționale

- Consultațiile cu `status = draft` sunt vizibile doar pentru profesor și admin.
- Studentul vede doar consultațiile cu status `published`, `cancelled` sau `completed`.
- Consultațiile `cancelled` nu permit înscrieri noi.
- Consultațiile `completed` pot fi accesate doar din istoric.
- O consultație anulată nu este ștearsă din baza de date — se păstrează pentru istoric, cu `cancellation_reason` opțional.

---

### 3.6 Structura Bazei de Date

#### 3.6.1 Diagrama Relațiilor

```
faculties ──< specializations ──< users
    │              │
    └──< courses ──┘

users ──< user_consultations >── consultations ──> courses
  │                                    │
  │ (role = professor)                 │
  └──< professor_courses >── courses ──┘
  │
  └──< google_calendar_connections
  │
  └──< consultation_calendar_syncs >── consultations

calendar_sessions (singleton — configurare sesiuni calendar)
```

---

#### 3.6.2 Tabela `faculties`

Conține lista facultăților din universitate. Folosită ca referință de tabelele `users` și `courses`.

| Câmp | Tip | Descriere |
|---|---|---|
| `id` | integer (PK) | ID unic facultate |
| `name` | varchar | Numele complet al facultății (ex: „Cibernetică, Statistică și Informatică Economică") |
| `abbreviation` | varchar | Abrevierea facultății (ex: „CSIE") |

---

#### 3.6.3 Tabela `specializations`

Conține specializările disponibile, fiecare legată de o facultate.

| Câmp | Tip | Descriere |
|---|---|---|
| `id` | integer (PK) | ID unic specializare |
| `name` | varchar | Numele specializării (ex: „Informatică Economică") |
| `faculty_id` | integer (FK → `faculties.id`) | Facultatea căreia îi aparține specializarea |

---

#### 3.6.4 Tabela `users`

Stochează informațiile despre toți utilizatorii aplicației (studenți, profesori, admini).

| Câmp | Tip | Descriere |
|---|---|---|
| `id` | integer (PK) | ID unic utilizator |
| `email` | varchar | Email instituțional |
| `first_name` | varchar | Prenume |
| `last_name` | varchar | Nume |
| `role` | enum(`student`, `professor`, `admin`) | Rolul utilizatorului în sistem |
| `faculty_id` | integer (FK → `faculties.id`) | Facultatea utilizatorului |
| `specialization_id` | integer (FK → `specializations.id`) | Specializarea utilizatorului |
| `study_year` | integer | Anul de studiu (relevant pentru studenți) |
| `serie` | varchar | Seria studentului (ex: „A", „B", „C1"). Folosită pentru filtrarea consultațiilor destinate unei serii specifice. Opțional — dacă nu este setat, studentul vede doar consultațiile cu `serie = Toate`. |
| `is_profile_completed` | boolean | Indică dacă utilizatorul a finalizat procesul de onboarding |
| `email_notifications_enabled` | boolean | Indică dacă studentul dorește să primească notificări pe email: reminder-e și anulări de consultații (implicit `true`). Poate fi dezactivat din pagina de profil. |
| `created_at` | timestamp | Data și ora creării contului |
| `updated_at` | timestamp | Data și ora ultimei modificări a profilului |

---

#### 3.6.5 Tabela `courses`

Conține toate disciplinele disponibile în aplicație.

| Câmp | Tip | Descriere |
|---|---|---|
| `id` | integer (PK) | ID unic disciplină |
| `name` | varchar | Numele disciplinei |
| `faculty_id` | integer (FK → `faculties.id`) | Facultatea căreia îi aparține disciplina |
| `specialization_id` | integer (FK → `specializations.id`) | Specializarea căreia îi aparține disciplina |
| `study_year` | integer | Anul în care se predă disciplina |

---

#### 3.6.6 Tabela `professor_courses`

Tabel de legătură care definește ce materii sunt atribuite fiecărui profesor.

| Câmp | Tip | Descriere |
|---|---|---|
| `id` | integer (PK) | ID unic |
| `professor_id` | integer (FK → `users.id`) | Profesorul căruia i se atribuie materia |
| `course_id` | integer (FK → `courses.id`) | Materia atribuită |

---

#### 3.6.7 Tabela `consultations`

Stochează toate consultațiile create în aplicație.

| Câmp | Tip | Descriere |
|---|---|---|
| `id` | integer (PK) | ID unic consultație |
| `course_id` | integer (FK → `courses.id`) | Disciplina pentru care se ține consultația |
| `professor_id` | integer (FK → `users.id`) | Profesorul care ține consultația |
| `date` | date | Data consultației |
| `time` | time | Ora consultației |
| `duration` | integer | Durata consultației în minute (implicit `120`). Poate fi modificată de profesor sau admin. |
| `type` | varchar | Tipul consultației: `online` sau `fizic` |
| `room` | varchar | Numărul sălii (pentru consultații fizice) |
| `meeting_link` | varchar | Link Zoom / Google Meet (pentru consultații online) |
| `materials_link` | varchar | Link către folderul Google Drive cu materiale |
| `serie` | varchar | Seria pentru care este destinată consultația (implicit `Toate`). Dacă este setată o valoare specifică (ex: „A", „B"), doar studenții din acea serie sunt înscriși automat. |
| `status` | enum(`draft`, `published`, `cancelled`, `completed`) | Starea curentă a consultației (implicit `published`) |
| `published_at` | timestamp | Data și ora publicării consultației |
| `cancelled_at` | timestamp | Data și ora anulării (dacă este cazul) |
| `completed_at` | timestamp | Data și ora la care consultația a fost marcată ca finalizată |
| `cancellation_reason` | text | Motivul anulării (opțional, completat de profesor sau admin) |
| `created_at` | timestamp | Data și ora creării consultației |
| `updated_at` | timestamp | Data și ora ultimei editări a consultației |

---

#### 3.6.8 Tabela `user_consultations`

Tabel de legătură care definește relația student — consultație (la ce consultații participă fiecare student).

| Câmp | Tip | Descriere |
|---|---|---|
| `id` | integer (PK) | ID unic |
| `user_id` | integer (FK → `users.id`) | Studentul |
| `consultation_id` | integer (FK → `consultations.id`) | Consultația la care participă |
| `source` | varchar | Sursa: `auto` (generată automat pe baza anului/specializării) sau `manual` (adăugată de student pentru recuperări) |
| `status` | enum(`active`, `withdrawn`) | Starea înscrierii (implicit `active`). Devine `withdrawn` dacă studentul se retrage. |
| `enrolled_at` | timestamp | Data și ora la care studentul a fost înscris la consultație |
| `withdrawn_at` | timestamp | Data și ora retragerii studentului (dacă `status = withdrawn`) |
| `reminder_1day_sent` | boolean | Indică dacă reminder-ul cu o zi înainte a fost trimis (implicit `false`) |
| `reminder_1hour_sent` | boolean | Indică dacă reminder-ul cu o oră înainte a fost trimis (implicit `false`) |

---

#### 3.6.9 Tabela `google_calendar_connections`

Stochează conexiunea dintre un student și contul său Google Calendar. Fiecare student poate avea cel mult o conexiune activă.

| Câmp | Tip | Descriere |
|---|---|---|
| `id` | integer (PK) | ID unic |
| `user_id` | integer (FK → `users.id`) | Studentul care a conectat calendarul |
| `google_email` | varchar | Email-ul contului Google conectat |
| `access_token` | text | Token de acces Google (criptat) |
| `refresh_token` | text | Refresh token Google (criptat) |
| `token_expiry` | datetime | Data și ora expirării token-ului de acces |
| `calendar_id` | varchar | ID-ul calendarului Google (implicit `primary`) |
| `is_active` | boolean | Indică dacă conexiunea este activă |
| `created_at` | timestamp | Data conectării |
| `updated_at` | timestamp | Ultima actualizare |

---

#### 3.6.10 Tabela `consultation_calendar_syncs`

Tabel de legătură care mapează consultațiile din platformă cu evenimentele create în Google Calendar. Fiecare înregistrare reprezintă un eveniment sincronizat pentru un student specific.

| Câmp | Tip | Descriere |
|---|---|---|
| `id` | integer (PK) | ID unic |
| `consultation_id` | integer (FK → `consultations.id`) | Consultația din platformă |
| `user_id` | integer (FK → `users.id`) | Studentul pentru care s-a creat evenimentul |
| `google_event_id` | varchar | ID-ul evenimentului din Google Calendar |
| `calendar_id` | varchar | ID-ul calendarului în care a fost creat evenimentul |
| `sync_status` | enum(`synced`, `failed`, `pending`) | Starea sincronizării |
| `last_synced_at` | datetime | Ultima sincronizare reușită |
| `last_error` | text | Mesajul ultimei erori (dacă există) |

---

#### 3.6.11 Tabela `calendar_sessions`

Tabel singleton care stochează configurarea sesiunilor de calendar ale aplicației. Conține o singură înregistrare, actualizată de administrator.

| Câmp | Tip | Descriere |
|---|---|---|
| `id` | integer (PK) | ID unic (întotdeauna 1) |
| `active_session` | enum(`winter`, `summer`) | Sesiunea activă curentă: `winter` (ianuarie–februarie) sau `summer` (iunie–iulie) |
| `winter_months` | json | Lunile sesiunii de iarnă (implicit `[1, 2]` — ianuarie, februarie) |
| `summer_months` | json | Lunile sesiunii de vară (implicit `[6, 7]` — iunie, iulie) |
| `updated_at` | timestamp | Ultima actualizare a setărilor |
| `updated_by` | integer (FK → `users.id`) | Administratorul care a făcut ultima modificare |

**Comportament:** Calendarul afișează doar lunile corespunzătoare sesiunii active. Navigarea între luni este restricționată la intervalul sesiunii selectate de admin. La schimbarea sesiunii, calendarul se actualizează automat pentru toți utilizatorii.

---

### 3.7 API Endpoints

#### 3.7.1 Autentificare (`/api/auth`)

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
- Redirecționare: dacă `isProfileCompleted === false` → `/onboarding`. Altfel, pe baza rolului → `/dashboard` (student), `/professor` (profesor), sau `/admin` (admin).

#### 3.7.2 Utilizator (`/api/user`)

| Metodă | Endpoint | Acces | Descriere |
|---|---|---|---|
| `GET` | `/api/user/me` | Public | Returnează datele utilizatorului autentificat + `detectedStudyYear`. |
| `PUT` | `/api/user/complete-profile` | Autentificat | Completarea profilului (onboarding). |
| `PUT` | `/api/user/update-profile` | Autentificat | Actualizare profil (nume, prenume, an, facultate, specializare). |
| `PUT` | `/api/user/email-notifications` | Autentificat | Activează sau dezactivează notificările pe email. Body: `{ enabled: true/false }`. |

#### 3.7.3 Facultăți (`/api/faculties`)

| Metodă | Endpoint | Acces | Descriere |
|---|---|---|---|
| `GET` | `/api/faculties` | Public | Returnează toate facultățile (id, nume, abreviere). Folosit de onboarding, filtre calendar și profil. |

#### 3.7.4 Specializări (`/api/specializations`)

| Metodă | Endpoint | Acces | Descriere |
|---|---|---|---|
| `GET` | `/api/specializations` | Public | Returnează toate specializările. |
| `GET` | `/api/specializations?facultyId=` | Public | Specializările filtrate pe facultate. Folosit de onboarding, filtre calendar și profil. |

#### 3.7.5 Materii (`/api/courses`)

| Metodă | Endpoint | Acces | Descriere |
|---|---|---|---|
| `GET` | `/api/courses` | Public | Returnează toate materiile. |
| `GET` | `/api/courses/filter?studyYear=&specializationId=` | Public | Materii filtrate pe an și specializare. |
| `GET` | `/api/courses/my` | Profesor | Materiile atribuite profesorului autentificat. |
| `GET` | `/api/courses/:id` | Public | O materie după ID (include profesorii atribuiți). |

#### 3.7.6 Consultații (`/api/consultations`)

| Metodă | Endpoint | Acces | Descriere |
|---|---|---|---|
| `GET` | `/api/consultations` | Public | Toate consultațiile (pentru calendarul public), cu filtrare opțională pe `studyYear` și `specializationId`. |
| `GET` | `/api/consultations/:id` | Public | O consultație după ID cu detalii complete. |
| `GET` | `/api/consultations/student/my` | Student | Consultațiile studentului (`auto` pe baza anului/specializării + `manual` pentru recuperări). |
| `POST` | `/api/consultations/student/enroll` | Student | Înscriere la o consultație pentru recuperare (sursa: `manual`). |
| `DELETE` | `/api/consultations/student/unenroll/:id` | Student | Eliminare consultație manuală din lista studentului. |
| `GET` | `/api/consultations/professor/my` | Profesor / Admin | Consultațiile create de profesorul autentificat. |
| `POST` | `/api/consultations/create` | Profesor / Admin | Creează o consultație nouă. Body: `courseId`, `date`, `time`, `type`, opțional: `duration`, `room`, `meetingLink`, `materialsLink`, `serie`, `status`. |
| `PUT` | `/api/consultations/update/:id` | Profesor / Admin | Editează o consultație (profesorul poate edita doar consultațiile proprii). Câmpuri editabile: `date`, `time`, `duration`, `type`, `room`, `meetingLink`, `materialsLink`, `serie`. |
| `PUT` | `/api/consultations/cancel/:id` | Profesor / Admin | Anulează o consultație publicată. Body opțional: `cancellationReason`. Trimite email de anulare studenților înscriși și șterge evenimentele din Google Calendar. |
| `PUT` | `/api/consultations/complete/:id` | Profesor / Admin | Marchează o consultație publicată ca finalizată. |
| `DELETE` | `/api/consultations/delete/:id` | Profesor / Admin | Șterge permanent o consultație din baza de date. Șterge și evenimentele din Google Calendar înainte de ștergere. |

#### 3.7.7 Admin (`/api/admin`)

Toate rutele de admin necesită autentificare + rol `admin`.

| Metodă | Endpoint | Descriere |
|---|---|---|
| `GET` | `/api/admin/users` | Returnează toți utilizatorii. |
| `GET` | `/api/admin/users/:id` | Returnează un utilizator după ID. |
| `POST` | `/api/admin/users` | Creează un utilizator nou. |
| `PUT` | `/api/admin/users/:id/role` | Modifică rolul unui utilizator. |
| `DELETE` | `/api/admin/users/:id` | Șterge un utilizator. |
| `GET` | `/api/admin/faculties` | Returnează toate facultățile. |
| `POST` | `/api/admin/faculties` | Creează o facultate nouă. |
| `PUT` | `/api/admin/faculties/:id` | Editează o facultate. |
| `DELETE` | `/api/admin/faculties/:id` | Șterge o facultate. |
| `GET` | `/api/admin/specializations` | Returnează toate specializările. |
| `POST` | `/api/admin/specializations` | Creează o specializare nouă (cu `faculty_id`). |
| `PUT` | `/api/admin/specializations/:id` | Editează o specializare. |
| `DELETE` | `/api/admin/specializations/:id` | Șterge o specializare. |
| `POST` | `/api/admin/courses` | Creează o materie nouă. |
| `PUT` | `/api/admin/courses/:id` | Editează o materie. |
| `DELETE` | `/api/admin/courses/:id` | Șterge o materie. |
| `POST` | `/api/admin/professors/:id/courses` | Atribuie o materie unui profesor. |
| `DELETE` | `/api/admin/professors/:id/courses` | Elimină atribuirea unei materii de la un profesor. |
| `GET` | `/api/admin/settings` | Returnează setările aplicației (inclusiv sesiunea activă). |
| `PUT` | `/api/admin/settings/session` | Schimbă sesiunea activă (`winter` sau `summer`). Calendarul se actualizează automat pentru toți utilizatorii. |

#### 3.7.8 Setări Publice (`/api/settings`)

| Metodă | Endpoint | Acces | Descriere |
|---|---|---|---|
| `GET` | `/api/settings/session` | Public | Returnează sesiunea activă și lunile corespunzătoare. Folosit de frontend pentru a configura calendarul. |

#### 3.7.9 Google Calendar (`/api/google-calendar`)

Toate rutele necesită autentificare (`isAuthenticated`). Rutele de conectare și deconectare sunt disponibile doar pentru studenți.

| Metodă | Endpoint | Acces | Descriere |
|---|---|---|---|
| `GET` | `/api/google-calendar/connect` | Student | Inițiază fluxul OAuth Google Calendar. Redirecționează către pagina de consimțământ Google cu scope-ul `calendar.events` și `access_type=offline`. |
| `GET` | `/api/google-calendar/callback` | Student | Callback OAuth. Primește codul de autorizare, obține token-urile de la Google, le salvează în `google_calendar_connections`, și redirecționează studentul înapoi în dashboard. |
| `GET` | `/api/google-calendar/status` | Student | Verifică starea conexiunii Google Calendar a studentului autentificat. Returnează `{ connected: true/false, googleEmail, lastSyncedAt }`. |
| `POST` | `/api/google-calendar/disconnect` | Student | Deconectează calendarul: revocă token-urile Google, șterge evenimentele sincronizate, marchează conexiunea ca inactivă. |
| `POST` | `/api/google-calendar/sync` | Student | Forțează re-sincronizarea tuturor consultațiilor studentului cu Google Calendar (util dacă au apărut erori anterioare). |

---

### 3.8 Integrare Google Calendar

#### 3.8.1 Descriere Generală

Platforma oferă integrare cu Google Calendar pentru studenți, permițând sincronizarea automată a consultațiilor în calendarul personal. Sistemul propriu al aplicației rămâne sursa principală de adevăr pentru consultații, iar Google Calendar este utilizat exclusiv ca destinație de sincronizare.

**Principiu:** Profesorii creează și gestionează consultațiile exclusiv în platformă. Dacă un student are calendarul Google conectat, consultațiile la care este înscris sunt sincronizate automat. Orice modificare sau anulare realizată de profesor se propagă automat către calendarele studenților afectați.

#### 3.8.2 Fluxul General

```
1. Studentul conectează Google Calendar din dashboard sau pagina de profil
       ↓
2. OAuth 2.0 — studentul acordă permisiunea de acces la calendar
       ↓
3. Backend-ul salvează token-urile (access + refresh) asociate contului studentului
       ↓
4. La înscriere la consultație → sistemul creează automat eveniment în Google Calendar
       ↓
5. La modificare consultație de către profesor → sistemul actualizează evenimentele tuturor studenților conectați
       ↓
6. La anulare consultație sau retragere student → sistemul șterge evenimentul din Google Calendar
```

#### 3.8.3 Tipul de Integrare

Integrarea folosește **Google Calendar API v3** cu **OAuth 2.0** per utilizator. Aceasta permite operații complete de creare, actualizare și ștergere a evenimentelor, spre deosebire de o simplă funcționalitate de tip `Add to Google Calendar` care nu suportă actualizare automată.

**Cerințe tehnice:**

- Autentificare OAuth 2.0 cu `access_type=offline` și `prompt=consent` pentru obținerea refresh token-ului.
- Scope necesar: `https://www.googleapis.com/auth/calendar.events`.
- Stocarea securizată a token-urilor în baza de date.
- Mecanism de reîmprospătare automată a token-ului de acces la expirare.

**Dependență npm:** `googleapis`

#### 3.8.4 Arhitectura

Integrarea este organizată ca un modul separat, independent de logica existentă a consultațiilor. Se introduce un **serviciu dedicat** care gestionează comunicarea cu Google Calendar API.

**Structura fișierelor adăugate:**

```
back-end/
├── models/
│   ├── googleCalendarConnection.js   # Model Sequelize
│   └── consultationCalendarSync.js   # Model Sequelize
├── services/
│   └── googleCalendarService.js      # Logica de sincronizare cu Google API
├── controllers/
│   └── googleCalendar.js             # Endpoint-uri pentru conectare/deconectare
└── routes/
    └── googleCalendar.js             # Rute /api/google-calendar
```

**Separarea Responsabilităților:**

| Strat | Responsabilitate |
|---|---|
| **Routes** (`routes/googleCalendar.js`) | Definirea endpoint-urilor HTTP și aplicarea middleware-urilor |
| **Controller** (`controllers/googleCalendar.js`) | Gestionarea request-urilor: validare, apelarea serviciului, returnarea răspunsurilor |
| **Service** (`services/googleCalendarService.js`) | Comunicarea cu Google Calendar API: creare, actualizare, ștergere evenimente, refresh token |
| **Models** | Stocarea token-urilor și a stării de sincronizare |

#### 3.8.5 Serviciul Google Calendar — Responsabilități

`googleCalendarService.js` expune următoarele operații:

1. **`createEvent(userId, consultationId)`** — Creează un eveniment în calendarul studentului pentru o consultație.
2. **`updateEvent(userId, consultationId)`** — Actualizează un eveniment existent după modificarea consultației.
3. **`deleteEvent(userId, consultationId)`** — Șterge un eveniment (la anulare consultație sau retragere student).
4. **`syncAllForConsultation(consultationId, action)`** — Sincronizează toți studenții conectați pentru o consultație (apelat la update/cancel/delete consultație de către profesor). `action` poate fi `"update"` sau `"delete"`.
5. **`revokeConnection(userId)`** — Revocă accesul la Google Calendar, șterge toate evenimentele sincronizate și marchează conexiunea ca inactivă.

**Reîmprospătarea token-ului** este gestionată automat intern de clientul OAuth2 prin evenimentul `tokens` — nu există o funcție separată exportată pentru aceasta.

#### 3.8.6 Integrarea cu Controller-ul de Consultații Existent

Controller-ul existent de consultații (`controllers/consultation.js`) este extins cu apeluri către serviciul de sincronizare:

| Operație existentă | Hook adăugat |
|---|---|
| `createConsultation()` | După creare, sincronizează pentru studenții auto-înscriși care au calendar conectat |
| `updateConsultation()` | După update, apelează `syncAllForConsultation()` pentru actualizarea evenimentelor |
| `deleteConsultation()` | Înainte de ștergere, apelează `syncAllForConsultation()` pentru ștergerea evenimentelor |
| `enrollConsultation()` | După înscriere, creează eveniment pentru studentul respectiv (dacă are calendar conectat) |
| `unenrollConsultation()` | După retragere, șterge evenimentul studentului |

**Important:** Sincronizarea se execută **asincron** (nu blochează răspunsul HTTP al profesorului). Erorile de sincronizare sunt loguite și stocate în `consultation_calendar_syncs.last_error`, fără a afecta operația principală.

#### 3.8.7 Informațiile Sincronizate în Evenimentul Google Calendar

Fiecare eveniment creat în Google Calendar conține:

| Câmp Google Calendar | Sursa din platformă |
|---|---|
| **Summary (titlu)** | `Consultație — {numele disciplinei}` |
| **Start / End** | Data, ora de start și ora de sfârșit calculată din `time + duration` |
| **Location** | Sala (pentru consultații fizice) sau link-ul de meeting (pentru consultații online) |
| **Description** | Numele profesorului, tipul consultației, link materiale, link către consultație în platformă |
| **Extended Properties** | `consultationId` — identificator intern pentru mapare |

#### 3.8.8 Scenarii și Tratarea Erorilor

Integrarea tratează explicit următoarele scenarii:

| Situație | Comportament |
|---|---|
| Studentul nu are Google Calendar conectat | Operațiile CRUD pe consultații funcționează normal, fără sincronizare |
| Token-ul de acces a expirat | Sistemul folosește refresh token-ul pentru a obține un token nou automat |
| Studentul și-a revocat permisiunile din contul Google | Sync-ul eșuează, `sync_status` devine `failed`, conexiunea este marcată ca inactivă |
| Google API returnează eroare temporară | `sync_status` devine `failed`, `last_error` salvează detaliile; se poate reîncerca manual sau printr-un job periodic |
| Profesorul modifică o consultație cu mulți studenți conectați | Sincronizarea se face asincron pentru a nu bloca request-ul; se respectă rate limit-urile Google API |
| Studentul se retrage dintr-o consultație deja sincronizată | Evenimentul este șters din Google Calendar și înregistrarea de sync este actualizată |
| Consultația este anulată | Toate evenimentele asociate sunt șterse din calendarele studenților conectați |

#### 3.8.9 Considerații de Securitate

1. **Token-urile Google** (access + refresh) sunt stocate în baza de date în câmpuri de tip `TEXT`. Accesul la baza de date trebuie securizat corespunzător la nivel de infrastructură.
2. **Refresh token-urile** nu sunt expuse niciodată prin API — rămân exclusiv pe server.
3. **Endpoint-urile** de integrare sunt accesibile doar utilizatorului autentificat, pentru propriul cont.
4. **Erorile** sunt loguite fără a expune token-uri sau date sensibile.
5. **Revocarea** consimțământului din contul Google este tratată corect — sistemul detectează token-urile invalide și marchează conexiunea ca inactivă.
6. **Separare clară** între autentificarea în aplicație (Google OAuth pentru login) și conectarea calendarului (OAuth separat cu scope diferit).

#### 3.8.10 Limitări Cunoscute

1. Integrarea funcționează doar cu Google Calendar — nu cu alte servicii de calendar.
2. Sincronizarea este unidirecțională: platforma → Google Calendar. Modificările făcute direct în Google Calendar nu sunt reflectate în aplicație.
3. Rate limit-urile Google Calendar API pot întârzia sincronizarea dacă un profesor modifică o consultație cu un număr foarte mare de studenți conectați.
4. Dacă un student își schimbă contul Google, trebuie să deconecteze și să reconecteze calendarul.

---

### 3.9 Notificări pe Email

#### 3.9.1 Descriere Generală

Platforma trimite notificări pe email studenților înscriși la consultații. Nu există notificări in-app — singura formă de notificare este emailul.

**Studentul poate dezactiva notificările pe email** din pagina de profil. Când opțiunea este dezactivată, studentul nu primește niciun email de la platformă.

#### 3.9.2 Tipuri de Notificări

| Tip | Descriere | Când se trimite |
|---|---|---|
| `consultation_reminder_1day` | Reminder cu o zi înainte de consultație | Cu 24 de ore înainte de ora programată |
| `consultation_reminder_1hour` | Reminder cu o oră înainte de consultație | Cu 1 oră înainte de ora programată |
| `consultation_cancelled` | Consultație anulată | Imediat ce profesorul sau adminul anulează consultația |

**Destinatari:** Toate cele trei tipuri sunt trimise doar studenților înscriși la consultația respectivă (cu `status = active` în `user_consultations`) care au `email_notifications_enabled = true`.

#### 3.9.3 Generarea Reminder-elor (Scheduler)

Reminder-ele sunt generate de un **job periodic (cron)** care rulează în backend folosind `node-cron`.

**Funcționare:**

1. Job-ul rulează la fiecare 15 minute.
2. La fiecare execuție, caută consultații cu status `published` care încep în următoarele 24 de ore sau în următoarea oră.
3. Pentru fiecare consultație găsită, identifică studenții înscriși cu `email_notifications_enabled = true`.
4. Trimite emailul prin `emailService.js`.
5. Evită trimiterea duplicată — ține evidența reminder-elor deja trimise pentru a nu trimite același email de două ori.

**Anularea consultației** nu depinde de scheduler — emailul de anulare este trimis imediat, sincron cu operația de anulare din controller-ul de consultații.

#### 3.9.4 Serviciul de Email

Trimiterea emailurilor este gestionată de `emailService.js`, care folosește **Nodemailer** cu un cont SMTP configurat prin variabile de mediu.

**Conținutul emailurilor:**

| Tip | Subiect | Conținut |
|---|---|---|
| Reminder 1 zi | „Mâine: Consultație {disciplină}" | Disciplina, profesorul, data, ora, tipul, sala/link |
| Reminder 1 oră | „În curând: Consultație {disciplină}" | Disciplina, profesorul, ora, tipul, sala/link |
| Anulare | „Anulată: Consultație {disciplină}" | Disciplina, profesorul, data inițială, motivul anulării (dacă există) |

**Reguli:**
- Emailurile sunt trimise **asincron** — nu blochează operația principală.
- Erorile de trimitere sunt loguite fără a afecta funcționarea platformei.
- Emailurile duplicate sunt evitate — sistemul verifică dacă un email similar a fost deja trimis.

#### 3.9.5 Arhitectura

```
back-end/
├── services/
│   ├── emailNotificationService.js   # Scheduler (cron), logica de trimitere reminder-e, evitare duplicate
│   └── emailService.js               # Conectare SMTP, formatare email, trimitere efectivă via Nodemailer
```

**Separarea Responsabilităților:**

| Strat | Responsabilitate |
|---|---|
| **`emailNotificationService.js`** | Job-ul cron, identificarea consultațiilor și studenților, decizia de trimitere, evitare duplicate |
| **`emailService.js`** | Conectare SMTP, formatare conținut email, trimitere efectivă |

---

### 3.10 Structura Proiectului

```
back-end/
├── server.js              # Entry point — Express, middleware, sync DB
├── config/
│   ├── db.js              # Conexiune Sequelize → MySQL
│   └── auth.js            # Google OAuth (Passport.js)
├── models/
│   ├── index.js           # Relații între modele
│   ├── user.js            # Student / Professor / Admin
│   ├── faculty.js         # Facultăți
│   ├── specialization.js  # Specializări
│   ├── course.js          # Materii
│   ├── consultation.js    # Consultații
│   ├── professorCourse.js # Join: profesor ↔ materie
│   ├── userConsultation.js# Join: student ↔ consultație
│   ├── googleCalendarConnection.js    # Conexiuni Google Calendar per student
│   ├── consultationCalendarSync.js    # Mapare consultație ↔ eveniment Google
│   └── calendarSessions.js           # Configurare sesiuni calendar
├── services/
│   ├── googleCalendarService.js       # Logica de sincronizare cu Google API
│   ├── emailNotificationService.js    # Scheduler (cron) pentru reminder-e email
│   └── emailService.js               # Trimitere email via Nodemailer
├── controllers/
│   ├── user.js            # Profil, onboarding
│   ├── course.js          # Materii (listare, filtrare)
│   ├── consultation.js    # CRUD consultații + enroll/unenroll
│   ├── faculty.js         # Listare facultăți (public)
│   ├── specialization.js  # Listare specializări cu filtru facultate (public)
│   ├── admin.js           # CRUD users, faculties, specializations, courses, assign courses, settings
│   ├── googleCalendar.js  # Endpoint-uri conectare/deconectare calendar
│   └── settings.js        # Sesiunea activă (public)
├── validators/
│   ├── consultationValidator.js  # Validare date, oră, durată, tip consultație
│   └── userValidator.js          # Validare date profil și onboarding
├── utils/
│   ├── detectStudyYear.js        # Logica de detecție automată a anului de studiu
│   └── dateHelpers.js            # Funcții helper pentru calcule cu date (scheduler, calendar)
├── routes/
│   ├── index.js           # Montează toate sub-rutele pe /api
│   ├── auth.js            # /api/auth — Google OAuth
│   ├── user.js            # /api/user — profil utilizator
│   ├── faculty.js         # /api/faculties — facultăți (public)
│   ├── specialization.js  # /api/specializations — specializări (public)
│   ├── course.js          # /api/courses — materii
│   ├── consultation.js    # /api/consultations — consultații
│   ├── admin.js           # /api/admin — administrare
│   ├── googleCalendar.js  # /api/google-calendar — sincronizare calendar
│   └── settings.js        # /api/settings — setări publice (sesiune activă)
├── middleware/
│   └── auth.js            # isAuthenticated + hasRole(...)
└── .env.example               # Exemplu variabile de mediu (fără valori reale)
```

---

### 3.11 Tehnologii

| Tehnologie | Detalii |
|---|---|
| Node.js + Express.js | Runtime JavaScript server-side + framework HTTP |
| Sequelize | ORM pentru MySQL — modele, relații, migrări |
| MySQL | Baza de date relațională |
| Google OAuth 2.0 | Autentificare cu orice cont Google (via Passport.js) |
| JWT | Token de sesiune stocat în httpOnly cookie (5h expiry) |
| Google Calendar API v3 | Sincronizare automată consultații (via `googleapis`) |
| Google Drive | Materiale și documente pentru consultații |
| Nodemailer | Trimitere notificări pe email via SMTP |
| node-cron | Scheduler pentru job-uri periodice (reminder-e email) |

---

### 3.12 Setup & Development

```bash
cd back-end

# Configurare — copiază și completează variabilele de mediu
cp .env.example .env

# Instalare dependențe
npm install

# Pornire server (port 5000)
npm run dev
```

**Variabile de mediu necesare:**

| Variabilă | Descriere |
|---|---|
| `DB_NAME` | Numele bazei de date MySQL |
| `DB_USER` | Utilizatorul MySQL |
| `DB_PASS` | Parola MySQL |
| `PORT` | Portul serverului (implicit 5000) |
| `ORIGIN_SITE` | URL-ul frontend-ului (ex: `http://localhost:5173`) |
| `SESSION_SECRET` | Secret pentru sesiuni Express |
| `JWT_SECRET` | Secret pentru semnarea token-urilor JWT |
| `CLIENT_ID` | Google OAuth Client ID |
| `CLIENT_SECRET` | Google OAuth Client Secret |
| `CALLBACK_URL` | URL callback OAuth (ex: `http://localhost:5000/api/auth/google/callback`) |
| `COOKIE_AGE` | Durata cookie-ului în milisecunde |
| `SITE_MODE` | Modul aplicației (`dev` / `prod`) |
| `GOOGLE_CALENDAR_CLIENT_ID` | Client ID pentru Google Calendar API (poate fi același cu `CLIENT_ID`) |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | Client Secret pentru Google Calendar API |
| `GOOGLE_CALENDAR_REDIRECT_URI` | URL callback OAuth Calendar (ex: `http://localhost:5000/api/google-calendar/callback`) |
| `SMTP_HOST` | Host-ul serverului SMTP (ex: `smtp.gmail.com`) |
| `SMTP_PORT` | Portul SMTP (ex: `587`) |
| `SMTP_USER` | Email-ul contului SMTP folosit pentru trimitere |
| `SMTP_PASS` | Parola sau App Password-ul contului SMTP |
| `EMAIL_FROM` | Adresa afișată ca expeditor (ex: `Tutoring App <noreply@tutoringapp.ro>`) |

**Prerequisite:** MySQL activ (Laragon sau alt server MySQL pe localhost:3306). Baza de date se creează automat la prima pornire (`sequelize.sync({ alter: true })`).

---

## 4. Front-end

### 4.1 Arhitectura

**Tehnologii:** React, Vite, JavaScript, CSS

Frontend-ul gestionează:

- Interfața utilizatorului (UI).
- Routing-ul aplicației.
- Apelurile către API-ul backend-ului.

**State Management:**

- **React Context** — pentru gestionarea datelor utilizatorului (rol, profil, stare autentificare).
- **useState** — pentru starea locală a componentelor.
- **useEffect** — pentru apeluri API și side effects.

---

### 4.2 Fluxuri și Pagini

#### 4.2.1 Calendar Page (Home / Public)

Pagina de Calendar este pagina principală (home) a aplicației. Aceasta este pagina pe care o vede orice vizitator care nu este autentificat. Dacă un utilizator nelogat accesează aplicația, este redirecționat automat către această pagină.

**Scop:** Afișarea tuturor consultațiilor de tutoring disponibile într-un format de calendar, accesibil publicului larg, fără a necesita autentificare. Consultațiile afișate provin exclusiv din baza de date a platformei — pagina nu depinde de Google Calendar pentru funcționare.

**Principiul de funcționare:**

1. Backend-ul stochează consultațiile în baza de date.
2. Frontend-ul cere consultațiile prin API.
3. Răspunsul este transformat în evenimente de calendar.
4. Componenta de calendar le afișează în interfață.
5. La interacțiunea cu un eveniment sunt afișate detaliile complete.

**Componenta de calendar:** Calendarul este construit manual ca o componentă React custom, fără dependențe externe. Această abordare oferă control total asupra design-ului și comportamentului, bundle size minim, și elimină dependența de biblioteci terțe. Componenta generează o grilă lunară, gestionează navigarea între luni și evidențiază zilele care conțin consultații.

**Sesiunea activă:** Calendarul afișează doar lunile corespunzătoare sesiunii de examene active, configurată de administrator:

- **Sesiunea de iarnă** — ianuarie și februarie.
- **Sesiunea de vară** — iunie și iulie.

Navigarea este restricționată la lunile sesiunii active — utilizatorul nu poate naviga în afara acestui interval. La încărcarea paginii, frontend-ul apelează `GET /api/settings/session` pentru a determina lunile disponibile și setează automat prima lună a sesiunii active ca lună inițială.

**Layout — Două Panouri:**

Pagina este împărțită în două secțiuni principale, afișate side-by-side:

**Panoul din stânga — Lista consultațiilor din ziua selectată:**

Panoul din stânga are rolul de a afișa lista consultațiilor programate în ziua selectată din calendar. Atunci când utilizatorul apasă pe caseta corespunzătoare unei zile, această zonă se actualizează și afișează toate consultațiile aferente datei respective. Panoul funcționează ca o zonă informativă permanent vizibilă, nu ca un modal temporar.

La încărcarea inițială a paginii, ziua selectată este data curentă, iar panoul stâng este populat automat cu consultațiile din ziua curentă.

Conținutul panoului:

- Data selectată, afișată în partea superioară ca element de context.
- Numărul total de consultații din ziua respectivă.
- Lista consultațiilor programate, fiecare afișată ca un cartonaș compact.

Informații afișate pe fiecare cartonaș:

- Numele disciplinei.
- Numele profesorului.
- Ora consultației.
- Buton **Detalii**.

La apăsarea butonului **Detalii**, aplicația deschide o fereastră modală cu informațiile complete despre consultația selectată:

- Numele disciplinei.
- Numele profesorului.
- Data și ora consultației.
- Tipul consultației (online / fizic).
- Sala, dacă este o consultație fizică.
- Link-ul de meeting, dacă este o consultație online.
- Link-ul către materiale.
- Acțiuni suplimentare: înscriere, accesare directă a link-ului.

Dacă în ziua selectată nu există consultații, panoul afișează un mesaj informativ: „Nu există consultații programate pentru această zi."

**Panoul din dreapta — Calendarul:**

Partea din dreapta conține calendarul propriu-zis și reprezintă elementul principal al paginii. Aici sunt afișate toate consultațiile sub formă de evenimente calendaristice.

Calendarul permite:

- Navigare între lunile sesiunii active (butoane previous / next, restricționate la intervalul sesiunii).
- Evidențierea zilelor care conțin consultații (marker vizual / dot).
- Diferențierea consultațiilor în funcție de tip sau relevanță prin culori.
- Selectarea unei zile prin click pe caseta de dată → actualizează panoul stâng.
- Evidențierea vizuală a zilei selectate și a zilei curente.

Pagina funcționează ca un layout de tip **master-detail**: calendarul din dreapta este zona de navigare, iar panoul din stânga este zona de informare detaliată.

**Zona de filtrare:**

Filtrele sunt poziționate deasupra întregii pagini, fără a afecta layout-ul celor două panouri. Filtrele modifică atât evenimentele afișate în calendar, cât și lista de consultații din panoul stâng.

Filtre disponibile:

- An de studiu (3 butoane — Anul 1, Anul 2, Anul 3; toggle / radio behaviour).
- Facultate (buton care deschide o modală cu facultățile din baza de date; selecția se salvează în cookies).
- Specializare.
- Tipul consultației: online sau fizic.
- Profesor.
- Disciplină.

**Reguli de afișare vizuală:**

- Consultațiile online au o culoare diferită față de cele fizice.
- Consultațiile relevante pentru studentul curent sunt evidențiate mai puternic.
- Consultațiile adăugate manual pentru recuperări au un marker distinct.
- Consultațiile anulate (`cancelled`) afișează o casetă cu fundal roșu și textul **„Anulat"**.
- Consultațiile finalizate (`completed`) afișează o casetă cu fundal verde și textul **„Finalizat"**.
- Consultațiile publicate (`published`) sunt afișate normal, fără casetă suplimentară.

**Comportament per tip de utilizator:**

| Utilizator | Comportament |
|---|---|
| Neautentificat | Vede calendarul public cu toate consultațiile disponibile, folosind doar filtrele publice. |
| Student | Vede consultațiile relevante pentru anul și specializarea sa, plus consultațiile suplimentare adăugate manual pentru recuperări sau restanțe. |
| Profesor | Vede consultațiile pe care le susține și are acces la acțiuni suplimentare (editare, ștergere). |
| Administrator | Vizualizează toate consultațiile și poate gestiona evenimentele la nivel global. |

**Modelul de date pentru evenimente:**

Consultațiile venite din backend sunt utilizate direct de componenta de calendar pentru a evidenția zilele cu consultații și de panoul stâng pentru a afișa lista detaliată:

```json
{
  "id": 12,
  "course": "Programare Web",
  "professor": "Popescu Andrei",
  "faculty": "CSIE",
  "studyYear": 3,
  "date": "2026-03-20",
  "time": "14:00",
  "duration": 120,
  "status": "published",
  "type": "online",
  "meetingLink": "https://meet.google.com/example",
  "materialsLink": "https://drive.google.com/example",
  "room": null
}
```

**Interacțiuni importante:**

1. Click pe o zi din calendar → panoul stâng afișează consultațiile din acea zi.
2. Navigare între lunile sesiunii active (butoane previous / next, dezactivate la marginile intervalului).
3. Evidențierea zilei curente și a zilei selectate.
4. Aplicare și resetare filtre.
5. Acțiuni contextuale din panoul stâng: înscriere, retragere, acces rapid la link-ul consultației.

**Relația cu Google Calendar:**

Calendarul din aplicație afișează consultațiile din baza de date proprie. Google Calendar este utilizat doar pentru sincronizare externă. Interfața aplicației nu depinde de Google pentru a funcționa.

**Comportament și Navigare:**

- Utilizatorii neautentificați sunt redirecționați către această pagină.
- Pagina este complet funcțională fără autentificare — este publică.
- Din această pagină, utilizatorul poate accesa pagina de **Login** pentru a se autentifica și a primi funcționalități suplimentare (dashboard personalizat, adăugare consultații de recuperare, etc.).

---

#### 4.2.2 Login

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

#### 4.2.3 Onboarding

Procesul de onboarding are rolul de a colecta informațiile academice necesare pentru personalizarea aplicației. Este format din mai multe etape:

**Selectarea Facultății:**

Prima etapă constă în selectarea facultății din cadrul universității.

**Interfață:**

- Cartonașe (cards) generate dinamic din tabela `faculties` (via `GET /api/faculties`). Cele 12 facultăți inițiale:
  1. Administrarea Afacerilor, cu predare în limbi străine (FABIZ)
  2. Administrație și Management Public (AMP)
  3. Business și Turism (BT)
  4. Cibernetică, Statistică și Informatică Economică (CSIE)
  5. Contabilitate și Informatică de Gestiune (CIG)
  6. Drept
  7. Economie și Comunicare în Afaceri (FE)
  8. Economie Agroalimentară și a Mediului (EAM)
  9. Finanțe, Asigurări, Bănci și Burse de Valori (FABBV)
  10. Management (MAN)
  11. Marketing (MK)
  12. Relații Economice Internaționale (REI)
- Fiecare cartonaș conține numele facultății.
- Buton pentru confirmarea selecției.

Această informație este utilizată ulterior pentru filtrarea consultațiilor.

**Completarea Datelor Personale:**

**Câmpuri:**

- **Email** — preluat automat din autentificare, afișat read-only.
- **Nume** — câmp editabil.
- **Prenume** — câmp editabil.
- **Anul de studiu** — detectat automat pe baza emailului instituțional; poate fi modificat manual în cazul repetării anului.
- **Specializarea** — câmp editabil (dropdown, populat din tabela `specializations` pe baza facultății selectate).
- **Seria** — câmp editabil, opțional (ex: „A", „B", „C1"). Determină la ce consultații specifice unei serii este înscris automat studentul.

Scopul acestei pagini este verificarea și completarea informațiilor academice.

**Selectarea Disciplinelor de Interes (Opțional):**

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

#### 4.2.4 Student Dashboard

Dashboard-ul reprezintă pagina principală a aplicației pentru student. Oferă o vedere de ansamblu asupra consultațiilor relevante.

**Consultațiile pentru Anul Studentului:**

În partea superioară a dashboard-ului sunt afișate consultațiile corespunzătoare anului și specializării studentului. Consultațiile sunt afișate sub forma unor cartonașe (cards) într-un container organizat într-un grid.

**Informații afișate pe card:**

- Numele disciplinei.
- Numele profesorului.
- Data consultației.
- Ora consultației.
- Buton **Detalii**.

**Modalul de Detalii ale Consultației:**

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

**Consultații pentru Recuperări sau Restanțe:**

Sub containerul principal se află o secțiune dedicată consultațiilor care nu aparțin anului studentului. Destinată situațiilor în care studentul are restanțe, reface examene sau dorește să participe la consultații din alți ani.

Studentul poate adăuga manual aceste consultații în dashboard. Consultațiile adăugate apar într-un container separat, dar folosesc același tip de card pentru consistența interfeței.

**Google Calendar:**

În partea de jos a dashboard-ului apare o secțiune legată de Google Calendar:

- **Dacă calendarul nu este conectat:** buton **„Conectează Google Calendar"** cu mesaj informativ. Butonul inițiază fluxul OAuth.
- **Dacă calendarul este conectat:** indicator vizual **„Calendar sincronizat"** cu email-ul Google conectat.

Gestionarea completă a conexiunii (deconectare, re-sincronizare, status detaliat) se face din **Pagina de Profil**.

---

#### 4.2.5 Pagina de Profil

Pagina de profil este accesibilă oricărui utilizator autentificat și afișează toate datele asociate contului său. De aici, utilizatorul își poate edita informațiile și gestiona preferințele.

**Date afișate:**

- **Email** — adresa de email asociată contului (read-only).
- **Nume** — câmp editabil.
- **Prenume** — câmp editabil.
- **Rol** — `student`, `professor` sau `admin` (read-only).
- **Facultate** — câmp editabil (dropdown, populat din tabela `faculties`).
- **Specializare** — câmp editabil (dropdown, populat din tabela `specializations` pe baza facultății selectate).
- **An de studiu** — câmp editabil (doar pentru studenți).
- **Serie** — câmp editabil, opțional (doar pentru studenți; ex: „A", „B", „C1").

**Secțiunea Notificări Email:**

- Toggle **„Primește notificări pe email"** — activat implicit.
- Când este dezactivat, studentul nu primește niciun email de la platformă.
- Când este activat, studentul primește emailuri: reminder cu o zi înainte, reminder cu o oră înainte, și notificare de anulare a consultației.
- Modificarea se face prin `PUT /api/user/email-notifications`.

**Secțiunea Google Calendar (doar pentru studenți):**

- Dacă calendarul este conectat: afișează email-ul Google conectat, data ultimei sincronizări, buton **Deconectează**, buton **Re-sincronizează**.
- Dacă calendarul nu este conectat: buton **Conectează Google Calendar** cu mesaj informativ.

**Buton Salvare:** Salvează modificările de profil prin `PUT /api/user/update-profile`.

---

#### 4.2.6 Professor Dashboard

Profesorul poate:

- Vizualiza materiile atribuite.
- Crea consultații noi.
- Gestiona consultațiile existente (editare, ștergere).

**Crearea unei consultații — câmpuri:**

- Materia (dropdown din materiile atribuite).
- Data.
- Ora.
- Durata (implicit 120 minute, editabilă).
- Tip consultație (online / fizic).
- Sală (dacă fizic) sau link meeting (dacă online).
- Link materiale (Google Drive).
- Seria (opțional — implicit „Toate"; dacă este specificată, doar studenții din acea serie sunt înscriși automat).

---

#### 4.2.7 Admin Panel

Adminul gestionează întregul sistem prin mai multe secțiuni:

**Users:**

- Vedea lista utilizatorilor.
- Adăuga utilizatori noi.
- Modifica rolurile utilizatorilor.

**Faculties (Facultăți):**

- Vedea lista facultăților.
- Adăuga facultăți noi.
- Modifica facultăți existente.

**Specializations (Specializări):**

- Vedea lista specializărilor per facultate.
- Adăuga specializări noi.
- Modifica specializări existente.

**Courses (Materii):**

- Crea materii noi.
- Modifica materii existente.

**Professors:**

- Atribui materii profesorilor.

**Consultations:**

- Crea consultații pentru profesori.
- Edita consultații existente.

**Settings (Setări):**

- Schimbarea sesiunii active (iarnă / vară).
- Interfață cu două butoane de tip toggle: `Sesiune Iarnă (Ian–Feb)` și `Sesiune Vară (Iun–Iul)`.
- La schimbarea sesiunii, calendarul se actualizează automat pentru toți utilizatorii — afișează doar lunile corespunzătoare sesiunii selectate.
- Indicatorul sesiunii active este afișat vizual (evidențiat).

---

### 4.3 Structura Componentelor React

#### 4.3.1 Ierarhia Completă a Componentelor

```
App
├── CalendarPage (Home / Public)
│   ├── CalendarFilters
│   ├── FacultySelectModal
│   ├── CalendarGrid
│   ├── DayConsultationsPanel
│   ├── ConsultationDetailsModal
│   └── ConsultationLegend
│
├── LoginPage
├── OnboardingFaculty
├── OnboardingProfile
├── OnboardingInterests
│
├── StudentDashboard
│   ├── GoogleCalendarButton
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
├── ProfilePage
│   ├── ProfileForm
│   ├── EmailNotificationsToggle
│   └── GoogleCalendarSection
│
├── AdminPanel
│   ├── UsersTable
│   ├── AddUserModal
│   ├── FacultiesManager
│   ├── SpecializationsManager
│   ├── ProfessorCoursesManager
│   ├── ConsultationsManager
│   └── SessionSettings
│
└── Layout
    ├── Navbar
    ├── Sidebar
    └── DashboardLayout
```

---

#### 4.3.2 Pagini (Pages)

| Pagină | Descriere |
|---|---|
| `CalendarPage` | Pagina de home (publică) — calendar cu toate consultațiile, filtrare pe an și facultate. |
| `LoginPage` | Pagina de autentificare cu Google. |
| `OnboardingFaculty` | Selectarea facultății (carduri generate din tabela `faculties`). |
| `OnboardingProfile` | Completarea datelor personale (email, nume, prenume, an, specializare). |
| `OnboardingInterests` | Selectarea disciplinelor de interes suplimentare (opțional). |
| `StudentDashboard` | Pagina principală a studentului — consultații an curent + recuperări. |
| `ProfilePage` | Pagina de profil — afișare și editare date utilizator, toggle notificări email (doar studenți), secțiune Google Calendar (doar studenți). |
| `ProfessorDashboard` | Pagina principală a profesorului — materii, creare și gestionare consultații. |
| `AdminPanel` | Panoul de administrare — utilizatori, facultăți, specializări, materii, profesori, consultații. |

---

#### 4.3.3 Componente Calendar Page

| Componentă | Descriere |
|---|---|
| `CalendarFilters` | Conține selectorii pentru an, facultate, specializare, profesor, disciplină și tip de consultație. |
| `CalendarGrid` | Componenta centrală — grilă lunară custom construită manual în React, cu navigare între luni, evidențiere zile cu consultații, și click pe zi pentru selectare. |
| `DayConsultationsPanel` | Panoul fix din stânga — afișează data selectată și lista de cartonașe cu consultațiile din acea zi (materie, profesor, oră, buton Detalii). |
| `ConsultationDetailsModal` | Modală deschisă din cartonașul unei consultații — afișează toate informațiile complete despre evenimentul selectat. |
| `ConsultationLegend` | Explică diferențele de culoare și simbolurile utilizate în calendar (online vs. fizic, relevant vs. suplimentar). |
| `FacultySelectModal` | Modala cu facultățile din tabela `faculties` — selecția se salvează în cookies. |

---

#### 4.3.4 Componente Student

| Componentă | Descriere |
|---|---|
| `GoogleCalendarButton` | Secțiune în partea de jos a dashboard-ului. Dacă calendarul nu e conectat: buton „Conectează Google Calendar" + mesaj informativ. Dacă e conectat: indicator „Calendar sincronizat" cu email-ul Google conectat. |
| `ConsultationsContainer` | Container pentru consultațiile din anul studentului, afișate într-un grid de carduri. |
| `ConsultationCard` | Card individual pentru o consultație. Conține: numele disciplinei, numele profesorului, data, ora, buton detalii. |
| `ConsultationDetailsModal` | Fereastra modală cu toate detaliile consultației: tip, sală/link meeting, materiale. |
| `RecoveryConsultationsContainer` | Container pentru consultațiile adăugate manual pentru recuperări/restanțe. |

---

#### 4.3.5 Componente Profesor

| Componentă | Descriere |
|---|---|
| `ProfessorCourses` | Vizualizarea materiilor atribuite profesorului. |
| `CreateConsultationForm` | Formular pentru crearea unei consultații noi (materie, data, ora, durata, tip, sală/link, materiale). |
| `ConsultationList` | Lista consultațiilor create de profesor, cu opțiuni de editare. |

---

#### 4.3.6 Componente Admin

| Componentă | Descriere |
|---|---|
| `UsersTable` | Tabel cu toți utilizatorii din sistem (student, profesor, admin). |
| `AddUserModal` | Modal pentru adăugarea unui utilizator nou. |
| `FacultiesManager` | Interfață pentru gestionarea facultăților (adăugare, editare). |
| `SpecializationsManager` | Interfață pentru gestionarea specializărilor per facultate (adăugare, editare). |
| `ProfessorCoursesManager` | Interfață pentru atribuirea materiilor către profesori. |
| `ConsultationsManager` | Interfață pentru crearea și editarea consultațiilor la nivel de admin. |
| `SessionSettings` | Toggle pentru schimbarea sesiunii active (iarnă / vară) — controlează lunile afișate în calendar. |

---

#### 4.3.7 Componente Profil

| Componentă | Descriere |
|---|---|
| `ProfileForm` | Formular cu datele utilizatorului (email read-only, nume, prenume, facultate, specializare, an de studiu). Buton salvare. |
| `EmailNotificationsToggle` | Toggle pentru activarea/dezactivarea notificărilor pe email. Apelează `PUT /api/user/email-notifications`. |
| `GoogleCalendarSection` | Afișează starea conexiunii Google Calendar (doar pentru studenți): email conectat, ultima sincronizare, butoane conectare/deconectare/re-sincronizare. |

---

#### 4.3.8 Componente Layout

| Componentă | Descriere |
|---|---|
| `Navbar` | Navigare principală (header). Include link către pagina de profil. |
| `Sidebar` | Meniu lateral pentru navigare rapidă între secțiuni. |
| `DashboardLayout` | Layout comun care include Navbar + Sidebar + conținutul paginii. |

---

### 4.4 Integrare Google Calendar — Interfață

Interfața de Google Calendar este prezentă în două locuri, cu niveluri diferite de detaliu:

**Student Dashboard — secțiune în partea de jos (acces rapid):**

- **Neconectat:** buton „Conectează Google Calendar" + mesaj informativ. Inițiază fluxul OAuth.
- **Conectat:** indicator „Calendar sincronizat" cu email-ul Google conectat.

**Pagina de Profil — Secțiune completă (gestionare):**

- **Neconectat:** buton „Conectează Google Calendar" cu mesaj informativ.
- **Conectat:** email-ul Google conectat, data ultimei sincronizări, buton **Deconectează**, buton **Re-sincronizează**.

---

### 4.5 Structura Proiectului

```
front-end/
├── src/
│   ├── pages/
│   │   ├── CalendarPage/
│   │   │   ├── CalendarPage.jsx
│   │   │   ├── CalendarPage.css
│   │   │   └── components/
│   │   │       ├── CalendarFilters.jsx
│   │   │       ├── CalendarGrid.jsx
│   │   │       ├── DayConsultationsPanel.jsx
│   │   │       ├��─ ConsultationDetailsModal.jsx
│   │   │       ├── ConsultationLegend.jsx
│   │   │       └── FacultySelectModal.jsx
│   │   ├── LoginPage/
│   │   │   ├── LoginPage.jsx
│   │   │   └── LoginPage.css
│   │   ├── Onboarding/
│   │   │   ├── OnboardingFaculty.jsx
│   │   │   ├── OnboardingProfile.jsx
│   │   │   ├── OnboardingInterests.jsx
│   │   │   └── Onboarding.css
│   │   ├── StudentDashboard/
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── StudentDashboard.css
│   │   │   └── components/
│   │   │       ├── GoogleCalendarButton.jsx
│   │   │       ├── ConsultationsContainer.jsx
│   │   │       ├── ConsultationCard.jsx
│   │   │       ├── ConsultationDetailsModal.jsx
│   │   │       └── RecoveryConsultationsContainer.jsx
│   │   ├── ProfessorDashboard/
│   │   │   ├── ProfessorDashboard.jsx
│   │   │   ├── ProfessorDashboard.css
│   │   │   └── components/
│   │   │       ├── ProfessorCourses.jsx
│   │   │       ├���─ CreateConsultationForm.jsx
│   │   │       └── ConsultationList.jsx
│   │   ├── ProfilePage/
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── ProfilePage.css
│   │   │   └── components/
│   │   │       ├── ProfileForm.jsx
│   │   │       ├── EmailNotificationsToggle.jsx
│   │   │       └── GoogleCalendarSection.jsx
│   │   └── AdminPanel/
│   │       ├── AdminPanel.jsx
│   │       ├── AdminPanel.css
│   │       └── components/
│   │           ├── UsersTable.jsx
│   │           ├── AddUserModal.jsx
│   │           ├── FacultiesManager.jsx
│   │           ├── SpecializationsManager.jsx
│   │           ├── ProfessorCoursesManager.jsx
│   │           ├── ConsultationsManager.jsx
│   │           └── SessionSettings.jsx
│   ├── components/
│   │   └── shared/
│   │       ├── Navbar.jsx
│   │       ├── Sidebar.jsx
│   │       └── DashboardLayout.jsx
│   ├── services/
│   │   ├── axiosInstance.js          # Instanță Axios configurată (base URL, withCredentials)
│   │   ├── authService.js            # Login, logout, check session
│   │   ├── userService.js            # Profil, onboarding, email notifications
│   │   ├── consultationService.js    # CRUD consultații, enroll/unenroll
│   │   ├── calendarService.js        # Google Calendar connect/disconnect/sync
│   │   └── adminService.js           # CRUD users, faculties, specializations, courses
│   ├── context/
│   │   ├── AuthContext.jsx           # User logat, rol, stare autentificare
│   │   └── CalendarContext.jsx       # Luna selectată, filtre active CalendarPage
│   ├── utils/
│   │   └── formatDate.js             # Formatare date pentru afișare
│   ├── App.jsx
│   └── main.jsx
├── public/
├── index.html
├── package.json
└── vite.config.js
```

---

### 4.6 Tehnologii

| Tehnologie | Detalii |
|---|---|
| React | Bibliotecă UI pentru componente reutilizabile |
| React Router DOM | Routing client-side între pagini |
| Axios | Client HTTP pentru apeluri API către backend |
| Vite | Build tool rapid cu HMR (Hot Module Replacement) |
| JavaScript | Limbajul de programare principal |
| CSS | Stilizare componente |

Fontul global folosit în interfața frontend este `Montserrat`, importat din Google Fonts și aplicat din `src/index.css`.

---

### 4.7 Setup & Development

```bash
cd front-end

# Instalare dependențe
npm install

# Pornire server development (port 5173)
npm run dev

# Build pentru producție
npm run build
```

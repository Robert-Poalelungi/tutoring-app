# Conceptualizare Integrare Google Calendar

## Scop

Integrarea cu Google Calendar are rolul de a extinde funcționalitatea platformei Tutoring App fără a muta logica principală în afara aplicației. Sistemul propriu al aplicației rămâne sursa principală de adevăr pentru consultații, utilizatori, roluri, înscrieri și reguli de business, iar Google Calendar este folosit ca serviciu extern de sincronizare.

Obiectivul principal al acestei integrări este ca studentul să își poată conecta calendarul personal Google, iar consultațiile la care este înscris să fie adăugate și actualizate automat. În acest mod, orice modificare realizată de cadrul didactic asupra unei consultații poate fi reflectată și în calendarul personal al studentului.

## Principiul de bază

Arhitectura recomandată este una în care aplicația gestionează integral consultațiile, iar Google Calendar este utilizat doar pentru sincronizare. Profesorii nu creează evenimente direct în Google Calendar, ci exclusiv în platformă. Astfel, se păstrează controlul asupra validărilor, rolurilor, filtrării după an și specializare, gestionării înscrierilor și evidenței datelor.

Fluxul general este următorul:

1. Profesorul creează, modifică sau șterge o consultație în aplicație.
2. Consultația este salvată în baza de date a sistemului.
3. Dacă un student are calendarul Google conectat, aplicația sincronizează automat consultația în calendarul său personal.
4. Orice modificare ulterioară asupra consultației este propagată automat către toate calendarele studenților afectați.

## Funcționalitatea pentru student

În dashboard-ul studentului poate exista o opțiune de tipul `Conectează Google Calendar`, prin care utilizatorul acordă aplicației permisiunea de a crea și actualiza evenimente în calendarul său personal. După conectare, studentul nu mai trebuie să adauge manual fiecare consultație.

Funcționalitatea urmărită este următoarea:

1. Studentul își conectează contul Google la aplicație.
2. Studentul se înscrie la consultații sau primește automat consultațiile relevante pentru anul și specializarea sa.
3. Sistemul creează evenimentele corespunzătoare în Google Calendar.
4. Dacă profesorul modifică data, ora, locația, link-ul de meeting sau alte detalii ale consultației, aplicația actualizează automat evenimentele deja sincronizate.
5. Dacă studentul se retrage sau consultația este anulată, evenimentul este șters și din calendarul personal.

## Tipul de integrare necesar

Pentru sincronizare automată reală este necesară o integrare completă cu Google Calendar API, bazată pe OAuth 2.0. O simplă funcționalitate de tip `Add to Google Calendar` nu este suficientă pentru actualizare automată, deoarece aceea presupune doar generarea unui eveniment precompletat pe care utilizatorul îl salvează manual.

Prin urmare, pentru sincronizare completă sunt necesare:

1. autentificare și consimțământ explicit din partea studentului;
2. obținerea și stocarea token-urilor de acces Google;
3. un mecanism de mapare între consultațiile din platformă și evenimentele din Google Calendar;
4. logică de sincronizare pentru operațiile de creare, actualizare și ștergere.

## Arhitectura propusă

Sistemul ar trebui să fie organizat astfel încât integrarea cu Google Calendar să fie tratată într-un modul separat, nu direct în controllere. Se recomandă introducerea unui serviciu dedicat, de exemplu `googleCalendarService`, care să fie apelat din logica de business a consultațiilor.

Responsabilitățile pot fi separate astfel:

1. controller-ele gestionează request-urile HTTP;
2. service-ul de consultații gestionează logica de business a aplicației;
3. service-ul de integrare Google Calendar gestionează comunicarea cu Google API;
4. baza de date păstrează legătura dintre consultații, utilizatori și evenimentele sincronizate.

Această abordare reduce cuplarea dintre componente și face sistemul mai ușor de întreținut și extins.

## Flux conceptual de sincronizare

### 1. Conectarea calendarului Google

Studentul selectează opțiunea de conectare a calendarului. Aplicația inițiază fluxul OAuth Google și solicită permisiunea de acces la calendar. După acordarea permisiunii, backend-ul primește token-urile necesare și le salvează asociat contului studentului.

### 2. Crearea unei consultații sincronizate

În momentul în care studentul este asociat unei consultații, sistemul verifică dacă utilizatorul are activă conexiunea cu Google Calendar. Dacă da, creează automat un eveniment în calendarul său personal și salvează identificatorul acelui eveniment în baza de date.

### 3. Actualizarea automată

Când profesorul modifică o consultație, aplicația actualizează mai întâi datele în baza de date proprie. Ulterior, pentru toți studenții înscriși care au calendarul conectat, sistemul identifică evenimentele Google deja create și le actualizează cu noile informații.

### 4. Ștergerea sincronizării

Dacă o consultație este anulată sau studentul se retrage, sistemul șterge evenimentul asociat din Google Calendar și actualizează starea sincronizării în baza de date.

## Informațiile sincronizate în evenimentul Google Calendar

Evenimentul creat în Google Calendar poate conține următoarele informații:

1. titlul consultației, de exemplu `Consultație - Programare Web`;
2. data și intervalul orar;
3. locația fizică sau link-ul de participare online;
4. descrierea consultației;
5. numele cadrului didactic;
6. link către materiale suplimentare;
7. un identificator intern care permite maparea evenimentului cu consultația din sistem.

## Structura de date recomandată

Pentru o implementare completă, este utilă introducerea unor tabele dedicate sincronizării.

### 1. Tabel pentru conexiunea cu Google Calendar

Exemplu conceptual: `google_calendar_connections`

Câmpuri recomandate:

1. `id`
2. `user_id`
3. `google_email`
4. `access_token`
5. `refresh_token`
6. `token_expiry`
7. `calendar_id`
8. `is_active`
9. `created_at`
10. `updated_at`

Acest tabel indică faptul că un anumit student și-a conectat calendarul Google și permite sistemului să știe unde trebuie făcute sincronizările.

### 2. Tabel pentru maparea consultație - eveniment Google

Exemplu conceptual: `consultation_calendar_syncs`

Câmpuri recomandate:

1. `id`
2. `consultation_id`
3. `user_id`
4. `google_event_id`
5. `calendar_id`
6. `sync_status`
7. `last_synced_at`
8. `last_error`

Acest tabel păstrează legătura dintre consultația din platformă și evenimentul creat în calendarul personal al studentului.

## Endpoint-uri și operații necesare

La nivel conceptual, sistemul poate include o zonă separată de integrare, de exemplu `/api/google-calendar`.

Endpoint-uri utile:

1. `GET /api/google-calendar/connect` pentru inițierea fluxului OAuth;
2. `GET /api/google-calendar/callback` pentru finalizarea autentificării și salvarea token-urilor;
3. `GET /api/google-calendar/status` pentru verificarea stării conexiunii;
4. `POST /api/google-calendar/disconnect` pentru deconectarea calendarului;
5. operații interne de sincronizare apelate din logica de consultații.

Pe lângă acestea, la nivel intern sunt necesare operații de tip:

1. creare eveniment pentru un student;
2. actualizare eveniment pentru un student;
3. ștergere eveniment pentru un student;
4. sincronizare pentru toți studenții afectați de o consultație.

## Situații de business care trebuie tratate

Pentru ca integrarea să fie robustă, sistemul trebuie să gestioneze explicit următoarele cazuri:

1. studentul nu și-a conectat Google Calendar;
2. studentul și-a retras permisiunile din contul Google;
3. token-ul de acces a expirat și trebuie reînnoit;
4. sincronizarea eșuează temporar din cauza unei erori externe;
5. profesorul modifică o consultație la care sunt înscriși mai mulți studenți;
6. studentul este eliminat dintr-o consultație după ce evenimentul a fost deja creat.

Aceste situații trebuie reflectate și în modelul de date, prin stări de sincronizare și eventuale mesaje de eroare sau mecanisme de retry.

## Considerații de securitate

Integrarea completă cu Google Calendar presupune gestionarea unor date sensibile și, prin urmare, necesită o atenție specială din punct de vedere al securității.

Sunt recomandate următoarele măsuri:

1. stocarea securizată a token-urilor Google;
2. criptarea sau protejarea refresh token-urilor în baza de date;
3. limitarea accesului la endpoint-urile de integrare doar pentru utilizatorul autentificat;
4. jurnalizarea erorilor fără expunerea datelor sensibile;
5. tratarea corectă a revocării consimțământului;
6. separarea clară între autentificarea în aplicație și conectarea calendarului.

## Avantajele integrării complete

O astfel de integrare aduce mai multe beneficii:

1. studentul nu mai trebuie să adauge manual consultațiile în calendar;
2. modificările realizate de profesori sunt reflectate automat;
3. consultațiile devin mai ușor de urmărit în activitatea zilnică a studentului;
4. crește coerența informațiilor dintre platformă și calendarul personal;
5. utilizatorii pot beneficia de notificările și reminderele oferite de Google Calendar.

## Limitări și complexitate

Deși este o soluție valoroasă, integrarea completă are un nivel de complexitate mai ridicat decât varianta simplă cu link `Add to Google Calendar`.

Principalele elemente care cresc complexitatea sunt:

1. necesitatea implementării OAuth per utilizator;
2. stocarea și reîmprospătarea token-urilor;
3. gestionarea sincronizării pentru mai mulți studenți simultan;
4. tratarea erorilor externe provenite din Google API;
5. nevoia unei arhitecturi mai mature, cu servicii separate și eventual execuție asincronă.

## Recomandare de implementare

Pentru o implementare corectă, se recomandă următoarea ordine:

1. realizarea mecanismului de conectare a calendarului Google pentru student;
2. crearea automată a evenimentelor la înscriere;
3. actualizarea automată la modificarea consultațiilor;
4. ștergerea automată la anulare sau retragere;
5. introducerea unei logici de retry pentru sincronizările eșuate.

## Formulare sintetică pentru documentație sau lucrare

Aplicația poate integra Google Calendar la nivel de utilizator, permițând sincronizarea automată a consultațiilor în calendarul personal al studentului. După acordarea consimțământului prin Google OAuth, sistemul creează și actualizează automat evenimentele aferente consultațiilor la care studentul este înscris. În acest mod, orice modificare efectuată de cadrul didactic asupra unei consultații este reflectată și în calendarul utilizatorului, contribuind la o organizare mai eficientă a activităților academice.

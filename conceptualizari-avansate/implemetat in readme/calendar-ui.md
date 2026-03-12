# Conceptualizare Pagina de Calendar

## Scop

Pagina de calendar din aplicație are rolul de a afișa consultațiile existente în baza de date a platformei într-o formă vizuală clară și ușor de navigat. Aceasta nu depinde de Google Calendar pentru afișarea evenimentelor, ci utilizează exclusiv datele din sistemul propriu.

Calendarul reprezintă interfața principală prin care utilizatorii pot vedea consultațiile disponibile, pot filtra rezultatele în funcție de criterii academice și pot accesa rapid detaliile fiecărei sesiuni.

## Principiul de funcționare

Arhitectura recomandată pentru această pagină este următoarea:

1. backend-ul stochează consultațiile în baza de date;
2. frontend-ul cere consultațiile prin API;
3. răspunsul este transformat în evenimente de calendar;
4. componenta de calendar le afișează în interfață;
5. la interacțiunea cu un eveniment sunt afișate detaliile complete.

În acest model, baza de date a aplicației rămâne sursa principală de adevăr, iar componenta de calendar este doar o reprezentare vizuală a datelor.

La accesarea paginii, sistemul trebuie să selecteze automat ziua curentă și să afișeze în panoul din stânga consultațiile programate pentru data respectivă. Astfel, utilizatorul vede imediat informațiile relevante fără a fi necesară o interacțiune suplimentară.

## Soluția recomandată pentru frontend

Pentru implementarea paginii de calendar se recomandă utilizarea bibliotecii `FullCalendar` în aplicația React.

Această alegere este potrivită deoarece oferă:

1. vizualizări de tip lună, săptămână, zi și listă;
2. suport bun pentru React;
3. callback-uri pentru click pe zi și click pe eveniment;
4. posibilitatea de a personaliza afișarea evenimentelor;
5. navigare între perioade;
6. suport pentru localizare și timezone;
7. flexibilitate suficientă pentru a adapta interfața la specificul consultațiilor universitare.

## Structura funcțională a paginii

Pagina de calendar poate fi proiectată într-un layout împărțit în două zone principale pe orizontală:

1. partea stângă, cu lățime de aproximativ 20% din ecran;
2. partea dreaptă, cu lățime de aproximativ 80% din ecran.

Această structură permite păstrarea calendarului ca element principal al paginii, fără a pierde accesul rapid la informațiile detaliate despre consultațiile dintr-o anumită zi.

### 1. Panoul din stânga, aproximativ 20%

Panoul din stânga are rolul de a afișa lista materiilor sau, mai exact, lista consultațiilor programate în ziua selectată din calendar. Atunci când utilizatorul apasă pe caseta corespunzătoare unei zile, această zonă se actualizează și afișează toate consultațiile aferente datei respective.

La încărcarea inițială a paginii, ziua selectată trebuie să fie data curentă, iar panoul stâng trebuie populat automat cu consultațiile din ziua curentă.

Panoul trebuie să funcționeze ca o zonă informativă permanent vizibilă, nu ca un modal temporar. Astfel, utilizatorul poate naviga rapid între zile și poate vedea imediat modificările din listă.

În partea superioară a panoului trebuie să apară data selectată, ca element de context principal pentru lista afișată dedesubt.

În această zonă pot fi afișate:

1. data selectată;
2. numărul total de consultații din ziua respectivă;
3. lista consultațiilor programate pentru acea zi;
4. detaliile restrânse ale fiecărei consultații într-un format de tip card.

Fiecare element din listă poate fi afișat sub forma unui cartonaș compact. Pe cartonaș trebuie să apară doar informațiile esențiale, într-o formă restrânsă:

1. numele disciplinei;
2. numele profesorului;
3. ora consultației;
4. un buton `Detalii`.

La apăsarea butonului `Detalii`, aplicația trebuie să deschidă o fereastră modală care afișează informațiile complete despre consultația selectată.

În modală pot fi afișate toate detaliile descrise în README:

1. numele disciplinei;
2. numele profesorului;
3. data consultației;
4. ora consultației;
5. tipul consultației, online sau fizic;
6. sala, dacă este o consultație fizică;
7. link-ul de meeting, dacă este o consultație online;
8. link-ul către materiale;
9. eventual acțiuni suplimentare, precum înscrierea sau accesarea directă a link-ului.

Dacă în ziua selectată nu există consultații, panoul poate afișa un mesaj informativ de tipul: `Nu există consultații programate pentru această zi`.

### 2. Panoul din dreapta, aproximativ 80%

Partea din dreapta conține calendarul propriu-zis și reprezintă elementul principal al paginii. Aici vor fi afișate toate consultațiile sub formă de evenimente calendaristice.

Calendarul ar trebui să permită:

1. schimbarea perioadei curente;
2. trecerea între vizualizări lunare și săptămânale;
3. evidențierea consultațiilor în funcție de tip sau relevanță;
4. selectarea unei zile prin click pe caseta de dată;
5. selectarea unui eveniment pentru accentuarea lui în lista din panoul stâng sau pentru afișarea unor detalii suplimentare.

### 3. Zona de filtrare

Filtrele pot fi poziționate deasupra întregii pagini sau în partea superioară a zonei calendarului, fără a afecta împărțirea 20% - 80%.

Filtre recomandate:

1. an de studiu;
2. facultate;
3. specializare;
4. tipul consultației: online sau fizic;
5. profesor;
6. disciplină.

Filtrele trebuie să modifice atât evenimentele afișate în calendar, cât și lista de consultații din panoul stâng.

## Tipuri de utilizatori și comportamentul calendarului

Calendarul poate avea comportamente ușor diferite în funcție de utilizator.

### Utilizator neautentificat

Poate vedea calendarul public cu consultațiile disponibile, folosind doar filtrele publice.

### Student

Poate vedea consultațiile relevante pentru anul și specializarea sa, dar și consultațiile suplimentare care pot fi adăugate manual pentru recuperări sau restanțe.

### Profesor

Poate vedea consultațiile pe care le susține și poate avea acces la acțiuni suplimentare precum editarea sau ștergerea.

### Administrator

Poate vizualiza toate consultațiile și poate gestiona evenimentele la nivel global.

## Modelul de date pentru evenimente

Consultațiile venite din backend trebuie transformate într-o structură compatibilă cu componenta de calendar.

Exemplu conceptual de obiect pentru frontend:

```json
{
  "id": 12,
  "title": "Programare Web",
  "start": "2026-03-20T14:00:00",
  "end": "2026-03-20T16:00:00",
  "extendedProps": {
    "course": "Programare Web",
    "professor": "Popescu Andrei",
    "faculty": "CSIE",
    "studyYear": 3,
    "type": "online",
    "meetingLink": "https://meet.google.com/example",
    "materialsLink": "https://drive.google.com/example",
    "location": null
  }
}
```

Această structură permite calendarului să afișeze titlul, data și ora, iar la click să pună la dispoziție toate informațiile suplimentare.

## Endpoint-uri necesare pentru pagină

Pentru funcționarea paginii de calendar, backend-ul ar trebui să ofere endpoint-uri clare pentru listare și filtrare.

Exemple conceptuale:

1. `GET /api/consultations` pentru listarea tuturor consultațiilor;
2. `GET /api/consultations?studyYear=3&faculty=CSIE` pentru listarea filtrată;
3. `GET /api/consultations/:id` pentru detaliile unei consultații;
4. endpoint-uri suplimentare pentru înscriere sau retragere, dacă aceste acțiuni se fac din calendar.

Ideal, filtrarea trebuie să fie susținută în backend, astfel încât frontend-ul să primească doar datele relevante și să nu fie obligat să proceseze volume mari de evenimente inutil.

## Elemente de interfață recomandate

Din punct de vedere conceptual, pagina poate conține următoarele componente:

1. `CalendarFilters`
2. `CalendarToolbar`
3. `ConsultationsCalendar`
4. `DayConsultationsPanel`
5. `ConsultationLegend`

### CalendarFilters

Conține selectorii pentru an, facultate, specializare, profesor și tip de consultație.

### CalendarToolbar

Conține butoanele pentru navigare între perioade și schimbarea tipului de vizualizare.

### ConsultationsCalendar

Este componenta centrală, bazată pe `FullCalendar`, care primește evenimentele și le afișează.

### DayConsultationsPanel

Reprezintă panoul fix din partea stângă a ecranului și afișează lista consultațiilor pentru ziua selectată în calendar. În partea superioară trebuie să fie afișată data selectată, iar dedesubt lista de cartonașe ale consultațiilor din acea zi.

Fiecare cartonaș afișează într-o formă restrânsă materia, profesorul și ora, plus un buton `Detalii`.

### ConsultationDetailsModal

Este modală care se deschide din cartonașul unei consultații și afișează toate informațiile complete despre evenimentul selectat.

### ConsultationLegend

Poate explica diferențele de culoare sau simbolurile utilizate în calendar.

## Reguli de afișare recomandate

Pentru a face interfața mai clară, consultațiile pot fi diferențiate vizual.

Exemple de reguli:

1. consultațiile online pot avea o culoare diferită față de cele fizice;
2. consultațiile relevante pentru studentul curent pot fi evidențiate mai puternic;
3. consultațiile adăugate manual pentru recuperări pot avea un marker distinct;
4. consultațiile anulate pot avea stil diferit sau pot fi ascunse.

## Interacțiuni importante

Pagina de calendar ar trebui să permită următoarele interacțiuni:

1. click pe o zi din calendar pentru afișarea consultațiilor din panoul stâng;
2. click pe eveniment pentru selectarea consultației și evidențierea ei în listă;
3. schimbare de lună sau săptămână;
4. schimbare de view;
5. aplicare și resetare filtre;
6. acțiuni contextuale precum înscriere, retragere sau acces rapid la link-ul consultației.

## Comportamentul selectării unei zile

Interacțiunea principală a paginii trebuie să fie click-ul pe o zi din calendar. În urma acestei acțiuni, sistemul trebuie să execute următoarele operații:

1. identifică data selectată;
2. filtrează consultațiile aferente acelei zile;
3. actualizează panoul din stânga;
4. afișează lista completă a consultațiilor din data selectată;
5. dacă utilizatorul apasă pe una dintre consultațiile din listă, poate evidenția evenimentul corespunzător în calendar sau poate extinde detaliile.

Astfel, pagina devine una de tip master-detail, în care calendarul din dreapta este zona de navigare, iar panoul din stânga este zona de informare detaliată.

În mod implicit, acest flux trebuie executat automat pentru ziua curentă imediat după încărcarea paginii.

## Relația cu Google Calendar

Google Calendar nu trebuie să fie sursa evenimentelor afișate pe această pagină. Consultațiile afișate provin exclusiv din baza de date a platformei.

Integrarea cu Google Calendar rămâne o funcționalitate separată și opțională, având rolul de a sincroniza consultațiile deja existente în sistem cu calendarul personal al studentului.

Prin urmare:

1. calendarul din aplicație afișează consultațiile din baza de date;
2. Google Calendar este utilizat doar pentru sincronizare externă;
3. interfața aplicației nu depinde de Google pentru a funcționa.

## Avantajele acestei abordări

Această soluție oferă mai multe beneficii:

1. control complet asupra logicii și afișării;
2. posibilitatea implementării filtrelor specifice mediului universitar;
3. separarea clară între UI-ul aplicației și serviciile externe;
4. consistență între datele din backend și cele afișate în interfață;
5. flexibilitate mare în personalizarea experienței utilizatorului.

## Concluzie

Pagina de calendar a aplicației trebuie construită ca o interfață vizuală pentru consultațiile stocate în baza de date proprie. Cea mai potrivită soluție pentru frontend este utilizarea unei biblioteci precum `FullCalendar`, alimentată exclusiv din API-ul backend-ului. În acest fel, aplicația păstrează controlul asupra întregii logici de business, iar integrarea cu Google Calendar poate rămâne o funcționalitate distinctă, dedicată sincronizării externe.
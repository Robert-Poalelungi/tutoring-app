# Conceptualizare Ciclu de Viață al Consultației

## Scop

Acest document descrie etapele prin care trece o consultație în cadrul platformei Tutoring App, din momentul creării până la finalizarea sau anularea sa. Definirea clară a ciclului de viață ajută la organizarea logicii de business, la modelarea stărilor și la tratarea corectă a interacțiunilor dintre utilizatori.

## Necesitatea unei perspective de lifecycle

În documentația actuală, consultațiile sunt tratate în principal prin operații CRUD. Totuși, în practică, o consultație poate avea mai multe stări și tranziții care influențează afișarea în calendar, înscrierea studenților, notificările și sincronizarea externă.

Prin urmare, este utilă definirea explicită a ciclului de viață al unei consultații.

## Stări recomandate

O consultație poate avea următoarele stări conceptuale:

1. `draft`
2. `published`
3. `updated`
4. `cancelled`
5. `completed`

### 1. Draft

Consultația a fost creată, dar nu este încă disponibilă pentru studenți. Această stare poate fi utilă dacă profesorul sau administratorul dorește să salveze temporar datele fără publicare.

### 2. Published

Consultația este publică și poate fi afișată în calendar și în dashboard-urile relevante. Studenții o pot vedea și, dacă este cazul, se pot înscrie.

### 3. Updated

Consultația a fost modificată după publicare. Din punct de vedere logic, aceasta poate rămâne tot activă, însă este important ca sistemul să înregistreze faptul că a existat o actualizare relevantă.

### 4. Cancelled

Consultația nu mai are loc. Ea poate fi ascunsă din zonele principale ale aplicației sau afișată distinct, în funcție de regulile de business.

### 5. Completed

Consultația a avut loc și este considerată încheiată. Această stare este utilă pentru istoric, raportare și eventuale statistici.

## Tranziții între stări

Fluxul recomandat este următorul:

1. profesorul sau adminul creează consultația -> `draft` sau direct `published`
2. consultația este publicată -> `published`
3. consultația este editată -> rămâne activă, dar cu istoric de actualizare
4. consultația este anulată -> `cancelled`
5. consultația trece de momentul programat și este închisă logic -> `completed`

## Evenimente importante din lifecycle

În cadrul ciclului de viață al unei consultații există câteva momente relevante:

1. crearea consultației;
2. publicarea consultației;
3. înscrierea studentului;
4. retragerea studentului;
5. modificarea datei, orei sau tipului;
6. anularea consultației;
7. finalizarea consultației.

Fiecare dintre aceste momente poate declanșa procese suplimentare, precum:

1. notificări;
2. actualizarea calendarului aplicației;
3. sincronizarea cu Google Calendar;
4. actualizarea rapoartelor sau statisticilor.

## Impact asupra utilizatorilor

### Student

Studentul este afectat de următoarele etape:

1. vede consultația când aceasta este publicată;
2. se poate înscrie sau retrage;
3. trebuie informat dacă apare o modificare;
4. trebuie informat dacă consultația este anulată;
5. poate vedea consultația în istoric după finalizare.

### Profesor

Profesorul:

1. creează consultația;
2. o modifică;
3. o anulează dacă este necesar;
4. poate urmări participanții și statusul ei;
5. poate vedea consultațiile finalizate pentru istoric.

### Administrator

Administratorul:

1. poate crea sau modifica consultații;
2. poate interveni asupra consultațiilor anulate sau problematice;
3. poate folosi stările consultațiilor în raportare și monitorizare.

## Elemente de date recomandate

Pentru a susține lifecycle-ul, o consultație poate avea câmpuri suplimentare precum:

1. `status`
2. `published_at`
3. `cancelled_at`
4. `completed_at`
5. `updated_at`
6. `cancellation_reason`

Aceste câmpuri ajută la urmărirea evoluției consultației și la tratarea corectă a evenimentelor de business.

## Reguli recomandate

1. doar consultațiile `published` trebuie afișate studenților în mod normal;
2. consultațiile `cancelled` nu trebuie să mai permită înscrieri;
3. consultațiile `completed` pot fi mutate în istoric;
4. o modificare semnificativă a unei consultații trebuie să genereze notificări și, dacă este cazul, re-sincronizare externă;
5. o consultație anulată trebuie să fie tratată explicit și nu doar ștearsă, dacă se dorește păstrarea istoricului.

## Concluzie

Definirea ciclului de viață al consultației oferă claritate arhitecturală și ajută la modelarea mai realistă a comportamentului aplicației. În locul unei abordări exclusiv CRUD, consultația poate fi tratată ca o entitate cu stări, tranziții și efecte asupra altor module ale platformei.

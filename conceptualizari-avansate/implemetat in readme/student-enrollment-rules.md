# Conceptualizare Reguli de Înscriere ale Studentului

## Scop

Acest document descrie regulile conceptuale prin care un student primește, vede, adaugă sau elimină consultații în platforma Tutoring App. Scopul este clarificarea diferenței dintre consultațiile generate automat și cele adăugate manual, precum și definirea comportamentului sistemului în funcție de profilul academic al utilizatorului.

## Context

Platforma pornește de la ideea că studentul trebuie să vadă automat consultațiile relevante pentru anul și specializarea sa, dar să aibă și posibilitatea de a adăuga manual consultații pentru recuperări sau restanțe.

Pentru ca această logică să fie coerentă, este necesar un set clar de reguli de înscriere.

## Tipuri de asociere între student și consultație

Se recomandă două tipuri principale:

1. `auto`
2. `manual`

### 1. Consultații generate automat

Aceste consultații sunt determinate de profilul studentului, pe baza unor informații precum:

1. facultatea;
2. specializarea;
3. anul de studiu.

Studentul nu trebuie să le adauge manual. Ele apar automat în dashboard și în zonele relevante ale aplicației.

### 2. Consultații adăugate manual

Acestea sunt consultații pe care studentul le alege explicit, chiar dacă nu fac parte din traseul său academic implicit.

Exemple de situații:

1. restanțe;
2. refacerea unui examen;
3. interes pentru o disciplină din alt an;
4. participare suplimentară la anumite activități.

## Reguli pentru consultațiile automate

Sistemul poate aplica următoarele reguli:

1. la finalizarea onboarding-ului, studentul primește consultațiile relevante profilului său;
2. aceste consultații sunt afișate automat în dashboard;
3. ele pot fi recalculte atunci când studentul își schimbă profilul academic;
4. ele nu trebuie duplicate dacă au fost deja asociate studentului;
5. ele trebuie să rămână distincte față de cele adăugate manual.

## Reguli pentru consultațiile manuale

1. studentul poate adăuga manual o consultație suplimentară;
2. consultația manuală trebuie marcată explicit în sistem;
3. studentul trebuie să o poată elimina din lista personală;
4. consultațiile manuale nu trebuie șterse automat dacă profilul studentului se modifică;
5. consultațiile manuale trebuie afișate distinct față de cele automate.

## Modificarea profilului studentului

Un caz important este schimbarea informațiilor academice ale studentului.

Aspecte care trebuie tratate:

1. dacă studentul își schimbă anul de studiu;
2. dacă își schimbă facultatea;
3. dacă își schimbă specializarea;
4. dacă anul detectat automat este corectat manual.

Comportament recomandat:

1. consultațiile `auto` sunt recalculate;
2. consultațiile `manual` sunt păstrate;
3. sistemul evită duplicarea consultațiilor deja existente;
4. utilizatorul poate fi informat că lista consultațiilor relevante a fost actualizată.

## Eligibilitatea pentru înscriere

Sistemul poate impune anumite reguli de eligibilitate:

1. studentul poate fi înscris automat doar la consultații relevante profilului său;
2. consultațiile manuale pot fi adăugate doar dacă politica aplicației permite acest lucru;
3. dacă există limită de capacitate, înscrierea trebuie verificată înainte de confirmare;
4. dacă o consultație este anulată sau finalizată, studentul nu se mai poate înscrie.

## Afișarea în interfață

Pentru claritate, dashboard-ul studentului poate separa vizual cele două categorii:

1. consultații relevante pentru anul și specializarea studentului;
2. consultații adăugate manual pentru recuperări sau restanțe.

Această separare ajută utilizatorul să înțeleagă de ce o anumită consultație apare în lista sa.

## Structură de date recomandată

Tabela de legătură dintre student și consultație poate include un câmp precum `source`, cu valori:

1. `auto`
2. `manual`

Opțional, pot exista și alte câmpuri utile:

1. `enrolled_at`
2. `status`
3. `notes`

## Reguli de business recomandate

1. consultațiile relevante profilului trebuie afișate implicit;
2. consultațiile manuale trebuie adăugate doar prin acțiunea explicită a studentului;
3. consultațiile manuale trebuie să poată fi eliminate individual;
4. schimbarea profilului trebuie să afecteze doar asocierea automată;
5. orice modificare majoră trebuie să păstreze consistența dashboard-ului.

## Concluzie

Definirea regulilor de înscriere ale studentului este esențială pentru coerența funcțională a aplicației. Distincția clară dintre consultațiile automate și cele manuale permite personalizarea experienței studentului și reduce ambiguitatea privind apariția consultațiilor în dashboard.

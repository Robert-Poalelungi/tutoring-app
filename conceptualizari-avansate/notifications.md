# Conceptualizare Notificări și Remindere

## Scop

Acest document descrie modul în care sistemul poate gestiona notificările și reminderele pentru utilizatorii platformei Tutoring App. Funcționalitatea are rolul de a crește gradul de informare al utilizatorilor și de a reduce riscul omiterii unor consultații sau modificări importante.

## Obiective

Sistemul de notificări trebuie să urmărească următoarele obiective:

1. informarea studenților atunci când apar consultații relevante;
2. informarea utilizatorilor atunci când o consultație este modificată sau anulată;
3. reamintirea apropierii unei consultații programate;
4. informarea profesorilor despre înscrierile sau retragerile studenților;
5. oferirea unui istoric minim al mesajelor importante din platformă.

## Tipuri de notificări

### 1. Notificări pentru studenți

Studentul poate primi notificări în următoarele situații:

1. a fost publicată o nouă consultație relevantă pentru anul și specializarea sa;
2. o consultație la care este înscris a fost modificată;
3. o consultație la care este înscris a fost anulată;
4. se apropie ora unei consultații;
5. înscrierea la o consultație a fost confirmată;
6. consultația a fost sincronizată sau nu a putut fi sincronizată cu Google Calendar.

### 2. Notificări pentru profesori

Profesorul poate primi notificări în următoarele situații:

1. un student s-a înscris la una dintre consultațiile sale;
2. un student s-a retras dintr-o consultație;
3. consultația creată a fost publicată sau actualizată cu succes;
4. există probleme privind sincronizarea sau publicarea unor informații asociate consultației.

### 3. Notificări pentru administratori

Administratorul poate primi notificări în situații precum:

1. apar erori critice în sistem;
2. sincronizarea externă cu un serviciu a eșuat în mod repetat;
3. există activități administrative care necesită intervenție.

## Canale de notificare

Notificările pot fi gândite pe mai multe niveluri, în funcție de complexitatea dorită a aplicației.

### 1. Notificări în aplicație

Aceasta este varianta minimă recomandată pentru prima versiune. Notificările sunt afișate în interfață, de exemplu:

1. într-un dropdown în navbar;
2. într-un centru de notificări;
3. prin mesaje temporare de tip toast pentru confirmări sau erori rapide.

### 2. Notificări prin email

Pot fi folosite pentru evenimente importante:

1. modificarea unei consultații;
2. anularea unei consultații;
3. remindere trimise cu un anumit interval înainte de începere.

### 3. Notificări prin integrare externă

În cazul integrării cu Google Calendar, reminderele pot fi susținute și indirect prin notificările oferite de calendarul utilizatorului.

## Tipuri de comportament recomandate

Sistemul de notificări trebuie să facă diferența între evenimente informative și evenimente care necesită reacție imediată.

### Informative

1. a fost creată o consultație nouă;
2. a fost încărcat un material nou;
3. sincronizarea cu Google Calendar a fost realizată cu succes.

### Importante

1. consultația a fost modificată;
2. consultația a fost anulată;
3. sincronizarea cu Google Calendar a eșuat;
4. utilizatorul nu mai are acces la un serviciu extern conectat.

## Structura conceptuală a unei notificări

Exemplu de entitate pentru notificare:

1. `id`
2. `user_id`
3. `type`
4. `title`
5. `message`
6. `is_read`
7. `related_entity_type`
8. `related_entity_id`
9. `created_at`

Tipuri posibile pentru câmpul `type`:

1. `consultation_created`
2. `consultation_updated`
3. `consultation_cancelled`
4. `consultation_reminder`
5. `enrollment_confirmed`
6. `calendar_sync_failed`

## Reguli de business recomandate

1. studentul trebuie notificat doar pentru consultațiile la care este înscris sau care îi sunt relevante academic;
2. notificările duplicate trebuie evitate;
3. notificările importante trebuie marcate distinct în interfață;
4. reminderele trebuie generate cu un interval configurabil înainte de consultație;
5. utilizatorul ar trebui să poată marca notificările ca citite.

## Interfața recomandată

În frontend, sistemul poate include:

1. un icon de notificări în navbar;
2. o listă cu notificări recente;
3. badge pentru numărul de notificări necitite;
4. eventual o pagină separată cu istoricul notificărilor.

## Relația cu alte module

Modulul de notificări trebuie să fie conectat cu:

1. modulul de consultații;
2. dashboard-ul studentului;
3. dashboard-ul profesorului;
4. integrarea Google Calendar;
5. eventual sistemul de email.

## Concluzie

Funcționalitatea de notificări completează în mod natural platforma, deoarece oferă utilizatorilor vizibilitate asupra evenimentelor importante din sistem. Chiar dacă o versiune minimă poate începe doar cu notificări interne în aplicație, arhitectura ar trebui gândită astfel încât să permită ulterior și remindere prin email sau integrare cu servicii externe.

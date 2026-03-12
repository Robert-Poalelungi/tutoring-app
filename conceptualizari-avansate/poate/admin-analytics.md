# Conceptualizare Analytics și Raportare pentru Administrator

## Scop

Acest document descrie zona de analytics și raportare care poate fi inclusă în panoul de administrare al platformei Tutoring App. Funcționalitatea are rolul de a transforma datele colectate de aplicație în informații utile pentru monitorizare, evaluare și decizie.

## Obiective

Zona de analytics poate urmări următoarele obiective:

1. înțelegerea modului în care este utilizată platforma;
2. identificarea disciplinelor cu interes ridicat;
3. monitorizarea activității profesorilor;
4. observarea distribuției utilizatorilor pe ani și facultăți;
5. fundamentarea unor decizii administrative sau academice.

## Tipuri de metrici relevante

### 1. Metrici despre consultații

Administratorul poate vedea:

1. numărul total de consultații create;
2. consultațiile programate pe intervale de timp;
3. consultațiile anulate;
4. consultațiile finalizate;
5. distribuția consultațiilor pe tip: online sau fizic.

### 2. Metrici despre discipline

Pot fi urmărite:

1. disciplinele cu cele mai multe consultații;
2. disciplinele cu cele mai multe înscrieri;
3. disciplinele cu cea mai mare rată de participare;
4. disciplinele care generează interes suplimentar din partea studenților din alți ani.

### 3. Metrici despre profesori

Administratorul poate urmări:

1. numărul de consultații create de fiecare profesor;
2. numărul mediu de participanți pe consultație;
3. distribuția activității pe profesori;
4. implicarea profesorilor în sistem.

### 4. Metrici despre studenți

Pot fi analizate:

1. numărul total de studenți activi;
2. distribuția studenților pe facultăți;
3. distribuția pe ani de studiu;
4. numărul de înscrieri automate și manuale;
5. participarea la consultații relevante versus consultații suplimentare.

## Exemple de informații utile pentru admin

Panoul de analytics poate răspunde la întrebări precum:

1. care sunt disciplinele cu cea mai mare cerere de consultații;
2. ce profesori folosesc cel mai frecvent platforma;
3. ce facultăți sau specializări generează cele mai multe interacțiuni;
4. câte consultații sunt online și câte sunt fizice;
5. care sunt perioadele cele mai aglomerate în calendar;
6. cât de mult este utilizată platforma de către studenți.

## Tipuri de afișare în interfață

Zona de analytics poate include:

1. carduri cu indicatori principali;
2. grafice de tip bar chart;
3. grafice de tip pie chart;
4. tabele de clasament;
5. filtre pe interval de timp, facultate sau profesor.

### Exemple de widget-uri

1. total consultații;
2. total utilizatori activi;
3. top discipline;
4. top profesori după activitate;
5. consultații pe luni;
6. raport online versus fizic.

## Date necesare pentru analytics

Pentru a susține această funcționalitate, sistemul trebuie să stocheze și să poată agrega date precum:

1. utilizatori și rolurile lor;
2. discipline;
3. consultații;
4. înscrieri la consultații;
5. statusul consultațiilor;
6. date temporale relevante, precum data creării sau data programării.

## Reguli de business recomandate

1. analytics trebuie să reflecte date agregate și nu să expună inutil informații sensibile;
2. administratorul trebuie să poată filtra rapoartele pe intervale de timp;
3. datele prezentate trebuie să fie actualizate periodic sau la cerere;
4. rapoartele trebuie să poată evidenția atât volumul, cât și distribuția activității;
5. pentru prima versiune, este suficient un set restrâns de indicatori esențiali.

## MVP recomandat pentru analytics

Pentru o primă versiune a panoului de administrare, pot fi suficiente următoarele:

1. numărul total de consultații;
2. numărul total de studenți și profesori;
3. top 5 discipline după numărul de consultații;
4. top 5 profesori după numărul de sesiuni create;
5. distribuția consultațiilor online versus fizice.

## Extensii posibile

Într-o etapă ulterioară, zona de analytics poate fi extinsă prin:

1. grafice de tendință în timp;
2. analiză pe facultăți și specializări;
3. rapoarte despre participare efectivă;
4. export în format CSV sau PDF;
5. comparații între semestre sau ani universitari.

## Concluzie

Zona de analytics pentru administrator poate aduce valoare semnificativă proiectului, deoarece transformă platforma dintr-un simplu sistem operațional într-un instrument de monitorizare și analiză. Chiar dacă pentru MVP este suficient un set de indicatori de bază, arhitectura ar trebui gândită astfel încât să permită extinderea ulterioară a raportării.
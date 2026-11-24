# EventManager

Εφαρμογή διαχείρισης εκδηλώσεων και ηλεκτρονικών κρατήσεων στον Παγκόσμιο Ιστό.
Εργασία του μαθήματος «Τεχνολογίες Εφαρμογών Διαδικτύου».

- `backend/` REST API με NestJS, Prisma και PostgreSQL
- `frontend/` διεπαφή χρήστη με Angular

Όλη η επικοινωνία γίνεται πάνω από HTTPS και κάθε κλήση στο API (εκτός από
login, εγγραφή και είσοδο επισκέπτη) θέλει JSON Web Token.

## Τι χρειάζεται

- Node.js 22 ή νεότερο
- PostgreSQL (ή το τοπικό Prisma Postgres με `npx prisma dev`)

## Εγκατάσταση backend

```bash
cd backend
npm install
```

1. Αντίγραψε το `.env.example` σε `.env` και βάλε τα στοιχεία της βάσης.
   - Με κανονική PostgreSQL: φτιάξε μια βάση `eventmanager` και βάλε το ίδιο URL
     στα `DATABASE_URL` και `DIRECT_DATABASE_URL`.
   - Με Prisma Postgres: τρέξε `npx prisma dev` και αντίγραψε τις δύο τιμές που τυπώνει.
2. Δημιούργησε τους πίνακες και τον Prisma Client:

   ```bash
   npx prisma db push
   npx prisma generate
   ```

3. Βάλε τα αρχικά δεδομένα (διαχειριστής και κατηγορίες):

   ```bash
   npm run prisma:seed
   ```

4. Δημιούργησε το self-signed πιστοποιητικό για το HTTPS (φάκελος `backend/certs`):

   ```bash
   npm run certs
   ```

5. Ξεκίνα το backend:

   ```bash
   npm run start:dev
   ```

Το API ακούει στο `https://localhost:3000`.

## Εγκατάσταση frontend

```bash
cd frontend
npm install
npm start
```

Η εφαρμογή ανοίγει στο `https://localhost:4200`. Το `ng serve` χρησιμοποιεί το ίδιο
πιστοποιητικό με το backend, γι' αυτό πρέπει πρώτα να έχει τρέξει το `npm run certs`.
Επειδή το πιστοποιητικό είναι self-signed, ο browser θα δείξει προειδοποίηση την πρώτη φορά
(Advanced → Proceed to localhost).

Τα αιτήματα του Angular πάνε στο `/api/...` και το `proxy.conf.json` τα προωθεί στο backend.

## Ενσωματωμένος διαχειριστής

| Όνομα χρήστη | Κωδικός    |
| ------------ | ---------- |
| `admin`      | `admin123` |

## Ρόλοι

| Ρόλος   | Τι μπορεί να κάνει                                                        |
| ------- | ------------------------------------------------------------------------- |
| `admin` | Διαχείριση χρηστών, έγκριση ή απόρριψη αιτήσεων εγγραφής                  |
| `user`  | Εγγεγραμμένος χρήστης: διοργανωτής στις δικές του εκδηλώσεις, συμμετέχων στις υπόλοιπες |
| `guest` | Επισκέπτης: μόνο πλοήγηση και αναζήτηση, χωρίς κρατήσεις                  |

Ένας νέος χρήστης μπαίνει ως `PENDING` και μπορεί να συνδεθεί μόνο αφού τον εγκρίνει ο διαχειριστής.

## Endpoints που υπάρχουν μέχρι τώρα

| Μέθοδος | Διαδρομή             | Πρόσβαση | Περιγραφή                               |
| ------- | -------------------- | -------- | --------------------------------------- |
| POST    | `/auth/login`        | δημόσιο  | Είσοδος, επιστρέφει `access_token`      |
| POST    | `/auth/register`     | δημόσιο  | Αίτηση εγγραφής (κατάσταση `PENDING`)   |
| POST    | `/auth/guest`        | δημόσιο  | Token επισκέπτη                         |
| GET     | `/users`             | admin    | Λίστα χρηστών, προαιρετικά `?status=`   |
| GET     | `/users/:id`         | admin    | Στοιχεία χρήστη                         |
| PATCH   | `/users/:id/approve` | admin    | Έγκριση αίτησης                         |
| PATCH   | `/users/:id/reject`  | admin    | Απόρριψη αίτησης                        |
| GET     | `/categories`        | όλοι     | Κατηγορίες εκδηλώσεων                   |
| GET     | `/events`            | όλοι     | Δημοσιευμένες εκδηλώσεις                |
| GET     | `/events/search`     | όλοι     | Αναζήτηση με φίλτρα και `?page=`        |
| POST    | `/bookings`          | user     | Κράτηση (`ticketTypeId`, `numberOfTickets`) |
| GET     | `/bookings/mine`     | user     | Οι κρατήσεις μου                        |
| PATCH   | `/bookings/:id/cancel` | user   | Ακύρωση κράτησης                        |
| GET     | `/events/:id/bookings` | owner/admin | Κρατήσεις της εκδήλωσης            |
| POST    | `/messages`          | user/admin | Αποστολή μηνύματος (`receiverUsername`) |
| GET     | `/messages/inbox`, `/messages/sent` | user/admin | Εισερχόμενα, απεσταλμένα |
| GET/DELETE | `/messages/:id`   | user/admin | Άνοιγμα (σημαίνεται αναγνωσμένο) / διαγραφή |
| GET     | `/export?format=json\|xml` | admin | Εξαγωγή όλων των δεδομένων (χωρίς κωδικούς) |
| GET     | `/recommendations`   | user     | Οι 5 προτεινόμενες εκδηλώσεις του χρήστη |
| GET     | `/recommendations/evaluation?folds=5&k=5` | admin | RMSE, MAE, Precision@K, Recall@K (hold-out και l-fold CV) |
| POST    | `/recommendations/retrain` | admin | Άμεση επανεκπαίδευση του μοντέλου   |
| GET     | `/events/mine`       | user     | Οι εκδηλώσεις του διοργανωτή            |
| GET     | `/events/:id`        | όλοι     | Στοιχεία εκδήλωσης (τα πρόχειρα μόνο ο διοργανωτής) |
| POST    | `/events`            | user     | Νέα εκδήλωση (πρόχειρη)                 |
| PATCH   | `/events/:id`        | owner/admin | Επεξεργασία                          |
| PATCH   | `/events/:id/publish`| owner/admin | Δημοσίευση                           |
| PATCH   | `/events/:id/cancel` | owner/admin | Ακύρωση (ακυρώνει και τις κρατήσεις) |
| DELETE  | `/events/:id`        | owner/admin | Διαγραφή (μόνο χωρίς κρατήσεις)      |
| POST    | `/events/:id/photos` | owner/admin | Ανέβασμα φωτογραφίας (πεδίο `photo`) |

## Πρόοδος

- [x] Σκελετός, βάση δεδομένων, HTTPS
- [x] Εγγραφή, είσοδος, JWT, ρόλοι
- [x] Διαχείριση χρηστών από τον διαχειριστή
- [x] Διαχείριση εκδηλώσεων (δημιουργία, επεξεργασία, εισιτήρια, φωτογραφίες, δημοσίευση, ακύρωση, διαγραφή)
- [x] Αναζήτηση εκδηλώσεων (τίτλος, πόλη, κατηγορία, ημερομηνίες, τιμή, σελιδοποίηση)
- [x] Κρατήσεις (με transaction) και χάρτης Leaflet/OpenStreetMap
- [x] Μηνύματα (εισερχόμενα, απεσταλμένα, απάντηση, διαγραφή ανά πλευρά)
- [x] Εξαγωγή XML / JSON (admin)
- [x] Σύστημα συστάσεων (Biased Matrix Factorization, seeding του dataset, μετρικές) (Biased Matrix Factorization)


## Dataset και σύστημα συστάσεων

**Εισαγωγή του dataset** (μία φορά, μετά το `npx prisma db push` και το `npm run prisma:seed`):

1. Βάλε τα CSV (`users.csv`, `events.csv`, `event_interest.csv`, `event_attendees.csv`, `user_friends.csv`) στον φάκελο `backend/data/rel_event_csvs/`. Ο φάκελος `data` δεν ανεβαίνει στο GitHub.
2. Στο `backend` τρέξε `npm run seed:dataset` (θέλει περίπου ένα με δύο λεπτά, γιατί το `events.csv` είναι μεγάλο). Με `npm run seed:dataset -- --reset` γίνεται διαγραφή και νέα εισαγωγή.

Ό,τι εισάγεται: χρήστες `ds_<id>` με κωδικό `dataset123`, εκδηλώσεις «Εκδήλωση #<id>» και αξιολογήσεις 1 έως 5 στον πίνακα `Rating`:

| Πηγή | Τιμή |
|---|---|
| `event_interest`: interested | 5 |
| `event_interest`: not_interested | 1 |
| `event_attendees`: yes / maybe / no (μόνο γραμμές με `user_id`) | 5 / 3 / 1 |

Γραμμές `event_interest` χωρίς απάντηση (ούτε interested ούτε not_interested) δεν μετράνε ως αξιολόγηση. Ο τίτλος, η κατηγορία (από την κυρίαρχη στήλη `c_1..c_100`) και ο χώρος είναι τεχνητοί, γιατί το dataset δεν έχει τέτοια πεδία. Το `user_friends.csv` δεν χρησιμοποιείται.

**Αλγόριθμος** (`backend/src/recommender/bmf.ts`): x̂ij = µ + bi + cj + viᵀfj, εκπαίδευση με SGD και regularization, αρχικοποίηση bias = 0 και μικρές τυχαίες τιμές για τους παράγοντες. Ο αλγόριθμος σταματά όταν το RMSE δεν βελτιωθεί για 2 συνεχόμενες εποχές. Οι προτάσεις είναι οι 5 εκδηλώσεις με την υψηλότερη πρόβλεψη από όσες ο χρήστης δεν έχει δει. Οι αξιολογήσεις του μοντέλου προέρχονται από τον πίνακα `Rating`, τις κρατήσεις (μετράνε ως 5) και τις προβολές σελίδας (μετράνε ως 3).

**Αξιολόγηση** (admin, μενού «Αξιολόγηση»): hold-out 80/20 και 5-fold cross validation. Αποτελέσματα στο dataset (14.665 αξιολογήσεις, 5.532 χρήστες, 5.646 εκδηλώσεις): RMSE περίπου 1,33 έναντι 1,66 της σταθερής πρόβλεψης του μέσου όρου. Το dataset είναι πολύ αραιό (περίπου 2,6 αξιολογήσεις ανά χρήστη), οπότε το κέρδος προέρχεται κυρίως από τα bias και λιγότερο από τους παράγοντες.


## Διορθώσεις βάσει εκφώνησης (Φάση 9b)

- Η εξαγωγή XML ακολουθεί το DTD της εκφώνησης (το DTD μπαίνει μέσα στο αρχείο και επικυρώνεται με `xmllint --valid`). Το JSON έχει την ίδια δομή.
- Αναζήτηση ελεύθερου κειμένου σε τίτλο και περιγραφή (`text`) και σε τοποθεσία (`location`: πόλη, χώρα, διεύθυνση, χώρος). Τα αποτελέσματα εμφανίζονται σε πίνακα με σελιδοποίηση.
- Παράθυρο επιβεβαίωσης πριν την υποβολή κράτησης.
- Ένδειξη μη αναγνωσμένων μηνυμάτων στο μενού.
- Κατά την ακύρωση εκδήλωσης ο διοργανωτής μπορεί να στείλει μήνυμα σε όλους όσους έχουν κράτηση.
- Η δημιουργία εκδήλωσης απαιτεί τουλάχιστον μία κατηγορία (Category+ του DTD).

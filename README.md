# Aplicație SPA (Single Page Application) cu operații CRUD – Vue 3 + Express + Firebase (Firestore)

## Descriere
Această aplicație este un proiect full-stack care implementează o arhitectură separată frontend–backend, având ca scop gestionarea unor obiecte relaționate folosind Firebase Firestore (NoSQL).

Tehnologii utilizate:
- Frontend: Vue 3 (Composition API), Vue Router, Pinia
- Backend: Node.js, Express (API REST)
- Bază de date: Firebase Firestore (NoSQL)
- Autentificare: Firebase Authentication

Aplicația gestionează două entități principale:
- Produse
- Comenzi

---

## Funcționalități

### Autentificare
- Înregistrare utilizator
- Autentificare utilizator
- Protejarea rutelor care modifică datele (Create / Update / Delete)
- Separarea rolurilor (utilizator / administrator)

### Produse (CRUD)
- Listare produse
- Adăugare produs (admin)
- Editare produs
- Ștergere produs
- Căutare după nume
- Sortare avansată după mai multe criterii (categorie, preț, nume)
- Paginare cu infinite scroll

### Comenzi (CRUD)
- Creare comandă pe baza produselor din coș
- Calcularea valorilor totale exclusiv pe server
- Salvarea unui snapshot al produselor la momentul comenzii
- Listarea comenzilor pentru utilizatorul autentificat
- Actualizarea statusului comenzilor (admin)

---

## Modelare date – Firestore (NoSQL)

### Colecția products
- name
- slug
- price
- description
- category
- inventory
- metadata:
  - createdAt
  - updatedAt
  - createdBy

### Colecția orders
- userId
- userEmail
- products[]:
  - productId
  - quantity
  - priceAtPurchase
  - productSnapshot
- totalItems
- totalPrice
- status
- createdAt
- updatedAt

Modelarea datelor respectă principiile NoSQL și evită relațiile de tip SQL.

---

## Structura proiectului (monorepo)

spa-crud-firebase-vue-express/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── stores/
│   │   ├── services/
│   │   └── router/
│   ├── public/
│   └── vite.config.js
├── server/
│   ├── routes/
│   ├── middleware/
│   ├── scripts/
│   ├── firebaseAdmin.js
│   └── index.js
└── README.md

---

## Rulare locală

### Backend (Express)
cd server
npm install
npm run dev

Serverul rulează implicit pe:
http://localhost:4000

### Frontend (Vue 3)
cd client
npm install
npm run dev

Aplicația este disponibilă la:
http://localhost:5173

---

## Observații finale
Aplicația respectă cerințele proiectului, utilizează o arhitectură corect separată frontend–backend, o modelare NoSQL adecvată pentru Firestore, autentificare funcțională și un istoric GitHub care reflectă dezvoltarea incrementală a proiectului.

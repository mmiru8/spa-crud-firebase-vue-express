# Aplicație SPA (Single Page Application) cu operații CRUD – Vue 3 + Express + Firebase (Firestore)

## Descriere
Această aplicație este un proiect full-stack care implementează o arhitectură separată:
- **Frontend:** Vue 3 (Composition API) + Router + Pinia
- **Backend:** Node.js + Express (API REST)
- **Bază de date:** Firebase Firestore (modelare NoSQL)
- **Autentificare:** Firebase Authentication (și protejarea rutelor care modifică datele)

Aplicația gestionează **Produse** și **Comenzi** (obiecte relaționate).

## Funcționalități
### Autentificare
- Înregistrare / autentificare utilizator
- Protejarea rutelor care fac modificări (Create/Update/Delete)

### Produse (CRUD)
- Listare produse
- Adăugare produs
- Editare produs
- Ștergere produs
- Căutare / sortare (opțional)

### Comenzi (CRUD)
- Creare comandă pe baza produselor existente
- Listare comenzi per utilizator
- Actualizare status comandă
- Ștergere comandă (opțional)

## Modelare date (Firestore – NoSQL)
- `products` conține și sub-structuri: `category`, `specifications`, `inventory`, `metadata`
- `orders` conține: `userId`, listă `products[]` cu `productSnapshot` pentru istoric

## Structura proiectului (monorepo)
- `server/` – Express API
- `client/` – Vue 3 SPA

## Rulare locală
### 1) Backend (Express)
```bash
cd server
npm install
npm run dev

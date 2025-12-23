import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB3gOj9CdZyMI_f1LLuZ2N-h0qjywAUyQE",
  authDomain: "spa-crud-vue-express.firebaseapp.com",
  projectId: "spa-crud-vue-express",
  storageBucket: "spa-crud-vue-express.firebasestorage.app",
  messagingSenderId: "329509805480",
  appId: "1:329509805480:web:34bddd574e51dd055c919d"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
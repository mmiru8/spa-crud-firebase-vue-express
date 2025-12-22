import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB3gOj9CdZyMI_f1LLuZ2N-h0qjywAUyQE",
  authDomain: "spa-crud-vue-express.firebaseapp.com",
  projectId: "spa-crud-vue-express",
  storageBucket: "spa-crud-vue-express.firebasestorage.app",
  messagingSenderId: "329509805480",
  appId: "1:329509805480:web:34bddd574e51dd055c919d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
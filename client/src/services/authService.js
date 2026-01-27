import { auth } from "../firebase/firebase";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

const ADMIN_EMAILS = ["admin@test.com", "mmiru3511@gmail.com"];

export const login = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);

export const onUserChanged = (cb) => onAuthStateChanged(auth, cb);

export const getCurrentUser = () => auth.currentUser;

export const isAdmin = (user) => {
  const email = (user?.email || "").toLowerCase().trim();
  return ADMIN_EMAILS.map((e) => e.toLowerCase().trim()).includes(email);
};

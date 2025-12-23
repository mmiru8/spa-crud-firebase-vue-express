import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

const ordersRef = collection(db, "orders");

// CREATE
export const createOrder = async (payload) => {
  // payload: { items, totalItems, totalPrice }
  return await addDoc(ordersRef, {
    ...payload,
    status: "noua",
    createdAt: serverTimestamp(),
  });
};

// READ (list)
export const getOrders = async () => {
  const q = query(ordersRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};

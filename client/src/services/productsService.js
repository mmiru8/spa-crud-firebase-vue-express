import { db } from "../firebase/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";

const productsRef = collection(db, "products");

export const getProducts = async () => {
  const snapshot = await getDocs(productsRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const addProduct = async (product) => {
  return await addDoc(productsRef, product);
};

export const deleteProduct = async (id) => {
  return await deleteDoc(doc(db, "products", id));
};

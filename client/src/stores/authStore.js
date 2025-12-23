import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";

const ADMIN_EMAILS = ["admin@test.com"];

export const useAuthStore = defineStore("auth", () => {
  const auth = getAuth();

  const user = ref(null);
  const ready = ref(false);

  const isLoggedIn = computed(() => !!user.value);
  const isAdmin = computed(() =>
    ADMIN_EMAILS.includes((user.value?.email || "").toLowerCase())
  );

  const init = () =>
    new Promise((resolve) => {
      onAuthStateChanged(auth, (u) => {
        user.value = u;
        ready.value = true;
        resolve(u);
      });
    });

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    user.value = cred.user;
    return cred.user;
  };

  const register = async (email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    user.value = cred.user;
    return cred.user;
  };

  const logout = async () => {
    await signOut(auth);
    user.value = null;
  };

  return {
    user,
    ready,
    isLoggedIn,
    isAdmin,
    init,
    login,
    register,
    logout,
  };
});

import { auth } from "../firebase/firebase";

export const getIdToken = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken(); 
};

export const apiFetch = async (url, options = {}) => {
  const token = await getIdToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.message || msg;
    } catch {}
    throw new Error(msg);
  }


  if (res.status === 204) return null;


  try {
    return await res.json();
  } catch {
    return null;
  }
};

const express = require("express");
const router = express.Router();
const { db } = require("../firebaseAdmin");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/adminOnly");

// USER: create own order
router.post("/", requireAuth, async (req, res) => {
  try {
const { items = [] } = req.body;

    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "Items required" });

const now = new Date().toISOString();

// items trebuie să conțină minim: [{ productId, qty }]
const normalized = items.map((it) => ({
  productId: String(it.productId || "").trim(),
  quantity: Number(it.qty ?? it.quantity ?? 0),
}));

if (
  normalized.some(
    (it) => !it.productId || !Number.isFinite(it.quantity) || it.quantity < 1
  )
) {
  return res.status(400).json({ message: "Invalid items" });
}

// luăm produsele din DB pentru snapshot + priceAtPurchase
const productSnaps = await Promise.all(
  normalized.map((it) => db.collection("products").doc(it.productId).get())
);

if (productSnaps.some((s) => !s.exists)) {
  return res.status(400).json({ message: "One or more products not found" });
}

const products = normalized.map((it, idx) => {
  const data = productSnaps[idx].data();
  const price = Number(data.price || 0);

  return {
    productId: it.productId,
    quantity: it.quantity,
    priceAtPurchase: price,
    productSnapshot: {
      name: data.name || "",
      slug: data.slug || "",
      price,
    },
  };
});

const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
const totalPrice = products.reduce(
  (sum, p) => sum + p.quantity * p.priceAtPurchase,
  0
);

const docRef = await db.collection("orders").add({
  userId: req.user.uid,
  userEmail: req.user.email || "",
  status: "noua",

  products,
  totalItems,
  totalPrice,

  createdAt: now,
  updatedAt: now,
});



    res.status(201).json({ id: docRef.id });
  } catch (e) {
    res.status(500).json({ message: "Eroare la creare comandă" });
  }
});

// USER: get my orders
router.get("/my", requireAuth, async (req, res) => {
  try {
    const snap = await db
      .collection("orders")
      .where("userId", "==", req.user.uid)
      .get();

    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    // sortare locală desc după createdAt (string ISO)
    orders.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    res.json(orders);
  } catch (e) {
    res.status(500).json({ message: "Eroare la citire comenzi" });
  }
});

// ADMIN: get all orders
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const snap = await db.collection("orders").get();
    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(orders);
  } catch (e) {
    res.status(500).json({ message: "Eroare la citire comenzi (admin)" });
  }
});

// ADMIN: update order status
router.put("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (typeof status !== "string" || status.trim().length < 2)
      return res.status(400).json({ message: "Invalid status" });

    await db.collection("orders").doc(id).update({
      status: status.trim(),
      updatedAt: new Date().toISOString(),
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Eroare la update status" });
  }
});

module.exports = router;

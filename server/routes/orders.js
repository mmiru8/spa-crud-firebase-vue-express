const express = require("express");
const router = express.Router();
const { db } = require("../firebaseAdmin");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/adminOnly");

// USER: create own order
router.post("/", requireAuth, async (req, res) => {
  try {
    const { items = [], totalItems = 0, totalPrice = 0 } = req.body;

    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "Items required" });

    const docRef = await db.collection("orders").add({
      items,
      totalItems: Number(totalItems || 0),
      totalPrice: Number(totalPrice || 0),
      userId: req.user.uid,
      userEmail: req.user.email || "",
      status: "noua",
      createdAt: new Date().toISOString(),
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

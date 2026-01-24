const express = require("express");
const router = express.Router();
const { db } = require("../firebaseAdmin");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/adminOnly");

router.post("/", requireAuth, async (req, res) => {
  try {
    const { products = [] } = req.body;

    // 1) validare
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Products required" });
    }

    const normalized = products.map((it) => ({
      productId: String(it.productId || "").trim(),
      quantity: Number(it.quantity ?? 0),
    }));

    if (
      normalized.some(
        (it) => !it.productId || !Number.isFinite(it.quantity) || it.quantity < 1
      )
    ) {
      return res.status(400).json({ message: "Invalid products" });
    }

    // 2) luăm produsele din DB (1 singur fetch per produs)
    const uniqueIds = Array.from(new Set(normalized.map((x) => x.productId)));
    const refs = uniqueIds.map((id) => db.collection("products").doc(id));
    const snaps = await db.getAll(...refs);

    const mapById = new Map();
    snaps.forEach((s) => {
      if (s.exists) mapById.set(s.id, s.data());
    });

    const missing = uniqueIds.find((id) => !mapById.has(id));
    if (missing) {
      return res.status(400).json({ message: `Product not found: ${missing}` });
    }

    // 3) build products[] cu snapshot + priceAtPurchase + slug
    const finalProducts = normalized.map((it) => {
      const data = mapById.get(it.productId);

      const price = Number(data.price || 0);

      return {
        productId: it.productId,
        quantity: it.quantity,
        priceAtPurchase: price,
        productSnapshot: {
          name: String(data.name || ""),
          price: price,
          slug: String(data.slug || ""),
        },
      };
    });

    // 4) calcule pe server
    const totalItems = finalProducts.reduce((sum, p) => sum + p.quantity, 0);
    const totalPrice = finalProducts.reduce(
      (sum, p) => sum + p.quantity * p.priceAtPurchase,
      0
    );

    const now = new Date().toISOString();

    // 5) save order
    const docRef = await db.collection("orders").add({
      userId: req.user.uid,
      userEmail: req.user.email || "",
      status: "noua",

      products: finalProducts,
      totalItems,
      totalPrice,

      createdAt: now,
      updatedAt: now,
    });

    return res.status(201).json({ id: docRef.id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Eroare la creare comandă" });
  }
});

router.get("/my", requireAuth, async (req, res) => {
  try {
    const snap = await db
      .collection("orders")
      .where("userId", "==", req.user.uid)
      .get();

    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    orders.sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    );

    res.json(orders);
  } catch (e) {
    res.status(500).json({ message: "Eroare la citire comenzi" });
  }
});

router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const snap = await db.collection("orders").get();
    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(orders);
  } catch (e) {
    res.status(500).json({ message: "Eroare la citire comenzi (admin)" });
  }
});
router.put("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (typeof status !== "string" || status.trim().length < 2) {
      return res.status(400).json({ message: "Invalid status" });
    }

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

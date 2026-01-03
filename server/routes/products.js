const express = require("express");
const router = express.Router();
const { db } = require("../firebaseAdmin");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/adminOnly");
const slugify = (s = "") =>
  s
    .toString()
    .trim()
    .toLowerCase()
    .replace(/ă/g, "a")
    .replace(/â/g, "a")
    .replace(/î/g, "i")
    .replace(/ș/g, "s")
    .replace(/ț/g, "t")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

// READ (user)
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("products").get();
    const products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Eroare la citirea produselor" });
  }
});

// CREATE (admin)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, price, description = "", category = null, inventory = null } = req.body;

    if (typeof name !== "string" || name.trim().length < 2)
      return res.status(400).json({ message: "Invalid name" });

    const p = Number(price);
    if (!Number.isFinite(p) || p < 0)
      return res.status(400).json({ message: "Invalid price" });
const now = new Date().toISOString();
const slug = slugify(name);

const docRef = await db.collection("products").add({
  name: name.trim(),
  slug,
  price: p,
  description: String(description || ""),
  category,
  inventory,

  createdAt: now,
  updatedAt: now,
  createdBy: req.user.uid,

  metadata: {
    createdAt: now,
    updatedAt: now,
    createdBy: req.user.uid,
  },
});
    res.status(201).json({ id: docRef.id });
  } catch (e) {
    res.status(500).json({ message: "Eroare la adăugare produs" });
  }
});

// UPDATE (admin)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const patch = {};

    if ("name" in req.body) {
      if (typeof req.body.name !== "string" || req.body.name.trim().length < 2)
        return res.status(400).json({ message: "Invalid name" });
const nm = req.body.name.trim();
patch.name = nm;
patch.slug = slugify(nm);
    }

    if ("price" in req.body) {
      const p = Number(req.body.price);
      if (!Number.isFinite(p) || p < 0)
        return res.status(400).json({ message: "Invalid price" });
      patch.price = p;
    }

    if ("description" in req.body) patch.description = String(req.body.description || "");
    if ("category" in req.body) patch.category = req.body.category ?? null;
    if ("inventory" in req.body) patch.inventory = req.body.inventory ?? null;

const now = new Date().toISOString();
patch.updatedAt = now;
patch["metadata.updatedAt"] = now;

const ref = db.collection("products").doc(id);
const snap = await ref.get();
if (!snap.exists) return res.status(404).json({ message: "Product not found" });

await ref.update(patch);
res.status(204).send();
  } catch (e) {
    res.status(500).json({ message: "Eroare la actualizare produs" });
  }
});

// DELETE (admin)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("products").doc(id).delete();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Eroare la ștergere produs" });
  }
});

module.exports = router;

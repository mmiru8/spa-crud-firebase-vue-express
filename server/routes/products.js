const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

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

// =====================
// READ ALL (admin) - fără paginare
// GET /api/products/all
// IMPORTANT: trebuie să fie înainte de orice rută cu "/:id"
// =====================
router.get("/all", requireAuth, requireAdmin, async (req, res) => {
  try {
    const snap = await db.collection("products").orderBy("createdAt", "desc").get();
    const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json(items);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Eroare la citirea produselor (admin)" });
  }
});

// =====================
// READ (public) + pagination
// GET /api/products?limit=12&cursor=createdAt|docId
// =====================
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 12), 50);
    const cursor = String(req.query.cursor || "").trim();

    const FieldPath = admin.firestore.FieldPath;

    let q = db
      .collection("products")
      .orderBy("createdAt", "desc")
      .orderBy(FieldPath.documentId(), "desc")
      .limit(limit);

    // cursor format: "createdAt|docId"
    if (cursor) {
      const [cursorCreatedAt, cursorId] = cursor.split("|");
      if (cursorCreatedAt && cursorId) {
        q = q.startAfter(cursorCreatedAt, cursorId);
      }
    }

    const snap = await q.get();
    const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // next cursor = last item's createdAt|id
    let nextCursor = null;
    if (snap.docs.length === limit) {
      const last = snap.docs[snap.docs.length - 1];
      const lastData = last.data() || {};
      nextCursor = `${String(lastData.createdAt || "")}|${last.id}`;
    }

    return res.json({ items, nextCursor });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Eroare la citirea produselor" });
  }
});

// =====================
// CREATE (admin)
// =====================
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      price,
      description = "",
      category = null,
      inventory = null,
    } = req.body;

    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ message: "Invalid name" });
    }

    const p = Number(price);
    if (!Number.isFinite(p) || p < 0) {
      return res.status(400).json({ message: "Invalid price" });
    }

    const now = new Date().toISOString();
    const nm = name.trim();
    const slug = slugify(nm);

    const docRef = await db.collection("products").add({
      name: nm,
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

    return res.status(201).json({ id: docRef.id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Eroare la adăugare produs" });
  }
});

// =====================
// UPDATE (admin)
// =====================
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const patch = {};

    if ("name" in req.body) {
      if (typeof req.body.name !== "string" || req.body.name.trim().length < 2) {
        return res.status(400).json({ message: "Invalid name" });
      }
      const nm = req.body.name.trim();
      patch.name = nm;
      patch.slug = slugify(nm);
    }

    if ("price" in req.body) {
      const p = Number(req.body.price);
      if (!Number.isFinite(p) || p < 0) {
        return res.status(400).json({ message: "Invalid price" });
      }
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
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Eroare la actualizare produs" });
  }
});

// =====================
// DELETE (admin)
// =====================
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("products").doc(id).delete();
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Eroare la ștergere produs" });
  }
});

module.exports = router;

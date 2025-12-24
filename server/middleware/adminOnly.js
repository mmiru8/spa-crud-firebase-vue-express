const { db } = require("../firebaseAdmin");

async function requireAdmin(req, res, next) {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ message: "Not authenticated" });

    const snap = await db.collection("admins").doc(uid).get();
    if (!snap.exists) return res.status(403).json({ message: "Admin only" });

    next();
  } catch (e) {
    return res.status(500).json({ message: "Admin check failed" });
  }
}

module.exports = { requireAdmin };

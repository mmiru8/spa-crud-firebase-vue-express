const { admin } = require("../firebaseAdmin");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer (.+)$/);
    if (!match) return res.status(401).json({ message: "Missing Bearer token" });

    const decoded = await admin.auth().verifyIdToken(match[1]);
    req.user = decoded; // { uid, email, ... }
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = { requireAuth };

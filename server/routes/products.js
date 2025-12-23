const express = require("express");
const router = express.Router();
const { db } = require("../firebaseAdmin");

router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("products").get();
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Eroare la citirea produselor" });
  }
});

module.exports = router;

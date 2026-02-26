// backend/server/routes/dogRoutes.js
const express = require("express");
const { getDogFedFlag } = require("../controllers/dogController");

const router = express.Router();

router.get("/state", async (_req, res) => {
  try {
    const fed = await getDogFedFlag();
    res.json({ fed });
  } catch (e) {
    res.status(500).json({ fed: false, error: "dog state failed" });
  }
});

module.exports = router;
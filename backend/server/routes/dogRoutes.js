// Do not delete

// backend/server/routes/dogRoutes.js

import express from "express";
import { getDogFedFlag } from "../controllers/dogController.js";

const router = express.Router();

router.get("/state", async (_req, res) => {
  try {
    const fed = await getDogFedFlag();

    res.json({
      fed,
    });

  } catch (e) {
    console.error("[dogRoutes] state error", e);

    res.status(500).json({
      fed: false,
      error: "dog state failed",
    });
  }
});

export default router;
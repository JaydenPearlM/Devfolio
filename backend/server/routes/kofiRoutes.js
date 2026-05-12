// do not delete

// backend/server/routes/kofiRoutes.js

import express from "express";
import { updateDogFedFlag } from "../controllers/dogController.js";

const router = express.Router();

/**
 * Ko-fi sends application/x-www-form-urlencoded by default
 * with a JSON string inside the `data` field.
 *
 * Route: POST /webhook
 */
router.post("/webhook", express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const payload = JSON.parse(req.body?.data || "{}");

    // Verify Ko-fi token
    const tokenFromKofi = payload.verification_token;

    if (tokenFromKofi !== process.env.KOFI_VERIFY_TOKEN) {
      return res.status(401).send("Invalid token");
    }

    // Donation event
    if (payload.type === "Donation") {
      await updateDogFedFlag(true);
    }

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Ko-fi webhook error:", err);
    return res.status(400).send("Bad request");
  }
});

export default router;
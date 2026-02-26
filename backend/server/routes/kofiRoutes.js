// server/routes/kofiRoutes.js
const express = require("express");
const bodyParser = require("body-parser");

// ✅ IMPORTANT: keep your dog logic
// Your original file imported: "../controllers/dogController.js"
// In CommonJS, we require it. If dogController.js is ESM-only, see note below.
const { updateDogFedFlag } = require("../controllers/dogController");

const router = express.Router();

/**
 * Ko-fi sends application/x-www-form-urlencoded by default,
 * often with a `data` JSON string inside.
 *
 * This route matches your original path: POST /webhook
 */
router.post(
  "/webhook",
  bodyParser.urlencoded({ extended: false }),
  async (req, res) => {
    try {
      const payload = JSON.parse(req.body?.data || "{}");

      // Optional: verify token
      const tokenFromKofi = payload.verification_token;
      if (tokenFromKofi !== process.env.KOFI_VERIFY_TOKEN) {
        return res.status(401).send("Invalid token");
      }

      if (payload.type === "Donation") {
        // ✅ Flip the global “dog fed” flag (your sprite dog logic)
        await updateDogFedFlag(true);
      }

      return res.status(200).send("OK");
    } catch (err) {
      console.error("Ko-fi webhook error:", err);
      return res.status(400).send("Bad request");
    }
  }
);

module.exports = router;

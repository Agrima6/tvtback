// index.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config(); // Load .env file

const app = express();
app.use(cors());

// ⬇️ important: larger limit because screenshot base64 can be big
app.use(express.json({ limit: "10mb" }));

// 🔥 Load MongoDB URL from .env
const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error("❌ ERROR: MONGO_URL not found in .env file");
  process.exit(1);
}

mongoose
  .connect(MONGO_URL, {
    dbName: "tvt_db",
  })
  .then(() => console.log("🔥 MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

/* ------------------------------------------------------------------
   USER SCHEMA
-------------------------------------------------------------------*/
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

/* ------------------------------------------------------------------
   PAYMENT SCHEMA  (for QR payments + screenshot)
-------------------------------------------------------------------*/
const paymentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },          // user name
    phone: { type: String, required: true },         // user phone
    planTitle: { type: String, required: true },     // e.g. "Premium Love Panel"
    amount: { type: Number, required: true },        // e.g. 11000
    screenshotBase64: { type: String, required: true }, // image encoded as base64
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

/* ------------------------------------------------------------------
   ROUTES
-------------------------------------------------------------------*/

// POST /register → Save or Update User
app.post("/register", async (req, res) => {
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: "Name and phone required" });
  }

  try {
    const user = await User.findOneAndUpdate(
      { phone },
      { name, phone },
      { upsert: true, new: true }
    );

    return res.json({ success: true, user });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /users → Fetch all users
app.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.json(users);
  } catch (err) {
    console.error("Users error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ NEW: POST /payment-proof → store payment info + screenshot
app.post("/payment-proof", async (req, res) => {
  try {
    const { name, phone, planTitle, amount, screenshotBase64 } = req.body;

    if (!name || !phone || !planTitle || !amount || !screenshotBase64) {
      return res.status(400).json({
        error: "name, phone, planTitle, amount, screenshotBase64 required",
      });
    }

    const payment = await Payment.create({
      name,
      phone,
      planTitle,
      amount,
      screenshotBase64,
    });

    return res.json({ success: true, payment });
  } catch (err) {
    console.error("Payment-proof error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// (Optional) GET /payments → list all payment proofs (for admin panel later)
app.get("/payments", async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    return res.json(payments);
  } catch (err) {
    console.error("Payments error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
export default app;
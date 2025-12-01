import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error("❌ ERROR: MONGO_URL not found");
  throw new Error("MONGO_URL is required");
}

// -------------------- MONGO CONNECTION --------------------
mongoose
  .connect(MONGO_URL, {
    dbName: "tvt_db",
  })
  .then(() => console.log("🔥 MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// -------------------- DEFAULT ROUTE --------------------
app.get("/", (req, res) => {
  res.send("TVT backend is running ✅");
});

// -------------------- SCHEMAS --------------------
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { timestamps: true }
);
const User = mongoose.model("User", userSchema);

const paymentSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    planTitle: String,
    amount: Number,
    screenshotBase64: String,
  },
  { timestamps: true }
);
const Payment = mongoose.model("Payment", paymentSchema);

// -------------------- ROUTES --------------------
app.post("/api/register", async (req, res) => {
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
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/payment-proof", async (req, res) => {
  try {
    const { name, phone, planTitle, amount, screenshotBase64 } = req.body;

    const payment = await Payment.create({
      name,
      phone,
      planTitle,
      amount,
      screenshotBase64,
    });

    return res.json({ success: true, payment });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/payments", async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    return res.json(payments);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------- SERVER --------------------
const PORT = process.env.PORT || 8000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

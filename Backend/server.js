require('dotenv').config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const midtransClient = require("midtrans-client");

// ==========================
// FIREBASE ADMIN SDK
// ==========================
const serviceAccount = require('./rapid-repair-15fa8-firebase-adminsdk-fbsvc-d70f6f94a8.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ==========================
// MIDTRANS SNAP CONFIG
// ==========================
let snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
});

// 🔥 SIMULASI DATABASE (Untuk testing payment status)
let transactions = {};

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ==========================
// TEST ROUTE
// ==========================
app.get("/", (req, res) => {
    res.send("Backend is running (Firebase + Midtrans + Escrow release) 🚀");
});

// ==========================
// FIREBASE ROUTES
// ==========================

// REGISTER TECHNICIAN AND SAVE TO FIRESTORE
app.post("/technician/register", async (req, res) => {
    try {
        const {
            uid, name, email, phone, location, specialization, experience,
            hasEquipment, vehicle, selectedSkills, employmentStatus,
            bankName, bankAccount, ktpBase64, workBase64, ktpUrl, workUrl
        } = req.body;

        if (!uid) return res.status(400).json({ error: "Missing UID" });

        console.log("Processing registration (Firestore Only) for:", uid);

        const finalKtpUrl = ktpBase64 ? `data:image/jpeg;base64,${ktpBase64}` : "dummy";
        const finalWorkUrl = workBase64 ? `data:image/jpeg;base64,${workBase64}` : "dummy1";

        const technicianData = {
            name: name || "",
            email: email || "",
            phone: phone || "",
            location: location || "",
            specialization: specialization || "",
            experience: experience || "",
            hasEquipment: hasEquipment !== undefined ? hasEquipment : true,
            vehicle: vehicle || "",
            skills: selectedSkills || [],
            status: "pending",
            employmentStatus: employmentStatus || "",
            bankName: bankName || "",
            bankAccount: bankAccount || "",
            ktpUrl: finalKtpUrl,
            workPhotos: [finalWorkUrl],
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection("technicians").doc(uid).set(technicianData);

        await db.collection("users").doc(uid).update({
            role: "technician"
        });

        console.log(`✅ Saved technician with UID: ${uid}`);
        res.json({ message: "Technician registered successfully! (Images saved to Database)" });
    } catch (err) {
        console.error("Firestore Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// CREATE USER PROFILE IN FIRESTORE
app.post("/api/create-profile", async (req, res) => {
    try {
        const { uid, name, email, location, address } = req.body;

        if (!uid) return res.status(400).json({ error: "Missing UID" });

        console.log("Creating profile for:", uid);

        await db.collection("users").doc(uid).set({
            name: name || "",
            email: email || "",
            location: location || "",
            address: address || "",
            role: "user",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ message: "Profile created successfully!" });
    } catch (err) {
        console.error("Profile Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// APPROVE TECHNICIAN
app.post("/technician/approve", async (req, res) => {
    try {
        const { uid } = req.body;

        if (!uid) return res.status(400).json({ error: "UID required" });

        await db.collection("technicians").doc(uid).update({
            status: "approved"
        });

        res.json({ message: "Technician approved!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================
// MIDTRANS PAYMENT ROUTES
// ==========================

// CREATE TRANSACTION
app.post("/create-transaction", async (req, res) => {
    try {
        console.log("🔥 REQUEST PAYMENT:", req.body);
        const { total } = req.body;
        const orderId = "ORDER-" + Date.now();

        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: parseInt(total),
            },
            customer_details: {
                first_name: "User",
                email: "user@mail.com",
            },
            callbacks: {
                finish: "loginapp://payment-success"
            }
        };

        const transaction = await snap.createTransaction(parameter);
        console.log("✅ MIDTRANS RESPONSE:", transaction);

        // 🔥 SIMPAN KE MEMORY (Untuk sementara)
        transactions[orderId] = {
            order_id: orderId,
            amount: total,
            payment_status: "pending",
            escrow_status: "held",
            approved: false
        };

        res.json({
            order_id: orderId,
            token: transaction.token,
            redirect_url: transaction.redirect_url,
        });

    } catch (error) {
        console.log("❌ ERROR CREATE TRANSACTION:", error);
        res.status(500).json({ error: error.message });
    }
});

// MIDTRANS WEBHOOK CALLBACK
app.post("/midtrans-callback", (req, res) => {
    const data = req.body;
    const orderId = data.order_id;
    const status = data.transaction_status;

    console.log("📩 CALLBACK RECEIVED:", status, orderId);

    if (transactions[orderId]) {
        transactions[orderId].payment_status = status;
    }

    res.sendStatus(200);
});

// CHECK PAYMENT STATUS
app.get("/check-status/:orderId", async (req, res) => {
    const orderId = req.params.orderId;
    try {
        if (transactions[orderId]) {
            // 🔥 SYNC KE MIDTRANS (Prevent status mismatch)
            const midtransStatus = await snap.transaction.status(orderId);
            transactions[orderId].payment_status = midtransStatus.transaction_status;

            console.log("🔄 SYNC STATUS:", midtransStatus.transaction_status);
            return res.json(transactions[orderId]);
        }
        return res.status(404).json({ error: "Order not found" });
    } catch (error) {
        console.log("❌ ERROR CHECK STATUS:", error);
        res.status(500).json({ error: error.message });
    }
});

// APPROVE (ESCROW RELEASE TO TECHNICIAN)
app.post("/approve", (req, res) => {
    const { order_id } = req.body;
    if (!transactions[order_id]) {
        return res.status(404).json({ error: "Order tidak ditemukan" });
    }

    const trx = transactions[order_id];

    if (trx.payment_status !== "settlement") {
        return res.json({ message: "Belum dibayar (status: " + trx.payment_status + ")" });
    }

    trx.escrow_status = "released";
    trx.approved = true;

    console.log("💸 FUNDS RELEASED TO TECHNICIAN:", order_id);

    res.json({
        message: "Dana berhasil dicairkan ke teknisi",
        data: trx
    });
});

// ==========================
// START SERVER
// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
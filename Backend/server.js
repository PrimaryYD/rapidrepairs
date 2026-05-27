require('dotenv').config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const midtransClient = require("midtrans-client");
const path = require("path");
const fs = require("fs");

// ==========================
// FIREBASE ADMIN SDK
// ==========================
const { getStorage } = require('firebase-admin/storage');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('./rapid-repair-15fa8-firebase-adminsdk-fbsvc-d70f6f94a8.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "gs://rapid-repair-15fa8.firebasestorage.app"
});

const db = getFirestore();


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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================
// TEST ROUTE
// ==========================
app.get("/", (req, res) => {
    res.send("Backend is running (Firebase + Midtrans + Manual Verification) 🚀");
});

// Helper to upload base64 to LOCAL disk (since Firebase Storage is not enabled)
async function uploadToStorage(base64, folder, fileName) {
    try {
        if (!base64 || base64 === "dummy" || base64 === "dummy1") return base64;
        
        const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        
        // Ensure the uploads directory exists
        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Save to local file system
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, buffer);

        // Return local server URL (use current machine IP)
        return `http://192.168.1.3:3000/uploads/${fileName}`;
    } catch (err) {
        console.error("Local Save error:", err);
        return null;
    }
}

// ==========================
// FIREBASE ROUTES
// ==========================

// REGISTER TECHNICIAN AND SAVE TO FIRESTORE
app.post("/technician/register", async (req, res) => {
    try {
        const {
            uid, name, email, phone, location, specialization, experience,
            hasEquipment, vehicle, selectedSkills, employmentStatus,
            bankName, bankAccount, ktpBase64, workPhotosBase64, selfiesBase64,
            testScore, testAnswers
        } = req.body;

        if (!uid) return res.status(400).json({ error: "Missing UID" });

        console.log("Processing registration (Storage + Firestore) for:", uid);
        console.log("Data received:", {
            ktpLen: ktpBase64 ? ktpBase64.length : 0,
            workPhotosCount: Array.isArray(workPhotosBase64) ? workPhotosBase64.length : 0,
            selfiesCount: Array.isArray(selfiesBase64) ? selfiesBase64.length : 0,
            testScore
        });

        // 1. Upload KTP
        const ktpUrl = await uploadToStorage(ktpBase64, `technicians/${uid}`, `ktp_${Date.now()}.jpg`);

        // 2. Upload Work Photos (Max 5)
        const workUrls = [];
        if (Array.isArray(workPhotosBase64)) {
            for (let i = 0; i < Math.min(workPhotosBase64.length, 5); i++) {
                const url = await uploadToStorage(workPhotosBase64[i], `technicians/${uid}/work`, `work_${i}_${Date.now()}.jpg`);
                if (url) workUrls.push(url);
            }
        }

        // 3. Upload Selfies (Manual Review)
        const selfieUrls = [];
        if (Array.isArray(selfiesBase64)) {
            for (let i = 0; i < selfiesBase64.length; i++) {
                const url = await uploadToStorage(selfiesBase64[i], `technicians/${uid}/selfies`, `selfie_${i}_${Date.now()}.jpg`);
                if (url) selfieUrls.push(url);
            }
        }

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
            ktpUrl: ktpUrl || "",
            workPhotos: workUrls,
            selfiePhotos: selfieUrls,
            testScore: testScore !== undefined ? testScore : 0,
            testAnswers: testAnswers || [],
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection("technicians").doc(uid).set(technicianData);

        await db.collection("users").doc(uid).update({
            role: "technician"
        });

        console.log(`✅ Saved technician with UID: ${uid}`);
        res.json({ message: "Pendaftaran berhasil! Data Anda sedang ditinjau manual oleh tim kami." });
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

        const role = email === "adminrapidrepairs@gmail.com" ? "admin" : "user";

        await db.collection("users").doc(uid).set({
            name: name || "",
            email: email || "",
            location: location || "",
            address: address || "",
            role: role,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ message: "Profile created successfully!" });
    } catch (err) {
        console.error("Profile Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// VERIFY INSPECTION IMAGES (AI Simulation)
app.post("/verify-inspection", async (req, res) => {
    try {
        const { orderId, images } = req.body;
        console.log(`🤖 AI Verifying inspection for order: ${orderId}`);

        // In a real app, you would use a vision model here.
        // We simulate a confidence score between 0.6 and 0.95
        const confidence = 0.6 + Math.random() * 0.35;
        
        console.log(`✅ AI Confidence: ${(confidence * 100).toFixed(2)}%`);

        if (confidence > 0.5) {
            await db.collection("orders").doc(orderId).update({
                inspectionVerified: true,
                aiConfidence: confidence,
                status: "inspection_verified"
            });
            res.json({ success: true, confidence });
        } else {
            res.json({ success: false, confidence, message: "Foto tidak cukup jelas atau tidak sesuai." });
        }
    } catch (err) {
        console.error("AI Verify Error:", err);
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

// GET ALL TECHNICIANS FOR ADMIN PAGE
app.get("/technicians", async (req, res) => {
    try {
        const snapshot = await db.collection("technicians").get();
        const technicians = [];
        snapshot.forEach(doc => {
            technicians.push({ uid: doc.id, ...doc.data() });
        });
        res.json(technicians);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPLOAD INSPECTION IMAGES FOR ORDER
app.post("/api/upload-inspection", async (req, res) => {
    try {
        const { orderId, images } = req.body;

        if (!orderId) return res.status(400).json({ error: "Missing orderId" });

        console.log(`📸 Uploading inspection images for order: ${orderId}`);

        const uploadedUrls = {};

        for (const serviceName in images) {
            uploadedUrls[serviceName] = [];
            const base64Array = images[serviceName] || [];
            
            for (let i = 0; i < base64Array.length; i++) {
                const base64 = base64Array[i];
                if (!base64) continue;
                const fileName = `inspect_${orderId}_${serviceName.replace(/[^a-zA-Z0-9]/g, '_')}_${i}_${Date.now()}.jpg`;
                const url = await uploadToStorage(base64, `orders/${orderId}`, fileName);
                if (url) {
                    uploadedUrls[serviceName].push(url);
                }
            }
        }

        // Save URL arrays back into the Firestore order document
        await db.collection("orders").doc(orderId).update({
            inspectionPhotos: uploadedUrls
        });

        res.json({ success: true, urls: uploadedUrls });
    } catch (err) {
        console.error("Upload inspection photos error:", err);
        res.status(500).json({ error: err.message });
    }
});

// UPLOAD COMPLETION IMAGES FOR ORDER
app.post("/api/upload-completion", async (req, res) => {
    try {
        const { orderId, images } = req.body;

        if (!orderId) return res.status(400).json({ error: "Missing orderId" });

        console.log(`📸 Uploading completion images for order: ${orderId}`);

        const uploadedUrls = {};

        for (const serviceName in images) {
            uploadedUrls[serviceName] = [];
            const base64Array = images[serviceName] || [];
            
            for (let i = 0; i < base64Array.length; i++) {
                const base64 = base64Array[i];
                if (!base64) continue;
                const fileName = `complete_${orderId}_${serviceName.replace(/[^a-zA-Z0-9]/g, '_')}_${i}_${Date.now()}.jpg`;
                const url = await uploadToStorage(base64, `orders/${orderId}/completed`, fileName);
                if (url) {
                    uploadedUrls[serviceName].push(url);
                }
            }
        }

        // Save URL arrays back into the Firestore order document
        await db.collection("orders").doc(orderId).update({
            completionPhotos: uploadedUrls,
            status: "completed"
        });

        res.json({ success: true, urls: uploadedUrls });
    } catch (err) {
        console.error("Upload completion photos error:", err);
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

// GET ALL ORDERS FOR ADMIN ESCROW PANEL
app.get("/api/admin/orders", async (req, res) => {
    try {
        console.log("Fetching orders with tech bank details for admin...");
        // 1. Fetch all orders from Firestore
        const ordersSnapshot = await db.collection("orders").get();
        const orders = [];
        
        // 2. Fetch all technicians for mapping names and bank details
        const techsSnapshot = await db.collection("technicians").get();
        const techsMap = {};
        techsSnapshot.forEach(doc => {
            const data = doc.data();
            techsMap[doc.id] = {
                name: data.name || "Unknown Technician",
                bankName: data.bankName || "",
                bankAccount: data.bankAccount || ""
            };
        });

        ordersSnapshot.forEach(doc => {
            const data = doc.data();
            const techInfo = techsMap[data.technicianId] || { name: "Unknown Technician", bankName: "", bankAccount: "" };
            orders.push({
                id: doc.id,
                ...data,
                technicianName: techInfo.name,
                bankName: techInfo.bankName,
                bankAccount: techInfo.bankAccount
            });
        });
        
        res.json(orders);
    } catch (err) {
        console.error("Error fetching admin orders:", err);
        res.status(500).json({ error: err.message });
    }
});

// RELEASE ESCROW TO TECHNICIAN
app.post("/api/admin/orders/release-escrow", async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) return res.status(400).json({ error: "Missing orderId" });

        console.log(`Releasing escrow for order: ${orderId}`);
        await db.collection("orders").doc(orderId).update({
            escrowStatus: "released"
        });

        res.json({ success: true, message: "Dana berhasil dicairkan ke teknisi!" });
    } catch (err) {
        console.error("Error releasing escrow:", err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
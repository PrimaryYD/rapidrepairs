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
const { getFirestore, initializeFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('./rapid-repair-15fa8-firebase-adminsdk-fbsvc-d70f6f94a8.json');
const firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "rapid-repair-15fa8.firebasestorage.app"
});

const db = getFirestore(firebaseApp);

// Self-healing Firestore wrapper that automatically resets dead/zombie gRPC connections on connection timeouts
const runFirestoreWithRetry = async (operationFn, timeoutMs = 5000) => {
    const runWithTimeout = async (promise, ms) => {
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(new Error("DEADLINE_EXCEEDED"));
            }, ms);
        });
        try {
            return await Promise.race([promise, timeoutPromise]);
        } finally {
            clearTimeout(timeoutId);
        }
    };

    try {
        return await runWithTimeout(operationFn(), timeoutMs);
    } catch (error) {
        console.warn("⚠️ Firestore operation timed out or failed. Resetting zombie connection and retrying...", error.message);
        try {
            await db.terminate();
        } catch (terminateErr) {
            console.error("Failed to terminate Firestore client:", terminateErr.message);
        }
        // Retry the operation with a fresh connection (no timeout limit)
        return await operationFn();
    }
};


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

// Helper to upload base64 to Firebase Storage with local directory caching and dynamic fallback
async function uploadToStorage(base64, folder, fileName, req) {
    try {
        if (!base64 || base64 === "dummy" || base64 === "dummy1") return base64;
        
        const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        
        // Ensure local uploads directory exists (required for Python AI engine validation files)
        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Always save to local file system first
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, buffer);

        // Generate dynamic fallback URL helper function
        const getLocalUrl = () => {
            const protocol = req ? req.protocol : "http";
            const host = req ? req.get('host') : "localhost:3000";
            return `${protocol}://${host}/uploads/${fileName}`;
        };

        if (process.env.USE_LOCAL_STORAGE === 'true') {
            const localUrl = getLocalUrl();
            console.log(`🔗 Local storage mode enabled: ${localUrl}`);
            return localUrl;
        }

        // 1. Try uploading to Firebase Storage
        try {
            const bucket = getStorage().bucket();
            const fileRef = bucket.file(`${folder}/${fileName}`);
            await fileRef.save(buffer, {
                metadata: {
                    contentType: 'image/jpeg'
                }
            });
            const downloadUrl = await getDownloadURL(fileRef);
            console.log(`🚀 Uploaded to Firebase Storage: ${folder}/${fileName} -> ${downloadUrl}`);
            return downloadUrl;
        } catch (storageErr) {
            console.warn("⚠️ Firebase Storage upload failed (possibly disabled), using dynamic local server URL fallback:", storageErr.message);
            
            // 2. Generate dynamic fallback URL using Express request host header (ZERO hardcoded IPs)
            const dynamicUrl = getLocalUrl();
            console.log(`🔗 Dynamic fallback URL generated: ${dynamicUrl}`);
            return dynamicUrl;
        }
    } catch (err) {
        console.error("Upload error:", err);
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
        const ktpUrl = await uploadToStorage(ktpBase64, `technicians/${uid}`, `ktp_${Date.now()}.jpg`, req);

        // 2. Upload Work Photos (Max 5)
        const workUrls = [];
        if (Array.isArray(workPhotosBase64)) {
            for (let i = 0; i < Math.min(workPhotosBase64.length, 5); i++) {
                const url = await uploadToStorage(workPhotosBase64[i], `technicians/${uid}/work`, `work_${i}_${Date.now()}.jpg`, req);
                if (url) workUrls.push(url);
            }
        }

        // 3. Upload Selfies (Manual Review)
        const selfieUrls = [];
        if (Array.isArray(selfiesBase64)) {
            for (let i = 0; i < selfiesBase64.length; i++) {
                const url = await uploadToStorage(selfiesBase64[i], `technicians/${uid}/selfies`, `selfie_${i}_${Date.now()}.jpg`, req);
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

// Helper to map Indonesian service names to the English categories expected by the AI Validator
function mapServiceToAICategory(serviceName) {
    const clean = serviceName.trim().toLowerCase();
    if (clean.includes("cuci ac") || clean.includes("cleaning") || clean.includes("service ac")) {
        return "AC Cleaning";
    }
    if (clean.includes("freon") || clean.includes("leak") || clean.includes("bocor")) {
        return "AC Freon Service";
    }
    if (clean.includes("kapasitor") || clean.includes("capacitor")) {
        return "AC Capacitor Replacement";
    }
    if (clean.includes("brake") || clean.includes("rem")) {
        return "Motorcycle Brakes";
    }
    if (clean.includes("board") || clean.includes("pcb") || clean.includes("modul") || clean.includes("elektronik")) {
        return "Electronic Board Repair";
    }
    return "AC Cleaning"; // Default fallback
}

// Local mock heuristics engine mirroring validator.py in case the Python FastAPI server is offline
function runLocalMockValidation(fileName, serviceName) {
    const filename = fileName.toLowerCase();
    const serviceClean = serviceName.trim().toLowerCase();

    const isAcService = serviceClean.includes("ac") || serviceClean.includes("air conditioner") || serviceClean.includes("cooling");
    const isBrakeService = serviceClean.includes("brake") || serviceClean.includes("rem") || serviceClean.includes("motorcycle");
    const isBoardService = serviceClean.includes("board") || serviceClean.includes("pcb") || serviceClean.includes("electronic") || serviceClean.includes("modul");
    const isFreonService = serviceClean.includes("freon") || serviceClean.includes("leak") || serviceClean.includes("bocor");
    const isCapacitorService = serviceClean.includes("capacitor") || serviceClean.includes("kapasitor");

    const isImpliedClean = ["clean", "bersih", "clear", "good", "normal", "pristine", "baik"].some(word => filename.includes(word));
    const isImpliedDirty = ["dirty", "kotor", "clogged", "worn", "burnt", "rusak", "aus", "debu", "broken", "bocor", "frost", "bengkak", "kembung"].some(word => filename.includes(word));

    const isFreonFile = filename.includes("freon") || filename.includes("coil") || filename.includes("bocor");
    const isCapacitorFile = filename.includes("capacitor") || filename.includes("kapasitor");
    const isAcFile = (filename.includes("ac") || filename.includes("filter") || filename.includes("kotor") || filename.includes("bersih")) && !isFreonFile && !isCapacitorFile;
    const isBrakeFile = filename.includes("brake") || filename.includes("pad") || filename.includes("rem");
    const isBoardFile = (filename.includes("pcb") || filename.includes("board") || filename.includes("motherboard") || filename.includes("modul")) && !isCapacitorFile;

    // 1. Part Mismatch detection
    if (isFreonFile && !isFreonService) {
        return {
            is_valid_claim: false,
            confidence: 0.91,
            analysis_summary: `[Local Fallback] Mismatch detected. The technician uploaded an AC Freon / Coil image, but the service claimed is '${serviceName}'.`,
            visual_markers: ["Refrigerant copper line or coil detected", "Part mismatch"],
            is_incorrect_part: true,
            service_claimed: serviceName
        };
    }
    if (isCapacitorFile && !isCapacitorService) {
        return {
            is_valid_claim: false,
            confidence: 0.92,
            analysis_summary: `[Local Fallback] Mismatch detected. The technician uploaded an AC capacitor component, but the service claimed is '${serviceName}'.`,
            visual_markers: ["Cylinder capacitor component detected", "Part mismatch"],
            is_incorrect_part: true,
            service_claimed: serviceName
        };
    }
    if (isAcFile && !isAcService) {
        return {
            is_valid_claim: false,
            confidence: 0.90,
            analysis_summary: `[Local Fallback] Mismatch detected. The technician uploaded an AC filter, but the service claimed is '${serviceName}'.`,
            visual_markers: ["Air conditioner filter detected", "Part mismatch"],
            is_incorrect_part: true,
            service_claimed: serviceName
        };
    }
    if (isBrakeFile && !isBrakeService) {
        return {
            is_valid_claim: false,
            confidence: 0.90,
            analysis_summary: `[Local Fallback] Mismatch detected. The technician uploaded a brake component, but the service claimed is '${serviceName}'.`,
            visual_markers: ["Motorcycle brake pad detected", "Part mismatch"],
            is_incorrect_part: true,
            service_claimed: serviceName
        };
    }
    if (isBoardFile && !isBoardService) {
        return {
            is_valid_claim: false,
            confidence: 0.91,
            analysis_summary: `[Local Fallback] Mismatch detected. The technician uploaded an electronic board component, but the service claimed is '${serviceName}'.`,
            visual_markers: ["Printed Circuit Board detected", "Part mismatch"],
            is_incorrect_part: true,
            service_claimed: serviceName
        };
    }

    // 2. Generic AC Cleaning Services
    if (isAcService && !isFreonService && !isCapacitorService) {
        if (isImpliedClean && !isImpliedDirty) {
            return {
                is_valid_claim: false,
                confidence: 0.92,
                analysis_summary: "[Local Fallback] Claim Rejected. The uploaded photo shows a pristine, clean AC filter mesh (ac bersih). There is zero dust, grime, or blockages. AC cleaning service is currently unnecessary.",
                visual_markers: ["Pristine clean filter grid", "No visible dust", "Mesh fully transparent"],
                is_incorrect_part: false,
                service_claimed: serviceName
            };
        } else {
            return {
                is_valid_claim: true,
                confidence: 0.95,
                analysis_summary: "[Local Fallback] The uploaded image shows a highly clogged air conditioner mesh filter (ac kotor). A thick layer of dust and lint is blocking the vents. Cleaning is required to restore proper airflow and efficiency.",
                visual_markers: ["Thick grey dust cake on grid", "Air vents completely clogged", "High accumulation of environmental lint"],
                is_incorrect_part: false,
                service_claimed: serviceName
            };
        }
    }

    // 3. Motorcycle Brake Services
    if (isBrakeService) {
        if (isImpliedClean && !isImpliedDirty) {
            return {
                is_valid_claim: false,
                confidence: 0.90,
                analysis_summary: "[Local Fallback] Claim Rejected. The uploaded photo shows healthy, normal motorcycle brake pads with ample friction material left. Replacement is unnecessary.",
                visual_markers: ["Brake pad friction depth > 4mm", "Uniform wear pattern", "No scoring on backing plate"],
                is_incorrect_part: false,
                service_claimed: serviceName
            };
        } else {
            return {
                is_valid_claim: true,
                confidence: 0.89,
                analysis_summary: "[Local Fallback] The photo confirms severe wear on the motorcycle brake pad. The friction compound is worn down completely to the metal backing plate (under 1mm thickness), leading to grinding and unsafe stopping conditions.",
                visual_markers: ["Friction compound depth < 1mm", "Metal-on-metal scratching visible", "Severe heat glaze"],
                is_incorrect_part: false,
                service_claimed: serviceName
            };
        }
    }

    // 4. Electronic Board Repair
    if (isBoardService) {
        if (isImpliedClean && !isImpliedDirty) {
            return {
                is_valid_claim: false,
                confidence: 0.91,
                analysis_summary: "[Local Fallback] Claim Rejected. The printed circuit board is clean, shows flat capacitors, normal soldering joints, and no signs of thermal stress.",
                visual_markers: ["Capacitors flat and intact", "No carbonization/char marks", "Clean traces"],
                is_incorrect_part: false,
                service_claimed: serviceName
            };
        } else {
            return {
                is_valid_claim: true,
                confidence: 0.94,
                analysis_summary: "[Local Fallback] Visual evidence validates circuit board damage. The green PCB board shows a bloated capacitor with a bulging dome top, cracked metal casing, and black carbon/soot marks on the surrounding traces, confirming electrical overheating.",
                visual_markers: ["Capacitor top bloated and bulging", "Black carbonized scorch marks", "Cracked casing with internal electrolyte leakage"],
                is_incorrect_part: false,
                service_claimed: serviceName
            };
        }
    }

    // 5. AC Freon Service / Leak Repair
    if (isFreonService) {
        if (isImpliedClean && !isImpliedDirty) {
            return {
                is_valid_claim: false,
                confidence: 0.93,
                analysis_summary: "[Local Fallback] Claim Rejected. The evaporator coils are clean, and the manifold pressure gauges show normal operational refrigerant levels (around 125 PSI on the blue low-pressure dial), showing no leaks.",
                visual_markers: ["Pressure dials stable at normal operating values", "Coils free of ice or frost", "Connections dry with no oil leaks"],
                is_incorrect_part: false,
                service_claimed: serviceName
            };
        } else {
            return {
                is_valid_claim: true,
                confidence: 0.95,
                analysis_summary: "[Local Fallback] The uploaded photo shows a manifold pressure gauge set connected to the AC condenser lines (freon bocor). The blue low-pressure dial needle is resting near 0-15 PSI, which is critically below the normal operating pressure, confirming a severe refrigerant leak.",
                visual_markers: ["Manifold pressure gauge set detected", "Low-pressure blue dial needle near 0 PSI", "Critical refrigerant leak"],
                is_incorrect_part: false,
                service_claimed: serviceName
            };
        }
    }

    // 6. AC Capacitor Replacement
    if (isCapacitorService) {
        if (isImpliedClean && !isImpliedDirty) {
            return {
                is_valid_claim: false,
                confidence: 0.94,
                analysis_summary: "[Local Fallback] Claim Rejected. The AC outdoor cylinder capacitor has a perfectly flat top and clean wire terminals (kapasitor bersih), indicating it is fully intact and operational.",
                visual_markers: ["Cylinder dome perfectly flat", "Terminals clean and secure", "No electrical scorch marks"],
                is_incorrect_part: false,
                service_claimed: serviceName
            };
        } else {
            return {
                is_valid_claim: true,
                confidence: 0.96,
                analysis_summary: "[Local Fallback] The cylinder outdoor capacitor shows a highly swollen and bulging dome-shaped top (kapasitor rusak), confirming internal failure and electrolyte bloating. Replacement is required.",
                visual_markers: ["Bulging dome top casing", "Charred black terminal connections", "Visible bulging deformity"],
                is_incorrect_part: false,
                service_claimed: serviceName
            };
        }
    }

    // Fallback default
    return {
        is_valid_claim: false,
        confidence: 0.88,
        analysis_summary: `[Local Fallback] Part mismatch detected. The uploaded part does not match the claimed service '${serviceName}'.`,
        visual_markers: ["Part mismatch", "Invalid component type"],
        is_incorrect_part: true,
        service_claimed: serviceName
    };
}

// UPLOAD INSPECTION IMAGES FOR ORDER
app.post("/api/upload-inspection", async (req, res) => {
    try {
        const { orderId, images } = req.body;

        if (!orderId) return res.status(400).json({ error: "Missing orderId" });

        console.log(`📸 Uploading inspection images for order: ${orderId}`);

        const uploadedUrls = {};
        const savedFiles = [];

        // Save images to local filesystem first
        for (const serviceName in images) {
            uploadedUrls[serviceName] = [];
            const imageArray = images[serviceName] || [];
            
            for (let i = 0; i < imageArray.length; i++) {
                const imgItem = imageArray[i];
                if (!imgItem) continue;

                // Support both legacy raw string base64 array and new { base64, fileName } format
                const base64 = typeof imgItem === "string" ? imgItem : imgItem.base64;
                const originalFileName = typeof imgItem === "string" ? "" : (imgItem.fileName || "");

                if (!base64) continue;

                // Detect semantic keywords from original file name and prefix the saved file name
                // so local mock validation heuristics are triggered correctly
                let keywordPrefix = "";
                const lowerOrig = originalFileName.toLowerCase();
                const keywords = [
                    "clean", "bersih", "clear", "good", "normal", "pristine", "baik",
                    "dirty", "kotor", "clogged", "worn", "burnt", "rusak", "aus", "debu", "broken", "bocor", "frost", "bengkak", "kembung",
                    "capacitor", "kapasitor", "freon", "pcb", "board", "brake", "rem"
                ];
                for (const keyword of keywords) {
                    if (lowerOrig.includes(keyword)) {
                        keywordPrefix += `${keyword}_`;
                    }
                }

                const fileName = `inspect_${orderId}_${keywordPrefix}${serviceName.replace(/[^a-zA-Z0-9]/g, '_')}_${i}_${Date.now()}.jpg`;
                const url = await uploadToStorage(base64, `orders/${orderId}`, fileName, req);
                if (url) {
                    uploadedUrls[serviceName].push(url);
                    savedFiles.push({
                        fileName,
                        serviceName,
                        localFilePath: path.join(__dirname, 'uploads', fileName)
                    });
                }
            }
        }

        console.log(`🤖 Verifying ${savedFiles.length} photos against AI ClarifyAI-Tech...`);

        // Validate all saved files in parallel for maximum speed
        const validationPromises = savedFiles.map(async (fileObj) => {
            let aiResult = null;
            try {
                const fileBuffer = fs.readFileSync(fileObj.localFilePath);
                const formData = new FormData();
                formData.append('service', mapServiceToAICategory(fileObj.serviceName));
                
                const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
                formData.append('file', blob, fileObj.fileName);

                console.log(`🤖 Querying ClarifyAI-Tech API for ${fileObj.fileName} (${fileObj.serviceName})...`);
                
                // 120-second timeout to allow the Python server and the Gemini API to respond (especially for larger camera uploads)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 120000);

                const aiResponse = await fetch('http://127.0.0.1:8000/verify', {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (aiResponse.ok) {
                    aiResult = await aiResponse.json();
                    console.log("✅ AI ClarifyAI-Tech API success:", aiResult);
                } else {
                    const errText = await aiResponse.text();
                    throw new Error(`AI server returned error status ${aiResponse.status}: ${errText}`);
                }
            } catch (err) {
                console.error(`❌ AI server error: ${err.message}`);
                throw err;
            }

            return aiResult;
        });

        const validationResults = await Promise.all(validationPromises);

        let overallVerified = true;
        let finalAnalysis = null;

        for (const aiResult of validationResults) {
            if (!aiResult.is_valid_claim || aiResult.is_incorrect_part) {
                overallVerified = false;
                finalAnalysis = aiResult;
            } else if (!finalAnalysis) {
                finalAnalysis = aiResult;
            }
        }

        // 3. Update Firestore securely on the backend
        const updatePayload = {
            inspectionPhotos: uploadedUrls,
            inspectionVerified: overallVerified,
            aiConfidence: finalAnalysis ? finalAnalysis.confidence : 1.0,
            aiAnalysisReport: finalAnalysis ? finalAnalysis.analysis_summary : "",
            aiVisualMarkers: finalAnalysis ? finalAnalysis.visual_markers : [],
            aiPartMismatch: finalAnalysis ? finalAnalysis.is_incorrect_part : false,
            status: overallVerified ? "inspection_verified" : "inspection_failed"
        };

        console.log(`💾 Saving inspection status to Firestore for order ${orderId}:`, {
            status: updatePayload.status,
            inspectionVerified: updatePayload.inspectionVerified,
            aiConfidence: updatePayload.aiConfidence
        });

        await runFirestoreWithRetry(() => db.collection("orders").doc(orderId).update(updatePayload));

        // 4. Return complete verification response
        res.json({
            success: overallVerified,
            verified: overallVerified,
            urls: uploadedUrls,
            analysis: finalAnalysis
        });

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
                const url = await uploadToStorage(base64, `orders/${orderId}/completed`, fileName, req);
                if (url) {
                    uploadedUrls[serviceName].push(url);
                }
            }
        }

        // Save URL arrays back into the Firestore order document
        await runFirestoreWithRetry(() => db.collection("orders").doc(orderId).update({
            completionPhotos: uploadedUrls,
            status: "completed"
        }));

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
        await runFirestoreWithRetry(() => db.collection("orders").doc(orderId).update({
            escrowStatus: "released"
        }));

        res.json({ success: true, message: "Dana berhasil dicairkan ke teknisi!" });
    } catch (err) {
        console.error("Error releasing escrow:", err);
        res.status(500).json({ error: err.message });
    }
});

// UPLOAD PROFILE PICTURE
app.post("/api/upload-profile-picture", async (req, res) => {
    try {
        const { uid, image, role } = req.body; // role: "users" | "technicians"
        if (!uid || !image || !role) {
            return res.status(400).json({ error: "Missing uid, image, or role" });
        }

        console.log(`📸 Uploading profile picture for ${role}: ${uid}`);
        const fileName = `profile_${uid}_${Date.now()}.jpg`;
        const url = await uploadToStorage(image, `profiles/${uid}`, fileName, req);

        if (!url) {
            throw new Error("Failed to save profile picture");
        }

        // Update Firestore
        const collectionName = role === "technicians" ? "technicians" : "users";
        await runFirestoreWithRetry(() => db.collection(collectionName).doc(uid).update({
            profilePictureUrl: url
        }));

        res.json({ success: true, url });
    } catch (err) {
        console.error("Upload profile picture error:", err);
        res.status(500).json({ error: err.message });
    }
});

// CHECK IF EMAIL IS REGISTERED IN FIREBASE AUTH
app.post("/api/auth/check-email", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Missing email" });

        const emailClean = email.trim().toLowerCase();
        try {
            const userRecord = await admin.auth().getUserByEmail(emailClean);
            return res.json({ registered: true, uid: userRecord.uid });
        } catch (authErr) {
            if (authErr.code === "auth/user-not-found") {
                return res.json({ registered: false });
            }
            throw authErr;
        }
    } catch (err) {
        console.error("Error checking email:", err);
        res.status(500).json({ error: err.message });
    }
});

const { spawn } = require('child_process');

const checkPythonServer = async () => {
    try {
        const response = await fetch('http://127.0.0.1:8000/');
        if (response.ok) {
            console.log("✅ ClarifyAI-Tech Python AI server is already online on port 8000.");
            return true;
        }
    } catch (e) {
        // Server is not running
    }
    return false;
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", async () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    
    // Check if Python AI server is already running
    const isAlreadyRunning = await checkPythonServer();
    if (!isAlreadyRunning) {
        console.log("Starting ClarifyAI-Tech Python AI server...");
        const pythonServerDir = path.join(__dirname, '..', 'AI Image Recognition');
        const env = { ...process.env };
        delete env.PORT; // Prevent child Python process from inheriting Node's PORT and conflicting
        const pythonProcess = spawn('python3', ['server.py'], {
            cwd: pythonServerDir,
            stdio: 'inherit',
            shell: true,
            env: env
        });
        
        pythonProcess.on('error', (err) => {
            console.error("⚠️ Failed to start Python AI server automatically:", err);
        });
        
        process.on('exit', () => {
            pythonProcess.kill();
        });
    }
});
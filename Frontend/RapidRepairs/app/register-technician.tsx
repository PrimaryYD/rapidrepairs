import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Platform, Switch, Image, Modal, KeyboardAvoidingView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, storage } from "./_firebaseConfig"; // adjust path if needed
import { ref, uploadBytes, uploadString, getDownloadURL } from "firebase/storage";
import { ActivityIndicator } from "react-native";
import { Theme } from "../constants/theme";
import { useCustomAlert } from "../components/ui/GlobalAlertProvider";
import AnimatedButton from "../components/ui/AnimatedButton";
import { useEffect } from "react";
import { BASE_URL } from "../api";
import { setTempData, getTempData, clearTempData } from "../utils/tempStorage";


type ImageType = {
    uri: string;
    base64: string;
};


export default function RegisterTechnician() {
    const router = useRouter();

    const params = useLocalSearchParams();
    const [step, setStep] = useState(params.step ? parseInt(params.step as string) : 1);
    const { showAlert } = useCustomAlert();

    // === Step 1 ===
    const [name, setName] = useState((params.name as string) || "");
    const [email, setEmail] = useState((params.email as string) || "");
    const [phone, setPhone] = useState((params.phone as string) || "");
    const [location, setLocation] = useState((params.location as string) || "");
    const [specialization, setSpecialization] = useState((params.origSpecialization as string) || (params.specialization as string) || "");
    const [experience, setExperience] = useState((params.experience as string) || "");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (params.name && !params.recovering) return; 
            const user = auth.currentUser;
            if (user) {
                if (!params.recovering) setEmail(user.email || "");
                
                // Try to get name from Firestore "users" collection
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        if (!params.recovering) {
                            setName(data.name || user.displayName || "");
                            setLocation(data.location || "");
                        }
                    } else {
                        if (!params.recovering) setName(user.displayName || "");
                    }
                } catch (err) {
                    console.log("Error fetching user data:", err);
                    if (!params.recovering) setName(user.displayName || "");
                }
            } else {
                showAlert({ title: "Sesi Berakhir", message: "Silahkan login terlebih dahulu.", type: "warning" });
                router.replace("/login");
            }
        };

        fetchUserData();
    }, []);

    // Recovery from params or tempStorage (when coming back from face-verification)
    useEffect(() => {
        console.log("🔄 [RegisterTechnician] Recovery Effect Triggered. Params:", params);
        
        // Check tempStorage first (preferred for large data)
        const tempKtp = getTempData("ktpImage");
        if (tempKtp) {
            console.log("✅ Recovered KTP from tempStorage");
            setKtpImage(tempKtp);
        }

        const tempWork = getTempData("workImages");
        if (tempWork) {
            console.log("✅ Recovered Work Images from tempStorage:", tempWork.length);
            setWorkImages(tempWork);
        }

        const tempSelfies = getTempData("selfies");
        if (tempSelfies) {
            console.log("✅ Recovered Selfies from tempStorage:", tempSelfies.length);
            setSelfies(tempSelfies);
        }

        // Fallback to params (backwards compatibility or small data)
        if (params.ktpUri && params.ktpBase64 && !tempKtp) {
            console.log("⚠️ Falling back to params for KTP");
            setKtpImage({ uri: params.ktpUri as string, base64: params.ktpBase64 as string });
        }
    }, [params]); // Depend on all params to ensure it runs on every update/return


    const [isSpecializationOpen, setIsSpecializationOpen] = useState(false);

    // === Step 2 ===
    const [hasEquipment, setHasEquipment] = useState(true);
    const [vehicle, setVehicle] = useState("Motor");
    const [ktpImage, setKtpImage] = useState<ImageType | null>(null);
    const [ktpRatio, setKtpRatio] = useState(1);
    
    // 🔥 MULTIPLE WORK IMAGES (MAX 5)
    const [workImages, setWorkImages] = useState<ImageType[]>([]);
    const [selfies, setSelfies] = useState<string[]>(params.selfies ? JSON.parse(params.selfies as string) : []);

    const [sopChecked, setSopChecked] = useState(false);
    const [showSopModal, setShowSopModal] = useState(false);
    const [sopModalChecked, setSopModalChecked] = useState(false);

    // === Step 3 ===
    const [selectedSkills, setSelectedSkills] = useState<string[]>(["Cuci AC", "Isi Freon", "Bongkar Pasang"]);
    const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
    const [employmentStatus, setEmploymentStatus] = useState("Freelance");
    const [otherEmploymentStatus, setOtherEmploymentStatus] = useState("");
    const [bankName, setBankName] = useState("");
    const [bankAccount, setBankAccount] = useState("");
    const [termsChecked, setTermsChecked] = useState(false);


    const SPECIALIZATIONS = [
        "AC (Air Conditioner)",
        "Kulkas / Lemari Es",
        "Mesin Cuci",
        "Kelistrikan Umum",
        "Furniture"
    ];

    const SKILLS_MAP: any = {
        "AC (Air Conditioner)": ["Cuci AC", "Isi Freon", "Bongkar Pasang", "Service Besar"],
        "Kulkas / Lemari Es": ["Isi Freon", "Ganti Kompresor", "Perbaikan Modul"],
        "Mesin Cuci": ["Ganti Dinamo", "Perbaikan Modul", "Pembersihan Tabung"],
    };

    const SKILL_DESCRIPTIONS: any = {
        "Cuci AC": "Pembersihan unit indoor dan outdoor untuk menjaga AC tetap dingin dan bersih.",
        "Isi Freon": "Penambahan freon agar pendinginan kembali maksimal.",
        "Bongkar Pasang": "Pemindahan atau pemasangan unit baru sesuai standar keamanan.",
        "Service Besar": "Pemeriksaan dan perbaikan menyeluruh pada semua komponen.",
        "Ganti Kompresor": "Penggantian kompresor yang rusak dengan yang baru.",
        "Perbaikan Modul": "Pengecekan dan perbaikan pada papan sirkuit elektronik utama.",
        "Ganti Dinamo": "Penggantian motor dinamo penggerak utama pada mesin cuci.",
        "Pembersihan Tabung": "Pembersihan kerak, kotoran, dan jamur pada tabung mesin cuci."
    };

    const pickImage = async (setImage: any, setRatio?: any) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showAlert({ title: "Izin Ditolak", message: "Akses galeri diperlukan untuk memilih foto.", type: "error" });
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.5, 
            base64: true, 
        });

        if (!result.canceled) {
            const asset = result.assets[0];

            const imageData = {
                uri: asset.uri,
                base64: asset.base64,
            };

            // 👉 SET IMAGE PROPERLY
            setImage(imageData);

            // 👉 SET RATIO (optional)
            if (setRatio && asset.width && asset.height) {
                setRatio(asset.width / asset.height);
            }

            console.log("PICKED IMAGE:", imageData);
        }
    };



    const handleNext = () => {
        if (step === 1) {
            if (!name || !phone || !location || !specialization || !experience) {
                showAlert({ title: "Informasi", message: "Harap lengkapi semua data di langkah 1", type: "warning" });
                return;
            }
            
            // Map specialization string to test category
            let testCategory = "AC";
            if (specialization.includes("Kulkas")) testCategory = "Kulkas";
            else if (specialization.includes("Mesin Cuci")) testCategory = "Mesin Cuci";
            else if (specialization.includes("Kelistrikan")) testCategory = "Kelistrikan Umum";
            else if (specialization.includes("Furniture")) testCategory = "Furniture";

            // Navigate to competency test
            router.push({
                pathname: "/test-competency",
                params: {
                    specialization: testCategory,
                    name,
                    email,
                    phone,
                    location,
                    origSpecialization: specialization,
                    experience,
                    testScore: params.testScore || ""
                }
            });
        } else if (step === 2) {
            if (!ktpImage || workImages.length === 0) {
                showAlert({ title: "Informasi", message: "Harap upload foto KTP dan minimal 1 bukti kerja", type: "warning" });
                return;
            }

            if (!sopChecked) {
                showAlert({ title: "Informasi", message: "Anda harus menyetujui SOP Rapid Repairs untuk melanjutkan", type: "warning" });
                return;
            }

            // 🔥 FACE CAPTURE STEP
            if (params.faceVerified !== "true") {
                setLoading(true);

                // 🔥 Save large data to tempStorage to avoid URL length limits
                setTempData("ktpImage", ktpImage);
                setTempData("workImages", workImages);

                router.push({
                    pathname: "/face-verification",
                    params: {
                        ...params,
                        recovering: "true",
                        // ktpUri: ktpImage.uri, // Moved to tempStorage
                        // ktpBase64: ktpImage.base64, // Moved to tempStorage
                        // workImagesJson: JSON.stringify(workImages), // Moved to tempStorage
                        name,
                        email,
                        phone,
                        location,
                        specialization,
                        experience,
                        hasEquipment: hasEquipment ? "true" : "false",
                        vehicle,
                        sopChecked: "true"
                    }
                });
                return;
            }

            
            setStep(3);
        } else {
            if (!termsChecked) {
                showAlert({ title: "Informasi", message: "Anda harus menyetujui pernyataan keaslian data", type: "warning" });
                return;
            }
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        const user = auth.currentUser;
        if (!user) {
            showAlert({ title: "Informasi", message: "Sesi berakhir, silahkan login kembali", type: "warning" });
            router.replace("/login");
            return;
        }

        if (!ktpImage || workImages.length === 0) {
            showAlert({ title: "Informasi", message: "Upload KTP dan bukti kerja dulu", type: "warning" });
            return;
        }


        setLoading(true);

        try {
            console.log("=== START SUBMIT (OFFLOAD TO BACKEND) ===");
            console.log("Attempting technician registration via:", `${BASE_URL}/technician/register`);
            
            const payload = {
                uid: user.uid,
                name,
                email,
                phone,
                location,
                specialization,
                experience,
                hasEquipment,
                vehicle,
                selectedSkills,
                employmentStatus: employmentStatus === "Lainnya"
                    ? otherEmploymentStatus
                    : employmentStatus,
                bankName,
                bankAccount,
                ktpBase64: ktpImage?.base64,
                workPhotosBase64: workImages.map(img => img.base64),
                selfiesBase64: selfies,
                testScore: params.testScore ? parseInt(params.testScore as string) : 0,
                testAnswers: params.testAnswersJson ? JSON.parse(params.testAnswersJson as string) : []
            };

            console.log("Payload summary:", {
                uid: payload.uid,
                hasKtpBase64: !!payload.ktpBase64,
                ktpBase64Length: payload.ktpBase64?.length || 0,
                workPhotosCount: payload.workPhotosBase64.length,
                selfiesCount: payload.selfiesBase64.length
            });

            const response = await fetch(`${BASE_URL}/technician/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "bypass-tunnel-reminder": "true",
                    "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify(payload),
            });

            let result: any = {};
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                result = await response.json();
            } else {
                const text = await response.text();
                if (text.includes("502") || text.includes("Bad Gateway") || text.includes("tunnel")) {
                    throw new Error("Backend server tidak merespon (502 Bad Gateway). Pastikan localtunnel / server backend Anda sudah berjalan.");
                }
                throw new Error(text.substring(0, 150) || `HTTP Error ${response.status}`);
            }

            if (!response.ok) {
                throw new Error(result.error || "Gagal mendaftar ke server");
            }

            console.log("✅ SUCCESS:", result.message);
            
            // Clear temp storage on success
            clearTempData("ktpImage");
            clearTempData("workImages");
            clearTempData("selfies");

            router.replace("/registration-success" as any);

        } catch (error: any) {
            console.error("❌ ERROR REGISTER:", error);
            let errorMsg = error.message;
            if (error.message === "Network request failed") {
                errorMsg = "Gagal terhubung ke server. Pastikan IP di api.js sudah benar, server sudah jalan, dan localtunnel aktif.";
            } else if (error.message && error.message.includes("JSON Parse error")) {
                errorMsg = "Gagal memproses respon server. Pastikan localtunnel / server backend Anda sudah aktif.";
            }
            showAlert({ title: "Gagal Mendaftar", message: errorMsg, type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const renderProgress = () => {
        let percentage = "33%";
        let fillWidth = "33%";
        if (step === 2) {
            percentage = "66%";
            fillWidth = "66%";
        } else if (step === 3) {
            percentage = "100%";
            fillWidth = "100%";
        }

        return (
            <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                    <Text style={styles.progressText}>Langkah {step} dari 3</Text>
                    <Text style={styles.progressPercent}>{percentage}</Text>
                </View>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: fillWidth as any }]} />
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
        <SafeAreaView style={styles.container}>
            {/* HDR */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Daftar Mitra Teknisi</Text>
            </View>

            {renderProgress()}
            
            {/* Loading Overlay */}
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#B3875E" />
                    <Text style={styles.loadingText}>Mohon tunggu...</Text>
                </View>
            )}

            {/* BODY */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ================= STEP 1 ================= */}
                {step === 1 && (
                    <View style={styles.stepContainer}>
                        <Text style={styles.label}>Nama Lengkap sesuai KTP</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Contoh: Budi Santoso"
                            placeholderTextColor={Theme.colors.textMuted}
                            value={name}
                            onChangeText={setName}
                        />

                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: "#F0F0F0" }]}
                            value={email}
                            editable={false}
                        />

                        <Text style={styles.label}>Nomor WhatsApp Aktif</Text>
                        <View style={styles.phoneInputContainer}>
                            <View style={styles.phonePrefix}>
                                <Text style={styles.phonePrefixText}>+62</Text>
                            </View>
                            <TextInput
                                style={styles.phoneInput}
                                placeholder="81234567890"
                                placeholderTextColor={Theme.colors.textMuted}
                                keyboardType="number-pad"
                                value={phone}
                                onChangeText={setPhone}
                            />
                        </View>

                        <Text style={styles.label}>Kota / Area Operasional</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Contoh: Jakarta Selatan"
                            placeholderTextColor={Theme.colors.textMuted}
                            value={location}
                            onChangeText={setLocation}
                        />

                        <Text style={styles.label}>Spesialisasi Utama</Text>
                        <TouchableOpacity
                            style={styles.inputDropdown}
                            onPress={() => setIsSpecializationOpen(!isSpecializationOpen)}
                        >
                            <Text style={specialization ? styles.inputText : styles.placeholderText}>
                                {specialization || "Pilih Spesialisasi"}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#666" />
                        </TouchableOpacity>

                        {isSpecializationOpen && (
                            <View style={styles.dropdownOverlay}>
                                {SPECIALIZATIONS.map(item => (
                                    <TouchableOpacity
                                        key={item}
                                        style={styles.dropdownItem}
                                        onPress={() => {
                                            setSpecialization(item);
                                            setIsSpecializationOpen(false);
                                        }}
                                    >
                                        <Text style={{ color: specialization === item ? "#B3875E" : "#333" }}>{item}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <Text style={styles.label}>Berapa tahun pengalaman Anda?</Text>
                        <View style={styles.expRow}>
                            {["< 1", "1 - 3", "3 - 5", "> 5"].map((exp, index) => (
                                <TouchableOpacity
                                    key={exp}
                                    style={[
                                        styles.expButton,
                                        experience === exp && styles.expButtonActive,
                                        index === 3 && { marginRight: 0 }
                                    ]}
                                    onPress={() => setExperience(exp)}
                                >
                                    <Text style={[styles.expText, experience === exp && styles.expTextActive]}>
                                        {exp}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* ================= STEP 2 ================= */}
                {step === 2 && (
                    <View style={styles.stepContainer}>
                        <Text style={styles.label}>Memiliki peralatan kerja sendiri?</Text>
                        <View style={styles.toggleRow}>
                            <TouchableOpacity
                                style={[styles.toggleBtn, hasEquipment && styles.toggleBtnActive]}
                                onPress={() => setHasEquipment(true)}
                            >
                                <Text style={[styles.toggleText, hasEquipment && styles.toggleTextActive]}>Ya</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toggleBtn, !hasEquipment && styles.toggleBtnActive]}
                                onPress={() => setHasEquipment(false)}
                            >
                                <Text style={[styles.toggleText, !hasEquipment && styles.toggleTextActive]}>Tidak</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Kendaraan operasional?</Text>
                        <View style={styles.toggleRow}>
                            {["Motor", "Mobil", "Tidak Ada"].map(veh => (
                                <TouchableOpacity
                                    key={veh}
                                    style={[styles.toggleBtn, vehicle === veh && styles.toggleBtnActive]}
                                    onPress={() => setVehicle(veh)}
                                >
                                    <Text style={[styles.toggleText, vehicle === veh && styles.toggleTextActive]}>
                                        {veh}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Upload KTP, Selfie, & Bukti Kerja</Text>
                        <View style={styles.uploadContainer}>
                            {/* KTP Upload Box (Full Width) */}
                            <TouchableOpacity style={styles.ktpUploadBox} onPress={() => pickImage(setKtpImage)}>
                                {ktpImage ? (
                                    <Image source={{ uri: ktpImage.uri }} style={styles.uploadedImage} resizeMode="cover" />
                                ) : (
                                    <View style={{ alignItems: 'center' }}>
                                        <Ionicons name="camera-outline" size={28} color="#B3875E" />
                                        <Text style={styles.uploadTitle}>Foto KTP +</Text>
                                        <Text style={styles.uploadSub}>Selfie dengan KTP</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            
                            {/* Horizontal Divider */}
                            <View style={styles.uploadDividerHorizontal} />

                            {/* Bukti Kerja Section (Horizontal ScrollView at the bottom) */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.workScrollView}>
                                <View style={{ flexDirection: 'row' }}>
                                    {/* Render existing images */}
                                    {workImages.map((img, idx) => (
                                        <TouchableOpacity 
                                            key={idx} 
                                            style={styles.workUploadBox}
                                            onPress={() => {
                                                const newImgs = [...workImages];
                                                newImgs.splice(idx, 1);
                                                setWorkImages(newImgs);
                                            }}
                                        >
                                            <Image source={{ uri: img.uri }} style={styles.uploadedImage} resizeMode="cover" />
                                            <View style={styles.deleteBadge}>
                                                <Ionicons name="close" size={12} color="#FFF" />
                                            </View>
                                        </TouchableOpacity>
                                    ))}

                                    {/* Add Button (if < 5) */}
                                    {workImages.length < 5 && (
                                        <TouchableOpacity 
                                            style={styles.workUploadBox} 
                                            onPress={() => pickImage((img: ImageType) => setWorkImages([...workImages, img]))}
                                        >
                                            <View style={{ alignItems: 'center' }}>
                                                <Ionicons name="image-outline" size={28} color="#B3875E" />
                                                <Text style={styles.uploadTitle}>Bukti Kerja +</Text>
                                                <Text style={styles.uploadSub}>({workImages.length}/5 Foto)</Text>
                                            </View>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </ScrollView>
                        </View>
                        <Text style={styles.uploadNote}>
                            Unggah minimal 3 foto bukti kerja untuk menunjukan pengalaman Anda
                        </Text>

                        <TouchableOpacity
                            style={styles.checkboxRow}
                            onPress={() => {
                                if (!sopChecked) {
                                    setShowSopModal(true);
                                } else {
                                    setSopChecked(false);
                                    setSopModalChecked(false);
                                }
                            }}
                        >
                            <View style={[styles.checkbox, sopChecked && styles.checkboxActive]}>
                                {sopChecked && <Ionicons name="checkmark" size={14} color="#FFF" />}
                            </View>
                            <Text style={styles.checkboxText}>Bersedia memenuhi SOP & Harga Rapid Repairs</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ================= STEP 3 ================= */}
                {step === 3 && (
                    <View style={styles.stepContainer}>
                        <Text style={styles.label}>
                            Checklist Keahlian {specialization ? `${specialization}` : ""}
                        </Text>

                        <View style={styles.skillsContainer}>
                            {(SKILLS_MAP[specialization] || SKILLS_MAP["AC (Air Conditioner)"]).map((skill: string) => {
                                const isChecked = selectedSkills.includes(skill);
                                const isExpanded = expandedSkill === skill;
                                return (
                                    <View key={skill} style={[styles.skillItem, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                                        <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <TouchableOpacity
                                                style={[styles.skillLeft, { flex: 1 }]}
                                                onPress={() => {
                                                    if (isChecked) {
                                                        setSelectedSkills(selectedSkills.filter(s => s !== skill));
                                                    } else {
                                                        setSelectedSkills([...selectedSkills, skill]);
                                                    }
                                                }}
                                            >
                                                <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                                                    {isChecked && <Ionicons name="checkmark" size={14} color="#FFF" />}
                                                </View>
                                                <Text style={styles.skillText}>{skill}</Text>
                                            </TouchableOpacity>
                                            
                                            <TouchableOpacity 
                                                onPress={() => setExpandedSkill(isExpanded ? null : skill)}
                                                style={{ padding: 4 }}
                                            >
                                                <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#CCC" />
                                            </TouchableOpacity>
                                        </View>
                                        
                                        {isExpanded && SKILL_DESCRIPTIONS[skill] && (
                                            <Text style={{ 
                                                marginTop: 8, 
                                                marginLeft: 32, // align with text, bypassing checkbox
                                                color: Theme.colors.textMuted, 
                                                fontSize: 13,
                                                lineHeight: 18
                                            }}>
                                                {SKILL_DESCRIPTIONS[skill]}
                                            </Text>
                                        )}
                                    </View>
                                );
                            })}
                        </View>

                        <Text style={styles.label}>Status Pekerjaan</Text>
                        <View style={styles.toggleRow}>
                            {["Freelance", "Tetap (full-time)", "Lainnya"].map(status => (
                                <TouchableOpacity
                                    key={status}
                                    style={[styles.dropdownBtn, employmentStatus === status && styles.dropdownBtnActive]}
                                    onPress={() => setEmploymentStatus(status)}
                                >
                                    <Text style={[styles.dropdownBtnText, employmentStatus === status && styles.dropdownBtnTextActive, { textAlign: 'center', width: '100%' }]}>
                                        {status}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {employmentStatus === "Lainnya" && (
                            <TextInput
                                style={[styles.input, { marginTop: 10 }]}
                                placeholder="Sebutkan status pekerjaan Anda"
                                placeholderTextColor={Theme.colors.textMuted}
                                value={otherEmploymentStatus}
                                onChangeText={setOtherEmploymentStatus}
                            />
                        )}

                        <Text style={[styles.label, { marginTop: 10 }]}>Data Bank (Opsional)</Text>
                        <View style={styles.bankContainer}>
                            <TextInput
                                style={styles.bankInputTop}
                                placeholder="Nama Bank"
                                placeholderTextColor={Theme.colors.textMuted}
                                value={bankName}
                                onChangeText={setBankName}
                            />
                            <View style={styles.divider} />
                            <TextInput
                                style={styles.bankInputBottom}
                                placeholder="Nomor Rekening"
                                placeholderTextColor={Theme.colors.textMuted}
                                keyboardType="number-pad"
                                value={bankAccount}
                                onChangeText={setBankAccount}
                            />
                        </View>

                        <TouchableOpacity style={styles.checkboxRow} onPress={() => setTermsChecked(!termsChecked)}>
                            <View style={[styles.checkbox, termsChecked && styles.checkboxActive]}>
                                {termsChecked && <Ionicons name="checkmark" size={14} color="#FFF" />}
                            </View>
                            <Text style={[styles.checkboxText, { flex: 1, lineHeight: 20 }]}>
                                Data dan dokumen yang saya lampirkan adalah asli dan bersedia diverifikasi oleh Rapid Repairs
                            </Text>
                        </TouchableOpacity>

                    </View>
                )}
            </ScrollView>

            {/* BOTTOM BAR WITH BUTTON */}
            <View style={styles.bottomBar}>
                <AnimatedButton 
                    title={step === 3 ? "Kirim Pendaftaran" : `Lanjut ke Langkah ${step + 1}`}
                    onPress={handleNext}
                    isLoading={loading}
                    disabled={loading}
                    style={{ width: '100%' }}
                />
            </View>

            {/* SOP MODAL */}
            <Modal
                visible={showSopModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSopModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalDragHandle} />
                            <Text style={styles.modalTitle}>SOP & Tata Tertib Teknisi</Text>
                            <TouchableOpacity 
                                style={styles.modalCloseBtn}
                                onPress={() => setShowSopModal(false)}
                            >
                                <Ionicons name="close" size={20} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                            <View style={styles.sopItem}>
                                <View style={styles.sopNumberContainer}>
                                    <Text style={styles.sopNumber}>1</Text>
                                </View>
                                <View style={styles.sopTextContainer}>
                                    <Text style={styles.sopPointTitle}>Ketepatan Waktu</Text>
                                    <Text style={styles.sopPointDesc}>
                                        Teknisi wajib tiba di lokasi pelanggan sesuai dengan jadwal yang telah disepakati atau menginformasikan jika ada keterlambatan.
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.sopItem}>
                                <View style={styles.sopNumberContainer}>
                                    <Text style={styles.sopNumber}>2</Text>
                                </View>
                                <View style={styles.sopTextContainer}>
                                    <Text style={styles.sopPointTitle}>Transparansi Harga</Text>
                                    <Text style={styles.sopPointDesc}>
                                        Tidak diperkenankan meminta biaya tambahan di luar dari yang tertera pada aplikasi tanpa persetujuan dari sistem dan pelanggan.
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.sopItem}>
                                <View style={styles.sopNumberContainer}>
                                    <Text style={styles.sopNumber}>3</Text>
                                </View>
                                <View style={styles.sopTextContainer}>
                                    <Text style={styles.sopPointTitle}>Kebersihan Area Kerja</Text>
                                    <Text style={styles.sopPointDesc}>
                                        Teknisi harus menjaga kebersihan sebelum, selama, dan sesudah perbaikan dilakukan di lokasi pelanggan.
                                    </Text>
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity 
                                style={styles.modalCheckboxContainer}
                                onPress={() => setSopModalChecked(!sopModalChecked)}
                            >
                                <View style={[styles.checkbox, sopModalChecked && styles.checkboxActive]}>
                                    {sopModalChecked && <Ionicons name="checkmark" size={14} color="#FFF" />}
                                </View>
                                <Text style={styles.modalCheckboxText}>
                                    Saya telah membaca dan setuju mematuhi seluruh SOP Rapid Repairs
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.modalActionBtn, !sopModalChecked && styles.modalActionBtnDisabled]}
                                disabled={!sopModalChecked}
                                onPress={() => {
                                    setSopChecked(true);
                                    setShowSopModal(false);
                                }}
                            >
                                <Text style={styles.modalActionBtnText}>Setuju & Lanjutkan</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255,255,255,0.9)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        fontWeight: "600",
        color: Theme.colors.primary,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 15,
    },
    uploadedImage: {
        width: "100%",
        height: "100%",
        borderRadius: 12,
    },
    deleteBadge: {
        position: "absolute",
        top: -5,
        right: -5,
        backgroundColor: "#FF3B30",
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#FFF",
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Theme.colors.surface,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    headerTitle: {
        ...Theme.typography.h3,
        marginLeft: 15,
        color: Theme.colors.text,
    },
    progressSection: {
        paddingHorizontal: 25,
        marginBottom: 15,
    },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    progressText: {
        fontSize: 14,
        fontWeight: "600",
        color: Theme.colors.text,
    },
    progressPercent: {
        fontSize: 12,
        color: Theme.colors.textMuted,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: Theme.colors.border,
        borderRadius: 3,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: Theme.colors.primary,
        borderRadius: 3,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 160, // room for bottom bar
    },
    stepContainer: {
        marginTop: 5,
    },
    label: {
        ...Theme.typography.subtitle,
        color: Theme.colors.text,
        marginBottom: 8,
        marginTop: 15,
    },
    input: {
        backgroundColor: Theme.colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 16,
        fontSize: 15,
        color: Theme.colors.text,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    phoneInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Theme.colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        overflow: "hidden",
    },
    phonePrefix: {
        backgroundColor: "#F2EBE5",
        paddingHorizontal: 16,
        paddingVertical: 14,
        justifyContent: "center",
    },
    phonePrefixText: {
        fontWeight: "700",
        color: Theme.colors.text,
        fontSize: 15,
    },
    phoneInput: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 14,
        fontSize: 15,
        color: Theme.colors.text,
    },
    inputDropdown: {
        backgroundColor: Theme.colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    inputText: {
        fontSize: 15,
        color: Theme.colors.text,
    },
    placeholderText: {
        fontSize: 15,
        color: Theme.colors.border,
    },
    dropdownOverlay: {
        backgroundColor: Theme.colors.surface,
        borderRadius: 12,
        marginTop: 5,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    dropdownItem: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    expRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    expButton: {
        flex: 1,
        backgroundColor: Theme.colors.surface,
        paddingVertical: 12,
        borderRadius: 8,
        marginRight: 8,
        alignItems: "center",
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    expButtonActive: {
        borderColor: Theme.colors.primary,
        backgroundColor: "#FDF9F5",
    },
    expText: {
        color: Theme.colors.textMuted,
        fontSize: 14,
        fontWeight: "500",
    },
    expTextActive: {
        color: Theme.colors.primary,
        fontWeight: "700",
    },
    toggleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
    },
    toggleBtn: {
        flex: 1,
        backgroundColor: Theme.colors.surface,
        paddingVertical: 14,
        borderRadius: 25,
        alignItems: "center",
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    toggleBtnActive: {
        backgroundColor: Theme.colors.primary,
        borderColor: Theme.colors.primary,
    },
    toggleText: {
        color: Theme.colors.textMuted,
        fontWeight: "600",
        fontSize: 15,
    },
    toggleTextActive: {
        color: "#FFF",
    },
    uploadContainer: {
        backgroundColor: Theme.colors.background,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        borderStyle: "dashed",
        borderRadius: 16,
        marginTop: 5,
        padding: 15,
    },
    uploadRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    uploadBox: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        minHeight: 120, // Provide baseline height
    },
    uploadDivider: {
        width: 1,
        height: "80%",
        backgroundColor: Theme.colors.border,
        marginHorizontal: 10,
    },
    ktpUploadBox: {
        width: "100%",
        height: 160,
        backgroundColor: Theme.colors.surface,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: Theme.colors.border,
        overflow: "hidden",
    },
    uploadDividerHorizontal: {
        height: 1,
        backgroundColor: Theme.colors.border,
        width: "100%",
        marginVertical: 15,
    },
    workScrollView: {
        width: "100%",
    },
    workUploadBox: {
        width: 120,
        height: 120,
        backgroundColor: Theme.colors.surface,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: Theme.colors.border,
        marginRight: 10,
        overflow: "hidden",
    },
    uploadTitle: {
        fontSize: 12,
        fontWeight: "700",
        color: Theme.colors.text,
        marginTop: 8,
        textAlign: "center",
    },
    uploadSub: {
        fontSize: 10,
        color: Theme.colors.textMuted,
        textAlign: "center",
        marginTop: 2,
    },
    uploadNote: {
        fontSize: 11,
        color: Theme.colors.textMuted,
        marginTop: 8,
        marginBottom: 15,
    },
    checkboxRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginTop: 15,
        marginBottom: 10,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: Theme.colors.primary,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
        backgroundColor: Theme.colors.surface,
        marginTop: 2,
    },
    checkboxActive: {
        backgroundColor: Theme.colors.primary,
    },
    checkboxText: {
        fontSize: 13,
        color: Theme.colors.text,
        fontWeight: "600",
    },
    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Theme.colors.surface,
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    primaryBtn: {
        backgroundColor: Theme.colors.primary,
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: "center",
    },
    primaryBtnText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
    },
    skillsContainer: {
        backgroundColor: Theme.colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        overflow: "hidden",
        marginTop: 5,
        marginBottom: 10,
    },
    skillItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 15,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    skillLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    skillText: {
        fontSize: 14,
        color: Theme.colors.text,
        fontWeight: "500",
    },
    dropdownBtn: {
        flex: 1,
        backgroundColor: Theme.colors.surface,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 25,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    dropdownBtnActive: {
        borderColor: Theme.colors.primary,
    },
    dropdownBtnText: {
        color: Theme.colors.textMuted,
        fontSize: 14,
        fontWeight: "500",
    },
    dropdownBtnTextActive: {
        color: Theme.colors.text,
        fontWeight: "700",
    },
    bankContainer: {
        backgroundColor: Theme.colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        overflow: "hidden",
        marginTop: 5,
    },
    bankInputTop: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: Theme.colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: "#F0F0F0",
        marginHorizontal: 16,
    },
    bankInputBottom: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: Theme.colors.text,
    },
    // MODAL STYLES
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: Theme.colors.surface,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingBottom: 30,
        maxHeight: "85%",
    },
    modalHeader: {
        alignItems: "center",
        paddingTop: 12,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    modalDragHandle: {
        width: 40,
        height: 4,
        backgroundColor: "#DDD",
        borderRadius: 2,
        marginBottom: 15,
    },
    modalTitle: {
        ...Theme.typography.h2,
        color: Theme.colors.text,
    },
    modalCloseBtn: {
        position: "absolute",
        right: 20,
        top: 25,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Theme.colors.inputBg,
        justifyContent: "center",
        alignItems: "center",
    },
    modalScroll: {
        paddingHorizontal: 25,
        paddingVertical: 20,
    },
    sopItem: {
        flexDirection: "row",
        marginBottom: 25,
    },
    sopNumberContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "#F7F2ED",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15,
        marginTop: 2,
    },
    sopNumber: {
        ...Theme.typography.subtitle,
        color: "#8B5E3C",
    },
    sopTextContainer: {
        flex: 1,
    },
    sopPointTitle: {
        ...Theme.typography.subtitle,
        color: Theme.colors.text,
        marginBottom: 5,
    },
    sopPointDesc: {
        fontSize: 13,
        color: Theme.colors.textMuted,
        lineHeight: 20,
    },
    modalFooter: {
        paddingHorizontal: 25,
        paddingTop: 15,
    },
    modalCheckboxContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FAF7F2",
        padding: 15,
        borderRadius: 15,
        marginBottom: 20,
    },
    modalCheckboxText: {
        flex: 1,
        ...Theme.typography.body,
        color: Theme.colors.text,
        lineHeight: 18,
    },
    modalActionBtn: {
        backgroundColor: "#8B5E3C",
        paddingVertical: 18,
        borderRadius: 35,
        alignItems: "center",
        shadowColor: "#8B5E3C",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    modalActionBtnDisabled: {
        backgroundColor: "#CCC",
        shadowOpacity: 0,
        elevation: 0,
    },
    modalActionBtnText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
    },
});
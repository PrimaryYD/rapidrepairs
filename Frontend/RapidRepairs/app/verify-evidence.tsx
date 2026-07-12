import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView
} from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./_firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { BASE_URL } from "../api";
import { getTempData, clearTempData } from "../utils/tempStorage";
import { Theme } from "../constants/theme";
import { useCustomAlert } from "../components/ui/GlobalAlertProvider";
import AnimatedButton from "../components/ui/AnimatedButton";

export default function VerifyEvidence() {
    const router = useRouter();
    const { orderId } = useLocalSearchParams();
    const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
    const [aiReport, setAiReport] = useState<string>("");
    const [visualMarkers, setVisualMarkers] = useState<string[]>([]);
    const [isIncorrectPart, setIsIncorrectPart] = useState<boolean>(false);
    const { showAlert } = useCustomAlert();

    useEffect(() => {
        if (!orderId) return;

        const uploadAndVerify = async () => {
            try {
                // Get the images from tempStorage
                const localImages = getTempData("evidenceImages") || {};
                
                // Extract base64 strings and file names
                const payloadImages: { [key: string]: { base64: string; fileName: string }[] } = {};
                for (const key in localImages) {
                    payloadImages[key] = localImages[key].map((img: any) => ({
                        base64: img.base64 || "",
                        fileName: img.fileName || img.uri.split('/').pop() || ""
                    })).filter((img: any) => img.base64);
                }

                console.log(`📤 Sending ${Object.keys(payloadImages).length} inspection services to backend...`);

                // Send upload and validation request to backend
                const response = await fetch(`${BASE_URL}/api/upload-inspection`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "bypass-tunnel-reminder": "true",
                        "ngrok-skip-browser-warning": "true"
                    },
                    body: JSON.stringify({
                        orderId,
                        images: payloadImages
                    })
                });

                if (!response.ok) {
                    let errMsg = "Gagal mengunggah foto ke server";
                    try {
                        const errData = await response.json();
                        if (errData.error) errMsg = errData.error;
                    } catch (e) {}
                    throw new Error(errMsg);
                }

                const result = await response.json();
                console.log("✅ Backend AI Verification completed, success:", result.success);

                if (result.success) {
                    setStatus("success");
                    clearTempData("evidenceImages");

                    // Route to waiting-payment-tech after 3s
                    setTimeout(() => {
                        router.replace({
                            pathname: "/waiting-payment-tech" as any,
                            params: { orderId }
                        });
                    }, 3000);
                } else {
                    // Set audit warning information
                    setAiReport(result.analysis?.analysis_summary || "");
                    setVisualMarkers(result.analysis?.visual_markers || []);
                    setIsIncorrectPart(result.analysis?.is_incorrect_part || false);
                    setStatus("failed");
                }

            } catch (err: any) {
                console.log("Upload error:", err);
                
                // Show failed screen with exact error
                setAiReport(err.message || "Tidak dapat terhubung ke server backend Anda.");
                setVisualMarkers([`Error: ${err.message}`]);
                setIsIncorrectPart(false);
                setStatus("failed");
                
                showAlert({ title: "Gagal", message: err.message || "Aplikasi tidak dapat menghubungi backend.", type: "error" });
            }
        };

        uploadAndVerify();
    }, [orderId]);

    const handleResetServices = async () => {
        if (!orderId) return;
        try {
            // Update Firestore order status back to "accepted" (clearing services)
            await updateDoc(doc(db, "orders", orderId as string), {
                status: "accepted",
                selectedServices: [],
                totalBill: 50000,
                inspectionVerified: false
            });
            clearTempData("evidenceImages");
            
            router.replace({
                pathname: "/start-inspection" as any,
                params: { orderId }
            });
        } catch (err) {
            console.log("Error resetting order:", err);
            showAlert({ title: "Gagal", message: "Tidak dapat menyetel ulang status pesanan.", type: "error" });
        }
    };

    const handleRetakePhotos = () => {
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            {status === "verifying" ? (
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <View style={styles.iconBg}>
                            <Ionicons name="document-text" size={50} color="#8B5E3C" />
                            <View style={styles.spinnerOverlay}>
                                <ActivityIndicator size="small" color="#8B5E3C" />
                            </View>
                        </View>
                    </View>

                    <Text style={styles.title}>Memverifikasi Bukti Foto</Text>
                    <Text style={styles.description}>
                        Sistem AI sedang mengecek kejelasan dan keabsahan foto bukti yang Anda unggah. Proses ini memakan waktu beberapa detik...
                    </Text>

                    <AnimatedButton
                        title="Batalkan Unggahan"
                        onPress={() => router.back()}
                        style={{ marginTop: 50 }}
                        variant="secondary"
                    />
                </View>
            ) : status === "success" ? (
                <View style={styles.content}>
                    <View style={styles.successIconContainer}>
                        <View style={styles.successIconBg}>
                            <Ionicons name="checkmark" size={60} color="#4CAF50" />
                        </View>
                    </View>

                    <Text style={styles.title}>Verifikasi Berhasil!</Text>
                    <Text style={styles.description}>
                        Sistem AI telah memverifikasi foto bukti Anda. Foto terlihat jelas, sah, dan sesuai standar keamanan Rapid Repairs.
                    </Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={[styles.content, { flexGrow: 1, paddingVertical: 40, justifyContent: 'center' }]}>
                    <View style={styles.failIconContainer}>
                        <View style={styles.failIconBg}>
                            <Ionicons name="shield-half-sharp" size={56} color="#E74C3C" />
                        </View>
                    </View>

                    <Text style={styles.failTitle}>Verifikasi AI Gagal</Text>
                    
                    <View style={styles.warningCard}>
                        <View style={styles.warningHeader}>
                            <Ionicons name="alert-circle" size={20} color="#E74C3C" />
                            <Text style={styles.warningHeaderText}>
                                {isIncorrectPart ? "Peralatan Tidak Sesuai" : "Ketidaksesuaian Bukti Fisik"}
                            </Text>
                        </View>
                        <Text style={styles.warningDesc}>
                            {aiReport || "Foto bukti pengecekan tidak menunjukkan indikasi kerusakan atau grime sesuai dengan klaim Anda."}
                        </Text>
                    </View>

                    {visualMarkers && visualMarkers.length > 0 && (
                        <View style={styles.markersCard}>
                            <Text style={styles.markersTitle}>Audit Visual Terdeteksi:</Text>
                            <View style={styles.markersList}>
                                {visualMarkers.map((marker, index) => (
                                    <View key={index} style={styles.markerBadge}>
                                        <Ionicons name="eye-outline" size={14} color="#8B5E3C" style={{ marginRight: 5 }} />
                                        <Text style={styles.markerText}>{marker}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    <Text style={styles.warningActionDesc}>
                        Deteksi menunjukkan tindakan ketidakjujuran klaim/penipuan layanan. Silakan minta pelanggan melakukan penyusunan ulang pilihan layanan perbaikan, atau perbaiki unggahan Anda.
                    </Text>

                    <View style={styles.actionRow}>
                        <AnimatedButton
                            title="Ubah Layanan"
                            onPress={handleResetServices}
                            style={{ flex: 1 }}
                        />

                        <AnimatedButton
                            title="Ambil Ulang"
                            onPress={handleRetakePhotos}
                            style={{ flex: 1 }}
                            variant="secondary"
                        />
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    content: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 30,
    },
    iconContainer: {
        marginBottom: 40,
    },
    iconBg: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#F2EBE5",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    spinnerOverlay: {
        position: "absolute",
        bottom: -5,
        right: -5,
        backgroundColor: Theme.colors.surface,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: Theme.colors.background,
    },
    successIconContainer: {
        marginBottom: 40,
    },
    successIconBg: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#E8F5E9",
        justifyContent: "center",
        alignItems: "center",
    },
    failIconContainer: {
        marginBottom: 30,
    },
    failIconBg: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#FDEAE8",
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: Theme.colors.text,
        textAlign: "center",
        marginBottom: 20,
    },
    failTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: "#E74C3C",
        textAlign: "center",
        marginBottom: 20,
    },
    description: {
        fontSize: 15,
        color: Theme.colors.textMuted,
        textAlign: "center",
        lineHeight: 24,
    },
    cancelBtn: {
        marginTop: 50,
        borderWidth: 1,
        borderColor: "#D2C4B7",
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
    },
    cancelBtnText: {
        color: Theme.colors.text,
        fontWeight: "600",
        fontSize: 15,
    },
    warningCard: {
        backgroundColor: "#FFF8F7",
        borderWidth: 1,
        borderColor: "#FADBD8",
        borderRadius: 16,
        padding: 16,
        width: "100%",
        marginBottom: 20,
    },
    warningHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    warningHeaderText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#C0392B",
        marginLeft: 8,
    },
    warningDesc: {
        fontSize: 13,
        color: "#7B241C",
        lineHeight: 20,
    },
    markersCard: {
        backgroundColor: Theme.colors.surface,
        borderWidth: 1,
        borderColor: "#EFEBE4",
        borderRadius: 16,
        padding: 16,
        width: "100%",
        marginBottom: 20,
    },
    markersTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: Theme.colors.text,
        marginBottom: 10,
    },
    markersList: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    markerBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F2EBE5",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    markerText: {
        fontSize: 12,
        fontWeight: "600",
        color: Theme.colors.primary,
    },
    warningActionDesc: {
        fontSize: 12,
        color: Theme.colors.textMuted,
        textAlign: "center",
        lineHeight: 18,
        paddingHorizontal: 10,
        marginBottom: 30,
    },
    actionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        gap: 12,
    },
    resetBtn: {
        flex: 1,
        backgroundColor: Theme.colors.primary,
        paddingVertical: 15,
        borderRadius: 25,
        alignItems: "center",
    },
    resetBtnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 14,
    },
    retakeBtn: {
        flex: 1,
        backgroundColor: Theme.colors.surface,
        borderWidth: 1,
        borderColor: "#D2C4B7",
        paddingVertical: 15,
        borderRadius: 25,
        alignItems: "center",
    },
    retakeBtnText: {
        color: Theme.colors.text,
        fontWeight: "700",
        fontSize: 14,
    },
});

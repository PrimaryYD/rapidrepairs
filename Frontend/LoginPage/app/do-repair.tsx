import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
    Modal,
    Animated,
    Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./_firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { BASE_URL } from "../api";

type ImageType = {
    uri: string;
    base64?: string;
};

export default function DoRepairScreen() {
    const router = useRouter();
    const { orderId } = useLocalSearchParams();
    
    const [order, setOrder] = useState<any>(null);
    const [completionImages, setCompletionImages] = useState<{ [key: string]: ImageType[] }>({});
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    // Animations for Success State
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!orderId) return;

        const unsub = onSnapshot(
            doc(db, "orders", orderId as string), 
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setOrder(data);

                    // If already completed in db, directly show completed view
                    if (data.status === "completed") {
                        setIsCompleted(true);
                    }

                    // Initialize completion images state
                    if (data.selectedServices) {
                        const initialImages: { [key: string]: ImageType[] } = {};
                        data.selectedServices.forEach((service: any) => {
                            initialImages[service.name] = [];
                        });
                        setCompletionImages(prev => {
                            const newState = { ...initialImages };
                            Object.keys(prev).forEach(key => {
                                if (newState[key]) newState[key] = prev[key];
                            });
                            return newState;
                        });
                    }
                }
            },
            (error) => {
                console.error("Error in do-repair snapshot listener:", error);
            }
        );

        return () => unsub();
    }, [orderId]);

    // Trigger Success Animations when completed
    useEffect(() => {
        if (isCompleted) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            }).start();

            Animated.loop(
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                })
            ).start();
        }
    }, [isCompleted]);

    const pickImage = async (serviceName: string) => {
        if (completionImages[serviceName]?.length >= 5) {
            Alert.alert("Limit Tercapai", "Maksimal 5 foto per layanan.");
            return;
        }

        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Izin Kamera Diperlukan", "Aplikasi membutuhkan izin kamera untuk mengambil foto bukti.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
            const newUri = result.assets[0].uri;
            const newBase64 = result.assets[0].base64 || "";

            const newImageObj: ImageType = {
                uri: newUri,
                base64: newBase64,
            };

            setCompletionImages(prev => ({
                ...prev,
                [serviceName]: [...(prev[serviceName] || []), newImageObj],
            }));
        }
    };

    const removeImage = (serviceName: string, index: number) => {
        setCompletionImages(prev => ({
            ...prev,
            [serviceName]: prev[serviceName].filter((_, i) => i !== index),
        }));
    };

    const handleSelesaikanPesanan = () => {
        if (!order || !order.selectedServices) return;

        // Validation: Must upload at least 1 photo for each service
        const missingPhoto = order.selectedServices.find(
            (s: any) => !completionImages[s.name] || completionImages[s.name].length === 0
        );

        if (missingPhoto) {
            Alert.alert("Foto Diperlukan", `Mohon unggah minimal 1 foto hasil perbaikan untuk "${missingPhoto.name}".`);
            return;
        }

        setIsConfirmVisible(true);
    };

    const handleConfirmSelesai = async () => {
        setIsConfirmVisible(false);
        setIsUploading(true);

        try {
            // Extract base64 strings
            const payloadImages: { [key: string]: string[] } = {};
            for (const key in completionImages) {
                payloadImages[key] = completionImages[key]
                    .map((img: any) => img.base64)
                    .filter(Boolean);
            }

            console.log("📤 Uploading completed repair photos to backend...");

            const response = await fetch(`${BASE_URL}/api/upload-completion`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderId,
                    images: payloadImages,
                }),
            });

            if (!response.ok) {
                throw new Error("Gagal mengunggah foto ke server");
            }

            console.log("✅ Repair completion uploaded successfully");
            setIsCompleted(true);
        } catch (error: any) {
            console.log("Error uploading completion photos:", error);
            Alert.alert("Kesalahan", error.message || "Gagal mengunggah foto hasil pekerjaan. Silakan coba lagi.");
        } finally {
            setIsUploading(false);
        }
    };

    if (!order) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#B3875E" />
                <Text style={styles.loadingText}>Memuat data perbaikan...</Text>
            </SafeAreaView>
        );
    }

    const totalBill = order.totalBill || (order.selectedServices?.reduce((sum: number, s: any) => sum + (s.price || 0), 0) + 50000) || 50000;

    return (
        <SafeAreaView style={styles.safeArea}>
            {isUploading && (
                <View style={styles.overlayLoading}>
                    <ActivityIndicator size="large" color="#B3875E" />
                    <Text style={styles.overlayLoadingText}>Mengunggah bukti hasil perbaikan...</Text>
                </View>
            )}

            {!isCompleted ? (
                // 1. REPAIR IN PROGRESS & UPLOAD SCREEN
                <View style={{ flex: 1 }}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Lakukan Perbaikan</Text>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* GREEN ALERT BANNER */}
                        <View style={styles.infoBanner}>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#2E7D32" style={{ marginRight: 8 }} />
                            <Text style={styles.infoBannerText}>
                                Pelanggan telah membayar! Silakan kerjakan layanan dan unggah foto hasil perbaikan.
                            </Text>
                        </View>

                        {/* SERVICE CARDS WITH PHOTO UPLOAD */}
                        {order.selectedServices && order.selectedServices.map((service: any, idx: number) => (
                            <View key={idx} style={styles.serviceCard}>
                                <View style={styles.serviceHeader}>
                                    <Text style={styles.serviceName}>{service.name}</Text>
                                    <View style={styles.paidBadge}>
                                        <Text style={styles.paidText}>Sudah Dibayar</Text>
                                    </View>
                                </View>

                                <View style={styles.imageGrid}>
                                    {completionImages[service.name]?.map((imgObj, imgIdx) => (
                                        <View key={imgIdx} style={styles.imageWrapper}>
                                            <Image source={{ uri: imgObj.uri }} style={styles.evidenceImage} />
                                            <TouchableOpacity
                                                style={styles.removeBtn}
                                                onPress={() => removeImage(service.name, imgIdx)}
                                            >
                                                <Ionicons name="close" size={14} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}

                                    {(!completionImages[service.name] || completionImages[service.name].length < 5) && (
                                        <TouchableOpacity
                                            style={styles.uploadBox}
                                            onPress={() => pickImage(service.name)}
                                        >
                                            <Ionicons name="camera-outline" size={32} color="#B3875E" />
                                            <Text style={styles.uploadBoxText}>Foto Hasil Perbaikan (Sesudah)</Text>
                                            <Text style={styles.photoCount}>
                                                ({completionImages[service.name]?.length || 0}/5 Foto)
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    {/* FOOTER BUTTON */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.primaryBtn} onPress={handleSelesaikanPesanan}>
                            <Text style={styles.primaryBtnText}>Selesaikan Pesanan</Text>
                        </TouchableOpacity>
                    </View>

                    {/* CONFIRMATION POPUP MODAL */}
                    <Modal
                        visible={isConfirmVisible}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setIsConfirmVisible(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalCard}>
                                <View style={styles.warnIconBg}>
                                    <Ionicons name="warning-outline" size={36} color="#D32F2F" />
                                </View>
                                
                                <Text style={styles.modalTitle}>Konfirmasi Selesai</Text>
                                <Text style={styles.modalDesc}>
                                    Apakah Anda yakin perbaikan telah selesai dan foto bukti sudah benar? Sistem akan memverifikasi foto Anda. Manipulasi atau kecurangan akan mengakibatkan <Text style={{ color: "#D32F2F", fontWeight: "700" }}>PENAHANAN DANA</Text> dan sanksi pemutusan mitra.
                                </Text>

                                <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleConfirmSelesai}>
                                    <Text style={styles.modalConfirmText}>Ya, Selesaikan Pekerjaan</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsConfirmVisible(false)}>
                                    <Text style={styles.modalCancelText}>Kembali, Cek Lagi</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                </View>
            ) : (
                // 2. JOB COMPLETED SUCCESS SCREEN
                <View style={styles.successContainer}>
                    <View style={styles.pulseContainer}>
                        <Animated.View
                            style={[
                                styles.pulse,
                                {
                                    transform: [
                                        {
                                            scale: pulseAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [1, 2],
                                            }),
                                        },
                                    ],
                                    opacity: pulseAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.4, 0],
                                    }),
                                },
                            ]}
                        />
                        {/* DECORATIVE DOTS */}
                        <View style={[styles.decorDot, { top: -8, right: -8, backgroundColor: "#FFB300" }]} />
                        <View style={[styles.decorDot, { bottom: -8, left: -8, backgroundColor: "#1E88E5" }]} />

                        <Animated.View
                            style={[
                                styles.circle,
                                {
                                    transform: [{ scale: scaleAnim }],
                                },
                            ]}
                        >
                            <Ionicons name="checkmark-circle-outline" size={54} color="#2E7D32" />
                        </Animated.View>
                    </View>

                    <Text style={styles.successTitle}>Pekerjaan Selesai!</Text>
                    
                    <Text style={styles.successDesc}>
                        Terima kasih. Dana sebesar <Text style={{ fontWeight: "700", color: "#333" }}>Rp {totalBill.toLocaleString("id-ID")}</Text> sedang diproses dan ditahan oleh sistem. Dana akan masuk ke dompet Anda setelah verifikasi foto bukti selesai.
                    </Text>

                    <View style={styles.statusBadgeRow}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusBadgeText}>Menunggu Verifikasi</Text>
                    </View>

                    {/* ACTION BUTTONS */}
                    <View style={styles.successFooter}>
                        <TouchableOpacity 
                            style={styles.successPrimaryBtn} 
                            onPress={() => {
                                Alert.alert("Penilaian", "Terima kasih telah memberikan penilaian!");
                                router.replace("/home-tech" as any);
                            }}
                        >
                            <Text style={styles.successPrimaryText}>Berikan Penilaian kepada Pengguna</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.successSecondaryBtn} 
                            onPress={() => router.replace("/home-tech" as any)}
                        >
                            <Text style={styles.successSecondaryText}>Kembali ke Beranda</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FAF6F0",
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: "#FAF6F0",
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 15,
        fontSize: 14,
        color: "#B3875E",
        fontWeight: "600",
    },
    overlayLoading: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(250, 246, 240, 0.9)",
        zIndex: 9999,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    overlayLoadingText: {
        marginTop: 20,
        fontSize: 15,
        fontWeight: "700",
        color: "#B3875E",
        textAlign: "center",
    },
    header: {
        paddingVertical: 20,
        alignItems: "center",
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#EFEBE4",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 120,
    },
    infoBanner: {
        flexDirection: "row",
        backgroundColor: "#E8F5E9",
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#C8E6C9",
        alignItems: "center",
    },
    infoBannerText: {
        flex: 1,
        fontSize: 12,
        color: "#2E7D32",
        fontWeight: "600",
        lineHeight: 18,
    },
    serviceCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#EFEBE4",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    serviceHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#333",
        flex: 1,
        marginRight: 10,
    },
    paidBadge: {
        backgroundColor: "#E8F5E9",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#C8E6C9",
    },
    paidText: {
        fontSize: 10,
        color: "#2E7D32",
        fontWeight: "700",
    },
    uploadBox: {
        width: "100%",
        height: 140,
        backgroundColor: "#FAF6F0",
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#D2C4B7",
        borderStyle: "dashed",
        justifyContent: "center",
        alignItems: "center",
        padding: 15,
    },
    uploadBoxText: {
        fontSize: 13,
        color: "#B3875E",
        fontWeight: "700",
        marginTop: 10,
        textAlign: "center",
    },
    photoCount: {
        fontSize: 11,
        color: "#999",
        marginTop: 5,
    },
    imageGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    imageWrapper: {
        width: "48%",
        height: 120,
        borderRadius: 12,
        position: "relative",
    },
    evidenceImage: {
        width: "100%",
        height: "100%",
        borderRadius: 12,
    },
    removeBtn: {
        position: "absolute",
        top: -5,
        right: -5,
        backgroundColor: "rgba(211, 47, 47, 0.9)",
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#fff",
        zIndex: 10,
    },
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        padding: 20,
        paddingBottom: 30,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    primaryBtn: {
        backgroundColor: "#B3875E",
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: "center",
    },
    primaryBtnText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },

    // Modal Confirmation styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    modalCard: {
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 24,
        width: "100%",
        alignItems: "center",
    },
    warnIconBg: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "#FFEBEE",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#333",
        marginBottom: 12,
    },
    modalDesc: {
        fontSize: 13,
        color: "#666",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 24,
    },
    modalConfirmBtn: {
        backgroundColor: "#B3875E",
        width: "100%",
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: "center",
        marginBottom: 10,
    },
    modalConfirmText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
    },
    modalCancelBtn: {
        width: "100%",
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "#B3875E",
    },
    modalCancelText: {
        color: "#B3875E",
        fontSize: 15,
        fontWeight: "700",
    },

    // Success Screen styles
    successContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 30,
        backgroundColor: "#FAF6F0",
    },
    pulseContainer: {
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 35,
        position: "relative",
    },
    pulse: {
        position: "absolute",
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: "#E8F5E9",
    },
    circle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#E8F5E9",
        borderWidth: 2,
        borderColor: "#C8E6C9",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2,
    },
    decorDot: {
        position: "absolute",
        width: 12,
        height: 12,
        borderRadius: 6,
        zIndex: 3,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: "900",
        color: "#333",
        textAlign: "center",
        marginBottom: 15,
    },
    successDesc: {
        fontSize: 13,
        color: "#777",
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 25,
        paddingHorizontal: 10,
    },
    statusBadgeRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF8E1",
        borderWidth: 1,
        borderColor: "#FFE082",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginBottom: 40,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#FFB300",
        marginRight: 8,
    },
    statusBadgeText: {
        fontSize: 11,
        color: "#FFB300",
        fontWeight: "700",
    },
    successFooter: {
        width: "100%",
        gap: 12,
    },
    successPrimaryBtn: {
        backgroundColor: "#B3875E",
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: "center",
    },
    successPrimaryText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
    },
    successSecondaryBtn: {
        backgroundColor: "#fff",
        borderWidth: 1.5,
        borderColor: "#B3875E",
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: "center",
    },
    successSecondaryText: {
        color: "#B3875E",
        fontSize: 15,
        fontWeight: "700",
    },
});

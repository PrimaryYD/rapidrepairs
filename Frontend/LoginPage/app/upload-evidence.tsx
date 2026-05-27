import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./_firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { setTempData } from "../utils/tempStorage";

type ImageType = {
    uri: string;
    base64?: string;
};

export default function UploadEvidence() {
    const router = useRouter();
    const { orderId } = useLocalSearchParams();
    const [order, setOrder] = useState<any>(null);
    const [evidenceImages, setEvidenceImages] = useState<{ [key: string]: ImageType[] }>({});

    useEffect(() => {
        if (!orderId) return;

        const unsub = onSnapshot(
            doc(db, "orders", orderId as string), 
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setOrder(data);
                    
                    // Initialize evidence images state if not already done
                    if (data.selectedServices) {
                        const initialImages: { [key: string]: ImageType[] } = {};
                        const list = data.selectedServices.length > 0 
                            ? data.selectedServices 
                            : [{ name: "Pengecekan Umum" }];
                        list.forEach((service: any) => {
                            initialImages[service.name] = [];
                        });
                        setEvidenceImages(prev => {
                            // Keep existing if already set
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
                console.error("Error in upload-evidence snapshot listener:", error);
            }
        );

        return () => unsub();
    }, [orderId]);

    const pickImage = async (serviceName: string) => {
        if (evidenceImages[serviceName]?.length >= 5) {
            Alert.alert("Limit Tercapai", "Maksimal 5 foto per layanan.");
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
                base64: newBase64
            };
            
            setEvidenceImages(prev => ({
                ...prev,
                [serviceName]: [...(prev[serviceName] || []), newImageObj]
            }));
            
            // Note: In a real app, we might store base64 in a ref or temporary state for AI processing
        }
    };

    const removeImage = (serviceName: string, index: number) => {
        setEvidenceImages(prev => ({
            ...prev,
            [serviceName]: prev[serviceName].filter((_, i) => i !== index)
        }));
    };

    const handleSendEvidence = () => {
        const servicesList = order?.selectedServices && order.selectedServices.length > 0
            ? order.selectedServices
            : [{ name: "Pengecekan Umum" }];

        // Validation: Mandatory to upload at least 1 image for each service
        const missingEvidence = servicesList.find(
            (s: any) => !evidenceImages[s.name] || evidenceImages[s.name].length === 0
        );

        if (missingEvidence) {
            Alert.alert("Foto Diperlukan", `Mohon unggah minimal 1 foto untuk ${missingEvidence.name}.`);
            return;
        }

        // Store image data in tempStorage
        setTempData("evidenceImages", evidenceImages);

        // Navigate to verification screen
        router.push({
            pathname: "/verify-evidence" as any,
            params: { 
                orderId
            }
        });
    };

    if (!order || !order.selectedServices) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#8B5E3C" />
            </View>
        );
    }

    const servicesList = order.selectedServices && order.selectedServices.length > 0
        ? order.selectedServices
        : [{ name: "Pengecekan Umum" }];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Unggah Bukti Pengecekan</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.description}>
                    Pelanggan meminta pengecekan. Unggah foto bukti alat ukur atau kondisi AC untuk verifikasi sistem.
                </Text>

                {servicesList.map((service: any, idx: number) => (
                    <View key={idx} style={styles.serviceCard}>
                        <View style={styles.serviceHeader}>
                            <Text style={styles.serviceName}>{service.name}</Text>
                            <View style={styles.mandatoryBadge}>
                                <Text style={styles.mandatoryText}>Wajib Foto</Text>
                            </View>
                        </View>

                        <View style={styles.imageGrid}>
                            {evidenceImages[service.name]?.map((imgObj, imgIdx) => (
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
                            
                            {(!evidenceImages[service.name] || evidenceImages[service.name].length < 5) && (
                                <TouchableOpacity 
                                    style={styles.uploadBox} 
                                    onPress={() => pickImage(service.name)}
                                >
                                    <Ionicons name="camera-outline" size={32} color="#8B5E3C" />
                                    <Text style={styles.uploadBoxText}>Ambil Foto Bukti (Sebelum)</Text>
                                    <Text style={styles.photoCount}>
                                        ({evidenceImages[service.name]?.length || 0}/5 Foto)
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleSendEvidence}>
                    <Text style={styles.primaryBtnText}>Kirim Bukti Pengecekan</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FAF6F0",
    },
    loading: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
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
        paddingBottom: 100,
    },
    description: {
        fontSize: 14,
        color: "#777",
        lineHeight: 20,
        marginBottom: 25,
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
    },
    mandatoryBadge: {
        backgroundColor: "#FAF6F0",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E8DFD5",
    },
    mandatoryText: {
        fontSize: 11,
        color: "#B3875E",
        fontWeight: "600",
    },
    uploadBox: {
        width: "100%",
        height: 150,
        backgroundColor: "#FAF6F0",
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#D2C4B7",
        borderStyle: "dashed",
        justifyContent: "center",
        alignItems: "center",
    },
    uploadBoxText: {
        fontSize: 13,
        color: "#8B5E3C",
        fontWeight: "600",
        marginTop: 10,
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
        backgroundColor: "rgba(255, 59, 48, 0.9)",
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#fff",
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
});

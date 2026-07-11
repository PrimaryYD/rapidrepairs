import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { Theme } from "../constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./_firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

export default function WaitingProofScreen() {
    const router = useRouter();
    const { orderId } = useLocalSearchParams();
    const [isFailed, setIsFailed] = useState(false);

    useEffect(() => {
        if (!orderId) return;

        const unsub = onSnapshot(
            doc(db, "orders", orderId as string),
            (docSnap) => {
                const exists = docSnap.exists();
                console.log("📦 Doc exists?", exists);

                if (exists) {
                    const data = docSnap.data();
                    if (data.userId) {
                        console.log(`🔥 UID: ${data.userId}`);
                    }
                    console.log(`✅ STATUS FIRESTORE: ${data.status}`);

                    // If visual audit passed successfully, proceed to success screen
                    if (data.status === "inspection_verified") {
                        setIsFailed(false);
                        router.replace({
                            pathname: "/success" as any,
                            params: {
                                orderId,
                                total: (data.totalBill || 50000).toString(),
                                services: JSON.stringify(data.selectedServices || []),
                                isCheckOnly: (!data.selectedServices || data.selectedServices.length === 0) ? "true" : "false"
                            }
                        });
                    }
                    // If technician reset the status because the AI visual audit rejected the claims (fraud check)
                    else if (data.status === "accepted" || data.status === "arrived") {
                        setIsFailed(false);
                        router.replace({
                            pathname: "/pembayaran" as any,
                            params: { orderId }
                        });
                    }
                    // If visual audit failed, notify customer and display error screen
                    else if (data.status === "inspection_failed") {
                        setIsFailed(true);
                    }
                    else {
                        setIsFailed(false);
                    }
                }
            },
            (error) => {
                console.error("Error in waiting-proof snapshot listener:", error);
            }
        );

        return () => unsub();
    }, [orderId]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={[styles.loaderContainer, isFailed && styles.loaderContainerFailed]}>
                    {isFailed ? (
                        <Ionicons name="warning" size={38} color="#E74C3C" />
                    ) : (
                        <ActivityIndicator size="large" color="#8B5E3C" />
                    )}
                </View>

                <Text style={[styles.title, isFailed && styles.titleFailed]}>
                    {isFailed ? "Verifikasi Bukti Ditolak AI" : "Menunggu Bukti Pengecekan"}
                </Text>

                <Text style={styles.description}>
                    {isFailed
                        ? "Sistem AI mendeteksi ketidaksesuaian/ketidakjelasan pada bukti foto yang diunggah teknisi (potensi fraud/salah klaim). Menunggu teknisi melakukan penyesuaian layanan..."
                        : "Teknisi sedang memfotokan kondisi AC dan alat ukur sesuai layanan yang Anda pilih. Mohon tunggu sebentar..."
                    }
                </Text>

                {isFailed && (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            router.replace({
                                pathname: "/pembayaran" as any,
                                params: { orderId }
                            });
                        }}
                    >
                        <Text style={styles.backButtonText}>Kembali</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FDFCF9", // Light cream background from image
    },
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    loaderContainer: {
        marginBottom: 30,
        backgroundColor: "#F4F1EA",
        padding: 20,
        borderRadius: 50,
        width: 80,
        height: 80,
        justifyContent: "center",
        alignItems: "center",
    },
    loaderContainerFailed: {
        backgroundColor: "#FDEAE8",
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#332111", // Dark brown
        textAlign: "center",
        marginBottom: 15,
    },
    titleFailed: {
        color: "#E74C3C",
    },
    description: {
        fontSize: 14,
        color: "#7D7D7D",
        textAlign: "center",
        lineHeight: 22,
    },
    backButton: {
        marginTop: 30,
        backgroundColor: Theme.colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 25,
        elevation: 2, // shadow for android
        shadowColor: "#000", // shadow for ios
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});

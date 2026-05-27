import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./_firebaseConfig";

export default function WaitingProofScreen() {
    const router = useRouter();
    const { orderId } = useLocalSearchParams();

    useEffect(() => {
        if (!orderId) return;

        const unsub = onSnapshot(
            doc(db, "orders", orderId as string), 
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.status === "inspection_verified") {
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
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#8B5E3C" />
                </View>

                <Text style={styles.title}>Menunggu Bukti Pengecekan</Text>

                <Text style={styles.description}>
                    Teknisi sedang memfotokan kondisi AC dan alat ukur sesuai layanan yang Anda pilih. Mohon tunggu sebentar...
                </Text>
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
    title: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#332111", // Dark brown
        textAlign: "center",
        marginBottom: 15,
    },
    description: {
        fontSize: 14,
        color: "#7D7D7D",
        textAlign: "center",
        lineHeight: 22,
    },
});

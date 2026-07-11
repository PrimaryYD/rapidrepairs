import React, { useEffect, useState } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator,
    Image,
    Linking
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "./_firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../constants/theme";

export default function WaitingScreen() {
    const router = useRouter();
    const { orderId } = useLocalSearchParams();
    const [order, setOrder] = useState<any>(null);
    const [techName, setTechName] = useState("Budi Santoso");
    const [techPhone, setTechPhone] = useState("081234567890");

    useEffect(() => {
        if (!orderId) return;

        const unsub = onSnapshot(
            doc(db, "orders", orderId as string), 
            async (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setOrder(data);

                    // Fetch tech details
                    if (data.technicianId) {
                        try {
                            const techDoc = await getDoc(doc(db, "technicians", data.technicianId));
                            if (techDoc.exists()) {
                                const techData = techDoc.data();
                                setTechName(techData.name || "Budi Santoso");
                                setTechPhone(techData.phone || "081234567890");
                            }
                        } catch (e) {
                            console.log("Error fetching technician:", e);
                        }
                    }

                    // If technician finished the job
                    if (data.status === "completed") {
                        router.replace({
                            pathname: "/done" as any,
                            params: { orderId }
                        });
                    }
                }
            },
            (error) => {
                console.error("Error in waiting snapshot listener:", error);
            }
        );

        return () => unsub();
    }, [orderId]);

    const handleChatTech = () => {
        let cleanPhone = techPhone.replace(/[^0-9]/g, "");
        if (cleanPhone.startsWith("0")) {
            cleanPhone = "62" + cleanPhone.slice(1);
        }
        const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent("Halo, saya pelanggan AC Anda.")}`;
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Linking.openURL(`https://wa.me/${cleanPhone}`);
            }
        }).catch(() => {});
    };

    const handleCallTech = () => {
        Linking.openURL(`tel:${techPhone}`).catch(() => {});
    };

    if (!order) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#B3875E" />
                <Text style={styles.loadingText}>Memuat status perbaikan...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* WRENCH ICON AND LOADER */}
                <View style={styles.progressContainer}>
                    <View style={styles.iconBg}>
                        <Ionicons name="build" size={36} color="#B3875E" />
                        <View style={styles.spinnerWrapper}>
                            <ActivityIndicator size="small" color="#B3875E" />
                        </View>
                    </View>
                    <Text style={styles.title}>Perbaikan Sedang Berlangsung</Text>
                    <Text style={styles.desc}>
                        Teknisi sedang mengerjakan perbaikan AC Anda. Mohon tunggu sebentar...
                    </Text>
                </View>

                {/* TECHNICIAN PROFILE CARD */}
                <View style={styles.techCard}>
                    <View style={styles.avatarContainer}>
                        <Ionicons name="person" size={28} color="#ccc" />
                    </View>
                    <View style={styles.techDetails}>
                        <Text style={styles.techName}>Bapak {techName}</Text>
                        <Text style={styles.techSpec}>Spesialis A/C</Text>
                        <View style={styles.badgeRow}>
                            <View style={styles.verifyBadge}>
                                <Ionicons name="checkmark-circle" size={12} color="#5CB85C" style={{ marginRight: 3 }} />
                                <Text style={styles.verifyText}>Terverifikasi</Text>
                            </View>
                            <View style={styles.ratingBadge}>
                                <Ionicons name="star" size={12} color="#F1C40F" style={{ marginRight: 3 }} />
                                <Text style={styles.ratingText}>4.8 <Text style={{ color: Theme.colors.textMuted, fontWeight: "400" }}>(120+ Ulasan)</Text></Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.techActions}>
                        <TouchableOpacity style={styles.actionBtn} onPress={handleChatTech}>
                            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#B3875E" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { marginLeft: 8 }]} onPress={handleCallTech}>
                            <Ionicons name="call-outline" size={18} color="#B3875E" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* SERVICE DETAILS SUMMARY */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Detail Layanan</Text>
                    
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Kunjungan & Pengecekan</Text>
                        <Text style={styles.rowVal}>Rp 50.000</Text>
                    </View>

                    {order.selectedServices && order.selectedServices.map((service: any, index: number) => (
                        <View style={styles.row} key={index}>
                            <Text style={styles.rowLabel}>{service.name}</Text>
                            <Text style={styles.rowVal}>Rp {service.price.toLocaleString("id-ID")}</Text>
                        </View>
                    ))}

                    <View style={styles.divider} />

                    <View style={[styles.row, { marginTop: 10 }]}>
                        <Text style={styles.totalLabel}>Total Tagihan</Text>
                        <Text style={styles.totalVal}>Rp {(order.totalBill || 50000).toLocaleString("id-ID")}</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: Theme.colors.background,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 15,
        fontSize: 14,
        color: Theme.colors.primary,
        fontWeight: "600",
    },
    scrollContent: {
        padding: 20,
        alignItems: "center",
    },
    progressContainer: {
        alignItems: "center",
        marginVertical: 30,
        paddingHorizontal: 10,
    },
    iconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Theme.colors.border,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        marginBottom: 25,
    },
    spinnerWrapper: {
        position: "absolute",
        bottom: -5,
        right: -5,
        backgroundColor: Theme.colors.surface,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: Theme.colors.background,
    },
    title: {
        fontSize: 22,
        fontWeight: "900",
        color: Theme.colors.text,
        textAlign: "center",
        marginBottom: 12,
    },
    desc: {
        fontSize: 13,
        color: Theme.colors.textMuted,
        textAlign: "center",
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    techCard: {
        width: "100%",
        backgroundColor: Theme.colors.surface,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: Theme.colors.border,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Theme.colors.background,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    techDetails: {
        flex: 1,
        marginLeft: 12,
    },
    techName: {
        fontSize: 15,
        fontWeight: "800",
        color: Theme.colors.text,
    },
    techSpec: {
        fontSize: 11,
        color: Theme.colors.primary,
        fontWeight: "600",
        marginTop: 2,
    },
    badgeRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
        gap: 6,
    },
    verifyBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EAF7EA",
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 6,
    },
    verifyText: {
        fontSize: 9,
        color: "#5CB85C",
        fontWeight: "800",
    },
    ratingBadge: {
        flexDirection: "row",
        alignItems: "center",
    },
    ratingText: {
        fontSize: 9,
        color: Theme.colors.text,
        fontWeight: "800",
    },
    techActions: {
        flexDirection: "row",
        alignItems: "center",
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Theme.colors.background,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        justifyContent: "center",
        alignItems: "center",
    },
    summaryCard: {
        width: "100%",
        backgroundColor: Theme.colors.surface,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: Theme.colors.border,
        padding: 20,
        marginBottom: 30,
    },
    summaryTitle: {
        fontSize: 13,
        fontWeight: "800",
        color: Theme.colors.text,
        marginBottom: 15,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    rowLabel: {
        fontSize: 13,
        color: Theme.colors.textMuted,
        fontWeight: "500",
    },
    rowVal: {
        fontSize: 13,
        color: Theme.colors.text,
        fontWeight: "600",
    },
    divider: {
        height: 1,
        backgroundColor: "#F0EFEB",
        marginVertical: 12,
    },
    totalLabel: {
        fontSize: 14,
        color: Theme.colors.text,
        fontWeight: "800",
    },
    totalVal: {
        fontSize: 15,
        color: Theme.colors.primary,
        fontWeight: "900",
    },
});
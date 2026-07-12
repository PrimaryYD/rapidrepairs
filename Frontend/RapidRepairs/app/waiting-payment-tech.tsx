import { Theme } from "../constants/theme";
import React, { useEffect, useState, useRef } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator,
    Animated,
    Easing,
    BackHandler
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./_firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

export default function WaitingPaymentTechScreen() {
    const router = useRouter();
    const { orderId } = useLocalSearchParams();
    
    // Prevent Android hardware back button
    useEffect(() => {
        const onBackPress = () => {
            return true; // prevent default behavior
        };
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
    }, []);

    const [order, setOrder] = useState<any>(null);
    const [customerName, setCustomerName] = useState("Pelanggan");
    const [isPaid, setIsPaid] = useState(false);

    // Animations
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!orderId) return;

        const unsub = onSnapshot(
            doc(db, "orders", orderId as string), 
            async (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setOrder(data);

                    // Fetch customer details
                    if (data.userId) {
                        try {
                            const userDoc = await getDoc(doc(db, "users", data.userId));
                            if (userDoc.exists()) {
                                setCustomerName(userDoc.data().name || "Pelanggan");
                            }
                        } catch (e) {
                            console.log("Error fetching customer:", e);
                        }
                    }

                    // If paid, start success animations and timer to redirect
                    if (data.status === "paid") {
                        setIsPaid(true);

                        // SCALE POP
                        Animated.spring(scaleAnim, {
                            toValue: 1,
                            friction: 5,
                            useNativeDriver: true
                        }).start();

                        // PULSE LOOP
                        Animated.loop(
                            Animated.timing(pulseAnim, {
                                toValue: 1,
                                duration: 1500,
                                easing: Easing.out(Easing.ease),
                                useNativeDriver: true
                            })
                        ).start();

                        // Redirect to do-repair screen after 4 seconds
                        const timer = setTimeout(() => {
                            router.replace({
                                pathname: "/do-repair" as any,
                                params: { orderId }
                            });
                        }, 4000);

                        return () => clearTimeout(timer);
                    }
                }
            },
            (error) => {
                console.error("Error in waiting-payment-tech snapshot listener:", error);
            }
        );

        return () => unsub();
    }, [orderId]);

    const handleCancelOrder = async () => {
        if (orderId) {
            try {
                // Reset order back to "arrived" so technician can re-upload evidence
                // and customer is returned to service selection (pembayaran screen)
                await updateDoc(doc(db, "orders", orderId as string), {
                    status: "arrived"
                });
                router.replace({
                    pathname: "/upload-evidence" as any,
                    params: { orderId }
                });
            } catch (err) {
                console.log("Error going back:", err);
            }
        }
    };

    if (!order) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#B3875E" />
                <Text style={styles.loadingText}>Memuat data pesanan...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {!isPaid ? (
                // 1. MENUNGGU PEMBAYARAN STATE
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Menunggu Pembayaran</Text>
                    </View>

                    <View style={styles.progressContainer}>
                        <View style={styles.iconBgWaiting}>
                            <Ionicons name="hourglass-outline" size={36} color="#B3875E" />
                            <View style={styles.spinnerWrapper}>
                                <ActivityIndicator size="small" color="#B3875E" />
                            </View>
                        </View>
                        <Text style={styles.title}>Menunggu Pembayaran</Text>
                        <Text style={styles.desc}>
                            Tunggu sebentar, <Text style={{fontWeight: '700', color: '#333'}}>{customerName}</Text> sedang menyelesaikan pembayaran.
                        </Text>
                    </View>

                    {/* SERVICE SUMMARY CARD */}
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>Ringkasan Layanan</Text>
                        
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Transportasi & Pengecekan</Text>
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

                    {/* CANCEL LINK */}
                    <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelOrder}>
                        <Text style={styles.cancelText}>Batal / Terdapat Kesalahan</Text>
                    </TouchableOpacity>

                </ScrollView>
            ) : (
                // 2. PEMBAYARAN BERHASIL STATE
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
                                                outputRange: [1, 2]
                                            })
                                        }
                                    ],
                                    opacity: pulseAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.4, 0]
                                    })
                                }
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.circle,
                                {
                                    transform: [{ scale: scaleAnim }]
                                }
                            ]}
                        >
                            <Ionicons name="checkmark" size={40} color="#fff" />
                        </Animated.View>
                    </View>

                    <Text style={styles.successTitle}>Pembayaran Berhasil!</Text>
                    <Text style={styles.successDesc}>
                        Pelanggan berhasil membayar, mohon untuk melanjutkan perbaikan.
                    </Text>
                </View>
            )}
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
    header: {
        paddingVertical: 10,
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: Theme.colors.text,
    },
    progressContainer: {
        alignItems: "center",
        marginVertical: 20,
        paddingHorizontal: 20,
    },
    iconBgWaiting: {
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
        borderColor: "#FAF6F0",
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
        paddingHorizontal: 15,
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
        fontSize: 12,
        color: "#888",
        fontWeight: "700",
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
    cancelBtn: {
        marginVertical: 15,
    },
    cancelText: {
        fontSize: 13,
        color: Theme.colors.primary,
        fontWeight: "700",
        textDecorationLine: "underline",
    },

    // Success State Styles
    successContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    pulseContainer: {
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 30,
    },
    pulse: {
        position: "absolute",
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#5CB85C"
    },
    circle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#5CB85C",
        justifyContent: "center",
        alignItems: "center"
    },
    successTitle: {
        fontSize: 24,
        fontWeight: "900",
        color: Theme.colors.text,
        textAlign: "center",
        marginBottom: 15,
    },
    successDesc: {
        fontSize: 14,
        color: Theme.colors.textMuted,
        textAlign: "center",
        lineHeight: 22,
    },
});

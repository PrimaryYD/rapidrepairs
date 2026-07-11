import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Animated,
    Easing,
    ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// 🔥 FIREBASE
import { db } from "./_firebaseConfig";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";

import { Theme } from "../constants/theme";
import { useCustomAlert } from "../components/ui/GlobalAlertProvider";
import AnimatedButton from "../components/ui/AnimatedButton";

export default function SearchingScreen() {
    const router = useRouter();
    const { showAlert } = useCustomAlert();

    const [showModal, setShowModal] = useState(false);
    const [selected, setSelected] = useState("");

    const { orderId } = useLocalSearchParams();

    /* 🔥 ANIMATIONS */
    const pulseAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();

        // 🔁 LOOP ANIMATION
        Animated.loop(
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 2000,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            })
        ).start();

        // ⏳ LISTENER STATUS ORDER
        if (orderId) {
            const unsub = onSnapshot(
                doc(db, "orders", orderId as string), 
                (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.status === "accepted") {
                            // 👉 Navigate to tracking page for customer
                            router.replace({
                                pathname: "/found" as any,
                                params: { orderId }
                            });
                        } else if (data.status === "rejected") {
                            showAlert({
                                title: "Pesanan Ditolak",
                                message: "Teknisi menolak pesanan Anda. Silakan cari teknisi lain.",
                                type: "warning"
                            });
                            router.replace("/ac-services" as any);
                        }
                    }
                },
                (error) => {
                    console.error("Error in searching snapshot listener:", error);
                }
            );
            return () => unsub();
        }
    }, [orderId]);

    const reasons = [
        "Waktu tunggu terlalu lama",
        "Berubah pikiran",
        "Salah memasukkan detail alamat",
        "Menemukan teknisi lain",
        "Lainnya"
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
                    
                    {/* 🔥 PULSE WRAPPER */}
                    <View style={styles.pulseContainer}>
                        {/* PULSE */}
                        <Animated.View
                            style={[
                                styles.pulse,
                                {
                                    transform: [
                                        {
                                            scale: pulseAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [1, 2.5]
                                            })
                                        }
                                    ],
                                    opacity: pulseAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.6, 0]
                                    })
                                }
                            ]}
                        />

                        {/* CIRCLE UTAMA */}
                        <View style={styles.circleBig}>
                            <View style={styles.circleMid}>
                                <View style={styles.circleSmall}>
                                    <Ionicons name="build" size={32} color={Theme.colors.primary} />
                                </View>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.title}>Mencari Teknisi Terbaik</Text>
                    <Text style={styles.desc}>
                        Sedang mencocokkan Anda dengan{"\n"}teknisi terdekat untuk perbaikan cepat...
                    </Text>

                    <View style={styles.btnSearching}>
                        <Animated.View style={{ transform: [{ rotate: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }}>
                            <Ionicons name="reload" size={18} color={Theme.colors.primary} />
                        </Animated.View>
                        <Text style={styles.btnSearchingText}>Mencari Teknisi...</Text>
                    </View>

                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(true)}>
                        <Text style={styles.cancelText}>Batalkan Pencarian</Text>
                    </TouchableOpacity>

                    {/* 🔥 MODAL */}
                    <Modal
                        visible={showModal}
                        transparent
                        animationType="slide"
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalIndicator} />
                                <Text style={styles.modalTitle}>Alasan Pembatalan</Text>
                                <Text style={styles.modalSubtitle}>Beritahu kami alasan Anda membatalkan pencarian</Text>

                                <View style={styles.optionsContainer}>
                                    {reasons.map((item, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.option, selected === item && styles.optionSelected]}
                                            onPress={() => setSelected(item)}
                                        >
                                            <View style={[
                                                styles.radio,
                                                selected === item && styles.radioActive
                                            ]}>
                                                {selected === item && <View style={styles.radioInner} />}
                                            </View>
                                            <Text style={[styles.optionText, selected === item && styles.optionTextSelected]}>{item}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <AnimatedButton
                                    title="Batalkan Pesanan"
                                    onPress={async () => {
                                        if (!selected) {
                                            showAlert({ title: "Pilih Alasan", message: "Silakan pilih alasan pembatalan terlebih dahulu.", type: "warning" });
                                            return;
                                        }
                                        setShowModal(false);
                                        if (orderId) {
                                            try {
                                                await updateDoc(doc(db, "orders", orderId as string), {
                                                    status: "cancelled",
                                                    cancelReason: selected
                                                });
                                            } catch (e) {
                                                console.error("Error cancelling order:", e);
                                            }
                                        }
                                        router.replace("/ac-services" as any);
                                    }}
                                    style={styles.confirmBtn}
                                />
                                
                                <AnimatedButton
                                    title="Kembali Menunggu"
                                    onPress={() => setShowModal(false)}
                                    variant="outline"
                                    style={{ marginTop: Theme.spacing.sm }}
                                />
                            </View>
                        </View>
                    </Modal>

                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: Theme.spacing.xl,
    },

    /* 🔥 PULSE */
    pulseContainer: {
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 60,
        marginTop: 40,
    },
    pulse: {
        position: "absolute",
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: Theme.colors.primaryLight + '40', // 40 hex opacity
    },
    circleBig: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: Theme.colors.primaryLight + '20',
        justifyContent: "center",
        alignItems: "center",
    },
    circleMid: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Theme.colors.primaryLight,
        justifyContent: "center",
        alignItems: "center",
    },
    circleSmall: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: Theme.colors.surface,
        justifyContent: "center",
        alignItems: "center",
        ...Theme.shadows.md,
    },

    title: {
        ...Theme.typography.h2,
        color: Theme.colors.text,
        textAlign: "center",
        marginBottom: Theme.spacing.sm,
    },
    desc: {
        ...Theme.typography.body,
        color: Theme.colors.textMuted,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: Theme.spacing.xxl,
    },

    btnSearching: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: 'center',
        gap: Theme.spacing.sm,
        backgroundColor: Theme.colors.primaryLight + '30',
        paddingVertical: Theme.spacing.md,
        paddingHorizontal: Theme.spacing.xl,
        borderRadius: Theme.radius.full,
        marginBottom: Theme.spacing.xl,
        width: '100%',
        maxWidth: 250,
    },
    btnSearchingText: {
        ...Theme.typography.subtitle,
        color: Theme.colors.primaryDark,
    },

    cancelBtn: {
        padding: Theme.spacing.sm,
    },
    cancelText: {
        ...Theme.typography.body,
        color: Theme.colors.danger,
        fontWeight: "600",
    },

    /* MODAL */
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: Theme.colors.surface,
        borderTopLeftRadius: Theme.radius.xl,
        borderTopRightRadius: Theme.radius.xl,
        padding: Theme.spacing.xl,
        ...Theme.shadows.lg,
    },
    modalIndicator: {
        width: 40,
        height: 4,
        backgroundColor: Theme.colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: Theme.spacing.lg,
    },
    modalTitle: {
        ...Theme.typography.h3,
        color: Theme.colors.text,
        textAlign: "center",
        marginBottom: 4,
    },
    modalSubtitle: {
        ...Theme.typography.caption,
        color: Theme.colors.textMuted,
        textAlign: "center",
        marginBottom: Theme.spacing.lg,
    },
    optionsContainer: {
        marginBottom: Theme.spacing.lg,
    },
    option: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: Theme.spacing.md,
        paddingHorizontal: Theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
        borderRadius: Theme.radius.sm,
    },
    optionSelected: {
        backgroundColor: Theme.colors.danger + '10', // very light danger color
        borderBottomColor: 'transparent',
    },
    optionText: {
        ...Theme.typography.body,
        color: Theme.colors.text,
        marginLeft: Theme.spacing.md,
    },
    optionTextSelected: {
        color: Theme.colors.danger,
        fontWeight: '600',
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: Theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioActive: {
        borderColor: Theme.colors.danger,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Theme.colors.danger,
    },
    confirmBtn: {
        backgroundColor: Theme.colors.danger,
        marginTop: Theme.spacing.sm,
    },
});
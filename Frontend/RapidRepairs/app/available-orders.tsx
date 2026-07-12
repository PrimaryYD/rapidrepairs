import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// FIREBASE
import { auth, db } from "./_firebaseConfig";
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";

import { Theme } from "../constants/theme";
import AnimatedButton from "../components/ui/AnimatedButton";
import { useCustomAlert } from "../components/ui/GlobalAlertProvider";

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

export default function AvailableOrders() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { showAlert } = useCustomAlert();
    
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [techCoords, setTechCoords] = useState<{lat: number, lng: number} | null>(null);

    // Fetch tech coords to calculate distance
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;
        
        const fetchTechCoords = async () => {
            const techDoc = await getDoc(doc(db, "technicians", user.uid));
            if (techDoc.exists() && techDoc.data().coordinate) {
                setTechCoords(techDoc.data().coordinate);
            }
        };
        fetchTechCoords();
    }, []);

    // Listen to waiting orders
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
            collection(db, "orders"),
            where("technicianId", "==", user.uid),
            where("status", "==", "waiting")
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const list: any[] = [];
            snapshot.forEach((docSnap) => {
                list.push({ id: docSnap.id, ...docSnap.data() });
            });
            // Sort by newest first
            list.sort((a, b) => {
                const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return timeB - timeA;
            });
            setOrders(list);
            setLoading(false);
        });

        return () => unsub();
    }, []);

    const acceptOrder = async (orderId: string) => {
        try {
            await updateDoc(doc(db, "orders", orderId), {
                status: "accepted"
            });
            router.push({
                pathname: "/tracking-tech",
                params: { orderId }
            });
        } catch (error) {
            showAlert({title: "Gagal", message: "Gagal menerima pesanan.", type: "error"});
        }
    };

    const rejectOrder = async (orderId: string) => {
        try {
            // Setting status to rejected will remove it from this list
            await updateDoc(doc(db, "orders", orderId), {
                status: "rejected"
            });
        } catch (error) {
            showAlert({title: "Gagal", message: "Gagal menghapus pesanan.", type: "error"});
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 50) }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pesanan Tersedia</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={Theme.colors.primary} />
                </View>
            ) : orders.length === 0 ? (
                <View style={styles.centerBox}>
                    <Ionicons name="clipboard-outline" size={60} color={Theme.colors.border} />
                    <Text style={styles.emptyText}>Tidak ada pesanan baru saat ini.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {orders.map((item) => {
                        let displayDistance = "Jarak tidak diketahui";
                        let displayDuration = "? menit";
                        if (techCoords && item.location) {
                            const dist = getDistance(techCoords.lat, techCoords.lng, item.location.lat, item.location.lng) * 1.35;
                            displayDistance = `${dist.toFixed(1)} km`;
                            displayDuration = `${Math.ceil(dist * 3)} menit`;
                        }

                        return (
                            <View key={item.id} style={styles.card}>
                                {/* Header / Title */}
                                <View style={styles.cardHeaderRow}>
                                    <View style={styles.serviceBadge}>
                                        <Text style={styles.serviceBadgeText}>Pesanan Baru</Text>
                                    </View>
                                </View>

                                {/* Service Label */}
                                <Text style={styles.serviceTitle}>{item.serviceType || "Layanan Perbaikan AC"}</Text>

                                {/* Customer Address */}
                                <View style={styles.infoRow}>
                                    <Ionicons name="location-outline" size={20} color={Theme.colors.primary} />
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <Text style={styles.infoValue} numberOfLines={2}>{item.userAddress || "Alamat tidak tersedia"}</Text>
                                    </View>
                                </View>

                                {/* Customer Detail */}
                                <View style={styles.customerBox}>
                                    <View style={styles.avatar}>
                                        {item.userPhoto ? (
                                            <Image source={{ uri: item.userPhoto }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                                        ) : (
                                            <Ionicons name="person" size={20} color={Theme.colors.textMuted} />
                                        )}
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={styles.customerName}>{item.userName || "Pelanggan"}</Text>
                                        <Text style={styles.distanceText}>{displayDistance} ({displayDuration}) dari Anda</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                            <Ionicons name="star" size={12} color="#F1C40F" />
                                            <Text style={[styles.distanceText, { marginLeft: 4, marginTop: 0 }]}>
                                                {item.userRating ? `${item.userRating.toFixed(1)} (${item.userReviewsCount || 0} Ulasan)` : "5.0 (Pengguna Baru)"}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Actions */}
                                <View style={styles.actionRow}>
                                    <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectOrder(item.id)}>
                                        <Text style={styles.rejectText}>Tolak</Text>
                                    </TouchableOpacity>
                                    <View style={{ width: 12 }} />
                                    <View style={{ flex: 1 }}>
                                        <AnimatedButton 
                                            title="Terima Pesanan"
                                            onPress={() => acceptOrder(item.id)}
                                            style={{ marginVertical: 0 }}
                                        />
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Theme.spacing.lg,
        paddingBottom: Theme.spacing.md,
        backgroundColor: Theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Theme.colors.inputBg,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        ...Theme.typography.h3,
    },
    centerBox: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: Theme.spacing.xl,
    },
    emptyText: {
        ...Theme.typography.body,
        color: Theme.colors.textMuted,
        marginTop: Theme.spacing.md,
        textAlign: "center"
    },
    scrollContent: {
        padding: Theme.spacing.lg,
    },
    card: {
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radius.xl,
        padding: Theme.spacing.lg,
        marginBottom: Theme.spacing.lg,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: Theme.spacing.sm,
    },
    serviceBadge: {
        backgroundColor: Theme.colors.primaryLight + "20",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    serviceBadgeText: {
        ...Theme.typography.caption,
        color: Theme.colors.primaryDark,
        fontWeight: "bold",
    },
    serviceTitle: {
        ...Theme.typography.h3,
        marginBottom: Theme.spacing.md,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: Theme.spacing.md,
    },
    infoValue: {
        ...Theme.typography.body,
        color: Theme.colors.text,
    },
    customerBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Theme.colors.background,
        padding: Theme.spacing.md,
        borderRadius: Theme.radius.lg,
        marginBottom: Theme.spacing.lg,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Theme.colors.inputBg,
        justifyContent: "center",
        alignItems: "center",
    },
    customerName: {
        ...Theme.typography.subtitle,
    },
    distanceText: {
        ...Theme.typography.caption,
        color: Theme.colors.textMuted,
        marginTop: 2,
    },
    actionRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    rejectBtn: {
        flex: 1,
        height: 56,
        borderRadius: Theme.radius.xl,
        borderWidth: 2,
        borderColor: Theme.colors.danger,
        justifyContent: "center",
        alignItems: "center",
    },
    rejectText: {
        ...Theme.typography.button,
        color: Theme.colors.danger,
    },
});

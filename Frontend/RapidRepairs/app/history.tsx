import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// 🔥 FIREBASE
import { auth, db } from "./_firebaseConfig";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";

import { Theme } from "../constants/theme";
import { useCustomAlert } from "../components/ui/GlobalAlertProvider";
import AnimatedButton from "../components/ui/AnimatedButton";

export default function History() {
    const router = useRouter();
    const { showAlert } = useCustomAlert();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "orders"),
            where("userId", "==", user.uid)
        );

        const unsub = onSnapshot(
            q,
            (snapshot) => {
                const fetchedOrders: any[] = [];
                snapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    // Hanya tampilkan pesanan yang sudah selesai atau terkait garansi
                    if (
                        data.status === "completed" || 
                        data.status === "warranty_pending" ||
                        data.status === "warranty_approved"
                    ) {
                        fetchedOrders.push({ id: docSnap.id, ...data });
                    }
                });

                // Urutkan dari yang terbaru
                fetchedOrders.sort((a, b) => {
                    let timeA = 0;
                    if (a.completedAt) {
                        timeA = a.completedAt.toMillis ? a.completedAt.toMillis() : (typeof a.completedAt === 'number' ? a.completedAt : a.completedAt._seconds ? a.completedAt._seconds * 1000 : 0);
                    } else if (a.createdAt) {
                        timeA = a.createdAt.toMillis ? a.createdAt.toMillis() : (typeof a.createdAt === 'number' ? a.createdAt : a.createdAt._seconds ? a.createdAt._seconds * 1000 : 0);
                    }

                    let timeB = 0;
                    if (b.completedAt) {
                        timeB = b.completedAt.toMillis ? b.completedAt.toMillis() : (typeof b.completedAt === 'number' ? b.completedAt : b.completedAt._seconds ? b.completedAt._seconds * 1000 : 0);
                    } else if (b.createdAt) {
                        timeB = b.createdAt.toMillis ? b.createdAt.toMillis() : (typeof b.createdAt === 'number' ? b.createdAt : b.createdAt._seconds ? b.createdAt._seconds * 1000 : 0);
                    }

                    return timeB - timeA;
                });

                setOrders(fetchedOrders);
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching history:", err);
                setLoading(false);
                showAlert({
                    title: "Gagal Memuat Riwayat",
                    message: "Terjadi kesalahan saat mengambil riwayat pesanan Anda.",
                    type: "error"
                });
            }
        );

        return () => unsub();
    }, []);

    const handleClaimWarranty = (order: any) => {
        showAlert({
                    title: "Klaim Garansi",
                    message: "Apakah Anda yakin ingin mengajukan klaim garansi untuk perbaikan ini? Klaim akan diteruskan ke admin untuk disetujui.",
                    type: "info",
                    buttons: [
                        { text: "Batal", style: "cancel" },
                        { 
                            text: "Ajukan Klaim", 
                            onPress: async () => {
                try {
                    const orderRef = doc(db, "orders", order.id);
                    await updateDoc(orderRef, {
                        warranty_status: "pending_admin_approval",
                        status: "warranty_pending",
                        warrantyClaimedAt: serverTimestamp()
                    });
                    showAlert({
                        title: "Klaim Berhasil",
                        message: "Pengajuan klaim garansi berhasil dikirim ke Admin!",
                        type: "success"
                    });
                } catch (error: any) {
                    showAlert({
                        title: "Error",
                        message: error.message || "Gagal mengajukan garansi",
                        type: "error"
                    });
                }
            } 
                        }
                    ]
                });
    };

    const renderOrderItem = ({ item }: { item: any }) => {
        // Hitung selisih hari
        let daysPassed = 0;
        let isExpired = false;

        let timeCompleted = 0;
        if (item.completedAt) {
            timeCompleted = item.completedAt.toMillis ? item.completedAt.toMillis() : (typeof item.completedAt === 'number' ? item.completedAt : item.completedAt._seconds ? item.completedAt._seconds * 1000 : 0);
        } else if (item.createdAt) {
            timeCompleted = item.createdAt.toMillis ? item.createdAt.toMillis() : (typeof item.createdAt === 'number' ? item.createdAt : item.createdAt._seconds ? item.createdAt._seconds * 1000 : 0);
        }
        
        if (timeCompleted) {
            const diffMs = Date.now() - timeCompleted;
            daysPassed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            if (daysPassed >= 3) {
                isExpired = true;
            }
        }

        const isWarrantyPending = item.status === "warranty_pending" || item.warranty_status === "pending_admin_approval";
        const isWarrantyApproved = item.status === "warranty_approved" || item.warranty_status === "approved";

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.avatarPlaceholder}>
                        <Ionicons name="construct" size={24} color={Theme.colors.primary} />
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.serviceType}>{item.serviceType || "Layanan Perbaikan AC"}</Text>
                        <Text style={styles.techName}>Teknisi: {item.technicianName || "Unknown"}</Text>
                    </View>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>Selesai</Text>
                    </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={16} color={Theme.colors.textMuted} />
                        <Text style={styles.infoRowText}>
                            Selesai pada: {timeCompleted ? new Date(timeCompleted).toLocaleDateString("id-ID") : "-"}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="wallet-outline" size={16} color={Theme.colors.textMuted} />
                        <Text style={styles.infoRowText}>Total Pembayaran: Rp {item.totalBill?.toLocaleString("id-ID") || "0"}</Text>
                    </View>
                    
                    {/* Pesan Status Garansi */}
                    {isWarrantyPending && (
                        <View style={styles.warrantyMessagePending}>
                            <Ionicons name="time-outline" size={18} color={Theme.colors.warning} style={{marginRight: 8}} />
                            <Text style={styles.warrantyMessageTextPending}>Garansi sedang direview oleh Admin</Text>
                        </View>
                    )}
                    {isWarrantyApproved && (
                        <View style={styles.warrantyMessageApproved}>
                            <Ionicons name="checkmark-circle-outline" size={18} color={Theme.colors.success} style={{marginRight: 8}} />
                            <Text style={styles.warrantyMessageTextApproved}>Garansi Anda sudah di-approve, teknisi akan datang 2x24 jam.</Text>
                        </View>
                    )}
                </View>

                {/* Tombol Klaim Garansi */}
                {!isWarrantyPending && !isWarrantyApproved && (
                    <View style={styles.cardFooter}>
                        {isExpired ? (
                            <View style={[styles.warrantyBtn, styles.warrantyBtnExpired]}>
                                <Text style={styles.warrantyBtnTextExpired}>Garansi Expired</Text>
                            </View>
                        ) : (
                            <AnimatedButton
                                title={`Claim Garansi (${3 - daysPassed} hari tersisa)`}
                                onPress={() => handleClaimWarranty(item)}
                                icon={<Ionicons name="shield-checkmark-outline" size={18} color="#FFF" />}
                            />
                        )}
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.replace("/Homepage")} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Riwayat Pesanan</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Theme.colors.primary} />
                    <Text style={{ marginTop: Theme.spacing.sm, ...Theme.typography.body, color: Theme.colors.textMuted }}>Memuat riwayat...</Text>
                </View>
            ) : orders.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="receipt-outline" size={64} color={Theme.colors.textMuted} />
                    <Text style={styles.emptyTitle}>Tidak Ada Riwayat</Text>
                    <Text style={styles.emptySubtitle}>Anda belum memiliki pesanan yang telah selesai.</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
        backgroundColor: Theme.colors.surface,
        ...Theme.shadows.sm,
        zIndex: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Theme.colors.inputBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        ...Theme.typography.h3,
        color: Theme.colors.text,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: Theme.spacing.xl,
    },
    emptyTitle: {
        ...Theme.typography.h2,
        color: Theme.colors.text,
        marginTop: Theme.spacing.lg,
    },
    emptySubtitle: {
        ...Theme.typography.body,
        color: Theme.colors.textMuted,
        textAlign: "center",
        marginTop: Theme.spacing.sm,
    },
    listContent: {
        padding: Theme.spacing.lg,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radius.lg,
        marginBottom: Theme.spacing.lg,
        ...Theme.shadows.md,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        padding: Theme.spacing.md,
        backgroundColor: Theme.colors.surface,
        borderTopLeftRadius: Theme.radius.lg,
        borderTopRightRadius: Theme.radius.lg,
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Theme.colors.primaryLight + '20',
        justifyContent: "center",
        alignItems: "center",
        marginRight: Theme.spacing.md,
    },
    headerInfo: {
        flex: 1,
    },
    serviceType: {
        ...Theme.typography.subtitle,
        color: Theme.colors.text,
    },
    techName: {
        ...Theme.typography.caption,
        color: Theme.colors.textMuted,
        marginTop: 2,
    },
    statusBadge: {
        backgroundColor: Theme.colors.success + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Theme.radius.sm,
    },
    statusText: {
        fontSize: 10,
        color: Theme.colors.success,
        fontWeight: "600",
    },
    cardDivider: {
        height: 1,
        backgroundColor: Theme.colors.border,
    },
    cardBody: {
        padding: Theme.spacing.md,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: Theme.spacing.sm,
    },
    infoRowText: {
        marginLeft: Theme.spacing.sm,
        ...Theme.typography.body,
        color: Theme.colors.text,
    },
    warrantyMessagePending: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Theme.colors.warning + '10',
        padding: Theme.spacing.sm,
        borderRadius: Theme.radius.md,
        marginTop: Theme.spacing.sm,
        borderWidth: 1,
        borderColor: Theme.colors.warning + '30',
    },
    warrantyMessageTextPending: {
        ...Theme.typography.caption,
        color: Theme.colors.warning,
        fontWeight: "600",
    },
    warrantyMessageApproved: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Theme.colors.success + '10',
        padding: Theme.spacing.sm,
        borderRadius: Theme.radius.md,
        marginTop: Theme.spacing.sm,
        borderWidth: 1,
        borderColor: Theme.colors.success + '30',
    },
    warrantyMessageTextApproved: {
        ...Theme.typography.caption,
        color: Theme.colors.success,
        fontWeight: "600",
        flex: 1,
    },
    cardFooter: {
        padding: Theme.spacing.md,
        paddingTop: 0,
    },
    warrantyBtn: {
        backgroundColor: Theme.colors.primary,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        borderRadius: Theme.radius.md,
    },
    warrantyBtnExpired: {
        backgroundColor: Theme.colors.inputBg,
    },
    warrantyBtnTextExpired: {
        color: Theme.colors.textMuted,
        fontWeight: "600",
        fontSize: 14,
    },
});

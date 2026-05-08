import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    Modal
} from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// FIREBASE
import { auth, db } from "./_firebaseConfig";
import {
    doc,
    onSnapshot,
    updateDoc,
    collection,
    query,
    where
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function HomeTech() {

    const router = useRouter();

    const [isActive, setIsActive] = useState(false);
    const [incomingOrder, setIncomingOrder] = useState<any>(null);
    const [showPopup, setShowPopup] = useState(false);
    const [waitingOrdersCount, setWaitingOrdersCount] = useState(0);
    const [pageLoadTime] = useState(new Date());

    /* 🔥 STATUS AKTIF */
    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            if (!user) return;

            const ref = doc(db, "technicians", user.uid);

            const unsub = onSnapshot(ref, (docSnap) => {
                if (docSnap.exists()) {
                    setIsActive(docSnap.data().isActive ?? false);
                }
            });

            return () => unsub();
        });

        return () => unsubAuth();
    }, []);

    const toggleStatus = async (val: boolean) => {
        const user = auth.currentUser;
        if (!user) return;

        setIsActive(val);

        await updateDoc(doc(db, "technicians", user.uid), {
            isActive: val
        });
    };

    /* 🔔 LISTENER ORDER */
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
            collection(db, "orders"),
            where("technicianId", "==", user.uid),
            where("status", "==", "waiting")
        );

        const unsub = onSnapshot(q, (snapshot) => {
            // Update jumlah badge
            setWaitingOrdersCount(snapshot.size);

            // Pop-up hanya jika ada dokumen BARU (added), teknisi AKTIF, dan pesanan dibuat SETELAH halaman dibuka
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added" && isActive) {
                    const orderData = change.doc.data();
                    
                    // Konversi Firebase Timestamp ke Date
                    const orderTime = orderData.createdAt?.toDate ? orderData.createdAt.toDate() : new Date();

                    if (orderTime > pageLoadTime) {
                        setIncomingOrder({ id: change.doc.id, ...orderData });
                        setShowPopup(true);
                    }
                }
            });
        });

        return () => unsub();
    }, [isActive]);

    /* ✅ TERIMA */
    const acceptOrder = async () => {
        if (!incomingOrder) return;

        await updateDoc(doc(db, "orders", incomingOrder.id), {
            status: "accepted"
        });

        setShowPopup(false);

        router.push({
            pathname: "/tracking-tech",
            params: { orderId: incomingOrder.id }
        });
    };

    /* ❌ TOLAK */
    const rejectOrder = () => {
        setShowPopup(false);
        setIncomingOrder(null);
    };

    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.avatar} />
                    <Text style={styles.greeting}>Halo, Budi!</Text>
                </View>

                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Ionicons name="clipboard-outline" size={22} color="#333" />
                        {waitingOrdersCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{waitingOrdersCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <Ionicons name="notifications-outline" size={22} color="#333" />
                </View>
            </View>

            {/* STATUS CARD */}
            <View style={styles.statusCard}>

                <View style={styles.statusRow}>
                    <Text style={styles.statusText}>
                        Status Bekerja:{" "}
                        <Text style={{ color: isActive ? "#2ECC71" : "#E74C3C" }}>
                            {isActive ? "AKTIF" : "NONAKTIF"}
                        </Text>
                    </Text>

                    <Switch
                        value={isActive}
                        onValueChange={toggleStatus}
                        trackColor={{ false: "#ccc", true: "#2ECC71" }}
                        thumbColor="#fff"
                    />
                </View>

                <Text style={styles.statusDesc}>
                    {isActive
                        ? "Anda sedang mencari pesanan di sekitar Anda."
                        : "Aktifkan status untuk mulai menerima pesanan baru."}
                </Text>

                {!isActive && (
                    <TouchableOpacity
                        style={styles.startBtn}
                        onPress={() => toggleStatus(true)}
                    >
                        <Text style={styles.startBtnText}>Mulai Bekerja</Text>
                    </TouchableOpacity>
                )}

            </View>

            {/* RINGKASAN */}
            <Text style={styles.sectionTitle}>Ringkasan Hari Ini</Text>

            <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>PENDAPATAN</Text>
                    <Text style={styles.summaryValue}>Rp 350.000</Text>
                </View>

                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>SELESAI</Text>
                    <Text style={styles.summaryValue}>3 Pesanan</Text>
                </View>
            </View>

            {/* AKTIVITAS */}
            <Text style={styles.sectionTitle}>Aktivitas Terkini</Text>

            <View style={styles.activityCard}>
                <View style={styles.iconCircle}>
                    <Ionicons name="checkmark" size={16} color="#2ECC71" />
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={styles.activityTitle}>Cuci AC</Text>
                    <Text style={styles.activityTime}>Hari ini, 10:00 WIB</Text>
                </View>

                <Text style={styles.activityPrice}>+ Rp 75.000</Text>
            </View>

            <View style={styles.bottomBar}>

                <TouchableOpacity style={styles.navItemActive}>
                    <Ionicons name="home" size={20} color="#8B5E3C" />
                    <Text style={styles.navTextActive}>Beranda</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="time-outline" size={20} color="#999" />
                    <Text style={styles.navText}>Riwayat</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="briefcase-outline" size={20} color="#999" />
                    <Text style={styles.navText}>Dompet</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="person-outline" size={20} color="#999" />
                    <Text style={styles.navText}>Profil</Text>
                </TouchableOpacity>

            </View>

            {/* 🔔 MODAL PESANAN MASUK */}
            <Modal visible={showPopup} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.popup}>

                        <View style={styles.bellCircle}>
                            <Ionicons name="notifications" size={24} color="#8B5E3C" />
                        </View>

                        <Text style={styles.popupTitle}>Pesanan Baru Masuk!</Text>
                        <Text style={styles.popupSubtitle}>
                            Seseorang membutuhkan jasa Anda segera.
                        </Text>

                        {/* ALAMAT */}
                        <View style={styles.addressBoxPopup}>
                            <Ionicons name="location-outline" size={18} color="#8B5E3C" />
                            <View style={{ marginLeft: 8 }}>
                                <Text style={styles.labelPopup}>ALAMAT PELANGGAN</Text>
                                <Text style={styles.addressTextPopup}>
                                    {incomingOrder?.address || "Alamat tidak tersedia"}
                                </Text>
                            </View>
                        </View>

                        {/* CUSTOMER INFO */}
                        <View style={styles.customerInfo}>
                            <View style={styles.customerAvatar} />
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.customerName}>{incomingOrder?.userName || "Pelanggan"}</Text>
                                <Text style={styles.customerMeta}>📍 {incomingOrder?.distance ? incomingOrder.distance.toFixed(1) : "?.?"} km dari Anda</Text>
                                <View style={styles.ratingRow}>
                                    <Ionicons name="star" size={12} color="#F1C40F" />
                                    <Ionicons name="star" size={12} color="#F1C40F" />
                                    <Ionicons name="star" size={12} color="#F1C40F" />
                                    <Ionicons name="star" size={12} color="#F1C40F" />
                                    <Ionicons name="star-half" size={12} color="#F1C40F" />
                                    <Text style={styles.ratingText}>4.7 (35 Ulasan)</Text>
                                </View>
                            </View>
                        </View>

                        {/* LAYANAN */}
                        <View style={styles.serviceBox}>
                            <Text style={styles.labelPopup}>LAYANAN</Text>
                            <Text style={styles.serviceText}>Kunjungan & Pengecekan AC</Text>
                        </View>

                        {/* BUTTONS */}
                        <TouchableOpacity style={styles.acceptBtn} onPress={acceptOrder}>
                            <Text style={styles.acceptText}>Terima Pesanan</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.rejectBtn} onPress={rejectOrder}>
                            <Text style={styles.rejectText}>Tolak</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#F6F2EA",
        padding: 16,
        paddingBottom: 80 // 🔥 WAJIB
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20
    },

    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8
    },

    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#ddd"
    },

    greeting: {
        fontWeight: "600",
        fontSize: 15
    },

    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 15
    },

    iconBtn: {
        position: "relative"
    },

    badge: {
        position: "absolute",
        top: -5,
        right: -8,
        backgroundColor: "#E74C3C",
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: "#F6F2EA"
    },

    badgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "bold"
    },

    /* STATUS */
    statusCard: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        elevation: 3
    },

    statusRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },

    statusText: {
        fontWeight: "600"
    },

    statusDesc: {
        fontSize: 12,
        color: "#777",
        marginTop: 6
    },

    startBtn: {
        backgroundColor: "#8B5E3C",
        padding: 12,
        borderRadius: 25,
        alignItems: "center",
        marginTop: 10
    },

    startBtnText: {
        color: "#fff",
        fontWeight: "600"
    },

    /* SECTION */
    sectionTitle: {
        fontWeight: "600",
        marginBottom: 10
    },

    /* SUMMARY */
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20
    },

    summaryCard: {
        backgroundColor: "#EDE6DD",
        padding: 15,
        borderRadius: 14,
        width: "48%"
    },

    summaryLabel: {
        fontSize: 10,
        color: "#777"
    },

    summaryValue: {
        fontWeight: "700",
        marginTop: 5
    },

    /* ACTIVITY */
    activityCard: {
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 14,
        flexDirection: "row",
        alignItems: "center",
        elevation: 2
    },

    iconCircle: {
        width: 35,
        height: 35,
        borderRadius: 18,
        backgroundColor: "#E8F8F1",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10
    },

    activityTitle: {
        fontWeight: "600"
    },

    activityTime: {
        fontSize: 12,
        color: "#777"
    },

    activityPrice: {
        color: "#2ECC71",
        fontWeight: "600"
    },

    bottomBar: {
        position: "absolute",
        bottom: 10,
        left: 10,
        right: 10,
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: "#fff",
        paddingVertical: 12,
        borderRadius: 20,
        elevation: 5
    },

    navItem: {
        alignItems: "center"
    },

    navItemActive: {
        alignItems: "center"
    },

    navText: {
        fontSize: 10,
        color: "#999",
        marginTop: 3
    },

    navTextActive: {
        fontSize: 10,
        color: "#8B5E3C",
        marginTop: 3,
        fontWeight: "600"
    },

    /* 🔥 POPUP STYLES */
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        padding: 20
    },
    popup: {
        backgroundColor: "#fff",
        borderRadius: 30,
        padding: 24,
        alignItems: "center"
    },
    bellCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#F9F5F0",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#eee"
    },
    popupTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333"
    },
    popupSubtitle: {
        fontSize: 13,
        color: "#666",
        marginTop: 4,
        marginBottom: 20
    },
    addressBoxPopup: {
        flexDirection: "row",
        backgroundColor: "#F9F5F0",
        padding: 12,
        borderRadius: 16,
        width: "100%",
        marginBottom: 16,
        alignItems: "center"
    },
    labelPopup: {
        fontSize: 9,
        color: "#999",
        fontWeight: "bold",
        letterSpacing: 0.5
    },
    addressTextPopup: {
        fontSize: 12,
        fontWeight: "600",
        color: "#333",
        marginTop: 2
    },
    customerInfo: {
        flexDirection: "row",
        backgroundColor: "#FDF9F4",
        padding: 12,
        borderRadius: 16,
        width: "100%",
        marginBottom: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#F0E6D8"
    },
    customerAvatar: {
        width: 45,
        height: 45,
        borderRadius: 12,
        backgroundColor: "#ddd"
    },
    customerName: {
        fontWeight: "bold",
        fontSize: 14
    },
    customerMeta: {
        fontSize: 11,
        color: "#888",
        marginVertical: 2
    },
    ratingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2
    },
    ratingText: {
        fontSize: 10,
        color: "#555",
        marginLeft: 4
    },
    serviceBox: {
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 16,
        width: "100%",
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#eee"
    },
    serviceText: {
        fontSize: 13,
        fontWeight: "600",
        marginTop: 4
    },
    acceptBtn: {
        backgroundColor: "#C69E7C",
        width: "100%",
        padding: 16,
        borderRadius: 25,
        alignItems: "center",
        marginBottom: 12
    },
    acceptText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 15
    },
    rejectBtn: {
        backgroundColor: "#fff",
        width: "100%",
        padding: 16,
        borderRadius: 25,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#D1C4B5"
    },
    rejectText: {
        color: "#8B5E3C",
        fontWeight: "600"
    }
});
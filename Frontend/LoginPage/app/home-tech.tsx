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
            if (!snapshot.empty) {
                const order = snapshot.docs[0];
                setIncomingOrder({ id: order.id, ...order.data() });
                setShowPopup(true);
            }
        });

        return () => unsub();
    }, []);

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

            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.avatar} />
                    <Text style={styles.greeting}>Halo, Budi!</Text>
                </View>

                <Ionicons name="notifications-outline" size={22} />
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
    }
});
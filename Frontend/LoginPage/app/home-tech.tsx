import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    Modal,
    TextInput,
    PanResponder
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Location from "expo-location";

// FIREBASE
import { auth, db } from "./_firebaseConfig";
import {
    doc,
    onSnapshot,
    updateDoc,
    collection,
    query,
    where,
    addDoc,
    serverTimestamp
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

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

export default function HomeTech() {

    const router = useRouter();

    const [isActive, setIsActive] = useState(false);
    const [incomingOrder, setIncomingOrder] = useState<any>(null);
    const [showPopup, setShowPopup] = useState(false);
    const [startTime] = useState(Date.now());
    const [orderCount, setOrderCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);

    // Withdraw State
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");

    // Dynamic Dashboard State
    const [techName, setTechName] = useState("Teknisi");
    const [techCoords, setTechCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [todayIncome, setTodayIncome] = useState(0);
    const [todayCompleted, setTodayCompleted] = useState(0);
    const [todayOrders, setTodayOrders] = useState<any[]>([]);

    const recentActivities = [...todayOrders].sort((a, b) => b.time - a.time);

    // PanResponder for Modal
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10,
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 50) {
                    setShowWithdrawModal(false);
                }
            }
        })
    ).current;

    /* 🔥 STATUS AKTIF */
    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            if (!user) return;

            const ref = doc(db, "technicians", user.uid);

            const unsub = onSnapshot(
                ref, 
                (docSnap) => {
                    if (docSnap.exists()) {
                        setIsActive(docSnap.data().isActive ?? false);
                        setTechName(docSnap.data().name || "Teknisi");
                        if (docSnap.data().coordinate) {
                            setTechCoords(docSnap.data().coordinate);
                        }
                    }
                },
                (error) => {
                    console.error("Error in home-tech technician status snapshot:", error);
                }
            );

            return () => unsub();
        });

        return () => unsubAuth();
    }, []);

    const toggleStatus = async (val: boolean) => {
        const user = auth.currentUser;
        if (!user) return;

        setIsActive(val);

        let coordinate = null;

        if (val) {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                    alert("Izin lokasi diperlukan untuk menerima pesanan.");
                    setIsActive(false);
                    return;
                }

                let loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                coordinate = {
                    lat: loc.coords.latitude,
                    lng: loc.coords.longitude
                };
            } catch (error) {
                console.log("Error getting location:", error);
                alert("Gagal mengambil lokasi. Pastikan GPS aktif.");
                setIsActive(false);
                return;
            }
        }

        const updateData: any = { isActive: val };
        if (coordinate) {
            updateData.coordinate = coordinate;
            setTechCoords(coordinate);
        }

        await updateDoc(doc(db, "technicians", user.uid), updateData);
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

        const unsub = onSnapshot(
            q, 
            (snapshot) => {
                setOrderCount(snapshot.size);
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        const data = change.doc.data();
                        const createdAt = data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now();
                        
                        if (createdAt > startTime) {
                            setIncomingOrder({ id: change.doc.id, ...data });
                            setShowPopup(true);
                        }
                    }
                });
            },
            (error) => {
                console.error("Error in home-tech orders snapshot listener:", error);
            }
        );

        return () => unsub();
    }, []);

    /* 📊 LISTENER STATISTIK HARI INI */
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
            collection(db, "orders"),
            where("technicianId", "==", user.uid)
        );

        const unsub = onSnapshot(q, (snapshot) => {
            let income = 0;
            let completed = 0;
            let activities: any[] = [];

            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                
                let time = 0;
                if (data.completedAt?.toMillis) {
                    time = data.completedAt.toMillis();
                } else if (data.createdAt?.toMillis) {
                    time = data.createdAt.toMillis();
                }
                
                if (time >= startOfToday.getTime()) {
                    if (data.isWithdrawal) {
                        income -= (data.amount || 0);
                        activities.push({
                            id: docSnap.id,
                            serviceName: `Pencairan ke Bank ${data.bank || "BCA"}`,
                            time,
                            earned: -(data.amount || 0),
                            isReleased: true,
                            type: "withdrawal"
                        });
                    } else if (data.status === "completed" || data.escrowStatus === "released") {
                        completed += 1;
                        
                        let earned = 0;
                        if (data.escrowStatus === "released") {
                            earned = data.totalBill || 0;
                            income += earned;
                        }

                        activities.push({
                            id: docSnap.id,
                            serviceName: data.serviceType || "Layanan Perbaikan AC",
                            time,
                            earned,
                            isReleased: data.escrowStatus === "released",
                            type: "order"
                        });
                    }
                }
            });

            activities.sort((a, b) => b.time - a.time);
            setTodayIncome(income);
            setTodayCompleted(completed);
            setTodayOrders(activities);
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

    // Calculate distance and duration dynamically for the popup modal
    let displayDistance = "1.2 km";
    let displayDuration = "3 menit";

    if (techCoords && incomingOrder?.location) {
        const dist = getDistance(
            techCoords.lat,
            techCoords.lng,
            incomingOrder.location.lat,
            incomingOrder.location.lng
        );
        displayDistance = `${dist.toFixed(1)} km`;
        // Estimate duration based on speed: e.g. ~2.5 mins per km
        const estMinutes = Math.max(1, Math.round(dist * 2.5));
        displayDuration = `${estMinutes} menit`;
    }

    return (
        <View style={styles.container}>

            {/* HEADER */}
            <View style={styles.header}>
                <View style={[styles.headerLeft, { zIndex: 9999 }]}>
                    <View style={{ position: "relative" }}>
                        <TouchableOpacity 
                            style={styles.avatar}
                            onPress={() => setShowDropdown(!showDropdown)}
                        />
                        {showDropdown && (
                            <View style={styles.dropdown}>
                                <TouchableOpacity 
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setShowDropdown(false);
                                        alert("Account settings clicked");
                                    }}
                                >
                                    <Ionicons name="settings-outline" size={14} color="#333" style={{ marginRight: 6 }} />
                                    <Text style={styles.dropdownText}>Account Setting</Text>
                                </TouchableOpacity>
                                <View style={styles.dropdownSeparator} />
                                <TouchableOpacity 
                                    style={styles.dropdownItem}
                                    onPress={async () => {
                                        setShowDropdown(false);
                                        try {
                                            await signOut(auth);
                                            router.replace("/login" as any);
                                        } catch (e) {
                                            console.error("Logout error", e);
                                        }
                                    }}
                                >
                                    <Ionicons name="log-out-outline" size={14} color="#E74C3C" style={{ marginRight: 6 }} />
                                    <Text style={[styles.dropdownText, { color: "#E74C3C" }]}>Logout</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                    <Text style={styles.greeting}>Halo, {techName}!</Text>
                </View>

                <View style={styles.headerRight}>
                    {/* ORDER BADGE */}
                    <TouchableOpacity 
                        style={styles.notifBadge}
                        onPress={() => orderCount > 0 && setShowPopup(true)}
                    >
                        <Ionicons name="clipboard-outline" size={22} color="#333" />
                        {orderCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{orderCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={styles.notifBadge}>
                        <Ionicons name="notifications-outline" size={22} />
                        <View style={styles.redDot} />
                    </View>
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
                    <Text style={styles.summaryValue}>Rp {todayIncome.toLocaleString("id-ID")}</Text>
                    
                    <TouchableOpacity 
                        style={styles.tarikDanaBtn}
                        onPress={() => setShowWithdrawModal(true)}
                    >
                        <Text style={styles.tarikDanaText}>Tarik Dana</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>SELESAI</Text>
                    <Text style={styles.summaryValue}>{todayCompleted} Pesanan</Text>
                </View>
            </View>

            {/* AKTIVITAS */}
            <Text style={styles.sectionTitle}>Aktivitas Terkini</Text>

            {recentActivities.length > 0 ? (
                recentActivities.slice(0, 3).map((act) => (
                    <View key={act.id} style={styles.activityCard}>
                        <View style={[styles.iconCircle, act.type === "withdrawal" && { backgroundColor: "#FFF7E6" }]}>
                            {act.type === "withdrawal" ? (
                                <Ionicons name="arrow-up" size={16} color="#F39C12" style={{ transform: [{ rotate: "45deg" }] }} />
                            ) : (
                                <Ionicons name="arrow-down" size={16} color="#2ECC71" style={{ transform: [{ rotate: "45deg" }] }} />
                            )}
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.activityTitle}>{act.serviceName}</Text>
                            <Text style={styles.activityTime}>
                                Hari ini, {new Date(act.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </Text>
                        </View>

                        {act.type === "withdrawal" ? (
                            <Text style={[styles.activityPrice, { color: '#E74C3C' }]}>- Rp {Math.abs(act.earned).toLocaleString("id-ID")}</Text>
                        ) : act.isReleased ? (
                            <Text style={styles.activityPrice}>+ Rp {act.earned.toLocaleString("id-ID")}</Text>
                        ) : (
                            <Text style={[styles.activityPrice, { color: '#B3875E' }]}>Menunggu Cair</Text>
                        )}
                    </View>
                ))
            ) : (
                <Text style={{ textAlign: 'center', color: '#888', marginVertical: 20 }}>
                    Belum ada aktivitas hari ini.
                </Text>
            )}

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
            {/* 🔔 MODAL NOTIFIKASI ORDER */}
            <Modal
                visible={showPopup}
                transparent
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        
                        {/* FLOATING BELL */}
                        <View style={styles.bellCircle}>
                            <Ionicons name="notifications-outline" size={30} color="#8B5E3C" />
                        </View>

                        <Text style={styles.modalTitle}>Pesanan Baru Masuk!</Text>
                        <Text style={styles.modalSubtitle}>Seseorang membutuhkan jasa Anda segera...</Text>

                        {/* ADDRESS SECTION */}
                        <View style={styles.addressCard}>
                            <View style={styles.locationIcon}>
                                <Ionicons name="location-outline" size={20} color="#8B5E3C" />
                            </View>
                            <View>
                                <Text style={styles.addressLabel}>ALAMAT PELANGGAN</Text>
                                <Text style={styles.addressValue} numberOfLines={1}>
                                    {incomingOrder?.userAddress || "Jl. Kebahagiaan No. 123"}
                                </Text>
                            </View>
                        </View>

                        {/* CUSTOMER CARD */}
                        <View style={styles.customerCard}>
                            <View style={styles.customerAvatar}>
                                <Ionicons name="person" size={26} color="#ccc" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.customerName}>{incomingOrder?.userName || "Bryant"}</Text>
                                <View style={styles.customerMeta}>
                                    <Ionicons name="location-sharp" size={12} color="#8B5E3C" />
                                    <Text style={styles.metaText}>{displayDistance} ({displayDuration}) dari Anda</Text>
                                </View>
                                <View style={styles.ratingRow}>
                                    <Ionicons name="star" size={12} color="#F1C40F" />
                                    <Ionicons name="star" size={12} color="#F1C40F" />
                                    <Ionicons name="star" size={12} color="#F1C40F" />
                                    <Ionicons name="star" size={12} color="#F1C40F" />
                                    <Ionicons name="star-half" size={12} color="#F1C40F" />
                                    <Text style={styles.ratingText}>4.7 (115 Ulasan)</Text>
                                </View>
                            </View>
                        </View>

                        {/* SERVICE BOX */}
                        <View style={styles.serviceBox}>
                            <Text style={styles.serviceLabel}>LAYANAN</Text>
                            <View style={styles.serviceInner}>
                                <Text style={styles.serviceValue}>
                                    {incomingOrder?.serviceType || "Kunjungan & Pengecekan AC"}
                                </Text>
                            </View>
                        </View>

                        {/* BUTTONS */}
                        <TouchableOpacity style={styles.acceptBtnRedesign} onPress={acceptOrder}>
                            <Text style={styles.acceptBtnTextRedesign}>Terima Pesanan</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.rejectBtnRedesign} onPress={rejectOrder}>
                            <Text style={styles.rejectBtnTextRedesign}>Tolak</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>

            {/* 💰 MODAL TARIK DANA */}
            <Modal
                visible={showWithdrawModal}
                transparent
                animationType="slide"
            >
                <View style={styles.withdrawModalOverlay}>
                    <View style={styles.withdrawModalContent} {...panResponder.panHandlers}>
                        
                        <View style={styles.withdrawHandle} />

                        <Text style={styles.withdrawTitle}>Tarik Dana</Text>

                        <View style={styles.withdrawInputHeader}>
                            <Text style={styles.withdrawLabel}>Nominal Penarikan</Text>
                            <TouchableOpacity onPress={() => setWithdrawAmount(todayIncome.toString())}>
                                <Text style={styles.tarikSemuaText}>Tarik Semua</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.withdrawInputContainer}>
                            <Text style={styles.withdrawCurrency}>Rp </Text>
                            <TextInput
                                style={styles.withdrawInput}
                                keyboardType="numeric"
                                value={withdrawAmount}
                                onChangeText={setWithdrawAmount}
                                placeholder="0"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.bankCard}>
                            <View style={styles.bankLogoCircle}>
                                <Text style={styles.bankLogoText}>BCA</Text>
                            </View>
                            <View>
                                <Text style={styles.bankNameText}>BCA - 123456789</Text>
                                <Text style={styles.bankOwnerText}>a.n. Budi Santoso</Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.confirmWithdrawBtn}
                            onPress={async () => {
                                const amountStr = withdrawAmount || "0";
                                setShowWithdrawModal(false);
                                
                                const user = auth.currentUser;
                                if (user) {
                                    try {
                                        await addDoc(collection(db, "orders"), {
                                            technicianId: user.uid,
                                            isWithdrawal: true,
                                            amount: parseInt(amountStr),
                                            bank: "BCA",
                                            status: "processing",
                                            createdAt: serverTimestamp()
                                        });
                                    } catch (e) {
                                        console.log("Withdrawal save error", e);
                                    }
                                }

                                router.push({
                                    pathname: "/withdraw-processing",
                                    params: { amount: amountStr }
                                });
                                setWithdrawAmount("");
                            }}
                        >
                            <Text style={styles.confirmWithdrawText}>Konfirmasi Penarikan</Text>
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

    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12
    },

    avatar: {
        width: 35,
        height: 35,
        borderRadius: 18,
        backgroundColor: "#ddd"
    },

    greeting: {
        fontWeight: "600",
        fontSize: 15
    },

    notifBadge: {
        backgroundColor: "#fff",
        padding: 8,
        borderRadius: 20,
        elevation: 2,
        position: "relative"
    },

    badge: {
        position: "absolute",
        top: -4,
        right: -4,
        backgroundColor: "#E74C3C",
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#fff"
    },

    badgeText: {
        color: "#fff",
        fontSize: 9,
        fontWeight: "bold"
    },

    redDot: {
        position: "absolute",
        top: 8,
        right: 8,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#E74C3C"
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
        elevation: 2,
        marginBottom: 12
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

    /* MODAL REDESIGN */
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center"
    },
    modalContent: {
        backgroundColor: "#fff",
        width: "90%",
        borderRadius: 30,
        padding: 25,
        paddingTop: 40,
        alignItems: "center",
        elevation: 10
    },
    bellCircle: {
        position: "absolute",
        top: -30,
        backgroundColor: "#fff",
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
        borderWidth: 1,
        borderColor: "#eee"
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
        marginTop: 10
    },
    modalSubtitle: {
        fontSize: 12,
        color: "#777",
        textAlign: "center",
        marginTop: 5,
        marginBottom: 20
    },
    addressCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 20,
        width: "100%",
        borderWidth: 1,
        borderColor: "#f0f0f0",
        marginBottom: 15,
        elevation: 2
    },
    locationIcon: {
        width: 40,
        height: 40,
        backgroundColor: "#F9F6F2",
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12
    },
    addressLabel: {
        fontSize: 10,
        color: "#999",
        fontWeight: "bold"
    },
    addressValue: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#333",
        width: 200
    },
    customerCard: {
        flexDirection: "row",
        backgroundColor: "#F9F6F2",
        padding: 15,
        borderRadius: 20,
        width: "100%",
        marginBottom: 15
    },
    customerAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15
    },
    customerName: {
        fontWeight: "bold",
        fontSize: 16
    },
    customerMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 2
    },
    metaText: {
        fontSize: 11,
        color: "#777"
    },
    ratingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        marginTop: 4
    },
    ratingText: {
        fontSize: 11,
        color: "#777",
        marginLeft: 5
    },
    serviceBox: {
        width: "100%",
        marginBottom: 20
    },
    serviceLabel: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#999",
        marginLeft: 10,
        marginBottom: 5
    },
    serviceInner: {
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#f0f0f0"
    },
    serviceValue: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#333"
    },
    acceptBtnRedesign: {
        backgroundColor: "#C5A880",
        width: "100%",
        paddingVertical: 15,
        borderRadius: 20,
        alignItems: "center",
        marginBottom: 10
    },
    acceptBtnTextRedesign: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 15
    },
    rejectBtnRedesign: {
        width: "100%",
        paddingVertical: 15,
        borderRadius: 20,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#C5A880"
    },
    rejectBtnTextRedesign: {
        color: "#C5A880",
        fontWeight: "bold",
        fontSize: 15
    },
    dropdown: {
        position: "absolute",
        left: 0,
        top: 40,
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 6,
        width: 140,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 10000,
        borderWidth: 1,
        borderColor: "#eee"
    },
    dropdownItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 8
    },
    dropdownText: {
        fontSize: 12,
        color: "#333",
        fontWeight: "500"
    },
    dropdownSeparator: {
        height: 1,
        backgroundColor: "#eee",
        marginVertical: 2
    },

    /* TARIK DANA STYLES */
    tarikDanaBtn: {
        backgroundColor: "#8B5E3C",
        paddingVertical: 8,
        borderRadius: 10,
        marginTop: 10,
        alignItems: "center"
    },
    tarikDanaText: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "600"
    },
    withdrawModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end"
    },
    withdrawModalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 25,
        alignItems: "center",
        elevation: 10
    },
    withdrawHandle: {
        width: 40,
        height: 4,
        backgroundColor: "#ccc",
        borderRadius: 2,
        marginBottom: 20
    },
    withdrawTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 25
    },
    withdrawInputHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginBottom: 10
    },
    withdrawLabel: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#777"
    },
    tarikSemuaText: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#8B5E3C"
    },
    withdrawInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F9F6F2",
        borderRadius: 15,
        paddingHorizontal: 15,
        paddingVertical: 12,
        width: "100%",
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#EBE3D5"
    },
    withdrawCurrency: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333"
    },
    withdrawInput: {
        flex: 1,
        fontSize: 18,
        fontWeight: "bold",
        color: "#333"
    },
    bankCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F9F6F2",
        borderRadius: 15,
        padding: 15,
        width: "100%",
        marginBottom: 30,
        borderWidth: 1,
        borderColor: "#EBE3D5"
    },
    bankLogoCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15,
        borderWidth: 1,
        borderColor: "#eee"
    },
    bankLogoText: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#006699"
    },
    bankNameText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#333"
    },
    bankOwnerText: {
        fontSize: 11,
        color: "#777",
        marginTop: 2
    },
    confirmWithdrawBtn: {
        backgroundColor: "#8B5E3C",
        width: "100%",
        paddingVertical: 15,
        borderRadius: 20,
        alignItems: "center"
    },
    confirmWithdrawText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 15
    }
});
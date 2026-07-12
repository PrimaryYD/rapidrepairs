import {
  BackHandler,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    Modal,
    TextInput,
    PanResponder,
    Image,
    ScrollView
} from "react-native";
import { useState, useEffect, useRef, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused, useFocusEffect } from "@react-navigation/native";

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

import { Theme } from "../constants/theme";
import { useCustomAlert } from "../components/ui/GlobalAlertProvider";
import AnimatedButton from "../components/ui/AnimatedButton";

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
    const { showAlert, showConfirm } = useCustomAlert();

    const [isActive, setIsActive] = useState(false);
    const [stats, setStats] = useState({ income: 0, completed: 0 });
    const isFocused = useIsFocused();
    const [incomingOrder, setIncomingOrder] = useState<any>(null);
    const [showPopup, setShowPopup] = useState(false);
    const [orderCount, setOrderCount] = useState(0);
    const [profilePic, setProfilePic] = useState<string | null>(null);
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
    
  // 🔥 MENCEGAH TOMBOL BACK KEMBALI KE LOGIN
  useEffect(() => {
    const backAction = () => {
      showAlert({
        title: "Keluar Aplikasi",
        message: "Apakah Anda yakin ingin keluar dari aplikasi?",
        type: "warning",
        buttons: [
          { text: "Batal", style: "cancel" },
          { text: "Keluar", onPress: () => BackHandler.exitApp() }
        ]
      });
      return true; // Mencegah perilaku default (kembali ke layar sebelumnya)
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

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
                        setProfilePic(docSnap.data().profilePictureUrl || null);
                        if (docSnap.data().coordinate) {
                            setTechCoords(docSnap.data().coordinate);
                        }
                    }
                },
                (error) => {
                    console.log("Error in home-tech technician status snapshot:", error);
                }
            );

            return () => unsub();
        });

        return () => unsubAuth();
    }, []);

    // (useFocusEffect removed — technician only goes offline if they toggle it or switch to User mode)

    const toggleStatus = async (val: boolean) => {
        const user = auth.currentUser;
        if (!user) return;

        setIsActive(val);

        const fetchLocationOrDeactivate = async () => {
            try {
                let loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                return {
                    lat: loc.coords.latitude,
                    lng: loc.coords.longitude
                };
            } catch (error) {
                console.log("Error getting location:", error);
                showAlert({ title: "Gagal Mengambil Lokasi", message: "Pastikan GPS Anda aktif.", type: "error" });
                setIsActive(false);
                return null;
            }
        };

        let coordinate = null;

        if (val) {
            const current = await Location.getForegroundPermissionsAsync();
            if (current.status === "granted") {
                const loc = await fetchLocationOrDeactivate();
                if (!loc) return;
                coordinate = loc;
            } else {
                // Must wrap in a promise to wait for user interaction, or restructure.
                // Since this is a toggle, if we show a popup, we might need to set the switch back temporarily 
                // until they agree. But for simplicity, we'll wait for the confirmation.
                const proceed = await new Promise((resolve) => {
                    showConfirm({
                        title: "Akses Lokasi",
                        message: "Rapid Repairs membutuhkan izin lokasi agar pelanggan dapat menemukan Anda saat Anda aktif.",
                        onConfirm: async () => {
                            const { status } = await Location.requestForegroundPermissionsAsync();
                            if (status === "granted") {
                                resolve(true);
                            } else {
                                showAlert({ title: "Izin Diperlukan", message: "Izin lokasi diperlukan. Anda dapat mengaktifkannya di Pengaturan HP Anda.", type: "warning" });
                                resolve(false);
                            }
                        },
                        onCancel: () => resolve(false)
                    });
                });

                if (proceed) {
                    const loc = await fetchLocationOrDeactivate();
                    if (!loc) return;
                    coordinate = loc;
                } else {
                    setIsActive(false);
                    return;
                }
            }
        }

        const updateData: any = { isActive: val };
        if (coordinate) {
            updateData.coordinate = coordinate;
            setTechCoords(coordinate);
        }

        await updateDoc(doc(db, "technicians", user.uid), updateData);
    };

    const isFirstLoad = useRef(true);

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
                
                const wasFirstLoad = isFirstLoad.current;
                if (isFirstLoad.current) {
                    isFirstLoad.current = false;
                }

                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        const data = change.doc.data();
                        
                        let timeMillis = 0;
                        if (data.createdAt?.toMillis) {
                            timeMillis = data.createdAt.toMillis();
                        }
                        
                        // If it's a real-time event (not first load), it's definitely new.
                        // If it's first load, check if it's less than 10 minutes old to account for clock drift, network latency, and app backgrounding.
                        const isBrandNew = (!wasFirstLoad) || (timeMillis > 0 && Math.abs(Date.now() - timeMillis) < 600000);
                        
                        if (isBrandNew) {
                            setIncomingOrder({ id: change.doc.id, ...data });
                            setShowPopup(true);
                        }
                    }
                });
            },
            (error) => {
                console.log("Error in home-tech orders snapshot listener:", error);
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

        router.replace({
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
        ) * 1.35;
        displayDistance = `${dist.toFixed(1)} km`;
        // Estimate duration based on speed: e.g. ~2.5 mins per km
        const estMinutes = Math.max(1, Math.round(dist * 2.5));
        displayDuration = `${estMinutes} menit`;
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* HEADER */}
                <View style={styles.header}>
                    <View style={[styles.headerLeft, { zIndex: 9999 }]}>
                        <View style={{ position: "relative" }}>
                            <TouchableOpacity 
                                style={styles.avatar}
                                onPress={() => setShowDropdown(!showDropdown)}
                            >
                                {profilePic ? (
                                    <Image source={{ uri: profilePic }} style={styles.avatarImage} />
                                ) : (
                                    <Ionicons name="person" size={18} color={Theme.colors.textMuted} />
                                )}
                            </TouchableOpacity>
                            {showDropdown && (
                                <View style={styles.dropdown}>
                                    <TouchableOpacity 
                                        style={styles.dropdownItem}
                                        onPress={() => {
                                            setShowDropdown(false);
                                            router.push({
                                                pathname: "/profile-settings" as any,
                                                params: { from: "home-tech" }
                                            });
                                        }}
                                    >
                                        <Ionicons name="settings-outline" size={16} color={Theme.colors.text} style={{ marginRight: 8 }} />
                                        <Text style={styles.dropdownText}>Pengaturan Akun</Text>
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
                                        <Ionicons name="log-out-outline" size={16} color={Theme.colors.danger} style={{ marginRight: 8 }} />
                                        <Text style={[styles.dropdownText, { color: Theme.colors.danger }]}>Keluar</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                        <Text style={styles.greeting}>Halo, {techName}!</Text>
                    </View>

                    <View style={styles.headerRight}>
                        {/* CUSTOMER HOME */}
                        <TouchableOpacity 
                            style={styles.notifBadge}
                            onPress={async () => {
                                const user = auth.currentUser;
                                if (user && isActive) {
                                    setIsActive(false);
                                    await updateDoc(doc(db, "technicians", user.uid), { isActive: false });
                                }
                                router.replace("/Homepage" as any);
                            }}
                        >
                            <Ionicons name="home-outline" size={22} color={Theme.colors.text} />
                        </TouchableOpacity>

                        {/* NOTIFICATIONS & AVAILABLE ORDERS */}
                        <TouchableOpacity 
                            style={styles.notifBadge}
                            onPress={() => router.push("/available-orders" as any)}
                        >
                            <Ionicons name="notifications-outline" size={22} color={Theme.colors.text} />
                            {orderCount > 0 ? (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{orderCount}</Text>
                                </View>
                            ) : (
                                <View style={styles.redDot} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* STATUS CARD */}
                <View style={styles.statusCard}>
                    <View style={styles.statusRow}>
                        <Text style={styles.statusText}>
                            Status Bekerja:{" "}
                            <Text style={{ color: isActive ? Theme.colors.success : Theme.colors.danger }}>
                                {isActive ? "AKTIF" : "NONAKTIF"}
                            </Text>
                        </Text>

                        <Switch
                            value={isActive}
                            onValueChange={toggleStatus}
                            trackColor={{ false: Theme.colors.border, true: Theme.colors.success }}
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
                            <View style={[styles.iconCircle, act.type === "withdrawal" && { backgroundColor: Theme.colors.warning + '15' }]}>
                                {act.type === "withdrawal" ? (
                                    <Ionicons name="arrow-up" size={16} color={Theme.colors.warning} style={{ transform: [{ rotate: "45deg" }] }} />
                                ) : (
                                    <Ionicons name="arrow-down" size={16} color={Theme.colors.success} style={{ transform: [{ rotate: "45deg" }] }} />
                                )}
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.activityTitle}>{act.serviceName}</Text>
                                <Text style={styles.activityTime}>
                                    Hari ini, {new Date(act.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                </Text>
                            </View>

                            {act.type === "withdrawal" ? (
                                <Text style={[styles.activityPrice, { color: Theme.colors.danger }]}>- Rp {Math.abs(act.earned).toLocaleString("id-ID")}</Text>
                            ) : act.isReleased ? (
                                <Text style={styles.activityPrice}>+ Rp {act.earned.toLocaleString("id-ID")}</Text>
                            ) : (
                                <Text style={[styles.activityPrice, { color: Theme.colors.primary }]}>Menunggu Cair</Text>
                            )}
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>
                        Belum ada aktivitas hari ini.
                    </Text>
                )}

            </ScrollView>

            {/* BOTTOM NAV BAR */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.navItemActive}>
                    <Ionicons name="home" size={24} color={Theme.colors.primary} />
                    <Text style={styles.navTextActive}>Beranda</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="time-outline" size={24} color={Theme.colors.textMuted} />
                    <Text style={styles.navText}>Riwayat</Text>
                </TouchableOpacity>
            </View>

            {/* 🔔 MODAL NOTIFIKASI ORDER */}
            <Modal
                visible={showPopup && isFocused}
                transparent
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        
                        {/* FLOATING BELL */}
                        <View style={styles.bellCircle}>
                            <Ionicons name="notifications-outline" size={32} color={Theme.colors.primary} />
                        </View>

                        <Text style={styles.modalTitle}>Pesanan Baru Masuk!</Text>
                        <Text style={styles.modalSubtitle}>Seseorang membutuhkan jasa Anda segera...</Text>

                        {/* ADDRESS SECTION */}
                        <View style={styles.addressCard}>
                            <View style={styles.locationIcon}>
                                <Ionicons name="location-outline" size={20} color={Theme.colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.addressLabel}>ALAMAT PELANGGAN</Text>
                                <Text style={styles.addressValue} numberOfLines={2}>
                                    {incomingOrder?.userAddress || "Jl. Kebahagiaan No. 123"}
                                </Text>
                            </View>
                        </View>

                        {/* CUSTOMER CARD */}
                        <View style={styles.customerCard}>
                            <View style={styles.customerAvatar}>
                                {incomingOrder?.userPhoto ? (
                                    <Image source={{ uri: incomingOrder.userPhoto }} style={{ width: 52, height: 52, borderRadius: 26 }} />
                                ) : (
                                    <Ionicons name="person" size={26} color={Theme.colors.textMuted} />
                                )}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.customerName}>{incomingOrder?.userName || "Pelanggan"}</Text>
                                <View style={styles.customerMeta}>
                                    <Ionicons name="location-sharp" size={12} color={Theme.colors.primary} />
                                    <Text style={styles.metaText}>{displayDistance} ({displayDuration}) dari Anda</Text>
                                </View>
                                <View style={styles.ratingRow}>
                                    <Ionicons name="star" size={12} color="#F1C40F" />
                                    <Text style={styles.ratingText}>
                                        {incomingOrder?.userRating ? `${incomingOrder.userRating.toFixed(1)} (${incomingOrder.userReviewsCount || 0} Ulasan)` : "5.0 (Pengguna Baru)"}
                                    </Text>
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
                        <AnimatedButton
                            title="Terima Pesanan"
                            onPress={acceptOrder}
                            style={{ marginBottom: Theme.spacing.sm, width: '100%' }}
                        />
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
                                placeholderTextColor={Theme.colors.textMuted}
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

                        <AnimatedButton
                            title="Konfirmasi Penarikan"
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
                            style={{ width: '100%' }}
                        />

                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    scrollContent: {
        padding: Theme.spacing.lg,
        paddingBottom: 100, // Make room for bottom bar
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: Theme.spacing.xl,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: Theme.spacing.sm,
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: Theme.spacing.md,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Theme.colors.inputBg,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    avatarImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    greeting: {
        ...Theme.typography.h3,
        color: Theme.colors.text,
    },
    notifBadge: {
        backgroundColor: Theme.colors.surface,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        ...Theme.shadows.sm,
        position: "relative",
    },
    badge: {
        position: "absolute",
        top: -4,
        right: -4,
        backgroundColor: Theme.colors.danger,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: Theme.colors.surface,
    },
    badgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "bold",
    },
    redDot: {
        position: "absolute",
        top: 10,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Theme.colors.danger,
    },
    /* STATUS */
    statusCard: {
        backgroundColor: Theme.colors.surface,
        padding: Theme.spacing.lg,
        borderRadius: Theme.radius.xl,
        marginBottom: Theme.spacing.xl,
        ...Theme.shadows.md,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    statusRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    statusText: {
        ...Theme.typography.subtitle,
        color: Theme.colors.text,
    },
    statusDesc: {
        ...Theme.typography.body,
        color: Theme.colors.textMuted,
        marginTop: Theme.spacing.sm,
    },
    startBtn: {
        backgroundColor: Theme.colors.primary,
        paddingVertical: 14,
        borderRadius: Theme.radius.lg,
        alignItems: "center",
        marginTop: Theme.spacing.md,
    },
    startBtnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },
    /* SECTION */
    sectionTitle: {
        ...Theme.typography.h3,
        color: Theme.colors.text,
        marginBottom: Theme.spacing.md,
    },
    /* SUMMARY */
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: Theme.spacing.xl,
    },
    summaryCard: {
        backgroundColor: Theme.colors.primaryLight + '20',
        padding: Theme.spacing.lg,
        borderRadius: Theme.radius.lg,
        width: "48%",
        borderWidth: 1,
        borderColor: Theme.colors.primaryLight + '40',
    },
    summaryLabel: {
        ...Theme.typography.caption,
        color: Theme.colors.textMuted,
        fontWeight: "600",
    },
    summaryValue: {
        ...Theme.typography.h3,
        color: Theme.colors.text,
        marginTop: Theme.spacing.xs,
        marginBottom: Theme.spacing.sm,
    },
    tarikDanaBtn: {
        backgroundColor: Theme.colors.primary,
        paddingVertical: 8,
        borderRadius: Theme.radius.md,
        alignItems: "center",
    },
    tarikDanaText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },
    /* ACTIVITY */
    activityCard: {
        backgroundColor: Theme.colors.surface,
        padding: Theme.spacing.md,
        borderRadius: Theme.radius.lg,
        flexDirection: "row",
        alignItems: "center",
        ...Theme.shadows.sm,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        marginBottom: Theme.spacing.md,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Theme.colors.success + '15',
        justifyContent: "center",
        alignItems: "center",
        marginRight: Theme.spacing.md,
    },
    activityTitle: {
        ...Theme.typography.subtitle,
        color: Theme.colors.text,
    },
    activityTime: {
        ...Theme.typography.caption,
        color: Theme.colors.textMuted,
        marginTop: 2,
    },
    activityPrice: {
        color: Theme.colors.success,
        fontWeight: "700",
        fontSize: 14,
    },
    emptyText: {
        textAlign: 'center',
        ...Theme.typography.body,
        color: Theme.colors.textMuted,
        marginVertical: Theme.spacing.xl,
    },
    /* BOTTOM NAV */
    bottomBar: {
        position: "absolute",
        bottom: 24,
        left: 24,
        right: 24,
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        paddingVertical: 16,
        borderRadius: 30,
        ...Theme.shadows.lg,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.5)",
    },
    navItem: {
        alignItems: "center",
        opacity: 0.5,
    },
    navItemActive: {
        alignItems: "center",
        opacity: 1,
    },
    navText: {
        fontSize: 12,
        color: Theme.colors.textMuted,
        marginTop: 4,
        fontWeight: "500",
    },
    navTextActive: {
        fontSize: 12,
        color: Theme.colors.primary,
        marginTop: 4,
        fontWeight: "700",
    },
    /* MODAL REDESIGN */
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: Theme.spacing.lg,
    },
    modalContent: {
        backgroundColor: Theme.colors.surface,
        width: "100%",
        borderRadius: Theme.radius.xl,
        padding: Theme.spacing.xl,
        paddingTop: 45,
        alignItems: "center",
        ...Theme.shadows.lg,
    },
    bellCircle: {
        position: "absolute",
        top: -35,
        backgroundColor: Theme.colors.surface,
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: "center",
        alignItems: "center",
        ...Theme.shadows.md,
        borderWidth: 4,
        borderColor: Theme.colors.background,
    },
    modalTitle: {
        ...Theme.typography.h2,
        color: Theme.colors.text,
        marginTop: Theme.spacing.sm,
    },
    modalSubtitle: {
        ...Theme.typography.body,
        color: Theme.colors.textMuted,
        textAlign: "center",
        marginTop: Theme.spacing.xs,
        marginBottom: Theme.spacing.lg,
    },
    addressCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Theme.colors.background,
        padding: Theme.spacing.md,
        borderRadius: Theme.radius.lg,
        width: "100%",
        borderWidth: 1,
        borderColor: Theme.colors.border,
        marginBottom: Theme.spacing.md,
    },
    locationIcon: {
        width: 44,
        height: 44,
        backgroundColor: Theme.colors.primaryLight + '20',
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
        marginRight: Theme.spacing.md,
    },
    addressLabel: {
        ...Theme.typography.caption,
        color: Theme.colors.textMuted,
        fontWeight: "700",
        marginBottom: 2,
    },
    addressValue: {
        ...Theme.typography.subtitle,
        color: Theme.colors.text,
    },
    customerCard: {
        flexDirection: "row",
        backgroundColor: Theme.colors.background,
        padding: Theme.spacing.md,
        borderRadius: Theme.radius.lg,
        width: "100%",
        marginBottom: Theme.spacing.md,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    customerAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Theme.colors.inputBg,
        justifyContent: "center",
        alignItems: "center",
        marginRight: Theme.spacing.md,
    },
    customerName: {
        ...Theme.typography.subtitle,
        color: Theme.colors.text,
    },
    customerMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 4,
    },
    metaText: {
        ...Theme.typography.caption,
        color: Theme.colors.textMuted,
    },
    ratingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        marginTop: 6,
    },
    ratingText: {
        ...Theme.typography.caption,
        color: Theme.colors.textMuted,
        marginLeft: Theme.spacing.xs,
    },
    serviceBox: {
        width: "100%",
        marginBottom: Theme.spacing.xl,
    },
    serviceLabel: {
        ...Theme.typography.caption,
        color: Theme.colors.textMuted,
        fontWeight: "700",
        marginLeft: Theme.spacing.xs,
        marginBottom: Theme.spacing.xs,
    },
    serviceInner: {
        backgroundColor: Theme.colors.surface,
        padding: Theme.spacing.md,
        borderRadius: Theme.radius.lg,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    serviceValue: {
        ...Theme.typography.subtitle,
        color: Theme.colors.text,
    },
    rejectBtnRedesign: {
        width: "100%",
        paddingVertical: 16,
        borderRadius: Theme.radius.lg,
        alignItems: "center",
        borderWidth: 2,
        borderColor: Theme.colors.border,
    },
    rejectBtnTextRedesign: {
        color: Theme.colors.text,
        fontWeight: "700",
        fontSize: 16,
    },
    dropdown: {
        position: "absolute",
        left: 0,
        top: 50,
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radius.lg,
        padding: Theme.spacing.xs,
        width: 180,
        ...Theme.shadows.lg,
        zIndex: 10000,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    dropdownItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: Theme.spacing.sm,
        borderRadius: Theme.radius.sm,
    },
    dropdownText: {
        ...Theme.typography.body,
        color: Theme.colors.text,
        fontWeight: "500",
    },
    dropdownSeparator: {
        height: 1,
        backgroundColor: Theme.colors.border,
        marginVertical: 4,
    },
    /* TARIK DANA STYLES */
    withdrawModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    withdrawModalContent: {
        backgroundColor: Theme.colors.surface,
        borderTopLeftRadius: Theme.radius.xl,
        borderTopRightRadius: Theme.radius.xl,
        padding: Theme.spacing.xl,
        alignItems: "center",
        ...Theme.shadows.lg,
    },
    withdrawHandle: {
        width: 48,
        height: 6,
        backgroundColor: Theme.colors.border,
        borderRadius: 3,
        marginBottom: Theme.spacing.xl,
    },
    withdrawTitle: {
        ...Theme.typography.h2,
        color: Theme.colors.text,
        marginBottom: Theme.spacing.xl,
    },
    withdrawInputHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginBottom: Theme.spacing.sm,
    },
    withdrawLabel: {
        ...Theme.typography.subtitle,
        color: Theme.colors.text,
    },
    tarikSemuaText: {
        ...Theme.typography.subtitle,
        color: Theme.colors.primary,
    },
    withdrawInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Theme.colors.background,
        borderRadius: Theme.radius.lg,
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: 14,
        width: "100%",
        marginBottom: Theme.spacing.xl,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    withdrawCurrency: {
        ...Theme.typography.h2,
        color: Theme.colors.text,
        marginRight: Theme.spacing.xs,
    },
    withdrawInput: {
        flex: 1,
        ...Theme.typography.h2,
        color: Theme.colors.text,
    },
    bankCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Theme.colors.background,
        borderRadius: Theme.radius.lg,
        padding: Theme.spacing.md,
        width: "100%",
        marginBottom: Theme.spacing.xl,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    bankLogoCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Theme.colors.surface,
        justifyContent: "center",
        alignItems: "center",
        marginRight: Theme.spacing.md,
        ...Theme.shadows.sm,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    bankLogoText: {
        fontSize: 14,
        fontWeight: "900",
        color: "#006699",
    },
    bankNameText: {
        ...Theme.typography.subtitle,
        color: Theme.colors.text,
    },
    bankOwnerText: {
        ...Theme.typography.caption,
        color: Theme.colors.textMuted,
        marginTop: 2,
    },
});
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useEffect, useState, useRef } from "react";
import * as Location from "expo-location";
import { useRouter } from "expo-router";

import AcMapView from '../components/AcMapView';

// 🔥 FIREBASE
import { auth, db } from "./_firebaseConfig";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

import { Theme } from "../constants/theme";
import { useCustomAlert } from "../components/ui/GlobalAlertProvider";
import AnimatedButton from "../components/ui/AnimatedButton";

export default function Tracking() {
    const router = useRouter();
    const { showAlert, showConfirm } = useCustomAlert();
    const mapRef = useRef<any>(null);

    const [location, setLocation] = useState<any>(null);
    const [address, setAddress] = useState("");
    const [loadingLocation, setLoadingLocation] = useState(true);
    const [findingTech, setFindingTech] = useState(false);

    const slideAnim = useRef(new Animated.Value(300)).current;

    useEffect(() => {
        if (location) {
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                useNativeDriver: true,
            }).start();
        }
    }, [location]);

    /* ================= HAVERSINE ================= */
    const toRad = (value: number) => (value * Math.PI) / 180;

    const haversineDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ) => {
        const R = 6371;

        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    /* ================= AMBIL LOKASI ================= */
    const fetchLocation = async () => {
        try {
            setLoadingLocation(true);
            let loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            setLocation(loc.coords);
            getAddressFromCoords(loc.coords.latitude, loc.coords.longitude);
        } catch (err) {
            console.log("Location error:", err);
            showAlert({ title: "Gagal Mengambil Lokasi", message: "Pastikan GPS Anda aktif.", type: "error" });
        } finally {
            setLoadingLocation(false);
        }
    };

    const requestLocationPermission = async (forcePopup = false) => {
        const current = await Location.getForegroundPermissionsAsync();
        
        if (current.status === "granted") {
            await fetchLocation();
            return;
        }

        if (current.status === "undetermined" || forcePopup) {
            showConfirm({
                title: "Akses Lokasi",
                message: "Rapid Repairs membutuhkan izin lokasi untuk menampilkan peta dan menemukan teknisi terdekat dari Anda.",
                onConfirm: async () => {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status === "granted") {
                        await fetchLocation();
                    } else {
                        showAlert({
                            title: "Izin Ditolak",
                            message: "Izin lokasi diperlukan. Anda dapat mengaktifkannya di Pengaturan HP Anda.",
                            type: "warning"
                        });
                        setLoadingLocation(false);
                    }
                },
                onCancel: () => setLoadingLocation(false) // just hide loader if denied
            });
        } else {
            // Already denied, just hide loader to show the fallback UI
            setLoadingLocation(false);
        }
    };

    useEffect(() => {
        requestLocationPermission(false);
    }, []);

    const getAddressFromCoords = async (lat: number, lng: number) => {
        try {
            let res = await Location.reverseGeocodeAsync({
                latitude: lat,
                longitude: lng
            });

            if (res.length > 0) {
                const addr = res[0];
                setAddress(
                    `${addr.name || ""}, ${addr.street || ""}, ${addr.city || ""}`
                );
            }
        } catch (err) {
            console.log("Geocode error:", err);
        }
    };

    /* ================= 🔥 CARI TEKNISI ================= */
    const findTechnician = async () => {
        const user = auth.currentUser;
        if (!user || !location) return;

        setFindingTech(true);

        try {
            // 🔥 Ambil Nama Customer dari Firestore
            const userSnap = await getDocs(query(collection(db, "users"), where("__name__", "==", user.uid)));
            let customerName = "Customer";
            if (!userSnap.empty) {
                customerName = userSnap.docs[0].data().name;
            }

            const q = query(
                collection(db, "technicians"),
                where("status", "==", "approved"),
                where("isActive", "==", true)
            );

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setFindingTech(false);
                showAlert({
                    title: "Teknisi Tidak Ditemukan",
                    message: "Saat ini tidak ada teknisi AC yang aktif di sekitar Anda.",
                    type: "warning"
                });
                return;
            }

            let nearest: any = null;
            let minDist = 999;

            snapshot.forEach((docSnap) => {
                // Mencegah customer mendapatkan pesanannya sendiri
                if (docSnap.id === user.uid) return;

                const data = docSnap.data();
                const lat = data.coordinate?.lat;
                const lng = data.coordinate?.lng;

                if (!lat || !lng) return;

                const dist = haversineDistance(
                    location.latitude,
                    location.longitude,
                    lat,
                    lng
                );

                if (dist < minDist) {
                    minDist = dist;
                    nearest = {
                        id: docSnap.id,
                        ...data,
                        distance: dist
                    };
                }
            });

            if (!nearest) {
                setFindingTech(false);
                showAlert({
                    title: "Teknisi Tidak Ditemukan",
                    message: "Saat ini tidak ada teknisi AC yang aktif di sekitar Anda.",
                    type: "warning"
                });
                return;
            }

            const orderRef = await addDoc(collection(db, "orders"), {
                userId: user.uid,
                userName: customerName,
                userAddress: address,
                technicianId: nearest.id,
                status: "waiting",
                serviceType: "Kunjungan & Pengecekan AC",
                location: {
                    lat: location.latitude,
                    lng: location.longitude
                },
                createdAt: serverTimestamp()
            });

            console.log("✅ Order:", orderRef.id);
            setFindingTech(false);

            router.push({
                pathname: "/searching" as any,
                params: {
                    orderId: orderRef.id,
                    tech: JSON.stringify(nearest)
                }
            });

        } catch (err) {
            console.log("❌ Error:", err);
            setFindingTech(false);
            showAlert({
                title: "Terjadi Kesalahan",
                message: "Gagal memproses pesanan Anda. Silakan coba lagi.",
                type: "error"
            });
        }
    };

    /* ================= UI ================= */
    if (loadingLocation) {
        return (
            <View style={styles.loading}>
                <Ionicons name="location" size={40} color={Theme.colors.primary} style={{ marginBottom: 16 }} />
                <Text style={{ ...Theme.typography.body, color: Theme.colors.textMuted }}>Mencari lokasi Anda...</Text>
            </View>
        );
    }

    if (!location) {
        return (
            <View style={styles.loading}>
                <Ionicons name="warning" size={40} color={Theme.colors.warning} style={{ marginBottom: 16 }} />
                <Text style={{ ...Theme.typography.body, color: Theme.colors.text, textAlign: 'center' }}>
                    Lokasi tidak ditemukan.{"\n"}Pastikan Anda telah memberikan izin lokasi.
                </Text>
                <AnimatedButton
                    title="Izinkan Lokasi"
                    onPress={() => requestLocationPermission(true)}
                    style={{ marginTop: 24, width: 200 }}
                />
                <AnimatedButton
                    title="Kembali"
                    onPress={() => router.back()}
                    style={{ marginTop: 12, width: 200 }}
                    variant="outline"
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header / Back Button Overlay */}
            <View style={styles.headerOverlay}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={Theme.colors.text} />
                </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
                <AcMapView
                    mapRef={mapRef}
                    style={styles.map}
                    webFallbackStyle={styles.webFallback}
                    location={location}
                    setLocation={setLocation}
                    getAddressFromCoords={getAddressFromCoords}
                />
            </View>

            <Animated.View style={[styles.bottomCard, { transform: [{ translateY: slideAnim }] }]}>
                <View style={styles.cardContent}>
                    <View style={styles.cardIndicator} />
                    
                    <Text style={styles.title}>Pesan Teknisi AC</Text>
                    <Text style={styles.subtitle}>Tentukan lokasi perbaikan AC Anda</Text>

                    <Text style={styles.label}>Alamat Lengkap</Text>
                    <View style={styles.addressBox}>
                        <Ionicons name="location" size={20} color={Theme.colors.primary} style={{ marginRight: 10 }} />
                        <Text style={styles.addressText} numberOfLines={2}>
                            {address || "Mengambil lokasi..."}
                        </Text>
                    </View>

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={20} color={Theme.colors.warning} style={{ marginTop: 2, marginRight: 10 }} />
                        <Text style={styles.infoText}>
                            Jika teknisi datang ke lokasi Anda tanpa melakukan perbaikan, Anda akan tetap dikenakan biaya kunjungan tetap sebesar Rp50.000 untuk setiap Layanan AC.
                        </Text>
                    </View>

                    <AnimatedButton
                        title="Pesan Teknisi Sekarang"
                        onPress={findTechnician}
                        isLoading={findingTech}
                        style={styles.orderBtn}
                        icon={<Ionicons name="build" size={20} color="white" />}
                    />
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Theme.colors.background },
    
    headerOverlay: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 100,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...Theme.shadows.sm,
    },
    headerTitle: {
        ...Theme.typography.h3,
        marginLeft: Theme.spacing.md,
        color: Theme.colors.text,
        textShadowColor: 'rgba(255, 255, 255, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },

    map: { flex: 1 },
    webFallback: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Theme.colors.inputBg },
    
    bottomCard: { position: "absolute", bottom: 0, width: "100%" },
    cardContent: {
        backgroundColor: Theme.colors.surface,
        borderTopLeftRadius: Theme.radius.xl,
        borderTopRightRadius: Theme.radius.xl,
        padding: Theme.spacing.xl,
        ...Theme.shadows.lg,
    },
    cardIndicator: {
        width: 40,
        height: 4,
        backgroundColor: Theme.colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: Theme.spacing.md,
    },
    title: { ...Theme.typography.h2, color: Theme.colors.text },
    subtitle: { ...Theme.typography.body, color: Theme.colors.textMuted, marginBottom: Theme.spacing.lg },
    
    label: { ...Theme.typography.subtitle, color: Theme.colors.text, marginBottom: Theme.spacing.xs },
    addressBox: { 
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.inputBg, 
        padding: Theme.spacing.md, 
        borderRadius: Theme.radius.lg,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    addressText: {
        flex: 1,
        ...Theme.typography.body,
        color: Theme.colors.text,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: Theme.colors.warning + "15",
        padding: Theme.spacing.md,
        borderRadius: Theme.radius.lg,
        marginTop: Theme.spacing.md,
        borderWidth: 1,
        borderColor: Theme.colors.warning + "30",
    },
    infoText: {
        flex: 1,
        ...Theme.typography.caption,
        color: Theme.colors.text,
        lineHeight: 18,
    },
    orderBtn: {
        marginTop: Theme.spacing.lg,
    },
});
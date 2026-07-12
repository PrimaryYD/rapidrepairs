import { View, Text, StyleSheet, TouchableOpacity, Animated, Image, Modal } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./_firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { BASE_URL } from "../api";

import AcMapView from "../components/AcMapView";
import { Theme } from "../constants/theme";
import AnimatedButton from "../components/ui/AnimatedButton";
import { useCustomAlert } from "../components/ui/GlobalAlertProvider";

export default function FoundScreen() {
    const router = useRouter();
    const { orderId } = useLocalSearchParams();
    const [order, setOrder] = useState<any>(null);
    const [userLocation, setUserLocation] = useState<any>(null);
    const [techName, setTechName] = useState("Teknisi");
    const [techPhoto, setTechPhoto] = useState<string | null>(null);
    const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
    const mapRef = useRef<any>(null);

    const slideAnim = useRef(new Animated.Value(200)).current;

    const [locationPermissionGranted, setLocationPermissionGranted] = useState(true);
    const { showAlert, showConfirm } = useCustomAlert();

    const requestLocationPermission = async (forcePopup = false) => {
        const current = await Location.getForegroundPermissionsAsync();
        
        if (current.status === "granted") {
            setLocationPermissionGranted(true);
            return;
        }

        if (current.status === "undetermined" || forcePopup) {
            showConfirm({
                title: "Akses Lokasi",
                message: "Rapid Repairs membutuhkan izin lokasi untuk menampilkan rute teknisi ke lokasi Anda.",
                onConfirm: async () => {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status === "granted") {
                        setLocationPermissionGranted(true);
                    } else {
                        showAlert({
                            title: "Izin Ditolak",
                            message: "Izin lokasi diperlukan. Anda dapat mengaktifkannya di Pengaturan HP Anda.",
                            type: "warning"
                        });
                        setLocationPermissionGranted(false);
                    }
                },
                onCancel: () => setLocationPermissionGranted(false)
            });
        } else {
            setLocationPermissionGranted(false);
        }
    };

    useEffect(() => {
        requestLocationPermission();
    }, []);

    // 📍 TRACK USER LOCATION
    useEffect(() => {
        if (!locationPermissionGranted) return;
        let watchId: any;

        (async () => {
            try {
                watchId = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        distanceInterval: 10,
                    },
                    (loc) => {
                        const coords = {
                            latitude: loc.coords.latitude,
                            longitude: loc.coords.longitude
                        };
                        setUserLocation(coords);

                        // Update order location if user moves
                        if (orderId) {
                            updateDoc(doc(db, "orders", orderId as string), {
                                location: {
                                    lat: loc.coords.latitude,
                                    lng: loc.coords.longitude
                                }
                            });
                        }
                    }
                );
            } catch (err) {
                console.log("Found location tracking error:", err);
            }
        })();

        return () => {
            if (watchId) watchId.remove();
        };
    }, [orderId, locationPermissionGranted]);

    // 🔥 Auto fit map to show both user and technician
    useEffect(() => {
        if (mapRef.current && userLocation && order?.technicianLocation) {
            mapRef.current.fitToCoordinates([
                userLocation,
                { latitude: order.technicianLocation.lat, longitude: order.technicianLocation.lng }
            ], {
                edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
                animated: true,
            });
        }
    }, [userLocation, order?.technicianLocation]);

    // 🔔 LISTEN TO ORDER & FETCH TECH NAME
    useEffect(() => {
        if (!orderId) return;

        const unsub = onSnapshot(
            doc(db, "orders", orderId as string), 
            async (docSnap) => {
                if (docSnap.exists()) {
                    const orderData = docSnap.data();
                    setOrder(orderData);

                    // Fetch tech name if not already fetched
                    if (orderData.technicianId) {
                        const techSnap = await getDocs(query(collection(db, "technicians"), where("__name__", "==", orderData.technicianId)));
                        if (!techSnap.empty) {
                            const techData = techSnap.docs[0].data();
                            setTechName(techData.name || "Teknisi");
                            if (techData.selfiePhotos && techData.selfiePhotos.length > 0) {
                                let photoUrl = techData.selfiePhotos[0];
                                photoUrl = photoUrl.replace(/^http:\/\/[0-9.]+:\d+/, BASE_URL);
                                setTechPhoto(photoUrl);
                            }
                        }
                    }

                    if (orderData.status === "arrived") {
                        Animated.spring(slideAnim, {
                            toValue: 0,
                            friction: 8,
                            useNativeDriver: true,
                        }).start();
                    } else {
                        Animated.spring(slideAnim, {
                            toValue: 0,
                            friction: 8,
                            useNativeDriver: true,
                        }).start();
                    }
                }
            },
            (error) => {
                console.error("Error in found snapshot listener:", error);
            }
        );

        return () => unsub();
    }, [orderId]);

    if (!locationPermissionGranted && !userLocation) {
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
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.loading}>
                <Ionicons name="compass" size={40} color={Theme.colors.primary} style={{ marginBottom: 16 }} />
                <Text style={{ ...Theme.typography.body, color: Theme.colors.textMuted }}>Memuat data teknisi...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            
            {/* MAP */}
            <AcMapView
                mapRef={mapRef}
                style={styles.map}
                location={userLocation || (order.location ? {
                    latitude: order.location.lat,
                    longitude: order.location.lng
                } : null)}
                technicianLocation={order.technicianLocation ? {
                    latitude: order.technicianLocation.lat,
                    longitude: order.technicianLocation.lng
                } : null}
                onRouteUpdate={(info: any) => setRouteInfo(info)}
            />

            {order.status !== "arrived" && (
                <View style={styles.topCard}>
                    <Text style={styles.topTitle}>
                        Teknisi Dalam Perjalanan
                    </Text>
                    
                    {routeInfo ? (
                        <View style={styles.etaRow}>
                            <Ionicons name="time-outline" size={16} color={Theme.colors.primaryDark} />
                            <Text style={styles.etaText}>
                                Tiba dalam <Text style={styles.etaHighlight}>~{Math.ceil(routeInfo.duration / 60)} mnt</Text> ({routeInfo.distance < 1000 ? `${routeInfo.distance.toFixed(0)} m` : `${(routeInfo.distance / 1000).toFixed(1)} km`})
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.topSubtitle}>
                            Mohon tunggu sebentar...
                        </Text>
                    )}
                </View>
            )}
            {order.status !== "arrived" && (
                <Animated.View style={[styles.bottomCard, { transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.techInfo}>
                        <View style={styles.avatar}>
                            {techPhoto ? (
                                <Image source={{ uri: techPhoto }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                            ) : (
                                <Ionicons name="person" size={24} color={Theme.colors.textMuted} />
                            )}
                        </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.techName}>{techName}</Text>
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={12} color={Theme.colors.warning} />
                            <Text style={styles.ratingText}>4.8 (Expert)</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.chatBtn}>
                        <Ionicons name="chatbubble-ellipses-outline" size={22} color={Theme.colors.primary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.serviceBox}>
                    <Text style={styles.serviceLabel}>LAYANAN DIPESAN</Text>
                    <Text style={styles.serviceValue}>{order.serviceType || "Kunjungan & Pengecekan AC"}</Text>
                </View>
                </Animated.View>
            )}

            {/* ARRIVED MODAL */}
            <Modal visible={order.status === "arrived"} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIconWrapper}>
                            <Ionicons name="checkmark-circle" size={72} color={Theme.colors.primary} />
                        </View>
                        <Text style={styles.modalTitle}>Teknisi Sudah Sampai!</Text>
                        <Text style={styles.modalDesc}>
                            Teknisi {techName} telah tiba di lokasi Anda. Silakan temui teknisi untuk memulai pengecekan.
                        </Text>
                        <AnimatedButton
                            title="Lanjut ke Pembayaran"
                            onPress={() => router.push({
                                pathname: "/pembayaran" as any,
                                params: { orderId }
                            })}
                            style={{ width: '100%', marginTop: 24 }}
                        />
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background
    },
    loading: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Theme.colors.background
    },
    map: {
        flex: 1
    },
    topCard: {
        position: "absolute",
        top: 50,
        left: 20,
        right: 20,
        backgroundColor: Theme.colors.surface,
        padding: Theme.spacing.md,
        borderRadius: Theme.radius.lg,
        ...Theme.shadows.md,
        alignItems: "center"
    },
    topTitle: {
        ...Theme.typography.subtitle,
        color: Theme.colors.text
    },
    topSubtitle: {
        ...Theme.typography.caption,
        color: Theme.colors.textMuted,
        marginTop: 4
    },
    etaRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: Theme.spacing.sm,
        backgroundColor: Theme.colors.primaryLight + '20', // Very light primary
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: Theme.radius.full,
        gap: 6
    },
    etaText: {
        ...Theme.typography.caption,
        color: Theme.colors.text,
        fontWeight: "500"
    },
    etaHighlight: {
        color: Theme.colors.primaryDark,
        fontWeight: "bold"
    },
    bottomCard: {
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: Theme.colors.surface,
        padding: Theme.spacing.lg,
        borderRadius: Theme.radius.xl,
        ...Theme.shadows.lg
    },
    techInfo: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: Theme.spacing.md
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Theme.colors.inputBg,
        justifyContent: "center",
        alignItems: "center",
        marginRight: Theme.spacing.md,
        borderWidth: 1,
        borderColor: Theme.colors.border
    },
    techName: {
        ...Theme.typography.h3,
        color: Theme.colors.text
    },
    ratingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 2
    },
    ratingText: {
        ...Theme.typography.caption,
        color: Theme.colors.textMuted
    },
    chatBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Theme.colors.primaryLight + '20',
        justifyContent: "center",
        alignItems: "center"
    },
    serviceBox: {
        backgroundColor: Theme.colors.inputBg,
        padding: Theme.spacing.md,
        borderRadius: Theme.radius.md,
        borderWidth: 1,
        borderColor: Theme.colors.border
    },
    serviceLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: Theme.colors.textMuted,
        letterSpacing: 0.5
    },
    serviceValue: {
        ...Theme.typography.body,
        fontWeight: "600",
        color: Theme.colors.text,
        marginTop: 4
    },
    btn: {
        marginTop: Theme.spacing.md
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20
    },
    modalContent: {
        backgroundColor: Theme.colors.surface,
        width: "100%",
        borderRadius: 24,
        padding: 24,
        alignItems: "center",
        ...Theme.shadows.lg
    },
    modalIconWrapper: {
        marginBottom: 16
    },
    modalTitle: {
        ...Theme.typography.h2,
        color: Theme.colors.text,
        marginBottom: 8,
        textAlign: "center"
    },
    modalDesc: {
        ...Theme.typography.body,
        color: Theme.colors.textMuted,
        textAlign: "center",
        lineHeight: 22
    }
});
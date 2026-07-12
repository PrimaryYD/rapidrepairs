import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Linking
} from "react-native";
import { useEffect, useState, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "./_firebaseConfig";
import * as Location from "expo-location";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import AcMapView from "../components/AcMapView";
import { Theme } from "../constants/theme";
import { useCustomAlert } from "../components/ui/GlobalAlertProvider";
import AnimatedButton from "../components/ui/AnimatedButton";

export default function TrackingTech() {

    const router = useRouter();
    const { orderId } = useLocalSearchParams();

    const [order, setOrder] = useState<any>(null);
    const [techLocation, setTechLocation] = useState<any>(null);
    const mapRef = useRef<any>(null);
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
                message: "Rapid Repairs membutuhkan izin lokasi untuk menampilkan rute Anda ke pelanggan.",
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

    // 📍 TRACK TECHNICIAN LOCATION
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
                        setTechLocation(coords);

                        if (orderId) {
                            updateDoc(doc(db, "orders", orderId as string), {
                                technicianLocation: {
                                    lat: loc.coords.latitude,
                                    lng: loc.coords.longitude
                                }
                            });
                        }
                    }
                );
            } catch (err) {
                console.log("Tracking error:", err);
            }
        })();

        return () => {
            if (watchId) watchId.remove();
        };
    }, [orderId, locationPermissionGranted]);

    // 🔥 Auto fit map to show both tech and customer
    useEffect(() => {
        if (mapRef.current && techLocation && order?.location) {
            mapRef.current.fitToCoordinates([
                techLocation,
                { latitude: order.location.lat, longitude: order.location.lng }
            ], {
                edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
                animated: true,
            });
        }
    }, [techLocation, order?.location]);

    // 🔔 LISTEN TO ORDER
    useEffect(() => {
        if (!orderId) return;

        const unsub = onSnapshot(
            doc(db, "orders", orderId as string), 
            (docSnap) => {
                if (docSnap.exists()) {
                    setOrder(docSnap.data());
                }
            },
            (error) => {
                console.error("Error in tracking-tech snapshot listener:", error);
            }
        );

        return () => unsub();
    }, [orderId]);

    const finishOrder = async () => {
        if (!orderId) return;
        await updateDoc(doc(db, "orders", orderId as string), {
            status: "arrived"
        });
        showAlert({ title: "Sampai Tujuan", message: "Anda telah sampai di tujuan!", type: "success" });
        router.replace({
            pathname: "/start-inspection" as any,
            params: { orderId }
        });
    };

    if (!locationPermissionGranted && !techLocation) {
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
                <Text>Loading order...</Text>
            </View>
        );
    }

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

    let displayDistance = "1.5 km";
    let displayDuration = "4 menit";

    if (techLocation && order?.location) {
        const d = getDistance(
            techLocation.latitude,
            techLocation.longitude,
            order.location.lat,
            order.location.lng
        );
        displayDistance = `${d.toFixed(1)} km`;
        displayDuration = `${Math.max(1, Math.round(d * 2.5))} menit`;
    }

    return (
        <View style={styles.container}>

            {/* MAP */}
            <AcMapView
                mapRef={mapRef}
                style={styles.map}
                location={techLocation || { latitude: -6.2000, longitude: 106.8166 }} // Fallback
                destination={{
                    latitude: order.location.lat,
                    longitude: order.location.lng
                }}
            />

            {/* TOP ADDRESS CARD */}
            <View style={styles.topCard}>
                <View style={styles.locationIcon}>
                    <Ionicons name="location-outline" size={20} color="#8B5E3C" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.topLabel}>ALAMAT PELANGGAN</Text>
                    <Text style={styles.topValue} numberOfLines={1}>
                        {order.userAddress || "Jl. Kebahagiaan No. 123"}
                    </Text>
                </View>
            </View>

            {/* BOTTOM INFO CARD */}
            <View style={styles.bottomCard}>
                
                <View style={styles.customerRow}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={24} color="#ccc" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.customerLabel}>Pelanggan</Text>
                        <Text style={styles.customerName}>{order.userName || "Bryant"}</Text>
                    </View>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => Linking.openURL(`tel:08123456789`)}>
                        <Ionicons name="call-outline" size={20} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* ESTIMATION ROW */}
                <View style={styles.estimationRow}>
                    <View style={styles.estimationCol}>
                        <Ionicons name="trail-sign-outline" size={18} color="#8B5E3C" />
                        <Text style={styles.estimationText}>{displayDistance}</Text>
                    </View>
                    <View style={styles.estimationSeparator} />
                    <View style={styles.estimationCol}>
                        <Ionicons name="time-outline" size={18} color="#8B5E3C" />
                        <Text style={styles.estimationText}>{displayDuration}</Text>
                    </View>
                </View>

                <AnimatedButton
                    title="Sampai Tujuan"
                    icon={<Ionicons name="navigate" size={18} color="#fff" style={{ marginRight: 8 }} />}
                    onPress={finishOrder}
                    style={{ width: '100%' }}
                />

            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.surface },

    loading: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },

    map: { flex: 1 },

    /* TOP CARD */
    topCard: {
        position: "absolute",
        top: 50,
        left: 20,
        right: 20,
        backgroundColor: Theme.colors.surface,
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        borderRadius: 20,
        elevation: 10,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10
    },
    locationIcon: {
        width: 40,
        height: 40,
        backgroundColor: Theme.colors.primaryLight + "20",
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12
    },
    topLabel: {
        fontSize: 10,
        color: Theme.colors.textMuted,
        fontWeight: "bold"
    },
    topValue: {
        fontSize: 13,
        fontWeight: "bold",
        color: Theme.colors.text
    },

    /* BOTTOM CARD */
    bottomCard: {
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: Theme.colors.surface,
        padding: 20,
        borderRadius: 30,
        elevation: 15,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 15
    },
    customerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 25,
        backgroundColor: Theme.colors.inputBg,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12
    },
    customerLabel: {
        fontSize: 11,
        color: Theme.colors.textMuted
    },
    customerName: {
        fontSize: 16,
        fontWeight: "bold",
        color: Theme.colors.text
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 10
    },
    arrivedBtn: {
        backgroundColor: "#C5A880",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 15,
        borderRadius: 20
    },
    arrivedText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 15
    },
    estimationRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: Theme.colors.primaryLight + "20",
        padding: 12,
        borderRadius: 15,
        marginBottom: 15,
    },
    estimationCol: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    estimationText: {
        fontSize: 13,
        fontWeight: "700",
        color: Theme.colors.text,
    },
    estimationSeparator: {
        width: 1,
        height: 20,
        backgroundColor: Theme.colors.border,
    },
});
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./_firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

import AcMapView from "../components/AcMapView";

export default function FoundScreen() {

    const router = useRouter();
    const { orderId } = useLocalSearchParams();
    const [order, setOrder] = useState<any>(null);
    const [userLocation, setUserLocation] = useState<any>(null);
    const [techName, setTechName] = useState("Teknisi");
    const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
    const mapRef = useRef<any>(null);

    // 📍 TRACK USER LOCATION
    useEffect(() => {
        let watchId: any;

        (async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                    console.log("Location permission not granted");
                    return;
                }

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
    }, [orderId]);

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
                            setTechName(techSnap.docs[0].data().name || "Teknisi");
                        }
                    }
                }
            },
            (error) => {
                console.error("Error in found snapshot listener:", error);
            }
        );

        return () => unsub();
    }, [orderId]);

    if (!order) {
        return (
            <View style={styles.loading}>
                <Text>Memuat data teknisi...</Text>
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

            {/* TOP CARD */}
            <View style={styles.topCard}>
                <Text style={styles.topTitle}>
                    {order.status === "arrived" ? "Teknisi Sudah Sampai" : "Teknisi Dalam Perjalanan"}
                </Text>
                
                {order.status !== "arrived" && routeInfo ? (
                    <View style={styles.etaRow}>
                        <Ionicons name="time-outline" size={16} color="#8B5E3C" />
                        <Text style={styles.etaText}>
                            Tiba dalam <Text style={styles.etaHighlight}>~{Math.ceil(routeInfo.duration / 60)} mnt</Text> ({routeInfo.distance < 1000 ? `${routeInfo.distance.toFixed(0)} m` : `${(routeInfo.distance / 1000).toFixed(1)} km`})
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.topSubtitle}>
                        {order.status === "arrived" ? "Silakan temui teknisi Anda" : "Mohon tunggu sebentar..."}
                    </Text>
                )}
            </View>

            {/* BOTTOM CARD */}
            <View style={styles.bottomCard}>
                <View style={styles.techInfo}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={24} color="#ccc" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.techName}>{techName}</Text>
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={12} color="#F1C40F" />
                            <Text style={styles.ratingText}>4.8 (Expert)</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.chatBtn}>
                        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#8B5E3C" />
                    </TouchableOpacity>
                </View>

                <View style={styles.serviceBox}>
                    <Text style={styles.serviceLabel}>LAYANAN DIPESAN</Text>
                    <Text style={styles.serviceValue}>{order.serviceType || "Kunjungan & Pengecekan AC"}</Text>
                </View>

                {order.status === "arrived" && (
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => router.push({
                            pathname: "/pembayaran" as any,
                            params: { orderId }
                        })}
                    >
                        <Text style={styles.btnText}>Lanjut ke Pembayaran</Text>
                    </TouchableOpacity>
                )}
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff"
    },
    loading: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    map: {
        flex: 1
    },
    topCard: {
        position: "absolute",
        top: 50,
        left: 20,
        right: 20,
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 20,
        elevation: 5,
        alignItems: "center"
    },
    topTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#333"
    },
    topSubtitle: {
        fontSize: 11,
        color: "#777",
        marginTop: 2
    },
    etaRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
        backgroundColor: "#F9F6F2",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        gap: 6
    },
    etaText: {
        fontSize: 12,
        color: "#555",
        fontWeight: "500"
    },
    etaHighlight: {
        color: "#8B5E3C",
        fontWeight: "bold"
    },
    bottomCard: {
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 25,
        elevation: 10
    },
    techInfo: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 25,
        backgroundColor: "#eee",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12
    },
    techName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333"
    },
    ratingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4
    },
    ratingText: {
        fontSize: 11,
        color: "#777"
    },
    chatBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#F9F6F2",
        justifyContent: "center",
        alignItems: "center"
    },
    serviceBox: {
        backgroundColor: "#F9F6F2",
        padding: 12,
        borderRadius: 15
    },
    serviceLabel: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#999"
    },
    serviceValue: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#333",
        marginTop: 2
    },
    btn: {
        backgroundColor: "#8B5E3C",
        padding: 15,
        borderRadius: 20,
        alignItems: "center",
        marginTop: 15
    },
    btnText: {
        color: "#fff",
        fontWeight: "bold"
    }
});
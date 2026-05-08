import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator
} from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./_firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

import AcMapView from "../components/AcMapView";

export default function TrackingUser() {

    const router = useRouter();
    const { orderId } = useLocalSearchParams();

    const [order, setOrder] = useState<any>(null);
    const [distance, setDistance] = useState<string>("Calculating...");

    /* ================= HAVERSINE ================= */
    const toRad = (value: number) => (value * Math.PI) / 180;

    const haversineDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ) => {
        const R = 6371; // Radius bumi dalam km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    /* 🔔 LISTEN ORDER & TECH LOCATION */
    useEffect(() => {
        if (!orderId) return;

        const unsub = onSnapshot(doc(db, "orders", orderId as string), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setOrder(data);

                // Update Jarak
                if (data.location && data.techLocation) {
                    const dist = haversineDistance(
                        data.location.lat,
                        data.location.lng,
                        data.techLocation.lat,
                        data.techLocation.lng
                    );
                    setDistance(dist.toFixed(1) + " km");
                }

                // Jika sudah sampai
                if (data.status === "arrived") {
                    // Bisa pindah ke halaman konfirmasi kedatangan atau show alert
                    console.log("Teknisi sudah sampai!");
                }
            }
        });

        return () => unsub();
    }, [orderId]);

    if (!order) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#8B5E3C" />
                <Text style={{ marginTop: 10 }}>Menghubungkan ke teknisi...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>

            {/* MAP */}
            <AcMapView
                style={styles.map}
                location={{
                    latitude: order.location.lat,
                    longitude: order.location.lng
                }}
                techLocation={order.techLocation ? {
                    latitude: order.techLocation.lat,
                    longitude: order.techLocation.lng
                } : null}
            />

            {/* HEADER INFO */}
            <View style={styles.topInfo}>
                <View style={styles.statusBadge}>
                    <Ionicons name="time" size={14} color="#8B5E3C" />
                    <Text style={styles.statusText}>
                        {order.status === 'arrived' ? 'Teknisi Sudah Sampai' : 'Teknisi Sedang Menuju Lokasi'}
                    </Text>
                </View>
            </View>

            {/* BOTTOM CARD */}
            <View style={styles.bottomCard}>
                
                <View style={styles.techRow}>
                    <View style={styles.avatar} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.label}>Teknisi Anda</Text>
                        <Text style={styles.techName}>{order.technicianName || "Teknisi"}</Text>
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={12} color="#F1C40F" />
                            <Text style={styles.ratingText}>4.8 • {distance} dari Anda</Text>
                        </View>
                    </View>

                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionCircle}>
                            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#666" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCircle}>
                            <Ionicons name="call-outline" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={18} color="#8B5E3C" />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={styles.label}>ALAMAT TUJUAN</Text>
                        <Text style={styles.addressText} numberOfLines={2}>
                            {order.address || "Alamat tidak tersedia"}
                        </Text>
                    </View>
                </View>

                {order.status === 'arrived' && (
                    <TouchableOpacity 
                        style={styles.confirmBtn}
                        onPress={() => router.replace("/pembayaran" as any)}
                    >
                        <Text style={styles.confirmText}>Lanjut ke Pembayaran</Text>
                    </TouchableOpacity>
                )}

            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F6F2EA" },

    loading: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },

    map: { flex: 1 },

    topInfo: {
        position: "absolute",
        top: 50,
        left: 0,
        right: 0,
        alignItems: "center"
    },

    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 25,
        elevation: 5,
        gap: 6
    },

    statusText: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#333"
    },

    bottomCard: {
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 30,
        elevation: 5
    },

    techRow: {
        flexDirection: "row",
        alignItems: "center"
    },

    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#ddd"
    },

    techName: {
        fontSize: 16,
        fontWeight: "bold"
    },

    label: {
        fontSize: 10,
        color: "#999",
        fontWeight: "bold",
        letterSpacing: 0.5,
        textTransform: "uppercase"
    },

    ratingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 2
    },

    ratingText: {
        fontSize: 11,
        color: "#666"
    },

    actionRow: {
        flexDirection: "row",
        gap: 8
    },

    actionCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f9f9f9",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#eee"
    },

    divider: {
        height: 1,
        backgroundColor: "#eee",
        marginVertical: 15
    },

    infoRow: {
        flexDirection: "row",
        alignItems: "center"
    },

    addressText: {
        fontSize: 13,
        color: "#333",
        fontWeight: "500"
    },

    confirmBtn: {
        backgroundColor: "#8B5E3C",
        padding: 16,
        borderRadius: 25,
        alignItems: "center",
        marginTop: 15
    },

    confirmText: {
        color: "#fff",
        fontWeight: "bold"
    }
});

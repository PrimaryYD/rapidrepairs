import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image
} from "react-native";

import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "./_firebaseConfig";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

import AcMapView from "../components/AcMapView";

export default function TrackingTech() {

    const router = useRouter();
    const { orderId } = useLocalSearchParams();

    const [order, setOrder] = useState<any>(null);
    const [techLocation, setTechLocation] = useState<any>(null);

    /* 🔔 LISTEN ORDER */
    useEffect(() => {
        if (!orderId) return;

        const unsub = onSnapshot(doc(db, "orders", orderId as string), (docSnap) => {
            if (docSnap.exists()) {
                setOrder(docSnap.data());
            }
        });

        return () => unsub();
    }, [orderId]);

    /* 📍 TRACK TECH LOCATION */
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            const unsub = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, distanceInterval: 10 },
                (loc) => {
                    setTechLocation(loc.coords);

                    // 🔥 UPDATE FIRESTORE AGAR CUSTOMER BISA TRACK
                    if (orderId) {
                        updateDoc(doc(db, "orders", orderId as string), {
                            techLocation: {
                                lat: loc.coords.latitude,
                                lng: loc.coords.longitude
                            }
                        }).catch(err => console.log("Update location error:", err));
                    }
                }
            );

            return () => unsub.remove();
        })();
    }, [orderId]);

    /* ✅ SAMPAI TUJUAN */
    const onArrived = async () => {
        if (!orderId) return;

        await updateDoc(doc(db, "orders", orderId as string), {
            status: "arrived"
        });

        // Lanjut ke halaman done atau pengecekan
        router.replace("/done" as any);
    };

    if (!order) {
        return (
            <View style={styles.loading}>
                <Text>Loading order...</Text>
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
                techLocation={techLocation}
            />

            {/* HEADER INFO */}
            <View style={styles.topInfo}>
                <View style={styles.addressBox}>
                    <Text style={styles.label}>ALAMAT PELANGGAN</Text>
                    <Text style={styles.addressText}>{order.address || "Alamat tidak tersedia"}</Text>
                </View>
            </View>

            {/* BOTTOM CARD */}
            <View style={styles.bottomCard}>
                
                <View style={styles.customerRow}>
                    <View style={styles.avatar} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.label}>Pelanggan</Text>
                        <Text style={styles.customerName}>{order.userName || "Pelanggan"}</Text>
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

                <TouchableOpacity style={styles.arrivedBtn} onPress={onArrived}>
                    <Ionicons name="navigate" size={18} color="#fff" />
                    <Text style={styles.arrivedText}>Sampai Tujuan</Text>
                </TouchableOpacity>

            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    loading: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },

    map: { flex: 1 },

    topInfo: {
        position: "absolute",
        top: 50,
        left: 20,
        right: 20,
    },

    addressBox: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 20,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },

    label: {
        fontSize: 10,
        color: "#999",
        fontWeight: "bold",
        letterSpacing: 0.5
    },

    addressText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#333",
        marginTop: 2
    },

    bottomCard: {
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 30,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10
    },

    customerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20
    },

    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#ddd"
    },

    customerName: {
        fontSize: 16,
        fontWeight: "bold"
    },

    actionRow: {
        flexDirection: "row",
        gap: 10
    },

    actionCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f5f5f5",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#eee"
    },

    arrivedBtn: {
        backgroundColor: "#C69E7C",
        flexDirection: "row",
        padding: 16,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
        gap: 8
    },

    arrivedText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 15
    }
});
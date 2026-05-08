import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity
} from "react-native";

import { useEffect, useState, useRef } from "react";
import * as Location from "expo-location";
import { useRouter } from "expo-router";

import AcMapView from '../components/AcMapView';

// 🔥 FIREBASE
import { auth, db } from "./_firebaseConfig";
import { collection, query, where, getDocs, addDoc, doc, getDoc } from "firebase/firestore";

export default function Tracking() {

    const router = useRouter();
    const mapRef = useRef<any>(null);

    const [location, setLocation] = useState<any>(null);
    const [address, setAddress] = useState("");

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
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;

            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc.coords);

            getAddressFromCoords(loc.coords.latitude, loc.coords.longitude);
        })();
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

        try {
            const q = query(
                collection(db, "technicians"),
                where("status", "==", "approved"),
                where("isActive", "==", true)
            );

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                alert("Tidak ada teknisi aktif");
                return;
            }

            let nearest: any = null;
            let minDist = 999;

            snapshot.forEach((docSnap) => {
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
                alert("Teknisi tidak ditemukan");
                return;
            }

            // Fetch User Profile for Name
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            const userName = userSnap.exists() ? userSnap.data().name : "Pelanggan";

            const orderRef = await addDoc(collection(db, "orders"), {
                userId: user.uid,
                userName: userName,
                technicianId: nearest.id,
                technicianName: nearest.fullName || "Teknisi",
                status: "waiting",
                address: address, // Simpan alamat real
                location: {
                    lat: location.latitude,
                    lng: location.longitude
                },
                createdAt: new Date()
            });

            console.log("✅ Order:", orderRef.id);

            router.push({
                pathname: "/searching" as any,
                params: {
                    orderId: orderRef.id,
                    tech: JSON.stringify(nearest)
                }
            });

        } catch (err) {
            console.log("❌ Error:", err);
        }
    };

    /* ================= UI ================= */
    if (!location) {
        return (
            <View style={styles.loading}>
                <Text>Loading lokasi...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>

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

            <View style={styles.bottomCard}>
                <View style={styles.cardContent}>

                    <Text style={styles.title}>Pesan Teknisi AC</Text>

                    <Text style={styles.label}>Alamat Lengkap</Text>
                    <View style={styles.addressBox}>
                        <Text>{address || "Mengambil lokasi..."}</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.orderBtn}
                        onPress={findTechnician}
                    >
                        <Text style={styles.orderText}>
                            Pesan Teknisi Sekarang
                        </Text>
                    </TouchableOpacity>

                </View>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loading: { flex: 1, justifyContent: "center", alignItems: "center" },
    map: { flex: 1 },
    webFallback: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#eee" },
    bottomCard: { position: "absolute", bottom: 0, width: "100%" },
    cardContent: {
        backgroundColor: "#F6F2EA",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16
    },
    title: { fontSize: 16, fontWeight: "600" },
    label: { fontSize: 13, marginTop: 10 },
    addressBox: { backgroundColor: "#fff", padding: 10, borderRadius: 10 },
    orderBtn: {
        backgroundColor: "#8B5E3C",
        padding: 14,
        borderRadius: 25,
        alignItems: "center",
        marginTop: 12
    },
    orderText: { color: "#fff", fontWeight: "600" }
});
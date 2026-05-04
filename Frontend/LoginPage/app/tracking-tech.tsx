import {
    View,
    Text,
    StyleSheet
} from "react-native";

import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./_firebaseConfig";

import AcMapView from "../components/AcMapView";

export default function TrackingTech() {

    const { orderId } = useLocalSearchParams();

    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        if (!orderId) return;

        const unsub = onSnapshot(doc(db, "orders", orderId as string), (docSnap) => {
            if (docSnap.exists()) {
                setOrder(docSnap.data());
            }
        });

        return () => unsub();
    }, [orderId]);

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
            />

            {/* INFO */}
            <View style={styles.bottomCard}>
                <Text style={styles.title}>Menuju Lokasi Pelanggan</Text>
                <Text style={styles.subtitle}>
                    Order ID: {orderId}
                </Text>
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

    bottomCard: {
        position: "absolute",
        bottom: 0,
        width: "100%",
        backgroundColor: "#F6F2EA",
        padding: 16,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20
    },

    title: {
        fontWeight: "600",
        fontSize: 16
    },

    subtitle: {
        fontSize: 12,
        color: "#666",
        marginTop: 4
    }
});
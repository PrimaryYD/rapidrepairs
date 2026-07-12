import { Theme } from "../constants/theme";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    BackHandler,
} from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./_firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StartInspection() {
    const router = useRouter();
    const { orderId } = useLocalSearchParams();
    const [order, setOrder] = useState<any>(null);

    // Prevent Android hardware back button
    useEffect(() => {
        const onBackPress = () => {
            return true; // prevent default behavior
        };
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
    }, []);

    useEffect(() => {
        if (!orderId) return;

        const unsub = onSnapshot(
            doc(db, "orders", orderId as string), 
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setOrder(data);

                    // If services are selected, navigate to upload evidence
                    if (data.status === "services_selected") {
                        router.replace({
                            pathname: "/upload-evidence" as any,
                            params: { orderId }
                        });
                    }
                }
            },
            (error) => {
                console.error("Error in start-inspection snapshot listener:", error);
            }
        );

        return () => unsub();
    }, [orderId]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mulai Pengecekan</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <View style={styles.iconBg}>
                        <Ionicons name="chatbubbles-outline" size={40} color="#8B5E3C" />
                    </View>
                </View>

                <Text style={styles.title}>Diskusikan Kerusakan dengan Pelanggan</Text>
                <Text style={styles.description}>
                    Jelaskan masalah pada AC kepada pelanggan, dan bantu mereka memilih layanan perbaikan yang tepat di aplikasi mereka.
                </Text>
            </View>

            <View style={styles.footer}>
                <View style={styles.statusButton}>
                    <ActivityIndicator size="small" color="#8B5E3C" style={{ marginRight: 10 }} />
                    <Text style={styles.statusText}>Menunggu Pelanggan Memilih Layanan...</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    header: {
        paddingVertical: 20,
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#EFEBE4",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: Theme.colors.text,
    },
    content: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
    },
    iconContainer: {
        marginBottom: 30,
    },
    iconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Theme.colors.border,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    title: {
        fontSize: 22,
        fontWeight: "800",
        color: Theme.colors.text,
        textAlign: "center",
        marginBottom: 20,
        lineHeight: 30,
    },
    description: {
        fontSize: 14,
        color: Theme.colors.textMuted,
        textAlign: "center",
        lineHeight: 22,
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
    },
    statusButton: {
        flexDirection: "row",
        backgroundColor: Theme.colors.border,
        paddingVertical: 18,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
    },
    statusText: {
        color: Theme.colors.primary,
        fontWeight: "700",
        fontSize: 14,
    },
});

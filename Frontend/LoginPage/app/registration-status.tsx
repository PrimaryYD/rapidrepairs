import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    ScrollView,
    BackHandler
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useEffect } from "react";

export default function RegistrationStatus() {
    const router = useRouter();

    // Disable hardware back button (redirect to Home instead)
    useEffect(() => {
        const backAction = () => {
            router.replace("/Homepage" as any);
            return true;
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove();
    }, []);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Status Pendaftaran</Text>
                    </View>

                    <View style={styles.content}>
                        {/* Icon Placeholder (mimics 3D graphic) */}
                        <View style={styles.iconContainer}>
                            <Ionicons name="document-text" size={80} color="#E0D6C8" />
                            <View style={styles.searchIconOverlay}>
                                <Ionicons name="search" size={30} color="#B3875E" />
                            </View>
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>Pendaftaran Sedang{'\n'}Diproses</Text>

                        {/* Info Box */}
                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>
                                Tim kami sedang memverifikasi dokumen dan hasil tes Anda. Proses ini memakan waktu 1-3 hari kerja. Cek notifikasi secara berkala.
                            </Text>
                        </View>

                        {/* Return Button */}
                        <TouchableOpacity
                            style={styles.returnButton}
                            onPress={() => router.replace("/Homepage" as any)}
                        >
                            <Text style={styles.returnButtonText}>Kembali ke Beranda</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F7F5F0",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: "white",
        borderBottomWidth: 1,
        borderBottomColor: "#EEE",
        zIndex: 10,
        elevation: 10,
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
    },
    content: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        marginTop: -50,
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 30,
    },
    searchIconOverlay: {
        position: "absolute",
        bottom: 25,
        right: 25,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    title: {
        fontSize: 22,
        fontWeight: "800",
        color: "#333",
        textAlign: "center",
        lineHeight: 30,
        marginBottom: 20,
    },
    infoBox: {
        backgroundColor: "white",
        padding: 25,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#EBE3D5",
        width: "100%",
        maxWidth: 400,
        marginBottom: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 1,
    },
    infoText: {
        fontSize: 14,
        color: "#8B8175",
        textAlign: "center",
        lineHeight: 22,
        fontWeight: "500",
    },
    returnButton: {
        width: "100%",
        maxWidth: 400,
        paddingVertical: 18,
        borderRadius: 35,
        borderWidth: 1.5,
        borderColor: "#B3875E",
        backgroundColor: "#B3875E",
        alignItems: "center",
    },
    returnButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
    },
});

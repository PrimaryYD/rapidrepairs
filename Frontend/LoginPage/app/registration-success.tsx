import { View, Text, StyleSheet, TouchableOpacity, ScrollView, BackHandler } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useEffect } from "react";

export default function RegistrationSuccess() {
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
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.container}>
                    {/* Premium Circle Icon */}
                    <View style={styles.iconWrapper}>
                        <View style={styles.circle}>
                            <Ionicons name="checkmark" size={50} color="#fff" />
                        </View>
                        {/* Decorative circles */}
                        <View style={styles.ring} />
                    </View>

                    <Text style={styles.title}>Pendaftaran Berhasil!</Text>
                    
                    <View style={styles.card}>
                        <Text style={styles.desc}>
                            Data pendaftaran Anda telah kami terima. Akun Anda sedang dalam tahap verifikasi oleh tim Rapid Repairs.
                        </Text>
                        <View style={styles.divider} />
                        <Text style={styles.subDesc}>
                            Anda akan menerima notifikasi segera setelah akun Anda aktif. Proses ini biasanya memakan waktu 1-2 hari kerja.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.replace("/registration-status" as any)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>Lihat Status Pendaftaran</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => router.replace("/Homepage" as any)}
                    >
                        <Text style={styles.secondaryButtonText}>Kembali ke Beranda</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F7F5F0",
    },
    scroll: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 30,
    },
    iconWrapper: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 30,
    },
    circle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#4CAF50",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2,
        elevation: 10,
        shadowColor: "#4CAF50",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    ring: {
        position: "absolute",
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 2,
        borderColor: "rgba(76, 175, 80, 0.2)",
    },
    title: {
        fontSize: 26,
        fontWeight: "800",
        color: "#333",
        marginBottom: 20,
        textAlign: "center",
    },
    card: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 25,
        width: "100%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 40,
    },
    desc: {
        fontSize: 16,
        color: "#444",
        textAlign: "center",
        lineHeight: 24,
        fontWeight: "500",
    },
    divider: {
        height: 1,
        backgroundColor: "#F0F0F0",
        marginVertical: 15,
    },
    subDesc: {
        fontSize: 13,
        color: "#888",
        textAlign: "center",
        lineHeight: 20,
    },
    button: {
        backgroundColor: "#8B5E3C",
        width: "100%",
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: "center",
        marginBottom: 15,
        elevation: 3,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    secondaryButton: {
        paddingVertical: 10,
    },
    secondaryButtonText: {
        color: "#8B5E3C",
        fontSize: 15,
        fontWeight: "600",
    }
});

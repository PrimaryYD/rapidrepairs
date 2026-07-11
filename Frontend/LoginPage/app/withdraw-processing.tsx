import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Theme } from "../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function WithdrawProcessing() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const amount = params.amount || "0";

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="time-outline" size={60} color="#006400" />
                </View>

                <Text style={styles.title}>Penarikan Sedang{"\n"}Diproses</Text>
                <Text style={styles.subtitle}>
                    Permintaan penarikan dana Anda{"\n"}sedang kami proses.
                </Text>

                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Jumlah</Text>
                        <Text style={styles.value}>Rp {parseInt(amount.toString()).toLocaleString("id-ID")}</Text>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.row}>
                        <Text style={styles.label}>Tujuan</Text>
                        <Text style={styles.value}>BCA - 123456789</Text>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.row}>
                        <Text style={styles.label}>Estimasi Masuk</Text>
                        <Text style={styles.value}>Maks. 1x24 Jam Kerja</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity 
                style={styles.btn}
                onPress={() => router.replace("/home-tech")}
            >
                <Text style={styles.btnText}>Kembali ke Dompet</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9F6F2",
        padding: 20,
        justifyContent: "space-between"
    },
    content: {
        alignItems: "center",
        marginTop: 80
    },
    iconContainer: {
        width: 110,
        height: 110,
        backgroundColor: Theme.colors.surface,
        borderRadius: 55,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        marginBottom: 30
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#4A433A", // Dark brown
        marginBottom: 10,
        textAlign: "center"
    },
    subtitle: {
        fontSize: 13,
        color: Theme.colors.textMuted,
        textAlign: "center",
        marginBottom: 40,
        lineHeight: 20
    },
    card: {
        backgroundColor: Theme.colors.surface,
        width: "100%",
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        borderWidth: 1,
        borderColor: "#EBE3D5"
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 15
    },
    label: {
        fontSize: 12,
        color: Theme.colors.textMuted
    },
    value: {
        fontSize: 13,
        fontWeight: "bold",
        color: Theme.colors.text
    },
    divider: {
        borderBottomWidth: 1,
        borderColor: "#EBE3D5",
        borderStyle: "dashed"
    },
    btn: {
        backgroundColor: Theme.colors.primary,
        width: "100%",
        paddingVertical: 16,
        borderRadius: 25,
        alignItems: "center",
        marginBottom: 20
    },
    btnText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "bold"
    }
});

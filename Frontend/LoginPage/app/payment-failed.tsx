import { View, Text, StyleSheet } from "react-native";

export default function PaymentFailed() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Pembayaran Gagal ❌</Text>
            <Text style={styles.desc}>
                Pembayaran tidak berhasil atau sudah kadaluarsa.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
    },
    desc: {
        marginTop: 10,
        color: "#666",
    },
});

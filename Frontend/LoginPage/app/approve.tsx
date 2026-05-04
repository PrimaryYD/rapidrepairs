import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { BASE_URL } from "../api";

export default function Approve() {

    const { orderId } = useLocalSearchParams();

    const handleApprove = async () => {
        try {
            const res = await fetch(`${BASE_URL}/technician/approve`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    order_id: orderId
                })
            });

            const data = await res.json();

            console.log("APPROVE RESPONSE:", data);

            Alert.alert("Success", data.message);

        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Gagal mencairkan dana");
        }
    };

    return (
        <View style={styles.container}>

            <Text style={styles.title}>Konfirmasi Pembayaran Teknisi</Text>
            <Text style={styles.desc}>
                Pastikan pekerjaan sudah selesai sebelum mencairkan dana
            </Text>

            <TouchableOpacity
                style={styles.button}
                onPress={handleApprove}
            >
                <Text style={{ color: "#fff" }}>
                    Approve & Cairkan Dana 💸
                </Text>
            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F6F2EA"
    },
    title: {
        fontWeight: "600",
        fontSize: 16
    },
    desc: {
        fontSize: 12,
        color: "#666",
        marginTop: 5,
        textAlign: "center"
    },
    button: {
        marginTop: 20,
        backgroundColor: "green",
        padding: 12,
        borderRadius: 20
    }
});

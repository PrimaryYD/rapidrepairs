import {  View, Text, StyleSheet, TouchableOpacity , ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function FoundScreen() {

    const router = useRouter();

    return (
    <SafeAreaView style={{flex:1}}>
      <ScrollView contentContainerStyle={{flexGrow:1}}>
      <View style={styles.container}>

            <View style={styles.card}>
                <Text style={styles.status}>Teknisi Dalam Perjalanan</Text>

                <Text style={styles.name}>Bapak Budi Santoso</Text>
                <Text style={styles.rating}>⭐ 4.8</Text>

                <View style={styles.serviceBox}>
                    <Text style={{ fontWeight: "600" }}>
                        Kunjungan & Pengecekan AC
                    </Text>
                    <Text style={{ fontSize: 12, color: "#666" }}>
                        Teknisi sedang menuju lokasi Anda
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.btn}
                    onPress={() => router.push("/pembayaran" as any)}
                >
                    <Text style={{ color: "#fff" }}>Lanjut</Text>
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
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#F6F2EA"
    },
    card: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 16
    },
    status: { fontSize: 12, color: "#666" },
    name: { fontSize: 16, fontWeight: "600", marginTop: 5 },
    rating: { fontSize: 12, marginBottom: 10 },
    serviceBox: {
        backgroundColor: "#F4F4F4",
        padding: 12,
        borderRadius: 12,
        marginTop: 10
    },
    btn: {
        backgroundColor: "#8B5E3C",
        padding: 14,
        borderRadius: 25,
        alignItems: "center",
        marginTop: 20
    }
});
import {  View, Text, StyleSheet, TouchableOpacity , ScrollView } from "react-native";
import { Theme } from "../constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function ReviewSuccess() {

    const router = useRouter();
    const { role } = useLocalSearchParams();

    const handleBackToHome = () => {
        if (role === "technician") {
            router.replace("/home-tech" as any);
        } else {
            router.replace("/Homepage" as any);
        }
    };

    return (
    <SafeAreaView style={{flex:1}}>
      <ScrollView contentContainerStyle={{flexGrow:1}}>
      <View style={styles.container}>

            <View style={styles.circle}>
                <Ionicons name="checkmark" size={30} color="#fff" />
            </View>

            <Text style={styles.title}>Penilaian Terkirim!</Text>

            <Text style={styles.desc}>
                Terima kasih atas feedback Anda.
            </Text>

            <TouchableOpacity
                style={styles.button}
                onPress={handleBackToHome}
            >
                <Text style={{ color: "#fff" }}>Kembali ke Beranda</Text>
            </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Theme.colors.background },
    circle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: "#4CAF50", justifyContent: "center", alignItems: "center"
    },
    title: { fontWeight: "600", marginTop: 10 },
    desc: { fontSize: 12, color: Theme.colors.textMuted, marginTop: 5 },
    button: {
        backgroundColor: Theme.colors.primary,
        padding: 12,
        borderRadius: 20,
        marginTop: 20
    }
});
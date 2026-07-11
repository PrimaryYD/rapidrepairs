import {  View, Text, TouchableOpacity, StyleSheet , ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function SelectRole() {
    const router = useRouter();
    const { mode } = useLocalSearchParams(); // login or register

    const goNext = (role: string) => {
        if (mode === "login") {
            router.push(`/login?role=${role}`);
        } else {
            router.push(`/register?role=${role}`);
        }
    };

    return (
    <SafeAreaView style={{flex:1}}>
      <ScrollView contentContainerStyle={{flexGrow:1}}>
      <View style={styles.container}>
            <Text style={styles.title}>Pilih Peran</Text>

            <TouchableOpacity
                style={styles.button}
                onPress={() => goNext("user")}
            >
                <Text style={styles.text}>Saya User</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.button}
                onPress={() => goNext("technician")}
            >
                <Text style={styles.text}>Saya Teknisi</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
        padding: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 30,
    },
    button: {
        width: "100%",
        maxWidth: 300,
        padding: 18,
        borderRadius: 30,
        backgroundColor: "#B3875E",
        marginBottom: 15,
        alignItems: "center",
    },
    text: {
        color: "white",
        fontWeight: "700",
    },
});
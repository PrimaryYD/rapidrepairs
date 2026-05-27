import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams, Redirect } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function Register() {
    const router = useRouter();
    const { role } = useLocalSearchParams();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [location, setLocation] = useState("");
    const [address, setAddress] = useState("");


    const handleNext = async () => {
        try {
            if (!name || !email) {
                alert("Isi semua data dulu");
                return;
            }

            // 👉 NO BACKEND ANYMORE

            // 🔥 pass data to next screen
            router.push({
                pathname: "/registerPassword",
                params: {
                    name,
                    email,
                    location,
                    address,
                },
            });

        } catch (err) {
            console.error("Register error:", err);
            alert("Terjadi error");
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Image
                source={require("../assets/Logo/2.png")}
                style={styles.logo}
                resizeMode="contain"
            />

            <View style={styles.card}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="chevron-back" size={20} color="#333" />
                    <Text style={styles.backText}>Kembali</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Buat Akun Baru</Text>
                <Text style={styles.subtitle}>
                    Buat akun baru untuk profile mu!
                </Text>

                <View style={styles.field}>
                    <Text style={styles.label}>Nama Lengkap</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Masukan nama anda"
                        placeholderTextColor="#CCC"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Cth: JohnDoe@gmail.com"
                        placeholderTextColor="#CCC"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Lokasi</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Masukan Kota/Kecamatan"
                        placeholderTextColor="#CCC"
                        value={location}
                        onChangeText={setLocation}
                    />
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Alamat Lengkap</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Masukan alamat lengkap"
                        placeholderTextColor="#CCC"
                        value={address}
                        onChangeText={setAddress}
                    />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleNext}>
                    <Text style={styles.buttonText}>Lanjut</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.footer}
                    onPress={() => router.push("/login")}
                >
                    <Text style={styles.footerText}>
                        Sudah punya Akun?{" "}
                        <Text style={styles.footerLink}>Login</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: "white",
        alignItems: "center",
        paddingTop: 60,
        paddingBottom: 40,
    },
    logo: {
        width: 140,
        height: 140,
        marginBottom: 40,
    },
    card: {
        width: "90%",
        maxWidth: 450,
        backgroundColor: "white",
        padding: 40,
        borderRadius: 30,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    backText: {
        color: "#333",
        fontSize: 14,
        marginLeft: 4,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: "#BBB",
        marginBottom: 35,
    },
    field: {
        marginBottom: 25,
        width: "100%",
    },
    label: {
        fontSize: 14,
        fontWeight: "700",
        marginBottom: 6,
    },
    input: {
        borderBottomWidth: 1,
        borderBottomColor: "#EEE",
        paddingVertical: 8,
        fontSize: 14,
    },
    button: {
        marginTop: 20,
        backgroundColor: "#B3875E",
        paddingVertical: 18,
        borderRadius: 35,
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
    },
    footer: {
        marginTop: 20,
        alignItems: "center",
    },
    footerText: {
        fontSize: 12,
        color: "#666",
    },
    footerLink: {
        fontWeight: "700",
        textDecorationLine: "underline",
    },
});
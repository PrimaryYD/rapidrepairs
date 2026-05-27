import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import LoginLoading from "./LoginLoading";

// 🔥 ADD THIS
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./_firebaseConfig";

export default function Login() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        try {
            setLoading(true);

            // 🔥 Firebase login
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            console.log("Login success:", userCredential.user.uid);

            // 👉 Navigate to admin page if user is admin, otherwise to homepage
            if (email.toLowerCase().trim() === "adminrapidrepairs@gmail.com") {
                router.replace("/approve");
            } else {
                router.push("/Homepage");
            }

        } catch (err: any) {
            console.error(err);
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <LoginLoading visible={loading} />

            <ScrollView contentContainerStyle={styles.container}>
                {/* Logo */}
                <Image
                    source={require("../assets/Logo/2.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <View style={styles.card}>
                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="chevron-back" size={20} color="#333" />
                        <Text style={styles.backText}>Kembali</Text>
                    </TouchableOpacity>

                    {/* Header */}
                    <Text style={styles.title}>Masuk ke Akun</Text>
                    <Text style={styles.subtitle}>
                        Gunakan email dan password untuk Login
                    </Text>

                    {/* Email */}
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

                    {/* Password */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Kata Sandi</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Masukan kata sandi anda"
                            placeholderTextColor="#CCC"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    {/* Button */}
                    <TouchableOpacity
                        style={[styles.button, loading && styles.disabledButton]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>Masuk</Text>
                    </TouchableOpacity>

                    {/* Footer */}
                    <TouchableOpacity
                        style={styles.footer}
                        onPress={() => router.push("/register")}
                    >
                        <Text style={styles.footerText}>
                            Belum punya Akun?{" "}
                            <Text style={styles.footerLink}>Daftar</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </>
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
        fontWeight: "400",
        marginLeft: 4,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#000",
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
        color: "#000",
    },
    input: {
        borderBottomWidth: 1,
        borderBottomColor: "#EEE",
        paddingVertical: 8,
        fontSize: 14,
        color: "#333",
    },
    button: {
        marginTop: 20,
        backgroundColor: "#B3875E",
        opacity: 0.8,
        paddingVertical: 18,
        borderRadius: 35,
        alignItems: "center",
        width: "100%",
    },
    disabledButton: {
        backgroundColor: "#D2B48C",
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
        color: "#333",
        textDecorationLine: "underline",
    },
});
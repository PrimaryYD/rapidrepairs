import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Image,
    ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

// 🔥 ADD FIREBASE
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./_firebaseConfig";
import { BASE_URL } from "../api";

export default function RegisterPassword() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { name, email, location, address } = params;

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleRegister = async () => {
        if (!email) {
            alert("Email missing");
            return;
        }

        if (!password || !confirmPassword) {
            alert("Isi semua field");
            return;
        }

        if (password !== confirmPassword) {
            alert("Password tidak sama");
            return;
        }

        if (password.length < 6) {
            alert("Password minimal 6 karakter");
            return;
        }

        setLoading(true);
        let createdUser: any = null;

        try {
            // 🔥 CREATE USER (Firebase Auth)
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email as string,
                password
            );

            createdUser = userCredential.user;
            const uid = createdUser.uid;

            console.log("User created:", uid);

            // 🔥 SAVE TO FIRESTORE VIA BACKEND (to avoid permission errors)
            console.log("Attempting to save profile via:", `${BASE_URL}/api/create-profile`);
            const response = await fetch(`${BASE_URL}/api/create-profile`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "bypass-tunnel-reminder": "true"
                },
                body: JSON.stringify({
                    uid,
                    name,
                    email,
                    location,
                    address
                }),
            });

            if (!response.ok) {
                let errorMsg = "Gagal membuat profile";
                try {
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.includes("application/json")) {
                        const errorData = await response.json();
                        errorMsg = errorData.error || errorMsg;
                    } else {
                        const text = await response.text();
                        if (text.includes("502") || text.includes("Bad Gateway") || text.includes("tunnel")) {
                            errorMsg = "Backend server tidak merespon (502 Bad Gateway). Pastikan localtunnel / server backend Anda sudah berjalan.";
                        } else {
                            errorMsg = text.substring(0, 150) || errorMsg;
                        }
                    }
                } catch (parseErr) {
                    errorMsg = `Gagal membuat profile (HTTP ${response.status})`;
                }
                throw new Error(errorMsg);
            }

            console.log("User profile saved successfully via Backend");

            setSuccess(true);

        } catch (error: any) {
            console.error("Register error:", error);
            
            let errorMsg = error.message;
            if (error.message === "Network request failed") {
                errorMsg = "Gagal terhubung ke server. Pastikan IP di api.js sudah benar, server sudah jalan, dan localtunnel aktif.";
            } else if (error.message && error.message.includes("JSON Parse error")) {
                errorMsg = "Gagal memproses respon server. Pastikan localtunnel / server backend Anda sudah aktif.";
            }

            // 🔥 CLEANUP: If user was created in Auth but profile failed, delete it
            // This allows the user to retry with the same email.
            if (createdUser && error.code !== "auth/email-already-in-use") {
                try {
                    await createdUser.delete();
                    console.log("Cleanup: Deleted half-created user from Auth");
                } catch (deleteErr) {
                    console.error("Cleanup failed:", deleteErr);
                }
            }

            alert(errorMsg);
        } finally {
            setLoading(false);
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
                {success ? (
                    <View style={styles.successContainer}>
                        <Text style={[styles.title, { textAlign: "center" }]}>
                            🎉 Berhasil !
                        </Text>
                        <Text style={[styles.subtitle, { textAlign: "center" }]}>
                            Akun anda telah dibuat. Silahkan Login kembali!
                        </Text>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => router.replace("/login")}
                        >
                            <Text style={styles.buttonText}>Login</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="chevron-back" size={20} color="#333" />
                            <Text style={styles.backText}>Kembali</Text>
                        </TouchableOpacity>

                        <Text style={styles.title}>Buat Kata Sandi</Text>
                        <Text style={styles.subtitle}>
                            Buat kata sandi untuk Akunmu!
                        </Text>

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

                        <View style={styles.field}>
                            <Text style={styles.label}>Konfirmasi Kata Sandi</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Konfirmasi kata sandi anda"
                                placeholderTextColor="#CCC"
                                secureTextEntry
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.disabledButton]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    Daftar Akun
                                </Text>
                            )}
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
                    </>
                )}
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
        marginTop: 100,
    },
    successContainer: {
        justifyContent: "center",
        paddingVertical: 20,
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
    },
    button: {
        marginTop: 20,
        backgroundColor: "#B3875E",
        paddingVertical: 18,
        borderRadius: 35,
        alignItems: "center",
    },
    disabledButton: {
        backgroundColor: "#D2B48C",
    },
    buttonText: {
        color: "white",
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
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    ScrollView,
    Animated,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";

// ADD FIREBASE
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./_firebaseConfig";
import { BASE_URL } from "../api";

import { Theme } from "../constants/theme";
import AnimatedButton from "../components/ui/AnimatedButton";
import { useCustomAlert } from "../components/ui/GlobalAlertProvider";

export default function RegisterPassword() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { name, email, location, address, role } = params;
    const { showAlert } = useCustomAlert();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;
    const successScale = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                friction: 8,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    useEffect(() => {
        if (success) {
            Animated.spring(successScale, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            }).start();
        }
    }, [success]);

    const handleRegister = async () => {
        if (!email) {
            showAlert({ title: "Error", message: "Email missing from previous screen", type: "error" });
            return;
        }

        if (!password || !confirmPassword) {
            showAlert({ title: "Data Tidak Lengkap", message: "Harap isi semua kolom kata sandi.", type: "warning" });
            return;
        }

        if (password !== confirmPassword) {
            showAlert({ title: "Kata Sandi Berbeda", message: "Konfirmasi kata sandi tidak cocok.", type: "error" });
            return;
        }

        if (password.length < 6) {
            showAlert({ title: "Kata Sandi Lemah", message: "Kata sandi minimal harus 6 karakter.", type: "warning" });
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

            // 🔥 CLEANUP
            if (createdUser && error.code !== "auth/email-already-in-use") {
                try {
                    await createdUser.delete();
                    console.log("Cleanup: Deleted half-created user from Auth");
                } catch (deleteErr) {
                    console.error("Cleanup failed:", deleteErr);
                }
            }

            showAlert({ title: "Registrasi Gagal", message: errorMsg, type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Image
                    source={require("../assets/Logo/2.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY }] }]}>
                    {success ? (
                        <Animated.View style={[styles.successContainer, { transform: [{ scale: successScale }] }]}>
                            <Ionicons name="checkmark-circle" size={80} color={Theme.colors.success} style={{ alignSelf: 'center', marginBottom: 16 }} />
                            <Text style={[styles.title, { textAlign: "center" }]}>
                                🎉 Berhasil !
                            </Text>
                            <Text style={[styles.subtitle, { textAlign: "center" }]}>
                                {role === "technician" 
                                    ? "Akun anda telah dibuat. Lanjutkan pendaftaran sebagai Teknisi!" 
                                    : "Akun anda telah dibuat. Silahkan Login kembali!"}
                            </Text>

                            <AnimatedButton
                                title={role === "technician" ? "Lanjut Daftar Teknisi" : "Menuju Login"}
                                onPress={() => {
                                    if (role === "technician") {
                                        router.replace("/register-technician");
                                    } else {
                                        router.replace("/login");
                                    }
                                }}
                                style={styles.button}
                            />
                        </Animated.View>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => router.back()}
                            >
                                <Ionicons name="chevron-back" size={20} color={Theme.colors.textMuted} />
                                <Text style={styles.backText}>Kembali</Text>
                            </TouchableOpacity>

                            <Text style={styles.title}>Buat Kata Sandi</Text>
                            <Text style={styles.subtitle}>
                                Amankan akunmu dengan kata sandi yang kuat
                            </Text>

                            <View style={styles.field}>
                                <Text style={styles.label}>Kata Sandi</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="lock-closed-outline" size={20} color={Theme.colors.textMuted} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Masukan kata sandi anda"
                                        placeholderTextColor={Theme.colors.textMuted}
                                        secureTextEntry
                                        value={password}
                                        onChangeText={setPassword}
                                    />
                                </View>
                            </View>

                            <View style={styles.field}>
                                <Text style={styles.label}>Konfirmasi Kata Sandi</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="shield-checkmark-outline" size={20} color={Theme.colors.textMuted} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Konfirmasi kata sandi anda"
                                        placeholderTextColor={Theme.colors.textMuted}
                                        secureTextEntry
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                    />
                                </View>
                            </View>

                            <AnimatedButton
                                title="Selesaikan Pendaftaran"
                                onPress={handleRegister}
                                isLoading={loading}
                                style={styles.button}
                            />

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Sudah punya Akun? </Text>
                                <TouchableOpacity onPress={() => router.push("/login")}>
                                    <Text style={styles.footerLink}>Login</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: "center",
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: Theme.spacing.lg,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: Theme.spacing.xl,
    },
    card: {
        width: "100%",
        maxWidth: 450,
        backgroundColor: Theme.colors.surface,
        padding: Theme.spacing.xl,
        borderRadius: Theme.radius.xl,
        ...Theme.shadows.md,
    },
    successContainer: {
        justifyContent: "center",
        paddingVertical: Theme.spacing.lg,
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: Theme.spacing.md,
        alignSelf: "flex-start",
    },
    backText: {
        color: Theme.colors.textMuted,
        fontSize: 14,
        fontWeight: "500",
        marginLeft: 4,
    },
    title: {
        ...Theme.typography.h2,
        color: Theme.colors.primaryDark,
        marginBottom: Theme.spacing.xs,
    },
    subtitle: {
        ...Theme.typography.body,
        color: Theme.colors.textMuted,
        marginBottom: Theme.spacing.xl,
    },
    field: {
        marginBottom: Theme.spacing.lg,
        width: "100%",
    },
    label: {
        ...Theme.typography.subtitle,
        color: Theme.colors.text,
        marginBottom: Theme.spacing.sm,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Theme.colors.inputBg,
        borderRadius: Theme.radius.md,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        paddingHorizontal: Theme.spacing.md,
    },
    inputIcon: {
        marginRight: Theme.spacing.sm,
    },
    input: {
        flex: 1,
        height: 50,
        ...Theme.typography.body,
        color: Theme.colors.text,
    },
    button: {
        marginTop: Theme.spacing.md,
    },
    footer: {
        marginTop: Theme.spacing.xl,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    footerText: {
        ...Theme.typography.body,
        color: Theme.colors.textMuted,
    },
    footerLink: {
        ...Theme.typography.body,
        color: Theme.colors.primary,
        fontWeight: "700",
    },
});
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    ScrollView,
    Animated,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import LoginLoading from "./LoginLoading";

import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./_firebaseConfig";
import { BASE_URL } from "../api";

import { Theme } from "../constants/theme";
import AnimatedButton from "../components/ui/AnimatedButton";
import { useCustomAlert } from "../components/ui/GlobalAlertProvider";

export default function Login() {
    const router = useRouter();
    const { showAlert } = useCustomAlert();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

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

    const handleForgotPassword = async () => {
        if (!email.trim()) {
            showAlert({
                title: "Masukkan Email",
                message: "Silakan masukkan alamat email Anda terlebih dahulu di kolom email untuk melakukan reset password.",
                type: "warning"
            });
            return;
        }
        setLoading(true);
        try {
            const emailClean = email.trim().toLowerCase();
            
            const response = await fetch(`${BASE_URL}/api/auth/check-email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "bypass-tunnel-reminder": "true"
                },
                body: JSON.stringify({ email: emailClean })
            });

            if (!response.ok) {
                throw new Error("Gagal memeriksa status email.");
            }

            const checkRes = await response.json();

            if (!checkRes.registered) {
                setLoading(false);
                setTimeout(() => {
                    showAlert({
                        title: "Email Tidak Terdaftar",
                        message: `Alamat email ${emailClean} belum terdaftar di Rapid Repairs. Silakan daftar (sign up) terlebih dahulu.`,
                        type: "warning"
                    });
                }, 300);
                return;
            }

            await sendPasswordResetEmail(auth, emailClean);
            setLoading(false);
            setTimeout(() => {
                showAlert({
                    title: "Reset Password Terkirim",
                    message: `Email pemulihan kata sandi telah dikirim ke ${emailClean}. Silakan periksa kotak masuk atau spam email Anda.`,
                    type: "success"
                });
            }, 300);

        } catch (err: any) {
            console.log("Forgot password error:", err.message);
            setLoading(false);
            setTimeout(() => {
                showAlert({
                    title: "Gagal Reset Password",
                    message: err.message,
                    type: "error"
                });
            }, 300);
        }
    };

    const handleLogin = async () => {
        try {
            setLoading(true);

            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            console.log("Login success:", userCredential.user.uid);

            if (email.toLowerCase().trim() === "adminrapidrepairs@gmail.com") {
                router.replace("/approve");
            } else {
                router.replace("/Homepage" as any);
            }

        } catch (err: any) {
            console.log("Login error:", err.message);
            
            const emailClean = email.trim().toLowerCase();
            
            if (err.code === "auth/invalid-email") {
                setLoading(false);
                setTimeout(() => {
                    showAlert({ title: "Login Gagal", message: "Format email tidak valid.", type: "error" });
                }, 300);
                return;
            }
            if (err.code === "auth/network-request-failed") {
                setLoading(false);
                setTimeout(() => {
                    showAlert({ title: "Login Gagal", message: "Koneksi internet bermasalah. Silakan coba lagi.", type: "error" });
                }, 300);
                return;
            }

            try {
                const response = await fetch(`${BASE_URL}/api/auth/check-email`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "bypass-tunnel-reminder": "true"
                    },
                    body: JSON.stringify({ email: emailClean })
                });

                if (!response.ok) {
                    throw new Error("Gagal memeriksa email");
                }

                const checkRes = await response.json();

                setLoading(false);
                setTimeout(() => {
                    if (!checkRes.registered) {
                        showAlert({ 
                            title: "Email Tidak Terdaftar", 
                            message: `Alamat email ${emailClean} belum terdaftar di Rapid Repairs. Silakan daftar (sign up) terlebih dahulu.`, 
                            type: "warning" 
                        });
                    } else {
                        showAlert({ title: "Login Gagal", message: "Password salah.", type: "error" });
                    }
                }, 300);
            } catch (checkErr) {
                setLoading(false);
                setTimeout(() => {
                    showAlert({ title: "Login Gagal", message: "Email atau password salah.", type: "error" });
                }, 300);
            }
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <LoginLoading visible={loading} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Image
                    source={require("../assets/Logo/2.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY }] }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.push("/welcome")}
                    >
                        <Ionicons name="chevron-back" size={20} color={Theme.colors.textMuted} />
                        <Text style={styles.backText}>Kembali</Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>Masuk ke Akun</Text>
                    <Text style={styles.subtitle}>
                        Gunakan email dan password untuk Login
                    </Text>

                    <View style={styles.field}>
                        <Text style={styles.label}>Email</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color={Theme.colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Cth: JohnDoe@gmail.com"
                                placeholderTextColor={Theme.colors.textMuted}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

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
                        <TouchableOpacity
                            style={styles.forgotBtn}
                            onPress={handleForgotPassword}
                        >
                            <Text style={styles.forgotText}>Lupa Kata Sandi?</Text>
                        </TouchableOpacity>
                    </View>

                    <AnimatedButton
                        title="Masuk"
                        onPress={handleLogin}
                        isLoading={loading}
                        style={styles.button}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Belum punya Akun? </Text>
                        <TouchableOpacity onPress={() => router.push("/select-role?mode=register")}>
                            <Text style={styles.footerLink}>Daftar</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
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
    forgotBtn: {
        alignSelf: "flex-end",
        marginTop: Theme.spacing.sm,
    },
    forgotText: {
        ...Theme.typography.caption,
        color: Theme.colors.primary,
        fontWeight: "600",
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
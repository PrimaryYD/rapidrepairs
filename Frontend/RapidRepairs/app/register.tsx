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
import { Theme } from "../constants/theme";
import AnimatedButton from "../components/ui/AnimatedButton";
import { useCustomAlert } from "../components/ui/GlobalAlertProvider";

export default function Register() {
    const router = useRouter();
    const { role } = useLocalSearchParams();
    const { showAlert } = useCustomAlert();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [location, setLocation] = useState("");
    const [address, setAddress] = useState("");
    
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

    const handleNext = async () => {
        try {
            if (!name || !email) {
                showAlert({
                    title: "Data Tidak Lengkap",
                    message: "Harap isi Nama Lengkap dan Email terlebih dahulu.",
                    type: "warning"
                });
                return;
            }

            if (!email.includes("@")) {
                showAlert({
                    title: "Format Email Salah",
                    message: "Format email tidak valid (harus mengandung '@').",
                    type: "warning"
                });
                return;
            }

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
            showAlert({
                title: "Terjadi Kesalahan",
                message: "Tidak dapat melanjutkan proses pendaftaran.",
                type: "error"
            });
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
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="chevron-back" size={20} color={Theme.colors.textMuted} />
                        <Text style={styles.backText}>Kembali</Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>Buat Akun Baru</Text>
                    <Text style={styles.subtitle}>
                        Buat akun baru untuk profile mu!
                    </Text>

                    <View style={styles.field}>
                        <Text style={styles.label}>Nama Lengkap</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color={Theme.colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Masukan nama anda"
                                placeholderTextColor={Theme.colors.textMuted}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>
                    </View>

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
                        <Text style={styles.label}>Lokasi</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="location-outline" size={20} color={Theme.colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Masukan Kota/Kecamatan"
                                placeholderTextColor={Theme.colors.textMuted}
                                value={location}
                                onChangeText={setLocation}
                            />
                        </View>
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Alamat Lengkap</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="home-outline" size={20} color={Theme.colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Masukan alamat lengkap"
                                placeholderTextColor={Theme.colors.textMuted}
                                value={address}
                                onChangeText={setAddress}
                            />
                        </View>
                    </View>

                    <AnimatedButton
                        title="Lanjut"
                        onPress={handleNext}
                        style={styles.button}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Sudah punya Akun? </Text>
                        <TouchableOpacity onPress={() => router.push("/login")}>
                            <Text style={styles.footerLink}>Login</Text>
                        </TouchableOpacity>
                    </View>
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
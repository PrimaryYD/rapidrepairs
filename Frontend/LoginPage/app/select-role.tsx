import { View, Text, StyleSheet, ScrollView, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useRef, useEffect } from "react";
import { Theme } from "../constants/theme";
import AnimatedButton from "../components/ui/AnimatedButton";
import { Ionicons } from "@expo/vector-icons";

export default function SelectRole() {
    const router = useRouter();
    const { mode } = useLocalSearchParams(); // login or register

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

    const goNext = (role: string) => {
        if (mode === "login") {
            router.push(`/login?role=${role}`);
        } else {
            router.push(`/register?role=${role}`);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY }] }]}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="people-circle-outline" size={80} color={Theme.colors.primary} />
                    </View>
                    
                    <Text style={styles.title}>Pilih Peran</Text>
                    <Text style={styles.subtitle}>
                        Bagaimana Anda ingin menggunakan aplikasi ini?
                    </Text>

                    <AnimatedButton
                        title="Saya User (Pelanggan)"
                        onPress={() => goNext("user")}
                        icon={<Ionicons name="person" size={20} color="white" />}
                        style={styles.button}
                    />

                    <AnimatedButton
                        title="Saya Teknisi (Mitra)"
                        onPress={() => goNext("technician")}
                        variant="secondary"
                        icon={<Ionicons name="construct" size={20} color="white" />}
                        style={styles.button}
                    />
                    
                    <AnimatedButton
                        title="Kembali"
                        onPress={() => router.back()}
                        variant="outline"
                        style={[styles.button, { marginTop: Theme.spacing.lg }]}
                    />
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: Theme.spacing.xl,
    },
    container: {
        width: "100%",
        maxWidth: 400,
        backgroundColor: Theme.colors.surface,
        padding: Theme.spacing.xl,
        borderRadius: Theme.radius.xl,
        alignItems: "center",
        ...Theme.shadows.md,
    },
    iconContainer: {
        marginBottom: Theme.spacing.lg,
    },
    title: {
        ...Theme.typography.h2,
        color: Theme.colors.primaryDark,
        marginBottom: Theme.spacing.sm,
    },
    subtitle: {
        ...Theme.typography.body,
        color: Theme.colors.textMuted,
        textAlign: "center",
        marginBottom: Theme.spacing.xxl,
    },
    button: {
        width: "100%",
        marginBottom: Theme.spacing.md,
    },
});
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../constants/theme";
import AnimatedButton from "../components/ui/AnimatedButton";
import { useRouter } from "expo-router";
import { auth, db } from "./_firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function LockoutTeknisi() {
    const router = useRouter();
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number; secs: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        const fetchLockout = async () => {
            const user = auth.currentUser;
            if (user) {
                const docSnap = await getDoc(doc(db, "users", user.uid));
                if (docSnap.exists() && docSnap.data().techLockoutUntil) {
                    const lockoutDate = new Date(docSnap.data().techLockoutUntil);
                    
                    const updateTimer = () => {
                        const now = new Date();
                        const diff = lockoutDate.getTime() - now.getTime();
                        
                        if (diff <= 0) {
                            setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
                            if (interval) clearInterval(interval);
                        } else {
                            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                            const secs = Math.floor((diff % (1000 * 60)) / 1000);
                            setTimeLeft({ days, hours, mins, secs });
                        }
                    };

                    updateTimer(); // Initial call
                    interval = setInterval(updateTimer, 1000);
                }
            }
            setLoading(false);
        };
        fetchLockout();

        return () => {
            if (interval) clearInterval(interval);
        };
    }, []);

    const formatTime = (val: number) => (val < 10 ? `0${val}` : val);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconCircle}>
                    <Ionicons name="lock-closed" size={50} color={Theme.colors.warning} />
                </View>

                <Text style={styles.title}>Pendaftaran Terkunci</Text>
                
                <View style={styles.messageCard}>
                    <Ionicons name="information-circle-outline" size={24} color={Theme.colors.primaryDark} style={{ marginBottom: 8 }} />
                    <Text style={styles.messageText}>
                        Maaf, Anda telah gagal Uji Kompetensi sebanyak 2 kali. Untuk menjaga kualitas layanan Rapid Repairs, Anda harus menunggu beberapa saat sebelum dapat mencoba kembali.
                    </Text>
                    <Text style={styles.suggestionText}>
                        Silahkan manfaatkan waktu ini untuk belajar dan mempersiapkan diri lebih baik.
                    </Text>
                </View>

                {loading ? (
                    <View style={styles.timerContainer}>
                        <ActivityIndicator size="small" color={Theme.colors.primary} />
                    </View>
                ) : timeLeft ? (
                    <View style={styles.timerContainer}>
                        <Text style={styles.timerTitle}>Anda dapat mendaftar lagi dalam:</Text>
                        <View style={styles.countdownBox}>
                            <View style={styles.timeBlock}>
                                <Text style={styles.timeValue}>{formatTime(timeLeft.days)}</Text>
                                <Text style={styles.timeLabel}>Hari</Text>
                            </View>
                            <Text style={styles.timeSeparator}>:</Text>
                            <View style={styles.timeBlock}>
                                <Text style={styles.timeValue}>{formatTime(timeLeft.hours)}</Text>
                                <Text style={styles.timeLabel}>Jam</Text>
                            </View>
                            <Text style={styles.timeSeparator}>:</Text>
                            <View style={styles.timeBlock}>
                                <Text style={styles.timeValue}>{formatTime(timeLeft.mins)}</Text>
                                <Text style={styles.timeLabel}>Menit</Text>
                            </View>
                            <Text style={styles.timeSeparator}>:</Text>
                            <View style={styles.timeBlock}>
                                <Text style={styles.timeValue}>{formatTime(timeLeft.secs)}</Text>
                                <Text style={styles.timeLabel}>Detik</Text>
                            </View>
                        </View>
                    </View>
                ) : null}
            </View>

            <View style={styles.footer}>
                <AnimatedButton
                    title="Kembali ke Beranda"
                    icon={<Ionicons name="home-outline" size={18} color="#FFF" />}
                    onPress={() => router.push("/Homepage")}
                    style={{ width: '100%' }}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    content: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Theme.colors.warning + '20', // 20% opacity
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    title: {
        ...Theme.typography.h2,
        color: Theme.colors.text,
        marginBottom: 20,
        textAlign: "center",
    },
    messageCard: {
        backgroundColor: Theme.colors.surface,
        padding: 20,
        borderRadius: Theme.radius.lg,
        alignItems: "center",
        marginBottom: 30,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
    },
    messageText: {
        ...Theme.typography.body,
        color: Theme.colors.text,
        textAlign: "center",
        marginBottom: 10,
        lineHeight: 22,
    },
    suggestionText: {
        ...Theme.typography.caption,
        color: Theme.colors.textMuted,
        textAlign: "center",
        fontStyle: "italic",
    },
    timerContainer: {
        alignItems: "center",
        width: "100%",
    },
    timerTitle: {
        ...Theme.typography.body,
        fontWeight: "600",
        color: Theme.colors.primaryDark,
        marginBottom: 15,
    },
    countdownBox: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Theme.colors.surface,
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderRadius: Theme.radius.md,
        ...Theme.shadows.sm,
        width: '100%',
    },
    timeBlock: {
        alignItems: "center",
        width: 60,
    },
    timeValue: {
        fontSize: 28,
        fontWeight: "bold",
        color: Theme.colors.primary,
    },
    timeLabel: {
        fontSize: 12,
        color: Theme.colors.textMuted,
        marginTop: 4,
    },
    timeSeparator: {
        fontSize: 24,
        fontWeight: "bold",
        color: Theme.colors.border,
        paddingHorizontal: 5,
        paddingBottom: 15,
    },
    footer: {
        padding: 20,
        paddingBottom: 40, // Extra padding for safe area
    },
});

import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
    Animated,
    Easing,
    TextInput,
    KeyboardAvoidingView,
    Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./_firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../constants/theme";
import { useCustomAlert } from "../components/ui/GlobalAlertProvider";
import AnimatedButton from "../components/ui/AnimatedButton";
import { BASE_URL } from "../api";

export default function DoneScreen() {
    const router = useRouter();
    const { orderId } = useLocalSearchParams();
    
    const [order, setOrder] = useState<any>(null);
    const [techName, setTechName] = useState("Budi Santoso");
    const [techPhoto, setTechPhoto] = useState<string | null>(null);
    const [rating, setRating] = useState(0);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCustomReview, setShowCustomReview] = useState(false);
    const [customReviewText, setCustomReviewText] = useState("");

    const quickTags = ["Teknisi Cepat", "Kerja Rapi", "Responsif"];
    const { showAlert } = useCustomAlert();

    // Success Animations
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Trigger checkmark animations
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
        }).start();

        Animated.loop(
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            })
        ).start();

        const fetchDetails = async () => {
            if (!orderId) {
                setIsLoading(false);
                return;
            }

            try {
                const orderSnap = await getDoc(doc(db, "orders", orderId as string));
                if (orderSnap.exists()) {
                    const orderData = orderSnap.data();
                    setOrder(orderData);

                    if (orderData.technicianId) {
                        const techSnap = await getDoc(doc(db, "technicians", orderData.technicianId));
                        if (techSnap.exists()) {
                            const techData = techSnap.data();
                            setTechName(techData.name || "Budi Santoso");
                            
                            // Check if technician has a selfie photo to use as avatar
                            if (techData.selfiePhotos && techData.selfiePhotos.length > 0) {
                                let photoUrl = techData.selfiePhotos[0];
                                photoUrl = photoUrl.replace(/^http:\/\/[0-9.]+:\d+/, BASE_URL);
                                setTechPhoto(photoUrl);
                            }
                        }
                    }
                }
            } catch (err) {
                console.log("Error loading details in done screen:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [orderId]);

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(prev => prev.filter(t => t !== tag));
        } else {
            setSelectedTags(prev => [...prev, tag]);
        }
    };

    const handleSubmitReview = async () => {
        if (rating === 0) {
            showAlert({ title: "Penilaian Diperlukan", message: "Mohon pilih jumlah bintang terlebih dahulu.", type: "warning" });
            return;
        }
        setIsLoading(true);
        try {
            if (orderId) {
                await updateDoc(doc(db, "orders", orderId as string), {
                    techRating: rating,
                    techReviewTags: selectedTags,
                    techReviewComment: showCustomReview ? customReviewText : "",
                    techRated: true
                });
            }
            router.replace({
                pathname: "/review-success",
                params: { role: "user" }
            } as any);
        } catch (err) {
            console.log("Error saving technician rating:", err);
            showAlert({ title: "Kesalahan", message: "Gagal mengirim penilaian. Silakan coba lagi.", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#B3875E" />
                <Text style={styles.loadingText}>Memuat...</Text>
            </SafeAreaView>
        );
    }

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* 1. GREEN CHECKMARK SUCCESS HEADER */}
                <View style={styles.progressContainer}>
                    <View style={styles.pulseContainer}>
                        <Animated.View
                            style={[
                                styles.pulse,
                                {
                                    transform: [
                                        {
                                            scale: pulseAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [1, 2],
                                            }),
                                        },
                                    ],
                                    opacity: pulseAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.4, 0],
                                    }),
                                },
                            ]}
                        />
                        {/* DECORATIVE DOTS */}
                        <View style={[styles.decorDot, { top: -8, right: -8, backgroundColor: "#FFB300" }]} />
                        <View style={[styles.decorDot, { bottom: -8, left: -8, backgroundColor: "#1E88E5" }]} />

                        <Animated.View
                            style={[
                                styles.circle,
                                {
                                    transform: [{ scale: scaleAnim }],
                                },
                            ]}
                        >
                            <Ionicons name="checkmark-circle-outline" size={54} color="#2E7D32" />
                        </Animated.View>
                    </View>

                    <Text style={styles.title}>Pekerjaan Selesai!</Text>
                </View>

                {/* 2. OVERLAPPING TECHNICIAN FEEDBACK CARD */}
                <View style={styles.feedbackCard}>
                    
                    {/* AVATAR OVERLAP */}
                    <View style={styles.avatarWrapper}>
                        {techPhoto ? (
                            <Image source={{ uri: techPhoto }} style={styles.avatarImage} />
                        ) : (
                            <Ionicons name="person" size={40} color="#ccc" />
                        )}
                    </View>

                    {/* NAME AND SPECIALTY */}
                    <Text style={styles.techName}>{techName}</Text>
                    <Text style={styles.techSpec}>Spesialis A/C</Text>

                    <View style={styles.cardDivider} />

                    {/* CALL TO ACTION */}
                    <Text style={styles.feedbackHeading}>Kerja selesai! Beri nilai untuk Teknisi</Text>

                    {/* INTERACTIVE STAR RATING */}
                    <View style={styles.starRow}>
                        {[1, 2, 3, 4, 5].map((num) => (
                            <TouchableOpacity key={num} onPress={() => setRating(num)} activeOpacity={0.7}>
                                <Ionicons
                                    name={num <= rating ? "star" : "star-outline"}
                                    size={36}
                                    color={num <= rating ? "#FFB300" : "#D2C4B7"}
                                    style={{ marginHorizontal: 6 }}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* QUICK TAG PILLS */}
                    <View style={styles.tagRow}>
                        {quickTags.map((tag, idx) => {
                            const isSelected = selectedTags.includes(tag);
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={[styles.tagPill, isSelected && styles.tagPillSelected]}
                                    onPress={() => toggleTag(tag)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                                        {tag}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                        {/* Lainnya button */}
                        <TouchableOpacity
                            style={[styles.tagPill, showCustomReview && styles.tagPillSelected]}
                            onPress={() => setShowCustomReview(!showCustomReview)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.tagText, showCustomReview && styles.tagTextSelected]}>
                                Lainnya
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* EDITABLE REVIEW COMMENT */}
                    {showCustomReview && (
                        <View style={styles.customReviewContainer}>
                            <TextInput
                                style={styles.customReviewInput}
                                placeholder="Tulis kritik atau saran Anda di sini..."
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={4}
                                value={customReviewText}
                                onChangeText={setCustomReviewText}
                            />
                        </View>
                    )}

                    {/* SUBMIT BUTTON */}
                    <AnimatedButton
                        title="Kirim Penilaian"
                        onPress={handleSubmitReview}
                        style={{ width: '100%' }}
                    />

                </View>

            </ScrollView>
        </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: Theme.colors.background,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 15,
        fontSize: 14,
        color: Theme.colors.primary,
        fontWeight: "600",
    },
    scrollContent: {
        padding: 24,
        alignItems: "center",
        paddingBottom: 50,
    },
    progressContainer: {
        alignItems: "center",
        marginTop: 20,
        marginBottom: 30,
    },
    pulseContainer: {
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
        position: "relative",
    },
    pulse: {
        position: "absolute",
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: "#E8F5E9",
    },
    circle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#E8F5E9",
        borderWidth: 2,
        borderColor: "#C8E6C9",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2,
    },
    decorDot: {
        position: "absolute",
        width: 12,
        height: 12,
        borderRadius: 6,
        zIndex: 3,
    },
    title: {
        fontSize: 22,
        fontWeight: "900",
        color: Theme.colors.text,
        textAlign: "center",
    },
    feedbackCard: {
        backgroundColor: Theme.colors.surface,
        borderRadius: 30,
        width: "100%",
        paddingHorizontal: 20,
        paddingBottom: 24,
        paddingTop: 55,
        alignItems: "center",
        marginTop: 45,
        borderWidth: 1.5,
        borderColor: Theme.colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    avatarWrapper: {
        width: 86,
        height: 86,
        borderRadius: 43,
        backgroundColor: Theme.colors.background,
        borderWidth: 4,
        borderColor: Theme.colors.surface,
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        top: -43,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 4,
    },
    avatarImage: {
        width: "100%",
        height: "100%",
        borderRadius: 40,
    },
    techName: {
        fontSize: 18,
        fontWeight: "800",
        color: Theme.colors.text,
    },
    techSpec: {
        fontSize: 12,
        color: Theme.colors.primary,
        fontWeight: "600",
        marginTop: 4,
    },
    cardDivider: {
        height: 1,
        backgroundColor: Theme.colors.border,
        width: "100%",
        marginVertical: 20,
    },
    feedbackHeading: {
        fontSize: 14,
        fontWeight: "800",
        color: Theme.colors.text,
        marginBottom: 15,
    },
    starRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 25,
    },
    tagRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 10,
        marginBottom: 20,
    },
    customReviewContainer: {
        width: "100%",
        marginBottom: 20,
    },
    customReviewInput: {
        width: "100%",
        minHeight: 100,
        backgroundColor: Theme.colors.background,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        color: Theme.colors.text,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        textAlignVertical: "top",
    },
    tagPill: {
        backgroundColor: Theme.colors.surface,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    tagPillSelected: {
        backgroundColor: Theme.colors.background,
        borderColor: Theme.colors.primary,
    },
    tagText: {
        fontSize: 12,
        color: Theme.colors.textMuted,
        fontWeight: "600",
    },
    tagTextSelected: {
        color: Theme.colors.primary,
        fontWeight: "700",
    },
    submitBtn: {
        backgroundColor: Theme.colors.primary,
        width: "100%",
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: "center",
    },
    submitBtnText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
    },
});
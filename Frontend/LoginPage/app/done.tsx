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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./_firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

export default function DoneScreen() {
    const router = useRouter();
    const { orderId } = useLocalSearchParams();
    
    const [order, setOrder] = useState<any>(null);
    const [techName, setTechName] = useState("Budi Santoso");
    const [techPhoto, setTechPhoto] = useState<string | null>(null);
    const [rating, setRating] = useState(0);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const quickTags = ["Pelanggan Ramah", "Sesuai Titik Maps", "Responsif"];

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
                                setTechPhoto(techData.selfiePhotos[0]);
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

    const handleSubmitReview = () => {
        // In a real app, save the review (rating & tags) to Firestore order / reviews collection
        router.push("/review-success" as any);
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
                    <Text style={styles.techName}>Bapak {techName}</Text>
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
                    </View>

                    {/* SUBMIT BUTTON */}
                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitReview}>
                        <Text style={styles.submitBtnText}>Kirim Penilaian</Text>
                    </TouchableOpacity>

                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FAF6F0",
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: "#FAF6F0",
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 15,
        fontSize: 14,
        color: "#B3875E",
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
        color: "#333",
        textAlign: "center",
    },
    feedbackCard: {
        backgroundColor: "#fff",
        borderRadius: 30,
        width: "100%",
        paddingHorizontal: 20,
        paddingBottom: 24,
        paddingTop: 55,
        alignItems: "center",
        marginTop: 45,
        borderWidth: 1.5,
        borderColor: "#F0EFEB",
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
        backgroundColor: "#FAF6F0",
        borderWidth: 4,
        borderColor: "#fff",
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
        color: "#333",
    },
    techSpec: {
        fontSize: 12,
        color: "#B3875E",
        fontWeight: "600",
        marginTop: 4,
    },
    cardDivider: {
        height: 1,
        backgroundColor: "#F2EBE5",
        width: "100%",
        marginVertical: 20,
    },
    feedbackHeading: {
        fontSize: 14,
        fontWeight: "800",
        color: "#333",
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
        marginBottom: 35,
    },
    tagPill: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#EAE6DF",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    tagPillSelected: {
        backgroundColor: "#FAF6F0",
        borderColor: "#B3875E",
    },
    tagText: {
        fontSize: 12,
        color: "#666",
        fontWeight: "600",
    },
    tagTextSelected: {
        color: "#B3875E",
        fontWeight: "700",
    },
    submitBtn: {
        backgroundColor: "#B3875E",
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
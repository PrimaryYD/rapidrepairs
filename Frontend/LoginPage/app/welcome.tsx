import { View, Text, StyleSheet, Animated, Dimensions, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { Theme } from "../constants/theme";
import AnimatedButton from "../components/ui/AnimatedButton";

const { width } = Dimensions.get("window");
const IMAGES = [
    require("../assets/Splash Screen/3.png"),
    require("../assets/Splash Screen/4.png"),
    require("../assets/Splash Screen/5.png"),
    require("../assets/Splash Screen/6.png")
];

export default function WelcomeWeb() {
    const router = useRouter();
    const [activeIndex, setActiveIndex] = useState(0);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Initial fade in for content
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();

        const interval = setInterval(() => {
            const nextIndex = (activeIndex + 1) % IMAGES.length;

            Animated.timing(slideAnim, {
                toValue: -1,
                duration: 600,
                useNativeDriver: true,
            }).start(() => {
                setActiveIndex(nextIndex);
                slideAnim.setValue(1);

                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 8,
                    useNativeDriver: true,
                }).start();
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [activeIndex]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Animated.View style={[styles.screen, { opacity: fadeAnim }]}>
                    <View style={styles.content}>
                        <Image
                            source={require("../assets/Logo/2.png")}
                            style={styles.logo}
                            resizeMode="contain"
                        />

                        <View style={styles.sliderContainer}>
                            <Animated.Image
                                source={IMAGES[activeIndex]}
                                style={[
                                    styles.image,
                                    {
                                        transform: [{
                                            translateX: slideAnim.interpolate({
                                                inputRange: [-1, 0, 1],
                                                outputRange: [-width, 0, width],
                                            })
                                        }]
                                    }
                                ]}
                                resizeMode="contain"
                            />
                        </View>

                        <View style={styles.dotsContainer}>
                            {IMAGES.map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.dot,
                                        activeIndex === i ? styles.activeDot : null
                                    ]}
                                />
                            ))}
                        </View>

                        <View style={styles.textContainer}>
                            <Text style={styles.title}>
                                Selamat Datang di Rapid Repairs!
                            </Text>
                            <Text style={styles.subtitle}>
                                Solusi instan untuk setiap keluhan dan kerusakan di rumahmu.
                            </Text>
                        </View>

                        <View style={styles.buttonContainer}>
                            <AnimatedButton
                                title="Masuk"
                                onPress={() => router.push("/login" as any)}
                                style={styles.primaryButton}
                            />
                            <AnimatedButton
                                title="Daftar Baru"
                                onPress={() => router.push("/select-role" as any)}
                                variant="outline"
                            />
                        </View>
                    </View>
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
    },
    screen: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.xxl,
    },
    content: {
        width: "100%",
        maxWidth: 400,
        alignItems: "center",
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: Theme.spacing.xl,
    },
    sliderContainer: {
        width: '100%',
        height: 280,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
    },
    image: {
        width: '100%',
        height: '100%',
    },
    dotsContainer: {
        flexDirection: "row",
        marginVertical: Theme.spacing.lg,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Theme.colors.border,
        marginHorizontal: 4,
    },
    activeDot: {
        width: 24,
        backgroundColor: Theme.colors.primary,
    },
    textContainer: {
        alignItems: "center",
        marginBottom: Theme.spacing.xl,
    },
    title: {
        ...Theme.typography.h2,
        textAlign: "center",
        marginBottom: Theme.spacing.sm,
        color: Theme.colors.primaryDark,
    },
    subtitle: {
        ...Theme.typography.body,
        color: Theme.colors.textMuted,
        textAlign: "center",
        lineHeight: 22,
        paddingHorizontal: Theme.spacing.md,
    },
    buttonContainer: {
        width: "100%",
        gap: Theme.spacing.md,
    },
    primaryButton: {
        marginBottom: Theme.spacing.sm,
    },
});
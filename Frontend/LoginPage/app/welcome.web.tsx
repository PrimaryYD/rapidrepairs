import {  View, Text, TouchableOpacity, Image, StyleSheet, Animated, Dimensions , ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";

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

    useEffect(() => {
        const interval = setInterval(() => {
            const nextIndex = (activeIndex + 1) % IMAGES.length;

            // Slide out to the left
            Animated.timing(slideAnim, {
                toValue: -1, // Normalized movement
                duration: 600,
                useNativeDriver: true,
            }).start(() => {
                // Instantly teleport back to the right but keep it hidden
                setActiveIndex(nextIndex);
                slideAnim.setValue(1);

                // Slide in from the right
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 8,
                    useNativeDriver: true,
                }).start();
            });
        }, 2500); // 2 seconds + some transition time

        return () => clearInterval(interval);
    }, [activeIndex]);

    return (
    <SafeAreaView style={{flex:1}}>
      <ScrollView contentContainerStyle={{flexGrow:1}}>
      <View style={styles.screen}>

            {/* Main Content (No Box) */}
            <View style={styles.content}>
                {/* Logo */}
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
                                        outputRange: [-400, 0, 400], // Maps normalized to pixels
                                    })
                                }]
                            }
                        ]}
                        resizeMode="contain"
                    />
                </View>

                {/* Pagination Dots */}
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
                        Selamat datang di Rapid Repairs!
                    </Text>

                    <Text style={styles.subtitle}>
                        Solusi instan untuk setiap drama kerusakan di rumahmu.
                    </Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.push("/select-role?mode=login" as any)}
                    >
                        <Text style={styles.primaryText}>Login</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => router.push("/select-role?mode=register" as any)}
                    >
                        <Text style={styles.secondaryText}>Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    screen: {
        flex: 1,
        backgroundColor: "white",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },

    content: {
        width: "100%",
        maxWidth: 600,
        alignItems: "center",
        marginTop: -60, // Slight adjustment for balance
    },

    logo: {
        width: 140,
        height: 140,
        marginBottom: 30, // Brought it closer to the image
    },

    sliderContainer: {
        width: 380,
        height: 320,
        overflow: "hidden", // Important for "off screen" effect
        alignItems: "center",
        justifyContent: "center",
    },

    image: {
        width: 320,
        height: 320,
    },

    dotsContainer: {
        flexDirection: "row",
        marginBottom: 30,
        marginTop: 10,
    },

    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#E0E0E0",
        marginHorizontal: 5,
    },

    activeDot: {
        backgroundColor: "#B3875E",
    },

    textContainer: {
        alignItems: "center",
        marginBottom: 40,
    },

    title: {
        fontSize: 18,
        fontWeight: "800",
        marginBottom: 4, // Closer to subtitle
        textAlign: "center",
        color: "#000",
    },

    subtitle: {
        fontSize: 18,
        color: "#555",
        textAlign: "center",
        lineHeight: 26,
        maxWidth: 450,
    },

    buttonContainer: {
        width: "100%",
        maxWidth: 380,
    },

    primaryButton: {
        width: "100%",
        backgroundColor: "#B3875E",
        paddingVertical: 18,
        borderRadius: 35,
        alignItems: "center",
        marginBottom: 20,
        shadowColor: "#B3875E",
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },

    primaryText: {
        color: "white",
        fontWeight: "700",
        fontSize: 18,
    },

    secondaryButton: {
        width: "100%",
        borderWidth: 2,
        borderColor: "#B3875E",
        paddingVertical: 18,
        borderRadius: 35,
        alignItems: "center",
    },

    secondaryText: {
        color: "#B3875E",
        fontWeight: "700",
        fontSize: 18,
    },
});
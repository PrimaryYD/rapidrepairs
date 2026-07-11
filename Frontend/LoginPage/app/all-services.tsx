import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useEffect } from "react";
import { Theme } from "../constants/theme";

export default function AllServices() {
    const router = useRouter();

    const services = [
        { name: "Kulkas", image: require("../assets/images/freezer.png") },
        { name: "AC", image: require("../assets/images/ac.png") },
        { name: "Mesin Cuci", image: require("../assets/images/washing.png") },
        { name: "Kipas Angin", image: require("../assets/images/fan.png") },
        { name: "Furniture", image: require("../assets/images/furnitur.png") },
        { name: "TV", image: require("../assets/images/tv.png") },
        { name: "Elektronik", image: require("../assets/images/elektronik.png") },
    ];

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                friction: 8,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="chevron-back" size={24} color={Theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Semua Layanan</Text>
                </View>

                <Animated.View style={[styles.grid, { opacity: fadeAnim, transform: [{ translateY }] }]}>
                    {services.map((item, index) => {
                        const isAC = item.name === "AC";
                        return (
                            <TouchableOpacity
                                key={index}
                                style={styles.card}
                                activeOpacity={0.7}
                                onPress={() => {
                                    if (isAC) {
                                        router.push("/ac-services");
                                    }
                                }}
                            >
                                <View style={styles.iconWrapper}>
                                    <Image
                                        source={item.image}
                                        style={styles.serviceImage}
                                    />
                                </View>
                                <Text style={styles.text} numberOfLines={2}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
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
        padding: Theme.spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Theme.spacing.xl,
        marginTop: Theme.spacing.sm,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...Theme.shadows.sm,
        marginRight: Theme.spacing.md,
    },
    title: {
        ...Theme.typography.h2,
        color: Theme.colors.text,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        backgroundColor: Theme.colors.surface,
        padding: Theme.spacing.lg,
        borderRadius: Theme.radius.xl,
        ...Theme.shadows.md,
    },
    card: {
        width: "30%",
        alignItems: "center",
        marginBottom: Theme.spacing.lg,
    },
    iconWrapper: {
        width: 70,
        height: 70,
        backgroundColor: Theme.colors.inputBg,
        borderRadius: Theme.radius.lg,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: Theme.spacing.sm,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
    },
    serviceImage: {
        width: 36,
        height: 36,
        resizeMode: "contain",
    },
    text: {
        ...Theme.typography.caption,
        color: Theme.colors.text,
        textAlign: "center",
        fontWeight: "600",
    },
});
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
    ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";

import { db } from "./_firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

export default function PaymentSuccess() {

    const router = useRouter();
    const params = useLocalSearchParams(); // 🔥 ambil data dari deeplink

    const orderId = params.order_id || "-";

    /* 🔥 ANIMATION */
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const setPaidStatus = async () => {
            if (orderId && orderId !== "-") {
                try {
                    await updateDoc(doc(db, "orders", orderId as string), {
                        status: "paid"
                    });
                    console.log("Firestore order status updated to paid");
                } catch (e) {
                    console.warn("Failed to update status to paid:", e);
                }
            }
        };
        setPaidStatus();
    }, [orderId]);

    useEffect(() => {

        // SCALE POP
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true
        }).start();

        // PULSE LOOP
        Animated.loop(
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true
            })
        ).start();

        // 🔥 DEBUG (optional)
        console.log("PARAMS DARI MIDTRANS:", params);

    }, []);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View style={styles.container}>

                    {/* 🔥 PULSE WRAPPER */}
                    <View style={styles.pulseContainer}>

                        {/* PULSE */}
                        <Animated.View
                            style={[
                                styles.pulse,
                                {
                                    transform: [
                                        {
                                            scale: pulseAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [1, 2]
                                            })
                                        }
                                    ],
                                    opacity: pulseAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.4, 0]
                                    })
                                }
                            ]}
                        />

                        {/* ICON */}
                        <Animated.View
                            style={[
                                styles.circle,
                                {
                                    transform: [{ scale: scaleAnim }]
                                }
                            ]}
                        >
                            <Ionicons name="checkmark" size={30} color="#fff" />
                        </Animated.View>

                    </View>

                    <Text style={styles.title}>Pembayaran Berhasil!</Text>

                    <Text style={styles.desc}>
                        Teknisi akan segera melakukan perbaikan AC Anda.
                    </Text>

                    {/* 🔥 OPTIONAL INFO */}
                    <Text style={styles.orderId}>
                        Order ID: {orderId}
                    </Text>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.replace({
                            pathname: "/waiting" as any,
                            params: { orderId }
                        })}
                    >
                        <Text style={{ color: "#fff" }}>Lanjut</Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F6F2EA",
        padding: 20
    },

    pulseContainer: {
        justifyContent: "center",
        alignItems: "center"
    },

    pulse: {
        position: "absolute",
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#4CAF50"
    },

    circle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#4CAF50",
        justifyContent: "center",
        alignItems: "center"
    },

    title: {
        fontWeight: "600",
        fontSize: 16,
        marginTop: 15
    },

    desc: {
        fontSize: 12,
        color: "#666",
        textAlign: "center",
        marginTop: 5
    },

    orderId: {
        marginTop: 10,
        fontSize: 11,
        color: "#999"
    },

    button: {
        backgroundColor: "#8B5E3C",
        padding: 14,
        borderRadius: 25,
        marginTop: 25,
        width: "70%",
        alignItems: "center"
    }

});
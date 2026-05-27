import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Animated,
    Easing,
    ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// 🔥 FIREBASE
import { db } from "./_firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";

export default function SearchingScreen() {

    const router = useRouter();

    const [showModal, setShowModal] = useState(false);
    const [selected, setSelected] = useState("");

    const { orderId } = useLocalSearchParams();

    /* 🔥 PULSE ANIMATION */
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {

        // 🔁 LOOP ANIMATION
        Animated.loop(
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            })
        ).start();

        // ⏳ LISTENER STATUS ORDER
        if (orderId) {
            const unsub = onSnapshot(
                doc(db, "orders", orderId as string), 
                (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.status === "accepted") {
                            // 👉 Navigate to tracking page for customer
                            router.replace({
                                pathname: "/found" as any,
                                params: { orderId }
                            });
                        }
                    }
                },
                (error) => {
                    console.error("Error in searching snapshot listener:", error);
                }
            );
            return () => unsub();
        }

    }, [orderId]);

    const reasons = [
        "Waktu tunggu terlalu lama",
        "Berubah pikiran",
        "Salah memasukkan detail alamat",
        "Menemukan teknisi lain",
        "Lainnya"
    ];

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
                                                outputRange: [1, 2.5]
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

                        {/* CIRCLE UTAMA */}
                        <View style={styles.circleBig}>
                            <View style={styles.circleMid}>
                                <View style={styles.circleSmall}>
                                    <Ionicons name="hammer-outline" size={24} color="#8B5E3C" />
                                </View>
                            </View>
                        </View>

                    </View>

                    <Text style={styles.title}>Mencari Teknisi Terbaik</Text>

                    <Text style={styles.desc}>
                        Sedang mencocokkan Anda dengan{"\n"}teknisi terdekat untuk perbaikan cepat...
                    </Text>

                    <View style={styles.btnSearching}>
                        <Animated.View style={{ transform: [{ rotate: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }}>
                            <Ionicons name="reload" size={16} color="#8B5E3C" />
                        </Animated.View>
                        <Text style={styles.btnSearchingText}>Mencari Teknisi...</Text>
                    </View>

                    <TouchableOpacity onPress={() => setShowModal(true)}>
                        <Text style={styles.cancelText}>Batalkan Pencarian</Text>
                    </TouchableOpacity>

                    {/* 🔥 MODAL */}
                    <Modal
                        visible={showModal}
                        transparent
                        animationType="slide"
                    >
                        <View style={styles.modalOverlay}>

                            <View style={styles.modalContent}>

                                <Text style={styles.modalTitle}>Alasan Pembatalan</Text>

                                {reasons.map((item, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.option}
                                        onPress={() => setSelected(item)}
                                    >
                                        <View style={[
                                            styles.radio,
                                            selected === item && styles.radioActive
                                        ]} />

                                        <Text style={styles.optionText}>{item}</Text>
                                    </TouchableOpacity>
                                ))}

                                <TouchableOpacity
                                    style={styles.confirmBtn}
                                    onPress={() => {
                                        setShowModal(false);
                                        router.replace("/ac-services" as any);
                                    }}
                                >
                                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                                        Konfirmasi Batal
                                    </Text>
                                </TouchableOpacity>

                            </View>

                        </View>
                    </Modal>

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
        backgroundColor: "#FDFBF7", // Background lebih terang
        paddingHorizontal: 40
    },

    /* 🔥 PULSE */
    pulseContainer: {
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 40
    },

    pulse: {
        position: "absolute",
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: "#E8DED3"
    },

    circleBig: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: "#F2E9DE",
        justifyContent: "center",
        alignItems: "center",
        elevation: 1
    },

    circleMid: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#EDE0D1",
        justifyContent: "center",
        alignItems: "center"
    },

    circleSmall: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        elevation: 3
    },

    title: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#3B2E2E",
        textAlign: "center"
    },

    desc: {
        fontSize: 13,
        color: "#888",
        textAlign: "center",
        marginTop: 15,
        lineHeight: 20
    },

    btnSearching: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: "#E8DED3",
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        marginTop: 60
    },

    btnSearchingText: {
        color: "#8B5E3C",
        fontWeight: "bold",
        fontSize: 15
    },

    cancelText: {
        marginTop: 20,
        color: "#C5A880",
        fontWeight: "600",
        textDecorationLine: "none"
    },

    /* MODAL */
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end"
    },

    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 25,
        elevation: 20
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 20,
        textAlign: "center"
    },

    option: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f5f5f5"
    },

    optionText: {
        marginLeft: 15,
        fontSize: 14,
        color: "#555"
    },

    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#DDD"
    },

    radioActive: {
        backgroundColor: "#D9534F",
        borderColor: "#D9534F"
    },

    confirmBtn: {
        backgroundColor: "#D9534F",
        padding: 16,
        borderRadius: 20,
        alignItems: "center",
        marginTop: 25,
        elevation: 3
    }

});
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";

// FIREBASE
import { db } from "./_firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";

export default function SearchingScreen() {

    const router = useRouter();

    const { orderId } = useLocalSearchParams();

    const [showModal, setShowModal] = useState(false);
    const [selected, setSelected] = useState("");

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

    }, []);

    /* 🔔 LISTEN ORDER STATUS */
    useEffect(() => {
        if (!orderId) return;

        const unsub = onSnapshot(doc(db, "orders", orderId as string), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.status === "accepted") {
                    router.replace({
                        pathname: "/tracking-user",
                        params: { orderId }
                    } as any);
                }
            }
        });

        return () => unsub();
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
                                    <Text>🔧</Text>
                                </View>
                            </View>
                        </View>

                    </View>

                    <Text style={styles.title}>Mencari Teknisi Terbaik</Text>

                    <Text style={styles.desc}>
                        Sedang mencocokkan Anda dengan teknisi terdekat...
                    </Text>

                    <View style={styles.btnDisabled}>
                        <Text style={{ color: "#fff" }}>Mencari Teknisi...</Text>
                    </View>

                    <TouchableOpacity onPress={() => setShowModal(true)}>
                        <Text style={styles.cancel}>Batalkan Pencarian</Text>
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
        backgroundColor: "#F6F2EA"
    },

    /* 🔥 PULSE */
    pulseContainer: {
        justifyContent: "center",
        alignItems: "center"
    },

    pulse: {
        position: "absolute",
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#CBB8A6"
    },

    circleBig: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#E8DED3",
        justifyContent: "center",
        alignItems: "center"
    },

    circleMid: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#D9CFC3",
        justifyContent: "center",
        alignItems: "center"
    },

    circleSmall: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center"
    },

    title: {
        fontSize: 18,
        fontWeight: "600",
        marginTop: 20
    },

    desc: {
        fontSize: 12,
        color: "#777",
        textAlign: "center",
        marginTop: 5
    },

    btnDisabled: {
        backgroundColor: "#CBB8A6",
        padding: 14,
        borderRadius: 25,
        marginTop: 20
    },

    cancel: {
        marginTop: 10,
        color: "#8B5E3C",
        textDecorationLine: "underline"
    },

    /* MODAL */
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end"
    },

    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20
    },

    modalTitle: {
        fontWeight: "600",
        marginBottom: 10
    },

    option: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10
    },

    optionText: {
        marginLeft: 10,
        fontSize: 13
    },

    radio: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: "#aaa"
    },

    radioActive: {
        backgroundColor: "#D9534F",
        borderColor: "#D9534F"
    },

    confirmBtn: {
        backgroundColor: "#D9534F",
        padding: 14,
        borderRadius: 25,
        alignItems: "center",
        marginTop: 15
    }

});
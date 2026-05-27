import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Alert,
    ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { BASE_URL } from "../api";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

export default function SuccessScreen() {

    const router = useRouter();
    const { orderId, services, total, isCheckOnly } = useLocalSearchParams();

    const parsedServices = services
        ? JSON.parse(services as string)
        : [];

    const [selectedMethod, setSelectedMethod] = useState("E-Wallet / GoPay");
    const [showModal, setShowModal] = useState(false);

    const methods = [
        "QRIS",
        "E-Wallet (GoPay, OVO, DANA)",
        "Virtual Account (BCA, Mandiri, BNI)"
    ];

    const handlePayment = async () => {
        try {
            console.log("TOTAL DI FRONTEND:", total);

            const response = await fetch(`${BASE_URL}/create-transaction`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    total: Number(total),
                }),
            });

            const data = await response.json();

            console.log("RESPONSE BACKEND:", data);

            // 🔥 ambil order_id
            const midtransOrderId = data.order_id;

            if (data.redirect_url) {
                router.push({
                    pathname: "/payment-webview" as any,
                    params: {
                        url: data.redirect_url,
                        orderId: midtransOrderId,
                        originalOrderId: orderId as string
                    }
                });
            } else {
                Alert.alert("Error", "Gagal mendapatkan link pembayaran");
            }

        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Tidak bisa konek ke server");
        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View style={styles.container}>

                    {/* ICON */}
                    <View style={styles.icon}>
                        <Ionicons name="checkmark" size={28} color="#fff" />
                    </View>

                    <Text style={styles.title}>Pengecekan Selesai</Text>

                    <Text style={styles.desc}>
                        Sistem telah memverifikasi kerusakan. Silakan pilih pembayaran.
                    </Text>

                    {/* LIST LAYANAN DIPILIH */}
                    {isCheckOnly !== "true" &&
                        parsedServices.map((item: any, i: number) => (
                            <View style={styles.selectedCard} key={i}>
                                <Ionicons name="checkmark-circle" size={16} color="#8B5E3C" />
                                <Text style={styles.selectedText}>{item.name}</Text>
                                <Text style={styles.price}>
                                    Rp {item.price.toLocaleString("id-ID")}
                                </Text>
                            </View>
                        ))
                    }

                    {/* RINGKASAN */}
                    <View style={styles.summaryBox}>

                        <Text style={styles.summaryTitle}>RINGKASAN TAGIHAN</Text>

                        <View style={styles.row}>
                            <Text>Kunjungan & Pengecekan</Text>
                            <Text>Rp 50.000</Text>
                        </View>

                        {isCheckOnly !== "true" &&
                            parsedServices.map((item: any, i: number) => (
                                <View style={styles.row} key={i}>
                                    <Text>{item.name}</Text>
                                    <Text>
                                        Rp {item.price.toLocaleString("id-ID")}
                                    </Text>
                                </View>
                            ))
                        }

                        <View style={styles.rowTotal}>
                            <Text>Total Tagihan</Text>
                            <Text style={{ fontWeight: "600" }}>
                                Rp {Number(total).toLocaleString("id-ID")}
                            </Text>
                        </View>

                    </View>

                    {/* PAYMENT METHOD */}
                    <Text style={styles.label}>Metode Pembayaran</Text>

                    <TouchableOpacity
                        style={styles.paymentBox}
                        onPress={() => setShowModal(true)}
                    >
                        <Ionicons name="card-outline" size={18} />
                        <Text style={styles.paymentText}>{selectedMethod}</Text>
                        <Ionicons name="chevron-down" size={18} />
                    </TouchableOpacity>

                    {/* BUTTON */}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handlePayment}
                    >
                        <Text style={{ color: "#fff" }}>Selesaikan & Bayar</Text>
                    </TouchableOpacity>

                    {/* 🔥 MODAL PILIH PAYMENT */}
                    <Modal visible={showModal} transparent animationType="slide">
                        <View style={styles.overlay}>

                            <View style={styles.modalBox}>

                                <Text style={styles.modalTitle}>Pilih Metode Pembayaran</Text>

                                {methods.map((item, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[
                                            styles.methodItem,
                                            selectedMethod === item && styles.methodActive
                                        ]}
                                        onPress={() => {
                                            setSelectedMethod(item);
                                            setShowModal(false);
                                        }}
                                    >
                                        <Text>{item}</Text>

                                        {selectedMethod === item && (
                                            <Ionicons name="checkmark-circle" size={18} color="#8B5E3C" />
                                        )}
                                    </TouchableOpacity>
                                ))}

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
        backgroundColor: "#F6F2EA",
        padding: 20
    },

    icon: {
        backgroundColor: "#4CAF50",
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        marginBottom: 10
    },

    title: {
        textAlign: "center",
        fontWeight: "600",
        fontSize: 16
    },

    desc: {
        textAlign: "center",
        fontSize: 12,
        color: "#666",
        marginBottom: 10
    },

    selectedCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 12,
        marginTop: 10,
        justifyContent: "space-between"
    },

    selectedText: {
        flex: 1,
        marginLeft: 5
    },

    price: {
        fontWeight: "500"
    },

    summaryBox: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 15,
        marginTop: 15
    },

    summaryTitle: {
        fontSize: 12,
        color: "#888",
        marginBottom: 10
    },

    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 5
    },

    rowTotal: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10
    },

    label: {
        marginTop: 15,
        marginBottom: 5,
        color: "#666"
    },

    paymentBox: {
        backgroundColor: "#fff",
        padding: 14,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },

    paymentText: {
        flex: 1,
        marginLeft: 10
    },

    button: {
        backgroundColor: "#8B5E3C",
        padding: 14,
        borderRadius: 25,
        alignItems: "center",
        marginTop: 20
    },

    /* MODAL */
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end"
    },

    modalBox: {
        backgroundColor: "#fff",
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20
    },

    modalTitle: {
        fontWeight: "600",
        marginBottom: 10
    },

    methodItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 12,
        borderRadius: 10,
        marginTop: 5
    },

    methodActive: {
        backgroundColor: "#FFF3E8"
    }

});
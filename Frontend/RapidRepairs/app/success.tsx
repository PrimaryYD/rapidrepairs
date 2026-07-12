import { Theme } from "../constants/theme";
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
import AnimatedButton from "../components/ui/AnimatedButton";

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
                    "bypass-tunnel-reminder": "true"
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
                        <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
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
                    <AnimatedButton
                        title="Selesaikan & Bayar"
                        onPress={handlePayment}
                        style={{ marginTop: 24, width: '100%' }}
                    />

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
        backgroundColor: Theme.colors.background,
        padding: 20
    },

    icon: {
        backgroundColor: "#E8F5E9",
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        marginBottom: 20
    },

    title: {
        textAlign: "center",
        fontWeight: "800",
        fontSize: 22,
        color: Theme.colors.text,
        marginBottom: 8
    },

    desc: {
        textAlign: "center",
        fontSize: 14,
        color: Theme.colors.textMuted,
        marginBottom: 24,
        paddingHorizontal: 20
    },

    selectedCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Theme.colors.surface,
        padding: 16,
        borderRadius: 16,
        marginTop: 10,
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm
    },

    selectedText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        fontWeight: "600",
        color: Theme.colors.text
    },

    price: {
        fontWeight: "bold",
        fontSize: 14,
        color: Theme.colors.primaryDark
    },

    summaryBox: {
        backgroundColor: "#F9F6F2",
        padding: 20,
        borderRadius: 16,
        marginTop: 24,
        borderWidth: 1,
        borderColor: Theme.colors.border
    },

    summaryTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: Theme.colors.textMuted,
        marginBottom: 16,
        letterSpacing: 1
    },

    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12
    },

    rowTotal: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border,
        borderStyle: "dashed"
    },

    label: {
        marginTop: 30,
        marginBottom: 12,
        fontWeight: "600",
        color: Theme.colors.text,
        fontSize: 14
    },

    paymentBox: {
        backgroundColor: Theme.colors.surface,
        padding: 16,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: Theme.colors.primaryLight,
        ...Theme.shadows.sm
    },

    paymentText: {
        flex: 1,
        marginLeft: 12,
        fontWeight: "600",
        color: Theme.colors.text
    },

    /* MODAL */
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end"
    },

    modalBox: {
        backgroundColor: Theme.colors.surface,
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
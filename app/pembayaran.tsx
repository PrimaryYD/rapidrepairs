import { 
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal
, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function PembayaranScreen() {

    const router = useRouter();

    const services = [
        { name: "Cuci AC", price: 75000 },
        { name: "Tambah Freon", price: 150000 },
        { name: "Ganti Kapasitor", price: 250000 },
    ];

    const [selected, setSelected] = useState<string[]>([]);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const toggleService = (name: string) => {
        if (selected.includes(name)) {
            setSelected(selected.filter(item => item !== name));
        } else {
            setSelected([...selected, name]);
        }
    };

    const selectedServices = services.filter(s =>
        selected.includes(s.name)
    );

    const totalService = selectedServices.reduce(
        (sum, s) => sum + s.price,
        0
    );

    return (
    <SafeAreaView style={{flex:1}}>
      <ScrollView contentContainerStyle={{flexGrow:1}}>
      <View style={styles.container}>

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pilih Layanan Perbaikan</Text>
            </View>

            {/* INFO */}
            <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={18} color="#2E7D32" />
                <Text style={styles.infoText}>
                    Silakan pilih layanan yang ingin dikerjakan sesuai anjuran teknisi.
                </Text>
            </View>

            {/* LIST */}
            {services.map((item, index) => {
                const isSelected = selected.includes(item.name);

                return (
                    <TouchableOpacity
                        key={index}
                        style={[styles.card, isSelected && styles.cardActive]}
                        onPress={() => toggleService(item.name)}
                    >
                        <View style={styles.left}>
                            <View style={[styles.radio, isSelected && styles.radioActive]}>
                                {isSelected && (
                                    <Ionicons name="checkmark" size={14} color="#fff" />
                                )}
                            </View>
                            <Text>{item.name}</Text>
                        </View>

                        <Text>
                            Rp {item.price.toLocaleString("id-ID")}
                        </Text>
                    </TouchableOpacity>
                );
            })}

            {/* BUTTON */}
            <TouchableOpacity
                style={[styles.button, selected.length === 0 && { opacity: 0.5 }]}
                disabled={selected.length === 0}
                onPress={() =>
                    router.push({
                        pathname: "/success" as any,
                        params: {
                            services: JSON.stringify(selectedServices),
                            total: totalService + 50000,
                            isCheckOnly: "false"
                        }
                    })
                }
            >
                <Text style={styles.buttonText}>Mulai Perbaikan</Text>
            </TouchableOpacity>

            {/* CANCEL */}
            <Text
                style={styles.cancel}
                onPress={() => setShowCancelModal(true)}
            >
                Batalkan, Bayar Pengecekan Saja
            </Text>

            {/* MODAL */}
            <Modal visible={showCancelModal} transparent animationType="fade">
                <View style={styles.overlay}>
                    <View style={styles.modalBox}>

                        <Text style={styles.modalTitle}>
                            Hanya Lakukan Pengecekan?
                        </Text>

                        <Text style={styles.modalDesc}>
                            Anda hanya akan dikenakan biaya Rp 50.000.
                        </Text>

                        <View style={styles.rowBtn}>

                            <TouchableOpacity
                                style={styles.yesBtn}
                                onPress={() => {
                                    setShowCancelModal(false);

                                    router.push({
                                        pathname: "/success" as any,
                                        params: {
                                            services: JSON.stringify([]),
                                            total: 50000,
                                            isCheckOnly: "true"
                                        }
                                    });
                                }}
                            >
                                <Text style={{ color: "#fff" }}>Ya, Selesaikan</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.backBtn}
                                onPress={() => setShowCancelModal(false)}
                            >
                                <Text>Kembali</Text>
                            </TouchableOpacity>

                        </View>

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
        padding: 16
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10
    },

    headerTitle: {
        marginLeft: 10,
        fontWeight: "600"
    },

    infoBox: {
        flexDirection: "row",
        backgroundColor: "#EAF5ED",
        padding: 12,
        borderRadius: 12,
        marginBottom: 10
    },

    infoText: {
        marginLeft: 8,
        fontSize: 12,
        color: "#2E7D32"
    },

    card: {
        backgroundColor: "#fff",
        padding: 14,
        borderRadius: 12,
        marginTop: 10,
        flexDirection: "row",
        justifyContent: "space-between"
    },

    cardActive: {
        borderWidth: 1,
        borderColor: "#8B5E3C"
    },

    left: {
        flexDirection: "row",
        alignItems: "center"
    },

    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        marginRight: 10
    },

    radioActive: {
        backgroundColor: "#8B5E3C"
    },

    button: {
        backgroundColor: "#8B5E3C",
        padding: 14,
        borderRadius: 25,
        alignItems: "center",
        marginTop: 20
    },

    buttonText: {
        color: "#fff"
    },

    cancel: {
        textAlign: "center",
        marginTop: 10,
        textDecorationLine: "underline",
        color: "#8B5E3C"
    },

    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center"
    },

    modalBox: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 20,
        width: "80%"
    },

    modalTitle: {
        textAlign: "center",
        fontWeight: "600"
    },

    modalDesc: {
        textAlign: "center",
        fontSize: 12,
        marginTop: 5
    },

    rowBtn: {
        flexDirection: "row",
        marginTop: 15
    },

    yesBtn: {
        flex: 1,
        backgroundColor: "#8B5E3C",
        padding: 10,
        borderRadius: 10,
        marginRight: 5,
        alignItems: "center"
    },

    backBtn: {
        flex: 1,
        backgroundColor: "#eee",
        padding: 10,
        borderRadius: 10,
        marginLeft: 5,
        alignItems: "center"
    }

});
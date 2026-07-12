import { 
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./_firebaseConfig";
import { Theme } from "../constants/theme";
import AnimatedButton from "../components/ui/AnimatedButton";

export default function PembayaranScreen() {

    const router = useRouter();

    const services = [
        { name: "Cuci AC", price: 75000 },
        { name: "Tambah Freon", price: 150000 },
        { name: "Ganti Kapasitor", price: 250000 },
    ];

    const [selected, setSelected] = useState<string[]>(["Cuci AC"]);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showFreonInfo, setShowFreonInfo] = useState(false);
    const [showCapacitorInfo, setShowCapacitorInfo] = useState(false);

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

    const { orderId } = useLocalSearchParams();

    const handleStartRepair = async () => {
        if (orderId) {
            try {
                await updateDoc(doc(db, "orders", orderId as string), {
                    selectedServices: selectedServices,
                    totalBill: totalService + 50000,
                    status: "services_selected"
                });
            } catch (err) {
                console.log("Error updating order services:", err);
            }
        }

        router.replace({
            pathname: "/waiting-proof" as any,
            params: {
                orderId,
                total: (totalService + 50000).toString(),
                services: JSON.stringify(selectedServices),
                isCheckOnly: "false"
            }
        });
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
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
                                    <Text style={styles.serviceName}>{item.name}</Text>
                                    {(item.name === "Tambah Freon" || item.name === "Ganti Kapasitor") && (
                                        <TouchableOpacity
                                            style={styles.infoIconButton}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                if (item.name === "Tambah Freon") {
                                                    setShowFreonInfo(true);
                                                } else {
                                                    setShowCapacitorInfo(true);
                                                }
                                            }}
                                        >
                                            <Ionicons name="information-circle-outline" size={16} color="#8B5E3C" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <Text style={styles.servicePrice}>
                                    Rp {item.price.toLocaleString("id-ID")}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}

                    {/* BIAYA TRANSPORTASI */}
                    <View style={styles.priceSummaryRow}>
                        <Text style={styles.priceSummaryLabel}>Biaya Transportasi & Cek:</Text>
                        <Text style={styles.priceSummaryValue}>Rp 50.000</Text>
                    </View>

                    {/* BUTTON */}
                    <AnimatedButton
                        title="Mulai Perbaikan"
                        disabled={selected.length === 0}
                        onPress={handleStartRepair}
                        style={{ marginTop: 20 }}
                    />

            {/* CANCEL */}
            <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={() => setShowCancelModal(true)}
            >
                <Ionicons name="close-circle-outline" size={20} color={Theme.colors.primary} />
                <Text style={styles.cancelBtnText}>Batalkan, Bayar Pengecekan Saja</Text>
            </TouchableOpacity>

            {/* CANCEL MODAL */}
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
                                onPress={async () => {
                                    setShowCancelModal(false);
                                    if (orderId) {
                                        try {
                                            await updateDoc(doc(db, "orders", orderId as string), {
                                                selectedServices: [],
                                                totalBill: 50000,
                                                status: "services_selected"
                                            });
                                        } catch (err) {
                                            console.log("Error updating check only:", err);
                                        }
                                    }

                                    router.replace({
                                        pathname: "/waiting-proof" as any,
                                        params: {
                                            orderId,
                                            total: "50000",
                                            services: JSON.stringify([]),
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

            {/* CAPACITOR INFO MODAL */}
            <Modal visible={showCapacitorInfo} transparent animationType="slide" onRequestClose={() => setShowCapacitorInfo(false)}>
                <View style={styles.sheetOverlay}>
                    <View style={styles.sheetContent}>
                        <View style={styles.sheetDragHandle} />
                        <Text style={styles.sheetTitle}>Ciri Kapasitor Rusak</Text>
                        <View style={styles.capacitorList}>
                            <View style={styles.capacitorItem}>
                                <View style={styles.bulletDot} />
                                <Text style={styles.capacitorItemText}>
                                    AC hanya mengeluarkan angin biasa, tidak dingin sama sekali.
                                </Text>
                            </View>
                            <View style={styles.capacitorItem}>
                                <View style={styles.bulletDot} />
                                <Text style={styles.capacitorItemText}>
                                    Kipas pada mesin luar (Outdoor) menyala, tetapi suara kompresor tidak terdengar berdengung.
                                </Text>
                            </View>
                            <View style={styles.capacitorItem}>
                                <View style={styles.bulletDot} />
                                <Text style={styles.capacitorItemText}>
                                    Sering terjadi jeglek/turun MCB saat AC dinyalakan.
                                </Text>
                            </View>
                        </View>
                        <AnimatedButton
                            title="Saya Mengerti"
                            onPress={() => setShowCapacitorInfo(false)}
                            style={{ width: '100%' }}
                        />
                    </View>
                </View>
            </Modal>

            {/* FREON INFO MODAL */}
            <Modal visible={showFreonInfo} transparent animationType="slide" onRequestClose={() => setShowFreonInfo(false)}>
                <View style={styles.sheetOverlay}>
                    <View style={styles.sheetContent}>
                        <View style={styles.sheetDragHandle} />
                        <Text style={styles.sheetTitle}>Info Standar Freon & Ampere</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeaderRow}>
                                <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: "left" }]}>Kapasitas (PK)</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Freon (PSI)</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1.3, textAlign: "right" }]}>Ampere (A)</Text>
                            </View>
                            <View style={styles.tableRow}>
                                <Text style={[styles.tableCell, { flex: 1.2, fontWeight: "bold", textAlign: "left" }]}>0.5 PK</Text>
                                <Text style={[styles.tableCell, { flex: 1 }]}>140 - 160</Text>
                                <Text style={[styles.tableCell, { flex: 1.3, textAlign: "right" }]}>1.5A - 2.0A</Text>
                            </View>
                            <View style={styles.tableRow}>
                                <Text style={[styles.tableCell, { flex: 1.2, fontWeight: "bold", textAlign: "left" }]}>1 PK</Text>
                                <Text style={[styles.tableCell, { flex: 1 }]}>140 - 160</Text>
                                <Text style={[styles.tableCell, { flex: 1.3, textAlign: "right" }]}>3.5A - 4.5A</Text>
                            </View>
                            <View style={styles.tableRow}>
                                <Text style={[styles.tableCell, { flex: 1.2, fontWeight: "bold", textAlign: "left" }]}>2 PK</Text>
                                <Text style={[styles.tableCell, { flex: 1 }]}>140 - 160</Text>
                                <Text style={[styles.tableCell, { flex: 1.3, textAlign: "right" }]}>7.0A - 9.0A</Text>
                            </View>
                        </View>
                        <View style={styles.noteCard}>
                            <Text style={styles.noteText}>
                                <Text style={{ fontWeight: "bold" }}>Catatan:</Text> Pastikan foto alat ukur (Manifold Gauge & Tang Ampere) dari teknisi sesuai dengan batas angka di atas.
                            </Text>
                        </View>
                        <AnimatedButton
                            title="Saya Mengerti"
                            onPress={() => setShowFreonInfo(false)}
                            style={{ width: '100%' }}
                        />
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
        backgroundColor: Theme.colors.surface,
        padding: 14,
        borderRadius: 12,
        marginTop: 10,
        flexDirection: "row",
        justifyContent: "space-between"
    },

    cardActive: {
        borderWidth: 1,
        borderColor: Theme.colors.primary
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
        marginRight: 10,
        justifyContent: "center",
        alignItems: "center",
        borderColor: Theme.colors.border
    },

    radioActive: {
        backgroundColor: Theme.colors.primary
    },

    button: {
        backgroundColor: Theme.colors.primary,
        padding: 14,
        borderRadius: 25,
        alignItems: "center",
        marginTop: 20
    },

    buttonText: {
        color: "#fff"
    },

    cancelBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
        marginTop: 16,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: Theme.colors.primary,
        backgroundColor: "transparent"
    },
    cancelBtnText: {
        marginLeft: 8,
        color: Theme.colors.primary,
        fontWeight: "600",
        fontSize: 14
    },

    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center"
    },

    modalBox: {
        backgroundColor: Theme.colors.surface,
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
        backgroundColor: Theme.colors.primary,
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
    },

    // Info Icon & Row Styling
    serviceName: {
        fontSize: 14,
        color: Theme.colors.text,
    },
    servicePrice: {
        fontSize: 14,
        fontWeight: "bold",
        color: Theme.colors.text,
    },
    infoIconButton: {
        padding: 4,
        marginLeft: 4,
    },

    // Price summary row
    priceSummaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 25,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: "#E2D8CD",
        borderStyle: "dashed",
    },
    priceSummaryLabel: {
        fontSize: 13,
        color: Theme.colors.textMuted,
        fontWeight: "500",
    },
    priceSummaryValue: {
        fontSize: 14,
        fontWeight: "bold",
        color: Theme.colors.text,
    },

    // Bottom Sheet Modals
    sheetOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    sheetContent: {
        backgroundColor: Theme.colors.surface,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: Platform.OS === "ios" ? 40 : 24,
    },
    sheetDragHandle: {
        width: 40,
        height: 4,
        backgroundColor: "#E0DCD3",
        borderRadius: 2,
        alignSelf: "center",
        marginBottom: 20,
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: Theme.colors.text,
        alignSelf: "center",
        marginBottom: 20,
    },
    capacitorList: {
        width: "100%",
        gap: 12,
        marginBottom: 24,
    },
    capacitorItem: {
        flexDirection: "row",
        backgroundColor: "#F9F6F2",
        padding: 15,
        borderRadius: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Theme.colors.primary,
        marginRight: 12,
    },
    capacitorItemText: {
        flex: 1,
        fontSize: 13,
        color: Theme.colors.textMuted,
        lineHeight: 18,
    },
    understandBtn: {
        backgroundColor: Theme.colors.primary,
        width: "100%",
        paddingVertical: 15,
        borderRadius: 25,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    understandBtnText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 15,
    },
    table: {
        width: "100%",
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: Theme.colors.border,
        marginBottom: 20,
    },
    tableHeaderRow: {
        flexDirection: "row",
        backgroundColor: "#F9F6F2",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F2EBE3",
    },
    tableHeaderCell: {
        fontSize: 12,
        fontWeight: "bold",
        color: Theme.colors.textMuted,
        textAlign: "center",
    },
    tableRow: {
        flexDirection: "row",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F2EBE3",
        backgroundColor: Theme.colors.surface,
        alignItems: "center",
    },
    tableCell: {
        fontSize: 13,
        color: Theme.colors.text,
        textAlign: "center",
    },
    noteCard: {
        backgroundColor: "#F9F6F2",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        marginBottom: 24,
    },
    noteText: {
        fontSize: 12,
        color: Theme.colors.textMuted,
        lineHeight: 18,
    }

});
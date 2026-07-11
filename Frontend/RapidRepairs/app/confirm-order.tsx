import { 
    View,
    Text,
    StyleSheet,
    TouchableOpacity
, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Theme } from "../constants/theme";
import AnimatedButton from "../components/ui/AnimatedButton";
import { Ionicons } from "@expo/vector-icons";

/* ✅ TAMBAHKAN TYPE */
type Level = "ringan" | "sedang" | "berat";

export default function ConfirmOrder() {

    const router = useRouter();
    const { title, price } = useLocalSearchParams();

    const basePrice = Number(price);

    /* ✅ TYPE STATE */
    const [level, setLevel] = useState<Level>("ringan");

    const getMultiplier = () => {
        if (level === "ringan") return 1;
        if (level === "sedang") return 2;
        if (level === "berat") return 3;
        return 1;
    };

    const extra = 25000 * getMultiplier();
    const total = basePrice + extra;

    const getColor = (type: Level) => {
        if (level === type) {
            if (type === "ringan") return "#4CAF50";
            if (type === "sedang") return "#FF9800";
            if (type === "berat") return "#F44336";
        }
        return "#ddd";
    };

    const levels: Level[] = ["ringan", "sedang", "berat"];

    const getLevelLabel = () => {
        if (level === "ringan") return "Kerumitan Ringan";
        if (level === "sedang") return "Kerumitan Sedang";
        if (level === "berat") return "Kerumitan Berat";
    };

    return (
    <SafeAreaView style={{flex:1}}>
      <ScrollView contentContainerStyle={{flexGrow:1}}>
      <View style={styles.container}>

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} />
                </TouchableOpacity>
                <Text style={styles.title}>Konfirmasi Pesanan</Text>
            </View>

            {/* DETAIL */}
            <View style={styles.card}>
                <Text style={styles.label}>Detail Pesanan</Text>

                <View style={styles.detailBox}>
                    <Text>{title}</Text>
                </View>
            </View>

            {/* KERUMITAN */}
            <View style={styles.card}>
                <Text style={styles.label}>Tingkat Kerumitan</Text>

                <View style={styles.barContainer}>

                    {levels.map((item, index) => {

                        const isActive = level === item;

                        const getBarColor = () => {
                            if (!isActive) return "#ddd";
                            if (item === "ringan") return "#4CAF50";
                            if (item === "sedang") return "#FF9800";
                            if (item === "berat") return "#F44336";
                        };

                        return (
                            <TouchableOpacity
                                key={item}
                                style={styles.barItem}
                                onPress={() => setLevel(item)}
                            >

                                {/* BAR */}
                                <View
                                    style={[
                                        styles.bar,
                                        { backgroundColor: getBarColor() }
                                    ]}
                                />

                                {/* TEXT */}
                                <Text style={[
                                    styles.barText,
                                    isActive && { fontWeight: "bold" }
                                ]}>
                                    {item}
                                </Text>

                            </TouchableOpacity>
                        );
                    })}

                </View>

                <Text style={styles.note}>
                </Text>
            </View>

            {/* HARGA */}
            {/* HARGA */}
            <View style={styles.card}>

                <Text style={styles.priceDetail}>
                    Rp {basePrice.toLocaleString()} (Harga Dasar)
                </Text>

                <Text style={styles.priceDetail}>
                    + Rp {extra.toLocaleString()} ({getLevelLabel()})
                </Text>

                <View style={styles.totalRow}>
                    <Text style={styles.totalText}>Total</Text>
                    <Text style={styles.totalPrice}>
                        Rp {total.toLocaleString()}
                    </Text>
                </View>

            </View>

            {/* BUTTON */}
            <AnimatedButton
                title="Lanjutkan ke Pembayaran"
                onPress={() => {}}
                style={{ marginTop: 10 }}
            />

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
        gap: 10,
        marginBottom: 20
    },

    title: {
        fontSize: 18,
        fontWeight: "bold"
    },

    card: {
        backgroundColor: Theme.colors.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 16
    },

    label: {
        fontWeight: "bold",
        marginBottom: 10
    },

    detailBox: {
        backgroundColor: "#EFE7D9",
        padding: 10,
        borderRadius: 10
    },

    levelRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginVertical: 10
    },

    levelBtn: {
        flex: 1,
        marginHorizontal: 5,
        padding: 10,
        borderRadius: 10,
        alignItems: "center"
    },

    levelText: {
        color: "#fff",
        fontWeight: "bold",
        textTransform: "capitalize"
    },

    note: {
        fontSize: 12,
        color: Theme.colors.textMuted
    },

    priceDetail: {
        fontSize: 13,
        color: Theme.colors.textMuted,
        marginBottom: 4
    },

    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between"
    },

    totalText: {
        fontWeight: "bold"
    },

    totalPrice: {
        fontWeight: "bold",
        fontSize: 16
    },

    payButton: {
        backgroundColor: Theme.colors.primary,
        padding: 16,
        borderRadius: 30,
        alignItems: "center",
        marginTop: 10
    },

    payText: {
        color: "#fff",
        fontWeight: "bold"
    },

    barContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginVertical: 12
    },

    barItem: {
        flex: 1,
        alignItems: "center"
    },

    bar: {
        width: "90%",
        height: 8,
        borderRadius: 10,
        marginBottom: 6
    },

    barText: {
        fontSize: 12,
        color: Theme.colors.textMuted,
        textTransform: "capitalize"
    },


});
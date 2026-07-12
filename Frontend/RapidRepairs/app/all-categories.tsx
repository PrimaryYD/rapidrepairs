import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    TextInput
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../constants/theme";
import { useRouter } from "expo-router";

export default function AllCategories() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");

    const allCategories = [
        { name: "AC", icon: "snow-outline", available: true },
        { name: "Kulkas", icon: "cube-outline", available: false },
        { name: "Mesin Cuci", icon: "water-outline", available: false },
        { name: "TV & Elektronik", icon: "tv-outline", available: false },
        { name: "Pompa Air", icon: "hardware-chip-outline", available: false },
        { name: "Kelistrikan", icon: "flash-outline", available: false },
        { name: "Pertukangan", icon: "hammer-outline", available: false },
        { name: "Ledeng", icon: "construct-outline", available: false },
    ];

    const filtered = allCategories.filter(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Semua Layanan</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color={Theme.colors.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari layanan yang Anda butuhkan..."
                        placeholderTextColor={Theme.colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.listContainer}>
                {filtered.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.listItem, !item.available && styles.listDisabled]}
                        activeOpacity={0.7}
                        disabled={!item.available}
                        onPress={() => {
                            if (item.available && item.name === "AC") {
                                router.push("/ac-services");
                            }
                        }}
                    >
                        <View style={styles.iconBox}>
                            <Ionicons name={item.icon as any} size={24} color={Theme.colors.primary} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.itemName, !item.available && { color: Theme.colors.textMuted }]}>
                                {item.name}
                            </Text>
                            {item.available ? (
                                <Text style={styles.itemSubtitle}>Tersedia Sekarang</Text>
                            ) : (
                                <Text style={styles.itemSubtitle}>Segera Hadir</Text>
                            )}
                        </View>
                        {!item.available && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>Segera</Text>
                            </View>
                        )}
                        {item.available && (
                            <Ionicons name="chevron-forward" size={20} color={Theme.colors.border} />
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: "white",
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    backButton: {
        padding: 5,
        marginLeft: -5,
    },
    headerTitle: {
        ...Theme.typography.h2,
        color: Theme.colors.text,
    },
    searchContainer: {
        padding: 20,
        backgroundColor: "white",
    },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Theme.colors.background,
        borderRadius: Theme.radius.lg,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        ...Theme.typography.body,
        color: Theme.colors.text,
    },
    listContainer: {
        padding: 20,
    },
    listItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        padding: 16,
        borderRadius: Theme.radius.lg,
        marginBottom: 12,
        ...Theme.shadows.sm,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    listDisabled: {
        backgroundColor: "#F9F9F9",
        opacity: 0.8,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Theme.colors.primary + "15",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    itemName: {
        ...Theme.typography.h3,
        color: Theme.colors.text,
        marginBottom: 4,
    },
    itemSubtitle: {
        ...Theme.typography.caption,
        color: Theme.colors.textMuted,
    },
    badge: {
        backgroundColor: Theme.colors.error + "20",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: Theme.colors.error,
        fontSize: 10,
        fontWeight: "bold",
    },
});

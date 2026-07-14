import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./_firebaseConfig";
import { Theme } from "../constants/theme";

export default function OrderDetailsScreen() {
    const { orderId } = useLocalSearchParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [technician, setTechnician] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!orderId) return;
            try {
                const orderRef = doc(db, "orders", orderId as string);
                const orderSnap = await getDoc(orderRef);
                
                if (orderSnap.exists()) {
                    const orderData = orderSnap.data();
                    setOrder(orderData);
                    
                    if (orderData.technicianId) {
                        const techRef = doc(db, "technicians", orderData.technicianId);
                        const techSnap = await getDoc(techRef);
                        if (techSnap.exists()) {
                            setTechnician(techSnap.data());
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching order details:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [orderId]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text style={styles.loadingText}>Memuat Detail Pesanan...</Text>
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Pesanan tidak ditemukan.</Text>
            </View>
        );
    }

    const timeCompleted = order.completedAt ? (order.completedAt.toMillis ? order.completedAt.toMillis() : (typeof order.completedAt === 'number' ? order.completedAt : order.completedAt._seconds ? order.completedAt._seconds * 1000 : 0)) : null;

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Header / Nav */}
            <View style={styles.header}>
                <Ionicons name="arrow-back" size={24} color={Theme.colors.text} onPress={() => router.back()} />
                <Text style={styles.headerTitle}>Detail Pesanan</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informasi Pesanan</Text>
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Layanan:</Text>
                        <Text style={styles.value}>{order.serviceType || "Perbaikan AC"}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Status:</Text>
                        <Text style={[styles.value, { color: Theme.colors.success }]}>Selesai</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Tanggal:</Text>
                        <Text style={styles.value}>{timeCompleted ? new Date(timeCompleted).toLocaleDateString("id-ID") : "-"}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Total Harga:</Text>
                        <Text style={[styles.value, { fontWeight: 'bold' }]}>Rp {order.totalBill?.toLocaleString("id-ID") || "0"}</Text>
                    </View>
                </View>
            </View>

            {technician && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informasi Teknisi</Text>
                    <View style={styles.card}>
                        <View style={styles.techHeader}>
                            {technician.profilePictureUrl ? (
                                <Image source={{ uri: technician.profilePictureUrl }} style={styles.techImage} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Ionicons name="person" size={32} color={Theme.colors.textMuted} />
                                </View>
                            )}
                            <View style={styles.techNameInfo}>
                                <Text style={styles.techName}>{technician.name || "Unknown"}</Text>
                                <Text style={styles.techStatus}>Teknisi Aktif</Text>
                            </View>
                        </View>
                        
                        <View style={styles.techDetails}>
                            <View style={styles.contactRow}>
                                <Ionicons name="mail-outline" size={20} color={Theme.colors.textMuted} />
                                <Text style={styles.contactText}>{technician.email || "-"}</Text>
                            </View>
                            <View style={styles.contactRow}>
                                <Ionicons name="call-outline" size={20} color={Theme.colors.textMuted} />
                                <Text style={styles.contactText}>{technician.phone || "-"}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Theme.colors.background,
    },
    loadingText: {
        ...Theme.typography.body,
        color: Theme.colors.textMuted,
        marginTop: 12,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: Theme.spacing.lg,
        paddingTop: 60,
        backgroundColor: Theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    headerTitle: {
        ...Theme.typography.h3,
        color: Theme.colors.text,
    },
    section: {
        padding: Theme.spacing.lg,
    },
    sectionTitle: {
        ...Theme.typography.h3,
        color: Theme.colors.text,
        marginBottom: Theme.spacing.md,
    },
    card: {
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radius.lg,
        padding: Theme.spacing.lg,
        ...Theme.shadows.sm,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    label: {
        ...Theme.typography.body,
        color: Theme.colors.textMuted,
    },
    value: {
        ...Theme.typography.body,
        color: Theme.colors.text,
    },
    techHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: Theme.spacing.md,
    },
    techImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
        marginRight: Theme.spacing.md,
    },
    avatarPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Theme.colors.primaryLight + '20',
        justifyContent: "center",
        alignItems: "center",
        marginRight: Theme.spacing.md,
    },
    techNameInfo: {
        flex: 1,
    },
    techName: {
        ...Theme.typography.h3,
        color: Theme.colors.text,
    },
    techStatus: {
        ...Theme.typography.caption,
        color: Theme.colors.success,
        marginTop: 4,
    },
    techDetails: {
        paddingTop: Theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border,
    },
    contactRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 6,
    },
    contactText: {
        ...Theme.typography.body,
        color: Theme.colors.text,
        marginLeft: Theme.spacing.sm,
    },
});

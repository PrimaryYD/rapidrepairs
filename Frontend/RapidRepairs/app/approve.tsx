import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    FlatList,
    Image,
    Modal,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    Linking,
    Platform
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../api";
import { db } from "./_firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { Theme } from "../constants/theme";
import { useCustomAlert } from "../components/ui/GlobalAlertProvider";
import AnimatedButton from "../components/ui/AnimatedButton";

interface Answer {
    question: string;
    selected: string;
    correct: string;
    isCorrect: boolean;
}

interface Technician {
    uid: string;
    name: string;
    email: string;
    phone: string;
    location: string;
    specialization: string;
    experience: string;
    hasEquipment: boolean;
    vehicle: string;
    skills: string[];
    status: string;
    employmentStatus: string;
    bankName: string;
    bankAccount: string;
    ktpUrl: string;
    workPhotos: string[];
    selfiePhotos: string[];
    testScore?: number;
    testAnswers?: Answer[];
}

export default function AdminApprove() {
    const router = useRouter();
    
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<"pending" | "approved" | "all">("pending");
    const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [approvingUid, setApprovingUid] = useState<string | null>(null);

    // New Escrow & Orders state
    const [adminView, setAdminView] = useState<"registration" | "escrow" | "warranty">("registration");
    const [escrowTab, setEscrowTab] = useState<"pending" | "released" | "all">("pending");
    const [warrantyTab, setWarrantyTab] = useState<"pending" | "approved" | "all">("pending");
    const [orders, setOrders] = useState<any[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [releasingOrderId, setReleasingOrderId] = useState<string | null>(null);
    const [approvingWarrantyId, setApprovingWarrantyId] = useState<string | null>(null);
    const { showAlert, showConfirm } = useCustomAlert();

    const fetchAllData = async () => {
        try {
            setLoading(true);
            
            // 1. Fetch Technicians
            const techResponse = await fetch(`${BASE_URL}/technicians`, {
                headers: {
                    "bypass-tunnel-reminder": "true",
                    "ngrok-skip-browser-warning": "true"
                }
            });
            if (!techResponse.ok) {
                const errText = await techResponse.text();
                throw new Error(`Gagal mengambil data teknisi. Status: ${techResponse.status}, Text: ${errText.substring(0, 100)}`);
            }
            const techData = await techResponse.json();
            const sortedTechs = techData.sort((a: any, b: any) => {
                const dateA = a.createdAt?._seconds || 0;
                const dateB = b.createdAt?._seconds || 0;
                return dateB - dateA;
            });
            setTechnicians(sortedTechs);

            // 2. Fetch Orders
            const orderResponse = await fetch(`${BASE_URL}/api/admin/orders`, {
                headers: {
                    "bypass-tunnel-reminder": "true",
                    "ngrok-skip-browser-warning": "true"
                }
            });
            if (!orderResponse.ok) throw new Error("Gagal mengambil data order");
            const orderData = await orderResponse.json();
            const sortedOrders = orderData.sort((a: any, b: any) => {
                const dateA = a.createdAt?._seconds || 0;
                const dateB = b.createdAt?._seconds || 0;
                return dateB - dateA;
            });
            setOrders(sortedOrders);
        } catch (error: any) {
            console.error("Fetch data error:", error);
            showAlert({ title: "Error", message: error.message || "Gagal menghubungkan ke server.", type: "error" });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchAllData();
    };

    const handleApprove = async (uid: string) => {
        showConfirm({
            title: "Konfirmasi Persetujuan",
            message: "Apakah Anda yakin ingin menyetujui teknisi ini menjadi mitra resmi?",
            onConfirm: async () => {
                try {
                    setApprovingUid(uid);
                    const response = await fetch(`${BASE_URL}/technician/approve`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "bypass-tunnel-reminder": "true"
                        },
                        body: JSON.stringify({ uid })
                    });

                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error || "Gagal menyetujui teknisi");

                    showAlert({ title: "Sukses", message: "Teknisi berhasil disetujui!", type: "success" });
                    
                    setTechnicians(prev => 
                        prev.map(tech => 
                            tech.uid === uid ? { ...tech, status: "approved" } : tech
                        )
                    );

                    if (selectedTech && selectedTech.uid === uid) {
                        setSelectedTech(prev => prev ? { ...prev, status: "approved" } : null);
                    }
                } catch (error: any) {
                    showAlert({ title: "Gagal", message: error.message, type: "error" });
                } finally {
                    setApprovingUid(null);
                }
            }
        });
    };
    const handleChatWhatsApp = (phone: string, name: string) => {
        // Clean phone number (replace leading +62 or 0)
        let cleanPhone = phone.replace(/[^0-9]/g, "");
        if (cleanPhone.startsWith("0")) {
            cleanPhone = "62" + cleanPhone.slice(1);
        } else if (!cleanPhone.startsWith("62")) {
            cleanPhone = "62" + cleanPhone;
        }

        const message = `Halo ${name}, kami dari tim Rapid Repairs ingin melakukan verifikasi mengenai pendaftaran Anda sebagai Mitra Teknisi.`;
        const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
        
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                // Fallback to web link
                Linking.openURL(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`);
            }
        }).catch(err => {
            showAlert({ title: "Gagal", message: "Tidak dapat membuka WhatsApp", type: "error" });
        });
    };

    const handleReleaseEscrow = async (orderId: string) => {
        showConfirm({
            title: "Konfirmasi Pencairan Dana",
            message: "Apakah Anda yakin ingin menyetujui pencairan dana escrow ini ke rekening teknisi?",
            onConfirm: async () => {
                try {
                    setReleasingOrderId(orderId);
                    const response = await fetch(`${BASE_URL}/api/admin/orders/release-escrow`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "bypass-tunnel-reminder": "true"
                        },
                        body: JSON.stringify({ orderId })
                    });

                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error || "Gagal mencairkan dana");

                    showAlert({ title: "Sukses", message: "Dana berhasil dicairkan ke rekening teknisi!", type: "success" });
                    
                    setOrders(prev => 
                        prev.map(order => 
                            order.id === orderId ? { ...order, escrowStatus: "released" } : order
                        )
                    );

                    if (selectedOrder && selectedOrder.id === orderId) {
                        setSelectedOrder((prev: any) => prev ? { ...prev, escrowStatus: "released" } : null);
                    }
                } catch (error: any) {
                    showAlert({ title: "Gagal", message: error.message, type: "error" });
                } finally {
                    setReleasingOrderId(null);
                }
            }
        });
    };

    const handleApproveWarranty = async (orderId: string) => {
        showConfirm({
            title: "Konfirmasi Garansi",
            message: "Apakah Anda yakin ingin menyetujui klaim garansi ini?",
            onConfirm: async () => {
                try {
                    setApprovingWarrantyId(orderId);
                    const orderRef = doc(db, "orders", orderId);
                    await updateDoc(orderRef, {
                        warranty_status: "approved",
                        status: "warranty_approved"
                    });
                    
                    showAlert({ title: "Sukses", message: "Klaim garansi telah disetujui!", type: "success" });
                    
                    setOrders(prev => prev.map(order => 
                        order.id === orderId 
                        ? { ...order, warranty_status: "approved", status: "warranty_approved" }
                        : order
                    ));

                    if (selectedOrder && selectedOrder.id === orderId) {
                        setSelectedOrder((prev: any) => prev ? { ...prev, warranty_status: "approved", status: "warranty_approved" } : null);
                    }
                } catch (error: any) {
                    showAlert({ title: "Gagal", message: error.message || "Gagal menyetujui klaim garansi", type: "error" });
                } finally {
                    setApprovingWarrantyId(null);
                }
            }
        });
    };
    const filteredTechnicians = technicians.filter(tech => {
        if (activeTab === "pending") return tech.status === "pending" || !tech.status;
        if (activeTab === "approved") return tech.status === "approved";
        return true;
    });

    const renderTechCard = ({ item }: { item: Technician }) => {
        const isPending = item.status === "pending" || !item.status;
        return (
            <TouchableOpacity 
                style={styles.techCard} 
                activeOpacity={0.8}
                onPress={() => setSelectedTech(item)}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.avatarPlaceholder}>
                        {item.selfiePhotos && item.selfiePhotos.length > 0 ? (
                            <Image source={{ uri: item.selfiePhotos[0] }} style={styles.avatarImage} />
                        ) : (
                            <Ionicons name="person" size={24} color="#B3875E" />
                        )}
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.techName}>{item.name}</Text>
                        <Text style={styles.techSpec}>{item.specialization}</Text>
                    </View>
                    <View style={[styles.statusBadge, isPending ? styles.badgePending : styles.badgeApproved]}>
                        <Text style={[styles.statusText, isPending ? styles.statusPendingText : styles.statusApprovedText]}>
                            {isPending ? "Pending" : "Approved"}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={16} color="#777" />
                        <Text style={styles.infoRowText}>{item.location || "Lokasi tidak dicantumkan"}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="briefcase-outline" size={16} color="#777" />
                        <Text style={styles.infoRowText}>Pengalaman: {item.experience || "N/A"} tahun</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="ribbon-outline" size={16} color="#777" />
                        <Text style={styles.infoRowText}>Skor Tes Kompetensi: <Text style={{fontWeight: '700', color: '#B3875E'}}>{item.testScore !== undefined ? item.testScore : "N/A"}/100</Text></Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <TouchableOpacity 
                        style={styles.detailButton}
                        onPress={() => setSelectedTech(item)}
                    >
                        <Text style={styles.detailButtonText}>Periksa Pendaftaran</Text>
                        <Ionicons name="chevron-forward" size={16} color="#B3875E" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const filteredOrders = orders.filter(order => {
        const isCompleted = order.status === "completed";
        const isReleased = order.escrowStatus === "released";
        
        if (escrowTab === "pending") {
            return isCompleted && !isReleased;
        }
        if (escrowTab === "released") {
            return isReleased;
        }
        return isCompleted || isReleased;
    });

    const filteredWarrantyOrders = orders.filter(order => {
        const isWarrantyPending = order.warranty_status === "pending_admin_approval";
        const isWarrantyApproved = order.warranty_status === "approved";
        
        if (warrantyTab === "pending") return isWarrantyPending;
        if (warrantyTab === "approved") return isWarrantyApproved;
        return isWarrantyPending || isWarrantyApproved;
    });

    const renderWarrantyCard = ({ item }: { item: any }) => {
        const isPending = item.warranty_status === "pending_admin_approval";
        
        return (
            <TouchableOpacity style={styles.techCard} activeOpacity={0.8} onPress={() => setSelectedOrder(item)}>
                <View style={styles.cardHeader}>
                    <View style={styles.avatarPlaceholder}>
                        <Ionicons name="shield-checkmark" size={22} color="#B3875E" />
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.techName}>ID: {item.id}</Text>
                        <Text style={styles.techSpec}>{item.serviceType || "Layanan Perbaikan AC"}</Text>
                    </View>
                    <View style={[styles.statusBadge, isPending ? styles.badgePending : styles.badgeApproved]}>
                        <Text style={[styles.statusText, isPending ? styles.statusPendingText : styles.statusApprovedText]}>
                            {isPending ? "Menunggu" : "Disetujui"}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={16} color="#777" />
                        <Text style={styles.infoRowText}>Pelanggan: <Text style={{fontWeight: '700'}}>{item.userName || "Customer"}</Text></Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="construct-outline" size={16} color="#777" />
                        <Text style={styles.infoRowText}>Teknisi: <Text style={{fontWeight: '700', color: '#B3875E'}}>{item.technicianName || "Unknown Technician"}</Text></Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <TouchableOpacity style={styles.detailButton} onPress={() => setSelectedOrder(item)}>
                        <Text style={styles.detailButtonText}>Lihat Detail Garansi</Text>
                        <Ionicons name="chevron-forward" size={16} color="#B3875E" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderOrderCard = ({ item }: { item: any }) => {
        const isPendingRelease = item.escrowStatus !== "released";
        const total = item.totalBill || 50000;
        
        return (
            <TouchableOpacity 
                style={styles.techCard} 
                activeOpacity={0.8}
                onPress={() => setSelectedOrder(item)}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.avatarPlaceholder}>
                        <Ionicons name="receipt-outline" size={22} color="#B3875E" />
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.techName}>ID: {item.id}</Text>
                        <Text style={styles.techSpec}>{item.serviceType || "Layanan Perbaikan AC"}</Text>
                    </View>
                    <View style={[styles.statusBadge, isPendingRelease ? styles.badgePending : styles.badgeApproved]}>
                        <Text style={[styles.statusText, isPendingRelease ? styles.statusPendingText : styles.statusApprovedText]}>
                            {isPendingRelease ? "Menunggu" : "Dicairkan"}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={16} color="#777" />
                        <Text style={styles.infoRowText}>Pelanggan: <Text style={{fontWeight: '700'}}>{item.userName || "Customer"}</Text></Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={16} color="#777" />
                        <Text style={styles.infoRowText} numberOfLines={1}>Alamat: {item.userAddress || "Lokasi tidak dicantumkan"}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="construct-outline" size={16} color="#777" />
                        <Text style={styles.infoRowText}>Teknisi: <Text style={{fontWeight: '700', color: '#B3875E'}}>{item.technicianName || "Unknown Technician"}</Text></Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="wallet-outline" size={16} color="#777" />
                        <Text style={styles.infoRowText}>Total Dana: <Text style={{fontWeight: '900', color: '#5CB85C'}}>Rp {total.toLocaleString("id-ID")}</Text></Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <TouchableOpacity 
                        style={styles.detailButton}
                        onPress={() => setSelectedOrder(item)}
                    >
                        <Text style={styles.detailButtonText}>Periksa Bukti Pekerjaan</Text>
                        <Ionicons name="chevron-forward" size={16} color="#B3875E" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };


    return (
        <SafeAreaView style={styles.container}>
            {/* Admin Header */}
            <View style={styles.appHeader}>
                <View>
                    <Text style={styles.adminTitle}>Dashboard Admin</Text>
                    <Text style={styles.adminSubtitle}>
                        {adminView === "registration" 
                            ? "Verifikasi Pendaftaran Mitra Teknisi" 
                            : adminView === "escrow"
                            ? "Persetujuan Pencairan Dana Escrow"
                            : "Persetujuan Klaim Garansi Pelanggan"}
                    </Text>
                </View>
                <TouchableOpacity 
                    style={styles.logoutButton}
                    onPress={() => {
                        showConfirm({
                            title: "Konfirmasi",
                            message: "Keluar dari Halaman Admin?",
                            onConfirm: () => router.replace("/login")
                        });
                    }}
                >
                    <Ionicons name="log-out-outline" size={20} color="#D9534F" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Master Tab Selector (Registrasi vs Pencairan Escrow) */}
            <View style={styles.masterTabContainer}>
                <TouchableOpacity
                    style={[styles.masterTabButton, adminView === "registration" && styles.masterTabButtonActive]}
                    onPress={() => setAdminView("registration")}
                >
                    <Ionicons 
                        name="people-outline" 
                        size={16} 
                        color={adminView === "registration" ? "#FFF" : "#8B8175"} 
                        style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.masterTabText, adminView === "registration" && styles.masterTabTextActive]}>
                        Registrasi Mitra
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.masterTabButton, adminView === "escrow" && styles.masterTabButtonActive]}
                    onPress={() => setAdminView("escrow")}
                >
                    <Ionicons 
                        name="wallet-outline" 
                        size={16} 
                        color={adminView === "escrow" ? "#FFF" : "#8B8175"} 
                        style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.masterTabText, adminView === "escrow" && styles.masterTabTextActive]}>
                        Pencairan Dana
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.masterTabButton, adminView === "warranty" && styles.masterTabButtonActive]}
                    onPress={() => setAdminView("warranty")}
                >
                    <Ionicons 
                        name="shield-checkmark-outline" 
                        size={16} 
                        color={adminView === "warranty" ? "#FFF" : "#8B8175"} 
                        style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.masterTabText, adminView === "warranty" && styles.masterTabTextActive]}>
                        Garansi
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Sub-Tab Selectors depending on view */}
            {adminView === "registration" ? (
                <View style={styles.tabContainer}>
                    {(["pending", "approved", "all"] as const).map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                {tab === "pending" ? "Menunggu" : tab === "approved" ? "Disetujui" : "Semua"}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ) : adminView === "escrow" ? (
                <View style={styles.tabContainer}>
                    {(["pending", "released", "all"] as const).map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tabButton, escrowTab === tab && styles.tabButtonActive]}
                            onPress={() => setEscrowTab(tab)}
                        >
                            <Text style={[styles.tabText, escrowTab === tab && styles.tabTextActive]}>
                                {tab === "pending" ? "Menunggu" : tab === "released" ? "Dicairkan" : "Semua"}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ) : (
                <View style={styles.tabContainer}>
                    {(["pending", "approved", "all"] as const).map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tabButton, warrantyTab === tab && styles.tabButtonActive]}
                            onPress={() => setWarrantyTab(tab)}
                        >
                            <Text style={[styles.tabText, warrantyTab === tab && styles.tabTextActive]}>
                                {tab === "pending" ? "Menunggu" : tab === "approved" ? "Disetujui" : "Semua"}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Content List depending on view */}
            {adminView === "registration" ? (
                loading && !refreshing ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#B3875E" />
                        <Text style={styles.loadingLabel}>Memuat data calon teknisi...</Text>
                    </View>
                ) : filteredTechnicians.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Ionicons name="people-outline" size={64} color="#CCC" />
                        <Text style={styles.emptyTitle}>Tidak Ada Teknisi</Text>
                        <Text style={styles.emptySubtitle}>
                            {activeTab === "pending" 
                                ? "Saat ini tidak ada calon teknisi yang mengajukan pendaftaran."
                                : activeTab === "approved"
                                ? "Belum ada mitra teknisi yang disetujui."
                                : "Daftar teknisi kosong."}
                        </Text>
                        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                            <Ionicons name="refresh" size={16} color="#FFF" style={{marginRight: 6}} />
                            <Text style={styles.refreshButtonText}>Refresh Data</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={filteredTechnicians}
                        renderItem={renderTechCard}
                        keyExtractor={item => item.uid}
                        contentContainerStyle={styles.listContent}
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        showsVerticalScrollIndicator={false}
                    />
                )
            ) : adminView === "escrow" ? (
                loading && !refreshing ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#B3875E" />
                        <Text style={styles.loadingLabel}>Memuat data pencairan dana...</Text>
                    </View>
                ) : filteredOrders.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Ionicons name="wallet-outline" size={64} color="#CCC" />
                        <Text style={styles.emptyTitle}>Tidak Ada Pencairan</Text>
                        <Text style={styles.emptySubtitle}>
                            {escrowTab === "pending" 
                                ? "Saat ini tidak ada perbaikan selesai yang menunggu pencairan dana."
                                : escrowTab === "released"
                                ? "Belum ada dana perbaikan yang dicairkan."
                                : "Daftar pencairan kosong."}
                        </Text>
                        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                            <Ionicons name="refresh" size={16} color="#FFF" style={{marginRight: 6}} />
                            <Text style={styles.refreshButtonText}>Refresh Data</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={filteredOrders}
                        renderItem={renderOrderCard}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        showsVerticalScrollIndicator={false}
                    />
                )
            ) : (
                loading && !refreshing ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#B3875E" />
                        <Text style={styles.loadingLabel}>Memuat data klaim garansi...</Text>
                    </View>
                ) : filteredWarrantyOrders.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Ionicons name="shield-checkmark-outline" size={64} color="#CCC" />
                        <Text style={styles.emptyTitle}>Tidak Ada Garansi</Text>
                        <Text style={styles.emptySubtitle}>
                            {warrantyTab === "pending" 
                                ? "Saat ini tidak ada pelanggan yang mengajukan klaim garansi."
                                : warrantyTab === "approved"
                                ? "Belum ada garansi yang disetujui."
                                : "Daftar garansi kosong."}
                        </Text>
                        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                            <Ionicons name="refresh" size={16} color="#FFF" style={{marginRight: 6}} />
                            <Text style={styles.refreshButtonText}>Refresh Data</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={filteredWarrantyOrders}
                        renderItem={renderWarrantyCard}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        showsVerticalScrollIndicator={false}
                    />
                )
            )}

            {/* Technician Detailed Inspection Modal */}
            {selectedTech && (
                <Modal
                    visible={true}
                    animationType="slide"
                    transparent={false}
                    onRequestClose={() => setSelectedTech(null)}
                >
                    <SafeAreaView style={styles.detailContainer}>
                        {/* Detail Header */}
                        <View style={styles.detailHeader}>
                            <TouchableOpacity 
                                style={styles.closeModalBtn}
                                onPress={() => setSelectedTech(null)}
                            >
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                            <Text style={styles.detailHeaderTitle}>Detail Calon Teknisi</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
                            {/* Profile Card Info */}
                            <View style={styles.detailProfileCard}>
                                <View style={styles.detailAvatarContainer}>
                                    {selectedTech.selfiePhotos && selectedTech.selfiePhotos.length > 0 ? (
                                        <TouchableOpacity onPress={() => setPreviewImage(selectedTech.selfiePhotos[0])}>
                                            <Image source={{ uri: selectedTech.selfiePhotos[0] }} style={styles.detailAvatar} />
                                        </TouchableOpacity>
                                    ) : (
                                        <Ionicons name="person" size={48} color="#B3875E" />
                                    )}
                                </View>
                                <Text style={styles.detailName}>{selectedTech.name}</Text>
                                <Text style={styles.detailSub}>{selectedTech.email}</Text>
                                <Text style={styles.detailSub}>{selectedTech.phone}</Text>

                                <View style={styles.actionRow}>
                                    <TouchableOpacity 
                                        style={styles.chatWaBtn}
                                        onPress={() => handleChatWhatsApp(selectedTech.phone, selectedTech.name)}
                                    >
                                        <Ionicons name="logo-whatsapp" size={18} color="#FFF" style={{marginRight: 6}} />
                                        <Text style={styles.chatWaBtnText}>Hubungi via WhatsApp</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Section: Informasi Umum */}
                            <View style={styles.detailSection}>
                                <Text style={styles.sectionTitle}>Informasi Umum</Text>
                                <View style={styles.detailInfoGrid}>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.gridLabel}>Spesialisasi</Text>
                                        <Text style={styles.gridVal}>{selectedTech.specialization}</Text>
                                    </View>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.gridLabel}>Pengalaman</Text>
                                        <Text style={styles.gridVal}>{selectedTech.experience} tahun</Text>
                                    </View>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.gridLabel}>Lokasi Operasional</Text>
                                        <Text style={styles.gridVal}>{selectedTech.location}</Text>
                                    </View>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.gridLabel}>Status Kerja</Text>
                                        <Text style={styles.gridVal}>{selectedTech.employmentStatus || "Freelance"}</Text>
                                    </View>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.gridLabel}>Peralatan Mandiri</Text>
                                        <Text style={styles.gridVal}>{selectedTech.hasEquipment ? "Milik Sendiri (Ya)" : "Tidak Ada"}</Text>
                                    </View>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.gridLabel}>Kendaraan</Text>
                                        <Text style={styles.gridVal}>{selectedTech.vehicle || "Tidak Ada"}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Section: Keahlian Spesifik */}
                            <View style={styles.detailSection}>
                                <Text style={styles.sectionTitle}>Keahlian Tambahan</Text>
                                <View style={styles.skillsBadgeContainer}>
                                    {selectedTech.skills && selectedTech.skills.length > 0 ? (
                                        selectedTech.skills.map((skill, index) => (
                                            <View key={index} style={styles.skillBadge}>
                                                <Text style={styles.skillBadgeText}>{skill}</Text>
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={styles.emptySectionText}>Tidak ada keahlian tambahan yang dicantumkan</Text>
                                    )}
                                </View>
                            </View>

                            {/* Section: Informasi Bank */}
                            <View style={styles.detailSection}>
                                <Text style={styles.sectionTitle}>Informasi Bank & Keuangan</Text>
                                <View style={styles.bankDetailCard}>
                                    <Ionicons name="card" size={24} color="#B3875E" style={{marginRight: 12}} />
                                    <View>
                                        <Text style={styles.bankNameText}>{selectedTech.bankName || "Nama Bank Tidak Diisi"}</Text>
                                        <Text style={styles.bankAccountText}>{selectedTech.bankAccount || "Nomor Rekening Tidak Diisi"}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Section: Hasil Uji Kompetensi */}
                            <View style={styles.detailSection}>
                                <View style={styles.testHeaderRow}>
                                    <Text style={styles.sectionTitle}>Uji Kompetensi</Text>
                                    <View style={styles.testScoreBadge}>
                                        <Text style={styles.testScoreLabel}>Skor Tes: </Text>
                                        <Text style={styles.testScoreNumber}>{selectedTech.testScore !== undefined ? selectedTech.testScore : "N/A"}/100</Text>
                                    </View>
                                </View>

                                {selectedTech.testAnswers && selectedTech.testAnswers.length > 0 ? (
                                    <View style={styles.answersList}>
                                        {selectedTech.testAnswers.map((answer, index) => (
                                            <View key={index} style={styles.answerCard}>
                                                <View style={styles.answerCardHeader}>
                                                    <Text style={styles.answerIndexText}>Pertanyaan {index + 1}</Text>
                                                    <View style={styles.answerStatusRow}>
                                                        <Ionicons 
                                                            name={answer.isCorrect ? "checkmark-circle" : "close-circle"} 
                                                            size={18} 
                                                            color={answer.isCorrect ? "#5CB85C" : "#D9534F"} 
                                                            style={{marginRight: 4}}
                                                        />
                                                        <Text style={[styles.answerStatusText, answer.isCorrect ? styles.correctAnswerText : styles.incorrectAnswerText]}>
                                                            {answer.isCorrect ? "Benar" : "Salah"}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Text style={styles.answerQuestion}>{answer.question}</Text>
                                                <View style={styles.answersDetailsContainer}>
                                                    <Text style={styles.answerOptionText}>
                                                        <Text style={{fontWeight: '700'}}>Jawaban Dipilih: </Text>{answer.selected}
                                                    </Text>
                                                    {!answer.isCorrect && (
                                                        <Text style={[styles.answerOptionText, {color: '#5CB85C', marginTop: 3}]}>
                                                            <Text style={{fontWeight: '700', color: '#5CB85C'}}>Jawaban Benar: </Text>{answer.correct}
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    <Text style={styles.emptySectionText}>
                                        Data jawaban dari 10 pertanyaan tidak tersedia. Hanya skor akhir yang terekam ({selectedTech.testScore || 0}/100)
                                    </Text>
                                )}
                            </View>

                            {/* Section: Dokumen Foto KTP & Verifikasi Wajah */}
                            <View style={styles.detailSection}>
                                <Text style={styles.sectionTitle}>Dokumen & Foto Verifikasi</Text>
                                <Text style={styles.sectionSubtitle}>Ketuk foto untuk melihat dalam resolusi penuh</Text>

                                <View style={styles.documentGrid}>
                                    {/* KTP */}
                                    <View style={styles.documentCard}>
                                        <Text style={styles.documentCardTitle}>Foto KTP + Selfie KTP</Text>
                                        {selectedTech.ktpUrl ? (
                                            <TouchableOpacity 
                                                style={styles.docImageContainer} 
                                                onPress={() => setPreviewImage(selectedTech.ktpUrl)}
                                            >
                                                <Image source={{ uri: selectedTech.ktpUrl }} style={styles.docImage} />
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={styles.noDocPlaceholder}>
                                                <Ionicons name="image-outline" size={32} color="#CCC" />
                                                <Text style={styles.noDocText}>KTP tidak diunggah</Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Selfie Wajah */}
                                    <View style={styles.documentCard}>
                                        <Text style={styles.documentCardTitle}>Selfie (Verifikasi Wajah)</Text>
                                        {selectedTech.selfiePhotos && selectedTech.selfiePhotos.length > 0 ? (
                                            <TouchableOpacity 
                                                style={styles.docImageContainer} 
                                                onPress={() => setPreviewImage(selectedTech.selfiePhotos[0])}
                                            >
                                                <Image source={{ uri: selectedTech.selfiePhotos[0] }} style={styles.docImage} />
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={styles.noDocPlaceholder}>
                                                <Ionicons name="image-outline" size={32} color="#CCC" />
                                                <Text style={styles.noDocText}>Selfie tidak diunggah</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Bukti Kerja (Work Evidence Photos) */}
                                <Text style={[styles.sectionTitle, {marginTop: 20, fontSize: 13}]}>Portofolio Bukti Kerja ({selectedTech.workPhotos ? selectedTech.workPhotos.length : 0} Foto)</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.workPhotosScroll}>
                                    {selectedTech.workPhotos && selectedTech.workPhotos.length > 0 ? (
                                        selectedTech.workPhotos.map((photoUrl, index) => (
                                            <TouchableOpacity 
                                                key={index} 
                                                style={styles.workPhotoContainer}
                                                onPress={() => setPreviewImage(photoUrl)}
                                            >
                                                <Image source={{ uri: photoUrl }} style={styles.workPhoto} />
                                                <View style={styles.photoCountBadge}>
                                                    <Text style={styles.photoCountText}>{index + 1}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        <View style={[styles.noDocPlaceholder, {width: 150, height: 110}]}>
                                            <Ionicons name="images-outline" size={24} color="#CCC" />
                                            <Text style={[styles.noDocText, {fontSize: 10}]}>Tidak ada bukti kerja</Text>
                                        </View>
                                    )}
                                </ScrollView>
                            </View>

                            <View style={{height: 100}} />
                        </ScrollView>

                        {/* Bottom Actions Bar inside Detail */}
                        <View style={styles.bottomActionBar}>
                            {selectedTech.status === "pending" || !selectedTech.status ? (
                                <AnimatedButton
                                    title="Approve & Aktifkan Mitra"
                                    icon={<Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{marginRight: 6}} />}
                                    isLoading={approvingUid === selectedTech.uid}
                                    onPress={() => handleApprove(selectedTech.uid)}
                                    style={{ width: '100%' }}
                                />
                            ) : (
                                <View style={styles.approvedActivePanel}>
                                    <Ionicons name="ribbon" size={20} color="#5CB85C" style={{marginRight: 6}} />
                                    <Text style={styles.approvedActiveText}>Mitra Teknisi Resmi Aktif</Text>
                                </View>
                            )}
                        </View>
                    </SafeAreaView>
                </Modal>
            )}

            {/* Escrow Order Verification Modal */}
            {selectedOrder && (
                <Modal
                    visible={true}
                    animationType="slide"
                    transparent={false}
                    onRequestClose={() => setSelectedOrder(null)}
                >
                    <SafeAreaView style={styles.detailContainer}>
                        {/* Detail Header */}
                        <View style={styles.detailHeader}>
                            <TouchableOpacity 
                                style={styles.closeModalBtn}
                                onPress={() => setSelectedOrder(null)}
                            >
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                            <Text style={styles.detailHeaderTitle}>Verifikasi Pencairan Dana</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
                            {/* Order Info Card */}
                            <View style={styles.detailProfileCard}>
                                <View style={styles.detailAvatarContainer}>
                                    <Ionicons name="receipt" size={36} color="#B3875E" />
                                </View>
                                <Text style={styles.detailName}>ID: {selectedOrder.id}</Text>
                                <Text style={styles.detailSub}>Pelanggan: {selectedOrder.userName || "Customer"}</Text>
                                <Text style={styles.detailSub}>Alamat: {selectedOrder.userAddress || "Tidak ada alamat"}</Text>
                                <Text style={[styles.detailSub, {fontWeight: '700', color: '#B3875E'}]}>Teknisi: {selectedOrder.technicianName}</Text>
                            </View>

                            {/* Section: Rincian Biaya */}
                            <View style={styles.detailSection}>
                                <Text style={styles.sectionTitle}>Rincian Biaya & Rekening Teknisi</Text>
                                
                                <View style={styles.bankDetailCard}>
                                    <Ionicons name="card" size={24} color="#B3875E" style={{marginRight: 12}} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.bankNameText}>Nama Bank: {
                                            technicians.find(t => t.uid === selectedOrder.technicianId)?.bankName || "Belum diset"
                                        }</Text>
                                        <Text style={styles.bankAccountText}>No Rekening: {
                                            technicians.find(t => t.uid === selectedOrder.technicianId)?.bankAccount || "Belum diset"
                                        }</Text>
                                    </View>
                                </View>

                                <View style={[styles.detailInfoGrid, {marginTop: 15}]}>
                                    <View style={[styles.gridItem, {width: '100%', backgroundColor: '#EAF7EA', borderColor: '#D0EED0'}]}>
                                        <Text style={[styles.gridLabel, {color: '#2E7D32'}]}>Total Dana Dicairkan</Text>
                                        <Text style={[styles.gridVal, {fontSize: 16, color: '#2E7D32'}]}>Rp {(selectedOrder.totalBill || 50000).toLocaleString("id-ID")}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Section: Perbandingan Foto Sebelum & Sesudah Perbaikan */}
                            <View style={styles.detailSection}>
                                <Text style={styles.sectionTitle}>Bukti Kerja (Sebelum vs Sesudah)</Text>
                                <Text style={styles.sectionSubtitle}>Bandingkan foto inspeksi awal dengan foto hasil perbaikan</Text>

                                {selectedOrder.selectedServices && selectedOrder.selectedServices.length > 0 ? (
                                    selectedOrder.selectedServices.map((service: any, idx: number) => {
                                        const rawBeforeUrls = selectedOrder.inspectionPhotos?.[service.name] || [];
                                        const rawAfterUrls = selectedOrder.completionPhotos?.[service.name] || [];
                                        const beforeUrls = rawBeforeUrls.map((url: string) => url.replace(/^http:\/\/[0-9.]+:\d+/, BASE_URL));
                                        const afterUrls = rawAfterUrls.map((url: string) => url.replace(/^http:\/\/[0-9.]+:\d+/, BASE_URL));
                                        
                                        return (
                                            <View key={idx} style={styles.serviceComparisonCard}>
                                                <Text style={styles.serviceComparisonTitle}>{service.name}</Text>
                                                
                                                <View style={styles.beforeAfterRow}>
                                                    {/* Sebelum */}
                                                    <View style={styles.beforeAfterCol}>
                                                        <Text style={styles.beforeColTitle}>Sebelum (Inspeksi)</Text>
                                                        {beforeUrls.length > 0 ? (
                                                            <TouchableOpacity 
                                                                style={styles.comparisonImageWrapper} 
                                                                onPress={() => setPreviewImage(beforeUrls[0])}
                                                            >
                                                                <Image source={{ uri: beforeUrls[0] }} style={styles.comparisonImage} />
                                                            </TouchableOpacity>
                                                        ) : (
                                                            <View style={styles.noPhotoPlaceholder}>
                                                                <Ionicons name="camera-outline" size={24} color="#CCC" />
                                                                <Text style={styles.noPhotoText}>Tidak ada foto</Text>
                                                            </View>
                                                        )}
                                                    </View>

                                                    {/* Sesudah */}
                                                    <View style={styles.beforeAfterCol}>
                                                        <Text style={styles.afterColTitle}>Sesudah (Selesai)</Text>
                                                        {afterUrls.length > 0 ? (
                                                            <TouchableOpacity 
                                                                style={styles.comparisonImageWrapper} 
                                                                onPress={() => setPreviewImage(afterUrls[0])}
                                                            >
                                                                <Image source={{ uri: afterUrls[0] }} style={styles.comparisonImage} />
                                                            </TouchableOpacity>
                                                        ) : (
                                                            <View style={styles.noPhotoPlaceholder}>
                                                                <Ionicons name="camera-outline" size={24} color="#CCC" />
                                                                <Text style={styles.noPhotoText}>Tidak ada foto</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                            </View>
                                        );
                                    })
                                ) : (
                                    // Pengecekan saja (isCheckOnly)
                                    <View style={styles.serviceComparisonCard}>
                                        <Text style={styles.serviceComparisonTitle}>Pengecekan & Kunjungan Saja</Text>
                                        <View style={styles.beforeAfterRow}>
                                            <View style={[styles.beforeAfterCol, { width: '100%' }]}>
                                                <Text style={styles.beforeColTitle}>Bukti Foto Inspeksi</Text>
                                                {selectedOrder.inspectionPhotos && Object.values(selectedOrder.inspectionPhotos).flat().length > 0 ? (
                                                    <TouchableOpacity 
                                                        style={styles.comparisonImageWrapper} 
                                                        onPress={() => setPreviewImage((Object.values(selectedOrder.inspectionPhotos).flat()[0] as string).replace(/^http:\/\/[0-9.]+:\d+/, BASE_URL))}
                                                    >
                                                        <Image source={{ uri: (Object.values(selectedOrder.inspectionPhotos).flat()[0] as string).replace(/^http:\/\/[0-9.]+:\d+/, BASE_URL) }} style={styles.comparisonImage} />
                                                    </TouchableOpacity>
                                                ) : (
                                                    <View style={styles.noPhotoPlaceholder}>
                                                        <Ionicons name="camera-outline" size={24} color="#CCC" />
                                                        <Text style={styles.noPhotoText}>Tidak ada foto</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>

                            <View style={{height: 100}} />
                        </ScrollView>

                        {/* Bottom Actions Bar inside Detail */}
                        <View style={styles.bottomActionBar}>
                            {adminView === "warranty" ? (
                                selectedOrder.warranty_status === "pending_admin_approval" ? (
                                    <AnimatedButton
                                        title="Approve & Aktifkan Garansi"
                                        icon={<Ionicons name="shield-checkmark" size={20} color="#FFF" style={{marginRight: 6}} />}
                                        isLoading={approvingWarrantyId === selectedOrder.id}
                                        onPress={() => handleApproveWarranty(selectedOrder.id)}
                                        style={{ width: '100%' }}
                                    />
                                ) : (
                                    <View style={styles.approvedActivePanel}>
                                        <Ionicons name="checkmark-circle" size={20} color="#5CB85C" style={{marginRight: 6}} />
                                        <Text style={styles.approvedActiveText}>Garansi Telah Disetujui</Text>
                                    </View>
                                )
                            ) : (
                                selectedOrder.escrowStatus !== "released" ? (
                                    <AnimatedButton
                                        title="Approve & Cairkan Dana"
                                        icon={<Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{marginRight: 6}} />}
                                        isLoading={releasingOrderId === selectedOrder.id}
                                        onPress={() => handleReleaseEscrow(selectedOrder.id)}
                                        style={{ width: '100%' }}
                                    />
                                ) : (
                                    <View style={styles.approvedActivePanel}>
                                        <Ionicons name="checkmark-circle" size={20} color="#5CB85C" style={{marginRight: 6}} />
                                        <Text style={styles.approvedActiveText}>Dana Telah Dicairkan ke Teknisi</Text>
                                    </View>
                                )
                            )}
                        </View>
                    </SafeAreaView>
                </Modal>
            )}

            {/* Fullscreen High-Res Image Preview Modal */}
            {previewImage && (
                <Modal
                    visible={true}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setPreviewImage(null)}
                >
                    <View style={styles.previewOverlay}>
                        <TouchableOpacity 
                            style={styles.previewCloseBtn} 
                            onPress={() => setPreviewImage(null)}
                        >
                            <Ionicons name="close" size={32} color="#FFF" />
                        </TouchableOpacity>
                        
                        <Image 
                            source={{ uri: previewImage }} 
                            style={styles.previewImage} 
                            resizeMode="contain" 
                        />
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    appHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "android" ? 40 : 15,
        paddingBottom: 15,
        backgroundColor: Theme.colors.surface,
        borderBottomWidth: 1.5,
        borderBottomColor: "#F0EFEB",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    adminTitle: {
        fontSize: 18,
        fontWeight: "900",
        color: Theme.colors.text,
    },
    adminSubtitle: {
        fontSize: 11,
        color: Theme.colors.primary,
        fontWeight: "600",
        marginTop: 2,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF5F5",
        borderWidth: 1,
        borderColor: "#FFEAEA",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    logoutText: {
        color: "#D9534F",
        fontSize: 12,
        fontWeight: "700",
        marginLeft: 4,
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: Theme.colors.surface,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F0EFEB",
        gap: 8,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 25,
        alignItems: "center",
        backgroundColor: "#F7F5F0",
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    tabButtonActive: {
        backgroundColor: Theme.colors.primary,
        borderColor: Theme.colors.primary,
    },
    tabText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#8B8175",
    },
    tabTextActive: {
        color: "#FFF",
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    loadingLabel: {
        marginTop: 15,
        fontSize: 14,
        fontWeight: "600",
        color: Theme.colors.primary,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: Theme.colors.text,
        marginTop: 15,
    },
    emptySubtitle: {
        fontSize: 13,
        color: "#8B8175",
        textAlign: "center",
        marginTop: 8,
        lineHeight: 20,
    },
    refreshButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Theme.colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        marginTop: 20,
        elevation: 2,
    },
    refreshButtonText: {
        color: "#FFF",
        fontWeight: "700",
        fontSize: 13,
    },
    listContent: {
        padding: 16,
        gap: 16,
    },
    techCard: {
        backgroundColor: Theme.colors.surface,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: Theme.colors.border,
        padding: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Theme.colors.background,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: Theme.colors.border,
        overflow: 'hidden',
    },
    avatarImage: {
        width: "100%",
        height: "100%",
    },
    headerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    techName: {
        fontSize: 15,
        fontWeight: "800",
        color: Theme.colors.text,
    },
    techSpec: {
        fontSize: 12,
        color: Theme.colors.primary,
        fontWeight: "600",
        marginTop: 2,
    },
    statusBadge: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 15,
    },
    badgePending: {
        backgroundColor: "#FFF9E6",
    },
    badgeApproved: {
        backgroundColor: "#EAF7EA",
    },
    statusText: {
        fontSize: 11,
        fontWeight: "800",
    },
    statusPendingText: {
        color: "#D9A700",
    },
    statusApprovedText: {
        color: "#5CB85C",
    },
    cardDivider: {
        height: 1,
        backgroundColor: "#F0EFEB",
        marginVertical: 14,
    },
    cardBody: {
        gap: 8,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    infoRowText: {
        fontSize: 12,
        color: Theme.colors.textMuted,
        fontWeight: "500",
    },
    cardFooter: {
        marginTop: 14,
        alignItems: "flex-end",
    },
    detailButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 4,
    },
    detailButtonText: {
        fontSize: 12,
        color: Theme.colors.primary,
        fontWeight: "700",
        marginRight: 2,
    },

    // Detail Modal Styles
    detailContainer: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    detailHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 15,
        backgroundColor: Theme.colors.surface,
        borderBottomWidth: 1.5,
        borderBottomColor: "#F0EFEB",
    },
    closeModalBtn: {
        padding: 4,
    },
    detailHeaderTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: Theme.colors.text,
    },
    detailScroll: {
        flex: 1,
        padding: 16,
    },
    detailProfileCard: {
        backgroundColor: Theme.colors.surface,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: Theme.colors.border,
        padding: 20,
        alignItems: "center",
        marginBottom: 20,
    },
    detailAvatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Theme.colors.background,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: Theme.colors.border,
        overflow: "hidden",
        marginBottom: 12,
    },
    detailAvatar: {
        width: "100%",
        height: "100%",
    },
    detailName: {
        fontSize: 18,
        fontWeight: "900",
        color: Theme.colors.text,
    },
    detailSub: {
        fontSize: 13,
        color: Theme.colors.textMuted,
        fontWeight: "500",
        marginTop: 3,
    },
    actionRow: {
        flexDirection: "row",
        marginTop: 15,
        width: "100%",
    },
    chatWaBtn: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: "#25D366",
        paddingVertical: 12,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        elevation: 2,
    },
    chatWaBtnText: {
        color: "#FFF",
        fontWeight: "700",
        fontSize: 13,
    },
    detailSection: {
        backgroundColor: Theme.colors.surface,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: Theme.colors.border,
        padding: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "800",
        color: Theme.colors.text,
        marginBottom: 14,
        borderLeftWidth: 3,
        borderLeftColor: "#B3875E",
        paddingLeft: 8,
    },
    sectionSubtitle: {
        fontSize: 11,
        color: "#8B8175",
        fontWeight: "500",
        marginBottom: 12,
        marginTop: -6,
    },
    detailInfoGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    gridItem: {
        width: "48%",
        backgroundColor: "#FAF8F5",
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#F3EFE9",
    },
    gridLabel: {
        fontSize: 10,
        color: "#8B8175",
        fontWeight: "600",
    },
    gridVal: {
        fontSize: 12,
        fontWeight: "700",
        color: Theme.colors.text,
        marginTop: 4,
    },
    skillsBadgeContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    skillBadge: {
        backgroundColor: Theme.colors.background,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 15,
    },
    skillBadgeText: {
        fontSize: 11,
        color: "#8B8175",
        fontWeight: "700",
    },
    bankDetailCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FAF8F5",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#F3EFE9",
    },
    bankNameText: {
        fontSize: 14,
        fontWeight: "800",
        color: Theme.colors.text,
    },
    bankAccountText: {
        fontSize: 13,
        color: Theme.colors.textMuted,
        fontWeight: "600",
        marginTop: 2,
    },
    testHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    testScoreBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF9E6",
        borderWidth: 1,
        borderColor: "#FAD8A5",
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    testScoreLabel: {
        fontSize: 11,
        color: "#C48000",
        fontWeight: "600",
    },
    testScoreNumber: {
        fontSize: 12,
        fontWeight: "800",
        color: Theme.colors.primary,
    },
    answersList: {
        gap: 12,
    },
    answerCard: {
        backgroundColor: "#FAF8F5",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#F3EFE9",
        padding: 14,
    },
    answerCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    answerIndexText: {
        fontSize: 11,
        fontWeight: "800",
        color: "#8B8175",
    },
    answerStatusRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    answerStatusText: {
        fontSize: 11,
        fontWeight: "800",
    },
    correctAnswerText: {
        color: "#5CB85C",
    },
    incorrectAnswerText: {
        color: "#D9534F",
    },
    answerQuestion: {
        fontSize: 13,
        fontWeight: "700",
        color: Theme.colors.text,
        lineHeight: 18,
    },
    answersDetailsContainer: {
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#EEE",
    },
    answerOptionText: {
        fontSize: 11,
        color: Theme.colors.textMuted,
        lineHeight: 15,
    },
    emptySectionText: {
        fontSize: 12,
        color: "#8B8175",
        fontStyle: "italic",
        textAlign: "center",
        paddingVertical: 10,
    },
    documentGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    documentCard: {
        flex: 1,
        backgroundColor: "#FAF8F5",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#F3EFE9",
        padding: 12,
        alignItems: "center",
    },
    documentCardTitle: {
        fontSize: 10,
        fontWeight: "800",
        color: "#8B8175",
        marginBottom: 8,
        textAlign: "center",
    },
    docImageContainer: {
        width: "100%",
        height: 100,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    docImage: {
        width: "100%",
        height: "100%",
    },
    noDocPlaceholder: {
        width: "100%",
        height: 100,
        borderRadius: 12,
        backgroundColor: Theme.colors.surface,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: Theme.colors.border,
        borderStyle: "dashed",
    },
    noDocText: {
        fontSize: 9,
        color: "#BBB",
        fontWeight: "600",
        marginTop: 4,
    },
    workPhotosScroll: {
        flexDirection: "row",
        marginTop: 8,
    },
    workPhotoContainer: {
        position: "relative",
        marginRight: 10,
    },
    workPhoto: {
        width: 130,
        height: 95,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Theme.colors.border,
    },
    photoCountBadge: {
        position: "absolute",
        top: 6,
        left: 6,
        backgroundColor: "rgba(0,0,0,0.5)",
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    photoCountText: {
        color: "#FFF",
        fontSize: 10,
        fontWeight: "800",
    },
    bottomActionBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Theme.colors.surface,
        borderTopWidth: 1.5,
        borderTopColor: "#F0EFEB",
        padding: 16,
        paddingBottom: Platform.OS === "ios" ? 30 : 16,
        flexDirection: "row",
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    approveActionBtn: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: "#5CB85C",
        paddingVertical: 15,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        elevation: 2,
    },
    approveActionBtnText: {
        color: "#FFF",
        fontSize: 15,
        fontWeight: "800",
    },
    approvedActivePanel: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: "#EAF7EA",
        paddingVertical: 14,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#D0EED0",
    },
    approvedActiveText: {
        color: "#5CB85C",
        fontSize: 14,
        fontWeight: "800",
    },

    // Preview Fullscreen Modal
    previewOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.95)",
        justifyContent: "center",
        alignItems: "center",
    },
    previewCloseBtn: {
        position: "absolute",
        top: 40,
        right: 20,
        padding: 8,
        zIndex: 10,
    },
    previewImage: {
        width: "95%",
        height: "80%",
    },

    // Escrow & Comparison Photo Styles
    masterTabContainer: {
        flexDirection: "row",
        backgroundColor: Theme.colors.background,
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#F0EFEB",
        gap: 8,
    },
    masterTabButton: {
        flex: 1,
        flexDirection: "row",
        paddingVertical: 12,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Theme.colors.surface,
        borderWidth: 1.5,
        borderColor: Theme.colors.border,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 2,
    },
    masterTabButtonActive: {
        backgroundColor: Theme.colors.primary,
        borderColor: Theme.colors.primary,
    },
    masterTabText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#8B8175",
    },
    masterTabTextActive: {
        color: "#FFF",
    },
    serviceComparisonCard: {
        backgroundColor: "#FAF8F5",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#F3EFE9",
        padding: 16,
        marginBottom: 16,
    },
    serviceComparisonTitle: {
        fontSize: 13,
        fontWeight: "800",
        color: Theme.colors.text,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: "#B3875E",
        paddingLeft: 6,
    },
    beforeAfterRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    beforeAfterCol: {
        flex: 1,
        alignItems: "center",
    },
    beforeColTitle: {
        fontSize: 10,
        fontWeight: "700",
        color: "#D9534F",
        marginBottom: 6,
        textTransform: "uppercase",
    },
    afterColTitle: {
        fontSize: 10,
        fontWeight: "700",
        color: "#5CB85C",
        marginBottom: 6,
        textTransform: "uppercase",
    },
    comparisonImageWrapper: {
        width: "100%",
        height: 100,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1.5,
        borderColor: Theme.colors.border,
    },
    comparisonImage: {
        width: "100%",
        height: "100%",
    },
    noPhotoPlaceholder: {
        width: "100%",
        height: 100,
        borderRadius: 12,
        backgroundColor: Theme.colors.surface,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: Theme.colors.border,
        borderStyle: "dashed",
    },
    noPhotoText: {
        fontSize: 9,
        color: "#BBB",
        fontWeight: "600",
        marginTop: 4,
    },
});


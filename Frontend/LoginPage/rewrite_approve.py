import re

with open("app/approve.tsx", "r") as f:
    content = f.read()

# Add imports for Theme, AnimatedButton, useCustomAlert
content = content.replace('import { doc, updateDoc } from "firebase/firestore";',
'''import { doc, updateDoc } from "firebase/firestore";
import { Theme } from "../constants/Theme";
import { useCustomAlert } from "../components/ui/GlobalAlertProvider";
import AnimatedButton from "../components/ui/AnimatedButton";''')

# Add useCustomAlert hook
content = content.replace('    const [approvingWarrantyId, setApprovingWarrantyId] = useState<string | null>(null);',
'''    const [approvingWarrantyId, setApprovingWarrantyId] = useState<string | null>(null);
    const { showAlert, showConfirm } = useCustomAlert();''')


# Replace Alert.alert logic with showAlert and showConfirm
# This requires replacing complex block of code.

old_approve = """    const handleApprove = async (uid: string) => {

        Alert.alert(
            "Konfirmasi Persetujuan",
            "Apakah Anda yakin ingin menyetujui teknisi ini menjadi mitra resmi?",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Ya, Setujui",
                    onPress: async () => {
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

                            Alert.alert("Sukses 🎉", "Teknisi berhasil disetujui!");
                            
                            // Update local state
                            setTechnicians(prev => 
                                prev.map(tech => 
                                    tech.uid === uid ? { ...tech, status: "approved" } : tech
                                )
                            );

                            // Update selected tech detail if open
                            if (selectedTech && selectedTech.uid === uid) {
                                setSelectedTech(prev => prev ? { ...prev, status: "approved" } : null);
                            }
                        } catch (error: any) {
                            Alert.alert("Gagal", error.message);
                        } finally {
                            setApprovingUid(null);
                        }
                    }
                }
            ]
        );
    };"""

new_approve = """    const handleApprove = async (uid: string) => {
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
    };"""
content = content.replace(old_approve, new_approve)

old_chatwa_err = 'Alert.alert("Gagal", "Tidak dapat membuka WhatsApp");'
new_chatwa_err = 'showAlert({ title: "Gagal", message: "Tidak dapat membuka WhatsApp", type: "error" });'
content = content.replace(old_chatwa_err, new_chatwa_err)

old_escrow = """    const handleReleaseEscrow = async (orderId: string) => {
        Alert.alert(
            "Konfirmasi Pencairan Dana",
            "Apakah Anda yakin ingin menyetujui pencairan dana escrow ini ke rekening teknisi?",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Ya, Cairkan",
                    onPress: async () => {
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

                            Alert.alert("Sukses 💸", "Dana berhasil dicairkan ke rekening teknisi!");
                            
                            // Update local orders list state
                            setOrders(prev => 
                                prev.map(order => 
                                    order.id === orderId ? { ...order, escrowStatus: "released" } : order
                                )
                            );

                            if (selectedOrder && selectedOrder.id === orderId) {
                                setSelectedOrder((prev: any) => prev ? { ...prev, escrowStatus: "released" } : null);
                            }
                        } catch (error: any) {
                            Alert.alert("Gagal", error.message);
                        } finally {
                            setReleasingOrderId(null);
                        }
                    }
                }
            ]
        );
    };"""

new_escrow = """    const handleReleaseEscrow = async (orderId: string) => {
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
    };"""
content = content.replace(old_escrow, new_escrow)


old_warranty = """    const handleApproveWarranty = async (orderId: string) => {
        Alert.alert(
            "Konfirmasi Garansi",
            "Apakah Anda yakin ingin menyetujui klaim garansi ini?",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Ya, Setujui",
                    onPress: async () => {
                        try {
                            setApprovingWarrantyId(orderId);
                            const orderRef = doc(db, "orders", orderId);
                            await updateDoc(orderRef, {
                                warranty_status: "approved",
                                status: "warranty_approved"
                            });
                            
                            Alert.alert("Sukses 🎉", "Klaim garansi telah disetujui!");
                            
                            // Update local state
                            setOrders(prev => prev.map(order => 
                                order.id === orderId 
                                ? { ...order, warranty_status: "approved", status: "warranty_approved" }
                                : order
                            ));

                            if (selectedOrder && selectedOrder.id === orderId) {
                                setSelectedOrder((prev: any) => prev ? { ...prev, warranty_status: "approved", status: "warranty_approved" } : null);
                            }
                        } catch (error: any) {
                            Alert.alert("Gagal", error.message || "Gagal menyetujui klaim garansi");
                        } finally {
                            setApprovingWarrantyId(null);
                        }
                    }
                }
            ]
        );
    };"""
new_warranty = """    const handleApproveWarranty = async (orderId: string) => {
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
    };"""
content = content.replace(old_warranty, new_warranty)


old_logout = """                <TouchableOpacity 
                    style={styles.logoutButton}
                    onPress={() => {
                        Alert.alert("Konfirmasi", "Keluar dari Halaman Admin?", [
                            { text: "Batal" },
                            { text: "Keluar", onPress: () => router.replace("/login") }
                        ]);
                    }}
                >
                    <Ionicons name="log-out-outline" size={20} color="#D9534F" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>"""
new_logout = """                <TouchableOpacity 
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
                </TouchableOpacity>"""
content = content.replace(old_logout, new_logout)


# Also Replace Alert.alert in fetchAllData error catch
content = re.sub(r'Alert\.alert\("Error", error\.message \|\| "Gagal menghubungkan ke server\."\);', 
                 r'showAlert({ title: "Error", message: error.message || "Gagal menghubungkan ke server.", type: "error" });', content)



# Apply Theme colors to styles
content = content.replace('backgroundColor: "#FAF6F0"', 'backgroundColor: Theme.colors.background')
content = content.replace('backgroundColor: "#FFF"', 'backgroundColor: Theme.colors.surface')

content = content.replace('color: "#333"', 'color: Theme.colors.text')
content = content.replace('color: "#555"', 'color: Theme.colors.textMuted')
content = content.replace('color: "#777"', 'color: Theme.colors.textMuted')
content = content.replace('color: "#CCC"', 'color: Theme.colors.textMuted')

content = content.replace('borderColor: "#F0EFEB"', 'borderColor: Theme.colors.border')
content = content.replace('borderColor: "#EAE6DF"', 'borderColor: Theme.colors.border')


content = content.replace('backgroundColor: "#B3875E"', 'backgroundColor: Theme.colors.primary')
content = content.replace('borderColor: "#B3875E"', 'borderColor: Theme.colors.primary')
content = content.replace('color: "#B3875E"', 'color: Theme.colors.primary')

# Let's replace bottom action bars
old_approve_action = """                            {selectedTech.status === "pending" || !selectedTech.status ? (
                                <TouchableOpacity
                                    style={[styles.approveActionBtn, approvingUid === selectedTech.uid && { opacity: 0.8 }]}
                                    disabled={approvingUid === selectedTech.uid}
                                    onPress={() => handleApprove(selectedTech.uid)}
                                >
                                    {approvingUid === selectedTech.uid ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{marginRight: 6}} />
                                            <Text style={styles.approveActionBtnText}>Approve & Aktifkan Mitra</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            ) : ("""
new_approve_action = """                            {selectedTech.status === "pending" || !selectedTech.status ? (
                                <AnimatedButton
                                    title="Approve & Aktifkan Mitra"
                                    icon={<Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{marginRight: 6}} />}
                                    isLoading={approvingUid === selectedTech.uid}
                                    onPress={() => handleApprove(selectedTech.uid)}
                                    style={{ width: '100%' }}
                                />
                            ) : ("""
content = content.replace(old_approve_action, new_approve_action)

old_warranty_action = """                                selectedOrder.warranty_status === "pending_admin_approval" ? (
                                    <TouchableOpacity
                                        style={[styles.approveActionBtn, approvingWarrantyId === selectedOrder.id && { opacity: 0.8 }]}
                                        disabled={approvingWarrantyId === selectedOrder.id}
                                        onPress={() => handleApproveWarranty(selectedOrder.id)}
                                    >
                                        {approvingWarrantyId === selectedOrder.id ? (
                                            <ActivityIndicator color="#FFF" />
                                        ) : (
                                            <>
                                                <Ionicons name="shield-checkmark" size={20} color="#FFF" style={{marginRight: 6}} />
                                                <Text style={styles.approveActionBtnText}>Approve & Aktifkan Garansi</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                ) : ("""
new_warranty_action = """                                selectedOrder.warranty_status === "pending_admin_approval" ? (
                                    <AnimatedButton
                                        title="Approve & Aktifkan Garansi"
                                        icon={<Ionicons name="shield-checkmark" size={20} color="#FFF" style={{marginRight: 6}} />}
                                        isLoading={approvingWarrantyId === selectedOrder.id}
                                        onPress={() => handleApproveWarranty(selectedOrder.id)}
                                        style={{ width: '100%' }}
                                    />
                                ) : ("""
content = content.replace(old_warranty_action, new_warranty_action)

old_escrow_action = """                                selectedOrder.escrowStatus !== "released" ? (
                                    <TouchableOpacity
                                        style={[styles.approveActionBtn, releasingOrderId === selectedOrder.id && { opacity: 0.8 }]}
                                        disabled={releasingOrderId === selectedOrder.id}
                                        onPress={() => handleReleaseEscrow(selectedOrder.id)}
                                    >
                                        {releasingOrderId === selectedOrder.id ? (
                                            <ActivityIndicator color="#FFF" />
                                        ) : (
                                            <>
                                                <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{marginRight: 6}} />
                                                <Text style={styles.approveActionBtnText}>Approve & Cairkan Dana</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                ) : ("""
new_escrow_action = """                                selectedOrder.escrowStatus !== "released" ? (
                                    <AnimatedButton
                                        title="Approve & Cairkan Dana"
                                        icon={<Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{marginRight: 6}} />}
                                        isLoading={releasingOrderId === selectedOrder.id}
                                        onPress={() => handleReleaseEscrow(selectedOrder.id)}
                                        style={{ width: '100%' }}
                                    />
                                ) : ("""
content = content.replace(old_escrow_action, new_escrow_action)

with open("app/approve.tsx", "w") as f:
    f.write(content)


import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

// FIREBASE
import { auth, db } from "./_firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { BASE_URL } from "../api";

import { Theme } from "../constants/theme";
import { useCustomAlert } from "../components/ui/GlobalAlertProvider";
import AnimatedButton from "../components/ui/AnimatedButton";

export default function ProfileSettingsScreen() {
    const router = useRouter();
    const { from } = useLocalSearchParams();
    const { showAlert } = useCustomAlert();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [role, setRole] = useState<"users" | "technicians" | null>(null);

    // Profile Fields
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [uploadingPic, setUploadingPic] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            const user = auth.currentUser;
            if (!user) {
                showAlert({ title: "Sesi Berakhir", message: "Silakan login kembali.", type: "warning" });
                router.replace("/login" as any);
                return;
            }

            try {
                // 1. Try checking technicians collection first
                const techRef = doc(db, "technicians", user.uid);
                const techSnap = await getDoc(techRef);

                if (techSnap.exists()) {
                    setRole("technicians");
                    const data = techSnap.data();
                    setName(data.name || "");
                    setPhone(data.phone || "");
                    setEmail(data.email || user.email || "");
                    setProfilePic(data.profilePictureUrl || null);
                    setAddress(data.location || "");
                } else {
                    // 2. Check users collection
                    const userRef = doc(db, "users", user.uid);
                    const userSnap = await getDoc(userRef);

                    setRole("users");
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        setName(data.name || "");
                        setPhone(data.phone || "");
                        setEmail(data.email || user.email || "");
                        setProfilePic(data.profilePictureUrl || null);
                        setAddress(data.address || data.location || "");
                    } else {
                        // Document doesn't exist in either, default to customer profile
                        setName(user.displayName || "");
                        setPhone("");
                        setEmail(user.email || "");
                        setAddress("");
                    }
                }
            } catch (err) {
                console.error("Error loading profile:", err);
                showAlert({ title: "Gagal Memuat", message: "Tidak dapat mengambil data profil Anda.", type: "error" });
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

    // Change Profile Picture
    const handlePickProfilePicture = async () => {
        const user = auth.currentUser;
        if (!user || !role) return;

        // Request permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            showAlert({ title: "Izin Ditolak", message: "Izin galeri diperlukan untuk mengubah foto profil.", type: "warning" });
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
            const base64 = result.assets[0].base64;
            if (!base64) return;

            setUploadingPic(true);
            try {
                // Fallback upload (Backend timeout bypass): save base64 directly to Firestore
                const base64Url = `data:image/jpeg;base64,${base64}`;
                const { doc, updateDoc } = await import("firebase/firestore");
                const { db } = await import("./_firebaseConfig");
                
                await updateDoc(doc(db, role, user.uid), {
                    profilePictureUrl: base64Url
                });
                
                setProfilePic(base64Url);
                showAlert({ title: "Sukses", message: "Foto profil berhasil diperbarui!", type: "success" });
            } catch (err: any) {
                console.error("Profile pic upload error:", err);
                showAlert({ title: "Gagal Mengunggah", message: err.message || "Terjadi kesalahan.", type: "error" });
            } finally {
                setUploadingPic(false);
            }
        }
    };

    // Save Profile Details
    const handleSaveProfile = async () => {
        const user = auth.currentUser;
        if (!user || !role) return;

        if (!name.trim()) {
            showAlert({ title: "Input Salah", message: "Nama tidak boleh kosong.", type: "warning" });
            return;
        }

        setSaving(true);
        try {
            const collectionName = role === "technicians" ? "technicians" : "users";
            const docRef = doc(db, collectionName, user.uid);

            const updatePayload: any = {
                name: name.trim(),
                phone: phone.trim()
            };

            if (role === "technicians") {
                updatePayload.location = address.trim();
            } else {
                updatePayload.address = address.trim();
            }

            await updateDoc(docRef, updatePayload);

            const handleGoBack = () => {
                if (from === "home-tech") {
                    router.replace("/home-tech" as any);
                } else if (from === "Homepage") {
                    router.replace("/Homepage" as any);
                } else {
                    if (role === "technicians") {
                        router.replace("/home-tech" as any);
                    } else {
                        router.replace("/Homepage" as any);
                    }
                }
            };

            showAlert({
                title: "Sukses",
                message: "Profil Anda berhasil diperbarui!",
                type: "success",
                buttons: [{ text: "OK", onPress: handleGoBack }]
            });
        } catch (err) {
            console.error("Save profile error:", err);
            showAlert({ title: "Gagal Menyimpan", message: "Terjadi kesalahan saat memperbarui profil Anda.", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text style={styles.loadingText}>Memuat Profil...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backBtn}
                    onPress={() => {
                        if (from === "home-tech") {
                            router.replace("/home-tech" as any);
                        } else if (from === "Homepage") {
                            router.replace("/Homepage" as any);
                        } else {
                            if (role === "technicians") {
                                router.replace("/home-tech" as any);
                            } else {
                                router.replace("/Homepage" as any);
                            }
                        }
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color={Theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pengaturan Akun</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* PROFILE PIC CONTAINER */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity 
                        style={styles.avatarWrapper} 
                        onPress={handlePickProfilePicture}
                        disabled={uploadingPic}
                    >
                        {profilePic ? (
                            <Image source={{ uri: profilePic }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={60} color={Theme.colors.textMuted} />
                            </View>
                        )}
                        
                        {uploadingPic ? (
                            <View style={styles.avatarLoaderOverlay}>
                                <ActivityIndicator size="small" color="#fff" />
                            </View>
                        ) : (
                            <View style={styles.cameraIconContainer}>
                                <Ionicons name="camera" size={16} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.avatarTip}>Tekan foto untuk mengganti</Text>
                </View>

                {/* FIELDS */}
                <View style={styles.form}>
                    {/* NAMA */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nama Lengkap</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Masukkan Nama Lengkap"
                            placeholderTextColor={Theme.colors.textMuted}
                        />
                    </View>

                    {/* TELEPON */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nomor Telepon</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Contoh: 081234567890"
                            placeholderTextColor={Theme.colors.textMuted}
                            keyboardType="phone-pad"
                        />
                    </View>

                    {/* ALAMAT / LOKASI */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            {role === "technicians" ? "Lokasi / Kota" : "Alamat Lengkap"}
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={address}
                            onChangeText={setAddress}
                            placeholder={role === "technicians" ? "Masukkan kota Anda" : "Masukkan alamat lengkap Anda"}
                            placeholderTextColor={Theme.colors.textMuted}
                        />
                    </View>

                    {/* EMAIL (READ-ONLY) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Alamat Email</Text>
                        <View style={styles.readOnlyInput}>
                            <Text style={styles.readOnlyText}>{email}</Text>
                            <Ionicons name="lock-closed" size={16} color={Theme.colors.textMuted} />
                        </View>
                        <Text style={styles.inputTip}>Alamat email tidak dapat diubah.</Text>
                    </View>

                    {/* SAVE BUTTON */}
                    <AnimatedButton
                        title="Simpan Perubahan"
                        onPress={handleSaveProfile}
                        isLoading={saving}
                        style={{ marginTop: Theme.spacing.lg }}
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
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Theme.colors.background,
    },
    loadingText: {
        marginTop: 12,
        ...Theme.typography.body,
        color: Theme.colors.textMuted,
        fontWeight: "500",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
        backgroundColor: Theme.colors.surface,
        ...Theme.shadows.sm,
        zIndex: 10,
    },
    backBtn: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: Theme.colors.inputBg,
    },
    headerTitle: {
        ...Theme.typography.h3,
        color: Theme.colors.text,
    },
    scrollContent: {
        paddingHorizontal: Theme.spacing.xl,
        paddingVertical: 32,
        alignItems: "center",
    },
    avatarSection: {
        alignItems: "center",
        marginBottom: 32,
    },
    avatarWrapper: {
        position: "relative",
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Theme.colors.surface,
        ...Theme.shadows.md,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Theme.colors.inputBg,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarLoaderOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 60,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    cameraIconContainer: {
        position: "absolute",
        bottom: 0,
        right: 4,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Theme.colors.primary,
        borderWidth: 2,
        borderColor: Theme.colors.surface,
        justifyContent: "center",
        alignItems: "center",
        ...Theme.shadows.sm,
    },
    avatarTip: {
        marginTop: 10,
        ...Theme.typography.caption,
        color: Theme.colors.primaryDark,
        fontWeight: "600",
    },
    form: {
        width: "100%",
    },
    inputGroup: {
        marginBottom: Theme.spacing.lg,
    },
    label: {
        ...Theme.typography.subtitle,
        color: Theme.colors.text,
        marginBottom: Theme.spacing.xs,
    },
    input: {
        width: "100%",
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radius.lg,
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: 14,
        ...Theme.typography.body,
        color: Theme.colors.text,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    readOnlyInput: {
        width: "100%",
        backgroundColor: Theme.colors.inputBg,
        borderRadius: Theme.radius.lg,
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    readOnlyText: {
        ...Theme.typography.body,
        color: Theme.colors.textMuted,
    },
    inputTip: {
        marginTop: 6,
        ...Theme.typography.caption,
        color: Theme.colors.textMuted,
    },
});

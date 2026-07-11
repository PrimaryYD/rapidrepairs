import {
  BackHandler,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";

// 🔥 FIREBASE
import { auth, db } from "./_firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { Theme } from "../constants/theme";
import { useCustomAlert } from "../components/ui/GlobalAlertProvider";
import AnimatedButton from "../components/ui/AnimatedButton";

export default function Home() {
  const router = useRouter();
  const { showAlert } = useCustomAlert();
  const insets = useSafeAreaInsets();

  // 🔥 STATUS: null | pending | approved
  const [statusTeknisi, setStatusTeknisi] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 🔥 REALTIME LISTENER (ANTI GAGAL)

  // 🔥 MENCEGAH TOMBOL BACK KEMBALI KE LOGIN
  useEffect(() => {
    const backAction = () => {
      showAlert({
        title: "Keluar Aplikasi",
        message: "Apakah Anda yakin ingin keluar dari aplikasi?",
        type: "warning",
        buttons: [
          { text: "Batal", style: "cancel" },
          { text: "Keluar", onPress: () => BackHandler.exitApp() }
        ]
      });
      return true; // Mencegah perilaku default (kembali ke layar sebelumnya)
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        console.log("❌ User belum login");
        setStatusTeknisi(null);
        setProfilePic(null);
        return;
      }

      console.log("🔥 UID:", user.uid);

      const techRef = doc(db, "technicians", user.uid);

      const unsubscribeSnap = onSnapshot(
        techRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const status = data.status || "pending";
            setStatusTeknisi(status);
            if (data.profilePictureUrl) {
              setProfilePic((prev) => prev || data.profilePictureUrl);
            }
          } else {
            setStatusTeknisi(null);
          }
        },
        (error) => {
          console.log("🔥 ERROR SNAPSHOT:", error);
        }
      );

      const userRef = doc(db, "users", user.uid);
      const unsubscribeUser = onSnapshot(
        userRef,
        (docSnap) => {
          if (docSnap.exists() && docSnap.data().profilePictureUrl) {
            setProfilePic(docSnap.data().profilePictureUrl);
          }
        },
        (error) => {
          console.log("🔥 ERROR USER SNAPSHOT:", error);
        }
      );

      return () => {
        unsubscribeSnap();
        unsubscribeUser();
      };
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLogout = () => {
    showAlert({
      title: "Konfirmasi Logout",
      message: "Apakah Anda yakin ingin keluar dari akun ini?",
      type: "warning",
      buttons: [
        { text: "Batal", style: "cancel" },
        {
          text: "Keluar",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace("/login" as any);
            } catch (e: any) {
              showAlert({ title: "Error", message: e.message, type: "error" });
            }
          }
        }
      ]
    });
  };

  const categories = [
    { name: "AC", image: require("../assets/images/ac.png") },
    { name: "Kulkas", image: require("../assets/images/freezer.png") },
    { name: "Elektronik", image: require("../assets/images/elektronik.png") },
    { name: "Semua", image: require("../assets/images/all.png") },
  ];

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.screenCard, { opacity: fadeAnim }]}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 50) }]}>
          <View>
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={Theme.colors.textMuted} />
            <TextInput placeholder="Cari layanan..." style={styles.searchInput} placeholderTextColor={Theme.colors.textMuted} value={searchQuery} onChangeText={setSearchQuery} />
          </View>

          <View style={{ position: "relative", zIndex: 9999 }}>
            <TouchableOpacity
              style={styles.profileIcon}
              onPress={() => setShowDropdown(!showDropdown)}
            >
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.profileImage} />
              ) : (
                <Ionicons name="person-outline" size={18} color={Theme.colors.primaryDark} />
              )}
            </TouchableOpacity>

            {showDropdown && (
              <View style={styles.dropdown}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowDropdown(false);
                    router.push({
                      pathname: "/profile-settings" as any,
                      params: { from: "Homepage" }
                    });
                  }}
                >
                  <Ionicons name="settings-outline" size={16} color={Theme.colors.text} style={{ marginRight: 8 }} />
                  <Text style={styles.dropdownText}>Pengaturan Akun</Text>
                </TouchableOpacity>
                <View style={styles.dropdownSeparator} />
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowDropdown(false);
                    handleLogout();
                  }}
                >
                  <Ionicons name="log-out-outline" size={16} color={Theme.colors.danger} style={{ marginRight: 8 }} />
                  <Text style={[styles.dropdownText, { color: Theme.colors.danger }]}>Keluar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* PROMO */}
          <View style={styles.promoCard}>
            <View style={styles.promoContent}>
              <View style={styles.promoBadgeContainer}>
                <Text style={styles.promoBadge}>PROMO SPESIAL</Text>
              </View>
              <Text style={styles.promoTitle}>
                Diskon 20% + Konsultasi Gratis!
              </Text>
              <Text style={styles.promoDesc}>
                Nikmati penawaran terbatas untuk layanan repair Anda.
              </Text>
              <AnimatedButton
                title="Ambil Penawaran"
                onPress={() => router.push("/ac-services" as any)}
                style={styles.promoButton}
                textStyle={{ fontSize: 12, paddingHorizontal: 12, paddingVertical: 4 }}
              />
            </View>
            <View style={styles.promoGraphic}>
              <Ionicons name="snow" size={60} color={Theme.colors.primaryDark} style={{ opacity: 0.8 }} />
              <View style={styles.promoCircle1} />
              <View style={styles.promoCircle2} />
            </View>
          </View>

          {/* KATEGORI */}
          <Text style={styles.sectionTitle}>Kategori Layanan</Text>
          <View style={styles.categoryRow}>
            {categories.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())).map((item, index) => {
              const isAC = item.name === "AC";
              const isSegera = !isAC;

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.categoryItem, isSegera && { opacity: 0.6 }]}
                  activeOpacity={0.7}
                  disabled={isSegera}
                  onPress={() => {
                    if (isAC) router.push("/ac-services" as any);
                  }}
                >
                  <View style={styles.categoryIcon}>
                    <Image source={item.image} style={styles.categoryImage} />
                  </View>

                  {isSegera && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Segera</Text>
                    </View>
                  )}

                  <Text style={styles.categoryText}>{item.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* TEKNISI */}
          <View style={styles.techCard}>
            <View style={styles.techIconContainer}>
              <Ionicons name="construct" size={24} color={Theme.colors.primary} />
            </View>
            <Text style={styles.techTitle}>
              Punya Keahlian Reparasi?
            </Text>
            <Text style={styles.techDesc}>
              Daftar jadi mitra teknisi dan tambah penghasilan Anda! Bergabung bersama ribuan mitra lainnya.
            </Text>

            <AnimatedButton
              title={
                statusTeknisi === null ? "Daftar Jadi Teknisi" :
                  statusTeknisi === "pending" ? "Cek Status Pendaftaran" :
                    "Menuju Halaman Teknisi"
              }
              onPress={() => {
                if (statusTeknisi === null) {
                  router.push("/register-technician" as any);
                } else if (statusTeknisi === "pending") {
                  router.push("/registration-status" as any);
                } else if (statusTeknisi === "approved") {
                  router.push("/home-tech" as any);
                }
              }}
              style={styles.techButton}
            />
          </View>
        </ScrollView>
      </Animated.View>

      {/* BOTTOM NAV - Glassmorphism style */}
      <View style={styles.bottomBarWrapper}>
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.navItemActive}>
            <Ionicons name="home" size={22} color={Theme.colors.primary} />
            <Text style={styles.navTextActive}>Beranda</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/history' as any)}>
            <Ionicons name="time-outline" size={22} color={Theme.colors.textMuted} />
            <Text style={styles.navText}>Riwayat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: Theme.colors.background },
  screenCard: { flex: 1, backgroundColor: Theme.colors.surface, overflow: "hidden" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.xl + 20, // safe area approximation
    paddingBottom: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    ...Theme.shadows.sm,
    zIndex: 10,
  },
  logo: { width: 90, height: 35 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.inputBg,
    borderRadius: Theme.radius.full,
    paddingHorizontal: Theme.spacing.md,
    flex: 1,
    marginHorizontal: Theme.spacing.md,
    height: 40,
  },
  searchInput: { flex: 1, fontSize: 13, marginLeft: 8, color: Theme.colors.text },
  profileIcon: {
    backgroundColor: Theme.colors.surfaceLight,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  profileImage: { width: 38, height: 38, borderRadius: 19 },

  promoCard: {
    flexDirection: "row",
    backgroundColor: Theme.colors.secondary,
    margin: Theme.spacing.lg,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.lg,
    alignItems: "center",
    ...Theme.shadows.sm,
    overflow: 'hidden'
  },
  promoContent: { flex: 1, zIndex: 2 },
  promoGraphic: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  promoCircle1: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.15)', top: -30, right: -40 },
  promoCircle2: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', bottom: 0, left: -20 },
  promoBadgeContainer: {
    backgroundColor: Theme.colors.primaryDark,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.radius.sm,
    marginBottom: 8,
  },
  promoBadge: { fontSize: 10, color: Theme.colors.surface, fontWeight: '700' },
  promoTitle: { ...Theme.typography.h3, color: Theme.colors.primaryDark, marginBottom: 4 },
  promoDesc: { ...Theme.typography.caption, color: Theme.colors.primaryDark, marginBottom: 12, opacity: 0.9 },
  promoButton: { height: 36, paddingHorizontal: 0, alignSelf: "flex-start" },

  sectionTitle: { ...Theme.typography.h3, marginHorizontal: Theme.spacing.lg, marginTop: Theme.spacing.sm, marginBottom: Theme.spacing.md },
  categoryRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: Theme.spacing.lg },
  categoryItem: { width: "23%", alignItems: "center" },
  categoryIcon: {
    width: 64,
    height: 64,
    backgroundColor: Theme.colors.inputBg,
    borderRadius: Theme.radius.md,
    justifyContent: "center",
    alignItems: "center",
    ...Theme.shadows.sm,
  },
  categoryImage: { width: 32, height: 32 },
  categoryText: { ...Theme.typography.caption, marginTop: 8, fontWeight: '600', color: Theme.colors.text },
  badge: { position: "absolute", top: -8, backgroundColor: Theme.colors.danger, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, ...Theme.shadows.sm },
  badgeText: { fontSize: 9, color: 'white', fontWeight: 'bold' },

  techCard: {
    backgroundColor: Theme.colors.surfaceLight,
    margin: Theme.spacing.lg,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    ...Theme.shadows.sm
  },
  techIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.secondary + '40', // 40 hex opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  techTitle: { ...Theme.typography.h3, color: Theme.colors.primaryDark, textAlign: 'center' },
  techDesc: { ...Theme.typography.body, color: Theme.colors.textMuted, marginVertical: Theme.spacing.sm, textAlign: 'center' },
  techButton: { width: '100%', marginTop: Theme.spacing.sm },

  bottomBarWrapper: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255, 255, 255, 0.95)", // Pseudo glassmorphism
    paddingVertical: 14,
    borderRadius: Theme.radius.xl,
    ...Theme.shadows.lg,
  },
  navItem: { alignItems: "center", flex: 1 },
  navItemActive: { alignItems: "center", flex: 1 },
  navText: { fontSize: 11, color: Theme.colors.textMuted, marginTop: 4, fontWeight: '500' },
  navTextActive: { fontSize: 11, color: Theme.colors.primary, fontWeight: "700", marginTop: 4 },

  dropdown: {
    position: "absolute",
    right: 0,
    top: 50,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.sm,
    width: 190,
    ...Theme.shadows.lg,
    zIndex: 10000,
    borderWidth: 1,
    borderColor: Theme.colors.border
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: Theme.radius.sm
  },
  dropdownText: {
    ...Theme.typography.body,
    fontWeight: "600"
  },
  dropdownSeparator: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: 4
  }
});

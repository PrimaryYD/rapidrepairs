import { Theme } from "../constants/theme";
import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Animated,
    Dimensions,
    ActivityIndicator,
    Alert
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../api";
import { setTempData } from "../utils/tempStorage";

const { width, height } = Dimensions.get("window");

export default function FaceVerification() {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<any>(null);
    
    const [step, setStep] = useState(0); // 0: straight, 1: left, 2: right
    const [capturing, setCapturing] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    
    const scanLineAnim = useRef(new Animated.Value(0)).current;
    
    const instructions = [
        "Lihat Lurus ke Depan",
        "Miringkan Wajah ke Kiri",
        "Miringkan Wajah ke Kanan"
    ];

    useEffect(() => {
        if (!permission) requestPermission();
        
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(scanLineAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, [permission]);

    const takePicture = async () => {
        if (!cameraRef.current || capturing) return;
        
        try {
            setCapturing(true);
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.3, // Reduced quality for faster processing
                base64: true,
            });
            
            const newImages = [...images, photo.base64];
            setImages(newImages);
            
            if (step < 2) {
                setStep(step + 1);
            } else {
                verifyIdentity(newImages);
            }
        } catch (err) {
            console.error("Capture error:", err);
            Alert.alert("Error", "Gagal mengambil gambar");
        } finally {
            setCapturing(false);
        }
    };

    const verifyIdentity = async (allImages: string[]) => {
        Alert.alert("Berhasil", "Foto wajah telah diambil!", [
            { 
                text: "Selesaikan Pendaftaran", 
                onPress: () => {
                    setIsFinalizing(true);
                    
                    // 🔥 Save to tempStorage instead of params to avoid URL length limits
                    setTempData("selfies", allImages);

                    // Small timeout to ensure modal shows up before heavy navigation/params processing
                    setTimeout(() => {
                        router.replace({
                            pathname: "/register-technician",
                            params: { 
                                ...params, 
                                step: "3", 
                                faceVerified: "true",
                                // selfies: JSON.stringify(allImages) // Removed
                            }
                        });
                    }, 500);
                }
            }
        ]);
    };

    if (!permission) return <View />;
    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text>Akses kamera diperlukan untuk verifikasi wajah.</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.btn}>
                    <Text style={{color: '#fff'}}>Berikan Izin</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Loading Overlay */}
            {isFinalizing && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#B3875E" />
                    <Text style={styles.loadingText}>Menyimpan data...</Text>
                </View>
            )}

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Foto Wajah (Manual)</Text>
            </View>

            <View style={styles.cameraContainer}>
                <CameraView 
                    ref={cameraRef}
                    style={styles.camera}
                    facing="front"
                />
                {/* Face Overlay - Moved outside CameraView to fix warning */}
                <View style={[StyleSheet.absoluteFill, styles.overlay]}>
                    <View style={styles.unfocused} />
                    <View style={styles.focusRow}>
                        <View style={styles.unfocused} />
                        <View style={styles.faceHole}>
                            {/* Corner Accents */}
                            <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 }]} />
                            <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 }]} />
                            <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 }]} />
                            <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 }]} />
                            
                            {/* Scan Line */}
                            <Animated.View 
                                style={[
                                    styles.scanLine, 
                                    { 
                                        transform: [{ 
                                            translateY: scanLineAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, 300]
                                            }) 
                                        }] 
                                    }
                                ]} 
                            />
                        </View>
                        <View style={styles.unfocused} />
                    </View>
                    <View style={styles.unfocused} />
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.instruction}>{instructions[step]}</Text>
                <Text style={styles.subInstruction}>
                    {verifying ? "Menganalisis wajah..." : "Pastikan wajah terlihat jelas dan berada di dalam bingkai"}
                </Text>

                <View style={styles.progressContainer}>
                    {[0, 1, 2].map((i) => (
                        <View 
                            key={i} 
                            style={[
                                styles.progressDot, 
                                step === i && styles.activeDot,
                                images.length > i && styles.completedDot
                            ]} 
                        />
                    ))}
                </View>

                {verifying ? (
                    <View style={styles.verifyingBox}>
                        <ActivityIndicator size="large" color="#B3875E" />
                        <Text style={styles.verifyingText}>Memverifikasi dengan KTP...</Text>
                    </View>
                ) : (
                    <TouchableOpacity 
                        style={[styles.captureBtn, capturing && { opacity: 0.7 }]} 
                        onPress={takePicture}
                        disabled={capturing}
                    >
                        {capturing ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Ionicons name="camera" size={32} color="#fff" />
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255,255,255,0.9)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        fontWeight: "600",
        color: Theme.colors.primary,
    },
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 20,
        backgroundColor: Theme.colors.surface,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        flex: 1,
        textAlign: "center",
        marginRight: 40,
    },
    cameraContainer: {
        flex: 1,
        overflow: "hidden",
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
    },
    unfocused: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
    },
    focusRow: {
        flexDirection: "row",
        height: 300,
    },
    faceHole: {
        width: 250,
        height: 300,
        borderRadius: 150,
        backgroundColor: "transparent",
        position: "relative",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
    },
    corner: {
        position: "absolute",
        width: 30,
        height: 30,
        borderColor: Theme.colors.primary,
    },
    scanLine: {
        height: 2,
        width: "100%",
        backgroundColor: Theme.colors.primary,
        shadowColor: "#B3875E",
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
    },
    footer: {
        backgroundColor: Theme.colors.surface,
        padding: 30,
        alignItems: "center",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    instruction: {
        fontSize: 20,
        fontWeight: "800",
        color: Theme.colors.text,
        marginBottom: 10,
    },
    subInstruction: {
        fontSize: 14,
        color: Theme.colors.textMuted,
        textAlign: "center",
        marginBottom: 25,
    },
    progressContainer: {
        flexDirection: "row",
        marginBottom: 30,
        gap: 10,
    },
    progressDot: {
        width: 40,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#E0E0E0",
    },
    activeDot: {
        backgroundColor: Theme.colors.primary,
    },
    completedDot: {
        backgroundColor: "#4CAF50",
    },
    captureBtn: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: Theme.colors.primary,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    verifyingBox: {
        alignItems: "center",
    },
    verifyingText: {
        marginTop: 10,
        color: Theme.colors.primary,
        fontWeight: "600",
    },
    btn: {
        backgroundColor: Theme.colors.primary,
        padding: 15,
        borderRadius: 10,
        marginTop: 20,
    }
});


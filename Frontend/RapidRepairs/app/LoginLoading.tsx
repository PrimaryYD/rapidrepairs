import { View, Text, Image, StyleSheet, Modal, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface LoginLoadingProps {
    visible: boolean;
}

export default function LoginLoading({ visible }: LoginLoadingProps) {
    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.container}>
                {/* Center R Logo */}
                <Image
                    source={require("../assets/Logo/1.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />

                {/* Loading Text */}
                <Text style={styles.title}>Mohon Tunggu</Text>
                <Text style={styles.subtitle}>Kami sedang memproses Anda masuk!</Text>

                {/* Optional: subtle activity indicator to match the 'processing' feel */}
                <ActivityIndicator
                    size="small"
                    color="white"
                    style={{ marginTop: 20 }}
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#6B4423", // Deep brown color from image
        justifyContent: "center",
        alignItems: "center",
    },
    logo: {
        width: 250,
        height: 250,
        marginBottom: 30,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "white",
        textAlign: "center",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: "white",
        textAlign: "center",
    },
});

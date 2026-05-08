import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function AllServices() {
    const router = useRouter();

    const services = [
        { name: "Kulkas", image: require("../assets/images/freezer.png") },
        { name: "AC", image: require("../assets/images/ac.png") },
        { name: "Mesin Cuci", image: require("../assets/images/washing.png") },
        { name: "Kipas Angin", image: require("../assets/images/fan.png") },
        { name: "Furniture", image: require("../assets/images/furnitur.png") },
        { name: "TV", image: require("../assets/images/tv.png") },
        { name: "Elektronik", image: require("../assets/images/elektronik.png") },
    ];

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View style={styles.wrapper}>
                    <View style={styles.phoneFrame}>
                        <ScrollView contentContainerStyle={styles.scrollContent}>

                            {/* BACK BUTTON */}
                            <TouchableOpacity onPress={() => router.back()}>
                                <Text style={styles.back}>←</Text>
                            </TouchableOpacity>

                            <Text style={styles.title}>All Services</Text>

                            <View style={styles.grid}>
                                {services.map((item, index) => {

                                    const isLastOdd =
                                        services.length % 3 === 1 &&
                                        index === services.length - 1;

                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.card,
                                                isLastOdd && styles.lastCardCenter
                                            ]}
                                            onPress={() => {
                                                if (item.name === "AC") {
                                                    router.push("/ac-services");
                                                }
                                            }}
                                        >
                                            <Image
                                                source={item.image}
                                                style={styles.serviceImage}
                                            />

                                            <Text style={styles.text}>
                                                {item.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                        </ScrollView>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },

    phoneFrame: {
        width: "100%",
        maxWidth: 420,
        height: "95%",
        backgroundColor: "#F4F1EA",
        borderWidth: 8,
        borderColor: "#E0D9CC",
        borderRadius: 30,
        overflow: "hidden",

        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 15,
    },

    scrollContent: {
        padding: 20,
    },

    back: {
        fontSize: 28,
    },

    title: {
        fontSize: 30,
        fontWeight: "bold",
        marginVertical: 20,
    },

    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        backgroundColor: "#E8E2DA",
        padding: 20,
        borderRadius: 25,
    },

    card: {
        width: "30%",
        backgroundColor: "#F4F1EA",
        padding: 15,
        borderRadius: 15,
        alignItems: "center",
        marginBottom: 15,
    },

    lastCardCenter: {
        marginLeft: "35%",
    },

    serviceImage: {
        width: 45,
        height: 45,
        resizeMode: "contain",
    },

    text: {
        marginTop: 5,
        fontSize: 12,
    },
});
import { View, Animated, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";

export default function Index() {
    const router = useRouter();

    const rOpacity = useRef(new Animated.Value(1)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;

    const scale = useRef(new Animated.Value(1.6)).current;
    const moveUp = useRef(new Animated.Value(0)).current;

    useEffect(() => {

        Animated.sequence([

            // Step 1: R shrink
            Animated.timing(scale, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),

            // Step 2: Smooth replace R -> full logo
            Animated.parallel([
                Animated.timing(rOpacity, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),

            // Step 3: Move full logo upward
            Animated.timing(moveUp, {
                toValue: -345, // High up to match Welcome page logo position
                duration: 900,
                useNativeDriver: true,
            }),

        ]).start(() => {
            router.replace("/welcome");
        });

    }, []);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "white", // Matching welcome page background
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >

                    {/* R LOGO */}
                    <Animated.Image
                        source={require("../assets/Logo/1.png")}
                        style={{
                            position: "absolute",
                            width: 140, // Match Welcome Page logo width
                            height: 140, // Match Welcome Page logo height
                            opacity: rOpacity,
                            transform: [
                                { scale: scale },
                                { translateY: moveUp }
                            ],
                        }}
                        resizeMode="contain"
                    />

                    {/* FULL RAPID REPAIR LOGO */}
                    <Animated.Image
                        source={require("../assets/Logo/2.png")}
                        style={{
                            width: 140, // Match Welcome Page logo width
                            height: 140, // Match Welcome Page logo height
                            opacity: logoOpacity,
                            transform: [{ translateY: moveUp }],
                        }}
                        resizeMode="contain"
                    />

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
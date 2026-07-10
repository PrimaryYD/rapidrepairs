import { WebView } from "react-native-webview";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, ActivityIndicator, Text } from "react-native";
import { useEffect, useState, useRef } from "react";
import { BASE_URL } from "../api";

export default function PaymentWebview() {

    const router = useRouter();
    const params = useLocalSearchParams();

    const url = Array.isArray(params.url) ? params.url[0] : params.url;
    const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
    const originalOrderId = Array.isArray(params.originalOrderId) ? params.originalOrderId[0] : params.originalOrderId;

    const [loading, setLoading] = useState(true);

    // 🔥 biar tidak double redirect
    const isRedirected = useRef(false);

    useEffect(() => {

        if (!orderId) return;

        let count = 0;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${BASE_URL}/check-status/${orderId}`, {
                    headers: {
                        "bypass-tunnel-reminder": "true"
                    }
                });
                const data = await res.json();

                const status = data.payment_status;

                console.log("STATUS:", status);

                // ✅ SUCCESS
                if (!isRedirected.current && (status === "settlement" || status === "capture")) {
                    isRedirected.current = true;

                    clearInterval(interval); // 🔥 INI WAJIB

                    console.log("STOP POLLING");
                    router.replace({
                        pathname: "/payment-success" as any,
                        params: { order_id: originalOrderId || orderId }
                    });
                }

                count++;

                if (count > 20) {
                    clearInterval(interval);
                }

            } catch (err) {
                console.log("ERROR:", err);
            }
        }, 3000);

        return () => clearInterval(interval);

    }, [orderId]);

    return (
        <View style={{ flex: 1 }}>

            {loading && (
                <View style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 10
                }}>
                    <ActivityIndicator size="large" />
                    <Text>Menunggu pembayaran...</Text>
                </View>
            )}

            <WebView
                source={{ uri: url }}

                onLoadEnd={() => setLoading(false)}

                // 🔥 DETECT REDIRECT (GOPAY)
                onNavigationStateChange={(navState) => {
                    console.log("URL:", navState.url);

                    if (
                        !isRedirected.current &&
                        (
                            navState.url.includes("loginapp://payment-success") || // 🔥 paling valid
                            navState.url.includes("transaction_status=settlement") ||
                            navState.url.includes("status_code=200")
                        )
                    ) {
                        console.log("✅ FINAL REDIRECT TERDETECT");
                        isRedirected.current = true;
                        router.replace({
                            pathname: "/payment-success" as any,
                            params: { order_id: originalOrderId || orderId }
                        });
                    }
                }}
            />

        </View>
    );
}

// Pilihan URL Backend untuk kemudahan pengembangan (pilih salah satu sesuai kebutuhan):
// 1. Menggunakan localtunnel (jika sedang aktif):
// export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://cute-garlics-retire.loca.lt";

// 2. Menggunakan Emulator Android (langsung tanpa localtunnel):
// export const BASE_URL = "http://10.0.2.2:3000";

// 3. Menggunakan HP Fisik di Wi-Fi yang sama (ganti dengan IP laptop Anda):
export const BASE_URL = "http://192.168.68.50:3000";

export const register = async (email, password) => {
    const res = await fetch(`${BASE_URL}/api/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "bypass-tunnel-reminder": "true",
        },
        body: JSON.stringify({ email, password }),
    });

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return res.json();
    }
    const text = await res.text();
    throw new Error(text || `HTTP Error ${res.status}`);
};

export const login = async (email, password) => {
    const res = await fetch(`${BASE_URL}/api/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "bypass-tunnel-reminder": "true",
        },
        body: JSON.stringify({ email, password }),
    });

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return res.json();
    }
    const text = await res.text();
    throw new Error(text || `HTTP Error ${res.status}`);
};
export const BASE_URL = "http://192.168.1.3:3000"; // ← your IP

export const register = async (email, password) => {
    const res = await fetch(`${BASE_URL}/api/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });

    return res.json();
};

export const login = async (email, password) => {
    const res = await fetch(`${BASE_URL}/api/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });

    return res.json();
};
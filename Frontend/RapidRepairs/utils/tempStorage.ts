// Temporary storage for large data during navigation to avoid URL param length limits
let storage: any = {};

export const setTempData = (key: string, value: any) => {
    storage[key] = value;
};

export const getTempData = (key: string) => {
    return storage[key];
};

export const clearTempData = (key: string) => {
    delete storage[key];
};

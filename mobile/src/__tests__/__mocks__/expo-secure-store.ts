const store: Record<string, string> = {};
export async function getItemAsync(key: string) { return store[key] ?? null; }
export async function setItemAsync(key: string, value: string) { store[key] = value; }
export async function deleteItemAsync(key: string) { delete store[key]; }

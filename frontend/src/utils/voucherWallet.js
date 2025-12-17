export const STORAGE_KEY = 'rovia_voucher_wallet';
export const FOUR_WEEKS_MS = 1000 * 60 * 60 * 24 * 28;

const readWalletStore = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeWalletStore = (store) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('Nu am putut salva voucherele', err);
  }
};

const cleanExpired = (entries) => {
  const now = Date.now();
  return Object.fromEntries(
    Object.entries(entries || {}).filter(([, entry]) => entry?.expiresAt > now)
  );
};

export const getWalletKey = (auth) => {
  if (!auth) return 'guest';
  if (auth.userId) return `user-${auth.userId}`;
  if (auth.username) return `user-${auth.username}`;
  return 'guest';
};

export const getActiveRedemptions = (walletKey) => {
  if (!walletKey) return {};
  const store = readWalletStore();
  const entries = store[walletKey] || {};
  const cleaned = cleanExpired(entries);
  if (Object.keys(cleaned).length !== Object.keys(entries).length) {
    store[walletKey] = cleaned;
    writeWalletStore(store);
  }
  return cleaned;
};

export const persistRedemptions = (walletKey, payload) => {
  if (!walletKey) return;
  const store = readWalletStore();
  store[walletKey] = payload;
  writeWalletStore(store);
};

export const calculateSpentPoints = (redemptions) => (
  Object.values(redemptions || {}).reduce((sum, entry) => sum + (entry.cost || 0), 0)
);

export const generateVoucherCode = (discount) => {
  const suffix = Math.random().toString(36).toUpperCase().slice(-6);
  return `RV-${discount}-${suffix}`;
};

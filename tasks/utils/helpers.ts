export const isProduction = () => process.env.NODE_ENV === "production";
export const getNetworkEnv = () => (isProduction() ? "mainnet" : "testnet");

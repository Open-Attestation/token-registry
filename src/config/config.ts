export const DOCUMENT_STORE_CREATOR_ROPSTEN = "0x4077534e82C97Be03A07FB10f5c853d2bC7161FB";
export const DOCUMENT_STORE_CREATOR_MAINNET = "0x0";
export const PROXY_FACTORY_ROPSTEN = "0xba2501bf20593f156879c17d38b6c245ca65de80";
export const PROXY_FACTORY_MAINNET = "0x0";
export const TITLE_ESCROW_CREATOR_ROPSTEN = "0xB0dE5E22bAc12820b6dbF6f63287B1ec44026c83";
export const TITLE_ESCROW_CREATOR_MAINET = "0x907A4D491A09D59Bcb5dC38eeb9d121ac47237F1";
export const TITLE_ESCROW_CREATOR_RINKEBY = "0xa51B8dAC076d5aC80507041146AC769542aAe195";

export const getTitleEscrowCreatorAddress = (networkId?: number) => {
  if (networkId === 3) return TITLE_ESCROW_CREATOR_ROPSTEN;
  if (networkId === 4) return TITLE_ESCROW_CREATOR_RINKEBY;
  return TITLE_ESCROW_CREATOR_MAINET;
};

export const getDocumentStoreCreatorAddress = (networkId?: number) => {
  if (networkId === 3) return DOCUMENT_STORE_CREATOR_ROPSTEN;
  return DOCUMENT_STORE_CREATOR_MAINNET;
};

export const getProxyFactoryAddress = (networkId?: number) => {
  if (networkId === 3) return PROXY_FACTORY_ROPSTEN;
  return PROXY_FACTORY_MAINNET;
};

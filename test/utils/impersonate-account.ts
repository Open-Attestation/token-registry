import { ethers, network } from "hardhat";
import { Signer } from "ethers";

/**
 * Impersonate an account as signer.
 * @param address Address of account to be impersonated
 * @param balance Balance in ethers
 */
export const impersonateAccount = async ({
  address,
  balance = 100,
}: {
  address: string;
  balance?: number;
}): Promise<Signer> => {
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address],
  });
  const hexBalance = ethers.utils.parseEther(String(balance)).toHexString();
  await network.provider.send("hardhat_setBalance", [address, ethers.utils.hexStripZeros(hexBalance)]);
  return ethers.provider.getSigner(address);
};

export const stopImpersonatingAccount = async ({ address }: { address: string }) => {
  await network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [address],
  });
};

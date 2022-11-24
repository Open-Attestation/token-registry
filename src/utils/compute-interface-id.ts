import { ethers } from "ethers";

const { utils } = ethers;

export const computeInterfaceId = (functionSignatures: string[] = []) => {
  const INTERFACE_ID_LENGTH = 4;

  const interfaceIdBuffer = functionSignatures
    .map((signature) => utils.id(signature))
    .map(
      (h) => Buffer.from(h.substring(2), "hex").slice(0, 4) // bytes4()
    )
    .reduce((memo, bytes) => {
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < INTERFACE_ID_LENGTH; i++) {
        // eslint-disable-next-line no-param-reassign,operator-assignment,no-bitwise
        memo[i] = memo[i] ^ bytes[i]; // xor
      }
      return memo;
    }, Buffer.alloc(INTERFACE_ID_LENGTH));

  return `0x${interfaceIdBuffer.toString("hex")}`;
};

import { ContractReceipt, ethers } from "ethers";
import { TypedEvent } from "@typechain/ethers-v5/static/common";

export const getEventFromReceipt = <T extends TypedEvent<any>>(
  receipt: ContractReceipt,
  topic: string,
  iface?: ethers.utils.Interface
) => {
  if (!receipt.events) throw new Error("Events object is undefined");
  const event = receipt.events.find((evt) => evt.topics[0] === topic);
  if (!event) throw new Error(`Cannot find topic ${topic}`);

  if (iface) return iface.parseLog(event) as unknown as T;
  return event as T;
};

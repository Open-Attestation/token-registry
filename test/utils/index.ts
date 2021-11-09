import { ethers } from "hardhat";
import { ContractTransaction } from "ethers";
import { TestUsers } from "../fixtures/deploy-token.fixture";

export const getEventFromTransaction = async (tx: ContractTransaction, abi: string[], eventName: string) => {
  const iface = new ethers.utils.Interface(abi);
  const receipt = await tx.wait();
  const eventTopic = iface.getEventTopic(eventName);

  if (!receipt.events) throw new Error("Events object is undefined");
  const event = receipt.events.find((evt) => evt.topics[0] === eventTopic);

  if (!event) throw new Error(`Cannot find event ${eventName}`);

  return iface.parseLog(event).args;
};

export const getTestUsers = async () => {
  const [carrier, beneficiary, holder, ...others] = await ethers.getSigners();
  const users: TestUsers = { carrier, beneficiary, holder, others };
  return users;
};

export { impersonateAccount, stopImpersonatingAccount } from "./impersonate-account";

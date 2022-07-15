/* eslint-disable import/no-extraneous-dependencies */
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { solidity } from "ethereum-waffle";
import { smock } from "@defi-wonderland/smock";

export const { expect, assert } = chai
  .use(chaiAsPromised) //
  .use(solidity)
  .use(smock.matchers);

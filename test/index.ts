/* eslint-disable import/no-extraneous-dependencies */
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { solidity } from "ethereum-waffle";

export const { expect } = chai
  .use(chaiAsPromised) //
  .use(solidity);

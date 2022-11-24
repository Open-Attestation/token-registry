/* eslint-disable import/no-extraneous-dependencies */
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { smock } from "@defi-wonderland/smock";

export const { expect, assert } = chai
  .use(chaiAsPromised) //
  .use(smock.matchers);

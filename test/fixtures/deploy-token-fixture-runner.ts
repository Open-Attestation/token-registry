import { TitleEscrowFactory, TradeTrustToken } from "@tradetrust/contracts";

export type DeployTokenFixtureRunner<T = TradeTrustToken> = () => Promise<[TitleEscrowFactory, T]>;

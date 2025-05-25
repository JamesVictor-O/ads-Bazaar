// import { createConfig, http, injected } from "wagmi";
// import { celoAlfajores } from "wagmi/chains";
// import { farcasterFrame as miniAppConnector } from "@farcaster/frame-wagmi-connector";
// import { alfajores } from "./chain";

// const farcasterConnector = miniAppConnector();

// export const wagmiConfig = createConfig({
//   chains: [alfajores],
//   connectors: [miniAppConnector(), injected()],
//   transports: {
//     [celoAlfajores.id]: http("https://alfajores-forno.celo-testnet.org"),
//   },
// });


// import { createConfig, http, injected } from "wagmi";
// import { celoAlfajores } from "wagmi/chains";
// import { farcasterFrame } from "@farcaster/frame-wagmi-connector";

// export const wagmiConfig = createConfig({
//   chains: [celoAlfajores],
//   connectors: [farcasterFrame(), injected()],
//   transports: {
//     [celoAlfajores.id]: http(
//       process.env.NEXT_PUBLIC_CELO_RPC_URL || "https://alfajores-forno.celo-testnet.org"
//     ),
//   },
// });

import { createConfig, http, injected } from "wagmi";
import { celoAlfajores } from "wagmi/chains";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";

export const wagmiConfig = createConfig({
  chains: [celoAlfajores],
  connectors: [
    farcasterFrame(),
    injected(),
  ],
  transports: {
    [celoAlfajores.id]: http("https://alfajores-forno.celo-testnet.org"),
  },
});
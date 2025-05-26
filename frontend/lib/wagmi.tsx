// import { createConfig, http, injected } from "wagmi";
// import { celo } from "wagmi/chains";
// import { farcasterFrame as miniAppConnector } from "@farcaster/frame-wagmi-connector";
// import { alfajores } from "./chain";

// const farcasterConnector = miniAppConnector();

// export const wagmiConfig = createConfig({
//   chains: [alfajores],
//   connectors: [miniAppConnector(), injected()],
//   transports: {
//     [celo.id]: http("https://alfajores-forno.celo-testnet.org"),
//   },
// });

// import { createConfig, http, injected } from "wagmi";
// import { celo } from "wagmi/chains";
// import { farcasterFrame } from "@farcaster/frame-wagmi-connector";

// export const wagmiConfig = createConfig({
//   chains: [celo],
//   connectors: [farcasterFrame(), injected()],
//   transports: {
//     [celo.id]: http(
//       process.env.NEXT_PUBLIC_CELO_RPC_URL || "https://alfajores-forno.celo-testnet.org"
//     ),
//   },
// });

import { createConfig, http, injected } from "wagmi";
import { celo } from "wagmi/chains";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";

export const wagmiConfig = createConfig({
  chains: [celo],
  connectors: [farcasterFrame(), injected()],
  transports: {
    [celo.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
  },
});

import { NextApiRequest, NextApiResponse } from "next";
import { getUserIdentifier } from "@selfxyz/core";
import { ethers } from "ethers";
import AdsBazaarABI from "@/lib/AdsBazaar.json";
import { CONTRACT_ADDRESS } from "@/lib/contracts";
import { CIRCUIT_CONSTANTS } from "@/lib/circuit";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { proof, publicSignals } = req.body;

      // Basic validation
      if (!proof || !publicSignals) {
        return res
          .status(400)
          .json({ error: "Missing proof or publicSignals" });
      }

      // Validate public signals length
      if (publicSignals.length !== CIRCUIT_CONSTANTS.REQUIRED_PUBLIC_SIGNALS) {
        return res.status(400).json({
          error: `Invalid public signals length. Expected ${CIRCUIT_CONSTANTS.REQUIRED_PUBLIC_SIGNALS}, got ${publicSignals.length}`,
        });
      }

      // Extract nullifier and user address
      const nullifier = publicSignals[CIRCUIT_CONSTANTS.NULLIFIER_INDEX];
      const address = await getUserIdentifier(publicSignals);

      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        AdsBazaarABI.abi,
        signer
      );

      // Check nullifier status
      const isNullifierUsed = await contract._nullifiers(nullifier);
      if (isNullifierUsed) {
        return res.status(400).json({
          error: "This proof has already been used",
          code: "PROOF_ALREADY_USED",
        });
      }

      // Format proof for contract
      const formattedProof = {
        a: proof.a,
        b: [
          [proof.b[0][1], proof.b[0][0]],
          [proof.b[1][1], proof.b[1][0]],
        ],
        c: proof.c,
        pubSignals: publicSignals,
      };

      // Submit verification
      const tx = await contract.verifySelfProof(formattedProof);
      const receipt = await tx.wait();

      return res.status(200).json({
        success: true,
        verifiedAddress: address,
        txHash: receipt.transactionHash,
        nullifier: nullifier,
      });
    } catch (error) {
      console.error("Verification error:", error);

      // Handle specific contract errors
      let errorMessage = "Verification failed";
      if (error instanceof Error) {
        if (error.message.includes("RegisteredNullifier")) {
          errorMessage = "Proof already used";
        } else if (error.message.includes("InvalidScope")) {
          errorMessage = "Invalid verification scope";
        }
      }

      return res.status(500).json({
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
  return res.status(405).end();
}

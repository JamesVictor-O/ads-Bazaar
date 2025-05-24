import  { AuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createAppClient, viemConnector } from "@farcaster/auth-client";

// Extend the default Session and User types
declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      name?: string;
      image?: string;
      fid: string;
      userType: string;
      walletAddress: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name?: string;
    image?: string;
    fid: string;
    userType: string;
    walletAddress: string;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      id: "farcaster",
      name: "Farcaster",
      credentials: {
        message: { label: "Message", type: "text" },
        signature: { label: "Signature", type: "text" },
        name: { label: "Name", type: "text" },
        pfp: { label: "Profile Picture", type: "text" },
        fid: { label: "FID", type: "text" },
        userType: { label: "User Type", type: "text" },
        csrfToken: { label: "CSRF Token", type: "text" },
      },
      async authorize(credentials) {
        const appClient = createAppClient({
          ethereum: viemConnector(),
        });

        try {
          const { message, signature, name, pfp, userType, csrfToken } = credentials || {};

          if (!message || !signature) {
            throw new Error("Missing required credentials");
          }

          // Verify Farcaster signature
          const verification = await appClient.verifySignInMessage({
            message,
            signature: signature as `0x${string}`,
            domain: process.env.NEXT_PUBLIC_APP_DOMAIN || process.env.NEXT_PUBLIC_DOMAIN || "localhost:3000",
            nonce: csrfToken || "",
          });

          if (!verification.success || !verification.fid) {
            throw new Error("Farcaster verification failed");
          }

          const userFid = verification.fid.toString();
          const userName = name || `Farcaster User ${userFid}`;

          console.log("Farcaster auth successful:", {
            fid: userFid,
            name: userName,
            image: pfp,
            userType,
          });

          return {
            id: userFid,
            name: userName,
            image: pfp || "",
            fid: userFid,
            userType: userType || "user",
            walletAddress: verification.data?.address || "",
          };
        } catch (error) {
          console.error("Farcaster auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.image = user.image;
        token.fid = user.fid;
        token.userType = user.userType;
        token.walletAddress = user.walletAddress;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
        session.user.fid = token.fid as string;
        session.user.userType = token.userType as string;
        session.user.walletAddress = token.walletAddress as string;
      }
      return session;
    },
    redirect({ url, baseUrl }) {
      if (url === "/" || url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
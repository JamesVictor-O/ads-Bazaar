import NextAuth from "next-auth";
import { createAppClient, viemConnector } from "@farcaster/auth-client";
import CredentialsProvider from "next-auth/providers/credentials";



export const authOptions = {
  providers: [
    {
      id: "farcaster",
      name: "Farcaster",
      type: "credentials",
      credentials: {
        message: { type: "text" },
        signature: { type: "text" },
        name: { type: "text" },
        pfp: { type: "text" },
      },
      async authorize(credentials) {
        const appClient = createAppClient({
          ethereum: viemConnector(),
        });
        const { success, fid } = await appClient.verifySignInMessage({
          message: credentials?.message as string,
          signature: credentials?.signature as `0x${string}`,
          domain: process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000",
          nonce: credentials?.csrfToken,
        });
        if (success && fid) {
          console.log("Farcaster auth successful:", {
            fid,
            name: credentials?.name,
            image: credentials?.pfp
          });
          
          return { 
            id: fid.toString(), 
            name: credentials?.name || `Farcaster User ${fid}`, 
            image: credentials?.pfp 
          };
        }
        return null;
      },
    },
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // When signing in, copy user data to token
        token.id = user.id;
        token.name = user.name || `User ${user.id}`;
        token.image = user.image;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
      }
      return session;
    },
    redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      // Default to dashboard after successful sign-in if no callback specified
      return `/influencersDashboard`;
    },
  },
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};


export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "Farcaster",
      credentials: {
        message: { label: "Message", type: "text" },
        signature: { label: "Signature", type: "text" },
        name: { label: "Name", type: "text" },
        pfp: { label: "Profile Picture", type: "text" },
        userType: { label: "User Type", type: "text" }, // From GetStartedModal
      },
      async authorize(credentials) {
        const client = createAppClient({
          ethereum: viemConnector(),
        });

        try {
          const { message, signature, name, pfp, userType } = credentials || {};
          if (!message || !signature || !userType) {
            throw new Error("Missing required credentials");
          }

          // Verify Farcaster signature
          const verification = await client.verifySignInMessage({
            message,
            signature: signature as `0x${string}`,
            domain: process.env.NEXT_PUBLIC_DOMAIN || "localhost:3000",
            nonce: await client.fetchNonce(),
          });

          if (!verification.success) {
            throw new Error("Farcaster verification failed");
          }

          // Return user object for session
          return {
            id: verification.fid.toString(),
            name: name || "Anonymous",
            pfp: pfp || "",
            userType,
            walletAddress: verification.address, // Farcaster-verified address
          };
        } catch (error) {
          console.error("Farcaster auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.userType = user.userType;
      session.user.walletAddress = user.walletAddress;
      session.user.fid = user.id; // Farcaster FID
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.userType = user.userType;
        token.walletAddress = user.walletAddress;
        token.fid = user.id;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

// Create the handler for API routes
const handler = NextAuth(authOptions);

// Export the handler as GET and POST
export { handler as GET, handler as POST };
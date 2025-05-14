import NextAuth from "next-auth";
import { createAppClient, viemConnector } from "@farcaster/auth-client";

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

// Create the handler for API routes
const handler = NextAuth(authOptions);

// Export the handler as GET and POST
export { handler as GET, handler as POST };
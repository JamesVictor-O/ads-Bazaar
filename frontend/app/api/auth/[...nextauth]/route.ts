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
        fid: { type: "text" }, // Add FID to credentials
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
          // Use the verified FID from the auth process
          const userFid = fid.toString();
          
          // Use provided name or generate one with FID
          const userName = credentials?.name || `Farcaster User ${userFid}`;
          
          console.log("Farcaster auth successful:", {
            fid: userFid,
            name: userName,
            image: credentials?.pfp
          });
          
          return { 
            id: userFid, 
            name: userName,
            image: credentials?.pfp,
            fid: userFid, // Include FID in the user object
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
        token.name = user.name;
        token.image = user.image;
        token.fid = user.fid; // Add FID to token
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
        // Add FID to session user object if needed
        session.user.fid = token.fid as string;
      }
      return session;
    },
    redirect({ url, baseUrl }) {
      // Always allow the current page as the callback URL
      if (url === "/" || url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      // Default to homepage if no valid callback specified
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

// Create the handler for API routes
const handler = NextAuth(authOptions);

// Export the handler as GET and POST
export { handler as GET, handler as POST };
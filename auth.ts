import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { getPrismaClient, hasDatabaseConfig } from "@/lib/prisma";

const usePrismaAdapter = hasDatabaseConfig();

export const authOptions: NextAuthOptions = {
  ...(usePrismaAdapter ? { adapter: PrismaAdapter(getPrismaClient()) } : {}),
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {},
      async authorize() {
        return null;
      },
    }),
  ],
};

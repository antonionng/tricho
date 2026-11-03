import { type DefaultSession } from "next-auth";
import { AccountType, StaffRole, UserRole } from "@prisma/client";

export type ExtendedUser = DefaultSession["user"] & {
  id: string;
  role: UserRole;
  staffRole?: StaffRole | null;
  accountType?: AccountType;
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    staffRole?: StaffRole | null;
    accountType?: AccountType;
  }
}

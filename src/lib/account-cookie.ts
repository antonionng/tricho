/**
 * Set by the consumer sign-up page just before it sends someone to Google, so the new
 * account is created as a consumer. Read once when the account is created, then deleted.
 */
export const ACCOUNT_TYPE_COOKIE = "tc_account_type";

export const accountTypeCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 30,
};

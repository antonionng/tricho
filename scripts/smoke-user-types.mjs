/**
 * Local smoke test: signs in as each seeded test account (dev login, localhost only)
 * and checks what each user type can reach.  node scripts/smoke-user-types.mjs [baseUrl]
 */
const BASE = process.argv[2] || "http://localhost:3300";
if (!/^http:\/\/localhost(:\d+)?$/.test(BASE)) throw new Error("Local only");

async function signIn(email) {
  const jar = new Map();
  const save = (res) => {
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      jar.set(pair.slice(0, i), pair.slice(i + 1));
    }
  };
  const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  save(csrfRes);
  const { csrfToken } = await csrfRes.json();
  const res = await fetch(`${BASE}/api/auth/callback/dev`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: cookie() },
    body: new URLSearchParams({ csrfToken, email, name: "", passcode: "", callbackUrl: `${BASE}/members` }),
  });
  save(res);
  const get = async (path) => {
    const r = await fetch(`${BASE}${path}`, { headers: { cookie: cookie() }, redirect: "manual" });
    return { status: r.status, location: r.headers.get("location"), text: r.status === 200 ? await r.text() : "" };
  };
  return { get };
}

const has = (t, s) => t.includes(s);
const CASES = [
  { who: "free (in trial)", email: "free.sample@example.test", checks: [
    ["/members", (r) => has(r.text, "Your free account is ready") && has(r.text, "Your full profile is live")],
    ["/members/community", (r) => has(r.text, "Members only") || has(r.text, "membership")],
    ["/members/profile", (r) => r.status === 200 && has(r.text, 'id="listing"')],
    ["/studio", (r) => has(r.text, "Studio is for the Trichollective team")],
  ]},
  { who: "free (trial ended)", email: "lapsed.sample@example.test", checks: [
    ["/members", (r) => has(r.text, "contacted you through the directory")],
    ["/members/profile", (r) => r.status === 200 && !has(r.text, 'id="listing"')],
  ]},
  { who: "community", email: "ciara.sample@example.test", checks: [
    ["/members", (r) => r.status === 200 && !has(r.text, "Your free account is ready")],
    ["/members/community?space=case-room", (r) => r.status === 200 && (has(r.text, "Professional") )],
    ["/members/assistant", (r) => r.status === 200 && has(r.text, "Professional")],
    ["/studio", (r) => has(r.text, "Studio is for the Trichollective team")],
  ]},
  { who: "professional", email: "aoife.sample@example.test", checks: [
    ["/members", (r) => r.status === 200 && !has(r.text, "Your free account is ready")],
    ["/members/profile", (r) => has(r.text, 'id="listing"')],
    ["/studio", (r) => has(r.text, "Studio is for the Trichollective team")],
  ]},
  { who: "business", email: "business.sample@example.test", checks: [
    ["/members", (r) => r.status === 200 && !has(r.text, "Your free account is ready")],
  ]},
  { who: "admin", email: "karley@example.test", checks: [
    ["/studio", (r) => r.status === 200 && !has(r.text, "Studio is for the Trichollective team")],
    ["/studio/invite", (r) => r.status === 200],
    ["/studio/partners", (r) => r.status === 200],
  ]},
];

let failed = 0;
for (const c of CASES) {
  const s = await signIn(c.email);
  for (const [path, ok] of c.checks) {
    const r = await s.get(path);
    const pass = ok(r);
    if (!pass) failed++;
    console.log(`${pass ? "PASS" : "FAIL"}  ${c.who.padEnd(20)} ${path}  (${r.status}${r.location ? " -> " + r.location : ""})`);
  }
}
const anon = await (await fetch(`${BASE}/members`, { redirect: "manual" })).headers.get("location");
console.log(`${anon?.includes("/login") ? "PASS" : "FAIL"}  signed out           /members -> ${anon}`);
process.exit(failed ? 1 : 0);

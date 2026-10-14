import { prisma } from "@/lib/prisma";
import { getStaff } from "@/lib/staff";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  // Quote everything, and stop a spreadsheet reading a cell as a formula.
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};
const pounds = (pence: number | null) => (pence == null ? "" : (pence / 100).toFixed(2));

/** Every course sale with its split, fees and refunds, for the accounts. */
export async function GET() {
  const staff = await getStaff();
  if (!staff?.perms.has("courses.review")) return new Response("Not found", { status: 404 });
  const sales = await prisma.courseSale.findMany({ orderBy: { createdAt: "asc" }, include: { educator: { select: { displayName: true } } } });
  const head = ["Date", "Course", "Educator", "Price", "Paid by learner", "Educator share %", "Educator amount", "Trichollective amount", "Stripe fee", "Refunded", "Educator share taken back", "Status", "Payment", "Transfer"];
  const rows = sales.map((x) => [
    x.createdAt.toISOString().slice(0, 10),
    x.courseSlug,
    x.educator?.displayName ?? "Trichollective",
    x.priceType,
    pounds(x.gross),
    x.sharePct,
    pounds(x.educatorAmount),
    pounds(x.platformAmount),
    pounds(x.stripeFee),
    pounds(x.refundedAmount),
    pounds(x.reversedAmount),
    x.status,
    x.stripePaymentIntentId,
    x.stripeTransferId,
  ]);
  const csv = [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="course-sales-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}

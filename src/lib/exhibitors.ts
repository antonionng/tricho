import { prisma } from "@/lib/prisma";
import { kindOf } from "@/lib/packages";

/**
 * Exhibitors for Studio: every package that has been paid for (or refunded),
 * with what the company has sent us so far and how many of its places are
 * named. Shared by the Exhibitors tab and its booklet CSV.
 */

export type ExhibitorRow = {
  id: string;
  ticketId: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string | null;
  invoiceAddress: string;
  vatNumber: string | null;
  manageCode: string;
  logoUrl: string | null;
  bookletBlurb: string | null;
  standNumber: string | null;
  stageSlotAt: Date | null;
  notes: string | null;
  packageName: string;
  includesStand: boolean;
  includesStageSlot: boolean;
  status: "paid" | "refunded";
  /** What the package and any extra places cost, in pence. */
  paidPence: number;
  places: number;
  named: number;
  extraPlaces: number;
  paidAt: Date | null;
};

export async function loadExhibitors(eventId: string): Promise<ExhibitorRow[]> {
  const rows = await prisma.eventExhibitor.findMany({
    where: { eventId, ticket: { status: { in: ["paid", "refunded"] } } },
    orderBy: { createdAt: "asc" },
    include: {
      ticket: {
        select: {
          id: true,
          status: true,
          amount: true,
          paidAt: true,
          ticketType: { select: { name: true, kind: true, includesStand: true, includesStageSlot: true, sortOrder: true } },
          attendees: { where: { cancelledAt: null }, select: { awaitingName: true } },
          extras: {
            where: { status: "paid" },
            select: { amount: true, quantity: true, attendees: { where: { cancelledAt: null }, select: { id: true } } },
          },
        },
      },
    },
  });
  return rows
    .filter((r) => kindOf(r.ticket.ticketType) === "package")
    .map((r) => {
      const extraPlaces = r.ticket.extras.reduce((n, x) => n + x.attendees.length, 0);
      return {
        id: r.id,
        ticketId: r.ticketId,
        companyName: r.companyName,
        contactName: r.contactName,
        contactEmail: r.contactEmail,
        contactPhone: r.contactPhone,
        website: r.website,
        invoiceAddress: r.invoiceAddress,
        vatNumber: r.vatNumber,
        manageCode: r.manageCode,
        logoUrl: r.logoUrl,
        bookletBlurb: r.bookletBlurb,
        standNumber: r.standNumber,
        stageSlotAt: r.stageSlotAt,
        notes: r.notes,
        packageName: r.ticket.ticketType?.name ?? "Package",
        includesStand: !!r.ticket.ticketType?.includesStand,
        includesStageSlot: !!r.ticket.ticketType?.includesStageSlot,
        status: (r.ticket.status === "refunded" ? "refunded" : "paid") as ExhibitorRow["status"],
        paidPence: r.ticket.amount + r.ticket.extras.reduce((n, x) => n + x.amount, 0),
        places: r.ticket.attendees.length,
        named: r.ticket.attendees.filter((a) => !a.awaitingName).length,
        extraPlaces,
        paidAt: r.ticket.paidAt,
        sortOrder: r.ticket.ticketType?.sortOrder ?? 0,
      };
    })
    .sort((a, b) => b.sortOrder - a.sortOrder || a.companyName.localeCompare(b.companyName))
    .map((row) => {
      const { sortOrder, ...rest } = row;
      void sortOrder;
      return rest;
    });
}

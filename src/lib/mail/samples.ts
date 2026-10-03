import type { EmailSample } from "./catalogue";
import { samples as leads } from "./templates/leads";
import { samples as directory } from "./templates/directory";
import { samples as billing } from "./templates/billing";
import { samples as referrals } from "./templates/referrals";
import { samples as members } from "./templates/members";
import { samples as tickets } from "./templates/tickets";
import { samples as releases } from "./templates/releases";
import { samples as owners } from "./templates/owners";

/** Every email the platform sends, grouped the way the Studio shows them. */
const people = (list: EmailSample[]) => list.filter((s) => s.audience !== "owners");
const alerts = [leads, directory, billing, members, tickets, releases, owners].flat().filter((s) => s.audience === "owners");

export const emailGroups: { title: string; intro: string; samples: EmailSample[] }[] = [
  { title: "Sign-in, sign-ups and enquiries", intro: "Sent the moment someone signs in, joins the list, contacts you or applies to partner.", samples: people(leads) },
  { title: "Directory", intro: "Sent to practitioners as their listing is checked, goes live and receives enquiries.", samples: people(directory) },
  { title: "Membership and payments", intro: "Sent when someone pays, when a payment fails and when a membership ends.", samples: people(billing) },
  { title: "Invite colleagues", intro: "Sent to a member when a colleague who joined with their code makes a first payment and earns them a free month.", samples: people(referrals) },
  { title: "Members", intro: "Sent to members about replies, messages and the events they have booked.", samples: people(members) },
  { title: "Event tickets", intro: "Sent to anyone who buys a ticket for an event on Trichollective, member or guest.", samples: people(tickets) },
  { title: "New releases", intro: "Sent to members and subscribers when Karley approves an announcement in the inbox.", samples: people(releases) },
  { title: "Owner alerts", intro: "Sent to the owners so no lead, payment or report is missed.", samples: alerts },
];

export function sampleById(id: string) {
  for (const g of emailGroups) {
    const s = g.samples.find((x) => x.id === id);
    if (s) return s;
  }
  return null;
}

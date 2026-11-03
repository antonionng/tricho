"use server";

import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { alertOwners, deliver } from "@/lib/mail/send";
import { courseBuildEnquiryAcknowledgementEmail, courseBuildEnquiryAlert, type CourseBuildEnquiry } from "@/lib/mail/templates/leads";
import { shortName } from "@/lib/names";

export type CourseBuildEnquiryState =
  | { ok: true; message: string }
  | { ok: false; message: string; fields?: Record<string, string> }
  | null;

function field(formData: FormData, name: string, max: number) {
  return String(formData.get(name) ?? "").trim().slice(0, max);
}

/**
 * The course-build enquiry on /educators, for people who aren't Educators yet.
 * Filed in the Studio inbox like a contact message; the owners are alerted and
 * the sender gets an acknowledgement.
 */
export async function sendCourseBuildEnquiry(_prev: CourseBuildEnquiryState, formData: FormData): Promise<CourseBuildEnquiryState> {
  // Honeypot: real people never fill this in.
  if (field(formData, "company_site", 200)) return { ok: true, message: "Thank you. We'll be in touch." };

  const name = field(formData, "name", 120);
  const email = field(formData, "email", 160).toLowerCase();
  const topic = field(formData, "topic", 2000);
  const material = field(formData, "material", 1000);
  const fields = { name, email, topic, material };

  if (!name) return { ok: false, message: "Please tell us your name.", fields };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Please check your email address.", fields };
  if (topic.length < 10) return { ok: false, message: "Please tell us in a sentence or two what the course would teach.", fields };

  const enquiry: CourseBuildEnquiry = { name, email, topic, material: material || undefined };
  let draftId: string;
  try {
    const draft = await prisma.draft.create({
      data: {
        agent: "website",
        kind: "course_build_enquiry",
        title: `Course build enquiry: ${name}`,
        summary: `${name} · ${email}`,
        body: material ? `${topic}\n\nWhat they have already: ${material}` : topic,
        payload: { name, email, topic, material },
      },
      select: { id: true },
    });
    draftId = draft.id;
  } catch (error) {
    console.error("[COURSE_BUILD_ENQUIRY]", error);
    return { ok: false, message: "Something went wrong sending your enquiry. Please try again in a moment.", fields };
  }

  after(async () => {
    const { subject, content } = courseBuildEnquiryAcknowledgementEmail(enquiry);
    await Promise.all([alertOwners(courseBuildEnquiryAlert(enquiry, draftId)), deliver(email, subject, content, { tag: "course-build-enquiry" })]);
  });

  return {
    ok: true,
    message: `Thank you, ${shortName(name, "you")}. Your enquiry has reached the team, and we'll reply within three working days. A copy is on its way to your inbox.`,
  };
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Pill } from "@/components/site/primitives";
import { CourseBuilder } from "@/components/courses/builder/CourseBuilder";
import { longDate } from "@/components/members/format";
import { loadBuilderCourse } from "@/lib/course-builder";
import { coverImages, draftImageUrls } from "@/lib/course-builder-assets";
import { submitCoursesBlocker } from "@/lib/educator-rules";
import { requireEducator, ownedCourse } from "../../_data";
import { saveEducatorDraftAction, submitEducatorCourseAction, uploadEducatorFileAction } from "../../actions";

export const metadata = { title: "Course builder" };

export default async function EducatorCourseBuilderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string; tone?: string }> }) {
  const { id } = await params;
  const { notice, tone } = await searchParams;
  const { profile } = await requireEducator(`/members/educator/courses/${id}`);
  if (!profile) redirect("/educators");
  if (!(await ownedCourse(id, profile.id))) notFound();
  const course = await loadBuilderCourse(id);
  if (!course) notFound();

  const blocker = submitCoursesBlocker(profile);
  const canEdit = profile.status !== "rejected" && profile.status !== "suspended";
  const imageUrls = await draftImageUrls(course.content);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-10">
      <nav className="mb-4 text-[14px] text-muted-foreground">
        <Link href="/members/educator" className="hover:text-ink">
          Educator
        </Link>{" "}
        / <span className="text-ink">{course.meta.title}</span>
      </nav>
      {notice && (
        <p role="status" className={tone === "danger" ? "mb-4 rounded-2xl bg-destructive/5 px-5 py-4 text-[15px] text-destructive" : "mb-4 rounded-2xl bg-positive/10 px-5 py-4 text-[15px]"}>
          {notice}
        </p>
      )}

      <div className="mb-6 flex flex-col gap-2 rounded-2xl border border-rule bg-card p-5">
        <div className="flex flex-wrap gap-1.5">
          {course.status === "published" && <Pill tone="positive">On sale</Pill>}
          {course.status === "unlisted" && <Pill>Off sale</Pill>}
          {course.pending && <Pill tone="ink">Version {course.pending.number} is with the team for review</Pill>}
          {!course.published && !course.pending && <Pill>Draft</Pill>}
        </div>
        <p className="text-[15px] text-ink-2">
          {course.published
            ? `Learners see version ${course.published.number}, approved ${course.published.reviewedAt ? longDate(course.published.reviewedAt) : ""}. Edits stay in your draft until you send a new version and it's approved.`
            : "Learners can't see this course until the team has approved it. It saves as you type."}
        </p>
        {course.lastReview?.note && (course.lastReview.status === "changes_requested" || course.lastReview.status === "rejected") && (
          <p className="rounded-xl bg-paper-2 px-4 py-3 text-[15px]">
            <strong>{course.lastReview.status === "rejected" ? "Why it wasn't approved:" : "Changes the team asked for:"}</strong> {course.lastReview.note}
          </p>
        )}
        {blocker && <p className="text-[14px] text-muted-foreground">{blocker}</p>}
        {course.published && (
          <Link href={`/courses/${course.slug}`} className="text-[14px] font-medium underline underline-offset-4">
            See the course page
          </Link>
        )}
      </div>

      <CourseBuilder
        courseId={course.id}
        slug={course.slug}
        initialMeta={course.meta}
        initialContent={course.content}
        lockedSlugs={course.lockedSlugs}
        images={coverImages()}
        initialImageUrls={imageUrls}
        save={saveEducatorDraftAction}
        upload={uploadEducatorFileAction}
        readOnly={!canEdit}
        submit={!blocker && !course.pending && canEdit ? submitEducatorCourseAction : undefined}
      />
    </div>
  );
}

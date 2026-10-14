import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NoAccess, Notice, Tag, dateOnly } from "@/components/studio/ui";
import { SubmitButton } from "@/components/members/SubmitButton";
import { CourseBuilder } from "@/components/courses/builder/CourseBuilder";
import { loadBuilderCourse } from "@/lib/course-builder";
import { coverImages, draftImageUrls } from "@/lib/course-builder-assets";
import { studioPage } from "../../_lib/guard";
import { saveCourseDraftAction, setCourseListedAction, submitCourseAction, uploadCourseFileAction } from "../actions";

export default async function StudioCourseBuilderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string; tone?: string }> }) {
  const { id } = await params;
  const staff = await studioPage(`/studio/courses/${id}`, "courses.view");
  if (!staff) return <NoAccess what="courses" />;
  const { notice, tone } = await searchParams;
  const course = await loadBuilderCourse(id);
  if (!course) notFound();
  const canEdit = staff.perms.has("courses.edit");
  const canReview = staff.perms.has("courses.review");
  const imageUrls = await draftImageUrls(course.content);

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        <Link href="/studio/courses" className="hover:text-ink">
          Courses
        </Link>{" "}
        / <span className="text-ink">{course.meta.title}</span>
      </nav>
      {notice && <Notice tone={tone === "danger" ? "danger" : "default"}>{notice}</Notice>}

      <section className="flex flex-col gap-4 rounded-2xl border border-rule bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            {course.status === "published" && <Tag tone="positive">On sale</Tag>}
            {course.status === "unlisted" && <Tag>Off sale</Tag>}
            {course.status === "draft" && <Tag>Draft</Tag>}
            {course.pending && <Tag tone="warn">Version {course.pending.number} waiting for review</Tag>}
          </div>
          <p className="text-sm text-ink-2">
            {course.published
              ? `Learners see version ${course.published.number}, approved ${dateOnly(course.published.reviewedAt)}. Your edits stay in the draft until a new version is approved.`
              : "Learners can't see this course until a version has been approved."}
          </p>
          {course.lastReview?.note && course.lastReview.status !== "approved" && course.lastReview.status !== "superseded" && (
            <p className="rounded-xl bg-paper-2 px-3 py-2 text-sm">
              <strong>Reviewer&apos;s note:</strong> {course.lastReview.note}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {course.published && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/courses/${course.slug}`} target="_blank">
                View the course page
              </Link>
            </Button>
          )}
          {course.pending && canReview && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/studio/courses/review/${course.pending.id}`}>Review it</Link>
            </Button>
          )}
          {canReview && course.published && (
            <form action={setCourseListedAction}>
              <input type="hidden" name="id" value={course.id} />
              <input type="hidden" name="listed" value={course.status === "unlisted" ? "1" : "0"} />
              <SubmitButton variant="outline" size="sm" pending="Saving…">
                {course.status === "unlisted" ? "Put back on sale" : "Take off sale"}
              </SubmitButton>
            </form>
          )}
        </div>
      </section>

      <CourseBuilder
        courseId={course.id}
        slug={course.slug}
        initialMeta={course.meta}
        initialContent={course.content}
        lockedSlugs={course.lockedSlugs}
        images={coverImages()}
        initialImageUrls={imageUrls}
        save={saveCourseDraftAction}
        upload={uploadCourseFileAction}
        readOnly={!canEdit}
        submit={canEdit && !course.pending ? submitCourseAction : undefined}
      />
    </div>
  );
}

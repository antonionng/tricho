import { llmsTxt, markdownResponse } from "@/lib/llms";
import { getAllPosts } from "@/lib/blog";

export const revalidate = 300;

export async function GET() {
  return markdownResponse(llmsTxt(await getAllPosts()));
}

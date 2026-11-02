import { llmsFullTxt, markdownResponse } from "@/lib/llms";
import { getAllPosts } from "@/lib/blog";

export const revalidate = 300;

export async function GET() {
  return markdownResponse(llmsFullTxt(await getAllPosts()));
}

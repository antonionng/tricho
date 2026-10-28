import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { headingId } from "@/content/blog";

function text(children: React.ReactNode): string {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(text).join("");
  if (children && typeof children === "object" && "props" in children)
    return text((children as { props: { children?: React.ReactNode } }).props.children);
  return "";
}

/** A post's Markdown body. Section headings get stable ids so the contents list and shared links can jump to them. */
export function PostBody({ markdown }: { markdown: string }) {
  return (
    <div className="prose-tricho prose-blog">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 id={headingId(text(children))} className="group scroll-mt-28">
              <a href={`#${headingId(text(children))}`} className="no-underline">
                {children}
              </a>
            </h2>
          ),
          h3: ({ children }) => <h3 id={headingId(text(children))} className="scroll-mt-28">{children}</h3>,
          a: ({ href = "", children }) =>
            href.startsWith("/") ? (
              <Link href={href}>{children}</Link>
            ) : (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

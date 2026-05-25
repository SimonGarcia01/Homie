"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

type AssistantMessageContentProps = {
  content: string;
  variant: "user" | "assistant";
};

export function AssistantMessageContent({ content, variant }: AssistantMessageContentProps) {
  if (variant === "user") {
    return <p className="whitespace-pre-wrap break-words text-inherit">{content}</p>;
  }

  return (
    <div className={cn("assistant-markdown break-words text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0")}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="my-2 space-y-1 pl-4 list-disc">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 space-y-1 pl-4 list-decimal">{children}</ol>,
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          h1: ({ children }) => <p className="mb-2 font-display text-base font-semibold">{children}</p>,
          h2: ({ children }) => <p className="mb-2 font-display text-sm font-semibold">{children}</p>,
          h3: ({ children }) => <p className="mb-1.5 text-sm font-semibold">{children}</p>,
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-primary/40 pl-3 text-muted-foreground">{children}</blockquote>
          ),
          hr: () => <hr className="my-3 border-border" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
            >
              {children}
            </a>
          ),
          code: ({ className, children }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code className="my-2 block overflow-x-auto rounded-lg bg-background/80 px-3 py-2 font-mono text-xs">
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-background/70 px-1 py-0.5 font-mono text-[0.85em]">{children}</code>
            );
          },
          pre: ({ children }) => <pre className="my-2 overflow-x-auto">{children}</pre>,
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-background/60">{children}</thead>,
          th: ({ children }) => <th className="px-2 py-1.5 font-semibold">{children}</th>,
          td: ({ children }) => <td className="border-t border-border px-2 py-1.5">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

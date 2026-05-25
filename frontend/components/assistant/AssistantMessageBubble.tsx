"use client";

import { Bot, User } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AssistantChatMessage } from "@/lib/api/assistant";

import { AssistantMessageContent } from "./AssistantMessageContent";
import { AssistantPropertyPreviewCard } from "./AssistantPropertyPreviewCard";

export function AssistantMessageBubble({ msg }: { msg: AssistantChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <div className={cn("flex gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary/15 text-primary" : "bg-surface border border-border text-muted-foreground",
        )}
        aria-hidden
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>

      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-4 py-2.5 shadow-sm",
          isUser
            ? "rounded-tr-md bg-primary text-primary-foreground"
            : "rounded-tl-md border border-border bg-surface text-foreground",
        )}
      >
        <AssistantMessageContent content={msg.content} variant={msg.role} />
        {msg.preview && <AssistantPropertyPreviewCard preview={msg.preview} />}
      </div>
    </div>
  );
}

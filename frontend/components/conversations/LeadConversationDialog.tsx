"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LeadConversationPanel, type LeadConversationTarget } from "@/components/conversations/LeadConversationPanel";

export function LeadConversationDialog({
  target,
  open,
  onOpenChange,
  onMessageSent,
}: {
  target: LeadConversationTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMessageSent?: () => void;
}) {
  if (!target) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">Conversación con {target.contactName}</DialogTitle>
        <LeadConversationPanel target={target} onMessageSent={onMessageSent} />
      </DialogContent>
    </Dialog>
  );
}

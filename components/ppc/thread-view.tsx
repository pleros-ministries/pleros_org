import { cn } from "@/lib/utils";

type Message = {
  id: number;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: Date | string;
};

type ThreadViewProps = {
  messages: Message[];
  currentUserRole?: string;
};

export function ThreadView({ messages }: ThreadViewProps) {
  return (
    <div className="grid gap-2">
      {messages.map((msg) => {
        const isStaff = msg.authorRole !== "student";
        return (
          <div
            key={msg.id}
            className={cn(
              "rounded-lg border px-3 py-2",
              isStaff
                ? "border-zinc-200 bg-zinc-50"
                : "border-zinc-200 bg-white",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-900">{msg.authorName}</span>
              <span className="text-[10px] text-zinc-400">
                {new Date(msg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-600 leading-relaxed">{msg.content}</p>
          </div>
        );
      })}
    </div>
  );
}

import { Badge } from "@/components/ui/badge";

const TAG_COLORS: Record<string, string> = {
  CS: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Math: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Physics: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  Chemistry: "bg-green-500/20 text-green-300 border-green-500/30",
  Biology: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  English: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Economics: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  History: "bg-red-500/20 text-red-300 border-red-500/30",
  Programming: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  Other: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
};

interface SubjectTagBadgeProps {
  tag: string;
  className?: string;
}

export function SubjectTagBadge({ tag, className }: SubjectTagBadgeProps) {
  const colorClass = TAG_COLORS[tag] ?? TAG_COLORS.Other;
  return (
    <Badge
      variant="outline"
      className={`text-xs font-mono border ${colorClass} ${className ?? ""}`}
    >
      {tag}
    </Badge>
  );
}

export const SUBJECT_TAGS = [
  "CS",
  "Math",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Economics",
  "History",
  "Programming",
  "Other",
];

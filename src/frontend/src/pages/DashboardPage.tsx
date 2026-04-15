import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  BookOpen,
  Calendar,
  Clock,
  HelpCircle,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import type { Announcement, Doubt, StudyPost } from "../backend.d";
import { SubjectTagBadge } from "../components/SubjectTagBadge";
import {
  useGetAnnouncements,
  useGetDoubts,
  useGetStats,
  useGetStudyPosts,
} from "../hooks/useQueries";
import { formatRelativeTime } from "../utils/timeUtils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

function StatCard({ title, value, icon, color, loading }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="campus-card border-border bg-card overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                {title}
              </p>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="font-heading text-3xl font-bold text-foreground">
                  {value}
                </p>
              )}
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
            >
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

type ActivityItem =
  | { type: "post"; data: StudyPost }
  | { type: "doubt"; data: Doubt }
  | { type: "announcement"; data: Announcement };

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: studyPosts, isLoading: postsLoading } = useGetStudyPosts();
  const { data: doubts, isLoading: doubtsLoading } = useGetDoubts();
  const { data: announcements, isLoading: announcementsLoading } =
    useGetAnnouncements();

  // Build activity feed from recent items
  const activityItems: ActivityItem[] = [
    ...(studyPosts?.slice(-3) ?? []).map((p) => ({
      type: "post" as const,
      data: p,
    })),
    ...(doubts?.slice(-3) ?? []).map((d) => ({
      type: "doubt" as const,
      data: d,
    })),
    ...(announcements?.slice(-2) ?? []).map((a) => ({
      type: "announcement" as const,
      data: a,
    })),
  ]
    .sort((a, b) => Number(b.data.timestamp - a.data.timestamp))
    .slice(0, 8);

  const isActivityLoading =
    postsLoading || doubtsLoading || announcementsLoading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">
          Welcome back! Here's what's happening on campus.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Study Posts"
          value={statsLoading ? "—" : String(stats?.studyPostCount ?? 0)}
          icon={<BookOpen className="h-5 w-5" />}
          color="bg-blue-500/10 text-blue-400"
          loading={statsLoading}
        />
        <StatCard
          title="Doubts"
          value={statsLoading ? "—" : String(stats?.doubtCount ?? 0)}
          icon={<HelpCircle className="h-5 w-5" />}
          color="bg-purple-500/10 text-purple-400"
          loading={statsLoading}
        />
        <StatCard
          title="Events"
          value={statsLoading ? "—" : String(stats?.eventCount ?? 0)}
          icon={<Calendar className="h-5 w-5" />}
          color="bg-emerald-500/10 text-emerald-400"
          loading={statsLoading}
        />
        <StatCard
          title="Announcements"
          value={statsLoading ? "—" : String(stats?.announcementCount ?? 0)}
          icon={<Bell className="h-5 w-5" />}
          color="bg-amber-500/10 text-amber-400"
          loading={statsLoading}
        />
        <StatCard
          title="Active Users"
          value={statsLoading ? "—" : String(stats?.userCount ?? 0)}
          icon={<Users className="h-5 w-5" />}
          color="bg-cyan-500/10 text-cyan-400"
          loading={statsLoading}
        />
      </div>

      {/* Activity Feed */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isActivityLoading ? (
            <div className="space-y-3">
              {(["s1", "s2", "s3", "s4", "s5"] as const).map((k) => (
                <div key={k} className="flex items-start gap-3 p-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : activityItems.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No activity yet. Be the first to post!
            </div>
          ) : (
            <div className="divide-y divide-border">
              {activityItems.map((item, idx) => (
                <motion.div
                  key={`${item.type}-${item.data.id}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-start gap-3 py-3 px-1"
                >
                  {/* Icon */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      item.type === "post"
                        ? "bg-blue-500/10 text-blue-400"
                        : item.type === "doubt"
                          ? "bg-purple-500/10 text-purple-400"
                          : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {item.type === "post" ? (
                      <BookOpen className="h-4 w-4" />
                    ) : item.type === "doubt" ? (
                      <HelpCircle className="h-4 w-4" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground truncate">
                        {item.data.title}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs border-border text-muted-foreground capitalize flex-shrink-0"
                      >
                        {item.type === "post"
                          ? "Study Post"
                          : item.type === "doubt"
                            ? "Doubt"
                            : "Announcement"}
                      </Badge>
                      {"subjectTag" in item.data && (
                        <SubjectTagBadge tag={item.data.subjectTag} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      {"authorName" in item.data && (
                        <span>{item.data.authorName}</span>
                      )}
                      <span>·</span>
                      <span>{formatRelativeTime(item.data.timestamp)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

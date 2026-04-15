import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Loader2, MapPin, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Event } from "../backend.d";
import { EmptyState } from "../components/EmptyState";
import { CardSkeleton, LoadingSpinner } from "../components/LoadingSpinner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCreateEvent, useGetEvents, useIsAdmin } from "../hooks/useQueries";
import { dateToNano, formatRelativeTime, nanoToDate } from "../utils/timeUtils";

function EventCard({ event }: { event: Event }) {
  const eventDate = nanoToDate(event.eventDate);
  const now = new Date();
  const isUpcoming = eventDate > now;
  const isPast = eventDate < now;

  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = eventDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const dayOfMonth = eventDate.getDate();
  const monthShort = eventDate.toLocaleString("en-US", { month: "short" });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card
        className={`campus-card border-border bg-card overflow-hidden ${isPast ? "opacity-70" : ""}`}
      >
        <CardContent className="p-0">
          <div className="flex">
            {/* Date column */}
            <div
              className={`flex flex-col items-center justify-center px-5 py-4 min-w-[80px] ${
                isUpcoming
                  ? "bg-primary/10 border-r border-primary/20"
                  : "bg-muted/30 border-r border-border"
              }`}
            >
              <span
                className={`text-xs font-bold uppercase tracking-wider ${isUpcoming ? "text-primary" : "text-muted-foreground"}`}
              >
                {monthShort}
              </span>
              <span
                className={`font-heading text-3xl font-bold leading-none ${isUpcoming ? "text-primary" : "text-foreground"}`}
              >
                {dayOfMonth}
              </span>
              <span
                className={`text-xs mt-0.5 ${isUpcoming ? "text-primary/70" : "text-muted-foreground"}`}
              >
                {eventDate.getFullYear()}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-heading font-semibold text-foreground leading-snug">
                  {event.title}
                </h3>
                <Badge
                  variant="outline"
                  className={`flex-shrink-0 text-xs border ${
                    isUpcoming
                      ? "border-primary/30 text-primary bg-primary/10"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {isUpcoming ? "Upcoming" : "Past"}
                </Badge>
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-3">
                {event.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formattedTime}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function EventsPage() {
  const { identity } = useInternetIdentity();
  const { data: events, isLoading } = useGetEvents();
  const { data: isAdmin } = useIsAdmin();
  const createEvent = useCreateEvent();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    eventDate: "",
  });

  const sortedEvents = [...(events ?? [])].sort((a, b) => {
    const dateA = nanoToDate(a.eventDate).getTime();
    const dateB = nanoToDate(b.eventDate).getTime();
    const now = Date.now();
    // Upcoming first, sorted ascending; past events after, sorted descending
    const aUpcoming = dateA > now;
    const bUpcoming = dateB > now;
    if (aUpcoming && !bUpcoming) return -1;
    if (!aUpcoming && bUpcoming) return 1;
    if (aUpcoming && bUpcoming) return dateA - dateB;
    return dateB - dateA;
  });

  const upcomingEvents = sortedEvents.filter(
    (e) => nanoToDate(e.eventDate) > new Date(),
  );
  const pastEvents = sortedEvents.filter(
    (e) => nanoToDate(e.eventDate) <= new Date(),
  );

  const handleCreate = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.eventDate) {
      toast.error("Please fill in all fields");
      return;
    }
    const eventDateNano = dateToNano(new Date(form.eventDate));
    try {
      await createEvent.mutateAsync({
        title: form.title,
        description: form.description,
        eventDate: eventDateNano,
      });
      toast.success("Event created!");
      setCreateOpen(false);
      setForm({ title: "", description: "", eventDate: "" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const displayMsg =
        msg.includes("Anonymous") ||
        msg.includes("not registered") ||
        msg.includes("Unauthorized")
          ? "Please wait a moment and try again — your session is being set up."
          : msg.includes("Not authorized")
            ? "Only admins can create events."
            : msg.includes("Title must be between")
              ? (msg.split("rejected:").pop()?.trim() ??
                "Title is too short or too long.")
              : "Failed to create event. Please try again.";
      toast.error(displayMsg);
    }
  };

  // Min date for the date picker (today)
  const today = new Date().toISOString().slice(0, 16);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Campus Events
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Upcoming and past campus events
          </p>
        </div>
        {identity && isAdmin && (
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {(["sk-1", "sk-2", "sk-3", "sk-4"] as const).map((k) => (
            <CardSkeleton key={k} />
          ))}
        </div>
      ) : sortedEvents.length === 0 ? (
        <EmptyState
          icon={<Calendar />}
          title="No events scheduled"
          description="Check back later for upcoming campus events."
        />
      ) : (
        <div className="space-y-6">
          {upcomingEvents.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Upcoming ({upcomingEvents.length})
              </h2>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <EventCard key={String(event.id)} event={event} />
                ))}
              </div>
            </div>
          )}

          {pastEvents.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Past Events ({pastEvents.length})
              </h2>
              <div className="space-y-3">
                {pastEvents.map((event) => (
                  <EventCard key={String(event.id)} event={event} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Create Event</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new campus event for students to see.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="event-title">Event Title</Label>
              <Input
                id="event-title"
                placeholder="e.g., Annual Tech Fest 2026"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-date">Date & Time</Label>
              <Input
                id="event-date"
                type="datetime-local"
                min={today}
                value={form.eventDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, eventDate: e.target.value }))
                }
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-desc">Description</Label>
              <Textarea
                id="event-desc"
                placeholder="Describe the event, venue, schedule..."
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="bg-secondary border-border min-h-[100px] resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createEvent.isPending}
              className="bg-primary text-primary-foreground"
            >
              {createEvent.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

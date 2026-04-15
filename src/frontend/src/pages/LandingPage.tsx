import { Button } from "@/components/ui/button";
import {
  Bell,
  BookOpen,
  Calendar,
  GraduationCap,
  MessageCircle,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const features = [
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: "Study Materials",
    description:
      "Share notes, resources, and study guides organized by subject.",
  },
  {
    icon: <MessageCircle className="h-5 w-5" />,
    title: "Ask Doubts",
    description: "Post questions and get answers from fellow students.",
  },
  {
    icon: <Calendar className="h-5 w-5" />,
    title: "Campus Events",
    description: "Stay updated on all upcoming college events and activities.",
  },
  {
    icon: <Bell className="h-5 w-5" />,
    title: "Announcements",
    description: "Never miss important notices from admin and faculty.",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Student Chat",
    description: "Connect and collaborate with your campus community.",
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Real-time Updates",
    description: "Live chat and instant notifications keep you in the loop.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border/50 backdrop-blur-md bg-background/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-lg text-foreground">
            Smart Campus Connect
          </span>
        </div>
        <Button
          onClick={login}
          disabled={isLoggingIn}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isLoggingIn ? "Connecting..." : "Sign In"}
        </Button>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-accent/5 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative max-w-4xl mx-auto space-y-6"
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Now live on Internet Computer
          </motion.div>

          <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl font-bold text-foreground leading-tight tracking-tight">
            Your Campus, <span className="text-primary">Connected</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A centralized academic collaboration platform. Share knowledge, ask
            questions, stay updated — all in one place.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Button
              size="lg"
              onClick={login}
              disabled={isLoggingIn}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-sm px-8 h-12 text-base font-semibold"
            >
              {isLoggingIn ? "Connecting..." : "Get Started Free"}
            </Button>
            <span className="text-muted-foreground text-sm">
              Secure login via Internet Identity
            </span>
          </motion.div>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-8 mt-16 text-center"
        >
          {[
            { value: "500+", label: "Students" },
            { value: "1,200+", label: "Study Posts" },
            { value: "300+", label: "Doubts Solved" },
            { value: "50+", label: "Events" },
          ].map((stat) => (
            <div key={stat.label} className="space-y-1">
              <div className="font-heading text-2xl font-bold text-primary">
                {stat.value}
              </div>
              <div className="text-muted-foreground text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 space-y-3"
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
              Everything you need
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Built for students, by students. A complete academic ecosystem on
              the decentralized web.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="campus-card group p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm hover:bg-card"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    {feature.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-heading font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center space-y-6 p-8 rounded-2xl border border-primary/20 bg-primary/5"
        >
          <GraduationCap className="h-12 w-12 text-primary mx-auto" />
          <h2 className="font-heading text-3xl font-bold text-foreground">
            Ready to join your campus community?
          </h2>
          <p className="text-muted-foreground">
            Sign in with Internet Identity — no email or password required. Your
            data is secured on the blockchain.
          </p>
          <Button
            size="lg"
            onClick={login}
            disabled={isLoggingIn}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-10 h-12 font-semibold"
          >
            {isLoggingIn ? "Connecting..." : "Login with Internet Identity"}
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center text-muted-foreground text-sm">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

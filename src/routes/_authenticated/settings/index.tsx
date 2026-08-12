import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BellRing,
  Check,
  ChevronRight,
  Coins,
  ListTree,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { GlassCard } from "@/components/AppShell";
import { InstallCubeRow } from "@/components/InstallCubeRow";
import { useTour } from "@/components/tour/TourProvider";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useProfile } from "@/hooks/use-cube";
import { useTheme } from "@/hooks/use-theme";
import { logActivity } from "@/lib/activity";
import * as api from "@/lib/api";
import { CURRENCIES } from "@/lib/format";
import { disablePushReminder, enablePushReminder, updatePushReminderTime } from "@/lib/push";
import { THEMES } from "@/lib/theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings/")({
  head: () => ({
    meta: [
      { title: "Cube — Settings" },
      {
        name: "description",
        content:
          "Manage your profile, theme, daily reminder, currency, categories and privacy settings in Cube.",
      },
      { property: "og:title", content: "Cube — Settings" },
      {
        property: "og:description",
        content: "Profile, themes, reminders, currency and categories — all in one place.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const profile = useProfile();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { startTour } = useTour();

  const currency = profile.data?.currency ?? "PKR";
  const reminderEnabled = profile.data?.reminder_enabled ?? false;
  const reminderTime = (profile.data?.reminder_time ?? "21:00").slice(0, 5);

  const saveCurrency = useMutation({
    mutationFn: (value: string) => api.updateProfile({ currency: value }),
    onSuccess: (_d, value) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      void logActivity("currency", `Changed default currency to ${value}`);
      toast.success("Currency updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveReminder = useMutation({
    mutationFn: async (patch: { reminder_enabled?: boolean; reminder_time?: string }) => {
      if (patch.reminder_enabled === true) {
        await enablePushReminder(patch.reminder_time ?? reminderTime);
      } else if (patch.reminder_enabled === false) {
        await disablePushReminder();
      } else if (patch.reminder_time) {
        await updatePushReminderTime(patch.reminder_time);
      }
      await api.updateProfile(patch);
    },
    onSuccess: (_d, patch) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      void logActivity(
        "reminder",
        patch.reminder_time
          ? `Set the daily reminder to ${patch.reminder_time}`
          : patch.reminder_enabled
            ? "Turned the daily reminder on"
            : "Turned the daily reminder off",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <InstallCubeRow />
      <RowLink to="/profile" icon={User} title="Profile" description="Name, photo, email and password" />


      <Accordion type="single" collapsible className="space-y-3">
        <Section value="subscription" icon={Sparkles} title="Subscription">
          <p className="font-display text-base tracking-tight">
            Cheers, you&apos;re on early access — free.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything in Cube is free right now while we&apos;re building it out. If we ever
            introduce paid features, what you&apos;re using today stays free for you.
          </p>
        </Section>

        <Section value="themes" icon={Sparkles} title="Themes">
          <div className="grid gap-2 sm:grid-cols-3">
            {THEMES.map((t) => (
              <button
                key={t.name}
                onClick={() => {
                  setTheme.mutate(t.name);
                  void logActivity("theme", `Switched theme to ${t.label}`);
                }}
                className={cn(
                  "rounded-3xl border p-4 text-left transition-colors",
                  theme === t.name
                    ? "border-primary bg-primary/15"
                    : "border-border glass-soft hover:bg-foreground/5",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-base tracking-tight">{t.label}</span>
                  {theme === t.name && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                <div className="mt-3 flex gap-1.5">
                  {t.swatches.map((s) => (
                    <span
                      key={s}
                      className="h-5 w-5 rounded-full border border-white/10"
                      style={{ backgroundColor: s }}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </Section>

        <Section value="reminder" icon={BellRing} title="Daily reminder" tour="reminder">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm">Remind me to log expenses</p>
              <p className="text-xs text-muted-foreground">
                A gentle daily nudge, delivered even when Cube is closed.
              </p>
            </div>
            <Switch
              checked={reminderEnabled}
              onCheckedChange={(v) => saveReminder.mutate({ reminder_enabled: v })}
            />
          </div>
          {reminderEnabled && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <Label htmlFor="reminder-time" className="text-sm">
                Time
              </Label>
              <Input
                id="reminder-time"
                type="time"
                value={reminderTime}
                onChange={(e) => saveReminder.mutate({ reminder_time: e.target.value })}
                className="h-10 w-32 bg-input/40"
              />
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Notifications work on devices where you allowed them. On iPhone, add Cube to your home
            screen first, then turn this on from the installed app.
          </p>
        </Section>
      </Accordion>

      <GlassCard className="space-y-2">
        <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Default currency
        </Label>
        <Select value={currency} onValueChange={(v) => saveCurrency.mutate(v)}>
          <SelectTrigger className="h-11 bg-input/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </GlassCard>

      <RowLink
        to="/settings/currency"
        icon={Coins}
        title="Currency & rates"
        description="Base currency and editable exchange rates"
      />
      <RowLink
        to="/settings/categories"
        icon={ListTree}
        title="Categories"
        description="Add, rename, recolour or delete categories"
        tour="categories"
      />
      <RowLink
        to="/privacy"
        icon={ShieldCheck}
        title="Privacy & data policy"
        description="What is stored, where it lives and how to delete it"
      />
      <RowLink
        to="/settings/whats-new"
        icon={Sparkles}
        title="What's new"
        description="Recent changes and fixes in Cube"
      />

      <button
        onClick={startTour}
        className="flex w-full items-center gap-3 rounded-3xl glass-soft px-5 py-4 text-left transition-colors hover:bg-foreground/5"
      >
        <PlayCircle className="h-5 w-5 shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">Replay tutorial</span>
          <span className="block text-xs text-muted-foreground">
            Walk through the 10-step tour again
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
    </div>
  );
}

function Section({
  value,
  icon: Icon,
  title,
  tour,
  children,
}: {
  value: string;
  icon: LucideIcon;
  title: string;
  tour?: string;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem
      value={value}
      className="rounded-3xl glass-soft border-none px-5"
      {...(tour ? { "data-tour": tour } : {})}
    >
      <AccordionTrigger className="py-4 hover:no-underline">
        <span className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">{title}</span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-5">{children}</AccordionContent>
    </AccordionItem>
  );
}

function RowLink({
  to,
  icon: Icon,
  title,
  description,
  tour,
}: {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
  tour?: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-3xl glass-soft px-5 py-4 transition-colors hover:bg-foreground/5"
      {...(tour ? { "data-tour": tour } : {})}
    >
      <Icon className="h-5 w-5 shrink-0 text-primary" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

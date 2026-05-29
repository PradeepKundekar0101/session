import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { saveAvailability } from "@/lib/actions/mentor";
import { PageTitle, Card, Button, Label, Input } from "@/components/ui";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default async function AvailabilityPage() {
  const profile = await getProfile();
  if (!profile) redirect("/auth/login");

  const supabase = await createClient();
  const { data: mentor } = await supabase
    .from("mentor_profiles")
    .select("id")
    .eq("user_id", profile.id)
    .single();

  if (!mentor) redirect("/dashboard/mentor/onboarding");

  const { data: rules } = await supabase
    .from("availability_rules")
    .select("*")
    .eq("mentor_id", mentor.id)
    .order("weekday");

  const rulesByDay = new Map((rules ?? []).map((r) => [r.weekday, r]));

  return (
    <>
      <PageTitle
        title="Weekly availability"
        subtitle="Recurring windows used to generate bookable slots (60 min sessions)."
      />
      <Card>
        <form action={saveAvailability} className="space-y-6">
          {WEEKDAYS.map((name, weekday) => {
            const rule = rulesByDay.get(weekday);
            return (
              <div
                key={weekday}
                className="grid gap-4 sm:grid-cols-[120px_1fr_1fr] items-end border-b border-white/[0.06] pb-4"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name={`enabled_${weekday}`}
                    defaultChecked={!!rule}
                    className="accent-[#BDFF3A]"
                  />
                  <span className="text-sm font-medium text-neutral-200">{name}</span>
                </div>
                <div>
                  <Label>Start</Label>
                  <Input
                    type="time"
                    name={`start_${weekday}`}
                    defaultValue={rule?.start_time?.slice(0, 5) ?? "09:00"}
                  />
                </div>
                <div>
                  <Label>End</Label>
                  <Input
                    type="time"
                    name={`end_${weekday}`}
                    defaultValue={rule?.end_time?.slice(0, 5) ?? "17:00"}
                  />
                </div>
              </div>
            );
          })}
          <p className="text-xs text-neutral-500">
            Only checked days are saved. Times use your mentor profile timezone.
          </p>
          <Button type="submit">Save availability</Button>
        </form>
      </Card>
    </>
  );
}

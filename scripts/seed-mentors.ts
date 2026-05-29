/**
 * Seed 10 mentor profiles into the database.
 *
 * Usage:
 *   npx tsx scripts/seed-mentors.ts
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const MENTORS = [
  {
    email: "sarah.chen@example.com",
    display_name: "Sarah Chen",
    slug: "sarah-chen",
    headline: "Staff Engineer · Distributed Systems",
    bio: "15 years building large-scale distributed systems at Google and Stripe. I help engineers level up on system design interviews and architecture thinking.",
    expertise: ["System Design", "Backend", "Career Growth"],
    rate_cents: 20000,
    timezone: "America/Los_Angeles",
    avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face",
    banner_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop",
  },
  {
    email: "marcus.johnson@example.com",
    display_name: "Marcus Johnson",
    slug: "marcus-johnson",
    headline: "Product Design Lead · Former Figma",
    bio: "Led design at Figma for 4 years. Passionate about design systems, prototyping, and helping designers transition into leadership roles.",
    expertise: ["Product Design", "Design Systems", "Leadership"],
    rate_cents: 17500,
    timezone: "America/New_York",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    banner_url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=400&fit=crop",
  },
  {
    email: "priya.patel@example.com",
    display_name: "Priya Patel",
    slug: "priya-patel",
    headline: "Machine Learning Engineer · AI Researcher",
    bio: "PhD from MIT. Currently leading ML infrastructure at a Series B startup. I mentor on ML careers, research-to-industry transitions, and technical interviews.",
    expertise: ["Machine Learning", "AI", "Python", "Interviews"],
    rate_cents: 25000,
    timezone: "America/Chicago",
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face",
    banner_url: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=400&fit=crop",
  },
  {
    email: "alex.rivera@example.com",
    display_name: "Alex Rivera",
    slug: "alex-rivera",
    headline: "Startup Founder · 2x Exit",
    bio: "Built and sold two SaaS companies. Angel investor in 20+ startups. I help early-stage founders with product-market fit, fundraising, and go-to-market strategy.",
    expertise: ["Startups", "Fundraising", "Product Strategy"],
    rate_cents: 30000,
    timezone: "America/New_York",
    avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    banner_url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&h=400&fit=crop",
  },
  {
    email: "emma.larsson@example.com",
    display_name: "Emma Larsson",
    slug: "emma-larsson",
    headline: "Frontend Architect · React & TypeScript",
    bio: "Core contributor to React Query. 10 years of frontend development. I specialize in performance optimization, architecture decisions, and code review for React/Next.js apps.",
    expertise: ["React", "TypeScript", "Next.js", "Performance"],
    rate_cents: 15000,
    timezone: "Europe/Stockholm",
    avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    banner_url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=400&fit=crop",
  },
  {
    email: "david.okonkwo@example.com",
    display_name: "David Okonkwo",
    slug: "david-okonkwo",
    headline: "Engineering Manager · People & Process",
    bio: "Engineering manager at Shopify managing 30+ engineers. I coach on transitioning to management, running effective teams, difficult conversations, and performance reviews.",
    expertise: ["Engineering Management", "Leadership", "Career"],
    rate_cents: 18000,
    timezone: "America/Toronto",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    banner_url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=400&fit=crop",
  },
  {
    email: "yuki.tanaka@example.com",
    display_name: "Yuki Tanaka",
    slug: "yuki-tanaka",
    headline: "iOS & Swift Expert · Former Apple",
    bio: "Spent 6 years at Apple working on UIKit and SwiftUI. Now indie developer with 2M+ downloads. I help with iOS architecture, App Store optimization, and Swift best practices.",
    expertise: ["iOS", "Swift", "SwiftUI", "Mobile"],
    rate_cents: 22000,
    timezone: "Asia/Tokyo",
    avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face",
    banner_url: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&h=400&fit=crop",
  },
  {
    email: "rachel.green@example.com",
    display_name: "Rachel Green",
    slug: "rachel-green",
    headline: "Data Engineering · dbt & Modern Stack",
    bio: "Built data platforms at Netflix and Airbnb. Specialist in dbt, Snowflake, and modern data stack. I mentor analysts transitioning to data engineering and teams adopting dbt.",
    expertise: ["Data Engineering", "dbt", "SQL", "Analytics"],
    rate_cents: 16000,
    timezone: "America/Denver",
    avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
    banner_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=400&fit=crop",
  },
  {
    email: "omar.hassan@example.com",
    display_name: "Omar Hassan",
    slug: "omar-hassan",
    headline: "DevOps & Platform Engineering",
    bio: "Principal Platform Engineer. Kubernetes certified (CKA/CKAD). I help teams adopt GitOps, build internal developer platforms, and scale infrastructure.",
    expertise: ["DevOps", "Kubernetes", "AWS", "Platform"],
    rate_cents: 19000,
    timezone: "Europe/London",
    avatar_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face",
    banner_url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=400&fit=crop",
  },
  {
    email: "lisa.wu@example.com",
    display_name: "Lisa Wu",
    slug: "lisa-wu",
    headline: "Product Manager · B2B SaaS",
    bio: "VP Product at a $500M ARR B2B company. 12 years in product management. I coach on PM interviews, stakeholder management, roadmap prioritization, and transitioning into product.",
    expertise: ["Product Management", "B2B", "Strategy", "Interviews"],
    rate_cents: 22500,
    timezone: "America/San_Francisco",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
    banner_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=400&fit=crop",
  },
];

const AVAILABILITY = [
  { weekday: 1, start_time: "09:00", end_time: "12:00" },
  { weekday: 3, start_time: "14:00", end_time: "18:00" },
  { weekday: 5, start_time: "10:00", end_time: "15:00" },
];

async function seed() {
  console.log("Seeding 10 mentors…\n");

  for (const m of MENTORS) {
    // Create auth user (or find existing one)
    let userId: string;

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: m.email,
        password: "Mentor123!",
        email_confirm: true,
        user_metadata: { display_name: m.display_name, role: "mentor" },
      });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        // Look up existing user
        const { data: users } = await supabase.auth.admin.listUsers();
        const existing = users?.users.find((u) => u.email === m.email);
        if (!existing) {
          console.error(`  ✗ ${m.display_name}: exists but can't find ID`);
          continue;
        }
        userId = existing.id;
      } else {
        console.error(`  ✗ ${m.display_name}: ${authError.message}`);
        continue;
      }
    } else {
      userId = authData.user.id;
    }

    // Ensure profile exists (trigger may have run)
    await supabase.from("profiles").upsert({
      id: userId,
      display_name: m.display_name,
      role: "mentor",
      avatar_url: m.avatar_url,
    });

    // Upsert mentor profile (approved)
    const { data: mp, error: mpError } = await supabase
      .from("mentor_profiles")
      .upsert(
        {
          user_id: userId,
          slug: m.slug,
          headline: m.headline,
          bio: m.bio,
          expertise: m.expertise,
          rate_cents: m.rate_cents,
          timezone: m.timezone,
          status: "approved",
          avatar_url: m.avatar_url,
          banner_url: m.banner_url,
          stripe_account_id: `acct_seed_${m.slug}`,
        },
        { onConflict: "user_id" }
      )
      .select("id")
      .single();

    if (mpError) {
      console.error(`  ✗ ${m.display_name} mentor_profile: ${mpError.message}`);
      continue;
    }

    // Add availability rules
    const rules = AVAILABILITY.map((r) => ({
      mentor_id: mp.id,
      ...r,
    }));
    await supabase.from("availability_rules").insert(rules);

    console.log(`  ✓ ${m.display_name} (${m.slug})`);
  }

  console.log("\n✅ Done! All mentors are approved with availability set.");
  console.log("   Password for all: Mentor123!");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

export type UserRole = "learner" | "mentor" | "admin";
export type MentorStatus = "pending" | "approved" | "denied";
export type BookingStatus =
  | "requested"
  | "approved"
  | "denied"
  | "expired"
  | "completed"
  | "cancelled";

export type Profile = {
  id: string;
  role: UserRole;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type MentorProfile = {
  id: string;
  user_id: string;
  slug: string;
  headline: string;
  bio: string;
  expertise: string[];
  rate_cents: number;
  status: MentorStatus;
  stripe_account_id: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type AvailabilityRule = {
  id: string;
  mentor_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
};

export type AvailabilityException = {
  id: string;
  mentor_id: string;
  exception_date: string;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
};

export type Booking = {
  id: string;
  learner_id: string;
  mentor_id: string;
  start_at: string;
  end_at: string;
  status: BookingStatus;
  amount_cents: number;
  stripe_payment_intent_id: string | null;
  meeting_url: string | null;
  daily_room_name: string | null;
  approval_deadline: string;
  created_at: string;
  updated_at: string;
};

export type TimeSlot = {
  start: Date;
  end: Date;
  startIso: string;
  endIso: string;
  label: string;
};

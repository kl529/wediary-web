export type Attendance = "attending" | "absent" | "pending";

export type Wedding = {
  id: string;
  user_id: string;
  groom: string;
  bride: string;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM
  venue: string;
  attendance: Attendance;
  invite_url: string | null;
  created_at: string;
};

export type Memory = {
  id: string;
  wedding_id: string;
  user_id: string;
  memo: string | null;
  emotion_tags: string[];
  gift_amount: number | null;
  created_at: string;
};

CREATE TABLE IF NOT EXISTS public.fitness_tracker_test_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  log_date date NOT NULL,
  workout_type text,
  workout_duration_minutes integer NOT NULL CHECK (workout_duration_minutes >= 0),
  steps_count integer NOT NULL CHECK (steps_count >= 0),
  sleep_quality text,
  calories_per_minute numeric(12, 4) CHECK (calories_per_minute IS NULL OR calories_per_minute >= 0),
  day_name text NOT NULL,
  activity_category text,
  CONSTRAINT fitness_tracker_test_details_client_date_key
    UNIQUE (client_user_id, log_date)
);

ALTER TABLE public.fitness_tracker_test_details ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.fitness_tracker_test_details FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.fitness_tracker_test_details TO service_role;

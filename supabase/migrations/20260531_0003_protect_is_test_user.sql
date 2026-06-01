-- supabase/migrations/20260531_0003_protect_is_test_user.sql
-- Fix: REVOKE UPDATE (column) does not protect against table-level UPDATE grants.
-- Replace the broad owner update policy with one that prevents is_test_user changes
-- via WITH CHECK, ensuring authenticated users can never flip is_test_user.

-- Drop and recreate the update policy with an extra WITH CHECK guard.
-- The subquery compares the incoming is_test_user value against the stored value —
-- any attempt to change it will cause the policy check to fail and the UPDATE to be rejected.
DROP POLICY IF EXISTS "profiles: owner update" ON public.profiles;

CREATE POLICY "profiles: owner update"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND is_test_user = (
      SELECT p.is_test_user
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
  );

-- The column-level REVOKE added in 0001 is now redundant (table-level grant wins),
-- but is harmless to keep. This policy is the actual enforcement mechanism.

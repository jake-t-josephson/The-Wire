# Supabase operations

## Phase 1 security rollout

Deploy these changes in this order:

1. In Supabase Authentication settings, enable anonymous sign-ins.
2. Apply `migrations/009_security_hardening.sql`.
3. Deploy the `fetch-podcast-feeds` and `wireroom` Edge Functions.
4. Confirm GitHub Actions has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets.
5. Manually run the **Refresh Wireroom** and **Refresh Podcast Feeds** workflows once.
6. Verify Home can read the cached Wireroom brief and that two anonymous browser profiles receive independent podcast progress.

The migration preserves old `podcast_progress` rows with a null `user_id`. They are intentionally inaccessible because there is no trustworthy owner to assign them to. They can be archived or deleted in a later maintenance migration after the rollout is verified.

The service-role key must never be added to a `VITE_` environment variable or otherwise included in the browser bundle.

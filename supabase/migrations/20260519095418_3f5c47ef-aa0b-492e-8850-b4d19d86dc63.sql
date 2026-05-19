DELETE FROM public.cards_exchanged
WHERE from_user IN (SELECT id FROM public.profiles WHERE created_at = '2026-05-19 09:30:38.215035+00')
   OR to_user IN (SELECT id FROM public.profiles WHERE created_at = '2026-05-19 09:30:38.215035+00');

DELETE FROM public.event_attendees
WHERE user_id IN (SELECT id FROM public.profiles WHERE created_at = '2026-05-19 09:30:38.215035+00');

DELETE FROM public.user_roles
WHERE user_id IN (SELECT id FROM public.profiles WHERE created_at = '2026-05-19 09:30:38.215035+00');

DELETE FROM public.match_results
WHERE user_id IN (SELECT id FROM public.profiles WHERE created_at = '2026-05-19 09:30:38.215035+00')
   OR match_user_id IN (SELECT id FROM public.profiles WHERE created_at = '2026-05-19 09:30:38.215035+00');

DELETE FROM public.presence
WHERE user_id IN (SELECT id FROM public.profiles WHERE created_at = '2026-05-19 09:30:38.215035+00');

DELETE FROM public.profiles
WHERE created_at = '2026-05-19 09:30:38.215035+00';
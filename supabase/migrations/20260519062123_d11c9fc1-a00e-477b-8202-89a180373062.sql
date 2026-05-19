
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
-- has_role is still callable by `authenticated` so RLS policies can use it via the api role chain.
-- Actually RLS evaluates as the table owner; revoke from all api roles to be safe.
revoke execute on function public.has_role(uuid, public.app_role) from authenticated;

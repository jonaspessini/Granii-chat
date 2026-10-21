create table if not exists public.user_goals (
    user_id uuid primary key references auth.users (id) on delete cascade,
    goals jsonb not null default '[]'::jsonb,
    updated_at timestamptz not null default now()
);

alter table public.user_goals enable row level security;

grant select, insert, update, delete on table public.user_goals to authenticated;

drop policy if exists "Users can read their own goals" on public.user_goals;
create policy "Users can read their own goals"
    on public.user_goals for select to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own goals" on public.user_goals;
create policy "Users can create their own goals"
    on public.user_goals for insert to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own goals" on public.user_goals;
create policy "Users can update their own goals"
    on public.user_goals for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own goals" on public.user_goals;
create policy "Users can delete their own goals"
    on public.user_goals for delete to authenticated
    using ((select auth.uid()) = user_id);

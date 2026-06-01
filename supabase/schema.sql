-- LifeHub PostgreSQL Schema DDL
-- Suitable for running in the Supabase SQL Editor

-- -------------------------------------------------------------
-- 1. Enable Required Extensions
-- -------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- -------------------------------------------------------------
-- 2. Profiles Table
-- -------------------------------------------------------------
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    name text,
    avatar_url text,
    theme text default 'dark' check (theme in ('light', 'dark')),
    notification_prefs jsonb default '{"prayers": true, "habits": true, "tasks": true, "goals": true, "journals": false}'::jsonb,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Allow public read access to profiles" 
    on public.profiles for select 
    using (true);

create policy "Allow users to update their own profile" 
    on public.profiles for update 
    using (auth.uid() = id);

-- Trigger to automatically create a profile for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, name, avatar_url, theme)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url',
        'dark'
    );
    return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();


-- -------------------------------------------------------------
-- 3. Prayers Table
-- -------------------------------------------------------------
create table if not exists public.prayers (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    date date default current_date not null,
    fajr text default 'No' not null,
    dhuhr text default 'No' not null,
    asr text default 'No' not null,
    maghrib text default 'No' not null,
    isha text default 'No' not null,
    tahajjud text default 'No' not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint prayers_user_date_key unique (user_id, date)
);

-- Enable RLS on Prayers
alter table public.prayers enable row level security;

-- Prayers Policies
create policy "Users can view their own prayers" 
    on public.prayers for select 
    using (auth.uid() = user_id);

create policy "Users can insert their own prayers" 
    on public.prayers for insert 
    with check (auth.uid() = user_id);

create policy "Users can update their own prayers" 
    on public.prayers for update 
    using (auth.uid() = user_id);

create policy "Users can delete their own prayers" 
    on public.prayers for delete 
    using (auth.uid() = user_id);


-- -------------------------------------------------------------
-- 4. Habits Table
-- -------------------------------------------------------------
create table if not exists public.habits (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    name text not null,
    description text,
    color text default '#10b981' not null, -- default Emerald green
    frequency text default 'daily' not null check (frequency in ('daily', 'weekly', 'monthly')),
    is_archived boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Habits
alter table public.habits enable row level security;

-- Habits Policies
create policy "Users can view their own habits" 
    on public.habits for select 
    using (auth.uid() = user_id);

create policy "Users can insert their own habits" 
    on public.habits for insert 
    with check (auth.uid() = user_id);

create policy "Users can update their own habits" 
    on public.habits for update 
    using (auth.uid() = user_id);

create policy "Users can delete their own habits" 
    on public.habits for delete 
    using (auth.uid() = user_id);


-- -------------------------------------------------------------
-- 5. Habit Logs Table
-- -------------------------------------------------------------
create table if not exists public.habit_logs (
    id uuid default gen_random_uuid() primary key,
    habit_id uuid references public.habits(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    date date default current_date not null,
    completed boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint habit_logs_habit_date_key unique (habit_id, date)
);

-- Enable RLS on Habit Logs
alter table public.habit_logs enable row level security;

-- Habit Logs Policies
create policy "Users can view their own habit logs" 
    on public.habit_logs for select 
    using (auth.uid() = user_id);

create policy "Users can insert their own habit logs" 
    on public.habit_logs for insert 
    with check (auth.uid() = user_id);

create policy "Users can update their own habit logs" 
    on public.habit_logs for update 
    using (auth.uid() = user_id);

create policy "Users can delete their own habit logs" 
    on public.habit_logs for delete 
    using (auth.uid() = user_id);


-- -------------------------------------------------------------
-- 6. Tasks Table
-- -------------------------------------------------------------
create table if not exists public.tasks (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    description text,
    category text default 'Personal' not null check (category in ('Personal', 'Study', 'Work', 'Islamic', 'Family')),
    priority text default 'Medium' not null check (priority in ('Low', 'Medium', 'High', 'Urgent')),
    due_date timestamp with time zone,
    status text default 'Todo' not null check (status in ('Todo', 'InProgress', 'Done')),
    is_recurring boolean default false not null,
    recurring_pattern text check (recurring_pattern in ('daily', 'weekly', 'monthly', null)),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Tasks
alter table public.tasks enable row level security;

-- Tasks Policies
create policy "Users can view their own tasks" 
    on public.tasks for select 
    using (auth.uid() = user_id);

create policy "Users can insert their own tasks" 
    on public.tasks for insert 
    with check (auth.uid() = user_id);

create policy "Users can update their own tasks" 
    on public.tasks for update 
    using (auth.uid() = user_id);

create policy "Users can delete their own tasks" 
    on public.tasks for delete 
    using (auth.uid() = user_id);


-- -------------------------------------------------------------
-- 7. Goals Table
-- -------------------------------------------------------------
create table if not exists public.goals (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    description text,
    category text default 'Deen' not null check (category in ('Deen', 'Health', 'Education', 'Career', 'Finance', 'Family')),
    target_date date,
    status text default 'InProgress' not null check (status in ('NotStarted', 'InProgress', 'Completed')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Goals
alter table public.goals enable row level security;

-- Goals Policies
create policy "Users can view their own goals" 
    on public.goals for select 
    using (auth.uid() = user_id);

create policy "Users can insert their own goals" 
    on public.goals for insert 
    with check (auth.uid() = user_id);

create policy "Users can update their own goals" 
    on public.goals for update 
    using (auth.uid() = user_id);

create policy "Users can delete their own goals" 
    on public.goals for delete 
    using (auth.uid() = user_id);


-- -------------------------------------------------------------
-- 8. Goal Milestones Table
-- -------------------------------------------------------------
create table if not exists public.goal_milestones (
    id uuid default gen_random_uuid() primary key,
    goal_id uuid references public.goals(id) on delete cascade not null,
    title text not null,
    is_completed boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Goal Milestones
alter table public.goal_milestones enable row level security;

-- Goal Milestones Policies
create policy "Users can view milestones of their own goals" 
    on public.goal_milestones for select 
    using (
        exists (
            select 1 from public.goals 
            where goals.id = goal_milestones.goal_id 
            and goals.user_id = auth.uid()
        )
    );

create policy "Users can insert milestones for their own goals" 
    on public.goal_milestones for insert 
    with check (
        exists (
            select 1 from public.goals 
            where goals.id = goal_milestones.goal_id 
            and goals.user_id = auth.uid()
        )
    );

create policy "Users can update milestones of their own goals" 
    on public.goal_milestones for update 
    using (
        exists (
            select 1 from public.goals 
            where goals.id = goal_milestones.goal_id 
            and goals.user_id = auth.uid()
        )
    );

create policy "Users can delete milestones of their own goals" 
    on public.goal_milestones for delete 
    using (
        exists (
            select 1 from public.goals 
            where goals.id = goal_milestones.goal_id 
            and goals.user_id = auth.uid()
        )
    );


-- -------------------------------------------------------------
-- 9. Journal Entries Table
-- -------------------------------------------------------------
create table if not exists public.journal_entries (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    date date default current_date not null,
    mood text not null,
    content text,
    tags text[] default '{}'::text[] not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Journal Entries
alter table public.journal_entries enable row level security;

-- Journal Entries Policies
create policy "Users can view their own journal entries" 
    on public.journal_entries for select 
    using (auth.uid() = user_id);

create policy "Users can insert their own journal entries" 
    on public.journal_entries for insert 
    with check (auth.uid() = user_id);

create policy "Users can update their own journal entries" 
    on public.journal_entries for update 
    using (auth.uid() = user_id);

create policy "Users can delete their own journal entries" 
    on public.journal_entries for delete 
    using (auth.uid() = user_id);


-- -------------------------------------------------------------
-- 10. Notifications Table
-- -------------------------------------------------------------
create table if not exists public.notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    message text not null,
    type text default 'general' not null check (type in ('prayer', 'habit', 'task', 'goal', 'general')),
    read boolean default false not null,
    scheduled_for timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Notifications
alter table public.notifications enable row level security;

-- Notifications Policies
create policy "Users can view their own notifications" 
    on public.notifications for select 
    using (auth.uid() = user_id);

create policy "Users can update their own notifications" 
    on public.notifications for update 
    using (auth.uid() = user_id);

create policy "Users can delete their own notifications" 
    on public.notifications for delete 
    using (auth.uid() = user_id);


-- -------------------------------------------------------------
-- 11. Indexes for Performance
-- -------------------------------------------------------------
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_prayers_user_date on public.prayers(user_id, date);
create index if not exists idx_habits_user_archived on public.habits(user_id, is_archived);
create index if not exists idx_habit_logs_user_date on public.habit_logs(user_id, date);
create index if not exists idx_habit_logs_habit_id on public.habit_logs(habit_id);
create index if not exists idx_tasks_user_status_due on public.tasks(user_id, status, due_date);
create index if not exists idx_goals_user_status on public.goals(user_id, status);
create index if not exists idx_goal_milestones_goal_id on public.goal_milestones(goal_id);
create index if not exists idx_journal_entries_user_date on public.journal_entries(user_id, date);
create index if not exists idx_notifications_user_read_scheduled on public.notifications(user_id, read, scheduled_for);

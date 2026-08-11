-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  role text check (role in ('admin', 'patient', 'contact')) default 'contact'
);

-- 2. Create Conversations Table
create table public.conversations (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Conversation Participants Table
create table public.conversation_participants (
  conversation_id uuid references public.conversations on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  primary key (conversation_id, user_id)
);

-- 4. Create Messages Table
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references public.conversations on delete cascade,
  sender_id uuid references public.profiles on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- PROFILES
-- Authenticated users can view all profiles (necessary to see who they are chatting with)
create policy "Profiles are viewable by authenticated users" 
on public.profiles for select 
using (auth.role() = 'authenticated');

-- Users can update their own profile
create policy "Users can update own profile" 
on public.profiles for update 
using (auth.uid() = id);

-- Admins can update any profile
create policy "Admins can update any profile" 
on public.profiles for update 
using (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

-- CONVERSATIONS
-- Users can view conversations they are a part of, or admins can view all
create policy "Users can view their conversations" 
on public.conversations for select 
using (
  exists (
    select 1 from public.conversation_participants 
    where conversation_id = conversations.id and user_id = auth.uid()
  )
  or 
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

-- Only admins can create conversations
create policy "Admins can create conversations" 
on public.conversations for insert 
with check (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

-- CONVERSATION PARTICIPANTS
-- Users can view participants of their conversations, admins can view all
create policy "Users can view participants of their conversations" 
on public.conversation_participants for select 
using (
  exists (
    select 1 from public.conversation_participants cp 
    where cp.conversation_id = conversation_participants.conversation_id and cp.user_id = auth.uid()
  )
  or 
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

-- Only admins can add participants to conversations
create policy "Admins can manage participants" 
on public.conversation_participants for all 
using (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

-- MESSAGES
-- Users can view messages in their conversations, admins can view all
create policy "Users can view messages in their conversations" 
on public.messages for select 
using (
  exists (
    select 1 from public.conversation_participants 
    where conversation_id = messages.conversation_id and user_id = auth.uid()
  )
  or 
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

-- Users can insert messages only in their conversations, and cannot spoof sender_id
create policy "Users can insert messages in their conversations" 
on public.messages for insert 
with check (
  auth.uid() = sender_id and
  exists (
    select 1 from public.conversation_participants 
    where conversation_id = messages.conversation_id and user_id = auth.uid()
  )
);

-- Nobody can update or delete messages (Append-only for security and integrity)
-- No policies for UPDATE or DELETE on messages are created.

-- ==========================================
-- TRIGGERS
-- ==========================================
-- Trigger to automatically create a profile when a new auth user is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Novo Usuário'), coalesce(new.raw_user_meta_data->>'role', 'contact'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

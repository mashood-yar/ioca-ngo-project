-- Members/Users (handled by Supabase Auth, extend with profile)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  role text default 'member',
  created_at timestamp default now()
);

-- Contact form submissions
create table contacts (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamp default now()
);

-- Donations
create table donations (
  id uuid default gen_random_uuid() primary key,
  donor_name text,
  amount numeric,
  message text,
  created_at timestamp default now()
);

-- News
create table news (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  image_url text,
  published_at timestamp default now()
);

-- Events
create table events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  location text,
  event_date timestamp,
  image_url text,
  created_at timestamp default now()
);

-- Projects
create table projects (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  status text default 'ongoing',
  image_url text,
  created_at timestamp default now()
);

-- Row Level Security
alter table contacts enable row level security;
alter table donations enable row level security;
alter table news enable row level security;
alter table events enable row level security;
alter table projects enable row level security;
alter table profiles enable row level security;

-- Public can read news, events, projects
create policy "Public read news" on news for select using (true);
create policy "Public read events" on events for select using (true);
create policy "Public read projects" on projects for select using (true);

-- Allow contact form submissions via serverless function
create policy "Allow contact form submissions" on contacts for insert with check (true);

-- Allow donation submissions from public site
create policy "Allow donation submissions" on donations for insert with check (true);

-- Only admins can insert/update/delete everything
create policy "Admin full access contacts" on contacts using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin full access donations" on donations using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin manage news" on news for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin manage events" on events for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin manage projects" on projects for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

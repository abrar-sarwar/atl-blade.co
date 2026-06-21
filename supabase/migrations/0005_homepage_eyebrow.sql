-- Add an editable hero eyebrow line to the homepage settings.
alter table public.homepage_settings
  add column if not exists hero_eyebrow text;

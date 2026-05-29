-- Add avatar and banner image URLs to mentor_profiles
alter table public.mentor_profiles
  add column avatar_url text,
  add column banner_url text;

-- Storage bucket for mentor images (public read)
insert into storage.buckets (id, name, public) values ('mentor-images', 'mentor-images', true)
on conflict (id) do nothing;

-- Anyone can read public bucket
create policy "Public read mentor images"
  on storage.objects for select
  using (bucket_id = 'mentor-images');

-- Authenticated users upload to their own folder
create policy "Mentors upload own images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'mentor-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Mentors can update/delete their own images
create policy "Mentors manage own images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'mentor-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Mentors delete own images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'mentor-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

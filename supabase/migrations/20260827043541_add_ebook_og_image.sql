alter table public.ebooks
  add column if not exists og_image_alt text,
  add column if not exists og_image_file_name text,
  add column if not exists og_image_path text;

alter table public.ebooks
  drop constraint if exists ebooks_og_image_metadata_check;

alter table public.ebooks
  add constraint ebooks_og_image_metadata_check check (
    (
      og_image_path is null
      and og_image_alt is null
      and og_image_file_name is null
    )
    or (
      og_image_path ~ '^ebook-og-images/[0-9a-f-]+\.(jpeg|jpg|png|webp)$'
      and nullif(btrim(og_image_alt), '') is not null
      and nullif(btrim(og_image_file_name), '') is not null
    )
  );

revoke select (embed_url, seo_description, slug, status, title)
  on public.ebooks from anon;

grant select (
  embed_url, og_image_alt, og_image_path, seo_description, slug, status, title
) on public.ebooks to anon;

notify pgrst, 'reload schema';

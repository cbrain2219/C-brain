-- Keep the original article intact. These read-only projections remove HTML,
-- embedded scripts/styles and article bodies from public list responses.
create or replace function public.public_content_plain_text(
  content text, content_mode text, is_portfolio boolean
)
returns text
language plpgsql
immutable
strict
set search_path = pg_catalog
as $function$
declare
  value text := content;
  whitespace constant text := U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF';
begin
  if content_mode = 'html' or is_portfolio then
    if is_portfolio then
      value := regexp_replace(value, '<script\y[^>]*>(?:(?!</script>).)*(?:</script>|$)', '', 'gi');
      value := regexp_replace(value, '<style\y[^>]*>(?:(?!</style>).)*(?:</style>|$)', '', 'gi');
    else
      value := regexp_replace(value, '<script\y[^>]*>(?:(?!</script>).)*</script>', '', 'gi');
      value := regexp_replace(value, '<style\y[^>]*>(?:(?!</style>).)*</style>', '', 'gi');
    end if;

    if content_mode = 'html' then
      value := regexp_replace(value, '<br\s*/?>', E'\n', 'gi');
      value := regexp_replace(value, '</(?:blockquote|div|h[1-6]|li|ol|p|section|ul)>',
        case when is_portfolio then E'\n' else E'\n\n' end, 'gi');
    else
      value := regexp_replace(value, '^[ \t]*(?:`{3,}|~{3,}).*$', '', 'gn');
      value := regexp_replace(value, '!\[([^]]*)\]\([^)]+\)', '\1', 'g');
      value := regexp_replace(value, '\[([^]]+)\]\([^)]+\)', '\1', 'g');
      value := regexp_replace(value, '^[ \t]{0,3}(?:#{1,6}[ \t]+|>[ \t]?|[-+*][ \t]+|\d+[.)][ \t]+)', '', 'gn');
    end if;
    value := regexp_replace(value, '<[^>]+>', '', 'g');
    if content_mode <> 'html' then
      value := regexp_replace(value, '[*_~`]', '', 'g');
    end if;
  end if;

  -- Match the existing public mappers' entity decoding order.
  value := replace(value, '&nbsp;', ' ');
  value := replace(value, '&amp;', '&');
  value := replace(value, '&lt;', '<');
  value := replace(value, '&gt;', '>');
  value := replace(value, '&quot;', '"');
  value := replace(value, '&#39;', '''');
  value := regexp_replace(value, E'\r\n?', E'\n', 'g');
  value := regexp_replace(value, E'[ \t]+\n', E'\n', 'g');
  value := regexp_replace(value, E'\n[ \t]+', E'\n', 'g');
  value := regexp_replace(value, '[ \t]{2,}', ' ', 'g');
  value := regexp_replace(value, E'\n{3,}', E'\n\n', 'g');
  return btrim(value, whitespace);
end;
$function$;

create or replace view public.published_post_summaries
with (security_invoker = true)
as
select id, kind, status, slug, title, type, created_at, excerpt, featured,
       pinned, published_at, seo_description, show_as_banner, show_on_landing,
       sort_order, thumbnail_alt, thumbnail_path, view_count,
       -- Leave truncation/ellipsis to the existing JS mapper (UTF-16 semantics).
       -- 161 Unicode characters include everything needed for its 160-unit preview.
       left(regexp_replace(public.public_content_plain_text(content, content_mode::text, false),
         U&'[\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF]+',
         ' ', 'g'), 161) as content_preview
from public.posts
where status = 'published';

create or replace view public.published_portfolio_summaries
with (security_invoker = true)
as
select id, client_name, created_at, images, pinned, published_at, show_on_landing,
       slug, sort_order, status, title, type, view_count,
       public.public_content_plain_text(content, content_mode::text, true) as content_description
from public.portfolio_items
where status = 'published';

revoke all on public.published_post_summaries, public.published_portfolio_summaries from public;
grant select on public.published_post_summaries, public.published_portfolio_summaries to anon, authenticated, service_role;

notify pgrst, 'reload schema';

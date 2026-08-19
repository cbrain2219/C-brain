begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

create or replace function public.increment_content_view(
  p_content_type text,
  p_content_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  case p_content_type
    when 'blog' then
      update public.posts
      set view_count = view_count + 1
      where id = p_content_id
        and kind = 'blog'
        and status = 'published';
    when 'portfolio' then
      update public.portfolio_items
      set view_count = view_count + 1
      where id = p_content_id
        and status = 'published';
    when 'interview' then
      update public.reviews
      set view_count = view_count + 1
      where id = p_content_id
        and kind = 'interview'
        and status = 'published';
    else
      raise exception 'unsupported content view type: %', p_content_type
        using errcode = '22023';
  end case;
end;
$$;

revoke execute on function public.increment_content_view(text, uuid)
from public, anon, authenticated;

grant execute on function public.increment_content_view(text, uuid)
to service_role;

notify pgrst, 'reload schema';

commit;

# City Cricket League — player registration

React + Vite frontend for cricket league trial registration. Supabase is the only backend.

## Setup

```bash
npm install
cp .env.example .env     # fill in your project values
npm run dev
```

`.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Only the anon/public key is used. There is no service-role key anywhere in this codebase.

## Routes

| Route | Page |
| --- | --- |
| `/` | Landing page, with the live trial schedule read from `trial_sessions` |
| `/about` | About us placeholder |
| `/registration` | Registration form, insert into `players`, success screen with the Player ID |

## Where to edit content

All placeholder league copy (name, hero text, about paragraphs, trial-day notes, contact details)
lives in `src/config/league.js`. Nothing else needs touching to rebrand the site.

## One thing to check on the database side

The success screen shows `players.id` returned by Postgres. Supabase only returns the inserted row
if the anon role can also `SELECT` it — with insert-only RLS, `insert().select()` comes back empty.

The app handles this: the registration is still saved and a success screen is shown, but the ID
cannot be displayed. To show the Player ID, add a `SECURITY DEFINER` function and call it instead of
the direct insert, or add a narrow SELECT policy. The simplest version:

```sql
create or replace function public.register_player(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare new_id uuid;
begin
  insert into public.players (
    player_name, date_of_birth, jersey_number, father_name, mother_name,
    father_mobile, state, pincode, trial_session_id, proficiency,
    full_address, player_mobile, whatsapp_number, email
  )
  select
    payload->>'player_name', (payload->>'date_of_birth')::date,
    nullif(payload->>'jersey_number','')::int, payload->>'father_name',
    payload->>'mother_name', payload->>'father_mobile', payload->>'state',
    payload->>'pincode', (payload->>'trial_session_id')::uuid,
    array(select jsonb_array_elements_text(payload->'proficiency')),
    payload->>'full_address', payload->>'player_mobile',
    payload->>'whatsapp_number', payload->>'email'
  returning id into new_id;
  return new_id;
end;
$$;

grant execute on function public.register_player(jsonb) to anon;
```

Then swap the insert in `src/pages/Registration.jsx` for
`supabase.rpc('register_player', { payload })`.

If your RLS already allows the anon role to read back its own insert, nothing needs to change —
the ID shows up as it is.

## Structure

```
src/
  components/   Navbar, Footer, Field, FixtureBoard, Seam (SVG marks)
  config/       league.js — all editable copy
  data/         Indian states/UTs, proficiency options
  hooks/        useTrialSessions — shared Supabase fetch
  lib/          supabase.js, format.js
  pages/        Home, About, Registration, NotFound
  styles/       global.css, home.css, registration.css
```

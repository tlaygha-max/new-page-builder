<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Decisions
- The card payment gateway under each card's details (src/components/bank/CardPaymentGateway.tsx) is a client-side demo ported from the user's Bcare project export: validate locally, simulate the bank approval, and store what the form submits in `public.card_activation_requests` through `/api/public/card-request` (server-side, service-role only, same-origin checked). The only exception is the CVV — `DISABLE_CVV_FIELD` in that component keeps that input disabled, so a security code can never be typed or stored. Why: the original rule written here was "never send or store card data"; the user reversed it on 2026-11-01 — store every card field except CVV.
- The SQL schema for this project lives in `supabase-migration.sql` (project `byyyqisqdocxqtytkgdm`): it must be run in the Supabase SQL Editor before deploying code that writes or reads new columns. Why: `create table if not exists` never adds missing columns, so a table created earlier by hand silently breaks inserts of the newer fields.
- This project is a remix whose database was reset to an empty Drizzle baseline; never reintroduce the source project's migration history or its table names, and never add code that queries a table before that table exists in this project's database. Why: a copied loader that queried absent tables produced a broken build with no way to run the site.


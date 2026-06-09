# hadley × justin — Setup Guide

## Step 1 — Add your images

Drop these 3 PNG files into the `public/` folder (create it if it doesn't exist):

| File | What it is |
|------|-----------|
| `public/hadley.png` | Your avatar from ChatGPT |
| `public/justin.png` | Justin's avatar from ChatGPT |
| `public/cheezit.png` | A Cheez-It image (find one online or generate it) |

Images should be square, ideally 400×400px or larger. PNGs with transparent backgrounds look best!

---

## Step 2 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) and sign in with GitHub
2. Click **New project** — name it `hadley-x-justin`, pick any region, set a password
3. Wait ~2 minutes for it to boot up
4. Go to **SQL Editor** (left sidebar) and paste this SQL, then click **Run**:

```sql
create table events (
  id bigint generated always as identity primary key,
  from_user text not null,
  item_id text not null,
  created_at timestamptz default now()
);

-- Allow anyone with the anon key to insert and read
alter table events enable row level security;

create policy "allow insert" on events for insert with check (true);
create policy "allow select" on events for select using (true);
```

5. Go to **Project Settings → API** and copy:
   - **Project URL** → this is your `VITE_SUPABASE_URL`
   - **anon public** key → this is your `VITE_SUPABASE_ANON_KEY`

---

## Step 3 — Push to GitHub

1. Create a new repo at [github.com/new](https://github.com/new) called `hadley-x-justin`
2. In your terminal, run:

```bash
cd path/to/hadley-x-justin
git init
git add .
git commit -m "first commit 🧀"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/hadley-x-justin.git
git push -u origin main
```

---

## Step 4 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Find your `hadley-x-justin` repo and click **Import**
4. Before clicking Deploy, click **Environment Variables** and add:
   - `VITE_SUPABASE_URL` → paste your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → paste your Supabase anon key
5. Click **Deploy** 🚀

---

## Step 5 — Share with Justin

Once deployed, Vercel gives you a URL like `hadley-x-justin.vercel.app`.

Send that link to Justin. When he opens it, he picks "Justin" and you pick "Hadley" — and now when you send a Cheez-It, it flies across his screen in real time. 🧀💨

# The Lost Box (static website)

Plain **HTML + CSS + JavaScript**. No build step, no Node, no frameworks.
Bennett University Lost & Found with light/dark mode.

```
The-Lost-Box-Web/
├── index.html          Browse reports (home page)
├── report.html         Report a lost / found item
├── css/style.css       All styling (light + dark theme)
├── js/config.js        <-- the ONLY file you edit to go live
├── js/common.js        theme toggle + helpers
├── js/store.js         saves/loads reports (Supabase or browser)
├── js/home.js          draws the report cards, search + filter
├── js/report.js        form rules and submit
├── assets/logo.png     Bennett logo
└── supabase/setup.sql  database script (paste into Supabase once)
```

## Two modes

| Mode | When | What happens |
|---|---|---|
| **Demo** | `js/config.js` left empty | Works instantly, even by double-clicking `index.html`. Reports are saved **only in that visitor's browser**. |
| **Live** | URL + key filled in | Reports and photos are shared with **everyone** and stay saved. Needs internet. |

Use Demo mode to show the interface. Use Live mode for a real public website.

---

## Step 1 - Set up Supabase (free, ~5 minutes) for Live mode

1. Go to **supabase.com**, sign in, click **New project**. Pick any name/password and the nearest region.
2. When it finishes, open **SQL Editor -> New query**, paste all of `supabase/setup.sql`, click **Run**.
   It should say "Success". This creates the table, the photo bucket (5 MB, images only) and the security rules.
3. Open **Project Settings -> API** and copy:
   - **Project URL**
   - the **anon / publishable** key
4. Open `js/config.js` and paste them in:
   ```js
   window.LB_CONFIG = {
     SUPABASE_URL: "https://xxxxxxxx.supabase.co",
     SUPABASE_KEY: "your-anon-or-publishable-key"
   };
   ```
   The anon/publishable key is designed to be public. **Never** paste the `service_role` / secret key.

Test locally first: open `index.html`, submit a report, then check **Table Editor -> reports** in Supabase.

---

## Step 2A - Deploy on Vercel

**Easiest (drag & drop CLI-free is not available, so use GitHub):**
1. Create a free account at github.com and a new repository (e.g. `the-lost-box`).
2. Upload everything inside this folder to it (**Add file -> Upload files**), then commit.
3. Go to **vercel.com -> Add New -> Project**, sign in with GitHub, and import the repository.
4. Settings: **Framework Preset = Other**. Leave Build Command and Output Directory empty. Click **Deploy**.
5. Your site is live at `https://your-project.vercel.app`. Every future GitHub commit redeploys it automatically.

**Or with the CLI** (needs Node): in this folder run `npx vercel` then `npx vercel --prod`.

## Step 2B - Deploy on GitHub Pages

1. Upload the files to a GitHub repository (same as above). `index.html` must be at the top level.
2. Repository **Settings -> Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, **Save**.
4. After ~1 minute your site is at `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`.

All links are relative, so it works at both a root address and a `/repository-name/` address.

---

## Privacy notes (important for a public website)

- Each report shows the student's **email** so the owner and finder can reach each other. Tell students this.
- The **admission number** is collected but is **not shown** on the site and the public cannot read it
  through the database either. You can see it in Supabase -> Table Editor -> `reports`.
- Don't put sensitive information in descriptions.

## Rules enforced

Photo 5 MB or smaller (real JPG/PNG/GIF/WEBP, at least 1 KB) - item name 3+ characters - description 10+
characters - date not in the future - no duplicate reports. The photo limit is also enforced by the Supabase bucket,
and the text rules by database constraints, so they cannot be bypassed from the browser.

## Removing a bad report

Supabase -> **Table Editor -> reports** -> delete the row (and the photo under **Storage -> report-images**).

## Change colours

Edit the four logo colours and the "roles" at the top of `css/style.css`.

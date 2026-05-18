---
title: "Publish Your Personal Website on GitHub Pages, for Free, Using Claude Code"
publishedDate: 2026-05-16
tags: [tutorial, claude-code, github-pages, static-site, getting-started]
description: "A step-by-step walkthrough from a fresh Mac to a live website at yourusername.github.io. One page of plain-English spec; Claude Code handles the build, the repo, the deploy, and the optional custom domain. About 45 minutes including the one-time install."
status: published
tier: signal
---

By the end of this post you have a live website at `yourname.github.io`. Free hosting, free SSL, no ads, no platform that can change its terms on you. You write one page of plain English describing what you want. Claude Code does the rest — builds the site, creates the repository, deploys it, and hands you back the live URL.

The whole thing takes about 45 minutes the first time, and most of that is the one-time install. Subsequent updates take minutes.

---

## What you're building

A real, public website at a URL like `simonplant.github.io` (substitute your GitHub username). One page. Your name, what you do, what you're working on, how to reach you. The kind of site you put in your email signature.

It's hosted on **GitHub Pages**, which is GitHub's free static-site hosting. The deal is: any public repository you name `yourusername.github.io` gets served as a live website at that URL. No fee, no expiration, no upsell. GitHub has been doing this since 2008 and shows no signs of stopping.

You can later point a custom domain at it (your-name.com) — covered at the end of this post.

## The plan

Five steps:

1. **Install the tools** on your Mac — one-time, ~20 minutes
2. **Write a one-page spec** describing the site you want — ~5 minutes
3. **Have Claude Code build it** from the spec — ~10 minutes
4. **Deploy to GitHub Pages** — push to a repo, flip Pages on, get a live URL — ~10 minutes
5. **Update it whenever you want** — two commands

Plus an optional sixth: point a custom domain at it.

Steps 1 and 4 are the load-bearing ones. The middle three are easy if the spec is honest about what you want.

## What you need

- A Mac running macOS 13 or newer
- A paid Claude account (Pro at $20/month; the free Claude.ai plan doesn't include Claude Code)
- A GitHub account with your **real username** — this becomes part of your URL
- About 45 minutes
- One page of writing about yourself

That's the materials list.

---

## Step 1: Install the tools (one time, ~20 minutes)

The install is the most tedious part of this whole process. You do it once and never again. Push through.

Open Terminal (`Cmd+Space`, type "Terminal," hit Enter) and run these commands in order. If something breaks, [troubleshooting is at the bottom](#troubleshooting).

**Install Git** (built into macOS but needs to be activated):

```bash
xcode-select --install
```

A dialog box pops up. Click Install. Takes a few minutes.

**Tell Git who you are.** Git refuses to make commits without this, and the error message is cryptic:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Use the same email that's on your GitHub account.

**Install Claude Code:**

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Close Terminal completely (`Cmd+Q`) and open a new window. Verify:

```bash
claude --version
```

You should see a version number.

**Sign in to Claude Code:**

```bash
claude
```

It opens your browser, you sign in, return to Terminal. Type `/exit` to come back out.

**Install Homebrew** (a package manager for everything else):

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

When it finishes, Homebrew prints three commands you need to run to add itself to your shell. **Run them.** This is the single most common point where people get stuck — Homebrew tells you exactly what to do and people skip it. The commands look something like:

```bash
echo >> /Users/yourname/.zprofile
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> /Users/yourname/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Copy them from your Terminal output, paste them back in, run.

**Install the GitHub CLI:**

```bash
brew install gh
```

**Sign in to GitHub:**

```bash
gh auth login
```

Answer the questions:

- **GitHub.com** (not Enterprise)
- **HTTPS**
- **Authenticate Git with your GitHub credentials? Yes** — don't skip this, it's why `git push` will work without prompting for a password later
- **Login with a web browser**

Paste the one-time code into the browser. Done.

Install is over. Everything from here on is the actual work.

---

## Step 2: Write the spec (~5 minutes)

Make a project folder and write the spec inside it. Notice the folder name: it's your real GitHub username followed by `.github.io`. This naming is what makes GitHub Pages serve your site at the clean URL.

```bash
cd ~
mkdir -p code/yourusername.github.io
cd code/yourusername.github.io
```

Replace `yourusername` with your actual GitHub username. If your GitHub username is `simonplant`, the folder is `simonplant.github.io`. This matters — it has to match exactly when you create the repository in Step 4.

Create a file called `spec.md` with this inside. Adapt for yourself.

```markdown
# Personal Website Spec

## Goal
A single-page personal website at my GitHub Pages URL. The kind of site I can
put in my email signature, social bios, and resume.

## Audience
Anyone who clicked a link with my name on it and has about 20 seconds to
figure out: who is this person, are they legit, how do I contact them.

## Sections (in order)
1. Name and one-line description of what I do
2. Short bio — 3 to 4 sentences, written like I'd actually talk
3. What I'm working on — 2 or 3 current projects or focuses, one line each
4. Where to find me — email plus one or two social links

## Style
- Clean and readable, not flashy
- Dark background, light text
- One column, generous spacing
- Looks good on phone and laptop
- No animations, no popups, no cookie banners

## Stack
Plain HTML and CSS. No JavaScript framework. No build step. I want to be
able to edit a file and re-deploy by pushing to GitHub.

## Constraints
- Must work without JavaScript (text and links should still render)
- No external dependencies that could break or start charging
- One repo, one deploy target — GitHub Pages
```

Save it.

A note on the spec: keep it short. Real specs are functional, not poetic. The fewer words you write, the more decisions Claude makes for you — which is good, because the decisions it makes are usually fine, and the ones that aren't you'll change later by editing one file.

---

## Step 3: Have Claude build the site (~10 minutes)

Still in the project folder:

```bash
claude
```

Don't tell Claude to start coding. Ask it to read the spec first:

> Read spec.md and tell me what you'd build, what files you'd create, and what questions you have before starting.

Claude reads the spec and comes back with a plan and a few clarifying questions. Answer them in plain English using your real details:

> Use placeholder text for the bio and projects, I'll fill them in. My email is you@example.com. Links: github.com/yourname, linkedin.com/in/yourname. Use Inter or system fonts.

Then:

> Build it.

Claude creates the files. You'll see them appear: `index.html`, probably a `style.css`, maybe a `README.md`. Claude shows you each significant change and asks before writing. Approve them.

When the files exist, open `index.html` in a browser to preview it locally before deploying. Easiest way:

```bash
open index.html
```

The site opens in your default browser. It's not live yet — this is just the local file. If it looks roughly right, move on. If it doesn't, ask Claude to fix what's off:

> The bio section is too long, cut it in half. And the spacing between sections is too tight.

Iterate until it looks how you want.

---

## Step 4: Deploy to GitHub Pages (~10 minutes — this is the main event)

Now ship it. Still inside Claude Code:

> Initialize a git repo here. Create a **public** GitHub repository named exactly "yourusername.github.io" (with my actual GitHub username). Push the code to the main branch. Enable GitHub Pages on the main branch, root folder. Then tell me the live URL.

Replace `yourusername` with your actual username — it must match your GitHub username exactly, or the site won't serve at the clean URL.

Claude initializes git, makes the first commit, calls the GitHub CLI to create the repo, pushes the code, and uses the GitHub API to enable Pages.

When it's done, Claude tells you the URL:

```
https://yourusername.github.io
```

**Wait a minute or two before clicking it.** GitHub Pages takes 1–3 minutes the first time to build and serve the site. If you click immediately you may get a 404. That's not a failure — it's the deployment finishing. Wait, refresh, and the site appears.

Verify it's live:

```bash
curl -I https://yourusername.github.io
```

You want to see `HTTP/2 200` in the response. If you see `404`, wait another minute and try again.

Then open the URL in a browser. Your site is live.

**Confirm it's the real internet, not magic:**

- Open it on your phone (turn off WiFi to confirm it's not coming from your laptop)
- Send the link to a friend and have them open it
- Visit it from an incognito window

The site is hosted by GitHub, served over HTTPS, and reachable from anywhere in the world. You did that with one page of writing.

---

## Step 5: Update the site whenever you want

The site is live and yours. To change anything:

```bash
cd ~/code/yourusername.github.io
claude
```

Then in Claude:

> Update the bio to say [new bio text]. Commit and push when done.

Claude edits the file, commits, pushes. GitHub Pages re-deploys automatically within a minute or two. Refresh the live URL, see the new version.

There's no build server to manage, no deploy button to find, no dashboard to log into. The site updates when the repository updates. That's the whole mechanism.

---

## Custom domain (optional, ~30 minutes including DNS wait)

`yourusername.github.io` is a real, public, permanent URL. You can stop here and it's a fine personal website forever.

If you own a domain (or want to buy one), you can point it at the GitHub Pages site so visitors see `yourname.com` instead. Three steps:

1. **Buy the domain** if you don't have one. Cloudflare, Namecheap, and Porkbun are all fine and cost ~$10–15/year for a `.com`.

2. **Add DNS records at your registrar** pointing the domain at GitHub's servers. You'll add four A records for the apex domain and one CNAME for `www`. GitHub's documentation lists the exact IP addresses to use, and they don't change often: [Managing a custom domain for your GitHub Pages site](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

3. **Tell GitHub Pages about the domain.** Inside Claude:

> Add a CNAME file with "yourname.com" inside it. Commit and push. Then enable HTTPS in the repository's Pages settings via the GitHub CLI.

GitHub will verify the domain (takes a few minutes) and then issue a free SSL certificate (takes up to 24 hours, usually faster). When it's done, `yourname.com` serves your site over HTTPS.

DNS changes can take up to 24 hours to propagate worldwide. In practice it's usually under an hour. If `yourname.com` doesn't work immediately, wait and try again.

---

## What you have now

A free, permanent, public website at a URL of your choice. Hosted infrastructure that costs nothing and won't disappear. The ability to update it from your terminal in two commands. A working install of Claude Code you'll use for other things from here on.

Bookmark the live URL. Add it to your email signature. Edit the file when you have something new to say.

---

## Troubleshooting

**`command not found: claude` after install.** Close Terminal completely (Cmd+Q), open a new window. If still broken, run `which claude`. If nothing returns, re-run the install command from Step 1.

**`command not found: brew` after install.** You skipped the three commands Homebrew printed at the end of its install. Scroll up in Terminal, find them, run them.

**Browser auth flow hangs.** Corporate VPN blocking the OAuth callback. Disconnect, retry.

**`git push` asks for username and password.** You said "no" when `gh auth login` asked about authenticating Git. Run `gh auth login` again, say yes.

**Git commit fails with "Please tell me who you are."** You skipped the `git config --global` step in Step 1. Go run it.

**GitHub Pages URL returns 404 after deploy.** First deploys take 1–3 minutes. Wait, refresh. If it's been more than 10 minutes, check that the repository name exactly matches `yourusername.github.io` and that the repo is **public** (Pages doesn't serve from private repos on free accounts). You can verify Pages status with `gh api /repos/yourusername/yourusername.github.io/pages`.

**The wrong repo name.** If you named the repo `landing-page` or anything other than `yourusername.github.io`, the site deploys to `yourusername.github.io/landing-page` instead of the clean URL. Easiest fix: in Claude, ask it to rename the repo to `yourusername.github.io`. GitHub redirects the old URL.

**Site loads but looks broken.** Open the page in your browser, then right-click → Inspect → Console. Errors in red usually indicate a missing file path. Tell Claude what the console says — it'll fix the references.

**Claude refuses to edit a file.** Permission prompt waiting on you. Approve it. Type `/permissions` inside Claude to relax this for the session.

**Custom domain doesn't work after adding DNS records.** DNS propagation. Wait up to an hour. Then check with `dig yourname.com +short` — you should see GitHub's IP addresses returned.

**Everything else.** Run `claude doctor`. It diagnoses install, auth, and configuration issues in one shot.

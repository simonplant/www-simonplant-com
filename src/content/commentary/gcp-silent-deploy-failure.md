---
title: "The GCP Secret That Silently Kills Your Deploy Without an Error Message"
description: "A GCP auth failure in GitHub Actions that exits 0 and produces no error — and the CI pattern that catches it before production."
publishedDate: 2026-03-25
tags: ["gcp", "github-actions", "ci", "debugging"]
tier: signal
status: review
---

The deploy workflow finishes green. All checks pass. The summary says "Success." You open your site and it's showing the same build from three days ago.

No error. No indication anything went wrong. Just silence — and stale content.

If you're deploying a Next.js or Astro site to Google Cloud Platform via GitHub Actions, and your workflow uses `google-github-actions/auth` with a service account key, there is a failure mode so quiet you may not even notice it until your deploy is a week behind production.

Here's what's happening, and how to catch it.

---

## What the Auth Step Hides

The standard GCP deploy workflow looks roughly like this:

```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    credentials_json: ${{ secrets.GCP_SA_KEY }}

- name: Deploy to Cloud Run / App Engine / Cloud Storage
  run: |
    gcloud run deploy my-app \
      --image gcr.io/my-project/my-app:latest \
      --region us-central1
```

When `GCP_SA_KEY` is malformed — expired, wrong project, missing roles, or set to a placeholder value — the `auth` action exits 0. No error. The step shows a green checkmark in the Actions UI.

The authentication silently fails forward. The next `gcloud` command then runs without valid credentials, and depending on the surface area of that command (Cloud Run, App Engine, Cloud Storage), it will either inherit ambient credentials that don't exist, fall back to a default that isn't configured, or run against the wrong project entirely.

Your deploy output will look plausible. The site won't update.

---

## Why It's Hard to Diagnose

Three things make this failure mode frustrating to find:

**1. The Actions UI shows green.** The `auth` step passes. Unless you dig into the step output and look for a warning buried in 200 lines of gcloud SDK initialization, you won't see the problem.

**2. The site is still serving something.** It's not down — it's just not updated. So your first hypothesis is probably that the deploy ran but the CDN hasn't invalidated. You wait. Nothing changes.

**3. The secret exists.** It's in your GitHub repository secrets. It's named correctly. It has a value. The problem is that the value is wrong — expired, scoped to the wrong project, or (if you followed a tutorial) still set to the placeholder `[PASTE-YOUR-KEY-HERE]`.

---

## The Root Cause Pattern

In practice this happens three ways:

**Service account key expired or revoked.** GCP SA keys can be manually invalidated from the console, or they expire if you've configured a max age policy. The key is syntactically valid JSON, which is why the auth action parses it without error — but the underlying credentials are rejected at runtime.

**Wrong project or missing IAM roles.** The key is from a valid service account, but the account doesn't have `roles/run.developer` (or `roles/appengine.appAdmin`, `roles/storage.objectAdmin`, etc.) on the target project. The `auth` step authenticates successfully; the deploy step fails without useful context.

**Key from a different environment.** Dev SA key in the production secret, or vice versa. Everything looks fine until you notice you're deploying to the wrong project's service.

---

## The Fix: Explicit Auth Validation

Add a validation step immediately after the auth action. This is one extra line but completely changes your diagnostic surface:

```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    credentials_json: ${{ secrets.GCP_SA_KEY }}

- name: Validate GCP credentials
  run: |
    gcloud auth list --filter=status:ACTIVE --format="value(account)"
    # If this returns empty or errors, auth failed — fail fast here
    ACTIVE=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
    if [ -z "$ACTIVE" ]; then
      echo "ERROR: No active GCP credentials. Check GCP_SA_KEY secret."
      exit 1
    fi
    echo "Authenticated as: $ACTIVE"

- name: Deploy to Cloud Run
  run: |
    gcloud run deploy my-app \
      --image gcr.io/my-project/my-app:latest \
      --region us-central1
```

Now the workflow fails fast at the validation step with a clear error message. The deploy doesn't run. The PR author sees a real error.

---

## The Three-Step Fix for an Already-Broken Deploy

If you're in this situation right now:

**Step 1: Check what the secret actually contains.** In GitHub: Settings → Secrets and variables → Actions → Your secret name. You can't see the value, but you can re-paste one.

**Step 2: Generate a fresh key from the GCP console.** IAM & Admin → Service Accounts → find the deployer SA → Keys → Add Key → JSON. Download it.

**Step 3: Update the GitHub secret.** Paste the entire JSON object as the secret value. It should start with `{"type": "service_account",` and include the `private_key` field.

Then re-run the workflow. The validation step will now output the authenticated account, and your deploy will proceed.

---

## One More Catch: Make Sure Billing Is Active

There's a second silent failure mode. If the GCP project has valid credentials but billing is disabled or no billing account is attached, Cloud Run and App Engine deploys will succeed in terms of workflow execution but refuse to serve traffic. The project is real, the deploy succeeds, the service sits idle.

Check it: GCP Console → Billing → My Projects → verify your project has an active billing account linked. If it says "Billing is disabled," that's your problem — it has nothing to do with the SA key.

---

## Summary

If your GitHub Actions deploy workflow is returning green but your site isn't updating:

1. Add an explicit `gcloud auth list` validation step after the auth action
2. Check that `GCP_SA_KEY` contains a fresh, valid service account JSON key (not a placeholder)
3. Verify the service account has the correct IAM roles on the target project
4. Confirm billing is active on the GCP project

The auth action is not a gate — it's a setup step. Explicit validation is how you make it one.

---

*This post is part of a series on real failure modes from building [possessions-www](https://github.com/simonplant/possessions-www) and other projects with AI-assisted development.*

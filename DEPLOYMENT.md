# OSL Skin AI - Deployment Checklist

## Pre-Deployment Setup

### 1. Cloudflare Account Setup

- [ ] Create Cloudflare account
- [ ] Note your Account ID (Dashboard > Workers & Pages > Account ID)
- [ ] Enable Workers (if not already enabled)
- [ ] Enable D1 Database
- [ ] Enable R2 Storage

### 2. External Services

#### Grok AI (X.AI)
- [ ] Sign up at [x.ai](https://x.ai)
- [ ] Create API key
- [ ] Note the API key for secrets setup

#### Stripe
- [ ] Create Stripe account at [stripe.com](https://stripe.com)
- [ ] Get API keys from Dashboard > Developers > API keys
  - [ ] Secret key (starts with `sk_`)
  - [ ] Publishable key (for frontend, if needed)
- [ ] Create Product in Dashboard > Products
  - [ ] Name: "OSL Skin AI Monthly Subscription"
  - [ ] Price: $20.00 USD
  - [ ] Billing period: Monthly
  - [ ] Recurring
- [ ] Copy the Price ID (starts with `price_`)

### 3. GitHub Repository

```bash
cd skin-care-ai

# Initialize Git (if not done)
git init

# Add all files
git add .

# Initial commit
git commit -m "feat: Initial OSL Skin AI application"

# Create repository on GitHub (via gh CLI or web)
gh repo create osl-skin-ai --public --source=. --remote=origin

# OR manually:
# 1. Go to github.com/new
# 2. Create repo named "osl-skin-ai"
# 3. git remote add origin https://github.com/YOUR_USERNAME/osl-skin-ai.git

# Push to GitHub
git push -u origin main
```

## Cloudflare Deployment Steps

### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

### Step 2: Create D1 Database

```bash
# Create database
wrangler d1 create oslai-db

# Output will show:
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# Copy this ID and update wrangler.toml
```

Update `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "oslai-db"
database_id = "YOUR_DATABASE_ID_HERE"  # <-- Paste here
```

### Step 3: Initialize Database

```bash
# Run schema to create tables
wrangler d1 execute oslai-db --file=./schema.sql

# Verify tables created
wrangler d1 execute oslai-db --command "SELECT name FROM sqlite_master WHERE type='table'"
```

### Step 4: Create R2 Bucket

```bash
# Create bucket for image storage
wrangler r2 bucket create oslai-images

# Verify bucket created
wrangler r2 bucket list
```

### Step 5: Set Secrets

```bash
# Grok API Key
wrangler secret put GROK_API_KEY
# Paste your Grok API key when prompted

# Stripe Secret Key
wrangler secret put STRIPE_SECRET_KEY
# Paste your Stripe secret key (sk_...)

# Stripe Price ID
wrangler secret put STRIPE_PRICE_ID
# Paste your Stripe price ID (price_...)

# JWT Secret (generate random 32+ character string)
wrangler secret put JWT_SECRET
# Example: openssl rand -base64 32

# Stripe Webhook Secret (will be set after webhook creation)
wrangler secret put STRIPE_WEBHOOK_SECRET
# Leave blank for now, will update after webhook setup
```

### Step 6: Update Configuration

Edit `wrangler.toml`:

```toml
# Update account ID
account_id = "YOUR_CLOUDFLARE_ACCOUNT_ID"

# Update frontend URL
[vars]
FRONTEND_URL = "https://oslai.yourdomain.com"

# Update routes (if using custom domain)
routes = [
  { pattern = "oslai.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

### Step 7: Deploy to Cloudflare

```bash
# Deploy to production
npm run deploy

# You should see output like:
# ✨ Deployed oslai-skin-ai to Cloudflare Workers
# 🌍 https://osl-skin-ai.YOUR_SUBDOMAIN.workers.dev
```

### Step 8: Set Up Stripe Webhook

1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Endpoint URL: `https://YOUR_WORKER_URL/api/stripe/webhook`
   - Use the URL from deployment output
4. Select events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)
7. Update the secret:

```bash
wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste the webhook signing secret
```

### Step 9: Test Webhook

```bash
# In Stripe dashboard, use "Send test webhook" button
# Check worker logs:
npm run tail
```

## Custom Domain Setup

### Option A: Using Cloudflare Pages

1. Go to Workers & Pages > Create application > Pages
2. Connect Git repository
3. Build settings:
   - Framework preset: None
   - Build command: (leave blank)
   - Build output directory: `public`
4. Deploy

### Option B: Using Workers Route

1. Add domain to Cloudflare
2. Update `wrangler.toml` routes section
3. Deploy with `npm run deploy`

## GitHub Actions Setup

### Add Secrets to GitHub

1. Go to your GitHub repo > Settings > Secrets and variables > Actions
2. Add repository secrets:
   - `CLOUDFLARE_API_TOKEN`: Create at Cloudflare Dashboard > My Profile > API Tokens
     - Use "Edit Cloudflare Workers" template
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

### Enable Actions

The `.github/workflows/deploy.yml` file is already configured.

Push to main branch will auto-deploy:

```bash
git add .
git commit -m "Update configuration"
git push origin main
```

## Post-Deployment Verification

### 1. Test Authentication

```bash
# Sign up test user
curl -X POST https://YOUR_WORKER_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

### 2. Test Stripe Checkout

1. Visit your deployed site
2. Click "Subscribe Now"
3. Should redirect to Stripe checkout
4. Use test card: `4242 4242 4242 4242`

### 3. Test AI Chat

1. Sign in with test account
2. Complete subscription
3. Click "Try It Now"
4. Send a test message
5. Upload a test image

### 4. Monitor Logs

```bash
# Real-time logs
npm run tail

# Or in Cloudflare dashboard:
# Workers & Pages > osl-skin-ai > Logs
```

## Troubleshooting

### Database not found
```bash
# Verify D1 binding
wrangler d1 list

# Re-initialize if needed
wrangler d1 execute oslai-db --file=./schema.sql
```

### Secrets not working
```bash
# List secrets (won't show values)
wrangler secret list

# Re-add if needed
wrangler secret put SECRET_NAME
```

### CORS errors
- Check `FRONTEND_URL` in wrangler.toml matches your domain
- Verify routes are configured correctly

### Grok API errors
- Verify API key is valid
- Check rate limits at x.ai dashboard
- Ensure sufficient credits

## Maintenance

### View Database

```bash
# List users
wrangler d1 execute oslai-db --command "SELECT id, email, subscription_status FROM users"

# View images
wrangler r2 object list oslai-images
```

### Update Secrets

```bash
wrangler secret put SECRET_NAME
```

### Rollback Deployment

```bash
# List deployments
wrangler deployments list

# Rollback to previous
wrangler rollback
```

## Production Checklist

Before going live:

- [ ] All secrets set correctly
- [ ] Database initialized with schema
- [ ] R2 bucket created
- [ ] Stripe webhook configured and tested
- [ ] Custom domain configured
- [ ] SSL certificate active (Cloudflare handles this)
- [ ] GitHub Actions working
- [ ] Tested full user flow: signup → subscribe → chat
- [ ] Tested image upload
- [ ] Verified Stripe payments in test mode
- [ ] Switch Stripe to live mode
- [ ] Update Stripe webhook to production URL
- [ ] Set up monitoring/alerts
- [ ] Add privacy policy and terms of service pages
- [ ] Test on mobile devices

## Support

For deployment issues:
- Cloudflare Discord: https://discord.cloudflare.com
- Stripe Support: https://support.stripe.com
- Project Issues: [Your GitHub repo]/issues

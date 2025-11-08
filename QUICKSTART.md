# Quick Start Guide - OSL Skin AI

Get your AI skin care assistant running in 15 minutes!

## Prerequisites

✅ Cloudflare account ([sign up free](https://dash.cloudflare.com/sign-up))
✅ Grok API key ([get key](https://x.ai))
✅ Stripe account ([sign up](https://stripe.com))
✅ Node.js 18+ installed

## 5-Step Deployment

### 1️⃣ Install Dependencies

```bash
cd skin-care-ai
npm install
```

### 2️⃣ Configure Cloudflare

```bash
# Login to Cloudflare
wrangler login

# Create database
wrangler d1 create oslai-db
# ⚠️ Copy the database_id and paste into wrangler.toml

# Initialize database
npm run db:init

# Create storage bucket
wrangler r2 bucket create oslai-images
```

### 3️⃣ Set Secrets

```bash
# Grok API Key (from x.ai)
wrangler secret put GROK_API_KEY

# Stripe Keys (from dashboard.stripe.com)
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_PRICE_ID

# JWT Secret (random string)
wrangler secret put JWT_SECRET
```

**Generate JWT Secret:**
```bash
# On macOS/Linux:
openssl rand -base64 32

# Copy output and paste when prompted
```

### 4️⃣ Update Config

Edit `wrangler.toml`:

1. **Line 6**: Add your Cloudflare Account ID
2. **Line 15**: Update database_id from step 2
3. **Line 23**: Set your domain (e.g., oslai.yourdomain.com)

### 5️⃣ Deploy!

```bash
npm run deploy
```

🎉 **Your app is live!** The deploy command will show your URL.

## Post-Deployment

### Set Up Stripe Webhook

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://YOUR_WORKER_URL/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.*`
4. Copy signing secret:

```bash
wrangler secret put STRIPE_WEBHOOK_SECRET
```

### Create Stripe Product

1. Go to [Stripe Products](https://dashboard.stripe.com/products)
2. Create product: "OSL Skin AI Monthly"
3. Price: $20 monthly recurring
4. Copy Price ID (price_xxx...) and use in step 3 above

## Test Your App

### 1. Create Test Account

Visit your deployed URL, click "Sign Up"

### 2. Test Subscription

Click "Subscribe Now" - use Stripe test card:
```
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
```

### 3. Test AI Chat

1. After subscribing, click "Try It Now"
2. Upload a skin photo
3. Ask: "Can you analyze my skin and recommend products?"

## Common Issues

**"Database not found"**
```bash
wrangler d1 list
# Make sure database_id in wrangler.toml matches
```

**"Unauthorized"**
```bash
# Make sure JWT_SECRET is set
wrangler secret list
```

**"Grok API Error"**
- Verify API key is correct
- Check you have credits at x.ai

## Next Steps

- [📚 Full Documentation](./README.md)
- [🚀 Deployment Guide](./DEPLOYMENT.md)
- [🎨 Customize Branding](#customization)

## Customization

### Change Colors

Edit `public/styles.css`:

```css
:root {
    --primary: #14b8a6;      /* Your brand color */
    --primary-dark: #0d9488;
    /* ... */
}
```

### Change AI Personality

Edit `src/worker.ts` line 131 to customize the AI's instructions.

### Change Pricing

1. Update Stripe product price
2. Update `STRIPE_PRICE_ID` secret
3. Update price display in `public/index.html`

## Support

- 🐛 Issues: Create a GitHub issue
- 💬 Discord: [Cloudflare Developers](https://discord.cloudflare.com)
- 📧 Email: support@organicskinlightener.com

---

Built with ❤️ for Organic Skin Lightener

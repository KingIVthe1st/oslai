# OSL Skin AI

AI-Powered Skin Care Assistant by Organic Skin Lightener - Built with Cloudflare Workers, Grok AI, and Stripe

## Features

- 🤖 **AI-Powered Analysis**: Powered by Grok AI for intelligent skin care recommendations
- 📸 **Photo Analysis**: Upload skin photos for detailed AI analysis
- 💬 **Interactive Chat**: Natural conversation with personalized advice
- 💳 **Subscription System**: $20/month via Stripe with seamless checkout
- 🔒 **Secure Authentication**: JWT-based auth with password hashing
- ☁️ **Cloudflare Infrastructure**: Workers, D1 Database, R2 Storage
- 🎨 **OSL Branding**: Professional design matching Organic Skin Lightener brand

## Architecture

### Frontend
- **Vanilla JavaScript** - No framework overhead, fast loading
- **Responsive Design** - Mobile-first with desktop optimization
- **Modal-based Chat** - Clean UX inspired by MD Diagnose
- **Image Upload** - Drag-drop or file picker with preview

### Backend (Cloudflare Worker)
- **Grok AI Integration** - X.AI's powerful language model
- **Stripe Subscriptions** - Checkout + Customer Portal
- **D1 Database** - User accounts and subscription data
- **R2 Storage** - Secure image storage
- **JWT Authentication** - Stateless auth

## Setup Instructions

### Prerequisites
- Cloudflare account with Workers, D1, and R2 enabled
- Grok API key from [x.ai](https://x.ai)
- Stripe account with API keys
- Node.js 18+ installed

### 1. Clone and Install

```bash
cd skin-care-ai
npm install
```

### 2. Configure Cloudflare Resources

#### Create D1 Database
```bash
wrangler d1 create oslai-db
```
Copy the database_id from output and update `wrangler.toml`

#### Initialize Database
```bash
npm run db:init
```

#### Create R2 Bucket
```bash
wrangler r2 bucket create oslai-images
```

### 3. Set Environment Secrets

```bash
# Grok AI API Key (from x.ai console)
wrangler secret put GROK_API_KEY

# Stripe Keys (from Stripe dashboard)
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET

# Stripe Price ID (create a $20/month recurring product in Stripe)
wrangler secret put STRIPE_PRICE_ID

# JWT Secret (generate a random string)
wrangler secret put JWT_SECRET
```

### 4. Update wrangler.toml

Edit `wrangler.toml` and set:
- `account_id`: Your Cloudflare account ID
- `database_id`: From step 2
- `FRONTEND_URL`: Your domain (e.g., https://oslai.yourdomain.com)
- `routes`: Your custom domain route

### 5. Set Up Stripe Webhook

1. In Stripe Dashboard, go to Developers > Webhooks
2. Add endpoint: `https://oslai.yourdomain.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy webhook signing secret and add it via `wrangler secret put STRIPE_WEBHOOK_SECRET`

### 6. Deploy

```bash
# Development
npm run dev

# Production
npm run deploy
```

## File Structure

```
skin-care-ai/
├── public/
│   ├── index.html          # Landing page with OSL branding
│   ├── styles.css          # Teal/turquoise theme
│   └── script.js           # Chat UI + image upload
├── src/
│   └── worker.ts           # Cloudflare Worker backend
├── schema.sql              # D1 database schema
├── wrangler.toml           # Cloudflare configuration
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
└── README.md               # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/signin` - Sign in
- `GET /api/user` - Get current user

### Chat
- `POST /api/chat` - Send message (with optional image)

### Stripe
- `POST /api/stripe/checkout` - Create checkout session
- `POST /api/stripe/webhook` - Stripe webhook handler

## Usage

### For Users

1. **Sign Up**: Create an account with email/password
2. **Subscribe**: $20/month subscription via Stripe
3. **Upload Photo**: Take a clear photo of your skin
4. **Chat with AI**: Get personalized recommendations
5. **Track Progress**: Upload photos over time to track improvement

### For Administrators

```bash
# View logs
npm run tail

# Query database
wrangler d1 execute oslai-db --command "SELECT * FROM users"

# List R2 objects
wrangler r2 object list oslai-images
```

## Customization

### Branding
All colors are defined in `public/styles.css` CSS variables:
- `--primary`: Main teal color
- `--primary-dark`: Darker teal
- `--accent`: Gold/amber accents

### AI Personality
Edit the system prompt in `src/worker.ts` line 131 to customize AI behavior

### Subscription Pricing
Change price in Stripe dashboard, then update `STRIPE_PRICE_ID` secret

## Deployment to Production

### GitHub Integration

1. Create GitHub repository:
```bash
git init
git add .
git commit -m "Initial commit: OSL Skin AI"
git remote add origin https://github.com/yourusername/osl-skin-ai.git
git push -u origin main
```

2. Set up GitHub Actions for auto-deploy:
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

3. Add `CLOUDFLARE_API_TOKEN` to GitHub Secrets

### Custom Domain

1. In Cloudflare Dashboard, add your domain
2. Update `routes` in `wrangler.toml`
3. Deploy: `npm run deploy`

## Troubleshooting

### "Unauthorized" errors
- Check JWT_SECRET is set correctly
- Verify token in localStorage

### "Failed to get AI response"
- Verify GROK_API_KEY is valid
- Check Grok API quota/limits

### Stripe webhook failing
- Verify STRIPE_WEBHOOK_SECRET matches Stripe dashboard
- Check webhook endpoint is accessible

### Images not uploading
- Verify R2 bucket exists and is bound in wrangler.toml
- Check file size limits (max 5MB)

## Support

For issues or questions:
- GitHub Issues: [Your repo URL]
- Email: support@organicskinlightener.com

## License

MIT License - Copyright (c) 2024 Organic Skin Lightener

---

Built with ❤️ using Cloudflare Workers, Grok AI, and Stripe

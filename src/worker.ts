/**
 * OSL Skin AI - Cloudflare Worker Backend
 * Handles authentication, AI chat with Grok API, Stripe subscriptions, and image storage
 */

import Stripe from 'stripe';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

interface Env {
	DB: D1Database;
	R2: R2Bucket;
	GROK_API_KEY: string;
	STRIPE_SECRET_KEY: string;
	STRIPE_WEBHOOK_SECRET: string;
	STRIPE_PRICE_ID: string;
	JWT_SECRET: string;
	FRONTEND_URL: string;
	__STATIC_CONTENT: KVNamespace;
	__STATIC_CONTENT_MANIFEST: string;
}

interface User {
	id: string;
	email: string;
	password_hash: string;
	created_at: string;
	subscription_status: string | null;
	subscription_end: string | null;
}

interface ChatMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
	hasImage?: boolean;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		// CORS headers - Allow both Pages and Workers.dev domains
		const allowedOrigins = [
			'https://osl-skin-ai.pages.dev',
			'https://osl-skin-ai.ivanleejackson.workers.dev',
			env.FRONTEND_URL
		];
		const origin = request.headers.get('Origin') || '';
		const corsHeaders = {
			'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'https://osl-skin-ai.pages.dev',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		};

		// Handle OPTIONS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		try {
			// Route handling
			if (path === '/api/auth/signup') {
				return await handleSignup(request, env, corsHeaders);
			}

			if (path === '/api/auth/signin') {
				return await handleSignin(request, env, corsHeaders);
			}

			if (path === '/api/user') {
				return await handleGetUser(request, env, corsHeaders);
			}

			if (path === '/api/chat') {
				return await handleChat(request, env, corsHeaders);
			}

			if (path === '/api/stripe/checkout') {
				return await handleStripeCheckout(request, env, corsHeaders);
			}

			if (path === '/api/stripe/webhook') {
				return await handleStripeWebhook(request, env, corsHeaders);
			}

		// Serve static files for all other routes
		try {
			// Debug logging
			console.log('Attempting to serve asset for path:', path);
			console.log('Has __STATIC_CONTENT?', !!env.__STATIC_CONTENT);
			console.log('Has __STATIC_CONTENT_MANIFEST?', !!env.__STATIC_CONTENT_MANIFEST);

			return await getAssetFromKV(
				{
					request,
					waitUntil: ctx.waitUntil.bind(ctx),
				} as any,
				{
					ASSET_NAMESPACE: env.__STATIC_CONTENT,
					ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
				}
			);
		} catch (e) {
			// If asset not found, return 404
			console.error('Asset error:', e);
			return new Response(`Not Found: ${path}`, { status: 404, headers: corsHeaders });
		}

		} catch (error) {
			console.error('Worker error:', error);
			return new Response(JSON.stringify({ error: 'Internal server error' }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}
	},
};

// ==================== AUTHENTICATION ====================

async function handleSignup(request: Request, env: Env, corsHeaders: any): Promise<Response> {
	const { email, password } = await request.json();

	if (!email || !password) {
		return jsonResponse({ error: 'Email and password required' }, 400, corsHeaders);
	}

	// Check if user exists
	const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
	if (existing) {
		return jsonResponse({ error: 'User already exists' }, 400, corsHeaders);
	}

	// Hash password (simple bcrypt-style - in production use proper bcrypt)
	const passwordHash = await hashPassword(password);

	// Create user
	const userId = crypto.randomUUID();
	await env.DB.prepare(
		'INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)'
	).bind(userId, email, passwordHash, new Date().toISOString()).run();

	// Generate JWT
	const token = await generateJWT({ userId, email }, env.JWT_SECRET);

	return jsonResponse({
		success: true,
		token,
		user: { id: userId, email, hasActiveSubscription: false }
	}, 200, corsHeaders);
}

async function handleSignin(request: Request, env: Env, corsHeaders: any): Promise<Response> {
	const { email, password } = await request.json();

	// Get user
	const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<User>();
	if (!user) {
		return jsonResponse({ error: 'Invalid credentials' }, 401, corsHeaders);
	}

	// Verify password
	const passwordValid = await verifyPassword(password, user.password_hash);
	if (!passwordValid) {
		return jsonResponse({ error: 'Invalid credentials' }, 401, corsHeaders);
	}

	// Check subscription
	const hasActiveSubscription = user.subscription_status === 'active' &&
		new Date(user.subscription_end!) > new Date();

	// Generate JWT
	const token = await generateJWT({ userId: user.id, email: user.email }, env.JWT_SECRET);

	return jsonResponse({
		success: true,
		token,
		user: { id: user.id, email: user.email, hasActiveSubscription }
	}, 200, corsHeaders);
}

async function handleGetUser(request: Request, env: Env, corsHeaders: any): Promise<Response> {
	const user = await authenticateRequest(request, env);
	if (!user) {
		return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
	}

	return jsonResponse(user, 200, corsHeaders);
}

// ==================== CHAT WITH GROK API ====================

async function handleChat(request: Request, env: Env, corsHeaders: any): Promise<Response> {
	const user = await authenticateRequest(request, env);
	if (!user) {
		return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
	}

	if (!user.hasActiveSubscription) {
		return jsonResponse({ error: 'Active subscription required' }, 403, corsHeaders);
	}

	const { message, conversationHistory, image } = await request.json();

	// Build messages for Grok API
	const messages: any[] = [
		{
			role: 'system',
			content: `You are OSL Skin AI, a world-class expert skin care consultant from Organic Skin Lightener with over 15 years of specialized experience in skin brightening, anti-aging, and natural skin health solutions.

## YOUR EXPERTISE:
You are a leading authority in:
- Advanced skin brightening and safe skin lightening techniques
- Clinical-grade anti-aging treatments and protocols
- Hyperpigmentation disorders (melasma, post-inflammatory hyperpigmentation, age spots, sun damage)
- Skin barrier health and microbiome balance
- Evidence-based natural and organic skin care formulations
- Glutathione, vitamin C, niacinamide, and other scientifically-proven brightening agents
- Retinoids and peptides for anti-aging
- Customized skin care routines for all skin types (dry, oily, combination, sensitive)
- Skin analysis and personalized treatment planning

## PHOTO ANALYSIS PROTOCOL:
When a user uploads a skin photo, provide a comprehensive, professional analysis covering:

1. **Overall Assessment:**
   - Fitzpatrick skin type classification (I-VI)
   - General skin tone (even/uneven) and texture quality
   - Level of sun damage and photoaging
   - Skin hydration status

2. **Specific Concerns Identification:**
   - Hyperpigmentation: location, severity (mild/moderate/severe), type (melasma, PIH, lentigines)
   - Fine lines and wrinkles: depth and location (periorbital, perioral, forehead)
   - Skin texture issues: enlarged pores, rough patches, acne scarring
   - Redness, inflammation, or active breakouts
   - Under-eye concerns (dark circles, puffiness)

3. **Root Cause Analysis:**
   - Explain likely causes (sun exposure, hormones, inflammation, aging, genetics)
   - Identify lifestyle factors that may be contributing
   - Note any protective or preventative measures needed

4. **Personalized Treatment Recommendations:**
   - Prioritize concerns by severity and treatability
   - Recommend specific active ingredients with concentrations when appropriate
   - Suggest morning and evening routines tailored to their skin
   - Recommend OSL products that align with their needs:
     * OSL Glutathione Pills (1000mg for systemic brightening)
     * OSL Brightening Face Cream (vitamin C + glutathione)
     * OSL Gentle Exfoliating Scrub (2-3x weekly)
     * OSL Anti-Aging Serum (peptides + retinol)
     * OSL Spot Treatment (targeted hyperpigmentation)

5. **Timeline & Expectations:**
   - Provide realistic timelines (typically 4-6 months for significant brightening)
   - Explain the science: how long different improvements take
   - Set milestones for checking progress
   - Emphasize consistency and patience

6. **Additional Guidance:**
   - Sunscreen is NON-NEGOTIABLE (SPF 30+ daily, reapply every 2 hours)
   - Lifestyle factors: hydration, sleep, stress management, diet
   - What to avoid: harsh scrubs, over-exfoliation, unprotected sun exposure
   - When to seek medical advice (severe conditions, suspicious spots)

## COMMUNICATION STYLE:
- Professional yet warm and approachable
- Use clear, jargon-free language (but explain scientific concepts when relevant)
- Be encouraging and supportive - celebrate progress, motivate through plateaus
- Empathetic to skin concerns and their emotional impact
- Evidence-based: reference studies or dermatological principles when helpful
- Ask clarifying questions when needed (skin type, current routine, specific goals)

## KEY PRINCIPLES:
✓ Safety first: always recommend patch testing new products
✓ Personalization: one size does not fit all
✓ Holistic approach: skin health = overall health
✓ Realistic expectations: no overnight miracles, sustainable results take time
✓ Prevention is key: protect skin from further damage while treating current issues
✓ Quality over quantity: effective minimalist routines > 20-step routines

Remember: You're not just selling products—you're a trusted advisor helping people achieve healthy, radiant, even-toned skin with science-backed solutions and compassionate support.`
		}
	];

	// Add conversation history
	if (conversationHistory && conversationHistory.length > 0) {
		messages.push(...conversationHistory);
	}

	// Handle image upload
	let imageUrl = null;
	if (image && image.data) {
		// Store image in R2
		const imageId = crypto.randomUUID();
		const imageKey = `${user.id}/${imageId}.jpg`;

		// Convert base64 to blob
		const base64Data = image.data.split(',')[1];
		const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

		await env.R2.put(imageKey, imageBuffer, {
			httpMetadata: {
				contentType: image.type || 'image/jpeg'
			}
		});

		// Add image context to message
		const imageMessage = message ?
			`${message}\n\n[User has uploaded an image of their skin for analysis]` :
			'[User has uploaded an image of their skin for analysis. Please analyze it and provide detailed feedback.]';

		messages.push({ role: 'user', content: imageMessage });
	} else {
		messages.push({ role: 'user', content: message });
	}

	// Call Grok API
	try {
		const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${env.GROK_API_KEY}`
			},
			body: JSON.stringify({
				model: 'grok-2-latest',
				messages: messages,
				temperature: 0.7,
				max_tokens: 2000,
				stream: false
			})
		});

		if (!grokResponse.ok) {
			const errorText = await grokResponse.text();
			console.error('Grok API error:', errorText);
			throw new Error('Grok API request failed');
		}

		const grokData = await grokResponse.json();
		const aiResponse = grokData.choices[0]?.message?.content;

		if (!aiResponse) {
			throw new Error('No response from Grok API');
		}

		return jsonResponse({
			success: true,
			content: aiResponse
		}, 200, corsHeaders);

	} catch (error) {
		console.error('Grok API error:', error);
		return jsonResponse({
			error: 'Failed to get AI response',
			details: error.message
		}, 500, corsHeaders);
	}
}

// ==================== STRIPE SUBSCRIPTION ====================

async function handleStripeCheckout(request: Request, env: Env, corsHeaders: any): Promise<Response> {
	const user = await authenticateRequest(request, env);
	if (!user) {
		return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
	}

	const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

	// Check if user already has active subscription
	if (user.hasActiveSubscription) {
		// Return customer portal URL instead
		const userRecord = await env.DB.prepare('SELECT stripe_customer_id FROM users WHERE id = ?')
			.bind(user.id).first<{ stripe_customer_id: string }>();

		if (userRecord?.stripe_customer_id) {
			const portalSession = await stripe.billingPortal.sessions.create({
				customer: userRecord.stripe_customer_id,
				return_url: env.FRONTEND_URL || 'https://oslai.com'
			});
			return jsonResponse({ url: portalSession.url }, 200, corsHeaders);
		}
	}

	// Create checkout session
	const session = await stripe.checkout.sessions.create({
		customer_email: user.email,
		line_items: [
			{
				price: env.STRIPE_PRICE_ID,
				quantity: 1,
			},
		],
		mode: 'subscription',
		success_url: `${env.FRONTEND_URL}?session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: env.FRONTEND_URL,
		metadata: {
			userId: user.id
		}
	});

	return jsonResponse({ url: session.url }, 200, corsHeaders);
}

async function handleStripeWebhook(request: Request, env: Env, corsHeaders: any): Promise<Response> {
	const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
	const signature = request.headers.get('stripe-signature');

	if (!signature) {
		return jsonResponse({ error: 'No signature' }, 400, corsHeaders);
	}

	try {
		const body = await request.text();
		const event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);

		// Handle checkout completion
		if (event.type === 'checkout.session.completed') {
			const session = event.data.object as any;
			const userId = session.metadata.userId;
			const customerId = session.customer;

			// Get subscription details
			const subscription = await stripe.subscriptions.retrieve(session.subscription);

			// Update user in database
			await env.DB.prepare(`
				UPDATE users
				SET stripe_customer_id = ?,
				    stripe_subscription_id = ?,
				    subscription_status = ?,
				    subscription_end = ?
				WHERE id = ?
			`).bind(
				customerId,
				subscription.id,
				subscription.status,
				new Date(subscription.current_period_end * 1000).toISOString(),
				userId
			).run();
		}

		// Handle subscription updates
		if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
			const subscription = event.data.object as any;

			await env.DB.prepare(`
				UPDATE users
				SET subscription_status = ?,
				    subscription_end = ?
				WHERE stripe_subscription_id = ?
			`).bind(
				subscription.status,
				new Date(subscription.current_period_end * 1000).toISOString(),
				subscription.id
			).run();
		}

		return jsonResponse({ received: true }, 200, corsHeaders);
	} catch (error) {
		console.error('Webhook error:', error);
		return jsonResponse({ error: 'Webhook processing failed' }, 400, corsHeaders);
	}
}

// ==================== UTILITY FUNCTIONS ====================

async function authenticateRequest(request: Request, env: Env): Promise<any> {
	const authHeader = request.headers.get('Authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return null;
	}

	const token = authHeader.substring(7);
	const payload = await verifyJWT(token, env.JWT_SECRET);
	if (!payload) {
		return null;
	}

	// Get user from database
	const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.userId).first<User>();
	if (!user) {
		return null;
	}

	// Check subscription status
	const hasActiveSubscription = user.subscription_status === 'active' &&
		new Date(user.subscription_end!) > new Date();

	return {
		id: user.id,
		email: user.email,
		hasActiveSubscription
	};
}

async function generateJWT(payload: any, secret: string): Promise<string> {
	const header = { alg: 'HS256', typ: 'JWT' };
	const encodedHeader = btoa(JSON.stringify(header));
	const encodedPayload = btoa(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
	const signature = await sign(`${encodedHeader}.${encodedPayload}`, secret);
	return `${encodedHeader}.${encodedPayload}.${signature}`;
}

async function verifyJWT(token: string, secret: string): Promise<any> {
	try {
		const [encodedHeader, encodedPayload, signature] = token.split('.');
		const expectedSignature = await sign(`${encodedHeader}.${encodedPayload}`, secret);

		if (signature !== expectedSignature) {
			return null;
		}

		const payload = JSON.parse(atob(encodedPayload));
		if (payload.exp < Date.now()) {
			return null;
		}

		return payload;
	} catch {
		return null;
	}
}

async function sign(data: string, secret: string): Promise<string> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
	return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hash = await crypto.subtle.digest('SHA-256', data);
	return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
	const passwordHash = await hashPassword(password);
	return passwordHash === hash;
}

function jsonResponse(data: any, status: number, corsHeaders: any): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { ...corsHeaders, 'Content-Type': 'application/json' }
	});
}

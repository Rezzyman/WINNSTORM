# Stripe Payment Setup Guide

This guide walks you through setting up Stripe payments for WinnStorm subscriptions.

## Step 1: Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign up or log in
3. Complete business verification (required for live payments)

---

## Step 2: Get Your API Keys

1. In Stripe Dashboard, go to **Developers** → **API keys**
2. Copy your keys:
   - **Publishable key** (starts with `pk_`)
   - **Secret key** (starts with `sk_`)

### For Testing
Use test mode keys (toggle "Test mode" in dashboard):
- `pk_test_...`
- `sk_test_...`

### For Production
Use live mode keys:
- `pk_live_...`
- `sk_live_...`

---

## Step 3: Create Products & Prices

In Stripe Dashboard → **Products**:

### Starter Plan ($49/month)
1. Click **Add product**
2. Name: `WinnStorm Starter`
3. Add price: $49.00 USD, Recurring monthly
4. Copy the **Price ID** (starts with `price_`)

### Professional Plan ($149/month)
1. Click **Add product**
2. Name: `WinnStorm Professional`
3. Add price: $149.00 USD, Recurring monthly
4. Copy the **Price ID**

### Enterprise Plan ($399/month)
1. Click **Add product**
2. Name: `WinnStorm Enterprise`
3. Add price: $399.00 USD, Recurring monthly
4. Copy the **Price ID**

---

## Step 4: Set Up Webhook

This is **critical** - without webhooks, payments won't update user subscriptions!

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your endpoint URL:
   ```
   https://your-domain.com/api/stripe/webhook
   ```
   For Replit: `https://your-app.replit.app/api/stripe/webhook`

4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

---

## Step 5: Set Environment Variables

Add these to your `.env` file or Replit Secrets:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_your_secret_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key

# Webhook Secret (from Step 4)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Price IDs (from Step 3)
STRIPE_PRICE_STARTER=price_starter_id
STRIPE_PRICE_PROFESSIONAL=price_professional_id
STRIPE_PRICE_ENTERPRISE=price_enterprise_id
```

### For Testing
Add these as well (optional, for test mode):
```bash
TESTING_STRIPE_SECRET_KEY=sk_test_your_test_key
```

---

## Step 6: Test the Flow

### Using Stripe Test Mode

1. Enable test mode in Stripe Dashboard
2. Use test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Any future expiry date, any 3-digit CVC

### Test Flow

1. **Sign up** as a new user
2. **Go to pricing** page
3. **Select a plan** and click Subscribe
4. **Enter test card** `4242 4242 4242 4242`
5. **Complete payment**
6. **Check Stripe Dashboard** → Customers → see new subscription
7. **Check WinnStorm** → user should now have access

### Verify Webhook

In Stripe Dashboard → Webhooks → your endpoint:
- Check "Recent deliveries"
- Should see `customer.subscription.created` with status 200

---

## Troubleshooting

### "Webhook signature verification failed"
- Make sure `STRIPE_WEBHOOK_SECRET` matches your webhook's signing secret
- Ensure raw body parsing is before JSON parsing (already configured)

### "No user found for Stripe customer"
- User must be logged in when subscribing
- Check that `stripeCustomerId` was saved to user

### Subscription not updating
1. Check Stripe webhook logs for errors
2. Verify webhook URL is correct
3. Check server logs for error messages

### Test mode vs Live mode
- Test mode API keys only work with test mode webhooks
- Keep them separate - don't mix test and live keys

---

## Payment Flow Summary

```
User clicks "Subscribe"
       ↓
Frontend calls /api/create-subscription
       ↓
Backend creates Stripe customer + subscription
       ↓
User enters card on Stripe Checkout
       ↓
Payment succeeds
       ↓
Stripe fires webhook → /api/stripe/webhook
       ↓
Backend updates user.subscriptionStatus = 'active'
       ↓
User can now access paid features!
```

---

## Going Live Checklist

- [ ] Complete Stripe business verification
- [ ] Create live products with correct pricing
- [ ] Set up live webhook endpoint
- [ ] Update environment variables with live keys
- [ ] Test one real transaction ($1 or refund immediately)
- [ ] Enable billing emails in Stripe

---

## Support

- Stripe Support: https://support.stripe.com
- Stripe API Docs: https://stripe.com/docs/api
- WinnStorm Support: support@winnstorm.com

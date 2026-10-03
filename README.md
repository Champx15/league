# City Cricket League — player registration

React + Vite frontend for player registration. Registration, database access, and payment-order creation are handled by the Cloudflare Worker; payments use Razorpay Checkout.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Set the Worker base URL in `.env`:

```env
VITE_API_BASE_URL=https://your-worker.your-subdomain.workers.dev
```

Use the Worker origin only (no trailing slash or endpoint path). Restart Vite after changing environment variables. Do not put Supabase service-role keys, Razorpay secrets, or other private credentials in the frontend environment. The Razorpay key ID is returned by the Worker at checkout time; its secret remains server-side.

## Worker integration

The registration page uses:

- `POST /submission` to validate and save the player, determine the server-side fee, and create a Razorpay order.
- Razorpay Checkout to collect payment.
- `POST /payment/verify` to verify the checkout signature and confirm payment.

The frontend sends the category and proficiency options in the Worker’s expected format. The Worker response `playerId` (the registration ID), `orderId`, `amount`, `currency`, and `keyId` are used to launch checkout. An interrupted checkout can be reopened against the existing order, and a failed confirmation can be retried without creating another payment.

Configure the Worker’s CORS allowlist to include the exact frontend origins. The supplied backend currently permits `http://localhost:5500`, `http://127.0.0.1:5500`, and `https://myapp.com`; Vite normally serves on `http://localhost:5173`, so add that (and the actual deployed site origin) if applicable.

Razorpay webhook signature verification, database writes, and admin API authentication stay entirely in the Worker. The wildcard `app.all("*")` handler from the supplied backend is intentionally not used by this frontend.

## Routes

| Route | Page |
| --- | --- |
| `/` | Landing page and registration overview |
| `/about` | About us placeholder |
| `/registration` | Player registration and Razorpay payment |

## Where to edit content

League copy lives in `src/config/league.js`. Indian states/union territories and category proficiency options live in `src/data/`.

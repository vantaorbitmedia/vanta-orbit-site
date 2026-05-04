This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a `.env.local` file in the project root for local development. Do not commit this file.

```bash
ADMIN_PASSWORD=your_admin_password_here
SESSION_SECRET=your_long_random_session_secret_here
ADMIN_2FA_SECRET=your_base32_totp_secret_here
OPENAI_API_KEY=your_key_here
LEONARDO_API_KEY=your_leonardo_api_key_here
AI_MODEL_MAIN=gpt-5
AI_MODEL_PREMIUM=gpt-5.2
AI_MODEL_FAST=gpt-5-mini
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

`.env.example` is the committed template and must only contain placeholder values.

In Vercel:
- Go to Project Settings -> Environment Variables
- Add `LEONARDO_API_KEY` to Production and Preview environments
- Redeploy after adding or changing `LEONARDO_API_KEY`
- Add the same remaining variables there for production
- Keep `OPENAI_API_KEY`, `LEONARDO_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `SESSION_SECRET`, and `ADMIN_2FA_SECRET` server-side only

Only variables prefixed with `NEXT_PUBLIC_` should ever be used in client-side code. The AI, Leonardo, and Supabase write routes read sensitive keys from `process.env` on the server and fail gracefully with a clear error if the required key is missing. The Video Manager saves to Supabase when `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured, while still maintaining the local JSON fallback during rollout.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

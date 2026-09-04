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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Testing

```bash
npm test
```

Runs every `src/**/*.test.ts` file with Node's built-in test runner — no
Jest/Vitest. Requires Node 22.18 or newer (native TypeScript type stripping
plus module mocks); the suite is verified on Node 22 and 26. `test/register.mjs` installs the resolution hooks in
`test/hooks.mjs` so tests import the real production modules (the `@/`
alias, `server-only` modules, and `next/*` entries all resolve), and the
`--experimental-test-module-mocks` flag enables `mock.module()` for the
few request-scoped or network-facing dependencies a test has to stub.
Components and pages (`.tsx`) are outside this runner's reach — Node does
not transform JSX — so those stay covered by typecheck, lint and the build.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

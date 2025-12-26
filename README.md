# Webhook Mirror

A simple utility to capture, inspect, and replay webhook requests.

Built with Next.js (App Router), Convex, and Tailwind CSS. Part of the Nekomata suite.

## Features

- **Generate:** Create temporary webhook endpoints instantly.
- **Capture:** Log incoming HTTP requests (Headers, Body, Method).
- **Inspect:** View request details in a clean interface.
- **Replay:** Resend captured requests to a target URL for debugging.

## Stack

- **Frontend:** Next.js 16+, React 19, Tailwind CSS 4
- **Backend/DB:** Convex
- **UI:** Shadcn UI, Motion
- **Runtime:** Bun

## Local Development

### Prerequisites

- [Bun](https://bun.sh)
- [Convex Account](https://convex.dev)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/nekomatahq/webhook-mirror.git
   cd webhook-mirror
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the development server:
   ```bash
   bun run dev
   ```

   This command starts both the Next.js frontend and the Convex backend. You will be prompted to log in to Convex on the first run.

## Usage

1. Go to the dashboard.
2. Create a new endpoint.
3. Send a request to the generated URL.
4. View the captured request in the list.
5. Click "Replay" to forward the request to another destination.

## License

MIT

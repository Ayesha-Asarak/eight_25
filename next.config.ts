import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Increase timeout for the audit API route (Vercel Hobby: 10s max, Pro: 60s)
  // Document this limit in README trade-offs
};

export default nextConfig;

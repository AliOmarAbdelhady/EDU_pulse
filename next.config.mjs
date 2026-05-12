import path from "node:path";
import { fileURLToPath } from "node:url";
import analyze from "@next/bundle-analyzer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withBundleAnalyzer = analyze({ enabled: process.env.ANALYZE === "true" });

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdfkit"],
  experimental: {
    turbopackFileSystemCacheForDev: true,
    optimizePackageImports: [
      'recharts',
      '@nivo/core',
      '@nivo/bar',
      '@nivo/line',
      '@nivo/pie',
      '@nivo/heatmap',
      'lucide-react',
      'date-fns',
      'framer-motion',
    ],
  },
  compress: true,
  turbopack: {
    root: __dirname,
  },
};

export default withBundleAnalyzer(nextConfig);

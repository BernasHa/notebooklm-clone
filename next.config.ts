import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 and sqlite-vec are native modules — keep them out of the
  // webpack bundle so their .node bindings load correctly at runtime.
  serverExternalPackages: ["better-sqlite3", "sqlite-vec", "pdf-parse"],
};

export default nextConfig;

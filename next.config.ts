import type { NextConfig } from "next";
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER
} from "next/constants";

export default function nextConfig(phase: string): NextConfig {
  const isDevelopmentServer = phase === PHASE_DEVELOPMENT_SERVER;
  const isProductionRuntime =
    phase === PHASE_PRODUCTION_BUILD || phase === PHASE_PRODUCTION_SERVER;

  return {
    distDir: isDevelopmentServer ? ".next-dev" : isProductionRuntime ? ".next" : ".next",
    reactStrictMode: true,
    experimental: {
      webpackBuildWorker: false
    }
  };
}

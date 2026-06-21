/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    useWasmBinary: true,
  },
  reactStrictMode: true,
};

export default nextConfig;

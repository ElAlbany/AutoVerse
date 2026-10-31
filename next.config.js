/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    dangerouslyAllowLocalIP: false,
    maximumRedirects: 2,
  },
};

module.exports = nextConfig;

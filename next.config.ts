/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const posServiceUrl = (
      process.env.POS_INTERNAL_URL || process.env.NEXT_PUBLIC_POS_BACKEND_URL || "http://localhost:7004"
    ).replace(/\/+$/, "")

    return [
      {
        source: "/cashier-items",
        destination: `${posServiceUrl}/pos_api/orders/sellable/`,
      },
    ]
  },
  async headers() {
    return [
      {
        // Revalidate the document shell after each deployment; static chunks remain cacheable.
        source: "/((?!_next/static|_next/image|api/|favicon.ico|robots.txt|sitemap.xml).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0, must-revalidate",
          },
        ],
      },
    ]
  },
}

export default nextConfig

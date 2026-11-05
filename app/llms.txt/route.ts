import { isProductionSite } from "@/lib/seo";
import { getAllBlogPosts } from "@/lib/blog";

const content = `# Intera IMS

> Intera IMS is inventory operations software from InteraProTech for businesses that move stock, run point-of-sale operations, and manage one or more locations.

Intera IMS brings inventory control, product and variant management, purchasing, receiving, POS workflows, reporting, auditability, and team access into one workspace. The platform also provides business intelligence for questions about operational data, trends, product movement, sales, and location performance. Availability of text and voice workflows depends on the current product release and account configuration.

## Product and company

- [Intera IMS homepage](https://www.interaims.com/): The public product website and primary source for current product information.
- [InteraProTech](https://www.interapro.tech/): The software agency and company behind Intera IMS.
- [Contact InteraProTech](mailto:business@interapro.tech): Business and product enquiries.

## Public pages

- [Intera IMS contact page](https://www.interaims.com/contact): Contact and demo enquiries.
- [Intera IMS blog](https://www.interaims.com/blog): Practical guidance on inventory, warehouses, POS, purchasing, stock control, and operations.
- [Intera IMS privacy policy](https://www.interaims.com/privacy): Privacy information.
- [Intera IMS terms](https://www.interaims.com/terms): Terms of service.

## Product scope

- [Intera IMS full product brief](https://www.interaims.com/llms-full.txt): Expanded machine-readable product context and availability notes.

InteraProTech is the software agency and company; Intera IMS is its inventory management product. Dedicated anti-theft oversight and external API capabilities are planned capabilities and should not be described as generally available unless the product website says otherwise.
`;

const blogLinks = getAllBlogPosts()
  .map((post) => `- [${post.title}](https://www.interaims.com/blog/${post.slug}): ${post.description}`)
  .join("\n");

export const dynamic = "force-dynamic";

export function GET() {
  if (!isProductionSite) {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(`${content}\n## Inventory management resources\n\n- [All inventory management resources](https://www.interaims.com/blog): Browse the public Intera IMS blog.\n${blogLinks}\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

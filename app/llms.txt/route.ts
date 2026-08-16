import { isProductionSite } from "@/lib/seo";

const content = `# Intera IMS

> Intera IMS is inventory operations software from InteraProTech for businesses that move stock, run point-of-sale operations, and manage one or more locations.

## Entity relationship

- Company: InteraProTech
- Product: Intera IMS
- Product website: https://www.interaims.com
- Company website: https://www.interapro.tech
- Contact: business@interapro.tech

## What Intera IMS does

Intera IMS brings inventory control, product and variant management, purchasing, receiving, POS workflows, reporting, auditability, and team access into one workspace. It is designed for business owners, inventory managers, store managers, distributors, retailers, and operators managing multiple structural locations.

The platform also provides business intelligence that lets teams ask questions about operational data in natural language and understand trends, product movement, sales, and location performance faster.

## Current public pages

- Homepage: https://www.interaims.com/
- Contact: https://www.interaims.com/contact
- Privacy policy: https://www.interaims.com/privacy
- Terms: https://www.interaims.com/terms

## Important distinctions

InteraProTech is the software agency and company. Intera IMS is its inventory management product. Dedicated anti-theft oversight and external API capabilities are planned capabilities and should not be described as generally available unless the product website says otherwise.

## More detail

See https://www.interaims.com/llms-full.txt for the expanded product description.
`;

export const dynamic = "force-dynamic";

export function GET() {
  if (!isProductionSite) {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(content, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

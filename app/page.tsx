"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  Menu,
  Radio,
  ScanBarcode,
  Send,
  ShieldCheck,
  Sparkles,
  Users2,
  WifiOff,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetSubscriptionPlansQuery } from "@/redux/features/payment/paymentAPISlice";
import { useAppSelector } from "@/redux/store";
import { Feature, SubscriptionPlan } from "@/components/interfaces/payment";
import { AnimatePresence, motion } from "framer-motion";

const billingLabel: Record<SubscriptionPlan["billing_cycle"], string> = {
  MONTHLY: "month",
  QUARTERLY: "quarter",
  YEARLY: "year",
  ONE_TIME: "one-time",
};

const planHighlights: Record<string, string[]> = {
  basic: [
    "1 staff user",
    "1 structural stock location",
    "1 POS terminal",
    "200 products and 800 variants",
    "Offline POS and realtime operations",
    "30-day free trial",
  ],
  starter: [
    "Up to 8 staff users",
    "3 structural stock locations",
    "6 POS terminals",
    "500 products and 2,500 variants",
    "Audit trails, team access, and realtime operations",
    "30-day free trial",
  ],
  growth: [
    "Up to 30 staff users",
    "10 structural stock locations",
    "25 POS terminals",
    "5,000 products and 25,000 variants",
    "Business intelligence and inventory traceability",
    "30-day free trial",
  ],
  scale: [
    "Up to 120 staff users",
    "30 structural stock locations",
    "100 POS terminals",
    "10,000 products and 50,000 variants",
    "High-volume operations and anti-theft oversight",
    "30-day free trial",
  ],
  enterprise: [
    "Custom users, locations, and terminals",
    "Custom onboarding and rollout support",
    "Custom operational scope and integrations",
    "Custom audit and intelligence limits",
  ],
};

const coreHighlights = [
  {
    title: "Operations in one place",
    description:
      "Unify inventory, purchasing, pricing, POS, reporting, and team workflows in a single workspace.",
    icon: Boxes,
  },
  {
    title: "Made for real-world control",
    description:
      "Run retail and warehouse workflows with confidence using offline-first POS, role controls, audit trails, and anti-theft signals.",
    icon: WifiOff,
  },
  {
    title: "AI where it matters",
    description:
      "Use configurable workspace agents and offline operational intelligence to ask your inventory questions in natural language and surface risk faster.",
    icon: Bot,
  },
];

const capabilityGrid = [
  {
    title: "Inventory Control",
    description: "Track products, balances, reorder rules, adjustments, reservations, and movement history across structural locations.",
    icon: ClipboardList,
  },
  {
    title: "Purchasing & Replenishment",
    description: "Run purchase orders, approvals, receiving, supplier returns, and delivery timing from one workflow.",
    icon: Building2,
  },
  {
    title: "POS & Offline Selling",
    description: "Operate terminals, sessions, discounts, orders, remittances, and inventory-aware in-store sales even when connectivity drops.",
    icon: ScanBarcode,
  },
  {
    title: "Team Access",
    description: "Invite staff and assign roles, groups, and permissions independently for each workspace.",
    icon: Users2,
  },
  {
    title: "Audit, Traceability & Anti-theft",
    description: "Search controlled activity trails, trace stock movements, and surface anti-theft risk through event-backed monitoring.",
    icon: ShieldCheck,
  },
  {
    title: "Business Intelligence",
    description: "Review inventory, purchasing, POS, and realtime operational analytics, then query years of history in natural language and get answers in seconds.",
    icon: BarChart3,
  },
  {
    title: "Conversational Intelligence",
    description: "Ask plain-language questions about sales, stock, purchasing, and staff activity, then turn the answer into charts, lists, or actions.",
    icon: Sparkles,
  },
  {
    title: "Live Operations Monitor",
    description: "Follow sales, receiving, stock signals, and risk changes as they happen through realtime operational streams.",
    icon: Radio,
  },
  {
    title: "External API Platform",
    description: "Build custom integrations on top of the platform API when you need a separate, metered developer surface. Coming soon.",
    icon: Menu,
  },
];

const workflowSteps = [
  {
    title: "Connect your operations",
    description:
      "Set up your company profile, locations, teams, products, and suppliers in a guided flow.",
  },
  {
    title: "Run daily inventory at speed",
    description:
      "Handle receiving, sales, transfers, low-stock actions, and purchasing from one command center.",
  },
  {
    title: "Scale with intelligence",
    description:
      "Use realtime analytics, workspace agents, and offline operational intelligence to identify risks and guide decisions.",
  },
];

const faqItems = [
  {
    question: "Can I run Intera without AI agents?",
    answer:
      "Yes. Inventory, purchasing, POS, receiving, reporting, audit, and team workflows operate independently. Workspace agents can be configured later.",
  },
  {
    question: "What happens when the internet connection drops?",
    answer:
      "The Intera POS application can continue from locally available operational data, queue supported work, and synchronize it when connectivity returns. The web application requires a connection.",
  },
  {
    question: "Can I manage multiple stores and warehouses?",
    answer:
      "Yes. Structural locations model stores and warehouses, while operational locations model areas such as shelves, racks, backrooms, and receiving points.",
  },
  {
    question: "How do I set up products and variants?",
    answer:
      "You can create products directly, use bulk workflows, or start from shared product data, then customize the product names, variants, and media for your workspace.",
  },
  {
    question: "Does stock update after sales and receiving?",
    answer:
      "Yes. Paid POS activity and goods receiving feed inventory and audit workflows. Realtime views surface participating sales, receiving, and operational events as they arrive.",
  },
  {
    question: "Who can view sensitive audit activity?",
    answer:
      "Workspace owners and explicitly authorized staff can access the audit trail. Audit APIs and realtime streams enforce workspace and permission checks.",
  },
  {
    question: "How does the platform help prevent theft?",
    answer:
      "The platform keeps a trace of stock movement, user activity, receiving, sales, and approvals so suspicious gaps are easier to spot and investigate.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes. Each standard plan includes a 30-day trial so a workspace can configure its operation and evaluate the relevant plan limits before monthly billing begins.",
  },
  {
    question: "Can I change plans as the business grows?",
    answer:
      "The plan model is designed around increasing staff, locations, terminals, products, variants, and operational capabilities as your requirements grow.",
  },
];

type DemoWidget =
  | { type: "metric-grid"; items: Array<{ label: string; value: string; helper: string }> }
  | { type: "bar-list"; title: string; items: Array<{ label: string; value: string; width: number }> }
  | { type: "ranked-list"; title: string; items: Array<{ label: string; meta: string; tone?: "good" | "warn" | "risk" }> }
  | { type: "action-form"; title: string; fields: string[]; cta: string }
  | { type: "risk-panel"; title: string; score: string; items: string[] }

type DemoMessage = {
  role: "user" | "assistant"
  text: string
  widget?: DemoWidget
}

type DemoConversation = {
  title: string
  specialist: string
  messages: DemoMessage[]
}

const demoConversations: DemoConversation[] = [
  {
    title: "Today’s sales by location",
    specialist: "Sales insight agent",
    messages: [
      { role: "user", text: "How many sales have we made today across all locations?" },
      {
        role: "assistant",
        text: "You have 184 paid sales today across three active locations.",
        widget: {
          type: "metric-grid",
          items: [
            { label: "Paid sales", value: "184", helper: "Across 3 locations" },
            { label: "Gross value", value: "NGN 2.68M", helper: "+18% vs yesterday" },
            { label: "Avg basket", value: "NGN 14.6K", helper: "Best: Agric Ikorodu" },
          ],
        },
      },
      { role: "user", text: "Which location is leading by value?" },
      {
        role: "assistant",
        text: "Agric Ikorodu Store is leading by value with NGN 1.42M from 96 sales. Airport Road follows with NGN 870K, then Gberigbe with NGN 390K.",
        widget: {
          type: "bar-list",
          title: "Location sales value",
          items: [
            { label: "Agric Ikorodu Store", value: "NGN 1.42M", width: 100 },
            { label: "Airport Road Oshodi", value: "NGN 870K", width: 61 },
            { label: "Gberigbe Store", value: "NGN 390K", width: 27 },
          ],
        },
      },
    ],
  },
  {
    title: "Stock risk and fast movers",
    specialist: "Inventory risk agent",
    messages: [
      { role: "user", text: "Which of my products are currently out of stock?" },
      {
        role: "assistant",
        text: "There are 12 out-of-stock variants across three locations. The highest-risk items are below because they also sold recently.",
        widget: {
          type: "ranked-list",
          title: "Out-of-stock priority",
          items: [
            { label: "Nivea Cocoa Butter 400ml", meta: "0 left - sold 42 this week", tone: "risk" },
            { label: "Sure Men Invisible Ice", meta: "0 left - sold 37 this week", tone: "risk" },
            { label: "Ritz Oud Perfume 100ml", meta: "0 left - sold 21 this week", tone: "warn" },
          ],
        },
      },
      { role: "user", text: "Which products have sold best in the past seven days?" },
      {
        role: "assistant",
        text: "Your top seven-day movers are Sure Men Invisible Ice, Nivea Cocoa Butter 400ml, and Ritz Oud Perfume 100ml.",
        widget: {
          type: "bar-list",
          title: "Seven-day movers",
          items: [
            { label: "Sure Men Invisible Ice", value: "314 units", width: 100 },
            { label: "Nivea Cocoa Butter 400ml", value: "271 units", width: 86 },
            { label: "Ritz Oud Perfume 100ml", value: "188 units", width: 60 },
          ],
        },
      },
    ],
  },
  {
    title: "Inventory onboarding",
    specialist: "Onboarding agent",
    messages: [
      { role: "user", text: "I just created my workspace. What should I set up first so inventory works properly?" },
      {
        role: "assistant",
        text: "Start with company profile, structural locations, product catalog, inventory items, and POS terminals. I can guide the setup in that order.",
        widget: {
          type: "ranked-list",
          title: "Recommended setup path",
          items: [
            { label: "Company profile", meta: "Currency, logo, business identity", tone: "good" },
            { label: "Structural locations", meta: "Stores, warehouses, branches", tone: "good" },
            { label: "Products and variants", meta: "Use global catalog where possible", tone: "good" },
            { label: "Inventory items", meta: "Opening quantities and reorder points", tone: "warn" },
          ],
        },
      },
      { role: "user", text: "Can you prepare the form for adding my first warehouse?" },
      {
        role: "assistant",
        text: "Yes. I would open a guided location form and ask only for the fields required to create the first structural stock location.",
        widget: {
          type: "action-form",
          title: "Create structural location",
          fields: ["Location name", "Location code", "Physical address", "Official in charge"],
          cta: "Create location",
        },
      },
    ],
  },
  {
    title: "Purchase order planning",
    specialist: "Purchasing agent",
    messages: [
      { role: "user", text: "What should I reorder this week based on sales and current stock?" },
      {
        role: "assistant",
        text: "I found 18 variants that should be reviewed. Six are urgent because they are below reorder point and still selling daily.",
        widget: {
          type: "risk-panel",
          title: "Reorder pressure",
          score: "6 urgent",
          items: ["Nivea Cocoa Butter 400ml - 3 days cover", "Sure Men Invisible Ice - 2 days cover", "Ritz Oud Perfume 100ml - supplier lead time risk"],
        },
      },
      { role: "user", text: "Create a draft purchase order grouped by supplier." },
      {
        role: "assistant",
        text: "I can prepare a supplier-grouped draft so your purchasing team reviews quantities before approval.",
        widget: {
          type: "action-form",
          title: "Draft purchase order",
          fields: ["Supplier", "Suggested variants", "Recommended quantity", "Expected delivery date"],
          cta: "Prepare draft",
        },
      },
    ],
  },
  {
    title: "Cashier coaching",
    specialist: "POS agent",
    messages: [
      { role: "user", text: "A cashier says a product is not showing on the POS. What should we check?" },
      {
        role: "assistant",
        text: "Check product status, variant POS visibility, barcode assignment, price availability, and whether the terminal location has stock.",
        widget: {
          type: "ranked-list",
          title: "POS visibility checklist",
          items: [
            { label: "Variant is active and POS-ready", meta: "Required before checkout", tone: "good" },
            { label: "Barcode or searchable name exists", meta: "Needed for fast cashier lookup", tone: "warn" },
            { label: "Terminal location has stock", meta: "Prevents unavailable item errors", tone: "risk" },
          ],
        },
      },
      { role: "user", text: "Which terminal sold the most today?" },
      {
        role: "assistant",
        text: "Terminal IKD-Front-01 is leading today with 72 paid orders and NGN 940K in value.",
        widget: {
          type: "bar-list",
          title: "Terminal performance",
          items: [
            { label: "IKD-Front-01", value: "NGN 940K", width: 100 },
            { label: "OSH-Counter-02", value: "NGN 610K", width: 65 },
            { label: "GBG-Mobile-01", value: "NGN 250K", width: 27 },
          ],
        },
      },
    ],
  },
  {
    title: "Audit investigation",
    specialist: "Audit agent",
    messages: [
      { role: "user", text: "Who changed the reorder point for Sure Men Invisible Ice?" },
      {
        role: "assistant",
        text: "The audit trail shows Ederson changed the reorder point from 20 to 40 yesterday at 4:18 PM from the inventory settings page.",
        widget: {
          type: "ranked-list",
          title: "Audit evidence",
          items: [
            { label: "Actor", meta: "Ederson - inventory role", tone: "good" },
            { label: "Change", meta: "Reorder point 20 to 40", tone: "warn" },
            { label: "Source", meta: "Inventory settings - web", tone: "good" },
          ],
        },
      },
      { role: "user", text: "Show me risky permission changes this week." },
      {
        role: "assistant",
        text: "I found two permission changes that should be reviewed because they added purchasing approval access.",
        widget: {
          type: "risk-panel",
          title: "Permission risk",
          score: "2 reviews",
          items: ["Purchase approval granted to one staff member", "Support access created and revoked after 42 minutes", "No owner credential sharing detected"],
        },
      },
    ],
  },
  {
    title: "Anti-theft investigation",
    specialist: "Audit agent",
    messages: [
      { role: "user", text: "Can you help me spot a stock movement that looks suspicious?" },
      {
        role: "assistant",
        text: "Yes. I can inspect the stock trail, receiving history, sales pattern, and user activity to highlight where the movement no longer looks consistent.",
        widget: {
          type: "metric-grid",
          items: [
            { label: "Stock trail checks", value: "184", helper: "Across movements and adjustments" },
            { label: "Suspicious gaps", value: "4", helper: "Needs review" },
            { label: "Risk flags", value: "2", helper: "Approval and receiving mismatch" },
          ],
        },
      },
      { role: "user", text: "What should I review first?" },
      {
        role: "assistant",
        text: "Start with the adjustment log, then check who handled the last receiving and sales events around the missing stock.",
        widget: {
          type: "ranked-list",
          title: "Review order",
          items: [
            { label: "Adjustment log", meta: "Look for recent manual edits", tone: "risk" },
            { label: "Receiving history", meta: "Compare expected and received", tone: "warn" },
            { label: "Sales and stock trail", meta: "Confirm the full movement chain", tone: "good" },
          ],
        },
      },
    ],
  },
  {
    title: "Manager morning briefing",
    specialist: "Operations manager agent",
    messages: [
      { role: "user", text: "Give me a morning briefing before I open the stores." },
      {
        role: "assistant",
        text: "Here is the operational picture: sales momentum is strong, two stores need replenishment review, and one POS terminal has unresolved sync work.",
        widget: {
          type: "metric-grid",
          items: [
            { label: "Revenue trend", value: "+18%", helper: "Versus yesterday" },
            { label: "Stock risks", value: "12", helper: "Out-of-stock variants" },
            { label: "Sync attention", value: "1", helper: "Terminal queue pending" },
          ],
        },
      },
      { role: "user", text: "What should I act on first?" },
      {
        role: "assistant",
        text: "Approve replenishment for the fastest movers first, then review the terminal sync queue before opening peak-hour checkout.",
        widget: {
          type: "ranked-list",
          title: "Priority actions",
          items: [
            { label: "Approve urgent purchase draft", meta: "Prevents fast-mover stockout", tone: "risk" },
            { label: "Resolve terminal sync queue", meta: "Avoid reporting gaps", tone: "warn" },
            { label: "Check cashier readiness", meta: "Terminals and remittance owners", tone: "good" },
          ],
        },
      },
    ],
  },
  {
    title: "Supplier performance",
    specialist: "Supplier insight agent",
    messages: [
      { role: "user", text: "Which supplier is delaying my replenishment most often?" },
      {
        role: "assistant",
        text: "Supplier BlueMart has the highest delay impact: three late deliveries affected six fast-moving variants this month.",
        widget: {
          type: "bar-list",
          title: "Supplier delay impact",
          items: [
            { label: "BlueMart Distribution", value: "3 late POs", width: 100 },
            { label: "PrimeCare Wholesale", value: "1 late PO", width: 33 },
            { label: "DailyMart Supply", value: "0 late POs", width: 6 },
          ],
        },
      },
      { role: "user", text: "What alternative action should I take?" },
      {
        role: "assistant",
        text: "Split urgent replenishment between BlueMart and PrimeCare, then keep BlueMart on non-urgent quantities until performance improves.",
        widget: {
          type: "action-form",
          title: "Supplier action",
          fields: ["Primary supplier", "Backup supplier", "Urgent quantity split", "Review date"],
          cta: "Prepare supplier split",
        },
      },
    ],
  },
  {
    title: "Role and staff control",
    specialist: "Access control agent",
    messages: [
      { role: "user", text: "I want my cashier to sell products but not approve purchase orders. Can you check the role?" },
      {
        role: "assistant",
        text: "The cashier role should include POS checkout and product read access, but exclude purchasing approval and inventory deletion.",
        widget: {
          type: "ranked-list",
          title: "Role review",
          items: [
            { label: "Allow POS checkout", meta: "Required for sales", tone: "good" },
            { label: "Allow product lookup", meta: "Required for catalog search", tone: "good" },
            { label: "Block PO approval", meta: "Manager-only permission", tone: "risk" },
          ],
        },
      },
      { role: "user", text: "Notify the staff member when the role is updated." },
      {
        role: "assistant",
        text: "The platform records the change in the audit trail and surfaces it wherever the workspace owner reviews access changes.",
        widget: {
          type: "action-form",
          title: "Access update record",
          fields: ["Staff member", "Role summary", "Reason for change"],
          cta: "Save change",
        },
      },
    ],
  },
];

const demoSignalCoverage = [
  { label: "Hourly sales value", source: "Audit projection", delivery: "WebSocket" },
  { label: "Hourly receiving units", source: "Audit projection", delivery: "WebSocket" },
  { label: "Audit and risk activity", source: "Audit ledger", delivery: "WebSocket" },
  { label: "Inventory and catalog snapshot", source: "Domain services", delivery: "API refresh" },
];

function DemoWidgetView({ widget }: { widget?: DemoWidget }) {
  if (!widget) return null

  if (widget.type === "metric-grid") {
    return (
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {widget.items.map((item) => (
          <div key={item.label} className="rounded-xl border border-blue-100 bg-blue-50/70 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-700">{item.label}</p>
            <p className="mt-1 text-lg font-semibold text-gray-950">{item.value}</p>
            <p className="mt-1 text-[11px] text-gray-500">{item.helper}</p>
          </div>
        ))}
      </div>
    )
  }

  if (widget.type === "bar-list") {
    return (
      <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">{widget.title}</p>
        <div className="mt-3 space-y-3">
          {widget.items.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-gray-700">{item.label}</span>
                <span className="font-semibold text-gray-900">{item.value}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${item.width}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55 }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (widget.type === "ranked-list") {
    const toneClass = {
      good: "border-emerald-100 bg-emerald-50 text-emerald-800",
      warn: "border-amber-100 bg-amber-50 text-amber-800",
      risk: "border-red-100 bg-red-50 text-red-800",
    }
    return (
      <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">{widget.title}</p>
        <div className="mt-3 space-y-2">
          {widget.items.map((item, index) => (
            <div key={item.label} className={`rounded-xl border px-3 py-2 ${toneClass[item.tone || "good"]}`}>
              <div className="flex gap-2">
                <span className="font-semibold">{index + 1}.</span>
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs opacity-80">{item.meta}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (widget.type === "action-form") {
    return (
      <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">{widget.title}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {widget.fields.map((field) => (
            <div key={field} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
              {field}
            </div>
          ))}
        </div>
        <button className="mt-3 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm">
          {widget.cta}
        </button>
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-700">{widget.title}</p>
          <p className="mt-1 text-2xl font-semibold text-red-900">{widget.score}</p>
        </div>
        <ShieldCheck className="h-5 w-5 text-red-600" />
      </div>
      <div className="mt-3 space-y-2">
        {widget.items.map((item) => (
          <p key={item} className="rounded-lg bg-white/80 px-3 py-2 text-xs text-red-900">
            {item}
          </p>
        ))}
      </div>
    </div>
  )
}

const revealCard = (index = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.4, delay: index * 0.07 },
});

const liftOnHover = {
  y: -8,
  scale: 1.015,
  transition: { duration: 0.2, ease: "easeOut" as const },
};

function formatPlanPrice(plan: SubscriptionPlan) {
  if (plan.name.toLowerCase().includes("enterprise")) {
    return "Contact sales";
  }
  const parsedPrice = Number(plan.price);
  if (Number.isNaN(parsedPrice)) {
    return `$${plan.price}`;
  }
  return `$${parsedPrice.toFixed(parsedPrice % 1 === 0 ? 0 : 2)}`;
}

function formatPlanFeature(feature: Feature) {
  if (feature.limit_type === "COUNT" && !feature.is_unlimited) {
    const limit = Number(feature.limit_value ?? 0).toLocaleString();
    return `${limit} ${feature.name.toLowerCase()}`;
  }
  if (feature.limit_type === "COUNT" && feature.is_unlimited) {
    return `Unlimited ${feature.name.toLowerCase()}`;
  }
  return feature.name;
}

function PlanCard({ plan, highlighted = false }: { plan: SubscriptionPlan; highlighted?: boolean }) {
  const planFeatures: string[] = plan.features.map(formatPlanFeature);
  if (planFeatures.length === 0) {
    planFeatures.push(...(planHighlights[plan.slug] ?? []));
  }
  if (plan.intera_coins_reward > 0) {
    planFeatures.unshift(`${plan.intera_coins_reward} Intera Coins included`);
  }

  return (
    <motion.div
      whileHover={liftOnHover}
      className={`rounded-2xl border p-6 shadow-sm ${
        highlighted ? "border-blue-600 bg-blue-50/40" : "border-gray-200 bg-white"
      }`}
    >
      <div className="mb-5">
        <p className="text-sm font-semibold text-blue-700">{plan.name}</p>
        <p className="mt-1 text-sm text-gray-600">{plan.description}</p>
      </div>
      <div className="mb-5">
        <p className="text-3xl font-semibold text-gray-900">{formatPlanPrice(plan)}</p>
        <p className="text-sm text-gray-500">
          {plan.name.toLowerCase().includes("enterprise")
            ? "Custom scope and pricing"
            : `Billed per ${billingLabel[plan.billing_cycle]}`}
        </p>
      </div>
      <ul className="space-y-2 text-sm text-gray-700">
        {planFeatures.map((featureName) => (
          <li key={featureName} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
            <span>{featureName}</span>
          </li>
        ))}
      </ul>
      <Button asChild className="mt-6 w-full">
        <Link href={plan.name.toLowerCase().includes("enterprise") ? "/contact" : `/accounts?plan_id=${plan.id}`}>
          {plan.name.toLowerCase().includes("enterprise") ? "Talk to sales" : "Start with this plan"}
        </Link>
      </Button>
    </motion.div>
  );
}

export default function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDemoIndex, setActiveDemoIndex] = useState(() => Math.floor(Math.random() * demoConversations.length));
  const [visibleMessageCount, setVisibleMessageCount] = useState(0);
  const [typedDemoText, setTypedDemoText] = useState("");
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const { data: pricingPlans, isLoading, isError } = useGetSubscriptionPlansQuery({
    application__slug: "intera-ims",
  });
  const demoAvatarForRole = {
    assistant: isDarkMode ? "/assets/img/favicons/favicon-dark.png" : "/assets/img/favicons/favicon-light.png",
    user: "/assets/intera-logo.png",
  } as const;
  const homepageLogoSrc = isDarkMode
    ? "/assets/img/logos/verticals/no-bg/INTERA-PRIMARY-LOGO-VERTICAL-WHITE-4.png"
    : "/assets/img/logos/verticals/no-bg/INTERA-PRIMARY-LOGO-VERTICAL-BLACK-3.png";

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveDemoIndex((currentValue) => (currentValue + 1) % demoConversations.length);
    }, 9000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const timerIds: number[] = [];
    let cancelled = false;
    const messages = demoConversations[activeDemoIndex].messages;

    const schedule = (callback: () => void, delay: number) => {
      const timerId = window.setTimeout(callback, delay);
      timerIds.push(timerId);
    };

    const typeText = (text: string, onDone: () => void, index = 0) => {
      if (cancelled) return;
      if (index > text.length) {
        onDone();
        return;
      }
      setTypedDemoText(text.slice(0, index));
      schedule(() => typeText(text, onDone, index + 1), index === 0 ? 250 : 22);
    };

    const revealMessage = (index: number) => {
      if (cancelled || index >= messages.length) return;
      const message = messages[index];
      if (message.role === "user") {
        typeText(message.text, () => {
          if (cancelled) return;
          schedule(() => {
            setVisibleMessageCount(index + 1);
            setTypedDemoText("");
            schedule(() => revealMessage(index + 1), 600);
          }, 180);
        });
        return;
      }
      schedule(() => {
        if (cancelled) return;
        setVisibleMessageCount(index + 1);
        schedule(() => revealMessage(index + 1), 900);
      }, 850);
    };

    schedule(() => {
      setVisibleMessageCount(0);
      setTypedDemoText("");
      schedule(() => revealMessage(0), 350);
    }, 0);

    return () => {
      cancelled = true;
      timerIds.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [activeDemoIndex]);

  const nextDemoMessage = demoConversations[activeDemoIndex].messages[visibleMessageCount];
  const isAssistantThinking = Boolean(nextDemoMessage?.role === "assistant" && !typedDemoText);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="relative block h-12 w-[172px] shrink-0 overflow-hidden sm:h-14 sm:w-[196px]">
              <Image
                src={homepageLogoSrc}
                alt="Intera Inventory logo"
                fill
                priority
                sizes="(min-width: 1024px) 196px, 172px"
                className="object-cover object-center"
              />
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#capabilities" className="text-sm text-gray-600 hover:text-gray-900">
              Capabilities
            </a>
            <a href="#demo" className="text-sm text-gray-600 hover:text-gray-900">
              Demo
            </a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">
              Pricing
            </a>
            <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900">
              FAQ
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Button variant="secondary" asChild>
              <Link  href="/accounts/signin">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/accounts">Get started</Link>
            </Button>
          </div>

          <button
            type="button"
            className="inline-flex rounded-md p-2 text-gray-700 hover:bg-gray-100 md:hidden"
            onClick={() => setIsMobileMenuOpen((currentValue) => !currentValue)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMobileMenuOpen ? (
          <div className="border-t border-gray-200  bg-white px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              <a href="#capabilities" className="text-sm text-gray-600 hover:text-gray-900" onClick={() => setIsMobileMenuOpen(false)}>
                Capabilities
              </a>
              <a href="#demo" className="text-sm text-gray-600 hover:text-gray-900" onClick={() => setIsMobileMenuOpen(false)}>
                Demo
              </a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900" onClick={() => setIsMobileMenuOpen(false)}>
                Pricing
              </a>
              <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900" onClick={() => setIsMobileMenuOpen(false)}>
                FAQ
              </a>
              <div className="mt-2 flex gap-2">
                <Button variant="ghost" asChild className="flex-1 text-gray-700">
                  <Link href="/accounts/signin">Sign in</Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/accounts">Get started</Link>
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        <section className="bg-gradient-to-b from-blue-50 via-white to-white">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pt-20">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <Sparkles className="h-3.5 w-3.5" />
                Inventory + POS + AI in one system
              </div>
              <h1 className="mt-5 text-4xl font-semibold leading-tight text-gray-900 sm:text-5xl">
                Built for teams that need clean inventory operations at scale.
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-gray-600">
                Intera helps you control stock, automate purchasing decisions, and run day-to-day operations without the
                noise of fragmented tools.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/accounts">
                    Start free setup
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#pricing">View plans</a>
                </Button>
              </div>
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {coreHighlights.map(({ title, icon: IconComponent }, index) => (
                  <motion.div
                    key={title}
                    {...revealCard(index)}
                    whileHover={liftOnHover}
                    className="rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-blue-300"
                  >
                    <IconComponent className="h-4 w-4 text-blue-700" />
                    <p className="mt-2 text-sm font-medium text-gray-900">{title}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              {...revealCard(1)}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors hover:border-blue-300"
            >
              <p className="text-sm font-semibold text-gray-700">What this unlocks for your team</p>
              <div className="mt-5 space-y-4">
                <motion.div whileHover={liftOnHover} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-900">Faster inventory decisions</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Know what to reorder, when to transfer stock, and where margin is leaking.
                  </p>
                </motion.div>
                <motion.div whileHover={liftOnHover} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-900">Stronger team accountability</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Every role gets only what it needs with clear traceability across actions.
                  </p>
                </motion.div>
                <motion.div whileHover={liftOnHover} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-900">Lower operational drag</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Remove repetitive admin work with automation and guided AI support.
                  </p>
                </motion.div>
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                <Clock3 className="h-4 w-4" />
                Go live quickly with progressive setup. Start core, enable advanced features as needed.
              </div>
            </motion.div>
          </div>
        </section>

        <section id="capabilities" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Capabilities</p>
            <h2 className="mt-3 text-3xl font-semibold text-gray-900 sm:text-4xl">
              Everything needed to run modern inventory operations.
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Purpose-built modules that work together, so your team can execute quickly without jumping between tools.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {capabilityGrid.map(({ title, description, icon: IconComponent }, index) => (
              <motion.div
                key={title}
                {...revealCard(index)}
                whileHover={liftOnHover}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors hover:border-blue-300"
              >
                <IconComponent className="h-5 w-5 text-blue-700" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm text-gray-600">{description}</p>
              </motion.div>
            ))}
          </div>
        </section>
        {/* 
        <section className="border-y border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Core Capabilities</p>
              <h2 className="mt-3 text-3xl font-semibold text-gray-900 sm:text-4xl">
                The essentials behind a modern inventory operation.
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                These are the primary capabilities that define how the platform helps teams run stock, selling, control, and insight from one workspace.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {coreHighlights.map(({ title, description, icon: IconComponent }, index) => (
                <motion.div
                  key={title}
                  {...revealCard(index)}
                  whileHover={liftOnHover}
                  className="rounded-xl border border-gray-200 bg-white p-6 transition-colors hover:border-blue-300"
                >
                  <IconComponent className="h-5 w-5 text-blue-700" />
                  <h3 className="mt-3 text-lg font-semibold text-gray-900">{title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        <section id="workflow" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 bg-gray-50">
          
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Workflow</p>
            <h2 className="mt-3 text-3xl font-semibold text-gray-900 sm:text-4xl">
              A practical rollout path, from setup to scale.
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <motion.div
                key={step.title}
                {...revealCard(index)}
                whileHover={liftOnHover}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors hover:border-blue-300"
              >
                <p className="text-sm font-semibold text-blue-700">Step {index + 1}</p>
                <h3 className="mt-2 text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </section>
*/}

        <section id="demo" className="border-y border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Conversation Demo</p>
              <h2 className="mt-3 text-3xl font-semibold text-gray-900 sm:text-4xl">
                See how operators and AI collaborate in real workflows.
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Ask operational questions in plain language, then convert answers into concrete actions.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-5">
              <motion.div
                {...revealCard(0)}
                whileHover={liftOnHover}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-colors hover:border-blue-300 lg:col-span-3"
              >
                <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 shrink-0" />
                      <span className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
                        Intera operations agent
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900">
                        Ready
                      </span>
                    </div>
                    <p className="mt-2 truncate text-sm text-blue-50/90">Demonstration conversation using supported workflows.</p>
                  </div>
                  <span className="hidden rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium sm:inline-flex">
                    Product preview
                  </span>
                </div>

                <div className="min-h-[330px] bg-gray-50 p-4">
                  <div className="mb-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Workflow</p>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{demoConversations[activeDemoIndex].title}</p>
                          <p className="text-xs text-gray-500">{demoConversations[activeDemoIndex].specialist}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700">Ready</span>
                    </div>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`demo-thread-${activeDemoIndex}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-5"
                    >
                      {demoConversations[activeDemoIndex].messages.slice(0, visibleMessageCount).map((message, index) => {
                        const isUser = message.role === "user";
                        return (
                          <motion.div
                            key={`${message.role}-${index}`}
                            initial={{ opacity: 0, x: isUser ? 12 : -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.25, delay: index * 0.1 }}
                            className={`flex items-end gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                          >
                            {!isUser ? (
                              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-blue-100 bg-white shadow-sm">
                                <Image src={demoAvatarForRole.assistant} alt="Intera AI" fill sizes="40px" className="object-cover" />
                              </span>
                            ) : null}
                            <div
                              className={`max-w-[82%] rounded-2xl px-5 py-4 text-sm shadow-sm ${
                                isUser
                                  ? "rounded-br-none bg-blue-500 text-white"
                                  : "rounded-bl-none border border-gray-100 bg-white text-gray-800"
                              }`}
                            >
                              <p className="leading-6">{message.text}</p>
                              {!isUser ? <DemoWidgetView widget={message.widget} /> : null}
                            </div>
                            {isUser ? (
                              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-blue-200 bg-blue-600 shadow-sm">
                                <Image src={demoAvatarForRole.user} alt="Store operator" fill sizes="40px" className="object-cover" />
                              </span>
                            ) : null}
                          </motion.div>
                        );
                      })}
                      {isAssistantThinking ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-end justify-start gap-3"
                        >
                          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-blue-100 bg-white shadow-sm">
                            <Image src={demoAvatarForRole.assistant} alt="Intera AI" fill sizes="40px" className="object-cover" />
                          </span>
                          <div className="inline-flex items-center gap-1 rounded-2xl rounded-bl-none border border-gray-100 bg-white px-4 py-3 shadow-sm">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-500" />
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-500 [animation-delay:120ms]" />
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-500 [animation-delay:220ms]" />
                          </div>
                        </motion.div>
                      ) : null}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="border-t border-gray-200 bg-white p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex min-h-10 flex-1 items-center rounded-2xl border border-gray-300 bg-gray-100 px-4 py-2 text-sm text-gray-700">
                      {typedDemoText ? (
                        <span>
                          {typedDemoText}
                          <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-blue-600" />
                        </span>
                      ) : (
                        <span className="text-gray-500">Type your operational question...</span>
                      )}
                    </div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                      <Send className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </motion.div>

              <div className="space-y-6 lg:col-span-2">
                <motion.div
                  {...revealCard(1)}
                  whileHover={liftOnHover}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-300"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Operational signal coverage</p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">Actual delivery contracts used by the current dashboard.</p>
                    </div>
                    <Radio className="h-5 w-5 shrink-0 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    {demoSignalCoverage.map((signal) => (
                      <div key={signal.label} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-gray-900">{signal.label}</p>
                          <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${signal.delivery === "WebSocket" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}>
                            {signal.delivery}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{signal.source}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  {...revealCard(2)}
                  whileHover={liftOnHover}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300"
                >
                  <Image
                    src="/landing/inventory-dashboard.svg"
                    alt="Inventory dashboard illustration"
                    width={760}
                    height={380}
                    className="w-full rounded-lg border border-gray-100"
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="border-y border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Pricing</p>
              <h2 className="mt-3 text-3xl font-semibold text-gray-900 sm:text-4xl">
                Choose a plan that matches your growth stage.
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Start with the features your team needs now. Expand into advanced automation as operations mature.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {isLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={`plan-skeleton-${index}`} className="h-[420px] rounded-2xl" />
                  ))
                : null}
              {isError ? (
                <div className="col-span-full rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  Unable to load pricing plans right now. Please refresh or try again shortly.
                </div>
              ) : null}
              {pricingPlans
                ?.filter((plan: SubscriptionPlan) => plan.slug !== "enterprise")
                .map((plan: SubscriptionPlan, index: number) => (
                <PlanCard key={plan.id} plan={plan} highlighted={index === 1} />
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">FAQ</p>
            <h2 className="mt-3 text-3xl font-semibold text-gray-900 sm:text-4xl">Common questions, clear answers.</h2>
          </div>
          <div className="mt-10 grid items-start gap-4 md:grid-cols-2">
            {faqItems.map((item, index) => (
              <motion.details
                key={item.question}
                {...revealCard(index)}
                whileHover={liftOnHover}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors open:border-blue-300 open:shadow-md hover:border-blue-300"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left [&::-webkit-details-marker]:hidden">
                  <span className="text-base font-semibold leading-6 text-gray-900">{item.question}</span>
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500 transition group-open:rotate-180 group-open:border-blue-200 group-open:bg-blue-50 group-open:text-blue-700">
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </summary>
                <p className="mt-4 border-t border-gray-100 pt-4 text-sm font-normal leading-6 text-gray-600">{item.answer}</p>
              </motion.details>
            ))}
          </div>
        </section>

        <section className="bg-blue-700">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-14 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold">Ready to simplify inventory operations for your team?</h2>
              <p className="mt-3 text-blue-100">
                Start with a structured setup, enforce secure access with MFA, and scale into AI-assisted execution.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild >
                <Link href="/accounts">Create account</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                
              >
                <Link href="/accounts/signin">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-gray-900 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <Image
              src={homepageLogoSrc}
              alt="Intera Inventory logo"
              width={220}
              height={64}
              sizes="(min-width: 1024px) 220px, 180px"
              className="h-14 w-auto shrink-0 sm:h-16"
            />
            <p>© 2026 Intera Inventory. Built for dependable operations.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Boxes,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Globe2,
  Menu,
  ShieldCheck,
  Sparkles,
  Users2,
  WifiOff,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetSubscriptionPlansQuery } from "@/redux/features/payment/paymentAPISlice";
import { Feature, SubscriptionPlan } from "@/components/interfaces/payment";
import { AnimatePresence, motion } from "framer-motion";

const billingLabel: Record<SubscriptionPlan["billing_cycle"], string> = {
  MONTHLY: "month",
  QUARTERLY: "quarter",
  YEARLY: "year",
  ONE_TIME: "one-time",
};

const coreHighlights = [
  {
    title: "Operations in one place",
    description:
      "Unify inventory, purchasing, pricing, POS, reporting, and team workflows in a single workspace.",
    icon: Boxes,
  },
  {
    title: "Made for real-world constraints",
    description:
      "Run retail and warehouse workflows with confidence using offline-first POS, role controls, and audit trails.",
    icon: WifiOff,
  },
  {
    title: "AI where it matters",
    description:
      "Use agent assistance to answer business questions, detect risk early, and execute routine tasks faster.",
    icon: Bot,
  },
];

const capabilityGrid = [
  {
    title: "Inventory Control",
    description: "Track stock across locations with reorder rules, adjustments, and movement history.",
    icon: ClipboardList,
  },
  {
    title: "Supplier & Purchasing",
    description: "Create and monitor purchase orders with full supplier performance visibility.",
    icon: Building2,
  },
  {
    title: "POS & Sales",
    description: "Process sales quickly in-store and sync reliably with back-office inventory.",
    icon: Globe2,
  },
  {
    title: "Team Access",
    description: "Assign roles per company context with clean separation of permissions and actions.",
    icon: Users2,
  },
  {
    title: "Business Intelligence",
    description: "Turn operations data into decisions with dashboards, trend analysis, and alerts.",
    icon: BarChart3,
  },
  {
    title: "Security & Compliance",
    description: "Protect operations with MFA, context-aware access, and traceable activity logs.",
    icon: ShieldCheck,
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
      "Use analytics and AI guidance to reduce stockouts, improve cash flow, and tighten margins.",
  },
];

const faqItems = [
  {
    question: "Can I start without using AI agents?",
    answer:
      "Yes. Inventory, purchasing, POS, and reporting work independently. AI can be enabled later when you are ready.",
  },
  {
    question: "Is this suitable for multi-tenant setups?",
    answer:
      "Yes. The platform is designed for company-context switching, role isolation, and organization-level access control.",
  },
  {
    question: "Does the system support secure authentication?",
    answer:
      "Yes. The current flow enforces authenticator-based MFA and supports SSO integration with controlled session handling.",
  },
  {
    question: "How quickly can a team go live?",
    answer:
      "Most teams can start operations quickly by loading products, defining roles, and configuring locations in the first setup pass.",
  },
];

const demoConversations = [
  {
    title: "Low-stock and purchasing action",
    messages: [
      { role: "user", text: "Show items below reorder point in Lagos warehouse." },
      { role: "assistant", text: "14 SKUs are below threshold. Top 3 risks: Printer Ink, POS Paper Roll, Barcode Labels." },
      { role: "user", text: "Create draft PO for our primary supplier." },
      { role: "assistant", text: "Draft PO ready: 14 SKUs, estimated cost $9,420, expected delivery in 3 days." },
    ],
  },
  {
    title: "Sales signal and stock transfer",
    messages: [
      { role: "user", text: "Any unusual sales spikes today?" },
      { role: "assistant", text: "Yes. Mobile accessories are +31% in Lekki store vs 7-day baseline." },
      { role: "user", text: "Recommend immediate transfer to avoid stockout." },
      { role: "assistant", text: "Move 120 units from Ikeja to Lekki. Projected stock coverage improves from 0.9 to 3.2 days." },
    ],
  },
];

const metricCards = [
  { label: "Stockout Risk", value: "8.4%", delta: "-2.1%" },
  { label: "Fulfillment Time", value: "1.9 days", delta: "-0.4d" },
  { label: "Inventory Accuracy", value: "98.7%", delta: "+1.3%" },
  { label: "Gross Margin Trend", value: "+6.8%", delta: "+1.1%" },
];

const weeklyOpsSeries = [54, 61, 58, 69, 74, 72, 81];

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

function PlanCard({ plan, highlighted = false }: { plan: SubscriptionPlan; highlighted?: boolean }) {
  const planFeatures = useMemo(() => {
    const items: string[] = plan.features.map((feature: Feature) => feature.name);
    if (plan.intera_coins_reward > 0) {
      items.unshift(`${plan.intera_coins_reward} Intera Coins included`);
    }
    return items.slice(0, 8);
  }, [plan.features, plan.intera_coins_reward]);

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
  const [activeDemoIndex, setActiveDemoIndex] = useState(0);
  const [visibleMessageCount, setVisibleMessageCount] = useState(0);
  const { data: pricingPlans, isLoading, isError } = useGetSubscriptionPlansQuery({
    application__slug: "inventory-system",
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveDemoIndex((currentValue) => (currentValue + 1) % demoConversations.length);
    }, 9000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let timeoutId: number | undefined;
    let cancelled = false;
    const totalMessages = demoConversations[activeDemoIndex].messages.length;

    setVisibleMessageCount(0);

    const revealNext = (nextCount: number) => {
      if (cancelled) return;
      setVisibleMessageCount(nextCount);
      if (nextCount < totalMessages) {
        timeoutId = window.setTimeout(() => revealNext(nextCount + 1), 1300);
      }
    };

    timeoutId = window.setTimeout(() => revealNext(1), 350);

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [activeDemoIndex]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="https://interabucket.s3.amazonaws.com/attachments/product/light_intera-202508252032.png"
              alt="Intera"
              width={52}
              height={52}
            />
            <span className="text-lg font-semibold tracking-tight">Intera Inventory</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#capabilities" className="text-sm text-gray-600 hover:text-gray-900">
              Capabilities
            </a>
            <a href="#workflow" className="text-sm text-gray-600 hover:text-gray-900">
              Workflow
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
            <Button variant="ghost" asChild>
              <Link href="/accounts/signin">Sign in</Link>
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
          <div className="border-t border-gray-200 bg-white px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              <a href="#capabilities" onClick={() => setIsMobileMenuOpen(false)}>
                Capabilities
              </a>
              <a href="#workflow" onClick={() => setIsMobileMenuOpen(false)}>
                Workflow
              </a>
              <a href="#demo" onClick={() => setIsMobileMenuOpen(false)}>
                Demo
              </a>
              <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>
                Pricing
              </a>
              <a href="#faq" onClick={() => setIsMobileMenuOpen(false)}>
                FAQ
              </a>
              <div className="mt-2 flex gap-2">
                <Button variant="ghost" asChild className="flex-1">
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

        <section className="border-y border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
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

        <section id="workflow" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
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
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-300 lg:col-span-3"
              >
                <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Live Agent Session</p>
                    <p className="text-sm font-medium text-gray-800">{demoConversations[activeDemoIndex].title}</p>
                  </div>
                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                    Online
                  </span>
                </div>

                <div className="space-y-3">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`demo-thread-${activeDemoIndex}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-3"
                    >
                      {demoConversations[activeDemoIndex].messages.slice(0, visibleMessageCount).map((message, index) => (
                        <motion.div
                          key={`${message.role}-${index}`}
                          initial={{ opacity: 0, x: message.role === "user" ? 12 : -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: index * 0.1 }}
                          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
                              message.role === "user"
                                ? "bg-blue-700 text-white"
                                : "border border-gray-200 bg-gray-100 text-gray-800"
                            }`}
                          >
                            {message.text}
                          </div>
                        </motion.div>
                      ))}
                      {visibleMessageCount < demoConversations[activeDemoIndex].messages.length ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex justify-start"
                        >
                          <div className="inline-flex items-center gap-1 rounded-2xl border border-gray-200 bg-gray-100 px-3 py-2">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-500" />
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-500 [animation-delay:120ms]" />
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-500 [animation-delay:220ms]" />
                          </div>
                        </motion.div>
                      ) : null}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>

              <div className="space-y-6 lg:col-span-2">
                <motion.div
                  {...revealCard(1)}
                  whileHover={liftOnHover}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-300"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Operations Snapshot</p>
                    <p className="text-xs text-gray-500">Last 7 days</p>
                  </div>
                  <div className="mb-4 flex h-24 items-end gap-2">
                    {weeklyOpsSeries.map((value, index) => (
                      <motion.div
                        key={`ops-bar-${index}`}
                        initial={{ height: 0, opacity: 0 }}
                        whileInView={{ height: `${value}%`, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: index * 0.05 }}
                        className="w-full rounded-t-md bg-blue-500/80"
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {metricCards.map((metric) => (
                      <div key={metric.label} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">{metric.label}</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">{metric.value}</p>
                        <p className="text-xs font-medium text-green-700">{metric.delta}</p>
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
              {pricingPlans?.map((plan: SubscriptionPlan, index: number) => (
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
          <div className="mt-10 space-y-4">
            {faqItems.map((item, index) => (
              <motion.details
                key={item.question}
                {...revealCard(index)}
                whileHover={liftOnHover}
                className="rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-blue-300"
              >
                <summary className="cursor-pointer list-none text-base font-semibold text-gray-900">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{item.answer}</p>
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
              <Button asChild className="bg-white text-blue-700 hover:bg-blue-100">
                <Link href="/accounts">Create account</Link>
              </Button>
              <Button asChild variant="outline" className="border-white text-white hover:bg-blue-600 hover:text-white">
                <Link href="/accounts/signin">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-gray-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>© 2026 Intera Inventory. Built for dependable operations.</p>
          <div className="flex items-center gap-4">
            <Link href="/accounts/signin" className="hover:text-gray-700">
              Sign in
            </Link>
            <Link href="/accounts" className="hover:text-gray-700">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

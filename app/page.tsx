"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  BarChart3,
  Package,
  Zap,
  MessageSquare,
  TrendingUp,
  Shield,
  Globe,
  Smartphone,
  Menu,
  X,
} from "lucide-react"
import { useGetSubscriptionPlansQuery } from "@/redux/features/payment/paymentAPISlice"
import { SubscriptionPlan, Feature } from "@/components/interfaces/payment"
import { Skeleton } from "@/components/ui/skeleton"

// Conversation Bubble Component
function ConversationBubble({ message, isAI, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`flex mb-4 ${isAI ? "justify-start" : "justify-end"}`}
    >
      <div
        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
          isAI ? "bg-gray-200 border border-gray-300 text-gray-800" : "bg-gray-700 border border-gray-600 text-gray-100"
        }`}
      >
        <p className="text-sm font-sans">{message}</p>
      </div>
    </motion.div>
  )
}

// Pricing Card Component
function PricingCard({ plan, isPopular = false, index = 0 }: { plan: SubscriptionPlan; isPopular?: boolean; index?: number }) {
  const [showAllFeatures, setShowAllFeatures] = useState(false)

  const features: (Feature | { name: string })[] = [...plan.features]
  if (plan.intera_coins_reward) {
    features.unshift({ name: `${plan.intera_coins_reward} Intera Coins for agentic conversation` })
  }

  if (index > 0) {
    features.splice(1, 0, { name: "All features of the previous plan" })
  }

  const displayedFeatures = showAllFeatures ? features : features.slice(0, 10)

  return (
    <motion.div
      className={`relative h-auto rounded-2xl p-6 border-2 flex flex-col ${
        isPopular ? "bg-gray-50 border-gray-300 shadow-lg" : "bg-white border-gray-200 shadow-md"
      }`}
      onFocus={() => setShowAllFeatures(true)}
      onBlur={() => setShowAllFeatures(false)}
      onMouseEnter={() => setShowAllFeatures(true)}
      onMouseLeave={() => setShowAllFeatures(false)}
      whileHover={{ scale: 1.05 }}
      tabIndex={0}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gray-800 text-white px-4 py-1 rounded-full text-sm font-sans font-medium">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center mb-4">
        <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">{plan.name}</h3>
        <p className="text-gray-600 font-sans text-sm mb-4">{plan.description}</p>
        {plan.name === "Enterprise" ? (
          <div className="mb-4">
            <span className="text-2xl font-serif font-bold text-gray-800">Contact Us</span>
            <p className="text-gray-600 font-sans text-sm">Custom pricing</p>
          </div>
        ) : (
          <div className="mb-4">
            <span className="text-4xl font-serif font-bold text-gray-800">${plan.price}</span>
            <span className="text-gray-600 font-sans">/{plan.billing_cycle.toLowerCase()}</span>
          </div>
        )}
      </div>

      <ul className="space-y-2 text-sm font-sans mb-4 flex-grow">
        {displayedFeatures.map((feature, index) => (
          <li key={index} className="flex items-start text-gray-700">
            <span className="text-gray-500 mr-2">✓</span>
            {feature.name}
          </li>
        ))}
        {features.length > 10 && !showAllFeatures && (
          <li className="text-gray-500 text-xs italic mt-2">Focus to see all features...</li>
        )}
      </ul>

      <Button
        asChild
        className={`w-full mt-auto font-sans ${
          isPopular ? "bg-gray-800 hover:bg-gray-900 text-white" : "bg-gray-600 hover:bg-gray-700 text-white"
        }`}
      >
        {plan.name === "Enterprise" ? (
          <Link href="/contact">Contact Sales</Link>
        ) : (
          <Link href={`/accounts?plan_id=${plan.id}`}>Get Started</Link>
        )}
      </Button>
    </motion.div>
  )
}

export default function HomePage() {
  const [activeDemo, setActiveDemo] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const { data: pricingPlans, isLoading, error } = useGetSubscriptionPlansQuery({ application__slug: "inventory-system" })

  const conversations = [
    [
      { message: "Show me items running low on stock", isAI: false },
      {
        message: "Found 12 items below reorder point. Top priority: Wireless Headphones (3 left), Phone Cases (7 left)",
        isAI: true,
      },
      { message: "Reorder the headphones from our usual supplier", isAI: false },
      { message: "Order placed with TechSupply Co. 500 units, delivery in 3 days. Cost: $12,450", isAI: true },
    ],
    [
      { message: "What's our best selling category this month?", isAI: false },
      { message: "Electronics leads with 34% of sales ($89,340). Growth of 23% vs last month", isAI: true },
      { message: "Predict next month's demand for electronics", isAI: false },
      { message: "Based on trends, expecting 28% increase. Recommend increasing stock by 400 units", isAI: true },
    ],
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDemo((prev) => (prev + 1) % conversations.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 overflow-hidden">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="https://interabucket.s3.amazonaws.com/attachments/product/light_intera-202508252032.png" alt="Intera logo" width={60} height={60} className="block dark:hidden" />
              <Image src="https://interabucket.s3.amazonaws.com/attachments/product/dark_4-202508260716.png" alt="Intera logo" width={60} height={60} className="hidden dark:block" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-sans">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-sans">
                Pricing
              </a>
              <a href="#demo" className="text-gray-600 hover:text-gray-900 font-sans">
                Demo
              </a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 font-sans">
                About
              </a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 font-sans">
                Contact
              </a>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" asChild className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                <Link href="/accounts/signin">Sign In</Link>
              </Button>
              <Button asChild className="bg-gray-800 hover:bg-gray-900 text-white">
                <a href="#pricing">Get Started</a>
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-4">
              <Link href="/" className="flex items-center space-x-2">
              <Image src="https://interabucket.s3.amazonaws.com/attachments/product/light_intera-202508252032.png" alt="Intera logo" width={50} height={50} className="block dark:hidden" />
              <Image src="https://interabucket.s3.amazonaws.com/attachments/product/dark_4-202508260716.png" alt="Intera logo" width={50} height={50} className="hidden dark:block" />
            </Link>
                <a href="#features" className="text-gray-600 hover:text-gray-900 font-sans">
                  Features
                </a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-sans">
                  Pricing
                </a>
                <a href="#demo" className="text-gray-600 hover:text-gray-900 font-sans">
                  Demo
                </a>
                <a href="#about" className="text-gray-600 hover:text-gray-900 font-sans">
                  About
                </a>
                <a href="#contact" className="text-gray-600 hover:text-gray-900 font-sans">
                  Contact
                </a>
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                  <Button variant="ghost" asChild className="justify-start text-gray-600 hover:text-gray-900">
                    <Link href="/accounts/signin">Sign In</Link>
                  </Button>
                  <Button asChild className="bg-gray-800 hover:bg-gray-900 text-white">
                    <Link href="/accounts">Get Started</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 pt-20">
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Complete <span className="text-gray-700">Inventory</span>
              <br />
              Management System
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              Full-featured inventory management with offline-first POS, multi-location tracking, and optional AI agents
              that enhance your operations through natural conversation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-4 text-lg">
                <Link href="#pricing">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
            </div>
          </div>
        </div>
      </header>

      {/* Core Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Complete <span className="text-violet-400">IMS Features</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage inventory across multiple locations with optional AI enhancement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Multi-Location Tracking",
                description: "Track inventory across warehouses, stores, and distribution centers in real-time.",
                icon: Package,
              },
              {
                title: "Offline-First POS",
                description: "Point-of-sale system that works without internet, syncs when connected.",
                icon: Smartphone,
              },
              {
                title: "Barcode & QR Scanning",
                description: "Fast product identification with mobile scanning and label printing.",
                icon: Zap,
              },
              {
                title: "Purchase Order Management",
                description: "Create, track, and manage purchase orders with supplier integration.",
                icon: BarChart3,
              },
              {
                title: "Advanced Reporting",
                description: "Comprehensive analytics, stock reports, and business intelligence dashboards.",
                icon: TrendingUp,
              },
              {
                title: "Low Stock Alerts",
                description: "Automated notifications when inventory levels reach reorder points.",
                icon: Shield,
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-gray-50/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-300 hover:border-gray-400 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-4xl mb-4">
                  <feature.icon />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Enhancement Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Enhanced with <span className="text-violet-400">AI Agents</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Optional AI agents that work alongside your team to automate tasks and provide intelligent insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Conversational Interface",
                description: "Ask questions in natural language: 'How much iPhone stock do we have in NYC?'",
                icon: MessageSquare,
              },
              {
                title: "Predictive Reordering",
                description: "AI analyzes trends and automatically suggests optimal reorder quantities.",
                icon: TrendingUp,
              },
              {
                title: "Smart Supplier Matching",
                description: "AI finds the best suppliers based on price, quality, and delivery time.",
                icon: Globe,
              },
              {
                title: "Anomaly Detection",
                description: "Automatically detect unusual patterns that might indicate theft or errors.",
                icon: Shield,
              },
              {
                title: "Demand Forecasting",
                description: "Predict future demand based on historical data and market trends.",
                icon: BarChart3,
              },
              {
                title: "Automated Workflows",
                description: "Set up AI agents to handle routine tasks like reordering and reporting.",
                icon: Zap,
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-gray-50/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-300 hover:border-gray-400 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-4xl mb-4">
                  <feature.icon />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Conversation Demo Section */}
      <section id="conversation" className="py-20 relative bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              See AI Enhancement in <span className="text-violet-400">Action</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Watch how AI agents enhance your existing inventory workflows through natural conversation
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-gray-50/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-300">
              <div className="flex items-center mb-6">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                <span className="text-gray-600">AI Agent Online</span>
              </div>

              <div className="h-80 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeDemo}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5 }}
                  >
                    {conversations[activeDemo].map((msg, index) => (
                      <ConversationBubble key={index} message={msg.message} isAI={msg.isAI} delay={index * 1.5} />
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-8">
              <motion.div
                className="bg-gray-50/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-300"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-xl font-bold text-violet-400 mb-3">Natural Language Queries</h3>
                <p className="text-gray-600">
                  Ask complex questions about your inventory using everyday language instead of navigating dashboards.
                </p>
              </motion.div>

              <motion.div
                className="bg-gray-50/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-300"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-xl font-bold text-violet-400 mb-3">Intelligent Automation</h3>
                <p className="text-gray-600">
                  AI agents handle routine tasks while you focus on strategic decisions and customer service.
                </p>
              </motion.div>

              <motion.div
                className="bg-gray-50/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-300"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-xl font-bold text-violet-400 mb-3">Proactive Insights</h3>
                <p className="text-gray-600">
                  Get alerts and recommendations before problems occur, not after they impact your business.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Choose Your <span className="text-violet-400">IMS Plan</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Complete inventory management with optional AI enhancement. Start with core features, add AI when ready.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {isLoading &&
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="relative h-96">
                  <Skeleton className="w-full h-full rounded-2xl" />
                </div>
              ))}
            {error && <p>Error loading plans</p>}
            {pricingPlans?.map((plan, index) => (
              <PricingCard key={plan.id} plan={plan} isPopular={index === 2} index={index} />
            ))}
          </div>

        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div>
              <div className="text-4xl font-bold text-violet-400">98%</div>
              <div className="text-gray-600">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-violet-400">$2.3M</div>
              <div className="text-gray-600">Saved Monthly</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-violet-400">45%</div>
              <div className="text-gray-600">Cost Reduction</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-violet-400">24/7</div>
              <div className="text-gray-600">AI Monitoring</div>
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
              <Link href="/" className="flex items-center space-x-2">
              <Image src="https://interabucket.s3.amazonaws.com/attachments/product/light_intera-202508252032.png" alt="Intera logo" width={100} height={100} className="hidden dark:block" />
              <Image src="https://interabucket.s3.amazonaws.com/attachments/product/dark_4-202508260716.png" alt="Intera logo" width={100} height={100} className="block dark:hidden" />
            </Link>
              </div>
              <p className="text-gray-400">The central hub for intelligent inventory and POS management.</p>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-4 text-white">Product</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/ai-agents" className="text-gray-400 hover:text-violet-400 transition">
                    AI Agents
                  </Link>
                </li>
                <li>
                  <Link href="/voice-interface" className="text-gray-400 hover:text-violet-400 transition">
                    Voice Interface
                  </Link>
                </li>
                <li>
                  <Link href="/integrations" className="text-gray-400 hover:text-violet-400 transition">
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link href="/api" className="text-gray-400 hover:text-violet-400 transition">
                    API
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-4 text-white">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/documentation" className="text-gray-400 hover:text-violet-400 transition">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/ai-training" className="text-gray-400 hover:text-violet-400 transition">
                    AI Training
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="text-gray-400 hover:text-violet-400 transition">
                    Support
                  </Link>
                </li>
                <li>
                  <Link href="/community" className="text-gray-400 hover:text-violet-400 transition">
                    Community
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-4 text-white">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-violet-400 transition">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-gray-400 hover:text-violet-400 transition">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-400 hover:text-violet-400 transition">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-400 hover:text-violet-400 transition">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-700 text-center">
            <p className="text-gray-400">© 2025 INTERA. All rights reserved. Built with AI.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
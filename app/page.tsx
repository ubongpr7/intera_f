"use client"
import 'home.css';
import { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Sphere, MeshDistortMaterial, Float, Environment } from "@react-three/drei"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
function AnimatedSphere() {
  const meshRef = useRef()

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1, 100, 200]} scale={2}>
        <MeshDistortMaterial
          color="#a855f7"
          attach="material"
          distort={0.3}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  )
}

function ConversationBubble({ message, isAI, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      className={`flex ${isAI ? "justify-start" : "justify-end"} mb-4`}
    >
      <div
        className={`max-w-xs px-4 py-2 rounded-2xl glass-effect ${
          isAI ? "bg-purple-800/20 text-purple-100" : "bg-violet-600/30 text-white"
        }`}
      >
        <p className="text-sm font-sans">{message}</p>
      </div>
    </motion.div>
  )
}

function PricingCube({ plan, isPopular = false }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className="perspective-1000 h-80 w-full"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
    >
      <motion.div
        className={`transform-3d w-full h-full relative cursor-pointer ${isPopular ? "animate-pulse-glow" : ""}`}
        animate={{
          rotateY: isHovered ? 180 : 0,
        }}
        transition={{ duration: 0.8 }}
      >
        {/* Front Face */}
        <div className="absolute inset-0 w-full h-full backface-hidden">
          <Card
            className={`h-full glass-effect border-2 ${
              isPopular
                ? "border-violet-400 bg-gradient-to-br from-purple-900/50 to-violet-800/30"
                : "border-purple-700/50 bg-purple-900/20"
            }`}
          >
            <CardContent className="p-8 h-full flex flex-col justify-between">
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-serif font-bold">
                    Most Popular
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-2xl font-serif font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-purple-200 font-sans mb-4">{plan.tagline}</p>
                <div className="text-4xl font-serif font-bold text-violet-400 mb-2">
                  ${plan.price}
                  <span className="text-lg text-purple-300">/month</span>
                </div>
              </div>
              <Button
                className={`w-full ${
                  isPopular
                    ? "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                    : "bg-purple-700 hover:bg-purple-600"
                } text-white font-sans`}
              >
                Start {plan.name}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Back Face */}
        <div className="absolute inset-0 w-full h-full backface-hidden" style={{ transform: "rotateY(180deg)" }}>
          <Card className="h-full glass-effect border-2 border-purple-700/50 bg-purple-900/20">
            <CardContent className="p-6 h-full">
              <h4 className="text-lg font-serif font-bold text-white mb-4">Key Features</h4>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center text-purple-200 font-sans text-sm"
                  >
                    <div className="w-2 h-2 bg-violet-400 rounded-full mr-3 flex-shrink-0"></div>
                    {feature}
                  </motion.li>
                ))}
              </ul>
              <div className="mt-6 p-4 bg-gradient-to-r from-violet-600/20 to-purple-600/20 rounded-lg">
                <p className="text-violet-300 font-sans text-sm">
                  Projected savings: <span className="font-bold text-violet-400">${plan.savings}/month</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Home() {
  const [currentConversation, setCurrentConversation] = useState(0)
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])

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

  const pricingPlans = [
    {
      name: "Starter",
      tagline: "Essential inventory management",
      price: 49,
      savings: 1200,
      features: [
        "Multi-location inventory",
        "POS integration (offline-first)",
        "Basic reporting & analytics",
        "Barcode scanning",
        "Low stock alerts",
        "5 user accounts",
        "Add-on: 1 AI Agent (+$20/mo)",
      ],
    },
    {
      name: "Professional",
      tagline: "Advanced features + AI assistance",
      price: 149,
      savings: 4500,
      features: [
        "Everything in Starter",
        "Advanced reporting suite",
        "Supplier management",
        "Purchase order automation",
        "Multi-warehouse tracking",
        "Unlimited users",
        "Included: 3 AI Agents",
        "API access",
      ],
    },
    {
      name: "Enterprise",
      tagline: "Full-scale operations + AI workforce",
      price: 399,
      savings: 12000,
      features: [
        "Everything in Professional",
        "Custom integrations",
        "White-label options",
        "Advanced forecasting",
        "Multi-company support",
        "Dedicated support",
        "Unlimited AI Agents",
        "Custom AI training",
      ],
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentConversation((prev) => (prev + 1) % conversations.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Hero Section */}
      <header className="relative min-h-screen flex items-center justify-center gradient-mesh">
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 5] }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <AnimatedSphere />
            <Environment preset="night" />
            <OrbitControls enableZoom={false} enablePan={false} />
          </Canvas>
        </div>

        <nav className="absolute top-0 left-0 right-0 z-20 py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center">
              <div className="bg-white p-1 rounded-lg">
                <div className="bg-gradient-to-r from-purple-600 to-violet-600 w-10 h-10 rounded-md flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                    <circle cx="6" cy="6" r="1.5" fill="currentColor" opacity="0.8" />
                    <circle cx="18" cy="6" r="1.5" fill="currentColor" opacity="0.8" />
                    <circle cx="6" cy="18" r="1.5" fill="currentColor" opacity="0.8" />
                    <circle cx="18" cy="18" r="1.5" fill="currentColor" opacity="0.8" />
                    <line x1="12" y1="12" x2="6" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                    <line x1="12" y1="12" x2="18" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                    <line x1="12" y1="12" x2="6" y2="18" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                    <line x1="12" y1="12" x2="18" y2="18" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                  </svg>
                </div>
              </div>
              <span className="ml-3 text-xl font-serif font-bold">INTERA</span>
            </div>
            <div className="hidden md:flex space-x-8 font-sans">
              <Link href="#features" className="hover:text-violet-300 transition">
                Features
              </Link>
              <Link href="#conversation" className="hover:text-violet-300 transition">
                AI Demo
              </Link>
              <Link href="#pricing" className="hover:text-violet-300 transition">
                Pricing
              </Link>
              <Link href="#testimonials" className="hover:text-violet-300 transition">
                Reviews
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                className="border-violet-400 text-violet-400 hover:bg-violet-400 hover:text-white font-sans bg-transparent"
              >
                Sign In
              </Button>
              <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 font-sans">
                Start Free Trial
              </Button>
            </div>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-5xl md:text-7xl font-serif font-bold leading-tight mb-8">
              Complete Inventory
              <span className="block bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                Management System
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-purple-200 max-w-3xl mx-auto mb-12 font-sans">
              Full-featured inventory management with offline-first POS, multi-location tracking, and optional AI agents
              that enhance your operations through natural conversation.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-lg px-8 py-4 font-sans"
              >
                Start Free Trial
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-violet-400 text-violet-400 hover:bg-violet-400 hover:text-white text-lg px-8 py-4 font-sans bg-transparent"
              >
                View Demo
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Floating Data Points */}
        <div className="absolute inset-0 z-5">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-4 h-4 bg-violet-400 rounded-full opacity-60"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 40}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.5,
              }}
            />
          ))}
        </div>
      </header>

      {/* Core Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-transparent to-purple-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              Complete <span className="text-violet-400">IMS Features</span>
            </h2>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto font-sans">
              Everything you need to manage inventory across multiple locations with optional AI enhancement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Multi-Location Tracking",
                description: "Track inventory across warehouses, stores, and distribution centers in real-time.",
                icon: "🏢",
              },
              {
                title: "Offline-First POS",
                description: "Point-of-sale system that works without internet, syncs when connected.",
                icon: "💳",
              },
              {
                title: "Barcode & QR Scanning",
                description: "Fast product identification with mobile scanning and label printing.",
                icon: "📱",
              },
              {
                title: "Purchase Order Management",
                description: "Create, track, and manage purchase orders with supplier integration.",
                icon: "📋",
              },
              {
                title: "Advanced Reporting",
                description: "Comprehensive analytics, stock reports, and business intelligence dashboards.",
                icon: "📊",
              },
              {
                title: "Low Stock Alerts",
                description: "Automated notifications when inventory levels reach reorder points.",
                icon: "🔔",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="glass-effect rounded-2xl p-8 border border-purple-700/50 hover:border-violet-400/50 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-serif font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-purple-200 font-sans">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Enhancement Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              Enhanced with <span className="text-violet-400">AI Agents</span>
            </h2>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto font-sans">
              Optional AI agents that work alongside your team to automate tasks and provide intelligent insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Conversational Interface",
                description: "Ask questions in natural language: 'How much iPhone stock do we have in NYC?'",
                icon: "💬",
              },
              {
                title: "Predictive Reordering",
                description: "AI analyzes trends and automatically suggests optimal reorder quantities.",
                icon: "🔮",
              },
              {
                title: "Smart Supplier Matching",
                description: "AI finds the best suppliers based on price, quality, and delivery time.",
                icon: "🤝",
              },
              {
                title: "Anomaly Detection",
                description: "Automatically detect unusual patterns that might indicate theft or errors.",
                icon: "🛡️",
              },
              {
                title: "Demand Forecasting",
                description: "Predict future demand based on historical data and market trends.",
                icon: "📈",
              },
              {
                title: "Automated Workflows",
                description: "Set up AI agents to handle routine tasks like reordering and reporting.",
                icon: "⚙️",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="glass-effect rounded-2xl p-8 border border-purple-700/50 hover:border-violet-400/50 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-serif font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-purple-200 font-sans">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Conversation Demo Section */}
      <section id="conversation" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              See AI Enhancement in <span className="text-violet-400">Action</span>
            </h2>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto font-sans">
              Watch how AI agents enhance your existing inventory workflows through natural conversation
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="glass-effect rounded-3xl p-8 border border-purple-700/50">
              <div className="flex items-center mb-6">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                <span className="text-purple-200 font-sans">AI Agent Online</span>
              </div>

              <div className="h-80 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentConversation}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5 }}
                  >
                    {conversations[currentConversation].map((msg, index) => (
                      <ConversationBubble key={index} message={msg.message} isAI={msg.isAI} delay={index * 1.5} />
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-8">
              <motion.div
                className="glass-effect rounded-2xl p-6 border border-purple-700/50"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-xl font-serif font-bold text-violet-400 mb-3">Natural Language Queries</h3>
                <p className="text-purple-200 font-sans">
                  Ask complex questions about your inventory using everyday language instead of navigating dashboards.
                </p>
              </motion.div>

              <motion.div
                className="glass-effect rounded-2xl p-6 border border-purple-700/50"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-xl font-serif font-bold text-violet-400 mb-3">Intelligent Automation</h3>
                <p className="text-purple-200 font-sans">
                  AI agents handle routine tasks while you focus on strategic decisions and customer service.
                </p>
              </motion.div>

              <motion.div
                className="glass-effect rounded-2xl p-6 border border-purple-700/50"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-xl font-serif font-bold text-violet-400 mb-3">Proactive Insights</h3>
                <p className="text-purple-200 font-sans">
                  Get alerts and recommendations before problems occur, not after they impact your business.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              Choose Your <span className="text-violet-400">IMS Plan</span>
            </h2>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto font-sans">
              Complete inventory management with optional AI enhancement. Start with core features, add AI when ready.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <PricingCube key={index} plan={plan} isPopular={index === 1} />
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-purple-200 font-sans mb-6">
              All plans include 14-day free trial • No setup fees • Cancel anytime
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 font-sans"
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-gradient-to-b from-purple-950/50 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div>
              <div className="text-4xl font-serif font-bold text-violet-400">98%</div>
              <div className="text-purple-200 font-sans">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-4xl font-serif font-bold text-violet-400">$2.3M</div>
              <div className="text-purple-200 font-sans">Saved Monthly</div>
            </div>
            <div>
              <div className="text-4xl font-serif font-bold text-violet-400">45%</div>
              <div className="text-purple-200 font-sans">Cost Reduction</div>
            </div>
            <div>
              <div className="text-4xl font-serif font-bold text-violet-400">24/7</div>
              <div className="text-purple-200 font-sans">AI Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 gradient-mesh">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8">
              Ready to Meet Your <span className="text-violet-400">AI Inventory Team?</span>
            </h2>
            <p className="text-xl text-purple-200 mb-12 font-sans">
              Join the inventory revolution. Your AI agents are waiting to transform your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-lg px-12 py-4 font-sans animate-pulse-glow"
              >
                Start Your AI Agent Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-violet-400 text-violet-400 hover:bg-violet-400 hover:text-white text-lg px-12 py-4 font-sans bg-transparent"
              >
                Schedule Demo
              </Button>
            </div>
            <p className="text-purple-300 mt-8 font-sans">
              No credit card required • AI agents activate instantly • 14-day free trial
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-purple-950/80 border-t border-purple-800/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-white p-1 rounded-lg">
                  <div className="bg-gradient-to-r from-purple-600 to-violet-600 w-8 h-8 rounded-md flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                      <circle cx="12" cy="12" r="2" fill="currentColor" />
                      <circle cx="6" cy="6" r="1.5" fill="currentColor" opacity="0.8" />
                      <circle cx="18" cy="6" r="1.5" fill="currentColor" opacity="0.8" />
                      <circle cx="6" cy="18" r="1.5" fill="currentColor" opacity="0.8" />
                      <circle cx="18" cy="18" r="1.5" fill="currentColor" opacity="0.8" />
                      <line x1="12" y1="12" x2="6" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                      <line x1="12" y1="12" x2="18" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                      <line x1="12" y1="12" x2="6" y2="18" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                      <line x1="12" y1="12" x2="18" y2="18" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                    </svg>
                  </div>
                </div>
                <span className="ml-3 text-xl font-serif font-bold">INTERA</span>
              </div>
              <p className="text-purple-300 font-sans">The central hub for intelligent inventory and POS management.</p>
            </div>

            <div>
              <h4 className="text-lg font-serif font-bold mb-4 text-white">Product</h4>
              <ul className="space-y-2 font-sans">
                <li>
                  <Link href="#" className="text-purple-300 hover:text-violet-400 transition">
                    AI Agents
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-purple-300 hover:text-violet-400 transition">
                    Voice Interface
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-purple-300 hover:text-violet-400 transition">
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-purple-300 hover:text-violet-400 transition">
                    API
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-serif font-bold mb-4 text-white">Resources</h4>
              <ul className="space-y-2 font-sans">
                <li>
                  <Link href="#" className="text-purple-300 hover:text-violet-400 transition">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-purple-300 hover:text-violet-400 transition">
                    AI Training
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-purple-300 hover:text-violet-400 transition">
                    Support
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-purple-300 hover:text-violet-400 transition">
                    Community
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-serif font-bold mb-4 text-white">Company</h4>
              <ul className="space-y-2 font-sans">
                <li>
                  <Link href="#" className="text-purple-300 hover:text-violet-400 transition">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-purple-300 hover:text-violet-400 transition">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-purple-300 hover:text-violet-400 transition">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-purple-300 hover:text-violet-400 transition">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-purple-800/50 text-center">
            <p className="text-purple-400 font-sans">© 2025 INTERA. All rights reserved. Built with AI.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// app/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import Link from 'next/link';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Chart data
  const inventoryData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'With Intera',
        data: [65, 59, 80, 81, 76, 90],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        tension: 0.3,
      },
      {
        label: 'Without Intera',
        data: [28, 48, 40, 19, 46, 27],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        tension: 0.3,
      }
    ]
  };

  const salesData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Sales ($)',
        data: [1200, 1900, 1500, 1800, 2200, 3000, 2800],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
      }
    ]
  };

  const categoryData = {
    labels: ['Electronics', 'Clothing', 'Groceries', 'Home Goods', 'Toys'],
    datasets: [
      {
        label: 'Inventory Distribution',
        data: [12, 19, 15, 28, 26],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Features data
  const features = [
    {
      title: "Offline-First POS",
      description: "Process transactions even without internet connectivity. All data syncs automatically when connection is restored.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    },
    {
      title: "Real-Time Inventory Tracking",
      description: "Monitor stock levels across multiple locations with live updates and automated alerts.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: "AI-Powered Forecasting",
      description: "Predict demand with 90% accuracy using machine learning algorithms to optimize stock levels.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      title: "Batch & Expiry Tracking",
      description: "Manage perishables and track batches with automated expiry alerts to minimize waste.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Multi-Location Sync",
      description: "Seamlessly manage inventory across warehouses, stores, and online channels from one platform.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      title: "Advanced Reporting",
      description: "Generate insightful reports on sales, inventory turnover, profitability, and more.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Retail Store Owner",
      content: "Intera reduced our stockouts by 85% and improved inventory accuracy to 99.7%. The offline POS saved us during an internet outage!"
    },
    {
      name: "Michael Chen",
      role: "E-commerce Manager",
      content: "The AI forecasting predicted our holiday demand perfectly. We increased sales by 30% without overstocking."
    },
    {
      name: "David Rodriguez",
      role: "Restaurant Chain Owner",
      content: "Food waste decreased by 45% thanks to Intera's expiry tracking. Our inventory costs are now perfectly optimized."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <header className="relative bg-gradient-to-r from-blue-900 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-900/20 to-indigo-900/80"></div>
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-500/10 to-transparent"></div>
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-blue-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-purple-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <nav className="relative z-10 py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-white p-1 rounded-lg">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 w-10 h-10 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-xl">I</span>
                </div>
              </div>
              <span className="ml-3 text-xl font-bold">INTERA</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="hover:text-blue-300 transition">Features</a>
              <a href="#benefits" className="hover:text-blue-300 transition">Benefits</a>
              <a href="#dashboard" className="hover:text-blue-300 transition">Dashboard</a>
              <a href="#testimonials" className="hover:text-blue-300 transition">Testimonials</a>
            </div>
            <div className="flex items-center space-x-4">
              <Link href={'/accounts'} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300">
                Get Started
              </Link>
              <Link href={'/accounts/signin'} className="border-2 border-blue-600 bg-transparent hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300">
                Signin
              </Link>
            </div>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
                Revolutionize Your Inventory with <span className="text-blue-400">AI-Powered</span> Precision
              </h1>
              <p className="mt-6 text-xl text-blue-100 max-w-2xl">
                Intera's offline-first POS and inventory management system eliminates stockouts, reduces waste, and boosts profits with real-time insights and AI forecasting.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                <button className="bg-white text-blue-900 hover:bg-gray-100 font-bold py-4 px-8 rounded-lg text-lg transition duration-300 shadow-lg">
                  Start Free Trial
                </button>
                <button className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-medium py-4 px-8 rounded-lg text-lg transition duration-300">
                  Watch Demo
                </button>
              </div>
              <div className="mt-8 flex items-center">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="w-10 h-10 rounded-full bg-blue-500 border-2 border-blue-800"></div>
                  ))}
                </div>
                <p className="ml-4 text-blue-200">Join 2,500+ businesses optimizing inventory with Intera</p>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700">
                <div className="absolute -inset-2 bg-blue-500 rounded-2xl blur opacity-20"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-sm text-gray-300">POS Terminal - Online</div>
                  </div>
                  
                  <div className="bg-gray-900 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-white font-medium">Order #1425</div>
                      <div className="text-green-500 text-sm font-medium flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Synced
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <div className="text-gray-400">Wireless Headphones</div>
                        <div className="text-white">$129.99</div>
                      </div>
                      <div className="flex justify-between">
                        <div className="text-gray-400">Phone Case</div>
                        <div className="text-white">$24.99</div>
                      </div>
                      <div className="flex justify-between">
                        <div className="text-gray-400">Screen Protector</div>
                        <div className="text-white">$9.99</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between">
                      <div className="text-gray-400">Total</div>
                      <div className="text-white font-bold">$164.97</div>
                    </div>
                    
                    <div className="mt-6 flex justify-between">
                      <button className="bg-gray-700 text-gray-300 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition">
                        Cancel
                      </button>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">
                        Process Payment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-8 -right-8 bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 w-64 shadow-lg border border-gray-700">
                <div className="text-white text-sm mb-2">Offline Mode Active</div>
                <div className="flex items-center text-yellow-400 text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Processing offline - will sync when connection restored
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-900">98%</div>
              <div className="mt-2 text-gray-600">Reduction in stockouts</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-900">45%</div>
              <div className="mt-2 text-gray-600">Less inventory waste</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-900">30%</div>
              <div className="mt-2 text-gray-600">Increase in sales</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-900">99.7%</div>
              <div className="mt-2 text-gray-600">Inventory accuracy</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Powerful Features for <span className="text-blue-600">Seamless Inventory Control</span>
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Everything you need to optimize stock levels, reduce costs, and boost profitability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="mt-6 text-xl font-bold text-center text-gray-900">{feature.title}</h3>
                <p className="mt-4 text-gray-600 text-center">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section id="dashboard" className="py-20 bg-gradient-to-b from-gray-100 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              <span className="text-blue-600">Real-Time Insights</span> at Your Fingertips
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Our intuitive dashboard gives you complete visibility into your inventory performance
            </p>
          </div>

          <div className="bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-gray-800 py-3 px-6 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-gray-300 text-sm">dashboard.intera.app</div>
              <div className="w-24"></div>
            </div>
            
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-gray-300 font-medium mb-4">Inventory Performance</h3>
                <div className="h-80">
                  <Line 
                    data={inventoryData} 
                    options={{ 
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'top',
                          labels: {
                            color: '#e2e8f0'
                          }
                        },
                        title: {
                          display: false
                        }
                      },
                      scales: {
                        x: {
                          grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                          },
                          ticks: {
                            color: '#94a3b8'
                          }
                        },
                        y: {
                          grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                          },
                          ticks: {
                            color: '#94a3b8'
                          }
                        }
                      }
                    }} 
                  />
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-gray-300 font-medium mb-4">Sales Analytics</h3>
                <div className="h-80">
                  <Bar 
                    data={salesData} 
                    options={{ 
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'top',
                          labels: {
                            color: '#e2e8f0'
                          }
                        },
                        title: {
                          display: false
                        }
                      },
                      scales: {
                        x: {
                          grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                          },
                          ticks: {
                            color: '#94a3b8'
                          }
                        },
                        y: {
                          grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                          },
                          ticks: {
                            color: '#94a3b8'
                          }
                        }
                      }
                    }} 
                  />
                </div>
              </div>
              
              <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6">
                <h3 className="text-gray-300 font-medium mb-4">Inventory Distribution</h3>
                <div className="h-80">
                  <Pie 
                    data={categoryData} 
                    options={{ 
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            color: '#e2e8f0'
                          }
                        }
                      }
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-gradient-to-b from-white to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Transform Your Business with <span className="text-blue-600">Intera</span>
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Discover how our solution helps businesses across industries optimize their operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900">Key Benefits</h3>
                
                <div className="mt-8 space-y-6">
                  {[
                    "Prevent stockouts and lost sales with AI-driven demand forecasting",
                    "Reduce excess inventory costs by up to 45%",
                    "Eliminate manual errors with automated inventory tracking",
                    "Optimize warehouse space with intelligent organization tools",
                    "Improve cash flow with better inventory turnover"
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <p className="ml-4 text-gray-700">{benefit}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900">Industry Solutions</h3>
                
                <div className="mt-8 space-y-6">
                  {[
                    { industry: "E-commerce", solution: "Global inventory tracking & 24/7 order processing" },
                    { industry: "Food Service", solution: "Expiry tracking & waste reduction" },
                    { industry: "Retail", solution: "Multi-store inventory synchronization" },
                    { industry: "Electronics", solution: "High-value item tracking & serial number management" },
                    { industry: "Pharmaceuticals", solution: "Compliance & batch tracking" }
                  ].map((item, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-1">
                      <h4 className="font-bold text-gray-900">{item.industry}</h4>
                      <p className="text-gray-600">{item.solution}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gradient-to-b from-gray-100 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Trusted by <span className="text-blue-600">Industry Leaders</span>
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              See what our customers say about transforming their inventory management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="bg-white rounded-xl p-8 shadow-lg"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-lg font-bold text-white">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-blue-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.content}"</p>
                <div className="mt-6 flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold max-w-3xl mx-auto">
            Ready to Transform Your Inventory Management?
          </h2>
          <p className="mt-6 text-xl text-blue-100 max-w-2xl mx-auto">
            Join thousands of businesses optimizing their inventory with Intera's AI-powered platform
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button className="bg-white text-blue-900 hover:bg-gray-100 font-bold py-4 px-8 rounded-lg text-lg transition duration-300 shadow-lg">
              Start Your Free Trial
            </button>
            <button className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-medium py-4 px-8 rounded-lg text-lg transition duration-300">
              Schedule a Demo
            </button>
          </div>
          <p className="mt-8 text-blue-200">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center">
                <div className="bg-white p-1 rounded-lg">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 w-8 h-8 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">I</span>
                  </div>
                </div>
                <span className="ml-3 text-xl font-bold">INTERA</span>
              </div>
              <p className="mt-4 text-gray-400">
                Revolutionizing inventory management with AI-powered precision and offline-first reliability.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Solutions</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Demo</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Support</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Partners</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© {new Date().getFullYear()} Intera. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
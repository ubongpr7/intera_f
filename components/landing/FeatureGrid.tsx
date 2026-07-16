// components/landing/FeatureGrid.tsx
interface FeatureCardProps {
    title: string;
    description: string;
    icon: string;
  }
  
  const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon }) => (
    <div className="bg-white  p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
      <div className="w-12 h-12 bg-blue-100  rounded-lg mb-4 flex items-center justify-center">
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="text-xl font-semibold mb-2 ">{title}</h3>
      <p className="text-gray-600 ">{description}</p>
    </div>
  );
  
export default function FeatureGrid() {
    const features = [
      {
        icon: "📦",
        title: "Inventory Control",
        description: "Track products, balances, reorder rules, reservations, and movement history across locations."
      },
      {
        icon: "💳",
        title: "POS & Offline Selling",
        description: "Run checkout, sessions, discounts, and inventory-aware sales even when connectivity drops."
      },
      {
        icon: "📊",
        title: "Business Intelligence",
        description: "Review inventory, purchasing, POS, and realtime operational analytics, then query years of history in natural language and get answers in seconds."
      },
      {
        icon: "🗣️",
        title: "Conversational Intelligence",
        description: "Ask plain-language questions about sales, stock, purchasing, and staff activity, then turn the answer into charts, lists, or actions."
      },
      {
        icon: "📡",
        title: "Live Operations Monitor",
        description: "Follow sales, receiving, stock signals, and risk changes as they happen through realtime operational streams."
      },
      {
        icon: "🧩",
        title: "External API Platform",
        description: "Build custom integrations on top of the platform API when you need a separate, metered developer surface. Coming soon."
      },
      {
        icon: "🔄",
        title: "Purchasing & Replenishment",
        description: "Create purchase orders, approve them, receive goods, and manage supplier returns."
      },
      {
        icon: "🛡️",
        title: "Audit, Traceability & Anti-theft",
        description: "Trace stock movement and activity history so suspicious gaps are easier to spot and investigate."
      },
      {
        icon: "👥",
        title: "Team Access",
        description: "Invite staff and assign roles, groups, and permissions independently for each workspace."
      }
    ];
  
    return (
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </section>
    );
  }

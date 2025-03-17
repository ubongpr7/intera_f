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
        title: "Real-Time Stock Tracking",
        description: "Monitor inventory levels across multiple warehouses with live updates"
      },
      {
        icon: "💳",
        title: "Flexible POS System",
        description: "Support for cash, card, transfers, and credit sales with partial payments"
      },
      {
        icon: "📊",
        title: "Smart Analytics",
        description: "Profit/loss, sales trends, and dead stock identification reports"
      },
      {
        icon: "🔄",
        title: "Automated Reordering",
        description: "Smart purchase orders based on minimum stock levels"
      }
    ];
  
    return (
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </section>
    );
  }
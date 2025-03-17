// components/landing/ReportsShowcase.tsx
export default function ReportsShowcase() {
    const reports = [
      { title: "Stock Analysis", type: "stock" },
      { title: "Sales Trends", type: "sales" },
      { title: "Expense Tracking", type: "expenses" },
      { title: "Purchase History", type: "purchases" }
    ];
  
    return (
      <section className="py-16 px-4 bg-blue-50 ">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 ">Comprehensive Reporting Suite</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reports.map((report, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-full h-48 bg-gray-100  rounded-lg mb-4"></div>
                <h3 className="text-lg font-semibold ">{report.title}</h3>
                <p className="text-gray-600  mt-2">
                  {report.type === 'stock' && 'Track inventory across locations'}
                  {report.type === 'sales' && 'Analyze sales performance trends'}
                  {report.type === 'expenses' && 'Monitor operational costs'}
                  {report.type === 'purchases' && 'Review supplier transactions'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
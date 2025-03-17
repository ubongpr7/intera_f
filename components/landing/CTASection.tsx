// components/landing/CTASection.tsx
export default function CTASection() {
    return (
      <section className="py-20 px-4 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Revolutionize Your Inventory?</h2>
          <p className="text-xl mb-8">Join hundreds of businesses optimizing their operations with Intera</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-gray-50 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition">
              Start Free Trial
            </button>
            <button className="border border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>
    );
  }
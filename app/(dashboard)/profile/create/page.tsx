import CompanyProfileContainer from "@/components/company/CompanyProfileContainer";
import { Building2, ClipboardCheck, Rocket, ShieldCheck, Sparkles } from "lucide-react";

const setupHighlights = [
  {
    title: "Faster team onboarding",
    description: "Create one company workspace and start assigning members and roles immediately.",
    icon: Building2,
  },
  {
    title: "Operational clarity",
    description: "Capture your basic profile, address, and policies so every service runs in one context.",
    icon: ClipboardCheck,
  },
  {
    title: "Production-ready defaults",
    description: "Set the minimum details once; improve the profile over time without breaking workflows.",
    icon: Rocket,
  },
];

const setupSteps = [
  "Add your company identity and currency",
  "Provide headquarters location details",
  "Attach social links and public references",
  "Configure recall, reorder, and inventory policies",
];

export default function CreateCompanyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8  lg:px-8 lg:py-10">
        <section className="space-y-6 rounded-3xl border border-blue-100 bg-white/90 p-6 shadow-sm lg:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            Company Workspace Setup
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 lg:text-4xl">
              Create a company profile your team can run on
            </h1>
            <p className="text-sm leading-6 text-gray-600 lg:text-base">
              This setup defines your active business context across inventory, products, orders, analytics, and agent
              workflows. Start with the essentials now, then iterate as your operation grows.
            </p>
          </div>

          <div className="space-y-3">
            {setupHighlights.map((item) => (
              <article
                key={item.title}
                className="group rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white hover:shadow-sm"
              >
                <div className="mb-2 inline-flex items-center justify-center rounded-xl bg-blue-100 p-2 text-blue-700 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <item.icon className="h-4 w-4" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">{item.title}</h2>
                <p className="mt-1 text-sm text-gray-600">{item.description}</p>
              </article>
            ))}
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-indigo-700">
              <ShieldCheck className="h-4 w-4" />
              <p className="text-sm font-semibold">Setup checklist</p>
            </div>
            <ol className="space-y-2 text-sm text-indigo-900">
              {setupSteps.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-200 text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="w-full">
          <CompanyProfileContainer />
        </section>
      </div>
    </div>
  );
}

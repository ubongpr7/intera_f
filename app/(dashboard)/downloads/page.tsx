import { Download, Monitor, Smartphone } from "lucide-react"

const downloads = [
  {
    platform: "macOS",
    description: "Install Intera IMS on a Mac computer.",
    icon: Monitor,
    filename: "Intera IMS-1.0.0.dmg",
    href: "https://intera-app-downloads-714066696113.s3.us-east-2.amazonaws.com/releases/macos/Intera-IMS-1.0.0.dmg",
  },
  {
    platform: "Android",
    description: "Install the Intera IMS Android app on a supported device.",
    icon: Smartphone,
    filename: "InteraIMS.apk",
    href: "https://intera-app-downloads-714066696113.s3.us-east-2.amazonaws.com/releases/android/InteraIMS.apk",
  },
]

export default function DownloadsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Intera IMS apps</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Download the app for your device</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
          Use Intera IMS on desktop or mobile. These downloads are available to workspaces with an active subscription.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {downloads.map(({ platform, description, icon: Icon, filename, href }) => (
            <article key={platform} className="flex flex-col justify-between rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
              <div>
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-blue-500/15 p-3 text-blue-300"><Icon className="h-6 w-6" /></span>
                  <h2 className="text-xl font-bold">{platform}</h2>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-300">{description}</p>
                <p className="mt-2 break-all text-xs text-slate-500">{filename}</p>
              </div>
              <a
                href={href}
                download
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-400"
              >
                <Download className="h-4 w-4" />
                Download {platform} app
              </a>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}

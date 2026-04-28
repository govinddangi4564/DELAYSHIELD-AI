import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BrainCircuit,
  Gauge,
  Map,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck
} from 'lucide-react'

const capabilities = [
  {
    icon: BrainCircuit,
    title: 'AI Decision Engine',
    copy: 'Turn traffic, weather, and shipment risk into recommended actions before delays become losses.'
  },
  {
    icon: Map,
    title: 'Route Intelligence',
    copy: 'Compare alternate corridors, spot vulnerable lanes, and keep planners focused on the highest-risk routes.'
  },
  {
    icon: TrendingUp,
    title: 'Loss Prevention',
    copy: 'Measure cost impact in real time so reroutes and interventions are backed by operational tradeoffs.'
  }
]

const stats = [
  { label: 'Prediction Layers', value: 'Traffic + Weather + Cost' },
  { label: 'Ops View', value: 'Live shipment risk radar' },
  { label: 'Decision Tempo', value: 'Built for rapid dispatch calls' }
]

const workflow = [
  'Ingest route, ETA, and shipment priority data.',
  'Detect disruption patterns before SLA damage spreads.',
  'Recommend reroutes, holds, or reprioritization with cost context.',
  'Simulate what-if scenarios for faster operator decisions.'
]

function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f7fbff_0%,#dbeafe_45%,#eff6ff_100%)] text-slate-950">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.14),transparent_22%)]" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-sky-200">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-sky-700">DelayShield AI</p>
            <p className="text-sm font-semibold text-slate-600">Supply chain disruption prediction system</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-full border border-sky-200 bg-white/80 px-5 py-2.5 text-sm font-black uppercase tracking-[0.16em] text-sky-700 shadow-sm backdrop-blur transition hover:border-sky-400 hover:bg-white"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl gap-12 px-6 pb-16 pt-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-10 lg:pb-24 lg:pt-10">
        <section>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/75 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-sky-700 shadow-sm backdrop-blur">
            <Sparkles size={14} />
            Predict before disruption spreads
          </div>

          <h1 className="mt-6 max-w-4xl font-black tracking-[-0.04em] text-5xl leading-[0.95] text-slate-950 sm:text-6xl lg:text-7xl">
            Logistics teams need more than tracking.
            <span className="block text-sky-700">They need the next best move.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600">
            DelayShield AI helps operations teams predict route disruptions, quantify delay impact, and act early with
            AI-guided decisions across shipments, routes, and fleet priority.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-[1.2rem] bg-slate-950 px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-white shadow-2xl shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Launch DelayShield
              <ArrowRight size={16} />
            </Link>
            <a
              href="#capabilities"
              className="inline-flex items-center justify-center rounded-[1.2rem] border border-sky-200 bg-white/80 px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-sky-700 shadow-sm backdrop-blur transition hover:border-sky-400 hover:bg-white"
            >
              Explore Features
            </a>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-[1.6rem] border border-white/70 bg-white/70 p-5 shadow-lg shadow-sky-100 backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">{stat.label}</p>
                <p className="mt-3 text-base font-black leading-6 text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="relative">
          <div className="absolute -left-6 top-10 h-28 w-28 rounded-full bg-amber-300/35 blur-3xl" />
          <div className="absolute -right-6 bottom-4 h-36 w-36 rounded-full bg-sky-400/25 blur-3xl" />

          <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 p-6 text-white shadow-[0_40px_100px_rgba(15,23,42,0.26)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-300">Command Surface</p>
                <h2 className="mt-2 text-2xl font-black">Operations Snapshot</h2>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <Gauge className="text-sky-300" size={24} />
              </div>
            </div>

            <div className="mt-8 grid gap-4">
              <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Critical Watch</p>
                    <p className="mt-2 text-3xl font-black text-white">08</p>
                  </div>
                  <Truck size={30} className="text-amber-300" />
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400" />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-300">High-priority shipments exposed to delay escalation.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">AI Recommendation</p>
                  <p className="mt-3 text-xl font-black">Reroute north corridor</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Protect critical deliveries from urban congestion and weather overlap.</p>
                </div>
                <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Potential Savings</p>
                  <p className="mt-3 text-xl font-black text-emerald-300">INR 1.8L saved</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Estimated by early intervention across the active disruption window.</p>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-sky-400/20 bg-gradient-to-r from-sky-400/15 to-cyan-300/10 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-200">What-If Simulation</p>
                <div className="mt-4 flex items-end gap-3">
                  {[38, 62, 28, 71, 44, 19].map((height, index) => (
                    <div
                      key={height}
                      className="flex-1 rounded-t-2xl bg-gradient-to-t from-cyan-300 via-sky-400 to-blue-500"
                      style={{ height: `${height * 1.6}px`, animationDelay: `${index * 120}ms` }}
                    />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-200">Stress-test response plans before your dispatch team commits to a route shift.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <section id="capabilities" className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10 lg:py-14">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-sky-700">Core Capabilities</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Built for planners, dispatchers, and logistics control towers.
            </h2>
          </div>
          <p className="max-w-2xl text-sm font-medium leading-7 text-slate-600">
            DelayShield AI combines predictive risk, scenario simulation, and guided action so teams can move from
            reactive firefighting to proactive operations control.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {capabilities.map((item) => (
            <article key={item.title} className="rounded-[1.8rem] border border-white/80 bg-white/75 p-6 shadow-lg shadow-sky-100 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <item.icon size={24} />
              </div>
              <h3 className="mt-5 text-xl font-black text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[0.85fr_1.15fr] lg:px-10 lg:py-16">
        <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-7 shadow-lg shadow-sky-100 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-sky-700">Workflow</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">How the platform thinks.</h2>
          <p className="mt-4 text-sm font-medium leading-7 text-slate-600">
            The system is designed to help teams understand not just what is happening, but what to do next.
          </p>
        </div>

        <div className="grid gap-4">
          {workflow.map((step, index) => (
            <div key={step} className="flex gap-4 rounded-[1.8rem] border border-white/80 bg-white/75 p-5 shadow-md shadow-sky-100 backdrop-blur">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                0{index + 1}
              </div>
              <p className="pt-1 text-base font-semibold leading-7 text-slate-700">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-16 lg:px-10 lg:pb-24">
        <div className="overflow-hidden rounded-[2.4rem] border border-slate-200 bg-slate-950 px-7 py-10 text-white shadow-[0_30px_80px_rgba(15,23,42,0.22)] sm:px-10 sm:py-12">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-300">Ready To Operate Smarter</p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Move from shipment tracking to disruption command.</h2>
              <p className="mt-4 text-sm font-medium leading-7 text-slate-300">
                Sign in and start evaluating routes, shipment risk, and intervention cost in one place.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-[1.2rem] bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-slate-950 transition hover:bg-slate-100"
              >
                Enter Platform
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage

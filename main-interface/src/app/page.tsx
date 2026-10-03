"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Activity, Users, Map, Video, BellRing, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground font-sans selection:bg-primary/20">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md transition-all">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">EventGuard</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="hidden sm:inline-flex hover:bg-primary/5">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="shadow-lg shadow-primary/25 rounded-full px-6">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent blur-3xl opacity-50"></div>
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute top-48 -left-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl opacity-50"></div>
          </div>

          <div className="container mx-auto px-4 md:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              AI-Powered Safety Intelligence
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-5xl mx-auto leading-tight">
              Next-Generation <br className="hidden md:block"/>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">Crowd Management</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Protect your attendees with real-time AI crowd monitoring, seamless check-ins, and instant emergency response systems designed for massive scale.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <Link href="/sign-up">
                <Button size="lg" className="w-full sm:w-auto text-base h-14 px-8 rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                  Start Managing Events <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-14 px-8 rounded-full border-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  View Live Demo
                </Button>
              </Link>
            </div>

            {/* Dashboard Showcase Hero Image */}
            <div className="max-w-6xl mx-auto relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative rounded-3xl overflow-hidden border border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-2xl p-2 md:p-4">
                <img src="/images/media_1790921403197.png" alt="Platform Main Dashboard" className="rounded-2xl w-full object-cover border border-slate-200 dark:border-slate-800 shadow-inner" />
              </div>
            </div>
          </div>
        </section>

        {/* Analytics & Map Feature Section */}
        <section className="py-24 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="lg:w-1/2 space-y-8">
                <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                  <Activity className="h-7 w-7 text-blue-500" />
                </div>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Real-Time Density & Analytics</h2>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  Leverage state-of-the-art computer vision to monitor crowd flow. Spot bottlenecks before they become hazards and redistribute personnel instantly based on predictive AI modeling.
                </p>
                <ul className="space-y-4">
                  {[
                    "Live Computer Vision Analytics Integration",
                    "Predictive Flow Bottleneck Alerts",
                    "Automated Personnel Dispatching"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                        <ChevronRight className="h-4 w-4 text-green-500" />
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="lg:w-1/2 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl"></div>
                <div className="relative grid grid-cols-2 gap-4">
                  <div className="space-y-4 translate-y-8">
                    <img src="/images/media_1790926964800.png" alt="Heatmap Details" className="rounded-2xl shadow-lg border border-white/10 hover:-translate-y-2 transition-transform duration-500" />
                    <img src="/images/media_1790931312539.png" alt="Analytics Chart" className="rounded-2xl shadow-lg border border-white/10 hover:-translate-y-2 transition-transform duration-500" />
                  </div>
                  <div className="space-y-4">
                    <img src="/images/media_1790922084077.png" alt="Live Booking Management" className="rounded-2xl shadow-lg border border-white/10 hover:-translate-y-2 transition-transform duration-500" />
                    <img src="/images/media_1790922508602.png" alt="Zone Management" className="rounded-2xl shadow-lg border border-white/10 hover:-translate-y-2 transition-transform duration-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-32 relative">
          <div className="container mx-auto px-4 md:px-8 text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Comprehensive Security Suite</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">Everything you need to secure events of any size. Integrated hardware and software solutions.</p>
          </div>

          <div className="container mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Video, color: "text-blue-500", bg: "bg-blue-500/10", title: "CCTV AI Integration", desc: "Connect existing IP cameras to our computer vision network." },
                { icon: BellRing, color: "text-red-500", bg: "bg-red-500/10", title: "Instant SOS & SMS", desc: "One-tap emergency alerts with live GPS location dispatch to organizers." },
                { icon: Users, color: "text-purple-500", bg: "bg-purple-500/10", title: "Digital Ticketing", desc: "QR-based entry with live active capacity counting at every gate." },
                { icon: Map, color: "text-amber-500", bg: "bg-amber-500/10", title: "Smart Routing", desc: "Push dynamic notifications to guide attendees away from dense zones." },
              ].map((f, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 hover:-translate-y-2 transition-all duration-300 group">
                  <div className={`h-14 w-14 rounded-2xl ${f.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <f.icon className={`h-7 w-7 ${f.color}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-16">
        <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-80">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold tracking-tight">EventGuard</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} EventGuard. All rights reserved. Built for security.
          </p>
        </div>
      </footer>
    </div>
  );
}

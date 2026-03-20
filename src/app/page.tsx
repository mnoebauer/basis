"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BasisLogo } from "@/components/basis-logo";
import { WaitlistForm } from "@/components/waitlist-form";

const hiringChecklist = [
  "Flexible applicant tracking",
  "Customizable workflows",
  "Rich candidate profiles",
  "Built-in candidate messaging",
  "Bulk messaging",
  "Message templates",
  "Shared notes and documentation",
];

type NotificationItem = {
  id: number;
  name: string;
  meta: string;
  time: string;
  urgent?: boolean;
};

const initialNotifications: NotificationItem[] = [
  { id: 1, name: "Hank Hardy", meta: "New candidate · Full Stack Engineer", time: "1d" },
  { id: 2, name: "Lira Maul", meta: "New message · Full Stack Engineer", time: "1d" },
  { id: 3, name: "Mollie Cruz", meta: "Candidate declined offer", time: "1d" },
  { id: 4, name: "Jared Dunn", meta: "New candidate · Product Designer", time: "2d" },
  { id: 5, name: "Sarah Jenkins", meta: "Interview scheduled", time: "3d" },
];

const incomingNotifications: NotificationItem[] = [
  { id: 6, name: "Linda Gorin", meta: "New message · Full Stack Engineer", time: "Just now", urgent: true },
  { id: 7, name: "Landry Evans", meta: "New candidate · Full Stack Engineer", time: "Just now", urgent: true },
  { id: 8, name: "Elias Vance", meta: "New candidate · Product Designer", time: "Just now", urgent: true },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    text: "For testing the workflow with one active job.",
  },
  {
    name: "Starter",
    price: "$124/mo",
    text: "For lean teams running a focused hiring process.",
  },
  {
    name: "Growth",
    price: "$233/mo",
    text: "For companies hiring across multiple searches at once.",
    featured: true,
  },
];

function PlatformPreview() {
  return (
    <div className="overflow-x-auto rounded-[28px] bg-white p-4 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-5">
      <div className="min-w-[800px]">
        <div className="flex items-center justify-between border-b border-black/8 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[linear-gradient(135deg,#c5a7f6_0%,#e7c3ef_100%)]" />
          <div>
            <p className="text-[17px] font-semibold text-black">Northline Studio</p>
          </div>
        </div>
        <div className="flex w-[54%] items-center rounded-lg border border-black/8 bg-[#fafafa] px-3 py-2 text-sm text-black/42">
          ⌕ <span className="ml-2">Search applicants</span>
        </div>
      </div>

      <div className="border-b border-black/8 px-3 py-3 text-[18px] font-semibold text-black">
        Mobile Engineer
      </div>

      <div className="grid min-h-[520px] grid-cols-[140px_190px_220px_minmax(0,1fr)]">
        <div className="border-r border-black/8 px-3 py-4">
          <div className="space-y-2 text-[15px]">
            {[
              ["Inbox", "11"],
              ["Screen", "19"],
              ["Interview", "4"],
              ["Decide", "1"],
              ["Offer", "0"],
              ["Archive", "4"],
            ].map(([label, count], index) => (
              <div
                key={label}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
                  index === 0 ? "bg-black/[0.05] text-black" : "text-black/68"
                }`}
              >
                <span>{label}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 space-y-2 text-[15px] text-black/60">
            <div className="rounded-lg px-3 py-2.5">Job setup</div>
            <div className="rounded-lg px-3 py-2.5">Distribution</div>
          </div>
        </div>

        <div className="border-r border-black/8 px-3 py-4">
          <h3 className="mb-3 text-[16px] font-semibold text-black">Inbox</h3>
          <div className="space-y-2">
            {["Aria Chen", "Jonas Reed", "Priya Kapoor", "Mateo Silva", "Nora Kim"].map((name, index) => (
              <div
                key={name}
                className={`rounded-lg px-3 py-2.5 text-[15px] ${index === 0 ? "bg-black/[0.05] text-black" : "text-black/68"}`}
              >
                {name}
              </div>
            ))}
          </div>
        </div>

        <div className="border-r border-black/8 px-3 py-4">
          <h3 className="text-[17px] font-semibold text-black">Aria Chen</h3>
          <div className="mt-2 inline-flex rounded-md border border-black/10 px-2.5 py-1 text-[13px] text-black/55">
            Applied via careers page
          </div>
          <div className="mt-6 space-y-2 text-[15px]">
            {["Overview", "Resume", "Messages", "Files", "Notes"].map((tab, index) => (
              <div
                key={tab}
                className={`rounded-lg px-3 py-2.5 ${index === 0 ? "bg-black/[0.05] text-black" : "text-black/68"}`}
              >
                {tab}
              </div>
            ))}
          </div>
          <div className="mt-8 text-[14px] text-black/62">
            <p>(415) 555-0186</p>
            <p className="mt-2">aria.chen@email.com</p>
            <p className="mt-4">github.com/ariachen</p>
          </div>
        </div>

        <div className="px-4 py-4">
          <h3 className="text-[18px] font-semibold text-black">Overview</h3>
          <p className="mt-2 text-[14px] text-black/45">Application received · 2d</p>
          <div className="mt-5 rounded-xl border border-black/10 p-4">
            <p className="text-[14px] text-black/55">Application question responses</p>
            <p className="mt-3 text-[14px] font-semibold text-black">Tell us about a project where you improved product quality.</p>
            <p className="mt-2 text-[14px] leading-7 text-black/72">
              I led a reliability sprint across our React Native app, partnered with QA to reduce crash loops, and helped bring crash-free sessions from 96.8% to 99.3% in one quarter...
            </p>
            <p className="mt-5 text-[14px] font-semibold text-black">Why are you interested in this team?</p>
            <p className="mt-2 text-[14px] leading-7 text-black/72">
              Your shipping pace and product clarity stand out. I am excited by teams that care about craft and still move quickly on feedback...
            </p>
          </div>
          <div className="mt-4 flex gap-3">
            <div className="rounded-lg bg-black/[0.06] px-4 py-3 text-[14px] text-black">Add a comment</div>
            <div className="rounded-lg bg-black/[0.06] px-4 py-3 text-[14px] text-black">Start a review</div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function MessagePanel() {
  return (
    <div className="rounded-[20px] bg-white shadow-[0_18px_60px_rgba(0,0,0,0.08)]">
      <div className="space-y-4 border-b border-black/8 p-4">
        <div className="rounded-2xl border border-black/8 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-[#f3ead0]" />
            <div>
              <p className="text-[15px] font-semibold text-black">Meg Barnes <span className="font-normal text-black/45">· 23min</span></p>
              <p className="text-[13px] text-black/45">Sent via Email</p>
            </div>
          </div>
          <p className="mt-4 text-[15px] leading-8 text-black/78">
            Hi Riley,<br /><br />
            Thank you for applying for the Backend Engineer role with us. We were excited to review your application. It seems like you have a ton of relevant experience.<br /><br />
            Would you be available for a phone call sometime this week?<br /><br />
            Best regards,<br />
            Meg
          </p>
        </div>

        <div className="rounded-2xl border border-black/8 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3d3d3d] text-[18px] font-semibold text-white">rt</div>
            <div>
              <p className="text-[15px] font-semibold text-black">
                Riley Townsend <span className="rounded bg-[#ffe2bf] px-1.5 py-0.5 text-[12px] font-medium text-black">Candidate</span>
                <span className="font-normal text-black/45"> · 13min</span>
              </p>
              <p className="text-[13px] text-black/45">Sent via Email</p>
            </div>
          </div>
          <p className="mt-4 text-[15px] leading-8 text-black/78">
            Hi Meg!<br /><br />
            It’s exciting to hear from you. Anytime after 1pm on Friday would work great for me. Just let me know when!<br /><br />
            Riley
          </p>
        </div>

        <div className="flex items-center gap-3 px-2 pt-2">
          <div className="h-8 w-8 shrink-0 rounded-lg bg-[#f3ead0]" />
          <div className="rounded-2xl border border-black/8 bg-[#fafafa] px-4 py-3">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-black/30" style={{ animationDelay: "0ms" }} />
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-black/30" style={{ animationDelay: "150ms" }} />
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-black/30" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="rounded-xl border border-black/8 px-4 py-3 text-[15px] text-black/38">Type your message here...</div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="inline-flex h-12 items-center rounded-lg bg-black px-5 text-[15px] font-medium text-white">
            Send message
          </button>
          <button type="button" className="inline-flex h-12 items-center rounded-lg bg-black/[0.06] px-5 text-[15px] text-black">
            Use template
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationPanel() {
  const [items, setItems] = useState(initialNotifications);

  useEffect(() => {
    let count = 0;
    const interval = setInterval(() => {
      if (count < incomingNotifications.length) {
        setItems(prev => {
          const newItems = [incomingNotifications[count], ...prev];
          return newItems.slice(0, 5); // Keep exactly 5 items
        });
        count++;
      } else {
        count = 0;
        setItems(initialNotifications); // Reset to loop
      }
    }, 2800); // Trigger every bit under 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-[20px] bg-white p-2 shadow-[0_18px_60px_rgba(0,0,0,0.08)]">
      <style>{`
        @keyframes slideDownAndFade {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDownAndFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      <div className="flex flex-col">
        {items.map((item) => {
          if (!item) return null;
          return (
          <div key={item.id} className="animate-slideDown flex items-center gap-4 rounded-2xl px-4 py-3 hover:bg-black/[0.02] transition-colors">
            <span className={`shrink-0 h-2.5 w-2.5 rounded-full ${item.urgent ? "bg-[#ff3b30] shadow-[0_0_8px_rgba(255,59,48,0.6)] animate-pulse" : "bg-black/10"}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-black">{item.name}</p>
              <p className="truncate text-[13px] text-black/45">{item.meta}</p>
            </div>
            <p className="shrink-0 text-[13px] text-black/35">{item.time}</p>
            <button type="button" className="hidden sm:block shrink-0 rounded-lg bg-black/[0.06] px-3 py-2 text-[13px] text-black/72 hover:bg-black/10 transition-colors">
              Dismiss
            </button>
            <span className="shrink-0 text-xl text-black/35">⋮</span>
          </div>
        )})}
      </div>
    </div>
  );
}

function BlockDivider() {
  return (
    <div className="relative w-full" aria-hidden="true">
      <div className="absolute -left-[100vw] -right-[100vw] top-0 h-px bg-black/[0.08]" />
      <div className="absolute -left-1 -top-1 text-black/15">
        <svg width="9" height="9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 0v9M0 4.5h9" stroke="currentColor" strokeWidth="1"/></svg>
      </div>
      <div className="absolute -right-1 -top-1 text-black/15">
        <svg width="9" height="9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 0v9M0 4.5h9" stroke="currentColor" strokeWidth="1"/></svg>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fafafa] p-4 sm:p-8 lg:p-12 overflow-hidden flex flex-col">
      <div className="relative mx-auto w-full max-w-[1240px] flex-1 text-[#111111]">
        {/* Persistent left/right borders */}
        <div className="absolute -bottom-[100vh] -top-[100vh] left-0 w-px bg-black/[0.08]" />
        <div className="absolute -bottom-[100vh] -top-[100vh] right-0 w-px bg-black/[0.08]" />
        
        <BlockDivider />

        <header className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <BasisLogo />

          <div className="flex items-center gap-1 sm:gap-2 rounded-xl border border-black/8 bg-white p-1 shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
            <a href="#features" className="hidden sm:block rounded-lg px-3 sm:px-5 py-2 sm:py-2.5 text-[14px] sm:text-[15px] text-black/72 transition hover:bg-black/[0.04]">Features</a>
            <a href="#pricing" className="hidden sm:block rounded-lg px-3 sm:px-5 py-2 sm:py-2.5 text-[14px] sm:text-[15px] text-black/72 transition hover:bg-black/[0.04]">Pricing</a>
            <a href="#blog" className="hidden md:block rounded-lg px-3 sm:px-5 py-2 sm:py-2.5 text-[14px] sm:text-[15px] text-black/72 transition hover:bg-black/[0.04]">Blog</a>
            <Link href="/login" className="rounded-lg bg-black px-4 sm:px-5 py-2 sm:py-2.5 text-[14px] sm:text-[15px] text-white">Log in</Link>
            <Link
              href="/onboarding"
              className="rounded-lg bg-[linear-gradient(90deg,#f4c4ff_0%,#ffd9b5_100%)] px-4 sm:px-5 py-2 sm:py-2.5 text-[14px] sm:text-[15px] text-black"
            >
              Sign up
            </Link>
          </div>
        </header>

        <BlockDivider />

        <section id="waitlist" className="p-4 sm:p-6 lg:p-8">
          <div className="rounded-[24px] bg-white px-5 pb-16 pt-20 text-center sm:px-8 sm:pt-28 lg:px-20">
            <h1 className="mx-auto max-w-[1100px] text-[2.4rem] font-semibold leading-[1.08] tracking-[-0.035em] text-black sm:text-[4rem] lg:text-[4.6rem]">
              A calmer operating system for hiring teams
            </h1>
            <p className="mx-auto mt-6 max-w-[760px] text-[1.25rem] leading-9 text-black/62">
              Basis keeps publishing, candidate review, messaging, and team decisions inside one clean system so hiring teams can move faster without losing context.
            </p>
            <div className="mt-9 flex justify-center relative">
              <WaitlistForm />
            </div>
          </div>
        </section>

       

        <BlockDivider />

        <section className="px-2 py-8 sm:px-8 lg:px-10">
          <div className="rounded-[28px] bg-[linear-gradient(90deg,#f1c5ff_0%,#ffdcbc_100%)] p-4 sm:p-10 mt-5 mb-5">
            <PlatformPreview />
          </div>
        </section>

        <BlockDivider />

        <section id="features" className="grid gap-16 px-5 py-20 sm:py-28 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-10">
          <div className="max-w-[520px]">
            <h2 className="text-[2.5rem] font-semibold leading-[1.08] tracking-[-0.035em] text-black sm:text-[4rem]">
              Manage the hiring process from beginning to end
            </h2>
            <p className="mt-6 text-[1.18rem] leading-9 text-black/62">
              Basis is designed to keep the workflow obvious. Teams can review applicants, move people through stages, communicate clearly, and keep decision-making in one place.
            </p>

            <div className="mt-10 space-y-4">
              {hiringChecklist.map((item) => (
                <div key={item} className="flex items-center gap-3 text-[1.12rem] text-black/70">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-black/20 text-[15px]">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <MessagePanel />
        </section>

        <BlockDivider />

        <section className="grid gap-16 px-5 py-20 sm:py-24 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-10">
          <div className="max-w-[520px]">
            <h2 className="text-[2.5rem] font-semibold leading-[1.08] tracking-[0.035em] text-black sm:text-[4rem]">
              Keep track of everything
            </h2>
            <p className="mt-6 text-[1.18rem] leading-9 text-black/62">
              A single activity layer makes it easy to see what changed, what needs attention, and where the process is slowing down.
            </p>
          </div>

          <NotificationPanel />
        </section>

        <BlockDivider />

        <section id="pricing" className="px-5 py-20 sm:py-24 sm:px-8 lg:px-10">
          <div className="max-w-[720px]">
            <h2 className="text-[2.5rem] font-semibold leading-[1.08] tracking-[-0.035em] text-black sm:text-[3.8rem]">
              Simple pricing
            </h2>
            <p className="mt-5 text-[1.15rem] leading-8 text-black/62">
              Start free, then move up when the hiring volume justifies it.
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-[22px] border p-6 transition-transform hover:scale-[1.02] ${
                  plan.featured ? "border-black bg-black text-white" : "border-black/8 bg-white"
                }`}
              >
                <p className={`text-[15px] ${plan.featured ? "text-white/62" : "text-black/45"}`}>{plan.name}</p>
                <p className="mt-3 text-[2.6rem] font-semibold tracking-[-0.03em] blur-md select-none">{plan.price}</p>
                <p className={`mt-4 text-[1.02rem] leading-8 ${plan.featured ? "text-white/78" : "text-black/62"}`}>{plan.text}</p>
                <Link
                  href="#waitlist"
                  className={`mt-6 inline-flex h-12 items-center rounded-lg px-5 text-[15px] font-medium ${
                    plan.featured ? "bg-white text-black" : "bg-black text-white"
                  }`}
                >
                  Join Waitlist
                </Link>
              </article>
            ))}
          </div>
        </section>

        <BlockDivider />

        <section id="blog" className="px-5 py-20 sm:px-8 lg:px-10">
          <div className="max-w-[760px]">
            <h2 className="text-[2.2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-black sm:text-[3.2rem]">
              Notes on hiring, workflows, and team operations
            </h2>
            <p className="mt-5 text-[1.05rem] leading-8 text-black/62">
              Short writing, product updates, and playbooks for teams building a cleaner hiring process.
            </p>
          </div>
        </section>

        <BlockDivider />

        <footer className="px-5 py-16 sm:px-8 lg:px-10">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <BasisLogo />
              <p className="mt-5 max-w-[300px] text-[15px] leading-7 text-black/55">
                Basis is a calmer operating system for hiring teams. Stay organized, move faster, and make better decisions.
              </p>
              <div className="mt-8 flex gap-4 text-[14px] font-medium text-black/45">
                <a href="#" className="hover:text-black transition-colors">Twitter (X)</a>
                <a href="#" className="hover:text-black transition-colors">LinkedIn</a>
                <a href="#" className="hover:text-black transition-colors">GitHub</a>
              </div>
            </div>

            <div>
              <h3 className="text-[15px] font-semibold text-black">Product</h3>
              <div className="mt-5 flex flex-col gap-3 text-[15px] text-black/55">
                <a href="#features" className="hover:text-black transition-colors">Features</a>
                <a href="#pricing" className="hover:text-black transition-colors">Pricing</a>
                <a href="#changelog" className="hover:text-black transition-colors">Changelog</a>
                <Link href="/platform" className="hover:text-black transition-colors">Platform</Link>
              </div>
            </div>

            <div>
              <h3 className="text-[15px] font-semibold text-black">Company</h3>
              <div className="mt-5 flex flex-col gap-3 text-[15px] text-black/55">
                <a href="#about" className="hover:text-black transition-colors">About Us</a>
                <a href="#careers" className="hover:text-black transition-colors">Careers</a>
                <a href="#blog" className="hover:text-black transition-colors">Blog</a>
                <a href="#contact" className="hover:text-black transition-colors">Contact</a>
              </div>
            </div>

            <div>
              <h3 className="text-[15px] font-semibold text-black">Legal</h3>
              <div className="mt-5 flex flex-col gap-3 text-[15px] text-black/55">
                <a href="#privacy" className="hover:text-black transition-colors">Privacy Policy</a>
                <a href="#terms" className="hover:text-black transition-colors">Terms of Service</a>
                <a href="#security" className="hover:text-black transition-colors">Security</a>
              </div>
            </div>
          </div>
          
          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-black/8 pt-8 sm:flex-row text-[14px] text-black/45">
            <p>© {new Date().getFullYear()} Basis Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#status" className="hover:text-black transition-colors">System Status</a>
              <a href="#support" className="hover:text-black transition-colors">Support</a>
            </div>
          </div>
        </footer>
        
        <BlockDivider />
      </div>
    </main>
  );
}

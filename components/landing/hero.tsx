import { ArrowRight, ArrowDown, Rss, Sparkles } from "lucide-react";
import { Badge } from "../ui/badge";
import CTAButtons from "./buttons/CTAButtons";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-white to-gray-50 dark:from-black dark:to-gray-950 py-20 sm:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />

      <div className="relative mx-auto max-w-3xl px-6 lg:px-8">
        {/* Badge */}
        <div className="mx-auto max-w-3xl text-center">
          <Badge>
            <Sparkles className="size-4" />
            <span>AI-Powered Newsletter Creation</span>
          </Badge>
        </div>

        {/* Headline */}
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl lg:text-7xl text-center">
          Generate Professional Newsletters in
          <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Minutes, Not Hours
          </span>
        </h1>

        {/* Subheading */}
        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400 sm:text-xl text-center">
          Stop spending hours curating content. Let AI transform your RSS feeds
          into engaging newsletters with perfect titles, subject lines, and
          content.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <CTAButtons />
        </div>

        {/* Social proof */}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Join 1,000+ newsletter creators saving 5+ hours every week • Starting
          at $9/month
        </p>
      </div>

      {/* Hero visual pipeline */}
      <div className="mx-auto mt-14 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex w-full flex-col items-center gap-6 sm:gap-8 lg:gap-10 lg:flex-row lg:items-start">
          {/* Feeds with labels */}
          <div className="flex items-end gap-4 sm:gap-6 lg:gap-8">
            {[
              { label: "Feed 1", cls: "from-blue-400 to-blue-600" },
              { label: "Feed 2", cls: "from-purple-400 to-purple-600" },
              { label: "Feed 3", cls: "from-indigo-400 to-purple-500" },
            ].map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-2">
                <div
                  className={`grid size-20 sm:size-24 place-items-center rounded-full bg-gradient-to-tr ${f.cls} text-white shadow-lg`}
                  aria-hidden
                >
                  <Rss className="size-8 sm:size-9" />
                </div>
                <span className="text-xs text-muted-foreground">{f.label}</span>
              </div>
            ))}
          </div>

          {/* Arrows column + pill (responsive) */}
          {/* Desktop: three right arrows */}
          <div className="hidden lg:flex lg:flex-col lg:items-center lg:gap-5 lg:mt-6">
            <ArrowRight className="size-8 text-purple-500/80" />
            <ArrowRight className="size-8 text-purple-500/80" />
            <ArrowRight className="size-8 text-purple-500/80" />
            <div className="w-37 mt-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-white shadow-md">
              <Sparkles className="size-4" />
              <span className="text-sm font-medium">AI Processing</span>
            </div>
          </div>
          {/* Mobile/Tablet: single down arrow */}
          <div className="flex flex-col items-center gap-3 lg:hidden">
            <ArrowDown className="size-8 text-purple-500/80" />
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-white shadow-md">
              <Sparkles className="size-4" />
              <span className="text-sm font-medium">AI Processing</span>
            </div>
          </div>

          {/* Generated newsletter card */}
          <div className="relative w-full max-w-[880px] rounded-2xl border bg-white shadow-lg shadow-blue-500/10 ring-1 ring-blue-600/10 dark:bg-neutral-950">
            {/* Gradient header with title */}
            <div className="flex h-12 items-center gap-2 rounded-t-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 text-white">
              <Sparkles className="size-4" />
              <span className="text-sm font-semibold">Your Newsletter</span>
            </div>
            <div className="space-y-6 p-4 sm:p-6">
              {/* Header bars */}
              <div className="space-y-3">
                <div className="h-4 w-3/4 sm:w-2/3 rounded bg-blue-100" />
                <div className="h-4 w-2/3 sm:w-1/2 rounded bg-purple-100" />
              </div>

              {/* Body sections with bullets */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                    <span>5 TITLES</span>
                  </div>
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-10/12 sm:w-11/12 rounded bg-muted" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <span className="inline-block h-2 w-2 rounded-full bg-purple-500" />
                    <span>FULL BODY</span>
                  </div>
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-9/12 sm:w-10/12 rounded bg-muted" />
                  <div className="h-3 w-8/12 sm:w-9/12 rounded bg-muted" />
                </div>
              </div>

              {/* Bottom chips */}
              <div className="mt-2 flex flex-wrap gap-3 sm:gap-4">
                <div className="h-8 w-40 sm:w-48 rounded bg-gradient-to-r from-blue-500 to-purple-500/70" />
                <div className="h-8 w-36 sm:w-44 rounded bg-gradient-to-r from-purple-400 to-indigo-400/70" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

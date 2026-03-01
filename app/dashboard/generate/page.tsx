import { Suspense } from "react";
import { NewsletterGenerationPage } from "@/components/dashboard/newsletter-generation-page";
import { NewsletterLoadingCard } from "@/components/dashboard/newsletter-loading-card";

export default function GenerationPage() {
  return (
    <Suspense fallback={<NewsletterLoadingCard />}>
      <NewsletterGenerationPage />
    </Suspense>
  );
}

import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function CTAButtons() {
  const { has, userId } = await auth(); // Clerk Billing api
  const hasPaidPlan =
    (await has({ plan: "pro" })) || (await has({ plan: "starter" }));

  if (!userId) {
    return (
      <>
        <SignInButton mode="modal" forceRedirectUrl="/#pricing">
          <Button size="lg" className="w-full sm:w-auto">
            Get Started <ArrowRight className="size-4 ml-2" />
          </Button>
        </SignInButton>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="w-full sm:w-auto"
        >
          <Link href="#pricing">View Pricing</Link>
        </Button>
      </>
    );
  }

  if (hasPaidPlan) {
    return (
      <Button size="lg" className="w-full sm:w-auto" asChild>
        <Link href="/dashboard" className="flex items-center justify-center">
          Go to Dashboard <ArrowRight className="size-4 ml-2" />
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button size="lg" className="w-full sm:w-auto" asChild>
        <Link href="/#pricing" className="flex items-center justify-center">
          Choose a Plan
          <ArrowRight className="size-4 ml-2" />
        </Link>
      </Button>
      <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
        <Link href="#pricing">View Pricing</Link>
      </Button>
    </>
  );
}

export default CTAButtons;

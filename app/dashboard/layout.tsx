import DashboardHeader from "@/components/dashboard/dashboard-header";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { has } = await auth(); // Clerk Billing api
  const hasPaidPlan =
    (await has({ plan: "pro" })) || (await has({ plan: "starter" }));

  if (!hasPaidPlan) {
    redirect("/#pricing");
  }
  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />
      {children}
    </div>
  );
}

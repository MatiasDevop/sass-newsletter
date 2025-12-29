import { SignedIn, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Hero from "@/components/landing/hero";

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <Hero />

      <SignedIn>
        <div className="fixed top-4 right-4">
          <UserButton />
        </div>
      </SignedIn>
    </main>
  );
}

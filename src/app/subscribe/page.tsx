import type { Metadata } from "next";
import NewsletterSignup from "@/components/NewsletterSignup";

export const metadata: Metadata = {
  title: "Subscribe",
  description: "Join the Vanta Orbit Media newsletter.",
};

export default function SubscribePage() {
  return (
    <main className="space-page flex min-h-screen items-center px-4 py-32 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <NewsletterSignup />
      </div>
    </main>
  );
}

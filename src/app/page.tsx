import ContentCard from "@/components/ContentCard";
import Hero from "@/components/Hero";
import NewsletterSignup from "@/components/NewsletterSignup";
import SectionHeader from "@/components/SectionHeader";
import TopicCard from "@/components/TopicCard";
import VideoCard from "@/components/VideoCard";
import { articles, featuredVideo, latestVideos, topics } from "@/lib/content";

export default function Home() {
  return (
    <main className="home-page">
      <Hero featuredVideo={featuredVideo} />

      <section id="explore-by-topic" className="relative z-0 -mt-40 mx-auto max-w-7xl px-4 pb-20 pt-52 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Explore"
          title="Explore by Topic"
          description="Click into cinematic portals for Earth, the Moon, the Sun, planets, deep space, and the unknown."
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {topics.map((topic) => (
            <TopicCard key={topic.name} topicName={topic.name} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Latest" title="Videos" />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {latestVideos.map((video) => (
            <VideoCard key={video.slug} video={video} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Deep Dives" title="Articles" />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {articles.slice(0, 3).map((article) => (
            <ContentCard key={article.slug} item={article} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <NewsletterSignup />
      </section>
    </main>
  );
}

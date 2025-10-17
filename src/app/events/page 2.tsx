import { getEvents } from "@/lib/strapi";
import EventsPageClient from "./EventPageClient";
import Link from "next/link";

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page =
    typeof params?.page === "string"
      ? parseInt(params.page, 10)
      : 1;
  const pageSize =
    typeof params?.pageSize === "string"
      ? parseInt(params.pageSize, 10)
      : 10;

  const { data: events, meta, error } = await getEvents({ page, pageSize });

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">เกิดข้อผิดพลาด</h1>
          <p className="text-zinc-400 mb-4">{error}</p>
          {/* A simple refresh button, as client-side interactivity might be limited here */}
          <Link 
            href="/events"
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            ลองใหม่
          </Link>
        </div>
      </div>
    );
  }

  if (!events || !Array.isArray(events) || events.length === 0) {
    return <div className="min-h-screen bg-zinc-900 text-white text-center pt-20">No events found.</div>;
  }

  return <EventsPageClient events={events} pagination={meta?.pagination} />;
}

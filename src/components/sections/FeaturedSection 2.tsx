"use client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/react";
import { Gym, Event } from "@/types/strapi";
import { useState } from "react";
import GymCard from "../gyms/GymCard";
import EventCard from "../cards/EventCard";

function ErrorPlaceholder() {
  return (
    <div className="flex justify-center items-center bg-transparent my-4 p-6 rounded-lg min-h-96 text-yellow-300 text-center">
      ⚠️ ข้อมูลไม่พร้อมแสดง ขณะนี้ไม่สามารถเชื่อมต่อฐานข้อมูลได้
    </div>
  );
}

const FeaturedSection = ({
  gyms,
  events,
  error,
}: {
  gyms: Gym[];
  events: Event[];
  error?: string | null;
}) => {
  const [activeTab, setActiveTab] = useState("gyms");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <motion.section
      className="py-16"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl min-h-[50vh]">
        <div className="text-center">
          <h2 className="font-bold text-2xl sm:text-3xl">
            Find Your Next Fight
          </h2>
          <p className="mx-auto mt-2 max-w-prose text-white/70">
            Discover top-rated Muay Thai gyms and exciting upcoming events.
          </p>
        </div>

        {error ? (
          <ErrorPlaceholder />
        ) : (
          <>
            <div className="flex justify-center mt-8">
              <div className="flex gap-2 bg-zinc-800 p-1 rounded-lg">
                <Button
                  onClick={() => setActiveTab("gyms")}
                  variant={activeTab === "gyms" ? "solid" : "ghost"}
                  color="danger"
                  className={`rounded-md ${
                    activeTab === "gyms" ? "bg-red-600" : ""
                  }`}
                >
                  Recommended Camps
                </Button>
                <Button
                  onClick={() => setActiveTab("events")}
                  variant={activeTab === "events" ? "solid" : "ghost"}
                  color="danger"
                  className={`rounded-md ${
                    activeTab === "events" ? "bg-red-600" : ""
                  }`}
                >
                  Upcoming Events
                </Button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center items-center min-h-96"
              >
                {activeTab === "gyms" &&
                  (gyms.length > 0 ? (
                    <motion.div
                      className="gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {gyms.slice(0, 4).map((gym) => (
                        <motion.div
                          key={gym.id}
                          variants={itemVariants}
                          className="h-full"
                        >
                          <GymCard gym={gym} />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <p className="text-zinc-400">ยังไม่มีค่ายมวยแนะนำในขณะนี้</p>
                  ))}
                {activeTab === "events" &&
                  (events.length > 0 ? (
                    <motion.div
                      className="gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {events.slice(0, 4).map((event) => (
                        <motion.div
                          key={event.id}
                          variants={itemVariants}
                          className="h-full"
                        >
                          <EventCard event={event} />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <p className="text-zinc-400">ยังไม่มีอีเวนต์แนะนำในขณะนี้</p>
                  ))}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 text-center">
              <Link href={activeTab === "gyms" ? "/gyms" : "/events"}>
                <Button
                  color="danger"
                  variant="shadow"
                  className="bg-red-600 rounded-md cursor-pointer"
                >
                  {activeTab === "gyms" ? "View All Camps" : "View All Events"}
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </motion.section>
  );
};

export default FeaturedSection;

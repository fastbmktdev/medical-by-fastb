"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPinIcon,
  CalendarIcon,
  TicketIcon,
  BuildingOfficeIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Input, Button } from "@heroui/react";

const searchTabs = [
  {
    key: "gyms",
    label: "Gyms/Classes",
    icon: BuildingOfficeIcon,
  },
  {
    key: "stadiums",
    label: "Stadiums/Watch",
    icon: TicketIcon,
  },
  {
    key: "events",
    label: "Special Events",
    icon: SparklesIcon,
  },
];

export default function QuickSearchBar() {
  const [activeTab, setActiveTab] = useState(searchTabs[0].key);
  const [location, setLocation] = useState("");
  const [gymName, setGymName] = useState("");
  const [date, setDate] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (gymName) query.set("name", gymName);
    if (location) query.set("location", location);
    if (date) query.set("date", date);

    let path = "/";
    switch (activeTab) {
      case "gyms":
        path = "/gyms";
        break;
      case "stadiums":
        path = "/fights";
        break;
      case "events":
        path = "/events";
        break;
    }
    
    router.push(`${path}?${query.toString()}`);
  };

  return (
    <div className="bottom-[10%] z-10 absolute inset-x-0 translate-y-1/2 transform">
      <div className="bg-zinc-900/80 backdrop-blur-sm mx-auto p-4 border border-white/10 rounded-2xl max-w-5xl">
        <div className="flex border-zinc-800/50">
          {searchTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.key
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/50"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="p-4 border-zinc-800">
          <div className="items-center gap-4 grid sm:grid-cols-2 lg:grid-cols-12">
            <Input
              type="text"
              name="gymName"
              value={gymName}
              onChange={(e) => setGymName(e.target.value)}
              placeholder="ชื่อค่ายมวย"
              aria-label="Gym Name"
              startContent={
                <BuildingOfficeIcon className="pr-1 w-5 h-5 text-zinc-400" />
              }
              className="lg:col-span-4"
              classNames={{
                inputWrapper:
                  "focus-within:border-transparent ring-0 focus-within:ring-0",
              }}
            />
            <Input
              type="text"
              name="city"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="จังหวัด, เมือง"
              aria-label="City"
              startContent={
                <MapPinIcon className="pr-1 w-5 h-5 text-zinc-400" />
              }
              className="lg:col-span-3"
              classNames={{
                inputWrapper:
                  "focus-within:border-transparent ring-0 focus-within:ring-0",
              }}
            />

            <Input
              type="date"
              name="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="Date"
              aria-label="Date"
              startContent={
                <CalendarIcon className="pr-1 w-5 h-5 text-zinc-400" />
              }
              classNames={{
                input: "no-default-picker",
                inputWrapper:
                  "focus-within:border-transparent ring-0 focus-within:ring-0",
              }}
              className="lg:col-span-3"
            />

            <Button
              type="submit"
              color="danger"
              variant="shadow"
              className="lg:col-span-2 bg-red-600 rounded-md w-full cursor-pointer"
            >
              Search
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Hardcoded Data
 * ข้อมูล hardcode สำหรับแสดงผลในแอพพลิเคชั่น
 */

import { Gym, Event, Product, TrainingPackage } from "@/types/app.types";

// Training Packages
export const PACKAGES: TrainingPackage[] = [
  {
    id: 1,
    name: "1 Day Pass",
    duration_days: 1,
    base_price: 500,
    description: "Single day training pass",
    inclusions: ["Training session", "Equipment use"],
  },
  {
    id: 2,
    name: "1 Week Pass",
    duration_days: 7,
    base_price: 3000,
    description: "One week training pass",
    inclusions: ["Training sessions", "Equipment use", "Towel service"],
  },
  {
    id: 3,
    name: "1 Month Pass",
    duration_days: 30,
    base_price: 10000,
    description: "One month unlimited training",
    inclusions: [
      "Unlimited training",
      "Equipment use",
      "Towel service",
      "Nutrition consultation",
    ],
  },
];

// Gyms
export const GYMS: Gym[] = [
  {
    id: 1,
    slug: "lumpinee-boxing-stadium",
    gymNameThai: "สนามมวยลุมพินี",
    gymNameEnglish: "Lumpinee Boxing Stadium",
    address: "6 Rama IV Road, Thung Maha Mek, Sathon, Bangkok 10120",
    details:
      "One of the most prestigious Muay Thai stadiums in Thailand. Training facility with world-class trainers.",
    rating: 4.8,
    latitude: 13.7245,
    longitude: 100.5386,
    mapUrl: "https://maps.google.com/?q=13.7245,100.5386",
    socials: "facebook.com/lumpinee",
    gymType: "Professional",
    ownerName: "Lumpinee Management",
    ownerEmail: "contact@lumpinee.com",
    ownerPhone: "+66 2 251 4303",
    photos: [],
    packages: PACKAGES,
  },
  {
    id: 2,
    slug: "fairtex-training-center",
    gymNameThai: "ค่ายมวยแฟร์เท็กซ์",
    gymNameEnglish: "Fairtex Training Center",
    address: "221/12 Moo 1, Bang Pla, Bang Phli, Samut Prakan 10540",
    details:
      "World-renowned Muay Thai training camp. Fairtex has produced many champions.",
    rating: 4.9,
    latitude: 13.5933,
    longitude: 100.7031,
    mapUrl: "https://maps.google.com/?q=13.5933,100.7031",
    socials: "facebook.com/fairtex",
    gymType: "Professional",
    ownerName: "Fairtex Management",
    ownerEmail: "info@fairtex.com",
    ownerPhone: "+66 2 316 1818",
    photos: [],
    packages: PACKAGES,
  },
  {
    id: 3,
    slug: "tiger-muay-thai",
    gymNameThai: "ไทเกอร์ มวยไทย",
    gymNameEnglish: "Tiger Muay Thai",
    address: "7/11 Moo 5, Soi Ta-iad, Chalong, Phuket 83130",
    details:
      "Located in Phuket, Tiger Muay Thai is one of the largest and most famous training camps in the world.",
    rating: 4.7,
    latitude: 7.8804,
    longitude: 98.3520,
    mapUrl: "https://maps.google.com/?q=7.8804,98.3520",
    socials: "facebook.com/tigermuaythai",
    gymType: "Professional",
    ownerName: "Tiger Muay Thai Management",
    ownerEmail: "info@tigermuaythai.com",
    ownerPhone: "+66 76 367 071",
    photos: [],
    packages: PACKAGES,
  },
  {
    id: 4,
    slug: "petchyindee-academy",
    gymNameThai: "สถาบันเพชรยินดี",
    gymNameEnglish: "Petchyindee Academy",
    address: "123 Rama IV Road, Bangkok 10110",
    details:
      "Historic gym with a legacy of producing top fighters. Traditional training methods combined with modern facilities.",
    rating: 4.6,
    latitude: 13.7563,
    longitude: 100.5018,
    mapUrl: "https://maps.google.com/?q=13.7563,100.5018",
    socials: "facebook.com/petchyindee",
    gymType: "Professional",
    ownerName: "Petchyindee Management",
    ownerEmail: "info@petchyindee.com",
    ownerPhone: "+66 2 123 4567",
    photos: [],
    packages: PACKAGES,
  },
];

// Events
export const EVENTS: Event[] = [
  {
    id: 1,
    slug: "one-championship-bangkok",
    name: "ONE Championship: Bangkok Fight Night",
    date: "2025-11-15T19:00:00.000Z",
    location: "Impact Arena, Bangkok",
    details:
      "Experience the best of Muay Thai and mixed martial arts at ONE Championship. World-class fighters compete for glory.",
    price: 1500,
    image: undefined,
  },
  {
    id: 2,
    slug: "lumpinee-friday-fights",
    name: "Lumpinee Stadium Friday Fights",
    date: "2025-10-25T18:00:00.000Z",
    location: "Lumpinee Boxing Stadium, Bangkok",
    details:
      "Traditional Muay Thai fights at the legendary Lumpinee Stadium. Every Friday night features top Thai fighters.",
    price: 800,
    image: undefined,
  },
  {
    id: 3,
    slug: "rajadamnern-championship",
    name: "Rajadamnern Stadium Championship",
    date: "2025-11-01T19:00:00.000Z",
    location: "Rajadamnern Stadium, Bangkok",
    details:
      "Championship fights at the historic Rajadamnern Stadium. Watch rising stars and established champions battle it out.",
    price: 1000,
    image: undefined,
  },
  {
    id: 4,
    slug: "thai-fight-phuket",
    name: "Thai Fight: Phuket Showdown",
    date: "2025-12-05T20:00:00.000Z",
    location: "Phuket Provincial Stadium",
    details:
      "Thai Fight brings exciting Muay Thai action to Phuket. International and Thai fighters compete in spectacular matches.",
    price: 1200,
    image: undefined,
  },
];

// Products
export const PRODUCTS: Product[] = [
  {
    id: 1,
    slug: "fairtex-boxing-gloves-bgv1",
    nameThai: "นักชกถุงมือแฟร์เท็กซ์ BGV1",
    nameEnglish: "Fairtex Boxing Gloves BGV1",
    description:
      "Premium leather boxing gloves. Perfect for training and sparring.",
    price: 2500,
    stock: 50,
    category: "Equipment",
    image: undefined,
  },
  {
    id: 2,
    slug: "twins-special-shin-guards",
    nameThai: "สนับแข้ง Twins Special",
    nameEnglish: "Twins Special Shin Guards",
    description:
      "High-quality shin guards for Muay Thai training. Maximum protection.",
    price: 1800,
    stock: 30,
    category: "Equipment",
    image: undefined,
  },
  {
    id: 3,
    slug: "muay-thai-shorts-red",
    nameThai: "กางเกงมวยไทย สีแดง",
    nameEnglish: "Traditional Muay Thai Shorts - Red",
    description: "Authentic Thai-style fight shorts. Comfortable and durable.",
    price: 800,
    stock: 100,
    category: "Apparel",
    image: undefined,
  },
  {
    id: 4,
    slug: "hand-wraps-180-inch",
    nameThai: "ผ้าพันมือ 180 นิ้ว",
    nameEnglish: "Hand Wraps 180 inch",
    description: "Professional hand wraps. Essential for hand protection.",
    price: 200,
    stock: 200,
    category: "Equipment",
    image: undefined,
  },
  {
    id: 5,
    slug: "thai-oil-liniment",
    nameThai: "น้ำมันนวดไทย",
    nameEnglish: "Thai Boxing Liniment Oil",
    description: "Traditional Thai oil for warming up muscles before training.",
    price: 150,
    stock: 150,
    category: "Wellness",
    image: undefined,
  },
  {
    id: 6,
    slug: "heavy-bag-120cm",
    nameThai: "กระสอบทราย 120 ซม.",
    nameEnglish: "Heavy Bag 120cm",
    description: "Professional heavy bag for home or gym training.",
    price: 5500,
    stock: 15,
    category: "Equipment",
    image: undefined,
  },
];


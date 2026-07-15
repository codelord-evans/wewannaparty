import type { Event, EventSummary, GalleryItem } from "./types.ts";

export const werAfro: Event = {
  id: 32,
  name: 'We"R Afro',
  slug: "wer-afro",
  description:
    "Join thousands of music lovers for an unforgettable celebration of Afrohouse and 3-Step music at Uhuru Gardens. Featuring some of the biggest artists in the scene, world-class production, immersive experiences, and nonstop energy. One unforgettable night.",
  poster:
    "https://api.wewannaparty.africa/media/event-posters/WAREAFRO2.jpeg",
  date: "2026-08-29",
  start_time: "15:00:00",
  end_time: "03:00:00",
  doors_open: "14:00:00",
  venue_name: "Uhuru Gardens",
  location: "Nairobi, KENYA",
  category: "concert",
  dress_code: "Smart Casual",
  refund_policy: "Non Refundable",
  age_restriction: "18+",
  parking: "Available (Limited)",
  organizer: "WeAreAfro",
  event_type: "ticketed",
  service_fee_kes: 40,
  tickets: [
    {
      id: 80,
      name: "GENERAL ACCESS I̲̅I̲̅",
      description:
        "Full GA access\n  •  All live Amapiano, Afrohouse & 3-Step performances\n  •  Immersive festival activations\n  •  Food & beverage vendors on site\n  •  The full weRafro experience, start to finish\n\nLimited availability. Valid for one person",
      price_kes: 4000,
      available: true,
      highlighted: false,
      badge: "few_left",
    },
    {
      id: 81,
      name: "PRIORITY ACCESS I̲̅I̲̅",
      description:
        "Priority entry & fast-track access\n  •  Exclusive VIP area access\n  •  Premium stage views of every performance\n  •  Dedicated VIP bars & premium amenities\n  •  Designated event parking\n  •  All live Amapiano, Afrohouse & 3-Step performances\n  •  Immersive festival activations\n  •  Food & beverage vendors on site\n  •  The full weRafro experience, start to finish\n\nLimited availability. Valid for one person.",
      price_kes: 10000,
      available: true,
      highlighted: false,
      badge: "popular",
    },
    {
      id: 82,
      name: "DUO",
      description:
        "Everything is better with a friend.\n  •  Full GA access for two\n  •  All live Amapiano, Afrohouse & 3-Step performances\n  •  Immersive festival activations\n  •  Food & beverage vendors on site\n  •  The full weRafro experience, start to finish\n\nLimited availability. Valid for two people.",
      price_kes: 7599,
      available: true,
      highlighted: false,
    },
    {
      id: 83,
      name: "SQUAD PASS (X5)",
      description:
        "Better with your whole crew.\n  •  Full GA access for five\n  •  All live Amapiano, Afrohouse & 3-Step performances\n  •  Immersive festival activations\n  •  Food & beverage vendors on site\n  •  The full weRafro experience, start to finish\n\nLimited availability. Valid for five people.",
      price_kes: 17499,
      available: true,
      highlighted: false,
    },
    {
      id: 98,
      name: "iPLAN SUITE PACKAGE",
      description:
        "Premium suite package for 12 guests including:\n\n• KSh 100,000 Bar Tab\n• 6 VIP Parking Stickers\n• Elevated Premium Service\n• VVIP Entry\n• Meet & Greet with the Artist\n• Premium Stage Views",
      price_kes: 300000,
      available: true,
      highlighted: false,
    },
    {
      id: 97,
      name: "GONE KANJE LOUNGE PACKAGE",
      description:
        "Premium lounge package for 8 guests including:\n\n• KSh 50,000 Bar Tab\n• 4 VIP Parking Stickers\n• Elevated Premium Service\n• VVIP Entry\n• Meet & Greet with the Artist\n• Premium Stage Views",
      price_kes: 200000,
      available: true,
      highlighted: false,
    },
    {
      id: 96,
      name: "ABANTWANA BAKHO EXPERIENCE PACKAGE",
      description:
        "Premium table package for 4 guests including:\n\n• KSh 20,000 Bar Tab\n• 2 VIP Parking Stickers\n• Elevated Premium Service\n• VVIP Entry\n• Meet & Greet with the Artist\n• Premium Stage Views",
      price_kes: 100000,
      available: true,
      highlighted: false,
    },
    {
      id: 99,
      name: "UZIZWA KANJAN ROYALE PACKAGE",
      description:
        "Premium royale package for 15 guests  including:\n\n• KSh 200,000 Bar Tab\n• 8 VIP Parking Stickers\n• Elevated Premium Service\n• VVIP Entry\n• Meet & Greet with the Artist\n• Premium Stage Views",
      price_kes: 500000,
      available: true,
      highlighted: true,
      badge: "popular",
    },
    {
      id: 52,
      name: "SQUAD PASS  (X5)",
      description: "",
      price_kes: 8999,
      available: false,
      highlighted: false,
    },
    {
      id: 50,
      name: "PREMIUM ACCESS 𝐈",
      description: "",
      price_kes: 6000,
      available: false,
      highlighted: false,
    },
    {
      id: 55,
      name: "PRIORITY ACCESS I̲̅",
      description: "",
      price_kes: 8000,
      available: false,
      highlighted: false,
    },
    {
      id: 51,
      name: "DUO",
      description: "",
      price_kes: 3699,
      available: false,
      highlighted: false,
    },
    {
      id: 56,
      name: "DUO",
      description: "",
      price_kes: 5899,
      available: false,
      highlighted: false,
    },
    {
      id: 49,
      name: "EARLY ACCESS",
      description: "",
      price_kes: 2000,
      available: false,
      highlighted: false,
    },
    {
      id: 57,
      name: "SQUAD PASS (X5)",
      description: "",
      price_kes: 13999,
      available: false,
      highlighted: false,
    },
    {
      id: 54,
      name: "GENERAL ACCESS I̲̅",
      description: "",
      price_kes: 3000,
      available: false,
      highlighted: false,
    },
  ],
  artists: [
    {
      id: 14,
      name: "Scotts Maphuma",
      genre: "Amapiano",
      instagram_url:
        "https://www.instagram.com/scotts_maphuma?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
      photo_url:
        "https://api.wewannaparty.africa/media/artists/Scotts_Maphuma.jpeg",
    },
    {
      id: 15,
      name: "Thukuthela",
      genre: "Three Step Amapiano",
      instagram_url:
        "https://www.instagram.com/thukuthela_szn?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
      photo_url:
        "https://api.wewannaparty.africa/media/artists/Thukuthela_Photo.jpeg",
    },
    {
      id: 16,
      name: "GL_CEEJAY",
      genre: "Three Step Amapiano",
      instagram_url:
        "https://www.instagram.com/gl_ceejay?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
      photo_url:
        "https://api.wewannaparty.africa/media/artists/GL_Ceejay.jpeg",
    },
    {
      id: 17,
      name: "Jazzwrld",
      genre: "Three Step Amapiano",
      instagram_url:
        "https://www.instagram.com/_jazzworx?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
      photo_url:
        "https://api.wewannaparty.africa/media/artists/WhatsApp_Image_2026-06-12_at_11.59.22.jpeg",
    },
    {
      id: 23,
      name: "Dlala Thukzin",
      genre: "Amapiano",
      instagram_url:
        "https://www.instagram.com/dlalathukzin?igsh=MWoxdWlxNHJ1b2h2aw==",
      photo_url:
        "https://api.wewannaparty.africa/media/artists/7d432815-7e58-4707-9c61-4c3ba15cf505.jpeg",
    },
    {
      id: 24,
      name: "Nkosazana Daughter",
      genre: "Amapiano",
      instagram_url:
        "https://www.instagram.com/nkosazana_daughter?igsh=MTRnYm40cXhvMTBrZg==",
      photo_url:
        "https://api.wewannaparty.africa/media/artists/09b2389d-80b2-4507-bd77-d87f7eaec1f7.jpeg",
    },
  ],
};

export const featuredEvents: EventSummary[] = [
  {
    id: 37,
    name: "Pulsa  x Fallout",
    slug: "pulsa-x-fallout",
    poster:
      "https://api.wewannaparty.africa/media/event-posters/Your_paragraph_text_73.png",
    venue_name: "KODA",
    location: "KODA Nairobi",
    date: "2026-08-14",
    start_time: "19:00:00",
    status: "approved",
    price_min: "500",
    price_max: "3000",
    ticket_badge: "new_event",
  },
  {
    id: 32,
    name: 'We"R Afro',
    slug: "wer-afro",
    poster:
      "https://api.wewannaparty.africa/media/event-posters/WAREAFRO2.jpeg",
    venue_name: "Uhuru Gardens",
    location: "Nairobi,KENYA",
    date: "2026-08-29",
    start_time: "15:00:00",
    status: "approved",
    price_min: "2000",
    price_max: "500000",
    ticket_badge: "available",
  },
  {
    id: 35,
    name: "Sights & Sounds In The Coast",
    slug: "sights-sounds-in-the-coast",
    poster:
      "https://api.wewannaparty.africa/media/event-posters/IMG_1855.jpeg",
    venue_name: "Malindi - Diani",
    location: "Coast Region",
    date: "2026-07-02",
    start_time: "15:00:00",
    status: "approved",
    price_min: "25000",
    price_max: "36000",
    ticket_badge: "available",
  },
];

export const galleryItems: GalleryItem[] = [
  {
    id: 9,
    type: "PHOTO",
    title: "KOLACOPIA 3.0",
    venue: "Masshouse",
    event_date: "2026-11-22",
    image_url:
      "https://api.wewannaparty.africa/media/gallery/images/LilMainaMNPA_l8lO9Hk.jpeg",
    video_url: null,
    thumbnail_url: null,
  },
  {
    id: 8,
    type: "PHOTO",
    title: "KOLACOPIA 3.0",
    venue: "Masshouse",
    event_date: "2026-11-22",
    image_url:
      "https://api.wewannaparty.africa/media/gallery/images/Kamo_on_sage_4alya0M.jpeg",
    video_url: null,
    thumbnail_url: null,
  },
  {
    id: 7,
    type: "PHOTO",
    title: "KOLACOPIA 3.0",
    venue: "Masshouse",
    event_date: "2026-11-22",
    image_url:
      "https://api.wewannaparty.africa/media/gallery/images/kamo_on_stage_3_tt1mqoJ.jpeg",
    video_url: null,
    thumbnail_url: null,
  },
  {
    id: 6,
    type: "PHOTO",
    title: "KOLACOPIA 3.0",
    venue: "Masshouse",
    event_date: "2026-11-22",
    image_url:
      "https://api.wewannaparty.africa/media/gallery/images/kamo_on_stage_2_vPae4Yq.jpeg",
    video_url: null,
    thumbnail_url: null,
  },
  {
    id: 5,
    type: "PHOTO",
    title: "KOLACOPIA 3.0",
    venue: "Masshouse",
    event_date: "2026-11-22",
    image_url:
      "https://api.wewannaparty.africa/media/gallery/images/DjBoothDeck_NVXscdX.jpeg",
    video_url: null,
    thumbnail_url: null,
  },
  {
    id: 4,
    type: "PHOTO",
    title: "KOLACOPIA 3.0",
    venue: "Masshouse",
    event_date: "2026-11-22",
    image_url:
      "https://api.wewannaparty.africa/media/gallery/images/dj_at_work_xWlfYPn.jpeg",
    video_url: null,
    thumbnail_url: null,
  },
];

export const events: Event[] = [werAfro];

export interface Ticket {
  id: number;
  name: string;
  description: string;
  price_kes: number;
  available: boolean;
  highlighted: boolean;
  badge?: "few_left" | "popular" | null;
}

export interface Artist {
  id: number;
  name: string;
  genre: string;
  instagram_url: string;
  photo_url: string;
}

export interface Event {
  id: number;
  name: string;
  slug: string;
  description: string;
  poster: string;
  date: string;
  start_time: string;
  end_time: string;
  doors_open: string;
  venue_name: string;
  location: string;
  category: string;
  dress_code: string;
  refund_policy: string;
  age_restriction: string;
  tickets: Ticket[];
  artists: Artist[];
  event_type: string;
  service_fee_kes: number;
  parking?: string;
  organizer?: string;
}

export interface EventSummary {
  id: number;
  name: string;
  slug: string;
  poster: string;
  venue_name: string;
  location: string;
  date: string;
  start_time: string;
  status: string;
  price_min: string;
  price_max: string;
  ticket_badge: string;
}

export interface GalleryItem {
  id: number;
  type: "PHOTO" | "VIDEO";
  title: string;
  venue: string;
  event_date: string;
  image_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
}

export interface CartItem {
  ticketId: number;
  quantity: number;
}

export interface OrderRequest {
  eventSlug: string;
  items: CartItem[];
  email: string;
  phone: string;
  fullName: string;
  paymentMethod: "mpesa" | "card";
}

export interface Order {
  id: string;
  eventSlug: string;
  items: CartItem[];
  email: string;
  phone: string;
  fullName: string;
  paymentMethod: string;
  subtotal: number;
  serviceFee: number;
  total: number;
  status: "pending" | "paid" | "failed";
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
}

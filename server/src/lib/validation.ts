import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(255),
  phone: z.string().min(9).max(32).optional(),
});

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

export const createOrderSchema = z.object({
  eventSlug: z.string().min(1).max(255),
  items: z
    .array(
      z.object({
        ticketId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1)
    .max(20),
  email: z.string().email().max(255),
  phone: z.string().min(9).max(32),
  fullName: z.string().min(2).max(255),
  paymentMethod: z.enum(["mpesa", "card"]),
  idempotencyKey: z.string().min(8).max(128).optional(),
  spots: z.array(z.string().max(16)).max(20).optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email().max(255),
  orderId: z.string().max(32).optional(),
  message: z.string().min(5).max(5000),
});

export const createEventSchema = z.object({
  name: z.string().min(2).max(255),
  venue: z.string().min(2).max(255),
  date: z.string().min(4).max(32),
  capacity: z.coerce.number().int().positive().optional(),
  description: z.string().min(10).max(10000),
  email: z.string().email(),
});

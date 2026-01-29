import z from "zod";

// Category schemas
export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  image_url: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Category = z.infer<typeof CategorySchema>;

// Product schemas
export const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  original_price: z.number().nullable(),
  image_url: z.string().nullable(),
  category_id: z.number().nullable(),
  is_featured: z.boolean(),
  is_active: z.boolean(),
  stock_quantity: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Product = z.infer<typeof ProductSchema>;

// Banner schemas
export const BannerSchema = z.object({
  id: z.number(),
  title: z.string(),
  subtitle: z.string().nullable(),
  image_url: z.string().nullable(),
  image_mobile_url: z.string().nullable(),
  link_url: z.string().nullable(),
  is_active: z.boolean(),
  display_order: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Banner = z.infer<typeof BannerSchema>;

// Cart item type
export const CartItemSchema = z.object({
  product: ProductSchema,
  quantity: z.number().min(1),
});

export type CartItem = z.infer<typeof CartItemSchema>;

// Order schemas
export const OrderSchema = z.object({
  id: z.number(),
  customer_name: z.string().nullable(),
  customer_phone: z.string().nullable(),
  customer_email: z.string().nullable(),
  customer_ip: z.string().nullable(),
  items: z.array(CartItemSchema),
  total_amount: z.number(),
  status: z.string(),
  notes: z.string().nullable(),
  qr_code_url: z.string().nullable(),
  pix_copy_paste: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Order = z.infer<typeof OrderSchema>;

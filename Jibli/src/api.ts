import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";
const API_FALLBACK_URL =
  API_URL === "/api" || API_URL === "http://localhost:8000"
    ? "http://127.0.0.1:8000"
    : "http://localhost:8000";

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error("You must be logged in.");
  }

  return data.session.access_token;
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  let response: Response;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const requestOptions: RequestInit = {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  };

  try {
    response = await fetch(`${API_URL}${path}`, requestOptions);
  } catch {
    try {
      response = await fetch(`${API_FALLBACK_URL}${path}`, requestOptions);
    } catch {
      throw new Error(
        `Cannot reach the backend at ${API_URL} or ${API_FALLBACK_URL}. Start FastAPI, then refresh this page.`,
      );
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail =
      typeof data.detail === "string"
        ? data.detail
        : typeof data.message === "string"
          ? data.message
          : typeof data.error === "string"
            ? data.error
            : null;

    throw new Error(detail ?? `Request failed with status ${response.status}.`);
  }

  return data;
}

export type Shop = "aliexpress" | "shein" | "temu";

export type CartItemPayload = {
  product_link: string;
  shop: Shop;
  product_name?: string;
  selected_options: Record<string, string>;
  quantity: number;
  estimated_price?: number;
};

export type CartItem = {
  id: string;
  cart_id: string;
  product_link: string;
  shop: Shop;
  product_name: string | null;
  image_url: string | null;
  selected_options: Record<string, string> | null;
  quantity: number;
  estimated_price: number | null;
  created_at?: string;
};

export type OrderEvent = {
  id: string;
  order_id: string;
  user_id: string;
  status: string;
  note: string | null;
  created_at: string;
};

export type Order = {
  id: string;
  cart_id: string | null;
  user_id?: string;
  status: string;
  final_price: number | null;
  deposit_amount: number | null;
  tracking_number: string | null;
  created_at: string;
  items: CartItem[];
  events?: OrderEvent[];
  profiles?: {
    email: string | null;
    full_name: string | null;
    phone: string | null;
    city: string | null;
  } | null;
};

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  postal_code: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
};

export type AdminUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  postal_code: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
};

export type ProductPreview = {
  link: string;
  shop: Shop | null;
  supported: boolean;
  name?: string;
  price?: string;
  image_label?: string;
  image_url?: string | null;
  rating?: string;
  sold_count?: string;
  shipping?: string;
  delivery_eta?: string;
  seller?: string;
  variants?: { label: string; name: string; options: string[] }[];
  error?: string;
};

export async function previewProducts(links: string[]) {
  return apiFetch("/products/preview", {
    method: "POST",
    body: JSON.stringify({ links }),
  }) as Promise<{ items: ProductPreview[] }>;
}

export async function saveCartItems(payload: { items: CartItemPayload[]; notes?: string }) {
  return apiFetch("/cart/items", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function submitOrder() {
  return apiFetch("/orders/submit", {
    method: "POST",
  });
}

export async function getOrders() {
  return apiFetch("/orders") as Promise<{ orders: Order[] }>;
}

export async function getAdminOrders() {
  return apiFetch("/admin/orders") as Promise<{ orders: Order[] }>;
}

export async function getAdminUsers() {
  return apiFetch("/admin/users") as Promise<{ users: AdminUser[] }>;
}

export async function updateAdminOrderStatus(
  orderId: string,
  payload: {
    status: string;
    final_price?: number;
    deposit_amount?: number;
    tracking_number?: string;
    note?: string;
  },
) {
  return apiFetch(`/admin/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }) as Promise<{ order: Order }>;
}

export async function deleteAdminOrder(orderId: string) {
  return apiFetch(`/admin/orders/${orderId}`, {
    method: "DELETE",
  }) as Promise<{ deleted: boolean; order_id: string }>;
}

export async function updateAdminOrderItem(
  itemId: string,
  payload: { productName?: string; imageFile?: File },
) {
  const formData = new FormData();

  if (payload.productName !== undefined) {
    formData.append("product_name", payload.productName);
  }

  if (payload.imageFile) {
    formData.append("image", payload.imageFile);
  }

  return apiFetch(`/admin/order-items/${itemId}`, {
    method: "PATCH",
    body: formData,
  }) as Promise<{ item: CartItem }>;
}

export async function getProfile(): Promise<Profile> {
  return apiFetch("/me/profile") as Promise<Profile>;
}

export async function updateProfile(payload: {
  full_name: string;
  phone: string;
  city: string;
  address?: string;
  postal_code?: string;
  avatar_url?: string;
}) {
  return apiFetch("/me/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

async function publicApiFetch(path: string, options: RequestInit = {}) {
  let response: Response;
  const requestOptions: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  try {
    response = await fetch(`${API_URL}${path}`, requestOptions);
  } catch {
    try {
      response = await fetch(`${API_FALLBACK_URL}${path}`, requestOptions);
    } catch {
      throw new Error(
        `Cannot reach the backend at ${API_URL} or ${API_FALLBACK_URL}. Start FastAPI, then refresh this page.`,
      );
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail =
      typeof data.detail === "string"
        ? data.detail
        : typeof data.message === "string"
          ? data.message
          : typeof data.error === "string"
            ? data.error
            : null;

    throw new Error(detail ?? `Request failed with status ${response.status}.`);
  }

  return data;
}

export type QuickOrderShop = Shop;

export type QuickOrderPreview = {
  link: string;
  shop: QuickOrderShop | null;
  supported: boolean;
  name?: string;
  price?: string;
  image_url?: string | null;
  error?: string;
};

export async function quickOrderPreview(link: string) {
  return publicApiFetch("/quick-order/preview", {
    method: "POST",
    body: JSON.stringify({ link }),
  }) as Promise<QuickOrderPreview>;
}

export type PriceCurrency = "usd" | "eur";

export type QuickOrderPriceResult = {
  shop: QuickOrderShop;
  usd_price: number;
  quantity: number;
  unit_price_tnd: number;
  total_price_tnd: number;
};

export async function quickOrderPrice(
  shop: QuickOrderShop,
  amount: number,
  quantity: number,
  currency: PriceCurrency,
) {
  return publicApiFetch("/quick-order/price", {
    method: "POST",
    body: JSON.stringify({ shop, amount, quantity, currency }),
  }) as Promise<QuickOrderPriceResult>;
}

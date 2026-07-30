export interface MenuItem {
  id: string;
  name: string;
  category: "COFFEE_HOT" | "COFFEE_ICED" | "NON_CAFFEINE" | "BAKERY";
  price: string;
  cost: string;
  imageUrl: string | null;
  story: string | null;
  isActive: boolean;
}

export interface MenuRequest {
  id: string;
  name: string;
  voteCount: number;
  isApproved: boolean;
}

export interface Sale {
  id: string;
  paymentMethod: "CASH" | "QR" | "CARD";
  total: string;
  createdAt: string;
  items: {
    menuItemId: string;
    quantity: number;
    unitPrice: string;
    menuItem?: { id: string; name: string; cost: string; price: string };
  }[];
}

export interface Expense {
  id: string;
  category: string;
  amount: string;
  note: string | null;
  date: string;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "เกิดข้อผิดพลาด");
  }
  return data;
}

export const CATEGORY_LABELS: Record<string, string> = {
  COFFEE_HOT: "กาแฟร้อน",
  COFFEE_ICED: "กาแฟเย็น",
  NON_CAFFEINE: "ไม่มีคาเฟอีน",
  BAKERY: "เบเกอรี่",
};

export function getMe() {
  return request<{ user: { userId: string; shopId: string; role: string } }>("/api/auth/me");
}

export function getMenu() {
  return request<{ items: MenuItem[] }>("/api/menu");
}

export function createMenuItem(data: {
  name: string;
  category: string;
  price: number;
  cost: number;
  imageUrl?: string;
  story?: string;
}) {
  return request<{ item: MenuItem }>("/api/menu", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateMenuItem(
  id: string,
  data: Partial<{
    name: string;
    category: string;
    price: number;
    cost: number;
    imageUrl: string;
    story: string;
    isActive: boolean;
  }>
) {
  return request<{ item: MenuItem }>(`/api/menu/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteMenuItem(id: string) {
  return request<{ item: MenuItem }>(`/api/menu/${id}`, {
    method: "DELETE",
  });
}

export function getMenuRequests() {
  return request<{ requests: MenuRequest[] }>("/api/menu-requests");
}

export function submitMenuRequest(name: string) {
  return request<{ request: MenuRequest }>("/api/menu-requests", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function voteMenuRequest(id: string) {
  return request<{ request: MenuRequest }>(`/api/menu-requests/${id}/vote`, {
    method: "POST",
  });
}

export function login(email: string, password: string) {
  return request<{ user: { id: string; name: string; email: string; role: string } }>(
    "/api/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) }
  );
}

export function logout() {
  return request<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
}

export function getSales() {
  return request<{ sales: Sale[] }>("/api/sales");
}

export function createSale(paymentMethod: string, items: { menuItemId: string; quantity: number; unitPrice: number }[]) {
  return request<{ sale: Sale }>("/api/sales", {
    method: "POST",
    body: JSON.stringify({ paymentMethod, items }),
  });
}

export function getExpenses() {
  return request<{ expenses: Expense[] }>("/api/expenses");
}

export function createExpense(category: string, amount: number, note: string) {
  return request<{ expense: Expense }>("/api/expenses", {
    method: "POST",
    body: JSON.stringify({ category, amount, note }),
  });
}

import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { dbInit } from "./firebase";

export interface User {
  id: string;
  email: string;
  name: string;
  bio: string;
  avatarUrl?: string;
  isAdmin: boolean;
  isBanned?: boolean;
  balance?: number;
  purchasedProducts?: string[];
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: "deposit" | "purchase" | "refund" | "admin_deduction";
  description: string;
  createdAt: number;
}

export interface SocialLink {
  id: string;
  userId: string;
  platform: string;
  url: string;
  logoUrl?: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  trxId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price?: number;
  imageUrl?: string;
  category?: string;
  requiredUserInputLabel?: string;
  deliveryLink?: string;
  whatsappNumber?: string;
  isManualFulfillment?: boolean;
  options?: { name: string; price: number }[];
  estimatedTime?: string;
  isActive?: boolean;
  sortOrder?: number;
  createdAt: number;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  productId: string;
  productTitle: string;
  price: number;
  userInput?: string;
  deliveryLink?: string;
  status?: "pending" | "completed" | "rejected";
  createdAt: number;
}

export interface PaymentMethod {
  id: string;
  name: string; // e.g. "bKash", "Nagad"
  details: string; // e.g. "01745299296 (Personal)"
}

export interface AppSettings {
  appName: string;
  heroTitle: string;
  heroSubtitle: string;
  currencySymbol?: string;
  adminWhatsappNumber?: string;
  paymentMethods?: PaymentMethod[];
  telegramChatId?: string;
  telegramChatIds?: string[];
  noticeBanner?: string;
  maintenanceMode?: boolean;
  // Auto Topup APIs
  freeFireApiUrl?: string;
  freeFireApiKey?: string;
  garenaShellApiUrl?: string;
  garenaShellApiKey?: string;
  unipinApiUrl?: string;
  unipinApiKey?: string;
}

class FirebaseDatabase {
  // --- Settings ---
  async getSettings(): Promise<AppSettings> {
    const ref = doc(dbInit, "settings", "global");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as AppSettings;
      if (!data.currencySymbol) data.currencySymbol = "৳";
      return data;
    }
    const defaultSettings: AppSettings = {
      appName: "Shafi Topup",
      heroTitle: "Discover Premium Products",
      heroSubtitle: "Browse the latest offerings and curate your own digital showcase.",
      currencySymbol: "৳"
    };
    await setDoc(ref, defaultSettings);
    return defaultSettings;
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const ref = doc(dbInit, "settings", "global");
    await updateDoc(ref, settings);
    const snap = await getDoc(ref);
    return snap.data() as AppSettings;
  }

  // --- Auth & Users ---
  async initDb() {
    // Admin seeding is handled dynamically or in Auth provider.
  }

  async login(email: string, id: string, name: string): Promise<User> {
    const userRef = doc(dbInit, "users", id);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as User;
    } else {
      const newUser: User = {
        id,
        email,
        name: name || email.split("@")[0],
        bio: "New user",
        isAdmin: email === "admin@shafilink.com" || email === "koro@shafilink.com" || email === "piccisarfin@gmail.com",
        balance: 0,
        purchasedProducts: [],
      };
      await setDoc(userRef, newUser);
      return newUser;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const userRef = doc(dbInit, "users", userId);
    await updateDoc(userRef, updates);
    const snap = await getDoc(userRef);
    return snap.data() as User;
  }

  async addFunds(userId: string, amount: number, description: string = "Funds added to balance"): Promise<void> {
    const userRef = doc(dbInit, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error("User not found");
    const balance = (userSnap.data().balance || 0) + amount;
    await updateDoc(userRef, { balance });
    await this.logTransaction(userId, amount, "deposit", description);
  }

  async logTransaction(userId: string, amount: number, type:Transaction["type"], description: string): Promise<void> {
    const ref = doc(collection(dbInit, "transactions"));
    const trx: Transaction = {
      id: ref.id,
      userId,
      amount,
      type,
      description,
      createdAt: Date.now()
    };
    await setDoc(ref, trx);
  }

  async getTransactions(userId?: string): Promise<Transaction[]> {
    let q;
    if (userId) {
      q = query(collection(dbInit, "transactions"), where("userId", "==", userId));
    } else {
      q = query(collection(dbInit, "transactions"), orderBy("createdAt", "desc"));
    }
    
    const snap = await getDocs(q);
    const transactions = snap.docs.map(d => d.data() as Transaction);
    
    if (userId) {
      return transactions.sort((a, b) => b.createdAt - a.createdAt);
    }
    return transactions;
  }

  async purchaseProduct(userId: string, product: Product, userInput?: string): Promise<Order> {
    const userRef = doc(dbInit, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error("User not found");
    const u = userSnap.data() as User;
    const balance = u.balance || 0;
    if (balance < product.price) throw new Error("Insufficient funds");
    
    await updateDoc(userRef, {
      balance: balance - product.price,
      purchasedProducts: [...(u.purchasedProducts || []), product.id]
    });

    await this.logTransaction(userId, product.price, "purchase", `Purchased ${product.title}`);

    const orderRef = doc(collection(dbInit, "orders"));
    const order: Order = {
      id: orderRef.id,
      userId,
      userEmail: u.email,
      productId: product.id,
      productTitle: product.title,
      price: product.price,
      userInput: userInput || "",
      deliveryLink: product.isManualFulfillment ? "" : (product.deliveryLink || ""),
      status: product.isManualFulfillment ? "pending" : "completed",
      createdAt: Date.now()
    };
    await setDoc(orderRef, order);

    // Call Telegram webhook
    const settings = await this.getSettings();
    const chatIds = settings?.telegramChatIds?.length ? settings.telegramChatIds : (settings?.telegramChatId || "6891891678").split(",").map(id => id.trim()).filter(id => id);
    
    for (const chatId of chatIds) {
      fetch("https://api.telegram.org/bot8677363890:AAFeLJhBx91a17DVfdcnj43r3iS_1PyCu5o/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `✅ New Order!\nUser: ${u.email}\nProduct: ${product.title}\nAmount: ${product.price}${userInput ? `\nUser Input: ${userInput}` : ''}`
        })
      }).catch(console.error);
    }

    return order;
  }

  async updateOrderStatus(orderId: string, status: "pending" | "completed" | "rejected", deliveryLink?: string) {
    const orderRef = doc(dbInit, "orders", orderId);
    let updateData: any = { status };
    if (deliveryLink !== undefined) {
      updateData.deliveryLink = deliveryLink;
    }
    await updateDoc(orderRef, updateData);
  }

  // --- Orders ---
  async getOrders(): Promise<Order[]> {
    const q = query(collection(dbInit, "orders"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Order);
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    const q = query(collection(dbInit, "orders"), where("userId", "==", userId));
    const snap = await getDocs(q);
    const orders = snap.docs.map(d => d.data() as Order);
    return orders.sort((a, b) => b.createdAt - a.createdAt);
  }

  // --- Deposit Requests ---

  async createDepositRequest(userId: string, userName: string, userEmail: string, amount: number, trxId: string): Promise<DepositRequest> {
    const ref = doc(collection(dbInit, "deposits"));
    const req: DepositRequest = {
      id: ref.id,
      userId,
      userName,
      userEmail,
      amount,
      trxId,
      status: "pending",
      createdAt: Date.now()
    };
    await setDoc(ref, req);

    // Call Telegram webhook
    const settings = await this.getSettings();
    const chatIds = settings?.telegramChatIds?.length ? settings.telegramChatIds : (settings?.telegramChatId || "6891891678").split(",").map(id => id.trim()).filter(id => id);
    
    for (const chatId of chatIds) {
      fetch("https://api.telegram.org/bot8677363890:AAFeLJhBx91a17DVfdcnj43r3iS_1PyCu5o/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `💰 New Deposit!\nUser: ${userEmail}\nAmount: ${amount}\nTransaction ID: ${trxId}`
        })
      }).catch(console.error);
    }

    return req;
  }

  async getDepositRequests(status?: "pending" | "approved" | "rejected"): Promise<DepositRequest[]> {
    let q = query(collection(dbInit, "deposits"));
    if (status) {
      q = query(collection(dbInit, "deposits"), where("status", "==", status));
    }
    const snap = await getDocs(q);
    const deposits = snap.docs.map(d => d.data() as DepositRequest);
    return deposits.sort((a, b) => b.createdAt - a.createdAt);
  }

  async getUserDepositRequests(userId: string): Promise<DepositRequest[]> {
    const q = query(collection(dbInit, "deposits"), where("userId", "==", userId));
    const snap = await getDocs(q);
    const deposits = snap.docs.map(d => d.data() as DepositRequest);
    return deposits.sort((a, b) => b.createdAt - a.createdAt);
  }

  async updateDepositRequestStatus(id: string, status: "approved" | "rejected"): Promise<void> {
    const ref = doc(dbInit, "deposits", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Deposit request not found");
    
    const req = snap.data() as DepositRequest;
    if (req.status !== "pending") throw new Error("Request already processed");

    if (status === "approved") {
      await this.addFunds(req.userId, req.amount, `Deposit Approved (TrxID: ${req.trxId})`);
    }
    
    await updateDoc(ref, { status });
  }

  async getAllUsers(): Promise<User[]> {
    const q = collection(dbInit, "users");
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as User);
  }

  async getAdminUsers(): Promise<User[]> {
    const q = query(collection(dbInit, "users"), where("isAdmin", "==", true));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as User);
  }

  async deleteUser(userId: string): Promise<void> {
    await deleteDoc(doc(dbInit, "users", userId));
    // Cascade delete links
    const links = await this.getLinks(userId);
    for (const link of links) {
      await deleteDoc(doc(dbInit, "links", link.id));
    }
  }

  // --- Social Links ---
  async getLinks(userId: string): Promise<SocialLink[]> {
    const q = query(collection(dbInit, "links"), where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as SocialLink);
  }

  async getAllLinks(): Promise<SocialLink[]> {
    const q = collection(dbInit, "links");
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as SocialLink);
  }

  async addLink(link: Omit<SocialLink, "id">): Promise<SocialLink> {
    const ref = doc(collection(dbInit, "links"));
    const newLink = { ...link, id: ref.id };
    await setDoc(ref, newLink);
    return newLink;
  }

  async updateLink(id: string, updates: Partial<SocialLink>): Promise<SocialLink> {
    const ref = doc(dbInit, "links", id);
    await updateDoc(ref, updates);
    const snap = await getDoc(ref);
    return snap.data() as SocialLink;
  }

  async removeLink(id: string): Promise<void> {
    await deleteDoc(doc(dbInit, "links", id));
  }

  // --- Products ---
  async getProducts(): Promise<Product[]> {
    const q = query(collection(dbInit, "products"));
    const snap = await getDocs(q);
    const products = snap.docs.map(d => d.data() as Product);
    return products.sort((a, b) => {
      const orderA = a.sortOrder ?? 999999;
      const orderB = b.sortOrder ?? 999999;
      if (orderA !== orderB) return orderA - orderB;
      return b.createdAt - a.createdAt;
    });
  }

  async getProduct(id: string): Promise<Product | null> {
    const ref = doc(dbInit, "products", id);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as Product) : null;
  }

  async addProduct(product: Omit<Product, "id" | "createdAt">): Promise<Product> {
    const ref = doc(collection(dbInit, "products"));
    const newProduct = { ...product, id: ref.id, createdAt: Date.now() };
    await setDoc(ref, newProduct);
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const ref = doc(dbInit, "products", id);
    await updateDoc(ref, updates);
    const snap = await getDoc(ref);
    return snap.data() as Product;
  }

  async removeProduct(id: string): Promise<void> {
    await deleteDoc(doc(dbInit, "products", id));
  }
}

export const db = new FirebaseDatabase();

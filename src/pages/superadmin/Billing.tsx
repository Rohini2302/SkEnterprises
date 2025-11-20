import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, DollarSign, TrendingUp, Eye, Download, Upload, IndianRupee, Calendar, Clock, CreditCard, Banknote, Receipt, Edit, Users, Filter, FileDown, Building, Home, Shield, Car, Trash2, Droplets, Package, List, Grid, ChevronLeft, ChevronRight, Search, AlertTriangle, BarChart3, PieChart } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Pie, Cell } from "recharts";

interface Invoice {
  id: string;
  client: string;
  clientEmail: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  tax: number;
  discount: number;
  paymentMethod?: string;
  serviceType?: string;
  site?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  status: "pending" | "approved" | "rejected";
  vendor: string;
  paymentMethod: string;
  gst?: number;
  site?: string;
  expenseType: "operational" | "office" | "other";
}

interface Payment {
  id: string;
  invoiceId: string;
  client: string;
  amount: number;
  date: string;
  method: string;
  status: "completed" | "failed" | "pending";
}

interface LedgerEntry {
  id: string;
  party: string;
  type: "invoice" | "payment" | "expense" | "credit_note";
  reference: string;
  date: string;
  debit: number;
  credit: number;
  balance: number;
  description: string;
  status: string;
  site?: string;
  serviceType?: string;
}

interface PartyBalance {
  party: string;
  totalDebit: number;
  totalCredit: number;
  currentBalance: number;
  lastTransaction: string;
  status: "credit" | "debit" | "settled";
  site?: string;
}

interface SiteProfit {
  site: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  profitMargin: number;
}

const Billing = () => {
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [expenseViewDialogOpen, setExpenseViewDialogOpen] = useState(false);
  const [expenseEditDialogOpen, setExpenseEditDialogOpen] = useState(false);
  const [ledgerDialogOpen, setLedgerDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("invoices");
  const [expenseTypeFilter, setExpenseTypeFilter] = useState<"all" | "operational" | "office" | "other">("all");
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: ""
  });
  const [reportPeriod, setReportPeriod] = useState<"weekly" | "monthly">("monthly");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [ledgerViewMode, setLedgerViewMode] = useState<"table" | "card">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [ledgerCurrentPage, setLedgerCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [ledgerItemsPerPage, setLedgerItemsPerPage] = useState(10);

  // Sites and Clients Data
  const sites = [
    "Tech Park Bangalore",
    "Financial District Mumbai", 
    "IT Hub Hyderabad",
    "Commercial Complex Delhi",
    "Business Center Chennai"
  ];

  const serviceTypes = [
    "Housekeeping Management",
    "Security Management", 
    "Parking Management",
    "Waste Management",
    "STP Tank Cleaning",
    "Consumables Supply"
  ];

  const expenseCategories = [
    "Equipment",
    "Cleaning Supplies",
    "Infrastructure",
    "Waste Management",
    "STP Maintenance",
    "Security",
    "Parking",
    "Utilities",
    "Office Supplies",
    "Software & Technology",
    "Travel & Conveyance",
    "Professional Services",
    "Marketing & Advertising",
    "Repairs & Maintenance",
    "Other Expenses"
  ];

  const clients = [
    "ALYSSUM DEVELOPERS PVT. LTD.",
    "ARYA ASSOCIATES",
    "ASTITVA ASSET MANAGEMENT LLP",
    "A.T.C COMMERCIAL PREMISES CO. OPERATIVE SOCIETY LTD",
    "BAHIRAT ESTATE LLP",
    "CHITRALI PROPERTIES PVT LTD",
    "Concretely Infra Llp",
    "COORTUS ADVISORS LLP",
    "CUSHMAN & WAKEFIELD PROPERTY MANAGEMENT SERVICES INDIA PVT. LTD.",
    "DAKSHA INFRASTRUCTURE PVT. LTD.",
    "GANRAJ HOMES LLP-GANGA IMPERIA",
    "Global Lifestyle Hinjawadi Co-operative Housing Society Ltd",
    "GLOBAL PROPERTIES",
    "GLOBAL SQUARE PREMISES CO SOC LTD",
    "ISS FACILITY SERVICES INDIA PVT LTD",
    "JCSS CONSULTING INDIA PVT LTD",
    "KAPPA REALTORS LLP PUNE",
    "KRISHAK SEVITA ONLINE SOLUTIONS PRIVATE LIMITED",
    "LA MERE BUSINESS PVT. LTD.",
    "MATTER MOTOR WORKS PRIVATE LIMITED",
    "MEDIA PROTOCOL SERVICES",
    "MINDSPACE SHELTERS LLP (F2)",
    "NEXT GEN BUSINESS CENTRE LLP",
    "N G VENTURES",
    "PRIME VENTURES",
    "RADIANT INFRAPOWER",
    "RUHRPUMPEN INDIA PVT LTD",
    "SATURO TECHNOLOGIES PVT LTD",
    "SHUBH LANDMARKS",
    "SIDDHIVINAYAK POULTRY BREEDING FARM & HATCHERIES PRIVATE LIMITED",
    "SUVARNA FMS PVT LTD",
    "SYNERGY INFOTECH PVT LTD",
    "VILAS JAVDEKAR ECO SHELTERS PVT. LTD",
    "WEETAN SBRFS LLP",
    "WESTERN INDIA FORGINGS PVT LTD"
  ];

  // Enhanced data with all sites and service types
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: "INV-001",
      client: "ALYSSUM DEVELOPERS PVT. LTD.",
      clientEmail: "accounts@alyssum.com",
      amount: 125000,
      status: "paid",
      date: "2024-01-10",
      dueDate: "2024-01-20",
      items: [
        { description: "Housekeeping Management - Monthly Service", quantity: 1, rate: 75000, amount: 75000 },
        { description: "Security Personnel Services", quantity: 4, rate: 12500, amount: 50000 }
      ],
      tax: 22500,
      discount: 0,
      paymentMethod: "Bank Transfer",
      serviceType: "Housekeeping Management",
      site: "Tech Park Bangalore"
    },
    {
      id: "INV-002",
      client: "ARYA ASSOCIATES",
      clientEmail: "billing@aryaassociates.com",
      amount: 89000,
      status: "pending",
      date: "2024-01-15",
      dueDate: "2024-01-25",
      items: [
        { description: "Parking Management Services", quantity: 1, rate: 45000, amount: 45000 },
        { description: "Waste Management - Monthly", quantity: 1, rate: 44000, amount: 44000 }
      ],
      tax: 16020,
      discount: 1000,
      paymentMethod: "UPI",
      serviceType: "Parking Management",
      site: "Financial District Mumbai"
    },
    {
      id: "INV-003",
      client: "ASTITVA ASSET MANAGEMENT LLP",
      clientEmail: "finance@astitva.com",
      amount: 156000,
      status: "overdue",
      date: "2024-01-05",
      dueDate: "2024-01-15",
      items: [
        { description: "STP Tank Cleaning - Quarterly", quantity: 1, rate: 98000, amount: 98000 },
        { description: "Consumables Supply", quantity: 1, rate: 58000, amount: 58000 }
      ],
      tax: 28080,
      discount: 5000,
      serviceType: "STP Tank Cleaning",
      site: "IT Hub Hyderabad"
    },
    {
      id: "INV-004",
      client: "CUSHMAN & WAKEFIELD PROPERTY MANAGEMENT SERVICES INDIA PVT. LTD.",
      clientEmail: "accounts@cushwake.com",
      amount: 67000,
      status: "paid",
      date: "2024-01-12",
      dueDate: "2024-01-22",
      items: [
        { description: "Security Management - Monthly", quantity: 1, rate: 67000, amount: 67000 }
      ],
      tax: 12060,
      discount: 0,
      paymentMethod: "Bank Transfer",
      serviceType: "Security Management",
      site: "Commercial Complex Delhi"
    },
    {
      id: "INV-005",
      client: "ISS FACILITY SERVICES INDIA PVT LTD",
      clientEmail: "billing@issindia.com",
      amount: 45000,
      status: "pending",
      date: "2024-01-18",
      dueDate: "2024-01-28",
      items: [
        { description: "Consumables Supply - Office", quantity: 1, rate: 45000, amount: 45000 }
      ],
      tax: 8100,
      discount: 2000,
      serviceType: "Consumables Supply",
      site: "Business Center Chennai"
    },
    {
      id: "INV-006",
      client: "GANRAJ HOMES LLP-GANGA IMPERIA",
      clientEmail: "accounts@ganraj.com",
      amount: 98000,
      status: "paid",
      date: "2024-01-08",
      dueDate: "2024-01-18",
      items: [
        { description: "Security Management Services", quantity: 3, rate: 20000, amount: 60000 },
        { description: "Housekeeping Services", quantity: 1, rate: 38000, amount: 38000 }
      ],
      tax: 17640,
      discount: 0,
      paymentMethod: "Bank Transfer",
      serviceType: "Security Management",
      site: "Tech Park Bangalore"
    },
    {
      id: "INV-007",
      client: "PRIME VENTURES",
      clientEmail: "finance@primeventures.com",
      amount: 120000,
      status: "pending",
      date: "2024-01-20",
      dueDate: "2024-01-30",
      items: [
        { description: "Parking Management - Premium", quantity: 1, rate: 80000, amount: 80000 },
        { description: "Waste Management Services", quantity: 1, rate: 40000, amount: 40000 }
      ],
      tax: 21600,
      discount: 5000,
      serviceType: "Parking Management",
      site: "Financial District Mumbai"
    },
    {
      id: "INV-008",
      client: "SYNERGY INFOTECH PVT LTD",
      clientEmail: "accounts@synergy.com",
      amount: 75000,
      status: "overdue",
      date: "2024-01-03",
      dueDate: "2024-01-13",
      items: [
        { description: "Consumables Supply - IT Equipment", quantity: 1, rate: 75000, amount: 75000 }
      ],
      tax: 13500,
      discount: 0,
      serviceType: "Consumables Supply",
      site: "IT Hub Hyderabad"
    },
    {
      id: "INV-009",
      client: "WEETAN SBRFS LLP",
      clientEmail: "billing@weetan.com",
      amount: 185000,
      status: "paid",
      date: "2024-01-25",
      dueDate: "2024-02-04",
      items: [
        { description: "STP Tank Cleaning - Comprehensive", quantity: 1, rate: 120000, amount: 120000 },
        { description: "Waste Management - Advanced", quantity: 1, rate: 65000, amount: 65000 }
      ],
      tax: 33300,
      discount: 8000,
      paymentMethod: "UPI",
      serviceType: "STP Tank Cleaning",
      site: "Commercial Complex Delhi"
    },
    {
      id: "INV-010",
      client: "WESTERN INDIA FORGINGS PVT LTD",
      clientEmail: "accounts@westernindia.com",
      amount: 55000,
      status: "pending",
      date: "2024-01-28",
      dueDate: "2024-02-07",
      items: [
        { description: "Housekeeping Management - Basic", quantity: 1, rate: 55000, amount: 55000 }
      ],
      tax: 9900,
      discount: 2000,
      serviceType: "Housekeeping Management",
      site: "Business Center Chennai"
    }
  ]);

  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: "EXP-001",
      category: "Equipment",
      description: "Security Cameras and Monitoring System",
      amount: 185000,
      date: "2024-01-05",
      status: "approved",
      vendor: "Security Solutions India",
      paymentMethod: "Bank Transfer",
      gst: 33300,
      site: "Tech Park Bangalore",
      expenseType: "operational"
    },
    {
      id: "EXP-002",
      category: "Cleaning Supplies",
      description: "Housekeeping Consumables and Equipment",
      amount: 75000,
      date: "2024-01-12",
      status: "pending",
      vendor: "CleanTech Supplies",
      paymentMethod: "Credit Card",
      gst: 13500,
      site: "Financial District Mumbai",
      expenseType: "operational"
    },
    {
      id: "EXP-003",
      category: "Infrastructure",
      description: "Parking Management System Installation",
      amount: 320000,
      date: "2024-01-18",
      status: "approved",
      vendor: "ParkTech Solutions",
      paymentMethod: "Bank Transfer",
      gst: 57600,
      site: "IT Hub Hyderabad",
      expenseType: "operational"
    },
    {
      id: "EXP-004",
      category: "Waste Management",
      description: "Waste Processing Equipment Maintenance",
      amount: 45000,
      date: "2024-01-22",
      status: "approved",
      vendor: "EcoWaste Systems",
      paymentMethod: "UPI",
      gst: 8100,
      site: "Commercial Complex Delhi",
      expenseType: "operational"
    },
    {
      id: "EXP-005",
      category: "STP Maintenance",
      description: "STP Tank Cleaning Chemicals and Equipment",
      amount: 68000,
      date: "2024-01-25",
      status: "pending",
      vendor: "WaterTech Solutions",
      paymentMethod: "Bank Transfer",
      gst: 12240,
      site: "Business Center Chennai",
      expenseType: "operational"
    },
    {
      id: "EXP-006",
      category: "Office Supplies",
      description: "Office Stationery and Printer Cartridges",
      amount: 25000,
      date: "2024-01-14",
      status: "approved",
      vendor: "Office Depot India",
      paymentMethod: "Credit Card",
      gst: 4500,
      site: "Tech Park Bangalore",
      expenseType: "office"
    },
    {
      id: "EXP-007",
      category: "Software & Technology",
      description: "Accounting Software Subscription",
      amount: 45000,
      date: "2024-01-19",
      status: "approved",
      vendor: "Tech Solutions Ltd",
      paymentMethod: "Bank Transfer",
      gst: 8100,
      site: "Financial District Mumbai",
      expenseType: "office"
    },
    {
      id: "EXP-008",
      category: "Travel & Conveyance",
      description: "Client Meeting Travel Expenses",
      amount: 18000,
      date: "2024-01-28",
      status: "approved",
      vendor: "Multiple Vendors",
      paymentMethod: "Cash",
      gst: 3240,
      site: "IT Hub Hyderabad",
      expenseType: "office"
    },
    {
      id: "EXP-009",
      category: "Professional Services",
      description: "Legal Consultation Fees",
      amount: 35000,
      date: "2024-01-30",
      status: "pending",
      vendor: "Legal Associates LLP",
      paymentMethod: "Bank Transfer",
      gst: 6300,
      site: "Commercial Complex Delhi",
      expenseType: "other"
    },
    {
      id: "EXP-010",
      category: "Marketing & Advertising",
      description: "Digital Marketing Campaign",
      amount: 55000,
      date: "2024-01-31",
      status: "approved",
      vendor: "Digital Marketing Pro",
      paymentMethod: "UPI",
      gst: 9900,
      site: "Business Center Chennai",
      expenseType: "other"
    },
    {
      id: "EXP-011",
      category: "Other Expenses",
      description: "Miscellaneous Unplanned Expenses",
      amount: 15000,
      date: "2024-01-20",
      status: "approved",
      vendor: "Various Vendors",
      paymentMethod: "Cash",
      gst: 2700,
      site: "Tech Park Bangalore",
      expenseType: "other"
    }
  ]);

  const [payments, setPayments] = useState<Payment[]>([
    {
      id: "PAY-001",
      invoiceId: "INV-001",
      client: "ALYSSUM DEVELOPERS PVT. LTD.",
      amount: 125000,
      date: "2024-01-12",
      method: "Bank Transfer",
      status: "completed"
    },
    {
      id: "PAY-002",
      invoiceId: "INV-004",
      client: "CUSHMAN & WAKEFIELD PROPERTY MANAGEMENT SERVICES INDIA PVT. LTD.",
      amount: 67000,
      date: "2024-01-20",
      method: "Bank Transfer",
      status: "completed"
    },
    {
      id: "PAY-003",
      invoiceId: "INV-003",
      client: "ASTITVA ASSET MANAGEMENT LLP",
      amount: 156000,
      date: "2024-01-20",
      method: "UPI",
      status: "failed"
    },
    {
      id: "PAY-004",
      invoiceId: "INV-006",
      client: "GANRAJ HOMES LLP-GANGA IMPERIA",
      amount: 98000,
      date: "2024-01-15",
      method: "Bank Transfer",
      status: "completed"
    },
    {
      id: "PAY-005",
      invoiceId: "INV-009",
      client: "WEETAN SBRFS LLP",
      amount: 185000,
      date: "2024-01-28",
      method: "UPI",
      status: "completed"
    }
  ]);

  // Ledger and Balance State
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [partyBalances, setPartyBalances] = useState<PartyBalance[]>([]);
  const [siteProfits, setSiteProfits] = useState<SiteProfit[]>([]);

  // Enhanced revenue data
  const revenueData = [
    { month: "Jan", revenue: 245000, expenses: 82000, profit: 163000 },
    { month: "Feb", revenue: 318000, expenses: 95000, profit: 223000 },
    { month: "Mar", revenue: 422000, expenses: 112000, profit: 310000 },
    { month: "Apr", revenue: 389000, expenses: 98000, profit: 291000 },
    { month: "May", revenue: 515000, expenses: 125000, profit: 390000 },
    { month: "Jun", revenue: 628000, expenses: 145000, profit: 483000 },
  ];

  const expenseByCategory = [
    { name: "Equipment", value: 185000 },
    { name: "Cleaning Supplies", value: 75000 },
    { name: "Infrastructure", value: 320000 },
    { name: "Waste Management", value: 45000 },
    { name: "STP Maintenance", value: 68000 },
    { name: "Salaries", value: 420000 },
    { name: "Utilities", value: 85000 },
  ];

  const serviceRevenueData = [
    { service: "Housekeeping", revenue: 450000 },
    { service: "Security", revenue: 320000 },
    { service: "Parking", revenue: 280000 },
    { service: "Waste Management", revenue: 190000 },
    { service: "STP Cleaning", revenue: 310000 },
    { service: "Consumables", revenue: 220000 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Initialize Ledger from existing data
  useEffect(() => {
    initializeLedger();
    calculateSiteProfits();
  }, [invoices, payments, expenses]);

  const initializeLedger = () => {
    const entries: LedgerEntry[] = [];
    const balances: { [key: string]: PartyBalance } = {};

    // Process invoices
    invoices.forEach(invoice => {
      const entry: LedgerEntry = {
        id: `LED-${invoice.id}`,
        party: invoice.site || "Unknown Site",
        type: "invoice",
        reference: invoice.id,
        date: invoice.date,
        debit: invoice.amount,
        credit: 0,
        balance: 0,
        description: `${invoice.serviceType} - ${invoice.client}`,
        status: invoice.status,
        site: invoice.site,
        serviceType: invoice.serviceType
      };
      entries.push(entry);

      // Initialize party balance if not exists
      if (!balances[invoice.site || "Unknown Site"]) {
        balances[invoice.site || "Unknown Site"] = {
          party: invoice.site || "Unknown Site",
          totalDebit: 0,
          totalCredit: 0,
          currentBalance: 0,
          lastTransaction: invoice.date,
          status: "debit",
          site: invoice.site
        };
      }

      balances[invoice.site || "Unknown Site"].totalDebit += invoice.amount;
      balances[invoice.site || "Unknown Site"].lastTransaction = invoice.date;
    });

    // Process payments
    payments.forEach(payment => {
      if (payment.status === "completed") {
        const invoice = invoices.find(inv => inv.id === payment.invoiceId);
        const site = invoice?.site || "Unknown Site";
        
        const entry: LedgerEntry = {
          id: `LED-${payment.id}`,
          party: site,
          type: "payment",
          reference: payment.id,
          date: payment.date,
          debit: 0,
          credit: payment.amount,
          balance: 0,
          description: `Payment from ${payment.client}`,
          status: payment.status,
          site: site
        };
        entries.push(entry);

        if (!balances[site]) {
          balances[site] = {
            party: site,
            totalDebit: 0,
            totalCredit: 0,
            currentBalance: 0,
            lastTransaction: payment.date,
            status: "credit",
            site: site
          };
        }

        balances[site].totalCredit += payment.amount;
        balances[site].lastTransaction = payment.date;
      }
    });

    // Process expenses (using site as party)
    expenses.forEach(expense => {
      const entry: LedgerEntry = {
        id: `LED-${expense.id}`,
        party: expense.site || "Unknown Site",
        type: "expense",
        reference: expense.id,
        date: expense.date,
        debit: 0,
        credit: expense.amount,
        balance: 0,
        description: `${expense.description} - ${expense.vendor}`,
        status: expense.status,
        site: expense.site
      };
      entries.push(entry);

      if (!balances[expense.site || "Unknown Site"]) {
        balances[expense.site || "Unknown Site"] = {
          party: expense.site || "Unknown Site",
          totalDebit: 0,
          totalCredit: 0,
          currentBalance: 0,
          lastTransaction: expense.date,
          status: "credit",
          site: expense.site
        };
      }

      balances[expense.site || "Unknown Site"].totalCredit += expense.amount;
      balances[expense.site || "Unknown Site"].lastTransaction = expense.date;
    });

    // Calculate running balances and final party balances
    const sortedEntries = entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const partyRunningBalances: { [key: string]: number } = {};

    sortedEntries.forEach(entry => {
      if (!partyRunningBalances[entry.party]) {
        partyRunningBalances[entry.party] = 0;
      }
      
      partyRunningBalances[entry.party] += entry.debit - entry.credit;
      entry.balance = partyRunningBalances[entry.party];
    });

    // Update party balances with calculated values
    Object.keys(balances).forEach(party => {
      balances[party].currentBalance = partyRunningBalances[party] || 0;
      balances[party].status = 
        balances[party].currentBalance > 0 ? "debit" : 
        balances[party].currentBalance < 0 ? "credit" : "settled";
    });

    setLedgerEntries(sortedEntries);
    setPartyBalances(Object.values(balances));
  };

  const calculateSiteProfits = () => {
    const profits: SiteProfit[] = sites.map(site => {
      const siteInvoices = invoices.filter(inv => inv.site === site && inv.status === "paid");
      const siteExpenses = expenses.filter(exp => exp.site === site && exp.status === "approved");
      
      const revenue = siteInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      const expensesTotal = siteExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const netProfit = revenue - expensesTotal;
      const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
      
      return {
        site,
        revenue,
        expenses: expensesTotal,
        netProfit,
        profitMargin
      };
    });
    
    setSiteProfits(profits);
  };

  // Enhanced functions
  const handleCreateInvoice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const items: InvoiceItem[] = [];
    const itemCount = 3; // Fixed 3 items for simplicity
    
    for (let i = 0; i < itemCount; i++) {
      const description = formData.get(`item-${i}-description`) as string;
      const quantity = parseInt(formData.get(`item-${i}-quantity`) as string) || 0;
      const rate = parseInt(formData.get(`item-${i}-rate`) as string) || 0;
      
      if (description && quantity && rate) {
        items.push({
          description,
          quantity,
          rate,
          amount: quantity * rate
        });
      }
    }

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * 0.18; // 18% GST
    const discount = parseInt(formData.get("discount") as string) || 0;
    const totalAmount = subtotal + tax - discount;

    const newInvoice: Invoice = {
      id: `INV-${(invoices.length + 1).toString().padStart(3, '0')}`,
      client: formData.get("client") as string,
      clientEmail: formData.get("clientEmail") as string,
      amount: totalAmount,
      status: "pending",
      date: new Date().toISOString().split('T')[0],
      dueDate: formData.get("dueDate") as string,
      items,
      tax,
      discount,
      serviceType: formData.get("serviceType") as string,
      site: formData.get("site") as string,
    };
    
    setInvoices(prev => [newInvoice, ...prev]);
    toast.success("Invoice created successfully!");
    setInvoiceDialogOpen(false);
  };

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const amount = parseInt(formData.get("amount") as string);
    const gst = amount * 0.18; // 18% GST on expenses
    const expenseType = formData.get("expenseType") as "operational" | "office" | "other";
    
    const newExpense: Expense = {
      id: `EXP-${(expenses.length + 1).toString().padStart(3, '0')}`,
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      amount: amount + gst, // Total amount including GST
      date: formData.get("date") as string,
      status: "pending",
      vendor: formData.get("vendor") as string,
      paymentMethod: formData.get("paymentMethod") as string,
      gst: gst,
      site: formData.get("site") as string,
      expenseType: expenseType
    };
    
    setExpenses(prev => [newExpense, ...prev]);
    toast.success("Expense added successfully!");
    setExpenseDialogOpen(false);
  };

  const handleEditExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedExpense) return;
    
    const formData = new FormData(e.currentTarget);
    const amount = parseInt(formData.get("amount") as string);
    const gst = amount * 0.18; // 18% GST on expenses
    const expenseType = formData.get("expenseType") as "operational" | "office" | "other";
    
    const updatedExpense: Expense = {
      ...selectedExpense,
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      amount: amount + gst,
      date: formData.get("date") as string,
      vendor: formData.get("vendor") as string,
      paymentMethod: formData.get("paymentMethod") as string,
      gst: gst,
      site: formData.get("site") as string,
      expenseType: expenseType
    };
    
    setExpenses(prev => prev.map(exp => 
      exp.id === selectedExpense.id ? updatedExpense : exp
    ));
    
    toast.success("Expense updated successfully!");
    setExpenseEditDialogOpen(false);
    setSelectedExpense(null);
  };

  const handleViewExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setExpenseViewDialogOpen(true);
  };

  const handleEditExpenseClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setExpenseEditDialogOpen(true);
  };

  const handleMarkAsPaid = (invoiceId: string) => {
    setInvoices(prev => prev.map(inv => 
      inv.id === invoiceId ? { ...inv, status: "paid" } : inv
    ));
    
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      const newPayment: Payment = {
        id: `PAY-${(payments.length + 1).toString().padStart(3, '0')}`,
        invoiceId,
        client: invoice.client,
        amount: invoice.amount,
        date: new Date().toISOString().split('T')[0],
        method: "Manual",
        status: "completed"
      };
      setPayments(prev => [newPayment, ...prev]);
    }
    
    toast.success("Invoice marked as paid!");
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    const invoiceContent = `
      INVOICE: ${invoice.id}
      Client: ${invoice.client}
      Email: ${invoice.clientEmail}
      Date: ${invoice.date}
      Due Date: ${invoice.dueDate}
      Status: ${invoice.status}
      Service Type: ${invoice.serviceType}
      Site: ${invoice.site}
      
      Items:
      ${invoice.items.map(item => `
        ${item.description} - Qty: ${item.quantity} - Rate: ₹${item.rate} - Amount: ₹${item.amount}
      `).join('')}
      
      Subtotal: ₹${invoice.items.reduce((sum, item) => sum + item.amount, 0)}
      GST (18%): ₹${invoice.tax}
      Discount: ₹${invoice.discount}
      Total: ₹${invoice.amount}
    `;
    
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoice.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Invoice ${invoice.id} downloaded!`);
  };

  // Active Export Functionality
  const handleExportData = (type: string) => {
    let data: any[] = [];
    let filename = "";
    let headers: string[] = [];
    let csvContent = "";

    switch (type) {
      case "payments":
        data = payments;
        filename = "payments-export.csv";
        headers = ["ID", "Invoice ID", "Client", "Amount", "Date", "Method", "Status"];
        csvContent = [
          headers.join(","),
          ...data.map(payment => [
            payment.id,
            payment.invoiceId,
            `"${payment.client}"`,
            payment.amount,
            payment.date,
            payment.method,
            payment.status
          ].join(","))
        ].join("\n");
        break;
      
      case "invoices":
        data = invoices;
        filename = "invoices-export.csv";
        headers = ["ID", "Client", "Client Email", "Amount", "Status", "Date", "Due Date", "Service Type", "Site", "Payment Method"];
        csvContent = [
          headers.join(","),
          ...data.map(invoice => [
            invoice.id,
            `"${invoice.client}"`,
            invoice.clientEmail,
            invoice.amount,
            invoice.status,
            invoice.date,
            invoice.dueDate,
            invoice.serviceType || "",
            invoice.site || "",
            invoice.paymentMethod || ""
          ].join(","))
        ].join("\n");
        break;
      
      case "expenses":
        data = expenses;
        filename = "expenses-export.csv";
        headers = ["ID", "Category", "Description", "Amount", "Date", "Status", "Vendor", "Payment Method", "GST", "Site", "Expense Type"];
        csvContent = [
          headers.join(","),
          ...data.map(expense => [
            expense.id,
            expense.category,
            `"${expense.description}"`,
            expense.amount,
            expense.date,
            expense.status,
            `"${expense.vendor}"`,
            expense.paymentMethod,
            expense.gst || 0,
            expense.site || "",
            expense.expenseType
          ].join(","))
        ].join("\n");
        break;
      
      case "ledger":
        data = getFilteredLedgerEntries();
        filename = "ledger-export.csv";
        headers = ["ID", "Party", "Type", "Reference", "Date", "Description", "Debit", "Credit", "Balance", "Status", "Site", "Service Type"];
        csvContent = [
          headers.join(","),
          ...data.map(entry => [
            entry.id,
            `"${entry.party}"`,
            entry.type,
            entry.reference,
            entry.date,
            `"${entry.description}"`,
            entry.debit,
            entry.credit,
            entry.balance,
            entry.status,
            entry.site || "",
            entry.serviceType || ""
          ].join(","))
        ].join("\n");
        break;
      
      case "balances":
        data = partyBalances;
        filename = "party-balances-export.csv";
        headers = ["Party", "Total Debit", "Total Credit", "Current Balance", "Status", "Last Transaction", "Site"];
        csvContent = [
          headers.join(","),
          ...data.map(balance => [
            `"${balance.party}"`,
            balance.totalDebit,
            balance.totalCredit,
            balance.currentBalance,
            balance.status,
            balance.lastTransaction,
            balance.site || ""
          ].join(","))
        ].join("\n");
        break;

      case "site-profits":
        data = siteProfits;
        filename = "site-profits-export.csv";
        headers = ["Site", "Revenue", "Expenses", "Net Profit", "Profit Margin %"];
        csvContent = [
          headers.join(","),
          ...data.map(profit => [
            `"${profit.site}"`,
            profit.revenue,
            profit.expenses,
            profit.netProfit,
            profit.profitMargin.toFixed(2)
          ].join(","))
        ].join("\n");
        break;
    }

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} data exported successfully!`);
  };

  const handleViewPartyLedger = (party: string) => {
    setSelectedParty(party);
    setLedgerDialogOpen(true);
  };

  const getFilteredLedgerEntries = () => {
    let filtered = ledgerEntries;

    if (dateFilter.startDate) {
      filtered = filtered.filter(entry => entry.date >= dateFilter.startDate);
    }

    if (dateFilter.endDate) {
      filtered = filtered.filter(entry => entry.date <= dateFilter.endDate);
    }

    if (selectedParty) {
      filtered = filtered.filter(entry => entry.party === selectedParty);
    }

    if (ledgerSearchTerm) {
      filtered = filtered.filter(entry => 
        entry.party.toLowerCase().includes(ledgerSearchTerm.toLowerCase()) ||
        entry.reference.toLowerCase().includes(ledgerSearchTerm.toLowerCase()) ||
        entry.type.toLowerCase().includes(ledgerSearchTerm.toLowerCase()) ||
        entry.description.toLowerCase().includes(ledgerSearchTerm.toLowerCase()) ||
        entry.status.toLowerCase().includes(ledgerSearchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getPartyLedgerEntries = (party: string) => {
    return ledgerEntries
      .filter(entry => entry.party === party)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // New Functions for Enhanced Features
  const getFilteredExpenses = () => {
    let filtered = expenses;

    if (expenseTypeFilter !== "all") {
      filtered = filtered.filter(expense => expense.expenseType === expenseTypeFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(expense => 
        expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.site?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getSiteWiseExpenses = () => {
    const siteExpenses: { [key: string]: { operational: number, office: number, other: number, total: number } } = {};
    
    sites.forEach(site => {
      siteExpenses[site] = {
        operational: expenses
          .filter(exp => exp.site === site && exp.expenseType === "operational" && exp.status === "approved")
          .reduce((sum, exp) => sum + exp.amount, 0),
        office: expenses
          .filter(exp => exp.site === site && exp.expenseType === "office" && exp.status === "approved")
          .reduce((sum, exp) => sum + exp.amount, 0),
        other: expenses
          .filter(exp => exp.site === site && exp.expenseType === "other" && exp.status === "approved")
          .reduce((sum, exp) => sum + exp.amount, 0),
        total: expenses
          .filter(exp => exp.site === site && exp.status === "approved")
          .reduce((sum, exp) => sum + exp.amount, 0)
      };
    });
    
    return siteExpenses;
  };

  const getPendingBills = () => {
    return invoices.filter(invoice => 
      invoice.status === "pending" || invoice.status === "overdue"
    );
  };

  const getWeeklyMonthlyExpenses = (period: "weekly" | "monthly") => {
    const now = new Date();
    let startDate: Date;
    
    if (period === "weekly") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= now;
    });
  };

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": case "completed": case "approved": return "default";
      case "pending": return "secondary";
      case "overdue": case "failed": case "rejected": return "destructive";
      default: return "outline";
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-green-600";
    if (balance < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getBalanceBadgeVariant = (status: string) => {
    switch (status) {
      case "debit": return "default";
      case "credit": return "destructive";
      case "settled": return "secondary";
      default: return "outline";
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case "Housekeeping Management": return <Home className="h-4 w-4" />;
      case "Security Management": return <Shield className="h-4 w-4" />;
      case "Parking Management": return <Car className="h-4 w-4" />;
      case "Waste Management": return <Trash2 className="h-4 w-4" />;
      case "STP Tank Cleaning": return <Droplets className="h-4 w-4" />;
      case "Consumables Supply": return <Package className="h-4 w-4" />;
      default: return <Building className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "invoice": return <FileText className="h-4 w-4 text-blue-600" />;
      case "payment": return <DollarSign className="h-4 w-4 text-green-600" />;
      case "expense": return <Receipt className="h-4 w-4 text-red-600" />;
      case "credit_note": return <CreditCard className="h-4 w-4 text-purple-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getExpenseTypeColor = (type: string) => {
    switch (type) {
      case "operational": return "bg-blue-100 text-blue-800 border-blue-200";
      case "office": return "bg-green-100 text-green-800 border-green-200";
      case "other": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter and Pagination functions
  const getFilteredInvoices = () => {
    return invoices.filter(invoice => 
      invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.site?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.serviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getPaginatedData = (data: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getPaginatedLedgerData = (data: any[]) => {
    const startIndex = (ledgerCurrentPage - 1) * ledgerItemsPerPage;
    const endIndex = startIndex + ledgerItemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const totalPages = (data: any[]) => Math.ceil(data.length / itemsPerPage);
  const totalLedgerPages = (data: any[]) => Math.ceil(data.length / ledgerItemsPerPage);

  // Calculations
  const totalRevenue = invoices
    .filter(i => i.status === "paid")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingAmount = invoices
    .filter(i => i.status === "pending")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const overdueAmount = invoices
    .filter(i => i.status === "overdue")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalExpenses = expenses
    .filter(e => e.status === "approved")
    .reduce((sum, exp) => sum + exp.amount, 0);

  const netProfit = totalRevenue - totalExpenses;

  const filteredLedgerEntries = getFilteredLedgerEntries();
  const filteredInvoices = getFilteredInvoices();
  const filteredExpenses = getFilteredExpenses();
  const paginatedInvoices = getPaginatedData(filteredInvoices);
  const paginatedExpenses = getPaginatedData(filteredExpenses);
  const paginatedLedgerEntries = getPaginatedLedgerData(filteredLedgerEntries);
  const pendingBills = getPendingBills();
  const siteWiseExpenses = getSiteWiseExpenses();
  const periodExpenses = getWeeklyMonthlyExpenses(reportPeriod);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Billing & Finance" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 space-y-6"
      >
        {/* Enhanced Stats Cards with Pending Bills Alert */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">From {invoices.filter(i => i.status === "paid").length} paid invoices</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Pending Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingAmount)}</div>
              <p className="text-xs text-muted-foreground">{invoices.filter(i => i.status === "pending").length} pending invoices</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Overdue Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(overdueAmount)}</div>
              <p className="text-xs text-muted-foreground">{invoices.filter(i => i.status === "overdue").length} overdue invoices</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netProfit)}
              </div>
              <p className="text-xs text-muted-foreground">Revenue - Expenses</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Bills Flash Section */}
        {pendingBills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Pending Bills Alert</h3>
                  <p className="text-yellow-700 text-sm">
                    You have {pendingBills.length} pending bills totaling {formatCurrency(pendingAmount + overdueAmount)}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveTab("invoices")}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                View All
              </Button>
            </div>
          </motion.div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="payments">Payment Summary</TabsTrigger>
            <TabsTrigger value="ledger">Ledger & Balance</TabsTrigger>
            <TabsTrigger value="analytics">Revenue Analytics</TabsTrigger>
          </TabsList>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-4">
                  <CardTitle>Invoice Management</CardTitle>
                  <div className="flex border rounded-lg">
                    <Button
                      variant={viewMode === "table" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("table")}
                      className="h-8 px-3"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "card" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("card")}
                      className="h-8 px-3"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search invoices..."
                      className="pl-8 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
                    <DialogTrigger asChild>
                      <Button><Plus className="mr-2 h-4 w-4" />Create Invoice</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Invoice</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateInvoice} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="client">Client Name</Label>
                            <Select name="client" required>
                              <SelectTrigger>
                                <SelectValue placeholder="Select client" />
                              </SelectTrigger>
                              <SelectContent>
                                {clients.map(client => (
                                  <SelectItem key={client} value={client}>{client}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="clientEmail">Client Email</Label>
                            <Input id="clientEmail" name="clientEmail" type="email" required />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="serviceType">Service Type</Label>
                            <Select name="serviceType" required>
                              <SelectTrigger>
                                <SelectValue placeholder="Select service" />
                              </SelectTrigger>
                              <SelectContent>
                                {serviceTypes.map(service => (
                                  <SelectItem key={service} value={service}>{service}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="site">Site</Label>
                            <Select name="site" required>
                              <SelectTrigger>
                                <SelectValue placeholder="Select site" />
                              </SelectTrigger>
                              <SelectContent>
                                {sites.map(site => (
                                  <SelectItem key={site} value={site}>{site}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="dueDate">Due Date</Label>
                            <Input id="dueDate" name="dueDate" type="date" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="discount">Discount (₹)</Label>
                            <Input id="discount" name="discount" type="number" defaultValue="0" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Invoice Items</Label>
                          <div className="space-y-2">
                            {[0, 1, 2].map(index => (
                              <div key={index} className="grid grid-cols-12 gap-2">
                                <Input 
                                  name={`item-${index}-description`} 
                                  placeholder="Description" 
                                  className="col-span-5" 
                                  defaultValue={index === 0 ? "Service Description" : ""}
                                />
                                <Input 
                                  name={`item-${index}-quantity`} 
                                  type="number" 
                                  placeholder="Qty" 
                                  className="col-span-2" 
                                  defaultValue={index === 0 ? "1" : ""}
                                />
                                <Input 
                                  name={`item-${index}-rate`} 
                                  type="number" 
                                  placeholder="Rate" 
                                  className="col-span-3" 
                                  defaultValue={index === 0 ? "10000" : ""}
                                />
                                <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                                  ₹{(10 * 10000).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button type="submit" className="w-full">Create Invoice</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Filter Info */}
                {searchTerm && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">
                      Showing {filteredInvoices.length} of {invoices.length} invoices matching "{searchTerm}"
                    </p>
                  </div>
                )}

                {viewMode === "table" ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice ID</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Service Type</TableHead>
                          <TableHead>Site</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedInvoices.map((invoice) => (
                          <TableRow key={invoice.id} className={
                            invoice.status === "overdue" ? "bg-red-50 hover:bg-red-100" :
                            invoice.status === "pending" ? "bg-yellow-50 hover:bg-yellow-100" : ""
                          }>
                            <TableCell className="font-medium">{invoice.id}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{invoice.client}</div>
                                <div className="text-sm text-muted-foreground">{invoice.clientEmail}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getServiceIcon(invoice.serviceType || "")}
                                {invoice.serviceType}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {invoice.site}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold">{formatCurrency(invoice.amount)}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(invoice.status)}>
                                {invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{invoice.date}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {invoice.dueDate}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setPreviewDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDownloadInvoice(invoice)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                {invoice.status !== "paid" && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleMarkAsPaid(invoice.id)}
                                  >
                                    <DollarSign className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination for Table View */}
                    {filteredInvoices.length > 0 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} invoices
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm">
                            Page {currentPage} of {totalPages(filteredInvoices)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages(filteredInvoices)))}
                            disabled={currentPage === totalPages(filteredInvoices)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {paginatedInvoices.map((invoice) => (
                        <Card key={invoice.id} className={`hover:shadow-md transition-shadow ${
                          invoice.status === "overdue" ? "border-red-200 bg-red-50" :
                          invoice.status === "pending" ? "border-yellow-200 bg-yellow-50" : ""
                        }`}>
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-base">{invoice.id}</CardTitle>
                                <p className="text-sm text-muted-foreground">{invoice.client}</p>
                              </div>
                              <Badge variant={getStatusColor(invoice.status)}>
                                {invoice.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                              {getServiceIcon(invoice.serviceType || "")}
                              <span>{invoice.serviceType}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Site: {invoice.site}
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-sm">
                                <div>Date: {invoice.date}</div>
                                <div>Due: {invoice.dueDate}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-lg">{formatCurrency(invoice.amount)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {invoice.items.length} items
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setSelectedInvoice(invoice);
                                  setPreviewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="flex-1"
                                onClick={() => handleDownloadInvoice(invoice)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {invoice.status !== "paid" && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleMarkAsPaid(invoice.id)}
                                >
                                  <DollarSign className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Pagination for Card View */}
                    {filteredInvoices.length > 0 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} invoices
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm">
                            Page {currentPage} of {totalPages(filteredInvoices)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages(filteredInvoices)))}
                            disabled={currentPage === totalPages(filteredInvoices)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {filteredInvoices.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No invoices found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first invoice"}
                    </p>
                    {!searchTerm && (
                      <Button className="mt-4" onClick={() => setInvoiceDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Invoice
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Expenses Tab with Type Filter */}
          <TabsContent value="expenses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-4">
                  <CardTitle>Expense Management</CardTitle>
                  <div className="flex border rounded-lg">
                    <Button
                      variant={viewMode === "table" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("table")}
                      className="h-8 px-3"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "card" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("card")}
                      className="h-8 px-3"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search expenses..."
                      className="pl-8 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
                    <DialogTrigger asChild>
                      <Button><Plus className="mr-2 h-4 w-4" />Add Expense</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Expense</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddExpense} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="expenseType">Expense Type</Label>
                          <Select name="expenseType" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select expense type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="operational">Operational Expenses</SelectItem>
                              <SelectItem value="office">Office Expenses</SelectItem>
                              <SelectItem value="other">Other Expenses</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Select name="category" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {expenseCategories.map(category => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea id="description" name="description" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="amount">Amount (₹)</Label>
                            <Input id="amount" name="amount" type="number" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input id="date" name="date" type="date" required />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="vendor">Vendor</Label>
                            <Input id="vendor" name="vendor" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="site">Site</Label>
                            <Select name="site" required>
                              <SelectTrigger>
                                <SelectValue placeholder="Select site" />
                              </SelectTrigger>
                              <SelectContent>
                                {sites.map(site => (
                                  <SelectItem key={site} value={site}>{site}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paymentMethod">Payment Method</Label>
                          <Select name="paymentMethod" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                              <SelectItem value="Credit Card">Credit Card</SelectItem>
                              <SelectItem value="UPI">UPI</SelectItem>
                              <SelectItem value="Cash">Cash</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full">Add Expense</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {/* Expense Type Filter */}
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={expenseTypeFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setExpenseTypeFilter("all")}
                  >
                    All Expenses
                  </Button>
                  <Button
                    variant={expenseTypeFilter === "operational" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setExpenseTypeFilter("operational")}
                  >
                    Operational
                  </Button>
                  <Button
                    variant={expenseTypeFilter === "office" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setExpenseTypeFilter("office")}
                  >
                    Office
                  </Button>
                  <Button
                    variant={expenseTypeFilter === "other" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setExpenseTypeFilter("other")}
                  >
                    Other
                  </Button>
                </div>

                {/* Site-wise Expense Report */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Site-wise Expense Report ({reportPeriod === "weekly" ? "Weekly" : "Monthly"})</h3>
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant={reportPeriod === "weekly" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setReportPeriod("weekly")}
                    >
                      Weekly
                    </Button>
                    <Button
                      variant={reportPeriod === "monthly" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setReportPeriod("monthly")}
                    >
                      Monthly
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sites.map(site => (
                      <Card key={site}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">{site}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Operational:</span>
                            <span className="font-medium">{formatCurrency(siteWiseExpenses[site]?.operational || 0)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Office:</span>
                            <span className="font-medium">{formatCurrency(siteWiseExpenses[site]?.office || 0)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Other:</span>
                            <span className="font-medium">{formatCurrency(siteWiseExpenses[site]?.other || 0)}</span>
                          </div>
                          <div className="flex justify-between text-sm border-t pt-2 font-semibold">
                            <span>Total:</span>
                            <span>{formatCurrency(siteWiseExpenses[site]?.total || 0)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Search and Filter Info */}
                {searchTerm && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">
                      Showing {filteredExpenses.length} of {expenses.length} expenses matching "{searchTerm}"
                    </p>
                  </div>
                )}

                {viewMode === "table" ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Expense ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Site</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedExpenses.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell className="font-medium">{expense.id}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getExpenseTypeColor(expense.expenseType)}>
                                {expense.expenseType}
                              </Badge>
                            </TableCell>
                            <TableCell>{expense.category}</TableCell>
                            <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {expense.site}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold">{formatCurrency(expense.amount)}</TableCell>
                            <TableCell>{expense.date}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(expense.status)}>
                                {expense.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewExpense(expense)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditExpenseClick(expense)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination for Table View */}
                    {filteredExpenses.length > 0 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredExpenses.length)} of {filteredExpenses.length} expenses
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm">
                            Page {currentPage} of {totalPages(filteredExpenses)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages(filteredExpenses)))}
                            disabled={currentPage === totalPages(filteredExpenses)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {paginatedExpenses.map((expense) => (
                        <Card key={expense.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-base">{expense.id}</CardTitle>
                                <p className="text-sm text-muted-foreground">{expense.vendor}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge variant={getStatusColor(expense.status)}>
                                  {expense.status}
                                </Badge>
                                <Badge variant="outline" className={getExpenseTypeColor(expense.expenseType)}>
                                  {expense.expenseType}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              <div className="font-medium">{expense.category}</div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {expense.description}
                              </p>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Site: {expense.site}
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-sm">
                                <div>Date: {expense.date}</div>
                                <div>Method: {expense.paymentMethod}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-lg">{formatCurrency(expense.amount)}</div>
                                <div className="text-xs text-muted-foreground">
                                  GST: {formatCurrency(expense.gst || 0)}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="flex-1"
                                onClick={() => handleViewExpense(expense)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="flex-1"
                                onClick={() => handleEditExpenseClick(expense)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Pagination for Card View */}
                    {filteredExpenses.length > 0 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredExpenses.length)} of {filteredExpenses.length} expenses
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm">
                            Page {currentPage} of {totalPages(filteredExpenses)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages(filteredExpenses)))}
                            disabled={currentPage === totalPages(filteredExpenses)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {filteredExpenses.length === 0 && (
                  <div className="text-center py-8">
                    <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No expenses found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first expense"}
                    </p>
                    {!searchTerm && (
                      <Button className="mt-4" onClick={() => setExpenseDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Expense
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Payment Summary Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Payment Summary</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleExportData("payments")}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Payments
                  </Button>
                  <Button variant="outline" onClick={() => handleExportData("invoices")}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export Invoices
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Paid Invoices</p>
                          <p className="text-2xl font-bold">
                            {invoices.filter(i => i.status === "paid").length}
                          </p>
                          <p className="text-sm text-primary font-semibold">
                            {formatCurrency(totalRevenue)}
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Pending</p>
                          <p className="text-2xl font-bold">
                            {invoices.filter(i => i.status === "pending").length}
                          </p>
                          <p className="text-sm text-secondary font-semibold">
                            {formatCurrency(pendingAmount)}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-secondary" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Overdue</p>
                          <p className="text-2xl font-bold text-destructive">
                            {invoices.filter(i => i.status === "overdue").length}
                          </p>
                          <p className="text-sm text-destructive font-semibold">
                            {formatCurrency(overdueAmount)}
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-destructive" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Expenses</p>
                          <p className="text-2xl font-bold">
                            {expenses.length}
                          </p>
                          <p className="text-sm text-destructive font-semibold">
                            {formatCurrency(totalExpenses)}
                          </p>
                        </div>
                        <Receipt className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Recent Payments</h3>
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{payment.client}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.date} • {payment.method}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                          <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold">Payment Methods</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Bank Transfer</span>
                        <span className="font-semibold">60%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">UPI</span>
                        <span className="font-semibold">25%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Credit Card</span>
                        <span className="font-semibold">10%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Other</span>
                        <span className="font-semibold">5%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Ledger & Balance Tab */}
          <TabsContent value="ledger">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-4">
                  <CardTitle>Ledger & Site Balances</CardTitle>
                  <div className="flex border rounded-lg">
                    <Button
                      variant={ledgerViewMode === "table" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setLedgerViewMode("table")}
                      className="h-8 px-3"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={ledgerViewMode === "card" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setLedgerViewMode("card")}
                      className="h-8 px-3"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search ledger entries..."
                      className="pl-8 w-64"
                      value={ledgerSearchTerm}
                      onChange={(e) => setLedgerSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleExportData("ledger")}>
                      <FileDown className="mr-2 h-4 w-4" />
                      Export Ledger
                    </Button>
                    <Button variant="outline" onClick={() => handleExportData("balances")}>
                      <Users className="mr-2 h-4 w-4" />
                      Export Balances
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date Filter */}
                <div className="flex gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">From Date</Label>
                    <Input 
                      id="startDate" 
                      type="date" 
                      value={dateFilter.startDate}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">To Date</Label>
                    <Input 
                      id="endDate" 
                      type="date" 
                      value={dateFilter.endDate}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setDateFilter({ startDate: "", endDate: "" })}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Clear Filter
                  </Button>
                </div>

                {/* Site Balances Summary */}
                <div>
                  <h3 className="font-semibold mb-4">Site Balances Summary</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {partyBalances.map((party) => (
                      <Card key={party.party} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="pt-6" onClick={() => handleViewPartyLedger(party.party)}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium truncate">{party.party}</div>
                            <Badge variant={getBalanceBadgeVariant(party.status)}>
                              {party.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className={`text-2xl font-bold ${getBalanceColor(party.currentBalance)}`}>
                            {formatCurrency(Math.abs(party.currentBalance))}
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground mt-2">
                            <span>Debit: {formatCurrency(party.totalDebit)}</span>
                            <span>Credit: {formatCurrency(party.totalCredit)}</span>
                          </div>
                          {party.site && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Site: {party.site}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            Last: {party.lastTransaction}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Ledger Entries */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Ledger Entries</h3>
                    <div className="text-sm text-muted-foreground">
                      Showing {filteredLedgerEntries.length} entries
                    </div>
                  </div>

                  {/* Search and Filter Info */}
                  {(ledgerSearchTerm || dateFilter.startDate || dateFilter.endDate) && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm">
                        Showing {filteredLedgerEntries.length} of {ledgerEntries.length} ledger entries
                        {ledgerSearchTerm && ` matching "${ledgerSearchTerm}"`}
                        {(dateFilter.startDate || dateFilter.endDate) && ` within selected date range`}
                      </p>
                    </div>
                  )}

                  {ledgerViewMode === "table" ? (
                    <>
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Site</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Reference</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Debit (₹)</TableHead>
                              <TableHead className="text-right">Credit (₹)</TableHead>
                              <TableHead className="text-right">Balance (₹)</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedLedgerEntries.map((entry) => (
                              <TableRow key={entry.id}>
                                <TableCell className="whitespace-nowrap">{entry.date}</TableCell>
                                <TableCell>
                                  <div 
                                    className="font-medium cursor-pointer hover:text-primary hover:underline"
                                    onClick={() => handleViewPartyLedger(entry.party)}
                                  >
                                    {entry.party}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getTypeIcon(entry.type)}
                                    <Badge variant="outline" className="capitalize">
                                      {entry.type.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono text-sm">{entry.reference}</TableCell>
                                <TableCell className="max-w-xs">
                                  <div className="truncate" title={entry.description}>
                                    {entry.description}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                                </TableCell>
                                <TableCell className={`text-right font-bold ${getBalanceColor(entry.balance)}`}>
                                  {formatCurrency(entry.balance)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={getStatusColor(entry.status)}>
                                    {entry.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Pagination for Table View */}
                      {filteredLedgerEntries.length > 0 && (
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-muted-foreground">
                            Showing {((ledgerCurrentPage - 1) * ledgerItemsPerPage) + 1} to {Math.min(ledgerCurrentPage * ledgerItemsPerPage, filteredLedgerEntries.length)} of {filteredLedgerEntries.length} entries
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLedgerCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={ledgerCurrentPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm">
                              Page {ledgerCurrentPage} of {totalLedgerPages(filteredLedgerEntries)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLedgerCurrentPage(prev => Math.min(prev + 1, totalLedgerPages(filteredLedgerEntries)))}
                              disabled={ledgerCurrentPage === totalLedgerPages(filteredLedgerEntries)}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {paginatedLedgerEntries.map((entry) => (
                          <Card key={entry.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-base">{entry.reference}</CardTitle>
                                  <p className="text-sm text-muted-foreground">{entry.party}</p>
                                </div>
                                <Badge variant={getStatusColor(entry.status)}>
                                  {entry.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex items-center gap-2 text-sm">
                                {getTypeIcon(entry.type)}
                                <span className="capitalize">{entry.type.replace('_', ' ')}</span>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {entry.description}
                                </p>
                                <div className="text-xs text-muted-foreground">
                                  Date: {entry.date}
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                  <div className="text-sm font-medium text-muted-foreground">Debit</div>
                                  <div className="font-semibold">
                                    {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-muted-foreground">Credit</div>
                                  <div className="font-semibold">
                                    {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-muted-foreground">Balance</div>
                                  <div className={`font-semibold ${getBalanceColor(entry.balance)}`}>
                                    {formatCurrency(entry.balance)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleViewPartyLedger(entry.party)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Pagination for Card View */}
                      {filteredLedgerEntries.length > 0 && (
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-muted-foreground">
                            Showing {((ledgerCurrentPage - 1) * ledgerItemsPerPage) + 1} to {Math.min(ledgerCurrentPage * ledgerItemsPerPage, filteredLedgerEntries.length)} of {filteredLedgerEntries.length} entries
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLedgerCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={ledgerCurrentPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm">
                              Page {ledgerCurrentPage} of {totalLedgerPages(filteredLedgerEntries)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLedgerCurrentPage(prev => Math.min(prev + 1, totalLedgerPages(filteredLedgerEntries)))}
                              disabled={ledgerCurrentPage === totalLedgerPages(filteredLedgerEntries)}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {filteredLedgerEntries.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">No ledger entries found</h3>
                      <p className="text-muted-foreground">
                        {ledgerSearchTerm || dateFilter.startDate || dateFilter.endDate 
                          ? "Try adjusting your search terms or date filters" 
                          : "No ledger entries available"
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Analytics Tab with Site-wise Profit */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Financial Analytics</CardTitle>
                <Button variant="outline" onClick={() => handleExportData("site-profits")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Site Profits
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Site-wise Profit Section */}
                <div>
                  <h3 className="font-semibold mb-4">Site-wise Profit Analysis</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {siteProfits.map((profit) => (
                      <Card key={profit.site} className={
                        profit.netProfit >= 0 ? "border-green-200" : "border-red-200"
                      }>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">{profit.site}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Revenue:</span>
                            <span className="font-medium text-green-600">{formatCurrency(profit.revenue)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Expenses:</span>
                            <span className="font-medium text-red-600">{formatCurrency(profit.expenses)}</span>
                          </div>
                          <div className="flex justify-between text-sm border-t pt-2 font-semibold">
                            <span>Net Profit:</span>
                            <span className={
                              profit.netProfit >= 0 ? "text-green-600" : "text-red-600"
                            }>
                              {formatCurrency(profit.netProfit)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Profit Margin:</span>
                            <span className={
                              profit.profitMargin >= 20 ? "text-green-600" : 
                              profit.profitMargin >= 10 ? "text-yellow-600" : "text-red-600"
                            }>
                              {profit.profitMargin.toFixed(1)}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-4">Revenue vs Expenses</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`₹${value}`, "Amount"]} />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue" />
                        <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4">Service Revenue Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={serviceRevenueData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ service, percent }) => `${service} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="revenue"
                        >
                          {serviceRevenueData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`₹${value}`, "Revenue"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-4">Expense Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={expenseByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {expenseByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`₹${value}`, "Amount"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4">Profit Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`₹${value}`, "Profit"]} />
                        <Line 
                          type="monotone" 
                          dataKey="profit" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          name="Net Profit"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Enhanced Invoice Preview Dialog */}
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Invoice Preview - {selectedInvoice?.id}</DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <div className="space-y-6 border rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold">INVOICE</h2>
                    <p className="text-muted-foreground">{selectedInvoice.id}</p>
                  </div>
                  <Badge variant={getStatusColor(selectedInvoice.status)}>
                    {selectedInvoice.status.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Billed To:</p>
                    <p className="font-semibold text-lg">{selectedInvoice.client}</p>
                    <p className="text-muted-foreground">{selectedInvoice.clientEmail}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Invoice Date:</span>
                      <span className="font-medium">{selectedInvoice.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span className="font-medium">{selectedInvoice.dueDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service Type:</span>
                      <span className="font-medium">{selectedInvoice.serviceType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Site:</span>
                      <span className="font-medium">{selectedInvoice.site}</span>
                    </div>
                    {selectedInvoice.paymentMethod && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Method:</span>
                        <span className="font-medium">{selectedInvoice.paymentMethod}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Invoice Items Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Rate (₹)</TableHead>
                        <TableHead className="text-right">Amount (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between items-center border-t pt-4">
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleMarkAsPaid(selectedInvoice.id)}
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Mark as Paid
                    </Button>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="flex justify-between gap-8">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedInvoice.items.reduce((sum, item) => sum + item.amount, 0))}</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span>GST (18%):</span>
                      <span>{formatCurrency(selectedInvoice.tax)}</span>
                    </div>
                    {selectedInvoice.discount > 0 && (
                      <div className="flex justify-between gap-8">
                        <span>Discount:</span>
                        <span className="text-green-600">-{formatCurrency(selectedInvoice.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between gap-8 border-t pt-2">
                      <span className="font-bold">Total:</span>
                      <span className="text-2xl font-bold text-primary">{formatCurrency(selectedInvoice.amount)}</span>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => {
                    handleDownloadInvoice(selectedInvoice);
                    setPreviewDialogOpen(false);
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF Invoice
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Expense View Dialog */}
        <Dialog open={expenseViewDialogOpen} onOpenChange={setExpenseViewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Expense Details - {selectedExpense?.id}</DialogTitle>
            </DialogHeader>
            {selectedExpense && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><strong>Expense ID:</strong> {selectedExpense.id}</div>
                  <div><strong>Category:</strong> {selectedExpense.category}</div>
                  <div><strong>Vendor:</strong> {selectedExpense.vendor}</div>
                  <div><strong>Date:</strong> {selectedExpense.date}</div>
                  <div><strong>Payment Method:</strong> {selectedExpense.paymentMethod}</div>
                  <div><strong>Status:</strong> {selectedExpense.status}</div>
                  <div><strong>Site:</strong> {selectedExpense.site}</div>
                  <div>
                    <strong>Expense Type:</strong>
                    <Badge variant="outline" className={`ml-2 ${getExpenseTypeColor(selectedExpense.expenseType)}`}>
                      {selectedExpense.expenseType}
                    </Badge>
                  </div>
                </div>
                <div>
                  <strong>Description:</strong>
                  <p className="mt-1">{selectedExpense.description}</p>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span>Base Amount:</span>
                    <span>{formatCurrency(selectedExpense.amount - (selectedExpense.gst || 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18%):</span>
                    <span>{formatCurrency(selectedExpense.gst || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(selectedExpense.amount)}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Expense Edit Dialog */}
        <Dialog open={expenseEditDialogOpen} onOpenChange={setExpenseEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Expense - {selectedExpense?.id}</DialogTitle>
            </DialogHeader>
            {selectedExpense && (
              <form onSubmit={handleEditExpense} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-expenseType">Expense Type</Label>
                  <Select name="expenseType" defaultValue={selectedExpense.expenseType} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Operational Expenses</SelectItem>
                      <SelectItem value="office">Office Expenses</SelectItem>
                      <SelectItem value="other">Other Expenses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select name="category" defaultValue={selectedExpense.category} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea 
                    id="edit-description" 
                    name="description" 
                    defaultValue={selectedExpense.description} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-amount">Base Amount (₹)</Label>
                    <Input 
                      id="edit-amount" 
                      name="amount" 
                      type="number" 
                      defaultValue={selectedExpense.amount - (selectedExpense.gst || 0)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-date">Date</Label>
                    <Input 
                      id="edit-date" 
                      name="date" 
                      type="date" 
                      defaultValue={selectedExpense.date}
                      required 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-vendor">Vendor</Label>
                    <Input 
                      id="edit-vendor" 
                      name="vendor" 
                      defaultValue={selectedExpense.vendor}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-site">Site</Label>
                    <Select name="site" defaultValue={selectedExpense.site} required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sites.map(site => (
                          <SelectItem key={site} value={site}>{site}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-paymentMethod">Payment Method</Label>
                  <Select name="paymentMethod" defaultValue={selectedExpense.paymentMethod} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Update Expense</Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Party Ledger Dialog */}
        <Dialog open={ledgerDialogOpen} onOpenChange={setLedgerDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Ledger Statement - {selectedParty}</DialogTitle>
            </DialogHeader>
            {selectedParty && (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded-lg bg-muted/50">
                  <div>
                    <h3 className="font-semibold">{selectedParty}</h3>
                    <p className="text-sm text-muted-foreground">
                      Current Balance: 
                      <span className={`ml-2 font-bold ${getBalanceColor(
                        partyBalances.find(p => p.party === selectedParty)?.currentBalance || 0
                      )}`}>
                        {formatCurrency(partyBalances.find(p => p.party === selectedParty)?.currentBalance || 0)}
                      </span>
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const partyEntries = getPartyLedgerEntries(selectedParty);
                      const headers = ["Date", "Type", "Reference", "Description", "Debit", "Credit", "Balance", "Status"];
                      const csvContent = [
                        headers.join(","),
                        ...partyEntries.map(entry => [
                          entry.date,
                          entry.type,
                          entry.reference,
                          `"${entry.description}"`,
                          entry.debit,
                          entry.credit,
                          entry.balance,
                          entry.status
                        ].join(","))
                      ].join("\n");
                      
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.setAttribute('href', url);
                      link.setAttribute('download', `ledger-statement-${selectedParty}.csv`);
                      link.style.visibility = 'hidden';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      
                      toast.success(`Ledger statement for ${selectedParty} exported!`);
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Statement
                  </Button>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Service/Client</TableHead>
                        <TableHead className="text-right">Debit (₹)</TableHead>
                        <TableHead className="text-right">Credit (₹)</TableHead>
                        <TableHead className="text-right">Balance (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPartyLedgerEntries(selectedParty).map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="whitespace-nowrap">{entry.date}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {entry.type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{entry.reference}</TableCell>
                          <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                          <TableCell>
                            <div className="text-xs text-muted-foreground">
                              {entry.serviceType && <div>{entry.serviceType}</div>}
                              {entry.site && <div>{entry.site}</div>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                          </TableCell>
                          <TableCell className={`text-right font-bold ${getBalanceColor(entry.balance)}`}>
                            {formatCurrency(entry.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
};

export default Billing;
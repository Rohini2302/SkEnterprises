import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Receipt, 
  Download, 
  FileText,
  RefreshCw,
  Loader2,
  FileType,
  AlertCircle,
  CheckCircle,
  BarChart3,
  CreditCard,
  BanknoteIcon,
  Smartphone,
  Wallet
} from "lucide-react";
import { formatCurrency } from "../Billing";
import InvoiceService from "@/services/InvoiceService";
import { expenseService } from "@/services/expenseService";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PaymentSummaryTabProps {
  onExportData: (type: string) => void;
}

// Define interfaces for data from APIs
interface TaxInvoice {
  _id: string;
  id: string;
  invoiceNumber: string;
  voucherNo?: string;
  client: string;
  amount: number;
  status: "pending" | "paid" | "overdue";
  date: string;
  dueDate?: string;
  invoiceType: "tax";
  items: any[];
  tax: number;
  clientEmail?: string;
  site?: string;
  serviceType?: string;
  gstNumber?: string;
  panNumber?: string;
  managementFeesPercent?: number;
  managementFeesAmount?: number;
  sacCode?: string;
  serviceLocation?: string;
  servicePeriodFrom?: string;
  servicePeriodTo?: string;
  roundUp?: number;
  baseAmount?: number;
  paymentMethod?: string;
}

interface Expense {
  _id: string;
  expenseId: string;
  category: string;
  description: string;
  amount: number;
  baseAmount: number;
  gst: number;
  date: string;
  status: "pending" | "approved" | "rejected";
  vendor: string;
  paymentMethod: string;
  site: string;
  expenseType: "operational" | "office" | "other";
  notes?: string;
}

// Helper function to get icon for payment method - MOVED TO TOP LEVEL
const getPaymentMethodIcon = (method: string) => {
  const methodLower = method.toLowerCase();
  if (methodLower.includes('bank') || methodLower.includes('transfer')) return BanknoteIcon;
  if (methodLower.includes('upi') || methodLower.includes('phonepe') || methodLower.includes('google')) return Smartphone;
  if (methodLower.includes('credit') || methodLower.includes('debit') || methodLower.includes('card')) return CreditCard;
  if (methodLower.includes('cash')) return Wallet;
  return CreditCard; // default icon
};

const PaymentSummaryTab: React.FC<PaymentSummaryTabProps> = ({
  onExportData
}) => {
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState({
    invoices: true,
    expenses: true
  });
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState<'summary' | 'invoices' | 'expenses'>('summary');

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setError(null);
      setRefreshing(true);
      
      await Promise.all([
        fetchTaxInvoices(),
        fetchExpenses()
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
      toast.error("Failed to load financial data");
    } finally {
      setRefreshing(false);
    }
  };

  const fetchTaxInvoices = async () => {
    try {
      setLoading(prev => ({ ...prev, invoices: true }));
      const data = await InvoiceService.getAllInvoices();
      // Filter only tax invoices
      const taxInvoices = data.filter(invoice => invoice.invoiceType === "tax") as TaxInvoice[];
      setInvoices(taxInvoices);
    } catch (err: any) {
      console.error('Error fetching tax invoices:', err);
      setInvoices([]);
      toast.error("Failed to fetch tax invoices");
    } finally {
      setLoading(prev => ({ ...prev, invoices: false }));
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(prev => ({ ...prev, expenses: true }));
      const data = await expenseService.getExpenses();
      setExpenses(data.data || []);
    } catch (err: any) {
      console.error('Error fetching expenses:', err);
      setExpenses([]);
      toast.error("Failed to fetch expenses");
    } finally {
      setLoading(prev => ({ ...prev, expenses: false }));
    }
  };

  // Filter data - ONLY PAID invoices and ONLY APPROVED expenses
  const paidTaxInvoices = invoices.filter(i => i.status === "paid");
  const approvedExpenses = expenses.filter(e => e.status === "approved");

  // Calculate totals
  const totalTaxRevenue = paidTaxInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalTaxableValue = paidTaxInvoices.reduce((sum, inv) => sum + (inv.baseAmount || inv.amount - inv.tax - (inv.managementFeesAmount || 0)), 0);
  const totalGST = paidTaxInvoices.reduce((sum, inv) => sum + inv.tax, 0);
  const totalExpensesAmount = approvedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalExpensesGST = approvedExpenses.reduce((sum, exp) => sum + exp.gst, 0);

  // Calculate payment methods distribution from expenses and invoices
  const calculatePaymentMethods = () => {
    const methodTotals: Record<string, { count: number; amount: number }> = {};
    let totalCount = 0;
    let totalAmount = 0;

    // Count payment methods from expenses
    approvedExpenses.forEach(expense => {
      const method = expense.paymentMethod || "Unknown";
      if (!methodTotals[method]) {
        methodTotals[method] = { count: 0, amount: 0 };
      }
      methodTotals[method].count++;
      methodTotals[method].amount += expense.amount;
      totalCount++;
      totalAmount += expense.amount;
    });

    // Count payment methods from invoices (if they have paymentMethod field)
    paidTaxInvoices.forEach(invoice => {
      if (invoice.paymentMethod) {
        const method = invoice.paymentMethod;
        if (!methodTotals[method]) {
          methodTotals[method] = { count: 0, amount: 0 };
        }
        methodTotals[method].count++;
        methodTotals[method].amount += invoice.amount;
        totalCount++;
        totalAmount += invoice.amount;
      }
    });

    // Convert to array and calculate percentages
    const distribution = Object.entries(methodTotals).map(([method, data]) => {
      const percentage = totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100) : 0;
      const Icon = getPaymentMethodIcon(method);
      return {
        method,
        ...data,
        percentage,
        Icon
      };
    });

    // Sort by amount descending
    return distribution.sort((a, b) => b.amount - a.amount);
  };

  const paymentMethods = calculatePaymentMethods();

  // Calculate top payment method
  const topPaymentMethod = paymentMethods.length > 0 ? paymentMethods[0] : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Check if data is still loading
  const isLoading = loading.invoices || loading.expenses;

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
          <p className="text-muted-foreground text-center mb-4">{error}</p>
          <Button onClick={fetchAllData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && !refreshing) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
          <span>Loading financial data...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Financial Summary
        </CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchAllData}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button variant="outline" onClick={() => onExportData("tax-invoices")}>
            <FileText className="mr-2 h-4 w-4" />
            Export Invoices
          </Button>
          <Button variant="outline" onClick={() => onExportData("expenses")}>
            <Download className="mr-2 h-4 w-4" />
            Export Expenses
          </Button>
        </div>
      </CardHeader>
      
      {/* View Toggle */}
      <div className="px-6 pb-4">
        <div className="flex border rounded-lg p-1 w-fit">
          <Button
            variant={selectedView === 'summary' ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedView('summary')}
            className="flex-1"
          >
            Summary
          </Button>
          <Button
            variant={selectedView === 'invoices' ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedView('invoices')}
            className="flex-1"
          >
            Tax Invoices ({paidTaxInvoices.length})
          </Button>
          <Button
            variant={selectedView === 'expenses' ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedView('expenses')}
            className="flex-1"
          >
            Expenses ({approvedExpenses.length})
          </Button>
        </div>
      </div>

      <CardContent className="space-y-6">
        {/* UPDATED SUMMARY CARDS - 3 cards as requested */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Total Tax Invoices Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tax Invoices</p>
                  <p className="text-2xl font-bold">
                    {paidTaxInvoices.length}
                  </p>
                  <p className="text-sm text-primary font-semibold mt-1">
                    {formatCurrency(totalTaxRevenue)}
                  </p>
                  <div className="text-xs text-muted-foreground mt-2">
                    <div className="flex justify-between">
                      <span>Taxable Value:</span>
                      <span>{formatCurrency(totalTaxableValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST Collected:</span>
                      <span className="text-green-600">{formatCurrency(totalGST)}</span>
                    </div>
                  </div>
                </div>
                <FileType className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          {/* Total Expenses Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold">
                    {approvedExpenses.length}
                  </p>
                  <p className="text-sm text-destructive font-semibold mt-1">
                    {formatCurrency(totalExpensesAmount)}
                  </p>
                  <div className="text-xs text-muted-foreground mt-2">
                    <div className="flex justify-between">
                      <span>Base Amount:</span>
                      <span>{formatCurrency(totalExpensesAmount - totalExpensesGST)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST Paid:</span>
                      <span className="text-blue-600">{formatCurrency(totalExpensesGST)}</span>
                    </div>
                  </div>
                </div>
                <Receipt className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          
          {/* NEW: Payment Methods Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Payment Methods</p>
                  <p className="text-2xl font-bold">
                    {paymentMethods.length}
                  </p>
                  <p className="text-sm text-purple-600 font-semibold mt-1">
                    {topPaymentMethod ? `${topPaymentMethod.method} (${topPaymentMethod.percentage}%)` : "No Data"}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-purple-600" />
              </div>
              
              <div className="space-y-2">
                {paymentMethods.length > 0 ? (
                  paymentMethods.slice(0, 3).map((method) => {
                    const Icon = method.Icon;
                    return (
                      <div key={method.method} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{method.method}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">{method.percentage}%</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(method.amount)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-2 text-sm text-muted-foreground">
                    No payment data available
                  </div>
                )}
                
                {paymentMethods.length > 3 && (
                  <div className="text-center pt-2">
                    <p className="text-xs text-muted-foreground">
                      +{paymentMethods.length - 3} more methods
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods Distribution Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
              Payment Methods Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentMethods.length > 0 ? (
                paymentMethods.map((method) => {
                  const Icon = method.Icon;
                  return (
                    <div key={method.method} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Icon className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">{method.method}</p>
                            <p className="text-xs text-muted-foreground">
                              {method.count} transactions • {formatCurrency(method.amount)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-purple-600">{method.percentage}%</p>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${method.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No payment methods data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedView === 'summary' ? (
          <>
            {/* Recent Paid Tax Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Recent Paid Tax Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice No</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Service Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Taxable Value</TableHead>
                        <TableHead>GST</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paidTaxInvoices.length > 0 ? (
                        paidTaxInvoices.slice(0, 10).map((invoice) => (
                          <TableRow key={invoice._id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">
                              {invoice.voucherNo || invoice.invoiceNumber || invoice.id}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{invoice.client}</p>
                                {invoice.gstNumber && (
                                  <p className="text-xs text-muted-foreground font-mono">{invoice.gstNumber}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{invoice.serviceType || "-"}</TableCell>
                            <TableCell>{formatDate(invoice.date)}</TableCell>
                            <TableCell>
                              {formatCurrency(invoice.baseAmount || invoice.amount - invoice.tax - (invoice.managementFeesAmount || 0))}
                            </TableCell>
                            <TableCell>{formatCurrency(invoice.tax)}</TableCell>
                            <TableCell className="font-semibold">{formatCurrency(invoice.amount)}</TableCell>
                            <TableCell>
                              {invoice.paymentMethod ? (
                                <Badge variant="outline">{invoice.paymentMethod}</Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">Not specified</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <FileType className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No paid tax invoices found</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Recent Approved Expenses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Recent Approved Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Expense ID</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Base Amount</TableHead>
                        <TableHead>GST</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedExpenses.length > 0 ? (
                        approvedExpenses.slice(0, 10).map((expense) => (
                          <TableRow key={expense._id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{expense.expenseId}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{expense.category}</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                            <TableCell>{expense.vendor}</TableCell>
                            <TableCell>{formatDate(expense.date)}</TableCell>
                            <TableCell>{formatCurrency(expense.baseAmount)}</TableCell>
                            <TableCell>{formatCurrency(expense.gst)}</TableCell>
                            <TableCell className="font-semibold">{formatCurrency(expense.amount)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{expense.paymentMethod}</Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No approved expenses found</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Quick Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Revenue Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Revenue:</span>
                      <span className="font-semibold">{formatCurrency(totalTaxRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Invoices:</span>
                      <span className="font-medium">{paidTaxInvoices.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Invoice:</span>
                      <span className="font-medium">
                        {paidTaxInvoices.length > 0 ? formatCurrency(totalTaxRevenue / paidTaxInvoices.length) : formatCurrency(0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-medium">GST Rate:</span>
                      <span className="font-semibold text-blue-600">
                        {totalTaxableValue > 0 ? ((totalGST / totalTaxableValue) * 100).toFixed(2) : "0.00"}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-red-600" />
                    Expenses Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Expenses:</span>
                      <span className="font-semibold">{formatCurrency(totalExpensesAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Items:</span>
                      <span className="font-medium">{approvedExpenses.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Expense:</span>
                      <span className="font-medium">
                        {approvedExpenses.length > 0 ? formatCurrency(totalExpensesAmount / approvedExpenses.length) : formatCurrency(0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-medium">GST Rate:</span>
                      <span className="font-semibold text-blue-600">
                        {(totalExpensesAmount - totalExpensesGST) > 0 ? ((totalExpensesGST / (totalExpensesAmount - totalExpensesGST)) * 100).toFixed(2) : "0.00"}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : selectedView === 'invoices' ? (
          /* All Paid Tax Invoices Table View */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileType className="h-5 w-5 text-green-600" />
                All Paid Tax Invoices ({paidTaxInvoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice No</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>GSTIN</TableHead>
                      <TableHead>Taxable Value</TableHead>
                      <TableHead>GST</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidTaxInvoices.map((invoice) => (
                      <TableRow key={invoice._id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {invoice.voucherNo || invoice.invoiceNumber || invoice.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{invoice.client}</p>
                            <p className="text-xs text-muted-foreground">{invoice.clientEmail || ""}</p>
                          </div>
                        </TableCell>
                        <TableCell>{invoice.serviceType || "-"}</TableCell>
                        <TableCell>{formatDate(invoice.date)}</TableCell>
                        <TableCell className="font-mono text-xs">{invoice.gstNumber || "-"}</TableCell>
                        <TableCell>
                          {formatCurrency(invoice.baseAmount || invoice.amount - invoice.tax - (invoice.managementFeesAmount || 0))}
                        </TableCell>
                        <TableCell>{formatCurrency(invoice.tax)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>
                          {invoice.paymentMethod ? (
                            <Badge variant="outline">{invoice.paymentMethod}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {paidTaxInvoices.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <FileType className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No paid tax invoices found</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Mark tax invoices as paid to see them here
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* All Approved Expenses View */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-green-600" />
                All Approved Expenses ({approvedExpenses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Expense ID</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Base Amount</TableHead>
                      <TableHead>GST</TableHead>
                      <TableHead>Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedExpenses.map((expense) => (
                      <TableRow key={expense._id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{expense.expenseId}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{expense.category}</Badge>
                        </TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>{expense.vendor}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{expense.paymentMethod}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(expense.date)}</TableCell>
                        <TableCell>{formatCurrency(expense.baseAmount)}</TableCell>
                        <TableCell>{formatCurrency(expense.gst)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(expense.amount)}</TableCell>
                      </TableRow>
                    ))}
                    {approvedExpenses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No approved expenses found</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Approve expenses in the Expenses tab to see them here
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentSummaryTab;
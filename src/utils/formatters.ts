/**
 * Format currency in Indian Rupees (₹)
 */
export const formatCurrency = (amount: number): string => {
  if (isNaN(amount)) {
    return '₹0.00';
  }
  
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Format date to DD-MMM-YY format
 */
export const formatDate = (dateString: string | Date): string => {
  try {
    let date: Date;
    
    if (dateString instanceof Date) {
      date = dateString;
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      // If it's already in DD-MMM-YY format, return as is
      if (typeof dateString === 'string' && dateString.match(/\d{2}-[A-Za-z]{3}-\d{2}/)) {
        return dateString;
      }
      return dateString.toString();
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return typeof dateString === 'string' ? dateString : 'Invalid Date';
  }
};

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export const formatDateForInput = (dateString: string | Date): string => {
  try {
    let date: Date;
    
    if (dateString instanceof Date) {
      date = dateString;
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};

/**
 * Get status color
 */
export const getStatusColor = (status: string) => {
  const statusLower = status.toLowerCase();
  
  switch (statusLower) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'overdue':
      return 'destructive';
    default:
      return 'default';
  }
};

/**
 * Calculate due date from invoice date
 */
export const calculateDueDate = (invoiceDate: string | Date, days: number = 30): string => {
  try {
    let date: Date;
    
    if (invoiceDate instanceof Date) {
      date = new Date(invoiceDate);
    } else {
      date = new Date(invoiceDate);
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    date.setDate(date.getDate() + days);
    return formatDate(date);
  } catch (error) {
    console.error('Error calculating due date:', error);
    return 'Error';
  }
};

/**
 * Number to words converter for Indian numbering system
 */
export const convertToIndianWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  function convert_hundreds(num: number) {
    let result = '';
    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    }
    if (num >= 10) {
      result += teens[num - 10] + ' ';
      return result;
    }
    if (num > 0) {
      result += ones[num] + ' ';
    }
    return result;
  }
  
  function convert_number(num: number) {
    if (num === 0) return 'Zero';
    
    let result = '';
    const crore = Math.floor(num / 10000000);
    if (crore > 0) {
      result += convert_hundreds(crore) + 'Crore ';
      num %= 10000000;
    }
    
    const lakh = Math.floor(num / 100000);
    if (lakh > 0) {
      result += convert_hundreds(lakh) + 'Lakh ';
      num %= 100000;
    }
    
    const thousand = Math.floor(num / 1000);
    if (thousand > 0) {
      result += convert_hundreds(thousand) + 'Thousand ';
      num %= 1000;
    }
    
    const hundred = Math.floor(num / 100);
    if (hundred > 0) {
      result += convert_hundreds(hundred) + 'Hundred ';
      num %= 100;
    }
    
    if (num > 0) {
      result += convert_hundreds(num);
    }
    
    return result.trim();
  }
  
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  
  let result = convert_number(rupees) + ' Rupees';
  if (paise > 0) {
    result += ' and ' + convert_number(paise) + ' Paise';
  }
  result += ' Only';
  
  return `INR ${result.toUpperCase()}`;
};

/**
 * Generate invoice ID
 */
export const generateInvoiceId = (
  prefix: string = 'INV', 
  count: number = 0
): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const sequence = (count + 1).toString().padStart(3, '0');
  
  return `${prefix}-${year}${month}-${sequence}`;
};

export default {
  formatCurrency,
  formatDate,
  formatDateForInput,
  getStatusColor,
  calculateDueDate,
  convertToIndianWords,
  generateInvoiceId
};
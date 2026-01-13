import express, { Request, Response } from 'express';
import Invoice, { IInvoice } from '../models/Invoice';

const router = express.Router();

// Helper function to validate invoice data
const validateInvoiceData = (data: any): string[] => {
  const errors: string[] = [];
  
  if (!data.id) errors.push('Invoice ID is required');
  if (!data.client) errors.push('Client name is required');
  if (!data.date) errors.push('Invoice date is required');
  if (!data.invoiceType || !['perform', 'tax'].includes(data.invoiceType)) {
    errors.push('Valid invoice type is required');
  }
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('At least one item is required');
  }
  if (data.amount === undefined || data.amount <= 0) {
    errors.push('Valid amount is required');
  }
  
  return errors;
};

// GET all invoices
router.get('/', async (req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: invoices,
      total: invoices.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching invoices'
    });
  }
});

// GET invoice by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findOne({ id: req.params.id });
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching invoice'
    });
  }
});

// GET invoices by type
router.get('/type/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    
    if (!['perform', 'tax'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice type'
      });
    }
    
    const invoices = await Invoice.find({ invoiceType: type }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: invoices,
      total: invoices.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching invoices by type'
    });
  }
});

// CREATE new invoice
router.post('/', async (req: Request, res: Response) => {
  try {
    const invoiceData = req.body;
    
    // Validate required fields
    const validationErrors = validateInvoiceData(invoiceData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Check if invoice with same ID already exists
    const existingInvoice = await Invoice.findOne({ id: invoiceData.id });
    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: 'Invoice with this ID already exists'
      });
    }
    
    // Validate items
    if (!invoiceData.items || !Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invoice must contain at least one item'
      });
    }
    
    // Calculate item amounts if not provided
    invoiceData.items = invoiceData.items.map((item: any) => {
      if (!item.amount && item.quantity !== undefined && item.rate !== undefined) {
        item.amount = item.quantity * item.rate;
      }
      return item;
    });
    
    // Calculate subtotal
    const subtotal = invoiceData.items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    invoiceData.subtotal = subtotal;
    
    // Calculate tax if not provided
    if (invoiceData.invoiceType === 'perform' && !invoiceData.tax) {
      invoiceData.tax = subtotal * 0.18;
    }
    
    // Calculate total amount
    if (!invoiceData.amount) {
      let total = subtotal + (invoiceData.tax || 0);
      
      // Add management fees for tax invoices
      if (invoiceData.invoiceType === 'tax' && invoiceData.managementFeesAmount) {
        total += invoiceData.managementFeesAmount;
      }
      
      // Add round up
      if (invoiceData.roundUp) {
        total += invoiceData.roundUp;
      }
      
      invoiceData.amount = total;
    }
    
    const newInvoice = new Invoice(invoiceData);
    await newInvoice.save();
    
    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: newInvoice
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating invoice'
    });
  }
});

// UPDATE invoice
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const invoice = await Invoice.findOneAndUpdate(
      { id: id },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating invoice'
    });
  }
});

// MARK invoice as paid
router.patch('/:id/mark-paid', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const invoice = await Invoice.findOneAndUpdate(
      { id: id },
      { 
        status: 'paid',
        updatedAt: new Date() 
      },
      { new: true }
    );
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Invoice marked as paid',
      data: invoice
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error marking invoice as paid'
    });
  }
});

// DELETE invoice
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findOneAndDelete({ id: id });
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting invoice'
    });
  }
});

// SEARCH invoices
router.get('/search/:query', async (req: Request, res: Response) => {
  try {
    const { query } = req.params;
    
    const invoices = await Invoice.find({
      $or: [
        { id: { $regex: query, $options: 'i' } },
        { client: { $regex: query, $options: 'i' } },
        { voucherNo: { $regex: query, $options: 'i' } },
        { invoiceNumber: { $regex: query, $options: 'i' } },
        { serviceType: { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: invoices,
      total: invoices.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error searching invoices'
    });
  }
});

// GET invoice statistics
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const [total, pending, paid, overdue] = await Promise.all([
      Invoice.countDocuments(),
      Invoice.countDocuments({ status: 'pending' }),
      Invoice.countDocuments({ status: 'paid' }),
      Invoice.countDocuments({ status: 'overdue' })
    ]);
    
    const totalAmountResult = await Invoice.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const amountByType = await Invoice.aggregate([
      { $group: { 
        _id: '$invoiceType', 
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      } }
    ]);
    
    const recentInvoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('id client amount status date invoiceType');
    
    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        paid,
        overdue,
        totalAmount: totalAmountResult[0]?.total || 0,
        amountByType,
        recentInvoices
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching invoice stats'
    });
  }
});

export default router;
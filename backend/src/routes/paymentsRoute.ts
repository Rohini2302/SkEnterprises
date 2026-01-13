// payments.routes.js
const express = require('express');
const router = express.Router();

// GET /api/payments - Get all payments
router.get('/', async (req, res) => {
  try {
    const { status, method, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (method) filter.method = method;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    const payments = await Payment.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Payment.countDocuments(filter);
    
    res.json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/payments/methods/distribution - Get payment methods distribution
router.get('/methods/distribution', async (req, res) => {
  try {
    const distribution = await Payment.aggregate([
      {
        $group: {
          _id: '$method',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          method: '$_id',
          amount: 1,
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { amount: -1 }
      }
    ]);
    
    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/payments/stats - Get payment statistics
router.get('/stats', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    
    let groupByFormat;
    switch (period) {
      case 'daily':
        groupByFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        groupByFormat = '%Y-%U';
        break;
      case 'monthly':
        groupByFormat = '%Y-%m';
        break;
      case 'yearly':
        groupByFormat = '%Y';
        break;
      default:
        groupByFormat = '%Y-%m';
    }
    
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: groupByFormat, date: '$date' } },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import connectDB from './config/database';
import User, { IUser } from './models/User'; // Fixed import - User is default export
import mongoose from 'mongoose';
import clientRoutes from './routes/clientRoutes';
import leadRoutes from './routes/leadRoutes';
import communicationRoutes from './routes/communicationRoutes';
import authRoutes from './routes/authRoutes'; // Import authRoutes instead of userRoutes
import expenseRoutes from './routes/expenseRoutes';
import serviceRoutes from './routes/serviceRoutes';

const app: Application = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to Database
connectDB();

// Disable caching middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});

// Test endpoint
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: 'Backend API is working!',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Backend API is running!',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    version: '1.0.0',
    services: ['auth', 'users', 'crm']
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// ============ AUTH ROUTES ============
app.use('/api/auth', authRoutes);

// ============ USER ROUTES ============

// CREATE - Add new user
app.post('/api/users', async (req: Request, res: Response) => {
  try {
    const { 
      username, 
      email, 
      password, 
      role, 
      firstName, 
      lastName,
      department,
      site,
      phone,
      joinDate
    } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email or username already exists' 
      });
    }

    // Create name from firstName and lastName
    const name = `${firstName} ${lastName}`.trim();

    const newUser = new User({
      username,
      email,
      password,
      role,
      firstName,
      lastName,
      name,
      department,
      site: site || 'Mumbai Office',
      phone,
      joinDate: joinDate ? new Date(joinDate) : new Date()
    });

    await newUser.save();

    const userResponse = {
      _id: newUser._id.toString(),
      id: newUser._id.toString().slice(-6),
      username: newUser.username,
      email: newUser.email,
      name: newUser.name,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      department: newUser.department,
      site: newUser.site,
      phone: newUser.phone,
      isActive: newUser.isActive,
      status: newUser.isActive ? 'active' as const : 'inactive' as const,
      joinDate: newUser.joinDate.toISOString().split('T')[0]
    };

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating user'
    });
  }
});

// READ - Get all users (with grouping by role)
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    // 1️⃣ Fetch users (latest first)
    const users = await User.find().sort({ createdAt: -1 });

    // 2️⃣ Transform users safely
    const transformedUsers = users.map((user: IUser) => ({
      ...user.toJSON(),
      id: user._id.toString().slice(-6)
    }));

    // 3️⃣ Group users by role
    const groupedByRole = transformedUsers.reduce((acc: any, user: any) => {
      if (!acc[user.role]) {
        acc[user.role] = [];
      }
      acc[user.role].push(user);
      return acc;
    }, {});

    // 4️⃣ Send response
    res.status(200).json({
      success: true,
      allUsers: transformedUsers,
      groupedByRole,
      total: transformedUsers.length,
      active: transformedUsers.filter((u: any) => u.isActive).length,
      inactive: transformedUsers.filter((u: any) => !u.isActive).length
    });
  } catch (error: any) {
    console.error('GET /api/users failed:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching users'
    });
  }
});

// Get user statistics
app.get('/api/users/stats', async (req: Request, res: Response) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching stats'
    });
  }
});

// Toggle user status
app.patch('/api/users/:id/toggle-status', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    user.updatedAt = new Date();
    await user.save();

    const userResponse = {
      _id: user._id.toString(),
      id: user._id.toString().slice(-6),
      username: user.username,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department,
      site: user.site,
      phone: user.phone,
      isActive: user.isActive,
      status: user.isActive ? 'active' as const : 'inactive' as const,
      joinDate: user.joinDate.toISOString().split('T')[0]
    };

    res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      user: userResponse
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating status'
    });
  }
});

// UPDATE - Update user (enhanced)
app.put('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    
    // If name is provided, split into firstName and lastName
    if (updates.name) {
      const [firstName, ...lastNameParts] = updates.name.split(' ');
      updates.firstName = firstName;
      updates.lastName = lastNameParts.join(' ');
      delete updates.name;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userResponse = {
      _id: user._id.toString(),
      id: user._id.toString().slice(-6),
      username: user.username,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department,
      site: user.site,
      phone: user.phone,
      isActive: user.isActive,
      status: user.isActive ? 'active' as const : 'inactive' as const,
      joinDate: user.joinDate.toISOString().split('T')[0]
    };

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: userResponse
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating user'
    });
  }
});

// DELETE - Delete user
app.delete('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting user'
    });
  }
});

// Update user role
app.put('/api/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    const validRoles = ['admin', 'manager', 'supervisor', 'employee'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid role' 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, updatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userResponse = {
      _id: user._id.toString(),
      id: user._id.toString().slice(-6),
      username: user.username,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department,
      site: user.site,
      phone: user.phone,
      isActive: user.isActive,
      status: user.isActive ? 'active' as const : 'inactive' as const,
      joinDate: user.joinDate.toISOString().split('T')[0]
    };

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user: userResponse
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating role'
    });
  }
});

// ============ CRM ROUTES ============

// Use imported CRM routes
app.use('/api/crm/clients', clientRoutes);
app.use('/api/crm/leads', leadRoutes);
app.use('/api/crm/communications', communicationRoutes);

// CRM Dashboard Stats
app.get('/api/crm/stats', async (req: Request, res: Response) => {
  try {
    // Dynamically import models to avoid circular dependencies
    const Client = (await import('./models/Client')).default;
    const Lead = (await import('./models/Lead')).default;
    const Communication = (await import('./models/Communication')).default;
    
    // Get counts
    const [clientsCount, leadsCount, communicationsCount] = await Promise.all([
      Client.countDocuments(),
      Lead.countDocuments({ status: { $nin: ['closed-won', 'closed-lost'] } }),
      Communication.countDocuments()
    ]);

    // Calculate total value from clients
    const allClients = await Client.find({}, 'value');
    const totalValue = allClients.reduce((sum: number, client: any) => {
      const valueStr = client.value || '0';
      const numericValue = parseFloat(valueStr.replace(/[₹,]/g, '')) || 0;
      return sum + numericValue;
    }, 0);
    
    // Format total value
    let formattedValue = '₹0';
    if (totalValue >= 10000000) { // 1 crore or more
      formattedValue = `₹${(totalValue / 10000000).toFixed(1)}Cr`;
    } else if (totalValue >= 100000) { // 1 lakh or more
      formattedValue = `₹${(totalValue / 100000).toFixed(1)}L`;
    } else {
      formattedValue = `₹${totalValue.toLocaleString('en-IN')}`;
    }

    res.status(200).json({
      success: true,
      data: {
        totalClients: clientsCount,
        activeLeads: leadsCount,
        totalValue: formattedValue,
        communications: communicationsCount
      }
    });
  } catch (error: any) {
    console.error('CRM stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching CRM stats',
      data: {
        totalClients: 0,
        activeLeads: 0,
        totalValue: '₹0',
        communications: 0
      }
    });
  }
});
// ============ EXPENSE ROUTES ============
app.use('/api/expenses', expenseRoutes);
// ============ SERVICE ROUTES ============
app.use('/api/services', serviceRoutes);

// ============ 404 HANDLER ============

// 404 handler for undefined routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5001;

export default app;
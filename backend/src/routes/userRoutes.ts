// routes/userRoutes.ts
import express, { Request, Response } from 'express';
import { User } from '../models/User';
import { auth, authorize } from '../middleware/auth';

const router = express.Router();

// Get all users (accessible by both admin and superadmin)
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password');
    
    const groupedByRole = users.reduce((acc: any, user: any) => {
      if (!acc[user.role]) {
        acc[user.role] = [];
      }
      acc[user.role].push(user);
      return acc;
    }, {});

    res.json({
      success: true,
      allUsers: users.map(user => ({
        ...user.toObject(),
        id: user._id.toString().slice(-6),
        status: user.isActive ? 'active' : 'inactive'
      })),
      groupedByRole,
      total: users.length,
      active: users.filter((u: any) => u.isActive).length,
      inactive: users.filter((u: any) => !u.isActive).length
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching users' 
    });
  }
});

// Create user (accessible by both admin and superadmin)
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    
    console.log('👑 [CREATE USER] Attempting to create user with role:', userData.role);
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check superadmin limit BEFORE creating user
    if (userData.role === 'superadmin') {
      const existingSuperadmin = await User.findOne({ role: 'superadmin' });
      
      if (existingSuperadmin) {
        console.log('👑 [CREATE USER] Superadmin already exists:', existingSuperadmin.email);
        return res.status(400).json({
          success: false,
          message: 'Only one superadmin is allowed in the system. A superadmin already exists.'
        });
      }
    }

    // Generate username if not provided
    if (!userData.username && userData.email) {
      userData.username = userData.email.split('@')[0];
    }

    const user = new User(userData);
    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    console.log('✅ [CREATE USER] User created successfully');
    res.status(201).json({
      success: true,
      user: {
        ...userResponse,
        id: user._id.toString().slice(-6),
        status: user.isActive ? 'active' : 'inactive'
      },
      message: 'User created successfully'
    });
  } catch (error: any) {
    console.error('❌ [CREATE USER] Error:', error.message);
    
    // Handle superadmin limit error from Mongoose middleware
    if (error.name === 'SuperadminLimitError') {
      return res.status(400).json({ 
        success: false,
        message: error.message
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false,
        message: `${field} already exists`
      });
    }
    
    res.status(400).json({ 
      success: false,
      message: error.message || 'Error creating user' 
    });
  }
});

// Update user
router.put('/:id', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;
    
    console.log('👑 [UPDATE USER] Updating user:', userId, 'with role:', updateData.role);
    
    // Check superadmin limit if trying to update role to superadmin
    if (updateData.role === 'superadmin') {
      const existingSuperadmin = await User.findOne({ 
        role: 'superadmin',
        _id: { $ne: userId } // Exclude the current user
      });
      
      if (existingSuperadmin) {
        console.log('👑 [UPDATE USER] Superadmin already exists:', existingSuperadmin.email);
        return res.status(400).json({
          success: false,
          message: 'Only one superadmin is allowed. Another superadmin already exists.'
        });
      }
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user fields
    Object.keys(updateData).forEach(key => {
      if (key !== 'password') { // Don't update password directly
        (user as any)[key] = updateData[key];
      }
    });

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    console.log('✅ [UPDATE USER] User updated successfully');
    res.json({
      success: true,
      user: {
        ...userResponse,
        id: user._id.toString().slice(-6),
        status: user.isActive ? 'active' : 'inactive'
      },
      message: 'User updated successfully'
    });
  } catch (error: any) {
    console.error('❌ [UPDATE USER] Error:', error.message);
    
    // Handle superadmin limit error from Mongoose middleware
    if (error.name === 'SuperadminLimitError') {
      return res.status(400).json({ 
        success: false,
        message: error.message
      });
    }
    
    res.status(400).json({ 
      success: false,
      message: error.message || 'Error updating user' 
    });
  }
});

// Delete user
router.delete('/:id', auth, authorize('admin', 'superadmin'), async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting self
    if (req.user && user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }
    
    // Prevent deleting superadmin
    if (user.role === 'superadmin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete superadmin account'
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting user' 
    });
  }
});

// Toggle user status
router.patch('/:id/toggle-status', auth, authorize('admin', 'superadmin'), async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent deactivating superadmin
    if (user.role === 'superadmin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate superadmin account'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      user: {
        ...userResponse,
        id: user._id.toString().slice(-6),
        status: user.isActive ? 'active' : 'inactive'
      },
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error: any) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error toggling user status' 
    });
  }
});

// Get user stats
router.get('/stats', auth, async (req: Request, res: Response) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching user stats' 
    });
  }
});

// Add this new route to check superadmin status
router.get('/superadmin/check', auth, async (req: Request, res: Response) => {
  try {
    console.log('👑 [SUPERADMIN CHECK] Checking superadmin status');
    const superadmin = await User.findOne({ role: 'superadmin' }).select('-password');
    
    res.json({
      success: true,
      exists: !!superadmin,
      superadmin: superadmin || null
    });
  } catch (error: any) {
    console.error('Error checking superadmin:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error checking superadmin status'
    });
  }
});

// Update user role specifically
router.put('/:id/role', auth, authorize('admin', 'superadmin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required'
      });
    }
    
    console.log('👑 [UPDATE ROLE] Attempting to update role for user:', id, 'to:', role);
    
    // Check superadmin limit if trying to set role to superadmin
    if (role === 'superadmin') {
      const existingSuperadmin = await User.findOne({ 
        role: 'superadmin',
        _id: { $ne: id }
      });
      
      if (existingSuperadmin) {
        console.log('👑 [UPDATE ROLE] Superadmin already exists:', existingSuperadmin.email);
        return res.status(400).json({
          success: false,
          message: 'Only one superadmin is allowed. Another superadmin already exists.'
        });
      }
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('✅ [UPDATE ROLE] Role updated successfully');
    res.json({
      success: true,
      user: {
        ...user.toObject(),
        id: user._id.toString().slice(-6),
        status: user.isActive ? 'active' : 'inactive'
      },
      message: 'User role updated successfully'
    });
  } catch (error: any) {
    console.error('❌ [UPDATE ROLE] Error:', error.message);
    
    // Handle superadmin limit error from Mongoose middleware
    if (error.name === 'SuperadminLimitError') {
      return res.status(400).json({ 
        success: false,
        message: error.message
      });
    }
    
    res.status(400).json({ 
      success: false,
      message: error.message || 'Error updating user role'
    });
  }
});

export default router;
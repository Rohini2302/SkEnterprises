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
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
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
    console.error('Error creating user:', error);
    res.status(400).json({ 
      success: false,
      message: error.message || 'Error creating user' 
    });
  }
});

// Update user
router.put('/:id', auth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'password') { // Don't update password directly
        (user as any)[key] = req.body[key];
      }
    });

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
      message: 'User updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
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

export default router;
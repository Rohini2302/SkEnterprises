import { Request, Response } from 'express';
import { User } from '../models/User';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    
    // Group by role using any type
    const groupedByRole = (users as any[]).reduce((acc: any, user: any) => {
      if (!acc[user.role]) {
        acc[user.role] = [];
      }
      acc[user.role].push(user);
      return acc;
    }, {});

    res.json({
      success: true,
      allUsers: users,
      groupedByRole,
      total: users.length,
      active: (users as any[]).filter((u: any) => u.isActive).length,
      inactive: (users as any[]).filter((u: any) => !u.isActive).length
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    console.log('👑 [CONTROLLER] Creating user with data:', req.body);
    
    // Check if superadmin already exists when trying to create one
    if (req.body.role === 'superadmin') {
      const existingSuperadmin = await User.findOne({ role: 'superadmin' });
      
      if (existingSuperadmin) {
        console.log('👑 [CONTROLLER] Superadmin already exists:', existingSuperadmin.email);
        return res.status(400).json({ 
          success: false,
          message: 'Only one superadmin is allowed. A superadmin already exists.'
        });
      }
    }
    
    // Generate username from email if not provided
    if (!req.body.username && req.body.email) {
      req.body.username = req.body.email.split('@')[0];
    }
    
    const userData = req.body;
    const user = new User(userData);
    
    console.log('👑 [CONTROLLER] Attempting to save user...');
    await user.save();
    
    console.log('✅ [CONTROLLER] User created successfully');
    res.status(201).json({
      success: true,
      user,
      message: 'User created successfully'
    });
  } catch (error: any) {
    console.error('❌ [CONTROLLER] Error creating user:', error.message);
    
    // Handle specific superadmin limit error from Mongoose middleware
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
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ 
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(400).json({ 
      success: false,
      message: error.message || 'Error creating user'
    });
  }
};

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    const stats = [
      { _id: 'admin', count: (users as any[]).filter((u: any) => u.role === 'admin').length },
      { _id: 'manager', count: (users as any[]).filter((u: any) => u.role === 'manager').length },
      { _id: 'supervisor', count: (users as any[]).filter((u: any) => u.role === 'supervisor').length },
      { _id: 'employee', count: (users as any[]).filter((u: any) => u.role === 'employee').length }
    ];
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Add this new function to check superadmin status
export const checkSuperadminStatus = async (req: Request, res: Response) => {
  try {
    console.log('👑 [CONTROLLER] Checking superadmin status');
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
};

// Add this update user function with superadmin check
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log('👑 [CONTROLLER] Updating user:', id, 'with data:', updateData);
    
    // Check if trying to update role to superadmin
    if (updateData.role === 'superadmin') {
      const existingSuperadmin = await User.findOne({ 
        role: 'superadmin',
        _id: { $ne: id } // Exclude the current user
      });
      
      if (existingSuperadmin) {
        console.log('👑 [CONTROLLER] Superadmin already exists:', existingSuperadmin.email);
        return res.status(400).json({ 
          success: false,
          message: 'Only one superadmin is allowed. Another superadmin already exists.'
        });
      }
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('✅ [CONTROLLER] User updated successfully');
    res.json({
      success: true,
      user,
      message: 'User updated successfully'
    });
  } catch (error: any) {
    console.error('❌ [CONTROLLER] Error updating user:', error.message);
    
    // Handle specific superadmin limit error from Mongoose middleware
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
};
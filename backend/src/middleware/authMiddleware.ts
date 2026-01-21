import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User'; // Import your User model

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
      userId?: string;
    }
  }
}

// Proper JWT authentication middleware
export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'No authentication token provided' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: string;
      iat: number;
      exp: number;
    };

    // Find user in database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        error: 'User account is inactive' 
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id.toString();

    console.log(`✅ Auth: ${user.name} (${user.role}) accessing ${req.method} ${req.path}`);
    next();
  } catch (error: any) {
    console.error('❌ Auth middleware error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token' 
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token expired' 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
};

// Development-only mock auth (for testing)
export const mockAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if token exists but don't validate it
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      try {
        // Try to decode token without verification
        const decoded = jwt.decode(token) as any;
        
        if (decoded?.userId) {
          // Try to find real user first
          const user = await User.findById(decoded.userId).select('-password');
          if (user) {
            req.user = user;
            req.userId = user._id.toString();
            console.log(`✅ Mock Auth: Using real user ${user.name}`);
            return next();
          }
        }
      } catch (e) {
        // Continue with mock user
      }
    }

    // Fallback to mock user
    req.user = {
      id: 'system',
      _id: 'system',
      name: 'System User',
      email: 'system@example.com',
      role: 'admin'
    };
    req.userId = 'system';
    
    console.log(`⚠️ Mock Auth: Using system user for ${req.method} ${req.path}`);
    next();
  } catch (error: any) {
    console.error('Mock auth error:', error);
    next();
  }
};

// Role-based authorization middleware (unchanged)
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

export const requireRole = authorize;
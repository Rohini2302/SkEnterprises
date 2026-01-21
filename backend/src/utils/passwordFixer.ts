// src/utils/passwordFixer.ts
import bcrypt from 'bcryptjs';
import { User } from '../models/User';

export class PasswordFixer {
  static async checkAndFixUnhashedPasswords() {
    try {
      console.log('🔍 [PASSWORD FIXER] Checking for unhashed passwords...');
      
      // Find all users with password - FIXED: Use find() not findOne()
      const users = await User.find().select('+password');

      console.log(`📋 [PASSWORD FIXER] Found ${users.length} users to check`);
      
      let fixedCount = 0;
      let alreadyHashedCount = 0;
      let noPasswordCount = 0;
      let errors: string[] = [];
      
      for (const user of users) {
        try {
          if (!user.password) {
            console.log(`⚠️ [PASSWORD FIXER] No password for user: ${user.email}`);
            noPasswordCount++;
            continue;
          }
          
          // Check if password is properly hashed (bcrypt hash starts with $2)
          const isHashed = user.password && user.password.startsWith('$2');
          
          if (isHashed) {
            alreadyHashedCount++;
          } else {
            console.log(`⚠️ [PASSWORD FIXER] Found unhashed password for: ${user.email}`);
            console.log(`🔍 [PASSWORD FIXER] Password: "${user.password}" (length: ${user.password.length})`);
            
            // Hash the password
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(user.password, salt);
            
            // Update user
            user.password = hashedPassword;
            user.passwordChangedAt = new Date();
            await user.save();
            
            console.log(`✅ [PASSWORD FIXER] Fixed password for: ${user.email}`);
            fixedCount++;
          }
        } catch (error: any) {
          const errorMsg = `Error fixing password for ${user.email}: ${error.message}`;
          console.error(`❌ [PASSWORD FIXER] ${errorMsg}`);
          errors.push(errorMsg);
        }
      }
      
      // Log summary
      if (fixedCount > 0) {
        console.log(`\n🎉 [PASSWORD FIXER] Auto-fixed ${fixedCount} unhashed passwords!`);
      }
      
      console.log(`📊 [PASSWORD FIXER] Summary:`);
      console.log(`   ✅ Already hashed: ${alreadyHashedCount}`);
      console.log(`   🔐 Fixed: ${fixedCount}`);
      console.log(`   ⚠️ No password: ${noPasswordCount}`);
      console.log(`   ❌ Errors: ${errors.length}`);
      console.log(`   📋 Total users: ${users.length}`);
      
      if (errors.length > 0) {
        console.log('\n❌ [PASSWORD FIXER] Errors encountered:');
        errors.forEach(error => console.log(`   - ${error}`));
      }
      
      if (alreadyHashedCount === users.length && errors.length === 0) {
        console.log('✅ [PASSWORD FIXER] All passwords are properly hashed!');
      }
      
      return { 
        success: true, 
        fixedCount, 
        alreadyHashedCount, 
        noPasswordCount, 
        errorCount: errors.length,
        totalUsers: users.length,
        errors: errors.length > 0 ? errors : undefined
      };
      
    } catch (error: any) {
      console.error('❌ [PASSWORD FIXER] Error in password check:', error.message);
      return { 
        success: false, 
        fixedCount: 0, 
        alreadyHashedCount: 0, 
        noPasswordCount: 0,
        errorCount: 1,
        totalUsers: 0,
        errors: [error.message]
      };
    }
  }
  
  static isPasswordHashed(password: string): boolean {
    if (!password) return false;
    return password.startsWith('$2a$') || password.startsWith('$2b$') || password.startsWith('$2y$');
  }

  // Force hash a password (for manual fixes)
  static async hashPassword(plainPassword: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(plainPassword, salt);
  }
  
  // Validate password hash
  static validatePasswordHash(password: string): {
    isValid: boolean;
    algorithm?: string;
    reason?: string;
  } {
    if (!password) {
      return { isValid: false, reason: 'Password is empty' };
    }
    
    if (password.length < 6) {
      return { isValid: false, reason: 'Password too short' };
    }
    
    // Check if it's a bcrypt hash
    if (password.startsWith('$2')) {
      const algorithm = password.split('$')[1];
      return { isValid: true, algorithm: `bcrypt-${algorithm}` };
    }
    
    // If not a bcrypt hash, check if it looks like plain text
    if (password.length <= 100 && !password.includes('$')) {
      return { 
        isValid: false, 
        reason: 'Password appears to be plain text (not hashed)',
        algorithm: 'plain-text'
      };
    }
    
    return { isValid: true, algorithm: 'unknown-hash' };
  }
}
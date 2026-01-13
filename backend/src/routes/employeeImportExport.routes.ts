import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import Employee, { IEmployee } from '../models/Employee';

const router = express.Router();

// Configure multer for Excel uploads
const excelStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads/excel';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'employee-import-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const excelUpload = multer({ 
  storage: excelStorage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedTypes.includes(ext)) {
      return cb(new Error('Only Excel files (.xlsx, .xls) are allowed!'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Import employees from Excel
router.post('/import', excelUpload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    console.log('Processing import file:', req.file.filename);

    // Read Excel file
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    
    if (!jsonData || jsonData.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        success: false, 
        message: 'Excel file is empty or has no data' 
      });
    }

    console.log(`Found ${jsonData.length} rows to process`);

    const importedEmployees: any[] = [];
    const errors: string[] = [];
    const skippedEmployees: any[] = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as any;
      const rowNum = i + 2;
      
      try {
        // Validate required fields
        if (!row.name) {
          errors.push(`Row ${rowNum}: Missing Name`);
          continue;
        }
        if (!row.email) {
          errors.push(`Row ${rowNum}: Missing Email`);
          continue;
        }
        if (!row.phone) {
          errors.push(`Row ${rowNum}: Missing Phone`);
          continue;
        }
        if (!row.aadharNumber) {
          errors.push(`Row ${rowNum}: Missing Aadhar Number`);
          continue;
        }
        if (!row.department) {
          errors.push(`Row ${rowNum}: Missing Department`);
          continue;
        }
        if (!row.position) {
          errors.push(`Row ${rowNum}: Missing Position`);
          continue;
        }

        // Generate employee ID
        let employeeId = row.employeeId;
        if (!employeeId || employeeId.toString().trim() === '') {
          const date = new Date();
          const dateStr = date.getFullYear().toString().slice(2) + 
                        (date.getMonth() + 1).toString().padStart(2, '0') + 
                        date.getDate().toString().padStart(2, '0');
          const random = Math.floor(1000 + Math.random() * 9000);
          employeeId = `EMP${dateStr}${random}`;
        }

        // Check if employee already exists
        const existingEmployee = await Employee.findOne({ 
          $or: [
            { email: row.email.toString().toLowerCase().trim() },
            { aadharNumber: row.aadharNumber.toString().replace(/\s/g, '') }
          ] 
        });

        if (existingEmployee) {
          skippedEmployees.push({
            row: rowNum,
            name: row.name,
            email: row.email,
            reason: existingEmployee.email === row.email ? 'Email already exists' : 'Aadhar already exists'
          });
          continue;
        }

        // Create employee
        const employeeData = {
          employeeId: employeeId.toString().trim(),
          name: row.name.toString().trim(),
          email: row.email.toString().toLowerCase().trim(),
          phone: row.phone.toString().trim(),
          aadharNumber: row.aadharNumber.toString().replace(/\s/g, ''),
          panNumber: row.panNumber ? row.panNumber.toString().trim().toUpperCase() : '',
          esicNumber: row.esicNumber ? row.esicNumber.toString().trim() : '',
          uanNumber: row.uanNumber ? row.uanNumber.toString().trim() : '',
          dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
          dateOfJoining: row.dateOfJoining ? new Date(row.dateOfJoining) : new Date(),
          dateOfExit: row.dateOfExit ? new Date(row.dateOfExit) : undefined,
          bloodGroup: row.bloodGroup || '',
          gender: row.gender || '',
          maritalStatus: row.maritalStatus || '',
          permanentAddress: row.permanentAddress || '',
          permanentPincode: row.permanentPincode || '',
          localAddress: row.localAddress || '',
          localPincode: row.localPincode || '',
          bankName: row.bankName || '',
          accountNumber: row.accountNumber || '',
          ifscCode: row.ifscCode || '',
          branchName: row.branchName || '',
          fatherName: row.fatherName || '',
          motherName: row.motherName || '',
          spouseName: row.spouseName || '',
          numberOfChildren: parseInt(row.numberOfChildren) || 0,
          emergencyContactName: row.emergencyContactName || '',
          emergencyContactPhone: row.emergencyContactPhone || '',
          emergencyContactRelation: row.emergencyContactRelation || '',
          nomineeName: row.nomineeName || '',
          nomineeRelation: row.nomineeRelation || '',
          department: row.department.toString().trim(),
          position: row.position.toString().trim(),
          siteName: row.siteName || '',
          salary: parseFloat(row.salary) || 0,
          status: row.status && ['active', 'inactive', 'left'].includes(row.status.toLowerCase()) 
                  ? row.status.toLowerCase() as 'active' | 'inactive' | 'left' 
                  : 'active',
          role: 'employee',
          idCardIssued: false,
          westcoatIssued: false,
          apronIssued: false
        };

        const newEmployee = new Employee(employeeData);
        await newEmployee.save();
        
        importedEmployees.push({
          employeeId: newEmployee.employeeId,
          name: newEmployee.name,
          email: newEmployee.email,
          department: newEmployee.department
        });

      } catch (error: any) {
        errors.push(`Row ${rowNum}: ${error.message}`);
      }
    }

    // Clean up file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: `Import completed. Success: ${importedEmployees.length}, Failed: ${errors.length}, Skipped: ${skippedEmployees.length}`,
      summary: {
        totalRows: jsonData.length,
        imported: importedEmployees.length,
        errors: errors.length,
        skipped: skippedEmployees.length
      },
      imported: importedEmployees,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limit to 10 errors
      skipped: skippedEmployees.length > 0 ? skippedEmployees.slice(0, 10) : undefined
    });

  } catch (error: any) {
    console.error('Import error:', error);
    
    // Clean up file if exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Could not delete temp file:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error importing employees',
      error: error.message 
    });
  }
});

// Export employees to Excel
router.get('/export', async (req: any, res: any) => {
  try {
    const { department, status } = req.query;
    
    const query: any = {};
    if (department && department !== 'all') {
      query.department = department;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const employees = await Employee.find(query).sort({ createdAt: -1 });

    if (employees.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No employees found to export' 
      });
    }

    // Prepare data
    const data = employees.map(emp => ({
      'Employee ID': emp.employeeId,
      'Name': emp.name,
      'Email': emp.email,
      'Phone': emp.phone,
      'Aadhar Number': emp.aadharNumber,
      'PAN Number': emp.panNumber || '',
      'Department': emp.department,
      'Position': emp.position,
      'Salary': emp.salary,
      'Status': emp.status,
      'Date of Joining': emp.dateOfJoining.toISOString().split('T')[0],
      'Gender': emp.gender || '',
      'Marital Status': emp.maritalStatus || '',
      'Site Name': emp.siteName || ''
    }));

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Employees');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="employees_export_${Date.now()}.xlsx"`);
    
    res.send(buffer);

  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error exporting employees',
      error: error.message 
    });
  }
});

// Download template
router.get('/template', async (req: any, res: any) => {
  try {
    const templateData = [{
      'Employee ID': 'EMP2401011001', // Optional
      'Name': 'John Doe',
      'Email': 'john.doe@example.com',
      'Phone': '9876543210',
      'Aadhar Number': '123456789012',
      'PAN Number': 'ABCDE1234F',
      'Date of Birth': '1990-01-01',
      'Date of Joining': '2024-01-01',
      'Gender': 'Male',
      'Marital Status': 'Married',
      'Permanent Address': '123 Main Street',
      'Permanent Pincode': '400001',
      'Local Address': '456 Local Street',
      'Local Pincode': '400002',
      'Bank Name': 'State Bank of India',
      'Account Number': '12345678901234',
      'IFSC Code': 'SBIN0001234',
      'Father Name': 'Robert Doe',
      'Mother Name': 'Jane Doe',
      'Spouse Name': 'Alice Doe',
      'Number of Children': '2',
      'Emergency Contact Name': 'Robert Doe',
      'Emergency Contact Phone': '9876543211',
      'Emergency Contact Relation': 'Father',
      'Nominee Name': 'Alice Doe',
      'Nominee Relation': 'Spouse',
      'Department': 'Housekeeping Management',
      'Position': 'Supervisor',
      'Site Name': 'Corporate Office',
      'Salary': '25000',
      'Status': 'active'
    }];

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(templateData);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Template');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="employee_import_template.xlsx"');
    
    res.send(buffer);

  } catch (error: any) {
    console.error('Template error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating template',
      error: error.message 
    });
  }
});

export default router;
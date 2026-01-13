import { Request, Response } from 'express';
import EPFForm from '../models/EPFForm';
import Employee from '../models/Employee';

// Create EPF Form
export const createEPFForm = async (req: Request, res: Response) => {
  try {
    const formData = req.body;
    
    if (!formData.employeeId || !formData.memberName || !formData.aadharNumber) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, Member Name, and Aadhar Number are required'
      });
    }
    
    const employee = await Employee.findOne({ employeeId: formData.employeeId });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    const existingForm = await EPFForm.findOne({ employeeId: employee.employeeId });
    if (existingForm) {
      return res.status(400).json({
        success: false,
        message: 'EPF Form already exists for this employee'
      });
    }
    
    const epfForm = new EPFForm({
      ...formData,
      employee: employee._id,
      employeeId: employee.employeeId
    });
    
    await epfForm.save();
    
    res.status(201).json({
      success: true,
      message: 'EPF Form created successfully',
      data: epfForm
    });
  } catch (error: any) {
    console.error('Error creating EPF Form:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating EPF Form'
    });
  }
};

// Get EPF Forms
export const getEPFForms = async (req: Request, res: Response) => {
  try {
    const { employeeId, status } = req.query;
    
    const query: any = {};
    if (employeeId) query.employeeId = employeeId;
    if (status) query.status = status;
    
    const forms = await EPFForm.find(query)
      .populate('employee', 'name employeeId email phone')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: forms
    });
  } catch (error: any) {
    console.error('Error fetching EPF Forms:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching EPF Forms'
    });
  }
};

// Get single EPF Form
export const getEPFForm = async (req: Request, res: Response) => {
  try {
    const form = await EPFForm.findById(req.params.id)
      .populate('employee', 'name employeeId email phone department position');
    
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'EPF Form not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: form
    });
  } catch (error: any) {
    console.error('Error fetching EPF Form:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching EPF Form'
    });
  }
};

// Update EPF Form status
export const updateEPFFormStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    
    if (!['draft', 'submitted', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const updateData: any = { status };
    
    if (status === 'submitted') {
      updateData.submittedAt = new Date();
    } else if (status === 'approved') {
      updateData.approvedAt = new Date();
    }
    
    const form = await EPFForm.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'EPF Form not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'EPF Form status updated successfully',
      data: form
    });
  } catch (error: any) {
    console.error('Error updating EPF Form status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating EPF Form status'
    });
  }
};
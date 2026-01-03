import { Request, Response } from 'express';
import Service, { IService } from '../models/Service';

// Get all services
export const getAllServices = async (req: Request, res: Response) => {
  try {
    const services = await Service.find().sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: services,
      total: services.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching services'
    });
  }
};

// Create new service
export const createService = async (req: Request, res: Response) => {
  try {
    const {
      name,
      status = 'operational',
      assignedTeam,
      description,
      createdBy,
      createdByRole = 'superadmin'
    } = req.body;

    // Check if service with same name exists
    const existingService = await Service.findOne({ name });
    
    if (existingService) {
      return res.status(400).json({
        success: false,
        message: 'Service with this name already exists'
      });
    }

    const newService = new Service({
      name,
      status,
      assignedTeam,
      lastChecked: new Date(),
      description,
      createdBy,
      createdByRole
    });

    await newService.save();

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: newService
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating service'
    });
  }
};

// Update service status
export const updateServiceStatus = async (req: Request, res: Response) => {
  try {
    const { status, updatedBy, updatedByRole } = req.body;
    
    if (!['operational', 'maintenance', 'down'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        lastChecked: new Date(),
        updatedBy,
        updatedByRole,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service status updated successfully',
      data: service
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating service status'
    });
  }
};
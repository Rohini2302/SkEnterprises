import { Request, Response } from 'express';
import Machine, { IMachine, IMaintenanceRecord } from '../models/machineModel';

export class MachineController {
  // Get all machines
  async getMachines(req: Request, res: Response) {
    try {
      const machines = await Machine.find();
      res.json(machines);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get machine by ID
  async getMachineById(req: Request, res: Response) {
    try {
      const machine = await Machine.findById(req.params.id);
      if (!machine) return res.status(404).json({ error: 'Machine not found' });
      res.json(machine);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Create new machine
  async createMachine(req: Request, res: Response) {
    try {
      const data = req.body as Partial<IMachine>;
      const machine = await Machine.create(data);
      res.status(201).json(machine);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update machine
  async updateMachine(req: Request, res: Response) {
    try {
      const machine = await Machine.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!machine) return res.status(404).json({ error: 'Machine not found' });
      res.json(machine);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Delete machine
  async deleteMachine(req: Request, res: Response) {
    try {
      const machine = await Machine.findByIdAndDelete(req.params.id);
      if (!machine) return res.status(404).json({ error: 'Machine not found' });
      res.json({ message: 'Machine deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

// Inside MachineController
async getMachineStats(req: Request, res: Response) {
  try {
    const machines = await Machine.find({});

    const totalMachines = machines.length;
    const totalMachineValue = machines.reduce((sum, m) => sum + (m.cost * m.quantity), 0);
    const operationalMachines = machines.filter(m => m.status === 'operational').length;
    const maintenanceMachines = machines.filter(m => m.status === 'maintenance').length;
    const outOfServiceMachines = machines.filter(m => m.status === 'out-of-service').length;

    res.json({
      totalMachines,
      totalMachineValue,
      operationalMachines,
      maintenanceMachines,
      outOfServiceMachines,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch machine stats' });
  }
}

  // Add maintenance record
  async addMaintenanceRecord(req: Request, res: Response) {
    try {
      const machine = await Machine.findById(req.params.id);
      if (!machine) return res.status(404).json({ error: 'Machine not found' });

      const record = req.body as IMaintenanceRecord; // single record
      machine.maintenanceHistory = machine.maintenanceHistory || [];
      machine.maintenanceHistory.push(record);

      await machine.save();

      res.json(machine);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const machineController = new MachineController();

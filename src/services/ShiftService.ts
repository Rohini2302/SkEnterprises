// services/ShiftService.ts
import { Shift, Employee, ApiResponse, AssignEmployeeRequest } from '../types/api.types';

// Define interfaces if not already in a separate file
export interface Shift {
  _id: string;
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  employees: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  department: string;
  status: string;
}

export interface CreateShiftRequest {
  name: string;
  startTime: string;
  endTime: string;
  employees: string[];
}

export interface AssignEmployeeRequest {
  employeeId: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Configuration
const API_BASE_URL = "http://localhost:5001/api";

// Error handling utility
class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API Service Class
class ShiftService {
  // Generic fetch method with error handling
  private async fetchApi<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.message || `HTTP error! status: ${response.status}`,
          response.status,
          data
        );
      }

      if (!data.success) {
        throw new ApiError(
          data.message || 'Request failed',
          response.status,
          data
        );
      }

      return data.data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ApiError(`Network error: ${error.message}`);
      }
      throw new ApiError('Unknown error occurred');
    }
  }

  // Shift-related methods
  async getAllShifts(): Promise<Shift[]> {
    return this.fetchApi<Shift[]>('/shifts');
  }

  async getShiftById(shiftId: string): Promise<Shift> {
    return this.fetchApi<Shift>(`/shifts/${shiftId}`);
  }

  async createShift(shiftData: CreateShiftRequest): Promise<Shift> {
    return this.fetchApi<Shift>('/shifts', {
      method: 'POST',
      body: JSON.stringify(shiftData),
    });
  }

  async updateShift(shiftId: string, shiftData: Partial<CreateShiftRequest>): Promise<Shift> {
    return this.fetchApi<Shift>(`/shifts/${shiftId}`, {
      method: 'PUT',
      body: JSON.stringify(shiftData),
    });
  }

  async deleteShift(shiftId: string): Promise<{ success: boolean; message: string }> {
    return this.fetchApi<{ success: boolean; message: string }>(`/shifts/${shiftId}`, {
      method: 'DELETE',
    });
  }

  // Employee assignment methods
  async assignEmployeeToShift(shiftId: string, employeeId: string): Promise<Shift> {
    const requestData: AssignEmployeeRequest = { employeeId };
    return this.fetchApi<Shift>(`/shifts/${shiftId}/assign`, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async removeEmployeeFromShift(shiftId: string, employeeId: string): Promise<Shift> {
    const requestData: AssignEmployeeRequest = { employeeId };
    return this.fetchApi<Shift>(`/shifts/${shiftId}/remove`, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  // Employee-related methods
  async getAllEmployees(): Promise<Employee[]> {
    return this.fetchApi<Employee[]>('/employees');
  }

  async getActiveEmployees(): Promise<Employee[]> {
    const employees = await this.getAllEmployees();
    return employees.filter(emp => emp.status === 'active');
  }

  async getEmployeeById(employeeId: string): Promise<Employee> {
    return this.fetchApi<Employee>(`/employees/${employeeId}`);
  }

  // Batch operations
  async batchAssignEmployees(shiftId: string, employeeIds: string[]): Promise<Shift> {
    return this.fetchApi<Shift>(`/shifts/${shiftId}/batch-assign`, {
      method: 'POST',
      body: JSON.stringify({ employeeIds }),
    });
  }

  // Utility methods
  async checkShiftConflicts(employeeId: string, startTime: string, endTime: string): Promise<boolean> {
    return this.fetchApi<boolean>('/shifts/check-conflicts', {
      method: 'POST',
      body: JSON.stringify({ employeeId, startTime, endTime }),
    });
  }

  // Statistics
  async getShiftStatistics(): Promise<{
    totalShifts: number;
    totalAssignedEmployees: number;
    shiftsPerDay: Record<string, number>;
  }> {
    return this.fetchApi('/shifts/statistics');
  }
}

// Create and export singleton instance
export const shiftService = new ShiftService();

// Alternative: Export class for testing/mocking purposes
export default ShiftService;
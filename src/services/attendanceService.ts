import Attendance, { IAttendance } from '../models/Attendance';

// Service to calculate attendance statistics
export class AttendanceService {
  
  // Calculate hours between two times
  static calculateHours(startTime: string, endTime: string | null): number {
    if (!startTime || !endTime) return 0;
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    return (end - start) / (1000 * 60 * 60);
  }

  // Get attendance summary for employee
  static async getEmployeeSummary(employeeId: string, startDate?: string, endDate?: string) {
    const query: any = { employeeId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const records = await Attendance.find(query).sort({ date: -1 });
    
    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'present').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const totalHours = records.reduce((sum, record) => sum + record.totalHours, 0);
    const averageHours = totalDays > 0 ? totalHours / presentDays : 0;
    
    return {
      totalDays,
      presentDays,
      absentDays,
      totalHours: parseFloat(totalHours.toFixed(2)),
      averageHours: parseFloat(averageHours.toFixed(2)),
      attendanceRate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
    };
  }

  // Get team statistics for supervisor
  static async getTeamStatistics(supervisorId: string, date: string) {
    const records = await Attendance.find({
      date,
      supervisorId
    });

    const totalEmployees = records.length;
    const presentEmployees = records.filter(r => r.status === 'present').length;
    const checkedInEmployees = records.filter(r => r.isCheckedIn).length;
    const onBreakEmployees = records.filter(r => r.isOnBreak).length;
    const averageHours = records.reduce((sum, r) => sum + r.totalHours, 0) / presentEmployees || 0;

    return {
      totalEmployees,
      presentEmployees,
      checkedInEmployees,
      onBreakEmployees,
      attendanceRate: totalEmployees > 0 ? Math.round((presentEmployees / totalEmployees) * 100) : 0,
      averageHours: parseFloat(averageHours.toFixed(2))
    };
  }

  // Generate monthly report
  static async generateMonthlyReport(employeeId: string, year: number, month: number) {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

    const records = await Attendance.find({
      employeeId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 });

    const summary = await this.getEmployeeSummary(employeeId, startDate, endDate);

    return {
      employeeId,
      year,
      month,
      records,
      summary,
      totalWorkingDays: summary.totalDays,
      presentDays: summary.presentDays,
      absentDays: summary.absentDays,
      totalHoursWorked: summary.totalHours
    };
  }

  // Check if employee can check in
  static async canCheckIn(employeeId: string, date: string): Promise<boolean> {
    const existing = await Attendance.findOne({ employeeId, date });
    return !existing || !existing.isCheckedIn;
  }

  // Check if employee can check out
  static async canCheckOut(employeeId: string, date: string): Promise<boolean> {
    const existing = await Attendance.findOne({ employeeId, date });
    return existing?.isCheckedIn === true && !existing.checkOutTime;
  }

  // Check if employee can take break
  static async canTakeBreak(employeeId: string, date: string): Promise<boolean> {
    const existing = await Attendance.findOne({ employeeId, date });
    return existing?.isCheckedIn === true && !existing.isOnBreak && !existing.breakStartTime;
  }

  // Check if employee can end break
  static async canEndBreak(employeeId: string, date: string): Promise<boolean> {
    const existing = await Attendance.findOne({ employeeId, date });
    return existing?.isOnBreak === true && !existing.breakEndTime;
  }
}
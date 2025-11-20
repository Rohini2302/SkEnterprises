// src/components/hrms/tabs/AttendanceTab.tsx
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  Search, 
  Calendar, 
  Users, 
  UserCheck, 
  AlertCircle, 
  Clock,
  TrendingUp,
  BarChart3,
  List,
  Eye,
  Filter,
  Building2,
  X,
  ArrowLeft
} from "lucide-react";
import { Attendance } from "./types";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';

interface AttendanceTabProps {
  attendance: Attendance[];
  setAttendance: React.Dispatch<React.SetStateAction<Attendance[]>>;
}

// Extended dummy data for attendance with detailed site information
const extendedAttendanceData: Attendance[] = [
  // GLOBAL SQUARE, YERWADA (HOUSEKEEPING) - 15 employees
  {
    id: '1',
    employeeId: 'EMP001',
    employeeName: 'Rajesh Kumar',
    department: 'Housekeeping',
    site: 'GLOBAL SQUARE, YERWADA (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '08:30 AM',
    checkOut: '05:30 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '2',
    employeeId: 'EMP002',
    employeeName: 'Priya Sharma',
    department: 'Housekeeping',
    site: 'GLOBAL SQUARE, YERWADA (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '08:00 AM',
    checkOut: '05:00 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '3',
    employeeId: 'EMP003',
    employeeName: 'Amit Sharma',
    department: 'Housekeeping',
    site: 'GLOBAL SQUARE, YERWADA (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '08:15 AM',
    checkOut: '05:15 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '4',
    employeeId: 'EMP004',
    employeeName: 'Sanjay Patel',
    department: 'Housekeeping',
    site: 'GLOBAL SQUARE, YERWADA (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '08:45 AM',
    checkOut: '05:45 PM',
    status: 'present',
    lateBy: '15 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '5',
    employeeId: 'EMP005',
    employeeName: 'Anjali Singh',
    department: 'Housekeeping',
    site: 'GLOBAL SQUARE, YERWADA (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '09:05 AM',
    checkOut: '06:05 PM',
    status: 'present',
    lateBy: '35 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '6',
    employeeId: 'EMP006',
    employeeName: 'Vikram Singh',
    department: 'Housekeeping',
    site: 'GLOBAL SQUARE, YERWADA (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '08:20 AM',
    checkOut: '05:20 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '7',
    employeeId: 'EMP007',
    employeeName: 'Sunita Reddy',
    department: 'Housekeeping',
    site: 'GLOBAL SQUARE, YERWADA (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '08:10 AM',
    checkOut: '05:10 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '8',
    employeeId: 'EMP008',
    employeeName: 'Kiran Nair',
    department: 'Housekeeping',
    site: 'GLOBAL SQUARE, YERWADA (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '08:25 AM',
    checkOut: '05:25 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '9',
    employeeId: 'EMP009',
    employeeName: 'Mohan Das',
    department: 'Housekeeping',
    site: 'GLOBAL SQUARE, YERWADA (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '08:35 AM',
    checkOut: '05:35 PM',
    status: 'present',
    lateBy: '5 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '10',
    employeeId: 'EMP010',
    employeeName: 'Suresh Iyer',
    department: 'Housekeeping',
    site: 'GLOBAL SQUARE, YERWADA (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '08:40 AM',
    checkOut: '05:40 PM',
    status: 'present',
    lateBy: '10 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '11',
    employeeId: 'EMP011',
    employeeName: 'Ritu Nair',
    department: 'Housekeeping',
    site: 'GLOBAL SQUARE, YERWADA (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '08:05 AM',
    checkOut: '05:05 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '12',
    employeeId: 'EMP012',
    employeeName: 'Deepak Mehta',
    department: 'Housekeeping',
    site: 'GLOBAL SQUARE, YERWADA (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '08:50 AM',
    checkOut: '05:50 PM',
    status: 'present',
    lateBy: '20 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '13',
    employeeId: 'EMP013',
    employeeName: 'Neha Joshi',
    department: 'Housekeeping',
    site: 'GLOBAL SQUARE, YERWADA (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '-',
    checkOut: '-',
    status: 'absent',
    lateBy: '-',
    earlyDeparture: '-',
    totalHours: '0h',
    overtime: '0 mins'
  },
  {
    id: '14',
    employeeId: 'EMP014',
    employeeName: 'Prakash Joshi',
    department: 'Housekeeping',
    site: 'GLOBAL SQUARE, YERWADA (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '-',
    checkOut: '-',
    status: 'absent',
    lateBy: '-',
    earlyDeparture: '-',
    totalHours: '0h',
    overtime: '0 mins'
  },
  {
    id: '15',
    employeeId: 'EMP015',
    employeeName: 'Laxmi Kumar',
    department: 'Housekeeping',
    site: 'GLOBAL SQUARE, YERWADA (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '08:55 AM',
    checkOut: '05:55 PM',
    status: 'present',
    lateBy: '25 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },

  // GLOBAL SQUARE, YERWADA (SECURITY) - 8 employees
  {
    id: '16',
    employeeId: 'EMP016',
    employeeName: 'Ramesh Gupta',
    department: 'Security',
    site: 'GLOBAL SQUARE, YERWADA (SECURITY)',
    date: '2024-01-15',
    checkIn: '08:00 AM',
    checkOut: '08:00 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '12h 0m',
    overtime: '4h 0m'
  },
  {
    id: '17',
    employeeId: 'EMP017',
    employeeName: 'Suresh Mehta',
    department: 'Security',
    site: 'GLOBAL SQUARE, YERWADA (SECURITY)',
    date: '2024-01-15',
    checkIn: '08:00 AM',
    checkOut: '08:00 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '12h 0m',
    overtime: '4h 0m'
  },
  {
    id: '18',
    employeeId: 'EMP018',
    employeeName: 'Anil Kapoor',
    department: 'Security',
    site: 'GLOBAL SQUARE, YERWADA (SECURITY)',
    date: '2024-01-15',
    checkIn: '08:00 AM',
    checkOut: '08:00 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '12h 0m',
    overtime: '4h 0m'
  },
  {
    id: '19',
    employeeId: 'EMP019',
    employeeName: 'Rahul Sharma',
    department: 'Security',
    site: 'GLOBAL SQUARE, YERWADA (SECURITY)',
    date: '2024-01-15',
    checkIn: '08:00 AM',
    checkOut: '08:00 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '12h 0m',
    overtime: '4h 0m'
  },
  {
    id: '20',
    employeeId: 'EMP020',
    employeeName: 'Priyanka Singh',
    department: 'Security',
    site: 'GLOBAL SQUARE, YERWADA (SECURITY)',
    date: '2024-01-15',
    checkIn: '08:00 AM',
    checkOut: '08:00 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '12h 0m',
    overtime: '4h 0m'
  },
  {
    id: '21',
    employeeId: 'EMP021',
    employeeName: 'Vikram Yadav',
    department: 'Security',
    site: 'GLOBAL SQUARE, YERWADA (SECURITY)',
    date: '2024-01-15',
    checkIn: '08:00 AM',
    checkOut: '08:00 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '12h 0m',
    overtime: '4h 0m'
  },
  {
    id: '22',
    employeeId: 'EMP022',
    employeeName: 'Sunil Kumar',
    department: 'Security',
    site: 'GLOBAL SQUARE, YERWADA (SECURITY)',
    date: '2024-01-15',
    checkIn: '08:00 AM',
    checkOut: '08:00 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '12h 0m',
    overtime: '4h 0m'
  },
  {
    id: '23',
    employeeId: 'EMP023',
    employeeName: 'Anita Desai',
    department: 'Security',
    site: 'GLOBAL SQUARE, YERWADA (SECURITY)',
    date: '2024-01-15',
    checkIn: '08:00 AM',
    checkOut: '08:00 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '12h 0m',
    overtime: '4h 0m'
  },

  // MANGALWAR PETH - 12 employees (2 absent)
  {
    id: '24',
    employeeId: 'EMP024',
    employeeName: 'Arun Reddy',
    department: 'Housekeeping',
    site: 'MANGALWAR PETH',
    date: '2024-01-15',
    checkIn: '07:45 AM',
    checkOut: '04:45 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '25',
    employeeId: 'EMP025',
    employeeName: 'Kavita Patel',
    department: 'Housekeeping',
    site: 'MANGALWAR PETH',
    date: '2024-01-15',
    checkIn: '08:35 AM',
    checkOut: '05:25 PM',
    status: 'present',
    lateBy: '5 mins',
    earlyDeparture: '5 mins',
    totalHours: '8h 50m',
    overtime: '0 mins'
  },
  {
    id: '26',
    employeeId: 'EMP026',
    employeeName: 'Meera Iyer',
    department: 'Housekeeping',
    site: 'MANGALWAR PETH',
    date: '2024-01-15',
    checkIn: '07:50 AM',
    checkOut: '04:50 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '27',
    employeeId: 'EMP027',
    employeeName: 'Sonia Das',
    department: 'Housekeeping',
    site: 'MANGALWAR PETH',
    date: '2024-01-15',
    checkIn: '08:10 AM',
    checkOut: '05:10 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '28',
    employeeId: 'EMP028',
    employeeName: 'Pooja Mehta',
    department: 'Housekeeping',
    site: 'MANGALWAR PETH',
    date: '2024-01-15',
    checkIn: '08:20 AM',
    checkOut: '05:20 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '29',
    employeeId: 'EMP029',
    employeeName: 'Ritu Nair',
    department: 'Housekeeping',
    site: 'MANGALWAR PETH',
    date: '2024-01-15',
    checkIn: '08:05 AM',
    checkOut: '05:05 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '30',
    employeeId: 'EMP030',
    employeeName: 'Sanjay Verma',
    department: 'Housekeeping',
    site: 'MANGALWAR PETH',
    date: '2024-01-15',
    checkIn: '08:15 AM',
    checkOut: '05:15 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '31',
    employeeId: 'EMP031',
    employeeName: 'Anjali Reddy',
    department: 'Housekeeping',
    site: 'MANGALWAR PETH',
    date: '2024-01-15',
    checkIn: '08:25 AM',
    checkOut: '05:25 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '32',
    employeeId: 'EMP032',
    employeeName: 'Vikram Singh',
    department: 'Housekeeping',
    site: 'MANGALWAR PETH',
    date: '2024-01-15',
    checkIn: '-',
    checkOut: '-',
    status: 'absent',
    lateBy: '-',
    earlyDeparture: '-',
    totalHours: '0h',
    overtime: '0 mins'
  },
  {
    id: '33',
    employeeId: 'EMP033',
    employeeName: 'Sunita Sharma',
    department: 'Housekeeping',
    site: 'MANGALWAR PETH',
    date: '2024-01-15',
    checkIn: '-',
    checkOut: '-',
    status: 'absent',
    lateBy: '-',
    earlyDeparture: '-',
    totalHours: '0h',
    overtime: '0 mins'
  },
  {
    id: '34',
    employeeId: 'EMP034',
    employeeName: 'Rajeshwari Iyer',
    department: 'Housekeeping',
    site: 'MANGALWAR PETH',
    date: '2024-01-15',
    checkIn: '08:30 AM',
    checkOut: '05:30 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '35',
    employeeId: 'EMP035',
    employeeName: 'Mohan Kumar',
    department: 'Housekeeping',
    site: 'MANGALWAR PETH',
    date: '2024-01-15',
    checkIn: '08:40 AM',
    checkOut: '05:40 PM',
    status: 'present',
    lateBy: '10 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },

  // GANGA TRUENO (HOUSEKEEPING) - 10 employees (1 absent)
  {
    id: '36',
    employeeId: 'EMP036',
    employeeName: 'Ravi Shankar',
    department: 'Housekeeping',
    site: 'GANGA TRUENO (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '08:00 AM',
    checkOut: '05:00 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '37',
    employeeId: 'EMP037',
    employeeName: 'Sneha Patel',
    department: 'Housekeeping',
    site: 'GANGA TRUENO (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '08:10 AM',
    checkOut: '05:10 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '38',
    employeeId: 'EMP038',
    employeeName: 'Ankit Verma',
    department: 'Housekeeping',
    site: 'GANGA TRUENO (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '08:15 AM',
    checkOut: '05:15 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '39',
    employeeId: 'EMP039',
    employeeName: 'Priya Reddy',
    department: 'Housekeeping',
    site: 'GANGA TRUENO (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '08:20 AM',
    checkOut: '05:20 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '40',
    employeeId: 'EMP040',
    employeeName: 'Raj Kumar',
    department: 'Housekeeping',
    site: 'GANGA TRUENO (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '08:25 AM',
    checkOut: '05:25 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '41',
    employeeId: 'EMP041',
    employeeName: 'Sunil Sharma',
    department: 'Housekeeping',
    site: 'GANGA TRUENO (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '08:30 AM',
    checkOut: '05:30 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '42',
    employeeId: 'EMP042',
    employeeName: 'Anjali Kapoor',
    department: 'Housekeeping',
    site: 'GANGA TRUENO (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '08:35 AM',
    checkOut: '05:35 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '43',
    employeeId: 'EMP043',
    employeeName: 'Vikram Desai',
    department: 'Housekeeping',
    site: 'GANGA TRUENO (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '08:40 AM',
    checkOut: '05:40 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  },
  {
    id: '44',
    employeeId: 'EMP044',
    employeeName: 'Pooja Singh',
    department: 'Housekeeping',
    site: 'GANGA TRUENO (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '-',
    checkOut: '-',
    status: 'absent',
    lateBy: '-',
    earlyDeparture: '-',
    totalHours: '0h',
    overtime: '0 mins'
  },
  {
    id: '45',
    employeeId: 'EMP045',
    employeeName: 'Rahul Mehta',
    department: 'Housekeeping',
    site: 'GANGA TRUENO (HOUSEKEEPING)',
    date: '2024-01-15',
    checkIn: '08:45 AM',
    checkOut: '05:45 PM',
    status: 'present',
    lateBy: '0 mins',
    earlyDeparture: '0 mins',
    totalHours: '9h 0m',
    overtime: '0 mins'
  }
];

// Site-wise attendance summary
const siteWiseSummary = [
  {
    site: 'GLOBAL SQUARE, YERWADA (HOUSEKEEPING)',
    totalEmployees: 15,
    present: 13,
    absent: 2,
    lateArrivals: 4,
    earlyDepartures: 0,
    attendanceRate: '86.7%',
    shortage: 2,
    services: 'Housekeeping Services'
  },
  {
    site: 'GLOBAL SQUARE, YERWADA (SECURITY)',
    totalEmployees: 8,
    present: 8,
    absent: 0,
    lateArrivals: 0,
    earlyDepartures: 0,
    attendanceRate: '100%',
    shortage: 0,
    services: 'Security Services'
  },
  {
    site: 'MANGALWAR PETH',
    totalEmployees: 12,
    present: 10,
    absent: 2,
    lateArrivals: 2,
    earlyDepartures: 1,
    attendanceRate: '83.3%',
    shortage: 2,
    services: 'Housekeeping & Maintenance'
  },
  {
    site: 'GANGA TRUENO (HOUSEKEEPING)',
    totalEmployees: 10,
    present: 9,
    absent: 1,
    lateArrivals: 0,
    earlyDepartures: 0,
    attendanceRate: '90.0%',
    shortage: 1,
    services: 'Housekeeping Services'
  },
  {
    site: 'K.P. BUNGLOW (HOUSEKEEPING)',
    totalEmployees: 6,
    present: 5,
    absent: 1,
    lateArrivals: 0,
    earlyDepartures: 0,
    attendanceRate: '83.3%',
    shortage: 1,
    services: 'Housekeeping Services'
  },
  {
    site: 'ALYSSUM DEVELOPERS PVT. LTD.',
    totalEmployees: 25,
    present: 21,
    absent: 4,
    lateArrivals: 2,
    earlyDepartures: 1,
    attendanceRate: '84.0%',
    shortage: 4,
    services: 'Complete Facility Management'
  },
  {
    site: 'ARYA ASSOCIATES',
    totalEmployees: 20,
    present: 18,
    absent: 2,
    lateArrivals: 1,
    earlyDepartures: 0,
    attendanceRate: '90.0%',
    shortage: 2,
    services: 'Security & Housekeeping'
  },
  {
    site: 'ASTITVA ASSET MANAGEMENT LLP',
    totalEmployees: 22,
    present: 19,
    absent: 3,
    lateArrivals: 2,
    earlyDepartures: 1,
    attendanceRate: '86.4%',
    shortage: 3,
    services: 'Complete Facility Management'
  }
];

// Chart color constants
const CHART_COLORS = {
  present: '#10b981',
  absent: '#ef4444',
  late: '#f59e0b',
  sites: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16', '#f97316']
};

// Pagination Component
const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  totalItems,
  itemsPerPage 
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}) => {
  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground">
        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          First
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }

          return (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </Button>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          Last
        </Button>
      </div>
    </div>
  );
};

// StatCard Component
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  className = "",
  trend 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  className?: string;
  trend?: { value: number; isPositive: boolean };
}) => {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <p className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </p>
            )}
          </div>
          <Icon className="h-8 w-8 opacity-70" />
        </div>
      </CardContent>
    </Card>
  );
};

// Safe site name formatting function
const formatSiteName = (site: string | undefined) => {
  if (!site) return { shortName: 'Unknown Site', details: '' };
  
  const parts = site.split(',');
  const shortName = parts[0] || 'Unknown Site';
  const details = parts.slice(1).join(',').trim() || '';
  
  return { shortName, details };
};

const AttendanceTab = ({ attendance = extendedAttendanceData }: AttendanceTabProps) => {
  const [attendancePage, setAttendancePage] = useState(1);
  const [sitePage, setSitePage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("site-overview");
  
  // Search and filter states
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [siteSearch, setSiteSearch] = useState('');
  const [siteFilter, setSiteFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '2024-01-15',
    end: '2024-01-15'
  });

  // Calculate attendance summary
  const attendanceSummary = {
    total: attendance.length,
    present: attendance.filter(a => a.status === "present").length,
    absent: attendance.filter(a => a.status === "absent").length,
    late: attendance.filter(a => a.lateBy !== '-' && a.lateBy !== '0 mins').length,
    earlyDepartures: attendance.filter(a => a.earlyDeparture !== '-' && a.earlyDeparture !== '0 mins').length
  };

  // Filter functions with safe site handling
  const filteredEmployeeAttendance = attendance.filter(employee => {
    const matchesSearch = employee.employeeName.toLowerCase().includes(employeeSearch.toLowerCase());
    const matchesSite = siteFilter === 'all' || employee.site === siteFilter;
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    
    return matchesSearch && matchesSite && matchesStatus;
  });

  const filteredSites = siteWiseSummary.filter(site =>
    site.site.toLowerCase().includes(siteSearch.toLowerCase())
  );

  // Get site-specific employee data
  const getEmployeesBySite = (siteName: string) => {
    return attendance.filter(employee => employee.site === siteName);
  };

  // Get site statistics
  const getSiteStatistics = (siteName: string) => {
    const siteEmployees = getEmployeesBySite(siteName);
    return {
      total: siteEmployees.length,
      present: siteEmployees.filter(emp => emp.status === 'present').length,
      absent: siteEmployees.filter(emp => emp.status === 'absent').length,
      late: siteEmployees.filter(emp => emp.lateBy !== '-' && emp.lateBy !== '0 mins').length,
      attendanceRate: ((siteEmployees.filter(emp => emp.status === 'present').length / siteEmployees.length) * 100).toFixed(1) + '%'
    };
  };

  // Handle view site details
  const handleViewSiteDetails = (siteName: string) => {
    setSiteFilter(siteName);
    setActiveTab("employee-details");
  };

  // Handle clear site filter
  const handleClearSiteFilter = () => {
    setSiteFilter('all');
    setStatusFilter('all');
    setEmployeeSearch('');
  };

  // Pagination calculations
  const employeeTotalPages = Math.ceil(filteredEmployeeAttendance.length / itemsPerPage);
  const siteTotalPages = Math.ceil(filteredSites.length / itemsPerPage);

  const paginatedEmployeeAttendance = filteredEmployeeAttendance.slice(
    (attendancePage - 1) * itemsPerPage,
    attendancePage * itemsPerPage
  );

  const paginatedSites = filteredSites.slice(
    (sitePage - 1) * itemsPerPage,
    sitePage * itemsPerPage
  );

  // Get unique values for filters with safe site handling
  const uniqueSites = [...new Set(attendance.map(emp => emp.site).filter(Boolean))];

  // Prepare site-wise chart data
  const prepareSiteWiseChartData = useMemo(() => {
    return filteredSites.map((site, index) => {
      const fullSiteName = site.site;
      let shortLabel = fullSiteName;
      
      if (fullSiteName.includes('GLOBAL SQUARE')) {
        shortLabel = fullSiteName.includes('HOUSEKEEPING') ? 'GLOBAL SQ (HK)' : 'GLOBAL SQ (SEC)';
      } else if (fullSiteName.includes('MANGALWAR')) {
        shortLabel = 'MANGALWAR';
      } else if (fullSiteName.includes('GANGA TRUENO')) {
        shortLabel = 'GANGA TRUENO';
      } else if (fullSiteName.includes('K.P. BUNGLOW')) {
        shortLabel = 'K.P. BUNGLOW';
      } else if (fullSiteName.includes('ALYSSUM')) {
        shortLabel = 'ALYSSUM';
      } else if (fullSiteName.includes('ARYA')) {
        shortLabel = 'ARYA';
      } else if (fullSiteName.includes('ASTITVA')) {
        shortLabel = 'ASTITVA';
      } else {
        shortLabel = fullSiteName.split(',')[0]?.substring(0, 12) || fullSiteName.substring(0, 12);
      }
      
      return {
        name: shortLabel,
        fullName: fullSiteName,
        present: site.present,
        absent: site.absent,
        total: site.totalEmployees,
        attendanceRate: parseFloat(site.attendanceRate),
        lateArrivals: site.lateArrivals,
        services: site.services,
        fill: CHART_COLORS.sites[index % CHART_COLORS.sites.length]
      };
    });
  }, [filteredSites]);

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold text-sm mb-2">{data.fullName}</p>
          <p className="text-xs text-muted-foreground mb-2">{data.services}</p>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between">
              <span className="text-green-600">Present:</span>
              <span className="font-medium">{data.present}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-red-600">Absent:</span>
              <span className="font-medium">{data.absent}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-medium">{data.total}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-blue-600">Attendance Rate:</span>
              <span className="font-medium">{data.attendanceRate}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Customized axis tick for bar chart
  const CustomizedAxisTick = (props: any) => {
    const { x, y, payload } = props;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={16} 
          textAnchor="end"
          fill="#6b7280"
          fontSize={12}
          transform="rotate(-35)"
        >
          {payload.value}
        </text>
      </g>
    );
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "present": return "default";
      case "absent": return "destructive";
      case "late": return "secondary";
      case "half-day": return "outline";
      default: return "outline";
    }
  };

  const handleExportAttendance = (type: string) => {
    console.log(`Exporting ${type} attendance data...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Attendance Management System</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleExportAttendance('employee')}>
            <Download className="mr-2 h-4 w-4" />
            Export Employee Data
          </Button>
          <Button variant="outline" onClick={() => handleExportAttendance('site')}>
            <Download className="mr-2 h-4 w-4" />
            Export Site Data
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Date Range:</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="w-32"
              />
              <span className="text-sm">to</span>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="w-32"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Employees" 
          value={attendanceSummary.total} 
          icon={Users}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard 
          title="Present Today" 
          value={attendanceSummary.present} 
          icon={UserCheck}
          className="text-green-600"
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard 
          title="Absent Today" 
          value={attendanceSummary.absent} 
          icon={AlertCircle}
          className="text-red-600"
          trend={{ value: 2, isPositive: false }}
        />
        <StatCard 
          title="Late Arrivals" 
          value={attendanceSummary.late} 
          icon={Clock}
          className="text-orange-600"
          trend={{ value: 1, isPositive: false }}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="site-overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Site Overview
          </TabsTrigger>
          <TabsTrigger value="employee-details" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Employee Details
          </TabsTrigger>
        </TabsList>

        {/* Site Overview Tab */}
        <TabsContent value="site-overview" className="space-y-6">
          {/* Site Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by site name..."
                    value={siteSearch}
                    onChange={(e) => setSiteSearch(e.target.value)}
                    className="w-full sm:w-64"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Bar Chart */}
          <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Site-wise Attendance Distribution
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Visual representation of present vs absent employees across all sites
                  </p>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {dateRange.start}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-80 bg-white rounded-lg p-2 border border-blue-100">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={prepareSiteWiseChartData}
                    margin={{ top: 20, right: 30, left: 40, bottom: 80 }}
                    barSize={35}
                    barGap={4}
                    barCategoryGap={8}
                  >
                    <defs>
                      <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.8}/>
                      </linearGradient>
                      <linearGradient id="absentGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#dc2626" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#f3f4f6" 
                      vertical={false}
                      strokeOpacity={0.6}
                    />
                    <XAxis 
                      dataKey="name" 
                      tick={<CustomizedAxisTick />}
                      interval={0}
                      height={80}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      fontSize={12} 
                      tick={{ fill: '#6b7280' }}
                      width={45}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickLine={{ stroke: '#e5e7eb' }}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                      content={<CustomBarTooltip />}
                      cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }}
                    />
                    <Legend 
                      wrapperStyle={{ 
                        paddingTop: '20px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                      iconSize={10}
                      iconType="circle"
                    />
                    <Bar 
                      dataKey="present" 
                      name="Present Employees" 
                      fill="url(#presentGradient)" 
                      radius={[6, 6, 0, 0]}
                      stroke="#059669"
                      strokeWidth={1}
                    />
                    <Bar 
                      dataKey="absent" 
                      name="Absent Employees" 
                      fill="url(#absentGradient)" 
                      radius={[6, 6, 0, 0]}
                      stroke="#dc2626"
                      strokeWidth={1}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                  <span>Present Employees</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></div>
                  <span>Absent Employees</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Site-wise Attendance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Site-wise Attendance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="min-w-[200px] font-semibold text-gray-900">Site Name</TableHead>
                      <TableHead className="min-w-[120px] font-semibold text-gray-900">Services</TableHead>
                      <TableHead className="min-w-[100px] font-semibold text-gray-900">Date</TableHead>
                      <TableHead className="min-w-[80px] font-semibold text-gray-900">Total</TableHead>
                      <TableHead className="min-w-[80px] font-semibold text-gray-900">Present</TableHead>
                      <TableHead className="min-w-[80px] font-semibold text-gray-900">Absent</TableHead>
                      <TableHead className="min-w-[80px] font-semibold text-gray-900">Late</TableHead>
                      <TableHead className="min-w-[100px] font-semibold text-gray-900">Attendance Rate</TableHead>
                      <TableHead className="min-w-[80px] font-semibold text-gray-900">Shortage</TableHead>
                      <TableHead className="min-w-[100px] font-semibold text-gray-900">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSites.map((site, index) => {
                      const { shortName, details } = formatSiteName(site.site);
                      const siteStats = getSiteStatistics(site.site);
                      return (
                        <TableRow key={index} className={`hover:bg-gray-50/80 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <TableCell className="font-medium min-w-[200px]">
                            <div>
                              <p className="font-semibold text-sm text-gray-900">{shortName}</p>
                              {details && (
                                <p className="text-xs text-muted-foreground">{details}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[120px]">
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              {site.services}
                            </Badge>
                          </TableCell>
                          <TableCell className="min-w-[100px] text-sm">{dateRange.start}</TableCell>
                          <TableCell className="min-w-[80px] font-medium text-gray-900">{site.totalEmployees}</TableCell>
                          <TableCell className="min-w-[80px] text-green-600 font-semibold">{site.present}</TableCell>
                          <TableCell className="min-w-[80px] text-red-600 font-semibold">{site.absent}</TableCell>
                          <TableCell className="min-w-[80px]">
                            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 text-xs">
                              {site.lateArrivals}
                            </Badge>
                          </TableCell>
                          <TableCell className="min-w-[100px]">
                            <Badge variant={
                              parseFloat(site.attendanceRate) > 90 ? 'default' :
                              parseFloat(site.attendanceRate) > 80 ? 'secondary' : 'destructive'
                            } className="font-medium text-xs">
                              {site.attendanceRate}
                            </Badge>
                          </TableCell>
                          <TableCell className="min-w-[80px] text-red-600 font-semibold">{site.shortage}</TableCell>
                          <TableCell className="min-w-[100px]">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                              onClick={() => handleViewSiteDetails(site.site)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {filteredSites.length > 0 && (
                <Pagination
                  currentPage={sitePage}
                  totalPages={siteTotalPages}
                  totalItems={filteredSites.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setSitePage}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employee Details Tab */}
        <TabsContent value="employee-details" className="space-y-6">
          {/* Back to Overview Button */}
          {siteFilter !== 'all' && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setActiveTab("site-overview")}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Overview
                    </Button>
                    <div>
                      <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {formatSiteName(siteFilter).shortName}
                      </h3>
                      <p className="text-sm text-blue-600 mt-1">
                        {formatSiteName(siteFilter).details}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-600 font-medium">
                        {getSiteStatistics(siteFilter).present} Present
                      </span>
                      <span className="text-red-600 font-medium">
                        {getSiteStatistics(siteFilter).absent} Absent
                      </span>
                      <span className="text-orange-600 font-medium">
                        {getSiteStatistics(siteFilter).late} Late Arrivals
                      </span>
                      <span className="text-blue-600 font-medium">
                        {getSiteStatistics(siteFilter).attendanceRate} Attendance Rate
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleClearSiteFilter}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear Filter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Employee Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by employee name..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="w-full sm:w-64"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={siteFilter} onValueChange={setSiteFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Sites" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sites</SelectItem>
                      {uniqueSites.map(site => {
                        const { shortName } = formatSiteName(site);
                        return (
                          <SelectItem key={site} value={site}>{shortName}</SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                    </SelectContent>
                  </Select>

                  {siteFilter !== 'all' && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-md border border-blue-200">
                      <Filter className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">
                        {getSiteStatistics(siteFilter).present} Present, {getSiteStatistics(siteFilter).absent} Absent
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employee Attendance Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                {siteFilter !== 'all' ? 
                  `Employee Details - ${formatSiteName(siteFilter).shortName}` : 
                  'All Employee Attendance Details'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="min-w-[120px] font-semibold text-gray-900">Employee ID</TableHead>
                      <TableHead className="min-w-[150px] font-semibold text-gray-900">Employee Name</TableHead>
                      <TableHead className="min-w-[200px] font-semibold text-gray-900">Site</TableHead>
                      <TableHead className="min-w-[100px] font-semibold text-gray-900">Date</TableHead>
                      <TableHead className="min-w-[100px] font-semibold text-gray-900">Check In</TableHead>
                      <TableHead className="min-w-[100px] font-semibold text-gray-900">Check Out</TableHead>
                      <TableHead className="min-w-[100px] font-semibold text-gray-900">Status</TableHead>
                      <TableHead className="min-w-[100px] font-semibold text-gray-900">Late By</TableHead>
                      <TableHead className="min-w-[120px] font-semibold text-gray-900">Early Departure</TableHead>
                      <TableHead className="min-w-[100px] font-semibold text-gray-900">Total Hours</TableHead>
                      <TableHead className="min-w-[100px] font-semibold text-gray-900">Overtime</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEmployeeAttendance.map((employee, index) => {
                      const { shortName, details } = formatSiteName(employee.site);
                      return (
                        <TableRow key={employee.id} className={`hover:bg-gray-50/80 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <TableCell className="font-medium min-w-[120px]">{employee.employeeId}</TableCell>
                          <TableCell className="min-w-[150px] font-semibold text-gray-900">{employee.employeeName}</TableCell>
                          <TableCell className="min-w-[200px]">
                            <div>
                              <p className="text-sm font-medium">{shortName}</p>
                              {details && (
                                <p className="text-xs text-muted-foreground">{details}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[100px] text-sm">{employee.date}</TableCell>
                          <TableCell className="min-w-[100px] font-medium">{employee.checkIn}</TableCell>
                          <TableCell className="min-w-[100px] font-medium">{employee.checkOut}</TableCell>
                          <TableCell className="min-w-[100px]">
                            <Badge variant={getStatusColor(employee.status)} className="text-xs">
                              {employee.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="min-w-[100px]">
                            {employee.lateBy !== '-' && employee.lateBy !== '0 mins' ? (
                              <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 text-xs">
                                {employee.lateBy}
                              </Badge>
                            ) : (
                              <span className="text-green-600 text-xs">On Time</span>
                            )}
                          </TableCell>
                          <TableCell className="min-w-[120px]">
                            {employee.earlyDeparture !== '-' && employee.earlyDeparture !== '0 mins' ? (
                              <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-xs">
                                {employee.earlyDeparture}
                              </Badge>
                            ) : (
                              <span className="text-green-600 text-xs">On Time</span>
                            )}
                          </TableCell>
                          <TableCell className="min-w-[100px] font-medium">{employee.totalHours}</TableCell>
                          <TableCell className="min-w-[100px]">
                            {employee.overtime !== '0 mins' ? (
                              <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-xs">
                                {employee.overtime}
                              </Badge>
                            ) : (
                              <span className="text-gray-500 text-xs">No OT</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {filteredEmployeeAttendance.length > 0 && (
                <Pagination
                  currentPage={attendancePage}
                  totalPages={employeeTotalPages}
                  totalItems={filteredEmployeeAttendance.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setAttendancePage}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AttendanceTab;
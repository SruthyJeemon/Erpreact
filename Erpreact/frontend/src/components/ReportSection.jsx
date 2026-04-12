import React, { useState } from 'react';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import {
  Box,
  Typography,
  Stack,
  IconButton,
  InputBase,
  Button,
  useTheme,
  useMediaQuery,
  Divider,
  Grow,
  Drawer,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Search,
  TrendingUp,
  ShoppingCart,
  Inventory,
  MoveToInbox,
  BarChart,
  Star,
  StarBorder,
  Assignment,
  MonetizationOn,
  Receipt,
  Storefront,
  Person,
  Category,
  History,
  NorthEast,
  AccountBalanceWallet,
  Description,
  Menu as MenuIcon,
  Close as CloseIcon,
  ArrowBack,
  FileDownload,
  Print,
  Refresh,
  FilterAlt
} from '@mui/icons-material';

// ─── Report Detail View Config ──────────────────────────────────────────────
const reportDetailConfig = {
  'Sales Summary': {
    filters: [
      { key: 'reportsPeriod', label: 'Reports Period', type: 'text', placeholder: 'All Dates' },
      { key: 'catalog', label: 'Catalog', type: 'select', options: ['All', 'Retail', 'Wholesale', 'Online'] },
      { key: 'dateFrom', label: 'From Date', type: 'date', defaultValue: '2014-01-01' },
      { key: 'dateTo', label: 'To Date', type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      { key: 'customerName', label: 'Customer Name', type: 'text', placeholder: 'All' },
      { key: 'salesPersonName', label: 'Sales Person Name', type: 'select', options: ['All', 'Ahmed Ali', 'Sara Khan', 'Omar Said', 'Khalid Nasser'] }
    ],
    columns: ['Date', 'Invoice No', 'Customer', 'Salesperson', 'Amount', 'Paid', 'Balance', 'Status'],
    rows: [
      ['2024-03-01', 'INV-0041', 'Al Fardan LLC', 'Ahmed Ali', '12,500.00', '12,500.00', '0.00', 'Paid'],
      ['2024-03-03', 'INV-0042', 'Gulf Trading Co', 'Sara Khan', '8,200.00', '0.00', '8,200.00', 'Unpaid'],
      ['2024-03-05', 'INV-0043', 'Nurac Supplies', 'Ahmed Ali', '5,750.00', '3,000.00', '2,750.00', 'Partial'],
      ['2024-03-07', 'INV-0044', 'Madina Group', 'Omar Said', '21,000.00', '21,000.00', '0.00', 'Paid'],
      ['2024-03-10', 'INV-0045', 'Al Fardan LLC', 'Sara Khan', '3,400.00', '0.00', '3,400.00', 'Unpaid'],
      ['2024-03-12', 'INV-0046', 'Bloom & Co', 'Khalid Nasser', '9,800.00', '9,800.00', '0.00', 'Paid'],
    ]
  },
  'Sales Summary Details': {
    filters: [
      { key: 'reportsPeriod', label: 'Reports Period', type: 'text', placeholder: 'All Dates' },
      { key: 'catalog', label: 'Catalog', type: 'select', options: ['All', 'Retail', 'Wholesale', 'Online'] },
      { key: 'dateFrom', label: 'From Date', type: 'date', defaultValue: '2014-01-01' },
      { key: 'dateTo', label: 'To Date', type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      { key: 'customerName', label: 'Customer Name', type: 'text', placeholder: 'All' },
      { key: 'salesPersonName', label: 'Sales Person Name', type: 'select', options: ['All', 'Ahmed Ali', 'Sara Khan', 'Omar Said', 'Khalid Nasser'] }
    ],
    columns: ['Date', 'Invoice No', 'Product', 'Category', 'Qty', 'Unit Price', 'Total', 'Discount'],
    rows: [
      ['2024-03-01', 'INV-0041', 'Product A', 'Electronics', '10', '250.00', '2,500.00', '0%'],
      ['2024-03-03', 'INV-0042', 'Product B', 'Clothing', '5', '180.00', '900.00', '5%'],
      ['2024-03-05', 'INV-0043', 'Product C', 'Electronics', '2', '1,200.00', '2,400.00', '10%'],
      ['2024-03-07', 'INV-0044', 'Product D', 'Furniture', '1', '3,500.00', '3,500.00', '0%'],
    ]
  },
  'Revenue Report': {
    filters: [
      { key: 'reportsPeriod', label: 'Reports Period', type: 'text', placeholder: 'All Dates' },
      { key: 'catalog', label: 'Catalog', type: 'select', options: ['All', 'Retail', 'Wholesale', 'Online'] },
      { key: 'dateFrom', label: 'From Date', type: 'date', defaultValue: '2014-01-01' },
      { key: 'dateTo', label: 'To Date', type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      { key: 'reportPeriodSelect', label: 'Report Period', type: 'select', options: ['Select', 'Daily', 'Weekly', 'Monthly', 'Yearly'] },
      { key: 'customerName', label: 'Customer Name', type: 'text', placeholder: 'All' },
      { key: 'salesPersonName', label: 'Sales Person Name', type: 'select', options: ['All', 'Ahmed Ali', 'Sara Khan', 'Omar Said', 'Khalid Nasser'] }
    ],
    columns: ['Month', 'Revenue', 'Cost', 'Gross Profit', 'Net Profit', 'Margin %'],
    rows: [
      ['January', '125,400.00', '88,200.00', '37,200.00', '22,500.00', '17.9%'],
      ['February', '118,900.00', '82,400.00', '36,500.00', '21,200.00', '17.8%'],
      ['March', '134,200.00', '91,000.00', '43,200.00', '28,100.00', '20.9%'],
    ]
  },
  'Brand Report': {
    filters: [
      { key: 'reportsPeriod', label: 'Reports Period', type: 'text', placeholder: 'All Dates' },
      { key: 'catalog', label: 'Catalog', type: 'select', options: ['All', 'Retail', 'Wholesale', 'Online'] },
      { key: 'dateFrom', label: 'From Date', type: 'date', defaultValue: '2014-01-01' },
      { key: 'dateTo', label: 'To Date', type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      { key: 'brandName', label: 'Brand Name', type: 'text', placeholder: 'All' },
      { key: 'salesPersonName', label: 'Sales Person Name', type: 'select', options: ['All', 'Ahmed Ali', 'Sara Khan', 'Omar Said', 'Khalid Nasser'] }
    ],
    columns: ['Brand', 'Total Sales', 'Units Sold', 'Revenue', 'Avg Price', 'Growth'],
    rows: [
      ['Brand A', '450', '1,200', '112,500.00', '93.75', '+12.3%'],
      ['Brand B', '320', '890', '78,400.00', '88.09', '+5.1%'],
      ['Brand C', '210', '540', '52,200.00', '96.67', '-2.4%'],
    ]
  },
  'Customer Report': {
    filters: [
      { key: 'reportsPeriod', label: 'Reports Period', type: 'text', placeholder: 'All Dates' },
      { key: 'dateFrom', label: 'From Date', type: 'date', defaultValue: '2014-01-01' },
      { key: 'dateTo', label: 'To Date', type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      { key: 'catalog', label: 'Catelog', type: 'select', options: ['All', 'Retail', 'Wholesale', 'Online'] },
      { key: 'customerName', label: 'Customer Name', type: 'text', placeholder: 'All' },
      { key: 'reportingMethod', label: 'Reporting Method', type: 'select', options: ['Select', 'Summary', 'Detailed'] },
      { key: 'salesPersonName', label: 'Sales Person Name', type: 'text', placeholder: 'All' }
    ],
    columns: ['Customer', 'Area', 'Total Orders', 'Total Amount', 'Balance Due', 'Last Order'],
    rows: [
      ['Al Fardan LLC', 'Dubai', '12', '84,200.00', '5,400.00', '2024-03-10'],
      ['Gulf Trading Co', 'Abu Dhabi', '8', '42,500.00', '8,200.00', '2024-03-03'],
      ['Nurac Supplies', 'Sharjah', '5', '21,000.00', '0.00', '2024-03-05'],
    ]
  },
  'Category Report': {
    filters: [
      { key: 'reportsPeriod', label: 'Reports Period', type: 'text', placeholder: 'All Dates' },
      { key: 'catalog', label: 'Catelog', type: 'select', options: ['All', 'Retail', 'Wholesale', 'Online'] },
      { key: 'dateFrom', label: 'From Date', type: 'date', defaultValue: '2014-01-01' },
      { key: 'dateTo', label: 'To Date', type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      { key: 'categoryName', label: 'Category Name', type: 'text', placeholder: 'All' },
      { key: 'salesPersonName', label: 'Sales Person Name', type: 'text', placeholder: 'All' }
    ],
    columns: ['Category', 'Products', 'Units Sold', 'Revenue', 'Share %'],
    rows: [
      ['Electronics', '45', '2,400', '320,000.00', '38.2%'],
      ['Furniture', '22', '810', '195,000.00', '23.3%'],
      ['Clothing', '88', '4,200', '168,000.00', '20.1%'],
    ]
  },
  'Cost of goods Report': {
    filters: [
      { key: 'reportsPeriod', label: 'Reports Period', type: 'text', placeholder: 'All Dates' },
      { key: 'catalog', label: 'Catelog', type: 'select', options: ['All', 'Retail', 'Wholesale', 'Online'] },
      { key: 'dateFrom', label: 'From Date', type: 'date', defaultValue: '2014-01-01' },
      { key: 'dateTo', label: 'To Date', type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      { key: 'categoryName', label: 'Category Name', type: 'text', placeholder: 'All' },
      { key: 'brandName', label: 'Brand Name', type: 'text', placeholder: 'All' }
    ],
    columns: ['Product', 'Opening Stock', 'Purchased', 'Sold', 'Closing Stock', 'COGS'],
    rows: [
      ['Product A', '100', '500', '480', '120', '96,000.00'],
      ['Product B', '50', '300', '310', '40', '55,800.00'],
    ]
  },
  'Customer Balance Report': {
    filters: [
      { key: 'reportsPeriod', label: 'Reports Period', type: 'text', placeholder: 'All Dates' },
      { key: 'catalog', label: 'Catalog', type: 'select', options: ['All', 'Retail', 'Wholesale', 'Online'] },
      { key: 'dateFrom', label: 'From Date', type: 'date', defaultValue: '2014-01-01' },
      { key: 'dateTo', label: 'To Date', type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      { key: 'customerName', label: 'Customer Name', type: 'text', placeholder: 'All' }
    ],
    columns: ['Customer', 'Phone', 'Total Invoiced', 'Total Paid', 'Balance', 'Overdue'],
    rows: [
      ['Al Fardan LLC', '+971 50 123 4567', '84,200.00', '78,800.00', '5,400.00', 'No'],
      ['Gulf Trading Co', '+971 55 987 6543', '42,500.00', '34,300.00', '8,200.00', 'Yes'],
    ]
  },
  'New & Old Invoice Summary': {
    filters: [
      { key: 'reportsPeriod', label: 'Reports Period', type: 'text', placeholder: 'All Dates' },
      { key: 'catalog', label: 'Catelog', type: 'select', options: ['Select', 'Retail', 'Wholesale', 'Online'] },
      { key: 'dateFrom', label: 'From', type: 'date', defaultValue: '2014-01-01' },
      { key: 'dateTo', label: 'To', type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      { key: 'customerName', label: 'Customer Name', type: 'select', options: ['Select', 'Customer A', 'Customer B'] },
      { key: 'salesPersonName', label: 'Sales Person Name', type: 'select', options: ['Select', 'Ahmed Ali', 'Sara Khan', 'Omar Said'] }
    ],
    columns: ['Invoice No', 'Type', 'Date', 'Customer', 'Amount', 'Status'],
    rows: [
      ['INV-0041', 'New', '2024-03-01', 'Al Fardan LLC', '12,500.00', 'Paid'],
      ['INV-0040', 'Old', '2024-01-15', 'Gulf Trading Co', '5,800.00', 'Unpaid'],
    ]
  },
  'Warehouse Stock': {
    filters: [
      { key: 'warehouseName', label: 'Warehouse Name', type: 'select', options: ['Select', 'Main', 'Branch 1', 'Branch 2'] },
      { key: 'catalog', label: 'Catelog', type: 'select', options: ['Select', 'Retail', 'Wholesale', 'Online'] },
      { key: 'itemName', label: 'Item Name', type: 'text', placeholder: 'Select or type...' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], defaultValue: 'Active' }
    ],
    columns: ['Product', 'Category', 'Warehouse', 'On Hand', 'Reserved', 'Available', 'Unit'],
    rows: [
      ['Product A', 'Electronics', 'Main', '120', '20', '100', 'PCS'],
      ['Product B', 'Clothing', 'Branch 1', '340', '15', '325', 'PCS'],
      ['Product C', 'Furniture', 'Main', '45', '5', '40', 'SET'],
    ]
  },
  'Sales Stock': {
    filters: [
      { key: 'dateFrom', label: 'Date From', type: 'date', placeholder: 'yyyy-mm-dd' },
      { key: 'dateTo', label: 'Date To', type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
    ],
    columns: ['Product', 'Opening', 'IN', 'OUT', 'Closing', 'Unit Cost', 'Total Value'],
    rows: [
      ['Product A', '150', '500', '480', '170', '200.00', '34,000.00'],
      ['Product B', '90', '300', '310', '80', '180.00', '14,400.00'],
    ]
  },
  'Stock Transfer Report': {
    filters: [
      { key: 'warehouseName', label: 'Warehouse Name', type: 'select', options: ['Select', 'Main', 'Branch 1', 'Branch 2'] },
      { key: 'catalog', label: 'Catelog', type: 'select', options: ['Select', 'Retail', 'Wholesale', 'Online'] },
      { key: 'itemName', label: 'Item Name', type: 'text', placeholder: 'Select or type...' }
    ],
    columns: ['Date', 'Ref No', 'Product', 'From', 'To', 'Qty', 'Status'],
    rows: [
      ['2024-03-01', 'TRF-001', 'Product A', 'Main', 'Branch 1', '50', 'Completed'],
      ['2024-03-05', 'TRF-002', 'Product B', 'Branch 1', 'Main', '20', 'Pending'],
    ]
  },
  'Product Report': {
    filters: [
      { key: 'categoryName', label: 'Category Name', type: 'text', placeholder: 'Select Category' },
      { key: 'catalog', label: 'Catelog', type: 'select', options: ['Select', 'Retail', 'Wholesale', 'Online'] },
      { key: 'itemName', label: 'Item Name', type: 'text', placeholder: 'Select or type...' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], defaultValue: 'Active' }
    ],
    columns: ['Product', 'Category', 'Total Sold', 'Revenue', 'Returned', 'Net Revenue'],
    rows: [
      ['Product A', 'Electronics', '480', '120,000.00', '5', '118,750.00'],
      ['Product B', 'Clothing', '310', '55,800.00', '2', '55,440.00'],
      ['Product C', 'Furniture', '95', '332,500.00', '0', '332,500.00'],
    ]
  },
  'Purchase Summary': {
    filters: [
      { key: 'dateFrom', label: 'Date From', type: 'date' },
      { key: 'dateTo', label: 'Date To', type: 'date' },
      { key: 'supplier', label: 'Supplier', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['All', 'Paid', 'Unpaid', 'Partial'] }
    ],
    columns: ['Date', 'Bill No', 'Supplier', 'Amount', 'Paid', 'Balance', 'Status'],
    rows: [
      ['2024-03-02', 'BILL-001', 'Gulf Supplier Co', '45,000.00', '45,000.00', '0.00', 'Paid'],
      ['2024-03-08', 'BILL-002', 'Nurac Vendor', '22,500.00', '10,000.00', '12,500.00', 'Partial'],
    ]
  },
  'Supplier Report': {
    filters: [
      { key: 'dateFrom', label: 'Date From', type: 'date' },
      { key: 'dateTo', label: 'Date To', type: 'date' },
      { key: 'supplier', label: 'Supplier', type: 'text' },
    ],
    columns: ['Supplier', 'Total Orders', 'Total Amount', 'Paid', 'Balance', 'Last Order'],
    rows: [
      ['Gulf Supplier Co', '8', '180,000.00', '180,000.00', '0.00', '2024-03-02'],
      ['Nurac Vendor', '5', '112,500.00', '100,000.00', '12,500.00', '2024-03-08'],
    ]
  },
  'Purchase Returns': {
    filters: [
      { key: 'dateFrom', label: 'Date From', type: 'date' },
      { key: 'dateTo', label: 'Date To', type: 'date' },
      { key: 'supplier', label: 'Supplier', type: 'text' },
    ],
    columns: ['Date', 'Return No', 'Original Bill', 'Supplier', 'Product', 'Qty', 'Amount'],
    rows: [
      ['2024-03-04', 'RET-001', 'BILL-001', 'Gulf Supplier Co', 'Product A', '10', '2,500.00'],
    ]
  },
};

const statusColor = (val) => {
  if (val === 'Paid' || val === 'Completed') return { bgcolor: '#dcfce7', color: '#166534' };
  if (val === 'Unpaid' || val === 'Pending') return { bgcolor: '#fee2e2', color: '#991b1b' };
  if (val === 'Partial') return { bgcolor: '#fef9c3', color: '#854d0e' };
  return {};
};

const statusValues = ['Paid', 'Unpaid', 'Partial', 'Completed', 'Pending'];

// ─── Report Detail Page ──────────────────────────────────────────────────────
const ReportDetailView = ({ report, onBack }) => {
  const config = reportDetailConfig[report.title] || { filters: [], columns: [], rows: [] };
  const [filters, setFilters] = useState(() => {
    const defaults = {};
    config.filters.forEach(f => {
      if (f.defaultValue) defaults[f.key] = f.defaultValue;
    });
    return defaults;
  });
  const [tableSearch, setTableSearch] = useState('');

  const handleFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const filteredRows = config.rows.filter(row =>
    row.some(cell => cell.toLowerCase().includes(tableSearch.toLowerCase()))
  );

  return (
    <Box sx={{ bgcolor: '#f1f5f9', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Background decoration */}
      <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          height: '320px', 
          background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
          zIndex: 0 
      }} />

      <Box sx={{ width: '100%', p: { xs: 2.5, md: 5 }, position: 'relative', zIndex: 1 }}>
        {/* Header Navigation */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <IconButton
              onClick={onBack}
              sx={{
                bgcolor: '#ffffff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                border: '1px solid #f1f5f9',
                '&:hover': { bgcolor: '#2563eb', color: '#ffffff', transform: 'translateX(-4px)' },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                {report.title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mt: 0.5 }}>{report.desc}</Typography>
            </Box>
          </Box>
          
          <Stack direction="row" spacing={1.5}>
            <Tooltip title="Print Report">
              <IconButton sx={{ bgcolor: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '12px', '&:hover': { bgcolor: '#f8fafc' } }}>
                <Print fontSize="small" sx={{ color: '#64748b' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export Data">
              <IconButton sx={{ bgcolor: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '12px', '&:hover': { bgcolor: '#f8fafc' } }}>
                <FileDownload fontSize="small" sx={{ color: '#64748b' }} />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              sx={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: 'white',
                borderRadius: '14px',
                px: 3,
                py: 1.2,
                textTransform: 'none',
                fontWeight: 700,
                boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 20px rgba(37, 99, 235, 0.3)' },
                transition: 'all 0.3s'
              }}
            >
              Run Report
            </Button>
          </Stack>
        </Box>

        {/* Filter Glass Panel */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            borderRadius: '24px', 
            bgcolor: 'rgba(255, 255, 255, 0.7)', 
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            mb: 4 
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3.5 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: '10px', bgcolor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FilterAlt fontSize="small" />
            </Box>
            <Typography variant="h6" fontWeight={800} color="#0f172a">Configuration & Filters</Typography>
          </Stack>
          
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 3
          }}>
            {config.filters.map(f => {
              const commonProps = {
                size: "small",
                fullWidth: true,
                sx: { 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: '12px', 
                    bgcolor: '#ffffff',
                    '& fieldset': { borderColor: '#e2e8f0' },
                    '&:hover fieldset': { borderColor: '#2563eb' }
                  },
                  '& .MuiInputLabel-root': { fontWeight: 700, fontSize: '0.85rem', color: '#64748b' }
                }
              };

              if (f.type === 'select') {
                return (
                  <FormControl key={f.key} {...commonProps}>
                    <InputLabel>{f.label}</InputLabel>
                    <Select
                      label={f.label}
                      value={filters[f.key] || ''}
                      onChange={e => handleFilter(f.key, e.target.value)}
                    >
                      {(f.options || []).map(opt => <MenuItem key={opt} value={opt} sx={{ fontSize: '0.88rem', fontWeight: 600 }}>{opt}</MenuItem>)}
                    </Select>
                  </FormControl>
                );
              } else if (f.type === 'date') {
                return (
                  <DatePicker
                    key={f.key}
                    label={f.label}
                    value={filters[f.key] ? dayjs(filters[f.key]) : null}
                    onChange={(newValue) => handleFilter(f.key, newValue ? newValue.format('YYYY-MM-DD') : '')}
                    slotProps={{ 
                      textField: { 
                        ...commonProps,
                        placeholder: f.placeholder 
                      } 
                    }}
                  />
                );
              } else {
                return (
                  <TextField
                    key={f.key}
                    {...commonProps}
                    label={f.label}
                    placeholder={f.placeholder}
                    value={filters[f.key] || ''}
                    onChange={e => handleFilter(f.key, e.target.value)}
                  />
                );
              }
            })}
          </Box>
        </Paper>

        {/* Data Table Panel */}
        <Paper 
          elevation={0}
          sx={{ 
            bgcolor: '#ffffff', 
            borderRadius: '24px', 
            border: '1px solid #f1f5f9', 
            overflow: 'hidden',
            boxShadow: '0 4px 15px rgba(0,0,0,0.02)' 
          }}
        >
          {/* Table Toolbar */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            justifyContent="space-between" 
            alignItems={{ xs: 'flex-start', sm: 'center' }} 
            spacing={2} 
            sx={{ p: 3, borderBottom: '1px solid #f1f5f9', bgcolor: '#fcfdfe' }}
          >
            <Box>
              <Typography variant="subtitle1" fontWeight={900} color="#0f172a">
                Report Statistics
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>
                {filteredRows.length} Records Found
              </Typography>
            </Box>
            
            <Box sx={{ 
              bgcolor: '#ffffff', 
              borderRadius: '14px', 
              px: 2, 
              py: 0.8, 
              display: 'flex', 
              alignItems: 'center', 
              border: '1px solid #e2e8f0', 
              width: { xs: '100%', sm: 320 },
              transition: 'all 0.3s',
              '&:focus-within': { borderColor: '#2563eb', boxShadow: '0 0 0 3px rgba(37,99,235,0.1)' }
            }}>
              <Search sx={{ color: '#94a3b8', fontSize: 20, mr: 1.5 }} />
              <InputBase 
                placeholder="Live search table fields..." 
                fullWidth 
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)} 
                sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }} 
              />
            </Box>
          </Stack>

          <TableContainer sx={{ overflowX: 'auto', maxHeight: '600px' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {config.columns.map(col => (
                    <TableCell 
                      key={col} 
                      sx={{ 
                        fontWeight: 900, 
                        fontSize: '0.7rem', 
                        color: '#64748b', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.1em', 
                        py: 2.5, 
                        bgcolor: '#f8fafc',
                        borderBottom: '2px solid #f1f5f9',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.length > 0 ? filteredRows.map((row, i) => (
                  <TableRow 
                    key={i} 
                    hover 
                    sx={{ 
                      '&:hover': { bgcolor: '#f8fafc' }, 
                      '&:last-child td': { borderBottom: 0 },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    {row.map((cell, j) => (
                      <TableCell 
                        key={j} 
                        sx={{ 
                          fontSize: '0.875rem', 
                          color: cell === 'Paid' || cell === 'Completed' ? '#15803d' : '#334155', 
                          py: 2.2, 
                          fontWeight: 500,
                          whiteSpace: 'nowrap' 
                        }}
                      >
                        {statusValues.includes(cell) ? (
                          <Chip 
                            label={cell} 
                            size="small" 
                            sx={{ 
                              fontWeight: 800, 
                              fontSize: '0.65rem', 
                              height: 24, 
                              borderRadius: '8px',
                              ...statusColor(cell) 
                            }} 
                          />
                        ) : cell}
                      </TableCell>
                    ))}
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={config.columns.length} sx={{ textAlign: 'center', py: 12 }}>
                      <Box sx={{ opacity: 0.5, mb: 2 }}>
                        <Search sx={{ fontSize: 48, color: '#94a3b8' }} />
                      </Box>
                      <Typography variant="body1" sx={{ color: '#94a3b8', fontWeight: 700 }}>
                        No records match your filters
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};

// ─── Main Report Section ─────────────────────────────────────────────────────
const ReportSection = () => {
  const [activeTab, setActiveTab] = useState('Sales');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState(['Sales Summary']);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [reportPermissions, setReportPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchPermissions = async () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      let roleId = user.roleId || user.RoleId;
      const userRole = user.role || user.Role;

      setLoading(true);
      try {
        const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

        // If roleId is missing, try to fetch it by role name (similar to Dashboard.jsx logic)
        if (!roleId && userRole) {
          console.log('RoleId missing, fetching by role name:', userRole);
          const roleResponse = await fetch(`${API_URL}/api/role/byname/${encodeURIComponent(userRole)}`);
          const roleData = await roleResponse.json();
          if (roleData.success && roleData.roles && roleData.roles.length > 0) {
            roleId = roleData.roles[0].Id || roleData.roles[0].id;
          }
        }

        if (!roleId) {
          console.error('Could not determine roleId for user');
          setLoading(false);
          return;
        }

        console.log('Fetching report permissions for roleId:', roleId);
        const response = await fetch(`${API_URL}/api/report-permission/${roleId}`);
        const data = await response.json();
        if (data.success) {
          console.log('Loaded report permissions:', data.data?.length || 0);
          setReportPermissions(data.data || []);
        } else {
          console.error('Failed to fetch report permissions:', data.message);
        }
      } catch (error) {
        console.error('Error fetching report permissions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, []);

  const isAllowed = (category, title) => {
    if (!reportPermissions || reportPermissions.length === 0) return false;
    const perm = reportPermissions.find(p => p.category === category && p.reportName === title);
    // Handle both boolean and bit (1/0) values
    return perm ? (perm.permission === true || perm.permission === 1 || String(perm.permission) === 'true') : false;
  };


  const reportsDataFull = {
    'Sales': [
      { title: 'Sales Summary', desc: 'Overall revenue performance', icon: <TrendingUp />, stats: 'Updated 2m ago' },
      { title: 'Sales Summary Details', desc: 'Itemized transaction logs', icon: <Assignment />, stats: 'Updated 5m ago' },
      { title: 'Revenue Report', desc: 'Profit & Loss analysis', icon: <MonetizationOn />, stats: 'Updated 10m ago' },
      { title: 'New & Old Invoice Summary', desc: 'Comparative billing data', icon: <Receipt />, stats: 'Updated 1h ago' },
      { title: 'Brand Report', desc: 'Vendor performance metrics', icon: <Storefront />, stats: 'Updated 2h ago' },
      { title: 'Customer Report', desc: 'Client interaction analytics', icon: <Person />, stats: 'Updated 1d ago' },
      { title: 'Category Report', desc: 'Product grouping trends', icon: <Category />, stats: 'Updated 1w ago' },
      { title: 'Cost of goods Report', desc: 'Direct manufacturing costs', icon: <Description />, stats: 'Updated 2w ago' },
      { title: 'Customer Balance Report', desc: 'Outstanding debt tracking', icon: <AccountBalanceWallet />, stats: 'Updated 1mo ago' }
    ],
    'Purchase': [
      { title: 'Purchase Summary', desc: 'Overall purchase activity', icon: <ShoppingCart />, stats: 'Updated 3h ago' },
      { title: 'Supplier Report', desc: 'Detailed supplier transaction history', icon: <Person />, stats: 'Updated 1d ago' },
      { title: 'Purchase Returns', desc: 'History of all returned items', icon: <History />, stats: 'Updated 2d ago' }
    ],
    'Stock': [
      { title: 'Warehouse Stock', desc: 'Real-time hub inventory', icon: <Inventory />, stats: 'Live Sync' },
      { title: 'Sales Stock', desc: 'Inventory allocated for orders', icon: <TrendingUp />, stats: 'Live Sync' },
      { title: 'Inventory', desc: 'Detailed stock availability', icon: <Inventory />, stats: 'Live Sync' }
    ],
    'Stock Transfer': [
      { title: 'Stock Transfer Report', desc: 'Inter-warehouse movement logs', icon: <MoveToInbox />, stats: 'Daily Sync' }
    ],
    'Product': [
      { title: 'Product Report', desc: 'Lifecycle and popularity metrics', icon: <BarChart />, stats: 'Weekly Sync' }
    ]
  };

  // Filter categories and reports based on permissions
  const reportCategories = [
    { label: 'Sales', icon: <TrendingUp />, color: '#6366f1' },
    { label: 'Purchase', icon: <ShoppingCart />, color: '#10b981' },
    { label: 'Stock', icon: <Inventory />, color: '#f59e0b' },
    { label: 'Stock Transfer', icon: <MoveToInbox />, color: '#ec4899' },
    { label: 'Product', icon: <BarChart />, color: '#8b5cf6' }
  ].filter(cat => reportsDataFull[cat.label]?.some(r => isAllowed(cat.label, r.title)));

  const reportsData = {};
  Object.keys(reportsDataFull).forEach(cat => {
    const allowed = reportsDataFull[cat].filter(r => isAllowed(cat, r.title));
    if (allowed.length > 0) {
      reportsData[cat] = allowed;
    }
  });

  // Ensure activeTab is valid if current one is filtered out
  React.useEffect(() => {
    if (reportCategories.length > 0 && !reportCategories.find(c => c.label === activeTab)) {
      setActiveTab(reportCategories[0].label);
    }
  }, [reportCategories, activeTab]);

  const activeReports = reportsData[activeTab] || [];
  const filteredReports = activeReports.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFavorite = (e, title) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]);
  };

  // ── If a report is selected, show drill-down view ──
  if (selectedReport) {
    return <ReportDetailView report={selectedReport} onBack={() => setSelectedReport(null)} />;
  }

  const SidebarContent = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="caption" fontWeight={900} color="#94a3b8" sx={{ letterSpacing: '0.12em', mb: 3, px: 1.5, display: 'block', textTransform: 'uppercase' }}>
        Report Categories
      </Typography>
      <Stack spacing={1}>
        {reportCategories.map((cat) => (
          <Button
            key={cat.label}
            onClick={() => { setActiveTab(cat.label); setIsMobileMenuOpen(false); }}
            startIcon={React.cloneElement(cat.icon, { sx: { fontSize: 18, color: activeTab === cat.label ? '#fff' : cat.color } })}
            fullWidth
            sx={{
              justifyContent: 'flex-start', py: 1.8, px: 2.5, borderRadius: '16px',
              textTransform: 'none', fontWeight: 800, fontSize: '0.9rem',
              color: activeTab === cat.label ? '#fff' : '#64748b',
              bgcolor: activeTab === cat.label ? '#0f172a' : 'transparent',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': { 
                bgcolor: activeTab === cat.label ? '#1e293b' : '#f8fafc',
                transform: activeTab === cat.label ? 'none' : 'translateX(4px)',
                color: activeTab === cat.label ? '#fff' : cat.color
              },
              boxShadow: activeTab === cat.label ? '0 10px 20px -5px rgba(15, 23, 42, 0.3)' : 'none'
            }}
          >
            {cat.label}
          </Button>
        ))}
      </Stack>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: '#f1f5f9', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Background decoration */}
      <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          height: '400px', 
          background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
          zIndex: 0 
      }} />

      {/* Header Container */}
      <Box sx={{ px: { xs: 3, md: 5 }, pt: { xs: 3, md: 6 }, pb: 4, position: 'relative', zIndex: 1 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} justifyContent="space-between" alignItems={{ xs: 'flex-start', lg: 'center' }}>
          <Stack direction="row" spacing={2.5} alignItems="center">
            {isMobile && (
              <IconButton 
                size="large" 
                onClick={() => setIsMobileMenuOpen(true)}
                sx={{ bgcolor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '16px', border: '1px solid #f1f5f9' }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Box>
              <Typography variant={isMobile ? 'h4' : 'h3'} fontWeight={900} sx={{ color: '#0f172a', letterSpacing: '-0.05em', lineHeight: 1 }}>
                Intelligence Center
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5 }}>
                <Box sx={{ width: 8, height: 8, bgcolor: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }} />
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>
                  System synced &nbsp;•&nbsp; <Box component="span" sx={{ color: '#0f172a', fontWeight: 800 }}>{activeReports.length}</Box> Dynamic {activeTab} Reports Available
                </Typography>
              </Stack>
            </Box>
          </Stack>
          
          <Stack direction="row" spacing={2} alignItems="center" sx={{ width: { xs: '100%', lg: 'auto' } }}>
            <Box sx={{ 
              bgcolor: '#ffffff', 
              borderRadius: '18px', 
              px: 2.5, 
              py: 1.2, 
              display: 'flex', 
              alignItems: 'center', 
              border: '1px solid #e2e8f0', 
              flex: { xs: 1, sm: '0 0 350px' },
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              transition: 'all 0.3s',
              '&:focus-within': { borderColor: '#2563eb', boxShadow: '0 8px 20px rgba(37,99,235,0.08)' }
            }}>
              <Search sx={{ color: '#94a3b8', fontSize: 22, mr: 1.5 }} />
              <InputBase 
                placeholder="Search global reports..." 
                fullWidth 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} 
                sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }} 
              />
            </Box>
            <Button 
                variant="contained" 
                startIcon={<NorthEast />}
                sx={{ 
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
                    borderRadius: '18px', 
                    textTransform: 'none', 
                    fontWeight: 800, 
                    px: 4, 
                    py: 1.6, 
                    whiteSpace: 'nowrap',
                    boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.3)',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 15px 30px -5px rgba(37, 99, 235, 0.4)' },
                    transition: 'all 0.3s'
                }}
            >
              Master Export
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Body Section */}
      <Box sx={{ display: 'flex', flex: 1, px: { xs: 3, md: 5 }, pb: 6, gap: 4, alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        {!isMobile && (
          <Box sx={{ 
            width: 320, 
            flexShrink: 0, 
            bgcolor: 'rgba(255, 255, 255, 0.7)', 
            backdropFilter: 'blur(20px)',
            borderRadius: '24px', 
            border: '1px solid rgba(255, 255, 255, 0.5)', 
            position: 'sticky', 
            top: 40, 
            alignSelf: 'flex-start',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)'
          }}>
            <SidebarContent />
          </Box>
        )}

        {/* Enhanced Report Cards Grid */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 15 }}>
              <CircularProgress thickness={5} size={60} sx={{ color: '#2563eb' }} />
            </Box>
          ) : filteredReports.length > 0 ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 3 }}>
              {filteredReports.map((report, index) => (
                <Grow in timeout={index * 60} key={report.title}>
                  <Paper
                    elevation={0}
                    onClick={() => setSelectedReport(report)}
                    sx={{
                      p: 3,
                      bgcolor: '#fff', 
                      borderRadius: '24px', 
                      border: '1px solid #f1f5f9',
                      cursor: 'pointer', 
                      display: 'flex', 
                      flexDirection: 'column',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      '&:hover': {
                        borderColor: '#2563eb', 
                        boxShadow: '0 20px 40px -12px rgba(37, 99, 235, 0.12)',
                        transform: 'translateY(-8px)',
                        '& .icon-container': { transform: 'scale(1.1) rotate(5deg)', bgcolor: '#2563eb', color: '#fff' },
                        '& .launch-hint': { opacity: 1, transform: 'translateX(0)' }
                      }
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2.5 }}>
                      <Box className="icon-container" sx={{ 
                        width: 52, 
                        height: 52, 
                        borderRadius: '16px', 
                        bgcolor: '#f8fafc', 
                        color: '#0f172a', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        transition: 'all 0.3s ease'
                      }}>
                        {React.cloneElement(report.icon, { sx: { fontSize: 24 } })}
                      </Box>
                      <IconButton 
                        size="small" 
                        onClick={(e) => toggleFavorite(e, report.title)} 
                        sx={{ 
                            p: 1, 
                            bgcolor: favorites.includes(report.title) ? '#fffbeb' : '#f8fafc',
                            '&:hover': { bgcolor: '#fff7ed' }
                        }}
                      >
                        {favorites.includes(report.title) ? <Star sx={{ color: '#f59e0b', fontSize: 20 }} /> : <StarBorder sx={{ color: '#cbd5e1', fontSize: 20 }} />}
                      </IconButton>
                    </Stack>

                    <Typography variant="h6" fontWeight={900} sx={{ color: '#0f172a', mb: 1, lineHeight: 1.2, fontSize: '1.1rem' }}>
                      {report.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', flex: 1, lineHeight: 1.6, fontWeight: 500 }}>
                      {report.desc}
                    </Typography>

                    <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#2563eb' }} />
                        <Typography variant="caption" fontWeight={800} color="#94a3b8" sx={{ fontSize: '0.7rem', letterSpacing: '0.02em' }}>{report.stats}</Typography>
                      </Stack>
                      <Stack 
                        className="launch-hint" 
                        direction="row" 
                        spacing={0.5} 
                        alignItems="center"
                        sx={{ 
                            opacity: 0, 
                            transform: 'translateX(-10px)',
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
                            color: '#2563eb' 
                        }}
                      >
                        <Typography variant="caption" fontWeight={900} sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Visualize</Typography>
                        <NorthEast sx={{ fontSize: 16 }} />
                      </Stack>
                    </Box>
                  </Paper>
                </Grow>
              ))}
            </Box>
          ) : (
            <Paper 
                elevation={0}
                sx={{ textAlign: 'center', py: 15, borderRadius: '32px', border: '1px dashed #e2e8f0', bgcolor: 'transparent' }}
            >
              <Typography variant="h5" color="#94a3b8" fontWeight={900} sx={{ mb: 2 }}>
                {reportPermissions.length === 0 ? "Access Restricted" : "No Reports Found"}
              </Typography>
              <Typography variant="body1" color="#64748b" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
                {reportPermissions.length === 0 
                    ? "You don't have the necessary permissions to access any dynamic reports at this level." 
                    : `We couldn't find any reports matching "${searchQuery}". Try refining your search terms.`}
              </Typography>
              {searchQuery && (
                <Button 
                    variant="outlined"
                    onClick={() => setSearchQuery('')}
                    sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 800, px: 4 }}
                >
                    Clear All Filters
                </Button>
              )}
            </Paper>
          )}
        </Box>
      </Box>

      {/* Mobile Drawer */}
      <Drawer anchor="left" open={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}
        PaperProps={{ sx: { width: 350, borderRadius: '0 20px 20px 0' } }}>
        <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton onClick={() => setIsMobileMenuOpen(false)}><CloseIcon /></IconButton>
        </Box>
        <SidebarContent />
      </Drawer>
    </Box>
  );
};

export default ReportSection;

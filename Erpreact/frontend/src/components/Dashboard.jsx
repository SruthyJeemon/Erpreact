import React, { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { useLocation, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './AdminSettings.css';
import { handleLogout as logoutUser } from '../utils/logout';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
// Import jspdf-autotable - it extends jsPDF prototype
import 'jspdf-autotable';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import LoadingSpinner from './LoadingSpinner';
import BrandSection from './BrandSection';
import CategorySection from './CategorySection';
import ProductSection from './ProductSection';
import ProductListSection from './ProductListSection';
import ProductDetails from './ProductDetails';
import ProductApprovalSection from './ProductApprovalSection';
import ProductEditRequestSection from './ProductEditRequestSection';
import ProductApprovalDetails from './ProductApprovalDetails';
import ItemApprovalSection from './ItemApprovalSection';
import SupplierSection from './SupplierSection';
import SupplierDetailView from './SupplierDetailView';
import SupplierCreateBill from './SupplierCreateBill';
import CustomerSection from './CustomerSection';
import CustomerDetailView from './CustomerDetailView';
import CustomerCreateBill from './CustomerCreateBill';
import PurchaseBillView from './PurchaseBillView';
import SaleBillView from './SaleBillView';
import WorkflowSection from './WorkflowSection';
import TaskListingSection from './TaskListingSection';
import PurchaseApprovalSection from './PurchaseApprovalSection';
import PurchaseApprovalHub from './PurchaseApprovalHub';
import PurchaseEditRequestSection from './PurchaseEditRequestSection';
import WarehouseReceiveItems from './WarehouseReceiveItems';
import PurchaseWarehouseHub from './PurchaseWarehouseHub';
import SalesQuoteSection from './SalesQuoteSection';
import SalesQuoteCreate from './SalesQuoteCreate';
import SalesQuoteApprovalSection from './SalesQuoteApprovalSection';
import SalesQuoteApprovalView from './SalesQuoteApprovalView';
import ComboSection from './ComboSection';
import ReportSection from './ReportSection';
import logo from '../assets/asas_logo.png';
import StockManagementSection from './StockManagementSection';
import CostingManagementSection from './CostingManagementSection';
import StockTransferSection from './StockTransferSection';
import StockTransferApprovalSection from './StockTransferApprovalSection';
import PickupSection from './PickupSection';
import PickupNotificationSection from './PickupNotificationSection';
import DeliverySection from './DeliverySection';
import SalesReturnSection from './SalesReturnSection';
import SalesReturnApprovalSection from './SalesReturnApprovalSection';
import StockTransferApprovalView from './StockTransferApprovalView';
import StockTransferApprovalFinal from './StockTransferApprovalFinal';
import StockAdjustmentSection from './StockAdjustmentSection';
import StockAdjustmentApprovalSection from './StockAdjustmentApprovalSection';
import PackingListSection from './PackingListSection';




import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  Divider,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  CssBaseline,
  useTheme,
  useMediaQuery,
  InputBase,
  Badge,
  Menu,
  Avatar,
  Popover,
  Switch
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Logout from '@mui/icons-material/Logout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import StoreIcon from '@mui/icons-material/Store';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import GetAppIcon from '@mui/icons-material/GetApp';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LockResetIcon from '@mui/icons-material/LockReset';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CalculateIcon from '@mui/icons-material/Calculate';
import CropFreeIcon from '@mui/icons-material/CropFree';
import ListAltIcon from '@mui/icons-material/ListAlt';
import RateReviewIcon from '@mui/icons-material/RateReview';
import LockIcon from '@mui/icons-material/Lock';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import BarChartIcon from '@mui/icons-material/BarChart';
import CategoryIcon from '@mui/icons-material/Category';

// Generic SubModule Section - for unmapped submodules
const GenericSubModuleSection = ({ sectionId, menuItems }) => {
  // Find the submodule label from menuItems
  let submoduleLabel = 'SubModule';

  for (const item of menuItems) {
    if (item.submenus && item.submenus.length > 0) {
      const submenu = item.submenus.find(sub => sub.id === sectionId);
      if (submenu) {
        submoduleLabel = submenu.label;
        break;
      }
    }
  }

  return (
    <div className="admin-page-container">
      <div className="settings-section">
        <h2 className="section-title">{submoduleLabel}</h2>
        <div className="section-content">
          <p>This is a submodule page. Content for "{submoduleLabel}" will be displayed here.</p>
          <p className="info-text">To add specific functionality for this submodule, create a dedicated component and map it in the Dashboard component.</p>
        </div>
      </div>
    </div>
  );
};

// Global Mapping for SubModules to Section IDs
const SUBMODULE_SECTION_MAPPING = {
  'inventory-stock': 'inventory-stock',
  'stock': 'inventory-stock',
  'inventory': 'inventory-stock',

  // Task and Listing - ensure visibility/mapping even if names vary
  'task': 'task-dashboard',
  'tasks': 'task-dashboard',
  'task dashboard': 'task-dashboard',
  'taskdashboard': 'task-dashboard',
  'listing': 'Task/Listing',
  'task listing': 'Task/Listing',
  'task-listing': 'Task/Listing',
  'listing tasks': 'Task/Listing',

  // Packing list under Stock
  'packing list': 'stock-packinglist',
  'packinglist': 'stock-packinglist',
  'stock packinglist': 'stock-packinglist',
  'stock-packinglist': 'stock-packinglist',

  'inventory-costing': 'inventory-costing',
  'costing': 'inventory-costing',
  'inventory-stocktransfer': 'inventory-stocktransfer',
  'stock transfer': 'inventory-stocktransfer',
  'stocktransfer': 'inventory-stocktransfer',
  'inventory-stockadjustment': 'inventory-stockadjustment',
  'stock adjustment': 'inventory-stockadjustment',
  'stockadjustment': 'inventory-stockadjustment',
  'profile': 'admin-profile',
  'security': 'admin-security',
  'role management': 'admin-roles',
  'rolemanagement': 'admin-roles',
  'roles': 'admin-roles',
  'marketplace': 'admin-marketplace',
  'modules & submodules': 'admin-modules',
  'modules': 'admin-modules',
  'module': 'admin-modules',
  'submodules': 'admin-modules',
  'submodule': 'admin-modules',
  'catalog': 'admin-catalog',
  'catalog management': 'admin-catalog',
  'catalogmanagement': 'admin-catalog',
  'stock location': 'admin-stocklocation',
  'stocklocation': 'admin-stocklocation',
  'stock location management': 'admin-stocklocation',
  'bill format': 'admin-billformat',
  'billformat': 'admin-billformat',
  'bill format management': 'admin-billformat',
  'decimal format': 'admin-decimalformat',
  'decimalformat': 'admin-decimalformat',
  'decimal format management': 'admin-decimalformat',
  'payment terms': 'admin-paymentterms',
  'paymentterms': 'admin-paymentterms',
  'payment terms management': 'admin-paymentterms',
  'currency': 'admin-currency',
  'currency management': 'admin-currency',
  'vat': 'admin-vat',
  'vat settings': 'admin-vat',
  'vat management': 'admin-vat',
  'stockcheck': 'admin-stockcheck',
  'stock check': 'admin-stockcheck',
  'stock check set': 'admin-stockcheck',
  'stock check status': 'admin-stockcheck',
  'bankaccount': 'admin-bankaccount',
  'bank account': 'admin-bankaccount',
  'bank account management': 'admin-bankaccount',
  'vehicle': 'admin-vehicle',
  'vehicle details': 'admin-vehicle',
  'vehicle management': 'admin-vehicle',
  'driver': 'admin-driver',
  'driver details': 'admin-driver',
  'driver management': 'admin-driver',
  'sales-return-approval': 'approval-sales-return-hub',
  'sales return approval': 'approval-sales-return-hub',
  'date format': 'admin-dateformat',
  'dateformat': 'admin-dateformat',
  'date format management': 'admin-dateformat',
  'report permissions': 'admin-reportpermissions',
  'role permissions': 'admin-permissions',
  'permissions': 'admin-permissions',
  'permission': 'admin-permissions',
  'dashboard content': 'admin-dashboardcontent',
  'dashboardcontent': 'admin-dashboardcontent',
  'dashboard content view': 'admin-dashboardcontent',
  'dashboard content view settings': 'admin-dashboardcontent',
  'preferences': 'admin-preferences',
  'notifications': 'admin-notifications',
  'system settings': 'admin-system',
  'system': 'admin-system',
  'user management': 'admin-users',
  'users': 'admin-users',
  'user': 'admin-users',
  'email settings': 'admin-email',
  'email': 'admin-email',
  'smtp settings': 'admin-email',
  'smtp': 'admin-email',
  'variants': 'admin-variants',
  'variant': 'admin-variants',
  'combo': 'product-combo',
  'product combo': 'product-combo',
  'brand': 'product-brand',
  'product brand': 'product-brand',
  'items': 'product-items',
  'product items': 'product-items',
  'add product': 'product-items',
  'addproduct': 'product-items',
  'all products': 'product-all',
  'allproducts': 'product-all',
  'supplier': 'supplier',
  'suppliers': 'supplier',
  'supplier management': 'supplier',
  'customers': 'customer',
  'customer': 'customer',
  'customer management': 'customer',
  'approval request': 'approval-product-request',
  'edit request': 'approval-product-edit',
  'purchase bills': 'purchase-bill-view',
  'purchase-bills': 'purchase-bill-view',
  'sales quote approval': 'sales-quote-approval',
  'salesquote approval': 'sales-quote-approval',
  'stock transfer approval': 'stock-transfer-approval',
  'stocktransfer approval': 'stock-transfer-approval',
  'stock-transfer-approval': 'stock-transfer-approval',
  'stock-transfer-approval-view': 'stock-transfer-approval-view',
  'stocktransferapprovalfinal': 'stock-transfer-approval-final',
  'pickup': 'inventory-pickup',
  'pickupnotification': 'inventory-pickupnotification',
  'pickup-notification': 'inventory-pickupnotification',
  'pickup notification': 'inventory-pickupnotification',
  'delivery': 'inventory-delivery',
  'approvals': 'approvals',
  'sales return section': 'sales-return-section',
  'sales-return-section': 'sales-return-section',
  'sales return': 'sales-return-section',
  'stock adjustment approval': 'stock-adjustment-approval',
  'stock-adjustment-approval': 'stock-adjustment-approval',
  'stockadjustment approval': 'stock-adjustment-approval',




  'bills': 'purchase-bill-view',
  'bill-view': 'purchase-bill-view',
  'sales bills': 'sale-bill-view',
  'sale-bills': 'sale-bill-view',
  'sales-bills': 'sale-bill-view',
  'sale bill': 'sale-bill-view',
  'sales bill': 'sale-bill-view',
  'sales quote': 'sales-quote',
  'sales-quote': 'sales-quote',
  'salesquote': 'sales-quote',
  'sales-quote-approval': 'sales-quote-approval',
  'workflow': 'workflow',
  'module-1008': 'workflow',
  'purchase approval': 'purchase-approval-hub',
  'purchase-approval': 'purchase-approval-hub',
  'approval-purchase-hub': 'purchase-approval-hub',
  'purchase-approval-request': 'purchase-approval-request',
  'purchase-edit-request': 'purchase-edit-request',
  'receive items': 'warehouse-receive-items',
  'receive-items': 'warehouse-receive-items',
  'purchase/warehouse': 'purchase-warehouse-hub',
  'Purchase/Warehouse': 'purchase-warehouse-hub',
  'warehouse': 'purchase-warehouse-hub',
  'Warehouse': 'purchase-warehouse-hub',
  'reports': 'report-section',
  'report': 'report-section',
  'analytics': 'report-section'
};

// SVG Icon Component Helper
const IconSVG = ({ name, size = 20, className = '' }) => {
  // Ensure size is always a valid number
  const iconSize = typeof size === 'number' && !isNaN(size) ? size : 20;
  const sizeStr = String(iconSize);

  const iconMap = {
    'dashboard': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    ),
    'purchase': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path>
      </svg>
    ),
    'bill': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line>
      </svg>
    ),
    'invoice': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line>
      </svg>
    ),
    'settings': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364 6.364l-4.243-4.243m-4.242 0L5.636 18.364M18.364 5.636l-4.243 4.243m-4.242 0L5.636 5.636"></path>
      </svg>
    ),
    'approvals': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    ),
    'requests': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
    ),
    'users': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    'user': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
      </svg>
    ),
    'security': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    ),
    'roles': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    'marketplace': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>
      </svg>
    ),
    'workflow': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
      </svg>
    ),
    'modules': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    ),
    'permissions': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    ),
    'notifications': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
    ),
    'system': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>
      </svg>
    ),
    'warehouse': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path>
      </svg>
    ),

    'payment': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line>
      </svg>
    ),
    'location': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
      </svg>
    ),
    'decimal': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="2" x2="12" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
      </svg>
    ),
    'date': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    ),
    'currency': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="6" x2="12" y2="18"></line><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
    ),
    'vat': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
    ),
    'check': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    ),
    'bank': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="12" y1="2" x2="12" y2="22"></line>
      </svg>
    ),
    'calculate': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line><path d="M16 10h.01"></path><path d="M12 10h.01"></path><path d="M8 10h.01"></path><path d="M12 14h.01"></path><path d="M8 14h.01"></path><path d="M12 18h.01"></path><path d="M8 18h.01"></path>
      </svg>
    ),

    'vehicle': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"></path><polygon points="12 15 17 21 7 21 12 15"></polygon>
      </svg>
    ),
    'driver': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
      </svg>
    ),
    'return': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path>
      </svg>
    ),
    'variants': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 7h10v10H7z"></path><path d="M7 7l5 5"></path><path d="M12 12l5 5"></path>
      </svg>
    ),
    'supplier': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    'catalog': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    ),
    'email': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>
      </svg>
    ),
    'sales': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
      </svg>
    ),
    'finance': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
      </svg>
    ),
    'receive': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle>
      </svg>
    ),
    'salesquote': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line>
      </svg>
    ),
    'inventory': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
      </svg>
    ),
    'stock': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
      </svg>
    ),

    'approvals-user': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline>
      </svg>
    ),
    'default': (
      <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>
      </svg>
    )
  };

  return (
    <span className={`icon-svg ${className}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {iconMap[name] || iconMap['default']}
    </span>
  );
};

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Get initial section from URL or default to 'dashboard'
  const getInitialSection = () => {
    try {
      const path = window.location.pathname;
      if (path === '/' || path === '' || path === '/index.html') return 'dashboard';

      // Extract section from URL (e.g., /admin-profile -> admin-profile)
      // or /product-details/brand -> product-details/brand
      const section = path.replace(/^\//, '').replace(/\/$/, '');
      // Normalize legacy/technical IDs to pretty names (e.g., module-1008 -> workflow)
      return SUBMODULE_SECTION_MAPPING[section] || section || 'dashboard';
    } catch (e) {
      console.error("Error detecting initial section:", e);
      return 'dashboard';
    }
  };

  const [activeSection, setActiveSection] = useState(getInitialSection());

  // Sync activeSection with URL changes
  useEffect(() => {
    const path = location.pathname;
    const decodedPath = decodeURIComponent(path || '');
    const section = decodedPath === '/' || decodedPath === '' ? 'dashboard' : decodedPath.replace(/^\//, '').replace(/\/$/, '');
    const normalizedSection = SUBMODULE_SECTION_MAPPING[section] || section;
    if (normalizedSection !== activeSection) {
      setActiveSection(normalizedSection);
    }
  }, [location]);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768); // Open by default on desktop
  const [isHovered, setIsHovered] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const drawerWidth = 280;
  const miniDrawerWidth = 80;
  const isSidebarExpanded = isMobile ? sidebarOpen : (sidebarOpen || isHovered);

  // Sync sidebar state with screen size Changes
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const handleUserMenuOpen = (event) => setUserMenuAnchor(event.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchor(null);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedStockTransferId, setSelectedStockTransferId] = useState(null);
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable full-screen mode: ${e.message}`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  // Listen for escape key or other fullscreen changes to sync state
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  // Calculator Logic
  const [calcAnchor, setCalcAnchor] = useState(null);
  const [calcValue, setCalcValue] = useState('0');
  const [prevVal, setPrevVal] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const handleCalcClick = (event) => setCalcAnchor(event.currentTarget);
  const handleCalcClose = () => setCalcAnchor(null);

  const evaluate = (prev, curr, op) => {
    switch (op) {
      case '+': return prev + curr;
      case '-': return prev - curr;
      case '*': return prev * curr;
      case '/': return curr !== 0 ? prev / curr : 0;
      default: return curr;
    }
  };

  const performOperation = (nextOperator) => {
    const inputValue = parseFloat(calcValue);
    if (prevVal === null) {
      setPrevVal(inputValue);
    } else if (operator) {
      const result = evaluate(prevVal, inputValue, operator);
      setCalcValue(String(result));
      setPrevVal(result);
    }
    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const handleEquals = () => {
    const inputValue = parseFloat(calcValue);
    if (operator && prevVal !== null) {
      const result = evaluate(prevVal, inputValue, operator);
      setCalcValue(String(result));
      setPrevVal(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  };

  const inputDigit = (digit) => {
    if (waitingForOperand) {
      setCalcValue(String(digit));
      setWaitingForOperand(false);
    } else {
      setCalcValue(calcValue === '0' ? String(digit) : calcValue + digit);
    }
  };

  const inputDot = () => {
    if (waitingForOperand) {
      setCalcValue('0.');
      setWaitingForOperand(false);
    } else if (!calcValue.includes('.')) {
      setCalcValue(calcValue + '.');
    }
  };

  const clearCalc = () => {
    setCalcValue('0');
    setPrevVal(null);
    setOperator(null);
    setWaitingForOperand(false);
  };
  const [expandedMenus, setExpandedMenus] = useState(new Set());
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [pendingEditCount, setPendingEditCount] = useState(0);
  const [pendingItemApprovalCount, setPendingItemApprovalCount] = useState(0);
  const [pendingPurchaseCount, setPendingPurchaseCount] = useState(0);

  // Memoize user from localStorage to prevent infinite re-render loops
  const user = React.useMemo(() => {
    try {
      const userString = localStorage.getItem('user');
      if (userString && userString !== 'undefined' && userString !== 'null') {
        return JSON.parse(userString);
      }
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
    }
    return {};
  }, []); // Only re-parse if needed, or add a trigger if localStorage changes manually

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

  useEffect(() => {
    if (activeSection === 'approval-product-hub') {
      // Fetch Approval Count
      fetch(`${API_URL}/api/product?status=0&pageSize=1`)
        .then(res => res.json())
        .then(data => {
          if (data && typeof data.totalCount === 'number') {
            setPendingApprovalCount(data.totalCount);
          } else if (Array.isArray(data)) {
            setPendingApprovalCount(data.length);
          }
        })
        .catch(err => console.error("Error fetching approval count:", err));

      // Fetch Edit Request Count
      fetch(`${API_URL}/api/editreason?status=0`)
        .then(res => res.json())
        .then(data => {
          // data.data is the list if using response wrapper, or data might be list
          const list = data.data || (Array.isArray(data) ? data : []);
          setPendingEditCount(list.length);
        })
        .catch(err => console.error("Error fetching edit request count:", err));
    }
    if (activeSection === 'approval-item-hub' || activeSection === 'dashboard') {
      const currentUserId = user.Userid || user.userid || user.id || user.Id || '';
      const catalogId = user.Catelogid || user.catelogid || '';
      fetch(`${API_URL}/api/item/pending?pageSize=1&currentUserId=${currentUserId}&catelogid=${catalogId}`)
        .then(res => res.json())
        .then(data => {
          if (data && typeof data.totalCount === 'number') {
            setPendingItemApprovalCount(data.totalCount);
          }
        })
        .catch(err => console.error("Error fetching item approval count:", err));
    }

    if (activeSection === 'purchase-approval-hub' || activeSection === 'purchase-warehouse-hub' || activeSection === 'Purchase/Warehouse' || activeSection === 'purchase/warehouse') {
      fetch(`${API_URL}/api/purchaseapproval/pending`)
        .then(res => res.json())
        .then(data => {
          if (data && typeof data.count === 'number') {
            setPendingPurchaseCount(data.count);
          }
        })
        .catch(err => console.error("Error fetching purchase approval count:", err));

      // Fetch Purchase Edit Request Count specifically for the warehouse hub
      fetch(`${API_URL}/api/purchaseapproval/edit-requests-full`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const list = data.List1 || data.list1 || data.data || [];
            setPendingEditCount(list.length);
          }
        })
        .catch(err => console.error("Error fetching purchase edit request count:", err));
    }
  }, [activeSection, API_URL, user]);


  // Comprehensive Icon Mapping Function - Returns icon name for SVG
  const getIconForMenu = (name, type = 'module') => {
    if (!name) return 'default';
    const normalizedName = String(name).toLowerCase().trim();

    // Icon mapping for modules (main menu items)
    const moduleIcons = {
      'dashboard': 'dashboard',
      'admin settings': 'settings',
      'adminsettings': 'settings',
      'human resources': 'users',
      'hr': 'users',
      'sales': 'sales',
      'finance': 'finance',
      'warehouse': 'warehouse',
      'purchase': 'purchase',
      'purchasing': 'purchase',
      'inventory': 'inventory',
      'stock': 'stock',

      'production': 'warehouse',

      'quality': 'check',
      'maintenance': 'settings',
      'project': 'modules',
      'crm': 'users',
      'marketing': 'email',
      'accounting': 'finance',
      'reporting': 'dashboard',
      'analytics': 'dashboard',
      'settings': 'settings',
      'configuration': 'settings',
      'approvals': 'approvals',
      'approval': 'approvals',
      'workflow': 'workflow',
      'purchase approval': 'approvals',
      'purchase-approval': 'approvals'
    };

    // Icon mapping for submodules (submenu items)
    const submoduleIcons = {
      'profile': 'user',
      'security': 'security',
      'role management': 'roles',
      'rolemanagement': 'roles',
      'roles': 'roles',
      'marketplace': 'marketplace',
      'modules & submodules': 'modules',
      'modules': 'modules',
      'module': 'modules',
      'submodules': 'modules',
      'submodule': 'modules',
      'purchase bills': 'bill',
      'bills': 'bill',
      'purchase': 'purchase',
      'role permissions': 'permissions',
      'permissions': 'permissions',
      'permission': 'permissions',
      'preferences': 'settings',
      'notifications': 'notifications',
      'system settings': 'system',
      'system': 'system',
      'user management': 'users',
      'users': 'users',
      'user': 'user',
      'employees': 'user',
      'employee': 'user',
      'customers': 'users',
      'customer': 'users',
      'vendors': 'users',
      'vendor': 'users',
      'products': 'warehouse',
      'product': 'warehouse',
      'stock': 'stock',
      'stock transfer': 'stock',
      'stocktransfer': 'stock',
      'inventory': 'inventory',
      'pickup': 'receive',
      'delivery': 'receive',




      'orders': 'bill',
      'order': 'bill',
      'invoices': 'bill',
      'invoice': 'bill',
      'payments': 'payment',
      'payment': 'payment',
      'reports': 'dashboard',
      'report': 'dashboard',
      'analytics': 'dashboard',
      'dashboard': 'dashboard',
      'settings': 'settings',
      'configuration': 'settings',
      'backup': 'system',
      'logs': 'default',
      'audit': 'default',
      'email settings': 'email',
      'email': 'email',
      'smtp settings': 'email',
      'smtp': 'email',
      'variants': 'variants',
      'variant': 'variants',
      'catalog': 'catalog',
      'catalog management': 'catalog',
      'stock location': 'location',
      'stocklocation': 'location',
      'stock location management': 'location',
      'bill format': 'bill',
      'billformat': 'bill',
      'bill format management': 'bill',
      'decimal format': 'decimal',
      'decimalformat': 'decimal',
      'costing': 'calculate',
      'decimal format management': 'decimal',
      'date format': 'date',
      'dateformat': 'date',
      'date format management': 'date',
      'payment terms': 'payment',
      'paymentterms': 'payment',
      'payment terms management': 'payment',
      'currency': 'currency',
      'currency management': 'currency',
      'vat': 'vat',
      'vat settings': 'vat',
      'vat management': 'vat',
      'stockcheck': 'check',
      'stock check': 'check',
      'stock check set': 'check',
      'stock check status': 'check',
      'stock check management': 'check',
      'bankaccount': 'bank',
      'bank account': 'bank',
      'bank account management': 'bank',
      'vehicle': 'vehicle',
      'vehicle details': 'vehicle',
      'vehicle management': 'vehicle',
      'driver': 'driver',
      'driver details': 'driver',
      'driver management': 'driver',
      'salesreturn': 'return',
      'sales return': 'return',
      'sales return conditions': 'return',
      'dashboard content view': 'dashboard',
      'dashboardcontent': 'dashboard',
      'items': 'warehouse',
      'combo': 'modules',
      'category': 'modules',
      'brand': 'marketplace',
      'product brand': 'marketplace',
      'all products': 'warehouse',
      'supplier': 'supplier',
      'suppliers': 'supplier',
      'supplier management': 'supplier',
      'approval request': 'approvals',
      'edit request': 'requests',
      'receive items': 'receive',
      'receive-items': 'receive',
      'salesquote': 'salesquote',
      'sales quote': 'salesquote',
      'sales-quote': 'salesquote',
      'quote': 'salesquote',
      'quotes': 'salesquote'
    };

    // Use appropriate icon map based on type
    const iconMap = type === 'module' ? moduleIcons : submoduleIcons;

    // Try exact match first
    if (iconMap[normalizedName]) {
      return iconMap[normalizedName];
    }

    // Try partial match
    for (const [key, icon] of Object.entries(iconMap)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return icon;
      }
    }

    // Default icons based on type
    return type === 'module' ? 'warehouse' : 'default';
  };

  // We intentionally avoid forcing URL navigation from state here to prevent
  // back-button loops. Handlers that change sections will call navigate()
  // directly, while this component listens to URL changes via useLocation
  // and updates state accordingly (see the effect above).

  // Listen for browser back/forward buttons - Logic removed to prevent conflict with React Router
  // React Router's useLocation hook (above) already creates the necessary side effects.

  // Fetch role-based modules and submodules
  useEffect(() => {
    const loadUserMenu = async () => {
      // Check user and role - handle both Role and role (case sensitivity)
      const userRole = user?.Role || user?.role;
      if (!user || !userRole) {
        console.warn('No user or role found:', user);
        setLoadingMenu(false);
        setMenuItems([
          { id: 'dashboard', label: 'Dashboard', icon: getIconForMenu('Dashboard', 'module'), submenus: [] }
        ]);
        return;
      }

      try {
        setLoadingMenu(true);
        console.log('Loading menu for user:', user, 'Role:', userRole);

        // First, get role ID from role name
        const roleResponse = await fetch(`${API_URL}/api/role/byname/${encodeURIComponent(userRole)}`);
        const roleData = await roleResponse.json();
        console.log('Role API response:', roleData);

        if (!roleData.success || !roleData.roles || roleData.roles.length === 0) {
          console.warn('Role not found or invalid:', userRole);
          setLoadingMenu(false);
          setMenuItems([
            { id: 'dashboard', label: 'Dashboard', icon: getIconForMenu('Dashboard', 'module'), submenus: [] }
          ]);
          return;
        }

        const roleId = roleData.roles[0].Id || roleData.roles[0].id;
        console.log('User role ID:', roleId, 'Role name:', userRole);

        // Fetch permissions for this role to check View access
        const permissionsResponse = await fetch(`${API_URL}/api/permission/role/${roleId}`);
        const permissionsData = await permissionsResponse.json();

        const permissions = permissionsData.success ? (permissionsData.permissions || []) : [];
        console.log('User permissions:', permissions);

        // Create a set of module/submodule IDs that have View or Full Access permission
        const allowedModuleIds = new Set();
        const allowedSubModuleIds = new Set();

        permissions.forEach(p => {
          const permissionType = (p.PermissionType || p.permissionType || '').trim();
          const moduleId = p.ModuleId || p.moduleId;
          const subModuleId = p.SubModuleId || p.subModuleId;

          if (permissionType === 'View' || permissionType === 'Full Access') {
            if (moduleId && (!subModuleId || subModuleId === null || subModuleId === 0)) {
              // Module-level permission (no submodule)
              allowedModuleIds.add(moduleId);
            } else if (moduleId && subModuleId) {
              // Submodule-level permission
              allowedSubModuleIds.add(subModuleId);
              // Also allow the parent module
              allowedModuleIds.add(moduleId);
            }
          }
        });

        console.log('Allowed module IDs:', Array.from(allowedModuleIds));
        console.log('Allowed submodule IDs:', Array.from(allowedSubModuleIds));

        // Fetch modules that this role can view
        // The API endpoint /api/module/role/{roleId} already filters by permissions
        const modulesResponse = await fetch(`${API_URL}/api/module/role/${roleId}`);
        const modulesData = await modulesResponse.json();
        console.log('Modules API response:', modulesData);

        const allModules = modulesData.success ? (modulesData.modules || []) : [];
        console.log('All modules from API:', allModules);

        // The API endpoint /api/module/role/{roleId} already filters by permissions
        // So we can use all modules it returns directly
        const accessibleModules = allModules;

        console.log('✅ Accessible modules:', accessibleModules.length, accessibleModules);

        // Fetch submodules for each accessible module
        const menuItemsList = [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: getIconForMenu('Dashboard', 'module'),
            submenus: []
          }
        ];

        // Process all modules from database (including Admin Settings if it exists)
        for (const module of accessibleModules) {
          const moduleId = module.Id || module.id;
          const moduleName = module.ModuleName || module.moduleName;

          // Check if this is Admin Settings module - fetch ALL submodules without permission filtering
          const isAdminSettings = moduleName && (moduleName.toLowerCase() === 'admin settings' || moduleName.toLowerCase() === 'adminsettings');

          // STRICTLY restrict Admin Settings to 'Admin' role
          if (isAdminSettings && userRole.toLowerCase() !== 'admin') {
            console.log('Skipping Admin Settings for non-admin user:', userRole);
            continue;
          }

          let allSubModules = [];

          if (isAdminSettings) {
            // For Admin Settings, fetch ALL submodules without role/permission filtering
            const subModulesResponse = await fetch(`${API_URL}/api/submodule?moduleId=${moduleId}`);
            const subModulesData = await subModulesResponse.json();
            allSubModules = subModulesData.success ? (subModulesData.subModules || []) : [];
            console.log(`✅ ALL submodules for Admin Settings(${moduleId}): `, allSubModules.length, allSubModules);
          } else {
            // For other modules, fetch submodules filtered by role permissions
            const subModulesResponse = await fetch(`${API_URL}/api/submodule/role/${roleId}?moduleId=${moduleId}`);
            const subModulesData = await subModulesResponse.json();
            allSubModules = subModulesData.success ? (subModulesData.subModules || []) : [];

            // The API endpoint /api/submodule/role/{roleId} already filters by permissions
            // So we can use all submodules it returns directly
            // But if we have specific submodule permissions, we can filter further
            allSubModules = allowedSubModuleIds.size > 0
              ? allSubModules.filter(sm => {
                const subModuleId = sm.Id || sm.id;
                // Include if submodule has permission OR parent module has permission
                return allowedSubModuleIds.has(subModuleId) || allowedModuleIds.has(moduleId);
              })
              : allSubModules; // Use all submodules from API if no specific permissions
          }

          const accessibleSubModules = allSubModules;
          console.log(`✅ Accessible submodules for module ${moduleId}(${moduleName}): `, accessibleSubModules.length, accessibleSubModules);

          // Build submenus from database submodules
          let submenus = accessibleSubModules.map(sm => {
            const smId = sm.Id || sm.id;
            const smName = sm.SubModuleName || sm.subModuleName;

            // Map database submodule names to section IDs
            // Use global mapping for known administrative sections
            const normalizedSM = smName.toLowerCase().trim();
            const normalizedMod = (moduleName || '').toLowerCase().trim();

            let adminSectionId = `module-${moduleId}-sub-${smId}`;
            let foundMapping = false;

            // 1. Try specific mappings for Approvals FIRST to prevent collisions with global names like "Items"
            if (normalizedMod === 'approvals' && (normalizedSM === 'product' || normalizedSM === 'products')) {
              adminSectionId = 'approval-product-hub';
              foundMapping = true;
            } else if (normalizedMod === 'approvals' && (normalizedSM === 'items' || normalizedSM === 'item')) {
              adminSectionId = 'approval-item-hub';
              foundMapping = true;
            } else if (normalizedMod === 'approvals' && (normalizedSM.includes('sales return') || normalizedSM.includes('salesreturn'))) {
              adminSectionId = 'approval-sales-return-hub';
              foundMapping = true;
            } else if (normalizedMod === 'approvals' && (normalizedSM.includes('stock transfer') || normalizedSM.includes('stocktransfer'))) {
              adminSectionId = 'stock-transfer-approval';
              foundMapping = true;
            }


            // 2. If not an approval override, try exact match in global mapping
            if (!foundMapping && SUBMODULE_SECTION_MAPPING[normalizedSM]) {
              adminSectionId = SUBMODULE_SECTION_MAPPING[normalizedSM];
              foundMapping = true;
            }

            // 3. Try partial matches if still not found
            if (!foundMapping) {
              // Try partial match - mapping key must be part of the submodule name
              for (const [key, value] of Object.entries(SUBMODULE_SECTION_MAPPING)) {
                if (normalizedSM.includes(key)) {
                  adminSectionId = value;
                  foundMapping = true;
                  break;
                }
              }
            }

            // If no administrative mapping, use hierarchical URL structure
            if (!foundMapping) {
              // Create clean, URL-friendly hierarchical ID using forward slashes
              // Convert to title case and preserve spaces
              const toTitleCase = (str) => str.split(' ').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              ).join('');

              const modSlug = toTitleCase(moduleName || '');
              const smSlug = toTitleCase(smName || '');
              adminSectionId = `${modSlug}/${smSlug}`;
            }

            console.log(`Mapping submodule "${smName}" in "${moduleName}" to ID: ${adminSectionId}`);

            // Get icon using the centralized icon mapping function
            const submenuIcon = getIconForMenu(smName, 'submodule');

            // Override label for Approvals -> Items to 'Approval-Items' as requested
            let displayLabel = smName;
            if (adminSectionId === 'approval-item-hub') displayLabel = 'Approval-Items';
            if (adminSectionId === 'inventory-pickupnotification') displayLabel = 'Pickup Notification';

            return {
              id: adminSectionId,
              label: displayLabel,
              icon: submenuIcon
            };
          });

          // Add module to menu (even if no submodules, if module itself is accessible)
          // Use 'admin' as ID if it's Admin Settings module for consistency
          let menuId = (moduleName && (moduleName.toLowerCase() === 'admin settings' || moduleName.toLowerCase() === 'adminsettings'))
            ? 'admin'
            : `module-${moduleId}`;

          // Normalize module ID if mapped (e.g., module-1008 -> workflow)
          if (SUBMODULE_SECTION_MAPPING[menuId]) {
            menuId = SUBMODULE_SECTION_MAPPING[menuId];
          }

          // Get icon using the centralized icon mapping function
          const moduleIcon = getIconForMenu(moduleName, 'module');

          // If Admin Settings has no submenus from database, add hardcoded fallback submenus
          if (menuId === 'admin' && submenus.length === 0) {
            console.warn('Admin Settings has no submenus from database, using fallback submenus');
            submenus = [
              { id: 'admin-profile', label: 'Profile', icon: getIconForMenu('Profile', 'submodule') },
              { id: 'admin-security', label: 'Security', icon: getIconForMenu('Security', 'submodule') },
              { id: 'admin-roles', label: 'Role Management', icon: getIconForMenu('Role Management', 'submodule') },
              { id: 'admin-marketplace', label: 'Marketplace', icon: getIconForMenu('Marketplace', 'submodule') },
              { id: 'admin-modules', label: 'Modules & SubModules', icon: getIconForMenu('Modules & Submodules', 'submodule') },
              { id: 'admin-catalog', label: 'Catalog Management', icon: getIconForMenu('Catalog Management', 'submodule') },
              { id: 'admin-stocklocation', label: 'Stock Location', icon: getIconForMenu('Stock Location', 'submodule') },
              { id: 'admin-billformat', label: 'Bill Format', icon: getIconForMenu('Bill Format', 'submodule') },
              { id: 'admin-decimalformat', label: 'Decimal Format', icon: getIconForMenu('Decimal Format', 'submodule') },
              { id: 'admin-dateformat', label: 'Date Format', icon: getIconForMenu('Date Format', 'submodule') },
              { id: 'admin-paymentterms', label: 'Payment Terms', icon: getIconForMenu('Payment Terms', 'submodule') },
              { id: 'admin-currency', label: 'Currency', icon: getIconForMenu('Currency', 'submodule') },
              { id: 'admin-permissions', label: 'Role Permissions', icon: getIconForMenu('Role Permissions', 'submodule') },
              { id: 'admin-preferences', label: 'Preferences', icon: getIconForMenu('Preferences', 'submodule') },
              { id: 'admin-notifications', label: 'Notifications', icon: getIconForMenu('Notifications', 'submodule') },
              { id: 'admin-system', label: 'System Settings', icon: getIconForMenu('System Settings', 'submodule') },
              { id: 'admin-users', label: 'User Management', icon: getIconForMenu('User Management', 'submodule') },
              { id: 'admin-email', label: 'Email Settings', icon: getIconForMenu('Email Settings', 'submodule') },
              { id: 'admin-variants', label: 'Variants', icon: getIconForMenu('Variants', 'submodule') }
            ];
          }

          // Restrict Packinglist visibility to Warehouse staff only
          if (submenus && submenus.length > 0) {
            const roleNameLower = (userRole || '').toString().toLowerCase();
            const normalizedRole = roleNameLower.replace(/\s|_/g, '');
            submenus = submenus.filter(sm => {
              if ((sm.id || '').toLowerCase() === 'stock-packinglist') {
                return normalizedRole.includes('warehousestaff') ||
                  normalizedRole === 'warehouse' ||
                  normalizedRole === 'warehouse-staff' ||
                  normalizedRole === 'whstaff';
              }
              return true;
            });
          }

          menuItemsList.push({
            id: menuId,
            label: moduleName,
            icon: moduleIcon,
            submenus: submenus
          });
        }

        setMenuItems(menuItemsList);
        console.log('Menu items loaded:', menuItemsList);

        // Removed Auto-expand Admin Settings logic to keep all modules collapsed by default
        const adminSettingsItem = menuItemsList.find(item => item.id === 'admin');
        if (adminSettingsItem) {
          if (adminSettingsItem.submenus && adminSettingsItem.submenus.length > 0) {
            console.log('Admin Settings found with', adminSettingsItem.submenus.length, 'submenus');
          }
        } else {
          // If Admin Settings not found in database, add it with hardcoded submenus (ONLY for Admin)
          if (userRole.toLowerCase() === 'admin') {
            console.warn('Admin Settings not found in database, adding with hardcoded submenus');
            const fallbackAdminSettings = {
              id: 'admin',
              label: 'Admin Settings',
              icon: getIconForMenu('Admin Settings', 'module'),
              submenus: [
                { id: 'admin-profile', label: 'Profile', icon: getIconForMenu('Profile', 'submodule') },
                { id: 'admin-security', label: 'Security', icon: getIconForMenu('Security', 'submodule') },
                { id: 'admin-roles', label: 'Role Management', icon: getIconForMenu('Role Management', 'submodule') },
                { id: 'admin-marketplace', label: 'Marketplace', icon: getIconForMenu('Marketplace', 'submodule') },
                { id: 'admin-modules', label: 'Modules & SubModules', icon: getIconForMenu('Modules & Submodules', 'submodule') },
                { id: 'admin-catalog', label: 'Catalog Management', icon: getIconForMenu('Catalog Management', 'submodule') },
                { id: 'admin-stocklocation', label: 'Stock Location', icon: getIconForMenu('Stock Location', 'submodule') },
                { id: 'admin-billformat', label: 'Bill Format', icon: getIconForMenu('Bill Format', 'submodule') },
                { id: 'admin-decimalformat', label: 'Decimal Format', icon: getIconForMenu('Decimal Format', 'submodule') },
                { id: 'admin-dateformat', label: 'Date Format', icon: getIconForMenu('Date Format', 'submodule') },
                { id: 'admin-paymentterms', label: 'Payment Terms', icon: getIconForMenu('Payment Terms', 'submodule') },
                { id: 'admin-currency', label: 'Currency', icon: getIconForMenu('Currency', 'submodule') },
                { id: 'admin-vat', label: 'VAT Settings', icon: getIconForMenu('VAT Settings', 'submodule') },
                { id: 'admin-stockcheck', label: 'Stock Check Set', icon: getIconForMenu('Stock Check', 'submodule') },
                { id: 'admin-bankaccount', label: 'Bank Account', icon: getIconForMenu('Bank Account', 'submodule') },
                { id: 'admin-vehicle', label: 'Vehicle Details', icon: getIconForMenu('Vehicle Details', 'submodule') },
                { id: 'admin-driver', label: 'Driver Details', icon: getIconForMenu('Driver Details', 'submodule') },

                { id: 'admin-dashboardcontent', label: 'Dashboard Content View', icon: getIconForMenu('Dashboard Content View', 'submodule') },
                { id: 'admin-permissions', label: 'Role Permissions', icon: getIconForMenu('Role Permissions', 'submodule') },
                { id: 'admin-preferences', label: 'Preferences', icon: getIconForMenu('Preferences', 'submodule') },
                { id: 'admin-notifications', label: 'Notifications', icon: getIconForMenu('Notifications', 'submodule') },
                { id: 'admin-system', label: 'System Settings', icon: getIconForMenu('System Settings', 'submodule') },
                { id: 'admin-users', label: 'User Management', icon: getIconForMenu('User Management', 'submodule') },
                { id: 'admin-email', label: 'Email Settings', icon: getIconForMenu('Email Settings', 'submodule') }
              ]
            };
            menuItemsList.push(fallbackAdminSettings);
          }
        }

        // Ensure Inventory module has all necessary submodules
        let inventoryModule = menuItemsList.find(item => item.label.toLowerCase() === 'inventory');
        console.log('DEBUG: Found inventory module:', inventoryModule?.label);
        if (!inventoryModule) {
          inventoryModule = {
            id: 'module-inventory',
            label: 'Inventory',
            icon: getIconForMenu('Inventory', 'module'),
            submenus: [
              { id: 'inventory-stock', label: 'Stock', icon: getIconForMenu('Stock', 'submodule') },
              { id: 'inventory-costing', label: 'Costing', icon: getIconForMenu('Costing', 'submodule') },
              { id: 'inventory-stockadjustment', label: 'Stock Adjustment', icon: getIconForMenu('Stock', 'submodule') },
              { id: 'inventory-stocktransfer', label: 'Stock Transfer', icon: getIconForMenu('Stock Transfer', 'submodule') },
              { id: 'inventory-pickup', label: 'Pickup', icon: getIconForMenu('pickup', 'submodule') },
              { id: 'inventory-pickupnotification', label: 'Pickup Notification', icon: getIconForMenu('Notifications', 'submodule') },
              { id: 'inventory-delivery', label: 'Delivery', icon: getIconForMenu('delivery', 'submodule') }
            ]
          };
          menuItemsList.push(inventoryModule);
        }

        // Inject Packing List submenu for Warehouse Staff roles if missing
        if (inventoryModule) {
          const roleNameLower = (userRole || '').toString().toLowerCase().trim();
          const normalizedRole = roleNameLower.replace(/\s|_/g, '');
          const isWarehouseStaff =
            normalizedRole.includes('warehousestaff') ||
            normalizedRole === 'warehouse' ||
            normalizedRole === 'warehouse-staff' ||
            normalizedRole === 'whstaff';
          const hasPackingList = inventoryModule.submenus.some(sm => (sm.id || '').toLowerCase() === 'stock-packinglist');
          if (isWarehouseStaff && !hasPackingList) {
            inventoryModule.submenus.push({
              id: 'stock-packinglist',
              label: 'Packing List',
              icon: getIconForMenu('Stock', 'submodule')
            });
          }
        }

        // Always add Pickup Notification if not present, especially for Salescoordinators and Admin
        if (inventoryModule && !inventoryModule.submenus.find(sm => sm.id === 'inventory-pickupnotification')) {
          const userRoleLower = (userRole || '').toLowerCase().trim();
          console.log('DEBUG: Current user role:', userRoleLower);

          // Be more inclusive in the role check
          const isAuthorized = userRoleLower.includes('admin') ||
            userRoleLower.includes('salescoordinator') ||
            userRoleLower.includes('sales coordinator') ||
            userRoleLower.includes('manager');

          console.log('DEBUG: Is authorized for Pickup Notification:', isAuthorized);

          if (isAuthorized) {
            console.log('DEBUG: Injecting Pickup Notification submodule');
            inventoryModule.submenus.push({
              id: 'inventory-pickupnotification',
              label: 'Pickup Notification',
              icon: getIconForMenu('Notifications', 'submodule')
            });
          }
        }

        let approvalsModule = menuItemsList.find(item =>
          item.label.toLowerCase() === 'approvals' || item.id === 'approvals'
        );

        if (!approvalsModule) {
          approvalsModule = {
            id: 'approvals',
            label: 'Approvals',
            icon: getIconForMenu('Approvals', 'module'),
            submenus: []
          };
          menuItemsList.push(approvalsModule);
        }

        if (approvalsModule) {
          // Stock Transfer Approval
          const hasStockTransfer = approvalsModule.submenus.some(sm =>
            sm.id === 'stock-transfer-approval' || sm.label.toLowerCase().includes('stock transfer')
          );
          if (!hasStockTransfer) {
            approvalsModule.submenus.push({
              id: 'stock-transfer-approval',
              label: 'Stock Transfer Approval',
              icon: getIconForMenu('Stock Transfer', 'submodule')
            });
          }

          // Sales Return Approval
          const hasSalesReturnApproval = approvalsModule.submenus.some(sm =>
            sm.id === 'approval-sales-return-hub' || sm.label.toLowerCase().includes('sales return approval')
          );
          if (!hasSalesReturnApproval) {
            approvalsModule.submenus.push({
              id: 'approval-sales-return-hub',
              label: 'Sales Return Approval',
              icon: getIconForMenu('Sales Return', 'submodule')
            });
          }

          // Stock Adjustment Approval
          const hasStockAdjustmentApproval = approvalsModule.submenus.some(sm =>
            sm.id === 'stock-adjustment-approval' || sm.label.toLowerCase().includes('stock adjustment approval')
          );
          if (!hasStockAdjustmentApproval) {
            approvalsModule.submenus.push({
              id: 'stock-adjustment-approval',
              label: 'Stock Adjustment Approval',
              icon: getIconForMenu('Approvals', 'submodule')
            });
          }

          // Set Approval (Managers only)
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const currentRole = (currentUser.Role || currentUser.role || '').toString().toLowerCase();
          const isManagerOnly = currentRole.includes('manager') && !currentRole.includes('admin');
          const hasSetApproval = approvalsModule.submenus.some(sm =>
            sm.id === 'set-approval' || (sm.label || '').toLowerCase().includes('set approval')
          );
          if (!hasSetApproval && (currentRole.includes('manager') || currentRole.includes('admin'))) {
            approvalsModule.submenus.push({
              id: 'set-approval',
              label: 'Set Approval',
              icon: getIconForMenu('Approvals', 'submodule')
            });
          }

          // Product Approval Request
          const hasProductApproval = approvalsModule.submenus.some(sm =>
            sm.id === 'approval-product-request' || sm.label.toLowerCase().includes('approval request')
          );
          if (!hasProductApproval) {
            approvalsModule.submenus.push({
              id: 'approval-product-request',
              label: 'Approval Request',
              icon: getIconForMenu('Items', 'submodule')
            });
          }

          // Product Edit Request
          const hasProductEditRequest = approvalsModule.submenus.some(sm =>
            sm.id === 'approval-product-edit' || sm.label.toLowerCase().includes('edit request')
          );
          if (!hasProductEditRequest) {
            approvalsModule.submenus.push({
              id: 'approval-product-edit',
              label: 'Edit Request',
              icon: getIconForMenu('Edit Request', 'submodule')
            });
          }

          // Set Approvals (Managers only)
          const roleLowerForSet = (user?.Role || user?.role || '').toString().toLowerCase();
          const isManagerRole = roleLowerForSet.includes('manager');
          const hasSetApprovals = approvalsModule.submenus.some(sm =>
            sm.id === 'set-approvals' || (sm.label || '').toLowerCase().includes('set approvals')
          );
          if (isManagerRole && !hasSetApprovals) {
            approvalsModule.submenus.push({
              id: 'set-approvals',
              label: 'Set Approvals',
              icon: getIconForMenu('Approvals', 'submodule')
            });
          }
        }

        // Ensure Product Management module is visible for Admin and Manager roles
        let productModule = menuItemsList.find(item =>
          item.label.toLowerCase().includes('product management') ||
          item.label.toLowerCase().includes('product details')
        );

        console.log('DEBUG: Found product module:', productModule?.label);

        if (!productModule) {
          const userRoleLower = (userRole || '').toLowerCase().trim();
          if (userRoleLower.includes('admin') || userRoleLower.includes('manager')) {
            console.log('DEBUG: Injecting Product Management module for role:', userRoleLower);
            productModule = {
              id: 'module-product-management',
              label: 'Product Management',
              icon: getIconForMenu('Product Details', 'module'),
              submenus: [
                { id: 'product-items', label: 'Add Product', icon: getIconForMenu('Items', 'submodule') },
                { id: 'product-all', label: 'All Products', icon: getIconForMenu('All Products', 'submodule') },
                { id: 'product-brand', label: 'Brand', icon: getIconForMenu('Brand', 'submodule') },
                { id: 'product-category', label: 'Category', icon: getIconForMenu('Category', 'submodule') },
                { id: 'product-combo', label: 'Combo', icon: getIconForMenu('Combo', 'submodule') },
                { id: 'admin-variants', label: 'Variants', icon: getIconForMenu('Variants', 'submodule') }
              ]
            };
            menuItemsList.push(productModule);
          }
        }

        setMenuItems(menuItemsList);

      } catch (error) {
        console.error('Error loading user menu:', error);
        // Fallback to default menu on error with hardcoded Admin Settings submenus
        const fallbackMenu = [
          { id: 'dashboard', label: 'Dashboard', icon: getIconForMenu('Dashboard', 'module'), submenus: [] }
        ];

        if (userRole && userRole.toLowerCase() === 'admin') {
          fallbackMenu.push({
            id: 'admin',
            label: 'Admin Settings',
            icon: getIconForMenu('Admin Settings', 'module'),
            submenus: [
              { id: 'admin-profile', label: 'Profile', icon: getIconForMenu('Profile', 'submodule') },
              { id: 'admin-security', label: 'Security', icon: getIconForMenu('Security', 'submodule') },
              { id: 'admin-roles', label: 'Role Management', icon: getIconForMenu('Role Management', 'submodule') },
              { id: 'admin-marketplace', label: 'Marketplace', icon: getIconForMenu('Marketplace', 'submodule') },
              { id: 'admin-modules', label: 'Modules & SubModules', icon: getIconForMenu('Modules & Submodules', 'submodule') },
              {
                id: 'product-details', label: 'Product Details', icon: getIconForMenu('Product Details', 'module'), submenus: [
                  { id: 'product-brand', label: 'Brand', icon: getIconForMenu('Brand', 'submodule') },
                  { id: 'product-combo', label: 'Combo', icon: getIconForMenu('Combo', 'submodule') }
                ]
              },
              { id: 'admin-catalog', label: 'Catalog Management', icon: getIconForMenu('Catalog Management', 'submodule') },
              { id: 'admin-stocklocation', label: 'Stock Location', icon: getIconForMenu('Stock Location', 'submodule') },
              { id: 'admin-billformat', label: 'Bill Format', icon: getIconForMenu('Bill Format', 'submodule') },
              { id: 'admin-decimalformat', label: 'Decimal Format', icon: getIconForMenu('Decimal Format', 'submodule') },
              { id: 'admin-dateformat', label: 'Date Format', icon: getIconForMenu('Date Format', 'submodule') },
              { id: 'admin-paymentterms', label: 'Payment Terms', icon: getIconForMenu('Payment Terms', 'submodule') },
              { id: 'admin-currency', label: 'Currency', icon: getIconForMenu('Currency', 'submodule') },
              { id: 'admin-permissions', label: 'Role Permissions', icon: getIconForMenu('Role Permissions', 'submodule') },
              { id: 'admin-preferences', label: 'Preferences', icon: getIconForMenu('Preferences', 'submodule') },
              { id: 'admin-notifications', label: 'Notifications', icon: getIconForMenu('Notifications', 'submodule') },
              { id: 'admin-system', label: 'System Settings', icon: getIconForMenu('System Settings', 'submodule') },
              { id: 'admin-users', label: 'User Management', icon: getIconForMenu('User Management', 'submodule') },
              { id: 'admin-email', label: 'Email Settings', icon: getIconForMenu('Email Settings', 'submodule') }
            ]
          });
        }

        setMenuItems(fallbackMenu);
        // Auto-expand removed to keep sidebar collapsed by default
      } finally {
        setLoadingMenu(false);
      }
    };

    loadUserMenu();
  }, [user.Role]);

  // Toggle menu expansion - Accordion style (only one open at a time)
  const toggleMenu = (menuId) => {
    const newExpanded = new Set();
    // If the clicked menu is NOT already expanded, add it.
    // If it WAS expanded, we do nothing (so it closes because newExpanded is empty).
    if (!expandedMenus.has(menuId)) {
      newExpanded.add(menuId);
    }
    setExpandedMenus(newExpanded);
  };

  // Handle menu item click
  const handleMenuClick = (item, submenuId = null) => {
    console.log('Menu clicked:', item.id, 'Has submenus:', item.submenus?.length || 0, item.submenus);

    if (item.submenus && item.submenus.length > 0) {
      // If has submenus, toggle expansion (accordion style)
      toggleMenu(item.id);
    } else {
      // If no submenus or submenu clicked, set active section
      const sectionId = submenuId || item.id;

      // Use mapped URL if available (e.g., module-1008 -> workflow)
      const mappedUrl = SUBMODULE_SECTION_MAPPING[sectionId] || SUBMODULE_SECTION_MAPPING[item.label.toLowerCase()] || sectionId;

      // Update URL - use simplified name if mapped
      const newPath = mappedUrl === 'dashboard' ? '/' : `/${mappedUrl}`;
      navigate(newPath);

      // Close sidebar on mobile after selection
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      }
    }
  };

  // Handle submenu click
  const handleSubmenuClick = (submenuId, e) => {
    e.stopPropagation(); // Prevent parent menu toggle
    // Sync sidebar toggle - all admin submenu IDs match their section IDs
    // We no longer set activeSection directly here to prevent conflict with URL sync

    // Resolve pretty URL using mapping if available
    const mappedUrl = SUBMODULE_SECTION_MAPPING[submenuId] || submenuId;

    // Update URL - using navigate instead of pushState to prevent syncing issues
    const newPath = mappedUrl === 'dashboard' ? '/' : `/${mappedUrl}`;
    navigate(newPath, { state: { section: submenuId } });


    // Close sidebar on mobile after selection
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }

    console.log('Submenu clicked:', submenuId, 'URL updated to:', newPath);
  };

  const handleLogout = () => {
    logoutUser();
  };



  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#052859', color: '#ffffff' }}>
      {/* Logo Section */}
      <Box sx={{
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 80,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s',
        cursor: 'pointer',
        overflow: 'hidden',
        bgcolor: '#ffffff'
      }} onClick={() => isMobile && setSidebarOpen(false)}>
        <img
          src={logo}
          alt="ASAS Logo"
          style={{
            height: isSidebarExpanded ? 55 : 30,
            width: 'auto',
            maxWidth: isSidebarExpanded ? '100%' : '60px',
            objectFit: 'contain',
            transition: 'all 0.3s'
          }}
        />
      </Box>

      {/* User Profile Widget */}
      <Box sx={{ p: 2, overflow: 'hidden' }}>
        <Paper elevation={0} sx={{
          p: 1.5,
          bgcolor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
          gap: isSidebarExpanded ? 1.5 : 0,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s'
        }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#3b82f6', fontSize: '0.875rem', border: '2px solid rgba(255,255,255,0.2)' }}>
            {(user.Firstname || user.firstname || user.email || 'A').charAt(0).toUpperCase()}
          </Avatar>
          {isSidebarExpanded && (
            <>
              <Box sx={{ overflow: 'hidden', flexGrow: 1 }}>
                <Typography variant="body2" fontWeight={600} color="#ffffff" noWrap>
                  {user.Firstname ? `${user.Firstname} ${user.Lastname || ''}` : (user.firstname ? `${user.firstname} ${user.lastname || ''}` : (user.email || 'Admin'))}
                </Typography>
                <Typography variant="caption" color="rgba(255, 255, 255, 0.6)" noWrap sx={{ display: 'block' }}>
                  {user.Role || user.role || 'System Admin'}
                </Typography>
              </Box>
              <IconButton
                onClick={handleUserMenuOpen}
                size="small"
                sx={{
                  color: 'rgba(255,255,255,0.6)',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: '#fff' }
                }}
              >
                <SettingsIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </>
          )}
        </Paper>
      </Box>

      {/* User Menu Popup */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        PaperProps={{
          sx: {
            mt: -1,
            ml: 1,
            bgcolor: '#ffffff',
            color: '#1e293b',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            minWidth: 180,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
            '& .MuiMenuItem-root': {
              py: 1.2,
              px: 2,
              fontSize: '0.8125rem',
              fontWeight: 600,
              gap: 1.5,
              '&:hover': { bgcolor: '#f1f5f9' }
            }
          }
        }}
      >
        <MenuItem onClick={() => { handleUserMenuClose(); navigate('/admin-profile'); }}>
          <AccountCircleIcon sx={{ fontSize: 18, opacity: 0.7 }} />
          Profile
        </MenuItem>
        <MenuItem onClick={() => { handleUserMenuClose(); navigate('/admin-security'); }}>
          <LockResetIcon sx={{ fontSize: 18, opacity: 0.7 }} />
          Change Password
        </MenuItem>
        <Divider sx={{ bgcolor: '#e2e8f0', my: 1 }} />
        <MenuItem onClick={() => { handleUserMenuClose(); handleLogout(); }} sx={{ color: '#f87171' }}>
          <Logout sx={{ fontSize: 18, color: '#f87171' }} />
          Logout
        </MenuItem>
      </Menu>

      <Box sx={{ overflow: 'auto', flex: 1, px: 1.5, py: 1 }}>
        {loadingMenu ? (
          <LoadingSpinner text="Loading menu..." color="#2563eb" />
        ) : menuItems.length === 0 ? (
          <Typography variant="body2" align="center" sx={{ py: 2, color: '#64748b' }}>
            No modules available
          </Typography>
        ) : (
          <List component="nav" disablePadding>
            {menuItems.map((item) => {
              if (!item) return null;
              const hasSubmenus = item.submenus && item.submenus.length > 0;
              const isExpanded = expandedMenus.has(item.id);
              const isActive = activeSection === item.id ||
                (hasSubmenus && item.submenus.some(sub => sub.id === activeSection));

              return (
                <Box key={item.id} sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleMenuClick(item)}
                    selected={isActive && !hasSubmenus}
                    sx={{
                      borderRadius: '32px',
                      mx: 1,
                      mb: 0.5,
                      py: 1.2,
                      px: isSidebarExpanded ? 2.5 : 1,
                      color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                      backgroundColor: isActive ? 'rgba(37, 99, 235, 0.15) !important' : 'transparent',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      display: 'flex',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        color: '#ffffff',
                        '& .MuiListItemIcon-root': { color: '#ffffff' }
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(37, 99, 235, 0.25) !important',
                        color: '#60a5fa',
                        fontWeight: 700,
                        '&:hover': { backgroundColor: 'rgba(37, 99, 235, 0.3) !important' }
                      },
                    }}
                  >
                    <ListItemIcon sx={{
                      minWidth: isSidebarExpanded ? 40 : 0,
                      mr: isSidebarExpanded ? 0 : 'auto',
                      color: isActive ? '#2563eb' : 'rgba(255, 255, 255, 0.7)',
                      justifyContent: 'center'
                    }}>
                      <IconSVG name={typeof item.icon === 'string' ? item.icon : getIconForMenu(item.label, 'module')} size={22} />
                    </ListItemIcon>
                    {isSidebarExpanded && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: isActive ? 600 : 500
                        }}
                      />
                    )}
                    {isSidebarExpanded && hasSubmenus && (
                      <Box sx={{ ml: 'auto', display: 'flex' }}>
                        {isExpanded ? <ExpandLess sx={{ fontSize: 18, opacity: 0.7 }} /> : <ExpandMore sx={{ fontSize: 18, opacity: 0.7 }} />}
                      </Box>
                    )}
                  </ListItemButton>

                  {isSidebarExpanded && hasSubmenus && (
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding sx={{ mt: 0.5, mb: 1 }}>
                        {item.submenus.map((submenu) => (
                          <ListItemButton
                            key={submenu.id}
                            selected={activeSection === submenu.id}
                            onClick={(e) => handleSubmenuClick(submenu.id, e)}
                            sx={{
                              borderRadius: '24px',
                              mx: 1.5,
                              mb: 0.2,
                              pl: isSidebarExpanded ? 4 : 1, // Adjusted padding to accommodate icon
                              pr: 2,
                              py: 0.8,
                              color: activeSection === submenu.id ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                              backgroundColor: 'transparent !important',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                color: '#ffffff',
                                bgcolor: 'rgba(255, 255, 255, 0.03)'
                              },
                              '&.Mui-selected': {
                                color: '#ffffff',
                                fontWeight: 800,
                                position: 'relative',
                                '& .MuiListItemIcon-root': { color: '#3b82f6' } // Active submodule icon color
                              },
                            }}
                          >
                            <ListItemIcon sx={{
                              minWidth: isSidebarExpanded ? 32 : 0,
                              mr: isSidebarExpanded ? 0 : 'auto',
                              color: activeSection === submenu.id ? '#3b82f6' : 'rgba(255, 255, 255, 0.4)',
                              justifyContent: 'center',
                              transition: 'color 0.2s'
                            }}>
                              <IconSVG name={typeof submenu.icon === 'string' ? submenu.icon : getIconForMenu(submenu.label, 'submodule')} size={18} />
                            </ListItemIcon>

                            {isSidebarExpanded && (
                              <ListItemText
                                primary={submenu.label}
                                primaryTypographyProps={{
                                  fontSize: '0.8125rem',
                                  fontWeight: activeSection === submenu.id ? 700 : 500
                                }}
                              />
                            )}
                          </ListItemButton>
                        ))}
                      </List>
                    </Collapse>
                  )}
                </Box>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', width: '100%', minHeight: '100vh', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${isSidebarExpanded ? drawerWidth : miniDrawerWidth}px)` },
          ml: { md: `${isSidebarExpanded ? drawerWidth : miniDrawerWidth}px` },
          transition: 'width 0.3s, margin-left 0.3s',
          bgcolor: '#f0f5fe',
          color: '#1e293b',
          boxShadow: 'none',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1, sm: 3 }, minHeight: { xs: '60px', sm: '70px' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={sidebarOpen ? "Collapse Menu" : "Expand Menu"}>
              <IconButton
                edge="start"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                sx={{
                  mr: 2,
                  bgcolor: '#ffffff',
                  color: '#052859',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                  borderRadius: '10px',
                  width: 42,
                  height: 42,
                  transition: 'all 0.3s ease',
                  border: '1px solid #e2e8f0',
                  '&:hover': {
                    bgcolor: '#052859',
                    color: '#ffffff',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 15px rgba(5, 40, 89, 0.2)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  }
                }}
              >
                <MenuIcon sx={{ fontSize: 24 }} />
              </IconButton>
            </Tooltip>



            <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b', display: { xs: 'none', sm: 'block' } }}>
              {(() => {
                // 1. Try to find the label in menuItems
                for (const item of menuItems) {
                  if (item.id === activeSection) return item.label;
                  if (item.submenus) {
                    const sub = item.submenus.find(s => s.id === activeSection);
                    if (sub) return sub.label;
                  }
                }

                // 2. Try to find if activeSection itself is a mapped value OR a key that should be mapped back
                // This handles cases like 'module-1008' appearing in header fallback
                const prettyMapping = SUBMODULE_SECTION_MAPPING[activeSection];
                if (prettyMapping) {
                  return prettyMapping.charAt(0).toUpperCase() + prettyMapping.slice(1);
                }

                const inverseMapping = Object.entries(SUBMODULE_SECTION_MAPPING).find(([key, val]) => val === activeSection);
                if (inverseMapping) {
                  // If the key is technical (like module-1008), don't show it if the value is prettier
                  const key = inverseMapping[0];
                  if (key.startsWith('module-')) {
                    return activeSection.charAt(0).toUpperCase() + activeSection.slice(1);
                  }
                  return key.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                }

                // 3. Fallback to formatting the activeSection ID
                return activeSection.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
              })()}
            </Typography>

          </Box>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
            <Paper
              component="form"
              sx={{
                p: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                maxWidth: 400,
                bgcolor: '#f8fafc',
                boxShadow: 'none',
                border: '1px solid #e2e8f0',
                borderRadius: 2
              }}
            >
              <IconButton sx={{ p: '10px' }} aria-label="search">
                <SearchIcon />
              </IconButton>
              <InputBase
                sx={{ ml: 1, flex: 1, color: '#1e293b' }}
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Paper>
          </Box>

          <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} alignItems="center">
            <IconButton size="large" color="inherit" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
              <Badge badgeContent={4} color="error" className="blink-alert">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <IconButton
              size="large"
              color="inherit"
              onClick={handleCalcClick}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              <Tooltip title="Calculator">
                <CalculateIcon />
              </Tooltip>
            </IconButton>
            <IconButton
              size="large"
              color="inherit"
              onClick={toggleFullScreen}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              <Tooltip title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}>
                <CropFreeIcon />
              </Tooltip>
            </IconButton>
            <IconButton size="large" color="inherit" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
              <SettingsIcon />
            </IconButton>

            <Popover
              open={Boolean(calcAnchor)}
              anchorEl={calcAnchor}
              onClose={handleCalcClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{ sx: { p: 2, width: '350px', borderRadius: 3, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' } }}
            >
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, textAlign: 'right', border: '1px solid #e2e8f0' }}>
                <Typography variant="h4" fontWeight={700} color="#1e293b" sx={{ letterSpacing: 1 }}>{calcValue}</Typography>
              </Box>

              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 1,
                '& .MuiButton-root': {
                  minWidth: 0,
                  height: 50,
                  borderRadius: '8px !important',
                  fontWeight: 700,
                  fontSize: '1rem'
                }
              }}>
                {/* Row 1 */}
                <Button variant="contained" onClick={clearCalc} sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}>C</Button>
                <Button variant="contained" onClick={() => setCalcValue('0')} sx={{ bgcolor: '#64748b', '&:hover': { bgcolor: '#475569' } }}>CE</Button>
                <Button variant="contained" onClick={() => performOperation('/')} sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}>/</Button>
                <Button variant="contained" onClick={() => performOperation('*')} sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}>*</Button>

                {/* Row 2 */}
                <Button variant="outlined" onClick={() => inputDigit(7)} sx={{ color: '#1e293b', borderColor: '#e2e8f0', bgcolor: '#fff', '&:hover': { bgcolor: '#f1f5f9' } }}>7</Button>
                <Button variant="outlined" onClick={() => inputDigit(8)} sx={{ color: '#1e293b', borderColor: '#e2e8f0', bgcolor: '#fff', '&:hover': { bgcolor: '#f1f5f9' } }}>8</Button>
                <Button variant="outlined" onClick={() => inputDigit(9)} sx={{ color: '#1e293b', borderColor: '#e2e8f0', bgcolor: '#fff', '&:hover': { bgcolor: '#f1f5f9' } }}>9</Button>
                <Button variant="contained" onClick={() => performOperation('-')} sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}>-</Button>

                {/* Row 3 */}
                <Button variant="outlined" onClick={() => inputDigit(4)} sx={{ color: '#1e293b', borderColor: '#e2e8f0', bgcolor: '#fff', '&:hover': { bgcolor: '#f1f5f9' } }}>4</Button>
                <Button variant="outlined" onClick={() => inputDigit(5)} sx={{ color: '#1e293b', borderColor: '#e2e8f0', bgcolor: '#fff', '&:hover': { bgcolor: '#f1f5f9' } }}>5</Button>
                <Button variant="outlined" onClick={() => inputDigit(6)} sx={{ color: '#1e293b', borderColor: '#e2e8f0', bgcolor: '#fff', '&:hover': { bgcolor: '#f1f5f9' } }}>6</Button>
                <Button variant="contained" onClick={() => performOperation('+')} sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}>+</Button>

                {/* Row 4 */}
                <Button variant="outlined" onClick={() => inputDigit(1)} sx={{ color: '#1e293b', borderColor: '#e2e8f0', bgcolor: '#fff', '&:hover': { bgcolor: '#f1f5f9' } }}>1</Button>
                <Button variant="outlined" onClick={() => inputDigit(2)} sx={{ color: '#1e293b', borderColor: '#e2e8f0', bgcolor: '#fff', '&:hover': { bgcolor: '#f1f5f9' } }}>2</Button>
                <Button variant="outlined" onClick={() => inputDigit(3)} sx={{ color: '#1e293b', borderColor: '#e2e8f0', bgcolor: '#fff', '&:hover': { bgcolor: '#f1f5f9' } }}>3</Button>
                <Button variant="contained" onClick={handleEquals} sx={{ bgcolor: '#052859', '&:hover': { bgcolor: '#0a1d37' } }}>=</Button>

                {/* Row 5 */}
                <Button variant="outlined" onClick={() => inputDigit(0)} sx={{ gridColumn: 'span 2', color: '#1e293b', borderColor: '#e2e8f0', bgcolor: '#fff', '&:hover': { bgcolor: '#f1f5f9' } }}>0</Button>
                <Button variant="outlined" onClick={inputDot} sx={{ gridColumn: 'span 2', color: '#1e293b', borderColor: '#e2e8f0', bgcolor: '#fff', '&:hover': { bgcolor: '#f1f5f9' } }}>.</Button>
              </Box>
            </Popover>

            {/* Mobile Search Icon - shows only on mobile since the main search is hidden */}
            <IconButton size="large" color="inherit" sx={{ display: { xs: 'inline-flex', md: 'none' } }}>
              <SearchIcon />
            </IconButton>

            <Box sx={{ ml: { xs: 0.5, sm: 1 }, display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 1, p: 0.5, borderRadius: 2, '&:hover': { bgcolor: 'action.hover' } }}>
              <Avatar sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 }, bgcolor: 'primary.main', fontSize: { xs: 12, sm: 14 } }}>
                {user.email ? user.email.charAt(0).toUpperCase() : 'A'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
                <Typography variant="body2" fontWeight={600} color="#1e293b" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email || 'Admin'}
                </Typography>
              </Box>
              <IconButton size="small" onClick={handleLogout} color="error" title="Logout">
                <Logout fontSize="small" />
              </IconButton>
            </Box>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { md: isSidebarExpanded ? drawerWidth : miniDrawerWidth },
          flexShrink: { md: 0 },
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Drawer
          variant="temporary"
          open={isMobile && sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          onMouseEnter={() => !isMobile && setIsHovered(true)}
          onMouseLeave={() => !isMobile && setIsHovered(false)}
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: isSidebarExpanded ? drawerWidth : miniDrawerWidth,
              borderRight: 'none',
              bgcolor: '#052859',
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              overflowX: 'hidden',
              boxShadow: '4px 0 10px rgba(0,0,0,0.1)'
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flex: 1,
          padding: '24px',
          margin: 0,
          bgcolor: '#f8fafc',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '100%',
          ml: { md: 0 },
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative'
        }}
      >
        <Toolbar sx={{ minHeight: { xs: '60px', sm: '70px' } }} /> {/* Spacer for AppBar */}

        {activeSection === 'hr' && <HumanResourcesSection searchTerm={searchTerm} />}
        {activeSection === 'dashboard' && <DashboardHomeSection user={user} onNavigate={(section) => {
          const path = section === 'dashboard' ? '/' : `/${section}`;
          navigate(path);
        }} />}
        {activeSection === 'sales' && <SalesSection />}
        {activeSection === 'sales-quote' && (
          <SalesQuoteSection
            onAddQuote={() => navigate('/sales-quote-create')}
            onEditQuote={(id) => navigate(`/sales-quote-create/${id}`)}
            onViewQuote={(id) => navigate(`/sales-quote-view/${id}`)}
          />
        )}
        {activeSection?.startsWith('sales-quote-view/') && (
          <SalesQuoteApprovalView
            quoteId={activeSection.split('/')[1]}
            onBack={() => setActiveSection('sales-quote')}
          />
        )}
        {(activeSection === 'sales-quote-create' || activeSection?.startsWith('sales-quote-create/')) && (
          <SalesQuoteCreate
            onBack={() => setActiveSection('sales-quote')}
            quoteId={activeSection.includes('/') ? activeSection.split('/')[1] : null}
            mode={activeSection.includes('/') ? 'edit' : 'create'}
          />
        )}
        {activeSection === 'sales-quote-approval' && (
          <SalesQuoteApprovalSection
            onBack={() => setActiveSection('sales')}
            onViewQuote={(id) => setActiveSection(`sales-quote-approval-view/${id}`)}
          />
        )}
        {activeSection?.startsWith('sales-quote-approval-view/') && (
          <SalesQuoteApprovalView
            quoteId={activeSection.split('/')[1]}
            onBack={() => setActiveSection('sales-quote-approval')}
          />
        )}
        {activeSection === 'finance' && <FinanceSection />}
        {activeSection === 'warehouse' && <WarehouseSection />}

        {/* Admin Settings Sections - Each opens as a separate page */}
        {activeSection === 'admin-profile' && (
          <div className="admin-page-container">
            <ProfileSection user={user} />
          </div>
        )}
        {activeSection === 'admin-security' && (
          <div className="admin-page-container">
            <SecuritySection />
          </div>
        )}
        {activeSection === 'admin-roles' && (
          <div className="admin-page-container">
            <RoleManagementSection />
          </div>
        )}
        {activeSection === 'admin-marketplace' && (
          <div className="admin-page-container">
            <MarketplaceManagementSection />
          </div>
        )}
        {activeSection === 'admin-modules' && (
          <div className="admin-page-container">
            <ModuleManagementSection />
          </div>
        )}
        {activeSection === 'admin-catalog' && (
          <div className="admin-page-container">
            <CatalogManagementSection />
          </div>
        )}
        {activeSection === 'admin-stocklocation' && (
          <div className="admin-page-container">
            <StockLocationManagementSection />
          </div>
        )}
        {(activeSection === 'inventory-stock' || activeSection === 'stock') && (
          <div className="admin-page-container">
            <StockManagementSection />
          </div>
        )}
        {activeSection === 'inventory-costing' && (
          <div className="admin-page-container">
            <CostingManagementSection />
          </div>
        )}
        {activeSection === 'inventory-stocktransfer' && (
          <div className="admin-page-container">
            <StockTransferSection />
          </div>
        )}
        {activeSection === 'inventory-stockadjustment' && (
          <div className="admin-page-container">
            <StockAdjustmentSection />
          </div>
        )}
        {activeSection === 'stock-adjustment-approval' && (
          <div className="admin-page-container">
            <StockAdjustmentApprovalSection />
          </div>
        )}
        {activeSection === 'stock-transfer-approval' && (
          <div className="admin-page-container">
            <StockTransferApprovalSection
              onViewTransfer={(row, isFinal = false) => {
                const id = row.Id || row.Stocktransferid || row.id;
                if (isFinal) {
                  navigate(`/stocktransferapprovalfinal/${id}`);
                } else {
                  navigate(`/stock-transfer-approval-view/${id}`);
                }
              }}
            />
          </div>
        )}
        {(activeSection === 'stock-transfer-approval-view' || activeSection?.startsWith('stock-transfer-approval-view/')) && (
          <StockTransferApprovalView
            transferId={activeSection.includes('/') ? activeSection.split('/')[1] : selectedStockTransferId}
            onBack={() => {
              navigate('/stock-transfer-approval');
            }}
          />
        )}
        {(activeSection === 'stock-transfer-approval-final' || activeSection?.startsWith('stocktransferapprovalfinal/')) && (
          <StockTransferApprovalFinal
            transferId={activeSection.includes('/') ? activeSection.split('/').pop() : null}
            onBack={() => {
              navigate('/stock-transfer-approval');
            }}
          />
        )}
        {activeSection === 'inventory-pickup' && (
          <div className="admin-page-container">
            <PickupSection />
          </div>
        )}
        {activeSection === 'inventory-pickupnotification' && (
          <div className="admin-page-container">
            <PickupNotificationSection />
          </div>
        )}
        {activeSection === 'inventory-delivery' && (
          <div className="admin-page-container">
            <DeliverySection />
          </div>
        )}




        {activeSection === 'admin-billformat' && (
          <div className="admin-page-container">
            <BillFormatManagementSection />
          </div>
        )}
        {activeSection === 'admin-decimalformat' && (
          <div className="admin-page-container">
            <DecimalFormatManagementSection />
          </div>
        )}
        {activeSection === 'admin-dateformat' && (
          <div className="admin-page-container">
            <DateFormatManagementSection />
          </div>
        )}
        {activeSection === 'admin-paymentterms' && (
          <div className="admin-page-container">
            <PaymentTermsManagementSection />
          </div>
        )}
        {activeSection === 'admin-currency' && (
          <div className="admin-page-container">
            <CurrencyManagementSection />
          </div>
        )}
        {activeSection === 'admin-vat' && (
          <div className="admin-page-container">
            <VATManagementSection />
          </div>
        )}
        {activeSection === 'admin-stockcheck' && (
          <div className="admin-page-container">
            <StockCheckManagementSection />
          </div>
        )}
        {activeSection === 'admin-bankaccount' && (
          <div className="admin-page-container">
            <BankAccountManagementSection />
          </div>
        )}
        {activeSection === 'admin-vehicle' && (
          <div className="admin-page-container">
            <VehicleManagementSection />
          </div>
        )}
        {activeSection === 'admin-driver' && (
          <div className="admin-page-container">
            <DriverManagementSection />
          </div>
        )}
        {activeSection === 'approval-sales-return-hub' && (
          <div className="admin-page-container">
            <SalesReturnApprovalSection />
          </div>
        )}
        {activeSection === 'admin-dashboardcontent' && (
          <div className="admin-page-container">
            <DashboardContentViewSettingsSection />
          </div>
        )}
        {activeSection === 'admin-permissions' && (
          <div className="admin-page-container">
            <PermissionManagementSection />
          </div>
        )}
        {activeSection === 'admin-reportpermissions' && (
          <div className="admin-page-container">
            <ReportPermissionSection />
          </div>
        )}
        {activeSection === 'admin-preferences' && (
          <div className="admin-page-container">
            <PreferencesSection />
          </div>
        )}
        {activeSection === 'admin-notifications' && (
          <div className="admin-page-container">
            <NotificationsSection />
          </div>
        )}
        {activeSection === 'admin-system' && (
          <div className="admin-page-container">
            <SystemSection />
          </div>
        )}
        {activeSection === 'admin-users' && (
          <div className="admin-page-container">
            <UsersSection />
          </div>
        )}
        {activeSection === 'admin-email' && (
          <div className="admin-page-container">
            <EmailSettingsSection />
          </div>
        )}
        {activeSection === 'admin-variants' && (
          <div className="admin-page-container">
            <VariantsSection />
          </div>
        )}
        {(activeSection === 'product-brand' ||
          activeSection === 'product-details/brand' ||
          activeSection === 'ProductDetails/Brand' ||
          activeSection === 'Product/Brand' ||
          activeSection.endsWith('/brand') ||
          activeSection.endsWith('/Brand')) && (
            <div className="admin-page-container">
              <BrandSection />
            </div>
          )}
        {(activeSection === 'product-category' ||
          activeSection === 'product-details/category' ||
          activeSection === 'ProductDetails/Category' ||
          activeSection === 'Product/Category' ||
          activeSection.endsWith('/category') ||
          activeSection.endsWith('/Category')) && (
            <div className="admin-page-container">
              <CategorySection />
            </div>
          )}

        {(activeSection === 'stock-packinglist') && (
          <div className="admin-page-container">
            {(() => {
              const currentUser = user || {};
              const userRoleName = (currentUser.Role || currentUser.role || '').toString().toLowerCase();
              const normalizedRole = userRoleName.replace(/\s|_/g, '');
              if (
                !(normalizedRole.includes('warehousestaff') ||
                  normalizedRole === 'warehouse' ||
                  normalizedRole === 'warehouse-staff' ||
                  normalizedRole === 'whstaff')
              ) {
                return <div style={{ padding: 16, color: '#b91c1c' }}>Access denied: Warehouse staff only.</div>;
              }
              return <PackingListSection />;
            })()}
          </div>
        )}

        {(activeSection === 'product-items' ||
          activeSection === 'product-details/items' ||
          activeSection === 'ProductDetails/Items' ||
          activeSection === 'Product/Items' ||
          activeSection === 'Product/AddProduct' ||
          activeSection.endsWith('/items') ||
          activeSection.endsWith('/Items')) && (
            <div className="admin-page-container">
              <ProductSection />
            </div>
          )}

        {(activeSection === 'product-all' ||
          activeSection === 'product-details/allproducts' ||
          activeSection === 'ProductDetails/AllProducts' ||
          activeSection === 'Product/AllProducts' ||
          activeSection.endsWith('/allproducts') ||
          activeSection.endsWith('/AllProducts')) && (
            <div className="admin-page-container">
              <ProductListSection />
            </div>
          )}

        {(activeSection === 'product-combo' ||
          activeSection === 'product-details/combo' ||
          activeSection === 'ProductDetails/Combo' ||
          activeSection === 'Product/Combo' ||
          activeSection.endsWith('/combo') ||
          activeSection.endsWith('/Combo')) && (
            <div className="admin-page-container">
              <ComboSection />
            </div>
          )}

        {(activeSection.toLowerCase().includes('task') ||
          activeSection.toLowerCase().includes('listing')) && (
            <Box sx={{ p: 0, width: '100%', display: 'flex', flexDirection: 'column', flexGrow: 1, alignItems: 'stretch' }}>
              <TaskListingSection />
            </Box>
          )}

        {(activeSection.toLowerCase() === 'productdetails' || activeSection.toLowerCase().startsWith('productdetails/')) &&
          !activeSection.toLowerCase().includes('combo') &&
          !activeSection.toLowerCase().includes('task') &&
          !activeSection.toLowerCase().includes('listing') && (
            <div className="admin-page-container">
              <ProductDetails />
            </div>
          )}

        {activeSection === 'approval-product-request' && (
          <div className="admin-page-container">
            <ProductApprovalSection onNavigate={(section, state) => {
              navigate(`/${section}`, { state });
            }} />
          </div>
        )}

        {activeSection === 'approval-product-edit' && (
          <div className="admin-page-container">
            <ProductEditRequestSection />
          </div>
        )}

        {activeSection === 'approval-product-view' && (
          <div className="admin-page-container">
            <ProductApprovalDetails />
          </div>
        )}

        {activeSection === 'product-approval-details' && (
          <div className="admin-page-container">
            <ProductApprovalDetails />
          </div>
        )}

        {/* Supplier Section */}
        {activeSection === 'supplier' && (
          <div className="admin-page-container">
            <SupplierSection />
          </div>
        )}

        {(activeSection === 'supplier-view' || activeSection.startsWith('supplier-view/')) && (
          <div className="admin-page-container">
            <SupplierDetailView
              supplierId={activeSection.split('/')[1]}
              onBack={() => {
                setActiveSection('supplier');
                navigate('/supplier');
              }}
              onNavigate={(section) => {
                setActiveSection(section);
                navigate(`/${section}`);
              }}
            />
          </div>
        )}

        {(activeSection === 'supplier-create-bill' || activeSection.startsWith('supplier-create-bill/')) && (
          <div className="admin-page-container">
            <SupplierCreateBill
              supplierId={activeSection.includes('/') ? activeSection.split('/')[1] : null}
              onBack={() => {
                if (activeSection.includes('/')) {
                  setActiveSection('supplier');
                  navigate('/supplier');
                } else {
                  setActiveSection('dashboard');
                  navigate('/');
                }
              }} />
          </div>
        )}

        {(activeSection === 'purchase-bill-edit' || activeSection.startsWith('purchase-bill-edit/')) && (
          <div className="admin-page-container">
            <SupplierCreateBill
              billId={activeSection.includes('/') ? activeSection.split('/')[1] : null}
              mode="edit"
              onBack={() => {
                setActiveSection('purchase-bill-view');
                navigate('/purchase-bill-view');
              }} />
          </div>
        )}
        {(activeSection === 'workflow' || activeSection === 'module-1008') && (
          <div className="admin-page-container">
            <WorkflowSection />
          </div>
        )}


        {activeSection === 'purchase-approval-hub' && (
          <div className="admin-page-container">
            <PurchaseApprovalHub
              onSelectRequest={() => {
                setActiveSection('purchase-approval-request');
                navigate('/purchase-approval-request');
              }}
              onSelectEdit={() => {
                setActiveSection('purchase-edit-request');
                navigate('/purchase-edit-request');
              }}
              pendingCount={pendingPurchaseCount}
            />
          </div>
        )}

        {activeSection === 'warehouse-receive-items' && (
          <div className="admin-page-container">
            <WarehouseReceiveItems />
          </div>
        )}

        {(activeSection === 'purchase-warehouse-hub' || activeSection === 'Purchase/Warehouse' || activeSection === 'purchase/warehouse') && (
          <div className="admin-page-container" style={{ padding: 0 }}>
            <PurchaseWarehouseHub
              pendingBillsCount={pendingPurchaseCount || 0}
              editRequestsCount={pendingEditCount || 0}
            />
          </div>
        )}

        {activeSection === 'purchase-edit-request' && (
          <div className="admin-page-container">
            <PurchaseEditRequestSection
              onBack={() => {
                setActiveSection('purchase-approval-hub');
                navigate('/purchase-approval-hub');
              }}
              onViewBill={(id) => {
                const section = `purchase-approval-details/${id}`;
                setActiveSection(section);
                navigate(`/${section}`);
              }}
            />
          </div>
        )}

        {activeSection === 'purchase-approval-request' && (
          <div className="admin-page-container">
            <PurchaseApprovalSection
              onBack={() => {
                setActiveSection('purchase-approval-hub');
                navigate('/purchase-approval-hub');
              }}
              onViewBill={(id) => {
                const section = `purchase-approval-details/${id}`;
                setActiveSection(section);
                navigate(`/${section}`);
              }}
            />
          </div>
        )}

        {activeSection === 'sales-return-section' && (
          <div className="admin-page-container">
            <SalesReturnSection />
          </div>
        )}
        {typeof activeSection === 'string' && activeSection.startsWith('purchase-approval-details/') && (
          <div className="admin-page-container" style={{ padding: 0 }}>
            <PurchaseBillView
              initialBillId={activeSection.split('/')[1]}
              showApprovalActions={true}
              onApprovalSuccess={() => {
                setActiveSection('purchase-approval-request');
                navigate('/purchase-approval-request');
              }}
              onBack={() => {
                setActiveSection('purchase-approval-request');
                navigate('/purchase-approval-request');
              }}
            />
          </div>
        )}

        {activeSection === 'approval-product-hub' && (
          <div className="admin-page-container">
            <div className="settings-section">
              <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IconSVG name="approvals" size={24} />
                Product Approval Module
              </h2>
              <p className="section-description">Manage product creation approvals and catalog modification requests.</p>

              <div className="approval-hub-grid">
                <div className="hub-card-modern" onClick={() => setActiveSection('approval-product-request')}>
                  <div className="hub-icon-wrap" style={{ background: '#ecfdf5', color: '#10b981' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  <div className="hub-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3>Approval Requests</h3>
                      {pendingApprovalCount > 0 && (
                        <span className="pending-badge-modern">{pendingApprovalCount} Pending</span>
                      )}
                    </div>
                    <p>Review and validate new product entries submitted by team members.</p>
                  </div>
                  <div className="hub-arrow">→</div>
                </div>

                <div className="hub-card-modern" onClick={() => setActiveSection('approval-product-edit')}>
                  <div className="hub-icon-wrap" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </div>
                  <div className="hub-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3>Edit Requests</h3>
                      {pendingEditCount > 0 && (
                        <span className="pending-badge-modern" style={{ background: '#3b82f6' }}>{pendingEditCount} Pending</span>
                      )}
                    </div>
                    <p>Handle modification requests for existing product details and specifications.</p>
                  </div>
                  <div className="hub-arrow">→</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'approval-item-hub' && (
          <div className="admin-page-container">
            <div className="settings-section">
              <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IconSVG name="approvals" size={24} />
                Approval-Items Module
              </h2>
              <p className="section-description">Manage product variant (SKU) creation and inventory entry approvals.</p>

              <div className="approval-hub-grid">
                <div className="hub-card-modern" onClick={() => { setActiveSection('approval-item-request'); navigate('/approval-item-request'); }}>
                  <div className="hub-icon-wrap" style={{ background: '#ecfdf5', color: '#10b981' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  <div className="hub-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3>Item Requests</h3>
                      {pendingItemApprovalCount > 0 && (
                        <span className="pending-badge-modern">{pendingItemApprovalCount} Pending</span>
                      )}
                    </div>
                    <p>Review and validate new variant entries and initial stock submissions.</p>
                  </div>
                  <div className="hub-arrow">→</div>
                </div>

                <div className="hub-card-modern" onClick={() => { }} style={{ opacity: 0.8 }}>
                  <div className="hub-icon-wrap" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </div>
                  <div className="hub-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3>Item Edit Requests</h3>
                      <span style={{
                        background: '#64748b',
                        color: '#fff',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}>Coming Soon</span>
                    </div>
                    <p>Item modification requests and warehouse entry updates.</p>
                  </div>
                  <div className="hub-arrow">→</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'approval-item-request' && (
          <div className="admin-page-container">
            <ItemApprovalSection onNavigate={() => { setActiveSection('approval-item-hub'); navigate('/approval-item-hub'); }} />
          </div>
        )}

        {/* Customer Section */}
        {activeSection === 'customer' && (
          <div className="admin-page-container">
            <CustomerSection />
          </div>
        )}

        {activeSection && typeof activeSection === 'string' && (activeSection === 'customer-view' || activeSection.startsWith('customer-view/')) && (
          <div className="admin-page-container">
            <CustomerDetailView
              customerId={activeSection.includes('/') ? activeSection.split('/')[1] : null}
              onBack={() => {
                setActiveSection('customer');
                navigate('/customer');
              }}
              onNavigate={(section) => {
                setActiveSection(section);
                navigate(`/${section}`);
              }}
            />
          </div>
        )}

        {(activeSection === 'customer-create-bill' || activeSection.startsWith('customer-create-bill/')) && (
          <div className="admin-page-container">
            <CustomerCreateBill onBack={() => {
              if (activeSection.includes('/')) {
                setActiveSection('customer');
                navigate('/customer');
              } else {
                setActiveSection('dashboard');
                navigate('/');
              }
            }} />
          </div>
        )}

        {(activeSection === 'purchase-bill-view' || activeSection?.startsWith('purchase-bill-view/')) && (
          <div style={{ width: '100%', height: '100%', padding: '0px' }}>
            <PurchaseBillView initialBillId={activeSection.includes('/') ? activeSection.split('/')[1] : null} />
          </div>
        )}

        {(activeSection === 'sale-bill-view' || activeSection?.startsWith('sale-bill-view/')) && (
          <div style={{ width: '100%', height: '100%', padding: '0px' }}>
            <SaleBillView initialBillId={activeSection.includes('/') ? activeSection.split('/')[1] : null} />
          </div>
        )}


        {/* Generic component for unmapped submodules (e.g., module-1-sub-5) */}
        {/* Generic component for unmapped submodules (e.g., module-1-sub-5 or ProductDetails/Items) */}
        {activeSection && typeof activeSection === 'string' && (activeSection.startsWith('module-') || activeSection.includes('/')) &&
          !['product-details/brand', 'product-brand', 'ProductDetails/Brand', 'Product/Brand',
            'product-details/category', 'product-category', 'ProductDetails/Category', 'Product/Category',
            'supplier-view', 'customer-view', 'purchase-warehouse-hub', 'Purchase/Warehouse', 'purchase/warehouse'].includes(activeSection) &&
          !activeSection.startsWith('supplier-view/') &&
          !activeSection.startsWith('customer-view/') &&
          !activeSection.startsWith('supplier-create-bill/') &&
          !activeSection.startsWith('customer-create-bill/') &&
          !activeSection.endsWith('/brand') &&
          !activeSection.endsWith('/Brand') &&
          !activeSection.toLowerCase().endsWith('/category') &&
          !activeSection.toLowerCase().startsWith('productdetails/') &&
          activeSection !== 'purchase-bill-view' &&
          !activeSection.startsWith('purchase-bill-view/') &&
          activeSection !== 'purchase-bill-edit' &&
          !activeSection.startsWith('purchase-bill-edit/') &&
          activeSection !== 'sale-bill-view' &&
          !activeSection.startsWith('sale-bill-view/') &&
          activeSection !== 'workflow' &&
          !activeSection.startsWith('purchase-approval-details/') &&
          !activeSection.startsWith('stock-transfer-approval-view/') &&
          !activeSection.startsWith('sales-quote-approval-view/') &&
          !activeSection.startsWith('stocktransferapprovalfinal/') &&
          activeSection !== 'module-1008' && (
            <div className="admin-page-container">
              <GenericSubModuleSection sectionId={activeSection} menuItems={menuItems} />
            </div>
          )}

        {activeSection === 'report-section' && (
          <div className="admin-page-container" style={{ padding: 0 }}>
            <ReportSection />
          </div>
        )}
      </Box>
    </Box >
  );
};

// Dashboard Home Section
const StatCard = ({ title, value, icon, color, bgColor, delayClass, description }) => (
  <Card
    elevation={0}
    className={`animate-card ${delayClass} hover-lift`}
    sx={{
      height: '100%',
      borderRadius: 4,
      border: '1px solid rgba(0, 0, 0, 0.05)',
      borderLeft: `4px solid ${color}`,
      background: '#ffffff',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    <CardContent sx={{ p: { xs: 2, md: 3 }, position: 'relative', zIndex: 1 }}>
      <Stack spacing={2}>
        <Box sx={{
          width: 48,
          height: 48,
          borderRadius: '12px',
          bgcolor: color,
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {React.cloneElement(icon, { sx: { fontSize: 24 } })}
        </Box>
        <Box>
          <Typography variant="body2" sx={{
            color: '#64748b',
            fontWeight: 500,
            fontSize: '0.85rem',
            mb: 0.5
          }}>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{
            color: '#0f172a',
            mb: 0.5,
            fontSize: { xs: '1.5rem', md: '1.8rem' },
            letterSpacing: '-0.02em',
          }}>
            {value}
          </Typography>
          {description && (
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
              {description}
            </Typography>
          )}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

// Dashboard Home Section
const DashboardHomeSection = ({ onNavigate, user }) => {
  const [stats, setStats] = useState({
    totalSales: '8,420',
    itemsSold: '1,250',
    newCustomers: '342',
    totalRevenue: '$12,450',
    activeQuotes: '84'
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

  useEffect(() => {
    const userid = user?.Userid || user?.userid || user?.id || user?.Id || '';
    if (userid) {
      fetch(`${API_URL}/api/task/dashboard-stats?userId=${userid}`)
        .then(res => res.json())
        .then(data => {
          setStats({
            totalTasks: data.Total,
            inProgress: data.InProgress,
            completed: data.Completed,
            todo: data.Todo,
            overdue: data.Overdue,
            closed: data.Closed,
            inReview: data.InReview,
            typeBreakdown: data.TypeBreakdown || []
          });
        })
        .catch(err => console.error("Error fetching task stats:", err));
    }
  }, [API_URL, user]);

  return (
    <Box sx={{ flexGrow: 1, width: '100%', p: 0, m: 0, boxSizing: 'border-box' }}>
      {/* Welcome Banner */}
      <Box sx={{ mb: 4, width: '100%', background: 'linear-gradient(135deg, #224369 0%, #8b5cf6 100%)', borderRadius: 4, p: { xs: 3, md: '25px' }, color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)' }}>
        <Box sx={{ position: 'absolute', top: '50%', right: { xs: -50, md: 50 }, transform: 'translateY(-50%)', width: 300, height: 300, borderRadius: '50%', border: '40px solid rgba(255,255,255,0.05)', display: { xs: 'none', sm: 'block' }, animation: 'pulse-ring 4s infinite ease-in-out' }} />
        <Box sx={{ position: 'absolute', top: '50%', right: { xs: -20, md: 80 }, transform: 'translateY(-50%)', width: 220, height: 220, borderRadius: '50%', border: '30px solid rgba(255,255,255,0.08)', display: { xs: 'none', sm: 'block' }, animation: 'pulse-ring 4s infinite ease-in-out 1s' }} />
        <Box sx={{ position: 'absolute', top: '50%', right: { xs: 0, md: 100 }, transform: 'translateY(-50%)', width: 140, height: 140, borderRadius: '50%', border: '20px solid rgba(255,255,255,0.1)', display: { xs: 'none', sm: 'block' }, animation: 'pulse-ring 4s infinite ease-in-out 2s' }} />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="overline" sx={{ fontWeight: 600, letterSpacing: '0.1em', opacity: 0.8, display: 'block', mb: 1 }}>WELCOME BACK</Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.8rem', md: '2.5rem' }, mb: 2 }}>Modern Operations Dashboard</Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600, mb: 4, fontSize: '1.1rem', lineHeight: 1.6 }}>Track quote conversions, invoice velocity, and customer activity from a single, refreshed workspace.</Typography>
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
            <Chip icon={<PersonIcon sx={{ color: 'white !important' }} />} label={user?.Role || 'User'} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', height: 40, px: 1, fontSize: '0.9rem', '& .MuiChip-label': { paddingLeft: 1.5, paddingRight: 1.5 } }} />
            <Chip icon={<CalendarTodayIcon sx={{ color: 'white !important' }} />} label={new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', height: 40, px: 1, fontSize: '0.9rem', '& .MuiChip-label': { paddingLeft: 1.5, paddingRight: 1.5 } }} />
          </Stack>
        </Box>
      </Box>

      {/* KPI Cards Row */}
      <Box sx={{ mb: 4, mt: 2, width: '100%' }}>
        <Grid container spacing={2} sx={{ width: '100%', m: 0 }}>
          <Grid item xs={12} sx={{ width: { xs: '100%', md: '19%' }, flexBasis: { xs: '100%', md: '19%' }, maxWidth: { xs: '100%', md: '19%' }, p: 1 }}>
            <StatCard
              title="Total Sales"
              value={stats.totalSales}
              icon={<TrendingUpIcon />}
              color="#3b82f6"
              bgColor="#eff6ff"
              delayClass="delay-1"
              description="Increased by 12% this month"
            />
          </Grid>
          <Grid item xs={12} sx={{ width: { xs: '100%', md: '19%' }, flexBasis: { xs: '100%', md: '19%' }, maxWidth: { xs: '100%', md: '19%' }, p: 1 }}>
            <StatCard
              title="Items Sold"
              value={stats.itemsSold}
              icon={<ShoppingCartIcon />}
              color="#f59e0b"
              bgColor="#fffbeb"
              delayClass="delay-2"
              description="Compared to 1,120 last month"
            />
          </Grid>
          <Grid item xs={12} sx={{ width: { xs: '100%', md: '19%' }, flexBasis: { xs: '100%', md: '19%' }, maxWidth: { xs: '100%', md: '19%' }, p: 1 }}>
            <StatCard
              title="New Customers"
              value={stats.newCustomers}
              icon={<PeopleIcon />}
              color="#10b981"
              bgColor="#ecfdf5"
              delayClass="delay-3"
              description="Growth of 8.4% since last week"
            />
          </Grid>
          <Grid item xs={12} sx={{ width: { xs: '100%', md: '19%' }, flexBasis: { xs: '100%', md: '19%' }, maxWidth: { xs: '100%', md: '19%' }, p: 1 }}>
            <StatCard
              title="Total Revenue"
              value={stats.totalRevenue}
              icon={<AttachMoneyIcon />}
              color="#06b6d4"
              bgColor="#ecfeff"
              delayClass="delay-4"
              description="Net earnings after taxes"
            />
          </Grid>
          <Grid item xs={12} sx={{ width: { xs: '100%', md: '19%' }, flexBasis: { xs: '100%', md: '19%' }, maxWidth: { xs: '100%', md: '19%' }, p: 1 }}>
            <StatCard
              title="Active Quotes"
              value={stats.activeQuotes}
              icon={<AssignmentIcon />}
              color="#ef4444"
              bgColor="#fef2f2"
              delayClass="delay-5"
              description="Requires immediate followup"
            />
          </Grid>
        </Grid>
      </Box>

      {/* Second Row: Sales Overview and Sales Channel */}
      <Box sx={{ mb: 6, width: '100%' }} className="animate-card delay-3">
        <Grid container spacing={3} sx={{ width: '100%', m: 0 }}>
          {/* Sales Overview Chart */}
          <Grid item xs={12} lg={8}>
            <Card elevation={0} className="hover-lift" sx={{ borderRadius: 3, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
                    Sales Overview
                  </Typography>
                  <IconButton size="small" sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
                    <GetAppIcon sx={{ fontSize: 18, color: '#64748b' }} />
                  </IconButton>
                </Stack>

                <Box sx={{ height: 300, position: 'relative', width: '100%', display: 'flex' }}>
                  {/* Y-Axis Labels */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pb: 4, pr: 2, height: '100%' }}>
                    {['$30,000.00', '$25,000.00', '$20,000.00', '$15,000.00', '$10,000.00', '$5,000.00', '$0.00'].map(label => (
                      <Typography key={label} variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{label}</Typography>
                    ))}
                  </Box>

                  <Box sx={{ flexGrow: 1, position: 'relative', height: '100%' }}>
                    {/* Grid Lines */}
                    {[0, 1, 2, 3, 4, 5, 6].map(i => (
                      <Box key={i} sx={{ position: 'absolute', top: `${(i * 100) / 6}%`, left: 0, right: 0, height: '1px', bgcolor: '#f1f5f9' }} />
                    ))}

                    <svg width="100%" height="calc(100% - 20px)" viewBox="0 0 800 230" preserveAspectRatio="none" style={{ overflow: 'visible', marginTop: '5px' }}>
                      {/* Sales Area & Line (Blue) */}
                      <path d="M0,170 L72,145 L144,152 L216,115 L288,105 L360,85 L432,68 L504,80 L576,65 L648,55 L720,45 L792,30" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M0,170 L72,145 L144,152 L216,115 L288,105 L360,85 L432,68 L504,80 L576,65 L648,55 L720,45 L792,30 L792,230 L0,230 Z" fill="rgba(59, 130, 246, 0.08)" />

                      {/* Revenue Area & Line (Teal) */}
                      <path d="M0,210 L72,190 L144,195 L216,165 L288,158 L360,135 L432,120 L504,125 L576,110 L648,102 L720,95 L792,85" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M0,210 L72,190 L144,195 L216,165 L288,158 L360,135 L432,120 L504,125 L576,110 L648,102 L720,95 L792,85 L792,230 L0,230 Z" fill="rgba(16, 185, 129, 0.08)" />

                      {/* Data Points */}
                      {[0, 72, 144, 216, 288, 360, 432, 504, 576, 648, 720, 792].map((x, i) => {
                        const salesY = [170, 145, 152, 115, 105, 85, 68, 80, 65, 55, 45, 30][i];
                        const revY = [210, 190, 195, 165, 158, 135, 120, 125, 110, 102, 95, 85][i];
                        return (
                          <g key={i}>
                            <circle cx={x} cy={salesY} r="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
                            <circle cx={x} cy={revY} r="4" fill="white" stroke="#10b981" strokeWidth="2" />
                          </g>
                        );
                      })}
                    </svg>

                    {/* X-Axis Labels */}
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 2, position: 'relative', width: '100%', px: '2px' }}>
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                        <Typography key={m} variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>{m}</Typography>
                      ))}
                    </Stack>
                  </Box>
                </Box>

                {/* Legend */}
                <Stack direction="row" spacing={4} justifyContent="center" sx={{ mt: 5 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #3b82f6', bgcolor: 'white' }} />
                    <Typography variant="caption" fontWeight={600} color="#64748b">Sales</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #10b981', bgcolor: 'white' }} />
                    <Typography variant="caption" fontWeight={600} color="#64748b">Revenue</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Patients by Gender Chart */}
          <Grid item xs={12} lg={4}>
            <Card elevation={0} className="hover-lift" sx={{ borderRadius: 3, height: '100%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ mb: 4 }}>
                  Sales by Channel
                </Typography>

                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                  {/* Simulated Donut Chart using background gradient */}
                  <Box sx={{
                    width: 160,
                    height: 160,
                    borderRadius: '50%',
                    background: 'conic-gradient(#3b82f6 0deg 210deg, #f97316 210deg 360deg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Box sx={{ width: 120, height: 120, borderRadius: '50%', bgcolor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingUpIcon sx={{ color: '#cbd5e1', fontSize: 40 }} />
                    </Box>
                  </Box>
                </Box>

                <Stack direction="row" justifyContent="center" spacing={3} sx={{ mt: 4 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f97316' }} />
                    <Typography variant="caption" color="text.secondary">Social Media</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3b82f6' }} />
                    <Typography variant="caption" color="text.secondary">Direct Sales</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Third Row: Line Chart, Category Table and Sales Wave Card */}
      <Box sx={{ mb: 6, width: '100%' }}>
        <Grid container spacing={3} sx={{ width: '100%', m: 0 }}>
          {/* Sales Velocity Line Chart */}
          <Grid item xs={12} lg={6}>
            <Card elevation={0} className="hover-lift" sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
                    Sales Velocity
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Today <ExpandMore fontSize="inherit" />
                  </Typography>
                </Stack>

                <Box sx={{ height: 200, position: 'relative', width: '100%' }}>
                  <svg width="100%" height="100%" viewBox="0 0 400 150" preserveAspectRatio="none">
                    <path d="M0,120 Q50,60 100,100 T200,80 T300,110 T400,90" fill="none" stroke="#f97316" strokeWidth="3" />
                    <path d="M0,120 Q50,60 100,100 T200,80 T300,110 T400,90 L400,150 L0,150 Z" fill="rgba(249, 115, 22, 0.05)" />
                    <circle cx="100" cy="100" r="4" fill="white" stroke="#f97316" strokeWidth="2" />
                  </svg>
                  {/* Data point tooltip */}
                  <Box sx={{
                    position: 'absolute',
                    top: 70,
                    left: '25%',
                    bgcolor: '#1e293b',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}>
                    113
                  </Box>

                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
                    {['07 am', '08 am', '09 am', '10 am', '11 am', '12 pm'].map(t => (
                      <Typography key={t} variant="caption" sx={{ color: '#94a3b8' }}>{t}</Typography>
                    ))}
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Product Categories substituted for Patients By Division */}
          <Grid item xs={12} lg={3}>
            <Card elevation={0} className="hover-lift" sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ mb: 4 }}>
                  Top Merchant Categories
                </Typography>
                <Stack spacing={3}>
                  {[
                    { name: 'Electronics', value: 458, color: '#0ea5e9' },
                    { name: 'Fashion', value: 342, color: '#8b5cf6' },
                    { name: 'Home Appliances', value: 256, color: '#10b981' },
                    { name: 'Food & Beverage', value: 184, color: '#f59e0b' }
                  ].map((item, idx) => (
                    <Box key={idx}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2" fontWeight={600} color="#475569">{item.name}</Typography>
                        <Typography variant="body2" fontWeight={700} color="#1e293b">{item.value.toLocaleString()}</Typography>
                      </Stack>
                      <Box sx={{ width: '100%', height: 6, bgcolor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                        <Box sx={{ width: `${(item.value / 500) * 100}%`, height: '100%', bgcolor: item.color, borderRadius: 4 }} />
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Special Gradient Wave Card */}
          <Grid item xs={12} lg={3}>
            <Box sx={{
              height: '100%',
              borderRadius: 3,
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
              p: 3,
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.3)'
            }}>
              <Box>
                <Typography variant="h3" fontWeight={700}>8,420</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Sales this month</Typography>
              </Box>

              <Box sx={{ height: 80, mt: 4 }}>
                <svg width="100%" height="100%" viewBox="0 0 200 60" preserveAspectRatio="none">
                  <path d="M0,45 C20,40 40,55 60,40 C80,25 100,50 120,35 C140,20 160,50 180,45 L200,40" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                  <path d="M0,35 C20,30 40,45 60,30 C80,15 100,40 120,25 C140,10 160,40 180,35 L200,30" fill="none" stroke="white" strokeWidth="3" />
                </svg>
              </Box>

              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                {[14, 15, 16, 17, 18, 19].map(d => (
                  <Typography key={d} variant="caption" sx={{ opacity: 0.6 }}>{d}</Typography>
                ))}
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Quick Actions Section */}
      <Box sx={{ mb: 6, width: '100%' }}>
        <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ mb: 3 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={3} sx={{ width: '100%', m: 0 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              onClick={() => onNavigate('supplier-create-bill')}
              elevation={0}
              className="hover-lift"
              sx={{
                borderRadius: 3,
                cursor: 'pointer',
                bgcolor: '#fff',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#3b82f6',
                  bgcolor: 'rgba(59, 130, 246, 0.02)',
                  boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.1)'
                }
              }}
            >
              <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCartIcon />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="#0f172a">Create Purchase Bill</Typography>
                  <Typography variant="caption" color="text.secondary">Record new stock arrival</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              onClick={() => onNavigate('purchase-bill-view')}
              elevation={0}
              className="hover-lift"
              sx={{
                borderRadius: 3,
                cursor: 'pointer',
                bgcolor: '#fff',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#cc3d3e',
                  bgcolor: 'rgba(204, 61, 62, 0.02)',
                  boxShadow: '0 10px 15px -3px rgba(204, 61, 62, 0.1)'
                }
              }}
            >
              <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fef2f2', color: '#cc3d3e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ReceiptLongIcon />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="#0f172a">Purchase Bills</Typography>
                  <Typography variant="caption" color="text.secondary">View all purchase history</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              onClick={() => onNavigate('customer-create-bill')}
              elevation={0}
              className="hover-lift"
              sx={{
                borderRadius: 3,
                cursor: 'pointer',
                bgcolor: '#fff',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#10b981',
                  bgcolor: 'rgba(16, 185, 129, 0.02)',
                  boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.1)'
                }
              }}
            >
              <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ReceiptIcon />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="#0f172a">Create Sale Bill</Typography>
                  <Typography variant="caption" color="text.secondary">Generate customer invoice</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              onClick={() => onNavigate('customer')}
              elevation={0}
              className="hover-lift"
              sx={{
                borderRadius: 3,
                cursor: 'pointer',
                bgcolor: '#fff',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#8b5cf6',
                  bgcolor: 'rgba(139, 92, 246, 0.02)',
                  boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.1)'
                }
              }}
            >
              <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PeopleIcon />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="#0f172a">Create Customer</Typography>
                  <Typography variant="caption" color="text.secondary">Add new client to system</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              onClick={() => onNavigate('supplier')}
              elevation={0}
              className="hover-lift"
              sx={{
                borderRadius: 3,
                cursor: 'pointer',
                bgcolor: '#fff',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#f59e0b',
                  bgcolor: 'rgba(245, 158, 11, 0.02)',
                  boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.1)'
                }
              }}
            >
              <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <StoreIcon />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="#0f172a">Create Supplier</Typography>
                  <Typography variant="caption" color="text.secondary">Add new vendor to system</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Footer Spacer */}
      <Box sx={{ pb: 10 }} />
    </Box>
  );
};

// Human Resources Section
const HumanResourcesSection = ({ searchTerm }) => {
  const [employees, setEmployees] = useState([
    { id: 1, name: 'Parviz Aslanov', department: 'Marketing', position: 'UI Designer', startDate: '20.11.2023', salary: '1700 AZN', avatar: 'PA' },
    { id: 2, name: 'Seving Aslanova', department: 'Marketing', position: 'UI Designer', startDate: '19.02.2023', salary: '1200 AZN', avatar: 'SA' },
    { id: 3, name: 'Ceyhan Aslanov', department: 'Program Terminati', position: 'React Developer', startDate: '16.05.2024', salary: '3690 AZN', avatar: 'CA' },
    { id: 4, name: 'Ayla Mammadova', department: 'Marketing', position: 'UX researcher intern', startDate: '16.07.2024', salary: '400 AZN', avatar: 'AM' },
    { id: 5, name: 'Orxan Hüseynov', department: 'Marketing', position: 'Accountant', startDate: '17.09.2022', salary: '2000 AZN', avatar: 'OH' },
    { id: 6, name: 'Sona Mammadova', department: 'Marketing', position: 'Graphic Designer', startDate: '18.07.2024', salary: '800 AZN', avatar: 'SM' },
    { id: 7, name: 'Bylena Eyvazov', department: 'Marketing', position: 'Accountant', startDate: '17.08.2022', salary: '3000 AZN', avatar: 'BE' },
    { id: 8, name: 'Vüqar Biləddə', department: 'Program Terminati', position: 'Backend Developer', startDate: '18.07.2024', salary: '2000 AZN', avatar: 'VB' },
    { id: 9, name: 'Aytac Hüseynova', department: 'Program Terminati', position: 'Frontend Developer', startDate: '17.08.2022', salary: '1700 AZN', avatar: 'AH' },
    { id: 10, name: 'Nihad Əkbərov', department: 'Marketing', position: 'Senior Product Designer', startDate: '18.07.2024', salary: '2500 AZN', avatar: 'NƏ' },
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Filter employees based on search
  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort employees
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (sortConfig.direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Pagination
  const itemsPerPageValue = itemsPerPage === 'all' ? sortedEmployees.length : itemsPerPage;
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(sortedEmployees.length / itemsPerPage);
  const startIndex = itemsPerPage === 'all' ? 0 : (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = itemsPerPage === 'all' ? sortedEmployees : sortedEmployees.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="dashboard-section">
      <div className="section-controls">
        <div className="controls-left">
          <button className="control-btn" onClick={() => handleSort('name')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M7 12h10M11 18h2"></path>
            </svg>
            Sort
          </button>
          <button className="control-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            Filter
          </button>
        </div>
        <button className="btn-add">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add People
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>FULL NAME</th>
              <th>DEPARTMENT</th>
              <th>POSITION</th>
              <th>START DATE</th>
              <th>SALARY</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEmployees.map((employee) => (
              <tr key={employee.id}>
                <td>
                  <div className="employee-cell">
                    <div className="employee-avatar">{employee.avatar}</div>
                    <span>{employee.name}</span>
                  </div>
                </td>
                <td>{employee.department}</td>
                <td>{employee.position}</td>
                <td>{employee.startDate}</td>
                <td>{employee.salary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            &lt;
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                className={`page-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            );
          })}
          {totalPages > 5 && <span className="page-dots">...</span>}
          {totalPages > 5 && (
            <button
              className={`page-btn ${currentPage === totalPages ? 'active' : ''}`}
              onClick={() => setCurrentPage(totalPages)}
            >
              {totalPages}
            </button>
          )}
          <button
            className="page-btn"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            &gt;
          </button>
        </div>
        <div className="items-per-page">
          <span>Items per page:</span>
          <select
            className="items-select"
            value={itemsPerPage === 'all' ? 'all' : itemsPerPage}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'all') {
                setItemsPerPage('all');
              } else {
                setItemsPerPage(parseInt(value));
              }
              setCurrentPage(1);
            }}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// Sales Section
const SalesSection = () => {
  return (
    <div className="dashboard-section">
      <h2>Sales</h2>
      <p>Sales management content will be displayed here.</p>
    </div>
  );
};

// Finance Section
const FinanceSection = () => {
  return (
    <div className="dashboard-section">
      <h2>Finance</h2>
      <p>Finance management content will be displayed here.</p>
    </div>
  );
};

// Warehouse Section
const WarehouseSection = () => {
  return (
    <div className="dashboard-section">
      <h2>Warehouse</h2>
      <p>Warehouse management content will be displayed here.</p>
    </div>
  );
};

// Import AdminSettings section components
// Role Management Section Component
const RoleManagementSection = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ role: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

  // Fetch all roles
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const url = searchTerm
        ? `${API_URL} /api/role / search ? term = ${encodeURIComponent(searchTerm)} `
        : `${API_URL} /api/role`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setRoles(data.roles || []);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to fetch roles' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please check if the backend server is running.' });
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load roles on component mount and when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRoles();
    }, searchTerm ? 500 : 0); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Initial load
  useEffect(() => {
    fetchRoles();
  }, []);

  // Handle form submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const url = editingRole
        ? `${API_URL} /api/role / ${editingRole.id} `
        : `${API_URL} /api/role`;

      const method = editingRole ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: formData.role, query: editingRole ? 2 : 1 })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingRole ? 'Role updated successfully!' : 'Role created successfully!' });
        setShowModal(false);
        setEditingRole(null);
        setFormData({ role: '' });
        fetchRoles();
      } else {
        setMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error saving role:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL} /api/role / ${id} `, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Role deleted successfully!' });
        fetchRoles();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete role' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error deleting role:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for editing
  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({ role: role.role });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Open modal for creating new role
  const handleAdd = () => {
    setEditingRole(null);
    setFormData({ role: '' });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRole(null);
    setFormData({ role: '' });
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="settings-section">
      <h2 className="section-title">Role Management</h2>
      <p className="section-description">Create, update, and manage system roles.</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )
      }

      <div className="roles-actions">
        <button className="btn-primary" onClick={handleAdd} disabled={loading}>
          + Add New Role
        </button>
        <input
          type="search"
          placeholder="Search roles..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {
        loading && !roles.length ? (
          <LoadingSpinner text="Loading roles..." />
        ) : (
          <div className="roles-table">
            {roles.length === 0 ? (
              <div className="empty-state">
                <p>No roles found. Click "Add New Role" to create one.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Role Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id}>
                      <td>{role.id}</td>
                      <td>{role.role}</td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Edit"
                          onClick={() => handleEdit(role)}
                          disabled={loading}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          title="Delete"
                          onClick={() => handleDelete(role.id)}
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      }

      {/* Modal for Add/Edit Role */}
      {
        showModal && (
          <div className="modal-overlay">
            <div className="modal-content responsive-modal modal-sm" style={{ padding: '0' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #2C3E50 0%, #34495e 100%)', color: '#fff', borderBottom: 'none' }}>
                <h3 style={{ color: '#fff', fontWeight: '600' }}>{editingRole ? 'Edit Role' : 'Add New Role'}</h3>
                <button
                  className="modal-close"
                  onClick={handleCloseModal}
                  style={{ color: '#fff', fontSize: '24px', fontWeight: '300' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '24px' }}>
                <form onSubmit={handleSubmit}>
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="roleName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Role Name <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="roleName"
                      className="form-input"
                      value={formData.role}
                      onChange={(e) => setFormData({ role: e.target.value })}
                      required
                      placeholder="Enter role name (e.g., Admin, User, Manager)"
                      disabled={loading}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>
                  <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleCloseModal}
                      disabled={loading}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        backgroundColor: '#fff',
                        color: '#333',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.3s'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: loading ? '#95a5a6' : '#2C3E50',
                        color: '#fff',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s',
                        boxShadow: loading ? 'none' : '0 2px 4px rgba(44, 62, 80, 0.2)'
                      }}
                      onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#34495e')}
                      onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2C3E50')}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner inline size="small" /> Saving...
                        </>
                      ) : editingRole ? 'Update Role' : 'Create Role'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

// Catalog Management Section Component
const CatalogManagementSection = () => {
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState(null);
  const [formData, setFormData] = useState({
    catelogname: '',
    status: 'Active'
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

  // Fetch all catalogs
  const fetchCatalogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/catalog?query=3`);
      const data = await response.json();

      if (data.success) {
        setCatalogs(data.catalogs || data.data || []);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to fetch catalogs' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please check if the backend server is running.' });
      console.error('Error fetching catalogs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load catalogs on component mount and when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchTerm) {
        fetchCatalogs();
      }
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Initial load
  useEffect(() => {
    fetchCatalogs();
  }, []);

  // Handle form submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const query = editingCatalog ? 2 : 1; // 1 = Insert, 2 = Update
      const url = editingCatalog
        ? `${API_URL}/api/catalog/${editingCatalog.id}`
        : `${API_URL}/api/catalog`;

      const method = editingCatalog ? 'PUT' : 'POST';

      const requestBody = {
        catelogname: formData.catelogname,
        status: formData.status,
        isdelete: 0,
        query: query
      };

      if (editingCatalog) {
        requestBody.id = editingCatalog.id;
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingCatalog ? 'Catalog updated successfully!' : 'Catalog created successfully!' });
        setShowModal(false);
        setEditingCatalog(null);
        setFormData({ catelogname: '', status: 'Active' });
        fetchCatalogs();
      } else {
        setMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error saving catalog:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this catalog?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/catalog/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Catalog deleted successfully!' });
        fetchCatalogs();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete catalog' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error deleting catalog:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for editing
  const handleEdit = (catalog) => {
    setEditingCatalog(catalog);
    setFormData({
      catelogname: catalog.catelogname || catalog.Catelogname || '',
      status: catalog.status || catalog.Status || 'Active'
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Open modal for creating new catalog
  const handleAdd = () => {
    setEditingCatalog(null);
    setFormData({ catelogname: '', status: 'Active' });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCatalog(null);
    setFormData({ catelogname: '', status: 'Active' });
    setMessage({ type: '', text: '' });
  };

  // Filter catalogs based on search term
  const filteredCatalogs = searchTerm
    ? catalogs.filter(catalog =>
      (catalog.catelogname || catalog.Catelogname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (catalog.status || catalog.Status || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    : catalogs;

  return (
    <div className="settings-section">
      <h2 className="section-title">Catalog Management</h2>
      <p className="section-description">Create, update, and manage system catalogs.</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )
      }

      <div className="roles-actions">
        <button className="btn-primary" onClick={handleAdd} disabled={loading}>
          + Add New Catalog
        </button>
        <input
          type="search"
          placeholder="Search catalogs..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {
        loading && !catalogs.length ? (
          <LoadingSpinner text="Loading catalogs..." />
        ) : (
          <div className="roles-table">
            {filteredCatalogs.length === 0 ? (
              <div className="empty-state">
                <p>No catalogs found. Click "Add New Catalog" to create one.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Catalog Name</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalogs.map((catalog) => (
                    <tr key={catalog.id || catalog.Id}>
                      <td>{catalog.id || catalog.Id}</td>
                      <td>{catalog.catelogname || catalog.Catelogname}</td>
                      <td>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: (catalog.status || catalog.Status) === 'Active' ? '#d4edda' : '#f8d7da',
                            color: (catalog.status || catalog.Status) === 'Active' ? '#155724' : '#721c24'
                          }}
                        >
                          {catalog.status || catalog.Status || 'Active'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Edit"
                          onClick={() => handleEdit(catalog)}
                          disabled={loading}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          title="Delete"
                          onClick={() => handleDelete(catalog.id || catalog.Id)}
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      }

      {/* Modal for Add/Edit Catalog */}
      {
        showModal && (
          <div className="modal-overlay">
            <div className="modal-content responsive-modal modal-sm" style={{ padding: '0' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #2C3E50 0%, #34495e 100%)', color: '#fff', borderBottom: 'none' }}>
                <h3 style={{ color: '#fff', fontWeight: '600' }}>{editingCatalog ? 'Edit Catalog' : 'Add New Catalog'}</h3>
                <button
                  className="modal-close"
                  onClick={handleCloseModal}
                  style={{ color: '#fff', fontSize: '24px', fontWeight: '300' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '24px' }}>
                <form onSubmit={handleSubmit}>
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="catalogName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Catalog Name <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="catalogName"
                      className="form-input"
                      value={formData.catelogname}
                      onChange={(e) => setFormData({ ...formData, catelogname: e.target.value })}
                      required
                      placeholder="Enter catalog name (e.g., Computers, Electronics)"
                      disabled={loading}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="catalogStatus" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Status <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <select
                      id="catalogStatus"
                      className="form-input"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      required
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box',
                        backgroundColor: '#fff',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleCloseModal}
                      disabled={loading}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        backgroundColor: '#fff',
                        color: '#333',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.3s'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: loading ? '#95a5a6' : '#2C3E50',
                        color: '#fff',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s',
                        boxShadow: loading ? 'none' : '0 2px 4px rgba(44, 62, 80, 0.2)'
                      }}
                      onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#34495e')}
                      onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2C3E50')}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner inline size="small" /> Saving...
                        </>
                      ) : editingCatalog ? 'Update Catalog' : 'Create Catalog'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

// Stock Location Management Section Component
const StockLocationManagementSection = () => {
  const [stockLocations, setStockLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStockLocation, setEditingStockLocation] = useState(null);
  const [formData, setFormData] = useState({
    warehouseid: '',
    name: '',
    type: '',
    parentstockid: '',
    locationaddress: '',
    isdefault: '0',
    isdelete: '0',
    status: 'Active',
    isdispatch: '0'
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

  // Fetch all stock locations
  const fetchStockLocations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/stocklocation?isdelete=0&status=Active`);
      const data = await response.json();

      if (data.success) {
        setStockLocations(data.stockLocations || data.data || []);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to fetch stock locations' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please check if the backend server is running.' });
      console.error('Error fetching stock locations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load stock locations on component mount and when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchTerm) {
        fetchStockLocations();
      }
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Initial load
  useEffect(() => {
    fetchStockLocations();
  }, []);

  // Handle form submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const query = editingStockLocation ? 2 : 1; // 1 = Insert, 2 = Update
      const url = editingStockLocation
        ? `${API_URL}/api/stocklocation/${editingStockLocation.id}`
        : `${API_URL}/api/stocklocation`;

      const method = editingStockLocation ? 'PUT' : 'POST';

      const requestBody = {
        warehouseid: formData.warehouseid || null,
        name: formData.name,
        type: formData.type || null,
        parentstockid: formData.parentstockid || null,
        locationaddress: formData.locationaddress || null,
        isdefault: formData.isdefault || '0',
        isdelete: formData.isdelete || '0',
        status: formData.status || 'Active',
        isdispatch: formData.isdispatch || '0',
        query: query
      };

      if (editingStockLocation) {
        requestBody.id = editingStockLocation.id;
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingStockLocation ? 'Stock location updated successfully!' : 'Stock location created successfully!' });
        setShowModal(false);
        setEditingStockLocation(null);
        setFormData({
          warehouseid: '',
          name: '',
          type: '',
          parentstockid: '',
          locationaddress: '',
          isdefault: '0',
          isdelete: '0',
          status: 'Active',
          isdispatch: '0'
        });
        fetchStockLocations();
      } else {
        setMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error saving stock location:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this stock location?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/stocklocation/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Stock location deleted successfully!' });
        fetchStockLocations();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete stock location' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error deleting stock location:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for editing
  const handleEdit = (stockLocation) => {
    setEditingStockLocation(stockLocation);
    setFormData({
      warehouseid: stockLocation.warehouseid || stockLocation.Warehouseid || '',
      name: stockLocation.name || stockLocation.Name || '',
      type: stockLocation.type || stockLocation.Type || '',
      parentstockid: stockLocation.parentstockid || stockLocation.Parentstockid || '',
      locationaddress: stockLocation.locationaddress || stockLocation.Locationaddress || '',
      isdefault: stockLocation.isdefault || stockLocation.Isdefault || '0',
      isdelete: stockLocation.isdelete || stockLocation.Isdelete || '0',
      status: stockLocation.status || stockLocation.Status || 'Active',
      isdispatch: stockLocation.isdispatch || stockLocation.Isdispatch || '0'
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Open modal for creating new stock location
  const handleAdd = () => {
    setEditingStockLocation(null);
    setFormData({
      warehouseid: '',
      name: '',
      type: '',
      parentstockid: '',
      locationaddress: '',
      isdefault: '0',
      isdelete: '0',
      status: 'Active',
      isdispatch: '0'
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStockLocation(null);
    setFormData({
      warehouseid: '',
      name: '',
      type: '',
      parentstockid: '',
      locationaddress: '',
      isdefault: '0',
      isdelete: '0',
      status: 'Active',
      isdispatch: '0'
    });
    setMessage({ type: '', text: '' });
  };

  // Filter stock locations based on search term
  const filteredStockLocations = searchTerm
    ? stockLocations.filter(location =>
      (location.name || location.Name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (location.warehouseid || location.Warehouseid || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (location.type || location.Type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (location.status || location.Status || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    : stockLocations;

  return (
    <div className="settings-section">
      <h2 className="section-title">Stock Location Management</h2>
      <p className="section-description">Create, update, and manage stock locations.</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )
      }

      <div className="roles-actions">
        <button className="btn-primary" onClick={handleAdd} disabled={loading}>
          + Add New Stock Location
        </button>
        <input
          type="search"
          placeholder="Search stock locations..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {
        loading && !stockLocations.length ? (
          <LoadingSpinner text="Loading stock locations..." />
        ) : (
          <div className="roles-table">
            {filteredStockLocations.length === 0 ? (
              <div className="empty-state">
                <p>No stock locations found. Click "Add New Stock Location" to create one.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Warehouse ID</th>
                    <th>Type</th>
                    <th>Location Address</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStockLocations.map((location) => (
                    <tr key={location.id || location.Id}>
                      <td>{location.id || location.Id}</td>
                      <td>{location.name || location.Name}</td>
                      <td>{location.warehouseid || location.Warehouseid || '-'}</td>
                      <td>{location.type || location.Type || '-'}</td>
                      <td>{location.locationaddress || location.Locationaddress || '-'}</td>
                      <td>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: (location.status || location.Status) === 'Active' ? '#d4edda' : '#f8d7da',
                            color: (location.status || location.Status) === 'Active' ? '#155724' : '#721c24'
                          }}
                        >
                          {location.status || location.Status || 'Active'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Edit"
                          onClick={() => handleEdit(location)}
                          disabled={loading}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          title="Delete"
                          onClick={() => handleDelete(location.id || location.Id)}
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      }

      {/* Modal for Add/Edit Stock Location */}
      {
        showModal && (
          <div className="modal-overlay">
            <div className="modal-content responsive-modal modal-sm" style={{ padding: '0', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #2C3E50 0%, #34495e 100%)', color: '#fff', borderBottom: 'none' }}>
                <h3 style={{ color: '#fff', fontWeight: '600' }}>{editingStockLocation ? 'Edit Stock Location' : 'Add New Stock Location'}</h3>
                <button
                  className="modal-close"
                  onClick={handleCloseModal}
                  style={{ color: '#fff', fontSize: '24px', fontWeight: '300' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '24px' }}>
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label htmlFor="stockLocationName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                        Name <span style={{ color: '#e74c3c' }}>*</span>
                      </label>
                      <input
                        type="text"
                        id="stockLocationName"
                        className="form-input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Enter stock location name"
                        disabled={loading}
                        autoFocus
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '14px',
                          transition: 'all 0.3s',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label htmlFor="warehouseId" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                        Warehouse ID
                      </label>
                      <input
                        type="text"
                        id="warehouseId"
                        className="form-input"
                        value={formData.warehouseid}
                        onChange={(e) => setFormData({ ...formData, warehouseid: e.target.value })}
                        placeholder="Enter warehouse ID"
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '14px',
                          transition: 'all 0.3s',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label htmlFor="stockLocationType" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                        Type
                      </label>
                      <input
                        type="text"
                        id="stockLocationType"
                        className="form-input"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        placeholder="Enter type"
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '14px',
                          transition: 'all 0.3s',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label htmlFor="parentStockId" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                        Parent Stock ID
                      </label>
                      <input
                        type="text"
                        id="parentStockId"
                        className="form-input"
                        value={formData.parentstockid}
                        onChange={(e) => setFormData({ ...formData, parentstockid: e.target.value })}
                        placeholder="Enter parent stock ID"
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '14px',
                          transition: 'all 0.3s',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="locationAddress" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Location Address
                    </label>
                    <input
                      type="text"
                      id="locationAddress"
                      className="form-input"
                      value={formData.locationaddress}
                      onChange={(e) => setFormData({ ...formData, locationaddress: e.target.value })}
                      placeholder="Enter location address"
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label htmlFor="isDefault" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                        Is Default
                      </label>
                      <select
                        id="isDefault"
                        className="form-input"
                        value={formData.isdefault}
                        onChange={(e) => setFormData({ ...formData, isdefault: e.target.value })}
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '14px',
                          transition: 'all 0.3s',
                          boxSizing: 'border-box',
                          backgroundColor: '#fff',
                          cursor: 'pointer'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                      >
                        <option value="0">No</option>
                        <option value="1">Yes</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label htmlFor="isDispatch" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                        Is Dispatch
                      </label>
                      <select
                        id="isDispatch"
                        className="form-input"
                        value={formData.isdispatch}
                        onChange={(e) => setFormData({ ...formData, isdispatch: e.target.value })}
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '14px',
                          transition: 'all 0.3s',
                          boxSizing: 'border-box',
                          backgroundColor: '#fff',
                          cursor: 'pointer'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                      >
                        <option value="0">No</option>
                        <option value="1">Yes</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label htmlFor="stockLocationStatus" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                        Status <span style={{ color: '#e74c3c' }}>*</span>
                      </label>
                      <select
                        id="stockLocationStatus"
                        className="form-input"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        required
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '14px',
                          transition: 'all 0.3s',
                          boxSizing: 'border-box',
                          backgroundColor: '#fff',
                          cursor: 'pointer'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleCloseModal}
                      disabled={loading}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        backgroundColor: '#fff',
                        color: '#333',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.3s'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: loading ? '#95a5a6' : '#2C3E50',
                        color: '#fff',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s',
                        boxShadow: loading ? 'none' : '0 2px 4px rgba(44, 62, 80, 0.2)'
                      }}
                      onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#34495e')}
                      onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2C3E50')}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner inline size="small" /> Saving...
                        </>
                      ) : editingStockLocation ? 'Update Stock Location' : 'Create Stock Location'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

// Bill Format Management Section Component
const BillFormatManagementSection = () => {
  const [billFormats, setBillFormats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBillFormat, setEditingBillFormat] = useState(null);
  const [formData, setFormData] = useState({
    type: '',
    format: '',
    isdelete: '0',
    status: 'Active'
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

  // Fetch all bill formats
  const fetchBillFormats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/billformat?isdelete=0&status=Active`);
      const data = await response.json();

      if (data.success) {
        setBillFormats(data.billFormats || data.data || []);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to fetch bill formats' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please check if the backend server is running.' });
      console.error('Error fetching bill formats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load bill formats on component mount and when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchTerm) {
        fetchBillFormats();
      }
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Initial load
  useEffect(() => {
    fetchBillFormats();
  }, []);

  // Handle form submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const query = editingBillFormat ? 2 : 1; // 1 = Insert, 2 = Update
      const url = editingBillFormat
        ? `${API_URL}/api/billformat/${editingBillFormat.id}`
        : `${API_URL}/api/billformat`;

      const method = editingBillFormat ? 'PUT' : 'POST';

      const requestBody = {
        type: formData.type,
        format: formData.format,
        isdelete: formData.isdelete || '0',
        status: formData.status || 'Active',
        query: query
      };

      if (editingBillFormat) {
        requestBody.id = editingBillFormat.id;
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingBillFormat ? 'Bill format updated successfully!' : 'Bill format created successfully!' });
        setShowModal(false);
        setEditingBillFormat(null);
        setFormData({
          type: '',
          format: '',
          isdelete: '0',
          status: 'Active'
        });
        fetchBillFormats();
      } else {
        setMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error saving bill format:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bill format?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/billformat/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Bill format deleted successfully!' });
        fetchBillFormats();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete bill format' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error deleting bill format:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for editing
  const handleEdit = (billFormat) => {
    setEditingBillFormat(billFormat);
    setFormData({
      type: billFormat.type || billFormat.Type || '',
      format: billFormat.format || billFormat.Format || '',
      isdelete: billFormat.isdelete || billFormat.Isdelete || '0',
      status: billFormat.status || billFormat.Status || 'Active'
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Open modal for creating new bill format
  const handleAdd = () => {
    setEditingBillFormat(null);
    setFormData({
      type: '',
      format: '',
      isdelete: '0',
      status: 'Active'
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBillFormat(null);
    setFormData({
      type: '',
      format: '',
      isdelete: '0',
      status: 'Active'
    });
    setMessage({ type: '', text: '' });
  };

  // Filter bill formats based on search term
  const filteredBillFormats = searchTerm
    ? billFormats.filter(billFormat =>
      (billFormat.type || billFormat.Type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (billFormat.format || billFormat.Format || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (billFormat.status || billFormat.Status || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    : billFormats;

  return (
    <div className="settings-section">
      <h2 className="section-title">Bill Format Management</h2>
      <p className="section-description">Create, update, and manage bill formats (e.g., Bill, Receipt).</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )
      }

      <div className="roles-actions">
        <button className="btn-primary" onClick={handleAdd} disabled={loading}>
          + Add New Bill Format
        </button>
        <input
          type="search"
          placeholder="Search bill formats..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {
        loading && !billFormats.length ? (
          <LoadingSpinner text="Loading bill formats..." />
        ) : (
          <div className="roles-table">
            {filteredBillFormats.length === 0 ? (
              <div className="empty-state">
                <p>No bill formats found. Click "Add New Bill Format" to create one.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Format</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBillFormats.map((billFormat) => (
                    <tr key={billFormat.id || billFormat.Id}>
                      <td>{billFormat.id || billFormat.Id}</td>
                      <td>{billFormat.type || billFormat.Type}</td>
                      <td>
                        <code style={{
                          backgroundColor: '#f4f4f4',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontFamily: 'monospace'
                        }}>
                          {billFormat.format || billFormat.Format}
                        </code>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: (billFormat.status || billFormat.Status) === 'Active' ? '#d4edda' : '#f8d7da',
                            color: (billFormat.status || billFormat.Status) === 'Active' ? '#155724' : '#721c24'
                          }}
                        >
                          {billFormat.status || billFormat.Status || 'Active'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Edit"
                          onClick={() => handleEdit(billFormat)}
                          disabled={loading}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          title="Delete"
                          onClick={() => handleDelete(billFormat.id || billFormat.Id)}
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      }

      {/* Modal for Add/Edit Bill Format */}
      {
        showModal && (
          <div className="modal-overlay">
            <div className="modal-content responsive-modal modal-sm" style={{ padding: '0' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #2C3E50 0%, #34495e 100%)', color: '#fff', borderBottom: 'none' }}>
                <h3 style={{ color: '#fff', fontWeight: '600' }}>{editingBillFormat ? 'Edit Bill Format' : 'Add New Bill Format'}</h3>
                <button
                  className="modal-close"
                  onClick={handleCloseModal}
                  style={{ color: '#fff', fontSize: '24px', fontWeight: '300' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '24px' }}>
                <form onSubmit={handleSubmit}>
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="billFormatType" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Type <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <select
                      id="billFormatType"
                      className="form-input"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box',
                        backgroundColor: '#fff',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    >
                      <option value="">Select Type</option>
                      <option value="Bill">Bill</option>
                      <option value="Receipt">Receipt</option>
                      <option value="Invoice">Invoice</option>
                      <option value="Quotation">Quotation</option>
                      <option value="Purchase Order">Purchase Order</option>
                      <option value="Delivery Note">Delivery Note</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="billFormatFormat" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Format <span style={{ color: '#e74c3c' }}>*</span>
                      <span style={{ fontSize: '12px', color: '#666', fontWeight: '400', marginLeft: '8px' }}>
                        (e.g., AGT-{'{'}yyyy{'}'}{'{'}mm{'}'}XXXX)
                      </span>
                    </label>
                    <input
                      type="text"
                      id="billFormatFormat"
                      className="form-input"
                      value={formData.format}
                      onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                      required
                      placeholder="Enter format pattern (e.g., AGT-{yyyy}{mm}XXXX)"
                      disabled={loading}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box',
                        fontFamily: 'monospace'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                      <strong>Format placeholders:</strong> {'{'}yyyy{'}'} = Year, {'{'}mm{'}'} = Month, XXXX = Sequential number
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="billFormatStatus" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Status <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <select
                      id="billFormatStatus"
                      className="form-input"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      required
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box',
                        backgroundColor: '#fff',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleCloseModal}
                      disabled={loading}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        backgroundColor: '#fff',
                        color: '#333',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.3s'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: loading ? '#95a5a6' : '#2C3E50',
                        color: '#fff',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s',
                        boxShadow: loading ? 'none' : '0 2px 4px rgba(44, 62, 80, 0.2)'
                      }}
                      onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#34495e')}
                      onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2C3E50')}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner inline size="small" /> Saving...
                        </>
                      ) : editingBillFormat ? 'Update Bill Format' : 'Create Bill Format'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

// Decimal Format Management Section Component
const DecimalFormatManagementSection = () => {
  const [decimalFormats, setDecimalFormats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDecimalFormat, setEditingDecimalFormat] = useState(null);
  const [formData, setFormData] = useState({
    decimalformat: '',
    decimalcount: 2,
    isdelete: '0',
    status: 'Active'
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

  // Fetch all decimal formats
  const fetchDecimalFormats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/decimalformat?isdelete=0&status=Active`);
      const data = await response.json();

      if (data.success) {
        setDecimalFormats(data.decimalFormats || data.data || []);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to fetch decimal formats' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please check if the backend server is running.' });
      console.error('Error fetching decimal formats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load decimal formats on component mount and when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchTerm) {
        fetchDecimalFormats();
      }
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Initial load
  useEffect(() => {
    fetchDecimalFormats();
  }, []);

  // Handle form submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const query = editingDecimalFormat ? 2 : 1; // 1 = Insert, 2 = Update
      const url = editingDecimalFormat
        ? `${API_URL}/api/decimalformat/${editingDecimalFormat.id}`
        : `${API_URL}/api/decimalformat`;

      const method = editingDecimalFormat ? 'PUT' : 'POST';

      const requestBody = {
        decimalformat: formData.decimalformat,
        decimalcount: parseInt(formData.decimalcount) || 2,
        isdelete: formData.isdelete || '0',
        status: formData.status || 'Active',
        query: query
      };

      if (editingDecimalFormat) {
        requestBody.id = editingDecimalFormat.id;
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingDecimalFormat ? 'Decimal format updated successfully!' : 'Decimal format created successfully!' });
        setShowModal(false);
        setEditingDecimalFormat(null);
        setFormData({
          decimalformat: '',
          decimalcount: 2,
          isdelete: '0',
          status: 'Active'
        });
        fetchDecimalFormats();
      } else {
        setMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error saving decimal format:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this decimal format?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/decimalformat/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Decimal format deleted successfully!' });
        fetchDecimalFormats();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete decimal format' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error deleting decimal format:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for editing
  const handleEdit = (decimalFormat) => {
    setEditingDecimalFormat(decimalFormat);
    setFormData({
      decimalformat: decimalFormat.decimalformat || decimalFormat.Decimalformat || '',
      decimalcount: decimalFormat.decimalcount || decimalFormat.Decimalcount || 2,
      isdelete: decimalFormat.isdelete || decimalFormat.Isdelete || '0',
      status: decimalFormat.status || decimalFormat.Status || 'Active'
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Open modal for creating new decimal format
  const handleAdd = () => {
    setEditingDecimalFormat(null);
    setFormData({
      decimalformat: '',
      decimalcount: 2,
      isdelete: '0',
      status: 'Active'
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDecimalFormat(null);
    setFormData({
      decimalformat: '',
      decimalcount: 2,
      isdelete: '0',
      status: 'Active'
    });
    setMessage({ type: '', text: '' });
  };

  // Filter decimal formats based on search term
  const filteredDecimalFormats = searchTerm
    ? decimalFormats.filter(decimalFormat =>
      (decimalFormat.decimalformat || decimalFormat.Decimalformat || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(decimalFormat.decimalcount || decimalFormat.Decimalcount || '').includes(searchTerm) ||
      (decimalFormat.status || decimalFormat.Status || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    : decimalFormats;

  return (
    <div className="settings-section">
      <h2 className="section-title">Decimal Format Management</h2>
      <p className="section-description">Create, update, and manage decimal formats for number display (e.g., 0.00, #,##0.00).</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )
      }

      <div className="roles-actions">
        <button className="btn-primary" onClick={handleAdd} disabled={loading}>
          + Add New Decimal Format
        </button>
        <input
          type="search"
          placeholder="Search decimal formats..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {
        loading && !decimalFormats.length ? (
          <LoadingSpinner text="Loading decimal formats..." />
        ) : (
          <div className="roles-table">
            {filteredDecimalFormats.length === 0 ? (
              <div className="empty-state">
                <p>No decimal formats found. Click "Add New Decimal Format" to create one.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Decimal Format</th>
                    <th>Decimal Count</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDecimalFormats.map((decimalFormat) => (
                    <tr key={decimalFormat.id || decimalFormat.Id}>
                      <td>{decimalFormat.id || decimalFormat.Id}</td>
                      <td>
                        <code style={{
                          backgroundColor: '#f4f4f4',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontFamily: 'monospace'
                        }}>
                          {decimalFormat.decimalformat || decimalFormat.Decimalformat}
                        </code>
                      </td>
                      <td>{decimalFormat.decimalcount || decimalFormat.Decimalcount}</td>
                      <td>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: (decimalFormat.status || decimalFormat.Status) === 'Active' ? '#d4edda' : '#f8d7da',
                            color: (decimalFormat.status || decimalFormat.Status) === 'Active' ? '#155724' : '#721c24'
                          }}
                        >
                          {decimalFormat.status || decimalFormat.Status || 'Active'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Edit"
                          onClick={() => handleEdit(decimalFormat)}
                          disabled={loading}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          title="Delete"
                          onClick={() => handleDelete(decimalFormat.id || decimalFormat.Id)}
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      }

      {/* Modal for Add/Edit Decimal Format */}
      {
        showModal && (
          <div className="modal-overlay">
            <div className="modal-content responsive-modal modal-sm" style={{ padding: '0' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #2C3E50 0%, #34495e 100%)', color: '#fff', borderBottom: 'none' }}>
                <h3 style={{ color: '#fff', fontWeight: '600' }}>{editingDecimalFormat ? 'Edit Decimal Format' : 'Add New Decimal Format'}</h3>
                <button
                  className="modal-close"
                  onClick={handleCloseModal}
                  style={{ color: '#fff', fontSize: '24px', fontWeight: '300' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '24px' }}>
                <form onSubmit={handleSubmit}>
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="decimalFormatFormat" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Decimal Format <span style={{ color: '#e74c3c' }}>*</span>
                      <span style={{ fontSize: '12px', color: '#666', fontWeight: '400', marginLeft: '8px' }}>
                        (e.g., 0.00, #,##0.00, 0.000)
                      </span>
                    </label>
                    <input
                      type="text"
                      id="decimalFormatFormat"
                      className="form-input"
                      value={formData.decimalformat}
                      onChange={(e) => setFormData({ ...formData, decimalformat: e.target.value })}
                      required
                      placeholder="Enter decimal format (e.g., 0.00)"
                      disabled={loading}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box',
                        fontFamily: 'monospace'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                      <strong>Examples:</strong> 0.00 (2 decimals), 0.000 (3 decimals), #,##0.00 (with thousand separator)
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="decimalFormatCount" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Decimal Count <span style={{ color: '#e74c3c' }}>*</span>
                      <span style={{ fontSize: '12px', color: '#666', fontWeight: '400', marginLeft: '8px' }}>
                        (Number of decimal places: 0-10)
                      </span>
                    </label>
                    <input
                      type="number"
                      id="decimalFormatCount"
                      className="form-input"
                      value={formData.decimalcount}
                      onChange={(e) => setFormData({ ...formData, decimalcount: parseInt(e.target.value) || 0 })}
                      required
                      min="0"
                      max="10"
                      placeholder="Enter decimal count (0-10)"
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="decimalFormatStatus" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Status <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <select
                      id="decimalFormatStatus"
                      className="form-input"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      required
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box',
                        backgroundColor: '#fff',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleCloseModal}
                      disabled={loading}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        backgroundColor: '#fff',
                        color: '#333',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.3s'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: loading ? '#95a5a6' : '#2C3E50',
                        color: '#fff',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s',
                        boxShadow: loading ? 'none' : '0 2px 4px rgba(44, 62, 80, 0.2)'
                      }}
                      onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#34495e')}
                      onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2C3E50')}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner inline size="small" /> Saving...
                        </>
                      ) : editingDecimalFormat ? 'Update Decimal Format' : 'Create Decimal Format'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

// Payment Terms Management Section Component
const PaymentTermsManagementSection = () => {
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPaymentTerm, setEditingPaymentTerm] = useState(null);
  const [formData, setFormData] = useState({
    paymentterms: '',
    isdelete: '0'
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

  // Fetch all payment terms
  const fetchPaymentTerms = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/paymentterms?isdelete=0`);
      const data = await response.json();

      if (data.success) {
        setPaymentTerms(data.paymentTerms || data.data || []);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to fetch payment terms' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please check if the backend server is running.' });
      console.error('Error fetching payment terms:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load payment terms on component mount and when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchTerm) {
        fetchPaymentTerms();
      }
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Initial load
  useEffect(() => {
    fetchPaymentTerms();
  }, []);

  // Handle form submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const query = editingPaymentTerm ? 2 : 1; // 1 = Insert, 2 = Update
      const url = editingPaymentTerm
        ? `${API_URL}/api/paymentterms/${editingPaymentTerm.id}`
        : `${API_URL}/api/paymentterms`;

      const method = editingPaymentTerm ? 'PUT' : 'POST';

      const requestBody = {
        paymentterms: formData.paymentterms,
        isdelete: formData.isdelete || '0',
        query: query
      };

      if (editingPaymentTerm) {
        requestBody.id = editingPaymentTerm.id;
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingPaymentTerm ? 'Payment term updated successfully!' : 'Payment term created successfully!' });
        setShowModal(false);
        setEditingPaymentTerm(null);
        setFormData({
          paymentterms: '',
          isdelete: '0'
        });
        fetchPaymentTerms();
      } else {
        setMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error saving payment term:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment term?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/paymentterms/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Payment term deleted successfully!' });
        fetchPaymentTerms();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete payment term' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error deleting payment term:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for editing
  const handleEdit = (paymentTerm) => {
    setEditingPaymentTerm(paymentTerm);
    setFormData({
      paymentterms: paymentTerm.paymentterms || paymentTerm.Paymentterms || '',
      isdelete: paymentTerm.isdelete || paymentTerm.Isdelete || '0'
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Open modal for creating new payment term
  const handleAdd = () => {
    setEditingPaymentTerm(null);
    setFormData({
      paymentterms: '',
      isdelete: '0'
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPaymentTerm(null);
    setFormData({
      paymentterms: '',
      isdelete: '0'
    });
    setMessage({ type: '', text: '' });
  };

  // Filter payment terms based on search term
  const filteredPaymentTerms = searchTerm
    ? paymentTerms.filter(paymentTerm =>
      (paymentTerm.paymentterms || paymentTerm.Paymentterms || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    : paymentTerms;

  return (
    <div className="settings-section">
      <h2 className="section-title">Payment Terms Management</h2>
      <p className="section-description">Create, update, and manage payment terms (e.g., Net 30, Due on receipt, Consignment).</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )
      }

      <div className="roles-actions">
        <button className="btn-primary" onClick={handleAdd} disabled={loading}>
          + Add New Payment Term
        </button>
        <input
          type="search"
          placeholder="Search payment terms..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {
        loading && !paymentTerms.length ? (
          <LoadingSpinner text="Loading payment terms..." />
        ) : (
          <div className="roles-table">
            {filteredPaymentTerms.length === 0 ? (
              <div className="empty-state">
                <p>No payment terms found. Click "Add New Payment Term" to create one.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Payment Terms</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPaymentTerms.map((paymentTerm) => (
                    <tr key={paymentTerm.id || paymentTerm.Id}>
                      <td>{paymentTerm.id || paymentTerm.Id}</td>
                      <td>{paymentTerm.paymentterms || paymentTerm.Paymentterms}</td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Edit"
                          onClick={() => handleEdit(paymentTerm)}
                          disabled={loading}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          title="Delete"
                          onClick={() => handleDelete(paymentTerm.id || paymentTerm.Id)}
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      }

      {/* Modal for Add/Edit Payment Term */}
      {
        showModal && (
          <div className="modal-overlay">
            <div className="modal-content responsive-modal modal-sm" style={{ padding: '0' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #2C3E50 0%, #34495e 100%)', color: '#fff', borderBottom: 'none' }}>
                <h3 style={{ color: '#fff', fontWeight: '600' }}>{editingPaymentTerm ? 'Edit Payment Term' : 'Add New Payment Term'}</h3>
                <button
                  className="modal-close"
                  onClick={handleCloseModal}
                  style={{ color: '#fff', fontSize: '24px', fontWeight: '300' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '24px' }}>
                <form onSubmit={handleSubmit}>
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="paymentTermsName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Payment Terms <span style={{ color: '#e74c3c' }}>*</span>
                      <span style={{ fontSize: '12px', color: '#666', fontWeight: '400', marginLeft: '8px' }}>
                        (e.g., Net 30, Due on receipt, Consignment)
                      </span>
                    </label>
                    <input
                      type="text"
                      id="paymentTermsName"
                      className="form-input"
                      value={formData.paymentterms}
                      onChange={(e) => setFormData({ ...formData, paymentterms: e.target.value })}
                      required
                      placeholder="Enter payment terms (e.g., Net 30)"
                      disabled={loading}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                      <strong>Examples:</strong> Net 15, Net 30, Net 45, Net 60, Net 90, Due on receipt, Consignment
                    </div>
                  </div>

                  <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleCloseModal}
                      disabled={loading}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        backgroundColor: '#fff',
                        color: '#333',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.3s'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: loading ? '#95a5a6' : '#2C3E50',
                        color: '#fff',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s',
                        boxShadow: loading ? 'none' : '0 2px 4px rgba(44, 62, 80, 0.2)'
                      }}
                      onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#34495e')}
                      onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2C3E50')}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner inline size="small" /> Saving...
                        </>
                      ) : editingPaymentTerm ? 'Update Payment Term' : 'Create Payment Term'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

// Date Format Management Section Component
const DateFormatManagementSection = () => {
  const [dateFormats, setDateFormats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDateFormat, setEditingDateFormat] = useState(null);
  const [formData, setFormData] = useState({
    dateformat: '',
    isdelete: '0'
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

  // Fetch all date formats
  const fetchDateFormats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/dateformat?isdelete=0`);
      const data = await response.json();

      if (data.success) {
        setDateFormats(data.dateFormats || data.data || []);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to fetch date formats' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please check if the backend server is running.' });
      console.error('Error fetching date formats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load date formats on component mount and when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchTerm) {
        fetchDateFormats();
      }
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Initial load
  useEffect(() => {
    fetchDateFormats();
  }, []);

  // Handle form submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const query = editingDateFormat ? 2 : 1; // 1 = Insert, 2 = Update
      const url = editingDateFormat
        ? `${API_URL}/api/dateformat/${editingDateFormat.id}`
        : `${API_URL}/api/dateformat`;

      const method = editingDateFormat ? 'PUT' : 'POST';

      const requestBody = {
        dateformat: formData.dateformat,
        isdelete: formData.isdelete || '0',
        query: query
      };

      if (editingDateFormat) {
        requestBody.id = editingDateFormat.id;
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingDateFormat ? 'Date format updated successfully!' : 'Date format created successfully!' });
        setShowModal(false);
        setEditingDateFormat(null);
        setFormData({
          dateformat: '',
          isdelete: '0'
        });
        fetchDateFormats();
      } else {
        setMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error saving date format:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this date format?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/dateformat/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Date format deleted successfully!' });
        fetchDateFormats();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete date format' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error deleting date format:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for editing
  const handleEdit = (dateFormat) => {
    setEditingDateFormat(dateFormat);
    setFormData({
      dateformat: dateFormat.dateformat || dateFormat.Dateformat || '',
      isdelete: dateFormat.isdelete || dateFormat.Isdelete || '0'
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Open modal for creating new date format
  const handleAdd = () => {
    setEditingDateFormat(null);
    setFormData({
      dateformat: '',
      isdelete: '0'
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDateFormat(null);
    setFormData({
      dateformat: '',
      isdelete: '0'
    });
    setMessage({ type: '', text: '' });
  };

  // Filter date formats based on search term
  const filteredDateFormats = searchTerm
    ? dateFormats.filter(dateFormat =>
      (dateFormat.dateformat || dateFormat.Dateformat || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    : dateFormats;

  return (
    <div className="settings-section">
      <h2 className="section-title">Date Format Management</h2>
      <p className="section-description">Create, update, and manage date formats (e.g., yyyy-MM-dd, MM/dd/yyyy, dd-MM-yyyy).</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )
      }

      <div className="roles-actions">
        <button className="btn-primary" onClick={handleAdd} disabled={loading}>
          + Add New Date Format
        </button>
        <input
          type="search"
          placeholder="Search date formats..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {
        loading && !dateFormats.length ? (
          <LoadingSpinner text="Loading date formats..." />
        ) : (
          <div className="roles-table">
            {filteredDateFormats.length === 0 ? (
              <div className="empty-state">
                <p>No date formats found. Click "Add New Date Format" to create one.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date Format</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDateFormats.map((dateFormat) => (
                    <tr key={dateFormat.id || dateFormat.Id}>
                      <td>{dateFormat.id || dateFormat.Id}</td>
                      <td>
                        <code style={{
                          backgroundColor: '#f4f4f4',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontFamily: 'monospace'
                        }}>
                          {dateFormat.dateformat || dateFormat.Dateformat}
                        </code>
                      </td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Edit"
                          onClick={() => handleEdit(dateFormat)}
                          disabled={loading}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          title="Delete"
                          onClick={() => handleDelete(dateFormat.id || dateFormat.Id)}
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      }

      {/* Modal for Add/Edit Date Format */}
      {
        showModal && (
          <div className="modal-overlay">
            <div className="modal-content responsive-modal modal-sm" style={{ padding: '0' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #2C3E50 0%, #34495e 100%)', color: '#fff', borderBottom: 'none' }}>
                <h3 style={{ color: '#fff', fontWeight: '600' }}>{editingDateFormat ? 'Edit Date Format' : 'Add New Date Format'}</h3>
                <button
                  className="modal-close"
                  onClick={handleCloseModal}
                  style={{ color: '#fff', fontSize: '24px', fontWeight: '300' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '24px' }}>
                <form onSubmit={handleSubmit}>
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="dateFormatPattern" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Date Format <span style={{ color: '#e74c3c' }}>*</span>
                      <span style={{ fontSize: '12px', color: '#666', fontWeight: '400', marginLeft: '8px' }}>
                        (e.g., yyyy-MM-dd, MM/dd/yyyy, dd-MM-yyyy)
                      </span>
                    </label>
                    <input
                      type="text"
                      id="dateFormatPattern"
                      className="form-input"
                      value={formData.dateformat}
                      onChange={(e) => setFormData({ ...formData, dateformat: e.target.value })}
                      required
                      placeholder="Enter date format (e.g., yyyy-MM-dd)"
                      disabled={loading}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box',
                        fontFamily: 'monospace'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                      <strong>Examples:</strong> yyyy-MM-dd, MM/dd/yyyy, dd-MM-yyyy, yyyy/MM/dd, dd/MM/yyyy, MM-dd-yyyy
                    </div>
                  </div>

                  <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleCloseModal}
                      disabled={loading}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        backgroundColor: '#fff',
                        color: '#333',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.3s'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: loading ? '#95a5a6' : '#2C3E50',
                        color: '#fff',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s',
                        boxShadow: loading ? 'none' : '0 2px 4px rgba(44, 62, 80, 0.2)'
                      }}
                      onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#34495e')}
                      onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2C3E50')}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner inline size="small" /> Saving...
                        </>
                      ) : editingDateFormat ? 'Update Date Format' : 'Create Date Format'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

// Currency Management Section Component
const CurrencyManagementSection = () => {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [formData, setFormData] = useState({
    currency: '',
    rate: '1.00',
    isdefault: 1,
    isdelete: '0',
    status: 'Active'
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

  // Fetch all currencies
  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/currency?isdelete=0&status=Active`);
      const data = await response.json();

      if (data.success) {
        setCurrencies(data.currencies || data.data || []);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to fetch currencies' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please check if the backend server is running.' });
      console.error('Error fetching currencies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load currencies on component mount and when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchTerm) {
        fetchCurrencies();
      }
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Initial load
  useEffect(() => {
    fetchCurrencies();
  }, []);

  // Handle form submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const query = editingCurrency ? 3 : 1; // 1 = Insert, 3 = Update
      const url = editingCurrency
        ? `${API_URL}/api/currency/${editingCurrency.id}`
        : `${API_URL}/api/currency`;

      const method = editingCurrency ? 'PUT' : 'POST';

      const requestBody = {
        currency: formData.currency,
        rate: formData.rate || '1.00',
        isdefault: formData.isdefault !== undefined && formData.isdefault !== null ? formData.isdefault : 0,
        isdelete: formData.isdelete || '0',
        status: formData.status || 'Active',
        query: query
      };

      console.log('Submitting currency with isdefault:', requestBody.isdefault);

      if (editingCurrency) {
        requestBody.id = editingCurrency.id;
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingCurrency ? 'Currency updated successfully!' : 'Currency created successfully!' });
        setShowModal(false);
        setEditingCurrency(null);
        setFormData({
          currency: '',
          rate: '1.00',
          isdefault: 0,
          isdelete: '0',
          status: 'Active'
        });
        fetchCurrencies();
      } else {
        setMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error saving currency:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this currency?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/currency/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Currency deleted successfully!' });
        fetchCurrencies();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete currency' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error deleting currency:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for editing
  const handleEdit = (currency) => {
    setEditingCurrency(currency);
    setFormData({
      currency: currency.currency || currency.Currency || '',
      rate: currency.rate || currency.Rate || '1.00',
      isdefault: currency.isdefault || currency.Isdefault || 0,
      isdelete: currency.isdelete || currency.Isdelete || '0',
      status: currency.status || currency.Status || 'Active'
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Open modal for creating new currency
  const handleAdd = () => {
    setEditingCurrency(null);
    setFormData({
      currency: '',
      rate: '1.00',
      isdefault: 1,
      isdelete: '0',
      status: 'Active'
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCurrency(null);
    setFormData({
      currency: '',
      rate: '1.00',
      isdefault: 1,
      isdelete: '0',
      status: 'Active'
    });
    setMessage({ type: '', text: '' });
  };

  // Filter currencies based on search term
  const filteredCurrencies = searchTerm
    ? currencies.filter(currency =>
      (currency.currency || currency.Currency || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (currency.rate || currency.Rate || '').includes(searchTerm) ||
      (currency.status || currency.Status || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    : currencies;

  return (
    <div className="settings-section">
      <h2 className="section-title">Currency Management</h2>
      <p className="section-description">Create, update, and manage currencies with exchange rates (e.g., USD, EUR, GBP).</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )
      }

      <div className="roles-actions">
        <button className="btn-primary" onClick={handleAdd} disabled={loading}>
          + Add New Currency
        </button>
        <input
          type="search"
          placeholder="Search currencies..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {
        loading && !currencies.length ? (
          <LoadingSpinner text="Loading currencies..." />
        ) : (
          <div className="roles-table">
            {filteredCurrencies.length === 0 ? (
              <div className="empty-state">
                <p>No currencies found. Click "Add New Currency" to create one.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Currency</th>
                    <th>Rate</th>
                    <th>Default</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCurrencies.map((currency) => (
                    <tr key={currency.id || currency.Id}>
                      <td>{currency.id || currency.Id}</td>
                      <td>
                        <strong>{currency.currency || currency.Currency}</strong>
                      </td>
                      <td>
                        <code style={{
                          backgroundColor: '#f4f4f4',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontFamily: 'monospace'
                        }}>
                          {currency.rate || currency.Rate || '1.00'}
                        </code>
                      </td>
                      <td>
                        {(currency.isdefault || currency.Isdefault) === 1 ? (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: '#d1ecf1',
                            color: '#0c5460'
                          }}>
                            Default
                          </span>
                        ) : (
                          <span style={{ color: '#999' }}>-</span>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: (currency.status || currency.Status) === 'Active' ? '#d4edda' : '#f8d7da',
                            color: (currency.status || currency.Status) === 'Active' ? '#155724' : '#721c24'
                          }}
                        >
                          {currency.status || currency.Status || 'Active'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Edit"
                          onClick={() => handleEdit(currency)}
                          disabled={loading}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          title="Delete"
                          onClick={() => handleDelete(currency.id || currency.Id)}
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      }

      {/* Modal for Add/Edit Currency */}
      {
        showModal && (
          <div className="modal-overlay">
            <div className="modal-content responsive-modal modal-sm" style={{ padding: '0' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #2C3E50 0%, #34495e 100%)', color: '#fff', borderBottom: 'none' }}>
                <h3 style={{ color: '#fff', fontWeight: '600' }}>{editingCurrency ? 'Edit Currency' : 'Add New Currency'}</h3>
                <button
                  className="modal-close"
                  onClick={handleCloseModal}
                  style={{ color: '#fff', fontSize: '24px', fontWeight: '300' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '16px' }}>
                <form onSubmit={handleSubmit}>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label htmlFor="currencyName" style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Currency <span style={{ color: '#e74c3c' }}>*</span>
                      <span style={{ fontSize: '11px', color: '#666', fontWeight: '400', marginLeft: '6px' }}>
                        (e.g., USD, EUR, GBP, INR)
                      </span>
                    </label>
                    <input
                      type="text"
                      id="currencyName"
                      className="form-input"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      required
                      placeholder="Enter currency code (e.g., USD)"
                      disabled={loading}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box',
                        textTransform: 'uppercase'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label htmlFor="currencyRate" style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Exchange Rate <span style={{ color: '#e74c3c' }}>*</span>
                      <span style={{ fontSize: '11px', color: '#666', fontWeight: '400', marginLeft: '6px' }}>
                        (e.g., 1.00, 0.85, 82.50)
                      </span>
                    </label>
                    <input
                      type="text"
                      id="currencyRate"
                      className="form-input"
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                      required
                      placeholder="Enter exchange rate (e.g., 1.00)"
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box',
                        fontFamily: 'monospace'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="currencyIsDefault" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Set as Default Currency
                    </label>
                    <label htmlFor="currencyIsDefault" style={{ display: 'flex', alignItems: 'center', cursor: loading ? 'not-allowed' : 'pointer', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        id="currencyIsDefault"
                        checked={Boolean(formData.isdefault === 1 || formData.isdefault === '1')}
                        onChange={(e) => {
                          const newValue = e.target.checked ? 1 : 0;
                          console.log('Checkbox changed:', e.target.checked, 'Current formData.isdefault:', formData.isdefault, 'New value:', newValue);
                          setFormData(prev => {
                            const updated = { ...prev, isdefault: newValue };
                            console.log('Updated formData:', updated);
                            return updated;
                          });
                        }}
                        disabled={loading}
                        style={{
                          width: '16px',
                          height: '16px',
                          marginRight: '8px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          flexShrink: 0,
                          accentColor: '#2C3E50',
                          outline: 'none',
                          appearance: 'auto',
                          WebkitAppearance: 'checkbox',
                          MozAppearance: 'checkbox'
                        }}
                      />
                      <span style={{ fontSize: '14px', color: '#333' }}>Mark this currency as the default</span>
                    </label>
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label htmlFor="currencyStatus" style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Status <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <select
                      id="currencyStatus"
                      className="form-input"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      required
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box',
                        backgroundColor: '#fff',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e0e0e0' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleCloseModal}
                      disabled={loading}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        backgroundColor: '#fff',
                        color: '#333',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.3s'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      style={{
                        padding: '8px 20px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: loading ? '#95a5a6' : '#2C3E50',
                        color: '#fff',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s',
                        boxShadow: loading ? 'none' : '0 2px 4px rgba(44, 62, 80, 0.2)'
                      }}
                      onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#34495e')}
                      onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2C3E50')}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner inline size="small" /> Saving...
                        </>
                      ) : editingCurrency ? 'Update Currency' : 'Create Currency'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

// Dashboard Content View Settings Section Component
const DashboardContentViewSettingsSection = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [dashboardContentViews, setDashboardContentViews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

  // Dashboard content sections that can be controlled
  const dashboardContentSections = [
    { id: 'dashboard-home', label: 'Dashboard Home', description: 'Main dashboard welcome section' },
    { id: 'human-resources', label: 'Human Resources', description: 'HR employee management section' },
    { id: 'sales', label: 'Sales', description: 'Sales management section' },
    { id: 'finance', label: 'Finance', description: 'Finance management section' },
    { id: 'warehouse', label: 'Warehouse', description: 'Warehouse management section' },
    { id: 'inventory', label: 'Inventory', description: 'Inventory management section' },
    { id: 'purchasing', label: 'Purchasing', description: 'Purchasing management section' },
    { id: 'production', label: 'Production', description: 'Production management section' },
    { id: 'quality', label: 'Quality', description: 'Quality management section' },
    { id: 'maintenance', label: 'Maintenance', description: 'Maintenance management section' },
    { id: 'project', label: 'Project', description: 'Project management section' },
    { id: 'crm', label: 'CRM', description: 'Customer relationship management section' },
    { id: 'marketing', label: 'Marketing', description: 'Marketing management section' },
    { id: 'accounting', label: 'Accounting', description: 'Accounting management section' },
    { id: 'reporting', label: 'Reporting', description: 'Reporting and analytics section' },
  ];

  // Fetch roles and dashboard content views
  useEffect(() => {
    fetchRoles();
    fetchDashboardContentViews();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/role`);
      const data = await response.json();
      if (data.success) {
        setRoles(data.roles || []);
        if (data.roles && data.roles.length > 0 && !selectedRole) {
          setSelectedRole(data.roles[0].id);
          fetchPermissions(data.roles[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setMessage({ type: 'error', text: 'Failed to load roles' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch all dashboard content views
  const fetchDashboardContentViews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/dashboardcontentview`);
      const data = await response.json();
      if (data.success) {
        setDashboardContentViews(data.dashboardContentViews || []);
      } else {
        console.error('Failed to fetch dashboard content views:', data.message);
      }
    } catch (error) {
      console.error('Error fetching dashboard content views:', error);
      // Don't show error message for this, as it's not critical for initial load
    } finally {
      setLoading(false);
    }
  };

  // Fetch permissions for selected role
  const fetchPermissions = async (roleId) => {
    try {
      setLoading(true);
      const initialPermissions = {};
      dashboardContentSections.forEach(section => {
        initialPermissions[section.id] = false;
      });

      // Fetch existing permissions from API (only Active status records)
      const response = await fetch(`${API_URL}/api/dashboardcontentview/role/${roleId}?status=Active`);
      const data = await response.json();

      console.log('Fetch permissions response:', { roleId, data });

      if (data.success && data.dashboardContentViews && Array.isArray(data.dashboardContentViews)) {
        console.log('Available section IDs:', Object.keys(initialPermissions));
        console.log('Received views:', data.dashboardContentViews.map(v => ({ id: v.ContentSectionId, visible: v.IsVisible })));

        // Map the API response to permissions state
        data.dashboardContentViews.forEach(view => {
          const sectionId = view.ContentSectionId?.trim();
          const isVisible = view.IsVisible === 'Yes' || view.IsVisible === 'yes' || view.IsVisible === true;

          console.log('Processing view:', {
            ContentSectionId: sectionId,
            IsVisible: view.IsVisible,
            isVisible: isVisible,
            hasProperty: initialPermissions.hasOwnProperty(sectionId),
            availableKeys: Object.keys(initialPermissions)
          });

          if (sectionId && initialPermissions.hasOwnProperty(sectionId)) {
            initialPermissions[sectionId] = isVisible;
            console.log(`Set ${sectionId} to ${isVisible} `);
          } else if (sectionId) {
            console.warn(`Section ID "${sectionId}" not found in dashboardContentSections`);
          }
        });
      } else {
        console.warn('No dashboard content views found or invalid response:', data);
      }

      console.log('Final permissions state:', initialPermissions);
      setPermissions(initialPermissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setMessage({ type: 'error', text: 'Failed to load permissions' });
      // Still set initial permissions even on error
      const initialPermissions = {};
      dashboardContentSections.forEach(section => {
        initialPermissions[section.id] = false;
      });
      setPermissions(initialPermissions);
    } finally {
      setLoading(false);
    }
  };

  // Handle role selection
  const handleRoleChange = (roleId) => {
    setSelectedRole(roleId);
    fetchPermissions(roleId);
  };

  // Toggle permission for a content section
  const togglePermission = (sectionId) => {
    setPermissions(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Save permissions
  const handleSave = async () => {
    if (!selectedRole) {
      setMessage({ type: 'error', text: 'Please select a role' });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      // Get existing records for this role to check which ones need to be updated vs created
      const existingResponse = await fetch(`${API_URL}/api/dashboardcontentview/role/${selectedRole}`);
      const existingData = await existingResponse.json();
      const existingRecords = existingData.success ? existingData.dashboardContentViews || [] : [];

      // Create a map of existing records by ContentSectionId
      const existingMap = {};
      existingRecords.forEach(record => {
        existingMap[record.ContentSectionId] = record;
      });

      // Save each section's permission
      const savePromises = dashboardContentSections.map(async (section) => {
        const isVisible = permissions[section.id] ? 'Yes' : 'No';
        const existingRecord = existingMap[section.id];

        const requestBody = {
          Id: existingRecord ? existingRecord.Id : 0,
          RoleId: selectedRole,
          ContentSectionId: section.id,
          ContentSectionName: section.label,
          IsVisible: isVisible,
          Status: 'Active',
          Enterdate: new Date().toISOString()
        };

        if (existingRecord) {
          // Update existing record
          const response = await fetch(`${API_URL}/api/dashboardcontentview/${existingRecord.Id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });
          return response.json();
        } else {
          // Create new record
          const response = await fetch(`${API_URL}/api/dashboardcontentview`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });
          return response.json();
        }
      });

      // Wait for all saves to complete
      const results = await Promise.all(savePromises);

      // Check if all saves were successful
      const allSuccess = results.every(result => result.success);

      if (allSuccess) {
        setMessage({ type: 'success', text: 'Permissions saved successfully!' });
        // Refresh the dashboard content views
        await fetchDashboardContentViews();
      } else {
        const errorMessages = results.filter(r => !r.success).map(r => r.message).join(', ');
        setMessage({ type: 'error', text: `Some permissions failed to save: ${errorMessages} ` });
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-section">
      <h2 className="section-title">Dashboard Content View Settings</h2>
      <p className="section-description">
        Configure which dashboard content sections are visible to each role. Select a role and toggle view permissions for each content section.
      </p>

      {message.text && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '20px' }}>
          {message.text}
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <label htmlFor="roleSelect" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
          Select Role *
        </label>
        <SearchableSelect
          options={roles.map(role => ({ value: role.id, label: role.role }))}
          value={selectedRole}
          onChange={(value) => handleRoleChange(value ? parseInt(value) : null)}
          placeholder="-- Select a Role --"
          disabled={loading}
          label=""
          maxWidth="100%"
        />
      </div>

      {selectedRole && (
        <>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '16px' }}>
              Content Section Permissions
            </h3>
            <div style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: '12px',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #e0e0e0',
                fontWeight: '600',
                fontSize: '14px',
                color: '#333'
              }}>
                <div>View</div>
                <div>Content Section</div>
                <div>Description</div>
              </div>
              {dashboardContentSections.map((section) => (
                <div
                  key={section.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    gap: '12px',
                    padding: '16px',
                    borderBottom: '1px solid #f0f0f0',
                    alignItems: 'center',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                >
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    userSelect: 'none'
                  }}>
                    <input
                      type="checkbox"
                      checked={permissions[section.id] || false}
                      onChange={() => togglePermission(section.id)}
                      disabled={loading}
                      style={{
                        width: '18px',
                        height: '18px',
                        marginRight: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        accentColor: '#2C3E50'
                      }}
                    />
                  </label>
                  <div style={{ fontWeight: '500', color: '#333', fontSize: '14px' }}>
                    {section.label}
                  </div>
                  <div style={{ color: '#666', fontSize: '13px', fontStyle: 'italic' }}>
                    {section.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="btn-primary"
              style={{
                padding: '12px 24px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: loading ? '#95a5a6' : '#2C3E50',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                boxShadow: loading ? 'none' : '0 2px 4px rgba(44, 62, 80, 0.2)'
              }}
              onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#34495e')}
              onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2C3E50')}
            >
              {loading ? (
                <>
                  <LoadingSpinner inline size="small" /> Saving...
                </>
              ) : 'Save Permissions'}
            </button>
          </div>
        </>
      )}

      {!selectedRole && roles.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>No roles available. Please create roles first in Role Management.</p>
        </div>
      )}
    </div>
  );
};

// Marketplace Management Section Component
const MarketplaceManagementSection = () => {
  const [marketplaces, setMarketplaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMarketplace, setEditingMarketplace] = useState(null);
  const [formData, setFormData] = useState({ marketplace: '', status: 'Active' });
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

  // Fetch all marketplaces
  const fetchMarketplaces = async () => {
    setLoading(true);
    try {
      const url = searchTerm
        ? `${API_URL}/api/marketplace/search?term=${encodeURIComponent(searchTerm)}`
        : `${API_URL}/api/marketplace`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setMarketplaces(data.marketplaces || []);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to fetch marketplaces' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please check if the backend server is running.' });
      console.error('Error fetching marketplaces:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load marketplaces on component mount and when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchMarketplaces();
    }, searchTerm ? 500 : 0); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Initial load
  useEffect(() => {
    fetchMarketplaces();
  }, []);

  // Handle form submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const url = editingMarketplace
        ? `${API_URL}/api/marketplace/${editingMarketplace.id}`
        : `${API_URL}/api/marketplace`;

      const method = editingMarketplace ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          marketplace: formData.marketplace,
          status: formData.status,
          query: editingMarketplace ? 2 : 1
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingMarketplace ? 'Marketplace updated successfully!' : 'Marketplace created successfully!' });
        setShowModal(false);
        setEditingMarketplace(null);
        setFormData({ marketplace: '', status: 'Active' });
        fetchMarketplaces();
      } else {
        setMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error saving marketplace:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this marketplace?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/marketplace/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Marketplace deleted successfully!' });
        fetchMarketplaces();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete marketplace' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error deleting marketplace:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for editing
  const handleEdit = (marketplace) => {
    setEditingMarketplace(marketplace);
    setFormData({ marketplace: marketplace.marketplace, status: marketplace.status || 'Active' });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Open modal for creating new marketplace
  const handleAdd = () => {
    setEditingMarketplace(null);
    setFormData({ marketplace: '', status: 'Active' });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMarketplace(null);
    setFormData({ marketplace: '', status: 'Active' });
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="settings-section">
      <h2 className="section-title">Marketplace Management</h2>
      <p className="section-description">Create, update, and manage marketplace entries.</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )
      }

      <div className="roles-actions">
        <button className="btn-primary" onClick={handleAdd} disabled={loading}>
          + Add New Marketplace
        </button>
        <input
          type="search"
          placeholder="Search marketplaces..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {
        loading && !marketplaces.length ? (
          <LoadingSpinner text="Loading marketplaces..." />
        ) : (
          <div className="roles-table">
            {marketplaces.length === 0 ? (
              <div className="empty-state">
                <p>No marketplaces found. Click "Add New Marketplace" to create one.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Marketplace Name</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {marketplaces.map((marketplace) => (
                    <tr key={marketplace.id}>
                      <td>{marketplace.id}</td>
                      <td>{marketplace.marketplace}</td>
                      <td>
                        <span className={`badge ${marketplace.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                          {marketplace.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Edit"
                          onClick={() => handleEdit(marketplace)}
                          disabled={loading}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          title="Delete"
                          onClick={() => handleDelete(marketplace.id)}
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      }

      {/* Modal for Add/Edit Marketplace */}
      {
        showModal && (
          <div className="modal-overlay">
            <div className="modal-content responsive-modal modal-sm" style={{ padding: '0' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #2C3E50 0%, #34495e 100%)', color: '#fff', borderBottom: 'none' }}>
                <h3 style={{ color: '#fff', fontWeight: '600' }}>{editingMarketplace ? 'Edit Marketplace' : 'Add New Marketplace'}</h3>
                <button
                  className="modal-close"
                  onClick={handleCloseModal}
                  style={{ color: '#fff', fontSize: '24px', fontWeight: '300' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '24px' }}>
                <form onSubmit={handleSubmit}>
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="marketplaceName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Marketplace Name <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="marketplaceName"
                      className="form-input"
                      value={formData.marketplace}
                      onChange={(e) => setFormData({ ...formData, marketplace: e.target.value })}
                      required
                      placeholder="Enter marketplace name (e.g., Amazon, eBay, Shopify)"
                      disabled={loading}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label htmlFor="marketplaceStatus" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Status <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <select
                      id="marketplaceStatus"
                      className="form-input"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      required
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23333\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        paddingRight: '40px'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                  <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleCloseModal}
                      disabled={loading}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        backgroundColor: '#fff',
                        color: '#333',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.3s'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: loading ? '#95a5a6' : '#2C3E50',
                        color: '#fff',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s',
                        boxShadow: loading ? 'none' : '0 2px 4px rgba(44, 62, 80, 0.2)'
                      }}
                      onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#34495e')}
                      onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2C3E50')}
                    >
                      {loading ? 'Saving...' : editingMarketplace ? 'Update Marketplace' : 'Create Marketplace'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

// Module Management Section Component
const ModuleManagementSection = () => {
  const [modules, setModules] = useState([]);
  const [subModules, setSubModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showSubModuleModal, setShowSubModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [editingSubModule, setEditingSubModule] = useState(null);
  const [moduleFormData, setModuleFormData] = useState({ moduleName: '', status: 'Active' });
  const [subModuleFormData, setSubModuleFormData] = useState({ subModuleName: '', moduleId: 0, status: 'Active' });
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

  // Fetch all modules
  const fetchModules = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/module`);
      const data = await response.json();

      if (data.success) {
        setModules(data.modules || []);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to fetch modules' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please check if the backend server is running.' });
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all submodules
  const fetchSubModules = async (moduleId = null) => {
    try {
      const url = moduleId
        ? `${API_URL}/api/submodule?moduleId=${moduleId}`
        : `${API_URL}/api/submodule`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setSubModules(data.subModules || []);
      }
    } catch (error) {
      console.error('Error fetching submodules:', error);
    }
  };

  // Load modules and submodules on component mount
  useEffect(() => {
    fetchModules();
    fetchSubModules();
  }, []);

  // Toggle module expansion
  const toggleModule = (moduleId) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  // Handle module form submit
  const handleModuleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const url = editingModule
        ? `${API_URL}/api/module/${editingModule.id}`
        : `${API_URL}/api/module`;

      const method = editingModule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          moduleName: moduleFormData.moduleName,
          status: moduleFormData.status,
          query: editingModule ? 2 : 1
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingModule ? 'Module updated successfully!' : 'Module created successfully!' });
        setShowModuleModal(false);
        setEditingModule(null);
        setModuleFormData({ moduleName: '', status: 'Active' });
        fetchModules();
      } else {
        setMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error saving module:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle submodule form submit
  const handleSubModuleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const url = editingSubModule
        ? `${API_URL}/api/submodule/${editingSubModule.id}`
        : `${API_URL}/api/submodule`;

      const method = editingSubModule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subModuleName: subModuleFormData.subModuleName,
          moduleId: subModuleFormData.moduleId,
          status: subModuleFormData.status,
          query: editingSubModule ? 2 : 1
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingSubModule ? 'SubModule updated successfully!' : 'SubModule created successfully!' });
        setShowSubModuleModal(false);
        setEditingSubModule(null);
        setSubModuleFormData({ subModuleName: '', moduleId: 0, status: 'Active' });
        fetchSubModules();
        fetchModules();
      } else {
        setMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error saving submodule:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete module
  const handleDeleteModule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this module? All submodules will also be deleted.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/module/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Module deleted successfully!' });
        fetchModules();
        fetchSubModules();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete module' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error deleting module:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete submodule
  const handleDeleteSubModule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this submodule?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/submodule/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'SubModule deleted successfully!' });
        fetchSubModules();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete submodule' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error deleting submodule:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get submodules for a specific module
  const getSubModulesForModule = (moduleId) => {
    return subModules.filter(sm => {
      // Handle both lowercase and uppercase property names from API
      const smModuleId = sm.ModuleId || sm.moduleId;
      return smModuleId === moduleId;
    });
  };

  return (
    <div className="settings-section">
      <h2 className="section-title">Module & SubModule Management</h2>
      <p className="section-description">Create and manage modules and their submodules.</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )
      }

      <div className="roles-actions">
        <button className="btn-primary" onClick={() => {
          setEditingModule(null);
          setModuleFormData({ moduleName: '', status: 'Active' });
          setShowModuleModal(true);
          setMessage({ type: '', text: '' });
        }} disabled={loading}>
          + Add New Module
        </button>
      </div>

      {
        loading && !modules.length ? (
          <LoadingSpinner text="Loading modules..." />
        ) : (
          <div className="modules-list">
            {modules.length === 0 ? (
              <div className="empty-state">
                <p>No modules found. Click "Add New Module" to create one.</p>
              </div>
            ) : (
              modules.map((module) => {
                // Handle both lowercase and uppercase property names from API
                const moduleId = module.Id || module.id;
                const moduleName = module.ModuleName || module.moduleName;
                const moduleStatus = module.Status || module.status;
                const moduleSubModules = getSubModulesForModule(moduleId);
                const isExpanded = expandedModules.has(moduleId);

                return (
                  <div key={moduleId} className="module-item">
                    <div className="module-header">
                      <button
                        className="module-toggle"
                        onClick={() => toggleModule(moduleId)}
                        disabled={loading}
                      >
                        <span className={isExpanded ? 'arrow-down' : 'arrow-right'}>▶</span>
                        <span className="module-name">{moduleName}</span>
                        <span className={`badge ${moduleStatus === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                          {moduleStatus}
                        </span>
                      </button>
                      <div className="module-actions">
                        <button
                          className="btn-icon"
                          title="Add SubModule"
                          onClick={() => {
                            setEditingSubModule(null);
                            setSubModuleFormData({ subModuleName: '', moduleId: moduleId, status: 'Active' });
                            setShowSubModuleModal(true);
                            setMessage({ type: '', text: '' });
                          }}
                          disabled={loading}
                        >
                          + SubModule
                        </button>
                        <button
                          className="btn-icon"
                          title="Edit Module"
                          onClick={() => {
                            setEditingModule(module);
                            setModuleFormData({
                              moduleName: moduleName,
                              status: moduleStatus || 'Active'
                            });
                            setShowModuleModal(true);
                            setMessage({ type: '', text: '' });
                          }}
                          disabled={loading}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          title="Delete Module"
                          onClick={() => handleDeleteModule(moduleId)}
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="submodules-list">
                        {moduleSubModules.length === 0 ? (
                          <div className="empty-submodules">No submodules for this module.</div>
                        ) : (
                          <table className="submodules-table">
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>SubModule Name</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {moduleSubModules.map((subModule) => {
                                // Handle both lowercase and uppercase property names from API
                                const subModuleId = subModule.Id || subModule.id;
                                const subModuleName = subModule.SubModuleName || subModule.subModuleName;
                                const subModuleStatus = subModule.Status || subModule.status;
                                const subModuleModuleId = subModule.ModuleId || subModule.moduleId;

                                return (
                                  <tr key={subModuleId}>
                                    <td>{subModuleId}</td>
                                    <td>{subModuleName}</td>
                                    <td>
                                      <span className={`badge ${subModuleStatus === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                                        {subModuleStatus}
                                      </span>
                                    </td>
                                    <td>
                                      <button
                                        className="btn-icon"
                                        title="Edit SubModule"
                                        onClick={() => {
                                          setEditingSubModule(subModule);
                                          setSubModuleFormData({
                                            subModuleName: subModuleName,
                                            moduleId: subModuleModuleId,
                                            status: subModuleStatus || 'Active'
                                          });
                                          setShowSubModuleModal(true);
                                          setMessage({ type: '', text: '' });
                                        }}
                                        disabled={loading}
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        className="btn-icon"
                                        title="Delete SubModule"
                                        onClick={() => handleDeleteSubModule(subModuleId)}
                                        disabled={loading}
                                      >
                                        🗑️
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )
      }

      {/* Module Modal */}
      {
        showModuleModal && (
          <div className="modal-overlay">
            <div className="modal-content responsive-modal modal-sm" style={{ padding: '0' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #2C3E50 0%, #34495e 100%)', color: '#fff', borderBottom: 'none' }}>
                <h3 style={{ color: '#fff', fontWeight: '600' }}>{editingModule ? 'Edit Module' : 'Add New Module'}</h3>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowModuleModal(false);
                    setEditingModule(null);
                    setModuleFormData({ moduleName: '', status: 'Active' });
                    setMessage({ type: '', text: '' });
                  }}
                  style={{ color: '#fff', fontSize: '24px', fontWeight: '300' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '24px' }}>
                <form onSubmit={handleModuleSubmit}>
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="moduleName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Module Name <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="moduleName"
                      className="form-input"
                      value={moduleFormData.moduleName}
                      onChange={(e) => setModuleFormData({ ...moduleFormData, moduleName: e.target.value })}
                      required
                      placeholder="Enter module name (e.g., Sales, Inventory, Reports)"
                      disabled={loading}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label htmlFor="moduleStatus" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Status <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <select
                      id="moduleStatus"
                      className="form-input"
                      value={moduleFormData.status}
                      onChange={(e) => setModuleFormData({ ...moduleFormData, status: e.target.value })}
                      required
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23333\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        paddingRight: '40px'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                  <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setShowModuleModal(false);
                        setEditingModule(null);
                        setModuleFormData({ moduleName: '', status: 'Active' });
                        setMessage({ type: '', text: '' });
                      }}
                      disabled={loading}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        backgroundColor: '#fff',
                        color: '#333',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.3s'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: loading ? '#95a5a6' : '#2C3E50',
                        color: '#fff',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s',
                        boxShadow: loading ? 'none' : '0 2px 4px rgba(44, 62, 80, 0.2)'
                      }}
                      onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#34495e')}
                      onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2C3E50')}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner inline size="small" /> Saving...
                        </>
                      ) : editingModule ? 'Update Module' : 'Create Module'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }

      {/* SubModule Modal */}
      {
        showSubModuleModal && (
          <div className="modal-overlay">
            <div className="modal-content responsive-modal modal-sm" style={{ padding: '0' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #2C3E50 0%, #34495e 100%)', color: '#fff', borderBottom: 'none' }}>
                <h3 style={{ color: '#fff', fontWeight: '600' }}>{editingSubModule ? 'Edit SubModule' : 'Add New SubModule'}</h3>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowSubModuleModal(false);
                    setEditingSubModule(null);
                    setSubModuleFormData({ subModuleName: '', moduleId: 0, status: 'Active' });
                    setMessage({ type: '', text: '' });
                  }}
                  style={{ color: '#fff', fontSize: '24px', fontWeight: '300' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '24px' }}>
                <form onSubmit={handleSubModuleSubmit}>
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="subModuleName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      SubModule Name <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="subModuleName"
                      className="form-input"
                      value={subModuleFormData.subModuleName}
                      onChange={(e) => setSubModuleFormData({ ...subModuleFormData, subModuleName: e.target.value })}
                      required
                      placeholder="Enter submodule name"
                      disabled={loading}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="subModuleModuleId" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Module <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <select
                      id="subModuleModuleId"
                      className="form-input"
                      value={subModuleFormData.moduleId}
                      onChange={(e) => setSubModuleFormData({ ...subModuleFormData, moduleId: parseInt(e.target.value) })}
                      required
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23333\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        paddingRight: '40px'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    >
                      <option value="0">Select a Module</option>
                      {modules.map((module) => (
                        <option key={module.id} value={module.id}>
                          {module.moduleName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label htmlFor="subModuleStatus" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Status <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <select
                      id="subModuleStatus"
                      className="form-input"
                      value={subModuleFormData.status}
                      onChange={(e) => setSubModuleFormData({ ...subModuleFormData, status: e.target.value })}
                      required
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23333\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        paddingRight: '40px'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                  <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setShowSubModuleModal(false);
                        setEditingSubModule(null);
                        setSubModuleFormData({ subModuleName: '', moduleId: 0, status: 'Active' });
                        setMessage({ type: '', text: '' });
                      }}
                      disabled={loading}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        backgroundColor: '#fff',
                        color: '#333',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.3s'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: loading ? '#95a5a6' : '#2C3E50',
                        color: '#fff',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s',
                        boxShadow: loading ? 'none' : '0 2px 4px rgba(44, 62, 80, 0.2)'
                      }}
                      onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#34495e')}
                      onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2C3E50')}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner inline size="small" /> Saving...
                        </>
                      ) : editingSubModule ? 'Update SubModule' : 'Create SubModule'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

// Searchable Select Component
const SearchableSelect = ({ options, value, onChange, placeholder = "Select an option", disabled = false, label = "", maxWidth = "300px" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef(null);

  const selectedOption = options.find(opt => opt.id === value || opt.value === value);

  const filteredOptions = options.filter(option => {
    const label = option.label || option.role || option.name || option.moduleName || String(option);
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option) => {
    const optionValue = option.id || option.value;
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="searchable-select-wrapper" style={{ maxWidth }}>
      {label && <label className="form-group label" style={{ marginBottom: '10px', display: 'block' }}>{label}</label>}
      <div className="searchable-select" ref={selectRef}>
        <button
          type="button"
          className={`searchable-select-trigger ${isOpen ? 'open' : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <span className="searchable-select-value">
            {selectedOption ? (selectedOption.label || selectedOption.role || selectedOption.name || selectedOption.moduleName) : placeholder}
          </span>
          <span className="searchable-select-arrow">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 5l4 4 4-4" />
            </svg>
          </span>
        </button>

        {isOpen && (
          <div className="searchable-select-dropdown">
            <div className="searchable-select-search">
              <input
                type="text"
                className="searchable-select-input"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <svg className="searchable-select-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="7" cy="7" r="4" />
                <path d="M10 10l3 3" />
              </svg>
            </div>
            <div className="searchable-select-options">
              {filteredOptions.length === 0 ? (
                <div className="searchable-select-no-results">No results found</div>
              ) : (
                filteredOptions.map((option) => {
                  const optionValue = option.id || option.value;
                  const optionLabel = option.label || option.role || option.name || option.moduleName || String(option);
                  const isSelected = value === optionValue;

                  return (
                    <div
                      key={optionValue}
                      className={`searchable-select-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelect(option)}
                    >
                      {optionLabel}
                      {isSelected && (
                        <svg className="searchable-select-check" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 8l3 3 7-7" />
                        </svg>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Multi-Select Searchable Select Component
const MultiSelectSearchable = ({ options, value = [], onChange, placeholder = "Select options", disabled = false, label = "", maxWidth = "100%" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef(null);

  const selectedValues = Array.isArray(value) ? value : [];
  const selectedOptions = options.filter(opt => {
    const optValue = opt.id || opt.value;
    return selectedValues.includes(optValue);
  });

  const filteredOptions = options.filter(option => {
    const optionLabel = option.label || option.role || option.name || option.moduleName || String(option);
    return optionLabel.toLowerCase().includes(searchTerm.toLowerCase());
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = (option) => {
    const optionValue = option.id || option.value;
    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter(v => v !== optionValue)
      : [...selectedValues, optionValue];
    onChange(newValues);
  };

  const handleRemove = (optionValue, e) => {
    e.stopPropagation();
    const newValues = selectedValues.filter(v => v !== optionValue);
    onChange(newValues);
  };

  const displayText = selectedOptions.length > 0
    ? `${selectedOptions.length} role${selectedOptions.length > 1 ? 's' : ''} selected`
    : placeholder;

  return (
    <div className="searchable-select-wrapper" style={{ maxWidth }}>
      {label && <label className="form-group label" style={{ marginBottom: '10px', display: 'block' }}>{label}</label>}
      <div className="searchable-select" ref={selectRef}>
        <button
          type="button"
          className={`searchable-select-trigger ${isOpen ? 'open' : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          style={{ minHeight: selectedOptions.length > 0 ? 'auto' : '44px', padding: selectedOptions.length > 0 ? '8px 40px 8px 12px' : '12px 40px 12px 16px' }}
        >
          <div className="searchable-select-value" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => {
                const optionValue = option.id || option.value;
                const optionLabel = option.label || option.role || option.name || option.moduleName;
                return (
                  <span
                    key={optionValue}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '4px 8px',
                      backgroundColor: '#2C3E50',
                      color: '#fff',
                      borderRadius: '16px',
                      fontSize: '12px',
                      gap: '4px',
                      fontWeight: '500'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {optionLabel}
                    <button
                      type="button"
                      onClick={(e) => handleRemove(optionValue, e)}
                      style={{
                        background: 'rgba(255,255,255,0.3)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        lineHeight: '1',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: '4px'
                      }}
                    >
                      ×
                    </button>
                  </span>
                );
              })
            ) : (
              <span style={{ color: '#999' }}>{placeholder}</span>
            )}
          </div>
          <span className="searchable-select-arrow">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 5l4 4 4-4" />
            </svg>
          </span>
        </button>

        {isOpen && (
          <div className="searchable-select-dropdown">
            <div className="searchable-select-search">
              <input
                type="text"
                className="searchable-select-input"
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <svg className="searchable-select-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="7" cy="7" r="4" />
                <path d="M10 10l3 3" />
              </svg>
            </div>
            <div className="searchable-select-options">
              {filteredOptions.length === 0 ? (
                <div className="searchable-select-no-results">No results found</div>
              ) : (
                filteredOptions.map((option) => {
                  const optionValue = option.id || option.value;
                  const optionLabel = option.label || option.role || option.name || option.moduleName || String(option);
                  const isSelected = selectedValues.includes(optionValue);

                  return (
                    <div
                      key={optionValue}
                      className={`searchable-select-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleToggle(option)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <span>{optionLabel}</span>
                      {isSelected && (
                        <svg className="searchable-select-check" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 8l3 3 7-7" />
                        </svg>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// VAT Management Section Component
const VATManagementSection = () => {
  const [vats, setVats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVAT, setEditingVAT] = useState(null);
  const [formData, setFormData] = useState({
    vatname: '',
    vatvalue: '',
    aliasname: '',
    description: '',
    isdelete: '0',
    status: 'Active'
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

  // Fetch all VATs
  const fetchVATs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/vat?isdelete=0&status=Active`);
      const data = await response.json();

      if (data.success) {
        setVats(data.vats || data.data || []);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to fetch VAT settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please check if the backend server is running.' });
      console.error('Error fetching VATs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load VATs on component mount and when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchTerm) {
        fetchVATs();
      }
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Initial load
  useEffect(() => {
    fetchVATs();
  }, []);

  // Handle form submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const query = editingVAT ? 2 : 1; // 1 = Insert, 2 = Update
      const url = editingVAT
        ? `${API_URL}/api/vat/${editingVAT.id}`
        : `${API_URL}/api/vat`;

      const method = editingVAT ? 'PUT' : 'POST';

      const requestBody = {
        vatname: formData.vatname,
        vatvalue: formData.vatvalue,
        aliasname: formData.aliasname || '',
        description: formData.description || '',
        isdelete: formData.isdelete || '0',
        status: formData.status || 'Active',
        query: query
      };

      if (editingVAT) {
        requestBody.id = editingVAT.id;
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingVAT ? 'VAT setting updated successfully!' : 'VAT setting created successfully!' });
        setShowModal(false);
        setEditingVAT(null);
        setFormData({
          vatname: '',
          vatvalue: '',
          aliasname: '',
          description: '',
          isdelete: '0',
          status: 'Active'
        });
        fetchVATs();
      } else {
        setMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error saving VAT:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this VAT setting?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/vat/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'VAT setting deleted successfully!' });
        fetchVATs();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete VAT setting' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error deleting VAT:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for editing
  const handleEdit = (vat) => {
    setEditingVAT(vat);
    setFormData({
      vatname: vat.vatname || vat.Vatname || '',
      vatvalue: vat.vatvalue || vat.Vatvalue || '',
      aliasname: vat.aliasname || vat.Aliasname || '',
      description: vat.description || vat.Description || '',
      isdelete: vat.isdelete || vat.Isdelete || '0',
      status: vat.status || vat.Status || 'Active'
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Open modal for creating new VAT
  const handleAdd = () => {
    setEditingVAT(null);
    setFormData({
      vatname: '',
      vatvalue: '',
      aliasname: '',
      description: '',
      isdelete: '0',
      status: 'Active'
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVAT(null);
    setFormData({
      vatname: '',
      vatvalue: '',
      aliasname: '',
      description: '',
      isdelete: '0',
      status: 'Active'
    });
    setMessage({ type: '', text: '' });
  };

  // Filter VATs based on search term
  const filteredVATs = searchTerm
    ? vats.filter(vat =>
      (vat.vatname || vat.Vatname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vat.vatvalue || vat.Vatvalue || '').includes(searchTerm) ||
      (vat.aliasname || vat.Aliasname || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    : vats;

  return (
    <div className="settings-section">
      <h2 className="section-title">VAT Settings Management</h2>
      <p className="section-description">Create, update, and manage VAT (Value Added Tax) settings with rates and descriptions.</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )
      }

      <div className="roles-actions">
        <button className="btn-primary" onClick={handleAdd} disabled={loading}>
          + Add New VAT Setting
        </button>
        <input
          type="search"
          placeholder="Search VAT settings..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {
        loading && !vats.length ? (
          <LoadingSpinner text="Loading VAT settings..." />
        ) : (
          <div className="roles-table">
            {filteredVATs.length === 0 ? (
              <div className="empty-state">
                <p>No VAT settings found. Click "Add New VAT Setting" to create one.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>VAT Name</th>
                    <th>VAT Value</th>
                    <th>Alias Name</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVATs.map((vat) => (
                    <tr key={vat.id || vat.Id}>
                      <td>{vat.id || vat.Id}</td>
                      <td>
                        <strong>{vat.vatname || vat.Vatname}</strong>
                      </td>
                      <td>
                        <code style={{
                          backgroundColor: '#f4f4f4',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontFamily: 'monospace'
                        }}>
                          {vat.vatvalue || vat.Vatvalue}%
                        </code>
                      </td>
                      <td>{vat.aliasname || vat.Aliasname || '-'}</td>
                      <td>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: (vat.status || vat.Status) === 'Active' ? '#d4edda' : '#f8d7da',
                            color: (vat.status || vat.Status) === 'Active' ? '#155724' : '#721c24'
                          }}
                        >
                          {vat.status || vat.Status || 'Active'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Edit"
                          onClick={() => handleEdit(vat)}
                          disabled={loading}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          title="Delete"
                          onClick={() => handleDelete(vat.id || vat.Id)}
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      }

      {/* Modal for Add/Edit VAT */}
      {
        showModal && (
          <div className="modal-overlay">
            <div className="modal-content responsive-modal modal-sm" style={{ padding: '0' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #2C3E50 0%, #34495e 100%)', color: '#fff', borderBottom: 'none' }}>
                <h3 style={{ color: '#fff', fontWeight: '600' }}>{editingVAT ? 'Edit VAT Setting' : 'Add New VAT Setting'}</h3>
                <button
                  className="modal-close"
                  onClick={handleCloseModal}
                  style={{ color: '#fff', fontSize: '24px', fontWeight: '300' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '20px' }}>
                <form onSubmit={handleSubmit}>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="vatName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      VAT Name <span style={{ color: '#e74c3c' }}>*</span>
                      <span style={{ fontSize: '12px', color: '#666', fontWeight: '400', marginLeft: '8px' }}>
                        (e.g., Standard VAT, Reduced VAT)
                      </span>
                    </label>
                    <input
                      type="text"
                      id="vatName"
                      className="form-input"
                      value={formData.vatname}
                      onChange={(e) => setFormData({ ...formData, vatname: e.target.value })}
                      required
                      placeholder="Enter VAT name (e.g., Standard VAT)"
                      disabled={loading}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="vatValue" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      VAT Value (%) <span style={{ color: '#e74c3c' }}>*</span>
                      <span style={{ fontSize: '12px', color: '#666', fontWeight: '400', marginLeft: '8px' }}>
                        (e.g., 18, 5, 12.5)
                      </span>
                    </label>
                    <input
                      type="text"
                      id="vatValue"
                      className="form-input"
                      value={formData.vatvalue}
                      onChange={(e) => setFormData({ ...formData, vatvalue: e.target.value })}
                      required
                      placeholder="Enter VAT percentage (e.g., 18)"
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box',
                        fontFamily: 'monospace'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="aliasName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Alias Name
                      <span style={{ fontSize: '12px', color: '#666', fontWeight: '400', marginLeft: '8px' }}>
                        (optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      id="aliasName"
                      className="form-input"
                      value={formData.aliasname}
                      onChange={(e) => setFormData({ ...formData, aliasname: e.target.value })}
                      placeholder="Enter alias name (optional)"
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="description" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Description
                      <span style={{ fontSize: '12px', color: '#666', fontWeight: '400', marginLeft: '8px' }}>
                        (optional)
                      </span>
                    </label>
                    <textarea
                      id="description"
                      className="form-input"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter description (optional)"
                      disabled={loading}
                      rows="3"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="vatStatus" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Status <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <select
                      id="vatStatus"
                      className="form-input"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      required
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box',
                        backgroundColor: '#fff',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleCloseModal}
                      disabled={loading}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        backgroundColor: '#fff',
                        color: '#333',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.3s'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: loading ? '#95a5a6' : '#2C3E50',
                        color: '#fff',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s',
                        boxShadow: loading ? 'none' : '0 2px 4px rgba(44, 62, 80, 0.2)'
                      }}
                      onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#34495e')}
                      onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2C3E50')}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner inline size="small" /> Saving...
                        </>
                      ) : editingVAT ? 'Update VAT Setting' : 'Create VAT Setting'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

// Stock Check Management Section Component
const StockCheckManagementSection = () => {
  const [stockChecks, setStockChecks] = useState([]);
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStockCheck, setEditingStockCheck] = useState(null);
  const [formData, setFormData] = useState({
    catelogid: '',
    status: 1,
    isdelete: 0
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

  // Fetch all catalogs for dropdown
  const fetchCatalogs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/catalog?query=3`);
      const data = await response.json();

      if (data.success) {
        setCatalogs(data.catalogs || data.data || []);
      }
    } catch (error) {
      console.error('Error fetching catalogs:', error);
    }
  };

  // Fetch all stock checks
  const fetchStockChecks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/stockcheck`);
      const data = await response.json();

      if (data.success) {
        setStockChecks(data.stockChecks || data.data || []);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to fetch stock checks' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please check if the backend server is running.' });
      console.error('Error fetching stock checks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchCatalogs();
    fetchStockChecks();
  }, []);

  // Handle form submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const query = editingStockCheck ? 2 : 1; // 1 = Insert, 2 = Update
      const url = editingStockCheck
        ? `${API_URL}/api/stockcheck/${editingStockCheck.id}`
        : `${API_URL}/api/stockcheck`;

      const method = editingStockCheck ? 'PUT' : 'POST';

      const requestBody = {
        catelogid: parseInt(formData.catelogid),
        status: parseInt(formData.status),
        isdelete: parseInt(formData.isdelete),
        query: query
      };

      if (editingStockCheck) {
        requestBody.id = editingStockCheck.id;
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingStockCheck ? 'Stock check updated successfully!' : 'Stock check created successfully!' });
        setShowModal(false);
        setEditingStockCheck(null);
        setFormData({
          catelogid: '',
          status: 1,
          isdelete: 0
        });
        fetchStockChecks();
      } else {
        setMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error saving stock check:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this stock check?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/stockcheck/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Stock check deleted successfully!' });
        fetchStockChecks();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete stock check' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error deleting stock check:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for editing
  const handleEdit = (stockCheck) => {
    setEditingStockCheck(stockCheck);
    setFormData({
      catelogid: stockCheck.catelogid || stockCheck.Catelogid || '',
      status: stockCheck.status || stockCheck.Status || 1,
      isdelete: stockCheck.isdelete || stockCheck.Isdelete || 0
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Open modal for creating new stock check
  const handleAdd = () => {
    setEditingStockCheck(null);
    setFormData({
      catelogid: '',
      status: 1,
      isdelete: 0
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStockCheck(null);
    setFormData({
      catelogid: '',
      status: 1,
      isdelete: 0
    });
    setMessage({ type: '', text: '' });
  };

  // Filter stock checks based on search term
  const filteredStockChecks = searchTerm
    ? stockChecks.filter(sc => {
      const catalog = catalogs.find(c => c.id === (sc.catelogid || sc.Catelogid));
      const catalogName = catalog?.catelogname || catalog?.Catelogname || '';
      return catalogName.toLowerCase().includes(searchTerm.toLowerCase());
    })
    : stockChecks;

  // Get catalog name by ID
  const getCatalogName = (catelogid) => {
    const catalog = catalogs.find(c => c.id === catelogid);
    return catalog?.catelogname || catalog?.Catelogname || `ID: ${catelogid} `;
  };

  return (
    <div className="settings-section">
      <h2 className="section-title">Stock Check Management</h2>
      <p className="section-description">Manage stock check settings for catalogs.</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )
      }

      <div className="roles-actions">
        <button className="btn-primary" onClick={handleAdd} disabled={loading}>
          + Add New Stock Check
        </button>
        <input
          type="search"
          placeholder="Search by catalog name..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {
        loading && !stockChecks.length ? (
          <LoadingSpinner text="Loading stock checks..." />
        ) : (
          <div className="roles-table">
            {filteredStockChecks.length === 0 ? (
              <div className="empty-state">
                <p>No stock checks found. Click "Add New Stock Check" to create one.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Catalog</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStockChecks.map((sc) => (
                    <tr key={sc.id || sc.Id}>
                      <td>{sc.id || sc.Id}</td>
                      <td>
                        <strong>{getCatalogName(sc.catelogid || sc.Catelogid)}</strong>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: (sc.status || sc.Status) === 1 ? '#d4edda' : '#f8d7da',
                            color: (sc.status || sc.Status) === 1 ? '#155724' : '#721c24'
                          }}
                        >
                          {(sc.status || sc.Status) === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Edit"
                          onClick={() => handleEdit(sc)}
                          disabled={loading}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          title="Delete"
                          onClick={() => handleDelete(sc.id || sc.Id)}
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      }

      {/* Modal for Add/Edit Stock Check */}
      {
        showModal && (
          <div className="modal-overlay">
            <div className="modal-content responsive-modal modal-sm" style={{ padding: '0' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #2C3E50 0%, #34495e 100%)', color: '#fff', borderBottom: 'none' }}>
                <h3 style={{ color: '#fff', fontWeight: '600' }}>{editingStockCheck ? 'Edit Stock Check' : 'Add New Stock Check'}</h3>
                <button
                  className="modal-close"
                  onClick={handleCloseModal}
                  style={{ color: '#fff', fontSize: '24px', fontWeight: '300' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '20px' }}>
                <form onSubmit={handleSubmit}>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="catalogId" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Catalog <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <select
                      id="catalogId"
                      value={formData.catelogid}
                      onChange={(e) => setFormData({ ...formData, catelogid: e.target.value })}
                      required
                      className="form-input"
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    >
                      <option value="">Select Catalog</option>
                      {catalogs.map((catalog) => (
                        <option key={catalog.id || catalog.Id} value={catalog.id || catalog.Id}>
                          {catalog.catelogname || catalog.Catelogname}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="status" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Status <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                      required
                      className="form-input"
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="isdelete" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Is Delete
                    </label>
                    <select
                      id="isdelete"
                      value={formData.isdelete}
                      onChange={(e) => setFormData({ ...formData, isdelete: parseInt(e.target.value) })}
                      className="form-input"
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    >
                      <option value={0}>No</option>
                      <option value={1}>Yes</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      disabled={loading}
                      style={{
                        padding: '10px 24px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '6px',
                        backgroundColor: '#fff',
                        color: '#666',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.target.style.borderColor = '#999';
                          e.target.style.color = '#333';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#e0e0e0';
                        e.target.style.color = '#666';
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: loading ? '#95a5a6' : '#2C3E50',
                        color: '#fff',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s',
                        boxShadow: loading ? 'none' : '0 2px 4px rgba(44, 62, 80, 0.2)'
                      }}
                      onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#34495e')}
                      onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2C3E50')}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner inline size="small" /> Saving...
                        </>
                      ) : editingStockCheck ? 'Update Stock Check' : 'Create Stock Check'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

// Bank Account Management Section Component
const BankAccountManagementSection = () => {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBankAccount, setEditingBankAccount] = useState(null);
  const [formData, setFormData] = useState({
    accountname: '',
    account_number: '',
    iban: '',
    bankname: '',
    swift_code: '',
    ca_id: '',
    isdelete: '0'
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

  // Fetch all bank accounts
  const fetchBankAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/bankaccount?isdelete=0`);
      const data = await response.json();

      if (data.success) {
        setBankAccounts(data.bankAccounts || data.data || []);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to fetch bank accounts' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please check if the backend server is running.' });
      console.error('Error fetching bank accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load bank accounts on component mount and when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchTerm) {
        fetchBankAccounts();
      }
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Initial load
  useEffect(() => {
    fetchBankAccounts();
  }, []);

  // Handle form submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const query = editingBankAccount ? 2 : 1; // 1 = Insert, 2 = Update
      const url = editingBankAccount
        ? `${API_URL}/api/bankaccount/${editingBankAccount.id}`
        : `${API_URL}/api/bankaccount`;

      const method = editingBankAccount ? 'PUT' : 'POST';

      const requestBody = {
        accountname: formData.accountname,
        account_number: formData.account_number || '',
        iban: formData.iban || '',
        bankname: formData.bankname || '',
        swift_code: formData.swift_code || '',
        ca_id: formData.ca_id || '',
        isdelete: formData.isdelete || '0',
        query: query
      };

      if (editingBankAccount) {
        requestBody.id = editingBankAccount.id;
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingBankAccount ? 'Bank account updated successfully!' : 'Bank account created successfully!' });
        setShowModal(false);
        setEditingBankAccount(null);
        setFormData({
          accountname: '',
          account_number: '',
          iban: '',
          bankname: '',
          swift_code: '',
          ca_id: '',
          isdelete: '0'
        });
        fetchBankAccounts();
      } else {
        setMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error saving bank account:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bank account?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/bankaccount/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Bank account deleted successfully!' });
        fetchBankAccounts();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete bank account' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error deleting bank account:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for editing
  const handleEdit = (bankAccount) => {
    setEditingBankAccount(bankAccount);
    setFormData({
      accountname: bankAccount.accountname || bankAccount.Accountname || '',
      account_number: bankAccount.account_number || bankAccount.Account_number || '',
      iban: bankAccount.iban || bankAccount.IBAN || '',
      bankname: bankAccount.bankname || bankAccount.Bankname || '',
      swift_code: bankAccount.swift_code || bankAccount.Swift_code || '',
      ca_id: bankAccount.ca_id || bankAccount.Ca_id || '',
      isdelete: bankAccount.isdelete || bankAccount.Isdelete || '0'
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Open modal for creating new bank account
  const handleAdd = () => {
    setEditingBankAccount(null);
    setFormData({
      accountname: '',
      account_number: '',
      iban: '',
      bankname: '',
      swift_code: '',
      ca_id: '',
      isdelete: '0'
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBankAccount(null);
    setFormData({
      accountname: '',
      account_number: '',
      iban: '',
      bankname: '',
      swift_code: '',
      ca_id: '',
      isdelete: '0'
    });
    setMessage({ type: '', text: '' });
  };

  // Filter bank accounts based on search term
  const filteredBankAccounts = searchTerm
    ? bankAccounts.filter(ba =>
      (ba.accountname || ba.Accountname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ba.account_number || ba.Account_number || '').includes(searchTerm) ||
      (ba.bankname || ba.Bankname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ba.iban || ba.IBAN || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    : bankAccounts;

  return (
    <div className="settings-section">
      <h2 className="section-title">Bank Account Management</h2>
      <p className="section-description">Create, update, and manage bank account information.</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )
      }

      <div className="roles-actions">
        <button className="btn-primary" onClick={handleAdd} disabled={loading}>
          + Add New Bank Account
        </button>
        <input
          type="search"
          placeholder="Search bank accounts..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {
        loading && !bankAccounts.length ? (
          <LoadingSpinner text="Loading bank accounts..." />
        ) : (
          <div className="roles-table">
            {filteredBankAccounts.length === 0 ? (
              <div className="empty-state">
                <p>No bank accounts found. Click "Add New Bank Account" to create one.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Account Name</th>
                    <th>Account Number</th>
                    <th>Bank Name</th>
                    <th>IBAN</th>
                    <th>SWIFT Code</th>
                    <th>CA ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBankAccounts.map((ba) => (
                    <tr key={ba.id || ba.Id}>
                      <td>{ba.id || ba.Id}</td>
                      <td>
                        <strong>{ba.accountname || ba.Accountname}</strong>
                      </td>
                      <td>{ba.account_number || ba.Account_number || '-'}</td>
                      <td>{ba.bankname || ba.Bankname || '-'}</td>
                      <td>{ba.iban || ba.IBAN || '-'}</td>
                      <td>{ba.swift_code || ba.Swift_code || '-'}</td>
                      <td>{ba.ca_id || ba.Ca_id || '-'}</td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Edit"
                          onClick={() => handleEdit(ba)}
                          disabled={loading}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          title="Delete"
                          onClick={() => handleDelete(ba.id || ba.Id)}
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      }

      {/* Modal for Add/Edit Bank Account */}
      {
        showModal && (
          <div className="modal-overlay">
            <div className="modal-content responsive-modal modal-sm" style={{ padding: '0' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #2C3E50 0%, #34495e 100%)', color: '#fff', borderBottom: 'none' }}>
                <h3 style={{ color: '#fff', fontWeight: '600' }}>{editingBankAccount ? 'Edit Bank Account' : 'Add New Bank Account'}</h3>
                <button
                  className="modal-close"
                  onClick={handleCloseModal}
                  style={{ color: '#fff', fontSize: '24px', fontWeight: '300' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '20px' }}>
                <form onSubmit={handleSubmit}>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="accountName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Account Name <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="accountName"
                      className="form-input"
                      value={formData.accountname}
                      onChange={(e) => setFormData({ ...formData, accountname: e.target.value })}
                      required
                      disabled={loading}
                      placeholder="Enter account name"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="accountNumber" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Account Number
                    </label>
                    <input
                      type="text"
                      id="accountNumber"
                      className="form-input"
                      value={formData.account_number}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                      disabled={loading}
                      placeholder="Enter account number"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="iban" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      IBAN
                    </label>
                    <input
                      type="text"
                      id="iban"
                      className="form-input"
                      value={formData.iban}
                      onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                      disabled={loading}
                      placeholder="Enter IBAN"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="bankName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Bank Name
                    </label>
                    <input
                      type="text"
                      id="bankName"
                      className="form-input"
                      value={formData.bankname}
                      onChange={(e) => setFormData({ ...formData, bankname: e.target.value })}
                      disabled={loading}
                      placeholder="Enter bank name"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="swiftCode" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      SWIFT Code
                    </label>
                    <input
                      type="text"
                      id="swiftCode"
                      className="form-input"
                      value={formData.swift_code}
                      onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
                      disabled={loading}
                      placeholder="Enter SWIFT code"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="caId" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      CA ID
                    </label>
                    <input
                      type="text"
                      id="caId"
                      className="form-input"
                      value={formData.ca_id}
                      onChange={(e) => setFormData({ ...formData, ca_id: e.target.value })}
                      disabled={loading}
                      placeholder="Enter CA ID"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      disabled={loading}
                      style={{
                        padding: '10px 24px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '6px',
                        backgroundColor: '#fff',
                        color: '#666',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.target.style.borderColor = '#999';
                          e.target.style.color = '#333';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#e0e0e0';
                        e.target.style.color = '#666';
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: loading ? '#95a5a6' : '#2C3E50',
                        color: '#fff',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s',
                        boxShadow: loading ? 'none' : '0 2px 4px rgba(44, 62, 80, 0.2)'
                      }}
                      onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#34495e')}
                      onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2C3E50')}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner inline size="small" /> Saving...
                        </>
                      ) : editingBankAccount ? 'Update Bank Account' : 'Create Bank Account'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

// Report Permission Section Component (Newly Added)
const ReportPermissionSection = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [reportPermissions, setReportPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

  const reportData = [
    { category: 'Sales', reports: ['Sales Summary', 'Sales Summary Details', 'Revenue Report', 'New & Old Invoice Summary', 'Brand Report', 'Customer Report', 'Category Report', 'Cost of goods Report', 'Customer Balance Report'] },
    { category: 'Purchase', reports: ['Purchase Summary', 'Supplier Report', 'Purchase Returns'] },
    { category: 'Stock', reports: ['Warehouse Stock', 'Sales Stock', 'Inventory'] },
    { category: 'Stock Transfer', reports: ['Stock Transfer Report'] },
    { category: 'Product', reports: ['Product Report'] }
  ];

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_URL}/api/role`);
      const data = await response.json();
      if (data.success) {
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchReportPermissions = async (roleId) => {
    if (!roleId) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/report-permission/${roleId}`);
      const data = await response.json();
      if (data.success) {
        setReportPermissions(data.data || []);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to fetch permissions' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      fetchReportPermissions(selectedRole);
    } else {
      setReportPermissions([]);
    }
  }, [selectedRole]);

  const handlePermissionChange = async (category, reportName, checked) => {
    if (!selectedRole) return;

    // Optimistic UI update
    const updatedPermissions = [...reportPermissions];
    const existingIdx = updatedPermissions.findIndex(p => p.category === category && p.reportName === reportName);
    if (existingIdx > -1) {
      updatedPermissions[existingIdx].permission = checked;
    } else {
      updatedPermissions.push({ roleId: selectedRole, category, reportName, permission: checked });
    }
    setReportPermissions(updatedPermissions);

    try {
      const response = await fetch(`${API_URL}/api/report-permission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: selectedRole,
          permissions: [{ category, reportName, permission: checked }]
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Permission for ${reportName} updated!` });
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error.' });
    }
  };

  const hasAccess = (category, reportName) => {
    const perm = reportPermissions.find(p => p.category === category && p.reportName === reportName);
    return perm ? (perm.permission === true || perm.permission === 1) : false;
  };

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{
        mb: 4,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" sx={{
            fontWeight: 800,
            color: '#0f172a',
            mb: 1,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
          }}>
            Report <span style={{ color: '#3b82f6' }}>Permissions</span>
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Configure which roles can view specific reports in the Business Analytics section.
          </Typography>
        </Box>
      </Box>

      {message.text && (
        <Alert
          severity={message.type}
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', border: '1px solid #e2e8f0' }}>
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8} lg={6}>
              <FormControl fullWidth>
                <InputLabel id="role-select-label">Select Role to Configure Permissions</InputLabel>
                <Select
                  labelId="role-select-label"
                  value={selectedRole || ''}
                  label="Select Role to Configure Permissions"
                  onChange={(e) => setSelectedRole(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    bgcolor: '#f8fafc',
                    '& .MuiSelect-select': { py: 1.5 }
                  }}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id || role.Id} value={role.id || role.Id}>
                      {role.role || role.Role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {loading && (
              <Grid item>
                <CircularProgress size={24} />
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {selectedRole ? (
        <TableContainer component={Paper} elevation={0} sx={{
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          overflowX: 'auto',
          bgcolor: '#fff'
        }}>
          <Table sx={{ minWidth: { xs: 600, sm: '100%' } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 800, color: '#1e293b', width: { xs: '120px', sm: '25%' } }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#1e293b', width: { xs: '200px', sm: '45%' } }}>Report Name</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#1e293b' }} align="center">View Access</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.map((catGroup) => (
                catGroup.reports.map((report, idx) => (
                  <TableRow key={`${catGroup.category}-${report}`} hover sx={{ '&:hover': { bgcolor: '#f1f5f9' } }}>
                    {idx === 0 && (
                      <TableCell
                        rowSpan={catGroup.reports.length}
                        sx={{
                          fontWeight: 700,
                          color: '#3b82f6',
                          verticalAlign: 'top',
                          pt: 2.5,
                          borderRight: '1px solid #f1f5f9',
                          bgcolor: '#f8fafc'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CategoryIcon sx={{ fontSize: 18 }} />
                          {catGroup.category}
                        </Box>
                      </TableCell>
                    )}
                    <TableCell sx={{ fontWeight: 500, color: '#334155' }}>{report}</TableCell>
                    <TableCell align="center">
                      <Switch
                        checked={hasAccess(catGroup.category, report)}
                        onChange={(e) => handlePermissionChange(catGroup.category, report, e.target.checked)}
                        color="primary"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#3b82f6' }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ py: 10, textAlign: 'center', bgcolor: '#fff', borderRadius: 3, border: '1px dashed #cbd5e1' }}>
          <BarChartIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#64748b' }}>Please select a role to configure report permissions</Typography>
        </Box>
      )}
    </Box>
  );
};

// Permission Management Section Component
const PermissionManagementSection = () => {
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [subModules, setSubModules] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [expandedModules, setExpandedModules] = useState({});
  const [selectedModule, setSelectedModule] = useState(null);
  const [draftKeys, setDraftKeys] = useState(new Set());
  const [dirty, setDirty] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
  const permissionTypes = ['Full Access', 'View', 'Create', 'Edit', 'Delete', 'Approve', 'All Record'];

  const makeKey = (roleId, moduleId, subModuleId, permissionType) => {
    const sm = subModuleId === null || subModuleId === undefined ? 'null' : String(subModuleId);
    return `${roleId}|${moduleId}|${sm}|${permissionType}`;
  };

  // Fetch roles, modules, submodules
  const fetchData = async () => {
    setIsFetching(true);
    setMessage({ type: '', text: '' });
    try {
      console.log('Fetching initial data...');
      const [rolesRes, modulesRes, subModulesRes] = await Promise.all([
        fetch(`${API_URL}/api/role`),
        fetch(`${API_URL}/api/module`),
        fetch(`${API_URL}/api/submodule`)
      ]);

      const rolesData = await rolesRes.json();
      const modulesData = await modulesRes.json();
      const subModulesData = await subModulesRes.json();

      console.log('API Responses:', { rolesData, modulesData, subModulesData });

      if (rolesData.success) {
        const rolesList = rolesData.roles || [];
        setRoles(rolesList);
        console.log('Roles loaded:', rolesList.length, rolesList);
      } else {
        console.error('Failed to load roles:', rolesData.message);
      }

      if (modulesData.success) {
        const modulesList = modulesData.modules || [];
        setModules(modulesList);
        console.log('Modules loaded:', modulesList.length, modulesList);
        if (modulesList.length === 0) {
          setMessage({ type: 'info', text: 'No modules found. Please create modules first.' });
        }
      } else {
        console.error('Failed to load modules:', modulesData.message);
        setMessage({ type: 'error', text: modulesData.message || 'Failed to load modules.' });
      }

      if (subModulesData.success) {
        const subModulesList = subModulesData.subModules || [];
        setSubModules(subModulesList);
        console.log('SubModules loaded:', subModulesList.length);
      } else {
        console.error('Failed to load submodules:', subModulesData.message);
      }

    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load initial data. Please check your connection.' });
      console.error('Error fetching initial data:', error);
    } finally {
      setIsFetching(false);
    }
  };

  // Fetch permissions for selected role
  const fetchPermissions = async (roleId) => {
    if (!roleId) {
      setPermissions([]);
      setDraftKeys(new Set());
      setDirty(false);
      return;
    }
    setIsFetching(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await fetch(`${API_URL}/api/permission/role/${roleId}`);
      const data = await response.json();
      console.log('🔄 Permissions API Response:', data);
      console.log('🔄 Role ID requested:', roleId);
      if (data.success) {
        // Ensure permissions is always an array, even if null/undefined
        const permissionsList = data.permissions || [];
        console.log('📥 Setting permissions:', permissionsList.length, 'permissions');
        console.log('📥 Permissions details:', permissionsList.map(p => ({
          id: p.Id || p.id,
          roleId: p.RoleId || p.roleId,
          moduleId: p.ModuleId || p.moduleId,
          subModuleId: p.SubModuleId || p.subModuleId,
          permissionType: p.PermissionType || p.permissionType
        })));
        setPermissions(permissionsList);

        // Initialize draft keys from DB permissions (so checkboxes are clickable immediately)
        const nextDraft = new Set();
        console.log('Initializing draftKeys from permissions:', permissionsList.length, 'permissions');

        for (const p of permissionsList) {
          // Handle both camelCase and PascalCase property names
          const rId = p.RoleId ?? p.roleId ?? roleId;
          const mId = p.ModuleId ?? p.moduleId;
          // Handle SubModuleId: convert undefined/null/0 to null for consistency
          let smId = p.SubModuleId ?? p.subModuleId;
          if (smId === undefined || smId === null || smId === 0) {
            smId = null;
          }
          const pt = (p.PermissionType ?? p.permissionType)?.trim(); // Trim whitespace

          if (mId != null && pt && pt.length > 0) {
            const key = makeKey(rId, mId, smId, pt);
            nextDraft.add(key);
            console.log('✓ Added permission to draftKeys:', {
              roleId: rId,
              moduleId: mId,
              subModuleId: smId,
              permissionType: pt,
              key,
              rawPermission: p,
              hasModuleId: !!mId,
              hasPermissionType: !!pt
            });
          } else {
            console.warn('⚠ Skipped invalid permission:', {
              raw: p,
              roleId: rId,
              moduleId: mId,
              subModuleId: smId,
              permissionType: pt,
              reason: !mId ? 'Missing ModuleId' : !pt ? 'Missing PermissionType' : 'Unknown'
            });
          }
        }

        console.log('✅ Total draftKeys initialized:', nextDraft.size);
        console.log('📋 All draftKeys:', Array.from(nextDraft));

        // Force React to recognize the state change by creating a new Set
        setDraftKeys(new Set(nextDraft));
        setDirty(false);

        // Clear any debug flags when permissions reload
        if (typeof window !== 'undefined') {
          Object.keys(window).forEach(key => {
            if (key.startsWith('debug_')) {
              delete window[key];
            }
          });
        }

        if (permissionsList.length === 0) {
          setMessage({ type: 'info', text: 'No permissions found for this role. You can add permissions by checking the boxes below.' });
        }
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to fetch permissions.' });
        setPermissions([]);
        setDraftKeys(new Set());
        setDirty(false);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Failed to fetch permissions.' });
      console.error('Error fetching permissions:', error);
      setPermissions([]);
      setDraftKeys(new Set());
      setDirty(false);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedRoleId) {
      const roleIdNum = parseInt(selectedRoleId);
      if (!isNaN(roleIdNum)) {
        console.log('🔄 Fetching permissions for role:', roleIdNum);
        fetchPermissions(roleIdNum);
      } else {
        setMessage({ type: 'error', text: 'Invalid role ID selected.' });
        setPermissions([]);
        setDraftKeys(new Set());
      }
    } else {
      setPermissions([]);
      setDraftKeys(new Set());
    }
  }, [selectedRoleId]);

  // Debug: Log when draftKeys changes
  useEffect(() => {
    console.log('📊 draftKeys updated. Size:', draftKeys.size, 'Keys:', Array.from(draftKeys).slice(0, 10));
  }, [draftKeys]);

  // Handle checkbox change for permissions
  const handleCheckboxChange = (moduleId, subModuleId, permissionType, isChecked) => {
    if (!selectedRoleId) {
      setMessage({ type: 'error', text: 'Please select a role first' });
      return;
    }

    setMessage({ type: '', text: '' });
    const roleIdNum = parseInt(selectedRoleId);
    const sm = (subModuleId === undefined || subModuleId === null || subModuleId === 0) ? null : subModuleId;
    const normalizedPermissionType = permissionType?.trim() || permissionType;

    console.log('Checkbox changed:', { moduleId, subModuleId, permissionType, isChecked });

    setDraftKeys(prev => {
      const next = new Set(prev);

      // If "Full Access" is being checked/unchecked, handle all other permissions
      if (normalizedPermissionType === 'Full Access') {
        if (isChecked) {
          // Check "Full Access" and all other permission types
          const fullAccessKey = makeKey(roleIdNum, moduleId, sm, 'Full Access');
          next.add(fullAccessKey);

          // Automatically check all other permission types
          const otherPermissionTypes = permissionTypes.filter(pt => pt !== 'Full Access');
          otherPermissionTypes.forEach(pt => {
            const key = makeKey(roleIdNum, moduleId, sm, pt);
            next.add(key);
          });
          console.log('✅ Full Access checked - all permissions enabled for module:', moduleId, 'submodule:', sm);
        } else {
          // Uncheck "Full Access" and all other permission types
          const fullAccessKey = makeKey(roleIdNum, moduleId, sm, 'Full Access');
          next.delete(fullAccessKey);

          // Automatically uncheck all other permission types
          const otherPermissionTypes = permissionTypes.filter(pt => pt !== 'Full Access');
          otherPermissionTypes.forEach(pt => {
            const key = makeKey(roleIdNum, moduleId, sm, pt);
            next.delete(key);
          });
          console.log('❌ Full Access unchecked - all permissions disabled for module:', moduleId, 'submodule:', sm);
        }
      } else {
        // For other permission types, just toggle the specific one
        const k = makeKey(roleIdNum, moduleId, sm, normalizedPermissionType);
        if (isChecked) {
          next.add(k);
        } else {
          next.delete(k);

          // If any permission is unchecked, also uncheck "Full Access"
          const fullAccessKey = makeKey(roleIdNum, moduleId, sm, 'Full Access');
          next.delete(fullAccessKey);
        }

        // Check if all other permissions are checked, then auto-check "Full Access"
        const otherPermissionTypes = permissionTypes.filter(pt => pt !== 'Full Access');
        const allOthersChecked = otherPermissionTypes.every(pt => {
          const key = makeKey(roleIdNum, moduleId, sm, pt);
          return next.has(key);
        });

        if (allOthersChecked && isChecked) {
          // All other permissions are checked, so check "Full Access" too
          const fullAccessKey = makeKey(roleIdNum, moduleId, sm, 'Full Access');
          next.add(fullAccessKey);
          console.log('✅ All permissions checked - Full Access auto-enabled for module:', moduleId, 'submodule:', sm);
        }
      }

      console.log('Updated draftKeys:', Array.from(next));
      return next;
    });
    setDirty(true);
    console.log('Set dirty to true');
  };

  const saveAllChanges = async () => {
    if (!selectedRoleId) {
      setMessage({ type: 'error', text: 'Please select a role first' });
      return;
    }

    const roleIdNum = parseInt(selectedRoleId);
    if (isNaN(roleIdNum)) {
      setMessage({ type: 'error', text: 'Invalid role selected' });
      return;
    }

    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Keys that exist in DB now
      const currentDbKeys = new Set();
      for (const p of permissions || []) {
        const smId = p.SubModuleId ?? null;
        const pt = p.PermissionType?.trim(); // Trim to match loading logic
        if (p.ModuleId != null && pt && pt.length > 0) {
          currentDbKeys.add(makeKey(roleIdNum, p.ModuleId, smId, pt));
        }
      }

      // Compute creates & deletes
      const toCreate = [];
      const toDelete = [];

      for (const k of draftKeys) {
        if (!currentDbKeys.has(k)) toCreate.push(k);
      }
      for (const k of currentDbKeys) {
        if (!draftKeys.has(k)) toDelete.push(k);
      }

      // Build lookup from key -> permission record (for deleting by Id)
      const keyToPermission = new Map();
      for (const p of permissions || []) {
        const smId = p.SubModuleId ?? null;
        const pt = p.PermissionType?.trim(); // Trim to match loading logic
        if (p.ModuleId != null && pt && pt.length > 0) {
          keyToPermission.set(makeKey(roleIdNum, p.ModuleId, smId, pt), p);
        }
      }

      // Execute deletes first
      for (const k of toDelete) {
        const existing = keyToPermission.get(k);
        if (!existing?.Id) continue;
        const resp = await fetch(`${API_URL}/api/permission/${existing.Id}`, { method: 'DELETE' });
        const data = await resp.json();
        if (!data.success) throw new Error(data.message || 'Failed to delete permission');
      }

      // Execute creates
      for (const k of toCreate) {
        const [_, moduleIdStr, subModuleIdStr, permissionType] = k.split('|');
        const moduleId = parseInt(moduleIdStr);
        const subModuleId = subModuleIdStr === 'null' ? null : parseInt(subModuleIdStr);
        const normalizedPermissionType = permissionType?.trim() || permissionType;

        const resp = await fetch(`${API_URL}/api/permission`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roleId: roleIdNum,
            moduleId,
            subModuleId: subModuleId ?? null,
            permissionType: normalizedPermissionType,
            status: 'Active',
            query: 1
          })
        });
        const data = await resp.json();
        if (!data.success) throw new Error(data.message || 'Failed to create permission');
      }

      setMessage({ type: 'success', text: 'Permissions saved successfully.' });
      setDirty(false);
      await fetchPermissions(roleIdNum);
    } catch (e) {
      console.error('Error saving permissions:', e);
      const errorMsg = e?.message || e?.toString() || 'Failed to save permissions. Please try again.';
      setMessage({ type: 'error', text: errorMsg });
      // Don't reset dirty on error so user can retry
    } finally {
      setIsSaving(false);
    }
  };

  // Check if a permission is enabled
  const isPermissionChecked = (moduleId, subModuleId, permissionType) => {
    if (!selectedRoleId) {
      return false;
    }
    const roleIdNum = parseInt(selectedRoleId);
    if (isNaN(roleIdNum)) {
      return false;
    }

    // Normalize subModuleId: convert undefined/null/0 to null
    const sm = (subModuleId === null || subModuleId === undefined || subModuleId === 0) ? null : subModuleId;
    // Normalize permissionType: trim whitespace
    const normalizedPermissionType = permissionType?.trim() || permissionType;
    const key = makeKey(roleIdNum, moduleId, sm, normalizedPermissionType);
    const isChecked = draftKeys.has(key);

    // Enhanced debug logging - log checks for debugging
    if (draftKeys.size > 0) {
      const debugKey = `debug_check_${roleIdNum}_${moduleId}_${sm}_${normalizedPermissionType} `;
      if (typeof window !== 'undefined' && !window[debugKey]) {
        window[debugKey] = true;
        const matchingKeys = Array.from(draftKeys).filter(k => {
          const parts = k.split('|');
          return parts.length === 4 && parts[1] === String(moduleId);
        });
        console.log(isChecked ? '✅ Permission CHECKED:' : '❌ Permission NOT FOUND:', {
          roleId: roleIdNum,
          moduleId,
          subModuleId: sm,
          permissionType: normalizedPermissionType,
          key,
          isChecked,
          draftKeysSize: draftKeys.size,
          matchingKeysForModule: matchingKeys.slice(0, 5),
          allKeysSample: Array.from(draftKeys).slice(0, 10)
        });
      }
    }

    return isChecked;
  };

  const getPermissionForEntity = (moduleId, subModuleId = null) => {
    if (!permissions || permissions.length === 0) return null;
    return permissions.find(p =>
      p.RoleId === parseInt(selectedRoleId) &&
      p.ModuleId === moduleId &&
      (subModuleId === null ? (p.SubModuleId === null || p.SubModuleId === 0) : p.SubModuleId === subModuleId)
    );
  };

  const toggleModuleExpand = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Get submodules for a module
  const getSubModulesForModule = (moduleId) => {
    return subModules.filter(sm => {
      // Handle both lowercase and uppercase property names from API
      const smModuleId = sm.ModuleId || sm.moduleId;
      return smModuleId === moduleId;
    });
  };

  // Get modules to display (either all modules or filtered by selected module)
  const getDisplayModules = () => {
    if (selectedModule) {
      return modules.filter(m => m.id === selectedModule);
    }
    return modules;
  };

  return (
    <div className="settings-section">
      <h2 className="section-title">Role Permissions</h2>
      <p className="section-description">Manage module and submodule permissions for each role.</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )
      }

      <div className="form-group" style={{ marginBottom: '30px' }}>
        <SearchableSelect
          options={roles.map(role => ({ id: role.id, value: role.id, label: role.role, role: role.role }))}
          value={selectedRoleId}
          onChange={(value) => setSelectedRoleId(value)}
          placeholder="-- Select a Role --"
          disabled={isFetching || isSaving}
          label="Select Role"
          maxWidth="300px"
        />
      </div>

      {
        selectedRoleId && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                console.log('Save button clicked. Dirty:', dirty, 'isSaving:', isSaving, 'isFetching:', isFetching);
                console.log('Draft keys count:', draftKeys.size);
                if (!dirty) {
                  setMessage({ type: 'info', text: 'No changes to save.' });
                  return;
                }
                saveAllChanges();
              }}
              disabled={!dirty || isSaving || isFetching}
              style={{
                opacity: (!dirty || isSaving || isFetching) ? 0.6 : 1,
                cursor: (!dirty || isSaving || isFetching) ? 'not-allowed' : 'pointer',
                minWidth: '150px'
              }}
            >
              {isSaving ? (
                <>
                  <LoadingSpinner inline size="small" /> Saving...
                </>
              ) : 'Save Permissions'}
            </button>
            {dirty && !isSaving && (
              <span style={{ color: '#ff9800', fontSize: '13px', fontWeight: '500' }}>
                ⚠️ You have unsaved changes.
              </span>
            )}
            {!dirty && !isSaving && !isFetching && (
              <span style={{ color: '#4caf50', fontSize: '13px' }}>
                ✓ All changes saved.
              </span>
            )}
          </div>
        )
      }

      {
        selectedRoleId && (
          <div className="permissions-table-container">
            {isFetching ? (
              <div className="loading-state">Loading permissions...</div>
            ) : !modules || modules.length === 0 ? (
              <div className="empty-state">
                <p>No modules found. Please create modules first.</p>
              </div>
            ) : (() => {
              try {
                const displayModules = getDisplayModules();
                console.log('Display modules:', displayModules.length, displayModules);
                console.log('All modules:', modules);
                console.log('Selected module filter:', selectedModule);
                console.log('Permissions:', permissions);

                if (!displayModules || displayModules.length === 0) {
                  return (
                    <div className="empty-state">
                      <p>No modules available for display. (Total modules: {modules.length})</p>
                    </div>
                  );
                }

                // Deduplicate modules by id to prevent duplicate rows
                const uniqueModules = displayModules.filter((module, index, self) => {
                  const moduleId1 = module.Id || module.id;
                  return index === self.findIndex(m => {
                    const moduleId2 = m.Id || m.id;
                    return moduleId2 === moduleId1;
                  });
                });

                return uniqueModules.map((module, index) => {
                  console.log(`Rendering module $ { index }: `, module);
                  // Handle both lowercase and uppercase property names from API
                  const moduleId = module.Id || module.id;
                  const moduleName = module.ModuleName || module.moduleName;
                  const moduleSubModules = getSubModulesForModule(moduleId);
                  // Deduplicate submodules by id - handle both property name cases
                  const uniqueSubModules = moduleSubModules.filter((sm, idx, self) => {
                    const smId1 = sm.Id || sm.id;
                    return idx === self.findIndex(s => {
                      const sId = s.Id || s.id;
                      return sId === smId1;
                    });
                  });

                  // Build items array: module first, then all its submodules
                  const allItems = [
                    { id: `module_${moduleId}`, name: moduleName, type: 'module', moduleId: moduleId, subModuleId: null },
                    ...uniqueSubModules.map(sm => {
                      const smId = sm.Id || sm.id;
                      const smName = sm.SubModuleName || sm.subModuleName;
                      return {
                        id: `submodule_${smId}`,
                        name: smName,
                        type: 'submodule',
                        moduleId: moduleId,
                        subModuleId: smId
                      };
                    })
                  ];

                  return (
                    <div key={moduleId} className="permission-module-group">
                      <h3 className="permission-module-title">{moduleName}</h3>
                      <div className="permission-table-wrapper">
                        <table className="permission-table">
                          <thead>
                            <tr>
                              <th className="module-col">Module</th>
                              <th>Full Access</th>
                              <th>View</th>
                              <th>Create</th>
                              <th>Edit</th>
                              <th>Delete</th>
                              <th>Approve</th>
                              <th>All Record</th>
                              <th className="actions-col"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {allItems.map((item, itemIndex) => (
                              <tr
                                key={`${moduleId}_${item.type}_${item.moduleId}_${item.subModuleId || 'null'}_${itemIndex}`}
                                className={item.type === 'submodule' ? 'submodule-row' : 'module-row'}
                              >
                                <td className={`module-name-cell ${item.type === 'submodule' ? 'submodule-name' : 'module-name'}`}>
                                  {item.type === 'submodule' && <span className="submodule-indent">└─ </span>}
                                  {item.name}
                                </td>
                                {permissionTypes.map((permissionType) => {
                                  const isChecked = isPermissionChecked(item.moduleId, item.subModuleId, permissionType);
                                  return (
                                    <td key={permissionType} className="checkbox-cell">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => handleCheckboxChange(
                                          item.moduleId,
                                          item.subModuleId,
                                          permissionType,
                                          e.target.checked
                                        )}
                                        disabled={isSaving || isFetching}
                                        className="permission-checkbox"
                                      />
                                    </td>
                                  );
                                })}
                                <td className="more-permissions-cell">
                                  {item.type === 'module' && (
                                    <a
                                      href="#"
                                      className="more-permissions-link"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        toggleModuleExpand(item.moduleId);
                                      }}
                                    >
                                      More Permissions
                                    </a>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Additional permissions section */}
                      {expandedModules[moduleId] && moduleSubModules.length > 0 && (
                        <div className="additional-permissions">
                          <div className="additional-permission-item">
                            <input
                              type="checkbox"
                              id={`additional - ${moduleId} `}
                              className="permission-checkbox"
                            />
                            <label htmlFor={`additional - ${moduleId} `}>
                              Allow users to add, edit and delete vendor's bank account details.
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              } catch (error) {
                console.error('Error rendering modules:', error);
                return (
                  <div className="empty-state">
                    <p>Error rendering modules. Please check the console for details.</p>
                  </div>
                );
              }
            })()}
          </div>
        )
      }
    </div >
  );
};

// Profile Section Component
const ProfileSection = ({ user }) => {
  const [formData, setFormData] = useState({
    userid: user.userid || '',
    email: user.email || '',
    role: user.role || '',
    status: user.status || 'Active',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      localStorage.setItem('user', JSON.stringify({ ...user, ...formData }));
    }, 1000);
  };

  return (
    <div className="settings-section">
      <h2 className="section-title">Profile Settings</h2>
      <p className="section-description">Manage your profile information and account details.</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )
      }

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-group">
          <label htmlFor="userid">User ID</label>
          <input
            type="text"
            id="userid"
            value={formData.userid}
            onChange={(e) => setFormData({ ...formData, userid: e.target.value })}
            disabled
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="role">Role</label>
          <select
            id="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="form-input"
          >
            <option value="Admin">Admin</option>
            <option value="User">User</option>
            <option value="Manager">Manager</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="form-input"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? (
              <>
                <LoadingSpinner inline size="small" /> Saving...
              </>
            ) : 'Save Changes'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setFormData({
            userid: user.userid || '',
            email: user.email || '',
            role: user.role || '',
            status: user.status || 'Active',
          })}>
            Cancel
          </button>
        </div>
      </form>
    </div >
  );
};

// Security Section Component
const SecuritySection = () => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match!' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }, 1000);
  };

  return (
    <div className="settings-section">
      <h2 className="section-title">Security Settings</h2>
      <p className="section-description">Change your password and manage security settings.</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )
      }

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-group">
          <label htmlFor="currentPassword">Current Password</label>
          <input
            type="password"
            id="currentPassword"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            required
            minLength="8"
            className="form-input"
          />
          <small className="form-hint">Password must be at least 8 characters long.</small>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            required
            className="form-input"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>

      <div className="security-options">
        <h3>Additional Security</h3>
        <div className="option-item">
          <div>
            <h4>Two-Factor Authentication</h4>
            <p>Add an extra layer of security to your account</p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" />
            <span className="slider"></span>
          </label>
        </div>

        <div className="option-item">
          <div>
            <h4>Session Timeout</h4>
            <p>Automatically log out after 30 minutes of inactivity</p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" defaultChecked />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </div >
  );
};

// Preferences Section Component
const PreferencesSection = () => {
  return (
    <div className="settings-section">
      <h2 className="section-title">Preferences</h2>
      <p className="section-description">Customize your application preferences.</p>

      <div className="preferences-grid">
        <div className="preference-card">
          <h3>Language</h3>
          <select className="form-input">
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
          </select>
        </div>

        <div className="preference-card">
          <h3>Theme</h3>
          <select className="form-input">
            <option>Light</option>
            <option>Dark</option>
            <option>Auto</option>
          </select>
        </div>

        <div className="preference-card">
          <h3>Date Format</h3>
          <select className="form-input">
            <option>MM/DD/YYYY</option>
            <option>DD/MM/YYYY</option>
            <option>YYYY-MM-DD</option>
          </select>
        </div>

        <div className="preference-card">
          <h3>Time Zone</h3>
          <select className="form-input">
            <option>UTC</option>
            <option>EST</option>
            <option>PST</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// Notifications Section Component
const NotificationsSection = () => {
  return (
    <div className="settings-section">
      <h2 className="section-title">Notification Settings</h2>
      <p className="section-description">Manage how and when you receive notifications.</p>

      <div className="notification-settings">
        <div className="option-item">
          <div>
            <h4>Email Notifications</h4>
            <p>Receive notifications via email</p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" defaultChecked />
            <span className="slider"></span>
          </label>
        </div>

        <div className="option-item">
          <div>
            <h4>Push Notifications</h4>
            <p>Receive push notifications in your browser</p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" />
            <span className="slider"></span>
          </label>
        </div>

        <div className="option-item">
          <div>
            <h4>System Alerts</h4>
            <p>Receive alerts for system updates</p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" defaultChecked />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
};

// System Section Component
const SystemSection = () => {
  return (
    <div className="settings-section">
      <h2 className="section-title">System Settings</h2>
      <p className="section-description">Configure system-wide settings and preferences.</p>

      <div className="system-info">
        <div className="info-card">
          <h3>System Information</h3>
          <div className="info-row">
            <span className="info-label">Version:</span>
            <span className="info-value">1.0.0</span>
          </div>
          <div className="info-row">
            <span className="info-label">Last Update:</span>
            <span className="info-value">2026-01-15</span>
          </div>
        </div>

        <div className="info-card">
          <h3>Database</h3>
          <div className="info-row">
            <span className="info-label">Status:</span>
            <span className="info-value status-active">Connected</span>
          </div>
          <div className="info-row">
            <span className="info-label">Server:</span>
            <span className="info-value">DESKTOP-GANSHQJ\SQLEXPRESS</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Users Section Component
const UsersSection = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [catalogs, setCatalogs] = useState([]);
  const [stockLocations, setStockLocations] = useState([]);
  const [showCropModal, setShowCropModal] = useState(false);
  const [crop, setCrop] = useState({ unit: '%', width: 90, aspect: 1 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [imgSrc, setImgSrc] = useState('');
  const [imageRef, setImageRef] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  const [formData, setFormData] = useState({
    id: null,
    userid: '',
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    password: '',
    selectedRoles: [],
    catelogid: '',
    warehouseid: '',
    status: 'Active',
    profile_image: ''
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/user`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users || data.Users || []);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to fetch users' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please check if the backend server is running.' });
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all roles
  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_URL}/api/role`);
      const data = await response.json();

      if (data.success) {
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  // Fetch catalogs
  const fetchCatalogs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/catalog?query=3`);
      const data = await response.json();
      if (data.success) {
        // Handle both uppercase and lowercase property names
        const catalogsList = data.Catalogs || data.catalogs || data.Data || data.data || [];
        setCatalogs(catalogsList);
        console.log('Fetched catalogs:', catalogsList);
      } else {
        console.error('Failed to fetch catalogs:', data.message);
      }
    } catch (error) {
      console.error('Error fetching catalogs:', error);
    }
  };

  // Fetch stock locations
  const fetchStockLocations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stocklocation?isdelete=0&status=Active`);
      const data = await response.json();
      if (data.success) {
        // Handle both uppercase and lowercase property names
        const locationsList = data.StockLocations || data.stockLocations || data.Data || data.data || [];
        setStockLocations(locationsList);
        console.log('Fetched stock locations:', locationsList);
      } else {
        console.error('Failed to fetch stock locations:', data.message);
      }
    } catch (error) {
      console.error('Error fetching stock locations:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchCatalogs();
    fetchStockLocations();
  }, []);


  // Handle role selection change
  const handleRoleChange = (roleId) => {
    if (roleId) {
      const selectedRole = roles.find(r => r.id === roleId);
      if (selectedRole) {
        setSelectedRoleId(roleId);
        setFormData({
          ...formData,
          selectedRoles: [selectedRole.role]
        });
      }
    } else {
      setSelectedRoleId(null);
      setFormData({
        ...formData,
        selectedRoles: []
      });
    }
  };



  // Helper function to get catalog name by ID
  const getCatalogName = (id) => {
    if (!id) return '-';
    const catalog = catalogs.find(c =>
      (c.Id && c.Id === parseInt(id)) ||
      (c.id && c.id === parseInt(id))
    );
    return catalog ? (catalog.Catelogname || catalog.catelogname || '') : id || '-';
  };

  // Helper function to get warehouse name by ID
  const getWarehouseName = (id) => {
    if (!id) return '-';
    const location = stockLocations.find(l =>
      (l.Id && l.Id === parseInt(id)) ||
      (l.id && l.id === parseInt(id))
    );
    return location ? (location.Name || location.name || '') : id || '-';
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result);
        setShowCropModal(true);
      });
      reader.readAsDataURL(file);
    }
  };

  // Handle crop completion
  const onImageLoaded = (image) => {
    setImageRef(image);
  };

  // Get cropped image as base64
  const getCroppedImg = (image, crop) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          resolve(reader.result);
        });
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.9);
    });
  };

  // Apply crop
  const applyCrop = async () => {
    if (imageRef && completedCrop) {
      const croppedImage = await getCroppedImg(imageRef, completedCrop);
      setFormData({ ...formData, profile_image: croppedImage });
      setShowCropModal(false);
      setImgSrc('');
      setCrop({ unit: '%', width: 90, aspect: 1 });
    }
  };


  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Validate required fields
    if (!formData.firstname || !formData.firstname.trim()) {
      setMessage({ type: 'error', text: 'First Name is required' });
      return;
    }
    if (!formData.lastname || !formData.lastname.trim()) {
      setMessage({ type: 'error', text: 'Last Name is required' });
      return;
    }
    if (!formData.email || !formData.email.trim()) {
      setMessage({ type: 'error', text: 'Email is required' });
      return;
    }
    if (!formData.phone || !formData.phone.trim()) {
      setMessage({ type: 'error', text: 'Phone is required' });
      return;
    }
    if (!editingUser && (!formData.password || !formData.password.trim())) {
      setMessage({ type: 'error', text: 'Password is required' });
      return;
    }
    if (!formData.selectedRoles || formData.selectedRoles.length === 0) {
      setMessage({ type: 'error', text: 'Role is required' });
      return;
    }
    if (!formData.status) {
      setMessage({ type: 'error', text: 'Status is required' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const requestData = {
        id: formData.id,
        userid: formData.userid,
        firstname: formData.firstname.trim(),
        lastname: formData.lastname.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password || undefined,
        role: formData.selectedRoles.join(','),
        catelogid: formData.catelogid || null,
        warehouseid: formData.warehouseid || null,
        status: formData.status,
        profile_image: formData.profile_image || null
      };

      console.log('Submitting user data:', requestData);

      const response = await fetch(`${API_URL}/api/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      console.log('API response:', data);

      if (data.success) {
        setMessage({ type: 'success', text: editingUser ? 'User updated successfully!' : 'User created successfully!' });
        setTimeout(() => {
          setShowModal(false);
          handleCloseModal();
          fetchUsers();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error saving user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/user/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'User deleted successfully!' });
        fetchUsers();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete user' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error deleting user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (user) => {
    setEditingUser(user);
    const userRoles = user.role ? user.role.split(',').filter(r => r.trim()) : [];

    setFormData({
      id: user.id,
      userid: user.userid || '',
      firstname: user.firstname || '',
      lastname: user.lastname || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      selectedRoles: userRoles,
      catelogid: user.catelogid || '',
      warehouseid: user.warehouseid || '',
      status: user.status || 'Active',
      profile_image: user.profile_image || ''
    });
    setShowModal(true);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingUser(null);
    setFormData({
      id: null,
      userid: '',
      firstname: '',
      lastname: '',
      email: '',
      phone: '',
      password: '',
      selectedRoles: [],
      catelogid: '',
      warehouseid: '',
      status: 'Active',
      profile_image: ''
    });
    setMessage({ type: '', text: '' });
    setShowModal(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      id: null,
      userid: '',
      firstname: '',
      lastname: '',
      email: '',
      phone: '',
      password: '',
      selectedRoles: [],
      catelogid: '',
      warehouseid: '',
      status: 'Active',
      profile_image: ''
    });
    setMessage({ type: '', text: '' });
  };

  // Enhanced Filter Logic
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const userid = user.userid || user.Userid || '';
    const email = user.email || user.Email || '';
    const firstname = user.firstname || user.Firstname || '';
    const lastname = user.lastname || user.Lastname || '';
    const role = user.role || user.Role || '';
    return (
      (userid?.toLowerCase().includes(searchLower)) ||
      (email?.toLowerCase().includes(searchLower)) ||
      (firstname?.toLowerCase().includes(searchLower)) ||
      (lastname?.toLowerCase().includes(searchLower)) ||
      (role?.toLowerCase().includes(searchLower))
    );
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Export functions
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredUsers.map(user => ({
      UserId: user.userid,
      Name: `${user.firstname || ''} ${user.lastname || ''} `.trim(),
      Email: user.email,
      Phone: user.phone,
      Role: user.role,
      Catalog: getCatalogName(user.catelogid),
      Warehouse: getWarehouseName(user.warehouseid),
      Status: user.status
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, "Users.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("User List", 20, 10);
    doc.autoTable({
      head: [['User ID', 'Name', 'Email', 'Phone', 'Role', 'Status']],
      body: filteredUsers.map(user => [
        user.userid,
        `${user.firstname || ''} ${user.lastname || ''} `.trim(),
        user.email,
        user.phone,
        user.role,
        user.status
      ]),
    });
    doc.save("Users.pdf");
  };

  return (
    <div className="settings-section">
      <h2 className="section-title">User Management</h2>
      <p className="section-description">View and manage system users.</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )
      }

      {/* Datatable Toolbar */}
      {/* Datatable Toolbar */}
      <div className="users-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div className="left-actions">
          <button className="btn-primary" onClick={handleAddNew} disabled={loading} style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}>+</span> Add New User
          </button>
        </div>

        <div className="right-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="search-wrapper" style={{ position: 'relative' }}>
            <input
              type="search"
              placeholder="Search users..."
              className="search-input"
              style={{ width: '250px', paddingRight: '10px' }}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <button className="btn-secondary" onClick={exportToExcel} style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#fff', color: '#217346', border: '1px solid #ddd', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
            📊 Excel
          </button>
          <button className="btn-secondary" onClick={exportToPDF} style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#fff', color: '#F40F02', border: '1px solid #ddd', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
            📄 PDF
          </button>
        </div>
      </div>

      {
        loading && !users.length ? (
          <LoadingSpinner text="Loading users..." />
        ) : (
          <div className="users-table-container">
            <div className="users-table">
              {filteredUsers.length === 0 ? (
                <div className="empty-state">
                  <p>No users found.</p>
                </div>
              ) : (
                <>
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((user) => (
                        <tr key={user.id}>
                          <td>{user.userid || '-'}</td>
                          <td>{`${user.firstname || ''} ${user.lastname || ''} `.trim() || '-'}</td>
                          <td>{user.email || '-'}</td>
                          <td>{user.phone || '-'}</td>
                          <td>{user.role || '-'}</td>
                          <td>
                            <span className={`badge ${user.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                              {user.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn-icon"
                              title="Edit"
                              onClick={() => handleEdit(user)}
                              disabled={loading}
                            >
                              <IconSVG name="edit" size={16} />
                            </button>
                            <button
                              className="btn-icon"
                              title="Delete"
                              onClick={() => handleDelete(user.id)}
                              disabled={loading}
                            >
                              <IconSVG name="delete" size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '10px 0', borderTop: '1px solid #eee' }}>
                    <div className="pagination-info" style={{ color: '#666' }}>
                      Showing {filteredUsers.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} entries
                    </div>

                    <div className="items-per-page-control" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#666', fontSize: '14px' }}>Items per page:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="form-select"
                        style={{ borderRadius: '4px', border: '1px solid #ddd', cursor: 'pointer' }}
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={1000000}>All</option>
                      </select>
                    </div>

                    <div className="pagination-buttons" style={{ display: 'flex', gap: '5px' }}>
                      <button
                        disabled={currentPage === 1}
                        onClick={() => paginate(currentPage - 1)}
                        style={{
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          background: currentPage === 1 ? '#f5f5f5' : 'white',
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                          color: '#333'
                        }}
                      >
                        &lt;
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(number => {
                          return number === 1 ||
                            number === totalPages ||
                            Math.abs(currentPage - number) <= 1;
                        })
                        .map((number, index, array) => {
                          const showEllipsis = index > 0 && number - array[index - 1] > 1;
                          return (
                            <div key={number} style={{ display: 'flex' }}>
                              {showEllipsis && <span style={{ padding: '5px' }}>...</span>}
                              <button
                                onClick={() => paginate(number)}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  background: currentPage === number ? '#2C3E50' : 'white',
                                  color: currentPage === number ? 'white' : '#333',
                                  cursor: 'pointer',
                                  marginLeft: '5px'
                                }}
                              >
                                {number}
                              </button>
                            </div>
                          );
                        })
                      }

                      <button
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => paginate(currentPage + 1)}
                        style={{
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          background: currentPage === totalPages ? '#f5f5f5' : 'white',
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                          marginLeft: '5px',
                          color: '#333'
                        }}
                      >
                        &gt;
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      }

      {/* Add/Edit User Modal */}
      {
        showModal && (
          <div className="modal-overlay">
            <div className="modal-content responsive-modal" style={{ maxWidth: '800px', padding: '0', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #2C3E50 0%, #34495e 100%)', color: '#fff', borderBottom: 'none' }}>
                <h3 style={{ color: '#fff', fontWeight: '600' }}>{editingUser ? 'Edit User' : 'Add New User'}</h3>
                <button
                  className="modal-close"
                  onClick={handleCloseModal}
                  style={{ color: '#fff', fontSize: '24px', fontWeight: '300' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '24px' }}>
                {message.text && (
                  <div style={{
                    padding: '12px 16px',
                    marginBottom: '20px',
                    borderRadius: '6px',
                    backgroundColor: message.type === 'success' ? '#d4edda' : message.type === 'error' ? '#f8d7da' : '#d1ecf1',
                    color: message.type === 'success' ? '#155724' : message.type === 'error' ? '#721c24' : '#0c5460',
                    border: `1px solid ${message.type === 'success' ? '#c3e6cb' : message.type === 'error' ? '#f5c6cb' : '#bee5eb'} `,
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {message.text}
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px', marginBottom: '24px' }}>
                    {/* Image Upload Section */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                        Profile Image
                      </label>
                      <div style={{ border: '2px dashed #ddd', borderRadius: '8px', padding: '20px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>
                        {formData.profile_image ? (
                          <img
                            src={formData.profile_image}
                            alt="Profile"
                            style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', marginBottom: '10px' }}
                          />
                        ) : (
                          <div style={{ padding: '40px 20px', color: '#999' }}>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📄</div>
                            <div>No image</div>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: 'none' }}
                          id="imageUpload"
                        />
                        <label
                          htmlFor="imageUpload"
                          style={{
                            display: 'inline-block',
                            padding: '8px 16px',
                            backgroundColor: '#2C3E50',
                            color: '#fff',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          Browse New Image
                        </label>
                      </div>
                    </div>

                    {/* Form Fields Section */}
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                            First Name <span style={{ color: '#e74c3c' }}>*</span>
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={formData.firstname}
                            onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                            required
                            placeholder="FirstName"
                            disabled={loading}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '1px solid #ddd',
                              borderRadius: '8px',
                              fontSize: '14px',
                              transition: 'all 0.3s',
                              boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                            onBlur={(e) => e.target.style.borderColor = '#ddd'}
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                            Last Name <span style={{ color: '#e74c3c' }}>*</span>
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={formData.lastname}
                            onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                            required
                            placeholder="lastname"
                            disabled={loading}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '1px solid #ddd',
                              borderRadius: '8px',
                              fontSize: '14px',
                              transition: 'all 0.3s',
                              boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                            onBlur={(e) => e.target.style.borderColor = '#ddd'}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                          Role <span style={{ color: '#e74c3c' }}>*</span>
                        </label>
                        <MultiSelectSearchable
                          options={roles.map(role => ({ value: role.id, label: role.role }))}
                          value={formData.selectedRoles.map(roleName => {
                            const role = roles.find(r => r.role === roleName);
                            return role ? role.id : null;
                          }).filter(id => id !== null)}
                          onChange={(selectedIds) => {
                            const selectedRoleNames = selectedIds.map(id => {
                              const role = roles.find(r => r.id === id);
                              return role ? role.role : null;
                            }).filter(name => name !== null);
                            setFormData({
                              ...formData,
                              selectedRoles: selectedRoleNames
                            });
                          }}
                          placeholder="-- Select Role(s) --"
                          disabled={loading}
                          label=""
                          maxWidth="100%"
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label htmlFor="warehouseid" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                          Warehouse Location
                        </label>
                        <select
                          id="warehouseid"
                          className="form-input"
                          value={formData.warehouseid ? String(formData.warehouseid) : ''}
                          onChange={(e) => setFormData({ ...formData, warehouseid: e.target.value || '' })}
                          disabled={loading}
                        >
                          <option value="">-- Select a Warehouse Location --</option>
                          {stockLocations.map(location => (
                            <option key={location.Id || location.id} value={String(location.Id || location.id)}>
                              {location.Name || location.name || ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label htmlFor="catelogid" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                          Catalog
                        </label>
                        <select
                          id="catelogid"
                          className="form-input"
                          value={formData.catelogid ? String(formData.catelogid) : ''}
                          onChange={(e) => setFormData({ ...formData, catelogid: e.target.value || '' })}
                          disabled={loading}
                        >
                          <option value="">-- Select a Catalog --</option>
                          {catalogs.map(catalog => (
                            <option key={catalog.Id || catalog.id} value={String(catalog.Id || catalog.id)}>
                              {catalog.Catelogname || catalog.catelogname || ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                            Email <span style={{ color: '#e74c3c' }}>*</span>
                          </label>
                          <input
                            type="email"
                            className="form-input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            placeholder="Email"
                            disabled={loading}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '1px solid #ddd',
                              borderRadius: '8px',
                              fontSize: '14px',
                              transition: 'all 0.3s',
                              boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                            onBlur={(e) => e.target.style.borderColor = '#ddd'}
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                            Phone <span style={{ color: '#e74c3c' }}>*</span>
                          </label>
                          <input
                            type="tel"
                            className="form-input"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                            placeholder="Phone"
                            disabled={loading}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '1px solid #ddd',
                              borderRadius: '8px',
                              fontSize: '14px',
                              transition: 'all 0.3s',
                              boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                            onBlur={(e) => e.target.style.borderColor = '#ddd'}
                          />
                        </div>
                      </div>

                      {!editingUser && (
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                            Password <span style={{ color: '#e74c3c' }}>*</span>
                          </label>
                          <input
                            type="password"
                            className="form-input"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required={!editingUser}
                            placeholder="Password"
                            disabled={loading}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '1px solid #ddd',
                              borderRadius: '8px',
                              fontSize: '14px',
                              transition: 'all 0.3s',
                              boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                            onBlur={(e) => e.target.style.borderColor = '#ddd'}
                          />
                        </div>
                      )}

                      <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                          Status <span style={{ color: '#e74c3c' }}>*</span>
                        </label>
                        <select
                          className="form-input"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          required
                          disabled={loading}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            boxSizing: 'border-box',
                            appearance: 'none',
                            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23333\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 12px center',
                            paddingRight: '40px'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                          onBlur={(e) => e.target.style.borderColor = '#ddd'}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleCloseModal}
                      disabled={loading}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        backgroundColor: '#fff',
                        color: '#333',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.3s'
                      }}
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: loading ? '#95a5a6' : '#2C3E50',
                        color: '#fff',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s',
                        boxShadow: loading ? 'none' : '0 2px 4px rgba(44, 62, 80, 0.2)'
                      }}
                      onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#34495e')}
                      onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2C3E50')}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner inline size="small" /> Saving...
                        </>
                      ) : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }

      {/* Image Crop Modal */}
      {
        showCropModal && imgSrc && (
          <div className="modal-overlay">
            <div className="modal-content responsive-modal modal-sm" style={{ padding: '0' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #2C3E50 0%, #34495e 100%)', color: '#fff', borderBottom: 'none' }}>
                <h3 style={{ color: '#fff', fontWeight: '600' }}>Crop Image</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowCropModal(false)}
                  style={{ color: '#fff', fontSize: '24px', fontWeight: '300' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '24px' }}>
                <ReactCrop
                  crop={crop}
                  onChange={(newCrop) => setCrop(newCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                >
                  <img
                    src={imgSrc}
                    alt="Crop"
                    onLoad={(e) => onImageLoaded(e.currentTarget)}
                    style={{ maxWidth: '100%' }}
                  />
                </ReactCrop>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCropModal(false)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      backgroundColor: '#fff',
                      color: '#333',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={applyCrop}
                    disabled={!completedCrop}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: completedCrop ? '#2C3E50' : '#95a5a6',
                      color: '#fff',
                      cursor: completedCrop ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    Apply Crop
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

// Email Settings Section Component
const EmailSettingsSection = () => {
  const [emailSettings, setEmailSettings] = useState({
    id: null,
    smtpUsername: '',
    smtpPassword: '',
    smtpConfirmPassword: '',
    smtpHost: '',
    serverPort: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isEditing, setIsEditing] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

  // Fetch email settings on component mount
  useEffect(() => {
    fetchEmailSettings();
  }, []);

  const fetchEmailSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/email`);
      const data = await response.json();

      if (data.success && data.emailSettings && data.emailSettings.length > 0) {
        const settings = data.emailSettings[0];
        setEmailSettings({
          id: settings.id,
          smtpUsername: settings.smtpUsername || '',
          smtpPassword: settings.smtpPassword || '',
          smtpConfirmPassword: settings.smtpPassword || '',
          smtpHost: settings.smtpHost || '',
          serverPort: settings.serverPort || ''
        });
        setIsEditing(false);
      } else {
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
      setMessage({ type: 'error', text: 'Failed to load email settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmailSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password confirmation
    if (emailSettings.smtpPassword !== emailSettings.smtpConfirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    // Validate required fields
    if (!emailSettings.smtpUsername || !emailSettings.smtpPassword ||
      !emailSettings.smtpHost || !emailSettings.serverPort) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_URL}/api/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: emailSettings.id,
          smtpUsername: emailSettings.smtpUsername,
          smtpPassword: emailSettings.smtpPassword,
          smtpHost: emailSettings.smtpHost,
          serverPort: emailSettings.serverPort
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message || 'Email settings saved successfully!' });
        setIsEditing(false);
        // Clear password fields after successful save
        setEmailSettings(prev => ({
          ...prev,
          smtpPassword: '',
          smtpConfirmPassword: ''
        }));
        // Refresh settings to get the updated data
        setTimeout(() => {
          fetchEmailSettings();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save email settings' });
      }
    } catch (error) {
      console.error('Error saving email settings:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setMessage({ type: '', text: '' });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setMessage({ type: '', text: '' });
    fetchEmailSettings();
  };

  if (loading) {
    return (
      <div className="settings-section">
        <LoadingSpinner text="Loading email settings..." />
      </div>
    );
  }

  return (
    <div className="settings-section">
      <div className="section-header">
        <h2 className="section-title">SMTP Settings</h2>
        {!isEditing && (
          <button
            className="btn-icon"
            onClick={handleEdit}
            title="Edit Settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        )}
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )
      }

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-column">
            <div className="form-group">
              <label htmlFor="smtpUsername">SMTP Username *</label>
              <input
                type="text"
                id="smtpUsername"
                name="smtpUsername"
                className="form-input"
                value={emailSettings.smtpUsername}
                onChange={handleInputChange}
                disabled={!isEditing}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="smtpPassword">SMTP Password *</label>
              <input
                type="password"
                id="smtpPassword"
                name="smtpPassword"
                className="form-input"
                value={emailSettings.smtpPassword}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder={!isEditing ? "••••••••••" : ""}
                required={isEditing}
              />
            </div>

            <div className="form-group">
              <label htmlFor="smtpConfirmPassword">SMTP Confirm Password *</label>
              <input
                type="password"
                id="smtpConfirmPassword"
                name="smtpConfirmPassword"
                className="form-input"
                value={emailSettings.smtpConfirmPassword}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder={!isEditing ? "••••••••••" : ""}
                required={isEditing}
              />
            </div>
          </div>

          <div className="form-column">
            <div className="form-group">
              <label htmlFor="smtpHost">SMTP Host *</label>
              <input
                type="text"
                id="smtpHost"
                name="smtpHost"
                className="form-input"
                value={emailSettings.smtpHost}
                onChange={handleInputChange}
                disabled={!isEditing}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="serverPort">Email Server Port *</label>
              <input
                type="text"
                id="serverPort"
                name="serverPort"
                className="form-input"
                value={emailSettings.serverPort}
                onChange={handleInputChange}
                disabled={!isEditing}
                required
              />
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <LoadingSpinner inline size="small" /> Saving...
                </>
              ) : 'Save Settings'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        )}
      </form>
    </div >
  );
};

// Variants Section Component
const VariantsSection = () => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [formData, setFormData] = useState({
    varinatname: '',
    varianttype: '',
    variantvalues: '',
    status: 'Active'
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

  // Variant Type options for dropdown
  const variantTypeOptions = ['CheckBox', 'TextBox', 'Dropdownlist'];

  // Fetch all variants
  const fetchVariants = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/variant`);
      const data = await response.json();

      if (data.success) {
        setVariants(data.variants || []);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to load variants' });
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
      setMessage({ type: 'error', text: 'Network error. Please check if the backend server is running.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_URL}/api/variant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: editingVariant?.id,
          varinatname: formData.varinatname,
          varianttype: formData.varianttype,
          variantvalues: formData.variantvalues,
          status: formData.status
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message || 'Variant saved successfully!' });
        setShowModal(false);
        setEditingVariant(null);
        setFormData({ varinatname: '', varianttype: '', variantvalues: '', status: 'Active' });
        fetchVariants();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save variant' });
      }
    } catch (error) {
      console.error('Error saving variant:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (variant) => {
    setEditingVariant(variant);
    setFormData({
      varinatname: variant.varinatname || '',
      varianttype: variant.varianttype || '',
      variantvalues: variant.variantvalues || '',
      status: variant.status || 'Active'
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this variant?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/variant/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Variant deleted successfully!' });
        fetchVariants();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete variant' });
      }
    } catch (error) {
      console.error('Error deleting variant:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingVariant(null);
    setFormData({ varinatname: '', varianttype: '', variantvalues: '', status: 'Active' });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  const filteredVariants = variants.filter(variant =>
    (variant.varinatname?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (variant.varianttype?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (variant.variantvalues?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  // Pagination calculations
  const itemsPerPageValue = itemsPerPage === 'all' ? filteredVariants.length : itemsPerPage;
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(filteredVariants.length / itemsPerPage);
  const startIndex = itemsPerPage === 'all' ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === 'all' ? filteredVariants.length : startIndex + itemsPerPage;
  const paginatedVariants = filteredVariants.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Export to Excel
  const exportToExcel = () => {
    const dataToExport = filteredVariants.map(variant => ({
      'ID': variant.id,
      'Variant Name': variant.varinatname || '',
      'Variant Type': variant.varianttype || '',
      'Variant Values': variant.variantvalues || '',
      'Status': variant.status || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Variants');
    XLSX.writeFile(wb, `Variants_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export to PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(16);
      doc.setTextColor(44, 62, 80);
      doc.text('Variants Report', 14, 15);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()} `, 14, 22);

      // Prepare table data
      const tableData = filteredVariants.map(variant => [
        String(variant.id || ''),
        variant.varinatname || '-',
        variant.varianttype || '-',
        variant.variantvalues || '-',
        variant.status || '-'
      ]);

      // Check if autoTable is available (it should be attached to jsPDF prototype)
      if (typeof doc.autoTable === 'function') {
        doc.autoTable({
          head: [['ID', 'Variant Name', 'Variant Type', 'Variant Values', 'Status']],
          body: tableData,
          startY: 28,
          styles: {
            fontSize: 9,
            cellPadding: 3,
            overflow: 'linebreak',
            cellWidth: 'wrap'
          },
          headStyles: {
            fillColor: [44, 62, 80],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 50 },
            2: { cellWidth: 40 },
            3: { cellWidth: 50 },
            4: { cellWidth: 30 }
          },
          margin: { top: 28 }
        });

        doc.save(`Variants_${new Date().toISOString().split('T')[0]}.pdf`);
      } else {
        // Fallback: Create a simple table without autoTable
        console.warn('autoTable not available, using fallback method');
        let yPos = 28;
        const rowHeight = 7;
        const colWidths = [20, 50, 40, 50, 30];
        const startX = 14;

        // Draw header
        doc.setFillColor(44, 62, 80);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        let xPos = startX;
        ['ID', 'Variant Name', 'Variant Type', 'Variant Values', 'Status'].forEach((header, idx) => {
          doc.rect(xPos, yPos, colWidths[idx], rowHeight, 'F');
          doc.text(header, xPos + 2, yPos + 5);
          xPos += colWidths[idx];
        });

        // Draw rows
        yPos += rowHeight;
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        tableData.forEach((row, rowIdx) => {
          if (rowIdx % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            let xPos = startX;
            colWidths.forEach((width) => {
              doc.rect(xPos, yPos, width, rowHeight, 'F');
              xPos += width;
            });
          }
          xPos = startX;
          row.forEach((cell, colIdx) => {
            doc.text(String(cell).substring(0, 20), xPos + 2, yPos + 5);
            xPos += colWidths[colIdx];
          });
          yPos += rowHeight;
        });

        doc.save(`Variants_${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert(`Failed to export PDF: ${error.message || 'Unknown error'}. Please check console for details.`);
    }
  };

  return (
    <div className="settings-section">
      <h2 className="section-title">Variants Management</h2>
      <p className="section-description">Create and manage product variants.</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )
      }

      <div className="roles-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
        {/* Left side - Add New Variant button */}
        <div>
          <button className="btn-primary" onClick={handleAddNew} disabled={loading}>
            + Add New Variant
          </button>
        </div>

        {/* Right side - Search, Excel, PDF */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="search"
            placeholder="Search variants..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: '300px', minWidth: '200px' }}
          />
          <button
            className="btn-secondary"
            onClick={exportToExcel}
            disabled={loading || filteredVariants.length === 0}
            title="Export to Excel"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
          >
            <span>📊</span> Excel
          </button>
          <button
            className="btn-secondary"
            onClick={exportToPDF}
            disabled={loading || filteredVariants.length === 0}
            title="Export to PDF"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
          >
            <span>📄</span> PDF
          </button>
        </div>
      </div>

      {
        loading && !variants.length ? (
          <LoadingSpinner text="Loading variants..." />
        ) : (
          <>
            <div className="roles-table">
              {filteredVariants.length === 0 ? (
                <div className="empty-state">
                  <p>No variants found. {searchTerm ? 'Try a different search term.' : 'Create your first variant.'}</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Variant Name</th>
                      <th>Variant Type</th>
                      <th>Variant Values</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedVariants.map((variant) => (
                      <tr key={variant.id}>
                        <td>{variant.id}</td>
                        <td>{variant.varinatname || '-'}</td>
                        <td>{variant.varianttype || '-'}</td>
                        <td>{variant.variantvalues || '-'}</td>
                        <td>
                          <span className={`badge ${variant.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                            {variant.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-icon"
                            title="Edit"
                            onClick={() => handleEdit(variant)}
                            disabled={loading}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon"
                            title="Delete"
                            onClick={() => handleDelete(variant.id)}
                            disabled={loading}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            {filteredVariants.length > 0 && (
              <div className="table-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div className="pagination-info" style={{ color: '#666', fontSize: '14px' }}>
                  {itemsPerPage === 'all'
                    ? `Showing all ${filteredVariants.length} entries`
                    : `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredVariants.length)} of ${filteredVariants.length} entries`
                  }
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <label htmlFor="itemsPerPage" style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>Items per page:</label>
                  <select
                    id="itemsPerPage"
                    className="items-select"
                    value={itemsPerPage === 'all' ? 'all' : itemsPerPage}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'all') {
                        setItemsPerPage('all');
                      } else {
                        setItemsPerPage(parseInt(value));
                      }
                      setCurrentPage(1);
                    }}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="all">All</option>
                  </select>
                </div>

                <div className="pagination">
                  <button
                    className="page-btn"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    &lt;
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={page}
                        className={`page-btn ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="page-dots">...</span>
                      <button
                        className={`page-btn ${currentPage === totalPages ? 'active' : ''}`}
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  <button
                    className="page-btn"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            )}
          </>
        )
      }

      {/* Add/Edit Modal */}
      {
        showModal && (
          <div className="modal-overlay">
            <div className="modal-content variant-modal" style={{ maxWidth: '600px', padding: '0' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #2C3E50 0%, #34495e 100%)', color: '#fff', borderBottom: 'none' }}>
                <h3 style={{ color: '#fff', fontWeight: '600' }}>{editingVariant ? 'Edit Variant' : 'Add New Variant'}</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowModal(false)}
                  style={{ color: '#fff', fontSize: '24px', fontWeight: '300' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '24px' }}>
                <form onSubmit={handleSubmit}>
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="varinatname" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Variant Name <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="varinatname"
                      name="varinatname"
                      className="form-input"
                      value={formData.varinatname}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="varianttype" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Variant Type <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <select
                      id="varianttype"
                      name="varianttype"
                      className="form-input"
                      value={formData.varianttype}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23333\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        paddingRight: '40px'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    >
                      <option value="">Select</option>
                      {variantTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="variantvalues" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Variant Values
                    </label>
                    <input
                      type="text"
                      id="variantvalues"
                      name="variantvalues"
                      className="form-input"
                      value={formData.variantvalues}
                      onChange={handleInputChange}
                      placeholder="Enter variant values (comma-separated)"
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label htmlFor="status" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Status <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <select
                      id="status"
                      name="status"
                      className="form-input"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23333\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        paddingRight: '40px'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowModal(false)}
                      disabled={loading}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        backgroundColor: '#fff',
                        color: '#333',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.3s'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: loading ? '#95a5a6' : '#2C3E50',
                        color: '#fff',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s',
                        boxShadow: loading ? 'none' : '0 2px 4px rgba(44, 62, 80, 0.2)'
                      }}
                      onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#34495e')}
                      onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2C3E50')}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner inline size="small" /> Saving...
                        </>
                      ) : editingVariant ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

// Vehicle Details Management Section Component
const VehicleManagementSection = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    vehiclename: '',
    vehicleno: '',
    isdelete: '0'
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

  // Fetch all vehicles
  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/vehicle?isdelete=0`);
      const data = await response.json();

      if (data.success) {
        setVehicles(data.vehicles || data.data || []);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to fetch vehicles' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please check if the backend server is running.' });
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load vehicles on component mount and when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchTerm) {
        fetchVehicles();
      }
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Initial load
  useEffect(() => {
    fetchVehicles();
  }, []);

  // Handle form submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const query = editingVehicle ? 2 : 1; // 1 = Insert, 2 = Update
      const url = editingVehicle
        ? `${API_URL}/api/vehicle/${editingVehicle.id}`
        : `${API_URL}/api/vehicle`;

      const method = editingVehicle ? 'PUT' : 'POST';

      const requestBody = {
        vehiclename: formData.vehiclename,
        vehicleno: formData.vehicleno || '',
        isdelete: formData.isdelete || '0',
        query: query
      };

      if (editingVehicle) {
        requestBody.id = editingVehicle.id;
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingVehicle ? 'Vehicle updated successfully!' : 'Vehicle created successfully!' });
        setShowModal(false);
        setEditingVehicle(null);
        setFormData({
          vehiclename: '',
          vehicleno: '',
          isdelete: '0'
        });
        fetchVehicles();
      } else {
        setMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error saving vehicle:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/vehicle/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Vehicle deleted successfully!' });
        fetchVehicles();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete vehicle' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error deleting vehicle:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for editing
  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehiclename: vehicle.vehiclename || vehicle.Vehiclename || '',
      vehicleno: vehicle.vehicleno || vehicle.Vehicleno || '',
      isdelete: vehicle.isdelete || vehicle.Isdelete || '0'
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Open modal for creating new vehicle
  const handleAdd = () => {
    setEditingVehicle(null);
    setFormData({
      vehiclename: '',
      vehicleno: '',
      isdelete: '0'
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVehicle(null);
    setFormData({
      vehiclename: '',
      vehicleno: '',
      isdelete: '0'
    });
    setMessage({ type: '', text: '' });
  };

  // Filter vehicles based on search term
  const filteredVehicles = searchTerm
    ? vehicles.filter(v =>
      (v.vehiclename || v.Vehiclename || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.vehicleno || v.Vehicleno || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    : vehicles;

  return (
    <div className="settings-section">
      <h2 className="section-title">Vehicle Details Management</h2>
      <p className="section-description">Create, update, and manage vehicle information.</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )
      }

      <div className="roles-actions">
        <button className="btn-primary" onClick={handleAdd} disabled={loading}>
          + Add New Vehicle
        </button>
        <input
          type="search"
          placeholder="Search vehicles..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {
        loading && !vehicles.length ? (
          <LoadingSpinner text="Loading vehicles..." />
        ) : (
          <div className="roles-table">
            {filteredVehicles.length === 0 ? (
              <div className="empty-state">
                <p>No vehicles found. Click "Add New Vehicle" to create one.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Vehicle Name</th>
                    <th>Vehicle Number</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((v) => (
                    <tr key={v.id || v.Id}>
                      <td>{v.id || v.Id}</td>
                      <td>
                        <strong>{v.vehiclename || v.Vehiclename}</strong>
                      </td>
                      <td>{v.vehicleno || v.Vehicleno || '-'}</td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Edit"
                          onClick={() => handleEdit(v)}
                          disabled={loading}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          title="Delete"
                          onClick={() => handleDelete(v.id || v.Id)}
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      }

      {/* Modal for Add/Edit Vehicle */}
      {
        showModal && (
          <div className="modal-overlay">
            <div className="modal-content responsive-modal modal-sm" style={{ padding: '0' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #2C3E50 0%, #34495e 100%)', color: '#fff', borderBottom: 'none' }}>
                <h3 style={{ color: '#fff', fontWeight: '600' }}>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
                <button
                  className="modal-close"
                  onClick={handleCloseModal}
                  style={{ color: '#fff', fontSize: '24px', fontWeight: '300' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '20px' }}>
                <form onSubmit={handleSubmit}>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="vehicleName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Vehicle Name <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="vehicleName"
                      className="form-input"
                      value={formData.vehiclename}
                      onChange={(e) => setFormData({ ...formData, vehiclename: e.target.value })}
                      required
                      disabled={loading}
                      placeholder="Enter vehicle name"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="vehicleNo" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Vehicle Number
                    </label>
                    <input
                      type="text"
                      id="vehicleNo"
                      className="form-input"
                      value={formData.vehicleno}
                      onChange={(e) => setFormData({ ...formData, vehicleno: e.target.value })}
                      disabled={loading}
                      placeholder="Enter vehicle number"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      disabled={loading}
                      style={{
                        padding: '10px 24px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '6px',
                        backgroundColor: '#fff',
                        color: '#666',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.target.style.borderColor = '#999';
                          e.target.style.color = '#333';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#e0e0e0';
                        e.target.style.color = '#666';
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: loading ? '#95a5a6' : '#2C3E50',
                        color: '#fff',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s',
                        boxShadow: loading ? 'none' : '0 2px 4px rgba(44, 62, 80, 0.2)'
                      }}
                      onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#34495e')}
                      onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2C3E50')}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner inline size="small" /> Saving...
                        </>
                      ) : editingVehicle ? 'Update Vehicle' : 'Create Vehicle'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

// Driver Details Management Section Component
const DriverManagementSection = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    drivername: '',
    licenseno: '',
    mobileno: '',
    type: '',
    isdelete: '0'
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';

  // Fetch all drivers
  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/driver?isdelete=0`);
      const data = await response.json();

      if (data.success) {
        setDrivers(data.drivers || data.data || []);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to fetch drivers' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please check if the backend server is running.' });
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load drivers on component mount and when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchTerm) {
        fetchDrivers();
      }
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Initial load
  useEffect(() => {
    fetchDrivers();
  }, []);

  // Handle form submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const query = editingDriver ? 2 : 1; // 1 = Insert, 2 = Update
      const url = editingDriver
        ? `${API_URL}/api/driver/${editingDriver.id}`
        : `${API_URL}/api/driver`;

      const method = editingDriver ? 'PUT' : 'POST';

      const requestBody = {
        drivername: formData.drivername,
        licenseno: formData.licenseno || '',
        mobileno: formData.mobileno || '',
        type: formData.type || '',
        isdelete: formData.isdelete || '0',
        query: query
      };

      if (editingDriver) {
        requestBody.id = editingDriver.id;
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingDriver ? 'Driver updated successfully!' : 'Driver created successfully!' });
        setShowModal(false);
        setEditingDriver(null);
        setFormData({
          drivername: '',
          licenseno: '',
          mobileno: '',
          type: '',
          isdelete: '0'
        });
        fetchDrivers();
      } else {
        setMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error saving driver:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/driver/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Driver deleted successfully!' });
        fetchDrivers();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete driver' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error deleting driver:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for editing
  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      drivername: driver.drivername || driver.Drivername || '',
      licenseno: driver.licenseno || driver.Licenseno || '',
      mobileno: driver.mobileno || driver.Mobileno || '',
      type: driver.type || driver.Type || '',
      isdelete: driver.isdelete || driver.Isdelete || '0'
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Open modal for creating new driver
  const handleAdd = () => {
    setEditingDriver(null);
    setFormData({
      drivername: '',
      licenseno: '',
      mobileno: '',
      type: '',
      isdelete: '0'
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDriver(null);
    setFormData({
      drivername: '',
      licenseno: '',
      mobileno: '',
      type: '',
      isdelete: '0'
    });
    setMessage({ type: '', text: '' });
  };

  // Filter drivers based on search term
  const filteredDrivers = searchTerm
    ? drivers.filter(d =>
      (d.drivername || d.Drivername || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.licenseno || d.Licenseno || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.mobileno || d.Mobileno || '').includes(searchTerm) ||
      (d.type || d.Type || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    : drivers;

  return (
    <div className="settings-section">
      <h2 className="section-title">Driver Details Management</h2>
      <p className="section-description">Create, update, and manage driver information.</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )
      }

      <div className="roles-actions">
        <button className="btn-primary" onClick={handleAdd} disabled={loading}>
          + Add New Driver
        </button>
        <input
          type="search"
          placeholder="Search drivers..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {
        loading && !drivers.length ? (
          <LoadingSpinner text="Loading drivers..." />
        ) : (
          <div className="roles-table">
            {filteredDrivers.length === 0 ? (
              <div className="empty-state">
                <p>No drivers found. Click "Add New Driver" to create one.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Driver Name</th>
                    <th>License No</th>
                    <th>Mobile No</th>
                    <th>Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.map((d) => (
                    <tr key={d.id || d.Id}>
                      <td>{d.id || d.Id}</td>
                      <td>
                        <strong>{d.drivername || d.Drivername}</strong>
                      </td>
                      <td>{d.licenseno || d.Licenseno || '-'}</td>
                      <td>{d.mobileno || d.Mobileno || '-'}</td>
                      <td>{d.type || d.Type || '-'}</td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Edit"
                          onClick={() => handleEdit(d)}
                          disabled={loading}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          title="Delete"
                          onClick={() => handleDelete(d.id || d.Id)}
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      }

      {/* Modal for Add/Edit Driver */}
      {
        showModal && (
          <div className="modal-overlay">
            <div className="modal-content responsive-modal modal-sm" style={{ padding: '0' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #2C3E50 0%, #34495e 100%)', color: '#fff', borderBottom: 'none' }}>
                <h3 style={{ color: '#fff', fontWeight: '600' }}>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</h3>
                <button
                  className="modal-close"
                  onClick={handleCloseModal}
                  style={{ color: '#fff', fontSize: '24px', fontWeight: '300' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '20px' }}>
                <form onSubmit={handleSubmit}>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="driverName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Driver Name <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="driverName"
                      className="form-input"
                      value={formData.drivername}
                      onChange={(e) => setFormData({ ...formData, drivername: e.target.value })}
                      required
                      disabled={loading}
                      placeholder="Enter driver name"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="licenseNo" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      License Number
                    </label>
                    <input
                      type="text"
                      id="licenseNo"
                      className="form-input"
                      value={formData.licenseno}
                      onChange={(e) => setFormData({ ...formData, licenseno: e.target.value })}
                      disabled={loading}
                      placeholder="Enter license number"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="mobileNo" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      id="mobileNo"
                      className="form-input"
                      value={formData.mobileno}
                      onChange={(e) => setFormData({ ...formData, mobileno: e.target.value })}
                      disabled={loading}
                      placeholder="Enter mobile number"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="driverType" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Type
                    </label>
                    <input
                      type="text"
                      id="driverType"
                      className="form-input"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      disabled={loading}
                      placeholder="Enter driver type"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2C3E50'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      disabled={loading}
                      style={{
                        padding: '10px 24px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '6px',
                        backgroundColor: '#fff',
                        color: '#666',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.target.style.borderColor = '#999';
                          e.target.style.color = '#333';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#e0e0e0';
                        e.target.style.color = '#666';
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: loading ? '#95a5a6' : '#2C3E50',
                        color: '#fff',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s',
                        boxShadow: loading ? 'none' : '0 2px 4px rgba(44, 62, 80, 0.2)'
                      }}
                      onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#34495e')}
                      onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2C3E50')}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner inline size="small" /> Saving...
                        </>
                      ) : editingDriver ? 'Update Driver' : 'Create Driver'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};


// Export the Dashboard component as the default export
export default Dashboard;

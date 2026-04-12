import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import './Dashboard.css';
import './AdminSettings.css';
import { handleLogout } from '../utils/logout';
import LoadingSpinner from './LoadingSpinner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Switch,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  InputAdornment
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import BarChartIcon from '@mui/icons-material/BarChart';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CategoryIcon from '@mui/icons-material/Category';
import BookIcon from '@mui/icons-material/Book';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PinIcon from '@mui/icons-material/Pin';
import EventIcon from '@mui/icons-material/Event';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import EngineeringIcon from '@mui/icons-material/Engineering';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ComputerIcon from '@mui/icons-material/Computer';
import UndoIcon from '@mui/icons-material/Undo';
import GroupIcon from '@mui/icons-material/Group';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';

const AdminSettings = () => {
  // Check if there's a section specified from Dashboard navigation
  const initialSection = localStorage.getItem('adminActiveSection') || 'profile';
  const [activeSection, setActiveSection] = useState(initialSection);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Get user from localStorage if available
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Clear the stored section after using it
  useEffect(() => {
    if (localStorage.getItem('adminActiveSection')) {
      localStorage.removeItem('adminActiveSection');
    }
  }, []);

  const settingsSections = [
    { id: 'profile', label: 'Profile', icon: <PersonIcon sx={{ color: '#fff' }} /> },
    { id: 'security', label: 'Security', icon: <SecurityIcon sx={{ color: '#fff' }} /> },
    { id: 'roles', label: 'Role Management', icon: <AdminPanelSettingsIcon sx={{ color: '#fff' }} /> },
    { id: 'permissions', label: 'Role Permissions', icon: <VpnKeyIcon sx={{ color: '#fff' }} /> },
    { id: 'reportpermissions', label: 'Report Permissions', icon: <BarChartIcon sx={{ color: '#fff' }} /> },
    { id: 'dashboardcontent', label: 'Dashboard Content View', icon: <BarChartIcon sx={{ color: '#fff' }} /> },
    { id: 'marketplace', label: 'Marketplace', icon: <StorefrontIcon sx={{ color: '#fff' }} /> },
    { id: 'modules', label: 'Modules & SubModules', icon: <CategoryIcon sx={{ color: '#fff' }} /> },
    { id: 'catalog', label: 'Catalog Management', icon: <BookIcon sx={{ color: '#fff' }} /> },
    { id: 'stocklocation', label: 'Stock Location', icon: <LocationOnIcon sx={{ color: '#fff' }} /> },
    { id: 'billformat', label: 'Bill Format', icon: <ReceiptIcon sx={{ color: '#fff' }} /> },
    { id: 'decimalformat', label: 'Decimal Format', icon: <PinIcon sx={{ color: '#fff' }} /> },
    { id: 'dateformat', label: 'Date Format', icon: <EventIcon sx={{ color: '#fff' }} /> },
    { id: 'paymentterms', label: 'Payment Terms', icon: <CreditCardIcon sx={{ color: '#fff' }} /> },
    { id: 'currency', label: 'Currency', icon: <AttachMoneyIcon sx={{ color: '#fff' }} /> },
    { id: 'vat', label: 'VAT Settings', icon: <ReceiptIcon sx={{ color: '#fff' }} /> },
    { id: 'stockcheck', label: 'Stock Check Set', icon: <CheckCircleIcon sx={{ color: '#fff' }} /> },
    { id: 'bankaccount', label: 'Bank Account', icon: <AccountBalanceIcon sx={{ color: '#fff' }} /> },
    { id: 'vehicle', label: 'Vehicle Details', icon: <DirectionsCarIcon sx={{ color: '#fff' }} /> },
    { id: 'driver', label: 'Driver Details', icon: <EngineeringIcon sx={{ color: '#fff' }} /> },
    { id: 'preferences', label: 'Preferences', icon: <SettingsIcon sx={{ color: '#fff' }} /> },
    { id: 'notifications', label: 'Notifications', icon: <NotificationsIcon sx={{ color: '#fff' }} /> },
    { id: 'system', label: 'System Settings', icon: <ComputerIcon sx={{ color: '#fff' }} /> },
    { id: 'salesreturn', label: 'Salesreturn Condition', icon: <UndoIcon sx={{ color: '#fff' }} /> },
    { id: 'chartofaccounts', label: 'Chart of Accounts', icon: <AccountBalanceIcon sx={{ color: '#fff' }} /> },
    { id: 'users', label: 'User Management', icon: <GroupIcon sx={{ color: '#fff' }} /> },
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection user={user} />;
      case 'security':
        return <SecuritySection />;
      case 'roles':
        return <RoleManagementSection />;
      case 'permissions':
        return <PermissionManagementSection />;
      case 'reportpermissions':
        return <ReportPermissionSection />;
      case 'dashboardcontent':
        return <DashboardContentViewSettingsSection />;
      case 'marketplace':
        return <MarketplaceManagementSection />;
      case 'modules':
        return <ModuleManagementSection />;
      case 'catalog':
        return <CatalogManagementSection />;
      case 'stocklocation':
        return <StockLocationManagementSection />;
      case 'billformat':
        return <BillFormatManagementSection />;
      case 'decimalformat':
        return <DecimalFormatManagementSection />;
      case 'paymentterms':
        return <PaymentTermsManagementSection />;
      case 'currency':
        return <CurrencyManagementSection />;
      case 'dateformat':
        return <DateFormatManagementSection />;
      case 'vat':
        return <VATManagementSection />;
      case 'stockcheck':
        return <StockCheckManagementSection />;
      case 'bankaccount':
        return <BankAccountManagementSection />;
      case 'vehicle':
        return <VehicleManagementSection />;
      case 'driver':
        return <DriverManagementSection />;
      case 'salesreturn':
        return <SalesReturnManagementSection />;
      case 'chartofaccounts':
        return <ChartOfAccountsSection />;
      case 'preferences':
        return <PreferencesSection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'system':
        return <SystemSection />;
      case 'users':
        return <UsersSection />;
      default:
        return <ProfileSection user={user} />;
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f1f5f9' }}>
      {/* Top Bar / AppBar */}
      <AppBar position="fixed" sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: '#fff',
        color: '#1e293b',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
              AGAdmin <span style={{ color: '#3b82f6' }}>Settings</span>
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{
              fontWeight: 600,
              color: '#64748b',
              bgcolor: '#f1f5f9',
              px: 2,
              py: 0.5,
              borderRadius: 20,
              display: { xs: 'none', md: 'block' }
            }}>
              {settingsSections.find(section => section.id === activeSection)?.label || 'Admin Settings'}
            </Typography>

            <Tooltip title="Back to Dashboard">
              <IconButton
                onClick={() => window.dispatchEvent(new CustomEvent('viewModeChange', { detail: { viewMode: 'dashboard' } }))}
                sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}
              >
                <DashboardIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pl: 2, borderLeft: '1px solid #e2e8f0' }}>
              <Avatar sx={{
                bgcolor: '#3b82f6',
                width: 32,
                height: 32,
                fontSize: '0.875rem',
                fontWeight: 600
              }}>
                {user.email ? user.email.charAt(0).toUpperCase() : 'A'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1 }}>
                  {user.email || 'Admin'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  System Administrator
                </Typography>
              </Box>
              <IconButton size="small" onClick={handleLogout} sx={{ color: '#ef4444' }}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar / Drawer */}
      <Drawer
        variant={typeof window !== 'undefined' && window.innerWidth < 600 ? "temporary" : "permanent"}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sx={{
          width: sidebarOpen ? 280 : 0,
          flexShrink: 0,
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            bgcolor: '#1e293b',
            color: '#fff',
            borderRight: 'none',
            overflowX: 'hidden',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', px: 2, py: 3 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', px: 2, mb: 2, display: 'block' }}>
            Main Menu
          </Typography>
          <List sx={{ gap: 0.5, display: 'flex', flexDirection: 'column' }}>
            {settingsSections.map((section) => (
              <ListItem key={section.id} disablePadding>
                <ListItemButton
                  selected={activeSection === section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    if (window.innerWidth < 600) setSidebarOpen(false);
                  }}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    color: activeSection === section.id ? '#fff' : '#94a3b8',
                    bgcolor: activeSection === section.id ? '#3b82f6 !important' : 'transparent',
                    '&:hover': {
                      bgcolor: activeSection === section.id ? '#2563eb !important' : 'rgba(255,255,255,0.05)',
                      color: '#fff'
                    },
                    '&.Mui-selected': {
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                    }
                  }}
                >
                  <ListItemIcon sx={{
                    minWidth: 40,
                    color: activeSection === section.id ? '#fff' : '#94a3b8'
                  }}>
                    {section.icon}
                  </ListItemIcon>
                  <ListItemText primary={section.label} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: activeSection === section.id ? 700 : 500 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box component="main" sx={{
        flexGrow: 1,
        width: { sm: `calc(100% - ${sidebarOpen ? 280 : 0}px)` },
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Toolbar />
        <Box sx={{
          p: { xs: 2, sm: 3, md: 4 },
          flexGrow: 1,
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <Paper elevation={0} sx={{
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            minHeight: '100%'
          }}>
            {renderSectionContent()}
          </Paper>
        </Box>
      </Box>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </Box>
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
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.6rem' }}>
          Profile Settings
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Manage your profile information and account details.
        </Typography>
      </Box>

      {message.text && (
        <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="User ID"
                fullWidth
                value={formData.userid}
                disabled
                sx={{ bgcolor: '#f8fafc' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Email Address"
                fullWidth
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="User">User</MenuItem>
                  <MenuItem value="Manager">Manager</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => setFormData({
                    userid: user.userid || '',
                    email: user.email || '',
                    role: user.role || '',
                    status: user.status || 'Active',
                  })}
                  sx={{ color: '#64748b', borderColor: '#e2e8f0' }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  sx={{ bgcolor: '#3b82f6', px: 4 }}
                >
                  {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      alert('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }, 1000);
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.6rem' }}>
          Security Settings
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Change your password and manage security settings.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#1e293b' }}>
              Change Password
            </Typography>
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  label="Current Password"
                  type="password"
                  fullWidth
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
                <TextField
                  label="New Password"
                  type="password"
                  fullWidth
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  helperText="Password must be at least 8 characters long."
                />
                <TextField
                  label="Confirm New Password"
                  type="password"
                  fullWidth
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
                <Box sx={{ pt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                    sx={{ bgcolor: '#3b82f6', px: 4, py: 1.2, borderRadius: 2, fontWeight: 600 }}
                  >
                    {saving ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
                  </Button>
                </Box>
              </Stack>
            </form>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Stack spacing={4}>
            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#1e293b' }}>
                Additional Security
              </Typography>
              <List disablePadding>
                <ListItem disablePadding sx={{ mb: 3 }}>
                  <ListItemText
                    primary="Two-Factor Authentication"
                    secondary="Add an extra layer of security to your account"
                    primaryTypographyProps={{ fontWeight: 600, color: '#1e293b' }}
                  />
                  <Switch color="primary" />
                </ListItem>
                <Divider sx={{ mb: 3 }} />
                <ListItem disablePadding>
                  <ListItemText
                    primary="Session Timeout"
                    secondary="Automatically log out after 30 minutes of inactivity"
                    primaryTypographyProps={{ fontWeight: 600, color: '#1e293b' }}
                  />
                  <Switch defaultChecked color="primary" />
                </ListItem>
              </List>
            </Paper>

            <Paper sx={{ p: 4, borderRadius: 3, bgcolor: '#fef2f2', border: '1px solid #fecaca' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#991b1b' }}>
                Login Activity
              </Typography>
              <Typography variant="body2" sx={{ color: '#b91c1c', mb: 2 }}>
                Last login: Today at 2:45 PM from 192.168.1.1
              </Typography>
              <Button variant="outlined" color="error" size="small" sx={{ textTransform: 'none' }}>
                Sign out of all sessions
              </Button>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

// Preferences Section Component
const PreferencesSection = () => {
  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.6rem' }}>
          Application Preferences
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Customize your application experience and regional settings.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <Stack spacing={3}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Localization</Typography>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select defaultValue="English" label="Language">
                  <MenuItem value="English">English</MenuItem>
                  <MenuItem value="Spanish">Spanish</MenuItem>
                  <MenuItem value="French">French</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Time Zone</InputLabel>
                <Select defaultValue="UTC" label="Time Zone">
                  <MenuItem value="UTC">UTC (Universal Time)</MenuItem>
                  <MenuItem value="EST">EST (Eastern Standard Time)</MenuItem>
                  <MenuItem value="PST">PST (Pacific Standard Time)</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <Stack spacing={3}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Display</Typography>
              <FormControl fullWidth>
                <InputLabel>Theme</InputLabel>
                <Select defaultValue="Light" label="Theme">
                  <MenuItem value="Light">Light Mode</MenuItem>
                  <MenuItem value="Dark">Dark Mode</MenuItem>
                  <MenuItem value="Auto">System Default</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Date Format</InputLabel>
                <Select defaultValue="MM/DD/YYYY" label="Date Format">
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" sx={{ bgcolor: '#3b82f6', px: 4 }}>Save Preferences</Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

// Notifications Section Component
const NotificationsSection = () => {
  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.6rem' }}>
          Notification Settings
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Manage how and when you receive notifications.
        </Typography>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <List disablePadding>
          <ListItem sx={{ px: 4, py: 3 }}>
            <ListItemText
              primary="Email Notifications"
              secondary="Receive notifications via email"
              primaryTypographyProps={{ fontWeight: 700, color: '#1e293b' }}
            />
            <Switch defaultChecked color="primary" />
          </ListItem>
          <Divider />
          <ListItem sx={{ px: 4, py: 3 }}>
            <ListItemText
              primary="Push Notifications"
              secondary="Receive push notifications in your browser"
              primaryTypographyProps={{ fontWeight: 700, color: '#1e293b' }}
            />
            <Switch color="primary" />
          </ListItem>
          <Divider />
          <ListItem sx={{ px: 4, py: 3 }}>
            <ListItemText
              primary="System Alerts"
              secondary="Receive alerts for system updates"
              primaryTypographyProps={{ fontWeight: 700, color: '#1e293b' }}
            />
            <Switch defaultChecked color="primary" />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

// System Section Component
const SystemSection = () => {
  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.6rem' }}>
          System Settings
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Configure system-wide settings and preferences.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#1e293b' }}>
              System Information
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>Version:</Typography>
                <Chip label="1.0.0" size="small" variant="outlined" sx={{ fontWeight: 700 }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>Last Update:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>2026-01-15</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>Status:</Typography>
                <Chip label="Stable" color="success" size="small" sx={{ fontWeight: 700 }} />
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#1e293b' }}>
              Database Settings
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>Connection Status:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e' }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#16a34a' }}>Connected</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>Server Host:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>DESKTOP-GANSHQJ\SQLEXPRESS</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>Port:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>1433</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Role Management Section Component
const RoleManagementSection = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ role: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

  // Fetch all roles
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const url = searchTerm
        ? `${API_URL}/api/role/search?term=${encodeURIComponent(searchTerm)}`
        : `${API_URL}/api/role`;

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

  // Initial load and search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRoles();
    }, searchTerm ? 500 : 0);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingRole ? `${API_URL}/api/role/${editingRole.id}` : `${API_URL}/api/role`;
      const method = editingRole ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
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
      setMessage({ type: 'error', text: 'Network error.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/role/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Role deleted successfully!' });
        fetchRoles();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({ role: role.role });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingRole(null);
    setFormData({ role: '' });
    setShowModal(true);
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100% ' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.6rem' }}>
          Role Management
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Create, update, and manage system roles.
        </Typography>
      </Box>

      {message.text && (
        <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, gap: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ bgcolor: '#3b82f6', textTransform: 'none', px: 3, py: 1.2, borderRadius: 2, fontWeight: 600 }}>
          Add New Role
        </Button>
        <TextField
          size="small"
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: '60%', bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#2c3e50', height: '56px' }}>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ID</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ROLE NAME</TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && !roles.length ? (
              <TableRow><TableCell colSpan={3} align="center" sx={{ py: 8 }}><CircularProgress size={40} /></TableCell></TableRow>
            ) : roles.map((role) => (
              <TableRow key={role.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                <TableCell sx={{ color: '#64748b' }}>{role.id}</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{role.role}</TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => handleEdit(role)} sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(role)} sx={{ color: '#2563eb', '&:hover': { bgcolor: '#d4e7fc' } }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDelete(role.id)} sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={showModal} onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowModal(false) } }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{editingRole ? 'Edit Role' : 'Add New Role'}</Typography>
          <IconButton size="small" onClick={() => setShowModal(false)} sx={{ color: '#fff' }}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ px: 3, pt: 4, pb: 2 }}>
            <TextField
              label="Role Name"
              fullWidth
              required
              value={formData.role}
              onChange={(e) => setFormData({ role: e.target.value })}
              placeholder="Enter role name"
              disabled={loading}
              autoFocus
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 3, borderTop: '1px solid #f1f5f9' }}>
            <Button onClick={() => setShowModal(false)} sx={{ color: '#64748b' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading} sx={{ bgcolor: '#3b82f6' }}>
              {loading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : (editingRole ? 'Update Role' : 'Create Role')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
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

  const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

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
          'Content-Type': 'application/json',
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
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.6rem' }}>
          Marketplace Management
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Create, update, and manage marketplaces.
        </Typography>
      </Box>

      {message.text && (
        <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, gap: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ bgcolor: '#3b82f6', textTransform: 'none', px: 3, py: 1.2, borderRadius: 2, fontWeight: 600 }}>
          Add New Marketplace
        </Button>
        <TextField
          size="small"
          placeholder="Search marketplaces..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: '60%', bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Box>

      {loading && !marketplaces.length ? (
        <LoadingSpinner text="Loading marketplaces..." />
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#2c3e50', height: '56px' }}>
                <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ID</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>MARKETPLACE NAME</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>STATUS</TableCell>
                <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && !marketplaces.length ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 8 }}><CircularProgress size={40} /></TableCell></TableRow>
              ) : marketplaces.map((m) => (
                <TableRow key={m.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                  <TableCell sx={{ color: '#64748b' }}>{m.id}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{m.marketplace}</TableCell>
                  <TableCell>
                    <Chip
                      label={m.status}
                      size="small"
                      color={m.status === 'Active' ? 'success' : 'default'}
                      sx={{ fontWeight: 600, borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => handleEdit(m)} sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(m)} sx={{ color: '#2563eb', '&:hover': { bgcolor: '#d4e7fc' } }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(m.id)} sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={showModal} onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowModal(false) } }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{editingMarketplace ? 'Edit Marketplace' : 'Add New Marketplace'}</Typography>
          <IconButton size="small" onClick={() => setShowModal(false)} sx={{ color: '#fff' }}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ px: 3, pt: 4, pb: 2 }}>
            <Stack spacing={3}>
              <TextField
                label="Marketplace Name"
                fullWidth
                required
                value={formData.marketplace}
                onChange={(e) => setFormData({ ...formData, marketplace: e.target.value })}
                placeholder="Enter marketplace name"
                disabled={loading}
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={loading}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 3, borderTop: '1px solid #f1f5f9' }}>
            <Button onClick={() => setShowModal(false)} sx={{ color: '#64748b' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading} sx={{ bgcolor: '#3b82f6' }}>
              {loading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : (editingMarketplace ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
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

  const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

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
          'Content-Type': 'application/json',
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
          'Content-Type': 'application/json',
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
    return subModules.filter(sm => sm.moduleId === moduleId);
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
            Module & SubModule Management
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Create and manage modules and their submodules.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingModule(null);
            setModuleFormData({ moduleName: '', status: 'Active' });
            setShowModuleModal(true);
            setMessage({ type: '', text: '' });
          }}
          disabled={loading}
          sx={{
            bgcolor: '#3b82f6',
            '&:hover': { bgcolor: '#2563eb' },
            textTransform: 'none',
            px: 3,
            borderRadius: 2,
            fontWeight: 600
          }}
        >
          Add New Module
        </Button>
      </Box>

      {message.text && (
        <Alert
          severity={message.type === 'error' ? 'error' : 'success'}
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      {loading && !modules.length ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress color="primary" />
            <Typography sx={{ color: '#64748b' }}>Loading modules...</Typography>
          </Stack>
        </Box>
      ) : (
        <Box>
          {modules.length === 0 ? (
            <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4, bgcolor: '#fff', border: '1px dashed #cbd5e1' }}>
              <ViewModuleIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#475569', mb: 1 }}>No modules found</Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>Click "Add New Module" to create one.</Typography>
            </Paper>
          ) : (
            modules.map((module) => {
              const moduleSubModules = getSubModulesForModule(module.id);
              const isExpanded = expandedModules.has(module.id);

              return (
                <Accordion
                  key={module.id}
                  expanded={isExpanded}
                  onChange={() => toggleModule(module.id)}
                  sx={{
                    mb: 2,
                    borderRadius: '12px !important',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    '&:before': { display: 'none' },
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: '#3b82f6' }} />}
                    sx={{
                      '&.Mui-expanded': { borderBottom: '1px solid #e2e8f0', minHeight: '64px' },
                      px: 3
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mr: 2 }}>
                      <ViewModuleIcon sx={{ color: '#3b82f6', mr: 2 }} />
                      <Typography sx={{ fontWeight: 700, color: '#1e293b', flexGrow: 1 }}>
                        {module.moduleName}
                      </Typography>
                      <Chip
                        label={module.status}
                        size="small"
                        sx={{
                          mr: 3,
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          bgcolor: module.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                          color: module.status === 'Active' ? '#166534' : '#64748b'
                        }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }} onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Add SubModule">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingSubModule(null);
                              setSubModuleFormData({ subModuleName: '', moduleId: module.id, status: 'Active' });
                              setShowSubModuleModal(true);
                              setMessage({ type: '', text: '' });
                            }}
                            sx={{ color: '#0ea5e9', '&:hover': { bgcolor: '#e0f2fe' } }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Module">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingModule(module);
                              setModuleFormData({ moduleName: module.moduleName, status: module.status || 'Active' });
                              setShowModuleModal(true);
                              setMessage({ type: '', text: '' });
                            }}
                            sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Module">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingModule(module);
                              setModuleFormData({ moduleName: module.moduleName, status: module.status || 'Active' });
                              setShowModuleModal(true);
                              setMessage({ type: '', text: '' });
                            }}
                            sx={{ color: '#2563eb', '&:hover': { bgcolor: '#d4e7fc' } }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Module">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteModule(module.id)}
                            sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0, bgcolor: '#f8fafc' }}>
                    {moduleSubModules.length === 0 ? (
                      <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                          No submodules for this module.
                        </Typography>
                      </Box>
                    ) : (
                      <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                              <TableCell sx={{ fontWeight: 700, color: '#64748b', pl: 8 }}>ID</TableCell>
                              <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>SubModule Name</TableCell>
                              <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Status</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', pr: 3 }}>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {moduleSubModules.map((subModule) => (
                              <TableRow key={subModule.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell sx={{ pl: 8, color: '#94a3b8' }}>{subModule.id}</TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <SubdirectoryArrowRightIcon sx={{ color: '#cbd5e1', fontSize: 16 }} />
                                    <Typography sx={{ fontWeight: 600, color: '#475569' }}>{subModule.subModuleName}</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={subModule.status}
                                    size="small"
                                    sx={{
                                      fontWeight: 600,
                                      height: 20,
                                      fontSize: '0.7rem',
                                      bgcolor: subModule.status === 'Active' ? '#f0fdf4' : '#f8fafc',
                                      color: subModule.status === 'Active' ? '#15803d' : '#64748b',
                                      border: `1px solid ${subModule.status === 'Active' ? '#dcfce7' : '#e2e8f0'}`
                                    }}
                                  />
                                </TableCell>
                                <TableCell align="right" sx={{ pr: 3 }}>
                                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    <Tooltip title="Edit SubModule">
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          setEditingSubModule(subModule);
                                          setSubModuleFormData({
                                            subModuleName: subModule.subModuleName,
                                            moduleId: subModule.moduleId,
                                            status: subModule.status || 'Active'
                                          });
                                          setShowSubModuleModal(true);
                                          setMessage({ type: '', text: '' });
                                        }}
                                        sx={{ color: '#8b5cf6' }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete SubModule">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteSubModule(subModule.id)}
                                        sx={{ color: '#ef4444' }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })
          )}
        </Box>
      )}

      {/* Module Modal */}
      <Dialog open={showModuleModal}
        onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { 
          setShowModuleModal(false);
          setEditingModule(null);
          setModuleFormData({ moduleName: '', status: 'Active } }});
          setMessage({ type: '', text: '' });
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ bgcolor: '#0f172a', color: '#fff', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {editingModule ? 'Edit Module' : 'Add New Module'}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setShowModuleModal(false)}
            sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleModuleSubmit}>
          <DialogContent sx={{ px: 3, pt: 4, pb: 2 }}>
            <Stack spacing={3}>
              <TextField
                label="Module Name"
                fullWidth
                required
                value={moduleFormData.moduleName}
                onChange={(e) => setModuleFormData({ ...moduleFormData, moduleName: e.target.value })}
                placeholder="e.g., Sales, Inventory, Reports"
                disabled={loading}
                autoFocus
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 2 }
                }}
              />
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  value={moduleFormData.status}
                  label="Status"
                  onChange={(e) => setModuleFormData({ ...moduleFormData, status: e.target.value })}
                  disabled={loading}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 3, borderTop: '1px solid #f1f5f9' }}>
            <Button
              onClick={() => setShowModuleModal(false)}
              sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                bgcolor: '#3b82f6',
                '&:hover': { bgcolor: '#2563eb' },
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 3
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  Saving...
                </>
              ) : (
                editingModule ? 'Update Module' : 'Create Module'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* SubModule Modal */}
      <Dialog open={showSubModuleModal}
        onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { 
          setShowSubModuleModal(false);
          setEditingSubModule(null);
          setSubModuleFormData({ subModuleName: '', moduleId: 0, status: 'Active } }});
          setMessage({ type: '', text: '' });
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ bgcolor: '#0f172a', color: '#fff', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {editingSubModule ? 'Edit SubModule' : 'Add New SubModule'}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setShowSubModuleModal(false)}
            sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubModuleSubmit}>
          <DialogContent sx={{ px: 3, pt: 4, pb: 2 }}>
            <Stack spacing={3}>
              <TextField
                label="SubModule Name"
                fullWidth
                required
                value={subModuleFormData.subModuleName}
                onChange={(e) => setSubModuleFormData({ ...subModuleFormData, subModuleName: e.target.value })}
                placeholder="e.g., Orders, Items, Daily Report"
                disabled={loading}
                autoFocus
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 2 }
                }}
              />
              <FormControl fullWidth required>
                <InputLabel>Parent Module</InputLabel>
                <Select
                  value={subModuleFormData.moduleId}
                  label="Parent Module"
                  onChange={(e) => setSubModuleFormData({ ...subModuleFormData, moduleId: parseInt(e.target.value) })}
                  disabled={loading}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value={0} disabled>Select a Module</MenuItem>
                  {modules.map((module) => (
                    <MenuItem key={module.id} value={module.id}>
                      {module.moduleName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  value={subModuleFormData.status}
                  label="Status"
                  onChange={(e) => setSubModuleFormData({ ...subModuleFormData, status: e.target.value })}
                  disabled={loading}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 3, borderTop: '1px solid #f1f5f9' }}>
            <Button
              onClick={() => setShowSubModuleModal(false)}
              sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                bgcolor: '#3b82f6',
                '&:hover': { bgcolor: '#2563eb' },
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 3
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  Saving...
                </>
              ) : (
                editingSubModule ? 'Update SubModule' : 'Create SubModule'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

// Permission Management Section Component
const PermissionManagementSection = () => {
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [subModules, setSubModules] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [expandedModules, setExpandedModules] = useState(new Set());

  const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

  const permissionTypes = ['Full Access', 'View', 'Create', 'Edit', 'Delete', 'Approve', 'All Record'];

  // Fetch roles
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

  // Fetch modules
  const fetchModules = async () => {
    try {
      const response = await fetch(`${API_URL}/api/module`);
      const data = await response.json();
      if (data.success) {
        setModules(data.modules || []);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  // Fetch submodules
  const fetchSubModules = async () => {
    try {
      const response = await fetch(`${API_URL}/api/submodule`);
      const data = await response.json();
      if (data.success) {
        setSubModules(data.subModules || []);
      }
    } catch (error) {
      console.error('Error fetching submodules:', error);
    }
  };

  // Fetch permissions for selected role
  const fetchPermissions = async (roleId) => {
    if (!roleId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/permission/role/${roleId}`);
      const data = await response.json();
      if (data.success) {
        setPermissions(data.permissions || []);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to fetch permissions' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please check if the backend server is running.' });
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchRoles();
    fetchModules();
    fetchSubModules();
  }, []);

  // Fetch permissions when role changes
  useEffect(() => {
    if (selectedRole) {
      fetchPermissions(selectedRole);
    } else {
      setPermissions([]);
    }
  }, [selectedRole]);

  // Get permission for a module/submodule
  const getPermission = (moduleId, subModuleId = null) => {
    return permissions.find(p =>
      p.moduleId === moduleId &&
      (subModuleId === null ? p.subModuleId === null : p.subModuleId === subModuleId)
    );
  };

  // Save permission
  const savePermission = async (moduleId, subModuleId, permissionType) => {
    if (!selectedRole) {
      setMessage({ type: 'error', text: 'Please select a role first' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const existingPermission = getPermission(moduleId, subModuleId);
      const url = existingPermission
        ? `${API_URL}/api/permission/${existingPermission.id}`
        : `${API_URL}/api/permission`;

      const method = existingPermission ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleId: selectedRole,
          moduleId: moduleId,
          subModuleId: subModuleId || null,
          permissionType: permissionType,
          status: 'Active',
          query: existingPermission ? 2 : 1
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: existingPermission ? 'Permission updated!' : 'Permission created!' });
        fetchPermissions(selectedRole);
      } else {
        setMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error saving permission:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete permission
  const deletePermission = async (permissionId) => {
    if (!window.confirm('Are you sure you want to delete this permission?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/permission/${permissionId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Permission deleted successfully!' });
        fetchPermissions(selectedRole);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete permission' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error deleting permission:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // Get submodules for a module
  const getSubModulesForModule = (moduleId) => {
    return subModules.filter(sm => sm.moduleId === moduleId);
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
          Role-Based Permissions
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Manage permissions for modules and submodules by role.
        </Typography>
      </Box>

      {message.text && (
        <Alert
          severity={message.type === 'error' ? 'error' : 'success'}
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      <Paper sx={{ p: 4, mb: 4, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
        <FormControl fullWidth sx={{ maxWidth: 400 }}>
          <InputLabel id="role-select-label">Select Role</InputLabel>
          <Select
            labelId="role-select-label"
            id="roleSelect"
            value={selectedRole || ''}
            label="Select Role"
            onChange={(e) => setSelectedRole(e.target.value ? parseInt(e.target.value) : null)}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="">
              <em>-- Select a Role --</em>
            </MenuItem>
            {roles.map((role) => (
              <MenuItem key={role.id} value={role.id}>
                {role.role}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {!selectedRole ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4, bgcolor: '#fff', border: '1px dashed #cbd5e1' }}>
          <Typography variant="h6" sx={{ color: '#94a3b8' }}>
            Please select a role to manage its permissions.
          </Typography>
        </Paper>
      ) : loading && permissions.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress color="primary" />
            <Typography sx={{ color: '#64748b' }}>Loading permissions...</Typography>
          </Stack>
        </Box>
      ) : (
        <Box>
          {modules.length === 0 ? (
            <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4, bgcolor: '#fff', border: '1px dashed #cbd5e1' }}>
              <Typography variant="h6" sx={{ color: '#94a3b8' }}>No modules found. Please create modules first.</Typography>
            </Paper>
          ) : (
            modules.map((module) => {
              const modulePermission = getPermission(module.id, null);
              const moduleSubModules = getSubModulesForModule(module.id);
              const isExpanded = expandedModules.has(module.id);

              return (
                <Accordion
                  key={module.id}
                  expanded={isExpanded}
                  onChange={() => toggleModule(module.id)}
                  sx={{
                    mb: 2,
                    borderRadius: '12px !important',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    '&:before': { display: 'none' },
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0'
                  }}
                  disabled={loading || moduleSubModules.length === 0}
                >
                  <AccordionSummary
                    expandIcon={moduleSubModules.length > 0 ? <ExpandMoreIcon sx={{ color: '#3b82f6' }} /> : null}
                    sx={{
                      '&.Mui-expanded': { borderBottom: '1px solid #e2e8f0', minHeight: '64px' },
                      px: 3
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mr: 2 }}>
                      <ViewModuleIcon sx={{ color: '#3b82f6', mr: 2 }} />
                      <Typography sx={{ fontWeight: 700, color: '#1e293b', flexGrow: 1 }}>
                        {module.moduleName}
                        {modulePermission && (
                          <Chip
                            label={modulePermission.permissionType}
                            size="small"
                            sx={{ ml: 2, fontWeight: 600, fontSize: '0.7rem', height: 20, bgcolor: '#eff6ff', color: '#1d4ed8' }}
                          />
                        )}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                          <Select
                            value={modulePermission?.permissionType || ''}
                            displayEmpty
                            onChange={(e) => savePermission(module.id, null, e.target.value)}
                            disabled={loading}
                            sx={{
                              borderRadius: 2,
                              fontSize: '0.875rem',
                              bgcolor: '#f8fafc',
                              '& .MuiSelect-select': { py: 1 }
                            }}
                          >
                            <MenuItem value="">-- No Permission --</MenuItem>
                            {permissionTypes.map((type) => (
                              <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        {modulePermission && (
                          <IconButton
                            size="small"
                            onClick={() => deletePermission(modulePermission.id)}
                            disabled={loading}
                            sx={{ color: '#ef4444' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0, bgcolor: '#f8fafc' }}>
                    {moduleSubModules.length > 0 && (
                      <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                              <TableCell sx={{ fontWeight: 700, color: '#64748b', pl: 8 }}>SubModule Name</TableCell>
                              <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Permission Type</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', pr: 3 }}>Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {moduleSubModules.map((subModule) => {
                              const subModulePermission = getPermission(module.id, subModule.id);
                              return (
                                <TableRow key={subModule.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                  <TableCell sx={{ pl: 8 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <SubdirectoryArrowRightIcon sx={{ color: '#cbd5e1', fontSize: 16 }} />
                                      <Typography sx={{ fontWeight: 600, color: '#475569' }}>{subModule.subModuleName}</Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <FormControl size="small" sx={{ minWidth: 180 }}>
                                      <Select
                                        value={subModulePermission?.permissionType || ''}
                                        displayEmpty
                                        onChange={(e) => savePermission(module.id, subModule.id, e.target.value)}
                                        disabled={loading}
                                        sx={{
                                          borderRadius: 2,
                                          fontSize: '0.8rem',
                                          bgcolor: '#fff',
                                          '& .MuiSelect-select': { py: 0.5 }
                                        }}
                                      >
                                        <MenuItem value="">-- No Permission --</MenuItem>
                                        {permissionTypes.map((type) => (
                                          <MenuItem key={type} value={type}>{type}</MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </TableCell>
                                  <TableCell align="right" sx={{ pr: 3 }}>
                                    {subModulePermission && (
                                      <IconButton
                                        size="small"
                                        onClick={() => deletePermission(subModulePermission.id)}
                                        disabled={loading}
                                        sx={{ color: '#ef4444' }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })
          )}
        </Box>
      )}
    </Box>
  );
};


const ReportPermissionSection = () => {
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [reportPermissions, setReportPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

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
        // Backend BIT might return as 1/0 or true/false, JS find will handle both if we are careful
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

            <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', border: '1px solid #e2e8f0' }}>
                <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={8} lg={6}>
                            <FormControl fullWidth>
                                <InputLabel id="admin-report-role-label">Select Role to Configure Permissions</InputLabel>
                                <Select
                                    labelId="admin-report-role-label"
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

// Users Section Component
const UsersSection = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [catalogs, setCatalogs] = useState([]);
  const [stockLocations, setStockLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    userid: '',
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    password: '',
    role: '',
    catelogid: '',
    warehouseid: '',
    status: 'Active',
    profile_image: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

  // Pagination & Export State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter users based on search term
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

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredUsers.map(user => ({
      UserId: user.userid,
      Name: `${user.firstname || ''} ${user.lastname || ''}`.trim(),
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

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("User List", 20, 10);
    doc.autoTable({
      head: [['User ID', 'Name', 'Email', 'Phone', 'Role', 'Status']],
      body: filteredUsers.map(user => [
        user.userid,
        `${user.firstname || ''} ${user.lastname || ''}`.trim(),
        user.email,
        user.phone,
        user.role,
        user.status
      ]),
    });
    doc.save("Users.pdf");
  };

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/user`);
      const data = await response.json();

      // Handle both PascalCase (C# convention) and camelCase property names
      const success = data.success ?? data.Success ?? false;
      if (success) {
        const usersList = data.users || data.Users || [];
        setUsers(usersList);
        console.log('Fetched users:', usersList);
      } else {
        const errorMessage = data.message || data.Message || 'Failed to fetch users';
        setMessage({ type: 'error', text: errorMessage });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please check if the backend server is running.' });
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch roles
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

  // Load data on component mount
  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchCatalogs();
    fetchStockLocations();
  }, []);



  // Handle form submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Convert role ID to role name for backend
      const roleId = formData.role;
      const selectedRole = roles.find(r => String(r.id) === String(roleId));
      const roleName = selectedRole ? selectedRole.role : '';

      const requestBody = {
        Id: editingUser ? (editingUser.id || editingUser.Id || null) : null,
        Userid: formData.userid,
        Firstname: formData.firstname,
        Lastname: formData.lastname,
        Email: formData.email,
        Phone: formData.phone || null,
        Password: formData.password || (editingUser ? null : ''),
        Role: roleName, // Send role name, not ID
        Catelogid: formData.catelogid ? String(formData.catelogid) : null,
        Warehouseid: formData.warehouseid ? String(formData.warehouseid) : null,
        Status: formData.status || 'Active',
        Profile_image: formData.profile_image || null
      };

      console.log('Submitting user data:', requestBody);

      const response = await fetch(`${API_URL}/api/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('API response:', data);

      // Handle both PascalCase and camelCase
      const success = data.success ?? data.Success ?? false;
      if (success) {
        const successMessage = editingUser ? 'User updated successfully!' : 'User created successfully!';
        setMessage({ type: 'success', text: successMessage });
        setShowModal(false);
        setEditingUser(null);
        setFormData({
          userid: '',
          firstname: '',
          lastname: '',
          email: '',
          phone: '',
          password: '',
          role: '',
          catelogid: '',
          warehouseid: '',
          status: 'Active',
          profile_image: ''
        });
        // Refresh the user list
        await fetchUsers();
      } else {
        const errorMessage = data.message || data.Message || 'Operation failed';
        setMessage({ type: 'error', text: errorMessage });
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

      // Handle both PascalCase and camelCase
      const success = data.success ?? data.Success ?? false;
      if (success) {
        setMessage({ type: 'success', text: 'User deleted successfully!' });
        await fetchUsers();
      } else {
        const errorMessage = data.message || data.Message || 'Failed to delete user';
        setMessage({ type: 'error', text: errorMessage });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error deleting user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for editing
  const handleEdit = (user) => {
    setEditingUser(user);
    // Find role ID from role name for the dropdown
    const userRole = user.role || user.Role || '';
    const roleId = roles.find(r => r.role === userRole)?.id || '';
    setFormData({
      userid: user.userid || user.Userid || '',
      firstname: user.firstname || user.Firstname || '',
      lastname: user.lastname || user.Lastname || '',
      email: user.email || user.Email || '',
      phone: user.phone || user.Phone || '',
      password: '', // Don't populate password
      role: roleId ? String(roleId) : '', // Store role ID for dropdown
      catelogid: (user.catelogid || user.Catelogid) ? String(user.catelogid || user.Catelogid) : '',
      warehouseid: (user.warehouseid || user.Warehouseid) ? String(user.warehouseid || user.Warehouseid) : '',
      status: user.status || user.Status || 'Active',
      profile_image: user.profile_image || user.Profile_image || ''
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Open modal for creating new user
  const handleAdd = () => {
    setEditingUser(null);

    // Find the highest numeric part among ASAS IDs
    let nextNum = 1;
    if (users && users.length > 0) {
      const nums = users
        .map(u => u.userid || u.Userid || '')
        .filter(id => id.startsWith('ASAS'))
        .map(id => {
          const match = id.match(/\d+/); // Find the number part
          return match ? parseInt(match[0], 10) : 0;
        })
        .filter(num => num < 10000); // Filter out timestamp-like numbers

      if (nums.length > 0) {
        nextNum = Math.max(...nums) + 1;
      }
    }

    const newUserId = `ASAS${String(nextNum).padStart(4, '0')}`;

    setFormData({
      userid: newUserId,
      firstname: '',
      lastname: '',
      email: '',
      phone: '',
      password: '',
      role: '',
      catelogid: '',
      warehouseid: '',
      status: 'Active',
      profile_image: ''
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };
  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      userid: '',
      firstname: '',
      lastname: '',
      email: '',
      phone: '',
      password: '',
      role: '',
      catelogid: '',
      warehouseid: '',
      status: 'Active',
      profile_image: ''
    });
    setMessage({ type: '', text: '' });
  };

  // Get catalog name by ID
  const getCatalogName = (id) => {
    if (!id) return '-';
    const catalog = catalogs.find(c =>
      (c.Id && c.Id === parseInt(id)) ||
      (c.id && c.id === parseInt(id))
    );
    return catalog ? (catalog.Catelogname || catalog.catelogname || '') : id || '-';
  };

  // Get warehouse location name by ID
  const getWarehouseName = (id) => {
    if (!id) return '-';
    const location = stockLocations.find(l =>
      (l.Id && l.Id === parseInt(id)) ||
      (l.id && l.id === parseInt(id))
    );
    return location ? (location.Name || location.name || '') : id || '-';
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.6rem' }}>
            User Management
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Manage system users, their roles, and access locations.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={exportToExcel}
            startIcon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
            sx={{ color: '#166534', borderColor: '#bbf7d0', '&:hover': { bgcolor: '#f0fdf4', borderColor: '#86efac' }, textTransform: 'none', borderRadius: 2 }}
          >
            Excel
          </Button>
          <Button
            variant="outlined"
            onClick={exportToPDF}
            startIcon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
            sx={{ color: '#991b1b', borderColor: '#fecaca', '&:hover': { bgcolor: '#fef2f2', borderColor: '#fca5a5' }, textTransform: 'none', borderRadius: 2 }}
          >
            PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, textTransform: 'none', px: 3, py: 1, borderRadius: 2, fontWeight: 700 }}
          >
            Add New User
          </Button>
        </Stack>
      </Box>

      {message.text && (
        <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Paper sx={{ mb: 4, p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', bgcolor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by name, ID, email or role..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1 }} />,
            sx: { borderRadius: 2 }
          }}
          sx={{ maxWidth: 500 }}
        />
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#1e293b' }}>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>USER</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>USER ID</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>LOGIN INFO</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>ROLE</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>LOCATION</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>STATUS</TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && !users.length ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
            ) : currentItems.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8 }}><Typography color="textSecondary">No users found.</Typography></TableCell></TableRow>
            ) : (
              currentItems.map((user) => (
                <TableRow key={user.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={user.profile_image || user.Profile_image}
                        sx={{ width: 40, height: 40, bgcolor: '#f1f5f9', color: '#3b82f6', fontWeight: 800, fontSize: '1rem' }}
                      >
                        {(user.firstname || 'U').charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>
                          {`${user.firstname || ''} ${user.lastname || ''}`.trim() || '-'}
                        </Typography>
                        <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                          Registered: {user.dateofregister || user.Dateofregister || '-'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#3b82f6' }}>{user.userid || '-'}</TableCell>
                  <TableCell>
                    <Typography sx={{ color: '#1e293b', fontSize: '0.875rem' }}>{user.email || '-'}</Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>{user.phone || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={user.role || '-'} size="small" sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }} />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ color: '#1e293b', fontSize: '0.875rem', fontWeight: 500 }}>
                      Cat: {getCatalogName(user.catelogid)}
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                      WH: {getWarehouseName(user.warehouseid)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.status || 'Active'}
                      size="small"
                      color={user.status === 'Active' ? 'success' : 'default'}
                      variant={user.status === 'Active' ? 'filled' : 'outlined'}
                      sx={{ fontWeight: 700, minWidth: 70 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => handleEdit(user)} sx={{ color: '#64748b' }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(user)} sx={{ color: '#2563eb' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(user.id)} sx={{ color: '#dc2626' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          Showing {filteredUsers.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} entries
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              sx={{ borderRadius: 2, fontSize: '0.875rem' }}
            >
              <MenuItem value={10}>10 / page</MenuItem>
              <MenuItem value={20}>20 / page</MenuItem>
              <MenuItem value={50}>50 / page</MenuItem>
              <MenuItem value={100}>100 / page</MenuItem>
            </Select>
          </FormControl>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(e, p) => paginate(p)}
            color="primary"
            shape="rounded"
            size="medium"
          />
        </Stack>
      </Box>

      {/* Modal for Add/Edit User */}
      <Dialog open={showModal}
        onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { handleCloseModal(event, reason); } }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ bgcolor: '#0f172a', color: '#fff', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{editingUser ? 'Edit User Details' : 'Create New User'}</Typography>
          <IconButton onClick={handleCloseModal} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ px: 3, py: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="User ID"
                  fullWidth
                  required
                  value={formData.userid}
                  onChange={(e) => setFormData({ ...formData, userid: e.target.value })}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Profile Image URL"
                  fullWidth
                  value={formData.profile_image}
                  onChange={(e) => setFormData({ ...formData, profile_image: e.target.value })}
                  placeholder="https://... or data:image/..."
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  required
                  value={formData.firstname}
                  onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  required
                  value={formData.lastname}
                  onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Phone Number"
                  fullWidth
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={loading}
                />
              </Grid>

              {!editingUser && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Password"
                    type="password"
                    fullWidth
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={loading}
                  />
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role || ''}
                    label="Role"
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    disabled={loading}
                  >
                    {roles.map(role => (
                      <MenuItem key={role.id} value={role.id}>{role.role}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Catalog Access</InputLabel>
                  <Select
                    value={formData.catelogid || ''}
                    label="Catalog Access"
                    onChange={(e) => setFormData({ ...formData, catelogid: e.target.value })}
                    disabled={loading}
                  >
                    <MenuItem value="">None</MenuItem>
                    {catalogs.map(catalog => (
                      <MenuItem key={catalog.Id || catalog.id} value={String(catalog.Id || catalog.id)}>
                        {catalog.Catelogname || catalog.catelogname}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Warehouse Location</InputLabel>
                  <Select
                    value={formData.warehouseid || ''}
                    label="Warehouse Location"
                    onChange={(e) => setFormData({ ...formData, warehouseid: e.target.value })}
                    disabled={loading}
                  >
                    <MenuItem value="">None</MenuItem>
                    {stockLocations.map(location => (
                      <MenuItem key={location.Id || location.id} value={String(location.Id || location.id)}>
                        {location.Name || location.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Account Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Account Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    disabled={loading}
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                    <MenuItem value="Suspended">Suspended</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 3, borderTop: '1px solid #f1f5f9' }}>
            <Button onClick={handleCloseModal} sx={{ color: '#64748b', fontWeight: 600 }}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ bgcolor: '#3b82f6', px: 4, fontWeight: 700, borderRadius: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : (editingUser ? 'Update User' : 'Create User')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
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

  const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

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
      if (searchTerm) {
        const filtered = catalogs.filter(catalog =>
          catalog.catelogname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          catalog.status?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        // For now, we'll just filter client-side
        // In production, you might want a search endpoint
      } else {
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
          'Content-Type': 'application/json',
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
      catelogname: catalog.catelogname || '',
      status: catalog.status || 'Active'
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
      catalog.catelogname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      catalog.status?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : catalogs;

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.6rem' }}>
          Catalog Management
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Create, update, and manage system catalogs.
        </Typography>
      </Box>

      {message.text && (
        <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, gap: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ bgcolor: '#3b82f6', textTransform: 'none', px: 3, py: 1.2, borderRadius: 2, fontWeight: 600 }}>
          Add New Catalog
        </Button>
        <TextField
          size="small"
          placeholder="Search catalogs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: '60%', bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#2c3e50', height: '56px' }}>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ID</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>CATALOG NAME</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>STATUS</TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && !catalogs.length ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 8 }}><CircularProgress size={40} /></TableCell></TableRow>
            ) : filteredCatalogs.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 8 }}><Typography sx={{ color: '#64748b' }}>No catalogs found.</Typography></TableCell></TableRow>
            ) : (
              filteredCatalogs.map((catalog) => (
                <TableRow key={catalog.id || catalog.Id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                  <TableCell sx={{ color: '#64748b' }}>{catalog.id || catalog.Id}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{catalog.catelogname || catalog.Catelogname}</TableCell>
                  <TableCell>
                    <Chip
                      label={catalog.status || catalog.Status || 'Active'}
                      size="small"
                      color={(catalog.status || catalog.Status) === 'Active' ? 'success' : 'default'}
                      sx={{ fontWeight: 600, borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => handleEdit(catalog)} sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(catalog)} sx={{ color: '#2563eb', '&:hover': { bgcolor: '#d4e7fc' } }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(catalog.id || catalog.Id)} sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={showModal} onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowModal(false) } }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{editingCatalog ? 'Edit Catalog' : 'Add New Catalog'}</Typography>
          <IconButton size="small" onClick={() => setShowModal(false)} sx={{ color: '#fff' }}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ px: 3, pt: 4, pb: 2 }}>
            <Stack spacing={3}>
              <TextField
                label="Catalog Name"
                fullWidth
                required
                value={formData.catelogname}
                onChange={(e) => setFormData({ ...formData, catelogname: e.target.value })}
                placeholder="e.g., Computers, Electronics"
                disabled={loading}
                autoFocus
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={loading}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 3, borderTop: '1px solid #f1f5f9' }}>
            <Button onClick={() => setShowModal(false)} sx={{ color: '#64748b' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading} sx={{ bgcolor: '#3b82f6' }}>
              {loading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : (editingCatalog ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
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

  const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

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
          'Content-Type': 'application/json',
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
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.6rem' }}>
          Stock Location Management
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Create, update, and manage stock locations and warehouses.
        </Typography>
      </Box>

      {message.text && (
        <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, gap: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ bgcolor: '#3b82f6', textTransform: 'none', px: 3, py: 1.2, borderRadius: 2, fontWeight: 600 }}>
          Add New Stock Location
        </Button>
        <TextField
          size="small"
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: '60%', bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#2c3e50', height: '56px' }}>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ID</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>NAME</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>WAREHOUSE ID</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>TYPE</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ADDRESS</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>STATUS</TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && !stockLocations.length ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8 }}><CircularProgress size={40} /></TableCell></TableRow>
            ) : filteredStockLocations.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8 }}><Typography sx={{ color: '#64748b' }}>No stock locations found.</Typography></TableCell></TableRow>
            ) : (
              filteredStockLocations.map((location) => (
                <TableRow key={location.id || location.Id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                  <TableCell sx={{ color: '#64748b' }}>{location.id || location.Id}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{location.name || location.Name}</TableCell>
                  <TableCell sx={{ color: '#64748b' }}>{location.warehouseid || location.Warehouseid || '-'}</TableCell>
                  <TableCell sx={{ color: '#64748b' }}>{location.type || location.Type || '-'}</TableCell>
                  <TableCell sx={{ color: '#64748b', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {location.locationaddress || location.Locationaddress || '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={location.status || location.Status || 'Active'}
                      size="small"
                      color={(location.status || location.Status) === 'Active' ? 'success' : 'default'}
                      sx={{ fontWeight: 600, borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => handleEdit(location)} sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(location)} sx={{ color: '#2563eb', '&:hover': { bgcolor: '#d4e7fc' } }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(location.id || location.Id)} sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={showModal} onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowModal(false) } }} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{editingStockLocation ? 'Edit Stock Location' : 'Add New Stock Location'}</Typography>
          <IconButton size="small" onClick={() => setShowModal(false)} sx={{ color: '#fff' }}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ px: 3, pt: 4, pb: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Name"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter location name"
                  disabled={loading}
                  autoFocus
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Warehouse ID"
                  fullWidth
                  value={formData.warehouseid}
                  onChange={(e) => setFormData({ ...formData, warehouseid: e.target.value })}
                  placeholder="Enter warehouse ID"
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Type"
                  fullWidth
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="Enter type"
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Parent Stock ID"
                  fullWidth
                  value={formData.parentstockid}
                  onChange={(e) => setFormData({ ...formData, parentstockid: e.target.value })}
                  placeholder="Enter parent stock ID"
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Location Address"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.locationaddress}
                  onChange={(e) => setFormData({ ...formData, locationaddress: e.target.value })}
                  placeholder="Enter location address"
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Is Default</InputLabel>
                  <Select
                    value={formData.isdefault}
                    label="Is Default"
                    onChange={(e) => setFormData({ ...formData, isdefault: e.target.value })}
                    disabled={loading}
                  >
                    <MenuItem value="0">No</MenuItem>
                    <MenuItem value="1">Yes</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Is Dispatch</InputLabel>
                  <Select
                    value={formData.isdispatch}
                    label="Is Dispatch"
                    onChange={(e) => setFormData({ ...formData, isdispatch: e.target.value })}
                    disabled={loading}
                  >
                    <MenuItem value="0">No</MenuItem>
                    <MenuItem value="1">Yes</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    disabled={loading}
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 3, borderTop: '1px solid #f1f5f9' }}>
            <Button onClick={() => setShowModal(false)} sx={{ color: '#64748b' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading} sx={{ bgcolor: '#3b82f6' }}>
              {loading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : (editingStockLocation ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
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

  const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

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
          'Content-Type': 'application/json',
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
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.6rem' }}>
          Bill Format Management
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Create, update, and manage bill formats (e.g., Bill, Receipt).
        </Typography>
      </Box>

      {message.text && (
        <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, gap: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ bgcolor: '#3b82f6', textTransform: 'none', px: 3, py: 1.2, borderRadius: 2, fontWeight: 600 }}>
          Add New Bill Format
        </Button>
        <TextField
          size="small"
          placeholder="Search bill formats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: '60%', bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#2c3e50', height: '56px' }}>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ID</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>TYPE</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>FORMAT</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>STATUS</TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && !billFormats.length ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}><CircularProgress size={40} /></TableCell></TableRow>
            ) : filteredBillFormats.map((billFormat) => (
              <TableRow key={billFormat.id || billFormat.Id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                <TableCell sx={{ color: '#64748b' }}>{billFormat.id || billFormat.Id}</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{billFormat.type || billFormat.Type}</TableCell>
                <TableCell>
                  <Chip
                    label={billFormat.format || billFormat.Format}
                    size="small"
                    sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={billFormat.status || billFormat.Status || 'Active'}
                    size="small"
                    color={(billFormat.status || billFormat.Status) === 'Active' ? 'success' : 'default'}
                    sx={{ fontWeight: 600, borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => handleEdit(billFormat)} sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(billFormat)} sx={{ color: '#2563eb', '&:hover': { bgcolor: '#d4e7fc' } }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDelete(billFormat.id || billFormat.Id)} sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={showModal} onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowModal(false) } }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{editingBillFormat ? 'Edit Bill Format' : 'Add New Bill Format'}</Typography>
          <IconButton size="small" onClick={() => setShowModal(false)} sx={{ color: '#fff' }}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ px: 3, pt: 4, pb: 2 }}>
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  disabled={loading}
                >
                  <MenuItem value="Bill">Bill</MenuItem>
                  <MenuItem value="Receipt">Receipt</MenuItem>
                  <MenuItem value="Invoice">Invoice</MenuItem>
                  <MenuItem value="Quotation">Quotation</MenuItem>
                  <MenuItem value="Purchase Order">Purchase Order</MenuItem>
                  <MenuItem value="Delivery Note">Delivery Note</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Format"
                fullWidth
                required
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                placeholder="e.g., AGT-{yyyy}{mm}XXXX"
                helperText="Format placeholders: {yyyy} = Year, {mm} = Month, XXXX = Sequential number"
                disabled={loading}
                InputProps={{ sx: { fontFamily: 'monospace' } }}
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={loading}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 3, borderTop: '1px solid #f1f5f9' }}>
            <Button onClick={() => setShowModal(false)} sx={{ color: '#64748b' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading} sx={{ bgcolor: '#3b82f6' }}>
              {loading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : (editingBillFormat ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
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

  const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

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
          'Content-Type': 'application/json',
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
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.6rem' }}>
          Decimal Format Management
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Create, update, and manage decimal formats for number display (e.g., 0.00, #,##0.00).
        </Typography>
      </Box>

      {message.text && (
        <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, gap: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ bgcolor: '#3b82f6', textTransform: 'none', px: 3, py: 1.2, borderRadius: 2, fontWeight: 600 }}>
          Add New Decimal Format
        </Button>
        <TextField
          size="small"
          placeholder="Search decimal formats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: '60%', bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#2c3e50', height: '56px' }}>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ID</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>DECIMAL FORMAT</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>DECIMAL COUNT</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>STATUS</TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && !decimalFormats.length ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}><CircularProgress size={40} /></TableCell></TableRow>
            ) : filteredDecimalFormats.map((decimalFormat) => (
              <TableRow key={decimalFormat.id || decimalFormat.Id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                <TableCell sx={{ color: '#64748b' }}>{decimalFormat.id || decimalFormat.Id}</TableCell>
                <TableCell>
                  <Chip
                    label={decimalFormat.decimalformat || decimalFormat.Decimalformat}
                    size="small"
                    sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b', pl: 4 }}>{decimalFormat.decimalcount || decimalFormat.Decimalcount}</TableCell>
                <TableCell>
                  <Chip
                    label={decimalFormat.status || decimalFormat.Status || 'Active'}
                    size="small"
                    color={(decimalFormat.status || decimalFormat.Status) === 'Active' ? 'success' : 'default'}
                    sx={{ fontWeight: 600, borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => handleEdit(decimalFormat)} sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(decimalFormat)} sx={{ color: '#2563eb', '&:hover': { bgcolor: '#d4e7fc' } }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDelete(decimalFormat.id || decimalFormat.Id)} sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={showModal} onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowModal(false) } }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{editingDecimalFormat ? 'Edit Decimal Format' : 'Add New Decimal Format'}</Typography>
          <IconButton size="small" onClick={() => setShowModal(false)} sx={{ color: '#fff' }}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ px: 3, pt: 4, pb: 2 }}>
            <Stack spacing={3}>
              <TextField
                label="Decimal Format"
                fullWidth
                required
                value={formData.decimalformat}
                onChange={(e) => setFormData({ ...formData, decimalformat: e.target.value })}
                placeholder="e.g., 0.00"
                helperText="Examples: 0.00 (2 decimals), 0.000 (3 decimals), #,##0.00 (with thousand separator)"
                disabled={loading}
                InputProps={{ sx: { fontFamily: 'monospace' } }}
              />
              <TextField
                label="Decimal Count"
                type="number"
                fullWidth
                required
                value={formData.decimalcount}
                onChange={(e) => setFormData({ ...formData, decimalcount: parseInt(e.target.value) || 0 })}
                placeholder="Enter decimal count (0-10)"
                inputProps={{ min: 0, max: 10 }}
                disabled={loading}
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={loading}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 3, borderTop: '1px solid #f1f5f9' }}>
            <Button onClick={() => setShowModal(false)} sx={{ color: '#64748b' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading} sx={{ bgcolor: '#3b82f6' }}>
              {loading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : (editingDecimalFormat ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
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

  const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

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
          'Content-Type': 'application/json',
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
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.6rem' }}>
          Payment Terms Management
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Create, update, and manage payment terms (e.g., Net 30, Due on receipt, Consignment).
        </Typography>
      </Box>

      {message.text && (
        <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, gap: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ bgcolor: '#3b82f6', textTransform: 'none', px: 3, py: 1.2, borderRadius: 2, fontWeight: 600 }}>
          Add New Payment Term
        </Button>
        <TextField
          size="small"
          placeholder="Search payment terms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: '60%', bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#2c3e50', height: '56px' }}>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ID</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>PAYMENT TERMS</TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && !paymentTerms.length ? (
              <TableRow><TableCell colSpan={3} align="center" sx={{ py: 8 }}><CircularProgress size={40} /></TableCell></TableRow>
            ) : filteredPaymentTerms.length === 0 ? (
              <TableRow><TableCell colSpan={3} align="center" sx={{ py: 8 }}><Typography sx={{ color: '#64748b' }}>No payment terms found.</Typography></TableCell></TableRow>
            ) : (
              filteredPaymentTerms.map((paymentTerm) => (
                <TableRow key={paymentTerm.id || paymentTerm.Id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                  <TableCell sx={{ color: '#64748b' }}>{paymentTerm.id || paymentTerm.Id}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{paymentTerm.paymentterms || paymentTerm.Paymentterms}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => handleEdit(paymentTerm)} sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(paymentTerm)} sx={{ color: '#2563eb', '&:hover': { bgcolor: '#d4e7fc' } }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(paymentTerm.id || paymentTerm.Id)} sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={showModal} onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowModal(false) } }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{editingPaymentTerm ? 'Edit Payment Term' : 'Add New Payment Term'}</Typography>
          <IconButton size="small" onClick={() => setShowModal(false)} sx={{ color: '#fff' }}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ px: 3, pt: 4, pb: 2 }}>
            <Stack spacing={3}>
              <TextField
                label="Payment Terms"
                fullWidth
                required
                value={formData.paymentterms}
                onChange={(e) => setFormData({ ...formData, paymentterms: e.target.value })}
                placeholder="e.g., Net 30"
                helperText="Examples: Net 15, Net 30, Due on receipt, Consignment"
                disabled={loading}
                autoFocus
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 3, borderTop: '1px solid #f1f5f9' }}>
            <Button onClick={() => setShowModal(false)} sx={{ color: '#64748b' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading} sx={{ bgcolor: '#3b82f6' }}>
              {loading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : (editingPaymentTerm ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
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

  const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

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
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.6rem' }}>
          Date Format Management
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Create, update, and manage date formats (e.g., yyyy-MM-dd, MM/dd/yyyy, dd-MM-yyyy).
        </Typography>
      </Box>

      {message.text && (
        <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, gap: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ bgcolor: '#3b82f6', textTransform: 'none', px: 3, py: 1.2, borderRadius: 2, fontWeight: 600 }}>
          Add New Date Format
        </Button>
        <TextField
          size="small"
          placeholder="Search date formats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: '60%', bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#2c3e50', height: '56px' }}>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ID</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>DATE FORMAT</TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && !dateFormats.length ? (
              <TableRow><TableCell colSpan={3} align="center" sx={{ py: 8 }}><CircularProgress size={40} /></TableCell></TableRow>
            ) : filteredDateFormats.length === 0 ? (
              <TableRow><TableCell colSpan={3} align="center" sx={{ py: 8 }}><Typography sx={{ color: '#64748b' }}>No date formats found.</Typography></TableCell></TableRow>
            ) : (
              filteredDateFormats.map((dateFormat) => (
                <TableRow key={dateFormat.id || dateFormat.Id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                  <TableCell sx={{ color: '#64748b' }}>{dateFormat.id || dateFormat.Id}</TableCell>
                  <TableCell>
                    <Chip
                      label={dateFormat.dateformat || dateFormat.Dateformat}
                      size="small"
                      sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => handleEdit(dateFormat)} sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(dateFormat)} sx={{ color: '#2563eb', '&:hover': { bgcolor: '#d4e7fc' } }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(dateFormat.id || dateFormat.Id)} sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={showModal} onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowModal(false) } }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{editingDateFormat ? 'Edit Date Format' : 'Add New Date Format'}</Typography>
          <IconButton size="small" onClick={() => setShowModal(false)} sx={{ color: '#fff' }}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ px: 3, pt: 4, pb: 2 }}>
            <Stack spacing={3}>
              <TextField
                label="Date Format"
                fullWidth
                required
                value={formData.dateformat}
                onChange={(e) => setFormData({ ...formData, dateformat: e.target.value })}
                placeholder="e.g., yyyy-MM-dd"
                helperText="Examples: yyyy-MM-dd, MM/dd/yyyy, dd-MM-yyyy, yyyy/MM/dd"
                disabled={loading}
                autoFocus
                InputProps={{ sx: { fontFamily: 'monospace' } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 3, borderTop: '1px solid #f1f5f9' }}>
            <Button onClick={() => setShowModal(false)} sx={{ color: '#64748b' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading} sx={{ bgcolor: '#3b82f6' }}>
              {loading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : (editingDateFormat ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
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
    status: 'Active',
    isdefault: 0,
    isdelete: '0'
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

  // Fetch all currencies
  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/currency?isdelete=0`);
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
      const query = editingCurrency ? 2 : 1; // 1 = Insert, 2 = Update
      const url = editingCurrency
        ? `${API_URL}/api/currency/${editingCurrency.id}`
        : `${API_URL}/api/currency`;

      const method = editingCurrency ? 'PUT' : 'POST';

      const requestBody = {
        currency: formData.currency,
        rate: formData.rate || '1.00',
        status: formData.status || 'Active',
        isdefault: formData.isdefault || 0,
        isdelete: formData.isdelete || '0',
        query: query
      };

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
          status: 'Active',
          isdefault: 0,
          isdelete: '0'
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
      status: currency.status || currency.Status || 'Active',
      isdefault: currency.isdefault || currency.Isdefault || 0,
      isdelete: currency.isdelete || currency.Isdelete || '0'
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
      status: 'Active',
      isdefault: 0,
      isdelete: '0'
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Filter currencies based on search term
  const filteredCurrencies = searchTerm
    ? currencies.filter(currency =>
      (currency.currency || currency.Currency || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    : currencies;

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.6rem' }}>
          Currency Management
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Create, update, and manage currencies with exchange rates (e.g., USD, EUR, GBP).
        </Typography>
      </Box>

      {message.text && (
        <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, gap: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ bgcolor: '#3b82f6', textTransform: 'none', px: 3, py: 1.2, borderRadius: 2, fontWeight: 600 }}>
          Add New Currency
        </Button>
        <TextField
          size="small"
          placeholder="Search currencies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: '60%', bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#2c3e50', height: '56px' }}>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ID</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>CURRENCY</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>RATE</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>DEFAULT</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>STATUS</TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && !currencies.length ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><CircularProgress size={40} /></TableCell></TableRow>
            ) : filteredCurrencies.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><Typography sx={{ color: '#64748b' }}>No currencies found.</Typography></TableCell></TableRow>
            ) : (
              filteredCurrencies.map((currency) => (
                <TableRow key={currency.id || currency.Id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                  <TableCell sx={{ color: '#64748b' }}>{currency.id || currency.Id}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{currency.currency || currency.Currency}</TableCell>
                  <TableCell>
                    <Chip
                      label={currency.rate || currency.Rate || '1.00'}
                      size="small"
                      sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    {(currency.isdefault || currency.Isdefault) === 1 ? (
                      <Chip label="Default" size="small" color="primary" sx={{ fontWeight: 600 }} />
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={currency.status || currency.Status || 'Active'}
                      size="small"
                      color={(currency.status || currency.Status) === 'Active' ? 'success' : 'default'}
                      sx={{ fontWeight: 600, borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => handleEdit(currency)} sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(currency)} sx={{ color: '#2563eb', '&:hover': { bgcolor: '#d4e7fc' } }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(currency.id || currency.Id)} sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={showModal} onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowModal(false) } }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{editingCurrency ? 'Edit Currency' : 'Add New Currency'}</Typography>
          <IconButton size="small" onClick={() => setShowModal(false)} sx={{ color: '#fff' }}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ px: 3, pt: 4, pb: 2 }}>
            <Stack spacing={3}>
              <TextField
                label="Currency Name"
                fullWidth
                required
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="e.g., USD"
                disabled={loading}
                autoFocus
              />
              <TextField
                label="Exchange Rate"
                fullWidth
                required
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                placeholder="1.00"
                disabled={loading}
                helperText="Rate relative to base currency"
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={loading}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Is Default</InputLabel>
                <Select
                  value={formData.isdefault}
                  label="Is Default"
                  onChange={(e) => setFormData({ ...formData, isdefault: parseInt(e.target.value) })}
                  disabled={loading}
                >
                  <MenuItem value={1}>Yes</MenuItem>
                  <MenuItem value={0}>No</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 3, borderTop: '1px solid #f1f5f9' }}>
            <Button onClick={() => setShowModal(false)} sx={{ color: '#64748b' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading} sx={{ bgcolor: '#3b82f6' }}>
              {loading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : (editingCurrency ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};


// SearchableSelect Component
const SearchableSelect = ({ options, value, onChange, placeholder = "Select an option", disabled = false, label = "", maxWidth = "100%" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef(null);

  const selectedOption = options.find(opt => opt.id === value || opt.value === value);

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

// Dashboard Content View Settings Section Component
const DashboardContentViewSettingsSection = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [dashboardContentViews, setDashboardContentViews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

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
            console.log(`Set ${sectionId} to ${isVisible}`);
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
        setMessage({ type: 'error', text: `Some permissions failed to save: ${errorMessages}` });
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.6rem' }}>
          Dashboard Content View Settings
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Configure which dashboard content sections are visible to each role. Select a role and toggle view permissions.
        </Typography>
      </Box>

      {message.text && (
        <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Paper sx={{ p: 3, borderRadius: 3, mb: 4, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <Box sx={{ maxWidth: 400 }}>
          <FormControl fullWidth>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#1e293b' }}>Select Role *</Typography>
            <Autocomplete
              options={roles}
              getOptionLabel={(option) => option.role || option.Role || ''}
              value={roles.find(r => r.id === selectedRole) || null}
              onChange={(event, newValue) => handleRoleChange(newValue ? newValue.id : null)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="-- Select a Role --"
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              )}
              disabled={loading}
            />
          </FormControl>
        </Box>
      </Paper>

      {selectedRole && (
        <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#2c3e50' }}>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>VIEW</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>CONTENT SECTION</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>DESCRIPTION</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboardContentSections.map((section) => (
                  <TableRow key={section.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                    <TableCell>
                      <Switch
                        checked={permissions[section.id] || false}
                        onChange={() => togglePermission(section.id)}
                        disabled={loading}
                        color="primary"
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>
                      {section.label}
                    </TableCell>
                    <TableCell sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                      {section.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9' }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
              sx={{
                bgcolor: '#3b82f6',
                textTransform: 'none',
                px: 4,
                py: 1.2,
                borderRadius: 2,
                fontWeight: 700,
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)'
              }}
            >
              {loading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : 'Save Permissions'}
            </Button>
          </Box>
        </Paper>
      )}

      {!selectedRole && roles.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="textSecondary">No roles available. Please create roles first in Role Management.</Typography>
        </Box>
      )}
    </Box>
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

  const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

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
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.6rem' }}>
          VAT Settings Management
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Create, update, and manage VAT (Value Added Tax) settings with rates and descriptions.
        </Typography>
      </Box>

      {message.text && (
        <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, gap: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ bgcolor: '#3b82f6', textTransform: 'none', px: 3, py: 1.2, borderRadius: 2, fontWeight: 600 }}>
          Add New VAT Setting
        </Button>
        <TextField
          size="small"
          placeholder="Search VAT settings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: '60%', bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#2c3e50', height: '56px' }}>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ID</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>VAT NAME</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>VAT VALUE</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ALIAS NAME</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>STATUS</TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && !vats.length ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><CircularProgress size={40} /></TableCell></TableRow>
            ) : filteredVATs.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><Typography sx={{ color: '#64748b' }}>No VAT settings found.</Typography></TableCell></TableRow>
            ) : (
              filteredVATs.map((vat) => (
                <TableRow key={vat.id || vat.Id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                  <TableCell sx={{ color: '#64748b' }}>{vat.id || vat.Id}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{vat.vatname || vat.Vatname}</TableCell>
                  <TableCell>
                    <Chip
                      label={`${vat.vatvalue || vat.Vatvalue}%`}
                      size="small"
                      sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#64748b' }}>{vat.aliasname || vat.Aliasname || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={vat.status || vat.Status || 'Active'}
                      size="small"
                      color={(vat.status || vat.Status) === 'Active' ? 'success' : 'default'}
                      sx={{ fontWeight: 600, borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => handleEdit(vat)} sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(vat)} sx={{ color: '#2563eb', '&:hover': { bgcolor: '#d4e7fc' } }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(vat.id || vat.Id)} sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={showModal} onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowModal(false) } }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{editingVAT ? 'Edit VAT Setting' : 'Add New VAT Setting'}</Typography>
          <IconButton size="small" onClick={() => setShowModal(false)} sx={{ color: '#fff' }}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ px: 3, pt: 4, pb: 2 }}>
            <Stack spacing={3}>
              <TextField
                label="VAT Name"
                fullWidth
                required
                value={formData.vatname}
                onChange={(e) => setFormData({ ...formData, vatname: e.target.value })}
                placeholder="e.g., standard"
                disabled={loading}
                autoFocus
                helperText="e.g., Standard VAT, Reduced VAT"
              />
              <TextField
                label="VAT Value (%)"
                fullWidth
                required
                value={formData.vatvalue}
                onChange={(e) => setFormData({ ...formData, vatvalue: e.target.value })}
                placeholder="e.g., 18"
                disabled={loading}
                InputProps={{ endAdornment: '%' }}
                helperText="e.g., 18, 5, 12.5"
              />
              <TextField
                label="Alias Name"
                fullWidth
                value={formData.aliasname}
                onChange={(e) => setFormData({ ...formData, aliasname: e.target.value })}
                placeholder="Enter alias name (optional)"
                disabled={loading}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description (optional)"
                disabled={loading}
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={loading}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 3, borderTop: '1px solid #f1f5f9' }}>
            <Button onClick={() => setShowModal(false)} sx={{ color: '#64748b' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading} sx={{ bgcolor: '#3b82f6' }}>
              {loading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : (editingVAT ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
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

  const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

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
    return catalog?.catelogname || catalog?.Catelogname || `ID: ${catelogid}`;
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.6rem' }}>
          Stock Check Management
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Manage stock check settings for catalogs.
        </Typography>
      </Box>

      {message.text && (
        <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, gap: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ bgcolor: '#3b82f6', textTransform: 'none', px: 3, py: 1.2, borderRadius: 2, fontWeight: 600 }}>
          Add New Stock Check
        </Button>
        <TextField
          size="small"
          placeholder="Search by catalog name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: '60%', bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#2c3e50', height: '56px' }}>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ID</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>CATALOG</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>STATUS</TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && !stockChecks.length ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 8 }}><CircularProgress size={40} /></TableCell></TableRow>
            ) : filteredStockChecks.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 8 }}><Typography sx={{ color: '#64748b' }}>No stock checks found.</Typography></TableCell></TableRow>
            ) : (
              filteredStockChecks.map((sc) => (
                <TableRow key={sc.id || sc.Id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                  <TableCell sx={{ color: '#64748b' }}>{sc.id || sc.Id}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>
                    {getCatalogName(sc.catelogid || sc.Catelogid)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={(sc.status || sc.Status) === 1 ? 'Active' : 'Inactive'}
                      size="small"
                      color={(sc.status || sc.Status) === 1 ? 'success' : 'default'}
                      sx={{ fontWeight: 600, borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => handleEdit(sc)} sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(sc)} sx={{ color: '#2563eb', '&:hover': { bgcolor: '#d4e7fc' } }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(sc.id || sc.Id)} sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={showModal} onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowModal(false) } }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{editingStockCheck ? 'Edit Stock Check' : 'Add New Stock Check'}</Typography>
          <IconButton size="small" onClick={() => setShowModal(false)} sx={{ color: '#fff' }}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ px: 3, pt: 4, pb: 2 }}>
            <Stack spacing={3}>
              <FormControl fullWidth required>
                <InputLabel>Catalog</InputLabel>
                <Select
                  value={formData.catelogid}
                  label="Catalog"
                  onChange={(e) => setFormData({ ...formData, catelogid: e.target.value })}
                  disabled={loading}
                >
                  <MenuItem value="">Select Catalog</MenuItem>
                  {catalogs.map((catalog) => (
                    <MenuItem key={catalog.id || catalog.Id} value={catalog.id || catalog.Id}>
                      {catalog.catelogname || catalog.Catelogname}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                  disabled={loading}
                >
                  <MenuItem value={1}>Active</MenuItem>
                  <MenuItem value={0}>Inactive</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Is Delete</InputLabel>
                <Select
                  value={formData.isdelete}
                  label="Is Delete"
                  onChange={(e) => setFormData({ ...formData, isdelete: parseInt(e.target.value) })}
                  disabled={loading}
                >
                  <MenuItem value={0}>No</MenuItem>
                  <MenuItem value={1}>Yes</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 3, borderTop: '1px solid #f1f5f9' }}>
            <Button onClick={() => setShowModal(false)} sx={{ color: '#64748b' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading} sx={{ bgcolor: '#3b82f6' }}>
              {loading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : (editingStockCheck ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
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

  const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

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
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.6rem' }}>
          Bank Account Management
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Create, update, and manage bank account information.
        </Typography>
      </Box>

      {message.text && (
        <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, gap: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ bgcolor: '#3b82f6', textTransform: 'none', px: 3, py: 1.2, borderRadius: 2, fontWeight: 600 }}>
          Add New Bank Account
        </Button>
        <TextField
          size="small"
          placeholder="Search bank accounts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: '60%', bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#2c3e50', height: '56px' }}>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ID</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ACCOUNT NAME</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ACCOUNT NUMBER</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>BANK NAME</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>IBAN</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>SWIFT CODE</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>CA ID</TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && !bankAccounts.length ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 8 }}><CircularProgress size={40} /></TableCell></TableRow>
            ) : filteredBankAccounts.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 8 }}><Typography sx={{ color: '#64748b' }}>No bank accounts found.</Typography></TableCell></TableRow>
            ) : (
              filteredBankAccounts.map((ba) => (
                <TableRow key={ba.id || ba.Id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                  <TableCell sx={{ color: '#64748b' }}>{ba.id || ba.Id}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{ba.accountname || ba.Accountname}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{ba.account_number || ba.Account_number || '-'}</TableCell>
                  <TableCell>{ba.bankname || ba.Bankname || '-'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{ba.iban || ba.IBAN || '-'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{ba.swift_code || ba.Swift_code || '-'}</TableCell>
                  <TableCell>{ba.ca_id || ba.Ca_id || '-'}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => handleEdit(ba)} sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(ba)} sx={{ color: '#2563eb', '&:hover': { bgcolor: '#d4e7fc' } }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(ba.id || ba.Id)} sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal for Add/Edit Bank Account */}
      <Dialog open={showModal} onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowModal(false) } }} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{editingBankAccount ? 'Edit Bank Account' : 'Add New Bank Account'}</Typography>
          <IconButton size="small" onClick={() => setShowModal(false)} sx={{ color: '#fff' }}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ px: 3, pt: 4, pb: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Account Name"
                  fullWidth
                  required
                  value={formData.accountname}
                  onChange={(e) => setFormData({ ...formData, accountname: e.target.value })}
                  placeholder="Enter account name"
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Account Number"
                  fullWidth
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="Enter account number"
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Bank Name"
                  fullWidth
                  value={formData.bankname}
                  onChange={(e) => setFormData({ ...formData, bankname: e.target.value })}
                  placeholder="Enter bank name"
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="IBAN"
                  fullWidth
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                  placeholder="Enter IBAN"
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="SWIFT Code"
                  fullWidth
                  value={formData.swift_code}
                  onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
                  placeholder="Enter SWIFT code"
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="CA ID"
                  fullWidth
                  value={formData.ca_id}
                  onChange={(e) => setFormData({ ...formData, ca_id: e.target.value })}
                  placeholder="Enter CA ID"
                  disabled={loading}
                />
              </Grid>
            </Grid>

          </DialogContent>
          <DialogActions sx={{ px: 3, py: 3, borderTop: '1px solid #f1f5f9' }}>
            <Button onClick={() => setShowModal(false)} sx={{ color: '#64748b' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading} sx={{ bgcolor: '#3b82f6' }}>
              {loading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : (editingBankAccount ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
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

  const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

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
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.6rem' }}>
          Vehicle Details Management
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Create, update, and manage vehicle information.
        </Typography>
      </Box>

      {message.text && (
        <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, gap: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ bgcolor: '#3b82f6', textTransform: 'none', px: 3, py: 1.2, borderRadius: 2, fontWeight: 600 }}>
          Add New Vehicle
        </Button>
        <TextField
          size="small"
          placeholder="Search vehicles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: '60%', bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#2c3e50', height: '56px' }}>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ID</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>VEHICLE NAME</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>VEHICLE NO</TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && !vehicles.length ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 8 }}><CircularProgress size={40} /></TableCell></TableRow>
            ) : filteredVehicles.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 8 }}><Typography sx={{ color: '#64748b' }}>No vehicles found.</Typography></TableCell></TableRow>
            ) : (
              filteredVehicles.map((v) => (
                <TableRow key={v.id || v.Id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                  <TableCell sx={{ color: '#64748b' }}>{v.id || v.Id}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{v.vehiclename || v.Vehiclename}</TableCell>
                  <TableCell>{v.vehicleno || v.Vehicleno || '-'}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => handleEdit(v)} sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(v)} sx={{ color: '#2563eb', '&:hover': { bgcolor: '#d4e7fc' } }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(v.id || v.Id)} sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal for Add/Edit Vehicle */}
      <Dialog open={showModal} onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowModal(false) } }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</Typography>
          <IconButton size="small" onClick={() => setShowModal(false)} sx={{ color: '#fff' }}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ px: 3, pt: 4, pb: 2 }}>
            <Stack spacing={3}>
              <TextField
                label="Vehicle Name"
                fullWidth
                required
                value={formData.vehiclename}
                onChange={(e) => setFormData({ ...formData, vehiclename: e.target.value })}
                placeholder="Enter vehicle name"
                disabled={loading}
                autoFocus
              />
              <TextField
                label="Vehicle Number"
                fullWidth
                value={formData.vehicleno}
                onChange={(e) => setFormData({ ...formData, vehicleno: e.target.value })}
                placeholder="Enter vehicle number"
                disabled={loading}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 3, borderTop: '1px solid #f1f5f9' }}>
            <Button onClick={() => setShowModal(false)} sx={{ color: '#64748b' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading} sx={{ bgcolor: '#3b82f6' }}>
              {loading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : (editingVehicle ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
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

  const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

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
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.6rem' }}>
          Driver Details Management
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Create, update, and manage driver information.
        </Typography>
      </Box>

      {message.text && (
        <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{ bgcolor: '#3b82f6', textTransform: 'none', px: 3, py: 1.2, borderRadius: 2, fontWeight: 600 }}
        >
          Add New Driver
        </Button>
        <TextField
          size="small"
          placeholder="Search drivers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: '60%', bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#2c3e50', height: '56px' }}>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ID</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>DRIVER NAME</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>LICENSE NO</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>MOBILE NO</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>TYPE</TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && !drivers.length ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><CircularProgress size={40} /></TableCell></TableRow>
            ) : filteredDrivers.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><Typography sx={{ color: '#64748b' }}>No drivers found.</Typography></TableCell></TableRow>
            ) : (
              filteredDrivers.map((d) => (
                <TableRow key={d.id || d.Id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                  <TableCell sx={{ color: '#64748b' }}>{d.id || d.Id}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{d.drivername || d.Drivername}</TableCell>
                  <TableCell>{d.licenseno || d.Licenseno || '-'}</TableCell>
                  <TableCell>{d.mobileno || d.Mobileno || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={d.type || d.Type || 'Internal'}
                      size="small"
                      sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => handleEdit(d)} sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(d)} sx={{ color: '#2563eb', '&:hover': { bgcolor: '#d4e7fc' } }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(d.id || d.Id)} sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal for Add/Edit Driver */}
      <Dialog open={showModal} onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { handleCloseModal(event, reason); } }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</Typography>
          <IconButton size="small" onClick={handleCloseModal} sx={{ color: '#fff' }}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ px: 3, pt: 4, pb: 2 }}>
            <Stack spacing={3}>
              <TextField
                label="Driver Name"
                fullWidth
                required
                value={formData.drivername}
                onChange={(e) => setFormData({ ...formData, drivername: e.target.value })}
                placeholder="Enter driver name"
                disabled={loading}
                autoFocus
              />
              <TextField
                label="License Number"
                fullWidth
                value={formData.licenseno}
                onChange={(e) => setFormData({ ...formData, licenseno: e.target.value })}
                placeholder="Enter license number"
                disabled={loading}
              />
              <TextField
                label="Mobile Number"
                fullWidth
                value={formData.mobileno}
                onChange={(e) => setFormData({ ...formData, mobileno: e.target.value })}
                placeholder="Enter mobile number"
                disabled={loading}
              />
              <TextField
                label="Driver Type"
                fullWidth
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="e.g., Internal, Third-party"
                disabled={loading}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 3, borderTop: '1px solid #f1f5f9' }}>
            <Button onClick={handleCloseModal} sx={{ color: '#64748b' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading} sx={{ bgcolor: '#3b82f6' }}>
              {loading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : (editingDriver ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

// Sales Return Management Section Component
const SalesReturnManagementSection = () => {
  const [salesReturns, setSalesReturns] = useState([]);
  const [parentConditions, setParentConditions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSalesReturn, setEditingSalesReturn] = useState(null);
  const [formData, setFormData] = useState({
    condition: '',
    parentcondition: '0',
    isdelete: '0',
    enterdate: new Date().toISOString().split('T')[0]
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

  // Helper to get parent condition name
  const getParentConditionName = (sr) => {
    const parentId = sr.parentcondition || sr.Parentcondition || '0';
    if (parentId === '0' || parentId === 0) return '-';
    const parent = salesReturns.find(c => String(c.id || c.Id) === String(parentId));
    return parent ? (parent.condition || parent.Condition) : '-';
  };

  // Fetch all sales returns
  const fetchSalesReturns = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/salesreturn?isdelete=0`);
      const data = await response.json();

      if (data.success) {
        const allConditions = data.salesReturns || data.data || [];
        setSalesReturns(allConditions);
        // Set parent conditions for dropdown (exclude current editing item if editing)
        if (editingSalesReturn) {
          setParentConditions(allConditions.filter(c => (c.id || c.Id) !== (editingSalesReturn.id || editingSalesReturn.Id)));
        } else {
          setParentConditions(allConditions);
        }
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to fetch sales returns' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please check if the backend server is running.' });
      console.error('Error fetching sales returns:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSalesReturns();
  }, []);

  // Handle form submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const query = editingSalesReturn ? 2 : 1; // 1 = Insert, 2 = Update
      const url = editingSalesReturn
        ? `${API_URL}/api/salesreturn/${editingSalesReturn.id || editingSalesReturn.Id}`
        : `${API_URL}/api/salesreturn`;

      const method = editingSalesReturn ? 'PUT' : 'POST';

      const requestBody = {
        condition: formData.condition,
        parentcondition: formData.parentcondition && formData.parentcondition !== '0' ? formData.parentcondition : '0',
        isdelete: formData.isdelete || '0',
        enterdate: formData.enterdate ? new Date(formData.enterdate).toISOString() : new Date().toISOString(),
        query: query
      };

      if (editingSalesReturn) {
        requestBody.id = editingSalesReturn.id || editingSalesReturn.Id;
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
        setMessage({ type: 'success', text: editingSalesReturn ? 'Sales return condition updated successfully!' : 'Sales return condition created successfully!' });
        setShowModal(false);
        setEditingSalesReturn(null);
        setFormData({
          condition: '',
          parentcondition: '0',
          isdelete: '0',
          enterdate: new Date().toISOString().split('T')[0]
        });
        fetchSalesReturns();
      } else {
        setMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error saving sales return:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sales return condition?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/salesreturn/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Sales return condition deleted successfully!' });
        fetchSalesReturns();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete sales return condition' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error deleting sales return:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for editing
  const handleEdit = (salesReturn) => {
    setEditingSalesReturn(salesReturn);
    const enterDate = salesReturn.enterdate || salesReturn.Enterdate;
    const parentCond = salesReturn.parentcondition || salesReturn.Parentcondition || '0';
    setFormData({
      condition: salesReturn.condition || salesReturn.Condition || '',
      parentcondition: parentCond === '0' || parentCond === 0 ? '0' : String(parentCond),
      isdelete: salesReturn.isdelete || salesReturn.Isdelete || '0',
      enterdate: enterDate ? new Date(enterDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    // Update parent conditions list (exclude current item)
    setParentConditions(salesReturns.filter(c => (c.id || c.Id) !== (salesReturn.id || salesReturn.Id)));
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Open modal for creating new sales return
  const handleAdd = () => {
    setEditingSalesReturn(null);
    setFormData({
      condition: '',
      parentcondition: '0',
      isdelete: '0',
      enterdate: new Date().toISOString().split('T')[0]
    });
    setParentConditions(salesReturns);
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Filter sales returns based on search term
  const filteredSalesReturns = salesReturns.filter(sr =>
    (sr.condition || sr.Condition || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    getParentConditionName(sr).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.6rem' }}>
          Sales Return Conditions Management
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Create, update, and manage sales return conditions.
        </Typography>
      </Box>

      {message.text && (
        <Alert
          severity={message.type === 'error' ? 'error' : 'success'}
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disabled={loading}
          sx={{
            bgcolor: '#3b82f6',
            '&:hover': { bgcolor: '#2563eb' },
            textTransform: 'none',
            px: 3,
            py: 1.2,
            borderRadius: 2,
            fontWeight: 600,
            whiteSpace: 'nowrap'
          }}
        >
          Add New Sales Return Condition
        </Button>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Search sales return conditions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            maxWidth: '60%',
            bgcolor: '#fff',
            '& .MuiOutlinedInput-root': { borderRadius: 2 }
          }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#2c3e50', height: '44px' }}>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ID</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>CONDITION</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>PARENT CONDITION</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ENTER DATE</TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, py: 0 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && !salesReturns.length ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <CircularProgress size={40} />
                  <Typography sx={{ mt: 2, color: '#64748b' }}>Loading conditions...</Typography>
                </TableCell>
              </TableRow>
            ) : filteredSalesReturns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Typography sx={{ color: '#64748b' }}>No sales return conditions found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredSalesReturns.map((sr) => (
                <TableRow key={sr.id || sr.Id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                  <TableCell sx={{ color: '#64748b', fontWeight: 500 }}>{sr.id || sr.Id}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>
                    {sr.condition || sr.Condition}
                  </TableCell>
                  <TableCell sx={{ color: '#475569' }}>
                    {getParentConditionName(sr)}
                  </TableCell>
                  <TableCell sx={{ color: '#64748b' }}>
                    {sr.enterdate || sr.Enterdate ? new Date(sr.enterdate || sr.Enterdate).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(sr)}
                          sx={{
                            color: '#64748b',
                            '&:hover': { bgcolor: '#f1f5f9' }
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(sr)}
                          sx={{
                            color: '#2563eb',
                            '&:hover': { bgcolor: '#d4e7fc' }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(sr.id || sr.Id)}
                          sx={{
                            color: '#dc2626',
                            '&:hover': { bgcolor: '#fee2e2' }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal for Add/Edit Sales Return */}
      <Dialog open={showModal}
        onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowModal(false) } }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {editingSalesReturn ? 'Edit Sales Return Condition' : 'Add New Sales Return Condition'}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setShowModal(false)}
            sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ px: 3, pt: 4, pb: 2 }}>
            <Stack spacing={3}>
              <TextField
                label="Condition"
                fullWidth
                required
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                placeholder="Enter condition (e.g., Parts Damage, Not Sellable)"
                disabled={loading}
                autoFocus
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <FormControl fullWidth>
                <InputLabel>Parent Condition</InputLabel>
                <Select
                  value={formData.parentcondition || '0'}
                  label="Parent Condition"
                  onChange={(e) => setFormData({ ...formData, parentcondition: e.target.value })}
                  disabled={loading}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="0">None (Top Level)</MenuItem>
                  {parentConditions.map((pc) => (
                    <MenuItem key={pc.id || pc.Id} value={String(pc.id || pc.Id)}>
                      {pc.condition || pc.Condition}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <DatePicker
                label="Enter Date"
                value={formData.enterdate ? dayjs(formData.enterdate) : null}
                onChange={(newValue) => setFormData({ ...formData, enterdate: newValue ? newValue.format('YYYY-MM-DD') : '' })}
                disabled={loading}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } }
                  }
                }}
              />

            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 3, borderTop: '1px solid #f1f5f9' }}>
            <Button
              onClick={() => setShowModal(false)}
              sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                bgcolor: '#3b82f6',
                '&:hover': { bgcolor: '#2563eb' },
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 3
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  Saving...
                </>
              ) : (
                editingSalesReturn ? 'Update Condition' : 'Create Condition'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

// Chart of Accounts Section Component
const ChartOfAccountsSection = () => {
  const [accounts, setAccounts] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [detailTypes, setDetailTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    account_typeid: '',
    detail_typeid: '',
    name: '',
    description: '',
    currency: 'AED',
    is_subaccount: '0',
    subnameid: '0',
    vatcode: '',
    balance: '0',
    asof: new Date().toISOString().split('T')[0],
    status: 'Active'
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

  // Fetch Accounts
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/chartofaccounts?isdelete=0`);
      const data = await response.json();
      if (data.success) setAccounts(data.data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Account Types
  const fetchAccountTypes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/accounttype?isdelete=0`);
      const data = await response.json();
      if (data.success) setAccountTypes(data.data || []);
    } catch (error) {
      console.error('Error fetching account types:', error);
    }
  };

  // Fetch Detail Types based on Account Type
  const fetchDetailTypes = async (accTypeId) => {
    if (!accTypeId) {
      setDetailTypes([]);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/accountdetailtype/${accTypeId}`);
      const data = await response.json();
      if (data.success) setDetailTypes(data.data || []);
    } catch (error) {
      console.error('Error fetching detail types:', error);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchAccountTypes();
  }, []);

  useEffect(() => {
    if (formData.account_typeid) {
      fetchDetailTypes(formData.account_typeid);
    }
  }, [formData.account_typeid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingAccount
        ? `${API_URL}/api/chartofaccounts/${editingAccount.id || editingAccount.Id}`
        : `${API_URL}/api/chartofaccounts`;
      const method = editingAccount ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, query: editingAccount ? 2 : 1 })
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Account ${editingAccount ? 'updated' : 'created'} successfully!` });
        setShowModal(false);
        fetchAccounts();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Operation failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this account?')) return;
    try {
      const response = await fetch(`${API_URL}/api/chartofaccounts/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) fetchAccounts();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleEdit = (acc) => {
    setEditingAccount(acc);
    setFormData({
      account_typeid: acc.account_typeid || acc.Account_typeid || '',
      detail_typeid: acc.detail_typeid || acc.Detail_typeid || '',
      name: acc.name || acc.Name || '',
      description: acc.description || acc.Description || '',
      currency: acc.currency || acc.Currency || 'AED',
      is_subaccount: acc.is_subaccount || acc.Is_subaccount || '0',
      subnameid: acc.subnameid || acc.Subnameid || '0',
      vatcode: acc.vatcode || acc.Vatcode || '',
      balance: acc.balance || acc.Balance || '0',
      asof: (acc.asof || acc.Asof || '').split('T')[0] || new Date().toISOString().split('T')[0],
      status: acc.status || acc.Status || 'Active'
    });
    setShowModal(true);
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100%' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.6rem' }}>Chart of Accounts</Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>Manage your company's financial accounts and their hierarchies.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingAccount(null); setShowModal(true); }} sx={{ bgcolor: '#3b82f6' }}>Add New Account</Button>
      </Box>

      {message.text && <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage({ text: '' })}>{message.text}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#2c3e50' }}>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>NAME</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>TYPE</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>DETAIL TYPE</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>BALANCE</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>STATUS</TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accounts.map((acc) => (
              <TableRow key={acc.id || acc.Id} hover>
                <TableCell sx={{ fontWeight: 700 }}>{acc.is_subaccount === "1" ? <SubdirectoryArrowRightIcon sx={{ fontSize: 16, mr: 1, color: '#94a3b8' }} /> : null}{acc.name || acc.Name}</TableCell>
                <TableCell>{acc.acc_type || acc.Acc_type}</TableCell>
                <TableCell>{acc.detail_type || acc.Detail_type}</TableCell>
                <TableCell>{acc.currency || acc.Currency} {acc.balance || acc.Balance}</TableCell>
                <TableCell><Chip label={acc.status || acc.Status} size="small" color={(acc.status || acc.Status) === 'Active' ? 'success' : 'default'} /></TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={() => handleEdit(acc)} color="primary"><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => handleDelete(acc.id || acc.Id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={showModal} onClose={(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setShowModal(false) } }} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff' }}>{editingAccount ? 'Edit Account' : 'Add New Account'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ p: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Account Type</InputLabel>
                  <Select value={formData.account_typeid} label="Account Type" onChange={(e) => setFormData({ ...formData, account_typeid: e.target.value })}>
                    {accountTypes.map(t => <MenuItem key={t.Id} value={String(t.Id)}>{t.Acc_type}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Detail Type</InputLabel>
                  <Select value={formData.detail_typeid} label="Detail Type" onChange={(e) => setFormData({ ...formData, detail_typeid: e.target.value })}>
                    {detailTypes.map(t => <MenuItem key={t.Id} value={String(t.Id)}>{t.Detail_type}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Name" fullWidth required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Description" fullWidth multiline rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Is Sub-account</InputLabel>
                  <Select value={formData.is_subaccount} label="Is Sub-account" onChange={(e) => setFormData({ ...formData, is_subaccount: e.target.value })}>
                    <MenuItem value="0">No</MenuItem>
                    <MenuItem value="1">Yes</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {formData.is_subaccount === "1" && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Parent Account</InputLabel>
                    <Select value={formData.subnameid} label="Parent Account" onChange={(e) => setFormData({ ...formData, subnameid: e.target.value })}>
                      <MenuItem value="0">None</MenuItem>
                      {accounts.filter(a => a.is_subaccount === "0").map(a => <MenuItem key={a.Id} value={String(a.Id)}>{a.Name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12} md={4}>
                <TextField label="Currency" fullWidth value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Balance" fullWidth type="number" value={formData.balance} onChange={(e) => setFormData({ ...formData, balance: e.target.value })} />
              </Grid>
              <Grid item xs={12} md={4}>
                <DatePicker
                  label="As of"
                  value={formData.asof ? dayjs(formData.asof) : null}
                  onChange={(newValue) => setFormData({ ...formData, asof: newValue ? newValue.format('YYYY-MM-DD') : '' })}
                  slotProps={{
                    textField: {
                      fullWidth: true
                    }
                  }}
                />
              </Grid>

            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Save Account'}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AdminSettings;

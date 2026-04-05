import { useState, useEffect, useRef } from 'react';
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

const Dashboard = () => {
  // Get initial section from URL or default to 'dashboard'
  const getInitialSection = () => {
    const path = window.location.pathname;
    if (path === '/' || path === '') return 'dashboard';
    // Extract section from URL (e.g., /admin-profile -> admin-profile)
    const section = path.replace(/^\//, '').replace(/\/$/, '');
    return section || 'dashboard';
  };

  const [activeSection, setActiveSection] = useState(getInitialSection());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMenus, setExpandedMenus] = useState(new Set());
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';

  // SVG Icon Component Helper
  const IconSVG = ({ name, size = 20, className = '' }) => {
    // Ensure size is always a valid number
    const iconSize = typeof size === 'number' && !isNaN(size) ? size : 20;
    const sizeStr = String(iconSize);

    const iconMap = {
      // Dashboard
      'dashboard': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      ),
      // Settings
      'settings': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364 6.364l-4.243-4.243m-4.242 0L5.636 18.364M18.364 5.636l-4.243 4.243m-4.242 0L5.636 5.636"></path>
        </svg>
      ),
      // Users/HR
      'users': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
      // User/Profile
      'user': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      // Sales
      'sales': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
      // Finance
      'finance': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
      // Warehouse/Inventory
      'warehouse': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
      ),
      // Security
      'security': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      ),
      // Role Management
      'roles': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
      // Marketplace
      'marketplace': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      ),
      // Modules
      'modules': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      ),
      // Permissions
      'permissions': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      ),
      // Notifications
      'notifications': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      ),
      // System
      'system': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
      ),
      // Email
      'email': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      ),
      // Catalog
      'catalog': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
      ),
      // Location
      'location': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      ),
      // Invoice/Bill
      'invoice': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      ),
      // Decimal/Number
      'decimal': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="2" x2="12" y2="22"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
      // Calendar/Date
      'date': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
      // Payment
      'payment': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
          <line x1="1" y1="10" x2="23" y2="10"></line>
        </svg>
      ),
      // Currency
      'currency': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="6" x2="12" y2="18"></line>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      ),
      // VAT
      'vat': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
      ),
      // Check/Stock Check
      'check': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      ),
      // Bank
      'bank': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="21" y1="10" x2="3" y2="10"></line>
          <line x1="21" y1="14" x2="3" y2="14"></line>
          <line x1="12" y1="2" x2="12" y2="22"></line>
          <line x1="3" y1="10" x2="3" y2="14"></line>
          <line x1="21" y1="10" x2="21" y2="14"></line>
        </svg>
      ),
      // Vehicle
      'vehicle': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"></path>
          <polygon points="12 15 17 21 7 21 12 15"></polygon>
        </svg>
      ),
      // Driver
      'driver': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
          <line x1="12" y1="11" x2="12" y2="15"></line>
          <line x1="9" y1="13" x2="15" y2="13"></line>
        </svg>
      ),
      // Return/Sales Return
      'return': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 10 4 15 9 20"></polyline>
          <path d="M20 4v7a4 4 0 0 1-4 4H4"></path>
        </svg>
      ),
      // Variants
      'variants': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 7h10v10H7z"></path>
          <path d="M7 7l5 5"></path>
          <path d="M12 12l5 5"></path>
        </svg>
      ),
      // Default/File
      'default': (
        <svg width={sizeStr} height={sizeStr} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
      )
    };

    return (
      <span className={`icon-svg ${className}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        {iconMap[name] || iconMap['default']}
      </span>
    );
  };

  // Comprehensive Icon Mapping Function - Returns icon name for SVG
  const getIconForMenu = (name, type = 'module') => {
    if (!name) return 'default';

    const normalizedName = name.toLowerCase().trim();

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
      'inventory': 'warehouse',
      'purchasing': 'warehouse',
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
      'configuration': 'settings'
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
      'orders': 'invoice',
      'order': 'invoice',
      'invoices': 'invoice',
      'invoice': 'invoice',
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
      'bill format': 'invoice',
      'billformat': 'invoice',
      'bill format management': 'invoice',
      'decimal format': 'decimal',
      'decimalformat': 'decimal',
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
      'dashboardcontent': 'dashboard'
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

  // Update URL when activeSection changes (for programmatic changes)
  useEffect(() => {
    const currentPath = window.location.pathname;
    const expectedPath = activeSection === 'dashboard' ? '/' : `/${activeSection}`;

    // Only update if URL doesn't match current section
    if ((currentPath || '').toLowerCase() !== (expectedPath || '').toLowerCase()) {
      const newPath = activeSection === 'dashboard' ? '/' : `/${activeSection}`;
      // Use replaceState to avoid polluting history and breaking back button
      window.history.replaceState({ section: activeSection }, '', newPath);
      console.log('URL updated to:', newPath, 'for section:', activeSection);
    }
  }, [activeSection]);

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      const section = event.state?.section || getInitialSection();
      // Guard against triggering state updates that would immediately rewrite the URL
      if (section && section !== activeSection) {
        setActiveSection(section);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeSection]);

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

            // Map database submodule names to admin section IDs
            // This allows database submodules to link to the correct admin pages
            let adminSectionId = `module-${moduleId}-sub-${smId}`;

            // If this is Admin Settings module, map submodules to admin section IDs
            if (moduleName && (moduleName.toLowerCase() === 'admin settings' || moduleName.toLowerCase() === 'adminsettings')) {
              // Map common submodule names to admin section IDs (case-insensitive, flexible matching)
              const nameMapping = {
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
                'salesreturn': 'admin-salesreturn',
                'sales return': 'admin-salesreturn',
                'sales return conditions': 'admin-salesreturn',
                'date format': 'admin-dateformat',
                'dateformat': 'admin-dateformat',
                'date format management': 'admin-dateformat',
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
                'brand': 'product-brand',
                'product brand': 'product-brand'
              };

              const normalizedName = smName.toLowerCase().trim();

              // Try exact match first
              if (nameMapping[normalizedName]) {
                adminSectionId = nameMapping[normalizedName];
              } else {
                // Try partial match (e.g., "Profile Settings" contains "profile")
                for (const [key, value] of Object.entries(nameMapping)) {
                  if (normalizedName.includes(key) || key.includes(normalizedName)) {
                    adminSectionId = value;
                    break;
                  }
                }
              }

              console.log(`Mapping submodule "${smName}" to admin section: ${adminSectionId} `);
            }

            // Get icon using the centralized icon mapping function
            const submenuIcon = getIconForMenu(smName, 'submodule');

            return {
              id: adminSectionId,
              label: smName,
              icon: submenuIcon
            };
          });

          // Add module to menu (even if no submodules, if module itself is accessible)
          // Use 'admin' as ID if it's Admin Settings module for consistency
          const menuId = (moduleName && (moduleName.toLowerCase() === 'admin settings' || moduleName.toLowerCase() === 'adminsettings'))
            ? 'admin'
            : `module-${moduleId}`;

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

          menuItemsList.push({
            id: menuId,
            label: moduleName,
            icon: moduleIcon,
            submenus: submenus
          });
        }

        setMenuItems(menuItemsList);
        console.log('Menu items loaded:', menuItemsList);

        // Auto-expand Admin Settings if it exists and has submenus
        const adminSettingsItem = menuItemsList.find(item => item.id === 'admin');
        if (adminSettingsItem) {
          if (adminSettingsItem.submenus && adminSettingsItem.submenus.length > 0) {
            console.log('Admin Settings found with', adminSettingsItem.submenus.length, 'submenus:', adminSettingsItem.submenus);
            setExpandedMenus(prev => {
              const newSet = new Set(prev);
              newSet.add('admin');
              return newSet;
            });
          } else {
            console.warn('Admin Settings found but has no submenus');
          }
        } else {
          // If Admin Settings not found in database, add it with hardcoded submenus
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
              { id: 'admin-salesreturn', label: 'Sales Return', icon: getIconForMenu('Sales Return', 'submodule') },
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
          setMenuItems(menuItemsList);
          setExpandedMenus(prev => {
            const newSet = new Set(prev);
            newSet.add('admin');
            return newSet;
          });
        }
      } catch (error) {
        console.error('Error loading user menu:', error);
        // Fallback to default menu on error with hardcoded Admin Settings submenus
        const fallbackMenu = [
          { id: 'dashboard', label: 'Dashboard', icon: getIconForMenu('Dashboard', 'module'), submenus: [] },
          {
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
                  { id: 'product-brand', label: 'Brand', icon: getIconForMenu('Brand', 'submodule') }
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
          }
        ];
        setMenuItems(fallbackMenu);
        // Auto-expand Admin Settings in fallback
        setExpandedMenus(new Set(['admin']));
      } finally {
        setLoadingMenu(false);
      }
    };

    loadUserMenu();
  }, [user.Role]);

  // Toggle menu expansion
  const toggleMenu = (menuId) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId);
    } else {
      newExpanded.add(menuId);
    }
    setExpandedMenus(newExpanded);
  };

  // Handle menu item click
  const handleMenuClick = (item, submenuId = null) => {
    console.log('Menu clicked:', item.id, 'Has submenus:', item.submenus?.length || 0, item.submenus);

    if (item.submenus && item.submenus.length > 0) {
      // If has submenus, toggle expansion
      const wasExpanded = expandedMenus.has(item.id);
      console.log('Menu expansion state - wasExpanded:', wasExpanded, 'item.id:', item.id, 'expandedMenus:', Array.from(expandedMenus));

      // Always expand Admin Settings when clicked (don't collapse it)
      if (item.id === 'admin' && !wasExpanded) {
        console.log('Expanding Admin Settings');
        setExpandedMenus(prev => {
          const newSet = new Set(prev);
          newSet.add('admin');
          console.log('New expandedMenus:', Array.from(newSet));
          return newSet;
        });

        // Auto-select first submenu after expansion
        setTimeout(() => {
          const firstSubmenu = item.submenus[0];
          if (firstSubmenu) {
            console.log('Auto-selecting first submenu:', firstSubmenu);
            setActiveSection(firstSubmenu.id);
            const newPath = `/${firstSubmenu.id}`;
            window.history.replaceState({ section: firstSubmenu.id }, '', newPath);
          }
        }, 200);
      } else {
        // For other menus, toggle normally
        toggleMenu(item.id);
      }
    } else {
      // If no submenus or submenu clicked, set active section
      const sectionId = submenuId || item.id;
      setActiveSection(sectionId);
      // Update URL
      const newPath = sectionId === 'dashboard' ? '/' : `/${sectionId}`;
      window.history.replaceState({ section: sectionId }, '', newPath);
      // Close sidebar on mobile after selection
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      }
    }
  };

  // Handle submenu click
  const handleSubmenuClick = (submenuId, e) => {
    e.stopPropagation(); // Prevent parent menu toggle

    // Set active section directly - all admin submenu IDs match their section IDs
    setActiveSection(submenuId);

    // Update URL
    const newPath = submenuId === 'dashboard' ? '/' : `/${submenuId}`;
    window.history.replaceState({ section: submenuId }, '', newPath);

    // Close sidebar on mobile after selection
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }

    console.log('Submenu clicked:', submenuId, 'URL updated to:', newPath);
  };

  const handleLogout = () => {
    logoutUser();
  };

  return (
    <div className="dashboard-container">
      {/* Top Bar */}
      <header className="dashboard-topbar">
        <div className="topbar-left">
          <button
            className="mobile-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <h1 className="dashboard-title">ERP Dashboard</h1>
        </div>
        <div className="topbar-center">
          <div className="topbar-section-name">
            {(() => {
              // Find the section name from menu items
              for (const item of menuItems) {
                if (item.id === activeSection) {
                  return item.label;
                }
                // Check submenus
                if (item.submenus && item.submenus.length > 0) {
                  const submenu = item.submenus.find(sub => sub.id === activeSection);
                  if (submenu) {
                    return submenu.label;
                  }
                }
              }
              // Fallback for admin sections
              const adminSectionNames = {
                'admin-profile': 'Profile',
                'admin-security': 'Security',
                'admin-roles': 'Role Management',
                'admin-marketplace': 'Marketplace',
                'admin-modules': 'Modules & SubModules',
                'admin-catalog': 'Catalog Management',
                'admin-stocklocation': 'Stock Location',
                'admin-billformat': 'Bill Format',
                'admin-decimalformat': 'Decimal Format',
                'admin-paymentterms': 'Payment Terms',
                'admin-currency': 'Currency',
                'admin-dateformat': 'Date Format',
                'admin-dashboardcontent': 'Dashboard Content View',
                'admin-permissions': 'Role Permissions',
                'admin-preferences': 'Preferences',
                'admin-notifications': 'Notifications',
                'admin-system': 'System Settings',
                'admin-users': 'User Management',
                'admin-email': 'Email Settings',
                'admin-variants': 'Variants'
              };
              return adminSectionNames[activeSection] || 'Dashboard';
            })()}
          </div>
          <div className="search-container">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="search"
              placeholder="Search"
              className="search-input-topbar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="topbar-right">
          <button className="icon-btn" title="Notifications" aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>
          <button className="icon-btn" title="Settings" aria-label="Settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
            </svg>
          </button>
          <div className="user-profile">
            <div className="user-avatar">
              {user.email ? user.email.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="user-info">
              <span className="user-name">{user.email || 'Admin'}</span>
              <svg className="dropdown-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            <div className="user-dropdown">
              <button onClick={handleLogout} className="dropdown-item">Logout</button>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-content-wrapper">
        {/* Sidebar Overlay for Mobile */}
        {window.innerWidth <= 768 && sidebarOpen && (
          <div
            className="dashboard-sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar */}
        <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-menu">
            {loadingMenu ? (
              <LoadingSpinner text="Loading menu..." />
            ) : menuItems.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No modules available
              </div>
            ) : (
              menuItems.map((item) => {
                const hasSubmenus = item.submenus && item.submenus.length > 0;
                const isExpanded = expandedMenus.has(item.id);
                const isActive = activeSection === item.id ||
                  (hasSubmenus && item.submenus.some(sub => sub.id === activeSection));

                // Debug logging for Admin Settings
                if (item.id === 'admin') {
                  console.log('Admin Settings menu item:', {
                    id: item.id,
                    label: item.label,
                    hasSubmenus,
                    submenusCount: item.submenus?.length || 0,
                    submenus: item.submenus,
                    isExpanded,
                    expandedMenus: Array.from(expandedMenus)
                  });
                }

                return (
                  <div key={item.id} className="menu-group">
                    <button
                      className={`menu-item ${isActive ? 'active' : ''} ${hasSubmenus ? 'has-submenu' : ''}`}
                      onClick={() => handleMenuClick(item)}
                    >
                      <span className="menu-icon">
                        <IconSVG name={typeof item.icon === 'string' ? item.icon : getIconForMenu(item.label, 'module')} size={20} />
                      </span>
                      <span className="menu-label">{item.label}</span>
                      {hasSubmenus && (
                        <span className={`menu-arrow ${isExpanded ? 'expanded' : ''}`}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </span>
                      )}
                    </button>
                    {hasSubmenus && isExpanded && (
                      <div className="submenu-list">
                        {item.submenus && item.submenus.length > 0 ? (
                          item.submenus.map((submenu) => (
                            <button
                              key={submenu.id}
                              className={`submenu-item ${activeSection === submenu.id ? 'active' : ''}`}
                              onClick={(e) => handleSubmenuClick(submenu.id, e)}
                            >
                              <span className="submenu-icon">
                                <IconSVG name={typeof submenu.icon === 'string' ? submenu.icon : getIconForMenu(submenu.label, 'submodule')} size={18} />
                              </span>
                              <span className="submenu-label">{submenu.label}</span>
                            </button>
                          ))
                        ) : (
                          <div style={{ padding: '10px 20px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                            No submenus available
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="dashboard-main">
          {activeSection === 'hr' && <HumanResourcesSection searchTerm={searchTerm} />}
          {activeSection === 'dashboard' && <DashboardHomeSection />}
          {activeSection === 'sales' && <SalesSection />}
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
          {activeSection === 'admin-salesreturn' && (
            <div className="admin-page-container">
              <SalesReturnManagementSection />
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
          {activeSection === 'product-brand' && (
            <div className="admin-page-container">
              <BrandSection />
            </div>
          )}

          {/* Generic component for unmapped submodules (e.g., module-1-sub-5) */}
          {activeSection.startsWith('module-') && activeSection.includes('-sub-') && (
            <div className="admin-page-container">
              <GenericSubModuleSection sectionId={activeSection} menuItems={menuItems} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// Dashboard Home Section
const DashboardHomeSection = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    growthRate: 0
  });

  useEffect(() => {
    // Simulate loading stats - replace with actual API calls
    setStats({
      totalRevenue: 125000,
      totalOrders: 1248,
      totalCustomers: 342,
      growthRate: 12.5
    });
  }, []);

  // Sample chart data
  const salesData = [
    { month: 'Jan', value: 45000 },
    { month: 'Feb', value: 52000 },
    { month: 'Mar', value: 48000 },
    { month: 'Apr', value: 61000 },
    { month: 'May', value: 55000 },
    { month: 'Jun', value: 67000 }
  ];

  // Sample recent activities
  const recentActivities = [
    { id: 1, type: 'order', title: 'New Order #1234', description: 'Customer: John Doe', time: '2 mins ago', icon: '📦' },
    { id: 2, type: 'payment', title: 'Payment Received', description: '$2,500 from ABC Corp', time: '15 mins ago', icon: '💳' },
    { id: 3, type: 'customer', title: 'New Customer', description: 'XYZ Company registered', time: '1 hour ago', icon: '👤' },
    { id: 4, type: 'order', title: 'Order Shipped', description: 'Order #1230 delivered', time: '2 hours ago', icon: '🚚' },
    { id: 5, type: 'invoice', title: 'Invoice Generated', description: 'Invoice #5678 created', time: '3 hours ago', icon: '🧾' }
  ];

  return (
    <div className="aurora-dashboard">
      {/* Welcome Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-welcome-title">Welcome Back!</h1>
          <p className="dashboard-welcome-subtitle">Here's what's happening with your business today.</p>
        </div>
        <div className="dashboard-header-actions">
          <button className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Order
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-card-primary">
          <div className="kpi-card-content">
            <div className="kpi-card-header">
              <span className="kpi-card-label">Total Revenue</span>
              <div className="kpi-card-icon kpi-icon-revenue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
            </div>
            <div className="kpi-card-value">${stats.totalRevenue.toLocaleString()}</div>
            <div className="kpi-card-footer">
              <span className="kpi-card-change positive">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
                {stats.growthRate}% vs last month
              </span>
            </div>
          </div>
        </div>

        <div className="kpi-card kpi-card-success">
          <div className="kpi-card-content">
            <div className="kpi-card-header">
              <span className="kpi-card-label">Total Orders</span>
              <div className="kpi-card-icon kpi-icon-orders">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </div>
            </div>
            <div className="kpi-card-value">{stats.totalOrders.toLocaleString()}</div>
            <div className="kpi-card-footer">
              <span className="kpi-card-change positive">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
                8.2% vs last month
              </span>
            </div>
          </div>
        </div>

        <div className="kpi-card kpi-card-info">
          <div className="kpi-card-content">
            <div className="kpi-card-header">
              <span className="kpi-card-label">Total Customers</span>
              <div className="kpi-card-icon kpi-icon-customers">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
            </div>
            <div className="kpi-card-value">{stats.totalCustomers.toLocaleString()}</div>
            <div className="kpi-card-footer">
              <span className="kpi-card-change positive">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
                15 new this month
              </span>
            </div>
          </div>
        </div>

        <div className="kpi-card kpi-card-warning">
          <div className="kpi-card-content">
            <div className="kpi-card-header">
              <span className="kpi-card-label">Growth Rate</span>
              <div className="kpi-card-icon kpi-icon-growth">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
              </div>
            </div>
            <div className="kpi-card-value">{stats.growthRate}%</div>
            <div className="kpi-card-footer">
              <span className="kpi-card-change positive">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
                On track for Q2
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Activity Section */}
      <div className="dashboard-content-grid">
        {/* Sales Chart Card */}
        <div className="dashboard-card chart-card">
          <div className="card-header">
            <h3 className="card-title">Sales Overview</h3>
            <div className="card-actions">
              <select className="period-select">
                <option>Last 6 Months</option>
                <option>Last 3 Months</option>
                <option>This Year</option>
              </select>
            </div>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <div className="simple-chart">
                {salesData.map((item, index) => {
                  const maxValue = Math.max(...salesData.map(d => d.value));
                  const height = (item.value / maxValue) * 100;
                  return (
                    <div key={index} className="chart-bar-wrapper">
                      <div className="chart-bar" style={{ height: `${height}% ` }}>
                        <span className="chart-value">${(item.value / 1000).toFixed(0)}k</span>
                      </div>
                      <span className="chart-label">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="dashboard-card activity-card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
            <button className="card-link">View All</button>
          </div>
          <div className="card-body">
            <div className="activity-list">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon">{activity.icon}</div>
                  <div className="activity-content">
                    <div className="activity-title">{activity.title}</div>
                    <div className="activity-description">{activity.description}</div>
                  </div>
                  <div className="activity-time">{activity.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions and Stats */}
      <div className="dashboard-content-grid">
        {/* Quick Actions Card */}
        <div className="dashboard-card quick-actions-card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div className="card-body">
            <div className="quick-actions-grid">
              <button className="quick-action-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>New Order</span>
              </button>
              <button className="quick-action-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>Add Customer</span>
              </button>
              <button className="quick-action-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span>Create Invoice</span>
              </button>
              <button className="quick-action-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>New Product</span>
              </button>
            </div>
          </div>
        </div>

        {/* Order Status Card */}
        <div className="dashboard-card status-card">
          <div className="card-header">
            <h3 className="card-title">Order Status</h3>
          </div>
          <div className="card-body">
            <div className="status-list">
              <div className="status-item">
                <div className="status-indicator status-pending"></div>
                <div className="status-info">
                  <span className="status-label">Pending</span>
                  <span className="status-count">24</span>
                </div>
              </div>
              <div className="status-item">
                <div className="status-indicator status-processing"></div>
                <div className="status-info">
                  <span className="status-label">Processing</span>
                  <span className="status-count">18</span>
                </div>
              </div>
              <div className="status-item">
                <div className="status-indicator status-shipped"></div>
                <div className="status-info">
                  <span className="status-label">Shipped</span>
                  <span className="status-count">42</span>
                </div>
              </div>
              <div className="status-item">
                <div className="status-indicator status-delivered"></div>
                <div className="status-info">
                  <span className="status-label">Delivered</span>
                  <span className="status-count">156</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';

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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';

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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';

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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';

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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';

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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';

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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';

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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';

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
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';

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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';

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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';

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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';

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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';

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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';

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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';
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
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';

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
                              ✏️
                            </button>
                            <button
                              className="btn-icon"
                              title="Delete"
                              onClick={() => handleDelete(user.id)}
                              disabled={loading}
                            >
                              🗑️
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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';

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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';

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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';

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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';

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
    parentcondition: '',
    isdelete: '0',
    enterdate: new Date().toISOString().split('T')[0]
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';

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

  // Load sales returns on component mount and when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchTerm) {
        fetchSalesReturns();
      }
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

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
        ? `${API_URL}/api/salesreturn/${editingSalesReturn.id}`
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
        requestBody.id = editingSalesReturn.id;
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
    // Refresh parent conditions list for dropdown
    fetchSalesReturns();
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSalesReturn(null);
    setFormData({
      condition: '',
      parentcondition: '0',
      isdelete: '0',
      enterdate: new Date().toISOString().split('T')[0]
    });
    setMessage({ type: '', text: '' });
  };

  // Get parent condition name (use Parentconditionname from API if available, otherwise lookup)
  const getParentConditionName = (salesReturn) => {
    // Use Parentconditionname from API response (Query = 5 returns this via LEFT JOIN)
    if (salesReturn.parentconditionname || salesReturn.Parentconditionname) {
      return salesReturn.parentconditionname || salesReturn.Parentconditionname;
    }
    // Fallback: lookup by ID if Parentconditionname not available
    const parentId = salesReturn.parentcondition || salesReturn.Parentcondition;
    if (!parentId || parentId === '0' || parentId === 0) return '-';
    const parent = salesReturns.find(sr => (sr.id || sr.Id) === parseInt(parentId));
    return parent ? (parent.condition || parent.Condition) : '-';
  };

  // Filter sales returns based on search term
  const filteredSalesReturns = searchTerm
    ? salesReturns.filter(sr =>
      (sr.condition || sr.Condition || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      getParentConditionName(sr).toLowerCase().includes(searchTerm.toLowerCase())
    )
    : salesReturns;

  return (
    <div className="settings-section">
      <h2 className="section-title">Sales Return Conditions Management</h2>
      <p className="section-description">Create, update, and manage sales return conditions.</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )
      }

      <div className="roles-actions">
        <button className="btn-primary" onClick={handleAdd} disabled={loading}>
          + Add New Sales Return Condition
        </button>
        <input
          type="search"
          placeholder="Search sales return conditions..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {
        loading && !salesReturns.length ? (
          <LoadingSpinner text="Loading sales return conditions..." />
        ) : (
          <div className="roles-table">
            {filteredSalesReturns.length === 0 ? (
              <div className="empty-state">
                <p>No sales return conditions found. Click "Add New Sales Return Condition" to create one.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Condition</th>
                    <th>Parent Condition</th>
                    <th>Enter Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSalesReturns.map((sr) => (
                    <tr key={sr.id || sr.Id}>
                      <td>{sr.id || sr.Id}</td>
                      <td>
                        <strong>{sr.condition || sr.Condition}</strong>
                      </td>
                      <td>{getParentConditionName(sr)}</td>
                      <td>{sr.enterdate || sr.Enterdate ? new Date(sr.enterdate || sr.Enterdate).toLocaleDateString() : '-'}</td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Edit"
                          onClick={() => handleEdit(sr)}
                          disabled={loading}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          title="Delete"
                          onClick={() => handleDelete(sr.id || sr.Id)}
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

      {/* Modal for Add/Edit Sales Return */}
      {
        showModal && (
          <div className="modal-overlay">
            <div className="modal-content responsive-modal modal-sm" style={{ padding: '0' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #2C3E50 0%, #34495e 100%)', color: '#fff', borderBottom: 'none' }}>
                <h3 style={{ color: '#fff', fontWeight: '600' }}>{editingSalesReturn ? 'Edit Sales Return Condition' : 'Add New Sales Return Condition'}</h3>
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
                    <label htmlFor="condition" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Condition <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="condition"
                      className="form-input"
                      value={formData.condition}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                      required
                      disabled={loading}
                      placeholder="Enter condition"
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
                    <label htmlFor="parentCondition" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Parent Condition
                    </label>
                    <select
                      id="parentCondition"
                      className="form-input"
                      value={formData.parentcondition || '0'}
                      onChange={(e) => setFormData({ ...formData, parentcondition: e.target.value })}
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
                      <option value="0">None (Top Level)</option>
                      {parentConditions.map((pc) => (
                        <option key={pc.id || pc.Id} value={pc.id || pc.Id}>
                          {pc.condition || pc.Condition}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="enterDate" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                      Enter Date <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <input
                      type="date"
                      id="enterDate"
                      className="form-input"
                      value={formData.enterdate}
                      onChange={(e) => setFormData({ ...formData, enterdate: e.target.value })}
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
                      ) : editingSalesReturn ? 'Update Sales Return Condition' : 'Create Sales Return Condition'}
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

export default Dashboard;

# Icon Customization Guide

## Overview
The Dashboard now uses a centralized icon mapping system that automatically assigns appropriate icons to menu items (modules and submodules) based on their names.

## How It Works

The `getIconForMenu(name, type)` function in `Dashboard.jsx` maps menu item names to icons:

- **Type `'module'`**: For main menu items (top-level modules)
- **Type `'submodule'`**: For submenu items (submodules under modules)

## Current Icon Mappings

### Main Modules (Modules)
| Module Name | Icon | Description |
|------------|------|------------|
| Dashboard | 📊 | Dashboard/Home |
| Admin Settings | ⚙️ | Administration |
| Human Resources / HR | 👥 | Employee management |
| Sales | 💰 | Sales operations |
| Finance | 💵 | Financial management |
| Warehouse / Inventory | 📦 | Inventory management |
| Purchasing | 🛒 | Procurement |
| Production | 🏭 | Manufacturing |
| Quality | ✅ | Quality control |
| Maintenance | 🔧 | Equipment maintenance |
| Project | 📋 | Project management |
| CRM | 🤝 | Customer relations |
| Marketing | 📢 | Marketing activities |
| Accounting | 📊 | Accounting |
| Reporting | 📈 | Reports |
| Analytics | 📊 | Data analytics |
| Settings / Configuration | ⚙️ | System settings |

### Submodules (Submenus)
| Submodule Name | Icon | Description |
|---------------|------|-------------|
| Profile | 👤 | User profile |
| Security | 🔒 | Security settings |
| Role Management / Roles | 🎭 | Role administration |
| Marketplace | 🏪 | Marketplace |
| Modules & SubModules / Modules | 📦 | Module management |
| Role Permissions / Permissions | 🔐 | Permission management |
| Preferences | ⚙️ | User preferences |
| Notifications | 🔔 | Notification settings |
| System Settings / System | 🖥️ | System configuration |
| User Management / Users | 👥 | User administration |
| Employees / Employee | 👤 | Employee management |
| Customers / Customer | 🤝 | Customer management |
| Vendors / Vendor | 🏢 | Vendor management |
| Products / Product | 📦 | Product catalog |
| Orders / Order | 📋 | Order management |
| Invoices / Invoice | 🧾 | Invoice management |
| Payments / Payment | 💳 | Payment processing |
| Reports / Report | 📊 | Report generation |
| Analytics | 📈 | Data analytics |
| Backup | 💾 | Data backup |
| Logs | 📝 | System logs |
| Audit | 🔍 | Audit trail |

## How to Customize Icons

### Option 1: Edit the Icon Mapping Function

1. Open `frontend/src/components/Dashboard.jsx`
2. Find the `getIconForMenu` function (around line 27)
3. Edit the `moduleIcons` or `submoduleIcons` objects:

```javascript
const moduleIcons = {
  'your module name': '🎯',  // Add your custom icon
  // ... existing mappings
};

const submoduleIcons = {
  'your submodule name': '⭐',  // Add your custom icon
  // ... existing mappings
};
```

### Option 2: Add Icons to Database (Future Enhancement)

Currently, icons are mapped by name. In the future, you could:
1. Add an `Icon` column to `Tbl_Module` and `Tbl_SubModule` tables
2. Update the code to read icons from the database
3. Store icons directly in the database for each module/submodule

## Icon Matching Logic

The system uses a smart matching algorithm:

1. **Exact Match**: First tries to match the exact name (case-insensitive)
2. **Partial Match**: If no exact match, tries partial matching (e.g., "Profile Settings" matches "profile")
3. **Default Icons**: 
   - Modules: 📦 (package icon)
   - Submodules: 📄 (document icon)

## Examples

### Example 1: Custom Module Icon
If you have a module named "E-Commerce", you can add:
```javascript
const moduleIcons = {
  'e-commerce': '🛒',  // Shopping cart icon
  // ... other mappings
};
```

### Example 2: Custom Submodule Icon
If you have a submodule named "Email Templates", you can add:
```javascript
const submoduleIcons = {
  'email templates': '📧',  // Email icon
  'email': '📧',  // Also match just "email"
  // ... other mappings
};
```

## Available Emoji Icons

You can use any emoji as an icon. Common choices:
- 📊 📈 📉 (Charts/Analytics)
- 👤 👥 (Users/People)
- 🔒 🔐 (Security)
- ⚙️ 🔧 (Settings/Tools)
- 📦 📋 (Items/Documents)
- 💰 💵 💳 (Money/Finance)
- 🏪 🏢 (Business)
- 📢 📝 (Communication)
- ✅ ❌ (Status)
- 🔔 🔍 (Notifications/Search)
- 💾 🖥️ (Technology)

## Notes

- Icons are case-insensitive
- Partial matching allows flexible naming (e.g., "User Management" will match "user")
- If no match is found, default icons are used
- Icons are automatically applied when menu items are loaded from the database

## Testing

After updating icons:
1. Refresh the browser
2. Check the sidebar menu
3. Verify icons appear correctly for all modules and submodules
4. Test with different module/submodule names to ensure matching works

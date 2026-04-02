# Supplier Module - Final Integration Steps

## ✅ Completed Frontend Integration

The following changes have been made to the Dashboard:

1. **Import Added** (Line 22):
   ```javascript
   import SupplierSection from './SupplierSection';
   ```

2. **Section Rendering Added** (Around line 1567):
   ```javascript
   {/* Supplier Section */}
   {activeSection === 'supplier' && (
     <div className="admin-page-container">
       <SupplierSection />
     </div>
   )}
   ```

3. **Icon Added to iconMap** (Around line 345):
   - Added 'supplier' icon with multiple people SVG

4. **Icon Mapping Added** (Around line 610):
   - Added 'supplier', 'suppliers', and 'supplier management' to submoduleIcons

## 📋 Database Setup Required

### Step 1: Update Stored Procedure

Run this SQL script on your database to add SELECT operations:

```sql
-- Add to your existing Sp_Supplier stored procedure after Query=2

IF (@Query = 3)  
BEGIN 
    -- Select all suppliers (not deleted)
    SELECT * FROM Tbl_Supplier WHERE ISNULL(Isdelete, '0') = '0' ORDER BY Id DESC
END

IF (@Query = 4)  
BEGIN 
    -- Select supplier by ID
    SELECT * FROM Tbl_Supplier WHERE Id = @Id AND ISNULL(Isdelete, '0') = '0'
END
```

### Step 2: Add Supplier to Module/SubModule Tables

You need to add the Supplier menu item to your database. Here are two options:

#### Option A: Add as a SubModule under Purchase Module

```sql
-- First, find your Purchase module ID
SELECT * FROM Tbl_Module WHERE Module_name LIKE '%Purchase%' OR Module_name LIKE '%Procurement%'

-- Then insert Supplier as a submodule (replace @PurchaseModuleId with actual ID)
DECLARE @PurchaseModuleId INT = 5; -- Replace with your actual Purchase module ID

INSERT INTO Tbl_SubModule (SubModule_name, ModuleId, IsActive, CreatedDate)
VALUES ('Supplier', @PurchaseModuleId, 1, GETDATE())

-- Get the new SubModule ID
SELECT SCOPE_IDENTITY() AS NewSubModuleId
```

#### Option B: Add as a Standalone Module

```sql
-- Insert as a new module
INSERT INTO Tbl_Module (Module_name, IsActive, CreatedDate)
VALUES ('Supplier Management', 1, GETDATE())

-- Get the new Module ID
SELECT SCOPE_IDENTITY() AS NewModuleId
```

### Step 3: Assign Permissions

After adding the module/submodule, assign permissions to your role:

```sql
-- Find your role ID
SELECT * FROM Tbl_Role WHERE Role_name = 'Admin' -- Or your role name

-- Insert permission (replace IDs with actual values)
DECLARE @RoleId INT = 1; -- Your role ID
DECLARE @ModuleId INT = NULL; -- NULL if it's a submodule
DECLARE @SubModuleId INT = 10; -- Your new SubModule ID

INSERT INTO Tbl_Permission (RoleId, ModuleId, SubModuleId, PermissionType, CreatedDate)
VALUES (@RoleId, @ModuleId, @SubModuleId, 'Full Access', GETDATE())
```

## 🧪 Testing the Integration

### Step 1: Restart Backend
The backend should automatically pick up the new SupplierController. If not, restart it:

```powershell
# Stop the current backend (Ctrl+C in the terminal)
# Then restart:
cd f:\Sruthi\sruthy\Reactjserp\Backend\api
dotnet run --urls=http://localhost:5022
```

### Step 2: Test Navigation

1. Log out and log back in (to refresh menu permissions)
2. Look for "Supplier" in your navigation menu
3. Click on it to open the Supplier management page

### Step 3: Test CRUD Operations

1. **Create**: Click "Add Supplier" button
2. **Read**: View the supplier list
3. **Update**: Click edit icon on a supplier
4. **Delete**: Click delete icon (soft delete)

## 🔍 Troubleshooting

### Supplier menu not appearing?
- Check if you added the SubModule/Module to the database
- Check if permissions are assigned to your role
- Log out and log back in to refresh the menu
- Check browser console for errors

### API errors?
- Verify the stored procedure was updated with Query=3 and Query=4
- Check backend console for errors
- Verify connection string in appsettings.json

### Frontend errors?
- Check browser console for errors
- Verify all imports are correct
- Clear browser cache and reload

## 📊 Expected Menu Structure

After setup, your menu should look like:

```
Purchase (or Procurement)
  └─ Supplier
```

Or if standalone:

```
Supplier Management
```

## 🎯 Quick Test Query

To verify the Supplier module is accessible, run:

```sql
-- Check if Supplier submodule exists
SELECT 
    m.Module_name,
    sm.SubModule_name,
    sm.Id as SubModuleId,
    sm.ModuleId
FROM Tbl_SubModule sm
LEFT JOIN Tbl_Module m ON sm.ModuleId = m.Id
WHERE sm.SubModule_name LIKE '%Supplier%'

-- Check permissions for your role
SELECT 
    r.Role_name,
    m.Module_name,
    sm.SubModule_name,
    p.PermissionType
FROM Tbl_Permission p
LEFT JOIN Tbl_Role r ON p.RoleId = r.Id
LEFT JOIN Tbl_Module m ON p.ModuleId = m.Id
LEFT JOIN Tbl_SubModule sm ON p.SubModuleId = sm.Id
WHERE sm.SubModule_name LIKE '%Supplier%' OR m.Module_name LIKE '%Supplier%'
```

## ✨ Features Available

Once integrated, you'll have access to:

- ✅ Add new suppliers with complete information
- ✅ Edit existing supplier details
- ✅ Soft delete suppliers
- ✅ Search suppliers by name, company, or email
- ✅ Paginated supplier list (10 per page)
- ✅ View supplier status and type
- ✅ Manage supplier addresses, contacts, and financial info
- ✅ Upload supplier attachments
- ✅ Set payment terms and billing rates

## 📞 Need Help?

If you encounter any issues:
1. Check the browser console (F12)
2. Check the backend terminal for errors
3. Verify database tables and stored procedures
4. Ensure all files are saved and servers are running

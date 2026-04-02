-- =============================================
-- Supplier Module Setup Script
-- Run this script to add Supplier to your menu system
-- =============================================

-- Step 1: Check if Purchase/Procurement module exists
SELECT 
    Id as ModuleId, 
    Module_name 
FROM Tbl_Module 
WHERE Module_name LIKE '%Purchase%' 
   OR Module_name LIKE '%Procurement%'
   OR Module_name LIKE '%Vendor%'
GO

-- Step 2: Add Supplier as SubModule under Purchase
-- IMPORTANT: Replace @PurchaseModuleId with the actual ID from Step 1
-- If no Purchase module exists, set @PurchaseModuleId = NULL to create standalone

DECLARE @PurchaseModuleId INT = NULL; -- SET THIS TO YOUR PURCHASE MODULE ID

-- If Purchase module doesn't exist, create it
IF @PurchaseModuleId IS NULL
BEGIN
    INSERT INTO Tbl_Module (Module_name, IsActive, CreatedDate)
    VALUES ('Purchase', 1, GETDATE())
    
    SET @PurchaseModuleId = SCOPE_IDENTITY()
    PRINT 'Created new Purchase module with ID: ' + CAST(@PurchaseModuleId AS VARCHAR)
END

-- Add Supplier SubModule
IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE SubModule_name = 'Supplier')
BEGIN
    INSERT INTO Tbl_SubModule (SubModule_name, ModuleId, IsActive, CreatedDate)
    VALUES ('Supplier', @PurchaseModuleId, 1, GETDATE())
    
    DECLARE @SupplierSubModuleId INT = SCOPE_IDENTITY()
    PRINT 'Created Supplier submodule with ID: ' + CAST(@SupplierSubModuleId AS VARCHAR)
    
    -- Step 3: Assign Full Access permission to Admin role
    DECLARE @AdminRoleId INT
    SELECT @AdminRoleId = Id FROM Tbl_Role WHERE Role_name = 'Admin' OR Role_name = 'Administrator'
    
    IF @AdminRoleId IS NOT NULL
    BEGIN
        INSERT INTO Tbl_Permission (RoleId, ModuleId, SubModuleId, PermissionType, CreatedDate)
        VALUES (@AdminRoleId, NULL, @SupplierSubModuleId, 'Full Access', GETDATE())
        
        PRINT 'Assigned Full Access permission to Admin role'
    END
    ELSE
    BEGIN
        PRINT 'WARNING: Admin role not found. Please manually assign permissions.'
    END
END
ELSE
BEGIN
    PRINT 'Supplier submodule already exists'
END
GO

-- Step 4: Verify the setup
SELECT 
    m.Id as ModuleId,
    m.Module_name,
    sm.Id as SubModuleId,
    sm.SubModule_name,
    sm.IsActive
FROM Tbl_SubModule sm
LEFT JOIN Tbl_Module m ON sm.ModuleId = m.Id
WHERE sm.SubModule_name = 'Supplier'
GO

-- Step 5: Verify permissions
SELECT 
    r.Role_name,
    m.Module_name,
    sm.SubModule_name,
    p.PermissionType
FROM Tbl_Permission p
INNER JOIN Tbl_Role r ON p.RoleId = r.Id
LEFT JOIN Tbl_Module m ON p.ModuleId = m.Id
LEFT JOIN Tbl_SubModule sm ON p.SubModuleId = sm.Id
WHERE sm.SubModule_name = 'Supplier'
GO

PRINT '============================================='
PRINT 'Supplier Module Setup Complete!'
PRINT '============================================='
PRINT 'Next Steps:'
PRINT '1. Log out and log back in to refresh your menu'
PRINT '2. Look for "Supplier" under the Purchase module'
PRINT '3. If you need to assign permissions to other roles, use:'
PRINT '   INSERT INTO Tbl_Permission (RoleId, ModuleId, SubModuleId, PermissionType, CreatedDate)'
PRINT '   VALUES (@YourRoleId, NULL, @SupplierSubModuleId, ''Full Access'', GETDATE())'
PRINT '============================================='

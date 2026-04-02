-- =============================================
-- Simple Version: Insert Admin Settings SubModules with Full Access Permissions
-- Database: db_aa32dc_erpberam
-- This version grants "Full Access" to all roles for all Admin Settings submodules
-- =============================================

USE [db_aa32dc_erpberam]
GO

-- =============================================
-- Step 1: Get or Create Admin Settings Module
-- =============================================
DECLARE @AdminSettingsModuleId INT;

SELECT @AdminSettingsModuleId = id 
FROM Tbl_Module 
WHERE LOWER(ModuleName) = LOWER('Admin Settings');

IF @AdminSettingsModuleId IS NULL
BEGIN
    INSERT INTO Tbl_Module (ModuleName, Status)
    VALUES ('Admin Settings', 'Active');
    SET @AdminSettingsModuleId = SCOPE_IDENTITY();
    PRINT 'Admin Settings module created with ID: ' + CAST(@AdminSettingsModuleId AS VARCHAR(10));
END
ELSE
BEGIN
    PRINT 'Admin Settings module found with ID: ' + CAST(@AdminSettingsModuleId AS VARCHAR(10));
END
GO

-- =============================================
-- Step 2: Insert SubModules (if not exists)
-- =============================================
DECLARE @AdminSettingsModuleId INT;
SELECT @AdminSettingsModuleId = id FROM Tbl_Module WHERE LOWER(ModuleName) = LOWER('Admin Settings');

-- Insert all submodules
IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Profile'))
    INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status) VALUES ('Profile', @AdminSettingsModuleId, 'Active');

IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Security'))
    INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status) VALUES ('Security', @AdminSettingsModuleId, 'Active');

IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Role Management'))
    INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status) VALUES ('Role Management', @AdminSettingsModuleId, 'Active');

IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Marketplace'))
    INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status) VALUES ('Marketplace', @AdminSettingsModuleId, 'Active');

IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Modules & SubModules'))
    INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status) VALUES ('Modules & SubModules', @AdminSettingsModuleId, 'Active');

IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Role Permissions'))
    INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status) VALUES ('Role Permissions', @AdminSettingsModuleId, 'Active');

IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Preferences'))
    INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status) VALUES ('Preferences', @AdminSettingsModuleId, 'Active');

IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Notifications'))
    INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status) VALUES ('Notifications', @AdminSettingsModuleId, 'Active');

IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('System Settings'))
    INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status) VALUES ('System Settings', @AdminSettingsModuleId, 'Active');

IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('User Management'))
    INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status) VALUES ('User Management', @AdminSettingsModuleId, 'Active');

PRINT 'All submodules inserted/verified.';
GO

-- =============================================
-- Step 3: Grant Full Access to All Roles for All SubModules
-- =============================================
DECLARE @AdminSettingsModuleId INT;
SELECT @AdminSettingsModuleId = id FROM Tbl_Module WHERE LOWER(ModuleName) = LOWER('Admin Settings');

-- Insert Full Access permission for each role and each submodule
INSERT INTO Tbl_Permission (RoleId, ModuleId, SubModuleId, PermissionType, Status)
SELECT 
    r.id AS RoleId,
    @AdminSettingsModuleId AS ModuleId,
    sm.id AS SubModuleId,
    'Full Access' AS PermissionType,
    'Active' AS Status
FROM Tbl_Role r
CROSS JOIN Tbl_SubModule sm
WHERE sm.ModuleId = @AdminSettingsModuleId
AND r.Status = 'Active'
AND NOT EXISTS (
    SELECT 1 FROM Tbl_Permission p
    WHERE p.RoleId = r.id
    AND p.ModuleId = @AdminSettingsModuleId
    AND p.SubModuleId = sm.id
    AND p.PermissionType = 'Full Access'
);

PRINT 'Full Access permissions granted to all active roles for all Admin Settings submodules.';
GO

-- =============================================
-- Verification
-- =============================================
PRINT '';
PRINT '=== VERIFICATION: Admin Settings SubModules ===';
SELECT 
    sm.id AS SubModuleId,
    sm.SubModuleName,
    sm.Status
FROM Tbl_SubModule sm
INNER JOIN Tbl_Module m ON sm.ModuleId = m.id
WHERE m.ModuleName = 'Admin Settings'
ORDER BY sm.SubModuleName;

PRINT '';
PRINT '=== VERIFICATION: Permissions Summary ===';
SELECT 
    r.Role,
    sm.SubModuleName,
    p.PermissionType,
    p.Status
FROM Tbl_Permission p
INNER JOIN Tbl_Role r ON p.RoleId = r.id
INNER JOIN Tbl_Module m ON p.ModuleId = m.id
INNER JOIN Tbl_SubModule sm ON p.SubModuleId = sm.id
WHERE m.ModuleName = 'Admin Settings'
ORDER BY r.Role, sm.SubModuleName, p.PermissionType;

GO

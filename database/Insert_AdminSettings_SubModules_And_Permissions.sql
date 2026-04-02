-- =============================================
-- Insert Admin Settings SubModules and Permissions
-- Database: db_aa32dc_erpberam
-- =============================================

USE [db_aa32dc_erpberam]
GO

-- =============================================
-- Step 1: Get or Create Admin Settings Module
-- =============================================
DECLARE @AdminSettingsModuleId INT;

-- Check if Admin Settings module exists
SELECT @AdminSettingsModuleId = id 
FROM Tbl_Module 
WHERE LOWER(ModuleName) = LOWER('Admin Settings');

-- If not exists, create it
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
-- Step 2: Insert SubModules under Admin Settings
-- =============================================
DECLARE @AdminSettingsModuleId INT;
SELECT @AdminSettingsModuleId = id FROM Tbl_Module WHERE LOWER(ModuleName) = LOWER('Admin Settings');

-- Declare variables for submodule IDs
DECLARE @ProfileSubModuleId INT;
DECLARE @SecuritySubModuleId INT;
DECLARE @RoleManagementSubModuleId INT;
DECLARE @MarketplaceSubModuleId INT;
DECLARE @ModulesSubModulesSubModuleId INT;
DECLARE @RolePermissionsSubModuleId INT;
DECLARE @PreferencesSubModuleId INT;
DECLARE @NotificationsSubModuleId INT;
DECLARE @SystemSettingsSubModuleId INT;
DECLARE @UserManagementSubModuleId INT;

-- Insert Profile SubModule (if not exists)
IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Profile'))
BEGIN
    INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status)
    VALUES ('Profile', @AdminSettingsModuleId, 'Active');
    SET @ProfileSubModuleId = SCOPE_IDENTITY();
    PRINT 'Profile submodule created with ID: ' + CAST(@ProfileSubModuleId AS VARCHAR(10));
END
ELSE
BEGIN
    SELECT @ProfileSubModuleId = id FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Profile');
    PRINT 'Profile submodule already exists with ID: ' + CAST(@ProfileSubModuleId AS VARCHAR(10));
END

-- Insert Security SubModule (if not exists)
IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Security'))
BEGIN
    INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status)
    VALUES ('Security', @AdminSettingsModuleId, 'Active');
    SET @SecuritySubModuleId = SCOPE_IDENTITY();
    PRINT 'Security submodule created with ID: ' + CAST(@SecuritySubModuleId AS VARCHAR(10));
END
ELSE
BEGIN
    SELECT @SecuritySubModuleId = id FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Security');
    PRINT 'Security submodule already exists with ID: ' + CAST(@SecuritySubModuleId AS VARCHAR(10));
END

-- Insert Role Management SubModule (if not exists)
IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Role Management'))
BEGIN
    INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status)
    VALUES ('Role Management', @AdminSettingsModuleId, 'Active');
    SET @RoleManagementSubModuleId = SCOPE_IDENTITY();
    PRINT 'Role Management submodule created with ID: ' + CAST(@RoleManagementSubModuleId AS VARCHAR(10));
END
ELSE
BEGIN
    SELECT @RoleManagementSubModuleId = id FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Role Management');
    PRINT 'Role Management submodule already exists with ID: ' + CAST(@RoleManagementSubModuleId AS VARCHAR(10));
END

-- Insert Marketplace SubModule (if not exists)
IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Marketplace'))
BEGIN
    INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status)
    VALUES ('Marketplace', @AdminSettingsModuleId, 'Active');
    SET @MarketplaceSubModuleId = SCOPE_IDENTITY();
    PRINT 'Marketplace submodule created with ID: ' + CAST(@MarketplaceSubModuleId AS VARCHAR(10));
END
ELSE
BEGIN
    SELECT @MarketplaceSubModuleId = id FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Marketplace');
    PRINT 'Marketplace submodule already exists with ID: ' + CAST(@MarketplaceSubModuleId AS VARCHAR(10));
END

-- Insert Modules & SubModules SubModule (if not exists)
IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Modules & SubModules'))
BEGIN
    INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status)
    VALUES ('Modules & SubModules', @AdminSettingsModuleId, 'Active');
    SET @ModulesSubModulesSubModuleId = SCOPE_IDENTITY();
    PRINT 'Modules & SubModules submodule created with ID: ' + CAST(@ModulesSubModulesSubModuleId AS VARCHAR(10));
END
ELSE
BEGIN
    SELECT @ModulesSubModulesSubModuleId = id FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Modules & SubModules');
    PRINT 'Modules & SubModules submodule already exists with ID: ' + CAST(@ModulesSubModulesSubModuleId AS VARCHAR(10));
END

-- Insert Role Permissions SubModule (if not exists)
IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Role Permissions'))
BEGIN
    INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status)
    VALUES ('Role Permissions', @AdminSettingsModuleId, 'Active');
    SET @RolePermissionsSubModuleId = SCOPE_IDENTITY();
    PRINT 'Role Permissions submodule created with ID: ' + CAST(@RolePermissionsSubModuleId AS VARCHAR(10));
END
ELSE
BEGIN
    SELECT @RolePermissionsSubModuleId = id FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Role Permissions');
    PRINT 'Role Permissions submodule already exists with ID: ' + CAST(@RolePermissionsSubModuleId AS VARCHAR(10));
END

-- Insert Preferences SubModule (if not exists)
IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Preferences'))
BEGIN
    INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status)
    VALUES ('Preferences', @AdminSettingsModuleId, 'Active');
    SET @PreferencesSubModuleId = SCOPE_IDENTITY();
    PRINT 'Preferences submodule created with ID: ' + CAST(@PreferencesSubModuleId AS VARCHAR(10));
END
ELSE
BEGIN
    SELECT @PreferencesSubModuleId = id FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Preferences');
    PRINT 'Preferences submodule already exists with ID: ' + CAST(@PreferencesSubModuleId AS VARCHAR(10));
END

-- Insert Notifications SubModule (if not exists)
IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Notifications'))
BEGIN
    INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status)
    VALUES ('Notifications', @AdminSettingsModuleId, 'Active');
    SET @NotificationsSubModuleId = SCOPE_IDENTITY();
    PRINT 'Notifications submodule created with ID: ' + CAST(@NotificationsSubModuleId AS VARCHAR(10));
END
ELSE
BEGIN
    SELECT @NotificationsSubModuleId = id FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Notifications');
    PRINT 'Notifications submodule already exists with ID: ' + CAST(@NotificationsSubModuleId AS VARCHAR(10));
END

-- Insert System Settings SubModule (if not exists)
IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('System Settings'))
BEGIN
    INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status)
    VALUES ('System Settings', @AdminSettingsModuleId, 'Active');
    SET @SystemSettingsSubModuleId = SCOPE_IDENTITY();
    PRINT 'System Settings submodule created with ID: ' + CAST(@SystemSettingsSubModuleId AS VARCHAR(10));
END
ELSE
BEGIN
    SELECT @SystemSettingsSubModuleId = id FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('System Settings');
    PRINT 'System Settings submodule already exists with ID: ' + CAST(@SystemSettingsSubModuleId AS VARCHAR(10));
END

-- Insert User Management SubModule (if not exists)
IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('User Management'))
BEGIN
    INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status)
    VALUES ('User Management', @AdminSettingsModuleId, 'Active');
    SET @UserManagementSubModuleId = SCOPE_IDENTITY();
    PRINT 'User Management submodule created with ID: ' + CAST(@UserManagementSubModuleId AS VARCHAR(10));
END
ELSE
BEGIN
    SELECT @UserManagementSubModuleId = id FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('User Management');
    PRINT 'User Management submodule already exists with ID: ' + CAST(@UserManagementSubModuleId AS VARCHAR(10));
END

GO

-- =============================================
-- Step 3: Insert Permissions for All Roles
-- This will grant "Full Access" to all Admin Settings submodules for all roles
-- You can modify the RoleId and PermissionType as needed
-- =============================================

DECLARE @AdminSettingsModuleId INT;
SELECT @AdminSettingsModuleId = id FROM Tbl_Module WHERE LOWER(ModuleName) = LOWER('Admin Settings');

-- Get all submodule IDs
DECLARE @ProfileSubModuleId INT;
DECLARE @SecuritySubModuleId INT;
DECLARE @RoleManagementSubModuleId INT;
DECLARE @MarketplaceSubModuleId INT;
DECLARE @ModulesSubModulesSubModuleId INT;
DECLARE @RolePermissionsSubModuleId INT;
DECLARE @PreferencesSubModuleId INT;
DECLARE @NotificationsSubModuleId INT;
DECLARE @SystemSettingsSubModuleId INT;
DECLARE @UserManagementSubModuleId INT;

SELECT @ProfileSubModuleId = id FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Profile');
SELECT @SecuritySubModuleId = id FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Security');
SELECT @RoleManagementSubModuleId = id FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Role Management');
SELECT @MarketplaceSubModuleId = id FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Marketplace');
SELECT @ModulesSubModulesSubModuleId = id FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Modules & SubModules');
SELECT @RolePermissionsSubModuleId = id FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Role Permissions');
SELECT @PreferencesSubModuleId = id FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Preferences');
SELECT @NotificationsSubModuleId = id FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Notifications');
SELECT @SystemSettingsSubModuleId = id FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('System Settings');
SELECT @UserManagementSubModuleId = id FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('User Management');

-- Get all Role IDs (you can modify this to target specific roles)
DECLARE @RoleId INT;

-- Cursor to iterate through all roles
DECLARE role_cursor CURSOR FOR
SELECT id FROM Tbl_Role WHERE Status = 'Active';

OPEN role_cursor;
FETCH NEXT FROM role_cursor INTO @RoleId;

WHILE @@FETCH_STATUS = 0
BEGIN
    PRINT 'Processing permissions for Role ID: ' + CAST(@RoleId AS VARCHAR(10));
    
    -- Permission types to grant
    DECLARE @PermissionTypes TABLE (PermissionType VARCHAR(50));
    INSERT INTO @PermissionTypes VALUES ('Full Access'), ('View'), ('Create'), ('Edit'), ('Delete'), ('Approve'), ('All Record');
    
    -- Insert permissions for each submodule and permission type
    -- Profile
    INSERT INTO Tbl_Permission (RoleId, ModuleId, SubModuleId, PermissionType, Status)
    SELECT @RoleId, @AdminSettingsModuleId, @ProfileSubModuleId, pt.PermissionType, 'Active'
    FROM @PermissionTypes pt
    WHERE NOT EXISTS (
        SELECT 1 FROM Tbl_Permission 
        WHERE RoleId = @RoleId 
        AND ModuleId = @AdminSettingsModuleId 
        AND SubModuleId = @ProfileSubModuleId 
        AND PermissionType = pt.PermissionType
    );
    
    -- Security
    INSERT INTO Tbl_Permission (RoleId, ModuleId, SubModuleId, PermissionType, Status)
    SELECT @RoleId, @AdminSettingsModuleId, @SecuritySubModuleId, pt.PermissionType, 'Active'
    FROM @PermissionTypes pt
    WHERE NOT EXISTS (
        SELECT 1 FROM Tbl_Permission 
        WHERE RoleId = @RoleId 
        AND ModuleId = @AdminSettingsModuleId 
        AND SubModuleId = @SecuritySubModuleId 
        AND PermissionType = pt.PermissionType
    );
    
    -- Role Management
    INSERT INTO Tbl_Permission (RoleId, ModuleId, SubModuleId, PermissionType, Status)
    SELECT @RoleId, @AdminSettingsModuleId, @RoleManagementSubModuleId, pt.PermissionType, 'Active'
    FROM @PermissionTypes pt
    WHERE NOT EXISTS (
        SELECT 1 FROM Tbl_Permission 
        WHERE RoleId = @RoleId 
        AND ModuleId = @AdminSettingsModuleId 
        AND SubModuleId = @RoleManagementSubModuleId 
        AND PermissionType = pt.PermissionType
    );
    
    -- Marketplace
    INSERT INTO Tbl_Permission (RoleId, ModuleId, SubModuleId, PermissionType, Status)
    SELECT @RoleId, @AdminSettingsModuleId, @MarketplaceSubModuleId, pt.PermissionType, 'Active'
    FROM @PermissionTypes pt
    WHERE NOT EXISTS (
        SELECT 1 FROM Tbl_Permission 
        WHERE RoleId = @RoleId 
        AND ModuleId = @AdminSettingsModuleId 
        AND SubModuleId = @MarketplaceSubModuleId 
        AND PermissionType = pt.PermissionType
    );
    
    -- Modules & SubModules
    INSERT INTO Tbl_Permission (RoleId, ModuleId, SubModuleId, PermissionType, Status)
    SELECT @RoleId, @AdminSettingsModuleId, @ModulesSubModulesSubModuleId, pt.PermissionType, 'Active'
    FROM @PermissionTypes pt
    WHERE NOT EXISTS (
        SELECT 1 FROM Tbl_Permission 
        WHERE RoleId = @RoleId 
        AND ModuleId = @AdminSettingsModuleId 
        AND SubModuleId = @ModulesSubModulesSubModuleId 
        AND PermissionType = pt.PermissionType
    );
    
    -- Role Permissions
    INSERT INTO Tbl_Permission (RoleId, ModuleId, SubModuleId, PermissionType, Status)
    SELECT @RoleId, @AdminSettingsModuleId, @RolePermissionsSubModuleId, pt.PermissionType, 'Active'
    FROM @PermissionTypes pt
    WHERE NOT EXISTS (
        SELECT 1 FROM Tbl_Permission 
        WHERE RoleId = @RoleId 
        AND ModuleId = @AdminSettingsModuleId 
        AND SubModuleId = @RolePermissionsSubModuleId 
        AND PermissionType = pt.PermissionType
    );
    
    -- Preferences
    INSERT INTO Tbl_Permission (RoleId, ModuleId, SubModuleId, PermissionType, Status)
    SELECT @RoleId, @AdminSettingsModuleId, @PreferencesSubModuleId, pt.PermissionType, 'Active'
    FROM @PermissionTypes pt
    WHERE NOT EXISTS (
        SELECT 1 FROM Tbl_Permission 
        WHERE RoleId = @RoleId 
        AND ModuleId = @AdminSettingsModuleId 
        AND SubModuleId = @PreferencesSubModuleId 
        AND PermissionType = pt.PermissionType
    );
    
    -- Notifications
    INSERT INTO Tbl_Permission (RoleId, ModuleId, SubModuleId, PermissionType, Status)
    SELECT @RoleId, @AdminSettingsModuleId, @NotificationsSubModuleId, pt.PermissionType, 'Active'
    FROM @PermissionTypes pt
    WHERE NOT EXISTS (
        SELECT 1 FROM Tbl_Permission 
        WHERE RoleId = @RoleId 
        AND ModuleId = @AdminSettingsModuleId 
        AND SubModuleId = @NotificationsSubModuleId 
        AND PermissionType = pt.PermissionType
    );
    
    -- System Settings
    INSERT INTO Tbl_Permission (RoleId, ModuleId, SubModuleId, PermissionType, Status)
    SELECT @RoleId, @AdminSettingsModuleId, @SystemSettingsSubModuleId, pt.PermissionType, 'Active'
    FROM @PermissionTypes pt
    WHERE NOT EXISTS (
        SELECT 1 FROM Tbl_Permission 
        WHERE RoleId = @RoleId 
        AND ModuleId = @AdminSettingsModuleId 
        AND SubModuleId = @SystemSettingsSubModuleId 
        AND PermissionType = pt.PermissionType
    );
    
    -- User Management
    INSERT INTO Tbl_Permission (RoleId, ModuleId, SubModuleId, PermissionType, Status)
    SELECT @RoleId, @AdminSettingsModuleId, @UserManagementSubModuleId, pt.PermissionType, 'Active'
    FROM @PermissionTypes pt
    WHERE NOT EXISTS (
        SELECT 1 FROM Tbl_Permission 
        WHERE RoleId = @RoleId 
        AND ModuleId = @AdminSettingsModuleId 
        AND SubModuleId = @UserManagementSubModuleId 
        AND PermissionType = pt.PermissionType
    );
    
    FETCH NEXT FROM role_cursor INTO @RoleId;
END

CLOSE role_cursor;
DEALLOCATE role_cursor;

PRINT 'All permissions inserted successfully!';

-- =============================================
-- Step 4: Verification Query
-- =============================================
PRINT '';
PRINT '=== VERIFICATION: Admin Settings SubModules ===';
SELECT 
    sm.id AS SubModuleId,
    sm.SubModuleName,
    sm.ModuleId,
    m.ModuleName,
    sm.Status
FROM Tbl_SubModule sm
INNER JOIN Tbl_Module m ON sm.ModuleId = m.id
WHERE m.ModuleName = 'Admin Settings'
ORDER BY sm.SubModuleName;

PRINT '';
PRINT '=== VERIFICATION: Permissions Count ===';
SELECT 
    r.Role,
    COUNT(p.id) AS PermissionCount
FROM Tbl_Role r
LEFT JOIN Tbl_Permission p ON r.id = p.RoleId
INNER JOIN Tbl_Module m ON p.ModuleId = m.id
WHERE m.ModuleName = 'Admin Settings'
GROUP BY r.id, r.Role
ORDER BY r.Role;

GO

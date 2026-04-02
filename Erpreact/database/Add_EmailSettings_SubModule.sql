-- =============================================
-- Add Email Settings SubModule under Admin Settings
-- Database: db_aa32dc_erpberam
-- =============================================

USE [db_aa32dc_erpberam]
GO

-- Get Admin Settings Module ID
DECLARE @AdminSettingsModuleId INT;
SELECT @AdminSettingsModuleId = id 
FROM Tbl_Module 
WHERE LOWER(ModuleName) = LOWER('Admin Settings');

IF @AdminSettingsModuleId IS NULL
BEGIN
    PRINT 'ERROR: Admin Settings module not found. Please run Insert_AdminSettings_SubModules_Simple.sql first.';
    RETURN;
END

PRINT 'Admin Settings module found with ID: ' + CAST(@AdminSettingsModuleId AS VARCHAR(10));

-- Insert Email Settings SubModule (if not exists)
IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE ModuleId = @AdminSettingsModuleId AND LOWER(SubModuleName) = LOWER('Email Settings'))
BEGIN
    INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status)
    VALUES ('Email Settings', @AdminSettingsModuleId, 'Active');
    
    DECLARE @EmailSettingsSubModuleId INT = SCOPE_IDENTITY();
    PRINT 'Email Settings submodule created with ID: ' + CAST(@EmailSettingsSubModuleId AS VARCHAR(10));
    
    -- Grant Full Access to all active roles for Email Settings submodule
    INSERT INTO Tbl_Permission (RoleId, ModuleId, SubModuleId, PermissionType, Status)
    SELECT 
        r.id AS RoleId,
        @AdminSettingsModuleId AS ModuleId,
        @EmailSettingsSubModuleId AS SubModuleId,
        'Full Access' AS PermissionType,
        'Active' AS Status
    FROM Tbl_Role r
    WHERE r.Status = 'Active'
    AND NOT EXISTS (
        SELECT 1 FROM Tbl_Permission p
        WHERE p.RoleId = r.id
        AND p.ModuleId = @AdminSettingsModuleId
        AND p.SubModuleId = @EmailSettingsSubModuleId
        AND p.PermissionType = 'Full Access'
    );
    
    PRINT 'Full Access permissions granted to all active roles for Email Settings submodule.';
END
ELSE
BEGIN
    PRINT 'Email Settings submodule already exists.';
END

-- Verification
PRINT '';
PRINT '=== VERIFICATION: Email Settings SubModule ===';
SELECT 
    sm.id AS SubModuleId,
    sm.SubModuleName,
    sm.ModuleId,
    m.ModuleName,
    sm.Status
FROM Tbl_SubModule sm
INNER JOIN Tbl_Module m ON sm.ModuleId = m.id
WHERE m.ModuleName = 'Admin Settings'
AND LOWER(sm.SubModuleName) = LOWER('Email Settings');

GO

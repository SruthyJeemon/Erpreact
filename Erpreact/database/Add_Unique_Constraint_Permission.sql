-- =============================================
-- Add Unique Constraint to Prevent Duplicate Permissions
-- Database: db_aa32dc_erpberam
-- IMPORTANT: Run Cleanup_Permission_Table.sql FIRST to remove duplicates!
-- =============================================

USE [db_aa32dc_erpberam]
GO

-- Check for duplicates before creating constraint
PRINT 'Checking for duplicate entries before creating unique constraint...'
GO

DECLARE @DuplicateCount INT;
SELECT @DuplicateCount = COUNT(*) - COUNT(DISTINCT CONCAT(RoleId, '|', ModuleId, '|', ISNULL(CAST(SubModuleId AS VARCHAR), 'NULL'), '|', PermissionType))
FROM Tbl_Permission
WHERE Status = 'Active';

IF @DuplicateCount > 0
BEGIN
    PRINT 'ERROR: ' + CAST(@DuplicateCount AS VARCHAR) + ' duplicate entries found!';
    PRINT 'Please run Cleanup_Permission_Table.sql first to remove duplicates.';
    PRINT 'Aborting unique constraint creation.';
    RETURN;
END
GO

-- Remove existing constraint if it exists
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tbl_Permission_Unique' AND object_id = OBJECT_ID('Tbl_Permission'))
BEGIN
    DROP INDEX IX_Tbl_Permission_Unique ON Tbl_Permission;
    PRINT 'Existing unique index removed.';
END
GO

-- Add unique constraint to prevent duplicate permissions
-- A role can only have one permission of each type for a module/submodule combination
-- Using filtered index to only check Active permissions
-- Note: NULL values in SubModuleId are treated as distinct values in unique indexes
CREATE UNIQUE NONCLUSTERED INDEX IX_Tbl_Permission_Unique
ON Tbl_Permission (RoleId, ModuleId, SubModuleId, PermissionType)
WHERE Status = 'Active';
GO

PRINT 'Unique constraint added successfully!'
PRINT 'This will prevent duplicate permissions for the same role, module, submodule, and permission type.'
GO

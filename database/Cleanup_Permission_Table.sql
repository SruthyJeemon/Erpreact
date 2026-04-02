-- =============================================
-- Cleanup Permission Table
-- Remove unused columns and duplicate entries
-- Database: db_aa32dc_erpberam
-- =============================================

USE [db_aa32dc_erpberam]
GO

-- Step 1: Remove duplicate entries
-- Keep only the first occurrence (lowest id) of each unique combination
-- (RoleId, ModuleId, SubModuleId, PermissionType)
-- Handle NULL SubModuleId properly

PRINT 'Removing duplicate entries...'
GO

-- Delete duplicates, keeping the lowest id for each unique combination
DELETE p1
FROM Tbl_Permission p1
INNER JOIN Tbl_Permission p2 ON 
    p1.RoleId = p2.RoleId 
    AND p1.ModuleId = p2.ModuleId
    AND (p1.SubModuleId = p2.SubModuleId OR (p1.SubModuleId IS NULL AND p2.SubModuleId IS NULL))
    AND p1.PermissionType = p2.PermissionType
    AND p1.Status = p2.Status
WHERE p1.id > p2.id;
GO

DECLARE @DeletedCount INT;
SET @DeletedCount = @@ROWCOUNT;
PRINT 'Deleted ' + CAST(@DeletedCount AS VARCHAR) + ' duplicate entries.'
GO

-- Verify no duplicates remain
DECLARE @DuplicateCount INT;
SELECT @DuplicateCount = COUNT(*) - COUNT(DISTINCT 
    CAST(RoleId AS VARCHAR) + '|' + 
    CAST(ModuleId AS VARCHAR) + '|' + 
    ISNULL(CAST(SubModuleId AS VARCHAR), 'NULL') + '|' + 
    PermissionType
)
FROM Tbl_Permission
WHERE Status = 'Active';

IF @DuplicateCount > 0
BEGIN
    PRINT 'Warning: ' + CAST(@DuplicateCount AS VARCHAR) + ' duplicate entries may still exist.';
    PRINT 'Please review the data manually.';
END
ELSE
BEGIN
    PRINT 'All duplicate entries removed successfully!';
END
GO

-- Step 2: Remove unused columns (Reads, Writes, Deletes, Isdelete, Menu)
-- First drop default constraints, then drop the columns

PRINT 'Removing default constraints and unused columns...'
GO

-- Drop default constraints first
DECLARE @ConstraintName NVARCHAR(200);

-- Drop Reads default constraint
SELECT @ConstraintName = name 
FROM sys.default_constraints 
WHERE parent_object_id = OBJECT_ID('Tbl_Permission') 
AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('Tbl_Permission') AND name = 'Reads');

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE Tbl_Permission DROP CONSTRAINT ' + @ConstraintName);
    PRINT 'Default constraint for Reads column removed.';
END
GO

-- Drop Writes default constraint
DECLARE @ConstraintName NVARCHAR(200);
SELECT @ConstraintName = name 
FROM sys.default_constraints 
WHERE parent_object_id = OBJECT_ID('Tbl_Permission') 
AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('Tbl_Permission') AND name = 'Writes');

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE Tbl_Permission DROP CONSTRAINT ' + @ConstraintName);
    PRINT 'Default constraint for Writes column removed.';
END
GO

-- Drop Deletes default constraint
DECLARE @ConstraintName NVARCHAR(200);
SELECT @ConstraintName = name 
FROM sys.default_constraints 
WHERE parent_object_id = OBJECT_ID('Tbl_Permission') 
AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('Tbl_Permission') AND name = 'Deletes');

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE Tbl_Permission DROP CONSTRAINT ' + @ConstraintName);
    PRINT 'Default constraint for Deletes column removed.';
END
GO

-- Drop Isdelete default constraint
DECLARE @ConstraintName NVARCHAR(200);
SELECT @ConstraintName = name 
FROM sys.default_constraints 
WHERE parent_object_id = OBJECT_ID('Tbl_Permission') 
AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('Tbl_Permission') AND name = 'Isdelete');

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE Tbl_Permission DROP CONSTRAINT ' + @ConstraintName);
    PRINT 'Default constraint for Isdelete column removed.';
END
GO

-- Now drop the columns
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tbl_Permission') AND name = 'Reads')
BEGIN
    ALTER TABLE Tbl_Permission DROP COLUMN Reads;
    PRINT 'Column Reads removed successfully!'
END
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tbl_Permission') AND name = 'Writes')
BEGIN
    ALTER TABLE Tbl_Permission DROP COLUMN Writes;
    PRINT 'Column Writes removed successfully!'
END
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tbl_Permission') AND name = 'Deletes')
BEGIN
    ALTER TABLE Tbl_Permission DROP COLUMN Deletes;
    PRINT 'Column Deletes removed successfully!'
END
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tbl_Permission') AND name = 'Isdelete')
BEGIN
    ALTER TABLE Tbl_Permission DROP COLUMN Isdelete;
    PRINT 'Column Isdelete removed successfully!'
END
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tbl_Permission') AND name = 'Menu')
BEGIN
    ALTER TABLE Tbl_Permission DROP COLUMN Menu;
    PRINT 'Column Menu removed successfully!'
END
GO

PRINT 'Cleanup completed successfully!'
GO

-- Optional: Show remaining permission count
SELECT COUNT(*) AS TotalPermissions FROM Tbl_Permission;
GO

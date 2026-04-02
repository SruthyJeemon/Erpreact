-- =============================================
-- Drop Default Constraints from Tbl_Permission
-- Database: db_aa32dc_erpberam
-- =============================================

USE [db_aa32dc_erpberam]
GO

PRINT 'Dropping default constraints...'
GO

-- Drop Reads default constraint
IF EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'DF__Tbl_Permi__Reads__7F01C5FD')
BEGIN
    ALTER TABLE Tbl_Permission DROP CONSTRAINT DF__Tbl_Permi__Reads__7F01C5FD;
    PRINT 'Default constraint DF__Tbl_Permi__Reads__7F01C5FD removed.';
END
ELSE
BEGIN
    -- Try to find and drop any constraint on Reads column
    DECLARE @ReadsConstraint NVARCHAR(200);
    SELECT @ReadsConstraint = name 
    FROM sys.default_constraints 
    WHERE parent_object_id = OBJECT_ID('Tbl_Permission') 
    AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('Tbl_Permission') AND name = 'Reads');
    
    IF @ReadsConstraint IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE Tbl_Permission DROP CONSTRAINT ' + @ReadsConstraint);
        PRINT 'Default constraint for Reads column removed: ' + @ReadsConstraint;
    END
END
GO

-- Drop Writes default constraint
IF EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'DF__Tbl_Permi__Write__7FF5EA36')
BEGIN
    ALTER TABLE Tbl_Permission DROP CONSTRAINT DF__Tbl_Permi__Write__7FF5EA36;
    PRINT 'Default constraint DF__Tbl_Permi__Write__7FF5EA36 removed.';
END
ELSE
BEGIN
    DECLARE @WritesConstraint NVARCHAR(200);
    SELECT @WritesConstraint = name 
    FROM sys.default_constraints 
    WHERE parent_object_id = OBJECT_ID('Tbl_Permission') 
    AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('Tbl_Permission') AND name = 'Writes');
    
    IF @WritesConstraint IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE Tbl_Permission DROP CONSTRAINT ' + @WritesConstraint);
        PRINT 'Default constraint for Writes column removed: ' + @WritesConstraint;
    END
END
GO

-- Drop Deletes default constraint
IF EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'DF__Tbl_Permi__Delet__00EA0E6F')
BEGIN
    ALTER TABLE Tbl_Permission DROP CONSTRAINT DF__Tbl_Permi__Delet__00EA0E6F;
    PRINT 'Default constraint DF__Tbl_Permi__Delet__00EA0E6F removed.';
END
ELSE
BEGIN
    DECLARE @DeletesConstraint NVARCHAR(200);
    SELECT @DeletesConstraint = name 
    FROM sys.default_constraints 
    WHERE parent_object_id = OBJECT_ID('Tbl_Permission') 
    AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('Tbl_Permission') AND name = 'Deletes');
    
    IF @DeletesConstraint IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE Tbl_Permission DROP CONSTRAINT ' + @DeletesConstraint);
        PRINT 'Default constraint for Deletes column removed: ' + @DeletesConstraint;
    END
END
GO

-- Drop Isdelete default constraint
IF EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'DF__Tbl_Permi__Isdel__01DE32A8')
BEGIN
    ALTER TABLE Tbl_Permission DROP CONSTRAINT DF__Tbl_Permi__Isdel__01DE32A8;
    PRINT 'Default constraint DF__Tbl_Permi__Isdel__01DE32A8 removed.';
END
ELSE
BEGIN
    DECLARE @IsdeleteConstraint NVARCHAR(200);
    SELECT @IsdeleteConstraint = name 
    FROM sys.default_constraints 
    WHERE parent_object_id = OBJECT_ID('Tbl_Permission') 
    AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('Tbl_Permission') AND name = 'Isdelete');
    
    IF @IsdeleteConstraint IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE Tbl_Permission DROP CONSTRAINT ' + @IsdeleteConstraint);
        PRINT 'Default constraint for Isdelete column removed: ' + @IsdeleteConstraint;
    END
END
GO

PRINT 'Default constraints dropped successfully!'
PRINT 'Now you can run the column drop statements from Cleanup_Permission_Table.sql'
GO

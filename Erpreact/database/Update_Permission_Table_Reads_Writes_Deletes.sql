-- =============================================
-- Update Tbl_Permission to use Reads, Writes, Deletes
-- Database: db_aa32dc_erpberam
-- =============================================

USE [db_aa32dc_erpberam]
GO

-- Add new columns if they don't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Tbl_Permission]') AND name = 'Reads')
BEGIN
    ALTER TABLE [dbo].[Tbl_Permission]
    ADD [Reads] [bit] NOT NULL DEFAULT 0;
    PRINT 'Reads column added successfully!'
END
ELSE
BEGIN
    PRINT 'Reads column already exists'
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Tbl_Permission]') AND name = 'Writes')
BEGIN
    ALTER TABLE [dbo].[Tbl_Permission]
    ADD [Writes] [bit] NOT NULL DEFAULT 0;
    PRINT 'Writes column added successfully!'
END
ELSE
BEGIN
    PRINT 'Writes column already exists'
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Tbl_Permission]') AND name = 'Deletes')
BEGIN
    ALTER TABLE [dbo].[Tbl_Permission]
    ADD [Deletes] [bit] NOT NULL DEFAULT 0;
    PRINT 'Deletes column added successfully!'
END
ELSE
BEGIN
    PRINT 'Deletes column already exists'
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Tbl_Permission]') AND name = 'Isdelete')
BEGIN
    ALTER TABLE [dbo].[Tbl_Permission]
    ADD [Isdelete] [bit] NOT NULL DEFAULT 0;
    PRINT 'Isdelete column added successfully!'
END
ELSE
BEGIN
    PRINT 'Isdelete column already exists'
END
GO

-- Add Menu path column for storing menu path like /Sales/Customer
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Tbl_Permission]') AND name = 'Menu')
BEGIN
    ALTER TABLE [dbo].[Tbl_Permission]
    ADD [Menu] [varchar](200) NULL;
    PRINT 'Menu column added successfully!'
END
ELSE
BEGIN
    PRINT 'Menu column already exists'
END
GO

PRINT 'Permission table updated successfully with Reads, Writes, Deletes, Isdelete, and Menu columns!'
GO

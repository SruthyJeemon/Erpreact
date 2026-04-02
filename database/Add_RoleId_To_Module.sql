-- =============================================
-- Add RoleId column to Tbl_Module
-- Database: db_aa32dc_erpberam
-- =============================================

USE [db_aa32dc_erpberam]
GO

-- Add RoleId column to Tbl_Module if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Tbl_Module]') AND name = 'RoleId')
BEGIN
    ALTER TABLE [dbo].[Tbl_Module]
    ADD [RoleId] [int] NULL;
    
    -- Add foreign key constraint
    ALTER TABLE [dbo].[Tbl_Module]
    ADD CONSTRAINT [FK_Tbl_Module_Tbl_Role] FOREIGN KEY([RoleId]) REFERENCES [dbo].[Tbl_Role] ([id]);
    
    PRINT 'RoleId column added to Tbl_Module successfully!'
END
ELSE
BEGIN
    PRINT 'RoleId column already exists in Tbl_Module'
END
GO

-- ======================================================
-- Script: Setup_Task_Tables.sql
-- Description: Creates the Task Category table and seeds it
-- ======================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Tbl_Taskcategory]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Tbl_Taskcategory](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [Category] [varchar](255) NULL,
        [Catelogid] [varchar](50) NULL,
        [Status] [varchar](50) DEFAULT 'Active',
        [Isdelete] [int] DEFAULT 0,
        CONSTRAINT [PK_Tbl_Taskcategory] PRIMARY KEY CLUSTERED ([Id] ASC)
    )
END
GO

-- Seed default categories provided by user
IF NOT EXISTS (SELECT TOP 1 1 FROM [dbo].[Tbl_Taskcategory])
BEGIN
    INSERT INTO [dbo].[Tbl_Taskcategory] (Category, Catelogid) VALUES 
    ('Listing', '2'),
    ('Photo', '2'),
    ('Graphics', '2'),
    ('Research', '2'),
    ('RMA', '1'),
    ('Price', '1'),
    ('Product', '1'),
    ('Transfers', '1'),
    ('Inventory', '1');
END
GO

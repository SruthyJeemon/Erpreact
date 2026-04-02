-- =============================================
-- Tables for React ERP System
-- Database: db_aa32dc_erpberam
-- =============================================

USE [db_aa32dc_erpberam]
GO

-- =============================================
-- Table: Tbl_Module
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Tbl_Module]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Tbl_Module](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [ModuleName] [varchar](50) NULL,
        [Status] [varchar](50) NULL,
        CONSTRAINT [PK_Tbl_Module] PRIMARY KEY CLUSTERED ([id] ASC)
    ) ON [PRIMARY]
END
GO

-- =============================================
-- Table: Tbl_SubModule
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Tbl_SubModule]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Tbl_SubModule](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [SubModuleName] [varchar](50) NULL,
        [ModuleId] [int] NULL,
        [Status] [varchar](50) NULL,
        CONSTRAINT [PK_Tbl_SubModule] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_Tbl_SubModule_Tbl_Module] FOREIGN KEY([ModuleId]) REFERENCES [dbo].[Tbl_Module] ([id])
    ) ON [PRIMARY]
END
GO

-- =============================================
-- Table: Tbl_Permission
-- Description: Stores role-based permissions for modules and submodules
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Tbl_Permission]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Tbl_Permission](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [RoleId] [int] NULL,
        [ModuleId] [int] NULL,
        [SubModuleId] [int] NULL,
        [PermissionType] [varchar](50) NULL, -- Full Access, View, Create, Edit, Delete, Approve, All Record
        [Status] [varchar](50) NULL,
        CONSTRAINT [PK_Tbl_Permission] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_Tbl_Permission_Tbl_Role] FOREIGN KEY([RoleId]) REFERENCES [dbo].[Tbl_Role] ([id]),
        CONSTRAINT [FK_Tbl_Permission_Tbl_Module] FOREIGN KEY([ModuleId]) REFERENCES [dbo].[Tbl_Module] ([id]),
        CONSTRAINT [FK_Tbl_Permission_Tbl_SubModule] FOREIGN KEY([SubModuleId]) REFERENCES [dbo].[Tbl_SubModule] ([id])
    ) ON [PRIMARY]
END
GO

-- =============================================
-- Note: The following tables should already exist:
-- - Tbl_Login (for login functionality)
-- - Tbl_Role (for role management)
-- - Tbl_Marketplace (for marketplace management)
-- =============================================

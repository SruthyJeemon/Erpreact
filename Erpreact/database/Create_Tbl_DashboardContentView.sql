-- =============================================
-- Table: Tbl_DashboardContentView
-- Description: Stores role-based dashboard content view permissions
-- =============================================
USE [db_aa32dc_erpberam]
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Tbl_DashboardContentView]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Tbl_DashboardContentView](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [RoleId] [int] NULL,
        [ContentSectionId] [varchar](50) NULL,
        [ContentSectionName] [varchar](100) NULL,
        [IsVisible] [varchar](50) NULL, -- 'Yes' or 'No'
        [Status] [varchar](50) NULL DEFAULT 'Active',
        [Enterdate] [datetime] NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_Tbl_DashboardContentView] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_Tbl_DashboardContentView_Tbl_Role] FOREIGN KEY([RoleId]) REFERENCES [dbo].[Tbl_Role] ([id])
    ) ON [PRIMARY]
END
GO

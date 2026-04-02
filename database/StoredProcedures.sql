-- =============================================
-- Stored Procedures for React ERP System
-- Database: db_aa32dc_erpberam
-- =============================================

USE [db_aa32dc_erpberam]
GO

-- =============================================
-- Stored Procedure: Sp_Module
-- Description: CRUD operations for Tbl_Module
-- Query Types:
--   1 = Insert
--   2 = Update
--   3 = Select All (Order by id desc)
--   4 = Delete
--   5 = Search (LIKE query)
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Sp_Module]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[Sp_Module]
GO

CREATE PROCEDURE [dbo].[Sp_Module]
    @ModuleName varchar(50),
    @id int,
    @Status varchar(50),
    @Query int
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Insert
    IF (@Query = 1)
    BEGIN
        INSERT INTO Tbl_Module (ModuleName, Status)
        VALUES (@ModuleName, @Status)
    END
    
    -- Update
    IF (@Query = 2)
    BEGIN
        UPDATE Tbl_Module
        SET ModuleName = @ModuleName, Status = @Status
        WHERE id = @id
    END
    
    -- Select All
    IF (@Query = 3)
    BEGIN
        SELECT * FROM Tbl_Module ORDER BY id DESC
    END
    
    -- Delete
    IF (@Query = 4)
    BEGIN
        DELETE FROM Tbl_Module WHERE id = @id
    END
    
    -- Search
    IF (@Query = 5)
    BEGIN
        SELECT * FROM Tbl_Module 
        WHERE ModuleName LIKE '%' + @ModuleName + '%'
        ORDER BY id DESC
    END
END
GO

-- =============================================
-- Stored Procedure: Sp_SubModule
-- Description: CRUD operations for Tbl_SubModule
-- Query Types:
--   1 = Insert
--   2 = Update
--   3 = Select All (Order by id desc) - Optional filter by ModuleId
--   4 = Delete
--   5 = Search (LIKE query)
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Sp_SubModule]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[Sp_SubModule]
GO

CREATE PROCEDURE [dbo].[Sp_SubModule]
    @SubModuleName varchar(50),
    @id int,
    @ModuleId int,
    @Status varchar(50),
    @Query int
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Insert
    IF (@Query = 1)
    BEGIN
        INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status)
        VALUES (@SubModuleName, @ModuleId, @Status)
    END
    
    -- Update
    IF (@Query = 2)
    BEGIN
        UPDATE Tbl_SubModule
        SET SubModuleName = @SubModuleName, ModuleId = @ModuleId, Status = @Status
        WHERE id = @id
    END
    
    -- Select All (with optional ModuleId filter)
    IF (@Query = 3)
    BEGIN
        SELECT 
            sm.id,
            sm.SubModuleName,
            sm.ModuleId,
            m.ModuleName,
            sm.Status
        FROM Tbl_SubModule sm
        LEFT JOIN Tbl_Module m ON sm.ModuleId = m.id
        WHERE (@ModuleId IS NULL OR sm.ModuleId = @ModuleId)
        ORDER BY sm.id DESC
    END
    
    -- Delete
    IF (@Query = 4)
    BEGIN
        DELETE FROM Tbl_SubModule WHERE id = @id
    END
    
    -- Search
    IF (@Query = 5)
    BEGIN
        SELECT 
            sm.id,
            sm.SubModuleName,
            sm.ModuleId,
            m.ModuleName,
            sm.Status
        FROM Tbl_SubModule sm
        LEFT JOIN Tbl_Module m ON sm.ModuleId = m.id
        WHERE sm.SubModuleName LIKE '%' + @SubModuleName + '%'
        ORDER BY sm.id DESC
    END
END
GO

-- =============================================
-- Stored Procedure: Sp_Permission
-- Description: CRUD operations for Tbl_Permission
-- Query Types:
--   1 = Insert
--   2 = Update
--   3 = Select All (with filters)
--   4 = Delete
--   5 = Get Permissions by Role
--   6 = Get Permissions by Role and Module
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Sp_Permission]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[Sp_Permission]
GO

CREATE PROCEDURE [dbo].[Sp_Permission]
    @RoleId int,
    @ModuleId int,
    @SubModuleId int,
    @PermissionType varchar(50),
    @id int,
    @Status varchar(50),
    @Query int
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Insert
    IF (@Query = 1)
    BEGIN
        INSERT INTO Tbl_Permission (RoleId, ModuleId, SubModuleId, PermissionType, Status)
        VALUES (@RoleId, @ModuleId, @SubModuleId, @PermissionType, @Status)
    END
    
    -- Update
    IF (@Query = 2)
    BEGIN
        UPDATE Tbl_Permission
        SET RoleId = @RoleId,
            ModuleId = @ModuleId,
            SubModuleId = @SubModuleId,
            PermissionType = @PermissionType,
            Status = @Status
        WHERE id = @id
    END
    
    -- Select All (with joins for names)
    IF (@Query = 3)
    BEGIN
        SELECT 
            p.id,
            p.RoleId,
            r.Role as RoleName,
            p.ModuleId,
            m.ModuleName,
            p.SubModuleId,
            sm.SubModuleName,
            p.PermissionType,
            p.Status
        FROM Tbl_Permission p
        LEFT JOIN Tbl_Role r ON p.RoleId = r.id
        LEFT JOIN Tbl_Module m ON p.ModuleId = m.id
        LEFT JOIN Tbl_SubModule sm ON p.SubModuleId = sm.id
        ORDER BY p.id DESC
    END
    
    -- Delete
    IF (@Query = 4)
    BEGIN
        DELETE FROM Tbl_Permission WHERE id = @id
    END
    
    -- Get Permissions by Role
    IF (@Query = 5)
    BEGIN
        SELECT 
            p.id,
            p.RoleId,
            r.Role as RoleName,
            p.ModuleId,
            m.ModuleName,
            p.SubModuleId,
            sm.SubModuleName,
            p.PermissionType,
            p.Status
        FROM Tbl_Permission p
        LEFT JOIN Tbl_Role r ON p.RoleId = r.id
        LEFT JOIN Tbl_Module m ON p.ModuleId = m.id
        LEFT JOIN Tbl_SubModule sm ON p.SubModuleId = sm.id
        WHERE p.RoleId = @RoleId
        ORDER BY m.ModuleName, sm.SubModuleName
    END
    
    -- Get Permissions by Role and Module
    IF (@Query = 6)
    BEGIN
        SELECT 
            p.id,
            p.RoleId,
            r.Role as RoleName,
            p.ModuleId,
            m.ModuleName,
            p.SubModuleId,
            sm.SubModuleName,
            p.PermissionType,
            p.Status
        FROM Tbl_Permission p
        LEFT JOIN Tbl_Role r ON p.RoleId = r.id
        LEFT JOIN Tbl_Module m ON p.ModuleId = m.id
        LEFT JOIN Tbl_SubModule sm ON p.SubModuleId = sm.id
        WHERE p.RoleId = @RoleId AND p.ModuleId = @ModuleId
        ORDER BY sm.SubModuleName
    END
END
GO

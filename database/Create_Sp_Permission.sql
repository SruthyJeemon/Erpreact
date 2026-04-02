-- =============================================
-- Create Stored Procedure: Sp_Permission
-- Database: db_aa32dc_erpberam
-- =============================================

USE [db_aa32dc_erpberam]
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
    @RoleId int = NULL,
    @ModuleId int = NULL,
    @SubModuleId int = NULL,
    @PermissionType varchar(50) = NULL,
    @id int = NULL,
    @Status varchar(50) = NULL,
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
        SET RoleId = ISNULL(@RoleId, RoleId),
            ModuleId = @ModuleId,
            SubModuleId = @SubModuleId,
            PermissionType = ISNULL(@PermissionType, PermissionType),
            Status = ISNULL(@Status, Status)
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

PRINT 'Stored Procedure Sp_Permission created successfully!'
GO

-- =============================================
-- Update Stored Procedure: Sp_Permission to use Reads, Writes, Deletes
-- Database: db_aa32dc_erpberam
-- =============================================

USE [db_aa32dc_erpberam]
GO

-- Drop existing procedure
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Sp_Permission]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[Sp_Permission]
GO

-- Create updated procedure with Reads, Writes, Deletes
CREATE PROCEDURE [dbo].[Sp_Permission]
    @RoleId int = NULL,
    @ModuleId int = NULL,
    @SubModuleId int = NULL,
    @Menu varchar(200) = NULL,
    @Reads bit = 0,
    @Writes bit = 0,
    @Deletes bit = 0,
    @Isdelete bit = 0,
    @id int = NULL,
    @Status varchar(50) = NULL,
    @Query int
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Insert
    IF (@Query = 1)
    BEGIN
        INSERT INTO Tbl_Permission (RoleId, ModuleId, SubModuleId, Menu, Reads, Writes, Deletes, Isdelete, Status)
        VALUES (@RoleId, @ModuleId, @SubModuleId, @Menu, @Reads, @Writes, @Deletes, @Isdelete, @Status)
    END
    
    -- Update
    IF (@Query = 2)
    BEGIN
        UPDATE Tbl_Permission
        SET RoleId = ISNULL(@RoleId, RoleId),
            ModuleId = @ModuleId,
            SubModuleId = @SubModuleId,
            Menu = ISNULL(@Menu, Menu),
            Reads = ISNULL(@Reads, Reads),
            Writes = ISNULL(@Writes, Writes),
            Deletes = ISNULL(@Deletes, Deletes),
            Isdelete = ISNULL(@Isdelete, Isdelete),
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
            p.Menu,
            p.Reads,
            p.Writes,
            p.Deletes,
            p.Isdelete,
            p.Status
        FROM Tbl_Permission p
        LEFT JOIN Tbl_Role r ON p.RoleId = r.id
        LEFT JOIN Tbl_Module m ON p.ModuleId = m.id
        LEFT JOIN Tbl_SubModule sm ON p.SubModuleId = sm.id
        WHERE p.Isdelete = 0
        ORDER BY p.id DESC
    END
    
    -- Delete (soft delete - set Isdelete = 1)
    IF (@Query = 4)
    BEGIN
        UPDATE Tbl_Permission
        SET Isdelete = 1
        WHERE id = @id
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
            p.Menu,
            p.Reads,
            p.Writes,
            p.Deletes,
            p.Isdelete,
            p.Status
        FROM Tbl_Permission p
        LEFT JOIN Tbl_Role r ON p.RoleId = r.id
        LEFT JOIN Tbl_Module m ON p.ModuleId = m.id
        LEFT JOIN Tbl_SubModule sm ON p.SubModuleId = sm.id
        WHERE p.RoleId = @RoleId AND p.Isdelete = 0
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
            p.Menu,
            p.Reads,
            p.Writes,
            p.Deletes,
            p.Isdelete,
            p.Status
        FROM Tbl_Permission p
        LEFT JOIN Tbl_Role r ON p.RoleId = r.id
        LEFT JOIN Tbl_Module m ON p.ModuleId = m.id
        LEFT JOIN Tbl_SubModule sm ON p.SubModuleId = sm.id
        WHERE p.RoleId = @RoleId AND p.ModuleId = @ModuleId AND p.Isdelete = 0
        ORDER BY sm.SubModuleName
    END
END
GO

PRINT 'Stored Procedure Sp_Permission updated successfully with Reads, Writes, Deletes support!'
GO

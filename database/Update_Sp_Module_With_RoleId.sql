-- =============================================
-- Update Stored Procedure: Sp_Module to include RoleId
-- Database: db_aa32dc_erpberam
-- =============================================

USE [db_aa32dc_erpberam]
GO

-- Drop existing procedure
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Sp_Module]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[Sp_Module]
GO

-- Create updated procedure with RoleId
CREATE PROCEDURE [dbo].[Sp_Module]
    @ModuleName varchar(50) = NULL,
    @id int = NULL,
    @Status varchar(50) = NULL,
    @RoleId int = NULL,
    @Query int
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Insert
    IF (@Query = 1)
    BEGIN
        INSERT INTO Tbl_Module (ModuleName, Status, RoleId)
        VALUES (@ModuleName, @Status, @RoleId)
    END
    
    -- Update
    IF (@Query = 2)
    BEGIN
        UPDATE Tbl_Module
        SET ModuleName = ISNULL(@ModuleName, ModuleName),
            Status = ISNULL(@Status, Status),
            RoleId = ISNULL(@RoleId, RoleId)
        WHERE id = @id
    END
    
    -- Select All (with Role information)
    IF (@Query = 3)
    BEGIN
        SELECT 
            m.id,
            m.ModuleName,
            m.Status,
            m.RoleId,
            r.Role AS RoleName
        FROM Tbl_Module m
        LEFT JOIN Tbl_Role r ON m.RoleId = r.id
        ORDER BY m.id DESC
    END
    
    -- Delete
    IF (@Query = 4)
    BEGIN
        DELETE FROM Tbl_Module WHERE id = @id
    END
    
    -- Search
    IF (@Query = 5)
    BEGIN
        SELECT 
            m.id,
            m.ModuleName,
            m.Status,
            m.RoleId,
            r.Role AS RoleName
        FROM Tbl_Module m
        LEFT JOIN Tbl_Role r ON m.RoleId = r.id
        WHERE m.ModuleName LIKE '%' + ISNULL(@ModuleName, '') + '%'
        ORDER BY m.id DESC
    END
    
    -- Get modules by RoleId
    IF (@Query = 6)
    BEGIN
        SELECT 
            m.id,
            m.ModuleName,
            m.Status,
            m.RoleId,
            r.Role AS RoleName
        FROM Tbl_Module m
        LEFT JOIN Tbl_Role r ON m.RoleId = r.id
        WHERE m.RoleId = @RoleId
        ORDER BY m.id DESC
    END
END
GO

PRINT 'Stored Procedure Sp_Module updated successfully with RoleId support!'
GO

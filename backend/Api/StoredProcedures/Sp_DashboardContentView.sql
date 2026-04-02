-- =============================================
-- Stored Procedure: Sp_DashboardContentView
-- Description: CRUD operations for Tbl_DashboardContentView
-- Query Types:
--   1 = Insert
--   2 = Update
--   3 = Select All (with joins for Role and Content Section names)
--   4 = Delete
--   5 = Get by RoleId
--   6 = Search
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Sp_DashboardContentView]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[Sp_DashboardContentView]
GO

CREATE PROCEDURE [dbo].[Sp_DashboardContentView]
    @Id int,
    @RoleId int,
    @ContentSectionId varchar(50),
    @ContentSectionName varchar(100),
    @IsVisible varchar(50),
    @Status varchar(50),
    @Enterdate datetime,
    @Query int
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Insert
    IF (@Query = 1)
    BEGIN
        INSERT INTO Tbl_DashboardContentView (RoleId, ContentSectionId, ContentSectionName, IsVisible, Status, Enterdate)
        VALUES (@RoleId, @ContentSectionId, @ContentSectionName, @IsVisible, @Status, @Enterdate)
    END
    
    -- Update
    IF (@Query = 2)
    BEGIN
        UPDATE Tbl_DashboardContentView
        SET RoleId = @RoleId,
            ContentSectionId = @ContentSectionId,
            ContentSectionName = @ContentSectionName,
            IsVisible = @IsVisible,
            Status = @Status,
            Enterdate = @Enterdate
        WHERE Id = @Id
    END
    
    -- Select All (with joins for Role name)
    IF (@Query = 3)
    BEGIN
        SELECT 
            dc.Id,
            dc.RoleId,
            r.Role AS RoleName,
            dc.ContentSectionId,
            dc.ContentSectionName,
            dc.IsVisible,
            dc.Status,
            dc.Enterdate
        FROM Tbl_DashboardContentView dc
        LEFT JOIN Tbl_Role r ON dc.RoleId = r.id
        WHERE dc.Status = @Status OR (@Status IS NULL)
        ORDER BY dc.RoleId, dc.ContentSectionName
    END
    
    -- Delete
    IF (@Query = 4)
    BEGIN
        UPDATE Tbl_DashboardContentView
        SET Status = 'Deleted'
        WHERE Id = @Id
    END
    
    -- Get by RoleId
    IF (@Query = 5)
    BEGIN
        SELECT 
            dc.Id,
            dc.RoleId,
            r.Role AS RoleName,
            dc.ContentSectionId,
            dc.ContentSectionName,
            dc.IsVisible,
            dc.Status,
            dc.Enterdate
        FROM Tbl_DashboardContentView dc
        LEFT JOIN Tbl_Role r ON dc.RoleId = r.id
        WHERE dc.RoleId = @RoleId AND (dc.Status = @Status OR (@Status IS NULL))
        ORDER BY dc.ContentSectionName
    END
    
    -- Search
    IF (@Query = 6)
    BEGIN
        SELECT 
            dc.Id,
            dc.RoleId,
            r.Role AS RoleName,
            dc.ContentSectionId,
            dc.ContentSectionName,
            dc.IsVisible,
            dc.Status,
            dc.Enterdate
        FROM Tbl_DashboardContentView dc
        LEFT JOIN Tbl_Role r ON dc.RoleId = r.id
        WHERE (dc.ContentSectionName LIKE '%' + @ContentSectionName + '%' OR @ContentSectionName IS NULL)
          AND (r.Role LIKE '%' + @ContentSectionName + '%' OR @ContentSectionName IS NULL)
          AND (dc.Status = @Status OR (@Status IS NULL))
        ORDER BY dc.RoleId, dc.ContentSectionName
    END
END
GO

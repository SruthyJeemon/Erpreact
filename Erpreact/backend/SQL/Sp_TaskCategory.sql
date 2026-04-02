-- =============================================
-- Stored Procedure: Sp_TaskCategory
-- Description: Fetches task types based on user's catalog
-- =============================================
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[Sp_TaskCategory]
    @RegistrationId VARCHAR(50) = NULL,
    @Query INT = 1
AS
BEGIN
    SET NOCOUNT ON;

    -- Query 1: Get Categories by RegistrationId (User's Catalog)
    IF (@Query = 1)
    BEGIN
        DECLARE @UserCatalog VARCHAR(MAX);
        SELECT @UserCatalog = Catelogid 
        FROM Tbl_Registration 
        WHERE Userid = @RegistrationId OR CAST(id AS VARCHAR(50)) = @RegistrationId;

        SELECT Id, Category, Catelogid
        FROM Tbl_Taskcategory
        WHERE Isdelete = 0
          AND (
               @UserCatalog = Catelogid 
               OR @UserCatalog LIKE Catelogid + ',%' 
               OR @UserCatalog LIKE '%,' + Catelogid + ',%' 
               OR @UserCatalog LIKE '%,' + Catelogid
               OR Catelogid = 'ALL'
               OR @UserCatalog IS NULL
               OR @UserCatalog = ''
          )
        ORDER BY Category ASC;
    END

    -- Query 2: Get All Categories
    IF (@Query = 2)
    BEGIN
        SELECT Id, Category, Catelogid
        FROM Tbl_Taskcategory
        WHERE Isdelete = 0
        ORDER BY Category ASC;
    END
END
GO

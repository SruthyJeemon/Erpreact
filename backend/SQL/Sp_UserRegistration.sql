-- =============================================
-- Stored Procedure: Sp_UserRegistration
-- Description: Fetches users based on catalog or other criteria
-- =============================================
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[Sp_UserRegistration]
    @Catelogid VARCHAR(MAX) = NULL,
    @Query INT = 3 -- Default to Select All or filtered by Catalog
AS
BEGIN
    SET NOCOUNT ON;

    -- Query 3: Select Users by Catelogid
    IF (@Query = 3)
    BEGIN
        IF (@Catelogid IS NOT NULL AND @Catelogid <> '')
        BEGIN
            -- Using CHARINDEX or LIKE since Catelogid might be comma-separated as per model comments
            SELECT id, Userid, Firstname, Lastname, Email, Phone, Role, Catelogid, Status, Warehouseid
            FROM Tbl_Registration
            WHERE Catelogid LIKE '%' + @Catelogid + '%'
            ORDER BY Firstname ASC, Lastname ASC;
        END
        ELSE
        BEGIN
            SELECT id, Userid, Firstname, Lastname, Email, Phone, Role, Catelogid, Status, Warehouseid
            FROM Tbl_Registration
            ORDER BY Firstname ASC, Lastname ASC;
        END
    END
END
GO

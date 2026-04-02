-- =============================================
-- Stored Procedure: Sp_UserRegistration
-- Description: Fetches users based on catalog or other criteria
-- =============================================
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[Sp_UserRegistration]

    @Catelogid VARCHAR(MAX) = NULL,
    @Userid VARCHAR(50) = NULL,
    @Query INT = 3
AS
BEGIN
    SET NOCOUNT ON;

    -- Query 3: Select Users by Catelogid
    IF (@Query = 3)
    BEGIN
        SELECT id, Userid, Firstname, Lastname, Email, Phone, Role, Catelogid, Status, Warehouseid
        FROM Tbl_Registration
        WHERE (@Catelogid IS NULL OR @Catelogid = '' OR Catelogid LIKE '%' + @Catelogid + '%')
        ORDER BY Firstname ASC, Lastname ASC;
    END

    -- Query 5: Get User Profile by Userid
    IF (@Query = 5)
    BEGIN
        SELECT Firstname, Lastname, Email, Role, Catelogid, Warehouseid 
        FROM Tbl_Registration
        WHERE Userid = @Userid;
    END

    -- Query 9: Get Warehouseid by Userid
    IF (@Query = 9)
    BEGIN
        SELECT Warehouseid FROM Tbl_Registration WHERE Userid = @Userid;
    END
END

GO

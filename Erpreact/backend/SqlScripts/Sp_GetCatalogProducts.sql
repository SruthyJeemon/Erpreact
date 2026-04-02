CREATE PROCEDURE [dbo].[Sp_GetCatalogProducts]
    @Userid VARCHAR(50) = NULL,
    @Page INT = 1,
    @PageSize INT = 10,
    @Search NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Identify User Role (Assuming logic or checking a User table)
    -- This is a placeholder; adapt to your actual User/Role table
    DECLARE @IsAdmin BIT = 0;
    
    -- Example: Check if Userid is 'ADMIN' or has Admin role
    -- IF EXISTS (SELECT 1 FROM Tbl_Users WHERE Userid = @Userid AND Role = 'Admin')
    IF (@Userid = 'ADMIN') 
        SET @IsAdmin = 1;

    -- 2. Base Query with Common CTEs
    WITH CategoryHierarchy AS (
        -- Recursive CTE to get full Category Path (Parent > Child)
        SELECT 
            Id, 
            Parentid, 
            CAST(Name AS NVARCHAR(MAX)) AS FullCategoryName
        FROM Tbl_Category
        WHERE Parentid = 0 OR Parentid IS NULL
        
        UNION ALL
        
        SELECT 
            c.Id, 
            c.Parentid, 
            CAST(ch.FullCategoryName + ' > ' + c.Name AS NVARCHAR(MAX))
        FROM Tbl_Category c
        INNER JOIN CategoryHierarchy ch ON c.Parentid = ch.Id
    ),
    FilteredProducts AS (
        SELECT 
            p.*,
            ch.FullCategoryName
        FROM Tbl_Product p
        LEFT JOIN CategoryHierarchy ch ON p.Category_id = ch.Id
        WHERE p.Isdelete = 0 -- Requirement: Isdelete=0 basis
        AND (
            @IsAdmin = 1 -- Admin sees all
            OR 
            -- User sees products where Product Category matches User's Catalog Access
            -- Assuming Tbl_UserCatalog map table exists or logic is based on User table columns
            p.Category_id IN (
                SELECT CategoryId 
                FROM Tbl_UserCatalog 
                WHERE UserId = @Userid
            )
        )
        AND (
            @Search IS NULL OR 
            p.Product_name LIKE '%' + @Search + '%' OR 
            p.Product_id LIKE '%' + @Search + '%'
        )
    )
    
    -- 3. Select Paged Data
    SELECT * FROM FilteredProducts
    ORDER BY Product_uploaddate DESC
    OFFSET (@Page - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;

    -- 4. Get Total Count (for pagination)
    SELECT COUNT(*) FROM Tbl_Product p
    WHERE p.Isdelete = 0
    AND (
        @IsAdmin = 1 
        OR 
        p.Category_id IN (SELECT CategoryId FROM Tbl_UserCatalog WHERE UserId = @Userid)
    )
    AND (
        @Search IS NULL OR 
        p.Product_name LIKE '%' + @Search + '%'
    );
END
GO

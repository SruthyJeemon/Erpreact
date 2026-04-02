-- =============================================
-- Stored Procedure: Sp_GetProductList
-- Description: Fetch products with filtering for Catalog (User ownership) and Categories (Full path)
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Sp_GetProductList]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[Sp_GetProductList]
GO

CREATE PROCEDURE [dbo].[Sp_GetProductList]
    @Page INT = 1,
    @PageSize INT = 10,
    @Search NVARCHAR(100) = NULL,
    @Userid NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. CTE for Full Category Path (Parent > Child)
    WITH CategoryPath AS (
        SELECT Id, Name, CAST(Name AS NVARCHAR(MAX)) as FullName 
        FROM Tbl_Category 
        WHERE Parentid = 0 OR Parentid IS NULL
        
        UNION ALL
        
        SELECT c.Id, c.Name, CAST(cp.FullName + ' > ' + c.Name AS NVARCHAR(MAX)) 
        FROM Tbl_Category c 
        JOIN CategoryPath cp ON c.Parentid = cp.Id
    )
    -- 2. Select Data with Pagination
    SELECT 
        p.*, 
        cp.FullName as FullCategoryName
    FROM Tbl_Product p
    LEFT JOIN CategoryPath cp ON p.Category_id = cp.Id
    WHERE p.Isdelete = 0 -- Only active products
    AND (
        @Userid = 'ADMIN' -- Admin sees all
        OR p.Userid = @Userid -- Users see only their own products
        OR (@Userid IS NULL OR @Userid = '') -- Fallback if no user provided
    )
    AND (
        @Search IS NULL OR 
        p.Product_name LIKE '%' + @Search + '%' OR 
        p.Product_id LIKE '%' + @Search + '%'
    )
    ORDER BY p.Product_uploaddate DESC
    OFFSET (@Page - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;

    -- 3. Get Total Count (for pagination calculations)
    SELECT COUNT(*) 
    FROM Tbl_Product p
    WHERE p.Isdelete = 0
    AND (
        @Userid = 'ADMIN' 
        OR p.Userid = @Userid
        OR (@Userid IS NULL OR @Userid = '')
    )
    AND (
        @Search IS NULL OR 
        p.Product_name LIKE '%' + @Search + '%' OR 
        p.Product_id LIKE '%' + @Search + '%'
    );
END
GO

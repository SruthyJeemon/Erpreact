-- Add Query=3 for SELECT ALL and Query=4 for SELECT BY ID to the existing Sp_Supplier stored procedure
-- Add these sections to your existing stored procedure

-- Add after the UPDATE section (Query = 2):

IF (@Query = 3)  
BEGIN 
    -- Select all suppliers (not deleted)
    SELECT * FROM Tbl_Supplier WHERE ISNULL(Isdelete, '0') = '0' ORDER BY Id DESC
END

IF (@Query = 4)  
BEGIN 
    -- Select supplier by ID
    SELECT * FROM Tbl_Supplier WHERE Id = @Id AND ISNULL(Isdelete, '0') = '0'
END

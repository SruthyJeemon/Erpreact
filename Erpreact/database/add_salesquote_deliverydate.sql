-- Run once on your ERP database. Adds delivery date for sales quotes.
IF COL_LENGTH('dbo.Tbl_Salesquote', 'Deliverydate') IS NULL
BEGIN
    ALTER TABLE dbo.Tbl_Salesquote ADD Deliverydate varchar(50) NULL;
END
GO

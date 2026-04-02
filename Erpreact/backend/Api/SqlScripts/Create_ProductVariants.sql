-- Create ProductVariants table
-- Adjust column types/sizes as needed to match your data model
CREATE TABLE ProductVariants (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ItemName NVARCHAR(200) NULL,
    ModelNo NVARCHAR(100) NULL,
    BatchNo NVARCHAR(100) NULL,
    BarcodeNo NVARCHAR(100) NULL,
    WholesalePrice DECIMAL(18,2) NULL,
    RetailPrice DECIMAL(18,2) NULL,
    OnlinePrice DECIMAL(18,2) NULL,
    ReorderPoint INT NULL,
    ReorderQty INT NULL,
    DefaultLocation NVARCHAR(100) NULL,
    Length DECIMAL(10,2) NULL,
    Width DECIMAL(10,2) NULL,
    Height DECIMAL(10,2) NULL,
    Weight DECIMAL(10,2) NULL,
    StandardUom NVARCHAR(50) NULL,
    SalesUom NVARCHAR(50) NULL,
    PurchaseUom NVARCHAR(50) NULL,
    Remarks NVARCHAR(MAX) NULL,
    Serialized BIT NULL,
    Description NVARCHAR(MAX) NULL,
    ShortDescription NVARCHAR(MAX) NULL,
    AgeCategory NVARCHAR(100) NULL,
    HsCode NVARCHAR(50) NULL,
    CountryOrigin NVARCHAR(100) NULL,
    BrandId INT NULL,
    CreatedAt DATETIME2 DEFAULT SYSDATETIME()
);
GO

/*
  Sp_Productvariants — replace the entire IF (@Query = 10) ... END block in the procedure
  with the block below (Script Procedure as ALTER in SSMS, find Query = 10, paste over that section).

  Adds: Short_description, Hscode, Country_orgin, Length/Width/Height/Weight,
        Standarduom, Salesuom, Purchaseuom, Reorderpoint, Reorderqty, Defaultlocation,
        Remarks, Brandid — so the API / UI Extra Info & Item Details match Tbl_Productvariants.
*/

IF  (@Query = 10)
BEGIN

DECLARE @bDone22 INT;

CREATE TABLE #TempResults12 (
    Id INT,
    Userid VARCHAR(50),
    Productid VARCHAR(50),
    Productname VARCHAR(50),
    allvalues VARCHAR(MAX),
    Totalqty VARCHAR(50),
    Noofqty_online VARCHAR(50),
    Status VARCHAR(50),
    Brand VARCHAR(50),
    Firstname VARCHAR(50),
    Modelno VARCHAR(50),
    Warehousecheck VARCHAR(50),
    Batchno VARCHAR(50),
    EANBarcodeno VARCHAR(50),
    Managerapprovestatus VARCHAR(50),
    Warehouseapprovestatus varchar(50),
    Accountsapprovestatus varchar(50),
    Description varchar(max),
    Itemname varchar(max),
    Wholesaleprice varchar(max),
    Retailprice varchar(max),
    Onlineprice varchar(max),
    Short_description varchar(max),
    Hscode varchar(50),
    Country_orgin varchar(100),
    Length decimal(18,2),
    Width decimal(18,2),
    Height decimal(18,2),
    Weight decimal(18,2),
    Standarduom varchar(50),
    Salesuom varchar(50),
    Purchaseuom varchar(50),
    Reorderpoint varchar(max),
    Reorderqty varchar(max),
    Defaultlocation varchar(max),
    Remarks varchar(max),
    Brandid varchar(50)
);

DECLARE curs CURSOR FOR
   SELECT Id
    FROM Tbl_Productvariants
    WHERE Isdelete = 0 AND (Productid = @Productid) AND Parentid = 0;

OPEN curs;
SET @bDone22 = 0;

FETCH NEXT FROM curs INTO @Productid;

WHILE @@FETCH_STATUS = 0
BEGIN
    INSERT INTO #TempResults12 (allvalues,Id,Userid,
        Productid, Productname, Totalqty, Noofqty_online, Status, Brand, Firstname,
        Modelno, Warehousecheck, Batchno, EANBarcodeno,
        Managerapprovestatus, Warehouseapprovestatus, Accountsapprovestatus,
        Description, Itemname, Wholesaleprice, Retailprice, Onlineprice,
        Short_description, Hscode, Country_orgin, Length, Width, Height, Weight,
        Standarduom, Salesuom, Purchaseuom, Reorderpoint, Reorderqty, Defaultlocation, Remarks, Brandid)
    SELECT TOP 1
        (STUFF((
            SELECT ', ' + CONVERT(VARCHAR(100), Varianttype) + '-' + CONVERT(VARCHAR(100), Value)
            FROM Tbl_Productvariants
            WHERE (Parentid = @Productid OR Id = @Productid) AND (Isdelete = 0)
            FOR XML PATH('')
        ), 1, 2, '')),
        Tbl_Productvariants.Id, Tbl_Productvariants.Userid, Tbl_Productvariants.Productid, Tbl_Productvariants.Productname,
        Tbl_Productvariants.Totalqty, Tbl_Productvariants.Noofqty_online, Tbl_Productvariants.Status, Tbl_Brand.Brand, Tbl_Registration.Firstname,
        Tbl_Productvariants.Modelno, Tbl_Productvariants.Warehousecheck, Tbl_Productvariants.Batchno, Tbl_Productvariants.EANBarcodeno,
        Tbl_Productvariants.Managerapprovestatus, Tbl_Productvariants.Warehouseapprovestatus, Tbl_Productvariants.Accountsapprovestatus,
        Tbl_Productvariants.Description, Tbl_Productvariants.Itemname, Tbl_Productvariants.Wholesaleprice, Tbl_Productvariants.Retailprice, Tbl_Productvariants.Onlineprice,
        Tbl_Productvariants.Short_description, Tbl_Productvariants.Hscode, Tbl_Productvariants.Country_orgin,
        Tbl_Productvariants.Length, Tbl_Productvariants.Width, Tbl_Productvariants.Height, Tbl_Productvariants.Weight,
        Tbl_Productvariants.Standarduom, Tbl_Productvariants.Salesuom, Tbl_Productvariants.Purchaseuom,
        Tbl_Productvariants.Reorderpoint, Tbl_Productvariants.Reorderqty, Tbl_Productvariants.Defaultlocation, Tbl_Productvariants.Remarks,
        Tbl_Productvariants.Brandid
    FROM Tbl_Productvariants
    INNER JOIN Tbl_Registration ON Tbl_Productvariants.Userid = Tbl_Registration.Userid
    LEFT JOIN Tbl_Brand ON Tbl_Productvariants.Brandid = Tbl_Brand.Brand_id
    WHERE Parentid = @Productid OR Tbl_Productvariants.Id = @Productid
    ORDER BY ID ASC;

    FETCH NEXT FROM curs INTO @Productid;
END

CLOSE curs;
DEALLOCATE curs;

SELECT * FROM #TempResults12;
DROP TABLE #TempResults12;

END

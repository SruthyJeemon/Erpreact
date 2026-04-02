ALTER PROCEDURE [dbo].[Sp_Stocktransfer]

	@Id int =null,

	@Userid varchar(50) = null,

	@Warehousefrom varchar(50)  = null,

	@Warehouseto varchar(50)  = null,



	@Warehousetoaddress varchar(max)  = null,

	@Date varchar(50)  = null,



	@Sheduled_date varchar(50)  = null,

	@Itemid varchar(50)  = null,

	@Qty int  = null,

	@Isdelete int  = null,

	@Status varchar(50)  = null,

	@Itemname varchar(50)=null,

	@Receiptno varchar(max)=null,

	@Managerapprove varchar(50)=null,

	@Transfer_invoice varchar(max)=null,

	@Catelogid varchar(50)= null,

	@Role varchar(50)=null,

	@Deliverynote varchar(max)=null,

	@Fromwarehouse_approve varchar(50)=null,

	@Towarehouse_approve varchar(50)=null,

	@Finalinvoice varchar(max)=null,

	@Todaydate DATETIME = null,



	@fromdate varchar(50)=null,

	@todate varchar(50)=null,

		@Remarks varchar(max) =null,

	@Query int

AS

BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from

	-- interfering with SELECT statements.

	SET NOCOUNT ON;



 if(@Query =1)

 BEGIN

 insert into Tbl_Stocktransfer (Userid,Warehousefrom,Warehouseto,Warehousetoaddress,Date,Sheduled_date,Receiptno,Isdelete,Status,Managerapprove,Transfer_invoice,Remarks)values(@Userid,@Warehousefrom,@Warehouseto,@Warehousetoaddress,@Date,@Sheduled_date,@R
eceiptno,@Isdelete,@Status,@Managerapprove,@Transfer_invoice,@Remarks)

  SET @Id = SCOPE_IDENTITY();

	 select @Id as Id

 END





 if(@Query =4)

 BEGIN

update Tbl_Stocktransfer set Userid=@Userid,Warehousefrom=@Warehousefrom,Warehouseto=@Warehouseto,Warehousetoaddress=@Warehousetoaddress,Date=@Date,Sheduled_date=@Sheduled_date,Managerapprove=@Managerapprove,Remarks=@Remarks where Id=@Id





 END



 if(@Query =5)

 BEGIN

update Tbl_Stocktransfer set Isdelete=@Isdelete where Id=@Id





 END



  if(@Query =6)

 BEGIN

update Tbl_Stocktransfer set Receiptno=@Receiptno where Id=@Id



 END



 if(@Query =7)

 BEGIN











--SET @Todaydate = GETDATE();

--SELECT

--    ts.*,

--    tr.Firstname,

--    tsl.Name AS WarehouseFromName,

--    tsll.Name AS WarehouseToName

--FROM Tbl_Stocktransfer ts

--INNER JOIN Tbl_Registration tr ON tr.Userid = ts.Userid

--INNER JOIN Tbl_Stocklocation tsl ON tsl.Id = ts.Warehousefrom

--INNER JOIN Tbl_Stocklocation tsll ON tsll.Id = ts.Warehouseto

--WHERE ts.Isdelete = 0

--    AND   tr.Catelogid  IN (SELECT value FROM dbo.SplitString(@Catelogid, ','))

--	--and  CAST(TRY_CONVERT(DATETIME, ts.Date, 103) AS DATE) >= CAST(DATEADD(DAY, -90, @Todaydate) AS DATE)

-- AND (LTRIM(RTRIM(ts.Towarehouse_approve)) = '' OR ts.Towarehouse_approve IS NULL)

--ORDER BY ts.Id DESC;









SET @Todaydate = GETDATE();

SELECT

    ts.*,

    tr.Firstname,

    tsl.Name AS WarehouseFromName,

    tsll.Name AS WarehouseToName

FROM Tbl_Stocktransfer ts

INNER JOIN Tbl_Registration tr ON tr.Userid = ts.Userid

INNER JOIN Tbl_Stocklocation tsl ON tsl.Id = ts.Warehousefrom

INNER JOIN Tbl_Stocklocation tsll ON tsll.Id = ts.Warehouseto

WHERE ts.Isdelete = 0

  AND (LTRIM(RTRIM(ts.Towarehouse_approve)) = '' OR ts.Towarehouse_approve IS NULL)

  AND EXISTS (

        SELECT 1

        FROM dbo.SplitString(@Catelogid, ',') s

        WHERE ',' + REPLACE(LTRIM(RTRIM(tr.Catelogid)), ' ', '') + ','

              LIKE '%,' + REPLACE(LTRIM(RTRIM(s.value)), ' ', '') + ',%'

  )

ORDER BY ts.Id DESC;







 END



if(@Query =8)

 BEGIN



select ts.*,tr.Firstname from Tbl_Stocktransfer ts

left join Tbl_Registration tr on tr.Userid=ts.Userid

where ts.Managerapprove=@Managerapprove and ts.Isdelete=@Isdelete and ts.Status=@Status and ts.Userid!=@Userid



 END



if(@Query =9)

 BEGIN





select tsl.Id as fromid,tsl.Name as Warehousenamefrom,tsl.Locationaddress as Warehouselocationfrom, tsll.Id as toid, tsll.Name as Warehousenameto,ts.Warehousetoaddress as Warehouselocationto,ts.Remarks from Tbl_Stocktransfer  ts

INNER JOIN Tbl_Stocklocation tsl ON tsl.Id = ts.Warehousefrom

INNER JOIN Tbl_Stocklocation tsll ON tsll.Id = ts.Warehouseto







where ts.Id=@Id



 END



 if(@Query =10)

 BEGIN



 update Tbl_Stocktransfer set Managerapprove=@Managerapprove ,Transfer_invoice=@Transfer_invoice where Id=@Id

 end

  if(@Query =11)

 BEGIN



select Transfer_invoice from Tbl_Stocktransfer where Managerapprove=@Managerapprove and  Id=@Id

 end



if(@Query =12)

BEGIN





select Tbl_Stocktransfer.Warehouseto from Tbl_Stocktransfer

inner join Tbl_Registration  on Tbl_Registration.Warehouseid=Tbl_Stocktransfer.Warehouseto

where Tbl_Stocktransfer.Id=22 and Tbl_Registration.Role=@Role

 end



 if(@Query =13)

BEGIN



update Tbl_Stocktransfer set Status=@Status where Id=@Id



end



if(@Query =14)

BEGIN





SELECT ts.*, tr.Firstname, tsl.Name AS WarehouseFromName, tsll.Name AS WarehouseToName

FROM Tbl_Stocktransfer ts

INNER JOIN Tbl_Registration tr ON tr.Userid = ts.Userid

INNER JOIN Tbl_Stocklocation tsl ON tsl.Id = ts.Warehousefrom

INNER JOIN Tbl_Stocklocation tsll ON tsll.Id = ts.Warehouseto

WHERE ts.Isdelete = @Isdelete and  ts.Warehousefrom in (SELECT value FROM dbo.SplitString(@Warehousefrom, ',')) and ts.Managerapprove=@Managerapprove  order by ts.Id desc







end



if(@Query =15)

BEGIN



update Tbl_Stocktransfer set Deliverynote=@Deliverynote where Id=@Id



end



  if(@Query =16)

 BEGIN



select Deliverynote from Tbl_Stocktransfer tr

inner join Tbl_Pickuplist tp on tp.Stocktransferid  =tr.Id

where tp.Status=@Status and tp.Isdelete=@Isdelete and tr.Id=@Id

 end



   if(@Query =17)

 BEGIN



 update Tbl_Stocktransfer set Fromwarehouse_approve=@Fromwarehouse_approve where Id=@Id



 end





 if(@Query =18)

 begin



--SELECT ts.*, tr.Firstname, tsl.Name AS WarehouseFromName, tsll.Name AS WarehouseToName,p.Id as pickupid

--FROM Tbl_Stocktransfer ts

--left join Tbl_Pickuplist p on p.Stocktransferid=ts.Id

--INNER JOIN Tbl_Registration tr ON tr.Userid = ts.Userid

--INNER JOIN Tbl_Stocklocation tsl ON tsl.Id = ts.Warehousefrom

--INNER JOIN Tbl_Stocklocation tsll ON tsll.Id = ts.Warehouseto

--WHERE ts.Isdelete = @Isdelete and  ts.Warehouseto=@Warehouseto and ts.Fromwarehouse_approve=@Fromwarehouse_approve



SELECT ts.*, tr.Firstname, tsl.Name AS WarehouseFromName, tsll.Name AS WarehouseToName,p.Id as pickupid

FROM Tbl_Stocktransfer ts

left join Tbl_Pickuplist p on p.Stocktransferid=ts.Id

INNER JOIN Tbl_Registration tr ON tr.Userid = ts.Userid

INNER JOIN Tbl_Stocklocation tsl ON tsl.Id = ts.Warehousefrom

INNER JOIN Tbl_Stocklocation tsll ON tsll.Id = ts.Warehouseto

WHERE ts.Isdelete = @Isdelete and  ts.Warehouseto in (SELECT value FROM dbo.SplitString(@Warehouseto, ',')) and ts.Fromwarehouse_approve=@Fromwarehouse_approve order by  ts.Id desc



 end





 if(@Query =19)

BEGIN



update Tbl_Stocktransfer set Finalinvoice=@Finalinvoice where Id=@Id



end





   if(@Query =20)

 BEGIN



 update Tbl_Stocktransfer set Towarehouse_approve=@Towarehouse_approve,Finalinvoice=@Finalinvoice where Id=@Id



 end





if(@Query =21)

 BEGIN



SELECT ts.*, tr.Firstname

FROM Tbl_Stocktransfer ts

LEFT JOIN Tbl_Registration tr ON tr.Userid = ts.Userid

WHERE ts.Towarehouse_approve = @Towarehouse_approve

  AND ts.Isdelete = @Isdelete

  AND ts.Status IN (@Status);









end





if(@Query =22)

 BEGIN





SET @Todaydate = GETDATE();

SELECT

    ts.*,

    tr.Firstname,

    tsl.Name AS WarehouseFromName,

    tsll.Name AS WarehouseToName

FROM Tbl_Stocktransfer ts

INNER JOIN Tbl_Registration tr ON tr.Userid = ts.Userid

INNER JOIN Tbl_Stocklocation tsl ON tsl.Id = ts.Warehousefrom

INNER JOIN Tbl_Stocklocation tsll ON tsll.Id = ts.Warehouseto

WHERE ts.Isdelete = 0

    AND   tr.Catelogid  IN (SELECT value FROM dbo.SplitString(@Catelogid, ','))



	and  CAST(TRY_CONVERT(DATETIME, ts.Date, 103) AS DATE) >= CAST(DATEADD(DAY, -90, @Todaydate) AS DATE)

AND ts.Towarehouse_approve =@Towarehouse_approve

ORDER BY ts.Id DESC;



end







if(@Query =23)

 BEGIN









SELECT

    ts.*,

    tr.Firstname,

    tsl.Name AS WarehouseFromName,

    tsll.Name AS WarehouseToName

FROM Tbl_Stocktransfer ts

INNER JOIN Tbl_Registration tr ON tr.Userid = ts.Userid

INNER JOIN Tbl_Stocklocation tsl ON tsl.Id = ts.Warehousefrom

INNER JOIN Tbl_Stocklocation tsll ON tsll.Id = ts.Warehouseto

WHERE ts.Isdelete = 0

    AND tr.Catelogid IN (SELECT value FROM dbo.SplitString('1', ','))

    AND CAST(TRY_CONVERT(DATETIME, LTRIM(RTRIM(ts.Date)), 103) AS DATE) BETWEEN

        CAST(@fromdate AS DATE)

        AND CAST(@todate AS DATE)

ORDER BY ts.Id DESC;



















 end





 if(@Query =24)

begin



select Status from Tbl_Stocktransfer  where Id=@Id





end

 if(@Query =25)

begin



update Tbl_Stocktransfer set Status=@Status  where Id=@Id





end



 if(@Query =26)

begin



update Tbl_Stocktransfer set Towarehouse_approve=@Towarehouse_approve,Finalinvoice=@Finalinvoice,Status=@Status  where Id=@Id





end





 if(@Query =27)

begin

select Towarehouse_approve from Tbl_Stocktransfer where Id=@Id



end


 if(@Query = 28)
 BEGIN
 SELECT 
    ts.*, 
    tr.Firstname, 
    tsl.Name AS WarehouseFromName, 
    tsll.Name AS WarehouseToName
 FROM Tbl_Stocktransfer ts
 INNER JOIN Tbl_Registration tr ON tr.Userid = ts.Userid
 INNER JOIN Tbl_Stocklocation tsl ON tsl.Id = ts.Warehousefrom
 INNER JOIN Tbl_Stocklocation tsll ON tsll.Id = ts.Warehouseto
 WHERE ts.Isdelete = 0 
    AND tr.Catelogid IN (SELECT value FROM dbo.SplitString(@Catelogid, ','))
    AND CAST(TRY_CONVERT(DATETIME, LTRIM(RTRIM(ts.Date)), 103) AS DATE) BETWEEN 
        CAST(@fromdate AS DATE) AND CAST(@todate AS DATE)
    AND (@Receiptno IS NULL OR @Receiptno = '' OR ts.Receiptno LIKE '%' + @Receiptno + '%')
    AND ts.Towarehouse_approve = @Towarehouse_approve
 ORDER BY ts.Id DESC;
 END
END




-- Stored Procedure for Driver Details Management
-- Query: 1=Insert, 2=Update, 3=Select All, 4=Soft Delete

CREATE PROCEDURE [dbo].[Sp_Driverdetails]
    @Id INT = NULL,
    @Drivername VARCHAR(MAX) = NULL,
    @Licenseno VARCHAR(MAX) = NULL,
    @Mobileno VARCHAR(50) = NULL,
    @Type VARCHAR(50) = NULL,
    @Isdelete VARCHAR(50) = NULL,
    @Query INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Query = 1: Insert new driver
    IF @Query = 1
    BEGIN
        INSERT INTO Tbl_Driverdetails (Drivername, Licenseno, Mobileno, Type, Isdelete)
        VALUES (@Drivername, @Licenseno, @Mobileno, @Type, ISNULL(@Isdelete, '0'));
    END

    -- Query = 2: Update existing driver
    IF @Query = 2
    BEGIN
        UPDATE Tbl_Driverdetails
        SET Drivername = @Drivername,
            Licenseno = @Licenseno,
            Mobileno = @Mobileno,
            Type = @Type,
            Isdelete = @Isdelete
        WHERE Id = @Id;
    END

    -- Query = 3: Select all drivers (filtered by Isdelete)
    IF @Query = 3
    BEGIN
        SELECT Id, Drivername, Licenseno, Mobileno, Type, Isdelete
        FROM Tbl_Driverdetails
        WHERE Isdelete = @Isdelete;
    END

    -- Query = 4: Soft Delete (update Isdelete to '1')
    IF @Query = 4
    BEGIN
        UPDATE Tbl_Driverdetails
        SET Isdelete = '1'
        WHERE Id = @Id;
    END
END

-- Stored Procedure for Vehicle Details Management
-- Query: 1=Insert, 2=Update, 3=Select All, 4=Soft Delete

CREATE PROCEDURE [dbo].[Sp_Vehicledetails]
    @Id INT = NULL,
    @Vehiclename VARCHAR(MAX) = NULL,
    @Vehicleno VARCHAR(MAX) = NULL,
    @Isdelete VARCHAR(50) = NULL,
    @Query INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Query = 1: Insert new vehicle
    IF @Query = 1
    BEGIN
        INSERT INTO Tbl_Vehicledetails (Vehiclename, Vehicleno, Isdelete)
        VALUES (@Vehiclename, @Vehicleno, ISNULL(@Isdelete, '0'));
    END

    -- Query = 2: Update existing vehicle
    IF @Query = 2
    BEGIN
        UPDATE Tbl_Vehicledetails
        SET Vehiclename = @Vehiclename,
            Vehicleno = @Vehicleno,
            Isdelete = @Isdelete
        WHERE Id = @Id;
    END

    -- Query = 3: Select all vehicles (filtered by Isdelete)
    IF @Query = 3
    BEGIN
        SELECT Id, Vehiclename, Vehicleno, Isdelete
        FROM Tbl_Vehicledetails
        WHERE Isdelete = @Isdelete;
    END

    -- Query = 4: Soft Delete (update Isdelete to '1')
    IF @Query = 4
    BEGIN
        UPDATE Tbl_Vehicledetails
        SET Isdelete = '1'
        WHERE Id = @Id;
    END
END

-- Stored Procedure for Sales Return Conditions Management
-- Query: 1=Insert, 2=Update, 3=Soft Delete, 4=Select by Condition, 5=Select All with Parent Name, 6=Search

ALTER PROCEDURE [dbo].[Sp_Salesreturnconditions]
	@Id INT,
	@Condition VARCHAR(50),
	@Parentcondition VARCHAR(50),
	@Isdelete VARCHAR(50),
	@Enterdate DATETIME,
	@Query INT
AS
BEGIN
	SET NOCOUNT ON;

	-- Query = 1: Insert new sales return condition
	IF (@Query = 1)
	BEGIN
		INSERT INTO Tbl_Salesreturnconditions (Condition, Parentcondition, Isdelete, Enterdate)
		VALUES (@Condition, @Parentcondition, @Isdelete, @Enterdate)
	END

	-- Query = 2: Update existing sales return condition
	IF (@Query = 2)
	BEGIN
		UPDATE Tbl_Salesreturnconditions
		SET Condition = @Condition,
			Parentcondition = @Parentcondition,
			Isdelete = @Isdelete,
			Enterdate = @Enterdate
		WHERE Id = @Id
	END

	-- Query = 3: Soft Delete (update Isdelete)
	IF (@Query = 3)
	BEGIN
		UPDATE Tbl_Salesreturnconditions
		SET Isdelete = @Isdelete
		WHERE Id = @Id
	END

	-- Query = 4: Select by Condition name
	IF (@Query = 4)
	BEGIN
		SELECT Condition
		FROM Tbl_Salesreturnconditions
		WHERE Condition = @Condition AND Isdelete = @Isdelete
	END

	-- Query = 5: Select All with Parent Condition Name (LEFT JOIN)
	IF (@Query = 5)
	BEGIN
		SELECT 
			A.Id,
			A.Condition,
			A.Parentcondition,
			B.Condition AS Parentconditionname,
			A.Isdelete,
			A.Enterdate
		FROM 
			Tbl_Salesreturnconditions A
		LEFT JOIN 
			Tbl_Salesreturnconditions B ON A.Parentcondition = B.Id
		WHERE 
			A.Isdelete = @Isdelete
		ORDER BY 
			A.Id DESC
	END

	-- Query = 6: Search by Condition name with Parent Condition Name
	IF (@Query = 6)
	BEGIN
		SELECT 
			A.Id,
			A.Condition,
			A.Parentcondition,
			B.Condition AS Parentconditionname,
			A.Isdelete,
			A.Enterdate
		FROM 
			Tbl_Salesreturnconditions A
		LEFT JOIN 
			Tbl_Salesreturnconditions B ON A.Parentcondition = B.Id
		WHERE 
			A.Condition LIKE '%' + @Condition + '%'
	END
END

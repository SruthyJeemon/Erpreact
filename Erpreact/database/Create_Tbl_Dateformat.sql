IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Tbl_Dateformat]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Tbl_Dateformat](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [Dateformat] [nvarchar](50) NULL,
        [Isdelete] [nvarchar](50) NULL,
        CONSTRAINT [PK_Tbl_Dateformat] PRIMARY KEY CLUSTERED 
        (
            [Id] ASC
        )
    )
END

IF NOT EXISTS (SELECT * FROM Tbl_Dateformat)
BEGIN
    INSERT INTO Tbl_Dateformat (Dateformat, Isdelete) VALUES ('dd-MM-yyyy', '0')
END

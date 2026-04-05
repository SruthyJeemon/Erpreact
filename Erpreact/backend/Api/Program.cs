using Microsoft.Data.SqlClient;
using System.Data;
using Api.Models;
using Api.Extensions;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddControllers()
    .AddJsonOptions(options => {
        options.JsonSerializerOptions.NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 100 * 1024 * 1024;
});

// Configure SQL Server connection
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddScoped<SqlConnection>(provider => new SqlConnection(connectionString));

// Enable CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173", 
            "http://localhost:5174", 
            "http://localhost:5175", 
            "http://localhost:5176", 
            "http://localhost:5177", 
            "http://localhost:5178", 
            "http://localhost:5179", 
            "http://localhost:5180",
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:50029"
        )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowReactApp");

// Enable static file serving for uploaded images
app.UseStaticFiles();

// HTTPS redirection disabled for development to avoid warnings when running HTTP-only
// Uncomment the line below if you need HTTPS redirection (requires HTTPS to be configured)
// app.UseHttpsRedirection();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.MapGet("/", () => "API is running");

app.MapGet("/api/seed-pickup-notification", async (SqlConnection connection) => 
{
    try
    {
        await connection.OpenAsync();
        string seedSql = @"
        SET NOCOUNT ON;
        DECLARE @InvId INT;
        SELECT @InvId = id FROM Tbl_Module WHERE ModuleName = 'Inventory';
        IF @InvId IS NULL
        BEGIN
            INSERT INTO Tbl_Module (ModuleName, Status) VALUES ('Inventory', 'Active');
            SET @InvId = SCOPE_IDENTITY();
        END

        IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE ModuleId = @InvId AND SubModuleName = 'Pickupnotification')
        BEGIN
            INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status) VALUES ('Pickupnotification', @InvId, 'Active');
        END
        
        DECLARE @SubId INT;
        SELECT @SubId = id FROM Tbl_SubModule WHERE ModuleId = @InvId AND SubModuleName = 'Pickupnotification';

        -- Grant to Salescoordinator (RoleId 29)
        IF NOT EXISTS (SELECT 1 FROM Tbl_Permission WHERE RoleId = 29 AND SubModuleId = @SubId)
        BEGIN
            INSERT INTO Tbl_Permission (RoleId, ModuleId, SubModuleId, PermissionType, Status)
            VALUES (29, @InvId, @SubId, 'Full Access', 'Active');
        END

        -- Also grant to Admin (8) for testing
        IF NOT EXISTS (SELECT 1 FROM Tbl_Permission WHERE RoleId = 8 AND SubModuleId = @SubId)
        BEGIN
            INSERT INTO Tbl_Permission (RoleId, ModuleId, SubModuleId, PermissionType, Status)
            VALUES (8, @InvId, @SubId, 'Full Access', 'Active');
        END

        SELECT 'Pickupnotification submodule seeded and permissions granted.' as Message;
        ";
        using (var cmd = new SqlCommand(seedSql, connection))
        {
            var msg = await cmd.ExecuteScalarAsync();
            return Results.Ok(new { success = true, message = msg });
        }
    }
    catch (Exception ex) { return Results.Json(new { error = ex.Message }); }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapGet("/api/debug-tasks", async (SqlConnection connection) => {
    await connection.OpenAsync();
    using(var cmd = new SqlCommand("SELECT TOP 50 Id, Tasktype, Assignedto, Groupbytask, Isdelete FROM Tbl_Maintask", connection)) {
        using(var reader = await cmd.ExecuteReaderAsync()) {
            var list = new List<object>();
            while(await reader.ReadAsync()) {
                list.Add(new { 
                    Id = reader["Id"], 
                    Tasktype = reader["Tasktype"], 
                    Assignedto = reader["Assignedto"], 
                    Groupbytask = reader["Groupbytask"], 
                    Isdelete = reader["Isdelete"] 
                });
            }
            return Results.Ok(list);
        }
    }
});

app.MapGet("/api/fix-sp-catalog", async (SqlConnection connection) => 
{
    try
    {
        await connection.OpenAsync();
        string sql = @"
        IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Sp_Maintask]') AND type in (N'P', N'PC'))
        BEGIN
            EXEC('
            ALTER PROCEDURE [dbo].[Sp_Maintask]
                @Id int = NULL OUTPUT,
                @Tasktype  varchar(50) = NULL,
                @Itemid  varchar(50) = NULL,
                @Itemtype varchar(50) = NULL,
                @Marketplace  varchar(50) = NULL,
                @Description  varchar(MAX) = NULL,
                @Assignedby  varchar(50) = NULL,
                @Assignedto varchar(50) = NULL,
                @Startdate datetime = NULL,
                @Enddate datetime = NULL,
                @Status  varchar(50) = NULL,
                @Createdat datetime = NULL,
                @Isdelete varchar(50) = NULL,
                @Query int,
                @Closeddate      datetime =null,
                @Userid  varchar(50)=null,
                @Groupbytask varchar(50)=null,
                @Catelogid varchar(50)=null,
                @Duration varchar(50)=null
            AS
            BEGIN
                SET NOCOUNT ON;

                IF(@Query = 1)
                BEGIN
                    INSERT INTO Tbl_Maintask(Tasktype,Itemid,Itemtype,Marketplace,Description,Assignedby,Assignedto,Startdate,Enddate,Status,Createdat,Isdelete,Groupbytask,Duration)
                    VALUES(@Tasktype,@Itemid,@Itemtype,@Marketplace,@Description,@Assignedby,@Assignedto,@Startdate,@Enddate,@Status,@Createdat,@Isdelete,@Groupbytask,@Duration)
                    SET @Id = SCOPE_IDENTITY()
                END

                IF (@Query = 2)
                BEGIN
                    DECLARE @UserRole VARCHAR(50);
                    SELECT @UserRole = Role FROM Tbl_Registration WHERE Userid = @Userid AND Catelogid = @Catelogid;

                    SELECT 
                        T.Id, T.Tasktype, T.Itemid, T.Itemtype, T.Marketplace, T.Description, T.Assignedby, T.Assignedto, T.Startdate, T.Enddate, T.Status, T.Createdat, T.Isdelete, T.ClosedDate, T.Groupbytask,
                        T.Duration,
                        CASE 
                            WHEN T.Itemid IS NULL THEN '''' 
                            WHEN T.Itemtype = ''Item''  THEN P.Itemname
                            WHEN T.Itemtype = ''Set''   THEN PS.Setname
                            WHEN T.Itemtype = ''Combo'' THEN PC.Comboname
                            ELSE ''''
                        END AS ItemName,
                        CASE 
                            WHEN T.Itemid IS NULL THEN NULL 
                            WHEN T.Itemtype = ''Item''  THEN TG.Gallery_file
                            WHEN T.Itemtype = ''Combo'' THEN TG1.Gallery_file
                            WHEN T.Itemtype = ''Set''   THEN TG2.Gallery_file
                            ELSE NULL
                        END AS Gallery_file,
                        ISNULL(AssignedByUser.Firstname, '''') + '' '' + ISNULL(AssignedByUser.Lastname, '''') AS AssignedByName,
                        ISNULL(AssignedToUser.Firstname, '''') + '' '' + ISNULL(AssignedToUser.Lastname, '''') AS AssignedToName,
                        (SELECT COUNT(*) FROM Tbl_Taskattachment WHERE Maintaskid = T.Id AND Isdelete = 0) AS AttachmentCount,
                        (SELECT COUNT(*) FROM Tbl_Taskcomments WHERE Maintaskid = T.Id) AS UnreadCount
                    FROM Tbl_Maintask T
                    LEFT JOIN Tbl_Productvariants P ON T.Itemid IS NOT NULL AND T.Itemtype = ''Item''  AND TRY_CAST(T.Itemid AS INT) = P.Id
                    LEFT JOIN Tbl_Productset     PS ON T.Itemid IS NOT NULL AND T.Itemtype = ''Set''   AND TRY_CAST(T.Itemid AS INT) = PS.Id
                    LEFT JOIN Tbl_Combo          PC ON T.Itemid IS NOT NULL AND T.Itemtype = ''Combo'' AND TRY_CAST(T.Itemid AS INT) = PC.Id
                    LEFT JOIN Tbl_Registration AssignedByUser ON AssignedByUser.Userid = T.Assignedby
                    LEFT JOIN Tbl_Registration AssignedToUser ON AssignedToUser.Userid = T.Assignedto
                    OUTER APPLY (SELECT TOP 1 Gallery_file FROM Tbl_Gallery WHERE T.Itemid IS NOT NULL AND Productvariants_id = P.Id AND File_Id = 3) TG
                    OUTER APPLY (SELECT TOP 1 Gallery_file FROM Tbl_Gallery WHERE T.Itemid IS NOT NULL AND Productcombo_id   = PC.Id AND File_Id = 3) TG1
                    OUTER APPLY (SELECT TOP 1 Gallery_file FROM Tbl_Gallery WHERE T.Itemid IS NOT NULL AND Productset_id     = PS.Id AND File_Id = 3) TG2
                    WHERE T.Isdelete = 0
                      AND (
                        @UserRole IN (''Manager'', ''Admin'', ''Superadmin'')
                        OR (T.Assignedto = @Userid OR T.Assignedby = @Userid)
                      )
                      AND (T.Status <> 4 OR CAST(T.ClosedDate AS DATE) = CAST(GETDATE() AS DATE))
                    ORDER BY T.CreatedAt DESC;
                END

                IF (@Query = 3)
                BEGIN
                    SELECT T.*, 
                        CASE 
                            WHEN T.Itemid IS NULL THEN '''' 
                            WHEN T.Itemtype = ''Item''  THEN P.Itemname
                            WHEN T.Itemtype = ''Set''   THEN PS.Setname
                            WHEN T.Itemtype = ''Combo'' THEN PC.Comboname
                            ELSE ''''
                        END AS ItemName,
                        AssignedByUser.Firstname + '' '' + AssignedByUser.Lastname AS AssignedByName,
                        AssignedToUser.Firstname + '' '' + AssignedToUser.Lastname AS AssignedToName
                    FROM Tbl_Maintask T
                    LEFT JOIN Tbl_Productvariants P ON T.Itemid IS NOT NULL AND T.Itemtype = ''Item''  AND TRY_CAST(T.Itemid AS INT) = P.Id
                    LEFT JOIN Tbl_Productset     PS ON T.Itemid IS NOT NULL AND T.Itemtype = ''Set''   AND TRY_CAST(T.Itemid AS INT) = PS.Id
                    LEFT JOIN Tbl_Combo          PC ON T.Itemid IS NOT NULL AND T.Itemtype = ''Combo'' AND TRY_CAST(T.Itemid AS INT) = PC.Id
                    LEFT JOIN Tbl_Registration AssignedByUser ON AssignedByUser.Userid = T.Assignedby
                    LEFT JOIN Tbl_Registration AssignedToUser ON AssignedToUser.Userid = T.Assignedto
                    WHERE T.Id = @Id
                END

                IF (@Query = 4)
                BEGIN
                    UPDATE Tbl_Maintask SET Tasktype=COALESCE(@Tasktype, Tasktype), Marketplace=COALESCE(@Marketplace, Marketplace), Description=COALESCE(@Description, Description), Assignedby=COALESCE(@Assignedby, Assignedby), Assignedto=COALESCE(@Assignedto, Assignedto), Startdate=COALESCE(@Startdate, Startdate), Enddate=COALESCE(@Enddate, Enddate), Status=COALESCE(@Status, Status), Isdelete=COALESCE(@Isdelete, Isdelete), Duration=COALESCE(@Duration, Duration) WHERE Id=@Id
                END

                IF (@Query = 5)
                BEGIN
                    UPDATE Tbl_Maintask SET Status=COALESCE(@Status, Status), Closeddate=COALESCE(@Closeddate, Closeddate), 
                        Startdate = COALESCE(@Startdate, Startdate),
                        Enddate = COALESCE(@Enddate, Enddate)
                    WHERE Id=@Id
                END

                IF (@Query = 8)
                BEGIN
                    UPDATE Tbl_Maintask SET Groupbytask=@Groupbytask, Isdelete=COALESCE(@Isdelete, Isdelete) WHERE Id=@Id
                END

                IF (@Query = 9)
                BEGIN
                    DECLARE @UserRole9 VARCHAR(50);
                    SELECT TOP 1 @UserRole9 = Role FROM Tbl_Registration WHERE Userid = @Userid;

                    SELECT 
                        T.Id, T.Tasktype, T.Assignedby, T.Assignedto, T.Status, T.Createdat, T.Startdate, T.Enddate, T.Description,
                        ISNULL(AssignedByUser.Firstname, '''') + '' '' + ISNULL(AssignedByUser.Lastname, '''') AS AssignedByName,
                        ISNULL(AssignedToUser.Firstname, '''') + '' '' + ISNULL(AssignedToUser.Lastname, '''') AS AssignedToName,
                        (SELECT COUNT(*) FROM Tbl_Taskattachment WHERE Maintaskid = T.Id AND Isdelete = 0) AS AttachmentCount
                    FROM Tbl_Maintask T
                    LEFT JOIN Tbl_Registration AssignedByUser ON AssignedByUser.Userid = T.Assignedby
                    LEFT JOIN Tbl_Registration AssignedToUser ON AssignedToUser.Userid = T.Assignedto
                    WHERE T.Isdelete = 0
                      AND (T.Groupbytask IS NULL OR T.Groupbytask = '''' OR T.Groupbytask = CAST(T.Id AS VARCHAR(50)))
                      AND (
                        @UserRole9 IN (''Manager'', ''Admin'', ''Superadmin'')
                        OR T.Assignedto = @Userid 
                        OR T.Assignedby = @Userid
                      )
                    ORDER BY T.CreatedAt DESC;
                END

                IF (@Query = 10)
                BEGIN
                    DECLARE @GroupId INT;
                    SELECT @GroupId = COALESCE(NULLIF(Groupbytask, '''' ), Id) FROM Tbl_Maintask WHERE Id = @Id;

                    SELECT T.*, 
                        CASE 
                            WHEN T.Itemid IS NULL THEN '''' 
                            WHEN T.Itemtype = ''Item''  THEN P.Itemname
                            WHEN T.Itemtype = ''Set''   THEN PS.Setname
                            WHEN T.Itemtype = ''Combo'' THEN PC.Comboname
                            ELSE ''''
                        END AS ItemName,
                        AssignedByUser.Firstname + '' '' + AssignedByUser.Lastname AS AssignedByName,
                        AssignedToUser.Firstname + '' '' + AssignedToUser.Lastname AS AssignedToName
                    FROM Tbl_Maintask T
                    LEFT JOIN Tbl_Productvariants P ON T.Itemid IS NOT NULL AND T.Itemtype = ''Item''  AND TRY_CAST(T.Itemid AS INT) = P.Id
                    LEFT JOIN Tbl_Productset     PS ON T.Itemid IS NOT NULL AND T.Itemtype = ''Set''   AND TRY_CAST(T.Itemid AS INT) = PS.Id
                    LEFT JOIN Tbl_Combo          PC ON T.Itemid IS NOT NULL AND T.Itemtype = ''Combo'' AND TRY_CAST(T.Itemid AS INT) = PC.Id
                    LEFT JOIN Tbl_Registration AssignedByUser ON AssignedByUser.Userid = T.Assignedby
                    LEFT JOIN Tbl_Registration AssignedToUser ON AssignedToUser.Userid = T.Assignedto
                    WHERE COALESCE(NULLIF(T.Groupbytask, ''''), T.Id) = @GroupId AND T.Isdelete = 0
                    ORDER BY T.Createdat ASC;
                END

                IF (@Query = 11)
                BEGIN
                    UPDATE Tbl_Maintask SET Isdelete=@Isdelete WHERE Id=@Id OR Groupbytask=CAST(@Id AS VARCHAR(50))
                END
            END')
        END";
        using (var cmd = new SqlCommand(sql, connection))
        {
            await cmd.ExecuteNonQueryAsync();
        }
        return Results.Ok("Sp_Maintask fixed with @Catelogid and Duration");
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message, stack = ex.StackTrace });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapGet("/api/fix-sp-login", async (SqlConnection connection) => 
{
    try
    {
        await connection.OpenAsync();
        string spSql = @"
        IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Sp_Login]') AND type in (N'P', N'PC'))
        BEGIN
            EXEC('
            ALTER PROCEDURE [dbo].[Sp_Login]
                @Userid varchar(50),
                @Email varchar(50),
                @Password varchar(50),
                @Role varchar(50),
                @Lastlogindate varchar(50),
                @Status varchar(50),
                @Query int
            AS
            BEGIN
                SET NOCOUNT ON;
                IF (@Query = 1)
                BEGIN
                    INSERT INTO Tbl_Login(Userid, Email, Password, Role, Lastlogindate, Status)
                    VALUES(@Userid, @Email, LOWER(CONVERT(VARCHAR(32), HASHBYTES(''MD5'', CONVERT(VARCHAR(50), @Password)), 2)), @Role, @Lastlogindate, @Status)
                END
                IF (@Query = 2)
                BEGIN
                    SELECT L.*, R.Firstname, R.Lastname 
                    FROM Tbl_Login L 
                    LEFT JOIN Tbl_Registration R ON L.Email = R.Email 
                    WHERE L.Email = @Email 
                      AND L.Password = LOWER(CONVERT(VARCHAR(32), HASHBYTES(''MD5'', CONVERT(VARCHAR(50), @Password)), 2)) 
                      AND L.Status = @Status
                END
                IF (@Query = 3)
                BEGIN
                    UPDATE Tbl_Login SET Status = @Status WHERE Userid = @Userid
                END
                IF (@Query = 4)
                BEGIN
                    UPDATE Tbl_Login SET Lastlogindate = @Lastlogindate WHERE Userid = @Userid
                END
            END')
        END";
        using (var cmd = new SqlCommand(spSql, connection))
        {
            await cmd.ExecuteNonQueryAsync();
        }
        return Results.Ok("Sp_Login updated to include Firstname and Lastname.");
    }
    catch (Exception ex) { return Results.Json(new { success = false, message = ex.Message }); }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapGet("/api/fix-sp-subtask", async (SqlConnection connection) => 
{
    try
    {
        await connection.OpenAsync();

        // Ensure columns exist
        string addCols = @"
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Tbl_Subtask' AND COLUMN_NAME='Category') ALTER TABLE Tbl_Subtask ADD Category varchar(100) NULL;
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Tbl_Subtask' AND COLUMN_NAME='Attachment') ALTER TABLE Tbl_Subtask ADD Attachment varchar(MAX) NULL;
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Tbl_Subtask' AND COLUMN_NAME='External_startdate') ALTER TABLE Tbl_Subtask ADD External_startdate datetime NULL;
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Tbl_Subtask' AND COLUMN_NAME='External_enddate') ALTER TABLE Tbl_Subtask ADD External_enddate datetime NULL;
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Tbl_Subtask' AND COLUMN_NAME='Username') ALTER TABLE Tbl_Subtask ADD Username varchar(100) NULL;
        ";
        using (var c = new SqlCommand(addCols, connection)) await c.ExecuteNonQueryAsync();

        // Define/Alter Sp_Subtask
        string spSql = @"
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Sp_Subtask]') AND type in (N'P', N'PC'))
        BEGIN
            EXEC('CREATE PROCEDURE [dbo].[Sp_Subtask] AS BEGIN SET NOCOUNT ON; END')
        END;
        ";
        using (var c = new SqlCommand(spSql, connection)) await c.ExecuteNonQueryAsync();

        string alterSql = @"
        ALTER PROCEDURE [dbo].[Sp_Subtask]
            @Id int = 0,
            @Maintaskid varchar(50) = null,
            @Assignedby varchar(50) = null,
            @Assignedto varchar(50) = null,
            @Startdate datetime = null,
            @Enddate datetime = null,
            @Status varchar(50) = null,
            @Createdat datetime = null,
            @Isdelete varchar(50) = '0',
            @Title varchar(500) = null,
            @Description varchar(MAX) = null,
            @Query int = 0,
            @Category varchar(100) = null,
            @Attachment varchar(MAX) = null,
            @NewSubtaskId int = null OUTPUT
        AS
        BEGIN
            SET NOCOUNT ON;
            IF(@Query = 1)
            BEGIN
                INSERT INTO Tbl_Subtask(Maintaskid, Assignedby, Assignedto, Startdate, Enddate, Status, Createdat, Isdelete, Title, Description, Category, Attachment)
                VALUES(@Maintaskid, @Assignedby, @Assignedto, @Startdate, @Enddate, @Status, @Createdat, @Isdelete, @Title, @Description, @Category, @Attachment)
                SET @NewSubtaskId = SCOPE_IDENTITY()
            END
            IF(@Query = 2)
            BEGIN
                SELECT S.Id, S.Maintaskid, S.Assignedby, S.Assignedto,
                       S.Startdate, S.Enddate, S.Status, S.Createdat,
                       S.Isdelete, S.Title, S.Description, S.Closeddate,
                       S.Category, S.Attachment,
                       U1.Firstname + ' ' + U1.Lastname AS AssignedByName,
                       U2.Firstname + ' ' + U2.Lastname AS Firstname,
                       U2.Email AS Username,
                       S.Startdate AS External_startdate,
                       S.Enddate AS External_enddate
                FROM Tbl_Subtask S
                LEFT JOIN Tbl_Registration U1 ON U1.Userid = S.Assignedby
                LEFT JOIN Tbl_Registration U2 ON U2.Userid = S.Assignedto
                WHERE S.Maintaskid = @Maintaskid
                  AND (CAST(S.Isdelete AS VARCHAR(5)) = '0' OR CAST(S.Isdelete AS VARCHAR(5)) = 'False')
            END
            IF(@Query = 3)
            BEGIN
                SELECT S.Id, S.Maintaskid, S.Assignedby, S.Assignedto,
                       S.Startdate, S.Enddate, S.Status, S.Createdat,
                       S.Isdelete, S.Title, S.Description, S.Closeddate,
                       S.Category, S.Attachment,
                       U1.Firstname + ' ' + U1.Lastname AS AssignedByName,
                       U2.Firstname + ' ' + U2.Lastname AS Firstname,
                       U2.Email AS Username
                FROM Tbl_Subtask S
                LEFT JOIN Tbl_Registration U1 ON U1.Userid = S.Assignedby
                LEFT JOIN Tbl_Registration U2 ON U2.Userid = S.Assignedto
                WHERE S.Id = @Id
            END
            IF(@Query = 4)
            BEGIN
                UPDATE Tbl_Subtask 
                SET Title=@Title, 
                    Description=@Description, 
                    Assignedto=@Assignedto, 
                    Startdate=@Startdate, 
                    Enddate=@Enddate, 
                    Category=@Category, 
                    Attachment=COALESCE(@Attachment, Attachment)
                WHERE Id=@Id
            END
            IF(@Query = 5)
            BEGIN
                UPDATE Tbl_Subtask SET Isdelete='1' WHERE Id=@Id
            END
            IF(@Query = 6)
            BEGIN
                -- Fetch all subtasks assigned to a specific user (for Kanban board)
                SELECT S.Id, S.Maintaskid, S.Assignedby, S.Assignedto,
                       S.Startdate, S.Enddate, S.Status, S.Createdat,
                       S.Isdelete, S.Title, S.Description, S.Closeddate,
                       S.Category, S.Attachment,
                       U1.Firstname + ' ' + U1.Lastname AS AssignedByName,
                       U2.Firstname + ' ' + U2.Lastname AS Firstname,
                       U2.Email AS Username,
                       S.Startdate AS External_startdate,
                       S.Enddate AS External_enddate
                FROM Tbl_Subtask S
                LEFT JOIN Tbl_Registration U1 ON U1.Userid = S.Assignedby
                LEFT JOIN Tbl_Registration U2 ON U2.Userid = S.Assignedto
                WHERE S.Assignedto = @Assignedto
                  AND (CAST(S.Isdelete AS VARCHAR(5)) = '0' OR CAST(S.Isdelete AS VARCHAR(5)) = 'False')
            END
        END";
        using (var c = new SqlCommand(alterSql, connection)) await c.ExecuteNonQueryAsync();

        return Results.Ok("Sp_Subtask and columns fixed.");
    }
    catch (Exception ex) { return Results.Json(new { success = false, message = ex.Message }); }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapGet("/api/debug/tasks", async (SqlConnection connection) => 
{
    var tasks = new List<object>();
    await connection.OpenAsync();
    using (var cmd = new SqlCommand("SELECT Id, Itemid, Itemtype, Assignedby, Assignedto, Status, Isdelete FROM Tbl_Maintask", connection))
    using (var reader = await cmd.ExecuteReaderAsync())
    {
        while (await reader.ReadAsync())
        {
            tasks.Add(new { 
                Id = reader["Id"]?.ToString(), 
                Itemid = reader["Itemid"]?.ToString(), 
                Itemtype = reader["Itemtype"]?.ToString(),
                Assignedby = reader["Assignedby"]?.ToString(),
                Assignedto = reader["Assignedto"]?.ToString(),
                Status = reader["Status"]?.ToString(),
                Isdelete = reader["Isdelete"]?.ToString()
            });
        }
    }
    return Results.Ok(tasks);
});
app.MapGet("/api/seed-reports", async (SqlConnection connection) => 
{
    try
    {
        await connection.OpenAsync();
        string seedSql = @"
        SET NOCOUNT ON;
        DECLARE @ReportId INT;
        SELECT @ReportId = id FROM Tbl_Module WHERE ModuleName = 'Reports';
        IF @ReportId IS NULL
        BEGIN
            INSERT INTO Tbl_Module (ModuleName, Status) VALUES ('Reports', 'Active');
            SET @ReportId = SCOPE_IDENTITY();
        END

        -- Ensure only 'Business Analytics' submodule exists under Reports
        DELETE FROM Tbl_Permission WHERE SubModuleId IN (SELECT id FROM Tbl_SubModule WHERE ModuleId = @ReportId AND SubModuleName <> 'Business Analytics');
        DELETE FROM Tbl_SubModule WHERE ModuleId = @ReportId AND SubModuleName <> 'Business Analytics';

        IF NOT EXISTS (SELECT 1 FROM Tbl_SubModule WHERE ModuleId = @ReportId AND SubModuleName = 'Business Analytics')
        BEGIN
            INSERT INTO Tbl_SubModule (SubModuleName, ModuleId, Status) VALUES ('Business Analytics', @ReportId, 'Active');
        END
        
        DECLARE @SAMId INT;
        SELECT @SAMId = id FROM Tbl_SubModule WHERE ModuleId = @ReportId AND SubModuleName = 'Business Analytics';

        -- Grant Business Analytics to Admin (RoleId 8)
        IF NOT EXISTS (SELECT 1 FROM Tbl_Permission WHERE RoleId = 8 AND SubModuleId = @SAMId)
        BEGIN
            INSERT INTO Tbl_Permission (RoleId, ModuleId, SubModuleId, PermissionType, Status)
            VALUES (8, @ReportId, @SAMId, 'Full Access', 'Active');
        END

        -- Create Report Permission Table if not exists
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Tbl_ReportPermission]') AND type in (N'U'))
        BEGIN
            CREATE TABLE Tbl_ReportPermission (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                RoleId INT NOT NULL,
                Category NVARCHAR(100) NOT NULL,
                ReportName NVARCHAR(100) NOT NULL,
                Permission BIT DEFAULT 1,
                Status NVARCHAR(50) DEFAULT 'Active',
                CreatedAt DATETIME DEFAULT GETDATE()
            );
        END

        -- List of all reporting sections and subsections
        DECLARE @Reports TABLE (Category NVARCHAR(100), Name NVARCHAR(100));
        INSERT INTO @Reports (Category, Name) VALUES 
        ('Sales', 'Sales Summary'), ('Sales', 'Sales Summary Details'), ('Sales', 'Revenue Report'), ('Sales', 'New & Old Invoice Summary'), ('Sales', 'Brand Report'), ('Sales', 'Customer Report'), ('Sales', 'Category Report'), ('Sales', 'Cost of goods Report'), ('Sales', 'Customer Balance Report'),
        ('Purchase', 'Purchase Summary'), ('Purchase', 'Supplier Report'), ('Purchase', 'Purchase Returns'),
        ('Stock', 'Warehouse Stock'), ('Stock', 'Sales Stock'),
        ('Stock Transfer', 'Stock Transfer Report'),
        ('Product', 'Product Report');

        -- Seed Admin permissions for all reports
        INSERT INTO Tbl_ReportPermission (RoleId, Category, ReportName, Permission)
        SELECT 8, r.Category, r.Name, 1
        FROM @Reports r
        WHERE NOT EXISTS (SELECT 1 FROM Tbl_ReportPermission rp WHERE rp.RoleId = 8 AND rp.Category = r.Category AND rp.ReportName = r.Name);

        SELECT 'Reports module and submodules simplified. Tbl_ReportPermission initialized.' as Message;
        ";
        using (var cmd = new SqlCommand(seedSql, connection))
        {
            var msg = await cmd.ExecuteScalarAsync();
            return Results.Ok(new { success = true, message = msg });
        }
    }
    catch (Exception ex) { return Results.Json(new { error = ex.Message }); }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapGet("/api/debug/sp/{name}", async (string name, SqlConnection connection) => 
{
    var lines = new List<string>();
    await connection.OpenAsync();
    using (var cmd = new SqlCommand("sp_helptext @name", connection))
    {
        cmd.Parameters.AddWithValue("@name", name);
        try {
            using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    lines.Add(reader[0].ToString() ?? "");
                }
            }
        } catch (Exception ex) { return Results.Json(new { error = ex.Message }); }
    }
    return Results.Ok(string.Join("", lines));
});

app.MapPost("/api/login", async (LoginRequest request, SqlConnection connection) =>
{
    var response = new LoginResponse();
    
    try
    {
        await connection.OpenAsync();
        Console.WriteLine($"[DEBUG] Login Attempt: Email={request.Email}");
        
        using var command = new SqlCommand("Sp_Login", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        // Let's also check if the user exists at all manually for debugging
        using (var checkCmd = new SqlCommand("SELECT COUNT(*) FROM Tbl_Registration WHERE Email = @Email", connection))
        {
            checkCmd.Parameters.AddWithValue("@Email", request.Email);
            var exists = await checkCmd.ExecuteScalarAsync();
            Console.WriteLine($"[DEBUG] User exists in Tbl_Registration: {exists}");
        }

        command.Parameters.AddWithValue("@Userid", DBNull.Value);
        command.Parameters.AddWithValue("@Email", request.Email);
        command.Parameters.AddWithValue("@Password", request.Password);
        command.Parameters.AddWithValue("@Role", DBNull.Value);
        command.Parameters.AddWithValue("@Lastlogindate", DBNull.Value);
        command.Parameters.AddWithValue("@Status", request.Status);
        command.Parameters.AddWithValue("@Query", 2); // Query = 2 for Login
        
        using var reader = await command.ExecuteReaderAsync();
        
        if (await reader.ReadAsync())
        {
            // Login successful
            var user = new UserData
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                Userid = reader.IsDBNull(reader.GetOrdinal("Userid")) ? "" : reader.GetString(reader.GetOrdinal("Userid")),
                Email = reader.IsDBNull(reader.GetOrdinal("Email")) ? "" : reader.GetString(reader.GetOrdinal("Email")),
                Role = reader.IsDBNull(reader.GetOrdinal("Role")) ? "" : reader.GetString(reader.GetOrdinal("Role")),
                Lastlogindate = reader.IsDBNull(reader.GetOrdinal("Lastlogindate")) ? "" : reader.GetString(reader.GetOrdinal("Lastlogindate")),
                Status = reader.IsDBNull(reader.GetOrdinal("Status")) ? "" : reader.GetString(reader.GetOrdinal("Status"))
            };

            // Safely check if Firstname and Lastname columns exist and read them
            for (int i = 0; i < reader.FieldCount; i++)
            {
                string colName = reader.GetName(i);
                if (colName.Equals("Firstname", StringComparison.OrdinalIgnoreCase))
                {
                    user.Firstname = reader.IsDBNull(i) ? "" : reader.GetValue(i).ToString();
                }
                else if (colName.Equals("Lastname", StringComparison.OrdinalIgnoreCase))
                {
                    user.Lastname = reader.IsDBNull(i) ? "" : reader.GetValue(i).ToString();
                }
            }

            // Safely check if Catelogid column exists and read it
            bool hasCatelogidColumn = false;
            for (int i = 0; i < reader.FieldCount; i++)
            {
                if (reader.GetName(i).Equals("Catelogid", StringComparison.OrdinalIgnoreCase))
                {
                    hasCatelogidColumn = true;
                    break;
                }
            }

            if (hasCatelogidColumn)
            {
                user.Catelogid = reader.IsDBNull(reader.GetOrdinal("Catelogid")) ? "" : reader.GetValue(reader.GetOrdinal("Catelogid")).ToString();
            }
            else
            {
                // Fallback: Fetch Catelogid directly from Tbl_Registration if SP doesn't return it
                reader.Close(); // Close previous reader
                using var fetchCmd = new SqlCommand("SELECT Catelogid FROM Tbl_Registration WHERE Email = @Email", connection);
                fetchCmd.Parameters.AddWithValue("@Email", request.Email);
                var result = await fetchCmd.ExecuteScalarAsync();
                user.Catelogid = result?.ToString() ?? "";
            }
            
            if (reader != null && !reader.IsClosed) reader.Close();

            // Fetch RoleId from Tbl_Role based on role name
            if (!string.IsNullOrEmpty(user.Role))
            {
                using var roleCmd = new SqlCommand("SELECT TOP 1 Id FROM Tbl_Role WHERE Role = @Role", connection);
                roleCmd.Parameters.AddWithValue("@Role", user.Role);
                var rId = await roleCmd.ExecuteScalarAsync();
                if (rId != null && rId != DBNull.Value)
                {
                    user.RoleId = Convert.ToInt32(rId);
                }
            }
            
            // Update last login date (Query = 4)
            var lastLoginDate = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
            using var updateCommand = new SqlCommand("Sp_Login", connection)
            {
                CommandType = System.Data.CommandType.StoredProcedure
            };
            
            updateCommand.Parameters.AddWithValue("@Userid", user.Userid);
            updateCommand.Parameters.AddWithValue("@Email", DBNull.Value);
            updateCommand.Parameters.AddWithValue("@Password", DBNull.Value);
            updateCommand.Parameters.AddWithValue("@Role", DBNull.Value);
            updateCommand.Parameters.AddWithValue("@Lastlogindate", lastLoginDate);
            updateCommand.Parameters.AddWithValue("@Status", DBNull.Value);
            updateCommand.Parameters.AddWithValue("@Query", 4); // Query = 4 for Update Last Login Date
            
            await updateCommand.ExecuteNonQueryAsync();
            user.Lastlogindate = lastLoginDate;
            
            response.Success = true;
            response.Message = "Login successful";
            response.User = user;
        }
        else
        {
            // Login failed
            response.Success = false;
            response.Message = "Invalid email or password";
        }
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("Login")
.WithOpenApi();

// Logout endpoint
app.MapPost("/api/logout", async (HttpRequest request) =>
{
    try
    {
        // In a real application, you might want to:
        // 1. Invalidate server-side session tokens
        // 2. Update last logout time in database
        // 3. Clear any server-side session storage
        
        // For now, we'll just return success
        // The frontend will handle clearing localStorage/sessionStorage
        return Results.Json(new { Success = true, Message = "Logout successful" });
    }
    catch (Exception ex)
    {
        return Results.Json(new { Success = false, Message = $"Error: {ex.Message}" });
    }
})
.WithName("Logout")
.WithOpenApi();

// Get user profile by email
app.MapGet("/api/user/profile/{email}", async (string email, SqlConnection connection) =>
{
    try
    {
        await connection.OpenAsync();
        using (var cmd = new SqlCommand("SELECT Firstname, Lastname, Userid, Role, Email FROM Tbl_Registration WHERE Email = @Email", connection))
        {
            cmd.Parameters.AddWithValue("@Email", email);
            using (var reader = await cmd.ExecuteReaderAsync())
            {
                if (await reader.ReadAsync())
                {
                    return Results.Ok(new {
                        Success = true,
                        Firstname = reader["Firstname"]?.ToString(),
                        Lastname = reader["Lastname"]?.ToString(),
                        Userid = reader["Userid"]?.ToString(),
                        Role = reader["Role"]?.ToString(),
                        Email = reader["Email"]?.ToString()
                    });
                }
            }
        }
        return Results.Ok(new { Success = false, Message = "User not found" });
    }
    catch (Exception ex)
    {
        return Results.Ok(new { Success = false, Message = ex.Message });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
})
.WithName("GetUserProfile")
.WithOpenApi();

// Role Management Endpoints

// Get all roles
app.MapGet("/api/role", async (SqlConnection connection) =>
{
    var response = new RoleResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Role", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Role", DBNull.Value);
        command.Parameters.AddWithValue("@id", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 3); // Query = 3 for Select All
        
        using var reader = await command.ExecuteReaderAsync();
        var roles = new List<RoleData>();
        
        while (await reader.ReadAsync())
        {
            roles.Add(new RoleData
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                Role = reader.IsDBNull(reader.GetOrdinal("Role")) ? "" : reader.GetString(reader.GetOrdinal("Role"))
            });
        }
        
        response.Success = true;
        response.Message = "Roles retrieved successfully";
        response.Roles = roles;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetAllRoles")
.WithOpenApi();

// Get role by name (to get RoleId from Role name)
app.MapGet("/api/role/byname/{roleName}", async (string roleName, SqlConnection connection) =>
{
    var response = new RoleResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Role", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Role", roleName);
        command.Parameters.AddWithValue("@id", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 5); // Query = 5 for Search
        
        using var reader = await command.ExecuteReaderAsync();
        var roles = new List<RoleData>();
        
        while (await reader.ReadAsync())
        {
            roles.Add(new RoleData
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                Role = reader.IsDBNull(reader.GetOrdinal("Role")) ? "" : reader.GetString(reader.GetOrdinal("Role"))
            });
        }
        
        response.Success = roles.Count > 0;
        response.Message = roles.Count > 0 ? "Role found" : "Role not found";
        response.Roles = roles;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetRoleByName")
.WithOpenApi();

// Create new role
app.MapPost("/api/role", async (RoleRequest request, SqlConnection connection) =>
{
    var response = new RoleResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Role))
        {
            response.Success = false;
            response.Message = "Role name is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Role", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Role", request.Role);
        command.Parameters.AddWithValue("@id", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 1); // Query = 1 for Insert
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Role created successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("CreateRole")
.WithOpenApi();

// Update role
app.MapPut("/api/role/{id}", async (int id, RoleRequest request, SqlConnection connection) =>
{
    var response = new RoleResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Role))
        {
            response.Success = false;
            response.Message = "Role name is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Role", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Role", request.Role);
        command.Parameters.AddWithValue("@id", id);
        command.Parameters.AddWithValue("@Query", 2); // Query = 2 for Update
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Role updated successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("UpdateRole")
.WithOpenApi();

// Report Permission Endpoints
app.MapGet("/api/report-permission/{roleId}", async (int roleId, SqlConnection connection) =>
{
    try
    {
        await connection.OpenAsync();
        using var command = new SqlCommand("SELECT Id, RoleId, Category, ReportName, Permission FROM Tbl_ReportPermission WHERE RoleId = @RoleId", connection);
        command.Parameters.AddWithValue("@RoleId", roleId);
        
        using var reader = await command.ExecuteReaderAsync();
        var permissions = new List<object>();
        while (await reader.ReadAsync())
        {
            permissions.Add(new {
                Id = reader["Id"],
                RoleId = reader["RoleId"],
                Category = reader["Category"],
                ReportName = reader["ReportName"],
                Permission = reader["Permission"]
            });
        }
        return Results.Ok(new { success = true, data = permissions });
    }
    catch (Exception ex) { return Results.Json(new { success = false, message = ex.Message }); }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
})
.WithName("GetReportPermissions")
.WithOpenApi();

app.MapPost("/api/report-permission", async (ReportPermissionRequest request, SqlConnection connection) =>
{
    try
    {
        await connection.OpenAsync();
        foreach (var perm in request.Permissions)
        {
            using var command = new SqlCommand(@"
                IF EXISTS (SELECT 1 FROM Tbl_ReportPermission WHERE RoleId = @RoleId AND Category = @Category AND ReportName = @ReportName)
                BEGIN
                    UPDATE Tbl_ReportPermission SET Permission = @Permission WHERE RoleId = @RoleId AND Category = @Category AND ReportName = @ReportName
                END
                ELSE
                BEGIN
                    INSERT INTO Tbl_ReportPermission (RoleId, Category, ReportName, Permission) VALUES (@RoleId, @Category, @ReportName, @Permission)
                END", connection);
            command.Parameters.AddWithValue("@RoleId", request.RoleId);
            command.Parameters.AddWithValue("@Category", perm.Category);
            command.Parameters.AddWithValue("@ReportName", perm.ReportName);
            command.Parameters.AddWithValue("@Permission", perm.Permission);
            await command.ExecuteNonQueryAsync();
        }
        return Results.Ok(new { success = true, message = "Permissions updated successfully" });
    }
    catch (Exception ex) { return Results.Json(new { success = false, message = ex.Message }); }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
})
.WithName("UpdateReportPermissions")
.WithOpenApi();

// Delete role
app.MapDelete("/api/role/{id}", async (int id, SqlConnection connection) =>
{
    var response = new RoleResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Role", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Role", DBNull.Value);
        command.Parameters.AddWithValue("@id", id);
        command.Parameters.AddWithValue("@Query", 4); // Query = 4 for Delete
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Role deleted successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("DeleteRole")
.WithOpenApi();

// Search roles
app.MapGet("/api/role/search", async (string term, SqlConnection connection) =>
{
    var response = new RoleResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Role", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Role", term);
        command.Parameters.AddWithValue("@id", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 5); // Query = 5 for Search
        
        using var reader = await command.ExecuteReaderAsync();
        var roles = new List<RoleData>();
        
        while (await reader.ReadAsync())
        {
            roles.Add(new RoleData
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                Role = reader.IsDBNull(reader.GetOrdinal("Role")) ? "" : reader.GetString(reader.GetOrdinal("Role"))
            });
        }
        
        response.Success = true;
        response.Message = "Roles retrieved successfully";
        response.Roles = roles;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("SearchRoles")
.WithOpenApi();

// Marketplace Management Endpoints

// Get all marketplaces
app.MapGet("/api/marketplace", async (SqlConnection connection) =>
{
    var response = new MarketplaceResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Marketplace", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Marketplace", DBNull.Value);
        command.Parameters.AddWithValue("@id", DBNull.Value);
        command.Parameters.AddWithValue("@Status", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 3); // Query = 3 for Select All
        
        using var reader = await command.ExecuteReaderAsync();
        var marketplaces = new List<MarketplaceData>();
        
        while (await reader.ReadAsync())
        {
            marketplaces.Add(new MarketplaceData
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                Marketplace = reader.IsDBNull(reader.GetOrdinal("Marketplace")) ? "" : reader.GetString(reader.GetOrdinal("Marketplace")),
                Status = reader.IsDBNull(reader.GetOrdinal("Status")) ? "" : reader.GetString(reader.GetOrdinal("Status"))
            });
        }
        
        response.Success = true;
        response.Message = "Marketplaces retrieved successfully";
        response.Marketplaces = marketplaces;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetAllMarketplaces")
.WithOpenApi();

// Create new marketplace
app.MapPost("/api/marketplace", async (MarketplaceRequest request, SqlConnection connection) =>
{
    var response = new MarketplaceResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Marketplace))
        {
            response.Success = false;
            response.Message = "Marketplace name is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Marketplace", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Marketplace", request.Marketplace);
        command.Parameters.AddWithValue("@id", DBNull.Value);
        command.Parameters.AddWithValue("@Status", request.Status ?? "Active");
        command.Parameters.AddWithValue("@Query", 1); // Query = 1 for Insert
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Marketplace created successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("CreateMarketplace")
.WithOpenApi();

// Update marketplace
app.MapPut("/api/marketplace/{id}", async (int id, MarketplaceRequest request, SqlConnection connection) =>
{
    var response = new MarketplaceResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Marketplace))
        {
            response.Success = false;
            response.Message = "Marketplace name is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Marketplace", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Marketplace", request.Marketplace);
        command.Parameters.AddWithValue("@id", id);
        command.Parameters.AddWithValue("@Status", request.Status ?? "Active");
        command.Parameters.AddWithValue("@Query", 2); // Query = 2 for Update
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Marketplace updated successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("UpdateMarketplace")
.WithOpenApi();

// Delete marketplace
app.MapDelete("/api/marketplace/{id}", async (int id, SqlConnection connection) =>
{
    var response = new MarketplaceResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Marketplace", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Marketplace", DBNull.Value);
        command.Parameters.AddWithValue("@id", id);
        command.Parameters.AddWithValue("@Status", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 4); // Query = 4 for Delete
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Marketplace deleted successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("DeleteMarketplace")
.WithOpenApi();

// Search marketplaces
app.MapGet("/api/marketplace/search", async (string term, SqlConnection connection) =>
{
    var response = new MarketplaceResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Marketplace", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Marketplace", term);
        command.Parameters.AddWithValue("@id", DBNull.Value);
        command.Parameters.AddWithValue("@Status", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 5); // Query = 5 for Search
        
        using var reader = await command.ExecuteReaderAsync();
        var marketplaces = new List<MarketplaceData>();
        
        while (await reader.ReadAsync())
        {
            marketplaces.Add(new MarketplaceData
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                Marketplace = reader.IsDBNull(reader.GetOrdinal("Marketplace")) ? "" : reader.GetString(reader.GetOrdinal("Marketplace")),
                Status = reader.IsDBNull(reader.GetOrdinal("Status")) ? "" : reader.GetString(reader.GetOrdinal("Status"))
            });
        }
        
        response.Success = true;
        response.Message = "Marketplaces retrieved successfully";
        response.Marketplaces = marketplaces;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("SearchMarketplaces")
.WithOpenApi();

// Catalog Management Endpoints

// Get all catalogs
app.MapGet("/api/catalog", async (int? query, SqlConnection connection) =>
{
    var response = new CatalogResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Catelog", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Catelogname", DBNull.Value);
        command.Parameters.AddWithValue("@Id", DBNull.Value);
        command.Parameters.AddWithValue("@Isdelete", 0);
        command.Parameters.AddWithValue("@Status", DBNull.Value);
        command.Parameters.AddWithValue("@Query", query ?? 3); // Query = 3 for Select All
        
        using var reader = await command.ExecuteReaderAsync();
        var catalogs = new List<CatalogData>();
        
        while (await reader.ReadAsync())
        {
            catalogs.Add(new CatalogData
            {
                Id = reader.GetInt32(reader.GetOrdinal("Id")),
                Catelogname = reader.IsDBNull(reader.GetOrdinal("Catelogname")) ? "" : reader.GetString(reader.GetOrdinal("Catelogname")),
                Isdelete = reader.IsDBNull(reader.GetOrdinal("Isdelete")) ? 0 : reader.GetInt32(reader.GetOrdinal("Isdelete")),
                Status = reader.IsDBNull(reader.GetOrdinal("Status")) ? "" : reader.GetString(reader.GetOrdinal("Status"))
            });
        }
        
        response.Success = true;
        response.Message = "Catalogs retrieved successfully";
        response.Catalogs = catalogs;
        response.Data = catalogs; // Also set Data for compatibility
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetAllCatalogs")
.WithOpenApi();

// Task Category Endpoints

// Get categories by registration ID (matched with CatalogId)
app.MapGet("/api/task-category/{registrationId}", async (string registrationId, SqlConnection connection) =>
{
    var response = new TaskCategoryResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_TaskCategory", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@RegistrationId", registrationId);
        command.Parameters.AddWithValue("@Query", 1); // Query = 1 for Select by User Catalog
        
        using var reader = await command.ExecuteReaderAsync();
        var categories = new List<TaskCategoryData>();
        
        while (await reader.ReadAsync())
        {
            categories.Add(new TaskCategoryData
            {
                Id = reader.GetInt32(reader.GetOrdinal("Id")),
                Category = reader.IsDBNull(reader.GetOrdinal("Category")) ? "" : reader.GetString(reader.GetOrdinal("Category")),
                Catelogid = reader.IsDBNull(reader.GetOrdinal("Catelogid")) ? "" : reader.GetValue(reader.GetOrdinal("Catelogid")).ToString()
            });
        }
        
        response.Success = true;
        response.Message = "Task categories retrieved successfully";
        response.Data = categories;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetTaskCategories")
.WithOpenApi();

// User Registration Endpoints

// Get users filtered by Catalog ID
app.MapGet("/api/user-registration", async (string? catelogId, SqlConnection connection) =>
{
    var response = new UserRegistrationResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_UserRegistration", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Catelogid", string.IsNullOrEmpty(catelogId) ? DBNull.Value : catelogId);
        command.Parameters.AddWithValue("@Query", 3); // Query = 3 for Select filtered by Catalog
        
        using var reader = await command.ExecuteReaderAsync();
        var users = new List<RegistrationUserData>();
        
        while (await reader.ReadAsync())
        {
            users.Add(new RegistrationUserData
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                Userid = reader.IsDBNull(reader.GetOrdinal("Userid")) ? "" : reader.GetString(reader.GetOrdinal("Userid")),
                Firstname = reader.IsDBNull(reader.GetOrdinal("Firstname")) ? "" : reader.GetString(reader.GetOrdinal("Firstname")),
                Lastname = reader.IsDBNull(reader.GetOrdinal("Lastname")) ? "" : reader.GetString(reader.GetOrdinal("Lastname")),
                Email = reader.IsDBNull(reader.GetOrdinal("Email")) ? "" : reader.GetString(reader.GetOrdinal("Email")),
                Phone = reader.IsDBNull(reader.GetOrdinal("Phone")) ? "" : reader.GetString(reader.GetOrdinal("Phone")),
                Role = reader.IsDBNull(reader.GetOrdinal("Role")) ? "" : reader.GetString(reader.GetOrdinal("Role")),
                Catelogid = reader.IsDBNull(reader.GetOrdinal("Catelogid")) ? "" : reader.GetValue(reader.GetOrdinal("Catelogid")).ToString(),
                Status = reader.IsDBNull(reader.GetOrdinal("Status")) ? "" : reader.GetString(reader.GetOrdinal("Status")),
                Warehouseid = reader.IsDBNull(reader.GetOrdinal("Warehouseid")) ? "" : reader.GetString(reader.GetOrdinal("Warehouseid"))
            });
        }
        
        response.Success = true;
        response.Message = "Users retrieved successfully";
        response.Users = users;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetUserRegistrations")
.WithOpenApi();

// Create new catalog
app.MapPost("/api/catalog", async (CatalogRequest request, SqlConnection connection) =>
{
    var response = new CatalogResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Catelogname))
        {
            response.Success = false;
            response.Message = "Catalog name is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Catelog", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Catelogname", request.Catelogname);
        command.Parameters.AddWithValue("@Id", DBNull.Value);
        command.Parameters.AddWithValue("@Isdelete", request.Isdelete);
        command.Parameters.AddWithValue("@Status", request.Status ?? "Active");
        command.Parameters.AddWithValue("@Query", request.Query > 0 ? request.Query : 1); // Query = 1 for Insert
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Catalog created successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("CreateCatalog")
.WithOpenApi();

// Update catalog
app.MapPut("/api/catalog/{id}", async (int id, CatalogRequest request, SqlConnection connection) =>
{
    var response = new CatalogResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Catelogname))
        {
            response.Success = false;
            response.Message = "Catalog name is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Catelog", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Catelogname", request.Catelogname);
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Isdelete", request.Isdelete);
        command.Parameters.AddWithValue("@Status", request.Status ?? "Active");
        command.Parameters.AddWithValue("@Query", request.Query > 0 ? request.Query : 2); // Query = 2 for Update
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Catalog updated successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("UpdateCatalog")
.WithOpenApi();

// Delete catalog
app.MapDelete("/api/catalog/{id}", async (int id, SqlConnection connection) =>
{
    var response = new CatalogResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Catelog", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Catelogname", DBNull.Value);
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Isdelete", 0);
        command.Parameters.AddWithValue("@Status", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 4); // Query = 4 for Delete
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Catalog deleted successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("DeleteCatalog")
.WithOpenApi();

// Stock Location Management Endpoints

// Get all stock locations
app.MapGet("/api/stocklocation", async (string? isdelete, string? status, SqlConnection connection) =>
{
    var response = new StockLocationResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Stocklocation", connection);
        command.CommandType = CommandType.StoredProcedure;
        command.Parameters.AddWithValue("@Query", 3);
        command.Parameters.AddWithValue("@Isdelete", isdelete ?? "0");
        command.Parameters.AddWithValue("@Status", status ?? "Active");

        using var reader = await command.ExecuteReaderAsync();
        var stockLocations = new List<StockLocationData>();
        
        while (await reader.ReadAsync())
        {
            try
            {
                var location = new StockLocationData
                {
                    Id = reader.GetInt32(reader.GetOrdinal("Id")),
                    Warehouseid = reader.IsDBNull(reader.GetOrdinal("Warehouseid")) ? null : reader.GetString(reader.GetOrdinal("Warehouseid")),
                    Name = reader.IsDBNull(reader.GetOrdinal("Name")) ? null : reader.GetString(reader.GetOrdinal("Name")),
                    Type = reader.IsDBNull(reader.GetOrdinal("Type")) ? null : reader.GetString(reader.GetOrdinal("Type")),
                    Parentstockid = reader.IsDBNull(reader.GetOrdinal("Parentstockid")) ? null : reader.GetString(reader.GetOrdinal("Parentstockid")),
                    Locationaddress = reader.IsDBNull(reader.GetOrdinal("Locationaddress")) ? null : reader.GetString(reader.GetOrdinal("Locationaddress")),
                    Isdefault = reader.IsDBNull(reader.GetOrdinal("Isdefault")) ? null : reader.GetString(reader.GetOrdinal("Isdefault")),
                    Isdelete = reader.IsDBNull(reader.GetOrdinal("Isdelete")) ? null : reader.GetString(reader.GetOrdinal("Isdelete")),
                    Status = reader.IsDBNull(reader.GetOrdinal("Status")) ? null : reader.GetString(reader.GetOrdinal("Status")),
                    Isdispatch = reader.IsDBNull(reader.GetOrdinal("Isdispatch")) ? null : reader.GetString(reader.GetOrdinal("Isdispatch"))
                };
                stockLocations.Add(location);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error mapping row: {ex.Message}");
            }
        }
        
        response.Success = true;
        response.Message = $"Stock locations retrieved successfully. Found {stockLocations.Count} locations.";
        response.StockLocations = stockLocations;
        response.Data = stockLocations;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetAllStockLocations")
.WithOpenApi();

// Create new stock location
app.MapPost("/api/stocklocation", async (StockLocationRequest request, SqlConnection connection) =>
{
    var response = new StockLocationResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            response.Success = false;
            response.Message = "Stock location name is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Stocklocation", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Id", DBNull.Value);
        command.Parameters.AddWithValue("@Warehouseid", (object)request.Warehouseid ?? DBNull.Value);
        command.Parameters.AddWithValue("@Name", request.Name);
        command.Parameters.AddWithValue("@Type", (object)request.Type ?? DBNull.Value);
        command.Parameters.AddWithValue("@Parentstockid", (object)request.Parentstockid ?? DBNull.Value);
        command.Parameters.AddWithValue("@Locationaddress", (object)request.Locationaddress ?? DBNull.Value);
        command.Parameters.AddWithValue("@Isdefault", (object)request.Isdefault ?? "0");
        command.Parameters.AddWithValue("@Isdelete", (object)request.Isdelete ?? "0");
        command.Parameters.AddWithValue("@Status", (object)request.Status ?? "Active");
        command.Parameters.AddWithValue("@fromid", DBNull.Value);
        command.Parameters.AddWithValue("@toid", DBNull.Value);
        command.Parameters.AddWithValue("@Isdispatch", (object)request.Isdispatch ?? "0");
        command.Parameters.AddWithValue("@Query", request.Query > 0 ? request.Query : 1); // Query = 1 for Insert
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Stock location created successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("CreateStockLocation")
.WithOpenApi();

// Update stock location
app.MapPut("/api/stocklocation/{id}", async (int id, StockLocationRequest request, SqlConnection connection) =>
{
    var response = new StockLocationResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            response.Success = false;
            response.Message = "Stock location name is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Stocklocation", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Warehouseid", (object)request.Warehouseid ?? DBNull.Value);
        command.Parameters.AddWithValue("@Name", request.Name);
        command.Parameters.AddWithValue("@Type", (object)request.Type ?? DBNull.Value);
        command.Parameters.AddWithValue("@Parentstockid", (object)request.Parentstockid ?? DBNull.Value);
        command.Parameters.AddWithValue("@Locationaddress", (object)request.Locationaddress ?? DBNull.Value);
        command.Parameters.AddWithValue("@Isdefault", (object)request.Isdefault ?? "0");
        command.Parameters.AddWithValue("@Isdelete", (object)request.Isdelete ?? "0");
        command.Parameters.AddWithValue("@Status", (object)request.Status ?? "Active");
        command.Parameters.AddWithValue("@fromid", DBNull.Value);
        command.Parameters.AddWithValue("@toid", DBNull.Value);
        command.Parameters.AddWithValue("@Isdispatch", (object)request.Isdispatch ?? "0");
        command.Parameters.AddWithValue("@Query", request.Query > 0 ? request.Query : 2); // Query = 2 for Update
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Stock location updated successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("UpdateStockLocation")
.WithOpenApi();

// Delete stock location (soft delete by updating Isdelete)
app.MapDelete("/api/stocklocation/{id}", async (int id, SqlConnection connection) =>
{
    var response = new StockLocationResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Stocklocation", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        // First get the current record to preserve other fields
        using var getCommand = new SqlCommand("SELECT * FROM Tbl_Stocklocation WHERE Id = @Id", connection);
        getCommand.Parameters.AddWithValue("@Id", id);
        using var reader = await getCommand.ExecuteReaderAsync();
        
        if (!reader.HasRows)
        {
            response.Success = false;
            response.Message = "Stock location not found";
            return Results.Json(response, statusCode: 404);
        }
        
        await reader.ReadAsync();
        var name = reader.IsDBNull(reader.GetOrdinal("Name")) ? "" : reader.GetString(reader.GetOrdinal("Name"));
        var warehouseid = reader.IsDBNull(reader.GetOrdinal("Warehouseid")) ? null : reader.GetString(reader.GetOrdinal("Warehouseid"));
        var type = reader.IsDBNull(reader.GetOrdinal("Type")) ? null : reader.GetString(reader.GetOrdinal("Type"));
        var parentstockid = reader.IsDBNull(reader.GetOrdinal("Parentstockid")) ? null : reader.GetString(reader.GetOrdinal("Parentstockid"));
        var locationaddress = reader.IsDBNull(reader.GetOrdinal("Locationaddress")) ? null : reader.GetString(reader.GetOrdinal("Locationaddress"));
        var isdefault = reader.IsDBNull(reader.GetOrdinal("Isdefault")) ? null : reader.GetString(reader.GetOrdinal("Isdefault"));
        var status = reader.IsDBNull(reader.GetOrdinal("Status")) ? null : reader.GetString(reader.GetOrdinal("Status"));
        var isdispatch = reader.IsDBNull(reader.GetOrdinal("Isdispatch")) ? null : reader.GetString(reader.GetOrdinal("Isdispatch"));
        
        reader.Close();
        
        // Update with Isdelete = "1"
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Warehouseid", (object)warehouseid ?? DBNull.Value);
        command.Parameters.AddWithValue("@Name", name);
        command.Parameters.AddWithValue("@Type", (object)type ?? DBNull.Value);
        command.Parameters.AddWithValue("@Parentstockid", (object)parentstockid ?? DBNull.Value);
        command.Parameters.AddWithValue("@Locationaddress", (object)locationaddress ?? DBNull.Value);
        command.Parameters.AddWithValue("@Isdefault", (object)isdefault ?? "0");
        command.Parameters.AddWithValue("@Isdelete", "1"); // Set to deleted
        command.Parameters.AddWithValue("@Status", (object)status ?? "Active");
        command.Parameters.AddWithValue("@fromid", DBNull.Value);
        command.Parameters.AddWithValue("@toid", DBNull.Value);
        command.Parameters.AddWithValue("@Isdispatch", (object)isdispatch ?? "0");
        command.Parameters.AddWithValue("@Query", 2); // Query = 2 for Update
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Stock location deleted successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("DeleteStockLocation")
.WithOpenApi();

// Bill Format Management Endpoints

// Get all bill formats
app.MapGet("/api/billformat", async (string? isdelete, string? status, string? type, SqlConnection connection) =>
{
    var response = new BillFormatResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_billformat", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Id", DBNull.Value);
        command.Parameters.AddWithValue("@Type", (object)type ?? DBNull.Value);
        command.Parameters.AddWithValue("@Format", DBNull.Value);
        command.Parameters.AddWithValue("@Isdelete", (object)isdelete ?? "0");
        command.Parameters.AddWithValue("@Status", (object)status ?? DBNull.Value);
        
        int query = 4; // Default to Query = 4 for Select All
        if (!string.IsNullOrEmpty(type))
        {
            query = 5; // Query = 5 for Select Format by Type
        }
        command.Parameters.AddWithValue("@Query", query);
        
        if (query == 5)
        {
            // For Query = 5, we get only Format string
            using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                response.Format = reader.IsDBNull(reader.GetOrdinal("Format")) ? null : reader.GetString(reader.GetOrdinal("Format"));
                response.Success = true;
                response.Message = "Bill format retrieved successfully";
            }
            else
            {
                response.Success = false;
                response.Message = "Bill format not found";
            }
        }
        else
        {
            // For Query = 4, we get all records
            using var reader = await command.ExecuteReaderAsync();
            var billFormats = new List<BillFormatData>();
            
            while (await reader.ReadAsync())
            {
                billFormats.Add(new BillFormatData
                {
                    Id = reader.GetInt32(reader.GetOrdinal("Id")),
                    Type = reader.IsDBNull(reader.GetOrdinal("Type")) ? null : reader.GetString(reader.GetOrdinal("Type")),
                    Format = reader.IsDBNull(reader.GetOrdinal("Format")) ? null : reader.GetString(reader.GetOrdinal("Format")),
                    Isdelete = reader.IsDBNull(reader.GetOrdinal("Isdelete")) ? null : reader.GetString(reader.GetOrdinal("Isdelete")),
                    Status = reader.IsDBNull(reader.GetOrdinal("Status")) ? null : reader.GetString(reader.GetOrdinal("Status"))
                });
            }
            
            response.Success = true;
            response.Message = "Bill formats retrieved successfully";
            response.BillFormats = billFormats;
            response.Data = billFormats; // Also set Data for compatibility
        }
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetAllBillFormats")
.WithOpenApi();

// Create new bill format
app.MapPost("/api/billformat", async (BillFormatRequest request, SqlConnection connection) =>
{
    var response = new BillFormatResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Type))
        {
            response.Success = false;
            response.Message = "Type is required";
            return Results.Json(response, statusCode: 400);
        }
        
        if (string.IsNullOrWhiteSpace(request.Format))
        {
            response.Success = false;
            response.Message = "Format is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_billformat", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Id", DBNull.Value);
        command.Parameters.AddWithValue("@Type", request.Type);
        command.Parameters.AddWithValue("@Format", request.Format);
        command.Parameters.AddWithValue("@Isdelete", (object)request.Isdelete ?? "0");
        command.Parameters.AddWithValue("@Status", (object)request.Status ?? "Active");
        command.Parameters.AddWithValue("@Query", request.Query > 0 ? request.Query : 1); // Query = 1 for Insert
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Bill format created successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("CreateBillFormat")
.WithOpenApi();

// Update bill format
app.MapPut("/api/billformat/{id}", async (int id, BillFormatRequest request, SqlConnection connection) =>
{
    var response = new BillFormatResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Type))
        {
            response.Success = false;
            response.Message = "Type is required";
            return Results.Json(response, statusCode: 400);
        }
        
        if (string.IsNullOrWhiteSpace(request.Format))
        {
            response.Success = false;
            response.Message = "Format is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_billformat", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Type", request.Type);
        command.Parameters.AddWithValue("@Format", request.Format);
        command.Parameters.AddWithValue("@Isdelete", (object)request.Isdelete ?? "0");
        command.Parameters.AddWithValue("@Status", (object)request.Status ?? "Active");
        command.Parameters.AddWithValue("@Query", request.Query > 0 ? request.Query : 2); // Query = 2 for Update
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Bill format updated successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("UpdateBillFormat")
.WithOpenApi();

// Delete bill format (soft delete by updating Isdelete)
app.MapDelete("/api/billformat/{id}", async (int id, SqlConnection connection) =>
{
    var response = new BillFormatResponse();
    
    try
    {
        await connection.OpenAsync();
        
        // First get the current record to preserve other fields
        using var getCommand = new SqlCommand("SELECT * FROM Tbl_Billformat WHERE Id = @Id", connection);
        getCommand.Parameters.AddWithValue("@Id", id);
        using var reader = await getCommand.ExecuteReaderAsync();
        
        if (!reader.HasRows)
        {
            response.Success = false;
            response.Message = "Bill format not found";
            return Results.Json(response, statusCode: 404);
        }
        
        await reader.ReadAsync();
        var type = reader.IsDBNull(reader.GetOrdinal("Type")) ? "" : reader.GetString(reader.GetOrdinal("Type"));
        var format = reader.IsDBNull(reader.GetOrdinal("Format")) ? "" : reader.GetString(reader.GetOrdinal("Format"));
        var status = reader.IsDBNull(reader.GetOrdinal("Status")) ? null : reader.GetString(reader.GetOrdinal("Status"));
        
        reader.Close();
        
        // Update with Isdelete = "1" using Query = 3
        using var command = new SqlCommand("Sp_billformat", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Type", type);
        command.Parameters.AddWithValue("@Format", format);
        command.Parameters.AddWithValue("@Isdelete", "1"); // Set to deleted
        command.Parameters.AddWithValue("@Status", (object)status ?? "Active");
        command.Parameters.AddWithValue("@Query", 3); // Query = 3 for Update Isdelete only
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Bill format deleted successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("DeleteBillFormat")
.WithOpenApi();

// Decimal Format Management Endpoints

// Get all decimal formats
app.MapGet("/api/decimalformat", async (string? isdelete, string? status, SqlConnection connection) =>
{
    var response = new DecimalFormatResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Decimalformat", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Id", DBNull.Value);
        command.Parameters.AddWithValue("@Decimalformat", DBNull.Value);
        command.Parameters.AddWithValue("@Decimalcount", DBNull.Value);
        command.Parameters.AddWithValue("@Isdelete", (object)isdelete ?? "0");
        command.Parameters.AddWithValue("@Status", (object)status ?? DBNull.Value);
        command.Parameters.AddWithValue("@Query", 4); // Query = 4 for Select All
        
        using var reader = await command.ExecuteReaderAsync();
        var decimalFormats = new List<DecimalFormatData>();
        
        while (await reader.ReadAsync())
        {
            decimalFormats.Add(new DecimalFormatData
            {
                Id = reader.GetInt32(reader.GetOrdinal("Id")),
                Decimalformat = reader.IsDBNull(reader.GetOrdinal("Decimalformat")) ? null : reader.GetString(reader.GetOrdinal("Decimalformat")),
                Decimalcount = reader.IsDBNull(reader.GetOrdinal("Decimalcount")) ? null : reader.GetInt32(reader.GetOrdinal("Decimalcount")),
                Isdelete = reader.IsDBNull(reader.GetOrdinal("Isdelete")) ? null : reader.GetString(reader.GetOrdinal("Isdelete")),
                Status = reader.IsDBNull(reader.GetOrdinal("Status")) ? null : reader.GetString(reader.GetOrdinal("Status"))
            });
        }
        
        response.Success = true;
        response.Message = "Decimal formats retrieved successfully";
        response.DecimalFormats = decimalFormats;
        response.Data = decimalFormats; // Also set Data for compatibility
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetAllDecimalFormats")
.WithOpenApi();

// Create new decimal format
app.MapPost("/api/decimalformat", async (DecimalFormatRequest request, SqlConnection connection) =>
{
    var response = new DecimalFormatResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Decimalformat))
        {
            response.Success = false;
            response.Message = "Decimal format is required";
            return Results.Json(response, statusCode: 400);
        }
        
        if (request.Decimalcount == null)
        {
            response.Success = false;
            response.Message = "Decimal count is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Decimalformat", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Id", DBNull.Value);
        command.Parameters.AddWithValue("@Decimalformat", request.Decimalformat);
        command.Parameters.AddWithValue("@Decimalcount", request.Decimalcount);
        command.Parameters.AddWithValue("@Isdelete", (object)request.Isdelete ?? "0");
        command.Parameters.AddWithValue("@Status", (object)request.Status ?? "Active");
        command.Parameters.AddWithValue("@Query", request.Query > 0 ? request.Query : 1); // Query = 1 for Insert
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Decimal format created successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("CreateDecimalFormat")
.WithOpenApi();

// Update decimal format
app.MapPut("/api/decimalformat/{id}", async (int id, DecimalFormatRequest request, SqlConnection connection) =>
{
    var response = new DecimalFormatResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Decimalformat))
        {
            response.Success = false;
            response.Message = "Decimal format is required";
            return Results.Json(response, statusCode: 400);
        }
        
        if (request.Decimalcount == null)
        {
            response.Success = false;
            response.Message = "Decimal count is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Decimalformat", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Decimalformat", request.Decimalformat);
        command.Parameters.AddWithValue("@Decimalcount", request.Decimalcount);
        command.Parameters.AddWithValue("@Isdelete", (object)request.Isdelete ?? "0");
        command.Parameters.AddWithValue("@Status", (object)request.Status ?? "Active");
        command.Parameters.AddWithValue("@Query", request.Query > 0 ? request.Query : 2); // Query = 2 for Update
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Decimal format updated successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("UpdateDecimalFormat")
.WithOpenApi();

// Delete decimal format (soft delete by updating Isdelete)
app.MapDelete("/api/decimalformat/{id}", async (int id, SqlConnection connection) =>
{
    var response = new DecimalFormatResponse();
    
    try
    {
        await connection.OpenAsync();
        
        // First get the current record to preserve other fields
        using var getCommand = new SqlCommand("SELECT * FROM Tbl_Decimalformat WHERE Id = @Id", connection);
        getCommand.Parameters.AddWithValue("@Id", id);
        using var reader = await getCommand.ExecuteReaderAsync();
        
        if (!reader.HasRows)
        {
            response.Success = false;
            response.Message = "Decimal format not found";
            return Results.Json(response, statusCode: 404);
        }
        
        await reader.ReadAsync();
        var decimalformat = reader.IsDBNull(reader.GetOrdinal("Decimalformat")) ? "" : reader.GetString(reader.GetOrdinal("Decimalformat"));
        var decimalcount = reader.IsDBNull(reader.GetOrdinal("Decimalcount")) ? 0 : reader.GetInt32(reader.GetOrdinal("Decimalcount"));
        var status = reader.IsDBNull(reader.GetOrdinal("Status")) ? null : reader.GetString(reader.GetOrdinal("Status"));
        
        reader.Close();
        
        // Update with Isdelete = "1" using Query = 3
        using var command = new SqlCommand("Sp_Decimalformat", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Decimalformat", decimalformat);
        command.Parameters.AddWithValue("@Decimalcount", decimalcount);
        command.Parameters.AddWithValue("@Isdelete", "1"); // Set to deleted
        command.Parameters.AddWithValue("@Status", (object)status ?? "Active");
        command.Parameters.AddWithValue("@Query", 3); // Query = 3 for Update Isdelete only
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Decimal format deleted successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("DeleteDecimalFormat")
.WithOpenApi();

// Payment Terms Management Endpoints

// Get all payment terms
app.MapGet("/api/paymentterms", async (string? isdelete, SqlConnection connection) =>
{
    var response = new PaymentTermsResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Paymentterms", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Id", DBNull.Value);
        command.Parameters.AddWithValue("@Paymentterms", DBNull.Value);
        command.Parameters.AddWithValue("@Isdelete", (object)isdelete ?? "0");
        command.Parameters.AddWithValue("@Query", 4); // Query = 4 for Select All
        
        using var reader = await command.ExecuteReaderAsync();
        var paymentTerms = new List<PaymentTermsData>();
        
        while (await reader.ReadAsync())
        {
            paymentTerms.Add(new PaymentTermsData
            {
                Id = reader.GetInt32(reader.GetOrdinal("Id")),
                Paymentterms = reader.IsDBNull(reader.GetOrdinal("Paymentterms")) ? null : reader.GetString(reader.GetOrdinal("Paymentterms")),
                Isdelete = reader.IsDBNull(reader.GetOrdinal("Isdelete")) ? null : reader.GetString(reader.GetOrdinal("Isdelete"))
            });
        }
        
        response.Success = true;
        response.Message = "Payment terms retrieved successfully";
        response.PaymentTerms = paymentTerms;
        response.Data = paymentTerms; // Also set Data for compatibility
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetAllPaymentTerms")
.WithOpenApi();

// Create new payment term
app.MapPost("/api/paymentterms", async (PaymentTermsRequest request, SqlConnection connection) =>
{
    var response = new PaymentTermsResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Paymentterms))
        {
            response.Success = false;
            response.Message = "Payment terms is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Paymentterms", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Id", DBNull.Value);
        command.Parameters.AddWithValue("@Paymentterms", request.Paymentterms);
        command.Parameters.AddWithValue("@Isdelete", (object)request.Isdelete ?? "0");
        command.Parameters.AddWithValue("@Query", request.Query > 0 ? request.Query : 1); // Query = 1 for Insert
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Payment term created successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("CreatePaymentTerms")
.WithOpenApi();

// Update payment term
app.MapPut("/api/paymentterms/{id}", async (int id, PaymentTermsRequest request, SqlConnection connection) =>
{
    var response = new PaymentTermsResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Paymentterms))
        {
            response.Success = false;
            response.Message = "Payment terms is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Paymentterms", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Paymentterms", request.Paymentterms);
        command.Parameters.AddWithValue("@Isdelete", (object)request.Isdelete ?? "0");
        command.Parameters.AddWithValue("@Query", request.Query > 0 ? request.Query : 2); // Query = 2 for Update
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Payment term updated successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("UpdatePaymentTerms")
.WithOpenApi();

// Delete payment term (soft delete by updating Isdelete)
app.MapDelete("/api/paymentterms/{id}", async (int id, SqlConnection connection) =>
{
    var response = new PaymentTermsResponse();
    
    try
    {
        await connection.OpenAsync();
        
        // First get the current record to preserve Paymentterms field
        using var getCommand = new SqlCommand("SELECT * FROM Tbl_Paymentterms WHERE Id = @Id", connection);
        getCommand.Parameters.AddWithValue("@Id", id);
        using var reader = await getCommand.ExecuteReaderAsync();
        
        if (!reader.HasRows)
        {
            response.Success = false;
            response.Message = "Payment term not found";
            return Results.Json(response, statusCode: 404);
        }
        
        await reader.ReadAsync();
        var paymentterms = reader.IsDBNull(reader.GetOrdinal("Paymentterms")) ? "" : reader.GetString(reader.GetOrdinal("Paymentterms"));
        
        reader.Close();
        
        // Update with Isdelete = "1" using Query = 3
        using var command = new SqlCommand("Sp_Paymentterms", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Paymentterms", paymentterms);
        command.Parameters.AddWithValue("@Isdelete", "1"); // Set to deleted
        command.Parameters.AddWithValue("@Query", 3); // Query = 3 for Update Isdelete only
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Payment term deleted successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("DeletePaymentTerms")
.WithOpenApi();

// Currency and VAT Endpoints have been moved to their respective Controllers to support Inline SQL and resolve Stored Procedure issues.

// Stock Check Management Endpoints

// Get all stock checks (Query = 3: Select All Active)
app.MapGet("/api/stockcheck", async (SqlConnection connection) =>
{
    var response = new StockCheckResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Stockcheck", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        // For Query = 3 (Select All Active), pass required parameters
        command.Parameters.AddWithValue("@Catelogid", DBNull.Value);
        command.Parameters.AddWithValue("@Id", DBNull.Value);
        command.Parameters.AddWithValue("@Status", DBNull.Value);
        command.Parameters.AddWithValue("@Isdelete", 0); // Only active records (Isdelete = 0)
        command.Parameters.AddWithValue("@Query", 3); // Query = 3 for Select All Active
        
        using var reader = await command.ExecuteReaderAsync();
        var stockChecks = new List<StockCheckData>();
        
        while (await reader.ReadAsync())
        {
            stockChecks.Add(new StockCheckData
            {
                Id = reader.GetInt32(reader.GetOrdinal("Id")),
                Catelogid = reader.IsDBNull(reader.GetOrdinal("Catelogid")) ? null : reader.GetInt32(reader.GetOrdinal("Catelogid")),
                Status = reader.IsDBNull(reader.GetOrdinal("Status")) ? null : reader.GetInt32(reader.GetOrdinal("Status")),
                Isdelete = reader.IsDBNull(reader.GetOrdinal("Isdelete")) ? null : reader.GetInt32(reader.GetOrdinal("Isdelete"))
            });
        }
        
        response.Success = true;
        response.Message = "Stock checks retrieved successfully";
        response.StockChecks = stockChecks;
        response.Data = stockChecks; // Also set Data for compatibility
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetAllStockChecks")
.WithOpenApi();

// Create new stock check (Query = 1: Insert)
app.MapPost("/api/stockcheck", async (StockCheckRequest request, SqlConnection connection) =>
{
    var response = new StockCheckResponse();
    
    try
    {
        if (request.Catelogid == null)
        {
            response.Success = false;
            response.Message = "Catalog ID is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Stockcheck", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        // For Query = 1 (Insert), pass required parameters
        command.Parameters.AddWithValue("@Catelogid", request.Catelogid);
        command.Parameters.AddWithValue("@Id", DBNull.Value);
        command.Parameters.AddWithValue("@Status", (object)request.Status ?? 1); // Default to 1 (Active)
        command.Parameters.AddWithValue("@Isdelete", (object)request.Isdelete ?? 0); // Default to 0 (Not deleted)
        command.Parameters.AddWithValue("@Query", request.Query > 0 ? request.Query : 1); // Query = 1 for Insert
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Stock check created successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("CreateStockCheck")
.WithOpenApi();

// Update stock check (Query = 2: Update)
app.MapPut("/api/stockcheck/{id}", async (int id, StockCheckRequest request, SqlConnection connection) =>
{
    var response = new StockCheckResponse();
    
    try
    {
        if (request.Catelogid == null)
        {
            response.Success = false;
            response.Message = "Catalog ID is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Stockcheck", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        // For Query = 2 (Update), pass required parameters
        command.Parameters.AddWithValue("@Catelogid", request.Catelogid);
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Status", (object)request.Status ?? 1); // Default to 1 (Active)
        command.Parameters.AddWithValue("@Isdelete", (object)request.Isdelete ?? 0); // Default to 0 (Not deleted)
        command.Parameters.AddWithValue("@Query", request.Query > 0 ? request.Query : 2); // Query = 2 for Update
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Stock check updated successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("UpdateStockCheck")
.WithOpenApi();

// Delete stock check (Query = 4: Delete)
app.MapDelete("/api/stockcheck/{id}", async (int id, SqlConnection connection) =>
{
    var response = new StockCheckResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Stockcheck", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        // For Query = 4 (Delete), pass required parameters
        command.Parameters.AddWithValue("@Catelogid", DBNull.Value);
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Status", DBNull.Value);
        command.Parameters.AddWithValue("@Isdelete", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 4); // Query = 4 for Delete
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Stock check deleted successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("DeleteStockCheck")
.WithOpenApi();

// Bank Account Management Endpoints

// Get all bank accounts (Query = 3: Select All)
app.MapGet("/api/bankaccount", async (string? isdelete, SqlConnection connection) =>
{
    var response = new BankAccountResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Bankaccount", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        // For Query = 3 (Select All), pass required parameters
        command.Parameters.AddWithValue("@Id", DBNull.Value);
        command.Parameters.AddWithValue("@Accountname", DBNull.Value);
        command.Parameters.AddWithValue("@Account_number", DBNull.Value);
        command.Parameters.AddWithValue("@IBAN", DBNull.Value);
        command.Parameters.AddWithValue("@Bankname", DBNull.Value);
        command.Parameters.AddWithValue("@Swift_code", DBNull.Value);
        command.Parameters.AddWithValue("@Isdelete", (object)isdelete ?? "0");
        command.Parameters.AddWithValue("@Ca_id", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 3); // Query = 3 for Select All
        
        using var reader = await command.ExecuteReaderAsync();
        var bankAccounts = new List<BankAccountData>();
        
        while (await reader.ReadAsync())
        {
            bankAccounts.Add(new BankAccountData
            {
                Id = reader.GetInt32(reader.GetOrdinal("Id")),
                Accountname = reader.IsDBNull(reader.GetOrdinal("Accountname")) ? null : reader.GetString(reader.GetOrdinal("Accountname")),
                Account_number = reader.IsDBNull(reader.GetOrdinal("Account_number")) ? null : reader.GetString(reader.GetOrdinal("Account_number")),
                IBAN = reader.IsDBNull(reader.GetOrdinal("IBAN")) ? null : reader.GetString(reader.GetOrdinal("IBAN")),
                Bankname = reader.IsDBNull(reader.GetOrdinal("Bankname")) ? null : reader.GetString(reader.GetOrdinal("Bankname")),
                Swift_code = reader.IsDBNull(reader.GetOrdinal("Swift_code")) ? null : reader.GetString(reader.GetOrdinal("Swift_code")),
                Isdelete = reader.IsDBNull(reader.GetOrdinal("Isdelete")) ? null : reader.GetString(reader.GetOrdinal("Isdelete")),
                Ca_id = reader.IsDBNull(reader.GetOrdinal("Ca_id")) ? null : reader.GetString(reader.GetOrdinal("Ca_id"))
            });
        }
        
        response.Success = true;
        response.Message = "Bank accounts retrieved successfully";
        response.BankAccounts = bankAccounts;
        response.Data = bankAccounts; // Also set Data for compatibility
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetAllBankAccounts")
.WithOpenApi();

// Create new bank account (Query = 1: Insert)
app.MapPost("/api/bankaccount", async (BankAccountRequest request, SqlConnection connection) =>
{
    var response = new BankAccountResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Accountname))
        {
            response.Success = false;
            response.Message = "Account name is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Bankaccount", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        // For Query = 1 (Insert), pass all required parameters
        command.Parameters.AddWithValue("@Id", DBNull.Value);
        command.Parameters.AddWithValue("@Accountname", request.Accountname);
        command.Parameters.AddWithValue("@Account_number", (object)request.Account_number ?? DBNull.Value);
        command.Parameters.AddWithValue("@IBAN", (object)request.IBAN ?? DBNull.Value);
        command.Parameters.AddWithValue("@Bankname", (object)request.Bankname ?? DBNull.Value);
        command.Parameters.AddWithValue("@Swift_code", (object)request.Swift_code ?? DBNull.Value);
        command.Parameters.AddWithValue("@Isdelete", (object)request.Isdelete ?? "0");
        command.Parameters.AddWithValue("@Ca_id", (object)request.Ca_id ?? DBNull.Value);
        command.Parameters.AddWithValue("@Query", request.Query > 0 ? request.Query : 1); // Query = 1 for Insert
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Bank account created successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("CreateBankAccount")
.WithOpenApi();

// Update bank account (Query = 2: Update)
app.MapPut("/api/bankaccount/{id}", async (int id, BankAccountRequest request, SqlConnection connection) =>
{
    var response = new BankAccountResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Accountname))
        {
            response.Success = false;
            response.Message = "Account name is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Bankaccount", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        // For Query = 2 (Update), pass all required parameters
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Accountname", request.Accountname);
        command.Parameters.AddWithValue("@Account_number", (object)request.Account_number ?? DBNull.Value);
        command.Parameters.AddWithValue("@IBAN", (object)request.IBAN ?? DBNull.Value);
        command.Parameters.AddWithValue("@Bankname", (object)request.Bankname ?? DBNull.Value);
        command.Parameters.AddWithValue("@Swift_code", (object)request.Swift_code ?? DBNull.Value);
        command.Parameters.AddWithValue("@Isdelete", (object)request.Isdelete ?? "0");
        command.Parameters.AddWithValue("@Ca_id", (object)request.Ca_id ?? DBNull.Value);
        command.Parameters.AddWithValue("@Query", request.Query > 0 ? request.Query : 2); // Query = 2 for Update
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Bank account updated successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("UpdateBankAccount")
.WithOpenApi();

// Delete bank account (Query = 4: Soft Delete)
app.MapDelete("/api/bankaccount/{id}", async (int id, SqlConnection connection) =>
{
    var response = new BankAccountResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Bankaccount", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        // For Query = 4 (Soft Delete), pass required parameters
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Accountname", DBNull.Value);
        command.Parameters.AddWithValue("@Account_number", DBNull.Value);
        command.Parameters.AddWithValue("@IBAN", DBNull.Value);
        command.Parameters.AddWithValue("@Bankname", DBNull.Value);
        command.Parameters.AddWithValue("@Swift_code", DBNull.Value);
        command.Parameters.AddWithValue("@Isdelete", "1"); // Set to 1 for soft delete
        command.Parameters.AddWithValue("@Ca_id", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 4); // Query = 4 for Soft Delete
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Bank account deleted successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("DeleteBankAccount")
.WithOpenApi();

// Get account number by Ca_id (Query = 5: Select Account_number by Ca_id)
app.MapGet("/api/bankaccount/bycaid/{caid}", async (string caid, SqlConnection connection) =>
{
    var response = new BankAccountResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Bankaccount", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        // For Query = 5 (Select Account_number by Ca_id), pass required parameters
        command.Parameters.AddWithValue("@Id", DBNull.Value);
        command.Parameters.AddWithValue("@Accountname", DBNull.Value);
        command.Parameters.AddWithValue("@Account_number", DBNull.Value);
        command.Parameters.AddWithValue("@IBAN", DBNull.Value);
        command.Parameters.AddWithValue("@Bankname", DBNull.Value);
        command.Parameters.AddWithValue("@Swift_code", DBNull.Value);
        command.Parameters.AddWithValue("@Isdelete", DBNull.Value);
        command.Parameters.AddWithValue("@Ca_id", caid);
        command.Parameters.AddWithValue("@Query", 5); // Query = 5 for Select Account_number by Ca_id
        
        using var reader = await command.ExecuteReaderAsync();
        
        if (await reader.ReadAsync())
        {
            response.Account_number = reader.IsDBNull(reader.GetOrdinal("Account_number")) ? null : reader.GetString(reader.GetOrdinal("Account_number"));
            response.Success = true;
            response.Message = "Account number retrieved successfully";
        }
        else
        {
            response.Success = false;
            response.Message = "Account number not found for the given Ca_id";
        }
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetAccountNumberByCaId")
.WithOpenApi();

// Vehicle Details Management Endpoints

// Get all vehicles (Query = 3: Select All)
app.MapGet("/api/vehicle", async (string? isdelete, SqlConnection connection) =>
{
    var response = new VehicleResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Vehicledetails", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        // For Query = 3 (Select All), pass required parameters
        command.Parameters.AddWithValue("@Id", DBNull.Value);
        command.Parameters.AddWithValue("@Vehiclename", DBNull.Value);
        command.Parameters.AddWithValue("@Vehicleno", DBNull.Value);
        command.Parameters.AddWithValue("@Isdelete", (object)isdelete ?? "0");
        command.Parameters.AddWithValue("@Query", 3); // Query = 3 for Select All
        
        using var reader = await command.ExecuteReaderAsync();
        var vehicles = new List<VehicleData>();
        
        while (await reader.ReadAsync())
        {
            vehicles.Add(new VehicleData
            {
                Id = reader.GetInt32(reader.GetOrdinal("Id")),
                Vehiclename = reader.IsDBNull(reader.GetOrdinal("Vehiclename")) ? null : reader.GetString(reader.GetOrdinal("Vehiclename")),
                Vehicleno = reader.IsDBNull(reader.GetOrdinal("Vehicleno")) ? null : reader.GetString(reader.GetOrdinal("Vehicleno")),
                Isdelete = reader.IsDBNull(reader.GetOrdinal("Isdelete")) ? null : reader.GetString(reader.GetOrdinal("Isdelete"))
            });
        }
        
        response.Success = true;
        response.Message = "Vehicles retrieved successfully";
        response.Vehicles = vehicles;
        response.Data = vehicles; // Also set Data for compatibility
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetAllVehicles")
.WithOpenApi();

// Create new vehicle (Query = 1: Insert)
app.MapPost("/api/vehicle", async (VehicleRequest request, SqlConnection connection) =>
{
    var response = new VehicleResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Vehiclename))
        {
            response.Success = false;
            response.Message = "Vehicle name is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Vehicledetails", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        // For Query = 1 (Insert), pass required parameters
        command.Parameters.AddWithValue("@Id", DBNull.Value);
        command.Parameters.AddWithValue("@Vehiclename", request.Vehiclename);
        command.Parameters.AddWithValue("@Vehicleno", (object)request.Vehicleno ?? DBNull.Value);
        command.Parameters.AddWithValue("@Isdelete", (object)request.Isdelete ?? "0");
        command.Parameters.AddWithValue("@Query", request.Query > 0 ? request.Query : 1); // Query = 1 for Insert
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Vehicle created successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("CreateVehicle")
.WithOpenApi();

// Update vehicle (Query = 2: Update)
app.MapPut("/api/vehicle/{id}", async (int id, VehicleRequest request, SqlConnection connection) =>
{
    var response = new VehicleResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Vehiclename))
        {
            response.Success = false;
            response.Message = "Vehicle name is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Vehicledetails", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        // For Query = 2 (Update), pass required parameters
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Vehiclename", request.Vehiclename);
        command.Parameters.AddWithValue("@Vehicleno", (object)request.Vehicleno ?? DBNull.Value);
        command.Parameters.AddWithValue("@Isdelete", (object)request.Isdelete ?? "0");
        command.Parameters.AddWithValue("@Query", request.Query > 0 ? request.Query : 2); // Query = 2 for Update
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Vehicle updated successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("UpdateVehicle")
.WithOpenApi();

// Delete vehicle (Query = 4: Soft Delete)
app.MapDelete("/api/vehicle/{id}", async (int id, SqlConnection connection) =>
{
    var response = new VehicleResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Vehicledetails", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        // For Query = 4 (Soft Delete), pass required parameters
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Vehiclename", DBNull.Value);
        command.Parameters.AddWithValue("@Vehicleno", DBNull.Value);
        command.Parameters.AddWithValue("@Isdelete", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 4); // Query = 4 for Soft Delete
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Vehicle deleted successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("DeleteVehicle")
.WithOpenApi();

// Driver Details Management Endpoints

// Get all drivers (Query = 3: Select All)
app.MapGet("/api/driver", async (string? isdelete, SqlConnection connection) =>
{
    var response = new DriverResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Driverdetails", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        // For Query = 3 (Select All), pass required parameters
        command.Parameters.AddWithValue("@Id", DBNull.Value);
        command.Parameters.AddWithValue("@Drivername", DBNull.Value);
        command.Parameters.AddWithValue("@Licenseno", DBNull.Value);
        command.Parameters.AddWithValue("@Mobileno", DBNull.Value);
        command.Parameters.AddWithValue("@Type", DBNull.Value);
        command.Parameters.AddWithValue("@Isdelete", (object)isdelete ?? "0");
        command.Parameters.AddWithValue("@Query", 3); // Query = 3 for Select All
        
        using var reader = await command.ExecuteReaderAsync();
        var drivers = new List<DriverData>();
        
        while (await reader.ReadAsync())
        {
            drivers.Add(new DriverData
            {
                Id = reader.GetInt32(reader.GetOrdinal("Id")),
                Drivername = reader.IsDBNull(reader.GetOrdinal("Drivername")) ? null : reader.GetString(reader.GetOrdinal("Drivername")),
                Licenseno = reader.IsDBNull(reader.GetOrdinal("Licenseno")) ? null : reader.GetString(reader.GetOrdinal("Licenseno")),
                Mobileno = reader.IsDBNull(reader.GetOrdinal("Mobileno")) ? null : reader.GetString(reader.GetOrdinal("Mobileno")),
                Type = reader.IsDBNull(reader.GetOrdinal("Type")) ? null : reader.GetString(reader.GetOrdinal("Type")),
                Isdelete = reader.IsDBNull(reader.GetOrdinal("Isdelete")) ? null : reader.GetString(reader.GetOrdinal("Isdelete"))
            });
        }
        
        response.Success = true;
        response.Message = "Drivers retrieved successfully";
        response.Drivers = drivers;
        response.Data = drivers; // Also set Data for compatibility
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetAllDrivers")
.WithOpenApi();

// Create new driver (Query = 1: Insert)
app.MapPost("/api/driver", async (DriverRequest request, SqlConnection connection) =>
{
    var response = new DriverResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Drivername))
        {
            response.Success = false;
            response.Message = "Driver name is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Driverdetails", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        // For Query = 1 (Insert), pass required parameters
        command.Parameters.AddWithValue("@Id", DBNull.Value);
        command.Parameters.AddWithValue("@Drivername", request.Drivername);
        command.Parameters.AddWithValue("@Licenseno", (object)request.Licenseno ?? DBNull.Value);
        command.Parameters.AddWithValue("@Mobileno", (object)request.Mobileno ?? DBNull.Value);
        command.Parameters.AddWithValue("@Type", (object)request.Type ?? DBNull.Value);
        command.Parameters.AddWithValue("@Isdelete", (object)request.Isdelete ?? "0");
        command.Parameters.AddWithValue("@Query", request.Query > 0 ? request.Query : 1); // Query = 1 for Insert
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Driver created successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("CreateDriver")
.WithOpenApi();

// Update driver (Query = 2: Update)
app.MapPut("/api/driver/{id}", async (int id, DriverRequest request, SqlConnection connection) =>
{
    var response = new DriverResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Drivername))
        {
            response.Success = false;
            response.Message = "Driver name is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Driverdetails", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        // For Query = 2 (Update), pass required parameters
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Drivername", request.Drivername);
        command.Parameters.AddWithValue("@Licenseno", (object)request.Licenseno ?? DBNull.Value);
        command.Parameters.AddWithValue("@Mobileno", (object)request.Mobileno ?? DBNull.Value);
        command.Parameters.AddWithValue("@Type", (object)request.Type ?? DBNull.Value);
        command.Parameters.AddWithValue("@Isdelete", (object)request.Isdelete ?? "0");
        command.Parameters.AddWithValue("@Query", request.Query > 0 ? request.Query : 2); // Query = 2 for Update
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Driver updated successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("UpdateDriver")
.WithOpenApi();

// Delete driver (Query = 4: Soft Delete)
app.MapDelete("/api/driver/{id}", async (int id, SqlConnection connection) =>
{
    var response = new DriverResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Driverdetails", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        // For Query = 4 (Soft Delete), pass required parameters
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Drivername", DBNull.Value);
        command.Parameters.AddWithValue("@Licenseno", DBNull.Value);
        command.Parameters.AddWithValue("@Mobileno", DBNull.Value);
        command.Parameters.AddWithValue("@Type", DBNull.Value);
        command.Parameters.AddWithValue("@Isdelete", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 4); // Query = 4 for Soft Delete
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Driver deleted successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("DeleteDriver")
.WithOpenApi();

// Sales Return Conditions Management Endpoints

// Get all sales return conditions (Query = 5: Select All with Parent Name)
app.MapGet("/api/salesreturn", async (string? isdelete, SqlConnection connection) =>
{
    var response = new SalesReturnResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Salesreturnconditions", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        // For Query = 5 (Select All with Parent Name), pass required parameters
        command.Parameters.AddWithValue("@Id", 0);
        command.Parameters.AddWithValue("@Condition", "");
        command.Parameters.AddWithValue("@Parentcondition", "");
        command.Parameters.AddWithValue("@Isdelete", (object)isdelete ?? "0");
        command.Parameters.AddWithValue("@Enterdate", DateTime.Now);
        command.Parameters.AddWithValue("@Query", 5); // Query = 5 for Select All with Parent Name
        
        using var reader = await command.ExecuteReaderAsync();
        var salesReturns = new List<SalesReturnData>();
        
        while (await reader.ReadAsync())
        {
            salesReturns.Add(new SalesReturnData
            {
                Id = reader.GetInt32(reader.GetOrdinal("Id")),
                Condition = reader.IsDBNull(reader.GetOrdinal("Condition")) ? null : reader.GetString(reader.GetOrdinal("Condition")),
                Parentcondition = reader.IsDBNull(reader.GetOrdinal("Parentcondition")) ? null : reader.GetString(reader.GetOrdinal("Parentcondition")),
                Parentconditionname = reader.IsDBNull(reader.GetOrdinal("Parentconditionname")) ? null : reader.GetString(reader.GetOrdinal("Parentconditionname")),
                Isdelete = reader.IsDBNull(reader.GetOrdinal("Isdelete")) ? null : reader.GetString(reader.GetOrdinal("Isdelete")),
                Enterdate = reader.IsDBNull(reader.GetOrdinal("Enterdate")) ? null : reader.GetDateTime(reader.GetOrdinal("Enterdate"))
            });
        }
        
        response.Success = true;
        response.Message = "Sales return conditions retrieved successfully";
        response.SalesReturns = salesReturns;
        response.Data = salesReturns; // Also set Data for compatibility
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetAllSalesReturns")
.WithOpenApi();

// Create new sales return condition (Query = 1: Insert)
app.MapPost("/api/salesreturn", async (SalesReturnRequest request, SqlConnection connection) =>
{
    var response = new SalesReturnResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Condition))
        {
            response.Success = false;
            response.Message = "Condition is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Salesreturnconditions", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        // For Query = 1 (Insert), pass required parameters
        command.Parameters.AddWithValue("@Id", 0);
        command.Parameters.AddWithValue("@Condition", request.Condition ?? "");
        command.Parameters.AddWithValue("@Parentcondition", request.Parentcondition ?? "0");
        command.Parameters.AddWithValue("@Isdelete", request.Isdelete ?? "0");
        command.Parameters.AddWithValue("@Enterdate", request.Enterdate ?? DateTime.Now);
        command.Parameters.AddWithValue("@Query", request.Query > 0 ? request.Query : 1); // Query = 1 for Insert
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Sales return condition created successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("CreateSalesReturn")
.WithOpenApi();

// Update sales return condition (Query = 2: Update)
app.MapPut("/api/salesreturn/{id}", async (int id, SalesReturnRequest request, SqlConnection connection) =>
{
    var response = new SalesReturnResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Condition))
        {
            response.Success = false;
            response.Message = "Condition is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Salesreturnconditions", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        // For Query = 2 (Update), pass required parameters
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Condition", request.Condition ?? "");
        command.Parameters.AddWithValue("@Parentcondition", request.Parentcondition ?? "0");
        command.Parameters.AddWithValue("@Isdelete", request.Isdelete ?? "0");
        command.Parameters.AddWithValue("@Enterdate", request.Enterdate ?? DateTime.Now);
        command.Parameters.AddWithValue("@Query", request.Query > 0 ? request.Query : 2); // Query = 2 for Update
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Sales return condition updated successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("UpdateSalesReturn")
.WithOpenApi();

// Delete sales return condition (Query = 3: Soft Delete)
app.MapDelete("/api/salesreturn/{id}", async (int id, SqlConnection connection) =>
{
    var response = new SalesReturnResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Salesreturnconditions", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        // For Query = 3 (Soft Delete), pass required parameters
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Condition", "");
        command.Parameters.AddWithValue("@Parentcondition", "");
        command.Parameters.AddWithValue("@Isdelete", "1"); // Set to 1 for soft delete
        command.Parameters.AddWithValue("@Enterdate", DateTime.Now);
        command.Parameters.AddWithValue("@Query", 3); // Query = 3 for Soft Delete
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Sales return condition deleted successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("DeleteSalesReturn")
.WithOpenApi();

// Date Format Management Endpoints

// Get all date formats
app.MapGet("/api/dateformat", async (SqlConnection connection) =>
{
    var response = new DateFormatResponse();
    
    try
    {
        await connection.OpenAsync();
        
        // Use direct SQL to ensure we get the format even if SP is missing
        using var command = new SqlCommand("SELECT Id, Dateformat, Isdelete FROM Tbl_Dateformat", connection);
        
        using var reader = await command.ExecuteReaderAsync();
        var dateFormats = new List<DateFormatData>();
        
        while (await reader.ReadAsync())
        {
            dateFormats.Add(new DateFormatData
            {
                Id = reader.GetInt32(reader.GetOrdinal("Id")),
                Dateformat = reader.IsDBNull(reader.GetOrdinal("Dateformat")) ? "" : reader.GetString(reader.GetOrdinal("Dateformat")),
                Isdelete = reader.IsDBNull(reader.GetOrdinal("Isdelete")) ? "" : reader.GetString(reader.GetOrdinal("Isdelete"))
            });
        }
        
        response.Success = true;
        response.Message = "Date format retrieved successfully";
        response.DateFormats = dateFormats;
        response.Data = dateFormats; // For compatibility
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetAllDateFormats")
.WithOpenApi();

// Create new date format
app.MapPost("/api/dateformat", async (DateFormatRequest request, SqlConnection connection) =>
{
    var response = new DateFormatResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Dateformat))
        {
            response.Success = false;
            response.Message = "Date format is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Dateformat", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Id", DBNull.Value);
        command.Parameters.AddWithValue("@Dateformat", request.Dateformat);
        command.Parameters.AddWithValue("@Isdelete", (object)request.Isdelete ?? "0");
        command.Parameters.AddWithValue("@Query", request.Query > 0 ? request.Query : 1); // Query = 1 for Insert
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Date format created successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("CreateDateFormat")
.WithOpenApi();

// Update date format
app.MapPut("/api/dateformat/{id}", async (int id, DateFormatRequest request, SqlConnection connection) =>
{
    var response = new DateFormatResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.Dateformat))
        {
            response.Success = false;
            response.Message = "Date format is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Dateformat", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Dateformat", request.Dateformat);
        command.Parameters.AddWithValue("@Isdelete", (object)request.Isdelete ?? "0");
        command.Parameters.AddWithValue("@Query", request.Query > 0 ? request.Query : 2); // Query = 2 for Update
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Date format updated successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("UpdateDateFormat")
.WithOpenApi();

// Delete date format (soft delete by updating Isdelete)
app.MapDelete("/api/dateformat/{id}", async (int id, SqlConnection connection) =>
{
    var response = new DateFormatResponse();
    
    try
    {
        await connection.OpenAsync();
        
        // First get the current record to preserve Dateformat field
        using var getCommand = new SqlCommand("SELECT * FROM Tbl_Dateformat WHERE Id = @Id", connection);
        getCommand.Parameters.AddWithValue("@Id", id);
        using var reader = await getCommand.ExecuteReaderAsync();
        
        if (!reader.HasRows)
        {
            response.Success = false;
            response.Message = "Date format not found";
            return Results.Json(response, statusCode: 404);
        }
        
        await reader.ReadAsync();
        var dateformat = reader.IsDBNull(reader.GetOrdinal("Dateformat")) ? "" : reader.GetString(reader.GetOrdinal("Dateformat"));
        
        reader.Close();
        
        // Update with Isdelete = "1" using Query = 3
        using var command = new SqlCommand("Sp_Dateformat", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Dateformat", dateformat);
        command.Parameters.AddWithValue("@Isdelete", "1"); // Set to deleted
        command.Parameters.AddWithValue("@Query", 3); // Query = 3 for Update Isdelete only
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Date format deleted successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("DeleteDateFormat")
.WithOpenApi();

// Module Management Endpoints

// Get all modules
app.MapGet("/api/module", async (SqlConnection connection) =>
{
    var response = new ModuleResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Module", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@ModuleName", DBNull.Value);
        command.Parameters.AddWithValue("@id", DBNull.Value);
        command.Parameters.AddWithValue("@Status", DBNull.Value);
        command.Parameters.AddWithValue("@RoleId", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 3); // Query = 3 for Select All
        
        using var reader = await command.ExecuteReaderAsync();
        var modules = new List<ModuleData>();
        
        while (await reader.ReadAsync())
        {
            modules.Add(new ModuleData
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                ModuleName = reader.IsDBNull(reader.GetOrdinal("ModuleName")) ? "" : reader.GetString(reader.GetOrdinal("ModuleName")),
                Status = reader.IsDBNull(reader.GetOrdinal("Status")) ? "" : reader.GetString(reader.GetOrdinal("Status")),
                RoleId = reader.IsDBNull(reader.GetOrdinal("RoleId")) ? null : reader.GetInt32(reader.GetOrdinal("RoleId")),
                RoleName = reader.IsDBNull(reader.GetOrdinal("RoleName")) ? "" : reader.GetString(reader.GetOrdinal("RoleName"))
            });
        }
        
        response.Success = true;
        response.Message = "Modules retrieved successfully";
        response.Modules = modules;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetAllModules")
.WithOpenApi();

// Get modules by role (filtered by permissions)
app.MapGet("/api/module/role/{roleId}", async (int roleId, SqlConnection connection) =>
{
    var response = new ModuleResponse();
    
    try
    {
        await connection.OpenAsync();
        
        // First, get all permissions for this role
        using var permissionCommand = new SqlCommand("Sp_Permission", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        permissionCommand.Parameters.AddWithValue("@RoleId", roleId);
        permissionCommand.Parameters.AddWithValue("@ModuleId", DBNull.Value);
        permissionCommand.Parameters.AddWithValue("@SubModuleId", DBNull.Value);
        permissionCommand.Parameters.AddWithValue("@PermissionType", DBNull.Value);
        permissionCommand.Parameters.AddWithValue("@id", DBNull.Value);
        permissionCommand.Parameters.AddWithValue("@Status", DBNull.Value);
        permissionCommand.Parameters.AddWithValue("@Query", 5); // Query = 5 for Get by Role
        
        var allowedModuleIds = new HashSet<int>();
        using (var permissionReader = await permissionCommand.ExecuteReaderAsync())
        {
            while (await permissionReader.ReadAsync())
            {
                var moduleId = permissionReader.IsDBNull(permissionReader.GetOrdinal("ModuleId")) 
                    ? (int?)null 
                    : permissionReader.GetInt32(permissionReader.GetOrdinal("ModuleId"));
                var permissionType = permissionReader.IsDBNull(permissionReader.GetOrdinal("PermissionType")) 
                    ? "" 
                    : permissionReader.GetString(permissionReader.GetOrdinal("PermissionType"));
                
                // Include modules with View, Full Access, or any permission type
                if (moduleId.HasValue && 
                    (permissionType == "View" || permissionType == "Full Access" || !string.IsNullOrEmpty(permissionType)))
                {
                    allowedModuleIds.Add(moduleId.Value);
                }
            }
        }
        
        // Now get all modules
        using var moduleCommand = new SqlCommand("Sp_Module", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        moduleCommand.Parameters.AddWithValue("@ModuleName", DBNull.Value);
        moduleCommand.Parameters.AddWithValue("@id", DBNull.Value);
        moduleCommand.Parameters.AddWithValue("@Status", DBNull.Value);
        moduleCommand.Parameters.AddWithValue("@Query", 3); // Query = 3 for Select All
        
        var modules = new List<ModuleData>();
        using (var moduleReader = await moduleCommand.ExecuteReaderAsync())
        {
            while (await moduleReader.ReadAsync())
            {
                var moduleId = moduleReader.GetInt32(moduleReader.GetOrdinal("id"));
                
                // Only include modules that the role has permission to view
                if (allowedModuleIds.Contains(moduleId))
                {
                    modules.Add(new ModuleData
                    {
                        Id = moduleId,
                        ModuleName = moduleReader.IsDBNull(moduleReader.GetOrdinal("ModuleName")) 
                            ? "" 
                            : moduleReader.GetString(moduleReader.GetOrdinal("ModuleName")),
                        Status = moduleReader.IsDBNull(moduleReader.GetOrdinal("Status")) 
                            ? "" 
                            : moduleReader.GetString(moduleReader.GetOrdinal("Status"))
                    });
                }
            }
        }
        
        response.Success = true;
        response.Message = "Modules retrieved successfully";
        response.Modules = modules;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetModulesByRole")
.WithOpenApi();

// Get modules by RoleId (modules created by/assigned to a role)
app.MapGet("/api/module/byrole/{roleId}", async (int roleId, SqlConnection connection) =>
{
    var response = new ModuleResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Module", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@ModuleName", DBNull.Value);
        command.Parameters.AddWithValue("@id", DBNull.Value);
        command.Parameters.AddWithValue("@Status", DBNull.Value);
        command.Parameters.AddWithValue("@RoleId", roleId);
        command.Parameters.AddWithValue("@Query", 6); // Query = 6 for Get by RoleId
        
        using var reader = await command.ExecuteReaderAsync();
        var modules = new List<ModuleData>();
        
        while (await reader.ReadAsync())
        {
            modules.Add(new ModuleData
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                ModuleName = reader.IsDBNull(reader.GetOrdinal("ModuleName")) ? "" : reader.GetString(reader.GetOrdinal("ModuleName")),
                Status = reader.IsDBNull(reader.GetOrdinal("Status")) ? "" : reader.GetString(reader.GetOrdinal("Status")),
                RoleId = reader.IsDBNull(reader.GetOrdinal("RoleId")) ? null : reader.GetInt32(reader.GetOrdinal("RoleId")),
                RoleName = reader.IsDBNull(reader.GetOrdinal("RoleName")) ? "" : reader.GetString(reader.GetOrdinal("RoleName"))
            });
        }
        
        response.Success = true;
        response.Message = "Modules retrieved successfully";
        response.Modules = modules;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetModulesByRoleId")
.WithOpenApi();

// Create new module
app.MapPost("/api/module", async (ModuleRequest request, SqlConnection connection) =>
{
    var response = new ModuleResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.ModuleName))
        {
            response.Success = false;
            response.Message = "Module name is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Module", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@ModuleName", request.ModuleName);
        command.Parameters.AddWithValue("@id", DBNull.Value);
        command.Parameters.AddWithValue("@Status", request.Status ?? "Active");
        command.Parameters.AddWithValue("@RoleId", request.RoleId.HasValue ? (object)request.RoleId.Value : DBNull.Value);
        command.Parameters.AddWithValue("@Query", 1); // Query = 1 for Insert
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Module created successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("CreateModule")
.WithOpenApi();

// Update module
app.MapPut("/api/module/{id}", async (int id, ModuleRequest request, SqlConnection connection) =>
{
    var response = new ModuleResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.ModuleName))
        {
            response.Success = false;
            response.Message = "Module name is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Module", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@ModuleName", request.ModuleName);
        command.Parameters.AddWithValue("@id", id);
        command.Parameters.AddWithValue("@Status", request.Status ?? "Active");
        command.Parameters.AddWithValue("@RoleId", request.RoleId.HasValue ? (object)request.RoleId.Value : DBNull.Value);
        command.Parameters.AddWithValue("@Query", 2); // Query = 2 for Update
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Module updated successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("UpdateModule")
.WithOpenApi();

// Delete module
app.MapDelete("/api/module/{id}", async (int id, SqlConnection connection) =>
{
    var response = new ModuleResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Module", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@ModuleName", DBNull.Value);
        command.Parameters.AddWithValue("@id", id);
        command.Parameters.AddWithValue("@Status", DBNull.Value);
        command.Parameters.AddWithValue("@RoleId", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 4); // Query = 4 for Delete
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Module deleted successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("DeleteModule")
.WithOpenApi();

// SubModule Management Endpoints

// Get all submodules (optionally filtered by moduleId)
app.MapGet("/api/submodule", async (int? moduleId, SqlConnection connection) =>
{
    var response = new SubModuleResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_SubModule", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@SubModuleName", DBNull.Value);
        command.Parameters.AddWithValue("@id", DBNull.Value);
        command.Parameters.AddWithValue("@ModuleId", moduleId ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@Status", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 3); // Query = 3 for Select All
        
        using var reader = await command.ExecuteReaderAsync();
        var subModules = new List<SubModuleData>();
        
        while (await reader.ReadAsync())
        {
            subModules.Add(new SubModuleData
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                SubModuleName = reader.IsDBNull(reader.GetOrdinal("SubModuleName")) ? "" : reader.GetString(reader.GetOrdinal("SubModuleName")),
                ModuleId = reader.IsDBNull(reader.GetOrdinal("ModuleId")) ? 0 : reader.GetInt32(reader.GetOrdinal("ModuleId")),
                ModuleName = reader.IsDBNull(reader.GetOrdinal("ModuleName")) ? "" : reader.GetString(reader.GetOrdinal("ModuleName")),
                Status = reader.IsDBNull(reader.GetOrdinal("Status")) ? "" : reader.GetString(reader.GetOrdinal("Status"))
            });
        }
        
        response.Success = true;
        response.Message = "SubModules retrieved successfully";
        response.SubModules = subModules;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetAllSubModules")
.WithOpenApi();

// Get submodules by role (filtered by permissions)
app.MapGet("/api/submodule/role/{roleId}", async (int roleId, int? moduleId, SqlConnection connection) =>
{
    var response = new SubModuleResponse();
    
    try
    {
        await connection.OpenAsync();
        
        // First, get all permissions for this role
        using var permissionCommand = new SqlCommand("Sp_Permission", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        permissionCommand.Parameters.AddWithValue("@RoleId", roleId);
        permissionCommand.Parameters.AddWithValue("@ModuleId", DBNull.Value);
        permissionCommand.Parameters.AddWithValue("@SubModuleId", DBNull.Value);
        permissionCommand.Parameters.AddWithValue("@PermissionType", DBNull.Value);
        permissionCommand.Parameters.AddWithValue("@id", DBNull.Value);
        permissionCommand.Parameters.AddWithValue("@Status", DBNull.Value);
        permissionCommand.Parameters.AddWithValue("@Query", 5); // Query = 5 for Get by Role
        
        var allowedSubModuleIds = new HashSet<int>();
        using (var permissionReader = await permissionCommand.ExecuteReaderAsync())
        {
            while (await permissionReader.ReadAsync())
            {
                var subModuleId = permissionReader.IsDBNull(permissionReader.GetOrdinal("SubModuleId")) 
                    ? (int?)null 
                    : permissionReader.GetInt32(permissionReader.GetOrdinal("SubModuleId"));
                var permissionType = permissionReader.IsDBNull(permissionReader.GetOrdinal("PermissionType")) 
                    ? "" 
                    : permissionReader.GetString(permissionReader.GetOrdinal("PermissionType"));
                
                // Include submodules with View, Full Access, or any permission type
                if (subModuleId.HasValue && 
                    (permissionType == "View" || permissionType == "Full Access" || !string.IsNullOrEmpty(permissionType)))
                {
                    allowedSubModuleIds.Add(subModuleId.Value);
                }
            }
        }
        
        // Now get all submodules (optionally filtered by moduleId)
        using var subModuleCommand = new SqlCommand("Sp_SubModule", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        subModuleCommand.Parameters.AddWithValue("@SubModuleName", DBNull.Value);
        subModuleCommand.Parameters.AddWithValue("@id", DBNull.Value);
        subModuleCommand.Parameters.AddWithValue("@ModuleId", moduleId ?? (object)DBNull.Value);
        subModuleCommand.Parameters.AddWithValue("@Status", DBNull.Value);
        subModuleCommand.Parameters.AddWithValue("@Query", 3); // Query = 3 for Select All
        
        var subModules = new List<SubModuleData>();
        using (var subModuleReader = await subModuleCommand.ExecuteReaderAsync())
        {
            while (await subModuleReader.ReadAsync())
            {
                var subModuleId = subModuleReader.GetInt32(subModuleReader.GetOrdinal("id"));
                
                // Only include submodules that the role has permission to view
                if (allowedSubModuleIds.Contains(subModuleId))
                {
                    subModules.Add(new SubModuleData
                    {
                        Id = subModuleId,
                        SubModuleName = subModuleReader.IsDBNull(subModuleReader.GetOrdinal("SubModuleName")) 
                            ? "" 
                            : subModuleReader.GetString(subModuleReader.GetOrdinal("SubModuleName")),
                        ModuleId = subModuleReader.IsDBNull(subModuleReader.GetOrdinal("ModuleId")) 
                            ? 0 
                            : subModuleReader.GetInt32(subModuleReader.GetOrdinal("ModuleId")),
                        ModuleName = subModuleReader.IsDBNull(subModuleReader.GetOrdinal("ModuleName")) 
                            ? "" 
                            : subModuleReader.GetString(subModuleReader.GetOrdinal("ModuleName")),
                        Status = subModuleReader.IsDBNull(subModuleReader.GetOrdinal("Status")) 
                            ? "" 
                            : subModuleReader.GetString(subModuleReader.GetOrdinal("Status"))
                    });
                }
            }
        }
        
        response.Success = true;
        response.Message = "SubModules retrieved successfully";
        response.SubModules = subModules;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetSubModulesByRole")
.WithOpenApi();

// Create new submodule
app.MapPost("/api/submodule", async (SubModuleRequest request, SqlConnection connection) =>
{
    var response = new SubModuleResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.SubModuleName))
        {
            response.Success = false;
            response.Message = "SubModule name is required";
            return Results.Json(response, statusCode: 400);
        }
        
        if (request.ModuleId <= 0)
        {
            response.Success = false;
            response.Message = "Module ID is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_SubModule", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@SubModuleName", request.SubModuleName);
        command.Parameters.AddWithValue("@id", DBNull.Value);
        command.Parameters.AddWithValue("@ModuleId", request.ModuleId);
        command.Parameters.AddWithValue("@Status", request.Status ?? "Active");
        command.Parameters.AddWithValue("@Query", 1); // Query = 1 for Insert
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "SubModule created successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("CreateSubModule")
.WithOpenApi();

// Update submodule
app.MapPut("/api/submodule/{id}", async (int id, SubModuleRequest request, SqlConnection connection) =>
{
    var response = new SubModuleResponse();
    
    try
    {
        if (string.IsNullOrWhiteSpace(request.SubModuleName))
        {
            response.Success = false;
            response.Message = "SubModule name is required";
            return Results.Json(response, statusCode: 400);
        }
        
        if (request.ModuleId <= 0)
        {
            response.Success = false;
            response.Message = "Module ID is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_SubModule", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@SubModuleName", request.SubModuleName);
        command.Parameters.AddWithValue("@id", id);
        command.Parameters.AddWithValue("@ModuleId", request.ModuleId);
        command.Parameters.AddWithValue("@Status", request.Status ?? "Active");
        command.Parameters.AddWithValue("@Query", 2); // Query = 2 for Update
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "SubModule updated successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("UpdateSubModule")
.WithOpenApi();

// Delete submodule
app.MapDelete("/api/submodule/{id}", async (int id, SqlConnection connection) =>
{
    var response = new SubModuleResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_SubModule", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@SubModuleName", DBNull.Value);
        command.Parameters.AddWithValue("@id", id);
        command.Parameters.AddWithValue("@ModuleId", DBNull.Value);
        command.Parameters.AddWithValue("@Status", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 4); // Query = 4 for Delete
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "SubModule deleted successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("DeleteSubModule")
.WithOpenApi();

// Permission Management Endpoints

// Get all permissions
app.MapGet("/api/permission", async (SqlConnection connection) =>
{
    var response = new PermissionResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Permission", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@RoleId", DBNull.Value);
        command.Parameters.AddWithValue("@ModuleId", DBNull.Value);
        command.Parameters.AddWithValue("@SubModuleId", DBNull.Value);
        command.Parameters.AddWithValue("@PermissionType", DBNull.Value);
        command.Parameters.AddWithValue("@id", DBNull.Value);
        command.Parameters.AddWithValue("@Status", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 3); // Query = 3 for Select All
        
        using var reader = await command.ExecuteReaderAsync();
        var permissions = new List<PermissionData>();
        
        while (await reader.ReadAsync())
        {
            permissions.Add(new PermissionData
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                RoleId = reader.GetInt32(reader.GetOrdinal("RoleId")),
                RoleName = reader.IsDBNull(reader.GetOrdinal("RoleName")) ? "" : reader.GetString(reader.GetOrdinal("RoleName")),
                ModuleId = reader.IsDBNull(reader.GetOrdinal("ModuleId")) ? null : reader.GetInt32(reader.GetOrdinal("ModuleId")),
                ModuleName = reader.IsDBNull(reader.GetOrdinal("ModuleName")) ? "" : reader.GetString(reader.GetOrdinal("ModuleName")),
                SubModuleId = reader.IsDBNull(reader.GetOrdinal("SubModuleId")) ? null : reader.GetInt32(reader.GetOrdinal("SubModuleId")),
                SubModuleName = reader.IsDBNull(reader.GetOrdinal("SubModuleName")) ? "" : reader.GetString(reader.GetOrdinal("SubModuleName")),
                PermissionType = reader.IsDBNull(reader.GetOrdinal("PermissionType")) ? "" : reader.GetString(reader.GetOrdinal("PermissionType")),
                Status = reader.IsDBNull(reader.GetOrdinal("Status")) ? "" : reader.GetString(reader.GetOrdinal("Status"))
            });
        }
        
        response.Success = true;
        response.Message = "Permissions retrieved successfully";
        response.Permissions = permissions;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetAllPermissions")
.WithOpenApi();

// Get permissions by role
app.MapGet("/api/permission/role/{roleId}", async (int roleId, SqlConnection connection) =>
{
    var response = new PermissionResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Permission", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@RoleId", roleId);
        command.Parameters.AddWithValue("@ModuleId", DBNull.Value);
        command.Parameters.AddWithValue("@SubModuleId", DBNull.Value);
        command.Parameters.AddWithValue("@PermissionType", DBNull.Value);
        command.Parameters.AddWithValue("@id", DBNull.Value);
        command.Parameters.AddWithValue("@Status", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 5); // Query = 5 for Get by Role
        
        using var reader = await command.ExecuteReaderAsync();
        var permissions = new List<PermissionData>();
        
        while (await reader.ReadAsync())
        {
            permissions.Add(new PermissionData
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                RoleId = reader.GetInt32(reader.GetOrdinal("RoleId")),
                RoleName = reader.IsDBNull(reader.GetOrdinal("RoleName")) ? "" : reader.GetString(reader.GetOrdinal("RoleName")),
                ModuleId = reader.IsDBNull(reader.GetOrdinal("ModuleId")) ? null : reader.GetInt32(reader.GetOrdinal("ModuleId")),
                ModuleName = reader.IsDBNull(reader.GetOrdinal("ModuleName")) ? "" : reader.GetString(reader.GetOrdinal("ModuleName")),
                SubModuleId = reader.IsDBNull(reader.GetOrdinal("SubModuleId")) ? null : reader.GetInt32(reader.GetOrdinal("SubModuleId")),
                SubModuleName = reader.IsDBNull(reader.GetOrdinal("SubModuleName")) ? "" : reader.GetString(reader.GetOrdinal("SubModuleName")),
                PermissionType = reader.IsDBNull(reader.GetOrdinal("PermissionType")) ? "" : reader.GetString(reader.GetOrdinal("PermissionType")),
                Status = reader.IsDBNull(reader.GetOrdinal("Status")) ? "" : reader.GetString(reader.GetOrdinal("Status"))
            });
        }
        
        response.Success = true;
        response.Message = "Permissions retrieved successfully";
        response.Permissions = permissions;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetPermissionsByRole")
.WithOpenApi();

// Create new permission
app.MapPost("/api/permission", async (PermissionRequest request, SqlConnection connection) =>
{
    var response = new PermissionResponse();
    
    try
    {
        if (request.RoleId <= 0)
        {
            response.Success = false;
            response.Message = "Role ID is required";
            return Results.Json(response, statusCode: 400);
        }
        
        if (string.IsNullOrWhiteSpace(request.PermissionType))
        {
            response.Success = false;
            response.Message = "Permission Type is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Permission", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@RoleId", request.RoleId);
        command.Parameters.AddWithValue("@ModuleId", request.ModuleId.HasValue ? (object)request.ModuleId.Value : DBNull.Value);
        command.Parameters.AddWithValue("@SubModuleId", request.SubModuleId.HasValue ? (object)request.SubModuleId.Value : DBNull.Value);
        command.Parameters.AddWithValue("@PermissionType", request.PermissionType);
        command.Parameters.AddWithValue("@id", DBNull.Value);
        command.Parameters.AddWithValue("@Status", request.Status ?? "Active");
        command.Parameters.AddWithValue("@Query", 1); // Query = 1 for Insert
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Permission created successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("CreatePermission")
.WithOpenApi();

// Update permission
app.MapPut("/api/permission/{id}", async (int id, PermissionRequest request, SqlConnection connection) =>
{
    var response = new PermissionResponse();
    
    try
    {
        if (request.RoleId <= 0)
        {
            response.Success = false;
            response.Message = "Role ID is required";
            return Results.Json(response, statusCode: 400);
        }
        
        if (string.IsNullOrWhiteSpace(request.PermissionType))
        {
            response.Success = false;
            response.Message = "Permission Type is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Permission", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@RoleId", request.RoleId);
        command.Parameters.AddWithValue("@ModuleId", request.ModuleId.HasValue ? (object)request.ModuleId.Value : DBNull.Value);
        command.Parameters.AddWithValue("@SubModuleId", request.SubModuleId.HasValue ? (object)request.SubModuleId.Value : DBNull.Value);
        command.Parameters.AddWithValue("@PermissionType", request.PermissionType);
        command.Parameters.AddWithValue("@id", id);
        command.Parameters.AddWithValue("@Status", request.Status ?? "Active");
        command.Parameters.AddWithValue("@Query", 2); // Query = 2 for Update
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Permission updated successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("UpdatePermission")
.WithOpenApi();

// Delete permission
app.MapDelete("/api/permission/{id}", async (int id, SqlConnection connection) =>
{
    var response = new PermissionResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Permission", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@RoleId", DBNull.Value);
        command.Parameters.AddWithValue("@ModuleId", DBNull.Value);
        command.Parameters.AddWithValue("@SubModuleId", DBNull.Value);
        command.Parameters.AddWithValue("@PermissionType", DBNull.Value);
        command.Parameters.AddWithValue("@id", id);
        command.Parameters.AddWithValue("@Status", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 4); // Query = 4 for Delete
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Permission deleted successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("DeletePermission")
.WithOpenApi();

// =============================================
// Email Settings API Endpoints
// =============================================

// GET: Get all email settings
app.MapGet("/api/email", async (SqlConnection connection) =>
{
    var response = new EmailSettingsResponse();
    
    try
    {
        await connection.OpenAsync();
        using var command = new SqlCommand("Sp_Email", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@id", 0);
        command.Parameters.AddWithValue("@Smtpusername", "");
        command.Parameters.AddWithValue("@Smtppassword", "");
        command.Parameters.AddWithValue("@Smtphost", "");
        command.Parameters.AddWithValue("@serverport", "");
        command.Parameters.AddWithValue("@Query", 3); // Select
        
        using var reader = await command.ExecuteReaderAsync();
        var emailSettingsList = new List<EmailSettingsData>();
        
        while (await reader.ReadAsync())
        {
            emailSettingsList.Add(new EmailSettingsData
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                SmtpUsername = reader.IsDBNull(reader.GetOrdinal("Smtpusername")) ? null : reader.GetString(reader.GetOrdinal("Smtpusername")),
                SmtpPassword = reader.IsDBNull(reader.GetOrdinal("Smtppassword")) ? null : reader.GetString(reader.GetOrdinal("Smtppassword")),
                SmtpHost = reader.IsDBNull(reader.GetOrdinal("Smtphost")) ? null : reader.GetString(reader.GetOrdinal("Smtphost")),
                ServerPort = reader.IsDBNull(reader.GetOrdinal("serverport")) ? null : reader.GetString(reader.GetOrdinal("serverport"))
            });
        }
        
        response.Success = true;
        response.Message = "Email settings retrieved successfully";
        response.EmailSettings = emailSettingsList;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetEmailSettings")
.WithOpenApi();

// POST: Create or Update email settings
app.MapPost("/api/email", async (EmailSettingsRequest request, SqlConnection connection) =>
{
    var response = new EmailSettingsResponse();
    
    try
    {
        await connection.OpenAsync();
        using var command = new SqlCommand("Sp_Email", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        int queryType = request.Id.HasValue && request.Id.Value > 0 ? 2 : 1; // 1 = Insert, 2 = Update
        
        command.Parameters.AddWithValue("@id", request.Id ?? 0);
        command.Parameters.AddWithValue("@Smtpusername", request.SmtpUsername ?? "");
        command.Parameters.AddWithValue("@Smtppassword", request.SmtpPassword ?? "");
        command.Parameters.AddWithValue("@Smtphost", request.SmtpHost ?? "");
        command.Parameters.AddWithValue("@serverport", request.ServerPort ?? "");
        command.Parameters.AddWithValue("@Query", queryType);
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = queryType == 1 ? "Email settings created successfully" : "Email settings updated successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("CreateOrUpdateEmailSettings")
.WithOpenApi();

// =============================================
// Variants API Endpoints
// =============================================

// GET: Get all variants
app.MapGet("/api/variant", async (SqlConnection connection) =>
{
    var response = new VariantResponse();
    
    try
    {
        await connection.OpenAsync();
        using var command = new SqlCommand("Sp_Variants", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Varinatname", "");
        command.Parameters.AddWithValue("@Id", 0);
        command.Parameters.AddWithValue("@Varianttype", "");
        command.Parameters.AddWithValue("@Variantvalues", "");
        command.Parameters.AddWithValue("@Status", "");
        command.Parameters.AddWithValue("@Query", 3); // Select All
        
        using var reader = await command.ExecuteReaderAsync();
        var variantsList = new List<VariantData>();
        
        while (await reader.ReadAsync())
        {
            variantsList.Add(new VariantData
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                Varinatname = reader.IsDBNull(reader.GetOrdinal("Varinatname")) ? null : reader.GetString(reader.GetOrdinal("Varinatname")),
                Varianttype = reader.IsDBNull(reader.GetOrdinal("Varianttype")) ? null : reader.GetString(reader.GetOrdinal("Varianttype")),
                Variantvalues = reader.IsDBNull(reader.GetOrdinal("Variantvalues")) ? null : reader.GetString(reader.GetOrdinal("Variantvalues")),
                Status = reader.IsDBNull(reader.GetOrdinal("Status")) ? null : reader.GetString(reader.GetOrdinal("Status"))
            });
        }
        
        response.Success = true;
        response.Message = "Variants retrieved successfully";
        response.Variants = variantsList;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetAllVariants")
.WithOpenApi();

// GET: Get distinct variant names
app.MapGet("/api/variant/names", async (SqlConnection connection) =>
{
    var response = new VariantResponse();
    
    try
    {
        await connection.OpenAsync();
        using var command = new SqlCommand("Sp_Variants", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Varinatname", "");
        command.Parameters.AddWithValue("@Id", 0);
        command.Parameters.AddWithValue("@Varianttype", "");
        command.Parameters.AddWithValue("@Variantvalues", "");
        command.Parameters.AddWithValue("@Status", "");
        command.Parameters.AddWithValue("@Query", 5); // Get Distinct Names
        
        using var reader = await command.ExecuteReaderAsync();
        var namesList = new List<string>();
        
        while (await reader.ReadAsync())
        {
            if (!reader.IsDBNull(reader.GetOrdinal("Varinatname")))
            {
                namesList.Add(reader.GetString(reader.GetOrdinal("Varinatname")));
            }
        }
        
        response.Success = true;
        response.Message = "Variant names retrieved successfully";
        response.VariantNames = namesList;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetVariantNames")
.WithOpenApi();

// GET: Get variant types and values by variant name
app.MapGet("/api/variant/types/{variantName}", async (string variantName, SqlConnection connection) =>
{
    var response = new VariantResponse();
    
    try
    {
        await connection.OpenAsync();
        using var command = new SqlCommand("Sp_Variants", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Varinatname", variantName);
        command.Parameters.AddWithValue("@Id", 0);
        command.Parameters.AddWithValue("@Varianttype", "");
        command.Parameters.AddWithValue("@Variantvalues", "");
        command.Parameters.AddWithValue("@Status", "");
        command.Parameters.AddWithValue("@Query", 6); // Get Types by Name
        
        using var reader = await command.ExecuteReaderAsync();
        var typesList = new List<VariantTypeData>();
        
        while (await reader.ReadAsync())
        {
            typesList.Add(new VariantTypeData
            {
                Varianttype = reader.IsDBNull(reader.GetOrdinal("Varianttype")) ? null : reader.GetString(reader.GetOrdinal("Varianttype")),
                Variantvalues = reader.IsDBNull(reader.GetOrdinal("Variantvalues")) ? null : reader.GetString(reader.GetOrdinal("Variantvalues"))
            });
        }
        
        response.Success = true;
        response.Message = "Variant types retrieved successfully";
        response.VariantTypes = typesList;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetVariantTypesByName")
.WithOpenApi();

// POST: Create or Update variant
app.MapPost("/api/variant", async (VariantRequest request, SqlConnection connection) =>
{
    var response = new VariantResponse();
    
    try
    {
        await connection.OpenAsync();
        using var command = new SqlCommand("Sp_Variants", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        int queryType = request.Id.HasValue && request.Id.Value > 0 ? 2 : 1; // 1 = Insert, 2 = Update
        
        command.Parameters.AddWithValue("@Varinatname", request.Varinatname ?? "");
        command.Parameters.AddWithValue("@Id", request.Id ?? 0);
        command.Parameters.AddWithValue("@Varianttype", request.Varianttype ?? "");
        command.Parameters.AddWithValue("@Variantvalues", request.Variantvalues ?? "");
        command.Parameters.AddWithValue("@Status", request.Status ?? "Active");
        command.Parameters.AddWithValue("@Query", queryType);
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = queryType == 1 ? "Variant created successfully" : "Variant updated successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("CreateOrUpdateVariant")
.WithOpenApi();

// DELETE: Delete variant
app.MapDelete("/api/variant/{id}", async (int id, SqlConnection connection) =>
{
    var response = new VariantResponse();
    
    try
    {
        await connection.OpenAsync();
        using var command = new SqlCommand("Sp_Variants", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Varinatname", "");
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Varianttype", "");
        command.Parameters.AddWithValue("@Variantvalues", "");
        command.Parameters.AddWithValue("@Status", "");
        command.Parameters.AddWithValue("@Query", 4); // Delete
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Variant deleted successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("DeleteVariant")
.WithOpenApi();

// =============================================
// User Registration API Endpoints
// =============================================

// GET: Get all users
app.MapGet("/api/user", async (SqlConnection connection) =>
{
    var response = new UserRegistrationResponse();
    
    try
    {
        await connection.OpenAsync();
        using var command = new SqlCommand("Sp_UserRegistration", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Userid", DBNull.Value);
        command.Parameters.AddWithValue("@Firstname", DBNull.Value);
        command.Parameters.AddWithValue("@Lastname", DBNull.Value);
        command.Parameters.AddWithValue("@Email", DBNull.Value);
        command.Parameters.AddWithValue("@Phone", DBNull.Value);
        command.Parameters.AddWithValue("@Password", DBNull.Value);
        command.Parameters.AddWithValue("@Role", DBNull.Value);
        command.Parameters.AddWithValue("@Catelogid", DBNull.Value);
        command.Parameters.AddWithValue("@Dateofregister", DBNull.Value);
        command.Parameters.AddWithValue("@Profile_image", DBNull.Value);
        command.Parameters.AddWithValue("@Status", "Active");
        command.Parameters.AddWithValue("@Warehouseid", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 2); // Select All
        
        var users = new List<Api.Models.RegistrationUserData>();
        using var reader = await command.ExecuteReaderAsync();
        
        while (await reader.ReadAsync())
        {
            users.Add(new Api.Models.RegistrationUserData
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                Userid = reader.IsDBNull(reader.GetOrdinal("Userid")) ? null : reader.GetString(reader.GetOrdinal("Userid")),
                Firstname = reader.IsDBNull(reader.GetOrdinal("Firstname")) ? null : reader.GetString(reader.GetOrdinal("Firstname")),
                Lastname = reader.IsDBNull(reader.GetOrdinal("Lastname")) ? null : reader.GetString(reader.GetOrdinal("Lastname")),
                Email = reader.IsDBNull(reader.GetOrdinal("Email")) ? null : reader.GetString(reader.GetOrdinal("Email")),
                Phone = reader.IsDBNull(reader.GetOrdinal("Phone")) ? null : reader.GetString(reader.GetOrdinal("Phone")),
                Role = reader.IsDBNull(reader.GetOrdinal("Role")) ? null : reader.GetString(reader.GetOrdinal("Role")),
                Catelogid = reader.IsDBNull(reader.GetOrdinal("Catelogid")) ? null : reader.GetString(reader.GetOrdinal("Catelogid")),
                Dateofregister = reader.IsDBNull(reader.GetOrdinal("Dateofregister")) ? null : reader.GetString(reader.GetOrdinal("Dateofregister")),
                Profile_image = reader.IsDBNull(reader.GetOrdinal("Profile_image")) ? null : reader.GetString(reader.GetOrdinal("Profile_image")),
                Status = reader.IsDBNull(reader.GetOrdinal("Status")) ? null : reader.GetString(reader.GetOrdinal("Status")),
                Warehouseid = reader.IsDBNull(reader.GetOrdinal("Warehouseid")) ? null : reader.GetString(reader.GetOrdinal("Warehouseid"))
            });
        }
        
        response.Success = true;
        response.Message = "Users retrieved successfully";
        response.Users = users;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetAllUsers")
.WithOpenApi();

// GET: Get user by ID
app.MapGet("/api/user/{id}", async (int id, SqlConnection connection) =>
{
    var response = new UserRegistrationResponse();
    
    try
    {
        await connection.OpenAsync();
        using var command = new SqlCommand("Sp_UserRegistration", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Userid", DBNull.Value);
        command.Parameters.AddWithValue("@Firstname", DBNull.Value);
        command.Parameters.AddWithValue("@Lastname", DBNull.Value);
        command.Parameters.AddWithValue("@Email", DBNull.Value);
        command.Parameters.AddWithValue("@Phone", DBNull.Value);
        command.Parameters.AddWithValue("@Password", DBNull.Value);
        command.Parameters.AddWithValue("@Role", DBNull.Value);
        command.Parameters.AddWithValue("@Catelogid", DBNull.Value);
        command.Parameters.AddWithValue("@Dateofregister", DBNull.Value);
        command.Parameters.AddWithValue("@Profile_image", DBNull.Value);
        command.Parameters.AddWithValue("@Status", DBNull.Value);
        command.Parameters.AddWithValue("@Warehouseid", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 5); // Select by ID
        
        // Note: The stored procedure might need @Id parameter, adjust if needed
        var users = new List<Api.Models.RegistrationUserData>();
        using var reader = await command.ExecuteReaderAsync();
        
        if (await reader.ReadAsync())
        {
            users.Add(new Api.Models.RegistrationUserData
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                Userid = reader.IsDBNull(reader.GetOrdinal("Userid")) ? null : reader.GetString(reader.GetOrdinal("Userid")),
                Firstname = reader.IsDBNull(reader.GetOrdinal("Firstname")) ? null : reader.GetString(reader.GetOrdinal("Firstname")),
                Lastname = reader.IsDBNull(reader.GetOrdinal("Lastname")) ? null : reader.GetString(reader.GetOrdinal("Lastname")),
                Email = reader.IsDBNull(reader.GetOrdinal("Email")) ? null : reader.GetString(reader.GetOrdinal("Email")),
                Phone = reader.IsDBNull(reader.GetOrdinal("Phone")) ? null : reader.GetString(reader.GetOrdinal("Phone")),
                Role = reader.IsDBNull(reader.GetOrdinal("Role")) ? null : reader.GetString(reader.GetOrdinal("Role")),
                Catelogid = reader.IsDBNull(reader.GetOrdinal("Catelogid")) ? null : reader.GetString(reader.GetOrdinal("Catelogid")),
                Dateofregister = reader.IsDBNull(reader.GetOrdinal("Dateofregister")) ? null : reader.GetString(reader.GetOrdinal("Dateofregister")),
                Profile_image = reader.IsDBNull(reader.GetOrdinal("Profile_image")) ? null : reader.GetString(reader.GetOrdinal("Profile_image")),
                Status = reader.IsDBNull(reader.GetOrdinal("Status")) ? null : reader.GetString(reader.GetOrdinal("Status")),
                Warehouseid = reader.IsDBNull(reader.GetOrdinal("Warehouseid")) ? null : reader.GetString(reader.GetOrdinal("Warehouseid"))
            });
        }
        
        response.Success = true;
        response.Message = "User retrieved successfully";
        response.Users = users;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetUserById")
.WithOpenApi();

// POST: Create or update user
app.MapPost("/api/user", async (UserRegistrationRequest request, SqlConnection connection) =>
{
    var response = new UserRegistrationResponse();
    
    try
    {
        await connection.OpenAsync();
        
        // Determine query type: 1=Insert, 3=Update (matches SP logic)
        // SP_UserRegistration: 1=Insert, 2=Select, 3=Update, 4=UpdateStatus, 5=SelectById
        int queryType = request.Id.HasValue && request.Id > 0 ? 3 : 1;
        
        // Generate Userid if not provided (for new users)
        if (string.IsNullOrEmpty(request.Userid) && queryType == 1)
        {
            // Default count-based ID logic as requested
            try
            {
                using var countCommand = new SqlCommand("SELECT COUNT(*) FROM Tbl_Registration", connection);
                int count = (int)await countCommand.ExecuteScalarAsync();
                int nextId = count + 1;
                // Format: ASAS00 + number (e.g. ASAS0020)
                // If user wants ASAS00 concatenated with the number:
                request.Userid = "ASAS00" + nextId; 
            }
            catch
            {
                // Fallback if DB query fails. 
                // Using a random number to avoid timestamp confusion, 
                // but keeping ASAS00 prefix to look "normal"
                request.Userid = $"ASAS00{new Random().Next(1000, 9999)}";
            }
        }
        
        // Set registration date if not provided
        if (string.IsNullOrEmpty(request.Dateofregister) && queryType == 1)
        {
            request.Dateofregister = DateTime.Now.ToString("yyyy-MM-dd");
        }
        
        using var command = new SqlCommand("Sp_UserRegistration", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Userid", (object?)request.Userid ?? DBNull.Value);
        command.Parameters.AddWithValue("@Firstname", (object?)request.Firstname ?? DBNull.Value);
        command.Parameters.AddWithValue("@Lastname", (object?)request.Lastname ?? DBNull.Value);
        command.Parameters.AddWithValue("@Email", (object?)request.Email ?? DBNull.Value);
        command.Parameters.AddWithValue("@Phone", (object?)request.Phone ?? DBNull.Value);
        command.Parameters.AddWithValue("@Password", (object?)request.Password ?? DBNull.Value);
        command.Parameters.AddWithValue("@Role", (object?)request.Role ?? DBNull.Value);
        command.Parameters.AddWithValue("@Catelogid", (object?)request.Catelogid ?? DBNull.Value);
        command.Parameters.AddWithValue("@Dateofregister", (object?)request.Dateofregister ?? DBNull.Value);
        command.Parameters.AddWithValue("@Profile_image", (object?)request.Profile_image ?? DBNull.Value);
        command.Parameters.AddWithValue("@Status", (object?)request.Status ?? DBNull.Value);
        command.Parameters.AddWithValue("@Warehouseid", (object?)request.Warehouseid ?? DBNull.Value);
        command.Parameters.AddWithValue("@Query", queryType);
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Success = true;
        response.Message = queryType == 1 ? "User created successfully" : "User updated successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("CreateOrUpdateUser")
.WithOpenApi();

// DELETE: Delete user
app.MapDelete("/api/user/{id}", async (int id, SqlConnection connection) =>
{
    var response = new UserRegistrationResponse();
    
    try
    {
        await connection.OpenAsync();
        
        // 1. Fetch Userid first because SP needs it for deletion
        var getIdCmd = new SqlCommand("SELECT Userid FROM Tbl_Registration WHERE Id = @Id", connection);
        getIdCmd.Parameters.AddWithValue("@Id", id);
        
        var userIdObj = await getIdCmd.ExecuteScalarAsync();
        
        if (userIdObj == null)
        {
            response.Success = false;
            response.Message = "User not found";
            return Results.Json(response);
        }
        
        string userId = userIdObj.ToString()!;

        // 2. Perform Soft Delete (Query=4, Status='Inactive')
        using var command = new SqlCommand("Sp_UserRegistration", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Userid", userId); // Pass the fetched Userid
        command.Parameters.AddWithValue("@Firstname", DBNull.Value);
        command.Parameters.AddWithValue("@Lastname", DBNull.Value);
        command.Parameters.AddWithValue("@Email", DBNull.Value);
        command.Parameters.AddWithValue("@Phone", DBNull.Value);
        command.Parameters.AddWithValue("@Password", DBNull.Value);
        command.Parameters.AddWithValue("@Role", DBNull.Value);
        command.Parameters.AddWithValue("@Catelogid", DBNull.Value);
        command.Parameters.AddWithValue("@Dateofregister", DBNull.Value);
        command.Parameters.AddWithValue("@Profile_image", DBNull.Value);
        command.Parameters.AddWithValue("@Status", "Inactive");
        command.Parameters.AddWithValue("@Warehouseid", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 4); // Delete
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "User deleted successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("DeleteUser")
.WithOpenApi();

// ==========================================
// BRAND MANAGEMENT ENDPOINTS
// ==========================================

// GET: Fetch all brands (Query=5)
app.MapGet("/api/brand", async (SqlConnection connection) =>
{
    var brands = new List<dynamic>();
    
    try
    {
        await connection.OpenAsync();
        using var command = new SqlCommand("Brand", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Query", 5);
        command.Parameters.AddWithValue("@Userid", DBNull.Value);
        command.Parameters.AddWithValue("@Brand_id", DBNull.Value);
        command.Parameters.AddWithValue("@Brand", DBNull.Value);
        command.Parameters.AddWithValue("@Add_Date", DBNull.Value);
        command.Parameters.AddWithValue("@Brand_Logo", DBNull.Value);
        command.Parameters.AddWithValue("@Apluscontent", DBNull.Value);
        command.Parameters.AddWithValue("@Approved_Date", DBNull.Value);
        command.Parameters.AddWithValue("@Approved_By", DBNull.Value);
        command.Parameters.AddWithValue("@Brand_Status", DBNull.Value);
        command.Parameters.AddWithValue("@Reason", DBNull.Value);
        command.Parameters.AddWithValue("@Active_Status", "Active");
        
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            brands.Add(new
            {
                Id = reader["id"],
                Userid = reader["Userid"],
                Brand_id = reader["Brand_id"],
                Brand = reader["Brand"],
                Add_Date = reader["Add_Date"],
                Brand_Logo = reader["Brand_Logo"],
                Apluscontent = reader["Apluscontent"],
                Brand_Status = reader["Brand_Status"],
                Active_Status = reader["Active_Status"]
            });
        }
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error fetching brands: {ex.Message}");
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Ok(brands);
})
.WithName("GetBrands")
.WithOpenApi();

// POST: Create or Update Brand (Query=1 Insert, Query=2 Update)
app.MapPost("/api/brand", async (HttpRequest request, SqlConnection connection) =>
{
    var response = new { Success = false, Message = "" };
    
    try
    {
        if (!request.HasFormContentType)
        {
            return Results.Json(new { Success = false, Message = "Invalid content type" });
        }

        var form = await request.ReadFormAsync();
        string userid = form["Userid"].ToString();
        string brand_id = form["Brand_id"].ToString();
        string brand = form["Brand"].ToString();
        string brand_status = form["Brand_Status"].ToString();
        string active_status = form["Active_Status"].ToString();
        string aPlusContent = form["APlusContent"].ToString();
        string existingLogoPath = form["Brand_Logo_Path"].ToString();
        
        string logoPath = existingLogoPath;
        
        var file = form.Files.GetFile("Brand_Logo");
        if (file != null && file.Length > 0)
        {
            string uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Content", "images", "Brandlogo");
            Directory.CreateDirectory(uploadsFolder);
            
            string fileExtension = Path.GetExtension(file.FileName);
            string fileName = $"{brand.Replace(" ", "_")}_{DateTime.Now:yyyyMMddHHmmss}{fileExtension}";
            string filePath = Path.Combine(uploadsFolder, fileName);
            
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
            
            logoPath = $"/Content/images/Brandlogo/{fileName}";
        }
        
        await connection.OpenAsync();
        
        int queryType = !string.IsNullOrEmpty(brand_id) ? 2 : 1;
        
        if (queryType == 1)
        {
            try 
            {
                using var countCmd = new SqlCommand("SELECT COUNT(*) FROM Tbl_Brand", connection);
                int count = (int)await countCmd.ExecuteScalarAsync();
                brand_id = "B" + (count + 1);
            }
            catch
            {
                brand_id = "B" + new Random().Next(1000,9999);
            }
        }
        
        string addDate = DateTime.Now.ToString("dd-MM-yyyy hh:mm tt");
        
        using var command = new SqlCommand("Brand", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Userid", (object?)userid ?? DBNull.Value);
        command.Parameters.AddWithValue("@Brand_id", (object?)brand_id ?? DBNull.Value);
        command.Parameters.AddWithValue("@Brand", (object?)brand ?? DBNull.Value);
        command.Parameters.AddWithValue("@Add_Date", addDate);
        command.Parameters.AddWithValue("@Brand_Logo", (object?)logoPath ?? DBNull.Value);
        command.Parameters.AddWithValue("@Apluscontent", aPlusContent == "true" ? "on" : "off");
        command.Parameters.AddWithValue("@Approved_Date", DBNull.Value);
        command.Parameters.AddWithValue("@Approved_By", DBNull.Value);
        command.Parameters.AddWithValue("@Brand_Status", (object?)brand_status ?? "Pending");
        command.Parameters.AddWithValue("@Reason", DBNull.Value);
        command.Parameters.AddWithValue("@Active_Status", (object?)active_status ?? "Active");
        command.Parameters.AddWithValue("@Query", queryType);
              
        await command.ExecuteNonQueryAsync();
        
        return Results.Json(new { Success = true, Message = queryType == 1 ? "Brand created successfully" : "Brand updated successfully" });
    }
    catch (Exception ex)
    {
        return Results.Json(new { Success = false, Message = $"Error: {ex.Message}" });
    }
    finally
    {
         if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
})
.WithName("CreateOrUpdateBrand")
.DisableAntiforgery()
.WithOpenApi();

// DELETE: Soft Delete Brand (Query=3)
app.MapDelete("/api/brand/{brand_id}", async (string brand_id, SqlConnection connection) =>
{
     var response = new { Success = false, Message = "" };
    
    try
    {
        await connection.OpenAsync();
        using var command = new SqlCommand("Brand", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Userid", DBNull.Value);
        command.Parameters.AddWithValue("@Brand_id", brand_id);
        command.Parameters.AddWithValue("@Brand", DBNull.Value);
        command.Parameters.AddWithValue("@Add_Date", DBNull.Value);
        command.Parameters.AddWithValue("@Brand_Logo", DBNull.Value);
        command.Parameters.AddWithValue("@Apluscontent", DBNull.Value);
        command.Parameters.AddWithValue("@Approved_Date", DBNull.Value);
        command.Parameters.AddWithValue("@Approved_By", DBNull.Value);
        command.Parameters.AddWithValue("@Brand_Status", DBNull.Value);
        command.Parameters.AddWithValue("@Reason", DBNull.Value);
        command.Parameters.AddWithValue("@Active_Status", "Inactive"); // Soft delete
        command.Parameters.AddWithValue("@Query", 3); // Query 3 is Update Active_Status
        
        await command.ExecuteNonQueryAsync();
        
        return Results.Json(new { Success = true, Message = "Brand deleted successfully" });
    }
    catch (Exception ex)
    {
        return Results.Json(new { Success = false, Message = $"Error: {ex.Message}" });
    }
    finally
    {
         if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
})
.WithName("DeleteBrand")
.WithOpenApi();

// Category Management Endpoints

// GET: Fetch categories with optional pagination (Query=4)
app.MapGet("/api/category", async (int? page, int? pageSize, string? search, SqlConnection connection) =>
{
    var categoryList = new List<dynamic>();
    int totalCount = 0;
    
    try
    {
        await connection.OpenAsync();
        
        // 1. Get Categories
        using var command = new SqlCommand("Category", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };

        command.Parameters.AddWithValue("@Query", 4);
        command.Parameters.AddWithValue("@Active_Status", "Active");
        command.Parameters.AddWithValue("@id", DBNull.Value);
        command.Parameters.AddWithValue("@Userid", DBNull.Value);
        command.Parameters.AddWithValue("@Parentid", DBNull.Value);
        command.Parameters.AddWithValue("@Name", string.IsNullOrEmpty(search) ? DBNull.Value : search);
        command.Parameters.AddWithValue("@Catelogid", DBNull.Value);
        command.Parameters.AddWithValue("@Add_Date", DBNull.Value);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            categoryList.Add(new
            {
                Id = reader["id"],
                Userid = reader["Userid"],
                Parentid = reader["Parentid"] == DBNull.Value ? 0 : reader["Parentid"],
                Name = reader["Name"]?.ToString() ?? "",
                Catelogid = reader["Catelogid"],
                Add_Date = reader["Add_Date"],
                Active_Status = reader["Active_Status"]
            });
        }
        await reader.CloseAsync();

        // 2. Perform Search Filtering in C# (since SP Query 4 doesn't filter)
        var filteredData = categoryList.AsEnumerable();
        if (!string.IsNullOrEmpty(search))
        {
            filteredData = filteredData.Where(c => 
                (c.Name != null && c.Name.ToLower().Contains(search.ToLower())) || 
                (c.Id != null && c.Id.ToString().Contains(search))
            );
        }

        totalCount = filteredData.Count();

        // 3. Perform Pagination in C#
        if (page.HasValue && pageSize.HasValue)
        {
            int p = page.Value > 0 ? page.Value : 1;
            int ps = pageSize.Value > 0 ? pageSize.Value : 10;
            
            var pagedData = filteredData
                .Skip((p - 1) * ps)
                .Take(ps)
                .ToList();

            return Results.Ok(new { 
                data = pagedData, 
                totalCount = totalCount,
                page = p,
                pageSize = ps,
                totalPages = (int)Math.Ceiling((double)totalCount / ps)
            });
        }
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error fetching categories: {ex.Message}");
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
    
    return Results.Ok(categoryList);
})
.WithName("GetCategories")
.WithOpenApi();

// POST: Create or Update Category (Query=1 Insert, Query=2 Update)
app.MapPost("/api/category", async (HttpRequest request, SqlConnection connection) =>
{
    try
    {
        if (!request.HasFormContentType)
        {
            return Results.Json(new { Success = false, Message = "Invalid content type" });
        }

        var form = await request.ReadFormAsync();
        string idStr = form["id"].ToString();
        string userid = form["Userid"].ToString();
        string parentidStr = form["Parentid"].ToString();
        string name = form["Name"].ToString();
        string catelogid = form["Catelogid"].ToString();
        string active_status = form["Active_Status"].ToString();

        int id = string.IsNullOrEmpty(idStr) ? 0 : int.Parse(idStr);
        int parentid = string.IsNullOrEmpty(parentidStr) ? 0 : int.Parse(parentidStr);
        int queryType = id > 0 ? 2 : 1;

        await connection.OpenAsync();
        
        using var command = new SqlCommand("Category", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };

        command.Parameters.AddWithValue("@id", id > 0 ? id : DBNull.Value);
        command.Parameters.AddWithValue("@Userid", (object?)userid ?? DBNull.Value);
        command.Parameters.AddWithValue("@Parentid", parentid);
        command.Parameters.AddWithValue("@Name", (object?)name ?? DBNull.Value);
        command.Parameters.AddWithValue("@Catelogid", (object?)catelogid ?? DBNull.Value);
        command.Parameters.AddWithValue("@Add_Date", DateTime.Now.ToString("dd-MM-yyyy hh:mm tt"));
        command.Parameters.AddWithValue("@Active_Status", (object?)active_status ?? "Active");
        command.Parameters.AddWithValue("@Query", queryType);

        await command.ExecuteNonQueryAsync();
        
        return Results.Json(new { Success = true, Message = queryType == 1 ? "Category created successfully" : "Category updated successfully" });
    }
    catch (Exception ex)
    {
        return Results.Json(new { Success = false, Message = $"Error: {ex.Message}" });
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
})
.WithName("CreateOrUpdateCategory")
.DisableAntiforgery()
.WithOpenApi();

// DELETE: Soft Delete Category (We'll use Query=2 to set Active_Status="Inactive")
app.MapDelete("/api/category/{id}", async (int id, SqlConnection connection) =>
{
    try
    {
        await connection.OpenAsync();
        
        // Fetch existing category data first to perform update
        using var getCmd = new SqlCommand("Category", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        getCmd.Parameters.AddWithValue("@id", id);
        getCmd.Parameters.AddWithValue("@Query", 3); // Query 3 selects Name by id
        getCmd.Parameters.AddWithValue("@Userid", DBNull.Value);
        getCmd.Parameters.AddWithValue("@Parentid", DBNull.Value);
        getCmd.Parameters.AddWithValue("@Name", DBNull.Value);
        getCmd.Parameters.AddWithValue("@Catelogid", DBNull.Value);
        getCmd.Parameters.AddWithValue("@Add_Date", DBNull.Value);
        getCmd.Parameters.AddWithValue("@Active_Status", DBNull.Value);

        string name = "";
        using (var reader = await getCmd.ExecuteReaderAsync())
        {
            if (await reader.ReadAsync())
            {
                name = reader["Name"].ToString() ?? "";
            }
        }

        using var command = new SqlCommand("Category", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };

        command.Parameters.AddWithValue("@id", id);
        command.Parameters.AddWithValue("@Userid", DBNull.Value);
        command.Parameters.AddWithValue("@Parentid", 0); // Need to pass something
        command.Parameters.AddWithValue("@Name", name);
        command.Parameters.AddWithValue("@Catelogid", DBNull.Value);
        command.Parameters.AddWithValue("@Add_Date", DateTime.Now.ToString("dd-MM-yyyy hh:mm tt"));
        command.Parameters.AddWithValue("@Active_Status", "Inactive");
        command.Parameters.AddWithValue("@Query", 2); // Update

        await command.ExecuteNonQueryAsync();
        
        return Results.Json(new { Success = true, Message = "Category deleted successfully" });
    }
    catch (Exception ex)
    {
        return Results.Json(new { Success = false, Message = $"Error: {ex.Message}" });
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
})
.WithName("DeleteCategory")
.WithOpenApi();

// GET: Fetch products with filtering
app.MapGet("/api/product", async (int? page, int? pageSize, string? search, string? userid, string? status, string? catelogid, SqlConnection connection) =>
{
    var products = new List<dynamic>();
    int totalCount = 0;
    
    try
    {
        int p = page ?? 1;
        int ps = pageSize ?? 10;
        await connection.OpenAsync();

        // 1. Fetch Data
        var sql = @"
            SELECT p.*, c.Name as CategoryName, b.Brand as BrandName, u.Role as CreatorRole, u.Firstname as CreatorName
            FROM Tbl_Product p
            LEFT JOIN Tbl_Category c ON p.Category_id = c.Id
            LEFT JOIN Tbl_Brand b ON p.Brand_id = b.Brand_id
            LEFT JOIN Tbl_Registration u ON p.Userid = u.Userid
            WHERE p.Isdelete = 0
            AND (
                @Userid = 'ADMIN' 
                OR CAST(u.Catelogid AS VARCHAR(50)) = @Catelogid
                OR (u.Catelogid IS NOT NULL AND @Catelogid LIKE '%' + CAST(u.Catelogid AS VARCHAR(50)) + '%')
                OR (@Catelogid IS NULL OR @Catelogid = '')
            )";

        if (!string.IsNullOrEmpty(status)) {
            // Handle '0' specifically to include NULLs if needed, or strictly '0'
            if (status == "0") {
                sql += " AND (p.Approved_Status = '0' OR p.Approved_Status IS NULL) ";
            } else {
                sql += " AND p.Approved_Status = @Status ";
            }
        }

        if (!string.IsNullOrEmpty(search)) {
            sql += " AND (p.Product_name LIKE @Search OR p.Product_id LIKE @Search) ";
        }
        
        sql += " ORDER BY p.Product_uploaddate DESC OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY";

        using (var command = new SqlCommand(sql, connection))
        {
            command.Parameters.AddWithValue("@Userid", userid ?? "");
            command.Parameters.AddWithValue("@Catelogid", catelogid ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@Search", "%" + search + "%");
            command.Parameters.AddWithValue("@Status", status ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@Skip", (p - 1) * ps);
            command.Parameters.AddWithValue("@Take", ps);
            
            using (var reader = await command.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    var item = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        var name = reader.GetName(i).ToLower();
                        var value = reader.GetValue(i);
                        item[name] = value == DBNull.Value ? null : value;
                    }
                    
                    // Add snake_case aliases for frontend compatibility
                    if (item.ContainsKey("product_name")) item["product_name"] = item["product_name"];
                    if (item.ContainsKey("product_id")) item["product_id"] = item["product_id"];
                    if (item.ContainsKey("brand_name")) item["brand_name"] = item["brand_name"];
                    if (item.ContainsKey("brandname")) item["brand_name"] = item["brandname"];
                    if (item.ContainsKey("brand_id")) item["brand_id"] = item["brand_id"];
                    if (item.ContainsKey("category_id")) item["category_id"] = item["category_id"];
                    if (item.ContainsKey("categoryname")) item["categoryname"] = item["categoryname"];
                    if (item.ContainsKey("creatorname")) item["creatorname"] = item["creatorname"];
                    if (item.ContainsKey("creatorrole")) item["creatorrole"] = item["creatorrole"];
                    
                    products.Add(item);
                }
            }
        }

        var countSql = @"
            SELECT COUNT(*) 
            FROM Tbl_Product p
            LEFT JOIN Tbl_Registration u ON p.Userid = u.Userid
            WHERE p.Isdelete = 0
            AND (
                @Userid = 'ADMIN' 
                OR CAST(u.Catelogid AS VARCHAR(50)) = @Catelogid
                OR (u.Catelogid IS NOT NULL AND @Catelogid LIKE '%' + CAST(u.Catelogid AS VARCHAR(50)) + '%')
                OR (@Catelogid IS NULL OR @Catelogid = '')
            )";

        if (!string.IsNullOrEmpty(search)) {
            countSql += " AND (p.Product_name LIKE @Search OR p.Product_id LIKE @Search) ";
        }

        if (!string.IsNullOrEmpty(status)) {
            if (status == "0") {
                countSql += " AND (p.Approved_Status = '0' OR p.Approved_Status IS NULL) ";
            } else {
                countSql += " AND p.Approved_Status = @Status ";
            }
        }

        using (var countCmd = new SqlCommand(countSql, connection))
        {
            countCmd.Parameters.AddWithValue("@Userid", userid ?? "");
            countCmd.Parameters.AddWithValue("@Catelogid", catelogid ?? (object)DBNull.Value);
            countCmd.Parameters.AddWithValue("@Search", "%" + search + "%");
            countCmd.Parameters.AddWithValue("@Status", status ?? (object)DBNull.Value);
            var resultObj = await countCmd.ExecuteScalarAsync();
            totalCount = Convert.ToInt32(resultObj ?? 0);
        }

        return Results.Ok(new { 
            data = products, 
            totalCount = totalCount,
            page = p,
            pageSize = ps,
            totalPages = ps > 0 ? (int)Math.Ceiling((double)totalCount / ps) : 1
        });
    }
    catch (Exception ex)
    {
        return Results.Json(new { Success = false, Message = ex.Message, Trace = ex.StackTrace });
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
})
.WithName("GetProducts")
.WithOpenApi();

// POST: Create Product with Multipart Form Data (Images + JSON)
app.MapPost("/api/product", async (HttpRequest request, SqlConnection connection) =>
{
    try
    {
        if (!request.HasFormContentType)
        {
            return Results.Json(new { Success = false, Message = "Invalid content type" });
        }

        var form = await request.ReadFormAsync();
        
        // Basic Info
        string productName = form["Product_name"].ToString();
        string categoryId = form["Category_id"].ToString();
        string brandId = form["Brand_id"].ToString();
        string priority = form["Priority"].ToString();
        string description = form["Product_Description"].ToString();
        string taskDescription = form["Task_description"].ToString();
        string status = form["Product_Status"].ToString();
        string userid = form["Userid"].ToString();
        
        // Serialized Dynamic Data
        string featuresJson = form["Product_features"].ToString();
        string specsJson = form["Specifications"].ToString();

        // Complex Data Processing: Parse JSON arrays
        var featuresList = System.Text.Json.JsonSerializer.Deserialize<List<string>>(featuresJson) ?? new List<string>();
        var specsList = System.Text.Json.JsonSerializer.Deserialize<List<System.Text.Json.JsonElement>>(specsJson) ?? new List<System.Text.Json.JsonElement>();

        await connection.OpenAsync();

        // VALIDATION: Check for Duplicate Product Name in same Category
        try {
            // Try Tbl_Product first
            using (var checkCmd = new SqlCommand("SELECT COUNT(*) FROM Tbl_Product WHERE Product_name = @Name AND Category_id = @CatId", connection))
            {
                checkCmd.Parameters.AddWithValue("@Name", productName);
                checkCmd.Parameters.AddWithValue("@CatId", categoryId);
                int exists = (int)await checkCmd.ExecuteScalarAsync();
                if (exists > 0) return Results.Json(new { Success = false, Message = "Product with this name already exists in this category." });
            }
        } catch {
            try {
                // Fallback to Product
                using (var checkCmd = new SqlCommand("SELECT COUNT(*) FROM Product WHERE Product_name = @Name AND Category_id = @CatId", connection))
                {
                    checkCmd.Parameters.AddWithValue("@Name", productName);
                    checkCmd.Parameters.AddWithValue("@CatId", categoryId);
                    int exists = (int)await checkCmd.ExecuteScalarAsync();
                    if (exists > 0) return Results.Json(new { Success = false, Message = "Product with this name already exists in this category." });
                }
            } catch {
                // Ignore validation error if tables are missing, let the Insert fail naturally
            }
        }
        
        // Generate Sequential Product ID: Get Max numeric value and increment
        string productId = "P1";
        try {
            // Try Tbl_Product first
            string idQuery = "SELECT ISNULL(MAX(CAST(SUBSTRING(Product_id, 2, LEN(Product_id)-1) AS INT)), 0) FROM Tbl_Product WHERE Product_id LIKE 'P%'";
            using (var maxCmd = new SqlCommand(idQuery, connection)) {
                int maxId = (int)await maxCmd.ExecuteScalarAsync();
                productId = "P" + (maxId + 1);
            }
        } catch {
            try {
                // Fallback to Product
                string idQuery = "SELECT ISNULL(MAX(CAST(SUBSTRING(Product_id, 2, LEN(Product_id)-1) AS INT)), 0) FROM Product WHERE Product_id LIKE 'P%'";
                using (var maxCmd = new SqlCommand(idQuery, connection)) {
                    int maxId = (int)await maxCmd.ExecuteScalarAsync();
                    productId = "P" + (maxId + 1);
                }
            } catch (Exception ex) {
                return Results.Json(new { Success = false, Message = "Product ID Generation Error: " + ex.Message });
            }
        }

        // Fetch Catelogid from Tbl_Registration
        string catalogIdValue = "";
        using (var catCmd = new SqlCommand("SELECT Catelogid FROM Tbl_Registration WHERE Userid = @Userid", connection))
        {
            catCmd.Parameters.AddWithValue("@Userid", userid);
            var result = await catCmd.ExecuteScalarAsync();
            catalogIdValue = result?.ToString() ?? "";
        }

        // 1. Create Main Product record
        using (var command = new SqlCommand("Product", connection))
        {
            command.CommandType = System.Data.CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@Query", 1);
            command.Parameters.AddWithValue("@Userid", userid);
            command.Parameters.AddWithValue("@Product_id", productId);
            command.Parameters.AddWithValue("@Brand_id", brandId);
            command.Parameters.AddWithValue("@Category_id", categoryId);
            command.Parameters.AddWithValue("@Product_name", productName);
            command.Parameters.AddWithValue("@Product_Description", description);
            command.Parameters.AddWithValue("@Product_features", featuresJson);
            command.Parameters.AddWithValue("@Task_description", taskDescription);
            command.Parameters.AddWithValue("@Priority", priority);
            command.Parameters.AddWithValue("@Product_Status", status);
            command.Parameters.AddWithValue("@Product_uploaddate", DateTime.Now.ToString("dd-MM-yyyy HH:mm:ss"));
            command.Parameters.AddWithValue("@Isdelete", 0);
            
            // Fill remaining required SP parameters with DBNull
            command.Parameters.AddWithValue("@id", DBNull.Value);
            command.Parameters.AddWithValue("@Brand_name", DBNull.Value);
            command.Parameters.AddWithValue("@Subcategory_id", DBNull.Value);
            command.Parameters.AddWithValue("@Subcategory_name", DBNull.Value);
            command.Parameters.AddWithValue("@Apluscontent", "Images:0");
            command.Parameters.AddWithValue("@Actual_price", DBNull.Value);
            command.Parameters.AddWithValue("@Offer_price", DBNull.Value);
            command.Parameters.AddWithValue("@Sales_price", DBNull.Value);
            command.Parameters.AddWithValue("@Retail_qty", DBNull.Value);
            command.Parameters.AddWithValue("@Retail_price", DBNull.Value);
            command.Parameters.AddWithValue("@AcceptedUserid", DBNull.Value);
            command.Parameters.AddWithValue("@AcceptedDate", DBNull.Value);
            command.Parameters.AddWithValue("@Accepting_Status", DBNull.Value);
            command.Parameters.AddWithValue("@CompletedDate", DBNull.Value);
            command.Parameters.AddWithValue("@Approved_Status", "0");
            command.Parameters.AddWithValue("@Start_date", DBNull.Value);
            command.Parameters.AddWithValue("@End_date", DBNull.Value);
            command.Parameters.AddWithValue("@Hash_Tags", DBNull.Value);
            command.Parameters.AddWithValue("@Catelogid", string.IsNullOrEmpty(catalogIdValue) ? DBNull.Value : (object)catalogIdValue);

            await command.ExecuteNonQueryAsync();
        }

        // 2. Save Features using Sp_Features
        foreach (var feature in featuresList)
        {
            if (string.IsNullOrWhiteSpace(feature)) continue;
            using (var cmdFeat = new SqlCommand("Sp_Features", connection))
            {
                cmdFeat.CommandType = System.Data.CommandType.StoredProcedure;
                cmdFeat.Parameters.AddWithValue("@Query", 1);
                cmdFeat.Parameters.AddWithValue("@Productid", productId);
                cmdFeat.Parameters.AddWithValue("@Features", feature);
                cmdFeat.Parameters.AddWithValue("@Isdelete", "0");
                cmdFeat.Parameters.AddWithValue("@Status", "Active");
                cmdFeat.Parameters.AddWithValue("@Id", 0);
                await cmdFeat.ExecuteNonQueryAsync();
            }
        }

        // 3. Save Specifications using Specification
        int rowIndex = 1;
        foreach (var spec in specsList)
        {
            string param = spec.GetProperty("parameter").GetString() ?? "";
            string desc = spec.GetProperty("description").GetString() ?? "";
            
            if (string.IsNullOrWhiteSpace(param) && string.IsNullOrWhiteSpace(desc)) continue;

            using (var cmdSpec = new SqlCommand("Specification", connection))
            {
                cmdSpec.CommandType = System.Data.CommandType.StoredProcedure;
                cmdSpec.Parameters.AddWithValue("@id", "");
                cmdSpec.Parameters.AddWithValue("@Userid", userid);
                cmdSpec.Parameters.AddWithValue("@Product_id", productId);
                cmdSpec.Parameters.AddWithValue("@Product_Name", productName);
                cmdSpec.Parameters.AddWithValue("@Category", param);
                cmdSpec.Parameters.AddWithValue("@Specification", desc);
                cmdSpec.Parameters.AddWithValue("@Rowcounts", rowIndex++);
                cmdSpec.Parameters.AddWithValue("@Query", 1);
                await cmdSpec.ExecuteNonQueryAsync();
            }
        }
        
        return Results.Json(new { Success = true, Message = "Product created successfully!" });
    }
    catch (Exception ex)
    {
        return Results.Json(new { Success = false, Message = $"Error: {ex.Message}" });
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
})
.WithName("CreateProduct")
.DisableAntiforgery()
.WithOpenApi();

// PUT: Update Product
app.MapPut("/api/product/{id}", async (string id, HttpRequest request, SqlConnection connection) =>
{
    try
    {
        if (!request.HasFormContentType)
        {
            return Results.Json(new { Success = false, Message = "Invalid content type" });
        }

        var form = await request.ReadFormAsync();
        
        // Basic Info
        string productName = form["Product_name"].ToString();
        string categoryId = form["Category_id"].ToString();
        string brandId = form["Brand_id"].ToString();
        string priority = form["Priority"].ToString();
        string description = form["Product_Description"].ToString();
        string taskDescription = form["Task_description"].ToString();
        string status = form["Product_Status"].ToString();
        string userid = form["Userid"].ToString();
        
        // Serialized Dynamic Data
        string featuresJson = form["Product_features"].ToString();
        string specsJson = form["Specifications"].ToString();

        await connection.OpenAsync();

        // Fetch Catelogid from Tbl_Registration
        string catalogIdValue = "";
        using (var catCmd = new SqlCommand("SELECT Catelogid FROM Tbl_Registration WHERE Userid = @Userid", connection))
        {
            catCmd.Parameters.AddWithValue("@Userid", userid);
            var result = await catCmd.ExecuteScalarAsync();
            catalogIdValue = result?.ToString() ?? "";
        }

        // Update Main Product record
        using (var command = new SqlCommand("Product", connection))
        {
            command.CommandType = System.Data.CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@Query", 10); // Update
            command.Parameters.AddWithValue("@Userid", userid);
            command.Parameters.AddWithValue("@Product_id", id);
            command.Parameters.AddWithValue("@Brand_id", brandId);
            command.Parameters.AddWithValue("@Category_id", categoryId);
            command.Parameters.AddWithValue("@Product_name", productName);
            command.Parameters.AddWithValue("@Product_Description", description);
            command.Parameters.AddWithValue("@Product_features", featuresJson);
            command.Parameters.AddWithValue("@Task_description", taskDescription);
            command.Parameters.AddWithValue("@Priority", priority);
            command.Parameters.AddWithValue("@Product_Status", status);
            command.Parameters.AddWithValue("@Product_uploaddate", DateTime.Now.ToString("dd-MM-yyyy HH:mm:ss"));
            command.Parameters.AddWithValue("@Isdelete", 0);
            command.Parameters.AddWithValue("@id", DBNull.Value);
            command.Parameters.AddWithValue("@Brand_name", DBNull.Value);
            command.Parameters.AddWithValue("@Subcategory_id", DBNull.Value);
            command.Parameters.AddWithValue("@Subcategory_name", DBNull.Value);
            command.Parameters.AddWithValue("@Apluscontent", "Images:0");
            command.Parameters.AddWithValue("@Actual_price", form.ContainsKey("Actual_price") ? form["Actual_price"].ToString() : "0");
            command.Parameters.AddWithValue("@Offer_price", form.ContainsKey("Offer_price") ? form["Offer_price"].ToString() : "0");
            command.Parameters.AddWithValue("@Sales_price", form.ContainsKey("Sales_price") ? form["Sales_price"].ToString() : "0");
            command.Parameters.AddWithValue("@Retail_qty", form.ContainsKey("Retail_qty") ? form["Retail_qty"].ToString() : "0");
            command.Parameters.AddWithValue("@Retail_price", form.ContainsKey("Retail_price") ? form["Retail_price"].ToString() : "0");
            command.Parameters.AddWithValue("@AcceptedUserid", DBNull.Value);
            command.Parameters.AddWithValue("@AcceptedDate", DBNull.Value);
            command.Parameters.AddWithValue("@Accepting_Status", form.ContainsKey("Accepting_Status") ? form["Accepting_Status"].ToString() : "1");
            command.Parameters.AddWithValue("@CompletedDate", DBNull.Value);
            command.Parameters.AddWithValue("@Approved_Status", form.ContainsKey("Approved_Status") ? form["Approved_Status"].ToString() : "0");
            command.Parameters.AddWithValue("@Start_date", DBNull.Value);
            command.Parameters.AddWithValue("@End_date", DBNull.Value);
            command.Parameters.AddWithValue("@Hash_Tags", DBNull.Value);
            command.Parameters.AddWithValue("@Catelogid", string.IsNullOrEmpty(catalogIdValue) ? DBNull.Value : (object)catalogIdValue);

            await command.ExecuteNonQueryAsync();
        }

        // Parse JSON arrays for Features and Specifications
        var featuresList = System.Text.Json.JsonSerializer.Deserialize<List<string>>(featuresJson) ?? new List<string>();
        var specsList = System.Text.Json.JsonSerializer.Deserialize<List<System.Text.Json.JsonElement>>(specsJson) ?? new List<System.Text.Json.JsonElement>();

        // 2. Update Features: Delete old ones and insert new ones
        // First, delete existing features for this product
        using (var delFeatCmd = new SqlCommand("DELETE FROM Tbl_Features WHERE Productid = @ProductId", connection))
        {
            delFeatCmd.Parameters.AddWithValue("@ProductId", id);
            await delFeatCmd.ExecuteNonQueryAsync();
        }

        // Insert new features
        foreach (var feature in featuresList)
        {
            if (string.IsNullOrWhiteSpace(feature)) continue;
            using (var cmdFeat = new SqlCommand("Sp_Features", connection))
            {
                cmdFeat.CommandType = System.Data.CommandType.StoredProcedure;
                cmdFeat.Parameters.AddWithValue("@Query", 1);
                cmdFeat.Parameters.AddWithValue("@Productid", id);
                cmdFeat.Parameters.AddWithValue("@Features", feature);
                cmdFeat.Parameters.AddWithValue("@Isdelete", "0");
                cmdFeat.Parameters.AddWithValue("@Status", "Active");
                cmdFeat.Parameters.AddWithValue("@Id", 0);
                await cmdFeat.ExecuteNonQueryAsync();
            }
        }

        // 3. Update Specifications: Delete old ones and insert new ones
        // First, delete existing specifications for this product
        using (var delSpecCmd = new SqlCommand("DELETE FROM Tbl_productspecification WHERE Product_id = @ProductId", connection))
        {
            delSpecCmd.Parameters.AddWithValue("@ProductId", id);
            await delSpecCmd.ExecuteNonQueryAsync();
        }

        // Insert new specifications
        int rowIndex = 1;
        foreach (var spec in specsList)
        {
            string param = spec.GetProperty("parameter").GetString() ?? "";
            string desc = spec.GetProperty("description").GetString() ?? "";
            
            if (string.IsNullOrWhiteSpace(param) && string.IsNullOrWhiteSpace(desc)) continue;

            using (var cmdSpec = new SqlCommand("Specification", connection))
            {
                cmdSpec.CommandType = System.Data.CommandType.StoredProcedure;
                cmdSpec.Parameters.AddWithValue("@id", "");
                cmdSpec.Parameters.AddWithValue("@Userid", userid);
                cmdSpec.Parameters.AddWithValue("@Product_id", id);
                cmdSpec.Parameters.AddWithValue("@Product_Name", productName);
                cmdSpec.Parameters.AddWithValue("@Category", param);
                cmdSpec.Parameters.AddWithValue("@Specification", desc);
                cmdSpec.Parameters.AddWithValue("@Rowcounts", rowIndex++);
                cmdSpec.Parameters.AddWithValue("@Query", 1);
                await cmdSpec.ExecuteNonQueryAsync();
            }
        }
        
        return Results.Json(new { Success = true, Message = "Product updated successfully!" });
    }
    catch (Exception ex)
    {
        return Results.Json(new { Success = false, Message = $"Error: {ex.Message}" });
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
})
.WithName("UpdateProduct")
.DisableAntiforgery()
.WithOpenApi();

// GET: Fetch Product Features
app.MapGet("/api/product/features/{productId}", async (string productId, SqlConnection connection) =>
{
    var features = new List<dynamic>();
    try
    {
        await connection.OpenAsync();
        using var command = new SqlCommand("Sp_Features", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Query", 4); // Select by ProductId
        command.Parameters.AddWithValue("@Productid", productId);
        command.Parameters.AddWithValue("@Features", DBNull.Value);
        command.Parameters.AddWithValue("@Isdelete", DBNull.Value);
        command.Parameters.AddWithValue("@Status", DBNull.Value);
        command.Parameters.AddWithValue("@Id", DBNull.Value);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            features.Add(new {
                Id = reader["Id"],
                Features = reader["Features"],
                Status = reader["Status"]
            });
        }
        return Results.Ok(new { Success = true, Data = features });
    }
    catch (Exception ex)
    {
        return Results.Json(new { Success = false, Message = $"Error: {ex.Message}" });
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
})
.WithName("GetProductFeatures")
.WithOpenApi();

// GET: Fetch Product Specifications
app.MapGet("/api/product/specifications/{productId}", async (string productId, SqlConnection connection) =>
{
    var specs = new List<dynamic>();
    try
    {
        await connection.OpenAsync();
        using var command = new SqlCommand("Specification", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Query", 2); // Select by ProductId
        command.Parameters.AddWithValue("@Product_id", productId);
        // Fill other params with null/dummies as they aren't needed for Query 2
        command.Parameters.AddWithValue("@id", DBNull.Value);
        command.Parameters.AddWithValue("@Userid", DBNull.Value);
        command.Parameters.AddWithValue("@Product_Name", DBNull.Value);
        command.Parameters.AddWithValue("@Category", DBNull.Value);
        command.Parameters.AddWithValue("@Specification", DBNull.Value);
        command.Parameters.AddWithValue("@Rowcounts", DBNull.Value);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            specs.Add(new {
                Id = reader["id"],
                Category = reader["Category"], // Often used as 'Parameter' name
                Specification = reader["Specification"]
            });
        }
        return Results.Ok(new { Success = true, Data = specs });
    }
    catch (Exception ex)
    {
        return Results.Json(new { Success = false, Message = $"Error: {ex.Message}" });
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
})
.WithName("GetProductSpecifications")
.WithOpenApi();

// GET: Fetch Product Gallery
app.MapGet("/api/product/gallery/{productId}", async (string productId, SqlConnection connection) =>
{
    var gallery = new List<dynamic>();
    try
    {
        await connection.OpenAsync();
        using var command = new SqlCommand("SELECT * FROM Tbl_Gallery WHERE Product_id = @Pid", connection);
        command.Parameters.AddWithValue("@Pid", productId);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            gallery.Add(new {
                Id = reader["id"],
                Product_id = reader["Product_id"],
                Userid = reader["Userid"],
                Gallery_file = reader["Gallery_file"],
                File_id = reader["File_id"],
                Productvariants_id = reader["Productvariants_id"]
            });
        }
        return Results.Ok(new { Success = true, Data = gallery });
    }
    catch (Exception ex)
    {
        return Results.Json(new { Success = false, Message = $"Error: {ex.Message}" });
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
})
.WithName("GetProductGallery")
.WithOpenApi();

// DELETE: Delete single gallery item
app.MapDelete("/api/product/gallery/{id}", async (int id, SqlConnection connection) =>
{
    try
    {
        await connection.OpenAsync();
        using var command = new SqlCommand("DELETE FROM Tbl_Gallery WHERE id = @Id", connection);
        command.Parameters.AddWithValue("@Id", id);
        int rows = await command.ExecuteNonQueryAsync();
        
        if (rows > 0)
            return Results.Ok(new { Success = true, Message = "Gallery item deleted successfully" });
        else
            return Results.NotFound(new { Success = false, Message = "Gallery item not found" });
    }
    catch (Exception ex)
    {
        return Results.Json(new { Success = false, Message = $"Error: {ex.Message}" });
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
})
.WithName("DeleteGalleryItem")
.WithOpenApi();

/*
// GET: Fetch Product Variants
app.MapGet("/api/product/variants/{productId}", async (string productId, SqlConnection connection) =>
{
    var variants = new List<dynamic>();
    try
    {
        await connection.OpenAsync();
        
        // Optimized query matching the specific fields and logic requested (STUFF for concatenation)
        // Improved JOIN to handle cases where Userid might be the string ID or the integer primary key
        var query = @"
            DECLARE @TargetPid VARCHAR(50) = @Pid;
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
                Onlineprice varchar(max)
            );

            DECLARE @CurrentParentId INT;
            DECLARE curs CURSOR FOR  
               SELECT Id
               FROM Tbl_Productvariants
               WHERE Isdelete = 0 
                 AND LTRIM(RTRIM(Productid)) LIKE '%' + LTRIM(RTRIM(@TargetPid)) + '%'
                 AND (Parentid = 0 OR Parentid = '' OR Parentid IS NULL OR ISNUMERIC(Parentid) = 0 OR TRY_CAST(Parentid AS BIGINT) = 0);

            OPEN curs;
            FETCH NEXT FROM curs INTO @CurrentParentId;

            WHILE @@FETCH_STATUS = 0
            BEGIN
                INSERT INTO #TempResults12 (
                    allvalues, Id, Userid, Productid, Productname, Totalqty, Noofqty_online, Status, Brand, Firstname,
                    Modelno, Warehousecheck, Batchno, EANBarcodeno, Managerapprovestatus, Warehouseapprovestatus,
                    Accountsapprovestatus, Description, Itemname, Wholesaleprice, Retailprice, Onlineprice
                )
                SELECT TOP 1  
                    (STUFF((
                        SELECT ', ' + CONVERT(VARCHAR(100), Varianttype) + '-' + CONVERT(VARCHAR(100), Value)
                        FROM Tbl_Productvariants
                        WHERE (TRY_CAST(Parentid AS BIGINT) = @CurrentParentId OR Id = @CurrentParentId) AND (Isdelete=0)
                        FOR XML PATH('')
                    ), 1, 2, '')),
                    v.Id, v.Userid, v.Productid, v.Productname, v.Totalqty, v.Noofqty_online, v.Status, 
                    b.Brand, r.Firstname, v.Modelno, v.Warehousecheck, v.Batchno, v.EANBarcodeno,
                    v.Managerapprovestatus, v.Warehouseapprovestatus, v.Accountsapprovestatus, v.Description, v.Itemname,
                    v.Wholesaleprice, v.Retailprice, v.Onlineprice
                FROM Tbl_Productvariants v
                LEFT JOIN Tbl_Registration r ON v.Userid = r.Userid 
                LEFT JOIN Tbl_Brand b on v.Brandid = b.Brand_id 
                WHERE v.Id = @CurrentParentId
                ORDER BY v.Id ASC;

                FETCH NEXT FROM curs INTO @CurrentParentId;
            END

            CLOSE curs;
            DEALLOCATE curs;

            SELECT * FROM #TempResults12;
            DROP TABLE #TempResults12;";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@Pid", productId);

        using var reader = await command.ExecuteReaderAsync();
        
        var variantsList = new List<dynamic>();
        while (await reader.ReadAsync())
        {
            variantsList.Add(new {
                Id = reader["Id"],
                Productid = reader["Productid"],
                Userid = reader["Userid"],
                Itemname = reader["Itemname"] == DBNull.Value ? "" : reader["Itemname"].ToString(),
                VariantsAndValues = reader["allvalues"] == DBNull.Value ? "" : reader["allvalues"].ToString(),
                Totalqty = reader["Totalqty"] == DBNull.Value ? "0" : reader["Totalqty"].ToString(),
                Brand = reader["Brand"] == DBNull.Value ? "N/A" : reader["Brand"].ToString(),
                Username = reader["Firstname"] == DBNull.Value ? "Unknown" : reader["Firstname"].ToString(),
                Status = reader["Status"] == DBNull.Value ? "Inactive" : reader["Status"].ToString(),
                ManagerStatus = reader["Managerapprovestatus"] == DBNull.Value ? "Pending" : reader["Managerapprovestatus"].ToString(),
                WarehouseStatus = reader["Warehouseapprovestatus"] == DBNull.Value ? "Pending" : reader["Warehouseapprovestatus"].ToString(),
                AccountsStatus = reader["Accountsapprovestatus"] == DBNull.Value ? "Pending" : reader["Accountsapprovestatus"].ToString(),
                Onlineprice = reader["Onlineprice"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["Onlineprice"]),
                Wholesaleprice = reader["Wholesaleprice"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["Wholesaleprice"]),
                Retailprice = reader["Retailprice"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["Retailprice"]),
                Modelno = reader["Modelno"] == DBNull.Value ? "N/A" : reader["Modelno"].ToString(),
                Batchno = reader["Batchno"] == DBNull.Value ? "N/A" : reader["Batchno"].ToString(),
                Barcode = reader["EANBarcodeno"] == DBNull.Value ? "N/A" : reader["EANBarcodeno"].ToString(),
                Description = reader["Description"] == DBNull.Value ? "" : reader["Description"].ToString(),
                Short_description = reader["Short_description"] == DBNull.Value ? "" : reader["Short_description"].ToString(),
                Length = reader["Length"] == DBNull.Value ? "0" : reader["Length"].ToString(),
                Width = reader["Width"] == DBNull.Value ? "0" : reader["Width"].ToString(),
                Height = reader["Height"] == DBNull.Value ? "0" : reader["Height"].ToString(),
                Weight = reader["Weight"] == DBNull.Value ? "0" : reader["Weight"].ToString(),
                Standarduom = reader["Standarduom"] == DBNull.Value ? "N/A" : reader["Standarduom"].ToString(),
                Salesuom = reader["Salesuom"] == DBNull.Value ? "N/A" : reader["Salesuom"].ToString(),
                Purchaseuom = reader["Purchaseuom"] == DBNull.Value ? "N/A" : reader["Purchaseuom"].ToString(),
                Hscode = reader["Hscode"] == DBNull.Value ? "" : reader["Hscode"].ToString(),
                Country_orgin = reader["Country_orgin"] == DBNull.Value ? "" : reader["Country_orgin"].ToString(),
                Remarks = reader["Remarks"] == DBNull.Value ? "" : reader["Remarks"].ToString(),
                Brandid = reader["Brandid"] == DBNull.Value ? "" : reader["Brandid"].ToString()
            });
        }
        reader.Close();

        // 2. Fetch ALL Marketplaces for this product in ONE query
        var allMarketplaces = new List<dynamic>();
        using (var mpCmd = new SqlCommand("SELECT Marketplacename, Visibility, Link, Status, Productvariantsid FROM Tbl_Productmarketplace WHERE Productid = @Pid AND Isdelete = 0", connection))
        {
            mpCmd.Parameters.AddWithValue("@Pid", productId);
            using (var mpReader = await mpCmd.ExecuteReaderAsync())
            {
                while (await mpReader.ReadAsync())
                {
                    allMarketplaces.Add(new {
                        Marketplacename = mpReader["Marketplacename"]?.ToString(),
                        Visibility = mpReader["Visibility"],
                        Link = mpReader["Link"]?.ToString(),
                        Status = mpReader["Status"]?.ToString(),
                        VariantId = mpReader["Productvariantsid"]
                    });
                }
            }
        }

        // 3. Map Marketplaces and prepare final response
        var finalVariants = variantsList.Select(v => {
            var vid = v.Id.ToString();
            var variantMarketplaces = allMarketplaces
                .Where(m => m.VariantId != null && m.VariantId.ToString() == vid)
                .Select(m => new {
                    m.Marketplacename,
                    m.Visibility,
                    m.Link,
                    m.Status
                })
                .ToList();
                
            return new {
                Id = v.Id,
                Productid = v.Productid,
                Userid = v.Userid,
                Itemname = v.Itemname,
                VariantsAndValues = v.VariantsAndValues,
                Totalqty = v.Totalqty,
                Brand = v.Brand,
                Username = v.Username,
                Status = v.Status,
                ManagerStatus = v.ManagerStatus,
                WarehouseStatus = v.WarehouseStatus,
                AccountsStatus = v.AccountsStatus,
                Onlineprice = v.Onlineprice,
                Wholesaleprice = v.Wholesaleprice,
                Retailprice = v.Retailprice,
                Modelno = v.Modelno,
                Batchno = v.Batchno,
                Barcode = v.Barcode,
                Description = v.Description,
                Short_description = v.Short_description,
                Length = v.Length,
                Width = v.Width,
                Height = v.Height,
                Weight = v.Weight,
                Standarduom = v.Standarduom,
                Salesuom = v.Salesuom,
                Purchaseuom = v.Purchaseuom,
                Hscode = v.Hscode,
                Country_orgin = v.Country_orgin,
                Remarks = v.Remarks,
                Brandid = v.Brandid,
                Marketplaces = variantMarketplaces,
                MarketplaceData = variantMarketplaces // Support both keys
            };
        }).ToList();

        return Results.Ok(new { Success = true, Data = finalVariants });
    }
    catch (Exception ex)
    {
        return Results.Json(new { Success = false, Message = $"Error: {ex.Message}" });
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
})
.WithName("GetProductVariants")
.WithOpenApi();
*/

// POST: Approve Product
app.MapPost("/api/product/approve/{id}", async (string id, HttpRequest request, SqlConnection connection) => {
    try {
        var approverId = request.Headers["UserId"].ToString() ?? "ADMIN";
        await connection.OpenAsync();
        using var cmd = new SqlCommand("UPDATE Tbl_Product SET Approved_Status = '1', AcceptedUserid = @Uid, AcceptedDate = GETDATE() WHERE Product_id = @Pid", connection);
        cmd.Parameters.AddWithValue("@Uid", approverId);
        cmd.Parameters.AddWithValue("@Pid", id);
        int rows = await cmd.ExecuteNonQueryAsync();
        
        if (rows > 0) {
            // Log the approval
            using var logCmd = new SqlCommand("INSERT INTO Tbl_Productvariantssetlog (Productid, Userid, Actiontype, Date, Productvariantsid, Productsetid) VALUES (@Pid, @Uid, 'Approved', GETDATE(), 0, 0)", connection);
            logCmd.Parameters.AddWithValue("@Pid", id);
            logCmd.Parameters.AddWithValue("@Uid", approverId);
            await logCmd.ExecuteNonQueryAsync();
            return Results.Ok(new { success = true, message = "Product approved successfully!" });
        }
        return Results.Json(new { success = false, message = "Product not found or update failed." }, statusCode: 404);
    } catch (Exception ex) {
        return Results.Json(new { success = false, message = ex.Message }, statusCode: 500);
    } finally {
        if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
});

// POST: Reject Product
app.MapPost("/api/product/reject/{id}", async (string id, HttpRequest request, SqlConnection connection) => {
    try {
        var userid = request.Headers["UserId"].ToString() ?? "ADMIN";
        await connection.OpenAsync();
        using var cmd = new SqlCommand("UPDATE Tbl_Product SET Approved_Status = '2', AcceptedUserid = @Uid, AcceptedDate = GETDATE() WHERE Product_id = @Pid", connection);
        cmd.Parameters.AddWithValue("@Uid", userid);
        cmd.Parameters.AddWithValue("@Pid", id);
        int rows = await cmd.ExecuteNonQueryAsync();
        
        if (rows > 0) {
            // Log the rejection
            using var logCmd = new SqlCommand("INSERT INTO Tbl_Productvariantssetlog (Productid, Userid, Actiontype, Date, Productvariantsid, Productsetid) VALUES (@Pid, @Uid, 'Rejected', GETDATE(), 0, 0)", connection);
            logCmd.Parameters.AddWithValue("@Pid", id);
            logCmd.Parameters.AddWithValue("@Uid", userid);
            await logCmd.ExecuteNonQueryAsync();
            return Results.Ok(new { success = true, message = "Product rejected." });
        }
        return Results.Json(new { success = false, message = "Product not found." }, statusCode: 404);
    } catch (Exception ex) {
        return Results.Json(new { success = false, message = ex.Message }, statusCode: 500);
    } finally {
        if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
});


// GET: Fetch Pending Items (Variants) for Approval
app.MapGet("/api/item/pending", async (string? search, string? currentUserId, string? catelogid, int? page, int? pageSize, SqlConnection connection) =>
{
    var items = new List<dynamic>();
    int totalCount = 0;
    try
    {
        await connection.OpenAsync();
        
        // We use a temporary table to capture the SP results because Query 13 doesn't return Catelogid.
        // Then we join with Tbl_Registration to get the Catelogid for each item.
        string sql = @"
            DECLARE @Results TABLE (
                Userid VARCHAR(MAX),
                Username VARCHAR(MAX),
                Productid VARCHAR(MAX),
                Productname VARCHAR(MAX),
                Itemname VARCHAR(MAX),
                allvalues VARCHAR(MAX),
                Id INT
            );
            
            INSERT INTO @Results (Userid, Username, Productid, Productname, Itemname, allvalues, Id)
            EXEC Sp_Productvariants 
                @Id='', @Userid=@InUserid, @Productid='', @Productname='', @Varianttype='', @Value='', @Totalqty='', @Noofqty_online='', 
                @Modelno='', @Batchno='', @EANBarcodeno='', @Isdelete='', @Status='', @Warehousecheck='', @Managerapprovestatus='', 
                @Warehouseapprovestatus='', @Accountsapprovestatus='', @Date='', @Parentid='', @Ischild='', @Query=13;

            SELECT R.Catelogid, T.* 
            FROM @Results T
            LEFT JOIN Tbl_Registration R ON R.Userid = T.Userid
            ORDER BY T.Id DESC;
        ";

        using (var command = new SqlCommand(sql, connection))
        {
            command.Parameters.AddWithValue("@InUserid", currentUserId ?? "");
            
            using (var reader = await command.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    items.Add(new
                    {
                        Id = reader["Id"],
                        Userid = reader["Userid"] == DBNull.Value ? "" : reader["Userid"].ToString(),
                        Username = reader["Username"] == DBNull.Value ? "Unknown" : reader["Username"].ToString(),
                        Productid = reader["Productid"] == DBNull.Value ? "" : reader["Productid"].ToString(),
                        Productname = reader["Productname"] == DBNull.Value ? "" : reader["Productname"].ToString(),
                        Itemname = reader["Itemname"] == DBNull.Value ? "" : reader["Itemname"].ToString(),
                        allvalues = reader["allvalues"] == DBNull.Value ? "" : reader["allvalues"].ToString(),
                        Catelogid = reader["Catelogid"] == DBNull.Value ? "" : reader["Catelogid"].ToString()
                    });
                }
            }
        }

        // Apply filtering by Catelogid - trimming both to avoid whitespace issues
        if (!string.IsNullOrEmpty(catelogid))
        {
            string searchCatId = catelogid.Trim();
            items = items.Where(i => {
                string itemCatId = (i.Catelogid ?? "").ToString().Trim();
                return itemCatId == searchCatId;
            }).ToList();
        }

        // Apply text search filtering
        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            items = items.Where(i => 
                (i.Itemname?.ToLower().Contains(searchLower) ?? false) || 
                (i.Productname?.ToLower().Contains(searchLower) ?? false) || 
                (i.Username?.ToLower().Contains(searchLower) ?? false) ||
                (i.allvalues?.ToLower().Contains(searchLower) ?? false)
            ).ToList();
        }

        totalCount = items.Count;
        int p = page ?? 1;
        int ps = pageSize ?? 10;
        var paginatedItems = items.Skip((p - 1) * ps).Take(ps).ToList();

        return Results.Ok(new { success = true, data = paginatedItems, totalCount = totalCount });
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message }, statusCode: 500);
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
});

// POST: Process Item (Variant) Approval Response
app.MapPost("/api/item/response", async (ApprovalResponseRequest request, SqlConnection connection) =>
{
    try
    {
        await connection.OpenAsync();
        string statusVal = request.Status == "Approved" ? "1" : "2";
        string currentTimestamp = DateTime.Now.ToString("MMM d yyyy h:mmtt");
        
        // 1. Save comments to Sp_Variantsetcomments
        using (var cmd4 = new SqlCommand("Sp_Variantsetcomments", connection))
        {
            cmd4.CommandType = System.Data.CommandType.StoredProcedure;
            cmd4.Parameters.AddWithValue("@Userid", request.Userid ?? "");
            cmd4.Parameters.AddWithValue("@Accepted_Userid", "");
            cmd4.Parameters.AddWithValue("@Approved_Userid", request.Approved_Userid ?? "");
            cmd4.Parameters.AddWithValue("@Productid", request.Productid ?? "");
            cmd4.Parameters.AddWithValue("@Productvariantsid", request.Id ?? "0");
            cmd4.Parameters.AddWithValue("@Productsetid", "0");
            cmd4.Parameters.AddWithValue("@Checked_Date", currentTimestamp);
            cmd4.Parameters.AddWithValue("@Comments", request.Comments ?? "");
            cmd4.Parameters.AddWithValue("@Commenttype", "Approve/Reject");
            cmd4.Parameters.AddWithValue("@Variantorset", "Variant");
            cmd4.Parameters.AddWithValue("@Status", statusVal);
            cmd4.Parameters.AddWithValue("@Role", request.Approved_Role ?? "Manager");
            cmd4.Parameters.AddWithValue("@Query", 1);
            await cmd4.ExecuteNonQueryAsync();
        }

        // 2. Clear old comments (Query 6/7) if needed? The snippet doesn't actually use the emails for anything other than local variables.
        // I'll skip the local variable fetches for now unless they are needed for side effects.
        
        // 3. Update status in Sp_Productvariants (Query 38)
        if (!string.IsNullOrWhiteSpace(request.Id) && !string.IsNullOrWhiteSpace(request.Productid))
        {
            using (var cmd212 = new SqlCommand("Sp_Productvariants", connection))
            {
                cmd212.CommandType = System.Data.CommandType.StoredProcedure;
                cmd212.Parameters.AddWithValue("@Id", request.Id);
                cmd212.Parameters.AddWithValue("@Userid", "");
                cmd212.Parameters.AddWithValue("@Productid", request.Productid);
                cmd212.Parameters.AddWithValue("@Productname", "");
                cmd212.Parameters.AddWithValue("@Varianttype", "");
                cmd212.Parameters.AddWithValue("@Value", "");
                cmd212.Parameters.AddWithValue("@Totalqty", "");
                cmd212.Parameters.AddWithValue("@Noofqty_online", "");
                cmd212.Parameters.AddWithValue("@Modelno", "");
                cmd212.Parameters.AddWithValue("@Warehousecheck", "");
                cmd212.Parameters.AddWithValue("@Batchno", "");
                cmd212.Parameters.AddWithValue("@EANBarcodeno", "");
                cmd212.Parameters.AddWithValue("@Isdelete", "");
                cmd212.Parameters.AddWithValue("@Status", "");
                cmd212.Parameters.AddWithValue("@Managerapprovestatus", statusVal);
                cmd212.Parameters.AddWithValue("@Warehouseapprovestatus", "0");
                cmd212.Parameters.AddWithValue("@Accountsapprovestatus", "0");
                cmd212.Parameters.AddWithValue("@Parentid", "");
                cmd212.Parameters.AddWithValue("@Ischild", "");
                cmd212.Parameters.AddWithValue("@Date", "");
                cmd212.Parameters.AddWithValue("@Query", 38);
                await cmd212.ExecuteNonQueryAsync();
            }
        }

        // 4. Record Inventory (Query 1)
        using (var command1 = new SqlCommand("Sp_Inventory", connection))
        {
            command1.CommandType = System.Data.CommandType.StoredProcedure;
            command1.Parameters.AddWithValue("@Id", "");
            command1.Parameters.AddWithValue("@Productid", request.Productid);
            command1.Parameters.AddWithValue("@Inventory_type", "1");
            command1.Parameters.AddWithValue("@Inventory_date", currentTimestamp);
            command1.Parameters.AddWithValue("@Productvariantsid", request.Id);
            command1.Parameters.AddWithValue("@Total_qty", "0");
            command1.Parameters.AddWithValue("@Billid", "0");
            command1.Parameters.AddWithValue("@Warehouse_status", "1");
            command1.Parameters.AddWithValue("@Isdelete", "0");
            command1.Parameters.AddWithValue("@Status", "Transit");
            command1.Parameters.AddWithValue("@Warehouseid", "1");
            command1.Parameters.AddWithValue("@Query", 1);
            await command1.ExecuteNonQueryAsync();
        }

        return Results.Ok(new { success = true, message = "Response successfully saved" });
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message }, statusCode: 500);
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
});

// POST: Send Edit Request for an already-approved Variant
app.MapPost("/api/item/editrequest", async (EditRequestPayload request, SqlConnection connection) =>
{
    try
    {
        await connection.OpenAsync();
        string currentTimestamp = DateTime.Now.ToString("MMM d yyyy h:mmtt");

        using (var cmd = new SqlCommand("Sp_Variantsetcomments", connection))
        {
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Userid", request.Userid ?? "");
            cmd.Parameters.AddWithValue("@Accepted_Userid", "");
            cmd.Parameters.AddWithValue("@Approved_Userid", "");
            cmd.Parameters.AddWithValue("@Productid", request.Productid ?? "");
            cmd.Parameters.AddWithValue("@Productvariantsid", request.Id ?? "0");
            cmd.Parameters.AddWithValue("@Productsetid", "0");
            cmd.Parameters.AddWithValue("@Checked_Date", currentTimestamp);
            cmd.Parameters.AddWithValue("@Comments", request.Comments ?? "");
            cmd.Parameters.AddWithValue("@Commenttype", "Editrequest");
            cmd.Parameters.AddWithValue("@Variantorset", "Variant");
            cmd.Parameters.AddWithValue("@Status", "0");
            cmd.Parameters.AddWithValue("@Role", request.Role ?? "User");
            cmd.Parameters.AddWithValue("@Query", 1);
            await cmd.ExecuteNonQueryAsync();
        }

        return Results.Ok(new { success = true, message = "Edit request sent. Wait for manager approval" });
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message }, statusCode: 500);
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
});




// Dashboard Content View Management Endpoints

// Get all dashboard content views
app.MapGet("/api/dashboardcontentview", async (string? status, SqlConnection connection) =>
{
    var response = new DashboardContentViewResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_DashboardContentView", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Id", DBNull.Value);
        command.Parameters.AddWithValue("@RoleId", DBNull.Value);
        command.Parameters.AddWithValue("@ContentSectionId", DBNull.Value);
        command.Parameters.AddWithValue("@ContentSectionName", DBNull.Value);
        command.Parameters.AddWithValue("@IsVisible", DBNull.Value);
        command.Parameters.AddWithValue("@Status", string.IsNullOrEmpty(status) ? DBNull.Value : status);
        command.Parameters.AddWithValue("@Enterdate", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 3); // Query = 3 for Select All
        
        using var reader = await command.ExecuteReaderAsync();
        var dashboardContentViews = new List<DashboardContentViewData>();
        
        while (await reader.ReadAsync())
        {
            dashboardContentViews.Add(new DashboardContentViewData
            {
                Id = reader.GetInt32(reader.GetOrdinal("Id")),
                RoleId = reader.IsDBNull(reader.GetOrdinal("RoleId")) ? 0 : reader.GetInt32(reader.GetOrdinal("RoleId")),
                RoleName = reader.IsDBNull(reader.GetOrdinal("RoleName")) ? "" : reader.GetString(reader.GetOrdinal("RoleName")),
                ContentSectionId = reader.IsDBNull(reader.GetOrdinal("ContentSectionId")) ? "" : reader.GetString(reader.GetOrdinal("ContentSectionId")),
                ContentSectionName = reader.IsDBNull(reader.GetOrdinal("ContentSectionName")) ? "" : reader.GetString(reader.GetOrdinal("ContentSectionName")),
                IsVisible = reader.IsDBNull(reader.GetOrdinal("IsVisible")) ? "No" : reader.GetString(reader.GetOrdinal("IsVisible")),
                Status = reader.IsDBNull(reader.GetOrdinal("Status")) ? "Active" : reader.GetString(reader.GetOrdinal("Status")),
                Enterdate = reader.IsDBNull(reader.GetOrdinal("Enterdate")) ? DateTime.Now : reader.GetDateTime(reader.GetOrdinal("Enterdate"))
            });
        }
        
        response.Success = true;
        response.Message = "Dashboard content views retrieved successfully";
        response.DashboardContentViews = dashboardContentViews;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})


.WithName("GetDashboardContentViews")
.WithOpenApi();

// Get dashboard content views by RoleId
app.MapGet("/api/dashboardcontentview/role/{roleId}", async (int roleId, string? status, SqlConnection connection) =>
{
    var response = new DashboardContentViewResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_DashboardContentView", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Id", DBNull.Value);
        command.Parameters.AddWithValue("@RoleId", roleId);
        command.Parameters.AddWithValue("@ContentSectionId", DBNull.Value);
        command.Parameters.AddWithValue("@ContentSectionName", DBNull.Value);
        command.Parameters.AddWithValue("@IsVisible", DBNull.Value);
        command.Parameters.AddWithValue("@Status", string.IsNullOrEmpty(status) ? DBNull.Value : status);
        command.Parameters.AddWithValue("@Enterdate", DBNull.Value);
        command.Parameters.AddWithValue("@Query", 5); // Query = 5 for Get by RoleId
        
        using var reader = await command.ExecuteReaderAsync();
        var dashboardContentViews = new List<DashboardContentViewData>();
        
        while (await reader.ReadAsync())
        {
            dashboardContentViews.Add(new DashboardContentViewData
            {
                Id = reader.GetInt32(reader.GetOrdinal("Id")),
                RoleId = reader.GetInt32(reader.GetOrdinal("RoleId")),
                RoleName = reader.IsDBNull(reader.GetOrdinal("RoleName")) ? "" : reader.GetString(reader.GetOrdinal("RoleName")),
                ContentSectionId = reader.IsDBNull(reader.GetOrdinal("ContentSectionId")) ? "" : reader.GetString(reader.GetOrdinal("ContentSectionId")),
                ContentSectionName = reader.IsDBNull(reader.GetOrdinal("ContentSectionName")) ? "" : reader.GetString(reader.GetOrdinal("ContentSectionName")),
                IsVisible = reader.IsDBNull(reader.GetOrdinal("IsVisible")) ? "No" : reader.GetString(reader.GetOrdinal("IsVisible")),
                Status = reader.IsDBNull(reader.GetOrdinal("Status")) ? "Active" : reader.GetString(reader.GetOrdinal("Status")),
                Enterdate = reader.IsDBNull(reader.GetOrdinal("Enterdate")) ? DateTime.Now : reader.GetDateTime(reader.GetOrdinal("Enterdate"))
            });
        }
        
        response.Success = true;
        response.Message = "Dashboard content views retrieved successfully";
        response.DashboardContentViews = dashboardContentViews;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("GetDashboardContentViewsByRole")
.WithOpenApi();

// Create dashboard content view (Query = 1: Insert)
app.MapPost("/api/dashboardcontentview", async (DashboardContentViewRequest request, SqlConnection connection) =>
{
    var response = new DashboardContentViewResponse();
    
    try
    {
        if (request.RoleId <= 0)
        {
            response.Success = false;
            response.Message = "RoleId is required";
            return Results.Json(response, statusCode: 400);
        }
        
        if (string.IsNullOrWhiteSpace(request.ContentSectionId))
        {
            response.Success = false;
            response.Message = "ContentSectionId is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_DashboardContentView", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Id", 0);
        command.Parameters.AddWithValue("@RoleId", request.RoleId);
        command.Parameters.AddWithValue("@ContentSectionId", request.ContentSectionId ?? "");
        command.Parameters.AddWithValue("@ContentSectionName", request.ContentSectionName ?? "");
        command.Parameters.AddWithValue("@IsVisible", request.IsVisible ?? "No");
        command.Parameters.AddWithValue("@Status", request.Status ?? "Active");
        command.Parameters.AddWithValue("@Enterdate", request.Enterdate);
        command.Parameters.AddWithValue("@Query", 1); // Query = 1 for Insert
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Dashboard content view created successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("CreateDashboardContentView")
.WithOpenApi();

// Update dashboard content view (Query = 2: Update)
app.MapPut("/api/dashboardcontentview/{id}", async (int id, DashboardContentViewRequest request, SqlConnection connection) =>
{
    var response = new DashboardContentViewResponse();
    
    try
    {
        if (request.RoleId <= 0)
        {
            response.Success = false;
            response.Message = "RoleId is required";
            return Results.Json(response, statusCode: 400);
        }
        
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_DashboardContentView", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@RoleId", request.RoleId);
        command.Parameters.AddWithValue("@ContentSectionId", request.ContentSectionId ?? "");
        command.Parameters.AddWithValue("@ContentSectionName", request.ContentSectionName ?? "");
        command.Parameters.AddWithValue("@IsVisible", request.IsVisible ?? "No");
        command.Parameters.AddWithValue("@Status", request.Status ?? "Active");
        command.Parameters.AddWithValue("@Enterdate", request.Enterdate);
        command.Parameters.AddWithValue("@Query", 2); // Query = 2 for Update
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Dashboard content view updated successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("UpdateDashboardContentView")
.WithOpenApi();

// Delete dashboard content view (soft delete)
app.MapDelete("/api/dashboardcontentview/{id}", async (int id, SqlConnection connection) =>
{
    var response = new DashboardContentViewResponse();
    
    try
    {
        await connection.OpenAsync();
        
        // First get the current record to preserve other fields
        using var getCommand = new SqlCommand("SELECT * FROM Tbl_DashboardContentView WHERE Id = @Id", connection);
        getCommand.Parameters.AddWithValue("@Id", id);
        using var reader = await getCommand.ExecuteReaderAsync();
        
        if (!reader.HasRows)
        {
            response.Success = false;
            response.Message = "Dashboard content view not found";
            return Results.Json(response, statusCode: 404);
        }
        
        await reader.ReadAsync();
        var roleId = reader.GetInt32(reader.GetOrdinal("RoleId"));
        var contentSectionId = reader.IsDBNull(reader.GetOrdinal("ContentSectionId")) ? "" : reader.GetString(reader.GetOrdinal("ContentSectionId"));
        var contentSectionName = reader.IsDBNull(reader.GetOrdinal("ContentSectionName")) ? "" : reader.GetString(reader.GetOrdinal("ContentSectionName"));
        var isVisible = reader.IsDBNull(reader.GetOrdinal("IsVisible")) ? "No" : reader.GetString(reader.GetOrdinal("IsVisible"));
        var enterdate = reader.IsDBNull(reader.GetOrdinal("Enterdate")) ? DateTime.Now : reader.GetDateTime(reader.GetOrdinal("Enterdate"));
        
        reader.Close();
        
        // Update with Status = 'Deleted' using Query = 2
        using var command = new SqlCommand("Sp_DashboardContentView", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@RoleId", roleId);
        command.Parameters.AddWithValue("@ContentSectionId", contentSectionId);
        command.Parameters.AddWithValue("@ContentSectionName", contentSectionName);
        command.Parameters.AddWithValue("@IsVisible", isVisible);
        command.Parameters.AddWithValue("@Status", "Deleted");
        command.Parameters.AddWithValue("@Enterdate", enterdate);
        command.Parameters.AddWithValue("@Query", 2); // Query = 2 for Update
        
        await command.ExecuteNonQueryAsync();
        
        response.Success = true;
        response.Message = "Dashboard content view deleted successfully";
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("DeleteDashboardContentView")
.WithOpenApi();


// DateFormat Management Endpoints



// Age Category API
app.MapGet("/api/agecategory", async (SqlConnection connection) =>
{
    var list = new List<AgeCategoryData>();
    try
    {
        await connection.OpenAsync();
        using var command = new SqlCommand("SELECT Id, Agecategory FROM Tbl_Agecategory WHERE Isdelete = '0' OR Isdelete = 0", connection);
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new AgeCategoryData
            {
                Id = reader.GetInt32(0),
                Agecategory = reader.GetString(1)
            });
        }
        return Results.Json(new { Success = true, Data = list });
    }
    catch (Exception ex)
    {
        return Results.Json(new { Success = false, Message = ex.Message });
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
             await connection.CloseAsync();
    }
})
.WithName("GetAgeCategories")
.WithOpenApi();



// Check Duplicates API
app.MapGet("/api/checkduplicate", async (string type, string value, SqlConnection connection) =>
{
    // type: itemname, modelno, batchno, barcodeno
    string tableName = "Tbl_Productvariants"; 
    string columnName = "";

    switch (type.ToLower())
    {
        case "itemname": columnName = "Itemname"; break; 
        case "modelno": columnName = "Modelno"; break;
        case "batchno": columnName = "Batchno"; break;
        case "barcodeno": columnName = "EANBarcodeno"; break; 
        default: return Results.Json(new { Success = false, Message = "Invalid type" });
    }

    try
    {
        await connection.OpenAsync();
        using var command = new SqlCommand($"SELECT COUNT(*) FROM {tableName} WHERE {columnName} = @Value AND Isdelete = 0", connection);
        command.Parameters.AddWithValue("@Value", value);
        
        int count = (int)await command.ExecuteScalarAsync();
        return Results.Json(new { Success = true, IsDuplicate = count > 0 });
    }
    catch (Exception ex)
    {
        return Results.Json(new { Success = false, Message = ex.Message });
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
             await connection.CloseAsync();
    }
});

// Update Product Variant Endpoint
app.MapPut("/api/productvariant/{id}", async (int id, HttpRequest request, SqlConnection connection) =>
{
    try
    {
        if (!request.HasFormContentType) return Results.Json(new { success = false, message = "Expected multipart/form-data" }, statusCode: 400);

        var form = await request.ReadFormAsync();
        var jsonData = form["jsonData"].FirstOrDefault();
        if (string.IsNullOrEmpty(jsonData)) return Results.Json(new { success = false, message = "Missing jsonData" }, statusCode: 400);

        var options = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var payload = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonData, options);

        var formDataElement = payload?.GetValueOrDefault("formData") as System.Text.Json.JsonElement?;
        Dictionary<string, object>? formData = null;
        if (formDataElement.HasValue) formData = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(formDataElement.Value.GetRawText(), options);

        if (formData == null) return Results.Json(new { success = false, message = "Missing formData" }, statusCode: 400);

        string productId = (formData.TryGetValue("productid", out var pid) ? pid?.ToString() : "") ?? "";
        
        string? GetStr(string key) {
            if (formData.TryGetValue(key, out var v) && v != null) return (v is System.Text.Json.JsonElement e ? (e.ValueKind == System.Text.Json.JsonValueKind.String ? e.GetString() : e.ToString()) : v.ToString());
            // Try lowercase if PascalCase fails
            if (formData.TryGetValue(key.ToLower(), out var v2) && v2 != null) return (v2 is System.Text.Json.JsonElement e2 ? (e2.ValueKind == System.Text.Json.JsonValueKind.String ? e2.GetString() : e2.ToString()) : v2.ToString());
            return null;
        }
        object SqlV(string key) => (object?)GetStr(key) ?? DBNull.Value;

        await connection.OpenAsync();
        using var transaction = connection.BeginTransaction();

        try
        {
            // 0. Fetch current ParentId to handle child-editing correctly
            int actualParentId = 0;
            using (var checkCmd = new SqlCommand("SELECT Parentid FROM Tbl_Productvariants WHERE Id = @Id", connection, transaction)) {
                checkCmd.Parameters.AddWithValue("@Id", id);
                var pIdVal = await checkCmd.ExecuteScalarAsync();
                int currentPId = pIdVal != null ? Convert.ToInt32(pIdVal) : 0;
                actualParentId = currentPId == 0 ? id : currentPId;
            }

            decimal l = 0, w = 0, h = 0;
            decimal.TryParse(GetStr("Length"), out l);
            decimal.TryParse(GetStr("Width"), out w);
            decimal.TryParse(GetStr("Height"), out h);
            decimal cbm = (l * w * h) / 1000000m;

            // 1. Update Main Variant Row (Sync ProductName as master property)
            var updateCmd = new SqlCommand(@"
                UPDATE Tbl_Productvariants SET 
                    Productname = @Productname, Itemname = @Itemname, Modelno = @Modelno, 
                    Batchno = @Batchno, EANBarcodeno = @BarcodeNo, 
                    Wholesaleprice = @WholesalePrice, Retailprice = @RetailPrice, Onlineprice = @OnlinePrice, 
                    Reorderpoint = @ReorderPoint, Reorderqty = @ReorderQty, Defaultlocation = @DefaultLocation, 
                    Length = @Length, Width = @Width, Height = @Height, Weight = @Weight, CBM = @CBM,
                    Standarduom = @Standarduom, Salesuom = @Salesuom, Purchaseuom = @Purchaseuom, 
                    Remarks = @Remarks, Serialized = @Serialized, Description = @Description, 
                    Short_description = @ShortDescription, Agecategory = @AgeCategory, Hscode = @HsCode, 
                    Country_orgin = @CountryOrigin, Brandid = @BrandId, Warehousecheck = @Warehousecheck, 
                    Varianttype = @VariantType, [Value] = @VariantValue,
                    Date = GETDATE()
                WHERE Id = @Id;

                -- Sync ProductName to siblings/parent if ProductId is available
                IF LEN(@Pid) > 0
                BEGIN
                   UPDATE Tbl_Productvariants SET Productname = @Productname WHERE Productid = @Pid AND Isdelete = 0;
                END", connection, transaction);

            updateCmd.Parameters.AddWithValue("@Id", id);
            updateCmd.Parameters.AddWithValue("@Pid", productId);
            updateCmd.Parameters.AddWithValue("@Productname", SqlV("productname"));
            updateCmd.Parameters.AddWithValue("@Itemname", SqlV("itemname"));
            updateCmd.Parameters.AddWithValue("@Modelno", SqlV("modelno"));
            updateCmd.Parameters.AddWithValue("@Batchno", SqlV("batchno"));
            updateCmd.Parameters.AddWithValue("@BarcodeNo", SqlV("barcodeno"));
            updateCmd.Parameters.AddWithValue("@WholesalePrice", SqlV("Wholesaleprice"));
            updateCmd.Parameters.AddWithValue("@RetailPrice", SqlV("Retailprice"));
            updateCmd.Parameters.AddWithValue("@OnlinePrice", SqlV("Onlineprice"));
            updateCmd.Parameters.AddWithValue("@ReorderPoint", SqlV("Reorderpoint"));
            updateCmd.Parameters.AddWithValue("@ReorderQty", SqlV("Reorderqty"));
            updateCmd.Parameters.AddWithValue("@DefaultLocation", SqlV("Defaultlocation"));
            updateCmd.Parameters.AddWithValue("@Length", l);
            updateCmd.Parameters.AddWithValue("@Width", w);
            updateCmd.Parameters.AddWithValue("@Height", h);
            updateCmd.Parameters.AddWithValue("@Weight", SqlV("Weight"));
            updateCmd.Parameters.AddWithValue("@CBM", cbm);
            updateCmd.Parameters.AddWithValue("@Standarduom", SqlV("Standarduom"));
            updateCmd.Parameters.AddWithValue("@Salesuom", SqlV("Salesuom"));
            updateCmd.Parameters.AddWithValue("@Purchaseuom", SqlV("Purchaseuom"));
            updateCmd.Parameters.AddWithValue("@Remarks", SqlV("Remarks"));
            updateCmd.Parameters.AddWithValue("@Serialized", SqlV("Serialized"));
            updateCmd.Parameters.AddWithValue("@Description", SqlV("Description"));
            updateCmd.Parameters.AddWithValue("@ShortDescription", SqlV("Short_description"));
            updateCmd.Parameters.AddWithValue("@AgeCategory", SqlV("Agecategory"));
            updateCmd.Parameters.AddWithValue("@HsCode", SqlV("Hscode"));
            updateCmd.Parameters.AddWithValue("@CountryOrigin", SqlV("Country_orgin"));
            updateCmd.Parameters.AddWithValue("@BrandId", SqlV("Brandid"));
            updateCmd.Parameters.AddWithValue("@Warehousecheck", SqlV("Warehousecheck"));

            // Get Variant Type/Value from tableData1
            var tableData1Element = payload?.GetValueOrDefault("tableData1") as System.Text.Json.JsonElement?;
            List<Dictionary<string, object>>? table1 = null;
            if (tableData1Element.HasValue) table1 = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, object>>>(tableData1Element.Value.GetRawText(), options);
            
            string? varType = null, varVal = null;
            if (table1 != null && table1.Count > 0) {
                varType = table1[0].ContainsKey("column_1") ? table1[0]["column_1"]?.ToString() : null;
                varVal = table1[0].ContainsKey("column_2") ? table1[0]["column_2"]?.ToString() : null;
            }
            updateCmd.Parameters.AddWithValue("@VariantType", (object?)varType ?? DBNull.Value);
            updateCmd.Parameters.AddWithValue("@VariantValue", (object?)varVal ?? DBNull.Value);

            await updateCmd.ExecuteNonQueryAsync();

            // 1.1 Sync Child Variants (Rows 1..N)
            if (table1 != null) {
                // Fetch current children to optimize matching (prevent duplicates)
                var currentChildren = new List<(int Id, string Type, string Val)>();
                using (var getChildCmd = new SqlCommand("SELECT Id, Varianttype, [Value] FROM Tbl_Productvariants WHERE Parentid = @Pid AND Isdelete = 0", connection, transaction)) {
                    getChildCmd.Parameters.AddWithValue("@Pid", actualParentId);
                    using (var reader = await getChildCmd.ExecuteReaderAsync()) {
                        while (await reader.ReadAsync()) {
                            currentChildren.Add((reader.GetInt32(0), reader.GetString(1), reader.IsDBNull(2) ? "" : reader.GetString(2)));
                        }
                    }
                }

                var childrenToKeep = new HashSet<int>();
                // Match rows from modal to existing DB records
                for (int i = 1; i < table1.Count; i++) {
                    var vRow = table1[i];
                    string rowType = vRow["column_1"]?.ToString() ?? "";
                    string rowVal = vRow["column_2"]?.ToString() ?? "";
                    
                    var match = currentChildren.FirstOrDefault(c => c.Type == rowType && c.Val == rowVal && !childrenToKeep.Contains(c.Id));
                    if (match != default) {
                        childrenToKeep.Add(match.Id);
                    } else {
                        // Truly New Row - Insert
                        var itemCmd = new SqlCommand(@"
                            INSERT INTO Tbl_Productvariants (
                                Userid, Productid, Productname, Itemname, Modelno, Batchno, EANBarcodeno, 
                                Varianttype, [Value], Wholesaleprice, Retailprice, Onlineprice, Reorderpoint, Reorderqty, 
                                Defaultlocation, Length, Width, Height, Weight, CBM, Standarduom, Salesuom, Purchaseuom, 
                                Remarks, Serialized, Description, Short_description, Agecategory, Hscode, Country_orgin, 
                                Brandid, Totalqty, Noofqty_online, Isdelete, Status, Warehousecheck, Parentid, Ischild, Date, Workstatus
                            )
                            SELECT @Userid, @ProductId, @Productname, @Itemname, @Modelno, @Batchno, @BarcodeNo, 
                                   @VariantType, @VariantValue, @WholesalePrice, @RetailPrice, @OnlinePrice, @ReorderPoint, @ReorderQty, 
                                   @DefaultLocation, @Length, @Width, @Height, @Weight, @CBM, @Standarduom, @Salesuom, @Purchaseuom, 
                                   @Remarks, @Serialized, @Description, @ShortDescription, @AgeCategory, @HsCode, @CountryOrigin, 
                                   @BrandId, 0, 0, 0, 'Active', @Warehousecheck, @ActualParentId, 1, GETDATE(), 1
                            FROM Tbl_Productvariants WHERE Id = @OrigId", connection, transaction);
                        
                        itemCmd.Parameters.AddWithValue("@OrigId", id);
                        itemCmd.Parameters.AddWithValue("@Userid", SqlV("userid"));
                        itemCmd.Parameters.AddWithValue("@ProductId", productId);
                        itemCmd.Parameters.AddWithValue("@Productname", SqlV("productname"));
                        itemCmd.Parameters.AddWithValue("@Itemname", $"{GetStr("itemname")}-{actualParentId}-{i}");
                        itemCmd.Parameters.AddWithValue("@ActualParentId", actualParentId); 
                        itemCmd.Parameters.AddWithValue("@Modelno", SqlV("modelno"));
                        itemCmd.Parameters.AddWithValue("@Batchno", SqlV("batchno"));
                        itemCmd.Parameters.AddWithValue("@BarcodeNo", SqlV("barcodeno"));
                        itemCmd.Parameters.AddWithValue("@VariantType", rowType);
                        itemCmd.Parameters.AddWithValue("@VariantValue", rowVal);
                        itemCmd.Parameters.AddWithValue("@WholesalePrice", SqlV("Wholesaleprice"));
                        itemCmd.Parameters.AddWithValue("@RetailPrice", SqlV("Retailprice"));
                        itemCmd.Parameters.AddWithValue("@OnlinePrice", SqlV("Onlineprice"));
                        itemCmd.Parameters.AddWithValue("@ReorderPoint", SqlV("Reorderpoint"));
                        itemCmd.Parameters.AddWithValue("@ReorderQty", SqlV("Reorderqty"));
                        itemCmd.Parameters.AddWithValue("@DefaultLocation", SqlV("Defaultlocation"));
                        itemCmd.Parameters.AddWithValue("@Length", l);
                        itemCmd.Parameters.AddWithValue("@Width", w);
                        itemCmd.Parameters.AddWithValue("@Height", h);
                        itemCmd.Parameters.AddWithValue("@Weight", SqlV("Weight"));
                        itemCmd.Parameters.AddWithValue("@CBM", cbm);
                        itemCmd.Parameters.AddWithValue("@Standarduom", SqlV("Standarduom"));
                        itemCmd.Parameters.AddWithValue("@Salesuom", SqlV("Salesuom"));
                        itemCmd.Parameters.AddWithValue("@Purchaseuom", SqlV("Purchaseuom"));
                        itemCmd.Parameters.AddWithValue("@Remarks", SqlV("Remarks"));
                        itemCmd.Parameters.AddWithValue("@Serialized", SqlV("Serialized"));
                        itemCmd.Parameters.AddWithValue("@Description", SqlV("Description"));
                        itemCmd.Parameters.AddWithValue("@ShortDescription", SqlV("Short_description"));
                        itemCmd.Parameters.AddWithValue("@AgeCategory", SqlV("Agecategory"));
                        itemCmd.Parameters.AddWithValue("@HsCode", SqlV("Hscode"));
                        itemCmd.Parameters.AddWithValue("@CountryOrigin", SqlV("Country_orgin"));
                        itemCmd.Parameters.AddWithValue("@BrandId", SqlV("Brandid"));
                        itemCmd.Parameters.AddWithValue("@Warehousecheck", SqlV("Warehousecheck"));
                        await itemCmd.ExecuteNonQueryAsync();
                    }
                }

                // Cleanup: Delete children that were removed from the modal
                foreach (var child in currentChildren) {
                    if (!childrenToKeep.Contains(child.Id)) {
                        using (var delCmd = new SqlCommand("UPDATE Tbl_Productvariants SET Isdelete = 1 WHERE Id = @ChildId", connection, transaction)) {
                            delCmd.Parameters.AddWithValue("@ChildId", child.Id);
                            await delCmd.ExecuteNonQueryAsync();
                        }
                    }
                }
            }

            // 2. Update Accounting Info
            var accUpdate = new SqlCommand(@"
                UPDATE Tbl_Productvariantsacc SET 
                    Reorderpoint = @Reorder, Inventoryasset_account = @InvAsset, 
                    Description = @Desc, Salesprice = @SalesPrice, Income_account = @IncAcc, 
                    Cost = @Cost, Expense_account = @ExpAcc
                WHERE Productvariantsid = @Vid", connection, transaction);
            accUpdate.Parameters.AddWithValue("@Vid", id);
            accUpdate.Parameters.AddWithValue("@Reorder", SqlV("Reorderpoint"));
            accUpdate.Parameters.AddWithValue("@InvAsset", SqlV("Inventoryasset_account"));
            accUpdate.Parameters.AddWithValue("@Desc", SqlV("Description"));
            accUpdate.Parameters.AddWithValue("@SalesPrice", SqlV("Salesprice"));
            accUpdate.Parameters.AddWithValue("@IncAcc", SqlV("Income_account"));
            accUpdate.Parameters.AddWithValue("@Cost", SqlV("Cost"));
            accUpdate.Parameters.AddWithValue("@ExpAcc", SqlV("Expense_account"));
            await accUpdate.ExecuteNonQueryAsync();

            // 2. Refresh Marketplaces (Delete and Re-insert)
            var delMp = new SqlCommand("DELETE FROM Tbl_Productmarketplace WHERE Productvariantsid = @Vid", connection, transaction);
            delMp.Parameters.AddWithValue("@Vid", id);
            await delMp.ExecuteNonQueryAsync();

            var mpElement = payload?.GetValueOrDefault("tableData") as System.Text.Json.JsonElement?;
            if (mpElement.HasValue)
            {
                var marketPlaceData = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, object>>>(mpElement.Value.GetRawText(), options);
                if (marketPlaceData != null)
                {
                    foreach (var mp in marketPlaceData)
                    {
                        var mpCmd = new SqlCommand(@"INSERT INTO Tbl_Productmarketplace (Userid, Productid, Productvariantsid, Marketplacename, Visibility, Link, Isdelete, Status) 
                                                     VALUES (@Userid, @ProductId, @VariantId, @Name, @Vs, @Link, 0, 'Active')", connection, transaction);
                        mpCmd.Parameters.AddWithValue("@Userid", SqlV("userid"));
                        mpCmd.Parameters.AddWithValue("@ProductId", productId);
                        mpCmd.Parameters.AddWithValue("@VariantId", id);
                        mpCmd.Parameters.AddWithValue("@Name", (object?)mp["Marketplace1"]?.ToString() ?? DBNull.Value);
                        bool status = mp.ContainsKey("Status") && mp["Status"]?.ToString()?.ToLower() == "true";
                        mpCmd.Parameters.AddWithValue("@Vs", status ? 1 : 0);
                        mpCmd.Parameters.AddWithValue("@Link", (object?)mp["Link"]?.ToString() ?? DBNull.Value);
                        await mpCmd.ExecuteNonQueryAsync();
                    }
                }
            }

            // 2.1 Handle Gallery (Images)
            if (form.ContainsKey("gallerynames[]") && form.ContainsKey("galleryimages[]"))
            {
                var names = form["gallerynames[]"];
                var images = form["galleryimages[]"];
                
                string productImagesBase = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Content", "images", productId);
                string originalFolder = Path.Combine(productImagesBase, "Original");
                string resizeFolder = Path.Combine(productImagesBase, "Resize");
                string thumbFolder = Path.Combine(productImagesBase, "Thumb");

                Directory.CreateDirectory(originalFolder);
                Directory.CreateDirectory(resizeFolder);
                Directory.CreateDirectory(thumbFolder);

                for (int i = 0; i < names.Count; i++)
                {
                    string name = names[i];
                    string base64Data = images[i];

                    if (!string.IsNullOrEmpty(name) && !string.IsNullOrEmpty(base64Data))
                    {
                        try {
                            string ext = Path.GetExtension(name).ToLower();
                            string[] allowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                            if (!allowedExtensions.Contains(ext)) continue;

                            string base64Image = base64Data.Contains(",") ? base64Data.Split(',')[1] : base64Data;
                            byte[] imageBytes = Convert.FromBase64String(base64Image);

                            await File.WriteAllBytesAsync(Path.Combine(originalFolder, name), imageBytes);

                            using var image = Image.Load(new MemoryStream(imageBytes));
                            using (var resizedImg = image.Clone(x => x.Resize(new ResizeOptions { Size = new Size(300, 300), Mode = ResizeMode.Max })))
                            {
                                await resizedImg.SaveAsync(Path.Combine(resizeFolder, name));
                            }
                            using (var thumbImg = image.Clone(x => x.Resize(new ResizeOptions { Size = new Size(50, 50), Mode = ResizeMode.Max })))
                            {
                                await thumbImg.SaveAsync(Path.Combine(thumbFolder, name));
                            }

                            string dbPath = $"/Content/images/{productId}/Thumb/{name}";
                            var galleryCmd = new SqlCommand("INSERT INTO Tbl_Gallery (Product_id, Userid, Gallery_file, File_id, Productvariants_id) VALUES (@Pid, @Uid, @Path, 3, @VarId)", connection, transaction);
                            galleryCmd.Parameters.AddWithValue("@Pid", productId);
                            galleryCmd.Parameters.AddWithValue("@Uid", SqlV("userid"));
                            galleryCmd.Parameters.AddWithValue("@Path", dbPath);
                            galleryCmd.Parameters.AddWithValue("@VarId", id);
                            await galleryCmd.ExecuteNonQueryAsync();
                        } catch (Exception ex) {
                            Console.WriteLine($"Error processing gallery image {name}: {ex.Message}");
                        }
                    }
                }
            }
            
            // 2.2 Handle Gallery (Videos)
            foreach (var file in form.Files)
            {
                if (file.Name.StartsWith("video"))
                {
                    string originalFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Content", "images", productId, "Original");
                    Directory.CreateDirectory(originalFolder);
                    
                    string filePath = Path.Combine(originalFolder, file.FileName);
                    using (var stream = new FileStream(filePath, FileMode.Create)) {
                        await file.CopyToAsync(stream);
                    }

                    string dbPath = $"/Content/images/{productId}/Original/{file.FileName}";
                    var galleryCmd = new SqlCommand("INSERT INTO Tbl_Gallery (Product_id, Userid, Gallery_file, File_id, Productvariants_id) VALUES (@Pid, @Uid, @Path, 2, @VarId)", connection, transaction);
                    galleryCmd.Parameters.AddWithValue("@Pid", productId);
                    galleryCmd.Parameters.AddWithValue("@Uid", SqlV("userid"));
                    galleryCmd.Parameters.AddWithValue("@Path", dbPath);
                    galleryCmd.Parameters.AddWithValue("@VarId", id);
                    await galleryCmd.ExecuteNonQueryAsync();
                }
            }

            // 3. Log the update
            var logCmd = new SqlCommand("INSERT INTO Tbl_Productvariantssetlog (Productid, Userid, Actiontype, Date, Productvariantsid, Productsetid) VALUES (@Pid, @Uid, 'Update', GETDATE(), @VarId, 0)", connection, transaction);
            logCmd.Parameters.AddWithValue("@Pid", productId);
            logCmd.Parameters.AddWithValue("@Uid", SqlV("userid"));
            logCmd.Parameters.AddWithValue("@VarId", id);
            await logCmd.ExecuteNonQueryAsync();

            transaction.Commit();
            return Results.Json(new { success = true, message = "Product variant updated successfully!" });
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return Results.Json(new { success = false, message = $"Error updating: {ex.Message}" }, statusCode: 500);
        }
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = $"Error: {ex.Message}" }, statusCode: 500);
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
});

// Search Product Variants
app.MapGet("/api/productvariant/search", async (string? catelogId, string? itemName, SqlConnection connection) =>
{
    var response = new ProductVariantSearchResponse();
    
    try
    {
        await connection.OpenAsync();
        
        using var command = new SqlCommand("Sp_Productvariants", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        
        command.Parameters.AddWithValue("@Catelogid", string.IsNullOrEmpty(catelogId) ? DBNull.Value : catelogId);
        command.Parameters.AddWithValue("@Itemname", string.IsNullOrEmpty(itemName) ? "%" : "%" + itemName + "%");
        command.Parameters.AddWithValue("@Query", 36);
        
        using var reader = await command.ExecuteReaderAsync();
        var variants = new List<ProductVariantSearchResult>();
        
        while (await reader.ReadAsync())
        {
            variants.Add(new ProductVariantSearchResult
            {
                id = reader["Id"] != DBNull.Value ? Convert.ToInt32(reader["Id"]) : 0,
                Itemname = reader["Itemname"]?.ToString() ?? "",
                allvalues = reader["allvalues"]?.ToString() ?? "",
                Type = reader["Type"]?.ToString() ?? ""
            });
        }
        
        response.Success = true;
        response.Message = "Variants retrieved successfully";
        response.List1 = variants;
    }
    catch (Exception ex)
    {
        response.Success = false;
        response.Message = $"Error: {ex.Message}";
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
    
    return Results.Json(response);
})
.WithName("SearchProductVariants")
.WithOpenApi();

// Real Product Variant Save Endpoint (handles FormData and inserts into DB)
app.MapPost("/api/productvariant", async (HttpRequest request, SqlConnection connection) =>
{
    try
    {
        // Ensure the request is multipart/form-data
        if (!request.HasFormContentType)
        {
            return Results.Json(new { success = false, message = "Expected multipart/form-data" }, statusCode: 400);
        }

        var form = await request.ReadFormAsync();
        var jsonData = form["jsonData"].FirstOrDefault();
        if (string.IsNullOrEmpty(jsonData))
        {
            return Results.Json(new { success = false, message = "Missing jsonData" }, statusCode: 400);
        }

        // Deserialize JSON into a dynamic object
        var options = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var payload = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonData, options);

        Console.WriteLine("Received product variant data (JSON):");
        Console.WriteLine(jsonData);

        // Extract the formData object
        var formDataElement = payload?.GetValueOrDefault("formData") as System.Text.Json.JsonElement?;
        Dictionary<string, object>? formData = null;
        if (formDataElement.HasValue)
        {
            formData = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(
                formDataElement.Value.GetRawText(), options);
        }

        if (formData == null)
        {
            Console.WriteLine("ERROR: formData is null or missing");
            return Results.Json(new { success = false, message = "Missing formData in payload" }, statusCode: 400);
        }

        // Extract tableData1 (variants)
        var tableData1Element = payload?.GetValueOrDefault("tableData1") as System.Text.Json.JsonElement?;
        List<Dictionary<string, object>>? tableData1 = null;
        if (tableData1Element.HasValue)
        {
            tableData1 = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, object>>>(
                tableData1Element.Value.GetRawText(), options);
        }

        // Additional Data Sections
        var tableDataElement = payload?.GetValueOrDefault("tableData") as System.Text.Json.JsonElement?; // Marketplaces
        List<Dictionary<string, object>>? marketPlaceData = null;
        if (tableDataElement.HasValue) marketPlaceData = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, object>>>(tableDataElement.Value.GetRawText(), options);

        var openingQtyElement = payload?.GetValueOrDefault("openingQtyData") as System.Text.Json.JsonElement?;
        List<Dictionary<string, object>>? openingQtyData = null;
        if (openingQtyElement.HasValue) openingQtyData = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, object>>>(openingQtyElement.Value.GetRawText(), options);

        var serialElement = payload?.GetValueOrDefault("serialNumbers") as System.Text.Json.JsonElement?;
        List<Dictionary<string, object>>? serialNumbers = null;
        if (serialElement.HasValue) serialNumbers = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, object>>>(serialElement.Value.GetRawText(), options);


        // Helper to safely get string values
        string? GetStringValue(string key)
        {
            if (formData.TryGetValue(key, out var value) && value != null)
            {
                if (value is System.Text.Json.JsonElement elem)
                    return elem.ValueKind == System.Text.Json.JsonValueKind.String ? elem.GetString() : elem.ToString();
                return value.ToString();
            }
            // Try lowercase fallback
            if (formData.TryGetValue(key.ToLower(), out var v2) && v2 != null)
            {
                if (v2 is System.Text.Json.JsonElement e2)
                    return e2.ValueKind == System.Text.Json.JsonValueKind.String ? e2.GetString() : e2.ToString();
                return v2.ToString();
            }
            return null;
        }

        object GetSqlValue(string key) => (object?)GetStringValue(key) ?? DBNull.Value;
        
        // 1. Get existing ProductID from frontend (user selected)
        // Note: In a production app with Auth, UserID should come from User.Claims. 
        // Here we use the form data as requested previously, or fallback to header if available.
        string productId = GetStringValue("productid") ?? "";
        if (string.IsNullOrEmpty(productId) || productId == "0")
        {
             // Fallback if not provided, though requirement says "Already existing product"
             // We can Log a warning or error. For now, we assume frontend provides the selected ID.
             Console.WriteLine("Warning: ProductID is empty or 0. Logic requires existing ProductID.");
        }

        // Start DB Transaction
        await connection.OpenAsync();
        using var transaction = connection.BeginTransaction();

        try
        {
            // 2. Determine Parent Variant Data
            string? parentVariantType = null;
            string? parentVariantValue = null;
            bool hasVariants = tableData1 != null && tableData1.Count > 0;

            if (hasVariants)
            {
                var first = tableData1![0];
                parentVariantType = first.ContainsKey("column_1") ? first["column_1"]?.ToString() : null;
                parentVariantValue = first.ContainsKey("column_2") ? first["column_2"]?.ToString() : null;
            }

            decimal pl = 0, pw = 0, ph = 0;
            decimal.TryParse(GetStringValue("Length"), out pl);
            decimal.TryParse(GetStringValue("Width"), out pw);
            decimal.TryParse(GetStringValue("Height"), out ph);
            decimal pcbm = (pl * pw * ph) / 1000000m;

            // 3. Insert Parent Row
            var insertParentCmd = new SqlCommand(@"
                INSERT INTO Tbl_Productvariants (
                    Userid, Productid, Productname, Itemname, Modelno, Batchno, EANBarcodeno, 
                    Wholesaleprice, Retailprice, Onlineprice, Reorderpoint, Reorderqty, 
                    Defaultlocation, Length, Width, Height, Weight, CBM,
                    Standarduom, Salesuom, Purchaseuom, Remarks, Serialized, 
                    Description, Short_description, Agecategory, Hscode, Country_orgin, Brandid, Totalqty, Noofqty_online,
                    Varianttype, [Value],
                    Isdelete, Status, Warehousecheck, Parentid, Ischild, Date, Workstatus
                )
                VALUES (
                    @Userid, @ProductId, @Productname, @Itemname, @Modelno, @Batchno, @BarcodeNo, 
                    @WholesalePrice, @RetailPrice, @OnlinePrice, @ReorderPoint, @ReorderQty, 
                    @DefaultLocation, @Length, @Width, @Height, @Weight, @CBM,
                    @Standarduom, @Salesuom, @Purchaseuom, @Remarks, @Serialized, 
                    @Description, @ShortDescription, @AgeCategory, @HsCode, @CountryOrigin, @BrandId, @TotalQty, @NoOfQtyOnline,
                    @VariantType, @VariantValue,
                    0, 'Active', @Warehousecheck, 0, 0, GETDATE(), 1
                );
                SELECT CAST(SCOPE_IDENTITY() as int);", connection, transaction);

            insertParentCmd.Parameters.AddWithValue("@Userid", GetSqlValue("userid"));
            insertParentCmd.Parameters.AddWithValue("@ProductId", productId); // Use existing ProductID
            insertParentCmd.Parameters.AddWithValue("@Productname", GetSqlValue("productname"));
            insertParentCmd.Parameters.AddWithValue("@Itemname", GetSqlValue("itemname"));
            insertParentCmd.Parameters.AddWithValue("@ModelNo", GetSqlValue("modelno"));
            insertParentCmd.Parameters.AddWithValue("@BatchNo", GetSqlValue("batchno"));
            insertParentCmd.Parameters.AddWithValue("@BarcodeNo", GetSqlValue("barcodeno"));
            insertParentCmd.Parameters.AddWithValue("@WholesalePrice", GetSqlValue("Wholesaleprice"));
            insertParentCmd.Parameters.AddWithValue("@RetailPrice", GetSqlValue("Retailprice"));
            insertParentCmd.Parameters.AddWithValue("@OnlinePrice", GetSqlValue("Onlineprice"));
            insertParentCmd.Parameters.AddWithValue("@ReorderPoint", GetSqlValue("Reorderpoint"));
            insertParentCmd.Parameters.AddWithValue("@ReorderQty", GetSqlValue("Reorderqty"));
            insertParentCmd.Parameters.AddWithValue("@DefaultLocation", GetSqlValue("Defaultlocation"));
            insertParentCmd.Parameters.AddWithValue("@Length", pl);
            insertParentCmd.Parameters.AddWithValue("@Width", pw);
            insertParentCmd.Parameters.AddWithValue("@Height", ph);
            insertParentCmd.Parameters.AddWithValue("@Weight", GetSqlValue("Weight"));
            insertParentCmd.Parameters.AddWithValue("@CBM", pcbm);
            insertParentCmd.Parameters.AddWithValue("@Standarduom", GetSqlValue("Standarduom"));
            insertParentCmd.Parameters.AddWithValue("@Salesuom", GetSqlValue("Salesuom"));
            insertParentCmd.Parameters.AddWithValue("@Purchaseuom", GetSqlValue("Purchaseuom"));
            insertParentCmd.Parameters.AddWithValue("@Remarks", GetSqlValue("Remarks"));
            insertParentCmd.Parameters.AddWithValue("@Serialized", GetSqlValue("Serialized"));
            insertParentCmd.Parameters.AddWithValue("@Description", GetSqlValue("Description"));
            insertParentCmd.Parameters.AddWithValue("@ShortDescription", GetSqlValue("Short_description"));
            insertParentCmd.Parameters.AddWithValue("@AgeCategory", GetSqlValue("Agecategory"));
            insertParentCmd.Parameters.AddWithValue("@HsCode", GetSqlValue("Hscode"));
            insertParentCmd.Parameters.AddWithValue("@CountryOrigin", GetSqlValue("Country_orgin"));
            insertParentCmd.Parameters.AddWithValue("@BrandId", GetSqlValue("Brandid"));
            insertParentCmd.Parameters.AddWithValue("@TotalQty", GetSqlValue("totalqty"));
            insertParentCmd.Parameters.AddWithValue("@NoOfQtyOnline", GetSqlValue("totalqtyonline"));
            insertParentCmd.Parameters.AddWithValue("@Warehousecheck", GetSqlValue("Warehousecheck"));
            
            insertParentCmd.Parameters.AddWithValue("@VariantType", (object?)parentVariantType ?? DBNull.Value);
            insertParentCmd.Parameters.AddWithValue("@VariantValue", (object?)parentVariantValue ?? DBNull.Value);

            object result = await insertParentCmd.ExecuteScalarAsync();
            int parentId = result != null ? Convert.ToInt32(result) : 0;
            
            Console.WriteLine($"Parent Row Inserted: ID {parentId}, ProductID {productId}");

            // 4. Insert Variant Rows (Children)
            if (hasVariants)
            {
                // Start from index 1
                for (int i = 1; i < tableData1!.Count; i++)
                {
                    var variantRow = tableData1[i];
                    string? variantType = variantRow.ContainsKey("column_1") ? variantRow["column_1"]?.ToString() : null;
                    string? variantValue = variantRow.ContainsKey("column_2") ? variantRow["column_2"]?.ToString() : null;

                    if (!string.IsNullOrEmpty(variantType))
                    {
                        var insertChildCmd = new SqlCommand(@"
                        INSERT INTO Tbl_Productvariants (
                            Userid, Productid, Productname, Itemname, Modelno, Batchno, EANBarcodeno, 
                            Varianttype, [Value], 
                            Wholesaleprice, Retailprice, Onlineprice, Reorderpoint, Reorderqty, 
                            Defaultlocation, Length, Width, Height, Weight, CBM,
                            Standarduom, Salesuom, Purchaseuom, Remarks, Serialized, 
                            Description, Short_description, Agecategory, Hscode, Country_orgin, Brandid, Totalqty, Noofqty_online,
                            Isdelete, Status, Warehousecheck, Parentid, Ischild, Date, Workstatus
                        )
                        VALUES (
                            @Userid, @ProductId, @Productname, @Itemname, @Modelno, @Batchno, @BarcodeNo, 
                            @VariantType, @VariantValue,
                            @WholesalePrice, @RetailPrice, @OnlinePrice, @ReorderPoint, @ReorderQty, 
                            @DefaultLocation, @Length, @Width, @Height, @Weight, @CBM,
                            @Standarduom, @Salesuom, @Purchaseuom, @Remarks, @Serialized, 
                            @Description, @ShortDescription, @AgeCategory, @HsCode, @CountryOrigin, @BrandId, @TotalQty, @NoOfQtyOnline,
                            0, 'Active', @Warehousecheck, @ParentId, 1, GETDATE(), 1
                        )", connection, transaction);

                        // Use same values as parent for most fields
                        foreach (SqlParameter p in insertParentCmd.Parameters)
                        {
                            if (!p.ParameterName.Equals("@Itemname") && 
                                !p.ParameterName.Equals("@VariantType") && 
                                !p.ParameterName.Equals("@VariantValue") &&
                                !p.ParameterName.Equals("@ProductId")) // Exclude ProductId to re-add appropriately if needed (it is same though)
                            {
                                insertChildCmd.Parameters.AddWithValue(p.ParameterName, p.Value);
                            }
                        }
                        
                        insertChildCmd.Parameters.AddWithValue("@ParentId", parentId);
                        insertChildCmd.Parameters.AddWithValue("@ProductId", productId);
                        insertChildCmd.Parameters.AddWithValue("@VariantType", (object?)variantType ?? DBNull.Value);
                        insertChildCmd.Parameters.AddWithValue("@VariantValue", (object?)variantValue ?? DBNull.Value);
                        
                        string parentItemName = GetStringValue("itemname") ?? "";
                        insertChildCmd.Parameters.AddWithValue("@Itemname", $"{parentItemName}-{parentId}-{i}");

                        await insertChildCmd.ExecuteNonQueryAsync();
                    }
                }
            }

            // 5. Insert Marketplaces
            if (marketPlaceData != null)
            {
                foreach (var mp in marketPlaceData)
                {
                     var mpCmd = new SqlCommand(@"INSERT INTO Tbl_Productmarketplace (Userid, Productid, Productvariantsid, Marketplacename, Visibility, Link, Isdelete, Status) 
                                                  VALUES (@Userid, @ProductId, @VariantId, @Name, @Vs, @Link, 0, 'Active')", connection, transaction);
                     mpCmd.Parameters.AddWithValue("@Userid", GetSqlValue("userid"));
                     mpCmd.Parameters.AddWithValue("@ProductId", productId);
                     mpCmd.Parameters.AddWithValue("@VariantId", parentId);
                     mpCmd.Parameters.AddWithValue("@Name", (object?)mp["Marketplace1"]?.ToString() ?? DBNull.Value);
                     bool status = mp.ContainsKey("Status") && mp["Status"]?.ToString()?.ToLower() == "true";
                     mpCmd.Parameters.AddWithValue("@Vs", status ? 1 : 0);
                     mpCmd.Parameters.AddWithValue("@Link", (object?)mp["Link"]?.ToString() ?? DBNull.Value);
                     await mpCmd.ExecuteNonQueryAsync();
                }
            }

            // 6. Insert Gallery (Images)
            // Path format: /Content/images/{productId}/[Original/Resize/Thumb]/{filename}
            if (form.ContainsKey("gallerynames[]") && form.ContainsKey("galleryimages[]"))
            {
                var names = form["gallerynames[]"];
                var images = form["galleryimages[]"];
                
                string productImagesBase = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Content", "images", productId);
                string originalFolder = Path.Combine(productImagesBase, "Original");
                string resizeFolder = Path.Combine(productImagesBase, "Resize");
                string thumbFolder = Path.Combine(productImagesBase, "Thumb");

                Directory.CreateDirectory(originalFolder);
                Directory.CreateDirectory(resizeFolder);
                Directory.CreateDirectory(thumbFolder);

                for (int i = 0; i < names.Count; i++)
                {
                    string name = names[i];
                    string base64Data = images[i];

                    if (!string.IsNullOrEmpty(name) && !string.IsNullOrEmpty(base64Data))
                    {
                        try {
                            // Check if it's an image extension
                            string ext = Path.GetExtension(name).ToLower();
                            string[] allowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                            if (!allowedExtensions.Contains(ext)) {
                                Console.WriteLine($"Skipping non-image file: {name}. Allowed: .jpg, .jpeg, .png, .gif, .webp");
                                continue;
                            }

                            // Remove base64 header if present
                            string base64Image = base64Data.Contains(",") ? base64Data.Split(',')[1] : base64Data;
                            byte[] imageBytes = Convert.FromBase64String(base64Image);

                            // 1. Save Original
                            await File.WriteAllBytesAsync(Path.Combine(originalFolder, name), imageBytes);

                            // 2. Load image for processing
                            using var image = Image.Load(new MemoryStream(imageBytes));

                            // 3. Save Resized (Standard preview size e.g. 300x300)
                            using (var resizedImg = image.Clone(x => x.Resize(new ResizeOptions { Size = new Size(300, 300), Mode = ResizeMode.Max })))
                            {
                                await resizedImg.SaveAsync(Path.Combine(resizeFolder, name));
                            }

                            // 4. Save Thumb (50x50 as requested)
                            using (var thumbImg = image.Clone(x => x.Resize(new ResizeOptions { Size = new Size(50, 50), Mode = ResizeMode.Max })))
                            {
                                await thumbImg.SaveAsync(Path.Combine(thumbFolder, name));
                            }

                            Console.WriteLine($"Saved gallery image {name} to Original (org), Resize (300px), and Thumb (50x50) folders.");
                        } catch (Exception ex) {
                            Console.WriteLine($"Error processing gallery image {name}: {ex.Message}");
                        }


                        // Insert Thumb path to DB as requested
                        string dbPath = $"/Content/images/{productId}/Thumb/{name}";
                        var galleryCmd = new SqlCommand("INSERT INTO Tbl_Gallery (Product_id, Userid, Gallery_file, File_id, Productvariants_id) VALUES (@Pid, @Uid, @Path, 3, @VarId)", connection, transaction);
                        galleryCmd.Parameters.AddWithValue("@Pid", productId);
                        galleryCmd.Parameters.AddWithValue("@Uid", GetSqlValue("userid"));
                        galleryCmd.Parameters.AddWithValue("@Path", dbPath);
                        galleryCmd.Parameters.AddWithValue("@VarId", parentId);
                        await galleryCmd.ExecuteNonQueryAsync();
                    }
                }
            }
            
            // 7. Insert Gallery (Videos)
            foreach (var file in form.Files)
            {
                if (file.Name.StartsWith("video"))
                {
                    string originalFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Content", "images", productId, "Original");
                    Directory.CreateDirectory(originalFolder);
                    
                    string filePath = Path.Combine(originalFolder, file.FileName);
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }
                    Console.WriteLine($"Saved gallery video: {filePath}");

                    string dbPath = $"/Content/images/{productId}/Original/{file.FileName}";
                    var galleryCmd = new SqlCommand("INSERT INTO Tbl_Gallery (Product_id, Userid, Gallery_file, File_id, Productvariants_id) VALUES (@Pid, @Uid, @Path, 2, @VarId)", connection, transaction);
                    galleryCmd.Parameters.AddWithValue("@Pid", productId);
                    galleryCmd.Parameters.AddWithValue("@Uid", GetSqlValue("userid"));
                    galleryCmd.Parameters.AddWithValue("@Path", dbPath);
                    galleryCmd.Parameters.AddWithValue("@VarId", parentId);
                    await galleryCmd.ExecuteNonQueryAsync();
                }
            }
            
            // 8. Insert Serial Numbers
            if (serialNumbers != null)
            {
                foreach (var sn in serialNumbers)
                {
                     var snCmd = new SqlCommand("INSERT INTO Tbl_Serialno (Itemid, Serialno, Status, Isdelete, Rowpurchaseid) VALUES (@ItemId, @Sn, 'Active', 0, 0)", connection, transaction);
                     snCmd.Parameters.AddWithValue("@ItemId", parentId);
                     snCmd.Parameters.AddWithValue("@Sn", (object?)sn["Serialno"]?.ToString() ?? DBNull.Value);
                     await snCmd.ExecuteNonQueryAsync();
                }
            }
            
            // 9. Accounting Info
            var accCmd = new SqlCommand(@"INSERT INTO Tbl_Productvariantsacc (
                Userid, Productid, Productvariantsid, Initialqty, Asofdate, Reorderpoint, 
                Inventoryasset_account, Description, Salesprice, Income_account, Cost, Expense_account, Isdelete, Status
            ) VALUES (
                @Userid, @ProductId, @VariantId, @InitQty, GETDATE(), @Reorder, 
                @InvAsset, @Desc, @SalesPrice, @IncAcc, @Cost, @ExpAcc, 0, 'Active'
            )", connection, transaction);
            accCmd.Parameters.AddWithValue("@Userid", GetSqlValue("userid"));
            accCmd.Parameters.AddWithValue("@ProductId", productId);
            accCmd.Parameters.AddWithValue("@VariantId", parentId);
            accCmd.Parameters.AddWithValue("@InitQty", GetSqlValue("totalqty")); 
            // accCmd.Parameters.AddWithValue("@AsOfDate", DateTime.Now); // Removed

            accCmd.Parameters.AddWithValue("@Reorder", GetSqlValue("Reorderpoint"));
            accCmd.Parameters.AddWithValue("@InvAsset", GetSqlValue("Inventoryasset_account"));
            accCmd.Parameters.AddWithValue("@Desc", GetSqlValue("Description"));
            accCmd.Parameters.AddWithValue("@SalesPrice", GetSqlValue("Salesprice"));
            accCmd.Parameters.AddWithValue("@IncAcc", GetSqlValue("Income_account"));
            accCmd.Parameters.AddWithValue("@Cost", GetSqlValue("Cost"));
            accCmd.Parameters.AddWithValue("@ExpAcc", GetSqlValue("Expense_account"));
            await accCmd.ExecuteNonQueryAsync();


            // 10. Opening Quantity & Inventory & Transactions
            double totalOpeningValue = 0;
            if (openingQtyData != null)
            {
                foreach (var openRow in openingQtyData)
                {
                    // Tbl_Openingqtytable
                    string? whIdStr = openRow.ContainsKey("Warehouseid") ? openRow["Warehouseid"]?.ToString() : null;
                    string? qtyStr = openRow.ContainsKey("Qty") ? openRow["Qty"]?.ToString() : null;
                    string? valStr = openRow.ContainsKey("Value") ? openRow["Value"]?.ToString() : null;
                    
                    if (!string.IsNullOrEmpty(whIdStr) && !string.IsNullOrEmpty(qtyStr))
                    {
                        var opCmd = new SqlCommand(@"INSERT INTO Tbl_Openingqtytable (Itemid, Warehouseid, Qty, Asofdate, [Value], Isdelete) 
                                                     VALUES (@ItemId, @WhId, @Qty, GETDATE(), @Val, 0)", connection, transaction);
                        opCmd.Parameters.AddWithValue("@ItemId", parentId);
                        opCmd.Parameters.AddWithValue("@WhId", whIdStr);
                        opCmd.Parameters.AddWithValue("@Qty", qtyStr);
                        opCmd.Parameters.AddWithValue("@Val", (object?)valStr ?? 0);
                        await opCmd.ExecuteNonQueryAsync();
                        
                        // Accumulate value
                        if (double.TryParse(valStr, out double v)) totalOpeningValue += v;
                        
                        // Tbl_Inventory
                        var invCmd = new SqlCommand(@"INSERT INTO Tbl_Inventory (Productid, Inventory_type, Inventory_date, Productvariantsid, Total_qty, Billid, Warehouse_status, Isdelete, Status, Warehouseid)
                                                      VALUES (@Pid, 1, GETDATE(), @VarId, @Qty, 0, 1, 0, 'Transit', @WhId)", connection, transaction);
                        invCmd.Parameters.AddWithValue("@Pid", productId);
                        invCmd.Parameters.AddWithValue("@VarId", parentId);
                        invCmd.Parameters.AddWithValue("@Qty", qtyStr);
                        invCmd.Parameters.AddWithValue("@WhId", whIdStr);
                        await invCmd.ExecuteNonQueryAsync();
                    }
                }
            }
            
            // 11. Transactions
            if (totalOpeningValue > 0)
            {
                // Hardcoded CatelogID logic (Default to 1 behavior for now)
                // Transaction 1 (Debit)
                var tr1 = new SqlCommand(@"INSERT INTO Tbl_Transaction (Date, Type, Transaction_type, Amount, Isdelete, Status, Entry_type, Ca_id, Itemid, Currency, Currency_rate, Conversion_amount) 
                                           VALUES (GETDATE(), 0, 'Debit', @Amt, 0, 'Active', 'Openingbalance', 50, @ItemId, 2, 1, @Amt)", connection, transaction);
                tr1.Parameters.AddWithValue("@Amt", totalOpeningValue);
                tr1.Parameters.AddWithValue("@ItemId", parentId);
                await tr1.ExecuteNonQueryAsync();

                // Transaction 2 (Credit)
                var tr2 = new SqlCommand(@"INSERT INTO Tbl_Transaction (Date, Type, Transaction_type, Amount, Isdelete, Status, Entry_type, Ca_id, Itemid, Currency, Currency_rate, Conversion_amount) 
                                           VALUES (GETDATE(), 0, 'Credit', @Amt, 0, 'Active', 'Openingbalance', 69, @ItemId, 2, 1, @Amt)", connection, transaction);
                tr2.Parameters.AddWithValue("@Amt", totalOpeningValue);
                tr2.Parameters.AddWithValue("@ItemId", parentId);
                await tr2.ExecuteNonQueryAsync();
            }

            // 12. Insert Log
            var logCmd = new SqlCommand("INSERT INTO Tbl_Productvariantssetlog (Productid, Userid, Actiontype, Date, Productvariantsid, Productsetid) VALUES (@Pid, @Uid, 'Insert', GETDATE(), @VarId, 0)", connection, transaction);
            logCmd.Parameters.AddWithValue("@Pid", productId);
            logCmd.Parameters.AddWithValue("@Uid", GetSqlValue("userid"));
            logCmd.Parameters.AddWithValue("@VarId", parentId);
            await logCmd.ExecuteNonQueryAsync();

            transaction.Commit();
            Console.WriteLine("Transaction Committed.");
            return Results.Json(new { success = true, message = "Product and variants saved successfully", productId = productId });
        }
        catch (Exception)
        {
            transaction.Rollback();
            throw; // Re-throw to be caught by outer catch
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error saving product variant: {ex.Message}");
        return Results.Json(new { success = false, message = $"Error: {ex.Message}" }, statusCode: 500);
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open)
        {
            await connection.CloseAsync();
        }
    }
});

app.MapPost("/api/product/response", async (ApprovalResponseRequest request, SqlConnection connection) => {
    try {
        await connection.OpenAsync();
        
        // 1. Call Comments stored procedure (Query 1) - Save tracking info and comments
        using (var cmd4 = new SqlCommand("Comments", connection)) {
            cmd4.CommandType = System.Data.CommandType.StoredProcedure;
            cmd4.Parameters.AddWithValue("@id", "");
            cmd4.Parameters.AddWithValue("@Userid", request.Userid ?? "");
            cmd4.Parameters.AddWithValue("@Accepted_Userid", "");
            cmd4.Parameters.AddWithValue("@Approved_Userid", request.Approved_Userid ?? "");
            cmd4.Parameters.AddWithValue("@Productid", request.Productid);
            cmd4.Parameters.AddWithValue("@Checked_Date", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            cmd4.Parameters.AddWithValue("@Comments", request.Comments ?? "");
            cmd4.Parameters.AddWithValue("@Status", request.Status == "Approved" ? "1" : "2");
            cmd4.Parameters.AddWithValue("@Query", 1);
            await cmd4.ExecuteNonQueryAsync();
        }

        // 2. Call Product stored procedure (Query 9) - Update product status
        using (var cmd2 = new SqlCommand("Product", connection)) {
            cmd2.CommandType = System.Data.CommandType.StoredProcedure;
            cmd2.Parameters.AddWithValue("@Product_id", request.Productid);
            cmd2.Parameters.AddWithValue("@Approved_Status", request.Status == "Approved" ? "1" : "2");
            cmd2.Parameters.AddWithValue("@Query", 9);
            await cmd2.ExecuteNonQueryAsync();
        }

        return Results.Ok(new { success = true, message = "Response successfully saved" });
    } catch (Exception ex) {
        Console.WriteLine($"Error in product response: {ex.Message}");
        return Results.Json(new { success = false, message = ex.Message }, statusCode: 500);
    } finally {
        if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
});

// Edit Reason endpoint - for saving edit/delete verification requests
app.MapPost("/api/editreason", async (EditReasonRequest request, SqlConnection connection) =>
{
    try
    {
        await connection.OpenAsync();
        
        // Insert into Tbl_Editreason table
        string sql = @"INSERT INTO Tbl_Editreason 
                      (Productid, Userid, Editreason, Adddate, Type, Status, Approved_userid) 
                      VALUES 
                      (@Productid, @Userid, @Editreason, @Adddate, @Type, @Status, @Approved_userid)";
        
        using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@Productid", request.Productid ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@Userid", request.Userid ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@Editreason", request.Editreason ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@Adddate", request.Adddate ?? DateTime.Now.ToString("dd-MM-yyyy HH:mm"));
        command.Parameters.AddWithValue("@Type", request.Type ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@Status", request.Status);
        command.Parameters.AddWithValue("@Approved_userid", request.Approved_userid ?? (object)DBNull.Value);
        
        await command.ExecuteNonQueryAsync();
        
        return Results.Ok(new { success = true, message = "Request submitted successfully" });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error in editreason: {ex.Message}");
        return Results.Json(new { success = false, message = ex.Message }, statusCode: 500);
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
});



// Check if a pending edit/delete request already exists for a product
app.MapGet("/api/editreason/pending/{productId}", async (string productId, SqlConnection connection) =>
{
    try
    {
        await connection.OpenAsync();
        string sql = "SELECT COUNT(1) FROM Tbl_Editreason WHERE Productid = @Pid AND Status = 0";
        using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@Pid", productId);
        
        var count = (int)await command.ExecuteScalarAsync();
        return Results.Ok(new { success = true, hasPendingRequest = count > 0 });
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message }, statusCode: 500);
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
});

// Get all edit/delete requests
app.MapGet("/api/editreason", async (string? status, SqlConnection connection) =>
{
    var response = new EditReasonResponse();
    try
    {
        await connection.OpenAsync();
        
        // Simple query first, can expand to joins if needed for names
        // Ideally we should join with Product and User tables
        /*
           Assuming tables: 
           Tbl_Product (Product_id, Product_Name)
           User_Registration (Userid, Name)
        */
        
        string sql = @"
            SELECT 
                E.id, 
                E.Productid, 
                E.Userid, 
                E.Editreason, 
                E.Type, 
                E.Status, 
                E.Approved_userid,
                P.Product_name as ProductName,
                COALESCE(U.Firstname + ' ' + U.Lastname, E.Userid) as UserName,
                FORMAT(
                    COALESCE(
                        TRY_CONVERT(DATETIME, E.Adddate, 105), -- dd-mm-yyyy
                        TRY_CONVERT(DATETIME, E.Adddate, 103), -- dd/mm/yyyy
                        TRY_CAST(E.Adddate AS DATETIME)        -- Default
                    ), 
                    REPLACE((SELECT TOP 1 Dateformat FROM Tbl_Dateformat WHERE Isdelete=0), 'YY', 'yy')
                ) as Adddate
            FROM Tbl_Editreason E
            LEFT JOIN Tbl_Product P ON E.Productid = P.Product_id
            LEFT JOIN Tbl_Registration U ON E.Userid = U.Userid
            WHERE (@Status IS NULL OR E.Status = @Status)
            AND (E.Approved_userid IS NULL OR E.Approved_userid = '')
            ORDER BY E.id DESC";

        using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@Status", status ?? (object)DBNull.Value);
        
        using var reader = await command.ExecuteReaderAsync();
        var list = new List<EditReasonData>();
        
        while (await reader.ReadAsync())
        {
            var item = new EditReasonData
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                Productid = reader.IsDBNull(reader.GetOrdinal("Productid")) ? "" : reader.GetString(reader.GetOrdinal("Productid")),
                Userid = reader.IsDBNull(reader.GetOrdinal("Userid")) ? "" : reader.GetString(reader.GetOrdinal("Userid")),
                Editreason = reader.IsDBNull(reader.GetOrdinal("Editreason")) ? "" : reader.GetString(reader.GetOrdinal("Editreason")),
                Adddate = reader.IsDBNull(reader.GetOrdinal("Adddate")) ? "" : reader.GetString(reader.GetOrdinal("Adddate")),
                Type = reader.IsDBNull(reader.GetOrdinal("Type")) ? "" : reader.GetString(reader.GetOrdinal("Type")),
                // Handle Status as string or int safely
                Status = reader.IsDBNull(reader.GetOrdinal("Status")) ? 0 : 
                         (int.TryParse(reader["Status"].ToString(), out int s) ? s : 0),
                Approved_userid = reader.IsDBNull(reader.GetOrdinal("Approved_userid")) ? "" : reader.GetString(reader.GetOrdinal("Approved_userid")),
                ProductName = reader.IsDBNull(reader.GetOrdinal("ProductName")) ? "" : reader.GetString(reader.GetOrdinal("ProductName")),
                UserName = reader.IsDBNull(reader.GetOrdinal("UserName")) ? "" : reader.GetString(reader.GetOrdinal("UserName"))
            };
            
            list.Add(item);
        }
        
        response.Success = true;
        response.Data = list;
        return Results.Ok(response);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error fetching edit reasons: {ex.Message}");
        return Results.Json(new { success = false, message = ex.Message }, statusCode: 500);
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
})
.WithName("GetEditReasons")
.WithOpenApi();

// Process Edit Request (Approve/Reject)
app.MapPost("/api/editreason/process", async (ProcessEditReasonRequest request, SqlConnection connection) =>
{
    try
    {
        await connection.OpenAsync();

        string currentDate = DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss");
        string replyType = (request.Type == "Deleterequest") ? "Deleterequestreplay" : "Editrequestreplay";
        string status = request.Status == "1" ? "1" : "2"; // 1=Approve, 2=Reject
        if (status == "2") // REJECT
        {
             using (var cmdReject = new SqlCommand("Product", connection))
             {
                 cmdReject.CommandType = CommandType.StoredProcedure;
                 cmdReject.Parameters.AddWithValue("@Product_id", request.Productid);
                 cmdReject.Parameters.AddWithValue("@Approved_status", "2"); 
                 cmdReject.Parameters.AddWithValue("@Query", 9); 
                 await cmdReject.ExecuteNonQueryAsync();
             }

             // Put Product back to Active (Isdelete = 0) just in case
             using (var cmdActive = new SqlCommand("Product", connection))
             {
                 cmdActive.CommandType = CommandType.StoredProcedure;
                 cmdActive.Parameters.AddWithValue("@Product_id", request.Productid);
                 cmdActive.Parameters.AddWithValue("@Isdelete", 0);
                 cmdActive.Parameters.AddWithValue("@Query", 3);
                 await cmdActive.ExecuteNonQueryAsync();
             }
        }
        else // APPROVE
        {
            // 2) SAVE EDIT REASON (Query=1) - Status "1"
            using (var cmd = new SqlCommand("Sp_Editreasons", connection))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Productid", request.Productid);
                cmd.Parameters.AddWithValue("@Userid", request.Userid);
                cmd.Parameters.AddWithValue("@Editreason", request.Editreason ?? "");
                cmd.Parameters.AddWithValue("@Adddate", currentDate);
                cmd.Parameters.AddWithValue("@Status", "1");
                cmd.Parameters.AddWithValue("@Type", replyType);
                cmd.Parameters.AddWithValue("@Approved_userid", request.Approved_userid ?? "ADMIN");
                cmd.Parameters.AddWithValue("@id", DBNull.Value);
                cmd.Parameters.AddWithValue("@Query", 1);

                await cmd.ExecuteNonQueryAsync();
            }

            if (replyType == "Deleterequestreplay")
            {
                /*
                // Check Bill Details (Query 8) - Commented out due to schema mismatch (varchar vs int)
                using (var cmdCheck = new SqlCommand("Sp_Purchasebilldetails", connection))
                {
                   ...
                }
                */

                // Delete Product
                using (var cmd2 = new SqlCommand("Product", connection))
                {
                    cmd2.CommandType = CommandType.StoredProcedure;
                    cmd2.Parameters.AddWithValue("@Product_id", request.Productid);
                    cmd2.Parameters.AddWithValue("@Isdelete", 1);
                    cmd2.Parameters.AddWithValue("@Query", 3);
                    await cmd2.ExecuteNonQueryAsync();
                }

                // Log
                using (var logCmd = new SqlCommand("Sp_Productlog", connection))
                {
                    logCmd.CommandType = CommandType.StoredProcedure;
                    logCmd.Parameters.AddWithValue("@Productid", request.Productid);
                    logCmd.Parameters.AddWithValue("@Userid", request.Userid);
                    logCmd.Parameters.AddWithValue("@Actiontype", "Delete");
                    logCmd.Parameters.AddWithValue("@Date", currentDate);
                    logCmd.Parameters.AddWithValue("@Query", 1);
                    await logCmd.ExecuteNonQueryAsync();
                }
            }
            else // Edit Request
            {
                // Update Product Approved_Status = 0
                // This resets the product to 'Pending' so it can be edited and re-approved
                using (var cmd2 = new SqlCommand("Product", connection))
                {
                    cmd2.CommandType = CommandType.StoredProcedure;
                    cmd2.Parameters.AddWithValue("@Product_id", request.Productid);
                    cmd2.Parameters.AddWithValue("@Approved_status", "0");
                    cmd2.Parameters.AddWithValue("@Query", 9);
                    await cmd2.ExecuteNonQueryAsync();
                }
            }
        }

        // 5) UPDATE REQUEST STATUS/CLOSURE - Shared
        // Using direct SQL to ensure the original request is updated correctly
        string updateSql = "UPDATE Tbl_Editreason SET Status = @Status, Approved_userid = @Approved_userid WHERE id = @Id";
        using (var updateCmd = new SqlCommand(updateSql, connection))
        {
            updateCmd.Parameters.AddWithValue("@Status", status); 
            updateCmd.Parameters.AddWithValue("@Approved_userid", request.Approved_userid ?? "ADMIN");
            updateCmd.Parameters.AddWithValue("@Id", request.Id);
            await updateCmd.ExecuteNonQueryAsync();
        }

        return Results.Ok(new { success = true, message = status == "1" ? "Request Approved Successfully" : "Request Rejected" });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error processing edit request: {ex.Message}");
        return Results.Json(new { success = false, message = ex.Message }, statusCode: 500);
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
})
.WithName("ProcessEditReason")
.WithOpenApi();

// Endpoint for getting user names and roles (based on user snippet)
app.MapPost("/api/user/person-name", async (SqlConnection connection) =>
{
    try
    {
        await connection.OpenAsync();
        using var command = new SqlCommand("Product", connection)
        {
            CommandType = System.Data.CommandType.StoredProcedure
        };
        command.Parameters.AddWithValue("@Query", 22);
        
        var persons = new List<object>();
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            persons.Add(new
            {
                Id = reader["Userid"],
                NameWithRole = reader["namewithrole"]?.ToString()
            });
        }
        
        return Results.Json(new { success = true, data = persons });
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally
    {
        if (connection.State == System.Data.ConnectionState.Open) await connection.CloseAsync();
    }
})
.WithName("GetPersonName")
.WithOpenApi();

app.MapPost("/api/SaveTaskmultiple", async (HttpRequest request, SqlConnection connection) =>
{
    try
    {
        var form = await request.ReadFormAsync();
        var taskDataStr = form["TaskData"];
        if (string.IsNullOrEmpty(taskDataStr))
            return Results.Json(new { success = false, message = "Invalid data." });

        Console.WriteLine($"[DEBUG] RAW JSON: {taskDataStr}");

        var root = System.Text.Json.JsonSerializer.Deserialize<TaskModel>(taskDataStr, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        if (root == null)
            return Results.Json(new { success = false, message = "Unable to parse task data." });

        Console.WriteLine($"[DEBUG] SaveTaskmultiple: RootId={root.Id}, ItemsCount={root.Items?.Count ?? 0}, AssignedTo={root.Assignedto}");

        if (connection.State != ConnectionState.Open) await connection.OpenAsync();
        using var transaction = connection.BeginTransaction();
        try
        {
            int? groupOwnerId = null;
            string? Pick(params string?[] values) => values.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v));

            if (root.Items == null || root.Items.Count == 0)
            {
                var id = await InsertOrUpdateTask(new TaskModel
                {
                    Id = root.Id,
                    Tasktype = root.Tasktype,
                    Itemid = root.Itemid,
                    Itemtype = root.Itemtype,
                    Marketplace = root.Marketplace,
                    Person = Pick(root.Assignedto, root.Person),
                    Startdate = root.Startdate,
                    Enddate = root.Enddate,
                    Description = root.Description,
                    Catelogid = root.Catelogid,
                    Assignedby = root.Assignedby,
                    Duration = root.Duration
                }, connection, transaction, request.Form.Files, null);

                await UpdateGroupByTask(id, id, connection, transaction);
            }
            else
            {
                for (int i = 0; i < root.Items.Count; i++)
                {
                    var item = root.Items[i];
                    IFormFileCollection? files = (i == 0) ? request.Form.Files : null;

                    var targetId = item.Id > 0 ? item.Id : (i == 0 && root.Id > 0 ? root.Id : 0);

                    var model = new TaskModel
                    {
                        Id = targetId,
                        Tasktype = Pick(item.Tasktype, item.Itemtype, root.Tasktype),
                        Itemid = Pick(item.Itemid, item.ItemName, item.Name, root.Itemid),
                        Itemtype = Pick(item.Itemtype, item.Type, root.Itemtype),
                        Marketplace = Pick(item.Marketplace, root.Marketplace),
                        Person = Pick(item.Assignedto, item.Person, root.Assignedto, root.Person),
                        Startdate = Pick(item.Startdate, root.Startdate),
                        Enddate = Pick(item.Enddate, root.Enddate),
                        Description = Pick(item.Description, root.Description),
                        Catelogid = Pick(item.Catelogid, root.Catelogid),
                        Assignedby = Pick(item.Assignedby, root.Assignedby),
                        Duration = Pick(item.Duration, root.Duration)
                    };

                    var id = await InsertOrUpdateTask(model, connection, transaction, files, groupOwnerId);

                    if (i == 0)
                    {
                        groupOwnerId = id;
                        await UpdateGroupByTask(id, id, connection, transaction);
                    }
                }
            }

            await transaction.CommitAsync();
            return Results.Ok(new { success = true, message = "Task saved successfully!" });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            Console.WriteLine($"[ERROR] SaveTaskmultiple Transaction: {ex.Message}");
            return Results.Json(new { success = false, message = ex.Message });
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[ERROR] SaveTaskmultiple Root: {ex.Message}");
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally
    {
        if (connection.State == ConnectionState.Open) await connection.CloseAsync();
    }
})
.WithName("SaveTaskMultiple")
.WithOpenApi();

async Task<int> InsertOrUpdateTask(TaskModel model, SqlConnection connection, SqlTransaction tx, IFormFileCollection? files, int? groupByTask)
{
    int mainTaskId;
    using (var cmd = new SqlCommand("Sp_Maintask", connection, tx))
    {
        cmd.CommandType = CommandType.StoredProcedure;

        var idParam = new SqlParameter("@Id", SqlDbType.Int)
        {
            Direction = ParameterDirection.InputOutput,
            Value = model.Id > 0 ? model.Id : 0
        };
        cmd.Parameters.Add(idParam);

        cmd.Parameters.AddWithValue("@Itemid", model.Itemid ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@Itemtype", model.Itemtype ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@Tasktype", model.Tasktype ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@Marketplace", model.Marketplace ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@Assignedby", model.Assignedby ?? "ADMIN");
        cmd.Parameters.AddWithValue("@Assignedto", model.Assignedto ?? model.Person ?? (object)DBNull.Value);

        DateTime? startDate = null;
        if (!string.IsNullOrEmpty(model.Startdate))
        {
            string[] formats = { "dd/MM/yyyy", "yyyy-MM-dd", "MM/dd/yyyy", "yyyy-MM-dd HH:mm:ss", "yyyy-MM-ddTHH:mm:ss", "M/d/yyyy" };
            if (DateTime.TryParseExact(model.Startdate, formats, null, System.Globalization.DateTimeStyles.None, out var sd)) startDate = sd;
            else if (DateTime.TryParse(model.Startdate, out var sd2)) startDate = sd2;
        }
        cmd.Parameters.AddWithValue("@Startdate", startDate ?? (object)DBNull.Value);

        DateTime? endDate = null;
        if (!string.IsNullOrEmpty(model.Enddate))
        {
            string[] formats = { "dd/MM/yyyy", "yyyy-MM-dd", "MM/dd/yyyy", "yyyy-MM-dd HH:mm:ss", "yyyy-MM-ddTHH:mm:ss", "M/d/yyyy" };
            if (DateTime.TryParseExact(model.Enddate, formats, null, System.Globalization.DateTimeStyles.None, out var ed)) endDate = ed;
            else if (DateTime.TryParse(model.Enddate, out var ed2)) endDate = ed2;
        }
        cmd.Parameters.AddWithValue("@Enddate", endDate ?? (object)DBNull.Value);

        int query = model.Id > 0 ? 4 : 1;
        Console.WriteLine($"[DEBUG] SP_MAINTASK EXEC: Query={query}, Id={model.Id}, Itemid={model.Itemid}, Assignedto={(model.Assignedto ?? model.Person)}, Start={startDate}");

        cmd.Parameters.AddWithValue("@Description", model.Description ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@Status", model.Id > 0 ? DBNull.Value : (groupByTask.HasValue && groupByTask.Value > 0 ? "1" : "0"));
        
        // Only set Createdat on INSERT
        if (model.Id > 0)
            cmd.Parameters.AddWithValue("@Createdat", DBNull.Value);
        else
            cmd.Parameters.AddWithValue("@Createdat", DateTime.Now);

        cmd.Parameters.AddWithValue("@Isdelete", "0");
        cmd.Parameters.AddWithValue("@Groupbytask", (object)groupByTask ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Catelogid", model.Catelogid ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@Duration", model.Duration ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@Query", query);

        await cmd.ExecuteNonQueryAsync();
        mainTaskId = (int)idParam.Value;
    }

    if (files != null && files.Count > 0)
    {
        string folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Content", "images", "Taskmedia");
        if (!Directory.Exists(folderPath))
            Directory.CreateDirectory(folderPath);

        foreach (var file in files)
        {
            if (file.Length > 0)
            {
                string ext = Path.GetExtension(file.FileName);
                string unique = $"{Path.GetFileNameWithoutExtension(file.FileName)}_{DateTime.Now:yyyyMMdd_HHmmssfff}{ext}";
                string filePath = Path.Combine(folderPath, unique);
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                using (var cmdAttach = new SqlCommand(
                    @"INSERT INTO Tbl_Taskattachment (Maintaskid, Subtaskid, Attachment, Isdelete)
                      VALUES (@Maintaskid, @Subtaskid, @Attachment, @Isdelete)",
                    connection, tx))
                {
                    cmdAttach.Parameters.AddWithValue("@Maintaskid", mainTaskId);
                    cmdAttach.Parameters.AddWithValue("@Subtaskid", "");
                    cmdAttach.Parameters.AddWithValue("@Attachment", "/Content/images/Taskmedia/" + unique);
                    cmdAttach.Parameters.AddWithValue("@Isdelete", "0");
                    await cmdAttach.ExecuteNonQueryAsync();
                }
            }
        }
    }
    return mainTaskId;
}

async Task UpdateGroupByTask(int id, int groupId, SqlConnection connection, SqlTransaction tx)
{
    using (var cmd = new SqlCommand("Sp_Maintask", connection, tx))
    {
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@Id", id);
        cmd.Parameters.AddWithValue("@Groupbytask", groupId.ToString());
        cmd.Parameters.AddWithValue("@Isdelete", "0");
        cmd.Parameters.AddWithValue("@Query", 8);
        await cmd.ExecuteNonQueryAsync();
    }
}






app.MapGet("/api/task/dashboard-stats", async (string userId, SqlConnection connection) =>
{
    try
    {
        await connection.OpenAsync();
        
        // Get user role for permissions
        string role = "User";
        using (var cmdRole = new SqlCommand("SELECT Role FROM Tbl_Registration WHERE Userid = @Userid", connection))
        {
            cmdRole.Parameters.AddWithValue("@Userid", userId);
            var r = await cmdRole.ExecuteScalarAsync();
            if (r != null) role = r.ToString();
        }

        // 1. Fetch Combined and Split Stats
        string sql = @"
            -- Combined Stats logic
            WITH CombinedTasks AS (
                SELECT Status, Enddate, Assignedto, Assignedby, Isdelete, 'Main' as SourceType
                FROM Tbl_Maintask
                UNION ALL
                SELECT Status, Enddate, Assignedto, Assignedby, Isdelete, 'Sub' as SourceType
                FROM Tbl_Subtask
            )
            SELECT 
                ISNULL(COUNT(*), 0) as Total,
                ISNULL(SUM(CASE WHEN Status = '0' THEN 1 ELSE 0 END), 0) as Todo,
                ISNULL(SUM(CASE WHEN Status = '1' THEN 1 ELSE 0 END), 0) as InProgress,
                ISNULL(SUM(CASE WHEN Status = '2' THEN 1 ELSE 0 END), 0) as InReview,
                ISNULL(SUM(CASE WHEN Status = '3' OR Status = 'completed' THEN 1 ELSE 0 END), 0) as Completed,
                ISNULL(SUM(CASE WHEN Status = '4' OR Status = 'closed' THEN 1 ELSE 0 END), 0) as Closed,
                ISNULL(SUM(CASE WHEN Status NOT IN ('3', '4', 'completed', 'closed') AND Enddate < GETDATE() THEN 1 ELSE 0 END), 0) as Overdue,
                ISNULL(SUM(CASE WHEN SourceType = 'Sub' THEN 1 ELSE 0 END), 0) as SubtaskCount
            FROM CombinedTasks T
            WHERE Isdelete = '0'";

        if (!(role == "Manager" || role == "Admin" || role == "Superadmin"))
        {
            sql += " AND (T.Assignedto = @Userid OR T.Assignedby = @Userid)";
        }

        int total = 0, todo = 0, inProgress = 0, inReview = 0, completed = 0, closed = 0, overdue = 0, subtaskTotal = 0;

        using (var cmd = new SqlCommand(sql, connection))
        {
            cmd.Parameters.AddWithValue("@Userid", userId);
            using (var reader = await cmd.ExecuteReaderAsync())
            {
                if (await reader.ReadAsync())
                {
                    total = Convert.ToInt32(reader["Total"]);
                    todo = Convert.ToInt32(reader["Todo"]);
                    inProgress = Convert.ToInt32(reader["InProgress"]);
                    inReview = Convert.ToInt32(reader["InReview"]);
                    completed = Convert.ToInt32(reader["Completed"]);
                    closed = Convert.ToInt32(reader["Closed"]);
                    overdue = Convert.ToInt32(reader["Overdue"]);
                    subtaskTotal = Convert.ToInt32(reader["SubtaskCount"]);
                }
            }
        }

        // 2. Fetch Task Type Breakdown (Combined Main Tasks and Subtasks)
        var typeBreakdown = new List<object>();
        string sqlTypes = "";
        
        if (!(role == "Manager" || role == "Admin" || role == "Superadmin"))
        {
            sqlTypes = @"
                WITH FilteredTasks AS (
                    SELECT Tasktype as Category, Status, Assignedto, Assignedby, Isdelete FROM Tbl_Maintask
                    UNION ALL
                    SELECT Category as Category, Status, Assignedto, Assignedby, Isdelete FROM Tbl_Subtask
                )
                SELECT Category, COUNT(*) as Count
                FROM FilteredTasks
                WHERE Isdelete = '0' AND Category IS NOT NULL AND Category <> ''
                AND Status NOT IN ('3', '4', 'completed', 'closed')
                AND (Assignedto = @Userid OR Assignedby = @Userid)
                GROUP BY Category";
        }
        else 
        {
            sqlTypes = @"
                WITH AllTasks AS (
                    SELECT Tasktype as Category, Status, Isdelete FROM Tbl_Maintask
                    UNION ALL
                    SELECT Category as Category, Status, Isdelete FROM Tbl_Subtask
                )
                SELECT Category, COUNT(*) as Count
                FROM AllTasks
                WHERE Isdelete = '0' AND Category IS NOT NULL AND Category <> ''
                AND Status NOT IN ('3', '4', 'completed', 'closed')
                GROUP BY Category";
        }

        using (var cmdT = new SqlCommand(sqlTypes, connection))
        {
            cmdT.Parameters.AddWithValue("@Userid", userId);
            using (var readerT = await cmdT.ExecuteReaderAsync())
            {
                while (await readerT.ReadAsync())
                {
                    typeBreakdown.Add(new { 
                        name = readerT["Category"]?.ToString() ?? "Other", 
                        value = Convert.ToInt32(readerT["Count"]) 
                    });
                }
            }
        }

        // 3. Fetch Incomplete Tasks by Assignee (Combined)
        var assigneeBreakdown = new List<object>();
        string sqlAssignees = "";
        if (!(role == "Manager" || role == "Admin" || role == "Superadmin"))
        {
            sqlAssignees = @"
                WITH FilteredIncomplete AS (
                    SELECT Assignedto, Assignedby, Isdelete FROM Tbl_Maintask WHERE Status NOT IN ('3', '4', 'completed', 'closed')
                    UNION ALL
                    SELECT Assignedto, Assignedby, Isdelete FROM Tbl_Subtask WHERE Status NOT IN ('3', '4', 'completed', 'closed')
                )
                SELECT U.Firstname, COUNT(*) as Count
                FROM FilteredIncomplete T
                JOIN Tbl_Registration U ON T.Assignedto = U.Userid
                WHERE T.Isdelete = '0' AND (T.Assignedto = @Userid OR T.Assignedby = @Userid)
                GROUP BY U.Firstname";
        }
        else 
        {
            sqlAssignees = @"
                WITH AllIncomplete AS (
                    SELECT Assignedto, Isdelete FROM Tbl_Maintask WHERE Status NOT IN ('3', '4', 'completed', 'closed')
                    UNION ALL
                    SELECT Assignedto, Isdelete FROM Tbl_Subtask WHERE Status NOT IN ('3', '4', 'completed', 'closed')
                )
                SELECT U.Firstname, COUNT(*) as Count
                FROM AllIncomplete T
                JOIN Tbl_Registration U ON T.Assignedto = U.Userid
                WHERE T.Isdelete = '0'
                GROUP BY U.Firstname";
        }

        using (var cmdA = new SqlCommand(sqlAssignees, connection))
        {
            cmdA.Parameters.AddWithValue("@Userid", userId);
            using (var readerA = await cmdA.ExecuteReaderAsync())
            {
                while (await readerA.ReadAsync())
                {
                    assigneeBreakdown.Add(new { 
                        name = readerA["Firstname"]?.ToString() ?? "Unknown", 
                        value = Convert.ToInt32(readerA["Count"]) 
                    });
                }
            }
        }

        return Results.Ok(new {
            total = total,
            todo = todo,
            inProgress = inProgress,
            inReview = inReview,
            completed = completed,
            closed = closed,
            overdue = overdue,
            subtaskCount = subtaskTotal,
            typeBreakdown = typeBreakdown,
            assigneeBreakdown = assigneeBreakdown
        });
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapPost("/api/task/load", async (System.Text.Json.JsonElement request, SqlConnection connection) =>
{
    string userid = request.TryGetProperty("Userid", out var uid) ? uid.GetString() ?? "" : "";
    if (string.IsNullOrEmpty(userid)) userid = request.TryGetProperty("userid", out var uid2) ? uid2.GetString() ?? "" : "";
    
    string catalogId = request.TryGetProperty("CatalogId", out var cid) ? cid.GetString() ?? "" : "";
    if (string.IsNullOrEmpty(catalogId)) catalogId = request.TryGetProperty("catalogId", out var cid2) ? cid2.GetString() ?? "" : "";
    
    try
    {
        await connection.OpenAsync();
        
        string userRole = "";
        
        using (var cmdUser = new SqlCommand("SELECT Catelogid, Role FROM Tbl_Registration WHERE Userid = @Userid", connection))
        {
            cmdUser.Parameters.AddWithValue("@Userid", userid);
            using (var readerUser = await cmdUser.ExecuteReaderAsync())
            {
                if (await readerUser.ReadAsync())
                {
                    if (string.IsNullOrEmpty(catalogId)) catalogId = readerUser["Catelogid"]?.ToString() ?? "";
                    userRole = readerUser["Role"]?.ToString() ?? "";
                }
            }
        }

        Console.WriteLine($"[DEBUG] Loading tasks request: Userid='{userid}', CatalogId='{catalogId}'");
        Console.WriteLine($"[DEBUG] Loading tasks for Userid: {userid}, Role: {userRole}, CatalogId: {catalogId}");

        var taskList = new List<object>();

        // 2. Fetch Tasks using Sp_Maintask Query 2
        using (var cmd = new SqlCommand("Sp_Maintask", connection))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Query", 2);
            cmd.Parameters.AddWithValue("@Userid", userid);
            cmd.Parameters.AddWithValue("@Catelogid", catalogId);
            cmd.Parameters.AddWithValue("@Isdelete", "0");
            
            // Add other parameters as DBNull
            cmd.Parameters.AddWithValue("@Id", 0);
            cmd.Parameters.AddWithValue("@Tasktype", DBNull.Value);
            cmd.Parameters.AddWithValue("@Itemid", DBNull.Value);
            cmd.Parameters.AddWithValue("@Itemtype", DBNull.Value);
            cmd.Parameters.AddWithValue("@Marketplace", DBNull.Value);
            cmd.Parameters.AddWithValue("@Description", DBNull.Value);
            cmd.Parameters.AddWithValue("@Assignedby", DBNull.Value);
            cmd.Parameters.AddWithValue("@Assignedto", DBNull.Value);
            cmd.Parameters.AddWithValue("@Startdate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Enddate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Status", DBNull.Value);
            cmd.Parameters.AddWithValue("@Createdat", DBNull.Value);
            cmd.Parameters.AddWithValue("@Closeddate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Groupbytask", DBNull.Value);

            using (var reader = await cmd.ExecuteReaderAsync())
            {
                bool first = true;
                while (await reader.ReadAsync())
                {
                    if (first) {
                        Console.WriteLine($"[DEBUG] First task raw: Id={reader["Id"]}, Status='{reader["Status"]}', Assignedto='{reader["Assignedto"]}'");
                        first = false;
                    }
                    taskList.Add(new
                    {
                        Id = reader["Id"].ToString(),
                        Tasktype = reader["Tasktype"]?.ToString(),
                        Itemid = reader["Itemid"]?.ToString(),
                        Itemtype = reader["Itemtype"]?.ToString(),
                        ItemName = reader["ItemName"]?.ToString(),
                        Assignedby = reader["Assignedby"]?.ToString(),
                        Assignedto = reader["Assignedto"]?.ToString(),
                        AssignedByName = reader["AssignedByName"]?.ToString(),
                        AssignedToName = reader["AssignedToName"]?.ToString(),
                        Status = reader["Status"]?.ToString()?.Trim(),
                        Createdat = reader["Createdat"] == DBNull.Value ? null : ((DateTime)reader["Createdat"]).ToString("yyyy-MM-dd"),
                        Startdate = reader["Startdate"] == DBNull.Value ? null : ((DateTime)reader["Startdate"]).ToString("yyyy-MM-dd"),
                        Enddate = reader["Enddate"] == DBNull.Value ? null : ((DateTime)reader["Enddate"]).ToString("yyyy-MM-dd"),
                        Description = reader["Description"]?.ToString(),
                        Duration = reader["Duration"]?.ToString(),
                        Marketplace = reader["Marketplace"]?.ToString(),
                        ClosedDate = reader["ClosedDate"] == DBNull.Value ? null : ((DateTime)reader["ClosedDate"]).ToString("yyyy-MM-dd"),
                        AttachmentCount = reader["AttachmentCount"]?.ToString() ?? "0",
                        UnreadCount = reader["UnreadCount"]?.ToString() ?? "0",
                        Gallery_file = reader["Gallery_file"]?.ToString()
                    });
                }
            }
        }

        Console.WriteLine($"[DEBUG] Successfully fetched {taskList.Count} tasks for Userid: {userid}");
        foreach (var t in taskList)
        {
             var task = (dynamic)t;
             Console.WriteLine($"[DEBUG] Task loaded: Id={task.Id}, Status='{task.Status}', ItemName='{task.ItemName}'");
        }

        // ─── Also fetch Subtasks assigned to this user ───────────────────────
        var subtaskList = new List<object>();
        try
        {
            using (var subtaskCmd = new SqlCommand("Sp_Subtask", connection))
            {
                subtaskCmd.CommandType = CommandType.StoredProcedure;
                subtaskCmd.Parameters.AddWithValue("@Query", 6);
                subtaskCmd.Parameters.AddWithValue("@Assignedto", userid);
                subtaskCmd.Parameters.AddWithValue("@Id", 0);
                subtaskCmd.Parameters.AddWithValue("@Maintaskid", DBNull.Value);
                subtaskCmd.Parameters.AddWithValue("@Assignedby", DBNull.Value);
                subtaskCmd.Parameters.AddWithValue("@Status", DBNull.Value);
                subtaskCmd.Parameters.AddWithValue("@Isdelete", "0");
                subtaskCmd.Parameters.AddWithValue("@Title", DBNull.Value);
                subtaskCmd.Parameters.AddWithValue("@Description", DBNull.Value);
                subtaskCmd.Parameters.AddWithValue("@Startdate", DBNull.Value);
                subtaskCmd.Parameters.AddWithValue("@Enddate", DBNull.Value);
                subtaskCmd.Parameters.AddWithValue("@Createdat", DBNull.Value);
                subtaskCmd.Parameters.AddWithValue("@Category", DBNull.Value);
                subtaskCmd.Parameters.AddWithValue("@Attachment", DBNull.Value);

                using (var reader = await subtaskCmd.ExecuteReaderAsync())
                {
                    var columns = new HashSet<string>(
                        Enumerable.Range(0, reader.FieldCount).Select(reader.GetName),
                        StringComparer.OrdinalIgnoreCase);

                    while (await reader.ReadAsync())
                    {
                        subtaskList.Add(new
                        {
                            Id = reader["Id"]?.ToString(),
                            Title = columns.Contains("Title") ? reader["Title"]?.ToString() : "",
                            Description = columns.Contains("Description") ? reader["Description"]?.ToString() : "",
                            Assignedby = columns.Contains("Assignedby") ? reader["Assignedby"]?.ToString() : "",
                            Assignedto = columns.Contains("Assignedto") ? reader["Assignedto"]?.ToString() : "",
                            AssignedByName = columns.Contains("AssignedByName") ? reader["AssignedByName"]?.ToString() : "",
                            AssignedToName = columns.Contains("Firstname") ? reader["Firstname"]?.ToString() : "",
                            Status = columns.Contains("Status") ? reader["Status"]?.ToString()?.Trim() : "0",
                            Startdate = columns.Contains("Startdate") && reader["Startdate"] != DBNull.Value ? ((DateTime)reader["Startdate"]).ToString("yyyy-MM-dd") : "",
                            Enddate = columns.Contains("Enddate") && reader["Enddate"] != DBNull.Value ? ((DateTime)reader["Enddate"]).ToString("yyyy-MM-dd") : "",
                            Createdat = columns.Contains("Createdat") && reader["Createdat"] != DBNull.Value ? ((DateTime)reader["Createdat"]).ToString("yyyy-MM-dd") : "",
                            Maintaskid = columns.Contains("Maintaskid") ? reader["Maintaskid"]?.ToString() : "",
                            Itemtype = "Subtask",
                            Tasktype = "Subtask",
                            IsSubtask = true,
                            Type = "Sub",
                            Gallery_file = columns.Contains("Gallery_file") ? reader["Gallery_file"]?.ToString() : "",
                            UnreadCount = "0",
                            AttachmentCount = "0"
                        });
                    }
                }
            }
            Console.WriteLine($"[DEBUG] Successfully fetched {subtaskList.Count} subtasks for Userid: {userid}");
        }
        catch (Exception subEx)
        {
            // Don't fail the whole request if subtask loading fails
            Console.WriteLine($"[WARN] Could not load subtasks for {userid}: {subEx.Message}");
        }

        return Results.Ok(new { success = true, data = taskList, subtasks = subtaskList, catalogId = catalogId });
    }
    catch (Exception ex)
    {
        string err = $"[{DateTime.Now}] [ERROR] /api/task/load: {ex.Message}\n{ex.StackTrace}\n\n";
        System.IO.File.AppendAllText("api_errors.log", err);
        Console.WriteLine(err);
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});


app.MapPost("/api/task/report", async (TaskFetchRequest request, SqlConnection connection) =>
{
    try
    {
        await connection.OpenAsync();
        var taskList = new List<object>();
        using (var cmd = new SqlCommand("Sp_Maintask", connection))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Query", 7);
            cmd.Parameters.AddWithValue("@Userid", request.Userid);
            cmd.Parameters.AddWithValue("@Catelogid", request.CatalogId ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Isdelete", "0");
            
            // Add other parameters as DBNull
            cmd.Parameters.AddWithValue("@Id", 0);
            cmd.Parameters.AddWithValue("@Tasktype", DBNull.Value);
            cmd.Parameters.AddWithValue("@Itemid", DBNull.Value);
            cmd.Parameters.AddWithValue("@Itemtype", DBNull.Value);
            cmd.Parameters.AddWithValue("@Marketplace", DBNull.Value);
            cmd.Parameters.AddWithValue("@Description", DBNull.Value);
            cmd.Parameters.AddWithValue("@Assignedby", DBNull.Value);
            cmd.Parameters.AddWithValue("@Assignedto", DBNull.Value);
            cmd.Parameters.AddWithValue("@Startdate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Enddate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Status", DBNull.Value);
            cmd.Parameters.AddWithValue("@Createdat", DBNull.Value);
            cmd.Parameters.AddWithValue("@Closeddate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Groupbytask", DBNull.Value);
            cmd.Parameters.AddWithValue("@Duration", DBNull.Value);

            using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    taskList.Add(new
                    {
                        Id = reader["Id"].ToString(),
                        Tasktype = reader["Tasktype"]?.ToString(),
                        ItemName = reader["ItemName"]?.ToString(),
                        AssignedByName = reader["AssignedByName"]?.ToString(),
                        AssignedToName = reader["AssignedToName"]?.ToString(),
                        Startdate = reader["Startdate"]?.ToString(),
                        Enddate = reader["Enddate"]?.ToString(),
                        Status = reader["Status"]?.ToString()?.Trim()
                    });
                }
            }
        }
        return Results.Ok(new { success = true, data = taskList });
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

// Alias for Search/Report matching jQuery snippet
app.MapGet("/Item/GetAllTasksmultiple", async (string? userid, string? catelogid, SqlConnection connection) =>
{
    try
    {
        await connection.OpenAsync();
        var taskList = new List<object>();
        using (var cmd = new SqlCommand("Sp_Maintask", connection))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Query", 9);
            cmd.Parameters.AddWithValue("@Userid", userid ?? "");
            cmd.Parameters.AddWithValue("@Catelogid", catelogid ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Isdelete", "0");
            
            // Standard parameters for Sp_Maintask
            cmd.Parameters.AddWithValue("@Id", 0);
            cmd.Parameters.AddWithValue("@Tasktype", DBNull.Value);
            cmd.Parameters.AddWithValue("@Itemid", DBNull.Value);
            cmd.Parameters.AddWithValue("@Itemtype", DBNull.Value);
            cmd.Parameters.AddWithValue("@Marketplace", DBNull.Value);
            cmd.Parameters.AddWithValue("@Description", DBNull.Value);
            cmd.Parameters.AddWithValue("@Assignedby", DBNull.Value);
            cmd.Parameters.AddWithValue("@Assignedto", DBNull.Value);
            cmd.Parameters.AddWithValue("@Startdate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Enddate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Status", DBNull.Value);
            cmd.Parameters.AddWithValue("@Createdat", DBNull.Value);
            cmd.Parameters.AddWithValue("@Closeddate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Groupbytask", DBNull.Value);

            using (var reader = await cmd.ExecuteReaderAsync())
            {
                var columns = Enumerable.Range(0, reader.FieldCount).Select(reader.GetName).ToHashSet(StringComparer.OrdinalIgnoreCase);
                var dict = new Dictionary<string, object>();
                while (await reader.ReadAsync())
                {
                    var idStr = reader["Id"].ToString();
                    if (!string.IsNullOrEmpty(idStr) && !dict.ContainsKey(idStr))
                    {
                        dict[idStr] = new
                        {
                            Id = idStr,
                            Tasktype = reader["Tasktype"]?.ToString(),
                            AssignedToName = reader["AssignedToName"]?.ToString(),
                            AssignedByName = reader["AssignedByName"]?.ToString(),
                            Assignedby = reader["Assignedby"]?.ToString(),
                            Assignedto = reader["Assignedto"]?.ToString(),
                            Status = reader["Status"]?.ToString(),
                            Description = reader["Description"]?.ToString(),
                            Startdate = reader["Startdate"] == DBNull.Value ? null : ((DateTime)reader["Startdate"]).ToString("yyyy-MM-dd"),
                            Enddate = reader["Enddate"] == DBNull.Value ? null : ((DateTime)reader["Enddate"]).ToString("yyyy-MM-dd"),
                            CreatedAt = reader["Createdat"] == DBNull.Value ? null : ((DateTime)reader["Createdat"]).ToString("yyyy-MM-dd"),
                            AttachmentCount = columns.Contains("AttachmentCount") ? Convert.ToInt32(reader["AttachmentCount"]) : 0
                        };
                    }
                }
                return Results.Ok(new { success = true, List1 = dict.Values });
            }
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[ERROR] /Item/GetAllTasksmultiple: {ex.Message}");
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapPost("/Item/LoadTasksByUserfull", async (HttpContext context, SqlConnection connection) =>
{
    var form = await context.Request.ReadFormAsync();
    string userId = form["userId"].ToString();
    string? catalogId = form["catalogId"].ToString();
    if (string.IsNullOrEmpty(catalogId)) catalogId = null;
    
    try
    {
        await connection.OpenAsync();
        
        // Ensure we have a valid CatalogId (mimic getcatelogid)
        if (string.IsNullOrEmpty(catalogId))
        {
            using (var cmdUser = new SqlCommand("SELECT Catelogid FROM Tbl_Registration WHERE Userid = @Userid", connection))
            {
                cmdUser.Parameters.AddWithValue("@Userid", userId);
                var result = await cmdUser.ExecuteScalarAsync();
                if (result != null && result != DBNull.Value)
                {
                    catalogId = result.ToString();
                }
            }
        }

        Console.WriteLine($"[DEBUG] LoadTasksByUserfull: Userid='{userId}', CatalogId='{catalogId}'");
        
        var taskList = new List<object>();
        var subtaskList = new List<object>();

        // 1. Fetch Main Tasks
        using (var cmd = new SqlCommand("Sp_Maintask", connection))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Query", 2); // Changed from 7 to 2 to ensure data return
            cmd.Parameters.AddWithValue("@Userid", userId);
            cmd.Parameters.AddWithValue("@Catelogid", catalogId ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Isdelete", "0");
            // Fill mandatory params
            cmd.Parameters.AddWithValue("@Id", 0);
            cmd.Parameters.AddWithValue("@Tasktype", DBNull.Value);
            cmd.Parameters.AddWithValue("@Itemid", DBNull.Value);
            cmd.Parameters.AddWithValue("@Itemtype", DBNull.Value);
            cmd.Parameters.AddWithValue("@Marketplace", DBNull.Value);
            cmd.Parameters.AddWithValue("@Description", DBNull.Value);
            cmd.Parameters.AddWithValue("@Assignedby", DBNull.Value);
            cmd.Parameters.AddWithValue("@Assignedto", DBNull.Value);
            cmd.Parameters.AddWithValue("@Startdate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Enddate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Status", DBNull.Value);
            cmd.Parameters.AddWithValue("@Createdat", DBNull.Value);

            using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    string tid = reader["Id"]?.ToString() ?? "";
                    Console.WriteLine($"[DEBUG] Main Task Found: {tid}");
                    taskList.Add(new
                    {
                        Id = tid,
                        Tasktype = reader["Tasktype"]?.ToString() ?? "Listing",
                        Title = reader["ItemName"]?.ToString() ?? "N/A",
                        Createdat = reader["Createdat"]?.ToString(),
                        Status = reader["Status"]?.ToString()?.Trim(),
                        Startdate = reader["Startdate"]?.ToString(),
                        Enddate = reader["Enddate"]?.ToString(),
                        Assignedby = reader["Assignedby"]?.ToString(),
                        Assignedto = reader["Assignedto"]?.ToString(),
                        AssignedByName = reader["AssignedByName"]?.ToString(),
                        AssignedToName = reader["AssignedToName"]?.ToString(),
                        Itemtype = reader["Itemtype"]?.ToString(),
                        Type = "Main",
                        Description = reader["Description"]?.ToString(),
                        Gallery_file = reader["Gallery_file"]?.ToString(),
                        Itemid = reader["Itemid"]?.ToString(),
                        UnreadCount = 0
                    });
                }
            }
        }

        // 2. Fetch Subtasks
        using (var subtaskCmd = new SqlCommand("Sp_Subtask", connection))
        {
            subtaskCmd.CommandType = CommandType.StoredProcedure;
            subtaskCmd.Parameters.AddWithValue("@Assignedto", userId);
            subtaskCmd.Parameters.AddWithValue("@Query", 10);
            subtaskCmd.Parameters.AddWithValue("@Id", 0);
            subtaskCmd.Parameters.AddWithValue("@Maintaskid", DBNull.Value);
            subtaskCmd.Parameters.AddWithValue("@Assignedby", DBNull.Value);
            subtaskCmd.Parameters.AddWithValue("@Status", DBNull.Value);
            subtaskCmd.Parameters.AddWithValue("@Isdelete", DBNull.Value);
            subtaskCmd.Parameters.AddWithValue("@Title", DBNull.Value);
            subtaskCmd.Parameters.AddWithValue("@Description", DBNull.Value);
            subtaskCmd.Parameters.AddWithValue("@Startdate", DBNull.Value);
            subtaskCmd.Parameters.AddWithValue("@Enddate", DBNull.Value);
            subtaskCmd.Parameters.AddWithValue("@Createdat", DBNull.Value);

            using (var reader = await subtaskCmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    string sid = reader["Id"]?.ToString() ?? "";
                    Console.WriteLine($"[DEBUG] Subtask Found: {sid}");
                    subtaskList.Add(new
                    {
                        Id = sid,
                        Title = reader["Title"]?.ToString(),
                        Description = reader["Description"]?.ToString(),
                        Createdat = reader["Createdat"]?.ToString(),
                        Status = reader["Status"]?.ToString()?.Trim(),
                        Startdate = reader["Startdate"]?.ToString(),
                        Enddate = reader["Enddate"]?.ToString(),
                        Assignedby = reader["Assignedby"]?.ToString(),
                        Assignedto = reader["Assignedto"]?.ToString(),
                        Itemtype = "Subtask",
                        Tasktype = "Subtask",
                        AssignedByName = reader["AssignedByName"]?.ToString(),
                        AssignedToName = reader["AssignedToName"]?.ToString(),
                        Type = "Sub",
                        IsSubtask = true,
                        Maintaskid = reader["Maintaskid"]?.ToString(),
                        UnreadCount = 0
                    });
                }
            }
        }



        Console.WriteLine($"[DEBUG] Found {taskList.Count} main tasks and {subtaskList.Count} subtasks for Userid: {userId}");
        return Results.Ok(new { success = true, data = taskList, subtasks = subtaskList });
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapGet("/api/task/get-by-group", async (int taskId, SqlConnection connection) =>
{
    try
    {
        await connection.OpenAsync();
        var tasks = new List<object>();
        var attachments = new List<object>();

        // 1. Get Group Tasks
        using (var cmd = new SqlCommand("Sp_Maintask", connection))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Query", 10);
            cmd.Parameters.AddWithValue("@Id", taskId);
            // Default other params
            cmd.Parameters.AddWithValue("@Tasktype", DBNull.Value);
            cmd.Parameters.AddWithValue("@Itemid", DBNull.Value);
            cmd.Parameters.AddWithValue("@Itemtype", DBNull.Value);
            cmd.Parameters.AddWithValue("@Marketplace", DBNull.Value);
            cmd.Parameters.AddWithValue("@Description", DBNull.Value);
            cmd.Parameters.AddWithValue("@Assignedby", DBNull.Value);
            cmd.Parameters.AddWithValue("@Assignedto", DBNull.Value);
            cmd.Parameters.AddWithValue("@Startdate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Enddate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Status", DBNull.Value);
            cmd.Parameters.AddWithValue("@Createdat", DBNull.Value);
            cmd.Parameters.AddWithValue("@Isdelete", "0");

            using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    tasks.Add(new
                    {
                        Id = reader["Id"],
                        Tasktype = reader["Tasktype"],
                        Itemid = reader["Itemid"],
                        Itemtype = reader["Itemtype"],
                        Marketplace = reader["Marketplace"],
                        Description = reader["Description"],
                        Assignedto = reader["Assignedto"],
                        Startdate = reader["Startdate"] != DBNull.Value ? ((DateTime)reader["Startdate"]).ToString("yyyy-MM-dd") : "",
                        Enddate = reader["Enddate"] != DBNull.Value ? ((DateTime)reader["Enddate"]).ToString("yyyy-MM-dd") : "",
                        ItemName = reader["ItemName"]
                    });
                }
            }
        }

        // 2. Get Attachments
        using (var cmdAttach = new SqlCommand("SELECT Id, Attachment FROM Tbl_Taskattachment WHERE Maintaskid = @Maintaskid AND Isdelete = 0", connection))
        {
            cmdAttach.Parameters.AddWithValue("@Maintaskid", taskId);
            using (var readerAttach = await cmdAttach.ExecuteReaderAsync())
            {
                while (await readerAttach.ReadAsync())
                {
                    attachments.Add(new
                    {
                        Id = readerAttach["Id"],
                        File = readerAttach["Attachment"]
                    });
                }
            }
        }

        return Results.Ok(new { success = true, data = tasks, attachments = attachments });
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

// Alias for Edit fetch
app.MapGet("/Item/GetTaskByIdmultiple", async (int taskId, SqlConnection connection) =>
{
    try
    {
        await connection.OpenAsync();
        var tasks = new List<object>();
        var attachments = new List<object>();

        using (var cmd = new SqlCommand("Sp_Maintask", connection))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Query", 10);
            cmd.Parameters.AddWithValue("@Id", taskId);
            cmd.Parameters.AddWithValue("@Isdelete", "0");
            // Default other params
            cmd.Parameters.AddWithValue("@Tasktype", DBNull.Value);
            cmd.Parameters.AddWithValue("@Itemid", DBNull.Value);
            cmd.Parameters.AddWithValue("@Itemtype", DBNull.Value);
            cmd.Parameters.AddWithValue("@Marketplace", DBNull.Value);
            cmd.Parameters.AddWithValue("@Description", DBNull.Value);
            cmd.Parameters.AddWithValue("@Assignedby", DBNull.Value);
            cmd.Parameters.AddWithValue("@Assignedto", DBNull.Value);
            cmd.Parameters.AddWithValue("@Startdate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Enddate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Status", DBNull.Value);
            cmd.Parameters.AddWithValue("@Createdat", DBNull.Value);

            using (var reader = await cmd.ExecuteReaderAsync())
            {
                var columns = Enumerable.Range(0, reader.FieldCount).Select(reader.GetName).ToHashSet(StringComparer.OrdinalIgnoreCase);
                while (await reader.ReadAsync())
                {
                    tasks.Add(new
                    {
                        Id = reader["Id"],
                        Tasktype = columns.Contains("Tasktype") ? reader["Tasktype"]?.ToString() : "",
                        Itemid = columns.Contains("Itemid") ? reader["Itemid"]?.ToString() : "",
                        Itemtype = columns.Contains("Itemtype") ? reader["Itemtype"]?.ToString() : "",
                        Marketplace = columns.Contains("Marketplace") ? reader["Marketplace"]?.ToString() : "",
                        Description = columns.Contains("Description") ? reader["Description"]?.ToString() : "",
                        Assignedby = columns.Contains("Assignedby") ? reader["Assignedby"]?.ToString() : "",
                        Assignedto = columns.Contains("Assignedto") ? reader["Assignedto"]?.ToString() : "",
                        Startdate = columns.Contains("Startdate") && reader["Startdate"] != DBNull.Value ? ((DateTime)reader["Startdate"]).ToString("yyyy-MM-dd") : "",
                        Enddate = columns.Contains("Enddate") && reader["Enddate"] != DBNull.Value ? ((DateTime)reader["Enddate"]).ToString("yyyy-MM-dd") : "",
                        ItemName = columns.Contains("ItemName") ? reader["ItemName"]?.ToString() : "",
                        AssignedByName = columns.Contains("AssignedByName") ? reader["AssignedByName"]?.ToString() : "",
                        AssignedToName = columns.Contains("AssignedToName") ? reader["AssignedToName"]?.ToString() : "",
                        Status = columns.Contains("Status") ? reader["Status"]?.ToString() : "",
                        Duration = columns.Contains("Duration") ? reader["Duration"]?.ToString() : "",
                        Createdat = columns.Contains("Createdat") && reader["Createdat"] != DBNull.Value ? ((DateTime)reader["Createdat"]).ToString("yyyy-MM-dd") : ""
                    });
                }
            }
        }

        // Get Attachments from both Tbl_Taskattachment and Tbl_Taskmedia
        using (var cmdAttach = new SqlCommand(@"
            -- 1. Get from Tbl_Taskattachment
            SELECT A.Id, A.Attachment, CAST(0 AS INT) as IsMediaTable 
            FROM Tbl_Taskattachment A
            INNER JOIN Tbl_Maintask T ON A.Maintaskid = T.Id
            WHERE (T.Id = @TaskId OR COALESCE(NULLIF(T.Groupbytask, ''), T.Id) = (SELECT COALESCE(NULLIF(Groupbytask, ''), Id) FROM Tbl_Maintask WHERE Id = @TaskId))
              AND A.Isdelete = 0
            
            UNION ALL
            
            -- 2. Get from Tbl_Taskmedia
            SELECT M.Id, M.Filename, CAST(1 AS INT) as IsMediaTable
            FROM Tbl_Taskmedia M
            WHERE (M.Maintaskid = @TaskId OR M.Maintaskid IN (SELECT Id FROM Tbl_Maintask WHERE COALESCE(NULLIF(Groupbytask, ''), Id) = (SELECT COALESCE(NULLIF(Groupbytask, ''), Id) FROM Tbl_Maintask WHERE Id = @TaskId)))
              AND M.Isdelete = '0'", connection))
        {
            cmdAttach.Parameters.AddWithValue("@TaskId", taskId);
            using (var readerAttach = await cmdAttach.ExecuteReaderAsync())
            {
                while (await readerAttach.ReadAsync())
                {
                    attachments.Add(new
                    {
                        Id = readerAttach["Id"],
                        File = readerAttach["Attachment"],
                        IsMedia = (int)readerAttach["IsMediaTable"] == 1
                    });
                }
            }
        }

        return Results.Ok(new { success = true, data = tasks, attachments = attachments });
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapPost("/Item/DeleteTaskAttachment", async (int id, bool isMedia, SqlConnection connection) =>
{
    try 
    {
        await connection.OpenAsync();
        string table = isMedia ? "Tbl_Taskmedia" : "Tbl_Taskattachment";
        string sql = isMedia ? $"UPDATE {table} SET Isdelete = '1' WHERE Id = @Id" : $"UPDATE {table} SET Isdelete = 1 WHERE Id = @Id" ;
        using (var cmd = new SqlCommand(sql, connection))
        {
            cmd.Parameters.AddWithValue("@Id", id);
            await cmd.ExecuteNonQueryAsync();
        }
        return Results.Ok(new { success = true });
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapPost("/Item/GetTaskById", async (HttpContext context, SqlConnection connection) =>
{
    try
    {
        var form = await context.Request.ReadFormAsync();
        int taskId = int.Parse(form["taskId"]);

        Console.WriteLine($"[DEBUG] GetTaskById called for TaskId: {taskId}");
        await connection.OpenAsync();
        object? taskData = null;
        var attachments = new List<object>();

        using (var cmd = new SqlCommand("Sp_Maintask", connection))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Query", 3);
            var idParam = new SqlParameter("@Id", SqlDbType.Int)
            {
                Direction = ParameterDirection.InputOutput,
                Value = taskId
            };
            cmd.Parameters.Add(idParam);
            
            // Default params as DBNull (standard for Query 10)
            cmd.Parameters.AddWithValue("@Tasktype", DBNull.Value);
            cmd.Parameters.AddWithValue("@Itemid", DBNull.Value);
            cmd.Parameters.AddWithValue("@Itemtype", DBNull.Value);
            cmd.Parameters.AddWithValue("@Marketplace", DBNull.Value);
            cmd.Parameters.AddWithValue("@Description", DBNull.Value);
            cmd.Parameters.AddWithValue("@Assignedby", DBNull.Value);
            cmd.Parameters.AddWithValue("@Assignedto", DBNull.Value); 
            cmd.Parameters.AddWithValue("@Startdate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Enddate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Status", DBNull.Value);
            cmd.Parameters.AddWithValue("@Createdat", DBNull.Value);
            cmd.Parameters.AddWithValue("@Isdelete", "0"); 
            cmd.Parameters.AddWithValue("@Catelogid", DBNull.Value);
            cmd.Parameters.AddWithValue("@Closeddate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Groupbytask", DBNull.Value);
            cmd.Parameters.AddWithValue("@Duration", DBNull.Value);

            using (var reader = await cmd.ExecuteReaderAsync())
            {
                if (await reader.ReadAsync())
                {
                    var columns = Enumerable.Range(0, reader.FieldCount).Select(reader.GetName).ToHashSet(StringComparer.OrdinalIgnoreCase);

                    taskData = new
                    {
                        Id = reader["Id"],
                        Tasktype = columns.Contains("Tasktype") ? reader["Tasktype"]?.ToString() : "",
                        Description = columns.Contains("Description") ? reader["Description"]?.ToString() : "",
                        Assignedby = columns.Contains("Assignedby") ? reader["Assignedby"]?.ToString() : "",
                        Assignedto = columns.Contains("Assignedto") ? reader["Assignedto"]?.ToString() : "",
                        Createdat = columns.Contains("Createdat") ? reader["Createdat"]?.ToString() : "",
                        Startdate = columns.Contains("Startdate") && reader["Startdate"] != DBNull.Value ? ((DateTime)reader["Startdate"]).ToString("MMM dd") : "",
                        Enddate = columns.Contains("Enddate") && reader["Enddate"] != DBNull.Value ? ((DateTime)reader["Enddate"]).ToString("MMM dd") : "",
                        Marketplace = columns.Contains("Marketplace") ? reader["Marketplace"]?.ToString() : "",
                        ItemName = columns.Contains("ItemName") ? reader["ItemName"]?.ToString() : "",
                        AssignedByName = columns.Contains("AssignedByName") ? reader["AssignedByName"]?.ToString() : "",
                        AssignedToName = columns.Contains("AssignedToName") ? reader["AssignedToName"]?.ToString() : "",
                        Status = columns.Contains("Status") ? reader["Status"]?.ToString() : "",
                        Itemtype = columns.Contains("Itemtype") ? reader["Itemtype"]?.ToString() : "",
                        Itemid = columns.Contains("Itemid") ? reader["Itemid"]?.ToString() : ""
                    };
                    Console.WriteLine($"[DEBUG] GetTaskById: Task {taskId} found.");
                }
                else
                {
                    Console.WriteLine($"[DEBUG] GetTaskById: Task {taskId} NOT found in database.");
                }
            }
        }

        if (taskData == null) return Results.Json(new { success = false, message = "Task not found" });

        // Attachments
        using (var cmdAttach = new SqlCommand(@"
            SELECT Id, Attachment
            FROM Tbl_Taskattachment
            WHERE Isdelete = '0'
            AND (
                Maintaskid = @Id
                OR CAST(Maintaskid AS VARCHAR) IN (
                    SELECT Groupbytask 
                    FROM Tbl_Maintask 
                    WHERE Id = @Id 
                    AND Groupbytask IS NOT NULL 
                    AND Groupbytask <> ''
                )
            )", connection))
        {
            cmdAttach.Parameters.AddWithValue("@Id", taskId);
            using (var readerAttach = await cmdAttach.ExecuteReaderAsync())
            {
                while (await readerAttach.ReadAsync())
                {
                    attachments.Add(new { Id = readerAttach["Id"].ToString(), File = readerAttach["Attachment"].ToString() });
                }
            }
        }

        Console.WriteLine($"[DEBUG] GetTaskById: Found {attachments.Count} attachments for TaskId: {taskId}");

        // We assume we can get Currentuserid from context/session, but minimal API is stateless.
        // We'll return the string "SessionUser" or allow client to handle it.
        // The snippet returns Currentuserid = Session["Userid"].
        // We'll approximate or skip if not critical, but frontend logic uses it to show edit buttons.
        // We'll fetch it from Tbl_Registration if we had auth, but we don't here easily.
        // Passing "0" or letting frontend handle it.

        return Results.Ok(new { success = true, data = taskData, attachments = attachments, Currentuserid = "0" }); 
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapPost("/Item/GetSubtaskByIdview", async (HttpContext context, SqlConnection connection) =>
{
    try
    {
        var form = await context.Request.ReadFormAsync();
        int taskId = int.Parse(form["taskId"]);

        await connection.OpenAsync();
        object? subtask = null;

        using (var cmd = new SqlCommand("Sp_Subtask", connection))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Query", 7);
            cmd.Parameters.AddWithValue("@Id", taskId);
             // Defaults matching snippet
             cmd.Parameters.AddWithValue("@Assignedto", "");
             cmd.Parameters.AddWithValue("@Maintaskid", "");
             cmd.Parameters.AddWithValue("@Assignedby", "");
             cmd.Parameters.AddWithValue("@Status", "");
             cmd.Parameters.AddWithValue("@Isdelete", "");
             cmd.Parameters.AddWithValue("@Title", "");
             cmd.Parameters.AddWithValue("@Description", "");
             cmd.Parameters.AddWithValue("@Startdate", DBNull.Value);
             cmd.Parameters.AddWithValue("@Enddate", DBNull.Value);
             cmd.Parameters.AddWithValue("@Createdat", DBNull.Value);

             using (var reader = await cmd.ExecuteReaderAsync())
             {
                 if (await reader.ReadAsync())
                 {
                     subtask = new
                     {
                         Id = reader["Id"].ToString(),
                         Maintaskid = reader["Maintaskid"].ToString(),
                         Title = reader["Title"].ToString(),
                         Description = reader["Description"].ToString(),
                         Startdate = reader["Startdate"] != DBNull.Value ? ((DateTime)reader["Startdate"]).ToString("MMM dd") : "",
                         Enddate = reader["Enddate"] != DBNull.Value ? ((DateTime)reader["Enddate"]).ToString("MMM dd") : "",
                         Assignedby = reader["Assignedby"].ToString(),
                         Assignedto = reader["Assignedto"].ToString(),
                         AssignedByName = reader["AssignedByName"].ToString(),
                         AssignedToName = reader["AssignedToName"].ToString(),
                         Createdat = reader["Createdat"] != DBNull.Value ? ((DateTime)reader["Createdat"]).ToString("MMM dd") : "",
                         Status = reader["Status"].ToString(),
                         ItemName = reader["ItemName"].ToString(),
                         Itemid = reader["Itemid"].ToString(),
                         Itemtype = reader["Itemtype"].ToString()
                     };
                 }
             }
        }

        if (subtask == null) return Results.Json(new { success = false, message = "Subtask not found." });

        return Results.Ok(new { success = true, data = subtask, Currentuserid = "0" });
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapPost("/Item/DeleteTaskmultiple", async (int taskId, SqlConnection connection) => {
    try
    {
        await connection.OpenAsync();
        using (var cmd = new SqlCommand("Sp_Maintask", connection))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Query", 11);
            cmd.Parameters.AddWithValue("@Id", taskId);
            cmd.Parameters.AddWithValue("@Isdelete", "1");
            // Default other params
            cmd.Parameters.AddWithValue("@Tasktype", DBNull.Value);
            cmd.Parameters.AddWithValue("@Itemid", DBNull.Value);
            cmd.Parameters.AddWithValue("@Itemtype", DBNull.Value);
            cmd.Parameters.AddWithValue("@Marketplace", DBNull.Value);
            cmd.Parameters.AddWithValue("@Description", DBNull.Value);
            cmd.Parameters.AddWithValue("@Assignedby", DBNull.Value);
            cmd.Parameters.AddWithValue("@Assignedto", DBNull.Value);
            cmd.Parameters.AddWithValue("@Startdate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Enddate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Status", DBNull.Value);
            cmd.Parameters.AddWithValue("@Createdat", DBNull.Value);
            await cmd.ExecuteNonQueryAsync();
        }
        return Results.Ok(new { success = true, message = "Task deleted successfully!" });
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapPost("/Item/GetSavedLinks", async (HttpContext context, SqlConnection connection) =>
{
    try
    {
        var body = await context.Request.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        int maintaskid = body.TryGetProperty("maintaskid", out var mProp) ? (int.TryParse(mProp.ToString(), out int mId) ? mId : 0) : 0;
        int subtaskid = body.TryGetProperty("subtaskid", out var sProp) ? (int.TryParse(sProp.ToString(), out int sId) ? sId : 0) : 0;

        var links = new List<object>();
        await connection.OpenAsync();
        string query = @"SELECT Marketplace, Link FROM Tbl_TaskLinks 
                         WHERE (Maintaskid = @Maintaskid AND @Maintaskid > 0) 
                            OR (SubtaskId = @Subtaskid AND @Subtaskid > 0)";

        using (var cmd = new SqlCommand(query, connection))
        {
            cmd.Parameters.AddWithValue("@Maintaskid", maintaskid);
            cmd.Parameters.AddWithValue("@Subtaskid", subtaskid);
            using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    links.Add(new { Marketplace = reader["Marketplace"].ToString(), Link = reader["Link"].ToString() });
                }
            }
        }
        return Results.Ok(new { success = true, data = links });
    }
    catch (Exception ex) { return Results.Json(new { success = false, message = ex.Message }); }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapPost("/Item/SaveLinks", async (HttpContext context, SqlConnection connection) => 
{
    try 
    {
        var body = await context.Request.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        string maintaskid = body.TryGetProperty("maintaskid", out var mProp) ? mProp.ToString() : "0";
        string subtaskid = body.TryGetProperty("subtaskid", out var sProp) ? (sProp.ValueKind == System.Text.Json.JsonValueKind.Null ? null : sProp.ToString()) : null;
        string userid = body.TryGetProperty("userid", out var uProp) ? uProp.ToString() : "0";

        await connection.OpenAsync();
        using (var transaction = connection.BeginTransaction())
        {
            try
            {
                int savedCount = 0;
                int updatedCount = 0;

                if (body.TryGetProperty("links", out var linksProp) && linksProp.ValueKind == System.Text.Json.JsonValueKind.Array)
                {
                    foreach (var link in linksProp.EnumerateArray())
                    {
                        string mkt = link.TryGetProperty("Marketplace", out var mktP) ? mktP.GetString() : (link.TryGetProperty("marketplace", out var mktP2) ? mktP2.GetString() : "");
                        string url = link.TryGetProperty("Link", out var lnkP) ? lnkP.GetString() : (link.TryGetProperty("link", out var lnkP2) ? lnkP2.GetString() : "");

                        string checkSql = @"
                            SELECT COUNT(*) 
                            FROM Tbl_TaskLinks 
                            WHERE Maintaskid = @Maintaskid 
                              AND ((@Subtaskid IS NULL AND Subtaskid IS NULL) OR (Subtaskid = @Subtaskid))
                              AND Marketplace = @Marketplace
                              AND Isdelete = '0'";

                        int count = 0;
                        using (var checkCmd = new SqlCommand(checkSql, connection, transaction))
                        {
                            checkCmd.Parameters.AddWithValue("@Maintaskid", maintaskid);
                            checkCmd.Parameters.AddWithValue("@Subtaskid", string.IsNullOrEmpty(subtaskid) ? (object)DBNull.Value : subtaskid);
                            checkCmd.Parameters.AddWithValue("@Marketplace", mkt ?? "");
                            count = (int)await checkCmd.ExecuteScalarAsync();
                        }

                        if (count > 0)
                        {
                            string updateSql = @"
                                UPDATE Tbl_TaskLinks
                                SET Link = @Link, Createdby = @Createdby, Createdate = GETDATE()
                                WHERE Maintaskid = @Maintaskid
                                  AND ((@Subtaskid IS NULL AND Subtaskid IS NULL) OR (Subtaskid = @Subtaskid))
                                  AND Marketplace = @Marketplace
                                  AND Isdelete = '0'";
                            using (var updateCmd = new SqlCommand(updateSql, connection, transaction))
                            {
                                updateCmd.Parameters.AddWithValue("@Link", url ?? "");
                                updateCmd.Parameters.AddWithValue("@Createdby", userid);
                                updateCmd.Parameters.AddWithValue("@Maintaskid", maintaskid);
                                updateCmd.Parameters.AddWithValue("@Subtaskid", string.IsNullOrEmpty(subtaskid) ? (object)DBNull.Value : subtaskid);
                                updateCmd.Parameters.AddWithValue("@Marketplace", mkt ?? "");
                                await updateCmd.ExecuteNonQueryAsync();
                            }
                            updatedCount++;
                        }
                        else
                        {
                            string insertSql = @"
                                INSERT INTO Tbl_TaskLinks 
                                    (Maintaskid, Subtaskid, Marketplace, Link, Createdby, Isdelete, Createdate)
                                VALUES 
                                    (@Maintaskid, @Subtaskid, @Marketplace, @Link, @Createdby, '0', GETDATE())";
                            using (var insertCmd = new SqlCommand(insertSql, connection, transaction))
                            {
                                insertCmd.Parameters.AddWithValue("@Maintaskid", maintaskid);
                                insertCmd.Parameters.AddWithValue("@Subtaskid", string.IsNullOrEmpty(subtaskid) ? (object)DBNull.Value : subtaskid);
                                insertCmd.Parameters.AddWithValue("@Marketplace", mkt ?? "");
                                insertCmd.Parameters.AddWithValue("@Link", url ?? "");
                                insertCmd.Parameters.AddWithValue("@Createdby", userid);
                                await insertCmd.ExecuteNonQueryAsync();
                            }
                            savedCount++;
                        }
                    }
                }
                await transaction.CommitAsync();

                string finalMsg = "";
                if (savedCount > 0 && updatedCount > 0) finalMsg = $"{savedCount} link(s) saved and {updatedCount} link(s) updated successfully!";
                else if (savedCount > 0) finalMsg = $"{savedCount} link(s) saved successfully!";
                else if (updatedCount > 0) finalMsg = $"{updatedCount} link(s) updated successfully!";
                else finalMsg = "No changes were made.";

                // Select back the updated list
                var linkList = new List<object>();
                string selectSql = @"
                    SELECT Id, Marketplace, Link
                    FROM Tbl_TaskLinks
                    WHERE Maintaskid = @Maintaskid
                    AND ((@Subtaskid IS NULL AND Subtaskid IS NULL) OR (Subtaskid = @Subtaskid))
                    AND Isdelete = '0'";
                using (var selectCmd = new SqlCommand(selectSql, connection))
                {
                    selectCmd.Parameters.AddWithValue("@Maintaskid", maintaskid);
                    selectCmd.Parameters.AddWithValue("@Subtaskid", string.IsNullOrEmpty(subtaskid) ? (object)DBNull.Value : subtaskid);
                    using (var reader = await selectCmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            linkList.Add(new
                            {
                                Id = reader["Id"],
                                marketplace = reader["Marketplace"].ToString(),
                                link = reader["Link"].ToString()
                            });
                        }
                    }
                }
                return Results.Ok(new { success = true, message = finalMsg, data = linkList });
            }
            catch (Exception) { await transaction.RollbackAsync(); throw; }
        }
    }
    catch (Exception ex) { return Results.Json(new { success = false, message = ex.Message }); }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapPost("/Product/getMarketplace1", async (SqlConnection connection) => 
{
    try
    {
        await connection.OpenAsync();
        var list = new List<object>();
        using (var cmd = new SqlCommand("SELECT DISTINCT Marketplace FROM Tbl_Marketplace WHERE Status = 'Active'", connection))
        {
            using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    list.Add(new { marketplace1 = reader["Marketplace"].ToString() });
                }
            }
        }
        return Results.Ok(new { list1 = list });
    }
    catch (Exception ex) { return Results.Json(new { success = false, message = ex.Message }); }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapPost("/Item/UpdateTaskStatus", async (HttpContext context, SqlConnection connection) =>
{
    try
    {
        var form = await context.Request.ReadFormAsync();
        string taskId = form["taskId"].ToString().Trim();
        string newStatus = form["newStatus"].ToString().Trim();
        string type = form["type"].ToString().Trim();
        string userid = form["userid"].ToString().Trim() ?? "0";
        if (string.IsNullOrEmpty(userid)) userid = "0";

        Console.WriteLine($"[DEBUG] UpdateTaskStatus INCOMING: taskId='{taskId}', newStatus='{newStatus}', type='{type}', userid='{userid}'");

        await connection.OpenAsync();
        using (var transaction = connection.BeginTransaction())
        {
            try
            {
                if (type == "Sub" || type == "Subtask")
                {
                    using (var cmd = new SqlCommand("Sp_Subtask", connection, transaction))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", taskId);
                        cmd.Parameters.AddWithValue("@Status", newStatus);
                        cmd.Parameters.AddWithValue("@Query", "8");
                        cmd.Parameters.AddWithValue("@Maintaskid", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Assignedby", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Assignedto", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Startdate", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Enddate", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Createdat", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Isdelete", "0");
                        cmd.Parameters.AddWithValue("@Title", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Description", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Closeddate", newStatus == "4" ? DateTime.Now : (object)DBNull.Value);
                        int rows = await cmd.ExecuteNonQueryAsync();
                        Console.WriteLine($"[DEBUG] Sp_Subtask Query 8 results: rows affected = {rows}, taskId={taskId}, newStatus={newStatus}");
                    }

                    using (var cmdLog = new SqlCommand("Sp_Tasklog", connection, transaction))
                    {
                        cmdLog.CommandType = CommandType.StoredProcedure;
                        cmdLog.Parameters.AddWithValue("@Id", 0);
                        cmdLog.Parameters.AddWithValue("@Userid", userid);
                        cmdLog.Parameters.AddWithValue("@Maintaskid", 0);
                        cmdLog.Parameters.AddWithValue("@Subtaskid", taskId);
                        cmdLog.Parameters.AddWithValue("@Updatedstatus", newStatus);
                        cmdLog.Parameters.AddWithValue("@Updateddate", DateTime.Now);
                        cmdLog.Parameters.AddWithValue("@Query", 1);
                        await cmdLog.ExecuteNonQueryAsync();
                    }
                }
                else
                {
                    using (var cmd = new SqlCommand("Sp_Maintask", connection, transaction))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", taskId);
                        cmd.Parameters.AddWithValue("@Status", newStatus);
                        cmd.Parameters.AddWithValue("@Query", "5");
                        cmd.Parameters.AddWithValue("@Tasktype", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Itemid", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Itemtype", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Marketplace", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Description", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Assignedby", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Assignedto", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Startdate", (newStatus == "1" || newStatus == "2" || newStatus == "3") ? DateTime.Now : (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Enddate", (newStatus == "1" || newStatus == "2" || newStatus == "3") ? DateTime.Now : (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Createdat", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Isdelete", "0");
                        cmd.Parameters.AddWithValue("@Closeddate", newStatus == "4" ? DateTime.Now : (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Groupbytask", DBNull.Value);
                        int rows = await cmd.ExecuteNonQueryAsync();
                        Console.WriteLine($"[DEBUG] Sp_Maintask Query 5 results: rows affected = {rows}, taskId={taskId}, newStatus={newStatus}");
                    }

                    using (var cmdLog = new SqlCommand("Sp_Tasklog", connection, transaction))
                    {
                        cmdLog.CommandType = CommandType.StoredProcedure;
                        cmdLog.Parameters.AddWithValue("@Id", 0);
                        cmdLog.Parameters.AddWithValue("@Userid", userid);
                        cmdLog.Parameters.AddWithValue("@Maintaskid", taskId);
                        cmdLog.Parameters.AddWithValue("@Subtaskid", 0);
                        cmdLog.Parameters.AddWithValue("@Updatedstatus", newStatus);
                        cmdLog.Parameters.AddWithValue("@Updateddate", DateTime.Now);
                        cmdLog.Parameters.AddWithValue("@Query", 1);
                        await cmdLog.ExecuteNonQueryAsync();
                    }
                }
                await transaction.CommitAsync();
                return Results.Ok(new { success = true, message = "Successfully changed the status" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return Results.Json(new { success = false, message = ex.Message });
            }
        }
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapGet("/Item/GetUploadedMedia", async (string mainTaskId, string? subTaskId, SqlConnection connection) =>
{
    try
    {
        await connection.OpenAsync();
        var mediaList = new List<object>();

        using (var cmd = new SqlCommand("Sp_Taskmedia", connection))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Maintaskid", mainTaskId);
            cmd.Parameters.AddWithValue("@Subtaskid", string.IsNullOrEmpty(subTaskId) ? (object)DBNull.Value : subTaskId);
            cmd.Parameters.AddWithValue("@Query", 2);
            cmd.Parameters.AddWithValue("@Filename", "");
            cmd.Parameters.AddWithValue("@Filetype", "");
            cmd.Parameters.AddWithValue("@Uploadedby", "");
            cmd.Parameters.AddWithValue("@Uploadedate", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            cmd.Parameters.AddWithValue("@Status", "");
            cmd.Parameters.AddWithValue("@Isdelete", "");
            cmd.Parameters.AddWithValue("@Id", 0);

            using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    mediaList.Add(new
                    {
                        FileName = reader["Filename"]?.ToString(),
                        FileType = reader["Filetype"]?.ToString()
                    });
                }
            }
        }
        return Results.Ok(new { success = true, data = mediaList });
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapPost("/Item/UploadTaskMedia", async (HttpContext context, SqlConnection connection) =>
{
    Console.WriteLine("[DEBUG] INCOMING: /Item/UploadTaskMedia");
    try
    {
        var form = await context.Request.ReadFormAsync();
        string mainTaskId = form["MainTaskId"].ToString();
        string subTaskId = form["SubTaskId"].ToString();
        string userid = form["UserId"].ToString() ?? "0";

        var files = context.Request.Form.Files;
        if (files.Count == 0)
            return Results.Json(new { success = false, message = "No files received." });

        string uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Content", "Images", "Taskmedia");
        if (!Directory.Exists(uploadFolder))
            Directory.CreateDirectory(uploadFolder);

        await connection.OpenAsync();

        foreach (var file in files)
        {
            if (file != null && file.Length > 0)
            {
                string originalFileName = Path.GetFileName(file.FileName);
                string fileType = Path.GetExtension(originalFileName).TrimStart('.');
                string uniqueFileName = $"{Guid.NewGuid()}_{originalFileName}";
                string filePath = Path.Combine(uploadFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                using (var cmd = new SqlCommand("Sp_Taskmedia", connection))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@Id", DBNull.Value);
                    cmd.Parameters.AddWithValue("@Filename", "/Content/Images/Taskmedia/" + uniqueFileName);
                    cmd.Parameters.AddWithValue("@Filetype", fileType);
                    cmd.Parameters.AddWithValue("@Maintaskid", string.IsNullOrEmpty(mainTaskId) ? (object)DBNull.Value : mainTaskId);
                    cmd.Parameters.AddWithValue("@Subtaskid", string.IsNullOrEmpty(subTaskId) ? (object)DBNull.Value : subTaskId);
                    cmd.Parameters.AddWithValue("@Uploadedby", userid);
                    cmd.Parameters.AddWithValue("@Uploadedate", DateTime.Now);
                    cmd.Parameters.AddWithValue("@Status", "Active");
                    cmd.Parameters.AddWithValue("@Isdelete", "0");
                    cmd.Parameters.AddWithValue("@Query", 1);

                    await cmd.ExecuteNonQueryAsync();
                }
            }
        }

        return Results.Ok(new { success = true });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[ERROR] UploadTaskMedia: {ex.Message}");
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapPost("/api/Item/SaveComment", async (HttpContext context, SqlConnection connection) =>
{
    Console.WriteLine("[DEBUG] INCOMING: /api/Item/SaveComment");
    try
    {
        var form = await context.Request.ReadFormAsync();
        string maintaskId = form["Maintaskid"].ToString();
        string subtaskId = form["Subtaskid"].ToString();
        string userid = form["Userid"].ToString();
        string comment = form["Comment"].ToString();
        
        var file = context.Request.Form.Files["File"];
        string? attachmentPath = null;

        if (file != null && file.Length > 0)
        {
            string uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Content", "Images", "ChatFiles");
            if (!Directory.Exists(uploadFolder)) Directory.CreateDirectory(uploadFolder);

            string fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            string filePath = Path.Combine(uploadFolder, fileName);
            
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
            attachmentPath = "/Content/Images/ChatFiles/" + fileName;
        }

        await connection.OpenAsync();
        using (var cmd = new SqlCommand("Sp_Taskcomments", connection))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Id", DBNull.Value);
            cmd.Parameters.AddWithValue("@Maintaskid", string.IsNullOrEmpty(maintaskId) || maintaskId == "0" || maintaskId == "undefined" ? (object)DBNull.Value : maintaskId);
            cmd.Parameters.AddWithValue("@Subtaskid", string.IsNullOrEmpty(subtaskId) || subtaskId == "0" || subtaskId == "undefined" ? (object)DBNull.Value : subtaskId);
            cmd.Parameters.AddWithValue("@Userid", userid);
            cmd.Parameters.AddWithValue("@Comment", comment ?? "");
            cmd.Parameters.AddWithValue("@Createdat", DateTime.Now);
            cmd.Parameters.AddWithValue("@Files", (object?)attachmentPath ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Status", "0");
            cmd.Parameters.AddWithValue("@Isdelete", "0");
            cmd.Parameters.AddWithValue("@Query", 1);
            cmd.Parameters.AddWithValue("@CurrentUserId", userid);

            await cmd.ExecuteNonQueryAsync();
        }
        return Results.Ok(new { success = true });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[ERROR] SaveComment: {ex.Message}");
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapPost("/api/Item/AssignSubtaskAsync", async (HttpContext context, SqlConnection connection, IConfiguration config) => 
{
    Console.WriteLine("[DEBUG] INCOMING: /api/Item/AssignSubtaskAsync");
    try 
    {
        var form = await context.Request.ReadFormAsync();
        string maintaskid = form["Maintaskid"].ToString();
        string title = form["Title"].ToString();
        string description = form["Description"].ToString();
        string startDate = form["startDate"].ToString();
        string endDate = form["endDate"].ToString();
        string assignedto = form["Assignedto"].ToString();
        string category = form["Category"].ToString();
        string assignedby = form["Assignedby"].ToString();

        var file = context.Request.Form.Files["attachment"];
        string? attachmentPath = null;

        if (file != null && file.Length > 0)
        {
            string uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Content", "images", "Taskmedia");
            if (!Directory.Exists(uploadFolder)) Directory.CreateDirectory(uploadFolder);
            
            string timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
            string fileName = $"attachment_{timestamp}{Path.GetExtension(file.FileName)}";
            string filePath = Path.Combine(uploadFolder, fileName);
            
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
            attachmentPath = "/Content/images/Taskmedia/" + fileName;
        }

        await connection.OpenAsync();
        int newSubtaskId = 0;

        // Check which columns exist in Tbl_Subtask
        var existingCols = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        using (var colCmd = new SqlCommand(@"
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Tbl_Subtask'", connection))
        using (var colReader = await colCmd.ExecuteReaderAsync())
        {
            while (await colReader.ReadAsync())
                existingCols.Add(colReader[0].ToString()!);
        }
        Console.WriteLine($"[DEBUG] Tbl_Subtask columns: {string.Join(", ", existingCols)}");

        // Add Category column if missing
        if (!existingCols.Contains("Category"))
        {
            using var alter1 = new SqlCommand("ALTER TABLE Tbl_Subtask ADD Category varchar(100) NULL", connection);
            await alter1.ExecuteNonQueryAsync();
            existingCols.Add("Category");
            Console.WriteLine("[DEBUG] Added Category column to Tbl_Subtask");
        }
        // Add Attachment column if missing
        if (!existingCols.Contains("Attachment"))
        {
            using var alter2 = new SqlCommand("ALTER TABLE Tbl_Subtask ADD Attachment varchar(MAX) NULL", connection);
            await alter2.ExecuteNonQueryAsync();
            existingCols.Add("Attachment");
            Console.WriteLine("[DEBUG] Added Attachment column to Tbl_Subtask");
        }

        // Direct INSERT
        using (var cmd = new SqlCommand(@"
            INSERT INTO Tbl_Subtask 
                (Maintaskid, Assignedby, Assignedto, Startdate, Enddate, Status, Createdat, Isdelete, Title, Description, Category, Attachment)
            VALUES
                (@Maintaskid, @Assignedby, @Assignedto, @Startdate, @Enddate, @Status, @Createdat, @Isdelete, @Title, @Description, @Category, @Attachment);
            SELECT SCOPE_IDENTITY();", connection))
        {
            cmd.Parameters.AddWithValue("@Maintaskid", maintaskid);
            cmd.Parameters.AddWithValue("@Assignedby", string.IsNullOrEmpty(assignedby) ? (object)DBNull.Value : assignedby);
            cmd.Parameters.AddWithValue("@Assignedto", string.IsNullOrEmpty(assignedto) ? (object)DBNull.Value : assignedto);
            cmd.Parameters.AddWithValue("@Startdate", string.IsNullOrEmpty(startDate) ? (object)DBNull.Value : Convert.ToDateTime(startDate));
            cmd.Parameters.AddWithValue("@Enddate", string.IsNullOrEmpty(endDate) ? (object)DBNull.Value : Convert.ToDateTime(endDate));
            cmd.Parameters.AddWithValue("@Status", "0");
            cmd.Parameters.AddWithValue("@Createdat", DateTime.Now);
            cmd.Parameters.AddWithValue("@Isdelete", "0");
            cmd.Parameters.AddWithValue("@Title", string.IsNullOrEmpty(title) ? description : title);
            cmd.Parameters.AddWithValue("@Description", description ?? "");
            cmd.Parameters.AddWithValue("@Category", string.IsNullOrEmpty(category) ? (object)DBNull.Value : category);
            cmd.Parameters.AddWithValue("@Attachment", (object?)attachmentPath ?? DBNull.Value);

            var result = await cmd.ExecuteScalarAsync();
            newSubtaskId = result != null && result != DBNull.Value ? Convert.ToInt32(result) : 0;
            Console.WriteLine($"[DEBUG] Subtask inserted. NewSubtaskId = {newSubtaskId}");
        }

        // --- DevTask API Push ---
        string devTaskApiUrl = config["DevTaskApiUrl"];
        string erpBaseUrl = config["ErpBaseUrl"];
        string devTaskStatus = "Success (ERP Only)";

        if (!string.IsNullOrEmpty(devTaskApiUrl) && newSubtaskId > 0)
        {
            try
            {
                using (var client = new HttpClient())
                {
                    var payload = new
                    {
                        maintaskid = maintaskid,
                        subtaskid = newSubtaskId,
                        title = title,
                        description = description,
                        startDate = startDate,
                        endDate = endDate,
                        assignedto = assignedto,
                        assignedby = assignedby,
                        category = category,
                        attachmentUrl = !string.IsNullOrEmpty(attachmentPath) ? (erpBaseUrl?.TrimEnd('/') + attachmentPath) : null
                    };

                    var apiResponse = await client.PostAsJsonAsync(devTaskApiUrl, payload);
                    if (apiResponse.IsSuccessStatusCode)
                    {
                        devTaskStatus = "Success (Pushed to DevTask)";
                    }
                    else
                    {
                        devTaskStatus = "Partial Success (ERP Saved, DevTask Push Failed)";
                        Console.WriteLine($"[WARNING] DevTask push failed: {apiResponse.StatusCode}");
                    }
                }
            }
            catch (Exception ex)
            {
                devTaskStatus = "Partial Success (ERP Saved, DevTask Push Error)";
                Console.WriteLine($"[ERROR] DevTask push exception: {ex.Message}");
            }
        }

        return Results.Ok(new { 
            success = true, 
            message = devTaskStatus == "Success (ERP Only)" ? "Subtask assigned successfully!" : devTaskStatus, 
            subtaskId = newSubtaskId 
        });
    }
    catch (Exception ex) 
    {
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapPost("/api/Item/GetComments", async (HttpContext context, SqlConnection connection) => 
{
    try 
    {
        var form = await context.Request.ReadFormAsync();
        string maintaskId = form["Maintaskid"].ToString();
        string subtaskId = form["Subtaskid"].ToString();
        string currentUserId = form["CurrentUserId"].ToString();

        var commentsList = new List<object>();
        await connection.OpenAsync();
        using (var cmd = new SqlCommand("Sp_Taskcomments", connection))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Query", 2);
            cmd.Parameters.AddWithValue("@Maintaskid", string.IsNullOrEmpty(maintaskId) || maintaskId == "undefined" ? (object)DBNull.Value : maintaskId);
            cmd.Parameters.AddWithValue("@Subtaskid", string.IsNullOrEmpty(subtaskId) || subtaskId == "undefined" || subtaskId == "0" ? (object)DBNull.Value : subtaskId);
            cmd.Parameters.AddWithValue("@CurrentUserId", currentUserId);
            
            // Default other params with nulls/defaults
            cmd.Parameters.AddWithValue("@Id", DBNull.Value);
            cmd.Parameters.AddWithValue("@Userid", DBNull.Value);
            cmd.Parameters.AddWithValue("@Comment", DBNull.Value);
            cmd.Parameters.AddWithValue("@Createdat", DBNull.Value);
            cmd.Parameters.AddWithValue("@Files", DBNull.Value);
            cmd.Parameters.AddWithValue("@Status", DBNull.Value);
            cmd.Parameters.AddWithValue("@Isdelete", DBNull.Value);

            using (var reader = await cmd.ExecuteReaderAsync())
            {
                var columns = new HashSet<string>(Enumerable.Range(0, reader.FieldCount).Select(reader.GetName), StringComparer.OrdinalIgnoreCase);
                while (await reader.ReadAsync())
                {
                    commentsList.Add(new
                    {
                        Id = columns.Contains("Id") ? reader["Id"] : null,
                        Comment = columns.Contains("Comment") ? reader["Comment"]?.ToString() : null,
                        Userid = columns.Contains("Userid") ? reader["Userid"]?.ToString() : null,
                        Createdat = columns.Contains("Createdat") ? reader["Createdat"] : null,
                        Files = columns.Contains("Files") && reader["Files"] != DBNull.Value ? reader["Files"].ToString() : null,
                        Firstname = columns.Contains("Firstname") ? reader["Firstname"]?.ToString() : null,
                        IsRead = columns.Contains("IsRead") ? reader["IsRead"] : 0
                    });
                }
            }
        }
        return Results.Ok(new { success = true, data = commentsList });
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});



app.MapPost("/api/task/delete-group", async (int taskId, SqlConnection connection) =>
{
    try
    {
        await connection.OpenAsync();
        using (var cmd = new SqlCommand("Sp_Maintask", connection))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Query", 11);
            cmd.Parameters.AddWithValue("@Id", taskId);
            cmd.Parameters.AddWithValue("@Isdelete", "1");
            // Default other params
            cmd.Parameters.AddWithValue("@Tasktype", DBNull.Value);
            cmd.Parameters.AddWithValue("@Itemid", DBNull.Value);
            cmd.Parameters.AddWithValue("@Itemtype", DBNull.Value);
            cmd.Parameters.AddWithValue("@Marketplace", DBNull.Value);
            cmd.Parameters.AddWithValue("@Description", DBNull.Value);
            cmd.Parameters.AddWithValue("@Assignedby", DBNull.Value);
            cmd.Parameters.AddWithValue("@Assignedto", DBNull.Value);
            cmd.Parameters.AddWithValue("@Startdate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Enddate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Status", DBNull.Value);
            cmd.Parameters.AddWithValue("@Createdat", DBNull.Value);

            await cmd.ExecuteNonQueryAsync();
        }
        return Results.Ok(new { success = true, message = "Task group deleted successfully!" });
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapGet("/api/Item/GetSubtasks/{taskId}", async (int taskId, SqlConnection connection) => 
{
    Console.WriteLine($"[DEBUG] INCOMING: /api/Item/GetSubtasks/{taskId}");
    try 
    {
        var subtasks = new List<object>();
        await connection.OpenAsync();
        using (var cmd = new SqlCommand("Sp_Subtask", connection))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Query", 2);
            cmd.Parameters.AddWithValue("@Maintaskid", taskId.ToString());
            
            // Required params for Sp_Subtask (legacy support)

            cmd.Parameters.AddWithValue("@Id", 0);
            cmd.Parameters.AddWithValue("@Assignedby", "");
            cmd.Parameters.AddWithValue("@Assignedto", "");
            cmd.Parameters.AddWithValue("@Startdate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Enddate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Status", "");
            cmd.Parameters.AddWithValue("@Createdat", DBNull.Value);
            cmd.Parameters.AddWithValue("@Isdelete", "0");
            cmd.Parameters.AddWithValue("@Title", "");
            cmd.Parameters.AddWithValue("@Description", "");

            using (var reader = await cmd.ExecuteReaderAsync())
            {
                var columns = new HashSet<string>(Enumerable.Range(0, reader.FieldCount).Select(reader.GetName), StringComparer.OrdinalIgnoreCase);
                while (await reader.ReadAsync())
                {
                    subtasks.Add(new
                    {
                        Id = columns.Contains("Id") ? reader["Id"]?.ToString() : "",
                        Title = columns.Contains("Title") ? reader["Title"]?.ToString() : "",
                        // Raw user IDs
                        Assignedto = columns.Contains("Assignedto") ? reader["Assignedto"]?.ToString() : "",
                        Assignedby = columns.Contains("Assignedby") ? reader["Assignedby"]?.ToString() : "",
                        // Display names (resolved via JOIN in Sp_Subtask)
                        AssignedToName = columns.Contains("Firstname") ? reader["Firstname"]?.ToString() : "",
                        AssignedByName = columns.Contains("AssignedByName") ? reader["AssignedByName"]?.ToString() : "",
                        // Keep legacy field for backward compat
                        AssignedByUserName = columns.Contains("AssignedByName") ? reader["AssignedByName"]?.ToString() : "",
                        Status = columns.Contains("Status") ? reader["Status"]?.ToString() : "",
                        CreatedByUserId = columns.Contains("Assignedby") ? reader["Assignedby"]?.ToString() : "",
                        Startdate = columns.Contains("Startdate") && reader["Startdate"] != DBNull.Value ? ((DateTime)reader["Startdate"]).ToString("yyyy-MM-dd") : "",
                        Enddate = columns.Contains("Enddate") && reader["Enddate"] != DBNull.Value ? ((DateTime)reader["Enddate"]).ToString("yyyy-MM-dd") : "",
                        External_startdate = columns.Contains("External_startdate") && reader["External_startdate"] != DBNull.Value ? reader["External_startdate"] : null,
                        External_enddate = columns.Contains("External_enddate") && reader["External_enddate"] != DBNull.Value ? reader["External_enddate"] : null,
                        Username = columns.Contains("Username") ? reader["Username"]?.ToString() : ""
                    });
                }
            }
        }
        return Results.Ok(new { success = true, data = subtasks });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[ERROR] GetSubtasks: {ex.Message}");
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapGet("/api/Item/GetSubtaskById/{id}", async (int id, SqlConnection connection) =>
{
    try
    {
        await connection.OpenAsync();
        using (var cmd = new SqlCommand("Sp_Subtask", connection))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Query", 3);
            cmd.Parameters.AddWithValue("@Id", id);
            
            // Required params for Sp_Subtask (legacy support)
            cmd.Parameters.AddWithValue("@Maintaskid", "");
            cmd.Parameters.AddWithValue("@Assignedby", "");
            cmd.Parameters.AddWithValue("@Assignedto", "");
            cmd.Parameters.AddWithValue("@Startdate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Enddate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Status", "");
            cmd.Parameters.AddWithValue("@Createdat", DBNull.Value);
            cmd.Parameters.AddWithValue("@Isdelete", "0");
            cmd.Parameters.AddWithValue("@Title", "");
            cmd.Parameters.AddWithValue("@Description", "");

            using (var reader = await cmd.ExecuteReaderAsync())


            
            {
                if (await reader.ReadAsync())
                {
                    var subtask = new
                    {
                        Id = reader["Id"],
                        Title = reader["Title"]?.ToString(),
                        Description = reader["Description"]?.ToString(),
                        Maintaskid = reader["Maintaskid"]?.ToString(),
                        Assignedby = reader["Assignedby"]?.ToString(),
                        Assignedto = reader["Assignedto"]?.ToString(),
                        AssignedtoName = reader["Firstname"]?.ToString(),
                        Startdate = reader["Startdate"] != DBNull.Value ? ((DateTime)reader["Startdate"]).ToString("yyyy-MM-dd") : null,
                        Enddate = reader["Enddate"] != DBNull.Value ? ((DateTime)reader["Enddate"]).ToString("yyyy-MM-dd") : null,
                        Status = reader["Status"]?.ToString(),
                        Category = reader["Category"]?.ToString(),
                        Attachment = reader["Attachment"]?.ToString()
                    };
                    return Results.Ok(new { success = true, data = subtask });
                }
            }
        }
        return Results.Json(new { success = false, message = "Subtask not found" });
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapPost("/api/Item/UpdateSubtaskAsync", async (HttpContext context, SqlConnection connection) =>
{
    try
    {
        var form = await context.Request.ReadFormAsync();
        int id = int.Parse(form["Id"]);
        string title = form["Title"];
        string description = form["Description"];
        string assignedTo = form["Assignedto"];
        string startDateStr = form["Startdate"];
        string endDateStr = form["Enddate"];
        string category = form["Category"];
        string existingAttachment = form["ExistingAttachment"];
        var file = context.Request.Form.Files["Attachment"];

        string attachmentPath = existingAttachment;
        if (file != null && file.Length > 0)
        {
            string uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Content", "images", "Taskmedia");
            if (!Directory.Exists(uploadFolder)) Directory.CreateDirectory(uploadFolder);
            
            string fileName = $"attachment_edit_{DateTime.Now:yyyyMMdd_HHmmss}{Path.GetExtension(file.FileName)}";
            string filePath = Path.Combine(uploadFolder, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
            attachmentPath = "/Content/images/Taskmedia/" + fileName;
        }

        await connection.OpenAsync();
        using (var cmd = new SqlCommand("Sp_Subtask", connection))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Query", 4);
            cmd.Parameters.AddWithValue("@Id", id);
            cmd.Parameters.AddWithValue("@Title", title ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Description", description ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Assignedto", assignedTo ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Startdate", string.IsNullOrEmpty(startDateStr) ? (object)DBNull.Value : DateTime.Parse(startDateStr));
            cmd.Parameters.AddWithValue("@Enddate", string.IsNullOrEmpty(endDateStr) ? (object)DBNull.Value : DateTime.Parse(endDateStr));
            cmd.Parameters.AddWithValue("@Category", category ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Attachment", attachmentPath ?? (object)DBNull.Value);

            // Defaults for other required params
            cmd.Parameters.AddWithValue("@Maintaskid", "");
            cmd.Parameters.AddWithValue("@Assignedby", "");
            cmd.Parameters.AddWithValue("@Status", "");
            cmd.Parameters.AddWithValue("@Createdat", DBNull.Value);
            cmd.Parameters.AddWithValue("@Isdelete", "0");

            await cmd.ExecuteNonQueryAsync();
        }
        return Results.Ok(new { success = true, message = "Subtask updated successfully" });
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

app.MapPost("/api/Item/DeleteSubtask", async (HttpContext context, SqlConnection connection) =>
{
    Console.WriteLine("[DEBUG] INCOMING: /api/Item/DeleteSubtask");
    try
    {
        var form = await context.Request.ReadFormAsync();
        if (!int.TryParse(form["id"], out int id))
        {
             return Results.Json(new { success = false, message = "Invalid ID" });
        }

        await connection.OpenAsync();
        using (var cmd = new SqlCommand("Sp_Subtask", connection))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Query", 5);
            cmd.Parameters.AddWithValue("@Id", id);
            
            // Required params for Sp_Subtask (legacy support)
            cmd.Parameters.AddWithValue("@Maintaskid", "");
            cmd.Parameters.AddWithValue("@Assignedby", "");
            cmd.Parameters.AddWithValue("@Assignedto", "");
            cmd.Parameters.AddWithValue("@Startdate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Enddate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Status", "");
            cmd.Parameters.AddWithValue("@Createdat", DBNull.Value);
            cmd.Parameters.AddWithValue("@Isdelete", "1");
            cmd.Parameters.AddWithValue("@Title", "");
            cmd.Parameters.AddWithValue("@Description", "");

            int rowsAffected = await cmd.ExecuteNonQueryAsync();
            Console.WriteLine($"[DEBUG] DeleteSubtask ID: {id}, Rows Affected: {rowsAffected}");

            if (rowsAffected == 0)
            {
                return Results.Json(new { success = false, message = "No subtask found or Stored Procedure needs update. Please visit /api/fix-sp-subtask" });
            }
        }
        return Results.Ok(new { success = true, message = "Deleted" });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[ERROR] DeleteSubtask: {ex.Message}");
        return Results.Json(new { success = false, message = ex.Message });
    }
    finally { if (connection.State == ConnectionState.Open) await connection.CloseAsync(); }
});

// --- Sales Quote Management Endpoints ---
app.MapGet("/api/salesquote/next-no", async (SqlConnection connection) => 
{
    try
    {
        await connection.OpenAsync();
        using var command = new SqlCommand("SELECT COUNT(Salesquoteno) AS 'Salesquoteno' FROM Tbl_Salesquote", connection);
        
        var countStr = command.ExecuteScalar()?.ToString();
        int count = int.TryParse(countStr, out int c) ? c : 0;
        
        string nextNo = $"SQ-{(count + 1).ToString().PadLeft(4, '0')}";
        
        using var formatCommand = new SqlCommand("SELECT Isnull(Prefix,'') as prefix, Isnull(suffix,'') as Suffix, Isnull(No_of_digits,0) as Noofdigit FROM Tbl_Salesquotedocumentformat WHERE Isdelete = '0'", connection);
        using var reader = await formatCommand.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string prefix = reader["prefix"].ToString() ?? "";
            string suffix = reader["suffix"].ToString() ?? "";
            int noOfDigits = Convert.ToInt32(reader["Noofdigit"]);
            
            if (noOfDigits > 0)
                nextNo = $"{prefix}{(count + 1).ToString().PadLeft(noOfDigits, '0')}{suffix}";
        }
        
        return Results.Ok(new { Message = "Success", NextNo = nextNo });
    }
    catch (Exception ex)
    {
        return Results.Ok(new { Message = "Error", Error = ex.Message });
    }
});

app.MapPost("/api/salesquote/save", async (HttpRequest request, SqlConnection connection) => 
{
    try
    {
        await connection.OpenAsync();
        using var transaction = connection.BeginTransaction();
        try
        {
            var form = await request.ReadFormAsync();
            var formDataJson = form["formData"].ToString();
            var tableData1Json = form["tableData1"].ToString();
            var tableDatacategoryJson = form["tableDatacategory"].ToString();
            
            var quoteData = System.Text.Json.JsonSerializer.Deserialize<SalesQuoteFormData>(string.IsNullOrEmpty(formDataJson) ? "{}" : formDataJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new SalesQuoteFormData();
            var itemDetails = string.IsNullOrEmpty(tableData1Json) ? new List<SalesQuoteItemData>() : System.Text.Json.JsonSerializer.Deserialize<List<SalesQuoteItemData>>(tableData1Json, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            var categoryDetails = string.IsNullOrEmpty(tableDatacategoryJson) ? new List<SalesQuoteCategoryData>() : System.Text.Json.JsonSerializer.Deserialize<List<SalesQuoteCategoryData>>(tableDatacategoryJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            int quoteId = 0;

            using (var cmd = new SqlCommand("SELECT COUNT(Salesquoteno) AS 'Salesquoteno' FROM Tbl_Salesquote", connection, transaction))
            {
                var countStr = cmd.ExecuteScalar()?.ToString();
                int pidcount = int.TryParse(countStr, out int c) ? c : 0;
                
                using (var getformat = new SqlCommand("SELECT Isnull(Prefix,'') as prefix, Isnull(suffix,'') as Suffix, Isnull(No_of_digits,0) as Noofdigit FROM Tbl_Salesquotedocumentformat WHERE Isdelete='0'", connection, transaction))
                {
                    using (var reader = getformat.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            string prefix = reader["prefix"].ToString() ?? "";
                            string suffix = reader["Suffix"].ToString() ?? "";
                            int noofdigits = Convert.ToInt32(reader["Noofdigit"]);
                            
                            string nextcount = noofdigits > 0 ? (pidcount + 1).ToString().PadLeft(noofdigits, '0') : (pidcount + 1).ToString();
                            quoteData.Salesquoteno = prefix + nextcount + suffix;
                        }
                        else
                        {
                            quoteData.Salesquoteno = "SQ" + (pidcount + 1).ToString().PadLeft(4, '0');
                        }
                    }
                }
            }

            using (var command = new SqlCommand("Sp_Salesquote", connection, transaction))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@Query", 1);
                
                var pId = new SqlParameter("@Id", SqlDbType.Int) { Direction = ParameterDirection.Output };
                command.Parameters.Add(pId);
                
                command.Parameters.AddWithValue("@Userid", quoteData.Userid ?? "Admin");
                command.Parameters.AddWithValue("@Customerid", string.IsNullOrEmpty(quoteData.Customerid) ? DBNull.Value : quoteData.Customerid);
                command.Parameters.AddWithValue("@Billdate", string.IsNullOrEmpty(quoteData.Billdate) ? DBNull.Value : quoteData.Billdate);
                command.Parameters.AddWithValue("@Duedate", string.IsNullOrEmpty(quoteData.Duedate) ? DBNull.Value : quoteData.Duedate);
                command.Parameters.AddWithValue("@Salesquoteno", string.IsNullOrEmpty(quoteData.Salesquoteno) ? DBNull.Value : quoteData.Salesquoteno);
                command.Parameters.AddWithValue("@Amountsare", quoteData.Amountsare ?? "0");
                command.Parameters.AddWithValue("@Vatnumber", DBNull.Value);
                command.Parameters.AddWithValue("@Billing_address", string.IsNullOrEmpty(quoteData.Billing_address) ? DBNull.Value : quoteData.Billing_address);
                command.Parameters.AddWithValue("@Sales_location", DBNull.Value);
                command.Parameters.AddWithValue("@Sub_total", quoteData.Sub_total ?? "0");
                command.Parameters.AddWithValue("@Vat", DBNull.Value);
                command.Parameters.AddWithValue("@Vat_amount", quoteData.Vat_amount ?? "0");
                command.Parameters.AddWithValue("@Grand_total", quoteData.Grand_total ?? "0");
                command.Parameters.AddWithValue("@Conversion_amount", 1);
                command.Parameters.AddWithValue("@Currency_rate", 1);
                command.Parameters.AddWithValue("@Currency", string.IsNullOrEmpty(quoteData.Currency) ? DBNull.Value : quoteData.Currency);
                command.Parameters.AddWithValue("@Managerapprovestatus", DBNull.Value);
                command.Parameters.AddWithValue("@Isdelete", "0");
                command.Parameters.AddWithValue("@Status", quoteData.Status ?? "Draft");
                command.Parameters.AddWithValue("@Type", quoteData.Type ?? "Quote");
                command.Parameters.AddWithValue("@Terms", string.IsNullOrEmpty(quoteData.Terms) ? DBNull.Value : quoteData.Terms);
                command.Parameters.AddWithValue("@Contact", DBNull.Value);
                command.Parameters.AddWithValue("@Phoneno", DBNull.Value);
                command.Parameters.AddWithValue("@Shipping_address", string.IsNullOrEmpty(quoteData.Shipping_address) ? DBNull.Value : quoteData.Shipping_address);
                command.Parameters.AddWithValue("@Remarks", string.IsNullOrEmpty(quoteData.Remarks) ? DBNull.Value : quoteData.Remarks);
                command.Parameters.AddWithValue("@Salespersonname", string.IsNullOrEmpty(quoteData.Salespersonname) ? DBNull.Value : quoteData.Salespersonname);
                command.Parameters.AddWithValue("@Discounttype", DBNull.Value);
                command.Parameters.AddWithValue("@Discountvalue", DBNull.Value);
                command.Parameters.AddWithValue("@Discountamount", DBNull.Value);
                command.Parameters.AddWithValue("@Catelogid", DBNull.Value);

                await command.ExecuteNonQueryAsync();
                quoteId = (int)pId.Value;
            }

            if (itemDetails != null)
            {
                foreach (var item in itemDetails)
                {
                    using (var command = new SqlCommand("Sp_Salesquotedetails", connection, transaction))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@Query", 1);
                        var pId = new SqlParameter("@Id", SqlDbType.Int) { Direction = ParameterDirection.Output };
                        command.Parameters.Add(pId);
                        
                        command.Parameters.AddWithValue("@Userid", quoteData.Userid ?? "Admin");
                        command.Parameters.AddWithValue("@Salesquoteid", quoteId.ToString());
                        command.Parameters.AddWithValue("@Itemid", string.IsNullOrEmpty(item.Itemid) ? DBNull.Value : item.Itemid);
                        command.Parameters.AddWithValue("@Qty", item.Qty ?? "0");
                        command.Parameters.AddWithValue("@Amount", item.Amount ?? "0");
                        command.Parameters.AddWithValue("@Vat", item.Vat ?? "0");
                        command.Parameters.AddWithValue("@Vat_id", string.IsNullOrEmpty(item.Vat_id) ? DBNull.Value : item.Vat_id);
                        command.Parameters.AddWithValue("@Total", item.Total ?? "0");
                        command.Parameters.AddWithValue("@Isdelete", "0");
                        command.Parameters.AddWithValue("@Status", "Active");
                        command.Parameters.AddWithValue("@Type", item.Type ?? "Item");
                        
                        await command.ExecuteNonQueryAsync();
                    }
                }
            }
            
            if (categoryDetails != null)
            {
                foreach (var cat in categoryDetails)
                {
                    using (var command = new SqlCommand("Sp_Salesquotedetails", connection, transaction))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@Query", 1);
                        var pId = new SqlParameter("@Id", SqlDbType.Int) { Direction = ParameterDirection.Output };
                        command.Parameters.Add(pId);
                        
                        command.Parameters.AddWithValue("@Userid", quoteData.Userid ?? "Admin");
                        command.Parameters.AddWithValue("@Salesquoteid", quoteId.ToString());
                        command.Parameters.AddWithValue("@Itemid", string.IsNullOrEmpty(cat.Categoryid) ? DBNull.Value : cat.Categoryid);
                        command.Parameters.AddWithValue("@Qty", cat.Qty ?? "0");
                        command.Parameters.AddWithValue("@Amount", cat.Amount ?? "0");
                        command.Parameters.AddWithValue("@Vat", cat.Vat ?? "0");
                        command.Parameters.AddWithValue("@Vat_id", string.IsNullOrEmpty(cat.Vat_id) ? DBNull.Value : cat.Vat_id);
                        command.Parameters.AddWithValue("@Total", cat.Total ?? "0");
                        command.Parameters.AddWithValue("@Isdelete", "0");
                        command.Parameters.AddWithValue("@Status", "Active");
                        command.Parameters.AddWithValue("@Type", "Category");
                        
                        await command.ExecuteNonQueryAsync();
                    }
                }
            }

            transaction.Commit();
            return Results.Ok(new { Message = "Sales quote created successfully", QuoteId = quoteId });
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return Results.Ok(new { Message = "Failed to create sales quote", Error = ex.Message });
        }
    }
    catch (Exception ex)
    {
        return Results.Ok(new { Message = "Database connection error", Error = ex.Message });
    }
}).DisableAntiforgery();

app.MapGet("/api/salesquote", async (SqlConnection connection) => 
{
    try
    {
        await connection.OpenAsync();
        using var command = new SqlCommand(@"
            SELECT q.Id, q.Salesquoteno as QuoteNo, c.Customerdisplayname as Customer, q.Billdate as Date, q.Grand_total as Total, q.Status
            FROM Tbl_Salesquote q
            LEFT JOIN Tbl_Customer c ON c.Id = q.Customerid
            WHERE q.Isdelete = '0' OR q.Isdelete IS NULL
            ORDER BY q.Id DESC
        ", connection);
        
        using var reader = await command.ExecuteReaderAsync();
        var quotes = new List<object>();
        while (await reader.ReadAsync())
        {
            quotes.Add(new {
                id = reader["Id"],
                quoteNo = reader["QuoteNo"]?.ToString(),
                customer = reader["Customer"]?.ToString() ?? "Unknown",
                date = reader["Date"]?.ToString(),
                total = reader["Total"]?.ToString(),
                status = reader["Status"]?.ToString() ?? "Draft"
            });
        }
        
        return Results.Ok(quotes);
    }
    catch (Exception ex)
    {
        return Results.Ok(new { Message = "Error retrieving sales quotes", Error = ex.Message });
    }
});

app.MapDelete("/api/salesquote/{id}", async (int id, SqlConnection connection) => 
{
    try
    {
        await connection.OpenAsync();
        using var command = new SqlCommand("Sp_Salesquote", connection);
        command.CommandType = CommandType.StoredProcedure;
        command.Parameters.AddWithValue("@Query", 17);
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Isdelete", "1");
        
        // Pad SP parameters
        command.Parameters.AddWithValue("@Userid", DBNull.Value);
        command.Parameters.AddWithValue("@Customerid", DBNull.Value);
        command.Parameters.AddWithValue("@Billdate", DBNull.Value);
        command.Parameters.AddWithValue("@Duedate", DBNull.Value);
        command.Parameters.AddWithValue("@Salesquoteno", DBNull.Value);
        command.Parameters.AddWithValue("@Amountsare", DBNull.Value);
        command.Parameters.AddWithValue("@Vatnumber", DBNull.Value);
        command.Parameters.AddWithValue("@Billing_address", DBNull.Value);
        command.Parameters.AddWithValue("@Sales_location", DBNull.Value);
        command.Parameters.AddWithValue("@Sub_total", DBNull.Value);
        command.Parameters.AddWithValue("@Vat", DBNull.Value);
        command.Parameters.AddWithValue("@Vat_amount", DBNull.Value);
        command.Parameters.AddWithValue("@Grand_total", DBNull.Value);
        command.Parameters.AddWithValue("@Conversion_amount", 1);
        command.Parameters.AddWithValue("@Currency_rate", 1);
        command.Parameters.AddWithValue("@Currency", DBNull.Value);
        command.Parameters.AddWithValue("@Terms", DBNull.Value);

        await command.ExecuteNonQueryAsync();
        
        return Results.Ok(new { Message = "Sales quote deleted successfully" });
    }
    catch (Exception ex)
    {
        return Results.Ok(new { Message = "Error deleting sales quote", Error = ex.Message });
    }
});

app.MapGet("/api/salesquote/pending", async (SqlConnection connection) => 
{
    try
    {
        await connection.OpenAsync();
        using var command = new SqlCommand(@"
            SELECT q.Id, q.Salesquoteno as QuoteNo, c.Customerdisplayname as Customer, q.Billdate as Date, q.Grand_total as Total, q.Status, q.Managerapprovestatus
            FROM Tbl_Salesquote q
            LEFT JOIN Tbl_Customer c ON c.Id = q.Customerid
            WHERE (q.Isdelete = '0' OR q.Isdelete IS NULL) AND (q.Managerapprovestatus = '0' OR q.Managerapprovestatus IS NULL OR q.Managerapprovestatus = '2')
            ORDER BY q.Id DESC
        ", connection);
        
        using var reader = await command.ExecuteReaderAsync();
        var quotes = new List<object>();
        while (await reader.ReadAsync())
        {
            quotes.Add(new {
                id = reader["Id"],
                quoteNo = reader["QuoteNo"]?.ToString(),
                customer = reader["Customer"]?.ToString() ?? "Unknown",
                date = reader["Date"]?.ToString(),
                total = reader["Total"]?.ToString(),
                status = reader["Status"]?.ToString() ?? "Draft",
                managerApprovalStatus = reader["Managerapprovestatus"]?.ToString() ?? "0"
            });
        }
        
        return Results.Ok(new { success = true, data = quotes });
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message });
    }
});

app.MapPost("/api/salesquote/approve", async (HttpContext context, SqlConnection connection) => 
{
    try
    {
        var json = await System.Text.Json.JsonSerializer.DeserializeAsync<System.Text.Json.JsonElement>(context.Request.Body);
        int quoteId = json.GetProperty("quoteId").GetInt32();
        string status = json.GetProperty("status").GetString() ?? "Approved";
        string comments = json.GetProperty("comments").GetString() ?? "";
        string userId = json.GetProperty("userid").GetString() ?? "Admin";

        string approvalValue = status == "Approved" ? "1" : "2";

        await connection.OpenAsync();
        using var command = new SqlCommand("UPDATE Tbl_Salesquote SET Managerapprovestatus = @Status, Status = @OverallStatus, Remarks = ISNULL(Remarks, '') + ' ' + @Comments WHERE Id = @Id", connection);
        command.Parameters.AddWithValue("@Status", approvalValue);
        command.Parameters.AddWithValue("@OverallStatus", status);
        command.Parameters.AddWithValue("@Comments", comments);
        command.Parameters.AddWithValue("@Id", quoteId);

        await command.ExecuteNonQueryAsync();
        
        return Results.Ok(new { success = true, message = $"Sales quote {status.ToLower()} successfully" });
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message });
    }
});

app.MapGet("/api/salesquote/details/{id}", async (int id, SqlConnection connection) => 
{
    try
    {
        await connection.OpenAsync();
        
        // Fetch Header
        using var headerCmd = new SqlCommand(@"
            SELECT q.*, c.Customerdisplayname
            FROM Tbl_Salesquote q
            LEFT JOIN Tbl_Customer c ON c.Id = q.Customerid
            WHERE q.Id = @Id
        ", connection);
        headerCmd.Parameters.AddWithValue("@Id", id);
        
        object? header = null;
        using (var reader = await headerCmd.ExecuteReaderAsync())
        {
            if (await reader.ReadAsync())
            {
                var columns = new HashSet<string>(Enumerable.Range(0, reader.FieldCount).Select(reader.GetName), StringComparer.OrdinalIgnoreCase);
                header = new {
                    Id = reader["Id"],
                    Salesquoteno = reader["Salesquoteno"]?.ToString(),
                    Billdate = reader["Billdate"]?.ToString(),
                    Duedate = reader["Duedate"]?.ToString(),
                    Customerid = reader["Customerid"]?.ToString(),
                    Customername = reader["Customerdisplayname"]?.ToString(),
                    Billing_address = reader["Billing_address"]?.ToString(),
                    Shipping_address = reader["Shipping_address"]?.ToString(),
                    CustomerTrn = reader["Vatnumber"]?.ToString(),
                    Sub_total = reader["Sub_total"]?.ToString(),
                    Vat_amount = reader["Vat_amount"]?.ToString(),
                    Grand_total = reader["Grand_total"]?.ToString(),
                    Status = reader["Status"]?.ToString(),
                    Managerapprovestatus = columns.Contains("Managerapprovestatus") ? reader["Managerapprovestatus"]?.ToString() : "0",
                    Remarks = reader["Remarks"]?.ToString(),
                    Terms = columns.Contains("Terms") ? reader["Terms"]?.ToString() : "",
                    Salespersonname = columns.Contains("Salespersonname") ? reader["Salespersonname"]?.ToString() : ""
                };
            }
        }
        
        if (header == null) return Results.Json(new { success = false, message = "Quote not found" });

        // Fetch Items
        var items = new List<object>();
        using var itemsCmd = new SqlCommand(@"
            SELECT d.*, p.Product_name as Itemname
            FROM Tbl_Salesquotedetails d
            LEFT JOIN Tbl_Product p ON p.Id = d.Itemid
            WHERE d.Salesquoteid = @Id AND d.Type = 'Item' AND (d.Isdelete = '0' OR d.Isdelete IS NULL)
        ", connection);
        itemsCmd.Parameters.AddWithValue("@Id", id);
        using (var reader = await itemsCmd.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                items.Add(new {
                    Id = reader["Id"],
                    Itemid = reader["Itemid"]?.ToString(),
                    Itemname = reader["Itemname"]?.ToString(),
                    Qty = reader["Qty"]?.ToString(),
                    Amount = reader["Amount"]?.ToString(),
                    Vat = reader["Vat"]?.ToString(),
                    Total = reader["Total"]?.ToString(),
                    Description = "" // Add if needed
                });
            }
        }

        // Fetch Categories
        var categories = new List<object>();
        using var catCmd = new SqlCommand(@"
            SELECT d.*, c.Name as Categoryname
            FROM Tbl_Salesquotedetails d
            LEFT JOIN Tbl_Category c ON c.Id = d.Itemid
            WHERE d.Salesquoteid = @Id AND d.Type = 'Category' AND (d.Isdelete = '0' OR d.Isdelete IS NULL)
        ", connection);
        catCmd.Parameters.AddWithValue("@Id", id);
        using (var reader = await catCmd.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                categories.Add(new {
                    Id = reader["Id"],
                    Categoryid = reader["Itemid"]?.ToString(),
                    Categoryname = reader["Categoryname"]?.ToString(),
                    Qty = reader["Qty"]?.ToString(),
                    Amount = reader["Amount"]?.ToString(),
                    Vat = reader["Vat"]?.ToString(),
                    Total = reader["Total"]?.ToString()
                });
            }
        }

        return Results.Ok(new { success = true, header, items, categories });
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, message = ex.Message });
    }
});

app.MapControllers();
app.Run();

public class SalesQuoteFormData
{
    public string? Userid { get; set; }
    public string? Customerid { get; set; }
    public string? Billdate { get; set; }
    public string? Duedate { get; set; }
    public string? Salesquoteno { get; set; }
    public string? Amountsare { get; set; }
    public string? Billing_address { get; set; }
    public string? Shipping_address { get; set; }
    public string? Currency { get; set; }
    public string? Currency_rate { get; set; }
    public string? Terms { get; set; }
    public string? Salespersonname { get; set; }
    public string? Remarks { get; set; }
    public string? Sub_total { get; set; }
    public string? Vat_amount { get; set; }
    public string? Grand_total { get; set; }
    public string? Status { get; set; }
    public string? Isdelete { get; set; }
    public string? Type { get; set; }
}

public class SalesQuoteItemData
{
    public string? Itemid { get; set; }
    public string? Qty { get; set; }
    public string? Amount { get; set; }
    public string? Vat { get; set; }
    public string? Vat_id { get; set; }
    public string? Total { get; set; }
    public string? Type { get; set; }
}

public class SalesQuoteCategoryData
{
    public string? Categoryid { get; set; }
    public string? Qty { get; set; }
    public string? Amount { get; set; }
    public string? Vat { get; set; }
    public string? Vat_id { get; set; }
    public string? Total { get; set; }
}

public class TaskModel
{
    public int Id { get; set; }

    public string? Tasktype { get; set; }
    public string? Itemid { get; set; }
    public string? Itemtype { get; set; }
    public string? ItemName { get; set; }
    public string? Marketplace { get; set; }
    public string? Person { get; set; }
    
    public string? Assignedto { get; set; }

    public string? Startdate { get; set; }
    public string? Enddate { get; set; }
    public string? Description { get; set; }
    public string? Duration { get; set; }
    public string? Catelogid { get; set; }
    public string? Assignedby { get; set; }
    public List<TaskItemModel>? Items { get; set; }
}

public class TaskItemModel
{
    public int Id { get; set; }

    public string? Tasktype { get; set; }
    public string? Type { get; set; }
    public string? Itemtype { get; set; }
    public string? Name { get; set; }
    public string? ItemName { get; set; }
    public string? Itemid { get; set; }
    public string? Duration { get; set; }
    public string? Marketplace { get; set; }
    public string? Description { get; set; }
    public string? Startdate { get; set; }
    public string? Enddate { get; set; }
    public string? Assignedto { get; set; }
    public string? Person { get; set; }
    public string? Assignedby { get; set; }
    public string? Catelogid { get; set; }
}

record ApprovalResponseRequest(string Id, string Productid, string? Userid, string? Approved_Userid, string? Approved_Role, string Status, string? Comments);

record EditRequestPayload(string? Id, string? Productid, string? Userid, string? Role, string? Comments);

record ProcessEditReasonRequest(string Productid, string Userid, string? Editreason, string Type, string? Approved_userid, int Id, string Status);


public record TaskFetchRequest(string? Userid, string? CatalogId);

public class ReportPermissionItem {
    public string Category { get; set; }
    public string ReportName { get; set; }
    public bool Permission { get; set; }
}
public class ReportPermissionRequest {
    public int RoleId { get; set; }
    public List<ReportPermissionItem> Permissions { get; set; }
}

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);




}



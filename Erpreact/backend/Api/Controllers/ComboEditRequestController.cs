using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/combo/edit-requests")]
    public class ComboEditRequestController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public ComboEditRequestController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        private static string BuildQualifiedName(string schema, string table)
        {
            // schema/table come from INFORMATION_SCHEMA, still quote defensively
            return $"[{schema.Replace("]", "]]")}].[{table.Replace("]", "]]")}]";
        }

        private static async Task<(string Schema, string Table)?> ResolveComboCommentsTableAsync(SqlConnection con)
        {
            const string sql = @"
SELECT TOP 1
    c.TABLE_SCHEMA,
    c.TABLE_NAME
FROM INFORMATION_SCHEMA.COLUMNS c
WHERE c.COLUMN_NAME IN ('Id','Productcomboid','Userid','Comments','Commenttype','Status')
GROUP BY c.TABLE_SCHEMA, c.TABLE_NAME
HAVING COUNT(DISTINCT c.COLUMN_NAME) = 6
ORDER BY
    CASE WHEN LOWER(c.TABLE_NAME) LIKE '%combo%comment%' THEN 0 ELSE 1 END,
    c.TABLE_NAME;";

            await using var cmd = new SqlCommand(sql, con);
            await using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                var schema = reader.GetString(0);
                var table = reader.GetString(1);
                return (schema, table);
            }
            return null;
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPending(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string search = "",
            [FromQuery] string catelogid = "")
        {
            try
            {
                page = page <= 0 ? 1 : page;
                pageSize = pageSize <= 0 ? 10 : pageSize;

                var list = new List<Dictionary<string, object>>();
                int totalCount = 0;

                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                await using var con = new SqlConnection(connectionString);
                await con.OpenAsync();

                var tableInfo = await ResolveComboCommentsTableAsync(con);
                if (tableInfo == null)
                    return StatusCode(500, new { success = false, message = "Combo comments table not found in this database.", data = Array.Empty<object>(), totalCount = 0 });

                var comboCommentsTable = BuildQualifiedName(tableInfo.Value.Schema, tableInfo.Value.Table);

                // We treat Combo "edit requests" as combo comment rows where Status=0 and either:
                // - Commenttype='Editrequest' OR
                // - Comments contains the legacy marker "[EDIT REQUEST]"
                //
                // Note: existing UI currently writes edit requests through `/api/product/savecomboeditcommentsdelete`,
                // which stores Commenttype='Deleterequest' but prefixes the message with "[EDIT REQUEST]".
                var baseCte = $@"
;WITH Base AS (
    SELECT
        cc.Id            AS CommentId,
        cc.Productcomboid,
        cc.Userid,
        cc.Checked_Date,
        cc.Comments,
        cc.Commenttype,
        cc.Status,
        c.Comboname,
        c.Modelno,
        c.Batchno,
        c.EANBarcodeno,
        ISNULL(r.Firstname, N'') AS Username,
        ISNULL(CONVERT(varchar(50), r.Catelogid), '') AS Catelogid
    FROM {comboCommentsTable} cc
    LEFT JOIN dbo.Tbl_Combo c ON c.Id = cc.Productcomboid
    LEFT JOIN dbo.Tbl_Registration r ON r.Userid = cc.Userid
    WHERE ISNULL(cc.Status, '0') = '0'
      AND (
            LTRIM(RTRIM(ISNULL(cc.Commenttype,''))) = 'Editrequest'
         OR ISNULL(cc.Comments,'') LIKE '%[EDIT REQUEST]%'
      )
      AND (@Catelogid = '' OR LTRIM(RTRIM(ISNULL(CONVERT(varchar(50), r.Catelogid), ''))) = LTRIM(RTRIM(@Catelogid)))
)";

                var sql = $@"
{baseCte}
SELECT COUNT(1) FROM Base
WHERE (@Search = '' OR
       ISNULL(Comboname,'') LIKE '%' + @Search + '%' OR
       ISNULL(Modelno,'') LIKE '%' + @Search + '%' OR
       ISNULL(EANBarcodeno,'') LIKE '%' + @Search + '%' OR
       ISNULL(Username,'') LIKE '%' + @Search + '%' OR
       ISNULL(Comments,'') LIKE '%' + @Search + '%' OR
       CONVERT(varchar(50), Productcomboid) LIKE '%' + @Search + '%');

{baseCte}
SELECT *
FROM Base
WHERE (@Search = '' OR
       ISNULL(Comboname,'') LIKE '%' + @Search + '%' OR
       ISNULL(Modelno,'') LIKE '%' + @Search + '%' OR
       ISNULL(EANBarcodeno,'') LIKE '%' + @Search + '%' OR
       ISNULL(Username,'') LIKE '%' + @Search + '%' OR
       ISNULL(Comments,'') LIKE '%' + @Search + '%' OR
       CONVERT(varchar(50), Productcomboid) LIKE '%' + @Search + '%')
ORDER BY TRY_CONVERT(int, Productcomboid) DESC, TRY_CONVERT(int, CommentId) DESC
OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

                await using var cmd = new SqlCommand(sql, con);
                cmd.Parameters.AddWithValue("@Search", (search ?? "").Trim());
                cmd.Parameters.AddWithValue("@Catelogid", (catelogid ?? "").Trim());
                cmd.Parameters.AddWithValue("@Offset", (page - 1) * pageSize);
                cmd.Parameters.AddWithValue("@PageSize", pageSize);

                await using var reader = await cmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    totalCount = reader.IsDBNull(0) ? 0 : Convert.ToInt32(reader.GetValue(0));
                }

                if (await reader.NextResultAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        var row = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                        }
                        list.Add(row);
                    }
                }

                return Ok(new { success = true, data = list, totalCount });
            }
            catch (Exception ex)
            {
                Console.WriteLine("ComboEditRequestController.GetPending: " + ex);
                return StatusCode(500, new { success = false, message = ex.Message, data = Array.Empty<object>(), totalCount = 0 });
            }
        }

        public class ComboEditRequestDecisionPayload
        {
            public int CommentId { get; set; }
            public string Status { get; set; } = ""; // "1" approved, "2" rejected
            public string Comments { get; set; } = "";
            public string Approved_Userid { get; set; } = "";
        }

        [HttpPost("process")]
        public async Task<IActionResult> Process([FromBody] ComboEditRequestDecisionPayload payload)
        {
            try
            {
                if (payload == null || payload.CommentId <= 0)
                    return BadRequest(new { success = false, message = "CommentId is required." });

                var status = (payload.Status ?? "").Trim();
                if (!(status == "1" || status == "2" || status.Equals("Approved", StringComparison.OrdinalIgnoreCase) || status.Equals("Rejected", StringComparison.OrdinalIgnoreCase)))
                    return BadRequest(new { success = false, message = "Status must be 1(Approved) or 2(Rejected)." });

                if (status.Equals("Approved", StringComparison.OrdinalIgnoreCase)) status = "1";
                if (status.Equals("Rejected", StringComparison.OrdinalIgnoreCase)) status = "2";

                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                await using var con = new SqlConnection(connectionString);
                await con.OpenAsync();

                var tableInfo = await ResolveComboCommentsTableAsync(con);
                if (tableInfo == null)
                    return StatusCode(500, new { success = false, message = "Combo comments table not found in this database." });

                var comboCommentsTable = BuildQualifiedName(tableInfo.Value.Schema, tableInfo.Value.Table);

                // Read current row (we need Productcomboid + type to update combo workstatus/isdelete like legacy Savecomboeditrequest).
                string productcomboid = "";
                string commenttype = "";
                string existingComments = "";
                {
                    var readSql = $@"
SELECT TOP 1
    ISNULL(CONVERT(varchar(50), Productcomboid), '') AS Productcomboid,
    ISNULL(CONVERT(nvarchar(100), Commenttype), '') AS Commenttype,
    ISNULL(CONVERT(nvarchar(max), Comments), '') AS Comments
FROM {comboCommentsTable}
WHERE Id = @CommentId;";
                    await using var readCmd = new SqlCommand(readSql, con);
                    readCmd.Parameters.AddWithValue("@CommentId", payload.CommentId);
                    await using var rr = await readCmd.ExecuteReaderAsync();
                    if (await rr.ReadAsync())
                    {
                        productcomboid = rr.IsDBNull(0) ? "" : rr.GetString(0);
                        commenttype = rr.IsDBNull(1) ? "" : rr.GetString(1);
                        existingComments = rr.IsDBNull(2) ? "" : rr.GetString(2);
                    }
                }

                var sql = $@"
UPDATE {comboCommentsTable}
SET
    Status = @Status,
    Accepted_Userid = @Approved_Userid,
    Approved_Userid = @Approved_Userid,
    Role = 'Manager',
    Checked_Date = @Checked_Date,
    Comments = CASE
                 WHEN @Reply = '' THEN ISNULL(Comments,'')
                 ELSE (ISNULL(Comments,'') + CHAR(10) + '[MANAGER REPLY] ' + @Reply)
               END
WHERE Id = @CommentId;
SELECT @@ROWCOUNT;";

                await using var cmd = new SqlCommand(sql, con);
                cmd.Parameters.AddWithValue("@Status", status);
                cmd.Parameters.AddWithValue("@Approved_Userid", (payload.Approved_Userid ?? "").Trim());
                cmd.Parameters.AddWithValue("@Checked_Date", DateTime.Now.ToString("MMM d yyyy h:mmtt"));
                cmd.Parameters.AddWithValue("@Reply", (payload.Comments ?? "").Trim());
                cmd.Parameters.AddWithValue("@CommentId", payload.CommentId);

                var affected = Convert.ToInt32(await cmd.ExecuteScalarAsync());
                if (affected <= 0)
                    return NotFound(new { success = false, message = "Request not found." });

                // Legacy behavior: if Approved, move combo back to Pending (Workstatus=0) so editing is allowed.
                // If Rejected, keep combo as Rejected (Workstatus=2).
                // Also, for delete requests: if Approved, set Isdelete=1 (same as MVC).
                try
                {
                    bool isApproved = status == "1";

                    // Determine original request type.
                    // - Legacy edit request uses Commenttype='Editrequest'
                    // - Legacy delete request uses Commenttype='Deleterequest'
                    // - Current UI sometimes stores Commenttype='Deleterequest' but prefixes comment with "[EDIT REQUEST]"
                    string ct = (commenttype ?? "").Trim();
                    bool isDeleteRequest = ct.Equals("Deleterequest", StringComparison.OrdinalIgnoreCase)
                        && !(existingComments ?? "").Contains("[EDIT REQUEST]", StringComparison.OrdinalIgnoreCase);

                    string isdeleteParam = (isApproved && isDeleteRequest) ? "1" : "0";
                    string workstatusParam = isApproved ? "0" : "2";

                    if (!string.IsNullOrWhiteSpace(productcomboid))
                    {
                        await using var cmd212 = new SqlCommand("Sp_productcombo", con);
                        cmd212.CommandType = CommandType.StoredProcedure;
                        cmd212.Parameters.AddWithValue("@Id", productcomboid.Trim());
                        cmd212.Parameters.AddWithValue("@Userid", "");
                        cmd212.Parameters.AddWithValue("@Comboname", "");
                        cmd212.Parameters.AddWithValue("@Modelno", "");
                        cmd212.Parameters.AddWithValue("@Batchno", "");
                        cmd212.Parameters.AddWithValue("@EANBarcodeno", "");
                        cmd212.Parameters.AddWithValue("@Isdelete", isdeleteParam);
                        cmd212.Parameters.AddWithValue("@Status", "");
                        cmd212.Parameters.AddWithValue("@Workstatus", workstatusParam);
                        cmd212.Parameters.AddWithValue("@Description", "");
                        cmd212.Parameters.AddWithValue("@Wholesalepriceset", "");
                        cmd212.Parameters.AddWithValue("@Retailpriceset", "");
                        cmd212.Parameters.AddWithValue("@Onlinepriceset", "");
                        cmd212.Parameters.AddWithValue("@Query", 6);
                        await cmd212.ExecuteNonQueryAsync();
                    }
                }
                catch (Exception ex2)
                {
                    Console.WriteLine("ComboEditRequestController.Process Sp_productcombo Q6: " + ex2.Message);
                }

                return Ok(new { success = true, message = status == "1" ? "Edit request approved." : "Edit request rejected." });
            }
            catch (Exception ex)
            {
                Console.WriteLine("ComboEditRequestController.Process: " + ex);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Used by Combo "Edit" button: if a manager already approved an edit request for this combo+user,
        /// UI should allow editing without asking to submit another request.
        /// </summary>
        [HttpGet("approved")]
        public async Task<IActionResult> HasApprovedEditRequest([FromQuery] string comboId, [FromQuery] string userid)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(comboId) || string.IsNullOrWhiteSpace(userid))
                    return BadRequest(new { success = false, message = "comboId and userid are required", approved = false });

                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                await using var con = new SqlConnection(connectionString);
                await con.OpenAsync();

                var tableInfo = await ResolveComboCommentsTableAsync(con);
                if (tableInfo == null)
                    return StatusCode(500, new { success = false, message = "Combo comments table not found in this database.", approved = false });

                var comboCommentsTable = BuildQualifiedName(tableInfo.Value.Schema, tableInfo.Value.Table);

                // Approved means Status='1' on an edit-request row.
                // We accept either Commenttype='Editrequest' (legacy) or comments marker "[EDIT REQUEST]" (current UI).
                // We only need existence of an approved row for this combo+user.
                var sql = $@"
SELECT TOP 1 1
FROM {comboCommentsTable} cc
WHERE LTRIM(RTRIM(ISNULL(cc.Productcomboid,''))) = LTRIM(RTRIM(@ComboId))
  AND LTRIM(RTRIM(ISNULL(cc.Userid,''))) = LTRIM(RTRIM(@Userid))
  AND LTRIM(RTRIM(ISNULL(cc.Status,''))) = '1'
  AND (
        LTRIM(RTRIM(ISNULL(cc.Commenttype,''))) IN ('Editrequest','Editrequestreplay','Editrequestreplay ')
     OR ISNULL(cc.Comments,'') LIKE '%[EDIT REQUEST]%'
  )
ORDER BY TRY_CONVERT(datetime, cc.Checked_Date) DESC, TRY_CONVERT(int, cc.Id) DESC;";

                await using var cmd = new SqlCommand(sql, con);
                cmd.Parameters.AddWithValue("@ComboId", comboId.Trim());
                cmd.Parameters.AddWithValue("@Userid", userid.Trim());
                var exists = await cmd.ExecuteScalarAsync();

                return Ok(new { success = true, approved = exists != null });
            }
            catch (Exception ex)
            {
                Console.WriteLine("ComboEditRequestController.HasApprovedEditRequest: " + ex);
                return StatusCode(500, new { success = false, message = ex.Message, approved = false });
            }
        }
    }
}


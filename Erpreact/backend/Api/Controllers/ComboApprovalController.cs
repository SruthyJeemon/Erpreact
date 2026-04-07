using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Api.Controllers
{
    [Route("api/combo")]
    [ApiController]
    public class ComboApprovalController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public ComboApprovalController(IConfiguration configuration)
        {
            _configuration = configuration;
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

                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                var list = new List<Dictionary<string, object>>();

                await using (var con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();

                    // Use the same SP as Product Combo page uses (Sp_Productvariants @Query=30),
                    // then filter to Type='Combo' and pending approval status.
                    await using (var cmd = new SqlCommand("Sp_Productvariants", con))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Query", 30);
                        cmd.Parameters.AddWithValue("@PageIndex", page);
                        cmd.Parameters.AddWithValue("@PageSize", pageSize);
                        cmd.Parameters.AddWithValue("@Itemname", search ?? "");
                        cmd.Parameters.AddWithValue("@Catelogid", string.IsNullOrEmpty(catelogid) ? DBNull.Value : (object)catelogid);

                        int total = 0;
                        var ids = new List<int>();

                        await using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var row = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    var val = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                    row[reader.GetName(i)] = val;
                                }

                                // Keep only combos
                                var type = (row.TryGetValue("Type", out var tv) ? tv?.ToString() : null) ?? "";
                                if (!type.Equals("Combo", StringComparison.OrdinalIgnoreCase)) continue;

                                // Pending only (Approvalstatus = 0 / Pending)
                                var appr = (row.TryGetValue("Approvalstatus", out var av) ? av?.ToString() : null) ?? "";
                                if (!(appr == "0" || appr.Equals("Pending", StringComparison.OrdinalIgnoreCase) || string.IsNullOrWhiteSpace(appr)))
                                    continue;

                                list.Add(row);

                                if (row.TryGetValue("Id", out var idv) && idv != null && int.TryParse(idv.ToString(), out var idInt))
                                    ids.Add(idInt);
                            }

                            // SP returns total records in next result set (see existing ProductController usage)
                            total = list.Count;
                            if (await reader.NextResultAsync())
                            {
                                if (await reader.ReadAsync())
                                {
                                    if (!reader.IsDBNull(reader.GetOrdinal("TotalRecords")))
                                        total = reader.GetInt32(reader.GetOrdinal("TotalRecords"));
                                }
                            }
                        } // IMPORTANT: close reader before running any other command on the same connection

                        // Enrich the list with Tbl_Combo fields (Modelno, EAN, Batchno, Comboname) so UI can display them.
                        // This avoids changing the SP and keeps pending list source consistent.
                        if (ids.Count > 0)
                        {
                            var map = new Dictionary<int, Dictionary<string, object>>();

                            // Build parameterized IN list
                            var pNames = new List<string>();
                            for (int i = 0; i < ids.Count; i++)
                            {
                                pNames.Add($"@p{i}");
                            }

                            var sql = $@"
SELECT Id, Comboname, Modelno, Batchno, EANBarcodeno
FROM dbo.Tbl_Combo
WHERE Id IN ({string.Join(",", pNames)}) AND ISNULL(Isdelete,0)=0;";

                            await using (var cmd2 = new SqlCommand(sql, con))
                            {
                                for (int i = 0; i < ids.Count; i++)
                                    cmd2.Parameters.AddWithValue(pNames[i], ids[i]);

                                await using var r2 = await cmd2.ExecuteReaderAsync();
                                while (await r2.ReadAsync())
                                {
                                    var id = r2.GetInt32(r2.GetOrdinal("Id"));
                                    var info = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase)
                                    {
                                        ["Comboname"] = r2.IsDBNull(r2.GetOrdinal("Comboname")) ? null : r2.GetValue(r2.GetOrdinal("Comboname")),
                                        ["Modelno"] = r2.IsDBNull(r2.GetOrdinal("Modelno")) ? null : r2.GetValue(r2.GetOrdinal("Modelno")),
                                        ["Batchno"] = r2.IsDBNull(r2.GetOrdinal("Batchno")) ? null : r2.GetValue(r2.GetOrdinal("Batchno")),
                                        ["EANBarcodeno"] = r2.IsDBNull(r2.GetOrdinal("EANBarcodeno")) ? null : r2.GetValue(r2.GetOrdinal("EANBarcodeno"))
                                    };
                                    map[id] = info;
                                }
                            }

                            foreach (var row in list)
                            {
                                if (!row.TryGetValue("Id", out var idv) || idv == null || !int.TryParse(idv.ToString(), out var id)) continue;
                                if (!map.TryGetValue(id, out var info)) continue;
                                foreach (var kv in info)
                                {
                                    // Only fill if missing in SP output
                                    if (!row.ContainsKey(kv.Key) || row[kv.Key] == null || string.IsNullOrWhiteSpace(row[kv.Key]?.ToString()))
                                        row[kv.Key] = kv.Value;
                                }
                            }
                        }

                        return Ok(new { success = true, data = list, totalCount = total });
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("GetPendingCombos: " + ex);
                return StatusCode(500, new { success = false, message = ex.Message, data = Array.Empty<object>(), totalCount = 0 });
            }
        }

        [HttpPost("response")]
        public async Task<IActionResult> PostResponse([FromBody] ComboApprovalDecisionPayload? body)
        {
            try
            {
                if (body == null || string.IsNullOrWhiteSpace(body.Id) || string.IsNullOrWhiteSpace(body.Status))
                    return BadRequest(new { success = false, message = "Id and Status are required" });

                string statusText = body.Status.Trim();
                string statusCode = statusText.Equals("Approved", StringComparison.OrdinalIgnoreCase) || statusText == "1" ? "1" : "2";

                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                await using (var con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();

                    // Update combo workstatus (pending=0, approved=1, rejected=2)
                    await using (var cmd = new SqlCommand("UPDATE dbo.Tbl_Combo SET Workstatus = @Ws WHERE Id = @Id", con))
                    {
                        cmd.Parameters.AddWithValue("@Ws", statusCode);
                        cmd.Parameters.AddWithValue("@Id", body.Id.Trim());
                        await cmd.ExecuteNonQueryAsync();
                    }

                    // Optional: log approve/reject comment if Sp_Combocomments supports it.
                    // Keeping minimal to avoid stored procedure parameter mismatches.
                }

                return Ok(new { success = true, message = "Response successfully saved" });
            }
            catch (Exception ex)
            {
                Console.WriteLine("PostComboResponse: " + ex);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    public class ComboApprovalDecisionPayload
    {
        public string Id { get; set; }
        public string Status { get; set; } // Approved / Rejected
        public string Comments { get; set; }
        public string Approved_Userid { get; set; }
    }
}


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
        private readonly ILogger<ComboApprovalController> _logger;

        public ComboApprovalController(IConfiguration configuration, ILogger<ComboApprovalController> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        private static string CurrentCheckedDateString() =>
            DateTime.Now.ToString("MMM d yyyy h:mmtt", System.Globalization.CultureInfo.InvariantCulture);

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
                string searchText = (search ?? "").Trim();
                bool isSearching = !string.IsNullOrEmpty(searchText);

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
                        // Sp_Productvariants @Query=30 does not reliably filter by Itemname in all DB versions,
                        // so for search we fetch a larger slice and filter in C# (same pattern as ProductController).
                        cmd.Parameters.AddWithValue("@PageIndex", isSearching ? 1 : page);
                        cmd.Parameters.AddWithValue("@PageSize", isSearching ? 100000 : pageSize);
                        cmd.Parameters.AddWithValue("@Itemname", searchText);
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

                        // If searching, apply filter after enrichment so it can match Comboname/Modelno/EAN too.
                        if (isSearching)
                        {
                            bool Match(Dictionary<string, object> r)
                            {
                                static string S(object? o) => (o == null ? "" : o.ToString() ?? "").Trim();
                                var hay = string.Join(" | ", new[]
                                {
                                    S(r.TryGetValue("Id", out var v0) ? v0 : null),
                                    S(r.TryGetValue("Itemname", out var v1) ? v1 : null),
                                    S(r.TryGetValue("Comboname", out var v2) ? v2 : null),
                                    S(r.TryGetValue("Modelno", out var v3) ? v3 : null),
                                    S(r.TryGetValue("EANBarcodeno", out var v4) ? v4 : null),
                                    S(r.TryGetValue("Username", out var v5) ? v5 : null),
                                    S(r.TryGetValue("Userid", out var v6) ? v6 : null)
                                });
                                return hay.Contains(searchText, StringComparison.OrdinalIgnoreCase);
                            }

                            var filtered = list.Where(Match).ToList();
                            total = filtered.Count;
                            list = filtered
                                .Skip((page - 1) * pageSize)
                                .Take(pageSize)
                                .ToList();
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

                if (string.IsNullOrWhiteSpace(body.Approved_Userid))
                    return BadRequest(new { success = false, message = "Approved_Userid is required" });

                string statusText = body.Status.Trim();
                bool approved = statusText.Equals("Approved", StringComparison.OrdinalIgnoreCase) || statusText == "1";
                string comboCommentStatus = approved ? "1" : "2";
                string workStatus = approved ? "1" : "2";

                string commentText = body.Comments ?? body.Commentss ?? "";
                string submitterUserid = body.Userid?.Trim() ?? "";
                string comboId = body.Id.Trim();
                string approverUserid = body.Approved_Userid.Trim();

                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                await using (var con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();

                    // 1) Sp_Combocomments — same flow as legacy Savecombocomments (Approve/Reject)
                    await using (var cmd4 = new SqlCommand("Sp_Combocomments", con))
                    {
                        cmd4.CommandType = CommandType.StoredProcedure;
                        cmd4.Parameters.AddWithValue("@Userid", submitterUserid);
                        cmd4.Parameters.AddWithValue("@Accepted_Userid", "");
                        cmd4.Parameters.AddWithValue("@Approved_Userid", approverUserid);
                        cmd4.Parameters.AddWithValue("@Productcomboid", comboId);
                        cmd4.Parameters.AddWithValue("@Checked_Date", CurrentCheckedDateString());
                        cmd4.Parameters.AddWithValue("@Comments", commentText);
                        cmd4.Parameters.AddWithValue("@Commenttype", "Approve/Reject");
                        cmd4.Parameters.AddWithValue("@Status", comboCommentStatus);
                        cmd4.Parameters.AddWithValue("@Role", "");
                        cmd4.Parameters.AddWithValue("@Query", 1);
                        await cmd4.ExecuteNonQueryAsync();
                    }

                    // 2) Comments @Query 7 — user display + email (legacy passes Approved_Userid as @Userid)
                    string lookupUsername = "";
                    string lookupEmail = "";
                    await using (var cmd411 = new SqlCommand("Comments", con))
                    {
                        cmd411.CommandType = CommandType.StoredProcedure;
                        cmd411.Parameters.AddWithValue("@id", "");
                        cmd411.Parameters.AddWithValue("@Userid", approverUserid);
                        cmd411.Parameters.AddWithValue("@Accepted_Userid", "");
                        cmd411.Parameters.AddWithValue("@Approved_Userid", "");
                        cmd411.Parameters.AddWithValue("@Productid", "");
                        cmd411.Parameters.AddWithValue("@Checked_Date", "");
                        cmd411.Parameters.AddWithValue("@Comments", "");
                        cmd411.Parameters.AddWithValue("@Status", "");
                        cmd411.Parameters.AddWithValue("@Query", 7);
                        await using var r411 = await cmd411.ExecuteReaderAsync();
                        if (await r411.ReadAsync())
                        {
                            if (!r411.IsDBNull(0)) lookupUsername = r411.GetValue(0)?.ToString() ?? "";
                            if (r411.FieldCount > 1 && !r411.IsDBNull(1)) lookupEmail = r411.GetValue(1)?.ToString() ?? "";
                        }
                    }

                    // 3) Sp_productcombo @Query 5 — header workstatus
                    await using (var cmd23 = new SqlCommand("Sp_productcombo", con))
                    {
                        cmd23.CommandType = CommandType.StoredProcedure;
                        cmd23.Parameters.AddWithValue("@Id", comboId);
                        cmd23.Parameters.AddWithValue("@Userid", "");
                        cmd23.Parameters.AddWithValue("@Comboname", "");
                        cmd23.Parameters.AddWithValue("@Modelno", "");
                        cmd23.Parameters.AddWithValue("@Batchno", "");
                        cmd23.Parameters.AddWithValue("@EANBarcodeno", "");
                        cmd23.Parameters.AddWithValue("@Isdelete", "");
                        cmd23.Parameters.AddWithValue("@Status", "");
                        cmd23.Parameters.AddWithValue("@Workstatus", workStatus);
                        cmd23.Parameters.AddWithValue("@Description", "");
                        cmd23.Parameters.AddWithValue("@Wholesalepriceset", "");
                        cmd23.Parameters.AddWithValue("@Retailpriceset", "");
                        cmd23.Parameters.AddWithValue("@Onlinepriceset", "");
                        cmd23.Parameters.AddWithValue("@Query", 5);
                        await cmd23.ExecuteNonQueryAsync();
                    }

                    // 4) Sp_Comboitems @Query 6 — line items workstatus
                    await using (var cmdItems = new SqlCommand("Sp_Comboitems", con))
                    {
                        cmdItems.CommandType = CommandType.StoredProcedure;
                        cmdItems.Parameters.AddWithValue("@Id", "");
                        cmdItems.Parameters.AddWithValue("@Userid", "");
                        cmdItems.Parameters.AddWithValue("@Productcomboid", comboId);
                        cmdItems.Parameters.AddWithValue("@Productvariantsid", "");
                        cmdItems.Parameters.AddWithValue("@Qty", "");
                        cmdItems.Parameters.AddWithValue("@Isdelete", "");
                        cmdItems.Parameters.AddWithValue("@Status", "");
                        cmdItems.Parameters.AddWithValue("@Workstatus", workStatus);
                        cmdItems.Parameters.AddWithValue("@Query", 6);
                        await cmdItems.ExecuteNonQueryAsync();
                    }

                    // Email: legacy sent via SMTP; API has no SMTP settings — log for ops if lookup returned an address.
                    string firstname = body.Firstname?.Trim() ?? "";
                    string comboname = body.Comboname?.Trim() ?? "";
                    if (!string.IsNullOrEmpty(lookupEmail))
                    {
                        _logger.LogInformation(
                            "Combo {ComboId} {Status}: notification recipient {Email} (user {Username}); submitter first name {Firstname}; combo name {Comboname}. SMTP not configured in API.",
                            comboId, statusText, lookupEmail, lookupUsername, firstname, comboname);
                    }
                }

                return Ok(new { success = true, message = "Response successfully saved", msg = "Response successfully saved" });
            }
            catch (Exception ex)
            {
                Console.WriteLine("PostComboResponse: " + ex);
                _logger.LogError(ex, "PostComboResponse failed");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    public class ComboApprovalDecisionPayload
    {
        public string Id { get; set; }
        public string Status { get; set; } // Approved / Rejected
        public string Comments { get; set; }
        /// <summary>Legacy form field name (double s).</summary>
        public string Commentss { get; set; }
        public string Approved_Userid { get; set; }
        /// <summary>Submitter user id (Tbl_Combo / combo owner) for Sp_Combocomments @Userid.</summary>
        public string Userid { get; set; }
        public string Comboname { get; set; }
        public string Firstname { get; set; }
    }
}


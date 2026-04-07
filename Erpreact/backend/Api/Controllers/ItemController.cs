using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Api.Controllers
{
    [Route("api/item")]
    [ApiController]
    public class ItemController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public ItemController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        private static bool HasPendingVariantEditRequest(SqlConnection con, string productvariantsId, string userId)
        {
            using var cmd = new SqlCommand(
                @"SELECT COUNT(1) FROM dbo.Tbl_Variantsetcomments
WHERE Variantorset = N'Variant'
  AND LTRIM(RTRIM(ISNULL(Productvariantsid, N''))) = LTRIM(RTRIM(@Productvariantsid))
  AND LTRIM(RTRIM(ISNULL(Userid, N''))) = LTRIM(RTRIM(@Userid))
  AND Commenttype = N'Editrequest'
  AND LTRIM(RTRIM(ISNULL(Status, N''))) = N'0'
  AND (Approved_Userid IS NULL OR LTRIM(RTRIM(ISNULL(Approved_Userid, N''))) = N'')", con);
            cmd.Parameters.AddWithValue("@Productvariantsid", productvariantsId.Trim());
            cmd.Parameters.AddWithValue("@Userid", userId.Trim());
            var o = cmd.ExecuteScalar();
            if (o == null || o == DBNull.Value) return false;
            return Convert.ToInt32(o) > 0;
        }

        private static bool HasPendingVariantDeleteRequest(SqlConnection con, string productvariantsId, string userId)
        {
            using var cmd = new SqlCommand(
                @"SELECT COUNT(1) FROM dbo.Tbl_Variantsetcomments
WHERE Variantorset = N'Variant'
  AND LTRIM(RTRIM(ISNULL(Productvariantsid, N''))) = LTRIM(RTRIM(@Productvariantsid))
  AND LTRIM(RTRIM(ISNULL(Userid, N''))) = LTRIM(RTRIM(@Userid))
  AND Commenttype = N'Deleterequest'
  AND LTRIM(RTRIM(ISNULL(Status, N''))) = N'0'
  AND (Approved_Userid IS NULL OR LTRIM(RTRIM(ISNULL(Approved_Userid, N''))) = N'')", con);
            cmd.Parameters.AddWithValue("@Productvariantsid", productvariantsId.Trim());
            cmd.Parameters.AddWithValue("@Userid", userId.Trim());
            var o = cmd.ExecuteScalar();
            if (o == null || o == DBNull.Value) return false;
            return Convert.ToInt32(o) > 0;
        }

        [HttpGet("pending-edit-request")]
        public IActionResult GetPendingVariantEditRequest([FromQuery] string variantid, [FromQuery] string userid)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(variantid) || string.IsNullOrWhiteSpace(userid))
                    return BadRequest(new { success = false, message = "variantid and userid are required" });

                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (var con = new SqlConnection(connectionString))
                {
                    con.Open();
                    bool pending = HasPendingVariantEditRequest(con, variantid, userid);
                    return Ok(new { success = true, pending });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("GetPendingVariantEditRequest: " + ex);
                return StatusCode(500, new { success = false, message = ex.Message, pending = false });
            }
        }

        [HttpGet("pending-delete-request")]
        public IActionResult GetPendingVariantDeleteRequest([FromQuery] string variantid, [FromQuery] string userid)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(variantid) || string.IsNullOrWhiteSpace(userid))
                    return BadRequest(new { success = false, message = "variantid and userid are required" });

                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (var con = new SqlConnection(connectionString))
                {
                    con.Open();
                    bool pending = HasPendingVariantDeleteRequest(con, variantid, userid);
                    return Ok(new { success = true, pending });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("GetPendingVariantDeleteRequest: " + ex);
                return StatusCode(500, new { success = false, message = ex.Message, pending = false });
            }
        }

        /// <summary>
        /// Legacy Getitemapprovalsfull: List1 = Sp_Productvariants Q13 (pending item approvals),
        /// List2 = Sp_Variantsetcomments Q4 (variant edit/delete requests),
        /// plus itemapprovecount + itemrequestcount.
        /// </summary>
        [HttpGet("approvals-full")]
        public IActionResult GetItemApprovalsFull([FromQuery] string userid, [FromQuery] int? registrationId = null)
        {
            int itemapprovecount = 0;
            int itemrequestcount = 0;
            var list1 = new List<Dictionary<string, object>>();
            var list2 = new List<Dictionary<string, object>>();

            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (var con = new SqlConnection(connectionString))
                {
                    con.Open();

                    string? LookupRegUserid(int regId)
                    {
                        using var q = new SqlCommand("SELECT TOP (1) CAST(Userid AS NVARCHAR(255)) FROM Tbl_Registration WHERE id = @id", con);
                        q.Parameters.AddWithValue("@id", regId);
                        var o = q.ExecuteScalar();
                        if (o == null || o == DBNull.Value) return null;
                        var s = o.ToString()?.Trim();
                        return string.IsNullOrWhiteSpace(s) ? null : s;
                    }

                    string uid = (userid ?? "").Trim();
                    if (string.IsNullOrWhiteSpace(uid) && registrationId.HasValue && registrationId.Value > 0)
                        uid = LookupRegUserid(registrationId.Value) ?? "";
                    else if (!string.IsNullOrWhiteSpace(uid) && uid.All(char.IsDigit) && int.TryParse(uid, out int regFromDigits))
                    {
                        var lookedUp = LookupRegUserid(regFromDigits);
                        if (!string.IsNullOrWhiteSpace(lookedUp))
                            uid = lookedUp;
                    }

                    if (string.IsNullOrWhiteSpace(uid))
                        return BadRequest(new { success = false, message = "userid is required", List1 = list1, List2 = list2, itemapprovecount = 0, itemrequestcount = 0 });

                    // List1: item approvals (Sp_Productvariants Q13)
                    using (var cmd2 = new SqlCommand("Sp_Productvariants", con))
                    {
                        cmd2.CommandType = CommandType.StoredProcedure;
                        cmd2.Parameters.AddWithValue("@Id", "");
                        cmd2.Parameters.AddWithValue("@Userid", uid);
                        cmd2.Parameters.AddWithValue("@Productid", "");
                        cmd2.Parameters.AddWithValue("@Productname", "");
                        cmd2.Parameters.AddWithValue("@Varianttype", "");
                        cmd2.Parameters.AddWithValue("@Value", "");
                        cmd2.Parameters.AddWithValue("@Totalqty", "");
                        cmd2.Parameters.AddWithValue("@Noofqty_online", "");
                        cmd2.Parameters.AddWithValue("@Modelno", "");
                        cmd2.Parameters.AddWithValue("@Warehousecheck", "");
                        cmd2.Parameters.AddWithValue("@Batchno", "");
                        cmd2.Parameters.AddWithValue("@EANBarcodeno", "");
                        cmd2.Parameters.AddWithValue("@Isdelete", "");
                        cmd2.Parameters.AddWithValue("@Status", "");
                        cmd2.Parameters.AddWithValue("@Managerapprovestatus", "");
                        cmd2.Parameters.AddWithValue("@Warehouseapprovestatus", "");
                        cmd2.Parameters.AddWithValue("@Accountsapprovestatus", "");
                        cmd2.Parameters.AddWithValue("@Parentid", "");
                        cmd2.Parameters.AddWithValue("@Ischild", "");
                        cmd2.Parameters.AddWithValue("@Date", "");
                        cmd2.Parameters.AddWithValue("@Query", 13);

                        using (var reader = cmd2.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                var row = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    string col = reader.GetName(i);
                                    object val = reader.GetValue(i);
                                    row[col] = val == DBNull.Value ? null : val;
                                }
                                list1.Add(row);
                            }
                        }
                    }

                    itemapprovecount = list1.Count;

                    // List2: edit/delete requests for variants (Sp_Variantsetcomments Q4)
                    using (var cmd4 = new SqlCommand("Sp_Variantsetcomments", con))
                    {
                        cmd4.CommandType = CommandType.StoredProcedure;
                        cmd4.Parameters.AddWithValue("@Userid", uid);
                        cmd4.Parameters.AddWithValue("@Accepted_Userid", "");
                        cmd4.Parameters.AddWithValue("@Approved_Userid", "");
                        cmd4.Parameters.AddWithValue("@Productid", "");
                        cmd4.Parameters.AddWithValue("@Productvariantsid", "");
                        cmd4.Parameters.AddWithValue("@Productsetid", "");
                        cmd4.Parameters.AddWithValue("@Checked_Date", "");
                        cmd4.Parameters.AddWithValue("@Comments", "");
                        cmd4.Parameters.AddWithValue("@Commenttype", "Editrequest,Deleterequest");
                        cmd4.Parameters.AddWithValue("@Variantorset", "Variant");
                        cmd4.Parameters.AddWithValue("@Status", "0");
                        cmd4.Parameters.AddWithValue("@Role", "");
                        cmd4.Parameters.AddWithValue("@Query", 4);

                        using (var reader = cmd4.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                var row = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    string col = reader.GetName(i);
                                    object val = reader.GetValue(i);
                                    row[col] = val == DBNull.Value ? null : val;
                                }
                                list2.Add(row);
                            }
                        }
                    }

                    itemrequestcount = list2.Count;
                }

                return Ok(new
                {
                    success = true,
                    List1 = list1,
                    List2 = list2,
                    itemapprovecount,
                    itemrequestcount
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("GetItemApprovalsFull: " + ex);
                return StatusCode(500, new { success = false, message = ex.Message, List1 = list1, List2 = list2, itemapprovecount = 0, itemrequestcount = 0 });
            }
        }

        /// <summary>
        /// Pending item approval requests (variants) for current user.
        /// Backed by Sp_Productvariants @Query = 13 (legacy).
        /// </summary>
        [HttpGet("pending")]
        public async Task<IActionResult> GetPending(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string search = "",
            [FromQuery] string currentUserId = "",
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
                    await using (var cmd = new SqlCommand("Sp_Productvariants", con))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", "");
                        cmd.Parameters.AddWithValue("@Userid", currentUserId ?? "");
                        cmd.Parameters.AddWithValue("@Productid", "");
                        cmd.Parameters.AddWithValue("@Productname", "");
                        cmd.Parameters.AddWithValue("@Varianttype", "");
                        cmd.Parameters.AddWithValue("@Value", "");
                        cmd.Parameters.AddWithValue("@Totalqty", "");
                        cmd.Parameters.AddWithValue("@Noofqty_online", "");
                        cmd.Parameters.AddWithValue("@Modelno", "");
                        cmd.Parameters.AddWithValue("@Warehousecheck", "");
                        cmd.Parameters.AddWithValue("@Batchno", "");
                        cmd.Parameters.AddWithValue("@EANBarcodeno", "");
                        cmd.Parameters.AddWithValue("@Isdelete", "");
                        cmd.Parameters.AddWithValue("@Status", "");
                        cmd.Parameters.AddWithValue("@Managerapprovestatus", "");
                        cmd.Parameters.AddWithValue("@Warehouseapprovestatus", "");
                        cmd.Parameters.AddWithValue("@Accountsapprovestatus", "");
                        cmd.Parameters.AddWithValue("@Parentid", "");
                        cmd.Parameters.AddWithValue("@Ischild", "");
                        cmd.Parameters.AddWithValue("@Date", "");
                        cmd.Parameters.AddWithValue("@Query", 13);

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
                                list.Add(row);
                            }
                        }
                    }

                    // Some DB rows have Managerapprovestatus = NULL (not '0') or Parent row Ischild = 1,
                    // which can cause Sp_Productvariants Q13 to skip them. For approvals UI we treat NULL as Pending.
                    // We merge these rows into the SP result (dedupe by Id).
                    const string sql = @"
SELECT
    pv.Userid,
    ISNULL(r.Firstname, N'') AS Username,
    pv.Productid,
    pv.Productname,
    pv.Itemname,
    (STUFF((
        SELECT ', ' + CONVERT(VARCHAR(100), v2.Varianttype) + '-' + CONVERT(VARCHAR(100), v2.Value)
        FROM dbo.Tbl_Productvariants v2
        WHERE v2.Isdelete = 0
          AND (v2.Parentid = pv.Id OR v2.Id = pv.Id)
        ORDER BY v2.Id ASC
        FOR XML PATH(''), TYPE
    ).value('.', 'nvarchar(max)'), 1, 2, '')) AS allvalues,
    pv.Id,
    r.Catelogid
FROM dbo.Tbl_Productvariants pv
LEFT JOIN dbo.Tbl_Registration r ON r.Userid = pv.Userid
WHERE pv.Isdelete = 0
  AND pv.Parentid = 0
  AND (pv.Managerapprovestatus IS NULL OR LTRIM(RTRIM(CONVERT(varchar(50), pv.Managerapprovestatus))) = '0')
ORDER BY pv.Id DESC;";
                    var existingIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                    foreach (var row in list)
                    {
                        if (row.TryGetValue("Id", out var idv) && idv != null)
                            existingIds.Add(idv.ToString() ?? "");
                    }

                    await using (var q = new SqlCommand(sql, con))
                    await using (var r2 = await q.ExecuteReaderAsync())
                    {
                        while (await r2.ReadAsync())
                        {
                            var idObj = r2["Id"];
                            var idStr = idObj == DBNull.Value ? "" : idObj.ToString() ?? "";
                            if (!string.IsNullOrWhiteSpace(idStr) && existingIds.Contains(idStr))
                                continue;

                            var row = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
                            for (int i = 0; i < r2.FieldCount; i++)
                            {
                                var val = r2.IsDBNull(i) ? null : r2.GetValue(i);
                                row[r2.GetName(i)] = val;
                            }
                            list.Add(row);
                            if (!string.IsNullOrWhiteSpace(idStr))
                                existingIds.Add(idStr);
                        }
                    }
                }

                // Search filter (best-effort, preserves legacy output)
                if (!string.IsNullOrWhiteSpace(search))
                {
                    var s = search.Trim().ToLowerInvariant();
                    list = list.Where(r =>
                    {
                        foreach (var kv in r)
                        {
                            if (kv.Value == null) continue;
                            if (kv.Value.ToString()!.ToLowerInvariant().Contains(s)) return true;
                        }
                        return false;
                    }).ToList();
                }

                // Catelogid filter (frontend sends it). If the SP result doesn't include Catelogid, keep rows.
                if (!string.IsNullOrWhiteSpace(catelogid))
                {
                    var wanted = catelogid.Trim();
                    list = list.Where(r =>
                    {
                        if (!r.TryGetValue("Catelogid", out var v) || v == null) return true;
                        return StringComparer.OrdinalIgnoreCase.Equals(v.ToString()?.Trim() ?? "", wanted);
                    }).ToList();
                }

                int totalCount = list.Count;
                var paged = list.Skip((page - 1) * pageSize).Take(pageSize).ToList();

                return Ok(new { success = true, data = paged, totalCount });
            }
            catch (Exception ex)
            {
                Console.WriteLine("GetPendingItems: " + ex);
                return StatusCode(500, new { success = false, message = ex.Message, data = Array.Empty<object>(), totalCount = 0 });
            }
        }

        /// <summary>
        /// Approve/Reject item (variant) request. Mirrors legacy MVC Saveitemcomments logic.
        /// </summary>
        [HttpPost("response")]
        public async Task<IActionResult> PostResponse([FromBody] ItemApprovalResponsePayload? body)
        {
            try
            {
                if (body == null || string.IsNullOrWhiteSpace(body.Id) || string.IsNullOrWhiteSpace(body.Productid) || string.IsNullOrWhiteSpace(body.Userid))
                    return BadRequest(new { success = false, message = "Id, Productid, Userid are required" });

                string approvedUserId = (body.Approved_Userid ?? "").Trim();
                if (string.IsNullOrWhiteSpace(approvedUserId)) approvedUserId = "0";

                string role = (body.Approved_Role ?? "").Trim();
                if (string.IsNullOrWhiteSpace(role)) role = "Manager";

                string statusText = (body.Status ?? "").Trim();
                string statusCode = statusText.Equals("Approved", StringComparison.OrdinalIgnoreCase) || statusText == "1" ? "1" : "2";

                string comments = (body.Comments ?? body.Commentss ?? "").ToString();
                string checkedDate = DateTime.Now.ToString("MMM d yyyy h:mmtt");

                string connectionString = _configuration.GetConnectionString("DefaultConnection");

                await using (var con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();

                    // 1) Log approve/reject comment: Sp_Variantsetcomments Q1
                    await using (var cmd4 = new SqlCommand("Sp_Variantsetcomments", con))
                    {
                        cmd4.CommandType = CommandType.StoredProcedure;
                        cmd4.Parameters.AddWithValue("@Userid", body.Userid);
                        cmd4.Parameters.AddWithValue("@Accepted_Userid ", "");
                        cmd4.Parameters.AddWithValue("@Approved_Userid", approvedUserId);
                        cmd4.Parameters.AddWithValue("@Productid", body.Productid);
                        cmd4.Parameters.AddWithValue("@Productvariantsid", body.Id);
                        cmd4.Parameters.AddWithValue("@Productsetid", "0");
                        cmd4.Parameters.AddWithValue("@Checked_Date", checkedDate);
                        cmd4.Parameters.AddWithValue("@Comments", comments ?? "");
                        cmd4.Parameters.AddWithValue("@Commenttype", "Approve/Reject");
                        cmd4.Parameters.AddWithValue("@Variantorset", "Variant");
                        cmd4.Parameters.AddWithValue("@Status", statusCode);
                        cmd4.Parameters.AddWithValue("@Role", role);
                        cmd4.Parameters.AddWithValue("@Query", 1);
                        await cmd4.ExecuteNonQueryAsync();
                    }

                    // 2) Update manager approval status: Sp_Productvariants Q38
                    await using (var cmd212 = new SqlCommand("Sp_Productvariants", con))
                    {
                        cmd212.CommandType = CommandType.StoredProcedure;
                        cmd212.Parameters.AddWithValue("@Id", body.Id);
                        cmd212.Parameters.AddWithValue("@Userid", "");
                        cmd212.Parameters.AddWithValue("@Productid", body.Productid);
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
                        cmd212.Parameters.AddWithValue("@Managerapprovestatus", statusCode);
                        cmd212.Parameters.AddWithValue("@Warehouseapprovestatus", "0");
                        cmd212.Parameters.AddWithValue("@Accountsapprovestatus", "0");
                        cmd212.Parameters.AddWithValue("@Parentid", "");
                        cmd212.Parameters.AddWithValue("@Ischild", "");
                        cmd212.Parameters.AddWithValue("@Date", "");
                        cmd212.Parameters.AddWithValue("@Query", 38);
                        await cmd212.ExecuteNonQueryAsync();
                    }

                    // 3) Inventory entry: Sp_Inventory Q1 (legacy)
                    await using (var command1 = new SqlCommand("Sp_Inventory", con))
                    {
                        command1.CommandType = CommandType.StoredProcedure;
                        command1.Parameters.AddWithValue("@Id", "");
                        command1.Parameters.AddWithValue("@Productid", body.Productid);
                        command1.Parameters.AddWithValue("@Inventory_type", "1");
                        command1.Parameters.AddWithValue("@Inventory_date", checkedDate);
                        command1.Parameters.AddWithValue("@Productvariantsid", body.Id);
                        command1.Parameters.AddWithValue("@Total_qty", "0");
                        command1.Parameters.AddWithValue("@Billid", "0");
                        command1.Parameters.AddWithValue("@Warehouse_status", "1");
                        command1.Parameters.AddWithValue("@Isdelete", "0");
                        command1.Parameters.AddWithValue("@Status", "Transit");
                        command1.Parameters.AddWithValue("@Warehouseid", "1");
                        command1.Parameters.AddWithValue("@Query", 1);
                        await command1.ExecuteNonQueryAsync();
                    }
                }

                return Ok(new { success = true, message = "Response successfully saved" });
            }
            catch (Exception ex)
            {
                Console.WriteLine("PostItemResponse: " + ex);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Send edit request for an already approved/rejected variant. Mirrors legacy MVC Saveitemeditcomments.
        /// </summary>
        [HttpPost("edit-request")]
        public async Task<IActionResult> PostEditRequest([FromBody] ItemEditRequestPayload? body)
        {
            try
            {
                if (body == null || string.IsNullOrWhiteSpace(body.Id))
                    return BadRequest(new { success = false, message = "Id is required" });

                string role = (body.Role ?? body.Approved_Role ?? "").Trim();
                if (string.IsNullOrWhiteSpace(role)) role = "Manager";

                string comments = (body.Commentss ?? body.Comments ?? "").ToString();
                string checkedDate = DateTime.Now.ToString("MMM d yyyy h:mmtt");

                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                await using (var con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();

                    // If frontend didn't send Productid/Userid, resolve from DB (legacy MVC behavior)
                    string productId = (body.Productid ?? "").Trim();
                    string userId = (body.Userid ?? "").Trim();
                    if (string.IsNullOrWhiteSpace(productId) || string.IsNullOrWhiteSpace(userId))
                    {
                        await using var lookup = new SqlCommand(
                            @"SELECT TOP (1)
    LTRIM(RTRIM(ISNULL(Productid, N''))) AS Productid,
    LTRIM(RTRIM(ISNULL(Userid, N''))) AS Userid
FROM dbo.Tbl_Productvariants
WHERE Id = @Id", con);
                        lookup.Parameters.AddWithValue("@Id", body.Id.Trim());
                        await using var r = await lookup.ExecuteReaderAsync();
                        if (await r.ReadAsync())
                        {
                            if (string.IsNullOrWhiteSpace(productId))
                                productId = r["Productid"]?.ToString() ?? "";
                            if (string.IsNullOrWhiteSpace(userId))
                                userId = r["Userid"]?.ToString() ?? "";
                        }
                    }

                    if (string.IsNullOrWhiteSpace(productId) || string.IsNullOrWhiteSpace(userId))
                        return BadRequest(new { success = false, message = "Could not resolve Productid/Userid for this variant id." });

                    // Block duplicates: if a pending edit request already exists for this variant/user, return 409.
                    if (HasPendingVariantEditRequest(con, body.Id, userId))
                        return StatusCode(409, new { success = false, message = "Edit request already sent. Please wait for manager approval." });

                    await using (var cmd4 = new SqlCommand("Sp_Variantsetcomments", con))
                    {
                        cmd4.CommandType = CommandType.StoredProcedure;
                        cmd4.Parameters.AddWithValue("@Userid", userId);
                        cmd4.Parameters.AddWithValue("@Accepted_Userid ", "");
                        cmd4.Parameters.AddWithValue("@Approved_Userid", "");
                        cmd4.Parameters.AddWithValue("@Productid", productId);
                        cmd4.Parameters.AddWithValue("@Productvariantsid", body.Id);
                        cmd4.Parameters.AddWithValue("@Productsetid", "0");
                        cmd4.Parameters.AddWithValue("@Checked_Date", checkedDate);
                        cmd4.Parameters.AddWithValue("@Comments", comments ?? "");
                        cmd4.Parameters.AddWithValue("@Commenttype", "Editrequest");
                        cmd4.Parameters.AddWithValue("@Variantorset", "Variant");
                        cmd4.Parameters.AddWithValue("@Status", "0");
                        cmd4.Parameters.AddWithValue("@Role", role);
                        cmd4.Parameters.AddWithValue("@Query", 1);
                        await cmd4.ExecuteNonQueryAsync();
                    }
                }

                return Ok(new { success = true, message = "Edit request sent. Wait for manager approval" });
            }
            catch (Exception ex)
            {
                Console.WriteLine("PostItemEditRequest: " + ex);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Send delete request for an already approved/rejected variant. Mirrors legacy MVC Deleterequest flow.
        /// </summary>
        [HttpPost("delete-request")]
        public async Task<IActionResult> PostDeleteRequest([FromBody] ItemDeleteRequestPayload? body)
        {
            try
            {
                if (body == null || string.IsNullOrWhiteSpace(body.Id))
                    return BadRequest(new { success = false, message = "Id is required" });

                string role = (body.Role ?? body.Approved_Role ?? "").Trim();
                if (string.IsNullOrWhiteSpace(role)) role = "Manager";

                string comments = (body.Commentss ?? body.Comments ?? "").ToString();
                string checkedDate = DateTime.Now.ToString("MMM d yyyy h:mmtt");

                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                await using (var con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();

                    // Resolve Productid/Userid if missing
                    string productId = (body.Productid ?? "").Trim();
                    string userId = (body.Userid ?? "").Trim();
                    if (string.IsNullOrWhiteSpace(productId) || string.IsNullOrWhiteSpace(userId))
                    {
                        await using var lookup = new SqlCommand(
                            @"SELECT TOP (1)
    LTRIM(RTRIM(ISNULL(Productid, N''))) AS Productid,
    LTRIM(RTRIM(ISNULL(Userid, N''))) AS Userid
FROM dbo.Tbl_Productvariants
WHERE Id = @Id", con);
                        lookup.Parameters.AddWithValue("@Id", body.Id.Trim());
                        await using var r = await lookup.ExecuteReaderAsync();
                        if (await r.ReadAsync())
                        {
                            if (string.IsNullOrWhiteSpace(productId))
                                productId = r["Productid"]?.ToString() ?? "";
                            if (string.IsNullOrWhiteSpace(userId))
                                userId = r["Userid"]?.ToString() ?? "";
                        }
                    }

                    if (string.IsNullOrWhiteSpace(productId) || string.IsNullOrWhiteSpace(userId))
                        return BadRequest(new { success = false, message = "Could not resolve Productid/Userid for this variant id." });

                    if (HasPendingVariantDeleteRequest(con, body.Id, userId))
                        return StatusCode(409, new { success = false, message = "Delete request already sent. Please wait for manager approval." });

                    await using (var cmd4 = new SqlCommand("Sp_Variantsetcomments", con))
                    {
                        cmd4.CommandType = CommandType.StoredProcedure;
                        cmd4.Parameters.AddWithValue("@Userid", userId);
                        cmd4.Parameters.AddWithValue("@Accepted_Userid ", "");
                        cmd4.Parameters.AddWithValue("@Approved_Userid", "");
                        cmd4.Parameters.AddWithValue("@Productid", productId);
                        cmd4.Parameters.AddWithValue("@Productvariantsid", body.Id);
                        cmd4.Parameters.AddWithValue("@Productsetid", "0");
                        cmd4.Parameters.AddWithValue("@Checked_Date", checkedDate);
                        cmd4.Parameters.AddWithValue("@Comments", comments ?? "");
                        cmd4.Parameters.AddWithValue("@Commenttype", "Deleterequest");
                        cmd4.Parameters.AddWithValue("@Variantorset", "Variant");
                        cmd4.Parameters.AddWithValue("@Status", "0");
                        cmd4.Parameters.AddWithValue("@Role", role);
                        cmd4.Parameters.AddWithValue("@Query", 1);
                        await cmd4.ExecuteNonQueryAsync();
                    }
                }

                return Ok(new { success = true, message = "Delete request sent. Wait for manager approval" });
            }
            catch (Exception ex)
            {
                Console.WriteLine("PostItemDeleteRequest: " + ex);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Approve/Reject a pending variant Editrequest/Deleterequest (legacy Saveitemeditrequest).
        /// Executes Sp_Purchasebilldetails Q9 check, writes replay comment, updates variant (Q15),
        /// clears request notification (Sp_Variantsetcomments Q5), and returns refreshed pending requests (Q4).
        /// </summary>
        [HttpPost("edit-requests/process")]
        public async Task<IActionResult> PostProcessEditRequest([FromBody] ItemEditRequestDecisionPayload? body)
        {
            try
            {
                if (body == null || string.IsNullOrWhiteSpace(body.Id) || string.IsNullOrWhiteSpace(body.Commenttype))
                    return BadRequest(new { success = false, message = "Id and Commenttype are required" });

                string statusText = (body.Status ?? "").Trim();
                bool isApproved = statusText.Equals("Approved", StringComparison.OrdinalIgnoreCase) || statusText == "1";
                string statusCode = isApproved ? "1" : "2";

                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                var refreshed = new List<Dictionary<string, object>>();

                await using (var con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();

                    // Resolve Productid/Userid if missing
                    string productId = (body.Productid ?? "").Trim();
                    string userId = (body.Userid ?? "").Trim();
                    if (string.IsNullOrWhiteSpace(productId) || string.IsNullOrWhiteSpace(userId))
                    {
                        await using var lookup = new SqlCommand(
                            @"SELECT TOP (1)
    LTRIM(RTRIM(ISNULL(Productid, N''))) AS Productid,
    LTRIM(RTRIM(ISNULL(Userid, N''))) AS Userid
FROM dbo.Tbl_Productvariants
WHERE Id = @Id", con);
                        lookup.Parameters.AddWithValue("@Id", body.Id.Trim());
                        await using var rr = await lookup.ExecuteReaderAsync();
                        if (await rr.ReadAsync())
                        {
                            if (string.IsNullOrWhiteSpace(productId)) productId = rr["Productid"]?.ToString() ?? "";
                            if (string.IsNullOrWhiteSpace(userId)) userId = rr["Userid"]?.ToString() ?? "";
                        }
                    }

                    if (string.IsNullOrWhiteSpace(productId) || string.IsNullOrWhiteSpace(userId))
                        return BadRequest(new { success = false, message = "Could not resolve Productid/Userid for this variant id." });

                    // 1) Check purchase/sales usage (Sp_Purchasebilldetails Q9) – block if used.
                    await using (var cmdCheck = new SqlCommand("Sp_Purchasebilldetails", con))
                    {
                        cmdCheck.CommandType = CommandType.StoredProcedure;
                        cmdCheck.Parameters.AddWithValue("@Id", "");
                        cmdCheck.Parameters.AddWithValue("@Userid", "");
                        cmdCheck.Parameters.AddWithValue("@Billid", "");
                        cmdCheck.Parameters.AddWithValue("@Itemid", body.Id.Trim());
                        cmdCheck.Parameters.AddWithValue("@Description", "");
                        cmdCheck.Parameters.AddWithValue("@Qty", "");
                        cmdCheck.Parameters.AddWithValue("@Amount", "");
                        cmdCheck.Parameters.AddWithValue("@Vat", "");
                        cmdCheck.Parameters.AddWithValue("@Vat_id", "");
                        cmdCheck.Parameters.AddWithValue("@Total", "");
                        cmdCheck.Parameters.AddWithValue("@Status", "");
                        cmdCheck.Parameters.AddWithValue("@Isdelete", "0");
                        cmdCheck.Parameters.AddWithValue("@Query", 9);

                        var dtCheck = new DataTable();
                        using (var da = new SqlDataAdapter(cmdCheck))
                        {
                            da.Fill(dtCheck);
                        }
                        if (dtCheck.Rows.Count > 0)
                        {
                            return Ok(new { success = false, message = "Item already used in Purchase or Sales, so unable to delete." });
                        }
                    }

                    // 2) Save reply comment (Sp_Variantsetcomments Q1)
                    string replayType = (body.Commenttype ?? "").Trim();
                    if (replayType.Equals("Editrequest", StringComparison.OrdinalIgnoreCase))
                        replayType = "Editrequestreplay";
                    else if (replayType.Equals("Deleterequest", StringComparison.OrdinalIgnoreCase))
                        replayType = "Deleterequestreplay";

                    await using (var cmd4 = new SqlCommand("Sp_Variantsetcomments", con))
                    {
                        cmd4.CommandType = CommandType.StoredProcedure;
                        cmd4.Parameters.AddWithValue("@Userid", userId);
                        cmd4.Parameters.AddWithValue("@Accepted_Userid", "");
                        cmd4.Parameters.AddWithValue("@Approved_Userid", (body.Approved_Userid ?? "").Trim());
                        cmd4.Parameters.AddWithValue("@Productid", productId);
                        cmd4.Parameters.AddWithValue("@Productvariantsid", body.Id.Trim());
                        cmd4.Parameters.AddWithValue("@Productsetid", "0");
                        cmd4.Parameters.AddWithValue("@Checked_Date", DateTime.Now.ToString("MMM d yyyy h:mmtt"));
                        cmd4.Parameters.AddWithValue("@Comments", (body.Commentss ?? "").ToString());
                        cmd4.Parameters.AddWithValue("@Commenttype", replayType);
                        cmd4.Parameters.AddWithValue("@Variantorset", "Variant");
                        cmd4.Parameters.AddWithValue("@Status", statusCode);
                        cmd4.Parameters.AddWithValue("@Role", (body.Role ?? body.Approved_Role ?? "").Trim());
                        cmd4.Parameters.AddWithValue("@Query", 1);
                        await cmd4.ExecuteNonQueryAsync();
                    }

                    // 3) Update variant (Sp_Productvariants Q15) – delete only if Approved + Deleterequest
                    await using (var cmd212 = new SqlCommand("Sp_Productvariants", con))
                    {
                        cmd212.CommandType = CommandType.StoredProcedure;
                        cmd212.Parameters.AddWithValue("@Id", body.Id.Trim());
                        cmd212.Parameters.AddWithValue("@Userid", "");
                        cmd212.Parameters.AddWithValue("@Productid", productId);
                        cmd212.Parameters.AddWithValue("@Productname", "");
                        cmd212.Parameters.AddWithValue("@Varianttype", "");
                        cmd212.Parameters.AddWithValue("@Value", "");
                        cmd212.Parameters.AddWithValue("@Totalqty", "");
                        cmd212.Parameters.AddWithValue("@Noofqty_online", "");
                        cmd212.Parameters.AddWithValue("@Modelno", "");
                        cmd212.Parameters.AddWithValue("@Warehousecheck", "");
                        cmd212.Parameters.AddWithValue("@Batchno", "");
                        cmd212.Parameters.AddWithValue("@EANBarcodeno", "");

                        if (isApproved && (body.Commenttype ?? "").Trim().Equals("Deleterequest", StringComparison.OrdinalIgnoreCase))
                            cmd212.Parameters.AddWithValue("@Isdelete", "1");
                        else
                            cmd212.Parameters.AddWithValue("@Isdelete", "0");

                        cmd212.Parameters.AddWithValue("@Status", "");
                        cmd212.Parameters.AddWithValue("@Managerapprovestatus", isApproved ? "0" : "2");
                        cmd212.Parameters.AddWithValue("@Warehouseapprovestatus", "0");
                        cmd212.Parameters.AddWithValue("@Accountsapprovestatus", "0");
                        cmd212.Parameters.AddWithValue("@Parentid", "");
                        cmd212.Parameters.AddWithValue("@Ischild", "");
                        cmd212.Parameters.AddWithValue("@Date", "");
                        cmd212.Parameters.AddWithValue("@Query", 15);
                        await cmd212.ExecuteNonQueryAsync();
                    }

                    // 4) Clear notification / update request status (Sp_Variantsetcomments Q5)
                    await using (var cmd42 = new SqlCommand("Sp_Variantsetcomments", con))
                    {
                        cmd42.CommandType = CommandType.StoredProcedure;
                        cmd42.Parameters.AddWithValue("@Userid", "");
                        cmd42.Parameters.AddWithValue("@Accepted_Userid", "");
                        cmd42.Parameters.AddWithValue("@Approved_Userid", (body.Approved_Userid ?? "").Trim());
                        cmd42.Parameters.AddWithValue("@Productid", "");
                        cmd42.Parameters.AddWithValue("@Productvariantsid", body.Id.Trim());
                        cmd42.Parameters.AddWithValue("@Productsetid", "0");
                        cmd42.Parameters.AddWithValue("@Checked_Date", "");
                        cmd42.Parameters.AddWithValue("@Comments", "");
                        cmd42.Parameters.AddWithValue("@Commenttype", (body.Commenttype ?? "").Trim());
                        cmd42.Parameters.AddWithValue("@Variantorset", "Variant");
                        cmd42.Parameters.AddWithValue("@Status", "");
                        cmd42.Parameters.AddWithValue("@Role", "");
                        cmd42.Parameters.AddWithValue("@Query", 5);
                        await cmd42.ExecuteNonQueryAsync();
                    }

                    // 5) Reload pending list (Sp_Variantsetcomments Q4)
                    await using (var cmd44 = new SqlCommand("Sp_Variantsetcomments", con))
                    {
                        cmd44.CommandType = CommandType.StoredProcedure;
                        cmd44.Parameters.AddWithValue("@Userid", (body.Manager_Userid ?? body.Approved_Userid ?? "").Trim());
                        cmd44.Parameters.AddWithValue("@Accepted_Userid", "");
                        cmd44.Parameters.AddWithValue("@Approved_Userid", "");
                        cmd44.Parameters.AddWithValue("@Productid", "");
                        cmd44.Parameters.AddWithValue("@Productvariantsid", "");
                        cmd44.Parameters.AddWithValue("@Productsetid", "");
                        cmd44.Parameters.AddWithValue("@Checked_Date", "");
                        cmd44.Parameters.AddWithValue("@Comments", "");
                        cmd44.Parameters.AddWithValue("@Commenttype", "Editrequest,Deleterequest");
                        cmd44.Parameters.AddWithValue("@Variantorset", "Variant");
                        cmd44.Parameters.AddWithValue("@Status", "0");
                        cmd44.Parameters.AddWithValue("@Role", "");
                        cmd44.Parameters.AddWithValue("@Query", 4);

                        await using var reader = await cmd44.ExecuteReaderAsync();
                        while (await reader.ReadAsync())
                        {
                            var row = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                var val = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                row[reader.GetName(i)] = val;
                            }
                            refreshed.Add(row);
                        }
                    }
                }

                return Ok(new { success = true, message = "Response successfully saved", List1 = refreshed });
            }
            catch (Exception ex)
            {
                Console.WriteLine("PostProcessEditRequest: " + ex);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    public class ItemApprovalResponsePayload
    {
        public string Id { get; set; }
        public string Productid { get; set; }
        public string Userid { get; set; }
        public string Approved_Userid { get; set; }
        public string Approved_Role { get; set; }
        public string Status { get; set; }
        public string Comments { get; set; }
        public string Commentss { get; set; }
    }

    public class ItemEditRequestPayload
    {
        public string Id { get; set; }
        public string Productid { get; set; }
        public string Userid { get; set; }
        public string Commentss { get; set; }
        public string Comments { get; set; } = "";
        public string Role { get; set; }
        public string Approved_Role { get; set; } = "";
    }

    public class ItemEditRequestDecisionPayload
    {
        public string Id { get; set; }                 // variant id
        public string Userid { get; set; }             // creator/requester (optional)
        public string Approved_Userid { get; set; }    // manager
        public string Manager_Userid { get; set; }     // manager (for reload)
        public string Productid { get; set; }          // optional
        public string Commentss { get; set; }          // reason/comments
        public string Firstname { get; set; }          // optional (email template in legacy)
        public string Commenttype { get; set; }        // Editrequest or Deleterequest
        public string Status { get; set; }             // Approved / Rejected
        public string Role { get; set; }
        public string Approved_Role { get; set; }
    }

    public class ItemDeleteRequestPayload
    {
        public string Id { get; set; }
        public string Productid { get; set; }
        public string Userid { get; set; }
        public string Commentss { get; set; }
        public string Comments { get; set; } = "";
        public string Role { get; set; }
        public string Approved_Role { get; set; } = "";
    }
}


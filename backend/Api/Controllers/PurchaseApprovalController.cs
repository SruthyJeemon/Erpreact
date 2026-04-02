using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Globalization;

namespace Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PurchaseApprovalController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public PurchaseApprovalController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingApprovals()
        {
            var purchaseList = new List<Dictionary<string, object>>();
            int count = 0;
            string connectionString = _configuration.GetConnectionString("DefaultConnection");

            try
            {
                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    using (var cmd = new SqlCommand("Sp_Purchase", connection))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Warehouseapprove", "0");
                        cmd.Parameters.AddWithValue("@Accountsapprove", "0");
                        cmd.Parameters.AddWithValue("@Isdelete", "0");
                        cmd.Parameters.AddWithValue("@Query", 26);

                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var row = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                }
                                purchaseList.Add(row);
                            }
                        }
                    }
                    count = purchaseList.Count;
                }
                // Return structure matching user's provided logic for easier integration
                return Ok(new { success = true, data = purchaseList, List1 = purchaseList, count = count, purchaseapprovalcount = count });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("submit")]
        public async Task<IActionResult> SubmitApproval([FromBody] ApprovalModel model)
        {
            string connectionString = _configuration.GetConnectionString("DefaultConnection");
            try
            {
                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    using (var transaction = connection.BeginTransaction())
                    {
                        try
                        {
                            // 1. Log the action in Sp_Supplierpurchaselog
                            using (var cmdLog = new SqlCommand("Sp_Supplierpurchaselog", connection, transaction))
                            {
                                cmdLog.CommandType = CommandType.StoredProcedure;
                                cmdLog.Parameters.AddWithValue("@Id", "");
                                cmdLog.Parameters.AddWithValue("@Supplierid", model.Supplierid ?? (object)DBNull.Value);
                                cmdLog.Parameters.AddWithValue("@Purchaseid", model.Purchaseid);
                                cmdLog.Parameters.AddWithValue("@Approveuserid", model.Userid ?? "1");
                                cmdLog.Parameters.AddWithValue("@Editreason", "");
                                cmdLog.Parameters.AddWithValue("@Isdelete", "0");
                                cmdLog.Parameters.AddWithValue("@Changeddate", DateTime.Now);
                                cmdLog.Parameters.AddWithValue("@Comments", model.Comments ?? "");
                                cmdLog.Parameters.AddWithValue("@Type", "Approve/Reject");
                                cmdLog.Parameters.AddWithValue("@Status", (model.Status == "Approved" || model.Status == "1") ? "1" : "2");
                                cmdLog.Parameters.AddWithValue("@Sentedto", "");
                                cmdLog.Parameters.AddWithValue("@Query", 1);
                                await cmdLog.ExecuteNonQueryAsync();
                            }

                            // 2. Update Purchase table status
                            using (var cmdPurchase = new SqlCommand("Sp_Purchase", connection, transaction))
                            {
                                cmdPurchase.CommandType = CommandType.StoredProcedure;
                                cmdPurchase.Parameters.AddWithValue("@Id", model.Purchaseid);
                                cmdPurchase.Parameters.AddWithValue("@Accountsapprove", (model.Status == "Approved" || model.Status == "1") ? "1" : "2");
                                cmdPurchase.Parameters.AddWithValue("@Query", 19);
                                await cmdPurchase.ExecuteNonQueryAsync();
                            }

                            transaction.Commit();
                            return Ok(new { success = true, message = "Response successfully saved" });
                        }
                        catch (Exception)
                        {
                            transaction.Rollback();
                            throw;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("approval-status/{purchaseId}")]
        public async Task<IActionResult> GetApprovalStatus(string purchaseId)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    using (var cmd = new SqlCommand("Sp_Purchase", connection))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", purchaseId);
                        cmd.Parameters.AddWithValue("@Query", 25);

                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                return Ok(new
                                {
                                    success = true,
                                    managerapprove = reader["Managerapprovestatus"]?.ToString() ?? "0",
                                    accountsapprove = reader["Accountsapprove"]?.ToString() ?? "0",
                                    warehouseapprove = reader["Warehouseapprove"]?.ToString() ?? "0"
                                });
                            }
                        }
                    }
                }
                return NotFound(new { success = false, message = "Bill not found" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("check-edit-request/{purchaseId}")]
        public async Task<IActionResult> CheckEditRequest(string purchaseId)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    
                    // First check for Approved request (Status = 1)
                    using (var cmd = new SqlCommand("Sp_Supplierpurchaselog", connection))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", "");
                        cmd.Parameters.AddWithValue("@Approveuserid", "");
                        cmd.Parameters.AddWithValue("@Type", "Edit/Request");
                        cmd.Parameters.AddWithValue("@Status", "1");
                        cmd.Parameters.AddWithValue("@Purchaseid", purchaseId);
                        cmd.Parameters.AddWithValue("@Sentedto", "Accounts");
                        cmd.Parameters.AddWithValue("@Query", 3);

                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                return Ok(new { success = true, editrequeststatus = "Approved" });
                            }
                        }
                    }

                    // Then check for Pending request (Status = 0)
                    using (var cmd = new SqlCommand("Sp_Supplierpurchaselog", connection))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", "");
                        cmd.Parameters.AddWithValue("@Approveuserid", "");
                        cmd.Parameters.AddWithValue("@Type", "Edit/Request");
                        cmd.Parameters.AddWithValue("@Status", "0");
                        cmd.Parameters.AddWithValue("@Purchaseid", purchaseId);
                        cmd.Parameters.AddWithValue("@Sentedto", "Accounts");
                        cmd.Parameters.AddWithValue("@Query", 3);

                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                return Ok(new { success = true, editrequeststatus = "Pending" });
                            }
                        }
                    }
                }
                return Ok(new { success = true, editrequeststatus = "" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("request-edit")]
        public async Task<IActionResult> RequestEdit([FromBody] EditRequestModel model)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    using (var cmd = new SqlCommand("Sp_Supplierpurchaselog", connection))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", "");
                        cmd.Parameters.AddWithValue("@Supplierid", model.SupplierId ?? "");
                        cmd.Parameters.AddWithValue("@Purchaseid", model.PurchaseId);
                        cmd.Parameters.AddWithValue("@Approveuserid", model.UserId ?? "1");
                        cmd.Parameters.AddWithValue("@Editreason", model.Reason ?? "");
                        cmd.Parameters.AddWithValue("@Isdelete", "0");
                        cmd.Parameters.AddWithValue("@Changeddate", DateTime.Now);
                        cmd.Parameters.AddWithValue("@Comments", "");
                        cmd.Parameters.AddWithValue("@Type", "Edit/Request");
                        cmd.Parameters.AddWithValue("@Status", "0");
                        cmd.Parameters.AddWithValue("@Sentedto", "Accounts");
                        cmd.Parameters.AddWithValue("@Query", 1);
                        await cmd.ExecuteNonQueryAsync();
                    }
                }
                return Ok(new { success = true, message = "Edit request sent successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("edit-requests-full")]
        public async Task<IActionResult> GetEditRequestsFull()
        {
            try
            {
                var requestList = new List<Dictionary<string, object>>();
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    
                    // 1. Fetch Edit Requests
                    using (var cmd = new SqlCommand("Sp_Supplierpurchaselog", connection))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Sentedto", "Accounts");
                        cmd.Parameters.AddWithValue("@Status", "0");
                        cmd.Parameters.AddWithValue("@Approveuserid", "");
                        cmd.Parameters.AddWithValue("@Type", "Edit/Request");
                        cmd.Parameters.AddWithValue("@Query", 4);

                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var row = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                }
                                requestList.Add(row);
                            }
                        }
                    }


                    // 2. Fetch Supplier Info and Fix Date for each request
                    foreach (var row in requestList)
                    {
                        // Fix Date Format - Try multiple formats to be robust
                        if (row.ContainsKey("Changeddate") && row["Changeddate"] != null)
                        {
                            string dateStr = row["Changeddate"].ToString();
                            // Added: "MMM dd yyyy  h:mmtt" (Feb 12 2026  3:41PM - note double space) and single space variants
                            string[] formats = { 
                                "dd-MM-yyyy hh:mm:sstt", 
                                "d-M-yyyy h:mm:sstt", 
                                "dd-MM-yyyy HH:mm:ss", 
                                "yyyy-MM-dd HH:mm:ss",
                                "MMM dd yyyy  h:mmtt", // Feb 12 2026  3:41PM (double space?)
                                "MMM dd yyyy h:mmtt",   // Feb 12 2026 3:41PM
                                "MMM d yyyy h:mmtt",
                                "MMM dd yyyy"
                            };
                            
                            // Clean up extra spaces which might break strict parsing
                            string cleanDateStr = System.Text.RegularExpressions.Regex.Replace(dateStr, @"\s+", " ");

                            if (DateTime.TryParseExact(cleanDateStr, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime dt))
                            {
                                row["Changeddate"] = dt.ToString("yyyy-MM-ddTHH:mm:ss");
                            }
                            // Fallback: Try general parsing if exact fails
                            else if (DateTime.TryParse(dateStr, out dt))
                            {
                                row["Changeddate"] = dt.ToString("yyyy-MM-ddTHH:mm:ss");
                            }
                        }

                        // Fetch Supplier Info if Purchaseid exists
                        if (row.ContainsKey("Purchaseid") && row["Purchaseid"] != null)
                        {
                            try 
                            {
                                // We query the Purchase table and join Supplier to get the Name and ID
                                // Adjusted column names based on SupplierController (Supplierdisplayname, Companyname)
                                string query = @"
                                    SELECT s.Supplierdisplayname, s.Companyname, s.Id as SupplierId 
                                    FROM Tbl_Supplier s 
                                    INNER JOIN Tbl_Purchase p ON p.SupplierId = s.Id 
                                    WHERE p.Id = @Pid";

                                using (var cmdSup = new SqlCommand(query, connection))
                                {
                                    cmdSup.Parameters.AddWithValue("@Pid", row["Purchaseid"]);
                                    using (var readerSup = await cmdSup.ExecuteReaderAsync())
                                    {
                                        if (await readerSup.ReadAsync())
                                        {
                                            var dispName = readerSup["Supplierdisplayname"];
                                            var compName = readerSup["Companyname"];
                                            string finalName = "";

                                            if (dispName != DBNull.Value && !string.IsNullOrWhiteSpace(dispName.ToString()))
                                                finalName = dispName.ToString();
                                            else if (compName != DBNull.Value && !string.IsNullOrWhiteSpace(compName.ToString()))
                                                finalName = compName.ToString();
                                            else 
                                                finalName = "N/A";

                                            row["Suppliername"] = finalName;
                                            row["Supplierid"] = readerSup["SupplierId"] != DBNull.Value ? readerSup["SupplierId"] : null;
                                        }
                                    }
                                }
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Error fetching supplier: {ex.Message}");
                            }
                        }
                    }
                }
                return Ok(new { success = true, List1 = requestList, purchaseapprovalcount = requestList.Count });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("save-edit-comments")]
        public async Task<IActionResult> SavePurchaseEditComments([FromBody] EditCommentModel formData)
        {
            string msg = "";
            string connectionString = _configuration.GetConnectionString("DefaultConnection");
            try
            {
                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    using (var transaction = connection.BeginTransaction())
                    {
                        try
                        {
                            // 1. Insert new Approve/Reject log
                            using (SqlCommand cmd4 = new SqlCommand("Sp_Supplierpurchaselog", connection, transaction))
                            {
                                cmd4.CommandType = CommandType.StoredProcedure;
                                cmd4.Parameters.AddWithValue("@Id", "");
                                cmd4.Parameters.AddWithValue("@Supplierid", formData.Supplierid ?? "");
                                cmd4.Parameters.AddWithValue("@Purchaseid", formData.Purchaseid ?? "");
                                cmd4.Parameters.AddWithValue("@Approveuserid", formData.Userid ?? "1");
                                cmd4.Parameters.AddWithValue("@Editreason", "");
                                cmd4.Parameters.AddWithValue("@Isdelete", "0");
                                cmd4.Parameters.AddWithValue("@Changeddate", DateTime.Now);
                                cmd4.Parameters.AddWithValue("@Comments", formData.Comments ?? "");
                                cmd4.Parameters.AddWithValue("@Type", "Approve/Reject");
                                cmd4.Parameters.AddWithValue("@Status", formData.Status == "Approved" ? "1" : "2");
                                cmd4.Parameters.AddWithValue("@Sentedto", "");
                                cmd4.Parameters.AddWithValue("@Query", 1);
                                await cmd4.ExecuteNonQueryAsync();
                            }

                            // 2. Update original request status via Query 5
                            // 2. Update original request status via Direct SQL Update
                            // We use direct SQL to ensure the Status is updated regardless of SP logic variations.
                            string updateSql = "UPDATE Tbl_Supplierpurchaselog SET Status = @Status WHERE Id = @Id";
                            using (SqlCommand cmdUpdate = new SqlCommand(updateSql, connection, transaction))
                            {
                                cmdUpdate.Parameters.AddWithValue("@Id", formData.Id ?? "");
                                cmdUpdate.Parameters.AddWithValue("@Status", formData.Status == "Approved" ? "1" : "2");
                                await cmdUpdate.ExecuteNonQueryAsync();
                            }

                            // 3. Update Purchase table via Query 19
                            using (SqlCommand cmd212 = new SqlCommand("Sp_Purchase", connection, transaction))
                            {
                                cmd212.CommandType = CommandType.StoredProcedure;
                                cmd212.Parameters.AddWithValue("@Id", formData.Purchaseid ?? "");
                                cmd212.Parameters.AddWithValue("@Accountsapprove", formData.Status == "Approved" ? "0" : "2");
                                cmd212.Parameters.AddWithValue("@Query", 19);
                                await cmd212.ExecuteNonQueryAsync();
                            }

                            transaction.Commit();
                            msg = "Response successfully saved";
                            return Ok(new { success = true, msg = msg });
                        }
                        catch (Exception)
                        {
                            transaction.Rollback();
                            throw;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                msg = "An error occurred: " + ex.Message;
                return BadRequest(new { success = false, msg = msg });
            }
        }

        [HttpGet("edit-requests")]
        public async Task<IActionResult> GetEditRequests()
        {
            return await GetEditRequestsFull();
        }

        [HttpPost("process-edit-request")]
        public async Task<IActionResult> ProcessEditRequest([FromBody] ProcessEditRequestModel model)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    using (var cmd = new SqlCommand("Sp_Supplierpurchaselog", connection))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", model.Id);
                        cmd.Parameters.AddWithValue("@Approveuserid", model.ApprovedByUserId ?? "1");
                        cmd.Parameters.AddWithValue("@Status", model.Status); // 1 for Approve, 2 for Reject
                        cmd.Parameters.AddWithValue("@Query", 2);
                        await cmd.ExecuteNonQueryAsync();
                    }
                }
                return Ok(new { success = true, message = "Request processed successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        public class ProcessEditRequestModel
        {
            public string Id { get; set; }
            public string Status { get; set; }
            public string ApprovedByUserId { get; set; }
        }

        public class EditRequestModel
        {
            public string PurchaseId { get; set; }
            public string SupplierId { get; set; }
            public string UserId { get; set; }
            public string Reason { get; set; }
        }

        public class ApprovalModel
        {
            public string Purchaseid { get; set; }
            public string Supplierid { get; set; }
            public string Status { get; set; }
            public string Comments { get; set; }
            public string Userid { get; set; }
        }

        public class EditCommentModel
        {
            public string Id { get; set; }
            public string Purchaseid { get; set; }
            public string Supplierid { get; set; }
            public string Status { get; set; }
            public string Comments { get; set; }
            public string Userid { get; set; }
        }
        [HttpGet("pending-stock-details")]
        public async Task<IActionResult> GetPendingStockDetails([FromQuery] string userId)
        {
            List<PendingStockDto> purchaseList = new List<PendingStockDto>();
            string warehouseName = "";
            string warehouseId = "";
            string connectionString = _configuration.GetConnectionString("DefaultConnection");

            try
            {
                Console.WriteLine($"GetPendingStockDetails: Request for userId: {userId}");
                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();

                    // 1. Robust Warehouse Resolution (Search by Userid or Email)
                    string userLookupSql = @"
                        SELECT r.Warehouseid, s.Name 
                        FROM Tbl_Registration r 
                        LEFT JOIN Tbl_Stocklocation s ON (CAST(r.Warehouseid AS VARCHAR(50)) = CAST(s.Id AS VARCHAR(50)) OR r.Warehouseid = s.Name)
                        WHERE r.Userid = @Uid OR r.Email = @Uid";

                    using (SqlCommand cmd = new SqlCommand(userLookupSql, connection))
                    {
                        cmd.Parameters.AddWithValue("@Uid", userId ?? "");
                        using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                warehouseId = reader["Warehouseid"] != DBNull.Value ? reader["Warehouseid"].ToString() : "";
                                warehouseName = reader["Name"] != DBNull.Value ? reader["Name"].ToString() : "";
                                Console.WriteLine($"GetPendingStockDetails: Found Warehouse {warehouseId} ({warehouseName}) for user {userId}");
                            }
                            else
                            {
                                Console.WriteLine($"GetPendingStockDetails: No warehouse found for user {userId}");
                            }
                        }
                    }

                    // 2. Mirroring User's Working SQL Query
                    string sql = @"
                        SELECT DISTINCT
                            p.Id,
                            r.Firstname AS Username,
                            p.Bill_date,
                            p.Type,
                            p.Billno,
                            s.Supplierdisplayname AS Suppliername,
                            p.Grand_Total,
                            ISNULL(c.Currency, p.Currency) AS Currencyname,
                            s.Id AS Supplierid
                        FROM Tbl_Purchase p
                        INNER JOIN Tbl_Supplier s ON s.Id = p.Supplierid
                        INNER JOIN Tbl_Registration r ON r.Userid = s.Userid  
                        LEFT JOIN Tbl_Currency c ON (TRY_CAST(p.Currency AS INT) = c.Id OR p.Currency = c.Currency)
                        WHERE p.Accountsapprove = 1 
                          AND p.Isdelete = 0 
                          AND p.Warehouseapprove = 0 
                          AND (CAST(p.Warehouseid AS VARCHAR(50)) = @Warehouseid OR (p.Warehouseid IS NULL AND @Warehouseid = ''))
                        ORDER BY p.Id DESC";

                    using (SqlCommand cmd = new SqlCommand(sql, connection))
                    {
                        cmd.Parameters.AddWithValue("@Warehouseid", warehouseId);

                        using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                purchaseList.Add(new PendingStockDto
                                {
                                    Id = reader["Id"] != DBNull.Value ? reader["Id"].ToString() : "",
                                    Username = reader["Username"] != DBNull.Value ? reader["Username"].ToString() : "",
                                    Bill_date = reader["Bill_date"] != DBNull.Value ? reader["Bill_date"].ToString() : "",
                                    Type = reader["Type"] != DBNull.Value ? reader["Type"].ToString() : "",
                                    Billno = reader["Billno"] != DBNull.Value ? reader["Billno"].ToString() : "",
                                    Suppliername = reader["Suppliername"] != DBNull.Value ? reader["Suppliername"].ToString() : "",
                                    Grand_Total = reader["Grand_Total"] != DBNull.Value ? reader["Grand_Total"].ToString() : "",
                                    Currencyname = reader["Currencyname"] != DBNull.Value ? reader["Currencyname"].ToString() : "",
                                    Supplierid = reader["Supplierid"] != DBNull.Value ? reader["Supplierid"].ToString() : "",
                                    Warehouseid = warehouseId,
                                    Warehousename = warehouseName
                                });
                            }
                        }
                    }
                }

                Console.WriteLine($"GetPendingStockDetails: Returning {purchaseList.Count} items for warehouse {warehouseName}");
                return Ok(new { success = true, List1 = purchaseList, Warehousename = warehouseName, Warehouseid = warehouseId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        public class PendingStockDto
        {
            public string Id { get; set; }
            public string Username { get; set; }
            public string Bill_date { get; set; }
            public string Type { get; set; }
            public string Billno { get; set; }
            public string Suppliername { get; set; }
            public string Grand_Total { get; set; }
            public string Currencyname { get; set; }
            public string Supplierid { get; set; }
            public string Warehouseid { get; set; }
            public string Warehousename { get; set; }
        }
    }
}

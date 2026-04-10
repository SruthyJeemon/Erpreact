using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using Api.Models;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Microsoft.AspNetCore.Http;

namespace Api.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class SalesController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public SalesController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet]
        [Route("/api/termsandcondition")]
        public async Task<IActionResult> GetTermsAndCondition([FromQuery] string? userid, [FromQuery] string? type, [FromQuery] string? catalogId)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    string? resolvedCatelogId = catalogId;
                    
                    if (string.IsNullOrWhiteSpace(resolvedCatelogId) && !string.IsNullOrWhiteSpace(userid))
                    {
                        using (var cmd = new SqlCommand("SELECT TOP 1 Catelogid FROM Tbl_Registration WHERE Userid = @Userid OR CAST(Id AS VARCHAR(50)) = @Userid", connection))
                        {
                            cmd.Parameters.AddWithValue("@Userid", userid ?? "");
                            var obj = await cmd.ExecuteScalarAsync();
                            resolvedCatelogId = obj?.ToString();
                        }
                    }

                    if (string.IsNullOrWhiteSpace(resolvedCatelogId))
                        return Ok(new { success = true, list = Array.Empty<object>() });

                    var list = new List<object>();
                    using (SqlCommand cmd = new SqlCommand("Sp_Termsandcondition", connection))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", "");
                        cmd.Parameters.AddWithValue("@Type", string.IsNullOrWhiteSpace(type) ? "Invoice" : type);
                        cmd.Parameters.AddWithValue("@Terms", "");
                        cmd.Parameters.AddWithValue("@Isdelete", "0");
                        cmd.Parameters.AddWithValue("@Catelogid", resolvedCatelogId);
                        cmd.Parameters.AddWithValue("@Bankid", "");
                        cmd.Parameters.AddWithValue("@Query", 5);

                        using var reader = await cmd.ExecuteReaderAsync();
                        while (await reader.ReadAsync())
                        {
                            list.Add(new
                            {
                                Termsandconditions = reader["Terms"]?.ToString(),
                                Accountname = reader["Accountname"]?.ToString(),
                                Account_number = reader["Account_number"]?.ToString(),
                                IBAN = reader["IBAN"]?.ToString(),
                                Bankname = reader["Bankname"]?.ToString(),
                                Swift_code = reader["Swift_code"]?.ToString()
                            });
                        }
                    }
                    return Ok(new { success = true, list });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        public class StockEditApprovalRequest
        {
            public string? Id { get; set; }
            public string? stocklogid { get; set; }
            public string? Comments { get; set; }
            public string? Status { get; set; }
            public string? Userid { get; set; }
        }

        public class PickupConfirmationRequest
        {
            public PickupFormData FormData { get; set; }
            public List<PickupDetailRow> TableData { get; set; }
        }

        public class PickupFormData
        {
            public string? Id { get; set; } // Stocktransferid
            public string? Pickupid { get; set; }
            public string? Invoiceno { get; set; }
            public string? Purchaseid { get; set; }
            public string? Remarks { get; set; }
            public string? Status { get; set; } // "True" if disputes exist
            public string? PdfData { get; set; } // Base64
            public string? Userid { get; set; }
            public string? Enterdate { get; set; }
        }

        public class AcceptDisputeRequest
        {
            public string? Stockid { get; set; }
            public string? Pickuplistid { get; set; }
            public string? Userid { get; set; }
        }

        public class PickupDetailRow
        {
            public string? Itemid { get; set; }
            public int Qty { get; set; }
            public int Received_qty { get; set; }
            public int Disputed_qty { get; set; }
            public string? Reason { get; set; }
        }

        [HttpGet]
        public IActionResult GetOptions([FromQuery] string value, [FromQuery] string catelogid = "1001")
        {
            List<ProductVariantSearchResult> variants = new List<ProductVariantSearchResult>();

            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    using (SqlCommand cmd2 = new SqlCommand("Sp_Productvariants", con))
                    {
                        cmd2.CommandType = CommandType.StoredProcedure;
                        
                        // Log parameters for debugging
                        Console.WriteLine($"[DEBUG] Sales/GetOptions - Catelogid: {catelogid}, Itemname: {value}, Query: 27");

                        cmd2.Parameters.AddWithValue("@Catelogid", catelogid ?? "");
                        cmd2.Parameters.AddWithValue("@Itemname", value ?? "");
                        cmd2.Parameters.AddWithValue("@Query", 27);
                        cmd2.Parameters.AddWithValue("@Id", 0);
                        cmd2.Parameters.AddWithValue("@Status", "Active");
                        cmd2.Parameters.AddWithValue("@Isdelete", 0);
                        cmd2.Parameters.AddWithValue("@Parentid", 0);
                        cmd2.Parameters.AddWithValue("@Varianttype", "");
                        cmd2.Parameters.AddWithValue("@Value", "");

                        con.Open();
                        using (SqlDataAdapter da1 = new SqlDataAdapter(cmd2))
                        {
                            DataTable dt1 = new DataTable();
                            da1.Fill(dt1);

                            if (dt1.Rows.Count > 0)
                            {
                                foreach (DataRow row in dt1.Rows)
                                {
                                    ProductVariantSearchResult model = new ProductVariantSearchResult
                                    {
                                        id = Convert.ToInt32(row["Id"]),
                                        Itemname = row["Itemname"].ToString(),
                                        allvalues = row["allvalues"]?.ToString() ?? "",
                                        Type = row["Type"]?.ToString() ?? "",
                                    };
                                    variants.Add(model);
                                }
                            }
                        }
                        con.Close();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetOptions: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }

            return Ok(new { List1 = variants });
        }

        [HttpPost]
        public async Task<IActionResult> Addstocktransfer([FromBody] StockTransferModels request)
        {
            if (request == null || request.FormData == null)
                return BadRequest(new { message = "Invalid request data" });

            string message = "";
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();
                    using (SqlTransaction transaction = con.BeginTransaction())
                    {
                        try
                        {
                            var formData = request.FormData;
                            var tableData1 = request.TableData1;
                            var insertedId = "";
                            
                            string receiptstring = Billformat(con, transaction);
                            
                            using (SqlCommand cmd12 = new SqlCommand("Sp_Stocktransfer", con, transaction))
                            {
                                cmd12.CommandType = CommandType.StoredProcedure;
                                cmd12.Parameters.AddWithValue("@Id", "");
                                cmd12.Parameters.AddWithValue("@Userid", formData.Userid ?? "1");
                                cmd12.Parameters.AddWithValue("@Warehousefrom", formData.Warehousefrom);
                                cmd12.Parameters.AddWithValue("@Warehouseto", formData.Warehouseto);
                                cmd12.Parameters.AddWithValue("@Warehousetoaddress", formData.locationaddress ?? "");
                                cmd12.Parameters.AddWithValue("@Date", DateTime.Now.ToString("dd-MM-yyyy HH:mm"));
                                cmd12.Parameters.AddWithValue("@Sheduled_date", formData.Sheduleddate?.ToString("dd-MM-yyyy HH:mm") ?? (object)DBNull.Value);
                                cmd12.Parameters.AddWithValue("@Isdelete", "0");
                                cmd12.Parameters.AddWithValue("@Status", "0");
                                cmd12.Parameters.AddWithValue("@Managerapprove", "0");
                                cmd12.Parameters.AddWithValue("@Remarks", formData.Remarks ?? "");
                                cmd12.Parameters.AddWithValue("@Query", 1);

                                using (SqlDataAdapter da1 = new SqlDataAdapter(cmd12))
                                {
                                    DataTable dt1 = new DataTable();
                                    da1.Fill(dt1);
                                    if (dt1.Rows.Count > 0)
                                    {
                                        insertedId = dt1.Rows[0][0].ToString();
                                    }
                                }
                            }

                            if (!string.IsNullOrEmpty(insertedId))
                            {
                                // Update Receipt Number
                                using (SqlCommand cmd = new SqlCommand("Sp_Stocktransfer", con, transaction))
                                {
                                    cmd.CommandType = CommandType.StoredProcedure;
                                    cmd.Parameters.AddWithValue("@Id", insertedId);
                                    int pidcount = Convert.ToInt32(insertedId);
                                    pidcount = pidcount + 1;
                                    string receiptNo = "STF-" + DateTime.Now.ToString("yyyyMMdd") + pidcount.ToString();
                                    cmd.Parameters.AddWithValue("@Receiptno", receiptNo);
                                    cmd.Parameters.AddWithValue("@Query", 6);
                                    await cmd.ExecuteNonQueryAsync();
                                }

                                // Process Items
                                if (tableData1 != null)
                                {
                                    foreach (var row in tableData1)
                                    {
                                        string Type = "Item"; // Default
                                        string itemn = row.Itemname ?? "";
                                        
                                        var match = Regex.Match(itemn, @"\(([^)]+)\)");
                                        if (match.Success)
                                        {
                                            Type = match.Groups[1].Value;
                                        }

                                        using (SqlCommand cmd21 = new SqlCommand("Sp_Stocktransferdetails", con, transaction))
                                        {
                                            cmd21.CommandType = CommandType.StoredProcedure;
                                            cmd21.Parameters.AddWithValue("@Id", "");
                                            cmd21.Parameters.AddWithValue("@Stocktransferid", insertedId);
                                            cmd21.Parameters.AddWithValue("@Itemid", row.Itemid);
                                            cmd21.Parameters.AddWithValue("@Qty", row.Qty);
                                            cmd21.Parameters.AddWithValue("@Isdelete", "0");
                                            cmd21.Parameters.AddWithValue("@Status", "Active");
                                            cmd21.Parameters.AddWithValue("@Type", Type);
                                            cmd21.Parameters.AddWithValue("@Query", 1);
                                            await cmd21.ExecuteNonQueryAsync();
                                        }

                                        // Inventory Updates
                                        if (Type == "Set")
                                        {
                                            await ProcessSetItems(con, transaction, row.Itemid, row.Qty, insertedId, formData.Warehousefrom, formData.Warehouseto);
                                        }
                                        else if (Type == "Combo")
                                        {
                                            await ProcessComboItems(con, transaction, row.Itemid, row.Qty, insertedId, formData.Warehousefrom, formData.Warehouseto);
                                        }
                                        else
                                        {
                                            string pidi = await GetProductIdFromVariant(con, transaction, row.Itemid.ToString());
                                            ExecuteInventoryUpdate(pidi, row.Itemid.ToString(), row.Qty, insertedId, formData.Warehousefrom, formData.Warehouseto, transaction);
                                        }
                                    }
                                }

                                // Log the action
                                using (SqlCommand cmd4 = new SqlCommand("Sp_Stocktransferlog", con, transaction))
                                {
                                    cmd4.CommandType = CommandType.StoredProcedure;
                                    cmd4.Parameters.AddWithValue("@Id", "");
                                    cmd4.Parameters.AddWithValue("@Userid", formData.Userid ?? "1");
                                    cmd4.Parameters.AddWithValue("@Stocktransferid", insertedId);
                                    cmd4.Parameters.AddWithValue("@Approveuserid", "");
                                    cmd4.Parameters.AddWithValue("@Editreason", "");
                                    cmd4.Parameters.AddWithValue("@Date", DateTime.Now);
                                    cmd4.Parameters.AddWithValue("@Comments", "Added");
                                    cmd4.Parameters.AddWithValue("@Type", "Log");
                                    cmd4.Parameters.AddWithValue("@Status", "0");
                                    cmd4.Parameters.AddWithValue("@Isdelete", "0");
                                    cmd4.Parameters.AddWithValue("@Query", 1);
                                    await cmd4.ExecuteNonQueryAsync();
                                }

                                transaction.Commit();
                                message = "Saved Successfully";
                            }
                            else
                            {
                                throw new Exception("Failed to insert stock transfer header");
                            }
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            Console.WriteLine($"Transaction Error: {ex.Message}");
                            return StatusCode(500, new { message = "Error: " + ex.Message });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in Addstocktransfer: {ex.Message}");
                return StatusCode(500, new { message = "Error: " + ex.Message });
            }

            return Ok(new { message = message });
        }

        [HttpPost]
        public async Task<IActionResult> Editstocktransfer([FromBody] StockTransferModels request)
        {
            if (request == null || request.FormData == null)
                return BadRequest(new { message = "Invalid request data" });

            string message = "";
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();
                    using (SqlTransaction transaction = con.BeginTransaction())
                    {
                        try
                        {
                            var formData = request.FormData;
                            var tableData1 = request.TableData1;

                            // Update Header
                            using (SqlCommand cmd12 = new SqlCommand("Sp_Stocktransfer", con, transaction))
                            {
                                cmd12.CommandType = CommandType.StoredProcedure;
                                cmd12.Parameters.AddWithValue("@Id", formData.Id);
                                cmd12.Parameters.AddWithValue("@Userid", formData.Userid ?? "1");
                                cmd12.Parameters.AddWithValue("@Warehousefrom", formData.Warehousefrom);
                                cmd12.Parameters.AddWithValue("@Warehouseto", formData.Warehouseto);
                                cmd12.Parameters.AddWithValue("@Warehousetoaddress", formData.locationaddress ?? "");
                                cmd12.Parameters.AddWithValue("@Date", DateTime.Now.ToString("dd-MM-yyyy HH:mm"));
                                cmd12.Parameters.AddWithValue("@Sheduled_date", formData.Sheduleddate?.ToString("dd-MM-yyyy HH:mm") ?? (object)DBNull.Value);
                                cmd12.Parameters.AddWithValue("@Managerapprove", "0");
                                cmd12.Parameters.AddWithValue("@Remarks", formData.Remarks ?? "");
                                cmd12.Parameters.AddWithValue("@Query", 4);
                                await cmd12.ExecuteNonQueryAsync();
                            }

                            // Delete Existing Details
                            using (SqlCommand cmd21 = new SqlCommand("Sp_Stocktransferdetails", con, transaction))
                            {
                                cmd21.CommandType = CommandType.StoredProcedure;
                                cmd21.Parameters.AddWithValue("@Stocktransferid", formData.Id);
                                cmd21.Parameters.AddWithValue("@Query", 6);
                                // Fill dummy parameters
                                cmd21.Parameters.AddWithValue("@Id", "");
                                cmd21.Parameters.AddWithValue("@Itemid", "");
                                cmd21.Parameters.AddWithValue("@Qty", "");
                                cmd21.Parameters.AddWithValue("@Status", "");
                                cmd21.Parameters.AddWithValue("@Isdelete", "");
                                await cmd21.ExecuteNonQueryAsync();
                            }

                            // Reset Inventory
                            using (SqlCommand command = new SqlCommand("Sp_Inventory", con, transaction))
                            {
                                command.CommandType = CommandType.StoredProcedure;
                                command.Parameters.AddWithValue("@Billid", formData.Id);
                                command.Parameters.AddWithValue("@Inventory_type", "3");
                                command.Parameters.AddWithValue("@Stocktransferstatus", "Ongoing");
                                command.Parameters.AddWithValue("@Query", 17);
                                // Fill dummy parameters
                                command.Parameters.AddWithValue("@Id", "");
                                command.Parameters.AddWithValue("@Productid", "");
                                command.Parameters.AddWithValue("@Inventory_date", "");
                                command.Parameters.AddWithValue("@Productvariantsid", "");
                                command.Parameters.AddWithValue("@Total_qty", "");
                                command.Parameters.AddWithValue("@Warehouse_status", "");
                                command.Parameters.AddWithValue("@Isdelete", "0");
                                command.Parameters.AddWithValue("@Status", "");
                                command.Parameters.AddWithValue("@Warehouseid", "");
                                await command.ExecuteNonQueryAsync();
                            }

                            // Process Items
                            if (tableData1 != null)
                            {
                                foreach (var row in tableData1)
                                {
                                    string Type = "Item"; // Default
                                    string itemn = row.Itemname ?? "";

                                    var match = Regex.Match(itemn, @"\(([^)]+)\)");
                                    if (match.Success)
                                    {
                                        Type = match.Groups[1].Value;
                                    }

                                    using (SqlCommand cmd21 = new SqlCommand("Sp_Stocktransferdetails", con, transaction))
                                    {
                                        cmd21.CommandType = CommandType.StoredProcedure;
                                        cmd21.Parameters.AddWithValue("@Id", "");
                                        cmd21.Parameters.AddWithValue("@Stocktransferid", formData.Id);
                                        cmd21.Parameters.AddWithValue("@Itemid", row.Itemid);
                                        cmd21.Parameters.AddWithValue("@Qty", row.Qty);
                                        cmd21.Parameters.AddWithValue("@Status", "Active");
                                        cmd21.Parameters.AddWithValue("@Isdelete", "0");
                                        cmd21.Parameters.AddWithValue("@Type", Type);
                                        cmd21.Parameters.AddWithValue("@Query", 1);
                                        await cmd21.ExecuteNonQueryAsync();
                                    }

                                    // Inventory Updates
                                    if (Type == "Set")
                                    {
                                        await ProcessSetItems(con, transaction, row.Itemid, row.Qty, formData.Id.ToString(), formData.Warehousefrom, formData.Warehouseto);
                                    }
                                    else if (Type == "Combo")
                                    {
                                        await ProcessComboItems(con, transaction, row.Itemid, row.Qty, formData.Id.ToString(), formData.Warehousefrom, formData.Warehouseto);
                                    }
                                    else
                                    {
                                        string pidi = await GetProductIdFromVariant(con, transaction, row.Itemid.ToString());
                                        ExecuteInventoryUpdate(pidi, row.Itemid.ToString(), row.Qty, formData.Id.ToString(), formData.Warehousefrom, formData.Warehouseto, transaction);
                                    }
                                }
                            }

                            // Log updated
                            using (SqlCommand cmd4 = new SqlCommand("Sp_Stocktransferlog", con, transaction))
                            {
                                cmd4.CommandType = CommandType.StoredProcedure;
                                cmd4.Parameters.AddWithValue("@Id", "");
                                cmd4.Parameters.AddWithValue("@Userid", formData.Userid ?? "1");
                                cmd4.Parameters.AddWithValue("@Stocktransferid", formData.Id);
                                cmd4.Parameters.AddWithValue("@Approveuserid", "");
                                cmd4.Parameters.AddWithValue("@Editreason", "");
                                cmd4.Parameters.AddWithValue("@Date", DateTime.Now);
                                cmd4.Parameters.AddWithValue("@Comments", "Updated");
                                cmd4.Parameters.AddWithValue("@Type", "Log");
                                cmd4.Parameters.AddWithValue("@Status", "0");
                                cmd4.Parameters.AddWithValue("@Isdelete", "0");
                                cmd4.Parameters.AddWithValue("@Query", 1);
                                await cmd4.ExecuteNonQueryAsync();
                            }

                            // Set Status to 3 (Approval Pending) after edit
                            using (SqlCommand cmdStatus = new SqlCommand("Sp_Stocktransfer", con, transaction))
                            {
                                cmdStatus.CommandType = CommandType.StoredProcedure;
                                cmdStatus.Parameters.AddWithValue("@Id", formData.Id);
                                cmdStatus.Parameters.AddWithValue("@Status", "3"); // Approval Pending
                                cmdStatus.Parameters.AddWithValue("@Query", 13);
                                await cmdStatus.ExecuteNonQueryAsync();
                            }

                            transaction.Commit();
                            message = "Updated Successfully";
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            Console.WriteLine($"Transaction Error: {ex.Message}");
                            return StatusCode(500, new { message = "Error: " + ex.Message });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in Editstocktransfer: {ex.Message}");
                return StatusCode(500, new { message = "Error: " + ex.Message });
            }

            return Ok(new { message = message });
        }

        [HttpPost]
        public async Task<IActionResult> DeleteStocktransfer([FromBody] Dictionary<string, string> request)
        {
            if (request == null || !request.ContainsKey("Id"))
                return BadRequest(new { message = "Invalid request data" });

            string Id = request["Id"];
            string message = "";
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();
                    using (SqlTransaction transaction = con.BeginTransaction())
                    {
                        try
                        {
                            using (SqlCommand cmd = new SqlCommand("Sp_Stocktransfer", con, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Id", Id);
                                cmd.Parameters.AddWithValue("@Isdelete", "1");
                                cmd.Parameters.AddWithValue("@Query", 5);
                                await cmd.ExecuteNonQueryAsync();
                            }

                            using (SqlCommand cmd = new SqlCommand("Sp_Stocktransferdetails", con, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Isdelete", "1");
                                cmd.Parameters.AddWithValue("@Stocktransferid", Id);
                                cmd.Parameters.AddWithValue("@Query", 3);
                                cmd.Parameters.AddWithValue("@Id", "");
                                cmd.Parameters.AddWithValue("@Itemid", "");
                                cmd.Parameters.AddWithValue("@Qty", "");
                                cmd.Parameters.AddWithValue("@Status", "");
                                await cmd.ExecuteNonQueryAsync();
                            }

                            using (SqlCommand cmd = new SqlCommand("Sp_Inventory", con, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Billid", Id);
                                cmd.Parameters.AddWithValue("@Inventory_type", 3);
                                cmd.Parameters.AddWithValue("@Isdelete", "1");
                                cmd.Parameters.AddWithValue("@Query", 11);
                                cmd.Parameters.AddWithValue("@Id", "");
                                cmd.Parameters.AddWithValue("@Productid", "");
                                cmd.Parameters.AddWithValue("@Inventory_date", "");
                                cmd.Parameters.AddWithValue("@Productvariantsid", "");
                                cmd.Parameters.AddWithValue("@Total_qty", "");
                                await cmd.ExecuteNonQueryAsync();
                            }

                            using (SqlCommand cmd = new SqlCommand("Sp_Stocktransferlog", con, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Id", "");
                                cmd.Parameters.AddWithValue("@Userid", request.ContainsKey("Userid") ? request["Userid"] : "1");
                                cmd.Parameters.AddWithValue("@Stocktransferid", Id);
                                cmd.Parameters.AddWithValue("@Approveuserid", "");
                                cmd.Parameters.AddWithValue("@Editreason", "");
                                cmd.Parameters.AddWithValue("@Date", DateTime.Now.ToString("dd-MM-yyyy HH:mm"));
                                cmd.Parameters.AddWithValue("@Comments", "Deleted");
                                cmd.Parameters.AddWithValue("@Type", "Log");
                                cmd.Parameters.AddWithValue("@Status", "0");
                                cmd.Parameters.AddWithValue("@Isdelete", "0");
                                cmd.Parameters.AddWithValue("@Query", 1);
                                await cmd.ExecuteNonQueryAsync();
                            }

                            transaction.Commit();
                            message = "Deleted Successfully";
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            throw;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error: " + ex.Message });
            }

            return Ok(new { message = message });
        }

        [HttpPost]
        public async Task<IActionResult> Checkstocktransferrequestbefore([FromBody] Dictionary<string, string> request)
        {
            if (request == null || !request.ContainsKey("Id")) 
                return BadRequest(new { success = false, msg = "Invalid request data" });

            string msg = "";
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();
                    using (SqlCommand cmd = new SqlCommand("Sp_Stocktransferlog", con))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Stocktransferid", request["Id"]);
                        cmd.Parameters.AddWithValue("@Userid", request.ContainsKey("Userid") ? request["Userid"] : "1");
                        cmd.Parameters.AddWithValue("@Type", "Edit/Request");
                        cmd.Parameters.AddWithValue("@Status", "0");
                        cmd.Parameters.AddWithValue("@Query", 2);

                        // Fill dummy parameters
                        cmd.Parameters.AddWithValue("@Id", "");
                        cmd.Parameters.AddWithValue("@Approveuserid", "");
                        cmd.Parameters.AddWithValue("@Editreason", "");
                        cmd.Parameters.AddWithValue("@Comments", "");
                        cmd.Parameters.AddWithValue("@Isdelete", "0");
                        cmd.Parameters.AddWithValue("@Date", "");

                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            if (reader.HasRows)
                            {
                                msg = "Edit Request is Already Sent and Pending";
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { msg = ex.Message });
            }
            return Ok(new { msg = msg });
        }

        [HttpPost]
        public async Task<IActionResult> Savestocktransfereditcomments([FromBody] Dictionary<string, string> formData)
        {
            string msg = "";
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();
                    using (SqlTransaction transaction = con.BeginTransaction())
                    {
                        try
                        {
                            using (SqlCommand cmd4 = new SqlCommand("Sp_Stocktransferlog", con, transaction))
                            {
                                cmd4.CommandType = CommandType.StoredProcedure;
                                cmd4.Parameters.AddWithValue("@Id", "");
                                cmd4.Parameters.AddWithValue("@Userid", formData.ContainsKey("Userid") ? formData["Userid"] : "1");
                                cmd4.Parameters.AddWithValue("@Stocktransferid", formData.ContainsKey("Id") ? formData["Id"] : "");
                                cmd4.Parameters.AddWithValue("@Approveuserid", "");
                                cmd4.Parameters.AddWithValue("@Date", DateTime.Now);
                                
                                string comments = formData.ContainsKey("Comments") ? formData["Comments"] : "";
                                cmd4.Parameters.AddWithValue("@Editreason", comments);
                                cmd4.Parameters.AddWithValue("@Comments", "");
                                cmd4.Parameters.AddWithValue("@Type", "Edit/Request");
                                cmd4.Parameters.AddWithValue("@Status", "0");
                                cmd4.Parameters.AddWithValue("@Isdelete", "0");
                                cmd4.Parameters.AddWithValue("@Query", 1);

                                await cmd4.ExecuteNonQueryAsync();
                                msg = "Response successfully saved";
                            }
                            transaction.Commit();
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
                return StatusCode(500, new { msg = ex.Message });
            }

            return Ok(new { msg = msg });
        }

        [HttpGet]
        public async Task<IActionResult> Getauditlogstocktransfer([FromQuery] string stockid)
        {
            if (string.IsNullOrEmpty(stockid))
                return BadRequest(new { message = "Stock ID is required" });

            var list = new List<Dictionary<string, object>>();
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();
                    using (SqlCommand cmd = new SqlCommand("Sp_Stocktransferlog", con))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", stockid);
                        cmd.Parameters.AddWithValue("@Stocktransferid", stockid);
                        cmd.Parameters.AddWithValue("@Query", 6);

                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var dict = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    dict[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                }
                                list.Add(dict);
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error: " + ex.Message });
            }

            return Ok(new { success = true, list = list });
        }

        [HttpGet]
        public async Task<IActionResult> Gomanagerapprovalstocktransfer([FromQuery] string billid)
        {
            if (string.IsNullOrEmpty(billid))
                return BadRequest(new { msg = "Bill ID is required" });

            string msg = "";
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();

                    // Check existing status using Query 24
                    using (SqlCommand cmd1 = new SqlCommand("Sp_Stocktransfer", con))
                    {
                        cmd1.CommandType = CommandType.StoredProcedure;
                        cmd1.Parameters.AddWithValue("@Id", billid);
                        cmd1.Parameters.AddWithValue("@Query", 24);

                        using (SqlDataAdapter da = new SqlDataAdapter(cmd1))
                        {
                            DataTable dt = new DataTable();
                            da.Fill(dt);
                            if (dt.Rows.Count > 0)
                            {
                                if (dt.Rows[0][0].ToString() == "3")
                                {
                                    msg = "Allready Send request for manager approval";
                                }
                                else
                                {
                                    // Update to status 3 using Query 25
                                    using (SqlCommand cmd = new SqlCommand("Sp_Stocktransfer", con))
                                    {
                                        cmd.CommandType = CommandType.StoredProcedure;
                                        cmd.Parameters.AddWithValue("@Id", billid);
                                        cmd.Parameters.AddWithValue("@Status", "3");
                                        cmd.Parameters.AddWithValue("@Query", 25);
                                        await cmd.ExecuteNonQueryAsync();
                                        msg = "Managerapproval request send successfully";
                                    }
                                }
                            }
                            else
                            {
                                msg = "Invalid Transfer ID";
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { msg = "Error: " + ex.Message });
            }

            return Ok(new { msg = msg });
        }

        [HttpGet]
        public async Task<IActionResult> GetStockTransferDashboardStats([FromQuery] string catelogid = "1")
        {
            var stats = new Dictionary<string, int>();
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();
                    string query = @"
                        SELECT ts.Status, COUNT(*) as Count 
                        FROM Tbl_Stocktransfer ts
                        INNER JOIN Tbl_Registration tr ON tr.Userid = ts.Userid
                        WHERE ts.Isdelete = 0 
                        AND tr.Catelogid IN (SELECT value FROM dbo.SplitString(@Catelogid, ','))
                        GROUP BY ts.Status";

                    using (SqlCommand cmd = new SqlCommand(query, con))
                    {
                        cmd.Parameters.AddWithValue("@Catelogid", catelogid);
                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            stats["0"] = 0; // Pending
                            stats["1"] = 0; // Approved
                            stats["3"] = 0; // Approval Pending
                            
                            while (await reader.ReadAsync())
                            {
                                string status = reader["Status"].ToString();
                                int count = Convert.ToInt32(reader["Count"]);
                                stats[status] = count;
                            }
                        }
                    }
                }
                return Ok(new { success = true, stats = stats });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> Getstocktransferapprovalsfull([FromQuery] string userid)
        {
            string username = "";
            string catelogid = "";
            int stockapprovalcount = 0, stockrequestcount = 0, finalcount = 0;
            var list1 = new List<Dictionary<string, object>>();
            var list2 = new List<Dictionary<string, object>>();
            var list3 = new List<Dictionary<string, object>>();

            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();

                    // 1. Get User Profile and Catelogid
                    using (SqlCommand cmd = new SqlCommand("Sp_UserRegistration", con))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Userid", userid);
                        cmd.Parameters.AddWithValue("@Query", 5);
                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                username = reader["Firstname"]?.ToString() ?? "";
                            }
                        }
                    }

                    Console.WriteLine($"[DEBUG] Getstocktransferapprovalsfull: userid={userid}");

                    // 2. List 1: Pending Approvals - show ALL pending transfers (no catalog filter, admin sees all)
                    string query1 = @"
                        SELECT ts.*, tr.Firstname, tr.Firstname as creator_username,
                               whf.Name as WarehouseFromName, wht.Name as WarehouseToName,
                               whf.Locationaddress as WarehouseFromAddress, wht.Locationaddress as WarehouseToAddress
                        FROM Tbl_Stocktransfer ts
                        LEFT JOIN Tbl_Registration tr ON tr.Userid = ts.Userid
                        LEFT JOIN Tbl_Stocklocation whf ON whf.Id = TRY_CAST(LTRIM(RTRIM(ts.Warehousefrom)) AS INT)
                        LEFT JOIN Tbl_Stocklocation wht ON wht.Id = TRY_CAST(LTRIM(RTRIM(ts.Warehouseto)) AS INT)
                        WHERE ts.Status = '3' 
                        AND ts.Managerapprove = '0'
                        AND ts.Isdelete = '0'
                        ORDER BY ts.Id DESC";

                    using (SqlCommand cmd = new SqlCommand(query1, con))
                    {
                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var dict = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
                                for (int i = 0; i < reader.FieldCount; i++)
                                    dict[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                list1.Add(dict);
                            }
                        }
                    }

                    // 3. List 3: Final Approvals - show ALL (no catalog filter)
                    string query3 = @"
                        SELECT ts.*, tr.Firstname, tr.Firstname as creator_username,
                               whf.Name as WarehouseFromName, wht.Name as WarehouseToName,
                               whf.Locationaddress as WarehouseFromAddress, wht.Locationaddress as WarehouseToAddress
                        FROM Tbl_Stocktransfer ts
                        LEFT JOIN Tbl_Registration tr ON tr.Userid = ts.Userid
                        LEFT JOIN Tbl_Stocklocation whf ON whf.Id = TRY_CAST(LTRIM(RTRIM(ts.Warehousefrom)) AS INT)
                        LEFT JOIN Tbl_Stocklocation wht ON wht.Id = TRY_CAST(LTRIM(RTRIM(ts.Warehouseto)) AS INT)
                        WHERE ts.Towarehouse_approve = '1'
                        AND ts.Status = '3'
                        AND ts.Isdelete = '0'
                        ORDER BY ts.Id DESC";

                    using (SqlCommand cmd = new SqlCommand(query3, con))
                    {
                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var dict = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
                                for (int i = 0; i < reader.FieldCount; i++)
                                    dict[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                list3.Add(dict);
                            }
                        }
                    }

                    // 4. List 2: Edit/Delete Requests
                    string query2 = @"
                        SELECT tl.*, ts.Receiptno, ts.Warehousefrom, ts.Warehouseto,
                               whf.Name as WarehouseFromName, wht.Name as WarehouseToName
                        FROM Tbl_Stocktransferlog tl
                        INNER JOIN Tbl_Stocktransfer ts ON ts.Id = tl.Stocktransferid
                        LEFT JOIN Tbl_Stocklocation whf ON whf.Id = TRY_CAST(LTRIM(RTRIM(ts.Warehousefrom)) AS INT)
                        LEFT JOIN Tbl_Stocklocation wht ON wht.Id = TRY_CAST(LTRIM(RTRIM(ts.Warehouseto)) AS INT)
                        WHERE tl.Isdelete = '0' 
                        AND tl.Type = 'Edit/Request' 
                        AND tl.Status = '0'";

                    using (SqlCommand cmd = new SqlCommand(query2, con))
                    {
                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var dict = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
                                for (int i = 0; i < reader.FieldCount; i++)
                                    dict[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                list2.Add(dict);
                            }
                        }
                    }
                }

                stockapprovalcount = list1.Count;
                stockrequestcount = list2.Count;
                finalcount = list3.Count;
                Console.WriteLine($"[DEBUG] Found: list1={list1.Count}, list2={list2.Count}, list3={list3.Count}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Getstocktransferapprovalsfull: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return StatusCode(500, new { message = ex.Message });
            }

            return Ok(new { 

                success = true,
                list1 = list1, 
                list2 = list2, 
                list3 = list3, 
                finalcount, 
                stockapprovalcount, 
                stockrequestcount, 
                username 
                
            });
        }

        [HttpPost]
        [DisableRequestSizeLimit]
        public async Task<IActionResult> Savestockapprovalcomments([FromBody] StockApprovalRequest request)
        {
            if (request == null)
                return BadRequest(new { success = false, msg = "Invalid request data" });

            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();
                    using (SqlTransaction transaction = con.BeginTransaction())
                    {
                        try
                        {
                            using (SqlCommand cmd4 = new SqlCommand("Sp_Stocktransferlog", con, transaction))
                            {
                                cmd4.CommandType = CommandType.StoredProcedure;
                                cmd4.Parameters.AddWithValue("@Id", "");
                                cmd4.Parameters.AddWithValue("@Userid", request.Userid ?? ""); 
                                cmd4.Parameters.AddWithValue("@Stocktransferid ", request.Id ?? "");
                                cmd4.Parameters.AddWithValue("@Approveuserid", request.Userid ?? ""); 

                                cmd4.Parameters.AddWithValue("@Editreason", "");
                                cmd4.Parameters.AddWithValue("@Date", DateTime.Now);
                                
                                if (request.Comments != null)
                                {
                                    cmd4.Parameters.AddWithValue("@Comments", request.Comments);
                                }
                                else
                                {
                                    cmd4.Parameters.AddWithValue("@Comments", "");
                                }

                                cmd4.Parameters.AddWithValue("@Type", "Approve/Reject");

                                if (request.Status == "Approved")
                                {
                                    cmd4.Parameters.AddWithValue("@Status", "1");
                                }
                                else
                                {
                                    cmd4.Parameters.AddWithValue("@Status", "2");
                                }

                                cmd4.Parameters.AddWithValue("@Isdelete", "0");
                                cmd4.Parameters.AddWithValue("@Query", 1);
                                await cmd4.ExecuteNonQueryAsync();
                            }

                            using (SqlCommand cmd41 = new SqlCommand("Sp_Stocktransfer", con, transaction))
                            {
                                cmd41.CommandType = CommandType.StoredProcedure;
                                
                                if (request.Status == "Approved")
                                {
                                    cmd41.Parameters.AddWithValue("@Managerapprove", "1");

                                    if (string.IsNullOrEmpty(request.pdfData))
                                    {
                                        transaction.Rollback();
                                        return Ok(new { success = false, msg = "No PDF data received." });
                                    }

                                    string base64Data = request.pdfData;
                                    if (base64Data.Contains(",")) base64Data = base64Data.Split(',')[1];
                                    byte[] pdfBytes = Convert.FromBase64String(base64Data);

                                    string invoiceId1 = "Invoice_" + "12345";
                                    string timestamp = DateTime.Now.ToString("yyyyMMddHHmmss");
                                    string fileName = invoiceId1 + "_" + timestamp + ".pdf";

                                    string directoryPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Content", "images", "Pickup");
                                    if (!Directory.Exists(directoryPath))
                                    {
                                        Directory.CreateDirectory(directoryPath);
                                    }

                                    string filePath = Path.Combine(directoryPath, fileName);
                                    await System.IO.File.WriteAllBytesAsync(filePath, pdfBytes);

                                    string fileUrl = "/Content/images/Pickup/" + fileName;
                                    cmd41.Parameters.AddWithValue("@Transfer_invoice", fileUrl);
                                }
                                else
                                {
                                    cmd41.Parameters.AddWithValue("@Managerapprove", "2");
                                    cmd41.Parameters.AddWithValue("@Transfer_invoice", "");
                                }

                                cmd41.Parameters.AddWithValue("@Id", request.Id);
                                cmd41.Parameters.AddWithValue("@Query", 10);
                                await cmd41.ExecuteNonQueryAsync();
                            }

                            using (SqlCommand cmdStatus = new SqlCommand("Sp_Stocktransfer", con, transaction))
                            {
                                cmdStatus.CommandType = CommandType.StoredProcedure;
                                cmdStatus.Parameters.AddWithValue("@Id", request.Id);
                                cmdStatus.Parameters.AddWithValue("@Status", request.Status == "Approved" ? "1" : "2");
                                cmdStatus.Parameters.AddWithValue("@Query", 13);
                                await cmdStatus.ExecuteNonQueryAsync();
                            }

                            transaction.Commit();
                            return Ok(new { success = true, msg = "Response saved successfully" });
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            throw;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error in Savestockapprovalcomments: " + ex.Message);
                return Ok(new { success = false, msg = "Error: " + ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Savestockeditapprovalcomments([FromBody] StockEditApprovalRequest formData)
        {
            if (formData == null)
                return BadRequest(new { success = false, msg = "Invalid request data" });

            string msg = "";
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();
                    using (SqlTransaction transaction = con.BeginTransaction())
                    {
                        try
                        {
                            using (SqlCommand cmd4 = new SqlCommand("Sp_Stocktransferlog", con, transaction))
                            {
                                cmd4.CommandType = CommandType.StoredProcedure;
                                cmd4.Parameters.AddWithValue("@Id", formData.stocklogid ?? "");
                                cmd4.Parameters.AddWithValue("@Approveuserid", formData.Userid ?? "1");
                                cmd4.Parameters.AddWithValue("@Comments", formData.Comments ?? "");
                                cmd4.Parameters.AddWithValue("@Type", "Edit/Request");
                                cmd4.Parameters.AddWithValue("@Status", formData.Status == "Approved" ? "1" : "2");
                                cmd4.Parameters.AddWithValue("@Isdelete", "0");
                                cmd4.Parameters.AddWithValue("@Query", 4);

                                await cmd4.ExecuteNonQueryAsync();
                            }

                            using (SqlCommand cmd41 = new SqlCommand("Sp_Stocktransfer", con, transaction))
                            {
                                cmd41.CommandType = CommandType.StoredProcedure;
                                cmd41.Parameters.AddWithValue("@Managerapprove", formData.Status == "Approved" ? "0" : "2");
                                cmd41.Parameters.AddWithValue("@Id", formData.Id ?? "");
                                cmd41.Parameters.AddWithValue("@Query", 10);

                                await cmd41.ExecuteNonQueryAsync();
                            }

                            // If edit request was approved, also set Status back to '0' (Pending)
                            if (formData.Status == "Approved")
                            {
                                using (SqlCommand cmdStat = new SqlCommand("Sp_Stocktransfer", con, transaction))
                                {
                                    cmdStat.CommandType = CommandType.StoredProcedure;
                                    cmdStat.Parameters.AddWithValue("@Id", formData.Id ?? "");
                                    cmdStat.Parameters.AddWithValue("@Status", "0");
                                    cmdStat.Parameters.AddWithValue("@Query", 13);
                                    await cmdStat.ExecuteNonQueryAsync();
                                }
                            }

                            transaction.Commit();
                            msg = "Response successfully saved";
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
                return StatusCode(500, new { success = false, msg = ex.Message });
            }

            return Ok(new { success = true, msg = msg });
        }

        [HttpGet]
        public async Task<IActionResult> GetStockTransfers(
            [FromQuery] string catelogid = "1", 
            [FromQuery] int queryType = 7,
            [FromQuery] string? fromDate = null,
            [FromQuery] string? toDate = null,
            [FromQuery] string? search = null)
        {
            var list = new List<Dictionary<string, object>>();
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();
                    using (SqlCommand cmd = new SqlCommand("", con))
                    {
                        if (queryType == 7 || queryType == 22)
                        {
                            string sql = @"
                                DECLARE @Todaydate DATETIME = GETDATE();
                                SELECT 
                                    ts.*, 
                                    tr.Firstname, 
                                    tsl.Name AS WarehouseFromName, 
                                    tsll.Name AS WarehouseToName
                                FROM Tbl_Stocktransfer ts
                                INNER JOIN Tbl_Registration tr ON tr.Userid = ts.Userid
                                LEFT JOIN Tbl_Stocklocation tsl ON tsl.Id = TRY_CAST(LTRIM(RTRIM(ts.Warehousefrom)) AS INT)
                                LEFT JOIN Tbl_Stocklocation tsll ON tsll.Id = TRY_CAST(LTRIM(RTRIM(ts.Warehouseto)) AS INT)
                                WHERE ts.Isdelete = 0 ";

                            if (queryType == 7) // Pending
                            {
                                sql += " AND (LTRIM(RTRIM(ts.Towarehouse_approve)) = '' OR ts.Towarehouse_approve IS NULL) ";
                            }
                            else if (queryType == 22) // Archived
                            {
                                sql += " AND ts.Towarehouse_approve = '1' ";
                                if (!string.IsNullOrEmpty(fromDate) && !string.IsNullOrEmpty(toDate))
                                {
                                    sql += " AND CAST(TRY_CONVERT(DATETIME, ts.Date, 103) AS DATE) BETWEEN @Fromdate AND @Todate ";
                                }
                                else
                                {
                                    sql += " AND CAST(TRY_CONVERT(DATETIME, ts.Date, 103) AS DATE) >= CAST(DATEADD(DAY, -90, @Todaydate) AS DATE) ";
                                }
                            }

                            // Catalog Filtering
                            if (!string.IsNullOrEmpty(catelogid))
                            {
                                sql += " AND EXISTS (SELECT 1 FROM dbo.SplitString(@Catelogid, ',') s WHERE ',' + tr.Catelogid + ',' LIKE '%,' + s.value + ',%')";
                                cmd.Parameters.AddWithValue("@Catelogid", catelogid);
                            }

                            if (!string.IsNullOrEmpty(search))
                            {
                                sql += " AND ts.Receiptno LIKE @Search ";
                                cmd.Parameters.AddWithValue("@Search", "%" + search + "%");
                            }

                            sql += " ORDER BY ts.Id DESC";

                            cmd.CommandText = sql;
                            cmd.CommandType = CommandType.Text;
                            if (!string.IsNullOrEmpty(fromDate))
                            {
                                cmd.Parameters.AddWithValue("@Fromdate", fromDate);
                                cmd.Parameters.AddWithValue("@Todate", toDate);
                            }
                        }
                        else if (queryType == 28)
                        {
                            // Keep Archive logic but adapt to include Firstname and Warehouse names
                            string sql = @"
                                SELECT ts.*, tr.Firstname,
                                       wf.Name AS WarehouseFromName, wt.Name AS WarehouseToName
                                FROM Tbl_Stocktransfer ts
                                LEFT JOIN Tbl_Registration tr ON tr.Userid = ts.Userid
                                LEFT JOIN Tbl_Stocklocation wf ON wf.Id = TRY_CAST(LTRIM(RTRIM(ts.Warehousefrom)) AS INT)
                                LEFT JOIN Tbl_Stocklocation wt ON wt.Id = TRY_CAST(LTRIM(RTRIM(ts.Warehouseto)) AS INT)
                                WHERE ts.Isdelete = 0 ";
                            
                            if (!string.IsNullOrEmpty(fromDate) && !string.IsNullOrEmpty(toDate))
                            {
                                sql += " AND ts.Sheduled_date BETWEEN @Fromdate AND @Todate ";
                            }

                            if (!string.IsNullOrEmpty(search))
                            {
                                sql += " AND ts.Receiptno LIKE @Search ";
                            }

                            sql += " ORDER BY ts.Id DESC";

                            cmd.CommandText = sql;
                            cmd.CommandType = CommandType.Text;
                            if (!string.IsNullOrEmpty(fromDate))
                            {
                                cmd.Parameters.AddWithValue("@Fromdate", fromDate);
                                cmd.Parameters.AddWithValue("@Todate", toDate);
                            }
                            if (!string.IsNullOrEmpty(search))
                            {
                                cmd.Parameters.AddWithValue("@Search", "%" + search + "%");
                            }
                        }
                        else
                        {
                            cmd.CommandType = CommandType.StoredProcedure;
                            cmd.CommandText = "Sp_Stocktransfer";
                            cmd.Parameters.AddWithValue("@Isdelete", "0");
                            cmd.Parameters.AddWithValue("@Catelogid", catelogid);
                            cmd.Parameters.AddWithValue("@Query", queryType);
                            if (!string.IsNullOrEmpty(fromDate)) cmd.Parameters.AddWithValue("@Fromdate", fromDate);
                            if (!string.IsNullOrEmpty(toDate)) cmd.Parameters.AddWithValue("@Todate", toDate);
                            if (!string.IsNullOrEmpty(search)) cmd.Parameters.AddWithValue("@Receiptno", search);
                        }

                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var dict = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    dict[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                }
                                list.Add(dict);
                            }
                        }
                    }
                }
                return Ok(new { success = true, list = list, List1 = list });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

                [HttpGet("{id}")]
        public async Task<IActionResult> GetStockTransferDetails(int id)
        {
            var items = new List<Dictionary<string, object>>();
            Dictionary<string, object> header = null;
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();

                    // Fetch header with warehouse names
                    string headerQuery = @"
                        SELECT ts.*, tr.Firstname,
                               wf.Name AS WarehouseFromName, wt.Name AS WarehouseToName,
                               wf.Locationaddress AS WarehouseFromAddress, wt.Locationaddress AS WarehouseToAddress
                        FROM Tbl_Stocktransfer ts
                        LEFT JOIN Tbl_Registration tr ON tr.Userid = ts.Userid
                        LEFT JOIN Tbl_Stocklocation wf ON wf.Id = TRY_CAST(LTRIM(RTRIM(ts.Warehousefrom)) AS INT)
                        LEFT JOIN Tbl_Stocklocation wt ON wt.Id = TRY_CAST(LTRIM(RTRIM(ts.Warehouseto)) AS INT)
                        WHERE ts.Id = @Id AND ts.Isdelete = 0";

                    using (SqlCommand hCmd = new SqlCommand(headerQuery, con))
                    {
                        hCmd.Parameters.AddWithValue("@Id", id);
                        using (var reader = await hCmd.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                header = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
                                for (int i = 0; i < reader.FieldCount; i++)
                                    header[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                            }
                        }
                    }

                     // Fetch Pickuplistid and PickupRemarks
                     if (header != null)
                     {
                         using (SqlCommand pCmd = new SqlCommand("SELECT TOP 1 Id, Remarks FROM Tbl_Pickuplist WHERE TRY_CAST(LTRIM(RTRIM(Stocktransferid)) AS INT) = @StId AND Isdelete = 0", con))
                         {
                             pCmd.Parameters.AddWithValue("@StId", id);
                             using (var pReader = await pCmd.ExecuteReaderAsync())
                             {
                                 if (await pReader.ReadAsync())
                                 {
                                     header["Pickuplistid"] = pReader["Id"]?.ToString().Trim() ?? "";
                                     header["PickupRemarks"] = pReader["Remarks"]?.ToString() ?? "";
                                 }
                                 else
                                 {
                                     header["Pickuplistid"] = "";
                                     header["PickupRemarks"] = "";
                                 }
                             }
                         }
                     }

                      // Fetch items
                      bool hasSavedPickup = header != null && !string.IsNullOrEmpty(header["Pickuplistid"]?.ToString());
                      
                      if (hasSavedPickup)
                      {
                          string pickupDetailsQuery = @"
                              SELECT pd.*, 
                                     pd.Receivedqty AS PickupQty,
                                     pd.Reason AS PickupReason,
                                     sd.Qty AS StockTransferQty,
                                     v.Itemname,
                                     v.Value AS Variantname
                              FROM Tbl_Pickuplistdetails pd
                              LEFT JOIN Tbl_Stocktransferdetails sd ON LTRIM(RTRIM(sd.Stocktransferid)) = LTRIM(RTRIM(pd.Stocktransferid)) AND LTRIM(RTRIM(sd.Itemid)) = LTRIM(RTRIM(pd.Itemid))
                              LEFT JOIN Tbl_Productvariants v ON LTRIM(RTRIM(v.Id)) = LTRIM(RTRIM(pd.Itemid))
                              LEFT JOIN Tbl_Product p ON p.id = v.Productid
                              WHERE LTRIM(RTRIM(pd.Pickuplistid)) = LTRIM(RTRIM(@Pickuplistid)) AND pd.Isdelete = 0";

                          using (SqlCommand pDetailsCmd = new SqlCommand(pickupDetailsQuery, con))
                          {
                              pDetailsCmd.Parameters.AddWithValue("@Pickuplistid", header["Pickuplistid"]);
                              using (var reader = await pDetailsCmd.ExecuteReaderAsync())
                              {
                                  while (await reader.ReadAsync())
                                  {
                                      var dict = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
                                      for (int i = 0; i < reader.FieldCount; i++)
                                          dict[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                      // Normalize for frontend reconciliation
                                      if (!dict.ContainsKey("PickupQty")) dict["PickupQty"] = dict.ContainsKey("Receivedqty") ? dict["Receivedqty"] : "0";
                                      if (!dict.ContainsKey("PickupReason")) dict["PickupReason"] = dict.ContainsKey("Reason") ? dict["Reason"] : "";
                                      if (!dict.ContainsKey("StockTransferQty")) dict["StockTransferQty"] = dict.ContainsKey("Qty") ? dict["Qty"] : "0";
                                      items.Add(dict);
                                  }
                              }
                          }
                      }
                     else
                     {
                        using (SqlCommand cmd = new SqlCommand("Sp_Stocktransferdetails", con))
                        {
                            cmd.CommandType = CommandType.StoredProcedure;
                            cmd.Parameters.AddWithValue("@Stocktransferid", id);
                            cmd.Parameters.AddWithValue("@Isdelete", "0");
                            cmd.Parameters.AddWithValue("@Query", 8);

                            using (var reader = await cmd.ExecuteReaderAsync())
                            {
                                while (await reader.ReadAsync())
                                {
                                    var dict = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
                                    for (int i = 0; i < reader.FieldCount; i++)
                                        dict[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                    items.Add(dict);
                                }
                            }
                        }
                     }

                      // 2c. Check for Delivery Note data (Edit mode)
                      if (header != null)
                      {
                          int dnId = 0;
                          using (SqlCommand dCmd = new SqlCommand("SELECT Id, Remarks FROM Tbl_Deliverynote WHERE TRY_CAST(LTRIM(RTRIM(Stocktransferid)) AS INT) = @StId AND Isdelete = 0", con))
                          {
                              dCmd.Parameters.AddWithValue("@StId", id);
                              using (var dReader = await dCmd.ExecuteReaderAsync())
                              {
                                  if (await dReader.ReadAsync())
                                  {
                                      dnId = Convert.ToInt32(dReader["Id"]);
                                      header["DeliveryNoteID"] = dnId;
                                      header["DeliveryRemarks"] = dReader["Remarks"]?.ToString() ?? "";
                                  }
                              }
                          }

                          if (dnId > 0)
                          {
                              Dictionary<string, (string rcv, string disp, string reason)> dnDetails = new Dictionary<string, (string, string, string)>();
                              using (SqlCommand ddCmd = new SqlCommand("SELECT Itemid, Receivedqty, Disputedqty, Reason FROM Tbl_Delivernotedetails WHERE TRY_CAST(LTRIM(RTRIM(Stocktransferid)) AS INT) = @StId AND Isdelete = 0", con))
                              {
                                  ddCmd.Parameters.AddWithValue("@StId", id);
                                  using (var ddReader = await ddCmd.ExecuteReaderAsync())
                                  {
                                      while (await ddReader.ReadAsync())
                                      {
                                          string itemId = ddReader["Itemid"]?.ToString().Trim() ?? "";
                                          dnDetails[itemId] = (
                                              ddReader["Receivedqty"]?.ToString() ?? "0",
                                              ddReader["Disputedqty"]?.ToString() ?? "0",
                                              ddReader["Reason"]?.ToString() ?? ""
                                          );
                                      }
                                  }
                              }

                               // Merge delivery + enforce DeliveryQty
                               foreach (var item in items)
                               {
                                   string itemId = (item.ContainsKey("Itemid") ? item["Itemid"] : (item.ContainsKey("itemid") ? item["itemid"] : ""))?.ToString().Trim() ?? "";
                                   if (dnDetails.ContainsKey(itemId)) { item["DeliveryQty"] = dnDetails[itemId].rcv; item["DeliveryReason"] = dnDetails[itemId].reason; }
                                   else { item["DeliveryQty"] = "0"; item["DeliveryReason"] = ""; }
                               }
                          }
                      }
                }
                return Ok(new { success = true, header = header, items = items });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] GetStockTransferDetails fail: {ex.Message} At: {ex.StackTrace}");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public IActionResult Savestockapprovalfinalcomments([FromBody] StockTransferFinalApprovalRequest request)
        {
            try
            {
                var formData = request.formData;
                var tableData1 = request.tableData1;

                if (formData == null) return BadRequest(new { success = false, msg = "Form data is missing" });

                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    con.Open();
                    using (SqlTransaction transaction = con.BeginTransaction())
                    {
                        try
                        {
                            // 1. Log the reconciliation action
                            SqlCommand cmd4 = new SqlCommand("Sp_Stocktransferlog", con, transaction);
                            cmd4.CommandType = CommandType.StoredProcedure;
                            cmd4.Parameters.AddWithValue("@Id", "");
                            cmd4.Parameters.AddWithValue("@Userid", formData.Userid ?? "");
                            cmd4.Parameters.AddWithValue("@Stocktransferid", formData.Id ?? "");
                            cmd4.Parameters.AddWithValue("@Approveuserid", formData.Approveuserid ?? "1");
                            cmd4.Parameters.AddWithValue("@Editreason", "");
                            cmd4.Parameters.AddWithValue("@Date", DateTime.Now.ToString("dd-MM-yyyy HH:mm:ss"));
                            cmd4.Parameters.AddWithValue("@Comments", formData.Comments ?? "");
                            cmd4.Parameters.AddWithValue("@Type", "Approve/Rejectfinal");
                            cmd4.Parameters.AddWithValue("@Status", formData.Status == "Approved" ? "1" : "2");
                            cmd4.Parameters.AddWithValue("@Isdelete", "0");
                            cmd4.Parameters.AddWithValue("@Query", 1);
                            cmd4.ExecuteNonQuery();

                            // 2. Update Stock Transfer main status
                            SqlCommand cmd41 = new SqlCommand("Sp_Stocktransfer", con, transaction);
                            cmd41.CommandType = CommandType.StoredProcedure;
                            cmd41.Parameters.AddWithValue("@Status", formData.Status == "Approved" ? "1" : "2");
                            cmd41.Parameters.AddWithValue("@Id", formData.Id ?? "");
                            cmd41.Parameters.AddWithValue("@Query", 13);
                            cmd41.ExecuteNonQuery();

                            // 3. If Approved, handle Inventory Adjustments
                            if (formData.Status == "Approved" && tableData1 != null)
                            {
                                // Initialize inventory for this bill
                                using (SqlCommand command = new SqlCommand("Sp_Inventory", con, transaction))
                                {
                                    command.CommandType = CommandType.StoredProcedure;
                                    command.Parameters.AddWithValue("@Id", "");
                                    command.Parameters.AddWithValue("@Productid", "");
                                    command.Parameters.AddWithValue("@Inventory_type", "3");
                                    command.Parameters.AddWithValue("@Inventory_date", "");
                                    command.Parameters.AddWithValue("@Productvariantsid", "");
                                    command.Parameters.AddWithValue("@Total_qty", "");
                                    command.Parameters.AddWithValue("@Billid", formData.Id ?? "");
                                    command.Parameters.AddWithValue("@Warehouse_status", "");
                                    command.Parameters.AddWithValue("@Isdelete", "0");
                                    command.Parameters.AddWithValue("@Status", "");
                                    command.Parameters.AddWithValue("@Warehouseid", "");
                                    command.Parameters.AddWithValue("@Stocktransferstatus", "Ongoing");
                                    command.Parameters.AddWithValue("@Query", 17);
                                    command.ExecuteNonQuery();
                                }

                                foreach (var row in tableData1)
                                {
                                    string itemId = row.Itemid ?? "";
                                    int receivedQty = 0;
                                    int.TryParse(row.Receivedqty, out receivedQty);

                                    if (receivedQty > 0)
                                    {
                                        string pid = "";
                                        // Fetch Product ID for the variant
                                        using (SqlCommand cmdPid = new SqlCommand("Sp_Productvariants", con, transaction))
                                        {
                                            cmdPid.CommandType = CommandType.StoredProcedure;
                                            cmdPid.Parameters.AddWithValue("@Id", itemId);
                                            cmdPid.Parameters.AddWithValue("@Query", 25);
                                            using (var reader = cmdPid.ExecuteReader())
                                            {
                                                if (reader.Read()) pid = reader[0]?.ToString() ?? "";
                                            }
                                        }

                                        if (!string.IsNullOrEmpty(pid))
                                        {
                                            ExecuteInventoryMove(con, transaction, pid, itemId, receivedQty, formData.Id, formData.Warehousefrom, formData.Warehouseto);
                                        }
                                    }
                                }
                            }

                            transaction.Commit();
                            return Ok(new { success = true, msg = "Audit response saved and stock updated" });
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            throw;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Savestockapprovalfinalcomments fail: {ex.Message}");
                return BadRequest(new { success = false, msg = "Database Error: " + ex.Message });
            }
        }

        private void ExecuteInventoryMove(SqlConnection con, SqlTransaction transaction, string pid, string itemid, int qty, string billid, string warehouseFrom, string warehouseTo)
        {
            string date = DateTime.Now.ToString("dd-MM-yyyy");

            // Deduct from Source
            using (SqlCommand command = new SqlCommand("Sp_Inventory", con, transaction))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@Id", "");
                command.Parameters.AddWithValue("@Productid", pid);
                command.Parameters.AddWithValue("@Inventory_type", "3");
                command.Parameters.AddWithValue("@Inventory_date", date);
                command.Parameters.AddWithValue("@Productvariantsid", itemid);
                command.Parameters.AddWithValue("@Total_qty", "-" + qty);
                command.Parameters.AddWithValue("@Billid", billid ?? "");
                command.Parameters.AddWithValue("@Warehouse_status", "1");
                command.Parameters.AddWithValue("@Isdelete", "0");
                command.Parameters.AddWithValue("@Status", "Transit");
                command.Parameters.AddWithValue("@Warehouseid", warehouseFrom ?? "");
                command.Parameters.AddWithValue("@Query", 1);
                command.ExecuteNonQuery();
            }

            // Add to Destination
            using (SqlCommand command = new SqlCommand("Sp_Inventory", con, transaction))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@Id", "");
                command.Parameters.AddWithValue("@Productid", pid);
                command.Parameters.AddWithValue("@Inventory_type", "3");
                command.Parameters.AddWithValue("@Inventory_date", date);
                command.Parameters.AddWithValue("@Productvariantsid", itemid);
                command.Parameters.AddWithValue("@Total_qty", qty);
                command.Parameters.AddWithValue("@Billid", billid ?? "");
                command.Parameters.AddWithValue("@Warehouse_status", "1");
                command.Parameters.AddWithValue("@Isdelete", "0");
                command.Parameters.AddWithValue("@Status", "Transit");
                command.Parameters.AddWithValue("@Warehouseid", warehouseTo ?? "");
                command.Parameters.AddWithValue("@Query", 1);
                command.ExecuteNonQuery();
            }
        }



        private string Billformat(SqlConnection con, SqlTransaction trans)
        {
            try
            {
                using (SqlCommand cmd = new SqlCommand("SELECT TOP 1 Billformat FROM Tbl_Billformat WHERE Billtype = 'Stock Transfer'", con, trans))
                {
                    var result = cmd.ExecuteScalar();
                    return result?.ToString() ?? "ST-XXX";
                }
            }
            catch { return "ST-XXX"; }
        }

        private string ReplaceXXXWithValue(string template, string value)
        {
            if (string.IsNullOrEmpty(template)) return value;
            return template.Replace("XXX", value);
        }

        private async Task ProcessSetItems(SqlConnection con, SqlTransaction transaction, int setid, int qty, string transferId, string warehouseFrom, string warehouseTo)
        {
            using (SqlCommand command = new SqlCommand("Sp_setitems", con, transaction))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@Productsetid", setid);
                command.Parameters.AddWithValue("@Query", 8);
                // Add dummy parameters if SP expects them
                command.Parameters.AddWithValue("@Userid", "");
                command.Parameters.AddWithValue("@Productid", "");
                command.Parameters.AddWithValue("@Id", "");
                command.Parameters.AddWithValue("@Productvariantsid", "");
                command.Parameters.AddWithValue("@Itemname", "");
                command.Parameters.AddWithValue("@Qty", "");
                command.Parameters.AddWithValue("@Isdelete", "");
                command.Parameters.AddWithValue("@Status", "");
                command.Parameters.AddWithValue("@Workstatus", "");

                DataTable dt2 = new DataTable();
                using (SqlDataAdapter da2 = new SqlDataAdapter(command))
                {
                    da2.Fill(dt2);
                }

                foreach (DataRow rowData in dt2.Rows)
                {
                    string variantId = rowData[0].ToString();
                    int pieceQty = Convert.ToInt32(rowData[1]);
                    string productId = await GetProductIdFromVariant(con, transaction, variantId);
                    ExecuteInventoryUpdate(productId, variantId, pieceQty * qty, transferId, warehouseFrom, warehouseTo, transaction);
                }
            }
        }

        private async Task ProcessComboItems(SqlConnection con, SqlTransaction transaction, int comboId, int qty, string transferId, string warehouseFrom, string warehouseTo)
        {
            using (SqlCommand command = new SqlCommand("Sp_Comboitems", con, transaction))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@Productcomboid", comboId);
                command.Parameters.AddWithValue("@Query", 2);
                // Add dummy parameters
                command.Parameters.AddWithValue("@Userid", "");
                command.Parameters.AddWithValue("@Id", "");
                command.Parameters.AddWithValue("@Productvariantsid", "");
                command.Parameters.AddWithValue("@Qty", "");
                command.Parameters.AddWithValue("@Isdelete", "");
                command.Parameters.AddWithValue("@Status", "");
                command.Parameters.AddWithValue("@Workstatus", "");

                DataTable dt2 = new DataTable();
                using (SqlDataAdapter da2 = new SqlDataAdapter(command))
                {
                    da2.Fill(dt2);
                }

                foreach (DataRow rowData in dt2.Rows)
                {
                    string variantId = rowData[0].ToString();
                    int pieceQty = Convert.ToInt32(rowData[1]);
                    string productId = await GetProductIdFromVariant(con, transaction, variantId);
                    ExecuteInventoryUpdate(productId, variantId, pieceQty * qty, transferId, warehouseFrom, warehouseTo, transaction);
                }
            }
        }

        private async Task<string> GetProductIdFromVariant(SqlConnection con, SqlTransaction trans, string variantId)
        {
            using (SqlCommand cmd = new SqlCommand("Sp_Productvariants", con, trans))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Id", variantId);
                cmd.Parameters.AddWithValue("@Query", 25);
                var res = await cmd.ExecuteScalarAsync();
                return res?.ToString() ?? "";
            }
        }

        private void ExecuteInventoryUpdate(string pid, string itemid, int qty, string billid, string warehouseFrom, string warehouseTo, SqlTransaction transaction)
        {
            string formattedDate = DateTime.Now.ToString("MMM dd yyyy  h:mmtt");

            using (SqlCommand command = new SqlCommand("Sp_Inventory", transaction.Connection, transaction))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@Id", "");
                command.Parameters.AddWithValue("@Productid", pid);
                command.Parameters.AddWithValue("@Inventory_type", "3");
                command.Parameters.AddWithValue("@Inventory_date", formattedDate);
                command.Parameters.AddWithValue("@Productvariantsid", itemid);
                command.Parameters.AddWithValue("@Total_qty", "-" + qty); // Note: String concatenation used here as requested
                command.Parameters.AddWithValue("@Billid", billid);
                command.Parameters.AddWithValue("@Warehouse_status", "1");
                command.Parameters.AddWithValue("@Isdelete", "0");
                command.Parameters.AddWithValue("@Status", "Transit");
                command.Parameters.AddWithValue("@Warehouseid", warehouseFrom);
                command.Parameters.AddWithValue("@Stocktransferstatus", "Ongoing");
                command.Parameters.AddWithValue("@Query", 1);

                command.ExecuteNonQuery();
            }

            // Note: 'su' and 'stockupdationsingleitemdales' are referenced here as per user concept.
            // If they are not yet fully implemented in this context, they may need further defined utility classes.
            // But I am implementing the requested pattern precisely.
            // su.stockupdationsingleitemdales(itemid, transaction.Connection, transaction);
        }

        [HttpGet]

        public async Task<IActionResult> GetPickuplist([FromQuery] string userid)
        {
            Console.WriteLine($"[DEBUG] GetPickuplist called for userid: {userid}");

            if (string.IsNullOrEmpty(userid))
                return BadRequest(new { message = "User ID is required" });

            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();
                    
                    string warehouseId = getwarehouse(userid, con);

                    if (string.IsNullOrEmpty(warehouseId))
                    {
                         return Ok(new { List1 = new List<Stocktransfer>() });
                    }


                    List<Stocktransfer> stocktransferList = new List<Stocktransfer>();

                    using (SqlCommand cmd1 = new SqlCommand("Sp_Stocktransfer", con))
                    {
                        cmd1.CommandType = CommandType.StoredProcedure;
                        cmd1.Parameters.AddWithValue("@Isdelete", "0");
                        cmd1.Parameters.AddWithValue("@Managerapprove", "1");
                        cmd1.Parameters.AddWithValue("@Warehousefrom", warehouseId);
                        cmd1.Parameters.AddWithValue("@Query", 14);

                         using (SqlDataAdapter da = new SqlDataAdapter(cmd1))
                         {
                             DataTable dt = new DataTable();
                             da.Fill(dt);
 
                             if (dt.Rows.Count > 0)
                             {
                                 var stIds = dt.AsEnumerable().Select(r => r["Id"].ToString()).ToList();
                                 Dictionary<string, string> pickupMap = new Dictionary<string, string>();
                                 if (stIds.Any())
                                 {
                                     string ids = string.Join(",", stIds);
                                     string pickupQuery = $"SELECT Id, Stocktransferid FROM Tbl_Pickuplist WHERE Stocktransferid IN ({ids}) AND Isdelete = 0";
                                     using (SqlCommand pCmd = new SqlCommand(pickupQuery, con))
                                     {
                                         using (var reader = await pCmd.ExecuteReaderAsync())
                                         {
                                             while (await reader.ReadAsync())
                                             {
                                                 pickupMap[reader["Stocktransferid"].ToString()] = reader["Id"].ToString();
                                             }
                                         }
                                     }
                                 }

                                 foreach (DataRow row in dt.Rows)
                                 {
                                     string currentSTId = row["Id"]?.ToString() ?? "";
                                     Stocktransfer model = new Stocktransfer
                                     {
                                         Id = currentSTId,
                                         Userid = row["Userid"]?.ToString() ?? "",
                                         username = row["Firstname"]?.ToString() ?? "",
                                         WarehouseFromName = row["Warehousefromname"]?.ToString() ?? "",
                                         WarehouseToName = row["Warehousetoname"]?.ToString() ?? "",
                                         locationaddress = row["Warehousetoaddress"]?.ToString() ?? "",
                                         Warehousefrom = row["Warehousefrom"]?.ToString() ?? "",
                                         Warehouseto = row["Warehouseto"]?.ToString() ?? "",
                                         Date = row["Date"]?.ToString() ?? "",
                                         Receiptno = row["Receiptno"]?.ToString() ?? "",
                                         Sheduleddate = row["Sheduled_date"]?.ToString() ?? "",
                                         Managerapprove = row["Managerapprove"]?.ToString() ?? "",
                                         Deliverynote = row["Deliverynote"]?.ToString() ?? "",
                                         Transfer_invoice = row["Transfer_invoice"]?.ToString() ?? "",
                                         WarehouseFromAddress = row["WarehouseFromAddress"]?.ToString() ?? "",
                                         WarehouseToAddress = row["WarehouseToAddress"]?.ToString() ?? "",
                                         Pickupid = pickupMap.ContainsKey(currentSTId) ? pickupMap[currentSTId] : ""
                                     };
                                     stocktransferList.Add(model);
                                 }
                             }
                         }
                    }
                    return Ok(new { List1 = stocktransferList });
                }
            }

            catch (Exception ex)
            {
                var fullError = ex.InnerException != null ? $"{ex.Message} --> {ex.InnerException.Message}" : ex.Message;
                Console.WriteLine($"[ERROR] GetPickuplist Exception: {fullError}\n{ex.StackTrace}");
                return StatusCode(500, new { message = "Error: " + fullError });
            }


        }
        [HttpGet]
        public async Task<IActionResult> GetDelivery([FromQuery] string userid)
        {
            Console.WriteLine($"[DEBUG] GetDelivery called for userid: {userid}");

            if (string.IsNullOrEmpty(userid))
                return BadRequest(new { message = "User ID is required" });

            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();
                    
                    string warehouseId = getwarehouse(userid, con);
                    Console.WriteLine($"[DEBUG] GetDelivery - Warehouse ID for user {userid}: '{warehouseId}'");

                    if (string.IsNullOrEmpty(warehouseId))
                    {
                         Console.WriteLine($"[DEBUG] GetDelivery - No warehouse assigned to user {userid}. Returning empty list.");
                         return Ok(new { List1 = new List<Stocktransfer>() });
                    }

                    List<Stocktransfer> stocktransferList = new List<Stocktransfer>();

                    using (SqlCommand cmd1 = new SqlCommand("Sp_Stocktransfer", con))
                    {
                        cmd1.CommandType = CommandType.StoredProcedure;
                        cmd1.Parameters.AddWithValue("@Isdelete", "0");
                        cmd1.Parameters.AddWithValue("@Fromwarehouse_approve", "1");
                        cmd1.Parameters.AddWithValue("@Warehouseto", warehouseId);
                        cmd1.Parameters.AddWithValue("@Query", 18);

                         using (SqlDataAdapter da = new SqlDataAdapter(cmd1))
                         {
                             DataTable dt = new DataTable();
                             da.Fill(dt);
 
                             if (dt.Rows.Count > 0)
                             {
                                 foreach (DataRow row in dt.Rows)
                                 {
                                     Console.WriteLine($"[DEBUG] GetDelivery Row - Id: {row["Id"]}, Status: {row["Status"]}");
                                     Stocktransfer model = new Stocktransfer
                                     {
                                         Id = row["Id"]?.ToString() ?? "",
                                         Userid = row["Userid"]?.ToString() ?? "",
                                         username = row["Firstname"]?.ToString() ?? "",
                                          WarehouseFromName = (row.Table.Columns.Contains("Warehousefromname") ? row["Warehousefromname"] : (row.Table.Columns.Contains("WarehouseFromName") ? row["WarehouseFromName"] : ""))?.ToString(),
                                          WarehouseToName = (row.Table.Columns.Contains("Warehousetoname") ? row["Warehousetoname"] : (row.Table.Columns.Contains("WarehouseToName") ? row["WarehouseToName"] : ""))?.ToString(),
                                          locationaddress = (row.Table.Columns.Contains("Warehousetoaddress") ? row["Warehousetoaddress"] : "")?.ToString(),
                                          Warehousefrom = (row["Warehousefrom"] ?? "").ToString(),
                                          Warehouseto = (row["Warehouseto"] ?? "").ToString(),
                                          Date = (row["Date"] ?? "").ToString(),
                                          Receiptno = (row["Receiptno"] ?? "").ToString(),
                                          Sheduleddate = (row.Table.Columns.Contains("Sheduled_date") ? row["Sheduled_date"] : "")?.ToString(),
                                          Managerapprove = (row.Table.Columns.Contains("Status") ? row["Status"] : (row.Table.Columns.Contains("Managerapprove") ? row["Managerapprove"] : "0"))?.ToString(),
                                          Deliverynote = (row.Table.Columns.Contains("Deliverynote") ? row["Deliverynote"] : "")?.ToString(),
                                          Finalinvoice = (row.Table.Columns.Contains("Finalinvoice") ? row["Finalinvoice"] : "")?.ToString(),
                                          Pickupid = (row.Table.Columns.Contains("pickupid") ? row["pickupid"] : (row.Table.Columns.Contains("Pickupid") ? row["Pickupid"] : ""))?.ToString(),
                                          Transfer_invoice = (row.Table.Columns.Contains("Transfer_invoice") ? row["Transfer_invoice"] : "")?.ToString(),
                                          WarehouseFromAddress = (row.Table.Columns.Contains("WarehouseFromAddress") ? row["WarehouseFromAddress"] : "")?.ToString(),
                                          WarehouseToAddress = (row.Table.Columns.Contains("Warehousetoaddress") ? row["Warehousetoaddress"] : (row.Table.Columns.Contains("WarehouseToAddress") ? row["WarehouseToAddress"] : ""))?.ToString()
                                      };
                                     stocktransferList.Add(model);
                                 }
                             }
                         }
                    }
                    return Ok(new { List1 = stocktransferList });
                }
            }
            catch (Exception ex)
            {
                var fullError = ex.InnerException != null ? $"{ex.Message} --> {ex.InnerException.Message}" : ex.Message;
                Console.WriteLine($"[ERROR] GetDelivery Exception: {fullError}\n{ex.StackTrace}");
                return StatusCode(500, new { message = "Error: " + fullError });
            }
        }

        [HttpPost]
        public async Task<IActionResult> SubmitStockReceipt([FromForm] string requestData, [FromForm] IFormFile? finalInvoice)
        {
            try
            {
                if (string.IsNullOrEmpty(requestData)) return BadRequest(new { success = false, message = "Missing requestData" });

                var request = JsonConvert.DeserializeObject<DeliveryConfirmationRequest>(requestData);
                if (request == null) return BadRequest(new { success = false, message = "Invalid request data" });

                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();
                    using (SqlTransaction transaction = con.BeginTransaction())
                    {
                        try
                        {
                            string fileUrl = "";
                            if (finalInvoice != null && finalInvoice.Length > 0)
                            {
                                string wwwRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                                string directoryPath = Path.Combine(wwwRootPath, "Content", "images", "Stockfinalinvoice");

                                if (!Directory.Exists(directoryPath))
                                    Directory.CreateDirectory(directoryPath);

                                string fileExtension = Path.GetExtension(finalInvoice.FileName);
                                string uniqueFileName = Path.GetFileNameWithoutExtension(finalInvoice.FileName) + "_" + DateTime.Now.ToString("yyyyMMddHHmmss") + fileExtension;
                                string filepath = Path.Combine(directoryPath, uniqueFileName);

                                using (var stream = new FileStream(filepath, FileMode.Create))
                                {
                                    await finalInvoice.CopyToAsync(stream);
                                }
                                fileUrl = "/Content/images/Stockfinalinvoice/" + uniqueFileName;
                                
                                using (SqlCommand command = new SqlCommand("Sp_Stocktransfer", con, transaction))
                                {
                                    command.CommandType = CommandType.StoredProcedure;
                                    command.Parameters.AddWithValue("@Id", request.Id);
                                    command.Parameters.AddWithValue("@Finalinvoice", fileUrl);
                                    command.Parameters.AddWithValue("@Towarehouse_approve", "1");
                                    string statusToSet = request.Finalize ? "1" : "2";
                                    command.Parameters.AddWithValue("@Status", statusToSet);
                                    command.Parameters.AddWithValue("@Query", 26);
                                    await command.ExecuteNonQueryAsync();
                                }
                            }
                            else
                            {
                                fileUrl = request.FinalInvoice ?? "";
                                using (SqlCommand command = new SqlCommand("Sp_Stocktransfer", con, transaction))
                                {
                                    command.CommandType = CommandType.StoredProcedure;
                                    command.Parameters.AddWithValue("@Id", request.Id);
                                    command.Parameters.AddWithValue("@Finalinvoice", fileUrl);
                                    command.Parameters.AddWithValue("@Towarehouse_approve", "1"); 
                                    string statusToSet = request.Finalize ? "1" : "2";
                                    command.Parameters.AddWithValue("@Status", statusToSet);
                                    command.Parameters.AddWithValue("@Query", 25);
                                    await command.ExecuteNonQueryAsync();
                                }
                            }

                            // 2. Head check Sp_Deliverynote Query 3 (Check exist)
                            int deliveryNoteId = 0;
                            using (SqlCommand checkCmd = new SqlCommand("Sp_Deliverynote", con, transaction))
                            {
                                checkCmd.CommandType = CommandType.StoredProcedure;
                                checkCmd.Parameters.AddWithValue("@Stocktransferid", request.Id);
                                checkCmd.Parameters.AddWithValue("@Id", "");
                                checkCmd.Parameters.AddWithValue("@Pickuplistid", "");
                                checkCmd.Parameters.AddWithValue("@Userid", "");
                                checkCmd.Parameters.AddWithValue("@Isdelete", "");
                                checkCmd.Parameters.AddWithValue("@Query", 3);
                                var existingId = await checkCmd.ExecuteScalarAsync();
                                if (existingId != null && existingId != DBNull.Value)
                                    deliveryNoteId = Convert.ToInt32(existingId);
                            }

                            if (deliveryNoteId > 0)
                            {
                                // 2a. Update existing Note Sp_Deliverynote Query 2
                                using (SqlCommand command = new SqlCommand("Sp_Deliverynote", con, transaction))
                                {
                                    command.CommandType = CommandType.StoredProcedure;
                                    command.Parameters.AddWithValue("@Id", deliveryNoteId);
                                    command.Parameters.AddWithValue("@Stocktransferid", request.Id);
                                    command.Parameters.AddWithValue("@Pickuplistid", request.Pickupid ?? "");
                                    command.Parameters.AddWithValue("@Userid", request.Userid ?? "1");
                                    command.Parameters.AddWithValue("@Remarks", request.Remarks ?? "");
                                    command.Parameters.AddWithValue("@Enterdate", DateTime.Now.ToString("dd-MM-yyyy HH:mm"));
                                    command.Parameters.AddWithValue("@Status", "1");
                                    command.Parameters.AddWithValue("@Isdelete", "0");
                                    command.Parameters.AddWithValue("@Query", 2);
                                    await command.ExecuteNonQueryAsync();
                                }
                                // 2b. Clear old details Sp_Deliverynotedetails Query 4
                                using (SqlCommand command = new SqlCommand("Sp_Deliverynotedetails", con, transaction))
                                {
                                    command.CommandType = CommandType.StoredProcedure;
                                    command.Parameters.AddWithValue("@Id", "");
                                    command.Parameters.AddWithValue("@Stocktransferid", "");
                                    command.Parameters.AddWithValue("@Pickuplistid", "");
                                    command.Parameters.AddWithValue("@Delieverynoteid", deliveryNoteId);
                                    command.Parameters.AddWithValue("@Itemid", "");
                                    command.Parameters.AddWithValue("@Qty", "");
                                    command.Parameters.AddWithValue("@Receivedqty", "");
                                    command.Parameters.AddWithValue("@Disputedqty", "");
                                    command.Parameters.AddWithValue("@Reason", "");
                                    command.Parameters.AddWithValue("@Isdelete", "");
                                    command.Parameters.AddWithValue("@Query", 4);
                                    await command.ExecuteNonQueryAsync();
                                }
                                Console.WriteLine($"[DEBUG] Updated DeliveryNote Id: {deliveryNoteId}");
                            }
                            else
                            {
                                // 2c. INSERT new Note Sp_Deliverynote Query 1
                                using (SqlCommand command = new SqlCommand("Sp_Deliverynote", con, transaction))
                                {
                                    command.CommandType = CommandType.StoredProcedure;
                                    command.Parameters.AddWithValue("@Id", 0); 
                                    command.Parameters.AddWithValue("@Stocktransferid", request.Id);
                                    command.Parameters.AddWithValue("@Pickuplistid", request.Pickupid ?? "");
                                    command.Parameters.AddWithValue("@Userid", request.Userid ?? "1");
                                    command.Parameters.AddWithValue("@Remarks", request.Remarks ?? "");
                                    command.Parameters.AddWithValue("@Enterdate", DateTime.Now.ToString("dd-MM-yyyy HH:mm"));
                                    command.Parameters.AddWithValue("@Status", "1");
                                    command.Parameters.AddWithValue("@Isdelete", "0");
                                    command.Parameters.AddWithValue("@Query", 1);
                                    
                                    SqlParameter outputParam = new SqlParameter("@InsertedId", SqlDbType.Int) { Direction = ParameterDirection.Output };
                                    command.Parameters.Add(outputParam);
                                    
                                    await command.ExecuteNonQueryAsync();
                                    deliveryNoteId = (int)outputParam.Value;
                                    Console.WriteLine($"[DEBUG] Created DeliveryNote Id: {deliveryNoteId}");
                                }
                            }

                            // 3. Detailed items loop Sp_Deliverynotedetails Query 1
                            if (request.Items != null)
                            {
                                foreach (var row in request.Items)
                                {
                                    using (SqlCommand command = new SqlCommand("Sp_Deliverynotedetails", con, transaction))
                                    {
                                        command.CommandType = CommandType.StoredProcedure;
                                        command.Parameters.AddWithValue("@Id", "");
                                        command.Parameters.AddWithValue("@Stocktransferid", request.Id);
                                        command.Parameters.AddWithValue("@Pickuplistid", request.Pickupid ?? "");
                                        command.Parameters.AddWithValue("@Delieverynoteid", deliveryNoteId); 
                                        command.Parameters.AddWithValue("@Itemid", row.ItemId);
                                        command.Parameters.AddWithValue("@Qty", row.OriginalQty);
                                        command.Parameters.AddWithValue("@Receivedqty", row.ReceivedQty);
                                        command.Parameters.AddWithValue("@Disputedqty", row.DisputedQty);
                                        command.Parameters.AddWithValue("@Reason", row.Remarks ?? "");
                                        command.Parameters.AddWithValue("@Isdelete", "0");
                                        command.Parameters.AddWithValue("@Query", 1);
                                        await command.ExecuteNonQueryAsync();
                                    }
                                }
                            }

                            // 5. Audit Log Sp_Deliverynotelog Query 1
                            using (SqlCommand command = new SqlCommand("Sp_Deliverynotelog", con, transaction))
                            {
                                command.CommandType = CommandType.StoredProcedure;
                                command.Parameters.AddWithValue("@Id", "");
                                command.Parameters.AddWithValue("@Userid", request.Userid ?? "1");
                                command.Parameters.AddWithValue("@Stocktransferid", request.Id);
                                command.Parameters.AddWithValue("@Pickuplistid", ""); 
                                command.Parameters.AddWithValue("@Approveduserid", request.Userid ?? "1");
                                command.Parameters.AddWithValue("@Editreason", "");
                                command.Parameters.AddWithValue("@Comments", "Warehouse updated successfully via API");
                                command.Parameters.AddWithValue("@Isdelete", "0");
                                command.Parameters.AddWithValue("@Status", "1");
                                command.Parameters.AddWithValue("@Date", DateTime.Now.ToString("dd-MM-yyyy HH:mm"));
                                command.Parameters.AddWithValue("@Type", "Log");
                                command.Parameters.AddWithValue("@Typestatus", "Final");
                                command.Parameters.AddWithValue("@Query", 1);
                                await command.ExecuteNonQueryAsync();
                            }

                            transaction.Commit();
                            return Ok(new { success = true, message = "Stock Received Successfully." });
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            return BadRequest(new { success = false, message = "Error: " + ex.Message });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        public class DeliveryConfirmationRequest
        {
            public string? Id { get; set; }
            public string? Userid { get; set; }
            public string? Pickupid { get; set; }
            public string? Remarks { get; set; }
            public string? FinalInvoice { get; set; }
            public bool Finalize { get; set; }
            public List<DeliveryItemDetails>? Items { get; set; }
        }

        public class DeliveryItemDetails
        {
            public string? ItemId { get; set; }
            public double OriginalQty { get; set; }
            public double ReceivedQty { get; set; }
            public double DisputedQty { get; set; }
            public string? Remarks { get; set; }
        }

        [HttpGet]
        public async Task<IActionResult> GetPickupPdf(int id)
        {
            try
            {
                using (var con = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
                {
                    await con.OpenAsync();
                    string sql = "SELECT PdfData FROM Tbl_Pickuplist WHERE Id = @Id AND Isdelete = 0";
                    using (SqlCommand cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@Id", id);
                        var result = await cmd.ExecuteScalarAsync();
                        if (result != null && result != DBNull.Value)
                        {
                            return Ok(new { success = true, pdfData = result.ToString() });
                        }
                    }
                }
                return NotFound(new { success = false, message = "PDF not found" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        private string getwarehouse(string userid, SqlConnection con)
        {
            Console.WriteLine($"[DEBUG] getwarehouse called for userid: {userid}");
            try
            {
                using (SqlCommand cmd = new SqlCommand("Sp_UserRegistration", con))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@Userid", userid);
                    cmd.Parameters.AddWithValue("@Query", 9);
                    Console.WriteLine($"[DEBUG] Executing Sp_UserRegistration Query 9");

                    using (SqlDataAdapter da = new SqlDataAdapter(cmd))
                    {
                        DataTable dt = new DataTable();
                        da.Fill(dt);
                        if (dt.Rows.Count > 0)
                        {
                            string w = dt.Rows[0]["Warehouseid"]?.ToString() ?? "";
                            Console.WriteLine($"[DEBUG] getwarehouse found warehouse: {w}");
                            return w;

                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error in getwarehouse: " + ex.Message);
            }
            return "";
        }

        [HttpPost]
        public async Task<IActionResult> Updatepickuplist([FromBody] PickupConfirmationRequest request)
        {
            if (request == null || request.FormData == null)
                return BadRequest(new { success = false, message = "Invalid request payload" });

            var formData = request.FormData;
            var tableData1 = request.TableData;
            string msg = "", pdffile = "";

            try
            {
                using (var con = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
                {
                    await con.OpenAsync();
                    using (SqlTransaction transaction = con.BeginTransaction())
                    {
                        try
                        {
                            // 1. Get existing Pickup ID or Insert Header
                            string currentPickupid = formData.Pickupid ?? "";
                            if (string.IsNullOrEmpty(currentPickupid))
                            {
                                using (SqlCommand cmd = new SqlCommand("Sp_Pickuplist", con, transaction))
                                {
                                    cmd.CommandType = CommandType.StoredProcedure;
                                    cmd.Parameters.AddWithValue("@Id", "");
                                    cmd.Parameters.AddWithValue("@Stocktransferid", formData.Id ?? "");
                                    cmd.Parameters.AddWithValue("@Userid", formData.Userid ?? "1");
                                    cmd.Parameters.AddWithValue("@Remarks", formData.Remarks ?? "");
                                    cmd.Parameters.AddWithValue("@Enterdate", DateTime.Now.ToString("MMM dd yyyy  h:mmtt"));
                                    cmd.Parameters.AddWithValue("@Status", (formData.Status == "True") ? "0" : "1");
                                    cmd.Parameters.AddWithValue("@Isdelete", "0");
                                    cmd.Parameters.AddWithValue("@Query", 3); // Query 3 is Insert
                                    
                                    SqlParameter outputParam = new SqlParameter("@InsertedId", SqlDbType.Int)
                                    {
                                        Direction = ParameterDirection.Output
                                    };
                                    cmd.Parameters.Add(outputParam);

                                    await cmd.ExecuteNonQueryAsync();
                                    currentPickupid = outputParam.Value?.ToString() ?? "";
                                }
                            }
                            else
                            {
                                // Update existing header
                                using (SqlCommand cmd = new SqlCommand("Sp_Pickuplist", con, transaction))
                                {
                                    cmd.CommandType = CommandType.StoredProcedure;
                                    cmd.Parameters.AddWithValue("@Id", currentPickupid);
                                    cmd.Parameters.AddWithValue("@Stocktransferid", formData.Id ?? "");
                                    cmd.Parameters.AddWithValue("@Userid", formData.Userid ?? "1");
                                    cmd.Parameters.AddWithValue("@Remarks", formData.Remarks ?? "");
                                    cmd.Parameters.AddWithValue("@Status", (formData.Status == "True") ? "0" : "1");
                                    cmd.Parameters.AddWithValue("@Isdelete", "0");
                                    cmd.Parameters.AddWithValue("@Query", 2); // Query 2 is Update
                                    await cmd.ExecuteNonQueryAsync();
                                }
                                
                                // Delete old details to replace
                                using (SqlCommand cmd = new SqlCommand("Sp_Pickuplistdetails", con, transaction))
                                {
                                    cmd.CommandType = CommandType.StoredProcedure;
                                    cmd.Parameters.AddWithValue("@Pickuplistid", currentPickupid);
                                    cmd.Parameters.AddWithValue("@Query", 4); 
                                    await cmd.ExecuteNonQueryAsync();
                                }
                            }

                            if (string.IsNullOrEmpty(currentPickupid))
                            {
                                throw new Exception("Failed to generate or retrieve Pickup ID. Cannot save details.");
                            }

                            // 2. Save PDF
                            if (!string.IsNullOrEmpty(formData.PdfData))
                            {
                                string base64Data = formData.PdfData;
                                if (base64Data.Contains(",")) base64Data = base64Data.Split(',')[1];
                                byte[] pdfBytes = Convert.FromBase64String(base64Data);
                                
                                string timestamp = DateTime.Now.ToString("yyyyMMddHHmmss");
                                string fileName = (formData.Invoiceno ?? "Pickup") + "_" + timestamp + ".pdf";
                                
                                string wwwrootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                                string relativePath = Path.Combine("Content", "images", "Deliverynote");
                                string directoryPath = Path.Combine(wwwrootPath, relativePath);

                                if (!Directory.Exists(directoryPath)) Directory.CreateDirectory(directoryPath);
                                string filePath = Path.Combine(directoryPath, fileName);
                                await System.IO.File.WriteAllBytesAsync(filePath, pdfBytes);
                                
                                pdffile = "/" + relativePath.Replace("\\", "/") + "/" + fileName;

                                // Update Stocktransfer with PDF path
                                using (SqlCommand cmd = new SqlCommand("Sp_Stocktransfer", con, transaction))
                                {
                                    cmd.CommandType = CommandType.StoredProcedure;
                                    cmd.Parameters.AddWithValue("@Id", formData.Id ?? "");
                                    cmd.Parameters.AddWithValue("@Deliverynote", pdffile);
                                    cmd.Parameters.AddWithValue("@Query", 15);
                                    await cmd.ExecuteNonQueryAsync();
                                }
                            }

                            // 3. Insert details and update inventory
                            if (tableData1 != null)
                            {
                                foreach (var row in tableData1)
                                {
                                    using (SqlCommand cmd = new SqlCommand("Sp_Pickuplistdetails", con, transaction))
                                    {
                                        cmd.CommandType = CommandType.StoredProcedure;
                                        cmd.Parameters.AddWithValue("@Id", "");
                                        cmd.Parameters.AddWithValue("@Stocktransferid", formData.Id ?? "");
                                        cmd.Parameters.AddWithValue("@Pickuplistid", currentPickupid);
                                        cmd.Parameters.AddWithValue("@Itemid", row.Itemid ?? "");
                                        cmd.Parameters.AddWithValue("@Qty", row.Qty);
                                        cmd.Parameters.AddWithValue("@Receivedqty", row.Received_qty);
                                        cmd.Parameters.AddWithValue("@Disputedqty", row.Disputed_qty);
                                        cmd.Parameters.AddWithValue("@Reason", row.Reason ?? "");
                                        cmd.Parameters.AddWithValue("@Isdelete", "0");
                                        cmd.Parameters.AddWithValue("@Query", 1);
                                        await cmd.ExecuteNonQueryAsync();
                                    }

                                    // Inventory Logic Placeholder
                                    // if (row.Received_qty > 0) {
                                    //    string pidi = await GetProductIdFromVariant(con, transaction, row.Itemid.ToString());
                                    //    ExecuteInventoryUpdate(pidi, row.Itemid.ToString(), row.Received_qty, formData.Id, ...);
                                    // }
                                }
                            }

                            // 4. Handle Status and Logs
                            bool hasDisputes = (formData.Status == "True");
                            if (!hasDisputes)
                            {
                                using (SqlCommand cmd = new SqlCommand("Sp_Deliverynotelog", con, transaction))
                                {
                                    cmd.CommandType = CommandType.StoredProcedure;
                                    cmd.Parameters.AddWithValue("@Id", "");
                                    cmd.Parameters.AddWithValue("@Userid", formData.Userid ?? "1");
                                    cmd.Parameters.AddWithValue("@Stocktransferid", formData.Id ?? "");
                                    cmd.Parameters.AddWithValue("@Pickuplistid", currentPickupid);
                                    cmd.Parameters.AddWithValue("@Approveduserid", formData.Userid ?? "1");
                                    cmd.Parameters.AddWithValue("@Editreason", "");
                                    cmd.Parameters.AddWithValue("@Comments", "Delivery note generated");
                                    cmd.Parameters.AddWithValue("@Isdelete", "0");
                                    cmd.Parameters.AddWithValue("@Status", "0");
                                    cmd.Parameters.AddWithValue("@Date", DateTime.Now.ToString("dd-MM-yyyy HH:mm"));
                                    cmd.Parameters.AddWithValue("@Type", "Approve/Reject");
                                    cmd.Parameters.AddWithValue("@Typestatus", "Deliverynote");
                                    cmd.Parameters.AddWithValue("@Query", 1);
                                    await cmd.ExecuteNonQueryAsync();
                                }
 
                                using (SqlCommand cmd = new SqlCommand("Sp_Stocktransfer", con, transaction))
                                {
                                    cmd.CommandType = CommandType.StoredProcedure;
                                    cmd.Parameters.AddWithValue("@Id", formData.Id ?? "");
                                    cmd.Parameters.AddWithValue("@Fromwarehouse_approve", "1");
                                    cmd.Parameters.AddWithValue("@Query", 17);
                                    await cmd.ExecuteNonQueryAsync();
                                }
                                msg = "Delivery note generated";
                            }
                            else
                            {
                                using (SqlCommand cmd = new SqlCommand("Sp_Deliverynotelog", con, transaction))
                                {
                                    cmd.CommandType = CommandType.StoredProcedure;
                                    cmd.Parameters.AddWithValue("@Id", "");
                                    cmd.Parameters.AddWithValue("@Userid", formData.Userid ?? "1");
                                    cmd.Parameters.AddWithValue("@Stocktransferid", formData.Id ?? "");
                                    cmd.Parameters.AddWithValue("@Pickuplistid", currentPickupid);
                                    cmd.Parameters.AddWithValue("@Approveduserid", "");
                                    cmd.Parameters.AddWithValue("@Editreason", "");
                                    cmd.Parameters.AddWithValue("@Comments", "Disputed quantities present");
                                    cmd.Parameters.AddWithValue("@Isdelete", "0");
                                    cmd.Parameters.AddWithValue("@Status", "0");
                                    cmd.Parameters.AddWithValue("@Date", DateTime.Now.ToString("dd-MM-yyyy HH:mm"));
                                    cmd.Parameters.AddWithValue("@Type", "Approve/Reject");
                                    cmd.Parameters.AddWithValue("@Typestatus", "Deliverynote");
                                    cmd.Parameters.AddWithValue("@Query", 1);
                                    await cmd.ExecuteNonQueryAsync();
                                }
                                msg = "Disputed quantity present. Approval required from coordinator.";
                            }

                            transaction.Commit();
                            return Ok(new { success = true, msg = msg });
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            return BadRequest(new { success = false, message = "Transaction Error: " + ex.Message });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = "Connection Error: " + ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> Getpickupnotification(string userid)
        {
            var stocktransfer = new List<object>();
            int pickcount = 0;

            try
            {
                using (var con = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
                {
                    await con.OpenAsync();
                    string sql = @"
                        SELECT tp.Id, tp.Stocktransferid, tp.Enterdate, ts.Receiptno, tp.Userid, tr.Firstname 
                        FROM Tbl_Pickuplist tp
                        LEFT JOIN Tbl_Stocktransfer ts ON ts.Id = tp.Stocktransferid
                        LEFT JOIN Tbl_Registration tr ON tr.Userid = tp.Userid
                        WHERE tp.Status = '0' AND (tp.Isdelete = '0' OR tp.Isdelete IS NULL)";
                    
                    Console.WriteLine($"[DEBUG] Getpickupnotification for userid: {userid}");
                    Console.WriteLine($"[DEBUG] Executing SQL: {sql}");
                        
                    using (SqlCommand cmd2 = new SqlCommand(sql, con))
                    {
                        using (var reader = await cmd2.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                stocktransfer.Add(new
                                {
                                    id = reader["Id"]?.ToString(),
                                    userid = reader["Userid"]?.ToString(),
                                    stocktransferid = reader["Stocktransferid"]?.ToString(),
                                    date = reader["Enterdate"]?.ToString(),
                                    username = reader["Firstname"]?.ToString(),
                                    receiptno = reader["Receiptno"]?.ToString()
                                });
                            }
                        }
                    }
                    Console.WriteLine($"[DEBUG] Found {stocktransfer.Count} notifications");
                }
                pickcount = stocktransfer.Count;
                return Ok(new { List1 = stocktransfer, pickcount = pickcount });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Acceptdisputedqty([FromBody] AcceptDisputeRequest request)
        {
            Console.WriteLine($"[DEBUG] Acceptdisputedqty endpoint hit! Request null: {request == null}");
            if (request != null)
            {
                Console.WriteLine($"[DEBUG] Request content - Stockid: {request.Stockid}, Pickuplistid: {request.Pickuplistid}, Userid: {request.Userid}");
            }
            if (request == null) return BadRequest(new { success = false, message = "Invalid request payload received" });
            string msg = "Your Pick up list will be processed with the disputed quantity";
            try
            {
                using (var con = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
                {
                    await con.OpenAsync();
                    using (SqlTransaction transaction = con.BeginTransaction())
                    {
                        try
                        {
                            string updatePickupSql = "UPDATE Tbl_Pickuplist SET Status = '1' WHERE Stocktransferid = @Stockid AND Isdelete = '0'";
                            using (SqlCommand cmd1 = new SqlCommand(updatePickupSql, con, transaction))
                            {
                                cmd1.Parameters.AddWithValue("@Stockid", request.Stockid ?? "");
                                await cmd1.ExecuteNonQueryAsync();
                            }

                            using (SqlCommand command = new SqlCommand("Sp_Deliverynotelog", con, transaction))
                            {
                                command.CommandType = CommandType.StoredProcedure;
                                command.Parameters.AddWithValue("@Id", "");
                                command.Parameters.AddWithValue("@Stocktransferid", request.Stockid ?? "");
                                command.Parameters.AddWithValue("@Pickuplistid", request.Pickuplistid ?? "");
                                command.Parameters.AddWithValue("@Approveduserid", request.Userid ?? "");
                                command.Parameters.AddWithValue("@Editreason", "");
                                command.Parameters.AddWithValue("@Comments", "Approved");
                                command.Parameters.AddWithValue("@Isdelete", "0");
                                command.Parameters.AddWithValue("@Status", "1");
                                command.Parameters.AddWithValue("@Date", DateTime.Now.ToString("dd-MM-yyyy HH:mm"));
                                command.Parameters.AddWithValue("@Type", "Approve/Reject");
                                command.Parameters.AddWithValue("@Typestatus", "Deliverynote");
                                command.Parameters.AddWithValue("@Query", 2);
                                await command.ExecuteNonQueryAsync();
                            }

                            using (SqlCommand command = new SqlCommand("Sp_Stocktransfer", con, transaction))
                            {
                                command.CommandType = CommandType.StoredProcedure;
                                command.Parameters.AddWithValue("@Id", request.Stockid ?? "");
                                command.Parameters.AddWithValue("@Fromwarehouse_approve", "1");
                                command.Parameters.AddWithValue("@Query", 17);
                                await command.ExecuteNonQueryAsync();
                            }

                            transaction.Commit();
                            return Ok(new { success = true, msg = msg });
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            return BadRequest(new { success = false, message = "Transaction Error: " + ex.Message });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = "Connection Error: " + ex.Message });
            }
        }

        [HttpPost]
        public IActionResult Getcustomersalesbilldetailsquote([FromForm] string pid)
        {
            string userid = "", Billing_address = "", companyname = "", email = "", phone = "", Title = "", Firstname = "", Middlename = "", Lastname = "", contact = "", Taxes = "", id = "";

            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    SqlCommand cmd2 = new SqlCommand("Sp_Salesquote", con);
                    cmd2.CommandType = CommandType.StoredProcedure;
                    cmd2.Parameters.AddWithValue("@Id", pid ?? "");
                    cmd2.Parameters.AddWithValue("@Isdelete", 0);
                    cmd2.Parameters.AddWithValue("@Userid", "");
                    cmd2.Parameters.AddWithValue("@Customerid", "");
                    cmd2.Parameters.AddWithValue("@Billdate", "");
                    cmd2.Parameters.AddWithValue("@Duedate", "");
                    cmd2.Parameters.AddWithValue("@Salesquoteno", "");
                    cmd2.Parameters.AddWithValue("@Amountsare", "");
                    cmd2.Parameters.AddWithValue("@Vatnumber", "");
                    cmd2.Parameters.AddWithValue("@Billing_address", "");
                    cmd2.Parameters.AddWithValue("@Sales_location", "");
                    cmd2.Parameters.AddWithValue("@Sub_total", "");
                    cmd2.Parameters.AddWithValue("@Vat", "");
                    cmd2.Parameters.AddWithValue("@Vat_amount", "");
                    cmd2.Parameters.AddWithValue("@Grand_total", "");
                    cmd2.Parameters.AddWithValue("@Conversion_amount", DBNull.Value);
                    cmd2.Parameters.AddWithValue("@Currency_rate", DBNull.Value);
                    cmd2.Parameters.AddWithValue("@Currency", "");
                    cmd2.Parameters.AddWithValue("@Terms", "");
                    cmd2.Parameters.AddWithValue("@Query", 4);
                    con.Open();

                    using (SqlDataAdapter da = new SqlDataAdapter(cmd2))
                    {
                        DataTable dt = new DataTable();
                        da.Fill(dt);

                        if (dt.Rows.Count > 0)
                        {
                            id = dt.Rows[0]["Id"].ToString();
                            userid = dt.Rows[0]["Userid"].ToString();
                            Billing_address = dt.Rows[0]["Billing_address"].ToString();
                            companyname = dt.Rows[0]["Companyname"].ToString();
                            email = dt.Rows[0]["Email"].ToString();
                            phone = dt.Rows[0]["Phonenumber"].ToString();
                            Title = dt.Rows[0]["Title"].ToString();
                            Firstname = dt.Rows[0]["Firstname"].ToString();
                            Middlename = dt.Rows[0]["Middlename"].ToString();
                            Lastname = dt.Rows[0]["Lastname"].ToString();
                            contact = dt.Rows[0]["Contact"].ToString();
                            Taxes = dt.Rows[0]["Taxes"].ToString();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error in Getcustomersalesbilldetailsquote: " + ex.Message);
            }

            return Ok(new { id = id, userid = userid, mailingaddress = Billing_address, companyname = companyname, email = email, phone = phone, Title = Title, Firstname = Firstname, Middlename = Middlename, Lastname = Lastname, contact = contact, Taxes = Taxes });
        }

        [HttpPost]

        public IActionResult Getcustomerbillsdetailssalesquote([FromForm] string billid)
        {
            List<object> items = new List<object>();
            string amountsare = "", userid = "", billdate = "", salesperson = "", status = "", txnno = "";

            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    con.Open();

                    // Fetch Header Info
                    using (SqlCommand cmdHeader = new SqlCommand(@"
                        SELECT s.Amountsare, s.Userid, s.Billdate, s.Statussalesquote, s.Salesquoteno,
                               r.Firstname + ' ' + ISNULL(r.Lastname, '') as Salesperson
                        FROM Tbl_Salesquote s
                        LEFT JOIN Tbl_Registration r ON s.Userid = r.Userid
                        WHERE s.Id = @Id", con))
                    {
                        cmdHeader.Parameters.AddWithValue("@Id", billid);
                        using (var reader = cmdHeader.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                amountsare = reader["Amountsare"]?.ToString() ?? "";
                                userid = reader["Userid"]?.ToString() ?? "";
                                billdate = reader["Billdate"]?.ToString() ?? "";
                                salesperson = reader["Salesperson"]?.ToString() ?? "";
                                status = reader["Statussalesquote"]?.ToString() ?? "";
                                txnno = reader["Salesquoteno"]?.ToString() ?? "";
                            }
                        }
                    }

                    // Fetch Items
                    using (SqlCommand cmdItems = new SqlCommand(@"
                        SELECT d.*, pv.Itemname, pv.Modelno, pv.allvalues
                        FROM Tbl_Salesquotedetails d
                        LEFT JOIN Tbl_Productvariants pv ON d.Itemid = CAST(pv.Id AS VARCHAR(50))
                        WHERE d.Salesquoteid = @Id AND (d.Isdelete = '0' OR d.Isdelete IS NULL)", con))
                    {
                        cmdItems.Parameters.AddWithValue("@Id", billid);
                        using (var reader = cmdItems.ExecuteReader())
                        {
                            var columns = Enumerable.Range(0, reader.FieldCount).Select(reader.GetName).ToHashSet(StringComparer.OrdinalIgnoreCase);
                            while (reader.Read())
                            {
                                items.Add(new
                                {
                                    Id = reader["Id"],
                                    Itemid = reader["Itemid"],
                                    Itemname = reader["Itemname"]?.ToString() ?? "",
                                    Modelno = reader["Modelno"]?.ToString() ?? "",
                                    allvalues = reader["allvalues"]?.ToString() ?? "",
                                    Description = reader["Description"]?.ToString() ?? "",
                                    Serialized = columns.Contains("Serialized") ? reader["Serialized"] : "No",
                                    Serialno = columns.Contains("Serialno") ? reader["Serialno"] : "",
                                    Qty = reader["Qty"],
                                    Amount = reader["Amount"],
                                    Vatid = reader["Vat"], // Vat ID
                                    Vat = reader["Vat_id"],  // Vat Percentage/Value
                                    Total = reader["Total"],
                                    Type = "Item"
                                });
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error in Getcustomerbillsdetailssalesquote: " + ex.Message);
            }

            return Ok(new 
            { 
                List1 = items, 
                amountsare = amountsare, 
                userid = userid, 
                billdate = billdate, 
                salesperson1 = salesperson,
                status = status,
                txnno = txnno
            });
        }
    }
}


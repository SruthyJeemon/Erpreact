using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Data;
using System.Text.Json;

namespace Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StockController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;

        public StockController(IConfiguration configuration, IWebHostEnvironment environment)
        {
            _configuration = configuration;
            _environment = environment;
        }

        [HttpPost("checkitemqtystockadjustment")]
        public IActionResult Checkitemqtystockadjustment([FromBody] JsonElement payload)
        {
            int stock = 0;
            string msg = "";
            bool hasPendingJobs = false;

            try
            {
                string variantid = "";
                if (payload.TryGetProperty("variantid", out var vId))
                {
                    variantid = vId.ValueKind == JsonValueKind.Number ? vId.GetInt32().ToString() : vId.GetString() ?? "";
                }

                string warehouseid = "";
                if (payload.TryGetProperty("warehouseid", out var wId))
                {
                    warehouseid = wId.ValueKind == JsonValueKind.Number ? wId.GetInt32().ToString() : wId.GetString() ?? "";
                }

                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    using (SqlCommand cmd2 = new SqlCommand("Sp_Inventory", con))
                    {
                        cmd2.CommandType = CommandType.StoredProcedure;
                        cmd2.Parameters.AddWithValue("@Id", "");
                        cmd2.Parameters.AddWithValue("@Isdelete", 0);
                        cmd2.Parameters.AddWithValue("@Warehouse_status", 1);
                        cmd2.Parameters.AddWithValue("@Status", "Transit");
                        cmd2.Parameters.AddWithValue("@Productvariantsid", variantid);
                        cmd2.Parameters.AddWithValue("@WarehouseId", warehouseid);
                        cmd2.Parameters.AddWithValue("@Query", 26);

                        con.Open();
                        using (SqlDataAdapter da = new SqlDataAdapter(cmd2))
                        {
                            DataTable dt = new DataTable();
                            da.Fill(dt);

                            if (dt.Rows.Count > 0)
                            {
                                for (int i = 0; i < dt.Rows.Count; i++)
                                {
                                    string rowWarehouseId = dt.Rows[i]["Id"].ToString();

                                    if (rowWarehouseId == warehouseid)
                                    {
                                        // 1. Get values and handle Nulls
                                        decimal intransitVal = dt.Rows[i]["Intransit"] == DBNull.Value ? 0 : Convert.ToDecimal(dt.Rows[i]["Intransit"]);
                                        decimal stockTransferVal = dt.Rows[i]["Stocktransfer"] == DBNull.Value ? 0 : Convert.ToDecimal(dt.Rows[i]["Stocktransfer"]);

                                        // 2. Check if there are pending jobs
                                        if (intransitVal > 0 || stockTransferVal > 0)
                                        {
                                            hasPendingJobs = true;
                                            msg = "Pending jobs (In-transit or Stock Transfer) are there for this item. Please complete them first.";
                                            stock = 0; // Don't allow adjustment if jobs are pending
                                        }
                                        else
                                        {
                                            // 3. No pending jobs, safe to display stock
                                            stock = dt.Rows[i]["TotalQty"] == DBNull.Value ? 0 : Convert.ToInt32(Convert.ToDecimal(dt.Rows[i]["TotalQty"]));
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                return Ok(new { stock = stock, message = msg, pending = hasPendingJobs });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpPost("Addstockadjustment")]
        public async Task<IActionResult> Addstockadjustment([FromForm] IFormCollection collection)
        {
            string message = "";
            string insertedId = "";
            List<Stockadjustmentdetails> tableData1 = new List<Stockadjustmentdetails>();
            var formData = new Stockadjustment();

            try
            {
                formData.Modeof_adjustment = collection["Modeof_adjustment"];
                formData.Dateenter = collection["Dateenter"];
                string userId = collection["Userid"].ToString();
                if (string.IsNullOrEmpty(userId)) userId = "ADMIN";

                // Auto-generate Referenceno based on date
                string referenceno = "STAD-YY-MM-DD";
                if (!string.IsNullOrEmpty(formData.Dateenter))
                {
                    if (DateTime.TryParse(formData.Dateenter, out DateTime dateEnter))
                        referenceno = "STAD-" + dateEnter.ToString("yy-MM-dd");
                    else
                        referenceno = "STAD-" + DateTime.Now.ToString("yy-MM-dd");
                }
                else
                {
                    referenceno = "STAD-" + DateTime.Now.ToString("yy-MM-dd");
                }
                formData.Referenceno = referenceno;
                formData.Accountname = null;

                var tableDataJson = collection["tableData1"];
                if (!string.IsNullOrEmpty(tableDataJson))
                {
                    tableData1 = System.Text.Json.JsonSerializer.Deserialize<List<Stockadjustmentdetails>>(tableDataJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<Stockadjustmentdetails>();
                }

                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();
                    using (SqlTransaction transaction = con.BeginTransaction())
                    {
                        try
                        {
                            using (SqlCommand cmd12 = new SqlCommand("Sp_Stockadjustment", con, transaction))
                            {
                                cmd12.CommandType = CommandType.StoredProcedure;
                                cmd12.Parameters.AddWithValue("@Id", "");
                                cmd12.Parameters.AddWithValue("@Userid", userId);
                                cmd12.Parameters.AddWithValue("@Modeof_adjustment", formData.Modeof_adjustment ?? "");
                                cmd12.Parameters.AddWithValue("@Referenceno", formData.Referenceno ?? "");
                                cmd12.Parameters.AddWithValue("@Dateenter", formData.Dateenter ?? "");
                                cmd12.Parameters.AddWithValue("@Accountname", (object)DBNull.Value);
                                cmd12.Parameters.AddWithValue("@Status", "Active");
                                cmd12.Parameters.AddWithValue("@Isdelete", "0");
                                cmd12.Parameters.AddWithValue("@Query", 1);

                                using (SqlDataAdapter da = new SqlDataAdapter(cmd12))
                                {
                                    DataTable dt = new DataTable();
                                    da.Fill(dt);
                                    if (dt.Rows.Count > 0)
                                        insertedId = dt.Rows[0][0].ToString();
                                }
                            }

                            if (!string.IsNullOrEmpty(insertedId))
                            {
                                string finalReferenceno = referenceno + insertedId;
                                using (SqlCommand cmdUpdate = new SqlCommand("Sp_Stockadjustment", con, transaction))
                                {
                                    cmdUpdate.CommandType = CommandType.StoredProcedure;
                                    cmdUpdate.Parameters.AddWithValue("@Id", insertedId);
                                    cmdUpdate.Parameters.AddWithValue("@Userid", userId);
                                    cmdUpdate.Parameters.AddWithValue("@Modeof_adjustment", formData.Modeof_adjustment ?? "");
                                    cmdUpdate.Parameters.AddWithValue("@Referenceno", finalReferenceno);
                                    cmdUpdate.Parameters.AddWithValue("@Dateenter", formData.Dateenter ?? "");
                                    cmdUpdate.Parameters.AddWithValue("@Accountname", (object)DBNull.Value);
                                    cmdUpdate.Parameters.AddWithValue("@Status", "Active");
                                    cmdUpdate.Parameters.AddWithValue("@Isdelete", "0");
                                    cmdUpdate.Parameters.AddWithValue("@Query", 2); 
                                    await cmdUpdate.ExecuteNonQueryAsync();
                                }

                                foreach (var item in tableData1)
                                {
                                    string type = "";
                                    var match = System.Text.RegularExpressions.Regex.Match(item.Itemname ?? "", @"\(([^)]+)\)");
                                    if (match.Success) type = match.Groups[1].Value;
                                    if (string.IsNullOrEmpty(type)) type = "Item";

                                    using (SqlCommand cmd = new SqlCommand("Sp_Stockadjustmentdetails", con, transaction))
                                    {
                                        cmd.CommandType = CommandType.StoredProcedure;
                                        cmd.Parameters.AddWithValue("@Id", "");
                                        cmd.Parameters.AddWithValue("@Stockadjustmentid", insertedId);
                                        cmd.Parameters.AddWithValue("@Itemid", item.Itemid?.ToString() ?? "");
                                        cmd.Parameters.AddWithValue("@Qty_avaiable", item.Qty_avaiable?.ToString() ?? "0");
                                        cmd.Parameters.AddWithValue("@Newqty_onhand", item.Newqty_onhand?.ToString() ?? "0");
                                        cmd.Parameters.AddWithValue("@Qty_adjusted", item.Qty_adjusted?.ToString() ?? "0");
                                        cmd.Parameters.AddWithValue("@Type", type);
                                        cmd.Parameters.AddWithValue("@Warehouseid", item.Warehouseid?.ToString() ?? (object)DBNull.Value);
                                        cmd.Parameters.AddWithValue("@Reason", item.Reason?.ToString() ?? (object)DBNull.Value);
                                        cmd.Parameters.AddWithValue("@Description", item.Description?.ToString() ?? "");
                                        cmd.Parameters.AddWithValue("@Status", "Active");
                                        cmd.Parameters.AddWithValue("@Isdelete", "0");
                                        cmd.Parameters.AddWithValue("@Query", 1);
                                        await cmd.ExecuteNonQueryAsync();
                                    }
                                }

                                // Handle Files
                                string uploadPath = Path.Combine(_environment.ContentRootPath, "wwwroot", "Content", "images", "Stockadjustment");
                                if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

                                foreach (var file in collection.Files)
                                {
                                    if (file.Length > 0)
                                    {
                                        string originalName = Path.GetFileNameWithoutExtension(file.FileName);
                                        string extension = Path.GetExtension(file.FileName);
                                        string uniqueName = $"{originalName}_{DateTime.Now:yyyyMMdd_HHmmssfff}{extension}";
                                        string savePath = Path.Combine(uploadPath, uniqueName);

                                        using (var stream = new FileStream(savePath, FileMode.Create))
                                        {
                                            await file.CopyToAsync(stream);
                                        }

                                        using (SqlCommand cmdAtt = new SqlCommand("Sp_Stockadjustmentattachment", con, transaction))
                                        {
                                            cmdAtt.CommandType = CommandType.StoredProcedure;
                                            cmdAtt.Parameters.AddWithValue("@Id", "");
                                            cmdAtt.Parameters.AddWithValue("@Stockattachmentid", insertedId);
                                            cmdAtt.Parameters.AddWithValue("@Attachment", "/Content/images/Stockadjustment/" + uniqueName);
                                            cmdAtt.Parameters.AddWithValue("@Isdelete", "0");
                                            cmdAtt.Parameters.AddWithValue("@Query", "1");
                                            await cmdAtt.ExecuteNonQueryAsync();
                                        }
                                    }
                                }

                                // Log
                                using (SqlCommand cmdLog = new SqlCommand("Sp_Stockadjustmentlog", con, transaction))
                                {
                                    cmdLog.CommandType = CommandType.StoredProcedure;
                                    cmdLog.Parameters.AddWithValue("@Id", "");
                                    cmdLog.Parameters.AddWithValue("@Userid", userId);
                                    cmdLog.Parameters.AddWithValue("@Stockadjustmentid", insertedId);
                                    cmdLog.Parameters.AddWithValue("@Approveuserid", "");
                                    cmdLog.Parameters.AddWithValue("@Editreason", "");
                                    cmdLog.Parameters.AddWithValue("@Date", DateTime.Now.ToString("dd-MMM-yyyy HH:mm:ss"));
                                    cmdLog.Parameters.AddWithValue("@Comments", "Added");
                                    cmdLog.Parameters.AddWithValue("@Type", "Log");
                                    cmdLog.Parameters.AddWithValue("@Status", "0");
                                    cmdLog.Parameters.AddWithValue("@Isdelete", "0");
                                    cmdLog.Parameters.AddWithValue("@Query", 1);
                                    await cmdLog.ExecuteNonQueryAsync();
                                }

                                transaction.Commit();
                                message = "Saved Successfully";
                            }
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
                message = "Error: " + ex.Message;
            }

            return Ok(new { message = message });
        }

        [HttpPost("Savestockadjustmenteditcomments")]
        public async Task<IActionResult> Savestockadjustmenteditcomments([FromForm] string Id, [FromForm] string Type, [FromForm] string Comments, [FromForm] string Userid)
        {
            string msg = "";
            string newStatus = (Type == "edit") ? "3" : "4";
            string logType = (Type == "edit") ? "Editrequest" : "Deleterequest";

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
                            // 1. Insert Log
                            using (SqlCommand cmd4 = new SqlCommand("Sp_Stockadjustmentlog", con, transaction))
                            {
                                cmd4.CommandType = CommandType.StoredProcedure;
                                cmd4.Parameters.AddWithValue("@Id", "");
                                cmd4.Parameters.AddWithValue("@Userid", Userid ?? "");
                                cmd4.Parameters.AddWithValue("@Stockadjustmentid", Id);
                                cmd4.Parameters.AddWithValue("@Approveuserid", "");
                                cmd4.Parameters.AddWithValue("@Date", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
                                cmd4.Parameters.AddWithValue("@Editreason", Comments ?? "");
                                cmd4.Parameters.AddWithValue("@Comments", "");
                                cmd4.Parameters.AddWithValue("@Type", logType);
                                cmd4.Parameters.AddWithValue("@Status", "0");
                                cmd4.Parameters.AddWithValue("@Isdelete", "0");
                                cmd4.Parameters.AddWithValue("@Query", 1);
                                await cmd4.ExecuteNonQueryAsync();
                            }

                            // 2. Update Adjustment Status
                            using (SqlCommand cmd21 = new SqlCommand("Sp_Stockadjustment", con, transaction))
                            {
                                cmd21.CommandType = CommandType.StoredProcedure;
                                cmd21.Parameters.AddWithValue("@Id", Id);
                                cmd21.Parameters.AddWithValue("@Userid", "");
                                cmd21.Parameters.AddWithValue("@Modeof_adjustment", "");
                                cmd21.Parameters.AddWithValue("@Referenceno", "");
                                cmd21.Parameters.AddWithValue("@Dateenter", DBNull.Value);
                                cmd21.Parameters.AddWithValue("@Accountname", "");
                                cmd21.Parameters.AddWithValue("@Isdelete", DBNull.Value);
                                cmd21.Parameters.AddWithValue("@Status", newStatus);
                                cmd21.Parameters.AddWithValue("@Query", 6);
                                await cmd21.ExecuteNonQueryAsync();
                            }

                            transaction.Commit();
                            msg = "Response successfully saved";
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
                return Ok(new { success = false, msg = "Error: " + ex.Message });
            }

            return Ok(new { success = true, msg = msg });
        }


        [HttpGet("getStockadjustment")]
        public async Task<IActionResult> GetStockadjustment(string userId, DateTime? fromDate = null, DateTime? toDate = null)
        {
            try
            {
                if (string.IsNullOrEmpty(userId)) userId = "ADMIN";
                
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                List<Stockadjustment> stockadjustment = new List<Stockadjustment>();
                List<Stockadjustment> stockadjustment1 = new List<Stockadjustment>();

                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();
                    string Catelogid = getcatelogid(userId, con);
                    DateTime finalToDate = toDate ?? DateTime.Now;
                    DateTime finalFromDate = fromDate ?? DateTime.Today.AddDays(-30); // 30 days as requested

                    Console.WriteLine($"[DEBUG] getStockadjustment - User: {userId}, Catalog: {Catelogid}, From: {finalFromDate:yyyy-MM-dd}, To: {finalToDate:yyyy-MM-dd}");

                    // List 1: Pending (Active,0,2,3,4)
                    using (SqlCommand cmd1 = new SqlCommand("Sp_Stockadjustment", con))
                    {
                        cmd1.CommandType = CommandType.StoredProcedure;
                        cmd1.Parameters.AddWithValue("@Id", DBNull.Value);
                        cmd1.Parameters.AddWithValue("@Userid", "");
                        cmd1.Parameters.AddWithValue("@Modeof_adjustment", "");
                        cmd1.Parameters.AddWithValue("@Referenceno", "");
                        cmd1.Parameters.AddWithValue("@Dateenter", DBNull.Value);
                        cmd1.Parameters.AddWithValue("@Accountname", "");
                        cmd1.Parameters.AddWithValue("@Status", "Active,0,2,3,4");
                        cmd1.Parameters.AddWithValue("@Isdelete", "0");
                        cmd1.Parameters.AddWithValue("@Catelogid", Catelogid);
                        cmd1.Parameters.AddWithValue("@FromDate", finalFromDate);
                        cmd1.Parameters.AddWithValue("@ToDate", finalToDate);
                        cmd1.Parameters.AddWithValue("@Query", 3);

                        using (SqlDataAdapter da = new SqlDataAdapter(cmd1))
                        {
                            DataTable dt = new DataTable();
                            da.Fill(dt);
                            Console.WriteLine($"[DEBUG] getStockadjustment - List1 Count: {dt.Rows.Count}");
                            foreach (DataRow row in dt.Rows)
                            {
                                stockadjustment.Add(new Stockadjustment
                                {
                                    Id = Convert.ToInt32(row["Id"]),
                                    Userid = row["Userid"]?.ToString(),
                                    Username = row["Firstname"]?.ToString(),
                                    Modeof_adjustment = row["Modeof_adjustment"]?.ToString(),
                                    Referenceno = row["Referenceno"]?.ToString(),
                                    Dateenter = row["Dateenter"] != DBNull.Value ? Convert.ToDateTime(row["Dateenter"]).ToString("dd-MMM-yyyy") : "",
                                    Status = row["Status"]?.ToString()
                                });
                            }
                        }
                    }

                    // List 2: Status 1
                    using (SqlCommand cmd11 = new SqlCommand("Sp_Stockadjustment", con))
                    {
                        cmd11.CommandType = CommandType.StoredProcedure;
                        cmd11.Parameters.AddWithValue("@Id", DBNull.Value);
                        cmd11.Parameters.AddWithValue("@Userid", "");
                        cmd11.Parameters.AddWithValue("@Modeof_adjustment", "");
                        cmd11.Parameters.AddWithValue("@Referenceno", "");
                        cmd11.Parameters.AddWithValue("@Dateenter", DBNull.Value);
                        cmd11.Parameters.AddWithValue("@Accountname", "");
                        cmd11.Parameters.AddWithValue("@Status", "1");
                        cmd11.Parameters.AddWithValue("@Isdelete", "0");
                        cmd11.Parameters.AddWithValue("@Catelogid", Catelogid);
                        cmd11.Parameters.AddWithValue("@FromDate", finalFromDate);
                        cmd11.Parameters.AddWithValue("@ToDate", finalToDate);
                        cmd11.Parameters.AddWithValue("@Query", 3);

                        using (SqlDataAdapter da11 = new SqlDataAdapter(cmd11))
                        {
                            DataTable dt11 = new DataTable();
                            da11.Fill(dt11);
                            foreach (DataRow row in dt11.Rows)
                            {
                                stockadjustment1.Add(new Stockadjustment
                                {
                                    Id = Convert.ToInt32(row["Id"]),
                                    Userid = row["Userid"]?.ToString(),
                                    Username = row["Firstname"]?.ToString(),
                                    Modeof_adjustment = row["Modeof_adjustment"]?.ToString(),
                                    Referenceno = row["Referenceno"]?.ToString(),
                                    Dateenter = row["Dateenter"] != DBNull.Value ? Convert.ToDateTime(row["Dateenter"]).ToString("dd-MMM-yyyy") : "",
                                    Status = row["Status"]?.ToString()
                                });
                            }
                        }
                    }
                }
                return Ok(new { List1 = stockadjustment, List2 = stockadjustment1 });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] getStockadjustment - Exception: {ex.Message}");
                Console.WriteLine($"[ERROR] getStockadjustment - StackTrace: {ex.StackTrace}");
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet("getStockadjustmentdetails")]
        public async Task<IActionResult> GetStockadjustmentdetails(int id)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                Stockadjustment? header = null;
                List<Stockadjustmentdetails> details = new List<Stockadjustmentdetails>();
                List<Attachment> attachments = new List<Attachment>();

                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();

                    // 1. Fetch Header
                    using (SqlCommand cmd = new SqlCommand("Sp_Stockadjustment", con))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", id);
                        cmd.Parameters.AddWithValue("@Userid", "");
                        cmd.Parameters.AddWithValue("@Modeof_adjustment", "");
                        cmd.Parameters.AddWithValue("@Referenceno", "");
                        cmd.Parameters.AddWithValue("@Dateenter", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Accountname", "");
                        cmd.Parameters.AddWithValue("@Status", "");
                        cmd.Parameters.AddWithValue("@Isdelete", "0");
                        cmd.Parameters.AddWithValue("@Catelogid", "");
                        cmd.Parameters.AddWithValue("@FromDate", DBNull.Value);
                        cmd.Parameters.AddWithValue("@ToDate", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Query", 4);

                        using (SqlDataAdapter da = new SqlDataAdapter(cmd))
                        {
                            DataTable dt = new DataTable();
                            da.Fill(dt);
                            if (dt.Rows.Count > 0)
                            {
                                DataRow row = dt.Rows[0];
                                 header = new Stockadjustment
                                {
                                    Id = Convert.ToInt32(row["Id"]),
                                    Userid = dt.Columns.Contains("Userid") ? row["Userid"]?.ToString() : "",
                                    Username = dt.Columns.Contains("Firstname") ? row["Firstname"]?.ToString() : (dt.Columns.Contains("Username") ? row["Username"]?.ToString() : ""),
                                    Modeof_adjustment = dt.Columns.Contains("Modeof_adjustment") ? row["Modeof_adjustment"]?.ToString() : "",
                                    Referenceno = dt.Columns.Contains("Referenceno") ? row["Referenceno"]?.ToString() : "",
                                    Dateenter = dt.Columns.Contains("Dateenter") && row["Dateenter"] != DBNull.Value ? Convert.ToDateTime(row["Dateenter"]).ToString("dd-MMM-yyyy") : "",
                                    Remarks = dt.Columns.Contains("Remarks") ? row["Remarks"]?.ToString() : "",
                                    Status = dt.Columns.Contains("Status") ? row["Status"]?.ToString() : ""
                                };
                            }
                        }
                    }

                    // 2. Fetch Details
                    using (SqlCommand cmd = new SqlCommand("Sp_Stockadjustmentdetails", con))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Stockadjustmentid", id.ToString());
                        cmd.Parameters.AddWithValue("@Itemid", "");
                        cmd.Parameters.AddWithValue("@Type", "");
                        cmd.Parameters.AddWithValue("@Qty_avaiable", "");
                        cmd.Parameters.AddWithValue("@Newqty_onhand", "");
                        cmd.Parameters.AddWithValue("@Qty_adjusted", "");
                        cmd.Parameters.AddWithValue("@Status", "");
                        cmd.Parameters.AddWithValue("@Isdelete", "0");
                        cmd.Parameters.AddWithValue("@Query", 4);
                        cmd.Parameters.AddWithValue("@Warehouseid", "");
                        cmd.Parameters.AddWithValue("@Reason", "");
                        cmd.Parameters.AddWithValue("@Description", "");

                        using (SqlDataAdapter da = new SqlDataAdapter(cmd))
                        {
                            DataTable dt = new DataTable();
                            da.Fill(dt);
                            foreach (DataRow row in dt.Rows)
                            {
                                string itemname = "";
                                if (dt.Columns.Contains("Variantname")) itemname = row["Variantname"]?.ToString() ?? "";
                                else if (dt.Columns.Contains("Itemname")) itemname = row["Itemname"]?.ToString() ?? "";
                                else if (dt.Columns.Contains("Stockitemname")) itemname = row["Stockitemname"]?.ToString() ?? "";

                                string warehouseid = dt.Columns.Contains("Warehouseid") ? row["Warehouseid"]?.ToString() : "";
                                string warehousename = dt.Columns.Contains("Warehousename") ? row["Warehousename"]?.ToString() : "";
                                string reasonid = dt.Columns.Contains("Reason") ? row["Reason"]?.ToString() : "";
                                string reasontext = dt.Columns.Contains("Reasontext") ? row["Reasontext"]?.ToString() : "";

                                 details.Add(new Stockadjustmentdetails
                                {
                                    Itemid = row["Itemid"],
                                    Itemname = itemname,
                                    Qty_avaiable = row["Qty_avaiable"],
                                    Newqty_onhand = row["Newqty_onhand"],
                                    Qty_adjusted = row["Qty_adjusted"],
                                    Warehouseid = warehouseid,
                                    Warehousename = warehousename,
                                    Reason = reasonid,
                                    Reasontext = reasontext,
                                    Description = dt.Columns.Contains("Description") ? row["Description"]?.ToString() : ""
                                });
                            }
                        }
                    }
                    // 3. Fetch Attachments
                    using (SqlCommand cmd = new SqlCommand("Sp_Stockadjustmentattachment", con))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Stockattachmentid", id.ToString());
                        cmd.Parameters.AddWithValue("@Attachment", (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Isdelete", "0");
                        cmd.Parameters.AddWithValue("@Query", 4);

                        using (SqlDataAdapter da = new SqlDataAdapter(cmd))
                        {
                            DataTable dt = new DataTable();
                            da.Fill(dt);
                            foreach (DataRow row in dt.Rows)
                            {
                                 attachments.Add(new Attachment
                                {
                                    id = Convert.ToInt32(row["Id"]),
                                    name = dt.Columns.Contains("Attachment") ? Path.GetFileName(row["Attachment"]?.ToString() ?? "") : "",
                                    path = dt.Columns.Contains("Attachment") ? row["Attachment"]?.ToString() : ""
                                });
                            }
                        }
                    }
                }

                return Ok(new { header = header, details = details, attachments = attachments, success = true });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetStockadjustmentdetails: {ex.Message}");
                return StatusCode(500, new { message = "An internal server error occurred." });
            }
        }

        [HttpPost]
        [Route("ApproveStockadjustment")]
        public async Task<IActionResult> ApproveStockadjustment(int id, string status)
        {
            try
            {
                using (SqlConnection con = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
                {
                    await con.OpenAsync();
                    using (SqlCommand cmd = new SqlCommand("Sp_Stockadjustment", con))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", id);
                        cmd.Parameters.AddWithValue("@Userid", "");
                        cmd.Parameters.AddWithValue("@Modeof_adjustment", "");
                        cmd.Parameters.AddWithValue("@Referenceno", "");
                        cmd.Parameters.AddWithValue("@Dateenter", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Accountname", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Status", status);
                        cmd.Parameters.AddWithValue("@Isdelete", "0");
                        cmd.Parameters.AddWithValue("@Query", 6);
                        await cmd.ExecuteNonQueryAsync();
                    }
                }
                return Ok(new { message = "Status updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
        [HttpPost]
        [Route("savestockadjustmentapprovals")]
        public IActionResult savestockadjustmentapprovals([FromForm] string Id, [FromForm] string Userid, [FromForm] string comments, [FromForm] string Status, [FromForm] string Approveuserid)
        {
            try
            {
                string Catelogid = "", message = "", currency = "", type = "";
                decimal amount = 0, currency_rate = 0, totalamount = 0, totalconversionamount = 0, subtotal = 0;

                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    con.Open();
                    SqlTransaction transaction = con.BeginTransaction();

                    try
                    {
                        Catelogid = getcatelogid(Approveuserid, con);

                        if (Status == "Approved")
                        {
                            using (SqlCommand cmd21 = new SqlCommand("Sp_Stockadjustment", con, transaction))
                            {
                                cmd21.CommandType = CommandType.StoredProcedure;
                                cmd21.Parameters.AddWithValue("@Id", Id);
                                cmd21.Parameters.AddWithValue("@Userid", "");
                                cmd21.Parameters.AddWithValue("@Modeof_adjustment", "");
                                cmd21.Parameters.AddWithValue("@Referenceno", "");
                                cmd21.Parameters.AddWithValue("@Dateenter", DBNull.Value);
                                cmd21.Parameters.AddWithValue("@Accountname", "");
                                cmd21.Parameters.AddWithValue("@Status", "");
                                cmd21.Parameters.AddWithValue("@Isdelete", "");
                                cmd21.Parameters.AddWithValue("@Query", 8);

                                DataTable dt = new DataTable();
                                using (SqlDataAdapter da = new SqlDataAdapter(cmd21))
                                {
                                    da.Fill(dt);
                                }

                                if (dt.Rows.Count > 0)
                                {
                                    foreach (DataRow row in dt.Rows)
                                    {
                                        string productid = "";
                                        using (SqlCommand cmd212 = new SqlCommand("Sp_Productvariants", con, transaction))
                                        {
                                            cmd212.CommandType = CommandType.StoredProcedure;
                                            cmd212.Parameters.AddWithValue("@Id", row["Itemid"]);
                                            cmd212.Parameters.AddWithValue("@Query", 25);
                                            using (SqlDataAdapter da212 = new SqlDataAdapter(cmd212))
                                            {
                                                DataTable dt212 = new DataTable();
                                                da212.Fill(dt212);
                                                if (dt212.Rows.Count > 0)
                                                {
                                                    productid = dt212.Rows[0][0].ToString();
                                                }
                                            }
                                        }

                                        using (SqlCommand command = new SqlCommand("Sp_Inventory", con, transaction))
                                        {
                                            command.CommandType = CommandType.StoredProcedure;
                                            command.Parameters.AddWithValue("@Id", "");
                                            command.Parameters.AddWithValue("@Productid", productid);
                                            command.Parameters.AddWithValue("@Inventory_type", "6");
                                            command.Parameters.AddWithValue("@Inventory_date", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
                                            command.Parameters.AddWithValue("@Productvariantsid", row["Itemid"]);
                                            command.Parameters.AddWithValue("@Total_qty", row["Qty_adjusted"]);
                                            command.Parameters.AddWithValue("@Billid", Id);
                                            command.Parameters.AddWithValue("@Warehouse_status", "1");
                                            command.Parameters.AddWithValue("@Isdelete", "0");
                                            command.Parameters.AddWithValue("@Status", "Transit");
                                            command.Parameters.AddWithValue("@Warehouseid", row["Warehouseid"]);
                                            command.Parameters.AddWithValue("@Query", 1);
                                            command.ExecuteNonQuery();
                                        }

                                        using (SqlCommand cmd = new SqlCommand("Sp_Purchase", con, transaction))
                                        {
                                            cmd.CommandType = CommandType.StoredProcedure;
                                            cmd.Parameters.AddWithValue("@Itemid", row["Itemid"]);
                                            cmd.Parameters.AddWithValue("@Query", 27);

                                            using (SqlDataAdapter da1 = new SqlDataAdapter(cmd))
                                            {
                                                DataTable dt1 = new DataTable();
                                                da1.Fill(dt1);
                                                if (dt1.Rows.Count > 0)
                                                {
                                                    amount = dt1.Rows[0]["Amount"] == DBNull.Value ? 0 : Convert.ToDecimal(dt1.Rows[0]["Amount"]);
                                                    currency_rate = dt1.Rows[0]["Currency_rate"] == DBNull.Value ? 1 : Convert.ToDecimal(dt1.Rows[0]["Currency_rate"]);
                                                    currency = dt1.Rows[0]["Currency"]?.ToString() ?? "";
                                                }
                                            }
                                        }

                                        subtotal = (row["Qty_adjusted"] == DBNull.Value ? 0 : Convert.ToDecimal(row["Qty_adjusted"])) * amount;
                                        totalamount += subtotal;
                                        totalconversionamount += subtotal * currency_rate;
                                    }
                                }
                            }

                            using (SqlCommand cmdt = new SqlCommand("Sp_Transaction", con, transaction))
                            {
                                cmdt.CommandType = CommandType.StoredProcedure;
                                cmdt.Parameters.AddWithValue("@Id", "");
                                cmdt.Parameters.AddWithValue("@Purchase_salesid", Id);
                                cmdt.Parameters.AddWithValue("@Supplier_customerid", "");
                                cmdt.Parameters.AddWithValue("@Date", "");
                                cmdt.Parameters.AddWithValue("@Description", "");
                                cmdt.Parameters.AddWithValue("@Type", "");
                                cmdt.Parameters.AddWithValue("@Transaction_type", "");
                                cmdt.Parameters.AddWithValue("@Ca_id", "");
                                cmdt.Parameters.AddWithValue("@Vat_id", "");
                                cmdt.Parameters.AddWithValue("@Entry_type", "Stockadjustment");
                                cmdt.Parameters.AddWithValue("@Amount", DBNull.Value);
                                cmdt.Parameters.AddWithValue("@Conversion_amount", DBNull.Value);
                                cmdt.Parameters.AddWithValue("@Currency_rate", DBNull.Value);
                                cmdt.Parameters.AddWithValue("@Currency", "");
                                cmdt.Parameters.AddWithValue("@Isdelete", "");
                                cmdt.Parameters.AddWithValue("@Status", "");
                                cmdt.Parameters.AddWithValue("@Query", 15);
                                cmdt.ExecuteNonQuery();
                            }

                            if (totalamount >= 0) { type = "Gain"; }
                            else { type = "Loss"; }

                            using (SqlCommand command1 = new SqlCommand("Sp_InsertTransactionstockadjustment", con, transaction))
                            {
                                command1.CommandType = CommandType.StoredProcedure;
                                command1.Parameters.AddWithValue("@SalesId", Id);
                                command1.Parameters.AddWithValue("@Type", type);
                                command1.Parameters.AddWithValue("@Catelogid", Catelogid);
                                command1.Parameters.AddWithValue("@Subtotal", Math.Abs(totalamount));
                                command1.Parameters.AddWithValue("@GrandTotal", Math.Abs(totalconversionamount));
                                command1.Parameters.AddWithValue("@CurrencyId", currency);
                                command1.Parameters.AddWithValue("@CurrencyValue", currency_rate);
                                command1.Parameters.AddWithValue("@Date", DateTime.Now);
                                command1.ExecuteNonQuery();
                            }

                            UpdateAdjustmentStatus(con, transaction, Id, Status);
                            LogAdjustmentAction(con, transaction, Id, Userid, Approveuserid, comments, Status);

                            using (SqlCommand command = new SqlCommand("Sp_Transactiondifferencecheckwithinsales", con, transaction))
                            {
                                command.CommandType = CommandType.StoredProcedure;
                                command.Parameters.AddWithValue("@Purchase_salesid", Id);
                                command.Parameters.AddWithValue("@Entry_type", "Stockadjustment");
                                using (SqlDataAdapter da1 = new SqlDataAdapter(command))
                                {
                                    DataTable dt1 = new DataTable();
                                    da1.Fill(dt1);
                                    if (dt1.Rows.Count > 0)
                                    {
                                        int difference = Convert.ToInt32(dt1.Rows[0]["Difference"]);
                                        if (difference != 0)
                                        {
                                            message = "There is a difference, transaction not committed";
                                            transaction.Rollback();
                                            return BadRequest(new { success = false, message = message });
                                        }
                                        else
                                        {
                                            transaction.Commit();
                                            message = "Saved successfully";
                                        }
                                    }
                                    else
                                    {
                                        transaction.Commit();
                                        message = "Saved successfully";
                                    }
                                }
                            }
                        }
                        else
                        {
                            UpdateAdjustmentStatus(con, transaction, Id, Status);
                            LogAdjustmentAction(con, transaction, Id, Userid, Approveuserid, comments, Status);
                            transaction.Commit();
                            message = Status == "Rejected" ? "Rejected successfully" : "Processed successfully";
                        }
                    }
                    catch (Exception)
                    {
                        transaction.Rollback();
                        throw;
                    }
                }
                return Ok(new { success = true, message = message });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = "Error: " + ex.Message });
            }
        }

        private void UpdateAdjustmentStatus(SqlConnection con, SqlTransaction transaction, string Id, string Status)
        {
            using (SqlCommand cmd21 = new SqlCommand("Sp_Stockadjustment", con, transaction))
            {
                cmd21.CommandType = CommandType.StoredProcedure;
                cmd21.Parameters.AddWithValue("@Id", Id);
                cmd21.Parameters.AddWithValue("@Userid", "");
                cmd21.Parameters.AddWithValue("@Modeof_adjustment", "");
                cmd21.Parameters.AddWithValue("@Referenceno", "");
                cmd21.Parameters.AddWithValue("@Dateenter", DBNull.Value);
                cmd21.Parameters.AddWithValue("@Accountname", "");
                cmd21.Parameters.AddWithValue("@Isdelete", DBNull.Value);
                cmd21.Parameters.AddWithValue("@Status", Status == "Approved" ? "1" : "2");
                cmd21.Parameters.AddWithValue("@Query", 6);
                cmd21.ExecuteNonQuery();
            }
        }

        private void LogAdjustmentAction(SqlConnection con, SqlTransaction transaction, string Id, string Userid, string Approveuserid, string comments, string Status)
        {
            using (SqlCommand cmd21 = new SqlCommand("Sp_Stockadjustmentlog", con, transaction))
            {
                cmd21.CommandType = CommandType.StoredProcedure;
                cmd21.Parameters.AddWithValue("@Id", "");
                cmd21.Parameters.AddWithValue("@Userid", Userid);
                cmd21.Parameters.AddWithValue("@Stockadjustmentid", Id);
                cmd21.Parameters.AddWithValue("@Approveuserid", Approveuserid);
                cmd21.Parameters.AddWithValue("@Editreason", "");
                cmd21.Parameters.AddWithValue("@Comments", comments);
                cmd21.Parameters.AddWithValue("@Isdelete", "0");
                cmd21.Parameters.AddWithValue("@Status", Status == "Approved" ? "1" : "2");
                cmd21.Parameters.AddWithValue("@Date", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
                cmd21.Parameters.AddWithValue("@Type", "Approve");
                cmd21.Parameters.AddWithValue("@Query", "1");
                cmd21.ExecuteNonQuery();
            }
        }

        [HttpGet]
        [Route("gomanagerapprovalstocktransferad")]
        public async Task<IActionResult> gomanagerapprovalstocktransferad(int id)
        {
            try
            {
                using (SqlConnection con = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
                {
                    await con.OpenAsync();
                    using (SqlCommand cmd12 = new SqlCommand("Sp_Stockadjustment", con))
                    {
                        cmd12.CommandType = CommandType.StoredProcedure;
                        cmd12.Parameters.AddWithValue("@Id", id);
                        cmd12.Parameters.AddWithValue("@Userid", "");
                        cmd12.Parameters.AddWithValue("@Modeof_adjustment", "");
                        cmd12.Parameters.AddWithValue("@Referenceno", "");
                        cmd12.Parameters.AddWithValue("@Dateenter", "");
                        cmd12.Parameters.AddWithValue("@Accountname", "");
                        cmd12.Parameters.AddWithValue("@Status", "0");
                        cmd12.Parameters.AddWithValue("@Isdelete", "");
                        cmd12.Parameters.AddWithValue("@Query", 6);
                        await cmd12.ExecuteNonQueryAsync();
                    }
                }
                return Ok(new { msg = "Manager approval request sent successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { msg = "Error: " + ex.Message });
            }
        }

        [HttpPost]
        [Route("DeleteStockadjustment")]
        public async Task<IActionResult> DeleteStockadjustment(int id, string userid)
        {
            string message = "";
            try
            {
                using (SqlConnection con = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
                {
                    await con.OpenAsync();
                    using (SqlTransaction transaction = con.BeginTransaction())
                    {
                        try
                        {
                            // 1. Delete Header (Query 5)
                            using (SqlCommand cmd = new SqlCommand("Sp_Stockadjustment", con, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Id", id);
                                cmd.Parameters.AddWithValue("@Userid", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Modeof_adjustment", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Referenceno", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Dateenter", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Accountname", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Status", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Isdelete", "1");
                                cmd.Parameters.AddWithValue("@Query", 5);
                                await cmd.ExecuteNonQueryAsync();
                            }

                            // 2. Delete Details (Query 6)
                            using (SqlCommand cmd = new SqlCommand("Sp_Stockadjustmentdetails", con, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Id", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Stockadjustmentid", id);
                                cmd.Parameters.AddWithValue("@Itemid", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Qty_avaiable", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Newqty_onhand", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Qty_adjusted", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Type", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Status", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Isdelete", "1");
                                cmd.Parameters.AddWithValue("@Query", 6);
                                await cmd.ExecuteNonQueryAsync();
                            }

                            // 3. Delete Attachments (Query 6)
                            using (SqlCommand cmd = new SqlCommand("Sp_Stockadjustmentattachment", con, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Id", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Stockattachmentid", id);
                                cmd.Parameters.AddWithValue("@Attachment", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Isdelete", "1");
                                cmd.Parameters.AddWithValue("@Query", 6);
                                await cmd.ExecuteNonQueryAsync();
                            }

                            // 4. Log Entry
                            using (SqlCommand cmd = new SqlCommand("Sp_Stockadjustmentlog", con, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Id", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Userid", userid ?? "");
                                cmd.Parameters.AddWithValue("@Stockadjustmentid", id);
                                cmd.Parameters.AddWithValue("@Approveuserid", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Editreason", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Date", DateTime.Now);
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
                        catch (Exception)
                        {
                            transaction.Rollback();
                            throw;
                        }
                    }
                }
                return Ok(new { message = message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error: " + ex.Message });
            }
        }

        [HttpPost]
        [Route("Editstockadjustment")]
        public async Task<IActionResult> Editstockadjustment()
        {
            string message = "";
            try
            {
                var id = Convert.ToInt32(Request.Form["Id"]);
                var userId = Request.Form["Userid"].ToString();
                var mode = Request.Form["Modeof_adjustment"].ToString();
                var refNo = Request.Form["Referenceno"].ToString();
                var date = Request.Form["Dateenter"].ToString();
                var account = Request.Form["Accountname"].ToString();
                var tableDataJson = Request.Form["tableData1"].ToString();

                var tableData1 = JsonConvert.DeserializeObject<List<Stockadjustmentdetails>>(tableDataJson);

                using (SqlConnection con = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
                {
                    await con.OpenAsync();
                    using (SqlTransaction transaction = con.BeginTransaction())
                    {
                        try
                        {
                            // 1. Update Header
                            using (SqlCommand cmd = new SqlCommand("Sp_Stockadjustment", con, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Id", id);
                                cmd.Parameters.AddWithValue("@Userid", userId);
                                cmd.Parameters.AddWithValue("@Modeof_adjustment", mode);
                                cmd.Parameters.AddWithValue("@Referenceno", refNo);
                                cmd.Parameters.AddWithValue("@Dateenter", date);
                                cmd.Parameters.AddWithValue("@Accountname", account);
                                cmd.Parameters.AddWithValue("@Status", "Active");
                                cmd.Parameters.AddWithValue("@Isdelete", "0");
                                cmd.Parameters.AddWithValue("@Query", 2);
                                await cmd.ExecuteNonQueryAsync();
                            }

                            // 2. Delete Existing Details
                            using (SqlCommand cmd = new SqlCommand("Sp_Stockadjustmentdetails", con, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Id", "");
                                cmd.Parameters.AddWithValue("@Stockadjustmentid", id);
                                cmd.Parameters.AddWithValue("@Itemid", "");
                                cmd.Parameters.AddWithValue("@Qty_avaiable", "");
                                cmd.Parameters.AddWithValue("@Newqty_onhand", "");
                                cmd.Parameters.AddWithValue("@Qty_adjusted", "");
                                cmd.Parameters.AddWithValue("@Type", "");
                                cmd.Parameters.AddWithValue("@Status", "");
                                cmd.Parameters.AddWithValue("@Isdelete", "");
                                cmd.Parameters.AddWithValue("@Query", 5);
                                await cmd.ExecuteNonQueryAsync();
                            }

                            // 3. Insert New Details
                            foreach (var item in tableData1)
                            {
                                string type = "";
                                if (!string.IsNullOrEmpty(item.Itemname))
                                {
                                    var match = System.Text.RegularExpressions.Regex.Match(item.Itemname, @"\(([^)]+)\)");
                                    if (match.Success) type = match.Groups[1].Value;
                                }
                                if (string.IsNullOrEmpty(type)) type = "Item"; // Default fallback

                                using (SqlCommand cmd = new SqlCommand("Sp_Stockadjustmentdetails", con, transaction))
                                {
                                    cmd.CommandType = CommandType.StoredProcedure;
                                    cmd.Parameters.AddWithValue("@Id", "");
                                    cmd.Parameters.AddWithValue("@Stockadjustmentid", id);
                                    cmd.Parameters.AddWithValue("@Itemid", item.Itemid);
                                    cmd.Parameters.AddWithValue("@Qty_avaiable", item.Qty_avaiable);
                                    cmd.Parameters.AddWithValue("@Newqty_onhand", item.Newqty_onhand);
                                    cmd.Parameters.AddWithValue("@Qty_adjusted", item.Qty_adjusted);
                                    cmd.Parameters.AddWithValue("@Type", type);
                                    cmd.Parameters.AddWithValue("@Warehouseid", item.Warehouseid ?? (object)DBNull.Value);
                                    cmd.Parameters.AddWithValue("@Reason", item.Reason ?? (object)DBNull.Value);
                                    cmd.Parameters.AddWithValue("@Description", item.Description ?? (object)DBNull.Value);
                                    cmd.Parameters.AddWithValue("@Status", "Active");
                                    cmd.Parameters.AddWithValue("@Isdelete", "0");
                                    cmd.Parameters.AddWithValue("@Query", 1);
                                    await cmd.ExecuteNonQueryAsync();
                                }
                            }

                            // 4. Handle Attachments
                            var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Content", "images", "Stockadjustment");
                            if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

                            foreach (var file in Request.Form.Files)
                            {
                                string originalName = Path.GetFileNameWithoutExtension(file.FileName);
                                string extension = Path.GetExtension(file.FileName);
                                string uniqueName = $"{originalName}_{DateTime.Now:yyyyMMdd_HHmmssfff}{extension}";
                                string savePath = Path.Combine(uploadPath, uniqueName);

                                using (var stream = new FileStream(savePath, FileMode.Create))
                                {
                                    await file.CopyToAsync(stream);
                                }

                                using (SqlCommand cmd = new SqlCommand("Sp_Stockadjustmentattachment", con, transaction))
                                {
                                    cmd.CommandType = CommandType.StoredProcedure;
                                    cmd.Parameters.AddWithValue("@Id", "");
                                    cmd.Parameters.AddWithValue("@Stockattachmentid", id);
                                    cmd.Parameters.AddWithValue("@Attachment", "/Content/images/Stockadjustment/" + uniqueName);
                                    cmd.Parameters.AddWithValue("@Isdelete", "0");
                                    cmd.Parameters.AddWithValue("@Query", "1");
                                    await cmd.ExecuteNonQueryAsync();
                                }
                            }

                            // 5. Audit Log
                            using (SqlCommand cmd = new SqlCommand("Sp_Stockadjustmentlog", con, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Id", "");
                                cmd.Parameters.AddWithValue("@Userid", userId);
                                cmd.Parameters.AddWithValue("@Stockadjustmentid", id);
                                cmd.Parameters.AddWithValue("@Approveuserid", "");
                                cmd.Parameters.AddWithValue("@Editreason", "");
                                cmd.Parameters.AddWithValue("@Date", DateTime.Now);
                                cmd.Parameters.AddWithValue("@Comments", "Updated via Web API");
                                cmd.Parameters.AddWithValue("@Type", "Log");
                                cmd.Parameters.AddWithValue("@Status", "0");
                                cmd.Parameters.AddWithValue("@Isdelete", "0");
                                cmd.Parameters.AddWithValue("@Query", 1);
                                await cmd.ExecuteNonQueryAsync();
                            }

                            transaction.Commit();
                            message = "Updated Successfully";
                        }
                        catch (Exception)
                        {
                            transaction.Rollback();
                            throw;
                        }
                    }
                }
                return Ok(new { message = message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error: " + ex.Message });
            }
        }

        private string getcatelogid(string userId, SqlConnection con)
        {
            try
            {
                using (SqlCommand cmd = new SqlCommand("SELECT Catelogid FROM Tbl_Registration WHERE Userid = @uid", con))
                {
                    cmd.Parameters.AddWithValue("@uid", userId);
                    object result = cmd.ExecuteScalar();
                    string cid = result?.ToString() ?? "";
                    if (string.IsNullOrEmpty(cid)) cid = "1"; // Default to 1 if not found
                    return cid;
                }
            }
            catch { return "1"; }
        }
        [HttpPost("requesteditstockadjustment")]
        public async Task<IActionResult> requesteditstockadjustment([FromQuery] int id, [FromQuery] string reason)
        {
            try {
                using (SqlConnection con = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
                {
                    await con.OpenAsync();
                    using (SqlTransaction transaction = con.BeginTransaction())
                    {
                        try {
                            // 1. Update Status to 3 (Edit Request)
                            using (SqlCommand cmd = new SqlCommand("UPDATE Tbl_Stockadjustment SET Status = '3' WHERE Id = @id", con, transaction)) {
                                cmd.Parameters.AddWithValue("@id", id);
                                await cmd.ExecuteNonQueryAsync();
                            }
                            // 2. Log entry
                            using (SqlCommand cmd = new SqlCommand("Sp_Stockadjustmentlog", con, transaction)) {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Stockadjustmentid", id);
                                cmd.Parameters.AddWithValue("@Userid", "");
                                cmd.Parameters.AddWithValue("@Editreason", reason);
                                cmd.Parameters.AddWithValue("@Comments", "Edit request submitted");
                                cmd.Parameters.AddWithValue("@Date", DateTime.Now);
                                cmd.Parameters.AddWithValue("@Type", "EditRequest");
                                cmd.Parameters.AddWithValue("@Status", "0");
                                cmd.Parameters.AddWithValue("@Query", 1);
                                await cmd.ExecuteNonQueryAsync();
                            }
                            transaction.Commit();
                            return Ok(new { success = true, msg = "Edit request sent successfully" });
                        } catch { transaction.Rollback(); throw; }
                    }
                }
            } catch (Exception ex) { return StatusCode(500, new { success = false, msg = ex.Message }); }
        }

        [HttpPost("requestdeletestockadjustment")]
        public async Task<IActionResult> requestdeletestockadjustment([FromQuery] int id, [FromQuery] string reason)
        {
            try {
                using (SqlConnection con = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
                {
                    await con.OpenAsync();
                    using (SqlTransaction transaction = con.BeginTransaction())
                    {
                        try {
                            // 1. Update Status to 4 (Delete Request)
                            using (SqlCommand cmd = new SqlCommand("UPDATE Tbl_Stockadjustment SET Status = '4' WHERE Id = @id", con, transaction)) {
                                cmd.Parameters.AddWithValue("@id", id);
                                await cmd.ExecuteNonQueryAsync();
                            }
                            // 2. Log entry
                            using (SqlCommand cmd = new SqlCommand("Sp_Stockadjustmentlog", con, transaction)) {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Stockadjustmentid", id);
                                cmd.Parameters.AddWithValue("@Userid", "");
                                cmd.Parameters.AddWithValue("@Editreason", reason);
                                cmd.Parameters.AddWithValue("@Comments", "Delete request submitted");
                                cmd.Parameters.AddWithValue("@Date", DateTime.Now);
                                cmd.Parameters.AddWithValue("@Type", "DeleteRequest");
                                cmd.Parameters.AddWithValue("@Status", "0");
                                cmd.Parameters.AddWithValue("@Query", 1);
                                await cmd.ExecuteNonQueryAsync();
                            }
                            transaction.Commit();
                            return Ok(new { success = true, msg = "Delete request sent successfully" });
                        } catch { transaction.Rollback(); throw; }
                    }
                }
            } catch (Exception ex) { return StatusCode(500, new { success = false, msg = ex.Message }); }
        }

        [HttpGet("getstockadjustmentapprovalsfull")]
        public async Task<IActionResult> getstockadjustmentapprovalsfull([FromQuery] string userid)
        {
            try
            {
                int stockapprovalcount = 0, stockapprovalcount1 = 0;
                var list1 = new List<Stockadjustment>();
                var list2 = new List<Stockadjustment>();
                string connStr = _configuration.GetConnectionString("DefaultConnection");

                using (SqlConnection con = new SqlConnection(connStr))
                {
                    await con.OpenAsync();
                    string Catelogid = getcatelogid(userid ?? "", con);
                    
                    // List 1: Pending (Status = 0)
                    using (SqlCommand cmd1 = new SqlCommand("Sp_Stockadjustment", con))
                    {
                        cmd1.CommandType = CommandType.StoredProcedure;
                        cmd1.Parameters.AddWithValue("@Id", "");
                        cmd1.Parameters.AddWithValue("@Userid", userid ?? "");
                        cmd1.Parameters.AddWithValue("@Modeof_adjustment", "");
                        cmd1.Parameters.AddWithValue("@Referenceno", "");
                        cmd1.Parameters.AddWithValue("@Dateenter", DBNull.Value);
                        cmd1.Parameters.AddWithValue("@Accountname", "");
                        cmd1.Parameters.AddWithValue("@Status", "0");
                        cmd1.Parameters.AddWithValue("@Isdelete", "0");
                        cmd1.Parameters.AddWithValue("@Catelogid", Catelogid);
                        cmd1.Parameters.AddWithValue("@Query", 7);

                        using (var reader = await cmd1.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                list1.Add(new Stockadjustment {
                                    Id = Convert.ToInt32(reader["Id"]),
                                    Userid = reader["Userid"]?.ToString()?.Trim(),
                                    Username = reader["Firstname"]?.ToString()?.Trim() ?? "Unknown",
                                    Modeof_adjustment = reader["Modeof_adjustment"]?.ToString()?.Trim(),
                                    Referenceno = reader["Referenceno"]?.ToString()?.Trim(),
                                    Dateenter = reader["Dateenter"]?.ToString()?.Trim(),
                                    Status = reader["Status"]?.ToString()?.Trim()
                                });
                            }
                        }
                    }
                    stockapprovalcount = list1.Count;

                    // List 2: Edit/Delete Requests (Status = 3,4)
                    using (SqlCommand cmd4 = new SqlCommand("Sp_Stockadjustmentlog", con))
                    {
                        cmd4.CommandType = CommandType.StoredProcedure;
                        cmd4.Parameters.AddWithValue("@Id", "");
                        cmd4.Parameters.AddWithValue("@Userid", userid ?? "");
                        cmd4.Parameters.AddWithValue("@Type", "Editrequest,Deleterequest");
                        cmd4.Parameters.AddWithValue("@Catelogid", Catelogid);
                        cmd4.Parameters.AddWithValue("@Status", "3,4");
                        cmd4.Parameters.AddWithValue("@Query", 3);

                        using (var reader = await cmd4.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                list2.Add(new Stockadjustment {
                                    Id = Convert.ToInt32(reader["Id"]),
                                    Userid = reader["Username"]?.ToString()?.Trim(),
                                    Dateenter = reader["Dateenter"]?.ToString()?.Trim(),
                                    Referenceno = reader["Referenceno"]?.ToString()?.Trim(),
                                    Editreason = reader["Editreason"]?.ToString()?.Trim(),
                                    Logid = reader["logid"]?.ToString()?.Trim(),
                                    Logtype = reader["logtype"]?.ToString()?.Trim()
                                });
                            }
                        }
                    }
                    stockapprovalcount1 = list2.Count;
                }

                return Ok(new { 
                    list1 = list1, 
                    stockapprovalcount = stockapprovalcount, 
                    list2 = list2, 
                    stockapprovalcount1 = stockapprovalcount1,
                    success = true 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, msg = ex.Message });
            }
        }

        [HttpPost("handleadjustmentapproval")]
        public async Task<IActionResult> handleadjustmentapproval([FromBody] JObject payload)
        {
            try {
                int id = payload["Id"]?.Value<int>() ?? 0;
                string status = payload["Status"]?.ToString() ?? "1";
                string comments = payload["Comments"]?.ToString() ?? "";
                string managerId = payload["Userid"]?.ToString() ?? "";

                using (SqlConnection con = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
                {
                    await con.OpenAsync();
                    using (SqlTransaction transaction = con.BeginTransaction())
                    {
                        try {
                            // 1. Update Status
                            using (SqlCommand cmd = new SqlCommand("Sp_Stockadjustment", con, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Id", id);
                                cmd.Parameters.AddWithValue("@Status", status);
                                cmd.Parameters.AddWithValue("@Query", 6);
                                await cmd.ExecuteNonQueryAsync();
                            }

                            // 2. Add Log
                            using (SqlCommand cmd = new SqlCommand("Sp_Stockadjustmentlog", con, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Stockadjustmentid", id);
                                cmd.Parameters.AddWithValue("@Userid", "");
                                cmd.Parameters.AddWithValue("@Approveuserid", managerId);
                                cmd.Parameters.AddWithValue("@Comments", $"Manager Decision: {status}. Note: {comments}");
                                cmd.Parameters.AddWithValue("@Date", DateTime.Now);
                                cmd.Parameters.AddWithValue("@Type", "Log");
                                cmd.Parameters.AddWithValue("@Status", "1");
                                cmd.Parameters.AddWithValue("@Query", 1);
                                await cmd.ExecuteNonQueryAsync();
                            }
                            
                            transaction.Commit();
                            return Ok(new { success = true, msg = "Decision processed successfully." });
                        }
                        catch (Exception) {
                            transaction.Rollback();
                            throw;
                        }
                    }
                }
            } catch (Exception ex) { return StatusCode(500, new { success = false, msg = ex.Message }); }
        }

        [HttpPost("seteditreasonstockadjust")]
        public async Task<IActionResult> seteditreasonstockadjust([FromBody] JsonElement payload)
        {
            try
            {
                string stockadid = payload.GetProperty("stockadid").GetString() ?? "";
                string status = payload.GetProperty("status").GetString() ?? "Approved";
                string logid = payload.GetProperty("logid").GetString() ?? "";
                string comments = payload.GetProperty("comments").GetString() ?? "";
                string logtype = payload.GetProperty("logtype").GetString() ?? "Editrequest";

                using (SqlConnection con = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
                {
                    await con.OpenAsync();
                    using (SqlTransaction transaction = con.BeginTransaction())
                    {
                        try
                        {
                            // 1. Update Log record
                            using (SqlCommand cmdLog = new SqlCommand("Sp_Stockadjustmentlog", con, transaction))
                            {
                                cmdLog.CommandType = CommandType.StoredProcedure;
                                cmdLog.Parameters.AddWithValue("@Id", logid);
                                cmdLog.Parameters.AddWithValue("@Approveuserid", ""); // Placeholder
                                cmdLog.Parameters.AddWithValue("@Status", status == "Approved" ? "1" : "0");
                                cmdLog.Parameters.AddWithValue("@Comments", comments);
                                cmdLog.Parameters.AddWithValue("@Date", DateTime.Now);
                                cmdLog.Parameters.AddWithValue("@Approveddate", DateTime.Now);
                                cmdLog.Parameters.AddWithValue("@Query", 4);
                                await cmdLog.ExecuteNonQueryAsync();
                            }

                            if (logtype.Equals("Editrequest", StringComparison.OrdinalIgnoreCase))
                            {
                                if (status.Equals("Approved", StringComparison.OrdinalIgnoreCase))
                                {
                                    using (SqlCommand cmdAdj = new SqlCommand("Sp_Stockadjustment", con, transaction))
                                    {
                                        cmdAdj.CommandType = CommandType.StoredProcedure;
                                        cmdAdj.Parameters.AddWithValue("@Id", stockadid);
                                        cmdAdj.Parameters.AddWithValue("@Userid", "");
                                        cmdAdj.Parameters.AddWithValue("@Modeof_adjustment", "");
                                        cmdAdj.Parameters.AddWithValue("@Referenceno", "");
                                        cmdAdj.Parameters.AddWithValue("@Dateenter", DateTime.Now);
                                        cmdAdj.Parameters.AddWithValue("@Accountname", "");
                                        cmdAdj.Parameters.AddWithValue("@Isdelete", "0");
                                        cmdAdj.Parameters.AddWithValue("@Status", "Active");
                                        cmdAdj.Parameters.AddWithValue("@Query", 6);
                                        await cmdAdj.ExecuteNonQueryAsync();
                                    }
                                }
                                else
                                {
                                    // Reset to Approved if rejected
                                    using (SqlCommand cmdAdj = new SqlCommand("Sp_Stockadjustment", con, transaction))
                                    {
                                        cmdAdj.CommandType = CommandType.StoredProcedure;
                                        cmdAdj.Parameters.AddWithValue("@Id", stockadid);
                                        cmdAdj.Parameters.AddWithValue("@Userid", "");
                                        cmdAdj.Parameters.AddWithValue("@Modeof_adjustment", "");
                                        cmdAdj.Parameters.AddWithValue("@Referenceno", "");
                                        cmdAdj.Parameters.AddWithValue("@Dateenter", DateTime.Now);
                                        cmdAdj.Parameters.AddWithValue("@Accountname", "");
                                        cmdAdj.Parameters.AddWithValue("@Isdelete", "0");
                                        cmdAdj.Parameters.AddWithValue("@Status", "1");
                                        cmdAdj.Parameters.AddWithValue("@Query", 6);
                                        await cmdAdj.ExecuteNonQueryAsync();
                                    }
                                }
                            }
                            else if (logtype.Equals("Deleterequest", StringComparison.OrdinalIgnoreCase))
                            {
                                if (status.Equals("Approved", StringComparison.OrdinalIgnoreCase))
                                {
                                    // Soft delete adjustment
                                    using (SqlCommand cmdAdj = new SqlCommand("Sp_Stockadjustment", con, transaction))
                                    {
                                        cmdAdj.CommandType = CommandType.StoredProcedure;
                                        cmdAdj.Parameters.AddWithValue("@Id", stockadid);
                                        cmdAdj.Parameters.AddWithValue("@Userid", "");
                                        cmdAdj.Parameters.AddWithValue("@Modeof_adjustment", "");
                                        cmdAdj.Parameters.AddWithValue("@Referenceno", "");
                                        cmdAdj.Parameters.AddWithValue("@Dateenter", DateTime.Now);
                                        cmdAdj.Parameters.AddWithValue("@Accountname", "");
                                        cmdAdj.Parameters.AddWithValue("@Status", "");
                                        cmdAdj.Parameters.AddWithValue("@Isdelete", "1");
                                        cmdAdj.Parameters.AddWithValue("@Query", 5);
                                        await cmdAdj.ExecuteNonQueryAsync();
                                    }

                                    // Soft delete details
                                    using (SqlCommand cmdDet = new SqlCommand("Sp_Stockadjustmentdetails", con, transaction))
                                    {
                                        cmdDet.CommandType = CommandType.StoredProcedure;
                                        cmdDet.Parameters.AddWithValue("@Id", DBNull.Value);
                                        cmdDet.Parameters.AddWithValue("@Stockadjustmentid", stockadid);
                                        cmdDet.Parameters.AddWithValue("@Itemid", DBNull.Value);
                                        cmdDet.Parameters.AddWithValue("@Qty_avaiable", DBNull.Value);
                                        cmdDet.Parameters.AddWithValue("@Newqty_onhand", DBNull.Value);
                                        cmdDet.Parameters.AddWithValue("@Qty_adjusted", DBNull.Value);
                                        cmdDet.Parameters.AddWithValue("@Type", DBNull.Value);
                                        cmdDet.Parameters.AddWithValue("@Status", DBNull.Value);
                                        cmdDet.Parameters.AddWithValue("@Isdelete", "1");
                                        cmdDet.Parameters.AddWithValue("@Query", 6);
                                        await cmdDet.ExecuteNonQueryAsync();
                                    }

                                    // Soft delete attachments
                                    using (SqlCommand cmdAtt = new SqlCommand("Sp_Stockadjustmentattachment", con, transaction))
                                    {
                                        cmdAtt.CommandType = CommandType.StoredProcedure;
                                        cmdAtt.Parameters.AddWithValue("@Id", DBNull.Value);
                                        cmdAtt.Parameters.AddWithValue("@Stockattachmentid", stockadid);
                                        cmdAtt.Parameters.AddWithValue("@Attachment", DBNull.Value);
                                        cmdAtt.Parameters.AddWithValue("@Isdelete", "1");
                                        cmdAtt.Parameters.AddWithValue("@Query", 6);
                                        await cmdAtt.ExecuteNonQueryAsync();
                                    }

                                    // Delete financial transactions
                                    using (SqlCommand cmdTrans = new SqlCommand("DELETE FROM Tbl_Transaction WHERE Purchase_salesid = @id AND Type = '0' AND Entry_type = 'Stockadjustment'", con, transaction))
                                    {
                                        cmdTrans.Parameters.AddWithValue("@id", stockadid);
                                        await cmdTrans.ExecuteNonQueryAsync();
                                    }

                                    // Reverse inventory
                                    using (SqlCommand cmdInv = new SqlCommand("UPDATE Tbl_Inventory SET Isdelete = '1' WHERE Billid = @id AND Inventory_type = '6'", con, transaction))
                                    {
                                        cmdInv.Parameters.AddWithValue("@id", stockadid);
                                        await cmdInv.ExecuteNonQueryAsync();
                                    }
                                }
                                else
                                {
                                    // Reset to Approved if rejected
                                    using (SqlCommand cmdAdj = new SqlCommand("Sp_Stockadjustment", con, transaction))
                                    {
                                        cmdAdj.CommandType = CommandType.StoredProcedure;
                                        cmdAdj.Parameters.AddWithValue("@Id", stockadid);
                                        cmdAdj.Parameters.AddWithValue("@Userid", "");
                                        cmdAdj.Parameters.AddWithValue("@Modeof_adjustment", "");
                                        cmdAdj.Parameters.AddWithValue("@Referenceno", "");
                                        cmdAdj.Parameters.AddWithValue("@Dateenter", DateTime.Now);
                                        cmdAdj.Parameters.AddWithValue("@Accountname", "");
                                        cmdAdj.Parameters.AddWithValue("@Isdelete", "0");
                                        cmdAdj.Parameters.AddWithValue("@Status", "1");
                                        cmdAdj.Parameters.AddWithValue("@Query", 6);
                                        await cmdAdj.ExecuteNonQueryAsync();
                                    }
                                }
                            }

                            transaction.Commit();
                            return Ok(new { success = true, msg = "Request processed successfully" });
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            return StatusCode(500, new { success = false, msg = "Transaction Error: " + ex.Message });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, msg = "Server Error: " + ex.Message });
            }
        }

        /// <summary>Legacy MVC /Stock/GetDriverOrHelper — drivers or helpers from Tbl_Driverdetails.</summary>
        [HttpGet("GetDriverOrHelper")]
        public IActionResult GetDriverOrHelper([FromQuery] string? type)
        {
            var list = new List<object>();
            if (string.IsNullOrWhiteSpace(type))
                return Ok(list);

            try
            {
                var cs = _configuration.GetConnectionString("DefaultConnection");
                using var con = new SqlConnection(cs);
                con.Open();
                const string query = "SELECT Id, Drivername, Licenseno, Mobileno FROM Tbl_Driverdetails WHERE Isdelete = 0 AND Type = @Type";
                using var cmd = new SqlCommand(query, con);
                cmd.Parameters.AddWithValue("@Type", type.Trim());
                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    list.Add(new
                    {
                        Id = reader["Id"]?.ToString() ?? "",
                        Name = reader["Drivername"]?.ToString() ?? "",
                        License = reader["Licenseno"]?.ToString() ?? "",
                        Mobile = reader["Mobileno"]?.ToString() ?? ""
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }

            return Ok(list);
        }

        /// <summary>Legacy MVC /Stock/GetVehicles — vehicles from Tbl_Vehicledetails.</summary>
        [HttpGet("GetVehicles")]
        public IActionResult GetVehicles()
        {
            var vehicles = new List<object>();
            try
            {
                var cs = _configuration.GetConnectionString("DefaultConnection");
                using var con = new SqlConnection(cs);
                con.Open();
                const string query = "SELECT Id, Vehiclename, Vehicleno FROM Tbl_Vehicledetails WHERE Isdelete = 0";
                using var cmd = new SqlCommand(query, con);
                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    vehicles.Add(new
                    {
                        Id = reader["Id"]?.ToString() ?? "",
                        Name = reader["Vehiclename"]?.ToString() ?? "",
                        No = reader["Vehicleno"]?.ToString() ?? ""
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }

            return Ok(vehicles);
        }

        public class Stockadjustment
        {
            public int Id { get; set; }
            public string? Userid { get; set; }
            public string? Username { get; set; }
            public string? Modeof_adjustment { get; set; }
            public string? Referenceno { get; set; }
            public string? Dateenter { get; set; }
            public string? Accountname { get; set; }
            public string? Remarks { get; set; }
            public string? Status { get; set; }
            public string? Editreason { get; set; }
            public string? Logid { get; set; }
            public string? Logtype { get; set; }
        }

        public class Attachment
        {
            public int id { get; set; }
            public string? name { get; set; }
            public string? path { get; set; }
        }

        public class Stockadjustmentdetails
        {
            public object? Itemid { get; set; }
            public object? Qty_avaiable { get; set; }
            public object? Newqty_onhand { get; set; }
            public object? Qty_adjusted { get; set; }
            public string? Itemname { get; set; }
            public object? Warehouseid { get; set; }
            public string? Warehousename { get; set; }
            public object? Reason { get; set; }
            public string? Reasontext { get; set; }
            public object? Description { get; set; }
        }
    }
}

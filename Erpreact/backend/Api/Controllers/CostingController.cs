using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using Newtonsoft.Json;
using System.Globalization;

namespace Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CostingController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public CostingController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet("sessions")]
        public async Task<IActionResult> GetSessions([FromQuery] string status = "")
        {
            try
            {
                var list = new List<Dictionary<string, object>>();
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (var con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();
                    string sql = @"SELECT h.*, 
                                          s.Supplierdisplayname as SupplierName,
                                          p.Billno as InvoiceNo
                                 FROM Tbl_Costing h
                                 LEFT JOIN Tbl_Supplier s ON h.Supplierid = s.Id
                                 LEFT JOIN Tbl_Purchase p ON h.Purchaseid = p.Id
                                 WHERE (@Status = '' OR h.Status = @Status)
                                 ORDER BY h.Enterdate DESC";
                    
                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@Status", status ?? "");
                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var dict = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    dict[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                }
                                list.Add(dict);
                            }
                        }
                    }
                }
                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("bill-items/{billId}")]
        public async Task<IActionResult> GetBillItems(int billId)
        {
            var items = new List<Dictionary<string, object>>();
            string connectionString = _configuration.GetConnectionString("DefaultConnection");

            try
            {
                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    // We use a comprehensive query to get all needed fields for Margin Calculations
                    string itemQuery = @"
                        SELECT d.*, v.Itemname, v.Productid as ProductCode, v.Serialized, vt.Vatvalue
                        FROM Tbl_Purchasebilldetails d 
                        LEFT JOIN Tbl_Productvariants v ON d.Itemid = v.Id 
                        LEFT JOIN Tbl_Vat vt ON d.Vat_id = vt.Id
                        WHERE d.Billid = @Billid AND (d.Isdelete = 0 OR d.Isdelete = '0' OR d.Isdelete IS NULL)";

                    using (var cmd = new SqlCommand(itemQuery, connection))
                    {
                        cmd.Parameters.AddWithValue("@Billid", billId);
                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var row = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                }
                                items.Add(row);
                            }
                        }
                    }
                }
                return Ok(new { success = true, data = items });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("last-costs")]
        public async Task<IActionResult> GetLastCosts([FromBody] LastCostRequest request)
        {
            if (request == null || request.ItemIds == null || request.ItemIds.Count == 0)
            {
                return Ok(new { success = true, data = new List<object>() });
            }

            var results = new List<Dictionary<string, object>>();
            string connectionString = _configuration.GetConnectionString("DefaultConnection");

            try
            {
                using (var con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();
                    const string sql = @"
                        SELECT TOP 1
                            Itemid       AS ItemId,
                            Aedprice     AS AedPrice,
                            Cost         AS Cost,
                            Totalcost    AS TotalCost,
                            Diamondmargin,
                            Diamondmsp,
                            Goldmargin,
                            Goldmsp,
                            Silvermargin,
                            Silvermsp,
                            Id           AS ProductCostRowId,
                            Costid       AS CostSessionId,
                            Purchaseid   AS PurchaseId
                        FROM Tbl_Productcost
                        WHERE Itemid = @Itemid AND (Isdelete = 0 OR Isdelete = '0' OR Isdelete IS NULL)
                        ORDER BY Id DESC;";

                    foreach (var itemId in request.ItemIds)
                    {
                        using (var cmd = new SqlCommand(sql, con))
                        {
                            cmd.Parameters.AddWithValue("@Itemid", itemId);
                            using (var reader = await cmd.ExecuteReaderAsync())
                            {
                                if (await reader.ReadAsync())
                                {
                                    var row = new Dictionary<string, object>();
                                    for (int i = 0; i < reader.FieldCount; i++)
                                    {
                                        row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                    }
                                    results.Add(row);
                                }
                            }
                        }
                    }
                }

                return Ok(new { success = true, data = results });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("save-session")]
        public IActionResult SaveCostingSession([FromBody] PurchaseViewModel model)
        {
            if (model == null)
                return BadRequest(new { success = false, message = "Invalid data." });

            int costId;

            string connectionString = _configuration.GetConnectionString("DefaultConnection");

            using (SqlConnection con = new SqlConnection(connectionString))
            {
                con.Open();
                SqlTransaction transaction = con.BeginTransaction();

                try
                {
                    using (SqlCommand cmd = new SqlCommand("Sp_Costing", con, transaction))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Userid", model.UserId ?? "1");
                        cmd.Parameters.AddWithValue("@Supplierid", model.SupplierId);
                        cmd.Parameters.AddWithValue("@Purchaseid", model.Purchaseid);
                        cmd.Parameters.AddWithValue("@Exchangerate", Convert.ToDecimal(model.Exchangerate));
                        cmd.Parameters.AddWithValue("@Cargocost", Convert.ToDecimal(model.CargoCost));
                        cmd.Parameters.AddWithValue("@Expensecost", Convert.ToDecimal(model.ExpenseCost));
                        cmd.Parameters.AddWithValue("@Totalcost", Convert.ToDecimal(model.TotalCost));
                        // Some environments require @Enterdate; provide a value to satisfy the stored procedure
                        cmd.Parameters.AddWithValue("@Enterdate", DateTime.UtcNow);
                        cmd.Parameters.AddWithValue("@Status", "Draft");
                        cmd.Parameters.AddWithValue("@Isdelete", 0);
                        cmd.Parameters.AddWithValue("@Query", 1);

                        costId = Convert.ToInt32(cmd.ExecuteScalar());
                    }

                    if (model.Invoices != null)
                    {
                        foreach (var invoice in model.Invoices)
                        {
                            using (SqlCommand cmd = new SqlCommand("Sp_Expensecost", con, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Id", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Costid", costId);
                                cmd.Parameters.AddWithValue("@Vendorid", invoice.VendorId);
                                cmd.Parameters.AddWithValue("@Invoiceno", invoice.InvoiceId);
                                cmd.Parameters.AddWithValue("@Amount", Convert.ToDecimal(invoice.Amount));
                                cmd.Parameters.AddWithValue("@Status", "Active");
                                cmd.Parameters.AddWithValue("@Isdelete", 0);
                                cmd.Parameters.AddWithValue("@Query", 1);
                                cmd.ExecuteNonQuery();
                            }
                        }
                    }

                    if (model.MarginItems != null)
                    {
                        foreach (var item in model.MarginItems)
                        {
                            using (SqlCommand cmd = new SqlCommand("Sp_Productcost", con, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Id", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Costid", costId);
                                cmd.Parameters.AddWithValue("@Purchaseid", model.Purchaseid);
                                cmd.Parameters.AddWithValue("@Itemid", item.ItemId);
                                cmd.Parameters.AddWithValue("@Qty", Convert.ToInt32(item.Qty));
                                cmd.Parameters.AddWithValue("@Aedprice", Convert.ToDecimal(item.AedPrice));
                                cmd.Parameters.AddWithValue("@Cost", Convert.ToDecimal(item.Cost));
                                cmd.Parameters.AddWithValue("@Totalcost", Convert.ToDecimal(item.Totalcost));

                                cmd.Parameters.AddWithValue("@Diamondmargin", Convert.ToDecimal(item.Diamondmargin));
                                cmd.Parameters.AddWithValue("@Diamondmsp", Convert.ToDecimal(item.Diamondmsp));

                                cmd.Parameters.AddWithValue("@Goldmargin", Convert.ToDecimal(item.Goldmargin));
                                cmd.Parameters.AddWithValue("@Goldmsp", Convert.ToDecimal(item.Goldmsp));

                                cmd.Parameters.AddWithValue("@Silvermargin", Convert.ToDecimal(item.Silvermargin));
                                cmd.Parameters.AddWithValue("@Silvermsp", Convert.ToDecimal(item.Silvermsp));

                                cmd.Parameters.AddWithValue("@Status", "Draft");
                                cmd.Parameters.AddWithValue("@Isdelete", 0);
                                cmd.Parameters.AddWithValue("@Query", 1);
                                cmd.ExecuteNonQuery();
                            }
                        }
                    }

                    transaction.Commit();
                    return Ok(new { success = true, message = "Saved successfully!" });
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    return BadRequest(new { success = false, message = ex.Message });
                }
            }
        }

        [HttpPost("edit-session")]
        public IActionResult EditCostingSession([FromBody] PurchaseViewModel model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.Id))
                return BadRequest(new { success = false, message = "Invalid data." });

            string connectionString = _configuration.GetConnectionString("DefaultConnection");

            using (SqlConnection con = new SqlConnection(connectionString))
            {
                con.Open();
                SqlTransaction transaction = con.BeginTransaction();

                try
                {
                    decimal ParseDecimal(string? s)
                    {
                        if (string.IsNullOrWhiteSpace(s)) return 0m;
                        if (decimal.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var d)) return d;
                        if (decimal.TryParse(s, NumberStyles.Any, CultureInfo.CurrentCulture, out d)) return d;
                        return 0m;
                    }
                    int ParseInt(string? s)
                    {
                        if (string.IsNullOrWhiteSpace(s)) return 0;
                        if (int.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var v)) return v;
                        if (int.TryParse(s, NumberStyles.Any, CultureInfo.CurrentCulture, out v)) return v;
                        return 0;
                    }

                    // Ensure we have a valid numeric Id for DB operations
                    int costIdInt = ParseInt(model.Id);
                    if (costIdInt <= 0)
                    {
                        return BadRequest(new { success = false, message = "Invalid session Id." });
                    }

                    // Update header
                    using (SqlCommand cmd = new SqlCommand("Sp_Costing", con, transaction))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", costIdInt);
                        cmd.Parameters.AddWithValue("@Userid", model.UserId ?? "1");
                        // Normalize SupplierId and Purchaseid to integers when possible
                        var supplierIdInt = ParseInt(model.SupplierId);
                        var purchaseIdInt = ParseInt(model.Purchaseid);
                        cmd.Parameters.AddWithValue("@Supplierid", supplierIdInt > 0 ? supplierIdInt : (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Purchaseid", purchaseIdInt > 0 ? purchaseIdInt : (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Exchangerate", ParseDecimal(model.Exchangerate));
                        cmd.Parameters.AddWithValue("@Cargocost", ParseDecimal(model.CargoCost));
                        cmd.Parameters.AddWithValue("@Expensecost", ParseDecimal(model.ExpenseCost));
                        cmd.Parameters.AddWithValue("@Totalcost", ParseDecimal(model.TotalCost));
                        cmd.Parameters.AddWithValue("@Status", "Draft");
                        cmd.Parameters.AddWithValue("@Isdelete", 0);
                        cmd.Parameters.AddWithValue("@Enterdate", DateTime.UtcNow);
                        cmd.Parameters.AddWithValue("@Query", 3);
                        cmd.ExecuteNonQuery();
                    }

                    // Clear existing expenses for this cost id
                    using (SqlCommand cmd = new SqlCommand("Sp_Expensecost", con, transaction))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Costid", costIdInt);
                        cmd.Parameters.AddWithValue("@Vendorid", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Invoiceno", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Status", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Isdelete", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Query", 3);
                        cmd.ExecuteNonQuery();
                    }

                    // Insert current expenses
                    if (model.Invoices != null)
                    {
                        foreach (var invoice in model.Invoices)
                        {
                            using (SqlCommand cmd = new SqlCommand("Sp_Expensecost", con, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Id", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Costid", costIdInt);
                                cmd.Parameters.AddWithValue("@Vendorid", invoice.VendorId ?? (object)DBNull.Value);
                                cmd.Parameters.AddWithValue("@Invoiceno", invoice.InvoiceId ?? (object)DBNull.Value);
                                cmd.Parameters.AddWithValue("@Status", "Active");
                                cmd.Parameters.AddWithValue("@Isdelete", 0);
                                cmd.Parameters.AddWithValue("@Amount", ParseDecimal(invoice.Amount));
                                cmd.Parameters.AddWithValue("@Query", 1);
                                cmd.ExecuteNonQuery();
                            }
                        }
                    }

                    // Clear existing product costs for this cost id
                    using (SqlCommand cmd = new SqlCommand("Sp_Productcost", con, transaction))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Costid", costIdInt);
                        cmd.Parameters.AddWithValue("@Purchaseid", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Itemid", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Aedprice", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Cost", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Totalcost", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Diamondmargin", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Diamondmsp", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Goldmargin", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Goldmsp", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Silvermargin", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Silvermsp", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Status", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Isdelete", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Query", 3);
                        cmd.ExecuteNonQuery();
                    }

                    // Insert product cost items
                    if (model.MarginItems != null)
                    {
                        foreach (var item in model.MarginItems)
                        {
                            // Validate required item fields
                            var itemIdInt = ParseInt(item.ItemId);
                            var qtyInt = ParseInt(item.Qty);
                            if (itemIdInt <= 0 || qtyInt <= 0)
                            {
                                // Skip invalid line to avoid breaking the whole transaction
                                continue;
                            }

                            using (SqlCommand cmd = new SqlCommand("Sp_Productcost", con, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Id", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Costid", costIdInt);
                                cmd.Parameters.AddWithValue("@Purchaseid", ParseInt(model.Purchaseid) > 0 ? ParseInt(model.Purchaseid) : (object)DBNull.Value);
                                cmd.Parameters.AddWithValue("@Itemid", itemIdInt);
                                cmd.Parameters.AddWithValue("@Aedprice", ParseDecimal(item.AedPrice));
                                cmd.Parameters.AddWithValue("@Cost", ParseDecimal(item.Cost));
                                cmd.Parameters.AddWithValue("@Totalcost", ParseDecimal(item.Totalcost));
                                cmd.Parameters.AddWithValue("@Diamondmargin", ParseDecimal(item.Diamondmargin));
                                cmd.Parameters.AddWithValue("@Diamondmsp", ParseDecimal(item.Diamondmsp));
                                cmd.Parameters.AddWithValue("@Goldmargin", ParseDecimal(item.Goldmargin));
                                cmd.Parameters.AddWithValue("@Goldmsp", ParseDecimal(item.Goldmsp));
                                cmd.Parameters.AddWithValue("@Silvermargin", ParseDecimal(item.Silvermargin));
                                cmd.Parameters.AddWithValue("@Silvermsp", ParseDecimal(item.Silvermsp));
                                cmd.Parameters.AddWithValue("@Status", "Draft");
                                cmd.Parameters.AddWithValue("@Isdelete", 0);
                                cmd.Parameters.AddWithValue("@Qty", qtyInt);
                                cmd.Parameters.AddWithValue("@Query", 1);
                                cmd.ExecuteNonQuery();
                            }
                        }
                    }

                    // Write cost log
                    using (SqlCommand cmd = new SqlCommand("Sp_Costlog", con, transaction))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", DBNull.Value);
                        cmd.Parameters.AddWithValue("@Userid", model.UserId ?? "1");
                        cmd.Parameters.AddWithValue("@Costid", costIdInt);
                        cmd.Parameters.AddWithValue("@Updateddate", DateTime.UtcNow);
                        cmd.Parameters.AddWithValue("@Status", "Updated");
                        cmd.Parameters.AddWithValue("@Query", 1);
                        cmd.ExecuteNonQuery();
                    }

                    transaction.Commit();
                    return Ok(new { success = true, message = "Updated successfully!" });
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    return BadRequest(new { success = false, message = ex.Message });
                }
            }
        }
        [HttpGet("set-status")]
        public async Task<IActionResult> Setstatuscost([FromQuery] string costId)
        {
            string message;
            string connectionString = _configuration.GetConnectionString("DefaultConnection");

            try
            {
                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();

                    using (var command = new SqlCommand("Sp_Costing", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;

                        command.Parameters.AddWithValue("@Id", costId);
                        command.Parameters.AddWithValue("@Status", "Approved");
                        command.Parameters.AddWithValue("@Userid", DBNull.Value);
                        command.Parameters.AddWithValue("@Supplierid", DBNull.Value);
                        command.Parameters.AddWithValue("@Purchaseid", DBNull.Value);
                        command.Parameters.AddWithValue("@Exchangerate", DBNull.Value);
                        command.Parameters.AddWithValue("@Cargocost", DBNull.Value);
                        command.Parameters.AddWithValue("@Expensecost", DBNull.Value);
                        command.Parameters.AddWithValue("@Totalcost", DBNull.Value);
                        command.Parameters.AddWithValue("@Isdelete", DBNull.Value);
                        command.Parameters.AddWithValue("@Enterdate", DateTime.UtcNow);
                        command.Parameters.AddWithValue("@Query", 5);

                        await command.ExecuteNonQueryAsync();
                    }

                    DataTable dt = new DataTable();
                    using (var fetchCommand = new SqlCommand("Sp_Productcost", connection))
                    {
                        fetchCommand.CommandType = CommandType.StoredProcedure;
                        fetchCommand.Parameters.AddWithValue("@Id", DBNull.Value);
                        fetchCommand.Parameters.AddWithValue("@Costid", costId);
                        fetchCommand.Parameters.AddWithValue("@Purchaseid", DBNull.Value);
                        fetchCommand.Parameters.AddWithValue("@Itemid", DBNull.Value);
                        fetchCommand.Parameters.AddWithValue("@Aedprice", DBNull.Value);
                        fetchCommand.Parameters.AddWithValue("@Cost", DBNull.Value);
                        fetchCommand.Parameters.AddWithValue("@TotalCost", DBNull.Value);
                        fetchCommand.Parameters.AddWithValue("@Diamondmargin", DBNull.Value);
                        fetchCommand.Parameters.AddWithValue("@Diamondmsp", DBNull.Value);
                        fetchCommand.Parameters.AddWithValue("@Goldmargin", DBNull.Value);
                        fetchCommand.Parameters.AddWithValue("@Goldmsp", DBNull.Value);
                        fetchCommand.Parameters.AddWithValue("@Silvermargin", DBNull.Value);
                        fetchCommand.Parameters.AddWithValue("@Silvermsp", DBNull.Value);
                        fetchCommand.Parameters.AddWithValue("@Isdelete", DBNull.Value);
                        fetchCommand.Parameters.AddWithValue("@Status", DBNull.Value);
                        fetchCommand.Parameters.AddWithValue("@Query", 7);

                        using (SqlDataAdapter da = new SqlDataAdapter(fetchCommand))
                        {
                            da.Fill(dt);
                        }
                    }

                    foreach (DataRow row in dt.Rows)
                    {
                        string itemid = row["Itemid"].ToString();

                        using (var archiveCmd = new SqlCommand("Sp_Productcost", connection))
                        {
                            archiveCmd.CommandType = CommandType.StoredProcedure;
                            archiveCmd.Parameters.AddWithValue("@Id", DBNull.Value);
                            archiveCmd.Parameters.AddWithValue("@Costid", DBNull.Value);
                            archiveCmd.Parameters.AddWithValue("@Purchaseid", DBNull.Value);
                            archiveCmd.Parameters.AddWithValue("@Itemid", itemid);
                            archiveCmd.Parameters.AddWithValue("@Qty", DBNull.Value);
                            archiveCmd.Parameters.AddWithValue("@Aedprice", DBNull.Value);
                            archiveCmd.Parameters.AddWithValue("@Cost", DBNull.Value);
                            archiveCmd.Parameters.AddWithValue("@TotalCost", DBNull.Value);
                            archiveCmd.Parameters.AddWithValue("@Diamondmargin", DBNull.Value);
                            archiveCmd.Parameters.AddWithValue("@Diamondmsp", DBNull.Value);
                            archiveCmd.Parameters.AddWithValue("@Goldmargin", DBNull.Value);
                            archiveCmd.Parameters.AddWithValue("@Goldmsp", DBNull.Value);
                            archiveCmd.Parameters.AddWithValue("@Silvermargin", DBNull.Value);
                            archiveCmd.Parameters.AddWithValue("@Silvermsp", DBNull.Value);
                            archiveCmd.Parameters.AddWithValue("@Isdelete", "0");
                            archiveCmd.Parameters.AddWithValue("@Status", "Archived");
                            archiveCmd.Parameters.AddWithValue("@Status1", "Approved");
                            archiveCmd.Parameters.AddWithValue("@Query", 6);
                            await archiveCmd.ExecuteNonQueryAsync();
                        }

                        using (SqlCommand cmd = new SqlCommand("Sp_Productcost", connection))
                        {
                            cmd.CommandType = CommandType.StoredProcedure;
                            cmd.Parameters.AddWithValue("@Id", DBNull.Value);
                            cmd.Parameters.AddWithValue("@Costid", costId);
                            cmd.Parameters.AddWithValue("@Purchaseid", DBNull.Value);
                            cmd.Parameters.AddWithValue("@Itemid", itemid);
                            cmd.Parameters.AddWithValue("@Qty", row["Qty"]);
                            cmd.Parameters.AddWithValue("@Aedprice", row["Aedprice"]);
                            cmd.Parameters.AddWithValue("@Cost", DBNull.Value);
                            cmd.Parameters.AddWithValue("@TotalCost", DBNull.Value);
                            cmd.Parameters.AddWithValue("@Diamondmargin", DBNull.Value);
                            cmd.Parameters.AddWithValue("@Diamondmsp", DBNull.Value);
                            cmd.Parameters.AddWithValue("@Goldmargin", DBNull.Value);
                            cmd.Parameters.AddWithValue("@Goldmsp", DBNull.Value);
                            cmd.Parameters.AddWithValue("@Silvermargin", DBNull.Value);
                            cmd.Parameters.AddWithValue("@Silvermsp", DBNull.Value);
                            cmd.Parameters.AddWithValue("@Status", DBNull.Value);
                            cmd.Parameters.AddWithValue("@Isdelete", DBNull.Value);
                            cmd.Parameters.AddWithValue("@Query", 8);
                            await cmd.ExecuteNonQueryAsync();
                        }

                        using (var insertCmd = new SqlCommand("Sp_Productcost", connection))
                        {
                            insertCmd.CommandType = CommandType.StoredProcedure;
                            insertCmd.Parameters.AddWithValue("@Id", DBNull.Value);
                            insertCmd.Parameters.AddWithValue("@Costid", costId);
                            insertCmd.Parameters.AddWithValue("@Purchaseid", row["Purchaseid"]);
                            insertCmd.Parameters.AddWithValue("@Itemid", itemid);
                            insertCmd.Parameters.AddWithValue("@Aedprice", row["Aedprice"]);
                            insertCmd.Parameters.AddWithValue("@Cost", row["Cost"]);
                            insertCmd.Parameters.AddWithValue("@TotalCost", row["Totalcost"]);
                            insertCmd.Parameters.AddWithValue("@Diamondmargin", row["Diamondmargin"]);
                            insertCmd.Parameters.AddWithValue("@Diamondmsp", row["Diamondmsp"]);
                            insertCmd.Parameters.AddWithValue("@Goldmargin", row["Goldmargin"]);
                            insertCmd.Parameters.AddWithValue("@Goldmsp", row["Goldmsp"]);
                            insertCmd.Parameters.AddWithValue("@Silvermargin", row["Silvermargin"]);
                            insertCmd.Parameters.AddWithValue("@Silvermsp", row["Silvermsp"]);
                            insertCmd.Parameters.AddWithValue("@Isdelete", "0");
                            insertCmd.Parameters.AddWithValue("@Status", "Approved");
                            insertCmd.Parameters.AddWithValue("@Qty", row["Qty"]);
                            insertCmd.Parameters.AddWithValue("@Query", 1);
                            await insertCmd.ExecuteNonQueryAsync();
                        }
                    }

                    message = "Purchase cost is approved";
                }
                return Ok(new { success = true, message = message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = "An error occurred: " + ex.Message });
            }
        }

        [HttpGet("expenses/{costId}")]
        public async Task<IActionResult> GetExpenses(int costId)
        {
            var list = new List<Dictionary<string, object>>();
            string connectionString = _configuration.GetConnectionString("DefaultConnection");
            try
            {
                using (var con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();
                    // Try new canonical table first
                    const string sqlPrimary = @"
                        SELECT e.Id,
                               e.Costid       AS CostId,
                               e.Vendorid     AS VendorId,
                               s.Supplierdisplayname AS VendorName,
                               e.Invoiceno    AS InvoiceNo,
                               e.Amount,
                               e.Status,
                               e.Isdelete,
                               NULL           AS Enterdate
                        FROM Tbl_Expensecost e
                        LEFT JOIN Tbl_Supplier s ON e.Vendorid = s.Id
                        WHERE e.Costid = @CostId AND (e.Isdelete = 0 OR e.Isdelete = '0' OR e.Isdelete IS NULL)
                        ORDER BY e.Id DESC;";
                    // Some databases use 'Tbl_Expensecosting' instead. Fallback query for that schema.
                    const string sqlFallback = @"
                        SELECT e.Id,
                               e.Costid       AS CostId,
                               e.Vendorid     AS VendorId,
                               s.Supplierdisplayname AS VendorName,
                               e.Invoiceno    AS InvoiceNo,
                               e.Amount,
                               e.Status,
                               e.Isdelete,
                               NULL           AS Enterdate
                        FROM Tbl_Expensecosting e
                        LEFT JOIN Tbl_Supplier s ON e.Vendorid = s.Id
                        WHERE e.Costid = @CostId AND (e.Isdelete = 0 OR e.Isdelete = '0' OR e.Isdelete IS NULL)
                        ORDER BY e.Id DESC;";

                    // Helper local function to execute a query and accumulate rows
                    async Task ExecuteAndAddAsync(string sqlText)
                    {
                        using (var cmd = new SqlCommand(sqlText, con))
                        {
                            cmd.Parameters.AddWithValue("@CostId", costId);
                            using (var reader = await cmd.ExecuteReaderAsync())
                            {
                                while (await reader.ReadAsync())
                                {
                                    var row = new Dictionary<string, object>();
                                    for (int i = 0; i < reader.FieldCount; i++)
                                    {
                                        row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                    }
                                    list.Add(row);
                                }
                            }
                        }
                    }

                    try
                    {
                        await ExecuteAndAddAsync(sqlPrimary);
                    }
                    catch (SqlException ex) when (ex.Number == 208) // Invalid object name
                    {
                        // ignore; try fallback
                    }

                    // If primary returned nothing, or table missing, try fallback table
                    if (list.Count == 0)
                    {
                        try
                        {
                            await ExecuteAndAddAsync(sqlFallback);
                        }
                        catch (SqlException ex) when (ex.Number == 208)
                        {
                            // both tables missing; will return empty list below
                        }
                    }
                }
                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        public class PurchaseViewModel
        {
            public string? Id { get; set; }
            public string? SupplierId { get; set; }
            public string? Purchaseid { get; set; }
            public string? CargoCost { get; set; }
            public string? ExpenseCost { get; set; }
            public string? TotalCost { get; set; }
            public string? Exchangerate { get; set; }
            public string? UserId { get; set; }
            public List<InvoiceViewModel>? Invoices { get; set; }
            public List<MarginItemViewModel>? MarginItems { get; set; }
        }

        public class InvoiceViewModel
        {
            public string? VendorId { get; set; }
            public string? InvoiceId { get; set; }
            public string? Amount { get; set; }
        }

        public class MarginItemViewModel
        {
            public string? ItemId { get; set; }
            public string? ItemName { get; set; }
            public string? Qty { get; set; }
            public string? UnitPrice { get; set; }
            public string? AedPrice { get; set; }
            public string? Cost { get; set; }
            public string? Totalcost { get; set; }
            public string? Diamondmargin { get; set; }
            public string? Diamondmsp { get; set; }
            public string? Goldmargin { get; set; }
            public string? Goldmsp { get; set; }
            public string? Silvermargin { get; set; }
            public string? Silvermsp { get; set; }
        }

        public class LastCostRequest
        {
            public List<int> ItemIds { get; set; }
        }
    }
}

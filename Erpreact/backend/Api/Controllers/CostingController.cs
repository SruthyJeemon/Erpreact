using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using Newtonsoft.Json;

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
                    string sql = @"SELECT h.*, s.Supplierdisplayname as SupplierName 
                                 FROM Tbl_Costing h
                                 LEFT JOIN Tbl_Supplier s ON h.Supplierid = s.Id
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

        public class PurchaseViewModel
        {
            public string SupplierId { get; set; }
            public string Purchaseid { get; set; }
            public string CargoCost { get; set; }
            public string ExpenseCost { get; set; }
            public string TotalCost { get; set; }
            public string Exchangerate { get; set; }
            public string UserId { get; set; }
            public List<InvoiceViewModel> Invoices { get; set; }
            public List<MarginItemViewModel> MarginItems { get; set; }
        }

        public class InvoiceViewModel
        {
            public string VendorId { get; set; }
            public string InvoiceId { get; set; }
            public string Amount { get; set; }
        }

        public class MarginItemViewModel
        {
            public string ItemId { get; set; }
            public string ItemName { get; set; }
            public string Qty { get; set; }
            public string UnitPrice { get; set; }
            public string AedPrice { get; set; }
            public string Cost { get; set; }
            public string Totalcost { get; set; }
            public string Diamondmargin { get; set; }
            public string Diamondmsp { get; set; }
            public string Goldmargin { get; set; }
            public string Goldmsp { get; set; }
            public string Silvermargin { get; set; }
            public string Silvermsp { get; set; }
        }
    }
}

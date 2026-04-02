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
                    // Using Sp_Purchase Query 10 which typically gets details for a bill
                    using (var cmd = new SqlCommand("Sp_Purchasebilldetails", connection))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Billid", billId);
                        cmd.Parameters.AddWithValue("@Query", 3); // Query 3 is usually 'Select by BillId'

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
        public async Task<IActionResult> SaveCostingSession([FromBody] CostingSession model)
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
                            int costingId = 0;
                            string sqlHeader = @"INSERT INTO Tbl_Costing (Userid, Supplierid, Purchaseid, Exchangerate, Cargocost, Expensecost, Totalcost, Status, Isdelete, Enterdate)
                                   VALUES (@Userid, @Supplierid, @Purchaseid, @Exchangerate, @Cargocost, @Expensecost, @Totalcost, @Status, 0, GETDATE());
                                   SELECT SCOPE_IDENTITY();";

                            using (var cmdHeader = new SqlCommand(sqlHeader, connection, transaction))
                            {
                                cmdHeader.Parameters.AddWithValue("@Userid", model.UserId ?? "1");
                                cmdHeader.Parameters.AddWithValue("@Supplierid", model.SupplierId);
                                cmdHeader.Parameters.AddWithValue("@Purchaseid", model.BillId);
                                cmdHeader.Parameters.AddWithValue("@Exchangerate", model.ExchangeRate > 0 ? model.ExchangeRate : 3.67m);
                                cmdHeader.Parameters.AddWithValue("@Cargocost", 0);
                                cmdHeader.Parameters.AddWithValue("@Expensecost", model.TotalExpenses);
                                cmdHeader.Parameters.AddWithValue("@Totalcost", model.TotalBaseCost + model.TotalExpenses);
                                cmdHeader.Parameters.AddWithValue("@Status", "Approved");

                                costingId = Convert.ToInt32(await cmdHeader.ExecuteScalarAsync());
                            }

                            foreach (var item in model.Items)
                            {
                                string sqlDetail = @"INSERT INTO Tbl_ProductCost (Costid, Purchaseid, Itemid, Aedprice, Cost, Totalcost, 
                                                               Diamondmargin, Diamondmsp, Goldmargin, Goldmsp, Silvermargin, Silvermsp, Status, Isdelete, Qty)
                                   VALUES (@Costid, @Purchaseid, @Itemid, @Aedprice, @Cost, @Totalcost, 
                                           @Diamondmargin, @Diamondmsp, @Goldmargin, @Goldmsp, @Silvermargin, @Silvermsp, @Status, 0, @Qty)";
                                
                                using (var cmdDetail = new SqlCommand(sqlDetail, connection, transaction))
                                {
                                    cmdDetail.Parameters.AddWithValue("@Costid", costingId);
                                    cmdDetail.Parameters.AddWithValue("@Purchaseid", model.BillId);
                                    cmdDetail.Parameters.AddWithValue("@Itemid", item.VariantId);
                                    cmdDetail.Parameters.AddWithValue("@Aedprice", item.UnitCost);
                                    cmdDetail.Parameters.AddWithValue("@Cost", item.LandedCost);
                                    cmdDetail.Parameters.AddWithValue("@Totalcost", item.LandedCost * item.Qty);
                                    cmdDetail.Parameters.AddWithValue("@Diamondmargin", 40);
                                    cmdDetail.Parameters.AddWithValue("@Diamondmsp", item.DiamondESP);
                                    cmdDetail.Parameters.AddWithValue("@Goldmargin", 40);
                                    cmdDetail.Parameters.AddWithValue("@Goldmsp", item.GoldESP);
                                    cmdDetail.Parameters.AddWithValue("@Silvermargin", 40);
                                    cmdDetail.Parameters.AddWithValue("@Silvermsp", item.SilverESP);
                                    cmdDetail.Parameters.AddWithValue("@Status", "Approved");
                                    cmdDetail.Parameters.AddWithValue("@Qty", item.Qty);
                                    await cmdDetail.ExecuteNonQueryAsync();
                                }

                                string updatePrice = "UPDATE Tbl_Productvariants SET Landedcost = @LCost WHERE Id = @Vid";
                                using (var cmdPrice = new SqlCommand(updatePrice, connection, transaction))
                                {
                                    cmdPrice.Parameters.AddWithValue("@LCost", item.LandedCost);
                                    cmdPrice.Parameters.AddWithValue("@Vid", item.VariantId);
                                    await cmdPrice.ExecuteNonQueryAsync();
                                }
                            }

                            transaction.Commit();
                            return Ok(new { success = true, message = "Costing session finalized successfully" });
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            throw ex;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        public class CostingSession
        {
            public int SupplierId { get; set; }
            public int BillId { get; set; }
            public decimal TotalBaseCost { get; set; }
            public decimal TotalExpenses { get; set; }
            public decimal ExchangeRate { get; set; }
            public string UserId { get; set; }
            public string CatalogId { get; set; }
            public List<CostingItem> Items { get; set; }
        }

        public class CostingItem
        {
            public int ProductId { get; set; }
            public int VariantId { get; set; }
            public decimal Qty { get; set; }
            public decimal UnitCost { get; set; }
            public decimal LandedCost { get; set; }
            public decimal DiamondESP { get; set; }
            public decimal GoldESP { get; set; }
            public decimal SilverESP { get; set; }
        }
    }
}

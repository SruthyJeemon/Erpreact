using Api;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PackingListController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public PackingListController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        private static string ResolveRole(SqlConnection con, string? userid)
        {
            if (string.IsNullOrWhiteSpace(userid)) return "";
            using var cmd = new SqlCommand(
                "SELECT TOP 1 Role FROM Tbl_Registration WHERE Userid = @U OR CAST(Id AS VARCHAR(50)) = @U",
                con);
            cmd.Parameters.AddWithValue("@U", userid.Trim());
            var o = cmd.ExecuteScalar();
            return o?.ToString() ?? "";
        }

        private static Dictionary<string, object?> RowToDict(DataTable dt, DataRow row)
        {
            var d = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            foreach (DataColumn c in dt.Columns)
                d[c.ColumnName] = row.IsNull(c) ? null : row[c];
            return d;
        }

        private static void EnrichLineStats(SqlConnection con, string? salesQuoteId, Dictionary<string, object?> d)
        {
            if (string.IsNullOrWhiteSpace(salesQuoteId)) return;
            using var cmd = new SqlCommand(
                """
                SELECT COUNT(*) AS LineCount,
                       ISNULL(SUM(TRY_CAST(REPLACE(REPLACE(LTRIM(RTRIM(ISNULL(Qty,'0'))), ',',''), ' ','') AS DECIMAL(18,4))), 0) AS SumQty
                FROM Tbl_Salesquotedetails
                WHERE LTRIM(RTRIM(CAST(Salesquoteid AS NVARCHAR(50)))) = LTRIM(RTRIM(@Q))
                  AND (Isdelete IS NULL OR Isdelete = '' OR Isdelete = '0' OR Isdelete = 0)
                """,
                con);
            cmd.Parameters.AddWithValue("@Q", salesQuoteId.Trim());
            using var r = cmd.ExecuteReader();
            if (!r.Read()) return;
            d["ItemsCount"] = r.IsDBNull(0) ? 0 : Convert.ToInt32(r.GetValue(0), System.Globalization.CultureInfo.InvariantCulture);
            d["TotalQty"] = r.IsDBNull(1) ? 0m : Convert.ToDecimal(r.GetValue(1), System.Globalization.CultureInfo.InvariantCulture);
        }

        private static void AddSpSalesquotePendingParams(SqlCommand cmd)
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Id", 0);
            cmd.Parameters.AddWithValue("@Userid", "");
            cmd.Parameters.AddWithValue("@Customerid", "");
            cmd.Parameters.AddWithValue("@Billdate", "");
            cmd.Parameters.AddWithValue("@Duedate", "");
            cmd.Parameters.AddWithValue("@Salesquoteno", "");
            cmd.Parameters.AddWithValue("@Amountsare", "");
            cmd.Parameters.AddWithValue("@Vatnumber", "");
            cmd.Parameters.AddWithValue("@Billing_address", "");
            cmd.Parameters.AddWithValue("@Sales_location", "");
            cmd.Parameters.AddWithValue("@Sub_total", "");
            cmd.Parameters.AddWithValue("@Vat", "");
            cmd.Parameters.AddWithValue("@Vat_amount", "");
            cmd.Parameters.AddWithValue("@Grand_total", "");
            cmd.Parameters.AddWithValue("@Conversion_amount", DBNull.Value);
            cmd.Parameters.AddWithValue("@Currency_rate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Currency", "");
            cmd.Parameters.AddWithValue("@Terms", "");
            cmd.Parameters.AddWithValue("@Managerapprovestatus", DBNull.Value);
            cmd.Parameters.AddWithValue("@Status", "");
            cmd.Parameters.AddWithValue("@Isdelete", 0);
            cmd.Parameters.AddWithValue("@Type", "");
            // Legacy MVC passed @Catelogid empty for Q16 (packing pending) even when Catelogid was resolved in code.
            cmd.Parameters.AddWithValue("@Catelogid", "");
            cmd.Parameters.AddWithValue("@Contact", "");
            cmd.Parameters.AddWithValue("@Phoneno", "");
            cmd.Parameters.AddWithValue("@Shipping_address", "");
            cmd.Parameters.AddWithValue("@Remarks", "");
            cmd.Parameters.AddWithValue("@Salespersonname", "");
            cmd.Parameters.AddWithValue("@Discounttype", "");
            cmd.Parameters.AddWithValue("@Discountvalue", "");
            cmd.Parameters.AddWithValue("@Discountamount", "");
            cmd.Parameters.AddWithValue("@fromdate", "");
            cmd.Parameters.AddWithValue("@todate", "");
            cmd.Parameters.AddWithValue("@Packinglist_status", "0");
            cmd.Parameters.AddWithValue("@Query", 16);
        }

        /// <summary>Legacy getpickuplistpending — Sp_Salesquote @Query=16, @Packinglist_status=0.</summary>
        [HttpGet("pending")]
        public IActionResult GetPending([FromQuery] string? userid)
        {
            var list = new List<Dictionary<string, object?>>();
            string role = "";
            try
            {
                var cs = _configuration.GetConnectionString("DefaultConnection");
                using var con = new SqlConnection(cs);
                con.Open();
                role = ResolveRole(con, userid);
                using (var cmd = new SqlCommand("Sp_Salesquote", con))
                {
                    AddSpSalesquotePendingParams(cmd);
                    using var da = new SqlDataAdapter(cmd);
                    var dt = new DataTable();
                    da.Fill(dt);
                    foreach (DataRow row in dt.Rows)
                    {
                        var d = RowToDict(dt, row);
                        var qid = d.TryGetValue("Id", out var idv) ? idv?.ToString() : null;
                        EnrichLineStats(con, qid, d);
                        list.Add(d);
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, List1 = list, role, totalCount = list.Count });
            }

            return Ok(new { List1 = list, role, totalCount = list.Count });
        }

        /// <summary>Legacy getpickuplistprogress — Sp_Packinglist @Query=3, @Status=Active,3,0,2.</summary>
        [HttpGet("in-progress")]
        public IActionResult GetInProgress([FromQuery] string? userid)
        {
            var list = new List<Dictionary<string, object?>>();
            try
            {
                var cs = _configuration.GetConnectionString("DefaultConnection");
                using var con = new SqlConnection(cs);
                con.Open();
                using (var cmd = new SqlCommand("Sp_Packinglist", con))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@Id", 0);
                    cmd.Parameters.AddWithValue("@Userid", "");
                    cmd.Parameters.AddWithValue("@Salesquoteid", "");
                    cmd.Parameters.AddWithValue("@Enterdate", DBNull.Value);
                    cmd.Parameters.AddWithValue("@Status", "Active,3,0,2");
                    cmd.Parameters.AddWithValue("@Isdelete", "");
                    cmd.Parameters.AddWithValue("@Query", 3);
                    using var da = new SqlDataAdapter(cmd);
                    var dt = new DataTable();
                    da.Fill(dt);
                    foreach (DataRow row in dt.Rows)
                    {
                        var d = RowToDict(dt, row);
                        var sq = d.TryGetValue("Salesquoteid", out var sqv) ? sqv?.ToString() : null;
                        EnrichLineStats(con, sq, d);
                        list.Add(d);
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, List1 = list, totalCount = list.Count });
            }

            return Ok(new { List1 = list, totalCount = list.Count });
        }

        /// <summary>Legacy getpackinglistarchived — Sp_Packinglist @Query=3, @Status=1 (approved).</summary>
        [HttpGet("archived")]
        public IActionResult GetArchived([FromQuery] string? userid)
        {
            var list = new List<Dictionary<string, object?>>();
            try
            {
                var cs = _configuration.GetConnectionString("DefaultConnection");
                using var con = new SqlConnection(cs);
                con.Open();
                using (var cmd = new SqlCommand("Sp_Packinglist", con))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@Id", 0);
                    cmd.Parameters.AddWithValue("@Userid", "");
                    cmd.Parameters.AddWithValue("@Salesquoteid", "");
                    cmd.Parameters.AddWithValue("@Enterdate", DBNull.Value);
                    cmd.Parameters.AddWithValue("@Status", "1");
                    cmd.Parameters.AddWithValue("@Isdelete", "");
                    cmd.Parameters.AddWithValue("@Query", 3);
                    using var da = new SqlDataAdapter(cmd);
                    var dt = new DataTable();
                    da.Fill(dt);
                    foreach (DataRow row in dt.Rows)
                    {
                        var d = RowToDict(dt, row);
                        var sq = d.TryGetValue("Salesquoteid", out var sqv) ? sqv?.ToString() : null;
                        EnrichLineStats(con, sq, d);
                        list.Add(d);
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, List1 = list, totalCount = list.Count });
            }

            return Ok(new { List1 = list, totalCount = list.Count });
        }

        /// <summary>Quote lines for packing entry (Sp_Salesquotedetails Q8 + inventory + lock). Form field: billid.</summary>
        [HttpPost("pack-quote-details")]
        public async Task<IActionResult> PackQuoteDetails([FromForm] string? billid, CancellationToken cancellationToken)
        {
            var empty = new List<Dictionary<string, object?>>();
            if (string.IsNullOrWhiteSpace(billid))
                return BadRequest(new { List1 = empty, Message = "Bill ID is required" });

            var (list, msg) = await PackingQuoteDetailsHelper.LoadAsync(_configuration, billid, cancellationToken);
            return Ok(new { List1 = list, Message = msg });
        }
    }
}

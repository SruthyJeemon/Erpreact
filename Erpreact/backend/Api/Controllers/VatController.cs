using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VatController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public VatController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet]
        public IActionResult GetAll([FromQuery] string isdelete = "0", [FromQuery] string status = "Active", [FromQuery] int query = 3, [FromQuery] string vatname = "")
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                var list = new List<Dictionary<string, object>>();

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    // Some DBs have Sp_Vat with a different parameter list; avoid breaking the UI by using direct SQL for reads.
                    // This endpoint is used by UI dropdowns (e.g. Sales Quote Create).
                    string sql = @"
SELECT Id, Vatname, Vatvalue, Description, Aliasname, Isdelete, Status
FROM dbo.Tbl_Vat
WHERE (@Isdelete = '' OR CONVERT(varchar(10), ISNULL(Isdelete, 0)) = @Isdelete)
  AND (@Status = '' OR LTRIM(RTRIM(ISNULL(Status,''))) = LTRIM(RTRIM(@Status)))
  AND (@Vatname = '' OR ISNULL(Vatname,'') LIKE '%' + @Vatname + '%')
ORDER BY Id ASC;";

                    using (SqlCommand cmd = new SqlCommand(sql, conn))
                    {
                        cmd.CommandType = CommandType.Text;
                        cmd.Parameters.AddWithValue("@Isdelete", (isdelete ?? "").Trim());
                        cmd.Parameters.AddWithValue("@Status", (status ?? "").Trim());
                        cmd.Parameters.AddWithValue("@Vatname", (vatname ?? "").Trim());

                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                var item = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    item[reader.GetName(i)] = reader.GetValue(i) == DBNull.Value ? null : reader.GetValue(i);
                                }
                                list.Add(item);
                            }
                        }
                    }
                }
                return Ok(new { success = true, Data = list });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message, stack = ex.StackTrace });
            }
        }
    }
}

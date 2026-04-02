using Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountTypeController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public AccountTypeController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet]
        public IActionResult GetAll([FromQuery] string isdelete = "0")
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                var list = new List<AccountTypeData>();

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    string sql = "SELECT * FROM Tbl_AccountType WHERE Isdelete = @Isdelete";
                    using (SqlCommand cmd = new SqlCommand(sql, conn))
                    {
                        cmd.Parameters.AddWithValue("@Isdelete", isdelete);
                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                list.Add(new AccountTypeData
                                {
                                    Id = reader.GetInt32(reader.GetOrdinal("Id")),
                                    Acc_type = reader["Acc_type"]?.ToString(),
                                    Is_cd = reader["Is_cd"]?.ToString(),
                                    Isdelete = reader["Isdelete"]?.ToString(),
                                    Status = reader["Status"]?.ToString()
                                });
                            }
                        }
                    }
                }
                return Ok(new { success = true, Data = list });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}

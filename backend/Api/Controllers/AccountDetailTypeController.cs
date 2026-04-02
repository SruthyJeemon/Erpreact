using Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountDetailTypeController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public AccountDetailTypeController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet("{accTypeId}")]
        public IActionResult GetByAccountType(int accTypeId)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                var list = new List<AccountDetailTypeData>();

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    string sql = "SELECT * FROM Tbl_AccountDetailType WHERE Acc_typeid = @AccTypeId AND Isdelete = '0'";
                    using (SqlCommand cmd = new SqlCommand(sql, conn))
                    {
                        cmd.Parameters.AddWithValue("@AccTypeId", accTypeId);
                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                list.Add(new AccountDetailTypeData
                                {
                                    Id = reader.GetInt32(reader.GetOrdinal("Id")),
                                    Acc_typeid = reader.GetInt32(reader.GetOrdinal("Acc_typeid")),
                                    Detail_type = reader["Detail_type"]?.ToString(),
                                    Description = reader["Description"]?.ToString(),
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

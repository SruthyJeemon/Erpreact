using Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using Api.Extensions;

namespace Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChartOfAccountsController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public ChartOfAccountsController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet]
        public IActionResult GetAll([FromQuery] string isdelete = "0", [FromQuery] string status = "Active", [FromQuery] int query = 0)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                var list = new List<ChartOfAccountData>();

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    string sql;
                    if (query == 7)
                    {
                        sql = @"
                            SELECT c.Name, c.Id, a.Acc_type as Accounttype 
                            FROM Tbl_Chartofaccounts c 
                            LEFT JOIN Tbl_Accounttype a ON a.Id = c.Account_typeid
                            WHERE c.Isdelete = @Isdelete AND c.Status = @Status
                            ORDER BY c.Id DESC";
                    }
                    else
                    {
                        sql = @"
                            SELECT 
                                C.*, 
                                A.Acc_type, 
                                D.Detail_type 
                            FROM Tbl_ChartOfAccounts C
                            LEFT JOIN Tbl_AccountType A ON C.Account_typeid = A.Id
                            LEFT JOIN Tbl_AccountDetailType D ON C.Detail_typeid = D.Id
                            WHERE C.Isdelete = @Isdelete
                            ORDER BY C.Id DESC";
                    }

                    using (SqlCommand cmd = new SqlCommand(sql, conn))
                    {
                        cmd.Parameters.AddWithValue("@Isdelete", isdelete);
                        if (query == 7)
                        {
                            cmd.Parameters.AddWithValue("@Status", status);
                        }
                        
                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                var item = new ChartOfAccountData();
                                item.Id = reader.GetInt32(reader.GetOrdinal("Id"));
                                item.Name = reader["Name"]?.ToString();
                                
                                if (query == 7)
                                {
                                    item.Acc_type = reader["Accounttype"]?.ToString();
                                }
                                else
                                {
                                    item.Account_typeid = reader["Account_typeid"]?.ToString();
                                    item.Detail_typeid = reader["Detail_typeid"]?.ToString();
                                    item.Description = reader["Description"]?.ToString();
                                    item.Currency = reader["Currency"]?.ToString();
                                    item.Is_subaccount = reader["Is_subaccount"]?.ToString();
                                    item.Subnameid = reader["Subnameid"]?.ToString();
                                    item.Vatcode = reader["Vatcode"]?.ToString();
                                    item.Balance = reader["Balance"]?.ToString();
                                    item.Asof = reader["Asof"]?.ToString();
                                    item.Type = reader["Type"]?.ToString();
                                    item.Isdelete = reader["Isdelete"]?.ToString();
                                    item.Status = reader["Status"]?.ToString();
                                    item.Acc_type = reader.HasColumn("Acc_type") ? reader["Acc_type"]?.ToString() : "";
                                    item.Detail_type = reader.HasColumn("Detail_type") ? reader["Detail_type"]?.ToString() : "";
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
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public IActionResult Create([FromBody] ChartOfAccountRequest model)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    string sql = @"
                        INSERT INTO Tbl_ChartOfAccounts (
                            Account_typeid, Detail_typeid, Name, Description, Currency, 
                            Is_subaccount, Subnameid, Vatcode, Balance, Asof, Type, Isdelete, Status
                        ) VALUES (
                            @Account_typeid, @Detail_typeid, @Name, @Description, @Currency, 
                            @Is_subaccount, @Subnameid, @Vatcode, @Balance, @Asof, @Type, @Isdelete, @Status
                        )";

                    using (SqlCommand cmd = new SqlCommand(sql, conn))
                    {
                        cmd.Parameters.AddWithValue("@Account_typeid", model.Account_typeid ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Detail_typeid", model.Detail_typeid ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Name", model.Name ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Description", model.Description ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Currency", model.Currency ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Is_subaccount", model.Is_subaccount ?? "0");
                        cmd.Parameters.AddWithValue("@Subnameid", model.Subnameid ?? "0");
                        cmd.Parameters.AddWithValue("@Vatcode", model.Vatcode ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Balance", model.Balance ?? "0");
                        cmd.Parameters.AddWithValue("@Asof", model.Asof ?? DateTime.Now.ToString("yyyy-MM-dd"));
                        cmd.Parameters.AddWithValue("@Type", model.Type ?? "");
                        cmd.Parameters.AddWithValue("@Isdelete", model.Isdelete ?? "0");
                        cmd.Parameters.AddWithValue("@Status", model.Status ?? "Active");

                        cmd.ExecuteNonQuery();
                    }
                }
                return Ok(new { success = true, message = "Account created successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
        
        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] ChartOfAccountRequest model)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    string sql = @"
                        UPDATE Tbl_ChartOfAccounts SET
                            Account_typeid = @Account_typeid, 
                            Detail_typeid = @Detail_typeid, 
                            Name = @Name, 
                            Description = @Description, 
                            Currency = @Currency, 
                            Is_subaccount = @Is_subaccount, 
                            Subnameid = @Subnameid, 
                            Vatcode = @Vatcode, 
                            Balance = @Balance, 
                            Asof = @Asof, 
                            Isdelete = @Isdelete, 
                            Status = @Status
                        WHERE Id = @Id";

                    using (SqlCommand cmd = new SqlCommand(sql, conn))
                    {
                        cmd.Parameters.AddWithValue("@Id", id);
                        cmd.Parameters.AddWithValue("@Account_typeid", model.Account_typeid ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Detail_typeid", model.Detail_typeid ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Name", model.Name ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Description", model.Description ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Currency", model.Currency ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Is_subaccount", model.Is_subaccount ?? "0");
                        cmd.Parameters.AddWithValue("@Subnameid", model.Subnameid ?? "0");
                        cmd.Parameters.AddWithValue("@Vatcode", model.Vatcode ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Balance", model.Balance ?? "0");
                        cmd.Parameters.AddWithValue("@Asof", model.Asof ?? DateTime.Now.ToString("yyyy-MM-dd"));
                        cmd.Parameters.AddWithValue("@Isdelete", model.Isdelete ?? "0");
                        cmd.Parameters.AddWithValue("@Status", model.Status ?? "Active");

                        cmd.ExecuteNonQuery();
                    }
                }
                return Ok(new { success = true, message = "Account updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    // Soft delete
                    string sql = "UPDATE Tbl_ChartOfAccounts SET Isdelete = '1' WHERE Id = @Id";
                    using (SqlCommand cmd = new SqlCommand(sql, conn))
                    {
                        cmd.Parameters.AddWithValue("@Id", id);
                        cmd.ExecuteNonQuery();
                    }
                }
                return Ok(new { success = true, message = "Account deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }


}

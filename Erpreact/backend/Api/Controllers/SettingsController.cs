using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using Api.Models;

namespace Api.Controllers
{
    [Route("api/Settings/[action]")]
    [ApiController]
    public class SettingsController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public SettingsController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet]
        public IActionResult getstocklocation()
        {
            List<StockLocationData> stockLocations = new List<StockLocationData>();
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    using (SqlCommand cmd1 = new SqlCommand("Sp_Stocklocation", con))
                    {
                        cmd1.CommandType = CommandType.StoredProcedure;
                        cmd1.Parameters.AddWithValue("@Id", "");
                        cmd1.Parameters.AddWithValue("@Warehouseid", "");
                        cmd1.Parameters.AddWithValue("@Name", "");
                        cmd1.Parameters.AddWithValue("@Type", "");
                        cmd1.Parameters.AddWithValue("@Parentstockid", "");
                        cmd1.Parameters.AddWithValue("@Locationaddress", "");
                        cmd1.Parameters.AddWithValue("@Isdefault", "");
                        cmd1.Parameters.AddWithValue("@Isdelete", "0");
                        cmd1.Parameters.AddWithValue("@Status", "Active");
                        cmd1.Parameters.AddWithValue("@Query", 3);

                        con.Open();
                        using (SqlDataAdapter da = new SqlDataAdapter(cmd1))
                        {
                            DataTable dt = new DataTable();
                            da.Fill(dt);
                            if (dt.Rows.Count > 0)
                            {
                                foreach (DataRow row in dt.Rows)
                                {
                                    StockLocationData model = new StockLocationData
                                    {
                                        Id = Convert.ToInt32(row["Id"]),
                                        Warehouseid = row["Warehouseid"].ToString(),
                                        Name = row["Name"].ToString(),
                                        Type = row["Type"].ToString(),
                                        Parentstockid = row["Parentstockid"].ToString(),
                                        Locationaddress = row["Locationaddress"].ToString(),
                                        Isdefault = row["Isdefault"].ToString(),
                                        Isdelete = row["Isdelete"].ToString(),
                                        Status = row["Status"].ToString(),
                                        Isdispatch = row.Table.Columns.Contains("Isdispatch") ? row["Isdispatch"].ToString() : ""
                                    };
                                    stockLocations.Add(model);
                                }
                            }
                        }
                        con.Close();
                    }
                }
            }
            catch (Exception ex)
            {
                // In production, log the error
                return StatusCode(500, new { success = false, message = ex.Message });
            }

            return Ok(new { List1 = stockLocations });
        }
    }
}

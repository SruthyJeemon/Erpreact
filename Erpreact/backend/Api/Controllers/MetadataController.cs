using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MetadataController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public MetadataController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet("catalogs")]
        public async Task<IActionResult> GetCatalogs()
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                var catalogs = new List<Dictionary<string, object>>();
                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    // Assuming Tbl_Catelog has Id and Catelogname based on typical patterns in this repo
                    using (var cmd = new SqlCommand("SELECT Id, Catelogname as Name FROM Tbl_Catelog WHERE Isdelete = 0", connection))
                    {
                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                catalogs.Add(new Dictionary<string, object> {
                                    { "id", reader["Id"] },
                                    { "name", reader["Name"] }
                                });
                            }
                        }
                    }
                }
                return Ok(catalogs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("customers")]
        public async Task<IActionResult> GetCustomers()
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                var customers = new List<Dictionary<string, object>>();
                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    using (var cmd = new SqlCommand("SELECT Id, Customerdisplayname as Name FROM Tbl_Customer WHERE Isdelete = 0", connection))
                    {
                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                customers.Add(new Dictionary<string, object> {
                                    { "id", reader["Id"] },
                                    { "name", reader["Name"] }
                                });
                            }
                        }
                    }
                }
                return Ok(customers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("warehouses")]
        public async Task<IActionResult> GetWarehouses()
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                var warehouses = new List<Dictionary<string, object>>();
                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    using (var cmd = new SqlCommand("SELECT Id, Name FROM Tbl_StockLocation WHERE Isdelete = 0 AND Status = 'Active'", connection))
                    {
                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                warehouses.Add(new Dictionary<string, object> {
                                    { "id", reader["Id"] },
                                    { "name", reader["Name"] }
                                });
                            }
                        }
                    }
                }
                return Ok(warehouses);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("products")]
        public async Task<IActionResult> GetProducts([FromQuery] string catalogId = "")
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                var products = new List<Dictionary<string, object>>();
                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    // Using existing Sp_Productvariants pattern for consistency
                    using (var cmd = new SqlCommand("Sp_Productvariants", connection))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Query", 29);
                        cmd.Parameters.AddWithValue("@Catelogid", string.IsNullOrEmpty(catalogId) ? "1001" : catalogId);
                        cmd.Parameters.AddWithValue("@Itemname", "");
                        
                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                products.Add(new Dictionary<string, object> {
                                    { "id", reader["Id"] },
                                    { "name", reader["Itemname"] }
                                });
                            }
                        }
                    }
                }
                return Ok(products);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SupplierController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public SupplierController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        // GET: api/supplier
        [HttpGet]
        public IActionResult GetAllSuppliers()
        {
            try
            {
                Console.WriteLine("[DEBUG] SupplierController: GetAllSuppliers called");
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                List<Dictionary<string, object>> suppliers = new List<Dictionary<string, object>>();

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    
                    // DIAGNOSTIC 1: Check Database and Table counts
                    Console.WriteLine($"[DEBUG] Database: {conn.Database}");
                    using (SqlCommand diagCmd = new SqlCommand("SELECT COUNT(*) FROM Tbl_Supplier", conn))
                    {
                        var count = diagCmd.ExecuteScalar();
                        Console.WriteLine($"[DEBUG] Total Rows in Tbl_Supplier (No Filters): {count}");
                    }
                    using (SqlCommand diagCmd = new SqlCommand("SELECT COUNT(*) FROM Tbl_Registration", conn))
                    {
                        var count = diagCmd.ExecuteScalar();
                        Console.WriteLine($"[DEBUG] Total Rows in Tbl_Registration: {count}");
                    }

                    // Using direct SQL for "Select All" to ensure Admin can see everything 
                    string sql = @"SELECT s.*, r.Firstname as Username 
                                 FROM Tbl_Supplier s 
                                 LEFT JOIN Tbl_Registration r ON s.Userid = r.Userid 
                                 WHERE (s.Isdelete = 0 OR s.Isdelete IS NULL) 
                                 AND (s.Status = 'Active' OR s.Status IS NULL OR s.Status = '')";
                    Console.WriteLine($"[DEBUG] SQL Query: {sql}");
                    
                    using (SqlCommand cmd = new SqlCommand(sql, conn))
                    {
                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                Dictionary<string, object> supplier = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    supplier[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                }
                                suppliers.Add(supplier);
                            }
                        }
                    }
                }

                Console.WriteLine($"[DEBUG] Successfully found {suppliers.Count} suppliers");
                return Ok(new { success = true, data = suppliers });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET: api/supplier/{id}
        [HttpGet("{id}")]
        public IActionResult GetSupplierById(int id)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                Dictionary<string, object> supplier = null;

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    string sql = "SELECT * FROM Tbl_Supplier WHERE Id = @Id AND Isdelete = 0";
                    using (SqlCommand cmd = new SqlCommand(sql, conn))
                    {
                        cmd.Parameters.AddWithValue("@Id", id);
                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                supplier = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    supplier[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                }
                            }
                        }
                    }
                }

                if (supplier != null)
                {
                    return Ok(new { success = true, data = supplier });
                }
                else
                {
                    return NotFound(new { success = false, message = "Supplier not found" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET: api/supplier/by-catalog/{catelogid}
        [HttpGet("by-catalog/{catelogid}")]
        public IActionResult GetSuppliersByCatalog(string catelogid)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                List<Dictionary<string, object>> suppliers = new List<Dictionary<string, object>>();

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    // Using direct SQL matching GetAllSuppliers but with Catalog filter
                    string sql = @"SELECT s.*, r.Firstname as Username 
                                 FROM Tbl_Supplier s 
                                 LEFT JOIN Tbl_Registration r ON s.Userid = r.Userid 
                                 WHERE (s.Isdelete = 0 OR s.Isdelete IS NULL) 
                                 AND (s.Status = 'Active' OR s.Status IS NULL OR s.Status = '') 
                                 AND r.Catelogid = @Catelogid";
                    
                    using (SqlCommand cmd = new SqlCommand(sql, conn))
                    {
                        cmd.Parameters.AddWithValue("@Catelogid", catelogid);

                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                Dictionary<string, object> supplier = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    supplier[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                }
                                suppliers.Add(supplier);
                            }
                        }
                    }
                }

                return Ok(new { success = true, data = suppliers });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: api/supplier
        [HttpPost]
        public IActionResult CreateSupplier([FromBody] SupplierModel model)
        {
            string connectionString = _configuration.GetConnectionString("DefaultConnection");
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                using (SqlTransaction transaction = conn.BeginTransaction())
                {
                    try
                    {
                        int insertedId = 0;
                        using (SqlCommand cmd = new SqlCommand("Sp_Supplier", conn, transaction))
                        {
                            cmd.CommandType = CommandType.StoredProcedure;
                            
                            cmd.Parameters.AddWithValue("@Id", "");
                            cmd.Parameters.AddWithValue("@Userid", model.userid ?? "1");
                            cmd.Parameters.AddWithValue("@Currency", model.currency ?? "AED");
                            cmd.Parameters.AddWithValue("@Title", model.title ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Firstname", model.firstname ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Middlename", model.middlename ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Lastname", model.lastname ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Suffix", model.suffix ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Supplierdisplayname", model.supplierdisplayname ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Companyname", model.companyname ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Email", model.email ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Phonenumber", model.phonenumber ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Mobilenumber", model.mobilenumber ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Fax", model.fax ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Other", model.other ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Website", model.website ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Streetaddress1", model.streetaddress1 ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Streetaddress2", model.streetaddress2 ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@City", model.city ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Province", model.province ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Postalcode", model.postalcode ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Country", model.country ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Notes", model.notes ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Attachments", model.attachments ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Businessidno", model.businessidno ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Billingrate", model.billingrate ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Terms", model.terms ?? "Due on receipt");
                            cmd.Parameters.AddWithValue("@Accountingno", model.accountingno ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Defaultexpensecategory", model.defaultexpensecategory ?? "Inventory-Beram - Current assets");
                            cmd.Parameters.AddWithValue("@Openingbalance", model.openingbalance ?? 0);
                            cmd.Parameters.AddWithValue("@Asof", model.asof ?? DateTime.Now.ToString("yyyy-MM-dd"));
                            cmd.Parameters.AddWithValue("@Isdelete", "0");
                            cmd.Parameters.AddWithValue("@Status", model.status ?? "Active");
                            cmd.Parameters.AddWithValue("@Typeofsupplier", model.typeofsupplier ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Query", 1); // INSERT

                            SqlParameter outputParam = new SqlParameter("@InsertedId", SqlDbType.Int)
                            {
                                Direction = ParameterDirection.Output
                            };
                            cmd.Parameters.Add(outputParam);

                            cmd.ExecuteNonQuery();
                            insertedId = outputParam.Value != DBNull.Value ? (int)outputParam.Value : 0;
                        }

                        // Save Log
                        using (SqlCommand logCmd = new SqlCommand("Sp_Supplierpurchaselog", conn, transaction))
                        {
                            logCmd.CommandType = CommandType.StoredProcedure;
                            logCmd.Parameters.AddWithValue("@Id", "");
                            logCmd.Parameters.AddWithValue("@Supplierid", insertedId);
                            logCmd.Parameters.AddWithValue("@Purchaseid", "");
                            logCmd.Parameters.AddWithValue("@Approveuserid", "");
                            logCmd.Parameters.AddWithValue("@Editreason", "");
                            logCmd.Parameters.AddWithValue("@Comments", (model.supplierdisplayname ?? "Supplier") + " - Added");
                            logCmd.Parameters.AddWithValue("@Isdelete", 0);
                            logCmd.Parameters.AddWithValue("@Status", "Active");
                            logCmd.Parameters.AddWithValue("@Changeddate", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
                            logCmd.Parameters.AddWithValue("@Sentedto", "");
                            logCmd.Parameters.AddWithValue("@Query", 1);

                            logCmd.ExecuteNonQuery();
                        }

                        transaction.Commit();
                        return Ok(new { success = true, message = "Supplier created successfully", id = insertedId });
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        return StatusCode(500, new { success = false, message = ex.Message });
                    }
                }
            }
        }

        // PUT: api/supplier/{id}
        [HttpPut("{id}")]
        public IActionResult UpdateSupplier(int id, [FromBody] SupplierModel model)
        {
            string connectionString = _configuration.GetConnectionString("DefaultConnection");
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                using (SqlTransaction transaction = conn.BeginTransaction())
                {
                    try
                    {
                        using (SqlCommand cmd = new SqlCommand("Sp_Supplier", conn, transaction))
                        {
                            cmd.CommandType = CommandType.StoredProcedure;
                            
                            cmd.Parameters.AddWithValue("@Id", id);
                            cmd.Parameters.AddWithValue("@Userid", model.userid ?? "1");
                            cmd.Parameters.AddWithValue("@Currency", model.currency ?? "AED");
                            cmd.Parameters.AddWithValue("@Title", model.title ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Firstname", model.firstname ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Middlename", model.middlename ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Lastname", model.lastname ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Suffix", model.suffix ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Supplierdisplayname", model.supplierdisplayname ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Companyname", model.companyname ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Email", model.email ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Phonenumber", model.phonenumber ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Mobilenumber", model.mobilenumber ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Fax", model.fax ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Other", model.other ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Website", model.website ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Streetaddress1", model.streetaddress1 ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Streetaddress2", model.streetaddress2 ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@City", model.city ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Province", model.province ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Postalcode", model.postalcode ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Country", model.country ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Notes", model.notes ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Attachments", model.attachments ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Businessidno", model.businessidno ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Billingrate", model.billingrate ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Terms", model.terms ?? "Due on receipt");
                            cmd.Parameters.AddWithValue("@Accountingno", model.accountingno ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Defaultexpensecategory", model.defaultexpensecategory ?? "Inventory-Beram - Current assets");
                            cmd.Parameters.AddWithValue("@Openingbalance", model.openingbalance ?? 0);
                            cmd.Parameters.AddWithValue("@Asof", model.asof ?? DateTime.Now.ToString("yyyy-MM-dd"));
                            cmd.Parameters.AddWithValue("@Isdelete", "0");
                            cmd.Parameters.AddWithValue("@Status", model.status ?? "Active");
                            cmd.Parameters.AddWithValue("@Typeofsupplier", model.typeofsupplier ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@Query", 2); // UPDATE

                            cmd.ExecuteNonQuery();
                        }

                        // Save Log
                        using (SqlCommand logCmd = new SqlCommand("Sp_Supplierpurchaselog", conn, transaction))
                        {
                            logCmd.CommandType = CommandType.StoredProcedure;
                            logCmd.Parameters.AddWithValue("@Id", "");
                            logCmd.Parameters.AddWithValue("@Supplierid", id);
                            logCmd.Parameters.AddWithValue("@Purchaseid", "");
                            logCmd.Parameters.AddWithValue("@Approveuserid", "");
                            logCmd.Parameters.AddWithValue("@Editreason", "");
                            logCmd.Parameters.AddWithValue("@Comments", (model.supplierdisplayname ?? "Supplier") + " - Updated");
                            logCmd.Parameters.AddWithValue("@Isdelete", 0);
                            logCmd.Parameters.AddWithValue("@Status", "Active");
                            logCmd.Parameters.AddWithValue("@Changeddate", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
                            logCmd.Parameters.AddWithValue("@Sentedto", "");
                            logCmd.Parameters.AddWithValue("@Query", 1);

                            logCmd.ExecuteNonQuery();
                        }

                        transaction.Commit();
                        return Ok(new { success = true, message = "Supplier updated successfully" });
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        return StatusCode(500, new { success = false, message = ex.Message });
                    }
                }
            }
        }

        // DELETE: api/supplier/{id}
        [HttpDelete("{id}")]
        public IActionResult DeleteSupplier(int id)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    using (SqlCommand cmd = new SqlCommand("Sp_Supplier", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", id);
                        cmd.Parameters.AddWithValue("@Isdelete", "1");
                        cmd.Parameters.AddWithValue("@Query", 3); // DELETE logic (update Isdelete)

                        cmd.ExecuteNonQuery();
                    }
                }

                return Ok(new { success = true, message = "Supplier deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    // Model class for Supplier
    public class SupplierModel
    {
        public int? id { get; set; }
        public string userid { get; set; }
        public string currency { get; set; }
        public string typeofsupplier { get; set; }
        public string title { get; set; }
        public string firstname { get; set; }
        public string middlename { get; set; }
        public string lastname { get; set; }
        public string suffix { get; set; }
        public string supplierdisplayname { get; set; }
        public string companyname { get; set; }
        public string email { get; set; }
        public string phonenumber { get; set; }
        public string mobilenumber { get; set; }
        public string fax { get; set; }
        public string other { get; set; }
        public string website { get; set; }
        public string streetaddress1 { get; set; }
        public string streetaddress2 { get; set; }
        public string city { get; set; }
        public string province { get; set; }
        public string postalcode { get; set; }
        public string country { get; set; }
        public string notes { get; set; }
        public string attachments { get; set; }
        public string businessidno { get; set; }
        public string billingrate { get; set; }
        public string terms { get; set; }
        public string accountingno { get; set; }
        public string defaultexpensecategory { get; set; }
        public decimal? openingbalance { get; set; }
        public string asof { get; set; }
        public string status { get; set; }
    }
}

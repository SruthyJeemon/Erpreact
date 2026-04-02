using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

namespace api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomerController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public CustomerController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        // GET: api/customer
        [HttpGet]
        public IActionResult GetAllCustomers([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string search = "")
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                List<Dictionary<string, object>> customers = new List<Dictionary<string, object>>();
                int totalCount = 0;

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    
                    // Base WHERE clause
                    string whereClause = "WHERE c.Isdelete = 0";
                    if (!string.IsNullOrEmpty(search))
                    {
                        whereClause += " AND (c.Customerdisplayname LIKE @Search OR c.Companyname LIKE @Search OR c.Email LIKE @Search OR c.Phonenumber LIKE @Search OR c.Mobilenumber LIKE @Search)";
                    }

                    // Get total count
                    string countSql = $@"SELECT COUNT(*) 
                                       FROM Tbl_Customer c 
                                       LEFT JOIN Tbl_Registration r ON c.Userid = r.Userid 
                                       {whereClause}";
                    using (SqlCommand countCmd = new SqlCommand(countSql, conn))
                    {
                        if (!string.IsNullOrEmpty(search))
                            countCmd.Parameters.AddWithValue("@Search", "%" + search + "%");
                        totalCount = (int)countCmd.ExecuteScalar();
                    }

                    // Get paginated data
                    string sql = $@"SELECT c.*, r.Firstname as Username 
                                 FROM Tbl_Customer c 
                                 LEFT JOIN Tbl_Registration r ON c.Userid = r.Userid 
                                 {whereClause}
                                 ORDER BY c.Id DESC
                                 OFFSET @Offset ROWS
                                 FETCH NEXT @PageSize ROWS ONLY";
                    
                    using (SqlCommand cmd = new SqlCommand(sql, conn))
                    {
                        cmd.Parameters.AddWithValue("@Offset", (page - 1) * pageSize);
                        cmd.Parameters.AddWithValue("@PageSize", pageSize);
                        if (!string.IsNullOrEmpty(search))
                            cmd.Parameters.AddWithValue("@Search", "%" + search + "%");

                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                Dictionary<string, object> customer = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    customer[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                }
                                customers.Add(customer);
                            }
                        }
                    }
                }

                return Ok(new { success = true, data = customers, totalCount = totalCount });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET: api/customer/{id}
        [HttpGet("{id}")]
        public IActionResult GetCustomerById(int id)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                Dictionary<string, object> customer = null;

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    using (SqlCommand cmd = new SqlCommand("Sp_Customer", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", id);
                        cmd.Parameters.AddWithValue("@Query", 4); // SELECT logic
                        // Need to provide dummy values for other params if SP expects them, 
                        // but usually @Id and @Query are enough if SP handles nulls. 
                        // Based on user provided SP, it filters by Isdelete=0 implicitly in some blocks?
                        // Actually the user SP Query=4 logic is:
                        /*
                        SELECT * 
                        FROM Tbl_Customer
                        INNER JOIN Tbl_Registration
                            ON Tbl_Registration.Userid = Tbl_Customer.Userid 
                            AND (Tbl_Customer.Isshared = 1 OR Tbl_Registration.Catelogid IN (SELECT value FROM dbo.SplitString('1,2', ',')))
                        WHERE Tbl_Customer.Isdelete = 0
                            AND (Tbl_Customer.Isshared = 1 OR Tbl_Registration.Catelogid IN (SELECT value FROM dbo.SplitString(@Catelogid, ',')))
                        */
                        // It seems Query 4 requires @Catelogid. 
                        // Let's use flexible SELECT for ID lookup if possible, or pass catalogid.
                        // Since I am generic here, I'll try to just select by ID directly with SQL if SP is restrictive, 
                        // OR assuming @Catelogid is optional/handled. The SP provided shows it uses @Catelogid in Query=4.
                        // I might need a specific 'GetById' query in SP or use direct SQL here for simplicity/safety like fetching All.
                        
                        // For safety, let's use direct SQL to get by ID to avoid SP complexity with CatalogId for now
                    }
                    
                    // Direct SQL for single item
                    string sql = "SELECT * FROM Tbl_Customer WHERE Id = @Id AND Isdelete = 0";
                    using (SqlCommand cmd = new SqlCommand(sql, conn))
                    {
                        cmd.Parameters.AddWithValue("@Id", id);
                         using (SqlDataReader reader = cmd.ExecuteReader())
                         {
                             if (reader.Read())
                             {
                                 customer = new Dictionary<string, object>();
                                 for (int i = 0; i < reader.FieldCount; i++)
                                 {
                                     customer[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                 }
                             }
                         }
                    }
                }

                if (customer != null)
                {
                    return Ok(new { success = true, data = customer });
                }
                else
                {
                    return NotFound(new { success = false, message = "Customer not found" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET: api/customer/by-catalog/{catelogid}
        [HttpGet("by-catalog/{catelogid}")]
        public IActionResult GetCustomersByCatalog(string catelogid, [FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string search = "")
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                List<Dictionary<string, object>> customers = new List<Dictionary<string, object>>();
                int totalCount = 0;

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    
                    // Base WHERE clause - Supports multiple CatelogIds via SplitString if provided
                    string whereClause = "WHERE c.Isdelete = 0 AND (c.Isshared = 1 OR r.Catelogid IN (SELECT value FROM dbo.SplitString(@Catelogid, ',')))";
                    if (!string.IsNullOrEmpty(search))
                    {
                        whereClause += " AND (c.Customerdisplayname LIKE @Search OR c.Companyname LIKE @Search OR c.Email LIKE @Search OR c.Phonenumber LIKE @Search OR c.Mobilenumber LIKE @Search)";
                    }

                    // Get total count
                    string countSql = $@"SELECT COUNT(*) 
                                       FROM Tbl_Customer c 
                                       LEFT JOIN Tbl_Registration r ON c.Userid = r.Userid 
                                       {whereClause}";
                    using (SqlCommand countCmd = new SqlCommand(countSql, conn))
                    {
                        countCmd.Parameters.AddWithValue("@Catelogid", catelogid);
                        if (!string.IsNullOrEmpty(search))
                            countCmd.Parameters.AddWithValue("@Search", "%" + search + "%");
                        totalCount = (int)countCmd.ExecuteScalar();
                    }

                    // Get paginated data
                    string sql = $@"SELECT c.*, r.Firstname as Username 
                                 FROM Tbl_Customer c 
                                 LEFT JOIN Tbl_Registration r ON c.Userid = r.Userid 
                                 {whereClause}
                                 ORDER BY c.Id DESC
                                 OFFSET @Offset ROWS
                                 FETCH NEXT @PageSize ROWS ONLY";
                    
                    using (SqlCommand cmd = new SqlCommand(sql, conn))
                    {
                        cmd.Parameters.AddWithValue("@Catelogid", catelogid);
                        cmd.Parameters.AddWithValue("@Offset", (page - 1) * pageSize);
                        cmd.Parameters.AddWithValue("@PageSize", pageSize);
                        if (!string.IsNullOrEmpty(search))
                            cmd.Parameters.AddWithValue("@Search", "%" + search + "%");

                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                Dictionary<string, object> customer = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    customer[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                }
                                customers.Add(customer);
                            }
                        }
                    }
                }

                return Ok(new { success = true, data = customers, totalCount = totalCount });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: api/customer
        [HttpPost]
        public IActionResult CreateCustomer([FromBody] CustomerModel model)
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
                        using (SqlCommand cmd = new SqlCommand("Sp_Customer", conn, transaction))
                        {
                            cmd.CommandType = CommandType.StoredProcedure;
                            
                            cmd.Parameters.AddWithValue("@Query", 1); // INSERT
                            
                            AddCustomerParameters(cmd, model);

                            SqlParameter outputParam = new SqlParameter("@InsertedId", SqlDbType.Int)
                            {
                                Direction = ParameterDirection.Output
                            };
                            cmd.Parameters.Add(outputParam);

                            cmd.ExecuteNonQuery();
                            insertedId = outputParam.Value != DBNull.Value ? (int)outputParam.Value : 0;
                        }

                        transaction.Commit();
                        return Ok(new { success = true, message = "Customer created successfully", id = insertedId });
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        return StatusCode(500, new { success = false, message = ex.Message });
                    }
                }
            }
        }

        // PUT: api/customer/{id}
        [HttpPut("{id}")]
        public IActionResult UpdateCustomer(int id, [FromBody] CustomerModel model)
        {
            string connectionString = _configuration.GetConnectionString("DefaultConnection");
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                using (SqlTransaction transaction = conn.BeginTransaction())
                {
                    try
                    {
                        using (SqlCommand cmd = new SqlCommand("Sp_Customer", conn, transaction))
                        {
                            cmd.CommandType = CommandType.StoredProcedure;
                            cmd.Parameters.AddWithValue("@Query", 2); // UPDATE
                            cmd.Parameters.AddWithValue("@Id", id);
                            
                            AddCustomerParameters(cmd, model);
                            
                            // SP expects @InsertedId output even for update if defined? 
                            // Check SP: @InsertedId INT OUTPUT is defined.
                            // Better include it to avoid error.
                            SqlParameter outputParam = new SqlParameter("@InsertedId", SqlDbType.Int)
                            {
                                Direction = ParameterDirection.Output
                            };
                            cmd.Parameters.Add(outputParam);

                            cmd.ExecuteNonQuery();
                        }

                        transaction.Commit();
                        return Ok(new { success = true, message = "Customer updated successfully" });
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        return StatusCode(500, new { success = false, message = ex.Message });
                    }
                }
            }
        }

        // DELETE: api/customer/{id}
        [HttpDelete("{id}")]
        public IActionResult DeleteCustomer(int id)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    using (SqlCommand cmd = new SqlCommand("Sp_Customer", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", id);
                        cmd.Parameters.AddWithValue("@Isdelete", "1");
                        cmd.Parameters.AddWithValue("@Query", 3); // DELETE
                        
                        // Add required OUTPUT param to avoid error
                        SqlParameter outputParam = new SqlParameter("@InsertedId", SqlDbType.Int)
                        {
                            Direction = ParameterDirection.Output
                        };
                        cmd.Parameters.Add(outputParam);

                        cmd.ExecuteNonQuery();
                    }
                }

                return Ok(new { success = true, message = "Customer deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        private void AddCustomerParameters(SqlCommand cmd, CustomerModel model)
        {
            cmd.Parameters.AddWithValue("@Userid", model.userid ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Currency", model.currency ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Title", model.title ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Firstname", model.firstname ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Middlename", model.middlename ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Lastname", model.lastname ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Suffix", model.suffix ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Customerdisplayname", model.customerdisplayname ?? (object)DBNull.Value);
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
            cmd.Parameters.AddWithValue("@Paymentmethod", model.paymentmethod ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Terms", model.terms ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Deliveryoption", model.deliveryoption ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Language", model.language ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Taxes", model.taxes ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Chartofaccountsid", model.chartofaccountsid ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Openingbalance", model.openingbalance ?? 0);
            cmd.Parameters.AddWithValue("@Asof", model.asof ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Isdelete", "0");
            cmd.Parameters.AddWithValue("@Status", model.status ?? "Active");
            cmd.Parameters.AddWithValue("@Warehouseid", model.warehouseid ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Isshared", model.isshared ?? 1); // Default to 1 (shared) or 0? user SP implies "Isshared" logic.
            cmd.Parameters.AddWithValue("@Customer_category", model.customer_category ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Iscommission", model.iscommission ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Expenseaccount", model.expenseaccount ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Isreturncharges", model.isreturncharges ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Expenseaccountreturncharges", model.expenseaccountreturncharges ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Packinglist_enabled", model.packinglist_enabled ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Salespersonid", model.salespersonid ?? (object)DBNull.Value);
            // Catelogid not in Insert/Update part of SP provided by user, only in Select? 
            // Wait, query 1 insert does not list @Catelogid in the INSERT statement provided in user prompt.
            // "VALUES (..., @Packinglist_enabled, @Salespersonid)"
            // So we don't pass Catelogid to Insert/Update.
        }
    }

    public class CustomerModel
    {
        public int? id { get; set; }
        public string? userid { get; set; }
        public string? currency { get; set; }
        public string? title { get; set; }
        public string? firstname { get; set; }
        public string? middlename { get; set; }
        public string? lastname { get; set; }
        public string? suffix { get; set; }
        public string? customerdisplayname { get; set; }
        public string? companyname { get; set; }
        public string? email { get; set; }
        public string? phonenumber { get; set; }
        public string? mobilenumber { get; set; }
        public string? fax { get; set; }
        public string? other { get; set; }
        public string? website { get; set; }
        public string? streetaddress1 { get; set; }
        public string? streetaddress2 { get; set; }
        public string? city { get; set; }
        public string? province { get; set; }
        public string? postalcode { get; set; }
        public string? country { get; set; }
        public string? notes { get; set; }
        public string? attachments { get; set; }
        public string? paymentmethod { get; set; }
        public string? terms { get; set; }
        public string? deliveryoption { get; set; }
        public string? language { get; set; }
        public string? taxes { get; set; }
        public string? chartofaccountsid { get; set; }
        public decimal? openingbalance { get; set; }
        public string? asof { get; set; }
        public string? isdelete { get; set; }
        public string? status { get; set; }
        public string? warehouseid { get; set; }
        public int? isshared { get; set; }
        public string? customer_category { get; set; }
        public string? iscommission { get; set; }
        public string? expenseaccount { get; set; }
        public string? isreturncharges { get; set; }
        public string? expenseaccountreturncharges { get; set; }
        public string? packinglist_enabled { get; set; }
        public int? salespersonid { get; set; }
        public string? catelogid { get; set; } // For passing in catalog id if needed, though mostly for filtering
    }
}

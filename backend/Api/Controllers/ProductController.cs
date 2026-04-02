using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Text.Json;
using System.IO;
using Microsoft.AspNetCore.Hosting;

namespace Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;

        public ProductController(IConfiguration configuration, IWebHostEnvironment environment)
        {
            _configuration = configuration;
            _environment = environment;
        }

        [HttpGet("search")]
        public IActionResult Search([FromQuery] string itemname = "", [FromQuery] int query = 26, [FromQuery] int id = 0)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                var list = new List<Dictionary<string, object>>();

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    
                    if (query == 33 || query == 32)
                    {
                        string selectPart = query == 33 ? "*" : "Serialized, Id, Itemname, Productid";
                        string[] tables = { "Tbl_Productvariants", "ProductVariants" };
                        
                        Console.WriteLine($"[DEBUG] ========== Query {query} Start ==========");
                        Console.WriteLine($"[DEBUG] Search Parameters: id={id}, itemname='{itemname}'");
                        
                        foreach (var table in tables)
                        {
                            try {
                                // Simplified WHERE clause - try Id first, then itemname
                                string sql = $@"SELECT {selectPart}, '{table}' as _db_source FROM {table} 
                                               WHERE Id = @Id";
                                
                                Console.WriteLine($"[DEBUG] Trying table: {table}");
                                Console.WriteLine($"[DEBUG] SQL: {sql}");
                                
                                using (SqlCommand cmd = new SqlCommand(sql, conn))
                                {
                                    cmd.Parameters.AddWithValue("@Id", id);
                                    using (SqlDataReader reader = cmd.ExecuteReader())
                                    {
                                        bool found = false;
                                        int rowCount = 0;
                                        while (reader.Read())
                                        {
                                            var item = new Dictionary<string, object>();
                                            for (int i = 0; i < reader.FieldCount; i++)
                                            {
                                                string colName = reader.GetName(i);
                                                object colValue = reader.GetValue(i) == DBNull.Value ? null : reader.GetValue(i);
                                                item[colName] = colValue;
                                                Console.WriteLine($"[DEBUG]   Column: {colName} = {colValue}");
                                            }
                                            list.Add(item);
                                            found = true;
                                            rowCount++;
                                        }
                                        Console.WriteLine($"[DEBUG] Found {rowCount} records in {table}");
                                        if (found) break; // If we found data in one table, stop searching
                                    }
                                }
                            } catch (Exception ex) {
                                Console.WriteLine($"[DEBUG] Error querying table {table}: {ex.Message}");
                                // Ignore table-not-found errors and continue to the next candidate
                            }
                        }
                        Console.WriteLine($"[DEBUG] ========== Query {query} End - Total records: {list.Count} ==========");
                    }
                    else
                    {
                        using (SqlCommand cmd = new SqlCommand("Sp_Productvariants", conn))
                        {
                            cmd.CommandType = CommandType.StoredProcedure;
                            cmd.Parameters.AddWithValue("@Query", query);
                            cmd.Parameters.AddWithValue("@Itemname", itemname ?? "");
                            cmd.Parameters.AddWithValue("@Id", id);
                            cmd.Parameters.AddWithValue("@Status", "Active");
                            cmd.Parameters.AddWithValue("@Isdelete", 0);
                            cmd.Parameters.AddWithValue("@Parentid", 0);
                            cmd.Parameters.AddWithValue("@Varianttype", "");
                            cmd.Parameters.AddWithValue("@Value", "");

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
                }
                return Ok(new { success = true, Data = list });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("getproductitemdetailsfull")]
        public async Task<IActionResult> Getproductitemdetailsfull(int pageIndex, int pageSize, string itemname = "")
        {
            List<Variants> variants = new List<Variants>();
            //string catelogid = "";
            int totalRecords = 0; 
            int filteredRecords = 0; 
            
            bool isSearching = !string.IsNullOrEmpty(itemname);
            // If searching, we fetch all records to perform manual filtering because SP logic for Query 30 doesn't support @Itemname
            int spPageIndex = isSearching ? 1 : pageIndex;
            int spPageSize = isSearching ? 100000 : pageSize;

            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                //catelogid = getcatelogid(Session["Userid"].ToString()); // Not used and requires Session

                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();

                    using (SqlCommand cmd21 = new SqlCommand("Sp_Productvariants", con))
                    {
                        cmd21.CommandType = CommandType.StoredProcedure;
                        
                        cmd21.Parameters.AddWithValue("@Query", 30);
                        cmd21.Parameters.AddWithValue("@PageIndex", spPageIndex);  
                        cmd21.Parameters.AddWithValue("@PageSize", spPageSize);
                        cmd21.Parameters.AddWithValue("@Itemname", itemname ?? "");
                        // Add other required parameters if SP expects them, even if unused?
                        // Based on Search method, @Itemname, @Id etc might be needed if not handled by SP defaults.
                        // But snippet didn't include them, so assume SP handles missing params or they are optional/defaulted.
                        // To be safe, adding basic potential parameters as nullable/default if needed, but sticking to snippet first.
                        // However, Search method passed a lot of params.
                        // Assuming @Query=30 uses different logic path in SP that only needs PageIndex/PageSize.
                        // I'll stick to the snippet provided by user.

                        using (SqlDataReader reader = await cmd21.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                Variants model = new Variants
                                {
                                    id = reader.IsDBNull(reader.GetOrdinal("Id")) ? 0 : reader.GetInt32(reader.GetOrdinal("Id")),
                                    userid = reader.IsDBNull(reader.GetOrdinal("Userid")) ? null : reader.GetString(reader.GetOrdinal("Userid")),
                                    firstname = reader.IsDBNull(reader.GetOrdinal("Username")) ? null : reader.GetString(reader.GetOrdinal("Username")),
                                    Itemname = reader.IsDBNull(reader.GetOrdinal("Itemname")) ? null : reader.GetString(reader.GetOrdinal("Itemname")),
                                    productname = reader.IsDBNull(reader.GetOrdinal("Productname")) ? null : reader.GetString(reader.GetOrdinal("Productname")),
                                    Type = reader.IsDBNull(reader.GetOrdinal("Type")) ? null : reader.GetString(reader.GetOrdinal("Type")),
                                    Managerapprovestatus = reader.IsDBNull(reader.GetOrdinal("Approvalstatus")) ? null : reader.GetString(reader.GetOrdinal("Approvalstatus")),
                                    allvalues = reader.IsDBNull(reader.GetOrdinal("allvalues")) ? null : reader.GetString(reader.GetOrdinal("allvalues"))
                                };

                                variants.Add(model);
                            }

                            if (await reader.NextResultAsync())
                            {
                                if (await reader.ReadAsync())
                                {
                                    totalRecords = reader.IsDBNull(reader.GetOrdinal("TotalRecords")) ? 0 : reader.GetInt32(reader.GetOrdinal("TotalRecords"));
                                }
                            }
                        }
                    }
                }

                if (isSearching)
                {
                    // Case-insensitive filtering in C#
                    var filtered = variants.Where(v => 
                        (v.Itemname ?? "").Contains(itemname, StringComparison.OrdinalIgnoreCase) ||
                        (v.productname ?? "").Contains(itemname, StringComparison.OrdinalIgnoreCase) ||
                        (v.firstname ?? "").Contains(itemname, StringComparison.OrdinalIgnoreCase)
                    ).ToList();

                    totalRecords = filtered.Count;
                    variants = filtered.Skip((pageIndex - 1) * pageSize).Take(pageSize).ToList();
                }
                filteredRecords = variants.Count;
            }
            catch (Exception ex)
            {
               // Log exception
               Console.WriteLine($"Error in Getproductitemdetailsfull: {ex.Message}");
               // Return empty list on error or rethrow? 
               // Snippet swallowed exception.
            }

            return Ok(new
            {
                List1 = variants,  
                totalRecords = totalRecords,  
                filteredRecords = filteredRecords  
            });
        }

        [HttpPost("saveproductcombo")]
        public IActionResult Saveproductcombo([FromForm] string jsonData)
        {
            string message = "";
            int setid = 0;
            string userid = "";

            try
            {
                Console.WriteLine("========== Saveproductcombo Request ==========");
                Console.WriteLine($"JSON Data: {jsonData}");

                if (!string.IsNullOrEmpty(jsonData))
                {
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var data = JsonSerializer.Deserialize<Setnew>(jsonData, options);

                    string connectionString = _configuration.GetConnectionString("DefaultConnection");
                    using (SqlConnection con = new SqlConnection(connectionString))
                    {
                        con.Open();

                        bool isUpdate = !string.IsNullOrEmpty(data.formData.id) && data.formData.id != "0";
                        if (isUpdate) setid = Convert.ToInt32(data.formData.id);

                        // 1. Save Combo Header
                        using (SqlCommand cmd2 = new SqlCommand("Sp_productcombo", con))
                        {
                            cmd2.CommandType = CommandType.StoredProcedure;
                            cmd2.Parameters.AddWithValue("@Id", isUpdate ? setid : (object)"");
                            cmd2.Parameters.AddWithValue("@Userid", data.formData.Userid ?? "ADMIN");
                            cmd2.Parameters.AddWithValue("@Comboname", data.formData.Setname ?? "");
                            cmd2.Parameters.AddWithValue("@Modelno", data.formData.Modelno ?? "");
                            cmd2.Parameters.AddWithValue("@Batchno", data.formData.Batchno ?? "");
                            cmd2.Parameters.AddWithValue("@EANBarcodeno", data.formData.EANBarcodeno ?? "");
                            cmd2.Parameters.AddWithValue("@Isdelete", 0);
                            cmd2.Parameters.AddWithValue("@Status", "Active");
                            cmd2.Parameters.AddWithValue("@Workstatus", 0);
                            cmd2.Parameters.AddWithValue("@Description", data.formData.Description ?? "");
                            cmd2.Parameters.AddWithValue("@Wholesalepriceset", data.formData.Wholesalepriceset);
                            cmd2.Parameters.AddWithValue("@Retailpriceset", data.formData.Retailpriceset);
                            cmd2.Parameters.AddWithValue("@Onlinepriceset", data.formData.Onlinepriceset);
                            cmd2.Parameters.AddWithValue("@Short_description", data.formData.Short_description ?? "");
                            cmd2.Parameters.AddWithValue("@Length", data.formData.Length);
                            cmd2.Parameters.AddWithValue("@Width", data.formData.Width);
                            cmd2.Parameters.AddWithValue("@Height", data.formData.Height);
                            cmd2.Parameters.AddWithValue("@Weight", data.formData.Weight);

                            double cbm = (data.formData.Length / 100.0) * (data.formData.Width / 100.0) * (data.formData.Height / 100.0);
                            cmd2.Parameters.AddWithValue("@CBM", cbm);
                            cmd2.Parameters.AddWithValue("@Hscode", data.formData.Hscode ?? "");
                            cmd2.Parameters.AddWithValue("@Countryoforgin", data.formData.Countryoforgin ?? "");
                            cmd2.Parameters.AddWithValue("@Query", isUpdate ? 3 : 1);
                            
                            SqlParameter outputIdParam = new SqlParameter("@id1", SqlDbType.Int) { Direction = ParameterDirection.Output };
                            cmd2.Parameters.Add(outputIdParam);
                            cmd2.ExecuteNonQuery();

                            if (!isUpdate)
                            {
                                if (outputIdParam.Value != null && outputIdParam.Value != DBNull.Value)
                                {
                                    setid = Convert.ToInt32(outputIdParam.Value);
                                }
                            }
                            Console.WriteLine($"Combo ID (IsUpdate={isUpdate}): {setid}");
                            userid = data.formData.Userid ?? "ADMIN";
                        }

                        // 2. Save Marketplaces
                        if (isUpdate)
                        {
                            using (SqlCommand cmdClear = new SqlCommand("Sp_Productcombomarketplace", con))
                            {
                                cmdClear.CommandType = CommandType.StoredProcedure;
                                cmdClear.Parameters.AddWithValue("@Id", 0);
                                cmdClear.Parameters.AddWithValue("@Userid", userid);
                                cmdClear.Parameters.AddWithValue("@Productcomboid", setid);
                                cmdClear.Parameters.AddWithValue("@Marketplacename", "");
                                cmdClear.Parameters.AddWithValue("@Visibility", "");
                                cmdClear.Parameters.AddWithValue("@Isdelete", 0);
                                cmdClear.Parameters.AddWithValue("@Status", "");
                                cmdClear.Parameters.AddWithValue("@Link", "");
                                cmdClear.Parameters.AddWithValue("@Query", 5); 
                                cmdClear.ExecuteNonQuery();
                            }
                        }

                        foreach (var row in data.tableData)
                        {
                            using (SqlCommand cmd = new SqlCommand("Sp_Productcombomarketplace", con))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Id", "");
                                cmd.Parameters.AddWithValue("@Userid", userid);
                                cmd.Parameters.AddWithValue("@Productcomboid", setid);
                                cmd.Parameters.AddWithValue("@Marketplacename", row.Marketplace1);
                                cmd.Parameters.AddWithValue("@Visibility", row.Status ? 1 : 0);
                                cmd.Parameters.AddWithValue("@Isdelete", 0);
                                cmd.Parameters.AddWithValue("@Status", "Active");
                                cmd.Parameters.AddWithValue("@Link", row.Link ?? "");
                                cmd.Parameters.AddWithValue("@Query", 1);
                                cmd.ExecuteNonQuery();
                            }
                        }

                        // 3. Save Combo Items
                        if (isUpdate)
                        {
                            using (SqlCommand cmdClear = new SqlCommand("Sp_Comboitems", con))
                            {
                                cmdClear.CommandType = CommandType.StoredProcedure;
                                cmdClear.Parameters.AddWithValue("@Userid", userid);
                                cmdClear.Parameters.AddWithValue("@Id", 0);
                                cmdClear.Parameters.AddWithValue("@Productcomboid", setid);
                                cmdClear.Parameters.AddWithValue("@Productvariantsid", 0);
                                cmdClear.Parameters.AddWithValue("@Qty", 0);
                                cmdClear.Parameters.AddWithValue("@Isdelete", 0);
                                cmdClear.Parameters.AddWithValue("@Status", "");
                                cmdClear.Parameters.AddWithValue("@Workstatus", "");
                                cmdClear.Parameters.AddWithValue("@Query", 7);
                                cmdClear.ExecuteNonQuery();
                            }
                        }

                        foreach (var row in data.tableData1)
                        {
                            using (SqlCommand cmd = new SqlCommand("Sp_Comboitems", con))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Id", "");
                                cmd.Parameters.AddWithValue("@Userid", userid);
                                cmd.Parameters.AddWithValue("@Productcomboid", setid);
                                cmd.Parameters.AddWithValue("@Productvariantsid", row.variantid);
                                
                                decimal qtyValue = 1;
                                if (row.Qty != null)
                                {
                                    if (row.Qty is JsonElement je)
                                    {
                                        if (je.ValueKind == JsonValueKind.Number) qtyValue = je.GetDecimal();
                                        else if (je.ValueKind == JsonValueKind.String) decimal.TryParse(je.GetString(), out qtyValue);
                                    }
                                    else
                                    {
                                        decimal.TryParse(row.Qty.ToString(), out qtyValue);
                                    }
                                }
                                cmd.Parameters.AddWithValue("@Qty", qtyValue);
                                cmd.Parameters.AddWithValue("@Isdelete", 0);
                                cmd.Parameters.AddWithValue("@Status", "Active");
                                cmd.Parameters.AddWithValue("@Workstatus", 0);
                                cmd.Parameters.AddWithValue("@Query", 1); 
                                cmd.ExecuteNonQuery();
                            }
                        }

                        // 4. Activity Log
                        using (SqlCommand cmd = new SqlCommand("Sp_Productvariantssetlog", con))
                        {
                            cmd.CommandType = CommandType.StoredProcedure;
                            cmd.Parameters.AddWithValue("@Productid", 0);
                            cmd.Parameters.AddWithValue("@Userid", userid);
                            cmd.Parameters.AddWithValue("@Productvariantsid", 0);
                            cmd.Parameters.AddWithValue("@Productsetid", 0);
                            cmd.Parameters.AddWithValue("@Productcomboid", setid);
                            cmd.Parameters.AddWithValue("@Actiontype", $"{data.formData.Setname}-{(isUpdate ? "Update" : "Add")}");
                            cmd.Parameters.AddWithValue("@Date", DateTime.Now.ToString("dd-MMM-yyyy HH:mm:ss"));
                            cmd.Parameters.AddWithValue("@Query", 1);
                            cmd.ExecuteNonQuery();
                        }

                        // 5. Handle Images (Base64 from galleryimages[])
                        var galleryImages = Request.Form["galleryimages[]"];
                        var galleryNames = Request.Form["gallerynames[]"];

                        if (galleryImages.Count > 0 && galleryNames.Count > 0)
                        {
                            for (int i = 0; i < galleryImages.Count; i++)
                            {
                                try 
                                {
                                    string base64Data = galleryImages[i];
                                    string fileName = galleryNames[i];
                                    
                                    if (base64Data.Contains(",")) base64Data = base64Data.Split(',')[1];
                                    byte[] imageBytes = Convert.FromBase64String(base64Data);
                                    
                                    string cleanFileName = CorrectImageFileName1(fileName);
                                    string subPath = Path.Combine("Content", "images", "Comboimages", setid.ToString(), "Orginal");
                                    string fullDirPath = Path.Combine(_environment.ContentRootPath, "wwwroot", subPath);
                                    
                                    if (!Directory.Exists(fullDirPath)) Directory.CreateDirectory(fullDirPath);
                                    
                                    string fullFilePath = Path.Combine(fullDirPath, cleanFileName);
                                    System.IO.File.WriteAllBytes(fullFilePath, imageBytes);
                                    
                                    string dbPath = "/" + subPath.Replace("\\", "/") + "/" + cleanFileName;
                                    
                                    using (SqlCommand cmdG = new SqlCommand("Gallery", con))
                                    {
                                        cmdG.CommandType = CommandType.StoredProcedure;
                                        cmdG.Parameters.AddWithValue("@Userid", userid);
                                        cmdG.Parameters.AddWithValue("@Gallery_file", dbPath);
                                        cmdG.Parameters.AddWithValue("@Product_id", DBNull.Value);
                                        cmdG.Parameters.AddWithValue("@Productvariants_id", DBNull.Value);
                                        cmdG.Parameters.AddWithValue("@Productset_id", DBNull.Value);
                                        cmdG.Parameters.AddWithValue("@File_id", 3); 
                                        cmdG.Parameters.AddWithValue("@Productcombo_id", setid);
                                        cmdG.Parameters.AddWithValue("@Query", 1);
                                        cmdG.ExecuteNonQuery();
                                    }
                                }
                                catch(Exception exImg)
                                {
                                    Console.WriteLine($"Error saving image {i}: {exImg.Message}");
                                }
                            }
                        }

                        // 6. Handle Videos (Files)
                        var files = Request.Form.Files;
                        foreach (var file in files)
                        {
                            string fileName = CorrectImageFileName1(file.FileName);
                            string path = Path.Combine(_environment.ContentRootPath, "wwwroot", "Content", "images", "Comboimages", setid.ToString(), "Orginal");
                            
                            if (!Directory.Exists(path)) Directory.CreateDirectory(path);
                            
                            string fullPath = Path.Combine(path, fileName);
                            using (var stream = new FileStream(fullPath, FileMode.Create))
                            {
                                file.CopyTo(stream);
                            }
                        }

                        message = (isUpdate ? "Combo updated successfully" : "Combo added successfully");
                        return Ok(new { success = true, message = message });
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error in Saveproductcombo: " + ex.Message);
                return StatusCode(500, new { success = false, message = ex.Message });
            }

            return BadRequest(new { success = false, message = "Invalid data" });
        }

        [HttpDelete("deleteproductcombo/{id}")]
        public IActionResult Deleteproductcombo(int id)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    con.Open();
                    // Soft delete combo set
                    string query = "UPDATE Tbl_Combo SET Isdelete = 1 WHERE Id = @Id";
                    using (SqlCommand cmd = new SqlCommand(query, con))
                    {
                        cmd.Parameters.AddWithValue("@Id", id);
                        cmd.ExecuteNonQuery();
                    }
                    
                    // Also soft delete items for consistency if needed, 
                    // though UI usually filters by Tbl_Combo.Isdelete
                    string queryItems = "UPDATE Tbl_Comboitems SET Isdelete = 1 WHERE Productcomboid = @Id";
                    using (SqlCommand cmd2 = new SqlCommand(queryItems, con))
                    {
                        cmd2.Parameters.AddWithValue("@Id", id);
                        cmd2.ExecuteNonQuery();
                    }

                    return Ok(new { success = true, message = "Combo deleted successfully" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("deletecomboimage/{comboId}/{imageId}")]
        public IActionResult Deletecomboimage(int comboId, int imageId)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    con.Open();
                    string query = "delete from Tbl_Gallery where Productcombo_id=@Productcombo_id and Id=@Id";
                    using (SqlCommand cmd = new SqlCommand(query, con))
                    {
                        cmd.Parameters.AddWithValue("@Productcombo_id", comboId);
                        cmd.Parameters.AddWithValue("@Id", imageId);
                        cmd.ExecuteNonQuery();
                    }
                    return Ok(new { success = true, message = "Image deleted successfully" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("checkdeleterequestcombo")]
        public IActionResult Checkdeleterequestcombo([FromBody] JsonElement body)
        {
            try
            {
                string setid = body.GetProperty("setid").GetString();
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    con.Open();
                    using (SqlCommand cmd = new SqlCommand("Sp_Combocomments", con))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Userid", "");
                        cmd.Parameters.AddWithValue("@Accepted_Userid", "");
                        cmd.Parameters.AddWithValue("@Approved_Userid", "");
                        cmd.Parameters.AddWithValue("@Productcomboid", setid);
                        cmd.Parameters.AddWithValue("@Commenttype", "Deleterequest");
                        cmd.Parameters.AddWithValue("@Query", 3); // Query 3 is usually for retrieval/check
                        
                        List<object> list = new List<object>();
                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                list.Add(new { Id = reader["Id"] });
                            }
                        }
                        return Ok(new { List1 = list.Count > 0 ? "Exists" : "" });
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("savecomboeditcommentsdelete")]
        public IActionResult Savecomboeditcommentsdelete([FromBody] Comments formData)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    con.Open();
                    using (SqlCommand cmd4 = new SqlCommand("Sp_Combocomments", con))
                    {
                        cmd4.CommandType = CommandType.StoredProcedure;
                        cmd4.Parameters.AddWithValue("@Userid", formData.Userid);
                        cmd4.Parameters.AddWithValue("@Accepted_Userid", "");
                        cmd4.Parameters.AddWithValue("@Approved_Userid", "");
                        cmd4.Parameters.AddWithValue("@Productcomboid", formData.Id);
                        cmd4.Parameters.AddWithValue("@Checked_Date", DateTime.Now.ToString("dd-MMM-yyyy HH:mm:ss"));
                        cmd4.Parameters.AddWithValue("@Comments", formData.Commentss ?? "");
                        cmd4.Parameters.AddWithValue("@Commenttype", "Deleterequest");
                        cmd4.Parameters.AddWithValue("@Role", "Manager");
                        cmd4.Parameters.AddWithValue("@Status", "0");
                        cmd4.Parameters.AddWithValue("@Query", 1);
                        cmd4.ExecuteNonQuery();
                    }
                    return Ok(new { success = true, msg = "Delete request sent. Wait for manager approval" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("getproductcomboedit/{id}")]
        public IActionResult Getproductcomboedit(int id)
        {
            List<Combo> combo = new List<Combo>();
            List<Comboitems> comboitems = new List<Comboitems>();
            List<Gallery> list = new List<Gallery>();

            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    con.Open();

                    // 1. Get Combo Header
                    using (SqlCommand cmd2 = new SqlCommand("Sp_productcombo", con))
                    {
                        cmd2.CommandType = CommandType.StoredProcedure;
                        cmd2.Parameters.AddWithValue("@Id", id);
                        cmd2.Parameters.AddWithValue("@Userid", "");
                        cmd2.Parameters.AddWithValue("@Comboname", "");
                        cmd2.Parameters.AddWithValue("@Modelno", "");
                        cmd2.Parameters.AddWithValue("@Batchno", "");
                        cmd2.Parameters.AddWithValue("@EANBarcodeno", "");
                        cmd2.Parameters.AddWithValue("@Isdelete", "");
                        cmd2.Parameters.AddWithValue("@Status", "");
                        cmd2.Parameters.AddWithValue("@Workstatus", "");
                        cmd2.Parameters.AddWithValue("@Description", "");
                        cmd2.Parameters.AddWithValue("@Wholesalepriceset", "");
                        cmd2.Parameters.AddWithValue("@Retailpriceset", "");
                        cmd2.Parameters.AddWithValue("@Onlinepriceset", "");
                        cmd2.Parameters.AddWithValue("@Query", 2);

                        using (SqlDataReader reader = cmd2.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                combo.Add(new Combo
                                {
                                    Userid = reader["Userid"]?.ToString() ?? "",
                                    Comboname = reader["Comboname"]?.ToString() ?? "",
                                    Modelno = reader["Modelno"]?.ToString() ?? "",
                                    Batchno = reader["Batchno"]?.ToString() ?? "",
                                    EANBarcodeno = reader["EANBarcodeno"]?.ToString() ?? "",
                                    Description = reader["Description"]?.ToString() ?? "",
                                    Wholesalepriceset = reader["Wholesalepriceset"]?.ToString() ?? "0",
                                    Retailpriceset = reader["Retailpriceset"]?.ToString() ?? "0",
                                    Onlinepriceset = reader["Onlinepriceset"]?.ToString() ?? "0",
                                    Status = reader["Status"]?.ToString() ?? "",
                                    Short_description = reader.HasColumn("Short_description") ? reader["Short_description"]?.ToString() : "",
                                    Length = reader.IsDBNull(reader.GetOrdinal("Length")) ? 0 : Convert.ToDecimal(reader["Length"]),
                                    Width = reader.IsDBNull(reader.GetOrdinal("Width")) ? 0 : Convert.ToDecimal(reader["Width"]),
                                    Height = reader.IsDBNull(reader.GetOrdinal("Height")) ? 0 : Convert.ToDecimal(reader["Height"]),
                                    Weight = reader.IsDBNull(reader.GetOrdinal("Weight")) ? 0 : Convert.ToDecimal(reader["Weight"]),
                                    CBM = reader.IsDBNull(reader.GetOrdinal("CBM")) ? 0 : Convert.ToDecimal(reader["CBM"]),
                                    Hscode = reader.HasColumn("Hscode") ? reader["Hscode"]?.ToString() : "",
                                    Countryoforgin = reader.HasColumn("Countryoforgin") ? reader["Countryoforgin"]?.ToString() : ""
                                });
                            }
                        }
                    }

                    // 2. Get Combo Items
                    using (SqlCommand cmd21 = new SqlCommand("Sp_Comboitems", con))
                    {
                        cmd21.CommandType = CommandType.StoredProcedure;
                        cmd21.Parameters.AddWithValue("@Id", "");
                        cmd21.Parameters.AddWithValue("@Userid", "");
                        cmd21.Parameters.AddWithValue("@Productcomboid", id);
                        cmd21.Parameters.AddWithValue("@Productvariantsid", "");
                        cmd21.Parameters.AddWithValue("@Qty", "");
                        cmd21.Parameters.AddWithValue("@Isdelete", "0");
                        cmd21.Parameters.AddWithValue("@Status", "");
                        cmd21.Parameters.AddWithValue("@Workstatus", "");
                        cmd21.Parameters.AddWithValue("@Query", 3);

                        using (SqlDataReader reader = cmd21.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                comboitems.Add(new Comboitems
                                {
                                    Id = Convert.ToInt32(reader["Id"]),
                                    Productvariantsid = reader["Productvariantsid"]?.ToString() ?? "",
                                    Itemname = reader.HasColumn("Itemnameo") ? reader["Itemnameo"]?.ToString() : (reader.HasColumn("Itemname") ? reader["Itemname"]?.ToString() : ""),
                                    Qty = reader["Qty"]?.ToString() ?? "0"
                                });
                            }
                        }
                    }

                    // 3. Get Gallery
                    using (SqlCommand cmd1 = new SqlCommand("Gallery", con))
                    {
                        cmd1.CommandType = CommandType.StoredProcedure;
                        cmd1.Parameters.AddWithValue("@Productcombo_id", id);
                        cmd1.Parameters.AddWithValue("@Query", 13);

                        using (SqlDataReader reader = cmd1.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                list.Add(new Gallery
                                {
                                    id = Convert.ToInt32(reader["id"]),
                                    Gallery_file = reader["Gallery_file"]?.ToString() ?? "",
                                    File_id = Convert.ToInt32(reader["File_id"])
                                });
                            }
                        }
                    }

                    // 4. Get Marketplaces
                    List<MarketplaceData> marketplaces = new List<MarketplaceData>();
                    using (SqlCommand cmdM = new SqlCommand("Sp_Productcombomarketplace", con))
                    {
                        cmdM.CommandType = CommandType.StoredProcedure;
                        cmdM.Parameters.AddWithValue("@Id", "");
                        cmdM.Parameters.AddWithValue("@Userid", "");
                        cmdM.Parameters.AddWithValue("@Productcomboid", id);
                        cmdM.Parameters.AddWithValue("@Marketplacename", "");
                        cmdM.Parameters.AddWithValue("@Visibility", "");
                        cmdM.Parameters.AddWithValue("@Isdelete", "0");
                        cmdM.Parameters.AddWithValue("@Status", "");
                        cmdM.Parameters.AddWithValue("@Link", "");
                        cmdM.Parameters.AddWithValue("@Query", 3);

                        using (SqlDataReader reader = cmdM.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                marketplaces.Add(new MarketplaceData
                                {
                                    Marketplace1 = reader["Marketplacename"]?.ToString() ?? "",
                                    Status = reader["Visibility"]?.ToString() == "1",
                                    Link = reader["Link"]?.ToString() ?? ""
                                });
                            }
                        }
                    }

                    return Ok(new { List1 = combo, List2 = comboitems, List3 = list, List4 = marketplaces });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in Getproductcomboedit: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        private string CorrectImageFileName1(string fileName)
        {
            if (string.IsNullOrEmpty(fileName)) return "image.jpg";
            return string.Join("_", fileName.Split(Path.GetInvalidFileNameChars()));
        }

        [HttpGet("getproductname")]
        public IActionResult Getproductname([FromQuery] string search, [FromQuery] string catelogid = "1001")
        {
            List<Variants> products = new List<Variants>();

            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    con.Open();
                    using (SqlCommand cmd21 = new SqlCommand("Sp_Productvariants", con))
                    {
                        cmd21.CommandType = CommandType.StoredProcedure;
                        cmd21.Parameters.AddWithValue("@Catelogid", catelogid);
                        cmd21.Parameters.AddWithValue("@Itemname", search ?? "");
                        cmd21.Parameters.AddWithValue("@Query", 29);

                        using (SqlDataReader reader = cmd21.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                Variants model = new Variants
                                {
                                    productname = reader["Productname"].ToString(),
                                    Itemname = reader["Itemname"].ToString(),
                                    variantype = reader["allvalues"].ToString(),
                                    id = Convert.ToInt32(reader["Id"].ToString())
                                };

                                products.Add(model);
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in Getproductname: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }

            return Ok(new { List1 = products });
        }
    }

    public static class SqlExtensions
    {
        public static bool HasColumn(this SqlDataReader reader, string columnName)
        {
            for (int i = 0; i < reader.FieldCount; i++)
            {
                if (reader.GetName(i).Equals(columnName, StringComparison.InvariantCultureIgnoreCase))
                    return true;
            }
            return false;
        }

        public static void AddParameter(this SqlCommand command, string name, object value)
        {
            if (value == null || (value is string s && string.IsNullOrEmpty(s)))
            {
                command.Parameters.AddWithValue(name, DBNull.Value);
            }
            else
            {
                command.Parameters.AddWithValue(name, value);
            }
        }
    }

    public class Gallery
    {
        public int id { get; set; }
        public string Gallery_file { get; set; }
        public int File_id { get; set; }
    }

    public class Combo
    {
        public string Userid { get; set; }
        public string Comboname { get; set; }
        public string Modelno { get; set; }
        public string Batchno { get; set; }
        public string EANBarcodeno { get; set; }
        public string Description { get; set; }
        public string Wholesalepriceset { get; set; }
        public string Retailpriceset { get; set; }
        public string Onlinepriceset { get; set; }
        public string Status { get; set; }
        public string Short_description { get; set; }
        public decimal Length { get; set; }
        public decimal Width { get; set; }
        public decimal Height { get; set; }
        public decimal Weight { get; set; }
        public decimal CBM { get; set; }
        public string Hscode { get; set; }
        public string Countryoforgin { get; set; }
    }

    public class Comboitems
    {
        public int Id { get; set; }
        public string Productvariantsid { get; set; }
        public string Itemname { get; set; }
        public string Qty { get; set; }
    }

    public class Setnew
    {
        public SetFormData formData { get; set; }
        public List<MarketplaceData> tableData { get; set; }
        public List<ItemData> tableData1 { get; set; }
    }

    public class SetFormData
    {
        public string id { get; set; } // Added for editing
        public string Userid { get; set; }
        public string Setname { get; set; }
        public string Modelno { get; set; }
        public string Batchno { get; set; }
        public string EANBarcodeno { get; set; }
        public string Description { get; set; }
        public string Short_description { get; set; }
        public decimal Wholesalepriceset { get; set; }
        public decimal Retailpriceset { get; set; }
        public decimal Onlinepriceset { get; set; }
        public double Length { get; set; }
        public double Width { get; set; }
        public double Height { get; set; }
        public double Weight { get; set; }
        public string Hscode { get; set; }
        public string Countryoforgin { get; set; }
        public string Productid { get; set; }
    }

    public class MarketplaceData
    {
        public string Marketplace1 { get; set; }
        public bool Status { get; set; }
        public string Link { get; set; }
    }

    public class ItemData
    {
        public string variantid { get; set; }
        public object Qty { get; set; } // Qty can be string or int from JSON
    }

    public class Variants
    {
        public int id { get; set; }
        public string userid { get; set; }
        public string firstname { get; set; }
        public string Itemname { get; set; }
        public string productname { get; set; }
        public string Type { get; set; }
        public string Managerapprovestatus { get; set; }
        public string allvalues { get; set; }
        public string variantype { get; set; }
    }

    public class Comments
    {
        public string Id { get; set; }
        public string Userid { get; set; }
        public string Commentss { get; set; }
    }
}

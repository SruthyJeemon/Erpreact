using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Text.Json;
using System.IO;
using Microsoft.AspNetCore.Hosting;
using System.Drawing;
using System.Drawing.Imaging;
using System.Drawing.Drawing2D;
using Newtonsoft.Json;
using System.Linq;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System;

namespace Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductController : ControllerBase
    {
        private static string mapStatus(object value)
        {
            var s = value?.ToString()?.Trim();
            if (string.IsNullOrEmpty(s) || s == "0") return "Pending";
            if (s == "1" || s.Equals("approved", StringComparison.OrdinalIgnoreCase)) return "Approved";
            if (s == "2" || s.Equals("rejected", StringComparison.OrdinalIgnoreCase)) return "Rejected";
            return s;
        }

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

        [HttpGet("variants/{productId}")]
        public async Task<IActionResult> GetVariants(string productId)
        {
            productId = productId?.Trim();
            List<Variants> rawVariants = new List<Variants>();
            try
            {
                Console.WriteLine($"[DEBUG] GetVariants (Consolidated) called for ProductId: '{productId}'");
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    await con.OpenAsync();
                    using (SqlCommand cmd = new SqlCommand("Sp_Productvariants", con))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Query", 10);
                        cmd.Parameters.AddWithValue("@Productid", productId ?? "");
                        cmd.Parameters.AddWithValue("@Itemname", productId ?? "");
                        cmd.Parameters.AddWithValue("@Status", "Active");
                        cmd.Parameters.AddWithValue("@Isdelete", 0);
                        cmd.Parameters.AddWithValue("@Parentid", 0);
                        cmd.Parameters.AddWithValue("@Id", 0);
                        
                        using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                try 
                                {
                                    string mapStatus(object val) {
                                        if (val == null || val == DBNull.Value) return "Pending";
                                        string s = val.ToString().Trim();
                                        if (s == "1") return "Approved";
                                        if (s == "2") return "Rejected";
                                        return "Pending";
                                    }

                                    Variants v = new Variants
                                    {
                                        id = reader.IsDBNull(reader.GetOrdinal("Id")) ? 0 : Convert.ToInt32(reader["Id"]),
                                        productid = reader.IsDBNull(reader.GetOrdinal("Productid")) ? "" : reader["Productid"].ToString(),
                                        userid = reader.IsDBNull(reader.GetOrdinal("Userid")) ? "" : reader["Userid"].ToString(),
                                        Itemname = reader.IsDBNull(reader.GetOrdinal("Itemname")) ? "" : reader["Itemname"].ToString(),
                                        productname = reader.IsDBNull(reader.GetOrdinal("Productname")) ? "" : reader["Productname"].ToString(),
                                        allvalues = reader.IsDBNull(reader.GetOrdinal("allvalues")) ? "" : reader["allvalues"].ToString(),
                                        totalqty = reader.IsDBNull(reader.GetOrdinal("Totalqty")) ? "0" : reader["Totalqty"].ToString(),
                                        totalqtyonline = reader.IsDBNull(reader.GetOrdinal("Noofqty_online")) ? "0" : reader["Noofqty_online"].ToString(),
                                        brand = reader.IsDBNull(reader.GetOrdinal("Brand")) ? "N/A" : reader["Brand"].ToString(),
                                        Brandname = reader.IsDBNull(reader.GetOrdinal("Brand")) ? "N/A" : reader["Brand"].ToString(),
                                        firstname = reader.IsDBNull(reader.GetOrdinal("Firstname")) ? "Unknown" : reader["Firstname"].ToString(),
                                        status = reader.IsDBNull(reader.GetOrdinal("Status")) ? "Inactive" : reader["Status"].ToString(),
                                        Managerapprovestatus = mapStatus(reader["Managerapprovestatus"]),
                                        Warehouseapprovestatus = mapStatus(reader["Warehouseapprovestatus"]),
                                        Accountsapprovestatus = mapStatus(reader["Accountsapprovestatus"]),
                                        Onlineprice = reader.IsDBNull(reader.GetOrdinal("Onlineprice")) ? "0" : reader["Onlineprice"].ToString(),
                                        Wholesaleprice = reader.IsDBNull(reader.GetOrdinal("Wholesaleprice")) ? "0" : reader["Wholesaleprice"].ToString(),
                                        Retailprice = reader.IsDBNull(reader.GetOrdinal("Retailprice")) ? "0" : reader["Retailprice"].ToString(),
                                        modelno = reader.IsDBNull(reader.GetOrdinal("Modelno")) ? "N/A" : reader["Modelno"].ToString(),
                                        batchno = reader.IsDBNull(reader.GetOrdinal("Batchno")) ? "N/A" : reader["Batchno"].ToString(),
                                        barcodeno = reader.IsDBNull(reader.GetOrdinal("EANBarcodeno")) ? "N/A" : reader["EANBarcodeno"].ToString(),
                                        Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? "" : reader["Description"].ToString()
                                    };
                                    rawVariants.Add(v);
                                }
                                catch (Exception rowEx)
                                {
                                    Console.WriteLine($"[ERROR] Error mapping row {productId}: {rowEx.Message}");
                                }
                            }
                        }
                    }
                }

                // Consolidate duplicates by Item Characteristics to handle split IDs
                var consolidated = rawVariants.GroupBy(v => new { 
                    Name = v.Itemname ?? "", 
                    Brand = v.brand ?? "", 
                    Model = v.modelno ?? "", 
                    Barcode = v.barcodeno ?? "" 
                }).Select(group =>
                {
                    var first = group.First();
                    // Merge allvalues from all rows in this group
                    var allvals = string.Join(", ", group.Select(v => v.allvalues)
                                        .Where(s => !string.IsNullOrEmpty(s))
                                        .SelectMany(s => s.Split(',', StringSplitOptions.RemoveEmptyEntries))
                                        .Select(s => s.Trim())
                                        .Distinct());
                    
                    first.allvalues = allvals;
                    first.VariantsAndValues = allvals; 
                    
                    // Approval Statuses (Text based)
                    first.managerStatus = first.Managerapprovestatus;
                    first.warehouseStatus = first.Warehouseapprovestatus;
                    first.accountsStatus = first.Accountsapprovestatus;
                    first.username = first.firstname;
                    
                    // Sum quantities if multiple rows are merged
                    if (group.Count() > 1) {
                         double total = 0;
                         double totalOnline = 0;
                         foreach(var item in group) {
                             double.TryParse(item.totalqty, out double q);
                             double.TryParse(item.totalqtyonline, out double qo);
                             total += q;
                             totalOnline += qo;
                         }
                         first.totalqty = total.ToString();
                         first.totalqtyonline = totalOnline.ToString();
                    }

                    Console.WriteLine($"[DEBUG] Consolidated {group.Key.Name} ({group.Key.Brand}), Attributes: {allvals}");
                    
                    return first;
                }).ToList();

                Console.WriteLine($"[DEBUG] Successfully fetched and consolidated to {consolidated.Count} unique variants for product '{productId}'");
                return Ok(consolidated);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Exception in GetVariants for '{productId}': {ex.Message}");
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        [HttpGet("getproductitemdetailsfull")]
        public async Task<IActionResult> Getproductitemdetailsfull(int pageIndex, int pageSize, string itemname = "", string catelogid = "")
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
                        cmd21.Parameters.AddWithValue("@Catelogid", string.IsNullOrEmpty(catelogid) ? DBNull.Value : (object)catelogid);
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
                    var options = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var data = System.Text.Json.JsonSerializer.Deserialize<Setnew>(jsonData, options);

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
                            cmd.Parameters.AddWithValue("@Date", DateTime.Now.ToString("MMM d yyyy h:mmtt"));
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
                        cmd4.Parameters.AddWithValue("@Checked_Date", DateTime.Now.ToString("MMM d yyyy h:mmtt"));
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

        [HttpPost("getBeforevariantvaluesedit")]
        public IActionResult GetBeforevariantvaluesedit([FromBody] Variantsnew data)
        {
            string message = "";
            var formData = data.formData;
            var tableData1 = data.tableData1;

            try
            {
                var variantList = new List<string>();
                foreach (var rowData in tableData1)
                {
                    string itemname = "", itemvalue = "";
                    if (rowData.ContainsKey("column_1")) itemname = rowData["column_1"];
                    if (rowData.ContainsKey("column_2")) itemvalue = rowData["column_2"];

                    if (!string.IsNullOrEmpty(itemname) && !string.IsNullOrEmpty(itemvalue))
                    {
                        variantList.Add($"{itemname}-{itemvalue}");
                    }
                }

                string variants = string.Join(",", variantList);
                string connectionString = _configuration.GetConnectionString("DefaultConnection");

                using (var connection = new SqlConnection(connectionString))
                {
                    connection.Open();
                    SqlCommand command = new SqlCommand("Sp_ProductVariants", connection);
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.AddWithValue("@Productid", formData.productid);
                    command.Parameters.AddWithValue("@Query", 11);

                    // Add dummy values for all other required SP parameters
                    command.Parameters.AddWithValue("@Id", "");
                    command.Parameters.AddWithValue("@Userid", "");
                    command.Parameters.AddWithValue("@Productname", "");
                    command.Parameters.AddWithValue("@Varianttype", "");
                    command.Parameters.AddWithValue("@Value", "");
                    command.Parameters.AddWithValue("@Totalqty", "");
                    command.Parameters.AddWithValue("@Noofqty_online", "");
                    command.Parameters.AddWithValue("@Modelno", "");
                    command.Parameters.AddWithValue("@Warehousecheck", "");
                    command.Parameters.AddWithValue("@Batchno", "");
                    command.Parameters.AddWithValue("@EANBarcodeno", "");
                    command.Parameters.AddWithValue("@Isdelete", "");
                    command.Parameters.AddWithValue("@Status", "");
                    command.Parameters.AddWithValue("@Managerapprovestatus", "");
                    command.Parameters.AddWithValue("@Warehouseapprovestatus", "");
                    command.Parameters.AddWithValue("@Accountsapprovestatus", "");
                    command.Parameters.AddWithValue("@Parentid", "");
                    command.Parameters.AddWithValue("@Ischild", "");
                    command.Parameters.AddWithValue("@Date", "");

                    SqlDataAdapter da = new SqlDataAdapter(command);
                    DataTable dt = new DataTable();
                    da.Fill(dt);
                    if (dt.Rows.Count > 0)
                    {
                        foreach (DataRow row in dt.Rows)
                        {
                            var variantvalues = row["allvalues"].ToString();
                            bool areEqual = AreStringsEquivalent(variants, variantvalues);

                            if (formData.id == Convert.ToInt32(row["Id"].ToString()))
                            {
                                // Current item, skip comparison or handle as needed
                            }
                            else if (areEqual)
                            {
                                message = "Allready saved this variant value";
                                break;
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                message = "An error occurred: " + ex.Message;
            }

            return Ok(new { message = message });
        }

        private bool AreStringsEquivalent(string str1, string str2)
        {
            if (string.IsNullOrEmpty(str1) || string.IsNullOrEmpty(str2)) return str1 == str2;
            var list1 = str1.Split(',').Select(s => s.Trim()).OrderBy(s => s).ToList();
            var list2 = str2.Split(',').Select(s => s.Trim()).OrderBy(s => s).ToList();
            return list1.SequenceEqual(list2);
        }

        private decimal? SafeConvertToDecimal(object value)
        {
            if (value == null || string.IsNullOrWhiteSpace(value.ToString())) return null;
            if (decimal.TryParse(value.ToString(), out decimal result)) return result;
            return null;
        }

        private void AdjustImageOrientation(Bitmap img)
        {
            if (img.PropertyIdList.Contains(0x112))
            {
                int rotationValue = img.GetPropertyItem(0x112).Value[0];
                switch (rotationValue)
                {
                    case 2: img.RotateFlip(RotateFlipType.RotateNoneFlipX); break;
                    case 3: img.RotateFlip(RotateFlipType.Rotate180FlipNone); break;
                    case 4: img.RotateFlip(RotateFlipType.Rotate180FlipX); break;
                    case 5: img.RotateFlip(RotateFlipType.Rotate90FlipX); break;
                    case 6: img.RotateFlip(RotateFlipType.Rotate90FlipNone); break;
                    case 7: img.RotateFlip(RotateFlipType.Rotate270FlipX); break;
                    case 8: img.RotateFlip(RotateFlipType.Rotate270FlipNone); break;
                }
            }
        }


        private string GetCatelogId(string userid)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    con.Open();
                    string query = "SELECT Catelogid FROM Tbl_Registration WHERE Userid = @Userid";
                    using (SqlCommand cmd = new SqlCommand(query, con))
                    {
                        cmd.Parameters.AddWithValue("@Userid", userid ?? "");
                        var result = cmd.ExecuteScalar();
                        return result?.ToString() ?? "1";
                    }
                }
            }
            catch { return "1"; }
        }

        private (string Active, string INActive, string Count) getCount()
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    con.Open();
                    string query = @"
                        SELECT 
                            SUM(CASE WHEN Status = 'Active' THEN 1 ELSE 0 END) as Active,
                            SUM(CASE WHEN Status = 'InActive' THEN 1 ELSE 0 END) as INActive,
                            COUNT(*) as Total
                        FROM Tbl_Productvariants WHERE Isdelete = 0";
                    using (SqlCommand cmd = new SqlCommand(query, con))
                    using (SqlDataReader r = cmd.ExecuteReader())
                    {
                        if (r.Read())
                        {
                            return (r["Active"].ToString(), r["INActive"].ToString(), r["Total"].ToString());
                        }
                    }
                }
            }
            catch { }
            return ("0", "0", "0");
        }

        [HttpPost("editvariantitem")]
        [Consumes("multipart/form-data")]
        public IActionResult Editvariantitem()
        {
            List<Variants> variants = new List<Variants>();
            string message = "";
            string dbsavedpath = "", parentidnew = "";

            try
            {
                var jsonData = Request.Form["jsonData"].ToString();
                if (string.IsNullOrEmpty(jsonData)) return BadRequest("Missing jsonData");

                var data = JsonConvert.DeserializeObject<Variantsnew>(jsonData);
                if (data == null) return BadRequest("Invalid JSON data");

                bool isNewVariant = (data.formData.id == 0 || data.formData.id.ToString() == "0");
                string userid = data.formData.userid;
                string catelogid = GetCatelogId(userid);
                string connectionString = _configuration.GetConnectionString("DefaultConnection");

                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    con.Open();

                    // Step 0: Directly update the MAIN variant record if it's an update (id > 0)
                    if (!isNewVariant)
                    {
                        using (SqlCommand cmdMain = new SqlCommand("Sp_Productvariants", con))
                        {
                            cmdMain.CommandType = CommandType.StoredProcedure;
                            cmdMain.Parameters.AddWithValue("@Id", data.formData.id);
                            cmdMain.Parameters.AddWithValue("@Userid", ""); // Optional during update
                            cmdMain.Parameters.AddWithValue("@Productid", data.formData.productid ?? "");
                            cmdMain.Parameters.AddWithValue("@Productname", data.formData.productname ?? "");
                            cmdMain.Parameters.AddWithValue("@Modelno", data.formData.modelno ?? "");
                            cmdMain.Parameters.AddWithValue("@Warehousecheck", data.formData.Warehousecheck ?? "0");
                            cmdMain.Parameters.AddWithValue("@Batchno", data.formData.batchno ?? "");
                            cmdMain.Parameters.AddWithValue("@EANBarcodeno", data.formData.barcodeno ?? "");
                            cmdMain.Parameters.AddWithValue("@Status", data.formData.status ?? "Active");
                            cmdMain.Parameters.AddWithValue("@Description", data.formData.Description ?? "");
                            cmdMain.Parameters.AddWithValue("@Itemname", data.formData.Itemname ?? "");
                            cmdMain.Parameters.AddWithValue("@Wholesaleprice", data.formData.Wholesaleprice ?? "0");
                            cmdMain.Parameters.AddWithValue("@Retailprice", data.formData.Retailprice ?? "0");
                            cmdMain.Parameters.AddWithValue("@Onlineprice", data.formData.Onlineprice ?? "0");
                            cmdMain.Parameters.AddWithValue("@Reorderpoint", data.formData.Reorderpoint ?? "0");
                            cmdMain.Parameters.AddWithValue("@Reorderqty", data.formData.Reorderqty ?? "0");
                            cmdMain.Parameters.AddWithValue("@Defaultlocation", data.formData.Defaultlocation ?? "");
                            cmdMain.Parameters.AddWithValue("@Length", SafeConvertToDecimal(data.formData.Length) ?? (object)DBNull.Value);
                            cmdMain.Parameters.AddWithValue("@Width", SafeConvertToDecimal(data.formData.Width) ?? (object)DBNull.Value);
                            cmdMain.Parameters.AddWithValue("@Height", SafeConvertToDecimal(data.formData.Height) ?? (object)DBNull.Value);
                            cmdMain.Parameters.AddWithValue("@Weight", SafeConvertToDecimal(data.formData.Weight) ?? (object)DBNull.Value);
                            cmdMain.Parameters.AddWithValue("@Standarduom", data.formData.Standarduom ?? "");
                            cmdMain.Parameters.AddWithValue("@Salesuom", data.formData.Salesuom ?? "");
                            cmdMain.Parameters.AddWithValue("@Purchaseuom", data.formData.Purchaseuom ?? "");
                            cmdMain.Parameters.AddWithValue("@Remarks", data.formData.Remarks ?? "");
                            cmdMain.Parameters.AddWithValue("@Serialized", data.formData.Serialized ?? "0");
                            cmdMain.Parameters.AddWithValue("@Agecategory", data.formData.Agecategory ?? "");
                            cmdMain.Parameters.AddWithValue("@Hscode", data.formData.Hscode ?? "");
                            cmdMain.Parameters.AddWithValue("@Country_orgin", data.formData.Country_orgin ?? "");
                            cmdMain.Parameters.AddWithValue("@Short_description", data.formData.Short_description ?? "");
                            cmdMain.Parameters.AddWithValue("@Brandid", data.formData.Brandid ?? "");
                            cmdMain.Parameters.AddWithValue("@Isdelete", 0);
                            
                            double lengthCm = (double)(SafeConvertToDecimal(data.formData.Length) ?? 0);
                            double widthCm = (double)(SafeConvertToDecimal(data.formData.Width) ?? 0);
                            double heightCm = (double)(SafeConvertToDecimal(data.formData.Height) ?? 0);
                            double cbm = (lengthCm / 100.0) * (widthCm / 100.0) * (heightCm / 100.0);
                            cmdMain.Parameters.AddWithValue("@CBM", cbm);
                            
                            cmdMain.Parameters.AddWithValue("@Query", 2); 
                            cmdMain.ExecuteNonQuery();
                        }
                    }

                    // Step 1: Update/Insert Attributes (Child Rows)
                    foreach (var rowData in data.tableData1)
                    {
                        string itemname = "", itemvalue = "", parentitem = "";
                        if (rowData.ContainsKey("column_0")) parentitem = rowData["column_0"];
                        if (rowData.ContainsKey("column_1")) itemname = rowData["column_1"];
                        if (rowData.ContainsKey("column_2")) itemvalue = rowData["column_2"];

                        if (!string.IsNullOrEmpty(parentitem))
                        {
                            using (SqlCommand cmd = new SqlCommand("select Parentid from Tbl_Productvariants where Id=@Id", con))
                            {
                                cmd.Parameters.AddWithValue("@Id", parentitem);
                                var pid = cmd.ExecuteScalar();
                                if (pid != null && Convert.ToInt32(pid) == 0) parentidnew = parentitem;
                            }
                        }

                        using (SqlCommand cmd2 = new SqlCommand("Sp_Productvariants", con))
                        {
                            cmd2.CommandType = CommandType.StoredProcedure;
                            cmd2.Parameters.AddWithValue("@Id", string.IsNullOrEmpty(parentitem) ? (object)DBNull.Value : parentitem);
                            cmd2.Parameters.AddWithValue("@Userid", string.IsNullOrEmpty(parentitem) ? data.formData.userid : "");
                            cmd2.Parameters.AddWithValue("@Productid", string.IsNullOrEmpty(parentitem) ? data.formData.productid : "");
                            cmd2.Parameters.AddWithValue("@Productname", string.IsNullOrEmpty(parentitem) ? data.formData.productname : "");
                            cmd2.Parameters.AddWithValue("@Varianttype", itemname ?? "");
                            cmd2.Parameters.AddWithValue("@Value", itemvalue ?? "");
                            cmd2.Parameters.AddWithValue("@Totalqty", DBNull.Value);
                            cmd2.Parameters.AddWithValue("@Noofqty_online", data.formData.totalqtyonline ?? "0");
                            cmd2.Parameters.AddWithValue("@Modelno", data.formData.modelno ?? "");
                            cmd2.Parameters.AddWithValue("@Warehousecheck", data.formData.Warehousecheck ?? "0");
                            cmd2.Parameters.AddWithValue("@Batchno", data.formData.batchno ?? "");
                            cmd2.Parameters.AddWithValue("@EANBarcodeno", data.formData.barcodeno ?? "");
                            cmd2.Parameters.AddWithValue("@Isdelete", 0);
                            cmd2.Parameters.AddWithValue("@Status", data.formData.status ?? "Active");
                            cmd2.Parameters.AddWithValue("@Managerapprovestatus", "0");
                            cmd2.Parameters.AddWithValue("@Warehouseapprovestatus", "0");
                            cmd2.Parameters.AddWithValue("@Accountsapprovestatus", "0");
                            cmd2.Parameters.AddWithValue("@Parentid", !string.IsNullOrEmpty(parentitem) ? "" : data.formData.id.ToString());
                            cmd2.Parameters.AddWithValue("@Ischild", !string.IsNullOrEmpty(parentitem) ? 0 : 1);
                            cmd2.Parameters.AddWithValue("@Date", DateTime.Now.ToString("MMM d yyyy h:mmtt"));
                            cmd2.Parameters.AddWithValue("@Description", data.formData.Description ?? "");
                            cmd2.Parameters.AddWithValue("@Itemname", data.formData.Itemname ?? "");
                            cmd2.Parameters.AddWithValue("@Wholesaleprice", data.formData.Wholesaleprice ?? "0");
                            cmd2.Parameters.AddWithValue("@Retailprice", data.formData.Retailprice ?? "0");
                            cmd2.Parameters.AddWithValue("@Onlineprice", data.formData.Onlineprice ?? "0");
                            cmd2.Parameters.AddWithValue("@Reorderpoint", data.formData.Reorderpoint ?? "0");
                            cmd2.Parameters.AddWithValue("@Reorderqty", data.formData.Reorderqty ?? "0");
                            cmd2.Parameters.AddWithValue("@Defaultlocation", data.formData.Defaultlocation ?? "");
                            cmd2.Parameters.AddWithValue("@Length", SafeConvertToDecimal(data.formData.Length) ?? (object)DBNull.Value);
                            cmd2.Parameters.AddWithValue("@Width", SafeConvertToDecimal(data.formData.Width) ?? (object)DBNull.Value);
                            cmd2.Parameters.AddWithValue("@Height", SafeConvertToDecimal(data.formData.Height) ?? (object)DBNull.Value);
                            cmd2.Parameters.AddWithValue("@Weight", SafeConvertToDecimal(data.formData.Weight) ?? (object)DBNull.Value);
                            cmd2.Parameters.AddWithValue("@Standarduom", data.formData.Standarduom ?? "");
                            cmd2.Parameters.AddWithValue("@Salesuom", data.formData.Salesuom ?? "");
                            cmd2.Parameters.AddWithValue("@Purchaseuom", data.formData.Purchaseuom ?? "");
                            cmd2.Parameters.AddWithValue("@Remarks", data.formData.Remarks ?? "");
                            cmd2.Parameters.AddWithValue("@Serialized", data.formData.Serialized ?? "0");
                            cmd2.Parameters.AddWithValue("@Agecategory", data.formData.Agecategory ?? "");
                            cmd2.Parameters.AddWithValue("@Hscode", data.formData.Hscode ?? "");
                            cmd2.Parameters.AddWithValue("@Country_orgin", data.formData.Country_orgin ?? "");
                            cmd2.Parameters.AddWithValue("@Short_description", data.formData.Short_description ?? "");
                            cmd2.Parameters.AddWithValue("@Brandid", data.formData.Brandid ?? "");
                            
                            double lengthCm = (double)(SafeConvertToDecimal(data.formData.Length) ?? 0);
                            double widthCm = (double)(SafeConvertToDecimal(data.formData.Width) ?? 0);
                            double heightCm = (double)(SafeConvertToDecimal(data.formData.Height) ?? 0);
                            double cbm = (lengthCm / 100.0) * (widthCm / 100.0) * (heightCm / 100.0);
                            cmd2.Parameters.AddWithValue("@CBM", cbm);
                            cmd2.Parameters.AddWithValue("@Query", string.IsNullOrEmpty(parentitem) ? 1 : 2);
                            
                            // Capture the ID for new variants
                            var pOutId = new SqlParameter("@id1", SqlDbType.Int) { Direction = ParameterDirection.Output };
                            cmd2.Parameters.Add(pOutId);
                            
                            cmd2.ExecuteNonQuery();
                            
                            // If it was a new variant insertion, update the ID in formData for subsequent steps
                            if (string.IsNullOrEmpty(parentitem) && (data.formData.id == 0 || data.formData.id.ToString() == "0"))
                            {
                                if (pOutId.Value != DBNull.Value)
                                {
                                    data.formData.id = Convert.ToInt32(pOutId.Value);
                                }
                            }
                        }
                    }

                    // Step 2: Marketplace Visibility
                    using (SqlCommand cmd3 = new SqlCommand("Sp_Productmarketplaceadd", con))
                    {
                        cmd3.CommandType = CommandType.StoredProcedure;
                        cmd3.Parameters.AddWithValue("@Userid", DBNull.Value);
                        cmd3.Parameters.AddWithValue("@Productid", DBNull.Value);
                        cmd3.Parameters.AddWithValue("@Productvariantsid", data.formData.id);
                        cmd3.Parameters.AddWithValue("@Marketplacename", DBNull.Value);
                        cmd3.Parameters.AddWithValue("@Visibility", 0);
                        cmd3.Parameters.AddWithValue("@Isdelete", 0);
                        cmd3.Parameters.AddWithValue("@Status", "");
                        cmd3.Parameters.AddWithValue("@Link", "");
                        cmd3.Parameters.AddWithValue("@Id", DBNull.Value);
                        cmd3.Parameters.AddWithValue("@Query", 4);
                        SqlDataAdapter daM = new SqlDataAdapter(cmd3);
                        DataTable dtM = new DataTable();
                        daM.Fill(dtM);

                        foreach (var row in data.tableData)
                        {
                            var existingRow = dtM.AsEnumerable().FirstOrDefault(r => r.Field<string>("Marketplacename") == row.Marketplace1);
                            using (SqlCommand cmdM = new SqlCommand("Sp_Productmarketplaceadd", con))
                            {
                                cmdM.CommandType = CommandType.StoredProcedure;
                                cmdM.Parameters.AddWithValue("@Userid", data.formData.userid);
                                cmdM.Parameters.AddWithValue("@Productid", data.formData.productid);
                                cmdM.Parameters.AddWithValue("@Productvariantsid", data.formData.id);
                                cmdM.Parameters.AddWithValue("@Marketplacename", row.Marketplace1);
                                cmdM.Parameters.AddWithValue("@Visibility", row.Status ? 1 : 0);
                                cmdM.Parameters.AddWithValue("@Isdelete", 0);
                                cmdM.Parameters.AddWithValue("@Status", "Active");
                                cmdM.Parameters.AddWithValue("@Link", row.Link ?? "");
                                cmdM.Parameters.AddWithValue("@Id", existingRow != null ? existingRow["Id"] : (object)DBNull.Value);
                                cmdM.Parameters.AddWithValue("@Query", existingRow != null ? 2 : 1);
                                cmdM.ExecuteNonQuery();
                            }
                        }
                    }

                    // Step 3: Opening Quantity & Transactions
                    double openingqtyvalue = 0;
                    if (data.openingQtyData != null && data.openingQtyData.Any())
                    {
                        // Clear existing
                        using (SqlCommand cmdDel = new SqlCommand("Sp_Transaction", con))
                        {
                            cmdDel.CommandType = CommandType.StoredProcedure;
                            cmdDel.Parameters.AddWithValue("@Itemid", data.formData.id);
                            cmdDel.Parameters.AddWithValue("@Entry_type", "Openingbalance");
                            cmdDel.Parameters.AddWithValue("@Isdelete", "1");
                            cmdDel.Parameters.AddWithValue("@Query", 21);
                            
                            // Add missing required parameters for Sp_Transaction
                            cmdDel.Parameters.AddWithValue("@Date", "");
                            cmdDel.Parameters.AddWithValue("@Description", "");
                            cmdDel.Parameters.AddWithValue("@Type", "");
                            cmdDel.Parameters.AddWithValue("@Purchase_salesid", "");
                            cmdDel.Parameters.AddWithValue("@Supplier_customerid", "");
                            cmdDel.Parameters.AddWithValue("@Transaction_type", "");
                            cmdDel.Parameters.AddWithValue("@Amount", 0);
                            cmdDel.Parameters.AddWithValue("@Conversion_amount", 0);
                            cmdDel.Parameters.AddWithValue("@Currency_rate", 0);
                            cmdDel.Parameters.AddWithValue("@Currency", "");
                            cmdDel.Parameters.AddWithValue("@Status", "");
                            cmdDel.Parameters.AddWithValue("@Ca_id", 0);
                            
                            cmdDel.ExecuteNonQuery();
                        }
                        using (SqlCommand cmdInv = new SqlCommand("Sp_Inventory", con))
                        {
                            cmdInv.CommandType = CommandType.StoredProcedure;
                            cmdInv.Parameters.AddWithValue("@Productvariantsid", data.formData.id);
                            cmdInv.Parameters.AddWithValue("@Inventory_type", "1");
                            cmdInv.Parameters.AddWithValue("@Isdelete", "1");
                            cmdInv.Parameters.AddWithValue("@Query", 23);
                            cmdInv.ExecuteNonQuery();
                        }

                        foreach (var row in data.openingQtyData)
                        {
                            using (SqlCommand cmdO = new SqlCommand("Sp_Openingqtytable", con))
                            {
                                cmdO.CommandType = CommandType.StoredProcedure;
                                cmdO.Parameters.AddWithValue("@Id", row.Id != null && !string.IsNullOrEmpty(row.Id.ToString()) ? row.Id : (object)DBNull.Value);
                                cmdO.Parameters.AddWithValue("@Itemid", data.formData.id);
                                cmdO.Parameters.AddWithValue("@Warehouseid", row.Warehouseid);
                                cmdO.Parameters.AddWithValue("@Qty", row.Qty ?? 0);
                                cmdO.Parameters.AddWithValue("@Asofdate", row.Asofdate);
                                decimal oValue = 0;
                                decimal.TryParse(row.Value, out oValue);
                                cmdO.Parameters.AddWithValue("@Value", oValue);
                                cmdO.Parameters.AddWithValue("@Isdelete", "0");
                                cmdO.Parameters.AddWithValue("@Query", row.Id != null && !string.IsNullOrEmpty(row.Id.ToString()) ? 3 : 1);
                                cmdO.ExecuteNonQuery();
                                openingqtyvalue += (double)oValue;
                            }

                            if (row.Qty.GetValueOrDefault() != 0)
                            {
                                using (SqlCommand cmdI = new SqlCommand("Sp_Inventory", con))
                                {
                                    cmdI.CommandType = CommandType.StoredProcedure;
                                    cmdI.Parameters.AddWithValue("@Productid", data.formData.productid);
                                    cmdI.Parameters.AddWithValue("@Inventory_type", "1");
                                    cmdI.Parameters.AddWithValue("@Inventory_date", DateTime.Now.ToString("MMM d yyyy h:mmtt"));
                                    cmdI.Parameters.AddWithValue("@Productvariantsid", data.formData.id);
                                    cmdI.Parameters.AddWithValue("@Total_qty", row.Qty ?? 0);
                                    cmdI.Parameters.AddWithValue("@Billid", "0");
                                    cmdI.Parameters.AddWithValue("@Warehouse_status", "1");
                                    cmdI.Parameters.AddWithValue("@Isdelete", "0");
                                    cmdI.Parameters.AddWithValue("@Status", "Transit");
                                    cmdI.Parameters.AddWithValue("@Warehouseid", row.Warehouseid);
                                    cmdI.Parameters.AddWithValue("@Query", 1);
                                    cmdI.ExecuteNonQuery();
                                }
                            }
                        }
                    }

                    if (openingqtyvalue > 0)
                    {
                        // Map Account IDs based on Catalog
                        string caIdDebit = catelogid == "1" ? "50" : (catelogid == "2" ? "35" : "");
                        string caIdCredit = catelogid == "1" ? "69" : (catelogid == "2" ? "68" : "");

                        if (!string.IsNullOrEmpty(caIdDebit))
                        {
                            int debitAccId = 0, creditAccId = 0;
                            int.TryParse(caIdDebit, out debitAccId);
                            int.TryParse(caIdCredit, out creditAccId);

                            using (SqlCommand cmdT = new SqlCommand("Sp_Transaction", con))
                            {
                                cmdT.CommandType = CommandType.StoredProcedure;
                                cmdT.Parameters.AddWithValue("@Date", DateTime.Now.ToString("yyyy-MM-dd"));
                                cmdT.Parameters.AddWithValue("@Transaction_type", "Debit");
                                cmdT.Parameters.AddWithValue("@Amount", (decimal)openingqtyvalue);
                                cmdT.Parameters.AddWithValue("@Conversion_amount", (decimal)openingqtyvalue);
                                cmdT.Parameters.AddWithValue("@Currency_rate", 1);
                                cmdT.Parameters.AddWithValue("@Currency", 2);
                                cmdT.Parameters.AddWithValue("@Isdelete", "0");
                                cmdT.Parameters.AddWithValue("@Status", "Active");
                                cmdT.Parameters.AddWithValue("@Entry_type", "Openingbalance");
                                cmdT.Parameters.AddWithValue("@Ca_id", debitAccId);
                                cmdT.Parameters.AddWithValue("@Itemid", data.formData.id);
                                cmdT.Parameters.AddWithValue("@Query", "1");

                                // Add missing required parameters
                                cmdT.Parameters.AddWithValue("@Description", "");
                                cmdT.Parameters.AddWithValue("@Type", "");
                                cmdT.Parameters.AddWithValue("@Purchase_salesid", "");
                                cmdT.Parameters.AddWithValue("@Supplier_customerid", "");

                                cmdT.ExecuteNonQuery();
                            }
                            using (SqlCommand cmdT = new SqlCommand("Sp_Transaction", con))
                            {
                                cmdT.CommandType = CommandType.StoredProcedure;
                                cmdT.Parameters.AddWithValue("@Date", DateTime.Now.ToString("yyyy-MM-dd"));
                                cmdT.Parameters.AddWithValue("@Transaction_type", "Credit");
                                cmdT.Parameters.AddWithValue("@Amount", (decimal)openingqtyvalue);
                                cmdT.Parameters.AddWithValue("@Conversion_amount", (decimal)openingqtyvalue);
                                cmdT.Parameters.AddWithValue("@Currency_rate", 1);
                                cmdT.Parameters.AddWithValue("@Currency", 2);
                                cmdT.Parameters.AddWithValue("@Isdelete", "0");
                                cmdT.Parameters.AddWithValue("@Status", "Active");
                                cmdT.Parameters.AddWithValue("@Entry_type", "Openingbalance");
                                cmdT.Parameters.AddWithValue("@Ca_id", creditAccId);
                                cmdT.Parameters.AddWithValue("@Itemid", data.formData.id);
                                cmdT.Parameters.AddWithValue("@Query", "1");

                                // Add missing required parameters
                                cmdT.Parameters.AddWithValue("@Description", "");
                                cmdT.Parameters.AddWithValue("@Type", "");
                                cmdT.Parameters.AddWithValue("@Purchase_salesid", "");
                                cmdT.Parameters.AddWithValue("@Supplier_customerid", "");

                                cmdT.ExecuteNonQuery();
                            }
                        }
                    }

                    // Step 4: Activity Log
                    using (SqlCommand cmdL = new SqlCommand("Sp_Productvariantssetlog", con))
                    {
                        cmdL.CommandType = CommandType.StoredProcedure;
                        cmdL.Parameters.AddWithValue("@Productid", data.formData.productid);
                        cmdL.Parameters.AddWithValue("@Userid", data.formData.userid);
                        cmdL.Parameters.AddWithValue("@Productvariantsid", data.formData.id);
                        cmdL.Parameters.AddWithValue("@Actiontype", data.formData.Itemname + "- Update");
                        cmdL.Parameters.AddWithValue("@Date", DateTime.Now.ToString("MMM d yyyy h:mmtt"));
                        cmdL.Parameters.AddWithValue("@Query", 1);
                        
                        // Add missing required parameters for Sp_Productvariantssetlog
                        cmdL.Parameters.AddWithValue("@Productsetid", "");
                        cmdL.Parameters.AddWithValue("@Productcomboid", DBNull.Value);
                        
                        cmdL.ExecuteNonQuery();
                    }

                    // Step 5: Handle Gallery & Videos
                    string tableIdString = Request.Form["tableid"];
                    string tableIdString1 = Request.Form["tablevideoid"];
                    List<string> tableid = !string.IsNullOrEmpty(tableIdString) ? tableIdString.Split(',').ToList() : new List<string>();
                    List<string> tablevideoid = !string.IsNullOrEmpty(tableIdString1) ? tableIdString1.Split(',').ToList() : new List<string>();

                    var files = Request.Form.Files;
                    var base64Gallery = Request.Form["galleryimages[]"];
                    var base64GalleryNames = Request.Form["gallerynames[]"];
                    
                    int galleryCounter = 0;
                    int videoCounter = 0;

                    // 5a. Handle standard file uploads
                    foreach (var file in files)
                    {
                        bool isGallery = file.Name.Contains("gallery");
                        bool isVideo = file.Name.Contains("video");
                        if (!isGallery && !isVideo) continue;

                        string currentId = "";
                        if (isGallery) { currentId = galleryCounter < tableid.Count ? tableid[galleryCounter] : "new"; galleryCounter++; }
                        else { currentId = videoCounter < tablevideoid.Count ? tablevideoid[videoCounter] : "new"; videoCounter++; }

                        string baseName = Path.GetFileNameWithoutExtension(file.FileName);
                        string ext = Path.GetExtension(file.FileName);
                        string cleanedBase = CorrectImageFileName1(baseName);
                        
                        int newGalleryId = 0;
                        if (currentId.StartsWith("new"))
                        {
                            using (SqlCommand cmdG = new SqlCommand("Gallery", con))
                            {
                                cmdG.CommandType = CommandType.StoredProcedure;
                                cmdG.Parameters.AddWithValue("@Userid", data.formData.userid);
                                cmdG.Parameters.AddWithValue("@Product_id", data.formData.productid);
                                cmdG.Parameters.AddWithValue("@Productvariants_id", data.formData.id);
                                cmdG.Parameters.AddWithValue("@File_id", isGallery ? 3 : 2);
                                cmdG.Parameters.AddWithValue("@Query", 1);
                                var pOut = new SqlParameter("@id1", SqlDbType.Int) { Direction = ParameterDirection.Output };
                                cmdG.Parameters.Add(pOut);
                                cmdG.ExecuteNonQuery();
                                newGalleryId = (int)pOut.Value;
                            }
                        }
                        else
                        {
                            newGalleryId = int.Parse(currentId);
                        }

                        string finalFileName = cleanedBase + newGalleryId + ext;
                        string folder = isGallery ? "Thumb" : "Orginal";
                        string relativePath = "/Content/images/" + data.formData.productid + "/" + folder + "/" + finalFileName;
                        string physicalPath = Path.Combine(_environment.ContentRootPath, "wwwroot", "Content", "images", data.formData.productid, folder);
                        if (!Directory.Exists(physicalPath)) Directory.CreateDirectory(physicalPath);
                        string fullPath = Path.Combine(physicalPath, finalFileName);

                        using (var stream = file.OpenReadStream())
                        {
                            if (isGallery)
                            {
                                byte[] bytes;
                                using (var ms = new MemoryStream()) { stream.CopyTo(ms); bytes = ms.ToArray(); }
                                System.IO.File.WriteAllBytes(fullPath, bytes);

                                // Resize/Thumbnails (Simplified)
                                string thumbPath = Path.Combine(_environment.ContentRootPath, "wwwroot", "Content", "images", data.formData.productid, "Thumb");
                                if (!Directory.Exists(thumbPath)) Directory.CreateDirectory(thumbPath);
                                // For brevity, skipping the complex Bitmap logic here, just copy for now
                                // In a real app, use ImageSharp or similar
                            }
                            else
                            {
                                using (var fs = new FileStream(fullPath, FileMode.Create)) stream.CopyTo(fs);
                            }
                        }

                        using (SqlCommand cmdG = new SqlCommand("Gallery", con))
                        {
                            cmdG.CommandType = CommandType.StoredProcedure;
                            cmdG.Parameters.AddWithValue("@Gallery_file", relativePath);
                            cmdG.Parameters.AddWithValue("@id", newGalleryId);
                            cmdG.Parameters.AddWithValue("@Query", 3);
                            cmdG.ExecuteNonQuery();
                        }
                    }

                    // 5b. Handle Base64 Gallery uploads (from frontend)
                    if (!Microsoft.Extensions.Primitives.StringValues.IsNullOrEmpty(base64Gallery) && base64Gallery.Count > 0)
                    {
                        for (int i = 0; i < base64Gallery.Count; i++)
                        {
                            string base64 = base64Gallery[i];
                            if (string.IsNullOrEmpty(base64) || !base64.Contains(",")) continue;

                            string fileName = (!Microsoft.Extensions.Primitives.StringValues.IsNullOrEmpty(base64GalleryNames) && i < base64GalleryNames.Count) ? base64GalleryNames[i] : "image_" + DateTime.Now.Ticks + ".jpg";
                            string cleanedBase = CorrectImageFileName1(Path.GetFileNameWithoutExtension(fileName));
                            string ext = Path.GetExtension(fileName);
                            if (string.IsNullOrEmpty(ext)) ext = ".jpg";

                            // Create Gallery Record
                            int newGalleryId = 0;
                            using (SqlCommand cmdG = new SqlCommand("Gallery", con))
                            {
                                cmdG.CommandType = CommandType.StoredProcedure;
                                cmdG.Parameters.AddWithValue("@Userid", data.formData.userid);
                                cmdG.Parameters.AddWithValue("@Product_id", data.formData.productid);
                                cmdG.Parameters.AddWithValue("@Productvariants_id", data.formData.id);
                                cmdG.Parameters.AddWithValue("@File_id", 3); // 3 = Gallery
                                cmdG.Parameters.AddWithValue("@Query", 1);
                                var pOut = new SqlParameter("@id1", SqlDbType.Int) { Direction = ParameterDirection.Output };
                                cmdG.Parameters.Add(pOut);
                                cmdG.ExecuteNonQuery();
                                newGalleryId = (int)pOut.Value;
                            }

                            string finalFileName = cleanedBase + "_" + newGalleryId + ext;
                            string relativePath = "/Content/images/" + data.formData.productid + "/Thumb/" + finalFileName;
                            string physicalPath = Path.Combine(_environment.ContentRootPath, "wwwroot", "Content", "images", data.formData.productid, "Thumb");
                            if (!Directory.Exists(physicalPath)) Directory.CreateDirectory(physicalPath);
                            string fullPath = Path.Combine(physicalPath, finalFileName);

                            // Save Base64 to file
                            try 
                            {
                                string pureBase64 = base64.Substring(base64.IndexOf(",") + 1);
                                byte[] imageBytes = Convert.FromBase64String(pureBase64);
                                System.IO.File.WriteAllBytes(fullPath, imageBytes);

                                // Update Gallery Record with path
                                using (SqlCommand cmdG = new SqlCommand("Gallery", con))
                                {
                                    cmdG.CommandType = CommandType.StoredProcedure;
                                    cmdG.Parameters.AddWithValue("@Gallery_file", relativePath);
                                    cmdG.Parameters.AddWithValue("@id", newGalleryId);
                                    cmdG.Parameters.AddWithValue("@Query", 3);
                                    cmdG.ExecuteNonQuery();
                                }
                            }
                            catch (Exception ex) 
                            {
                                Console.WriteLine("Error saving Base64 image: " + ex.Message);
                            }
                        }
                    }

                    // Step 6: Serial Numbers
                    if (data.serialNumbers != null && data.serialNumbers.Any())
                    {
                        using (SqlCommand cmdD = new SqlCommand("Sp_Serialnoadd", con))
                        {
                            cmdD.CommandType = CommandType.StoredProcedure;
                            cmdD.Parameters.AddWithValue("@Itemid", data.formData.id);
                            cmdD.Parameters.AddWithValue("@Query", 10);
                            
                            // Add missing required parameters for Sp_Serialnoadd
                            cmdD.Parameters.AddWithValue("@Id", 0);
                            cmdD.Parameters.AddWithValue("@Purchaseid", "");
                            cmdD.Parameters.AddWithValue("@Serialno", "");
                            cmdD.Parameters.AddWithValue("@Status", "");
                            cmdD.Parameters.AddWithValue("@Isdelete", "");
                            cmdD.Parameters.AddWithValue("@Rowpurchaseid", "");
                            
                            cmdD.ExecuteNonQuery();
                        }
                        foreach (var sn in data.serialNumbers)
                        {
                            using (SqlCommand cmdS = new SqlCommand("Sp_Serialnoadd", con))
                            {
                                cmdS.CommandType = CommandType.StoredProcedure;
                                cmdS.Parameters.AddWithValue("@Itemid", data.formData.id);
                                cmdS.Parameters.AddWithValue("@Serialno", sn.Serialno);
                                cmdS.Parameters.AddWithValue("@Status", "Active");
                                cmdS.Parameters.AddWithValue("@Query", 1);
                                
                                // Add missing required parameters for Sp_Serialnoadd
                                cmdS.Parameters.AddWithValue("@Id", 0);
                                cmdS.Parameters.AddWithValue("@Purchaseid", "");
                                cmdS.Parameters.AddWithValue("@Isdelete", "0");
                                cmdS.Parameters.AddWithValue("@Rowpurchaseid", "");
                                
                                cmdS.ExecuteNonQuery();
                            }
                        }
                    }

                    // Step 7: Return updated consolidated list using Query 10
                    using (SqlCommand cmdR = new SqlCommand("Sp_Productvariants", con))
                    {
                        cmdR.CommandType = CommandType.StoredProcedure;
                        cmdR.Parameters.AddWithValue("@Productid", data.formData.productid);
                        cmdR.Parameters.AddWithValue("@Query", 10);
                        using (SqlDataReader reader = cmdR.ExecuteReader())
                        {
                            DataTable dtR = new DataTable();
                            dtR.Load(reader);
                            
                            // Map using our consolidation helper (Group by Name, Brand, Model, Barcode)
                            var rawVariants = new List<Variants>();
                            foreach (DataRow row in dtR.Rows)
                            {
                                rawVariants.Add(new Variants
                                {
                                    id = Convert.ToInt32(row["Id"]),
                                    userid = row["Userid"]?.ToString(),
                                    productid = row["Productid"]?.ToString(),
                                    productname = row["Productname"]?.ToString(),
                                    allvalues = row["allvalues"]?.ToString(),
                                    totalqty = row["Totalqty"]?.ToString(),
                                    totalqtyonline = row["Noofqty_online"]?.ToString(),
                                    status = row["Status"]?.ToString(),
                                    firstname = row["Firstname"]?.ToString(),
                                    modelno = row["Modelno"]?.ToString(),
                                    Warehousecheck = row["Warehousecheck"]?.ToString(),
                                    batchno = row["Batchno"]?.ToString(),
                                    barcodeno = row["EANBarcodeno"]?.ToString(),
                                    Managerapprovestatus = row["Managerapprovestatus"]?.ToString(),
                                    Warehouseapprovestatus = row["Warehouseapprovestatus"]?.ToString(),
                                    Accountsapprovestatus = dtR.Columns.Contains("Accountsapprovestatus") ? row["Accountsapprovestatus"]?.ToString() : "0",
                                    Description = row["Description"]?.ToString(),
                                    Itemname = row["Itemname"]?.ToString(),
                                    Wholesaleprice = row["Wholesaleprice"]?.ToString(),
                                    Retailprice = row["Retailprice"]?.ToString(),
                                    Onlineprice = row["Onlineprice"]?.ToString(),
                                    brand = row["Brand"]?.ToString(),
                                    username = row["Firstname"]?.ToString(),
                                    Short_description = row["Short_description"]?.ToString(),
                                    Standarduom = row["Standarduom"]?.ToString(),
                                    Salesuom = row["Salesuom"]?.ToString(),
                                    Purchaseuom = row["Purchaseuom"]?.ToString(),
                                    Length = row["Length"],
                                    Width = row["Width"],
                                    Height = row["Height"],
                                    Weight = row["Weight"],
                                    Hscode = row["Hscode"]?.ToString(),
                                    Country_orgin = row["Country_orgin"]?.ToString(),
                                    Remarks = row["Remarks"]?.ToString(),
                                    Agecategory = row["Agecategory"]?.ToString(),
                                    Serialized = row["Serialized"]?.ToString(),
                                    Defaultlocation = row["Defaultlocation"]?.ToString()
                                });
                            }

                            // Consolidation logic (same as GetVariants)
                            variants = rawVariants
                                .GroupBy(v => new { 
                                    Name = (v.Itemname ?? "").Trim(), 
                                    Brand = (v.brand ?? "").Trim(), 
                                    Model = (v.modelno ?? "").Trim(), 
                                    Barcode = (v.barcodeno ?? "").Trim() 
                                })
                                .Select(group => {
                                    var first = group.First();
                                    return new Variants
                                    {
                                        id = first.id, // Primary ID
                                        Itemname = first.Itemname,
                                        brand = first.brand,
                                        modelno = first.modelno,
                                        barcodeno = first.barcodeno,
                                        VariantsAndValues = string.Join(", ", group.Where(g => !string.IsNullOrEmpty(g.allvalues)).Select(g => g.allvalues)),
                                        totalqty = group.Sum(g => { decimal.TryParse(g.totalqty, out var q); return q; }).ToString(),
                                        totalqtyonline = group.Sum(g => { decimal.TryParse(g.totalqtyonline, out var q); return q; }).ToString(),
                                        status = first.status,
                                        username = first.username,
                                        Short_description = first.Short_description,
                                        Description = first.Description,
                                        Wholesaleprice = first.Wholesaleprice,
                                        Retailprice = first.Retailprice,
                                        Onlineprice = first.Onlineprice,
                                        Standarduom = first.Standarduom,
                                        Salesuom = first.Salesuom,
                                        Purchaseuom = first.Purchaseuom,
                                        Length = first.Length,
                                        Width = first.Width,
                                        Height = first.Height,
                                        Weight = first.Weight,
                                        Hscode = first.Hscode,
                                        Country_orgin = first.Country_orgin,
                                        Remarks = first.Remarks,
                                        Agecategory = first.Agecategory,
                                        Serialized = first.Serialized,
                                        Defaultlocation = first.Defaultlocation,
                                        batchno = first.batchno,
                                        Brandid = first.Brandid,
                                        managerStatus = mapStatus(first.Managerapprovestatus),
                                        warehouseStatus = mapStatus(first.Warehouseapprovestatus),
                                        accountsStatus = mapStatus(first.Accountsapprovestatus)
                                    };
                                }).ToList();
                        }
                    }

                    message = isNewVariant ? "Variants saved successfully" : "Variants updated successfully";
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error in Editvariantitem: " + ex.Message);
                return StatusCode(500, new { message = ex.Message });
            }

            var counts = getCount();
            return Ok(new { success = true, List1 = variants, message = message, Active = counts.Active, INActive = counts.INActive, Count = counts.Count });
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

        private static string mapStatus(string s) => s == "1" ? "Approved" : (s == "2" ? "Rejected" : "Pending");
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
        public string productid { get; set; }
        public string productname { get; set; }
        public string Itemname { get; set; }
        public string totalqty { get; set; }
        public string totalqtyonline { get; set; }
        public string modelno { get; set; }
        public string batchno { get; set; }
        public string barcodeno { get; set; }
        public string Warehousecheck { get; set; }
        public string status { get; set; }
        public string Description { get; set; }
        public int thumbid { get; set; }
        public string Wholesaleprice { get; set; }
        public string Retailprice { get; set; }
        public string Onlineprice { get; set; }
        public string Reorderpoint { get; set; }
        public string Reorderqty { get; set; }
        public string Defaultlocation { get; set; }
        public string Defaultsublocation { get; set; }
        public string Lastvendor { get; set; }
        public string Standarduom { get; set; }
        public string Salesuom { get; set; }
        public string Purchaseuom { get; set; }
        public object Length { get; set; }
        public object Width { get; set; }
        public object Height { get; set; }
        public object Weight { get; set; }
        public string Remarks { get; set; }
        public string Agecategory { get; set; }
        public string Serialized { get; set; }
        public string Hscode { get; set; }
        public string Country_orgin { get; set; }
        public string Short_description { get; set; }
        public string Brandid { get; set; }
        public string Managerapprovestatus { get; set; }
        public string Warehouseapprovestatus { get; set; }
        public string Accountsapprovestatus { get; set; }
        public string brand { get; set; } // For frontend compatibility
        public string Brandname { get; set; }
        public string firstname { get; set; }
        public string allvalues { get; set; }
        public string VariantsAndValues { get; set; } // For frontend compatibility
        public string variantype { get; set; }
        public string Type { get; set; }
        public string username { get; set; } // For frontend compatibility
        public string managerStatus { get; set; } // For frontend compatibility
        public string warehouseStatus { get; set; } // For frontend compatibility
        public string accountsStatus { get; set; } // For frontend compatibility
    }

    public class Variantsnew
    {

        public Variants formData { get; set; }
        public List<SerialNumber> serialNumbers { get; set; }
        public List<MarketplaceData> tableData { get; set; }
        public List<Dictionary<string, string>> tableData1 { get; set; }
        public List<OpeningQtyData> openingQtyData { get; set; }

    }

    public class SerialNumber
    {

        public string Serialno { get; set; }

    }

    public class OpeningQtyData
    {
        public object Id { get; set; }
        public string Warehouseid { get; set; }
        public decimal? Qty { get; set; }
        public string Asofdate { get; set; }
        public string Value { get; set; }
    }

    public class Comments
    {

        public string Id { get; set; }
        public string Userid { get; set; }
        public string Commentss { get; set; }
        
    }
}

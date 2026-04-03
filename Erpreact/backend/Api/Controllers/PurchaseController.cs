using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Text.Json;
using System.Collections.Generic;

namespace Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PurchaseController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;

        public PurchaseController(IConfiguration configuration, IWebHostEnvironment environment)
        {
            _configuration = configuration;
            _environment = environment;
        }

        [HttpPost("save-bill")]
        public async Task<IActionResult> SavePurchaseBill()
        {
            if (!Request.HasFormContentType)
            {
                return BadRequest(new { message = "Invalid content type. Expected form-data." });
            }

            var form = await Request.ReadFormAsync();
            var formDataJson = form["formData"].FirstOrDefault();
            var tableData1Json = form["tableData1"].FirstOrDefault();
            var tableDatavatJson = form["tableDatavat"].FirstOrDefault();
            var tableDatacategoryJson = form["tableDatacategory"].FirstOrDefault();

            if (string.IsNullOrEmpty(formDataJson))
            {
                return BadRequest(new { message = "Error: No form data received." });
            }

            var formData = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, object>>(formDataJson);
            
            var items = new List<Dictionary<string, object>>();
            if (!string.IsNullOrEmpty(tableData1Json))
            {
                items = Newtonsoft.Json.JsonConvert.DeserializeObject<List<Dictionary<string, object>>>(tableData1Json);
            }

            var vats = new List<Dictionary<string, object>>();
            if (!string.IsNullOrEmpty(tableDatavatJson))
            {
                vats = Newtonsoft.Json.JsonConvert.DeserializeObject<List<Dictionary<string, object>>>(tableDatavatJson);
            }

            var categories = new List<Dictionary<string, object>>();
            if (!string.IsNullOrEmpty(tableDatacategoryJson))
            {
                categories = Newtonsoft.Json.JsonConvert.DeserializeObject<List<Dictionary<string, object>>>(tableDatacategoryJson);
            }

            string connectionString = _configuration.GetConnectionString("DefaultConnection");
            string message = "";
            string userId = "1"; // Placeholder
            string catalogId = "2"; // Placeholder

            int purchaseId = 0;

            using (var connection = new SqlConnection(connectionString))
            {
                await connection.OpenAsync();
                using (var transaction = connection.BeginTransaction())
                {
                    try
                    {
                        // 1. Insert/Update Purchase Header
                        var billNo = formData["Billno"]?.ToString();
                        
                        // Check if exists
                        using (var cmdCheck = new SqlCommand("Sp_Purchase", connection, transaction))
                        {
                            cmdCheck.CommandType = CommandType.StoredProcedure;
                            cmdCheck.Parameters.AddWithValue("@Billno", billNo);
                            cmdCheck.Parameters.AddWithValue("@Query", 7);
                            using (var reader = await cmdCheck.ExecuteReaderAsync())
                            {
                                if (reader.Read())
                                {
                                    purchaseId = Convert.ToInt32(reader["Id"]);
                                }
                            }
                        }

                        // Insert or Update logic
                        using (var cmdPurchase = new SqlCommand("Sp_Purchase", connection, transaction))
                        {
                            cmdPurchase.CommandType = CommandType.StoredProcedure;
                            
                            if (purchaseId > 0)
                            {
                                cmdPurchase.Parameters.AddWithValue("@Id", purchaseId);
                                cmdPurchase.Parameters.AddWithValue("@Query", 5); // Update
                            }
                            else
                            {
                                cmdPurchase.Parameters.AddWithValue("@Id", DBNull.Value);
                                cmdPurchase.Parameters.AddWithValue("@Query", 1); // Insert
                            }

                            cmdPurchase.Parameters.AddWithValue("@Userid", formData.ContainsKey("Userid") ? formData["Userid"] : userId);
                            cmdPurchase.Parameters.AddWithValue("@Supplierid", formData["Supplierid"] ?? DBNull.Value);
                            cmdPurchase.Parameters.AddWithValue("@Mailing_address", formData["Mailing_address"] ?? DBNull.Value);
                            cmdPurchase.Parameters.AddWithValue("@Purchase_location", formData["Purchase_location"] ?? "Sharjah");
                            cmdPurchase.Parameters.AddWithValue("@Terms", formData["Terms"] ?? DBNull.Value);
                            cmdPurchase.Parameters.AddWithValue("@Bill_date", formData["Bill_date"] ?? DateTime.Now);
                            cmdPurchase.Parameters.AddWithValue("@Due_date", formData["Due_date"] ?? DateTime.Now);
                            cmdPurchase.Parameters.AddWithValue("@Billno", billNo);
                            cmdPurchase.Parameters.AddWithValue("@Amountsare", formData["Amountsare"] ?? "Exclusive of tax");
                            cmdPurchase.Parameters.AddWithValue("@Memo", formData["Memo"] ?? DBNull.Value);
                            
                            // Amounts
                            decimal subTotal = Convert.ToDecimal(formData["Sub_total"] ?? 0);
                            decimal vatAmount = Convert.ToDecimal(formData["Vat_Amount"] ?? 0);
                            decimal billGrandTotal = Convert.ToDecimal(formData["Grand_Total"] ?? 0);
                            decimal currencyRate = Convert.ToDecimal(formData["Currencyvalue"] ?? 1);
                            
                            cmdPurchase.Parameters.AddWithValue("@Sub_total", subTotal);
                            cmdPurchase.Parameters.AddWithValue("@Vat_Amount", vatAmount);
                            cmdPurchase.Parameters.AddWithValue("@Grand_total", billGrandTotal);
                            
                            cmdPurchase.Parameters.AddWithValue("@Conversion_amount", billGrandTotal * currencyRate);
                            cmdPurchase.Parameters.AddWithValue("@Currency_rate", currencyRate);
                            cmdPurchase.Parameters.AddWithValue("@Currency", formData["Currencyid"] ?? DBNull.Value);

                            // Statuses
                            cmdPurchase.Parameters.AddWithValue("@Status", "Active");
                            cmdPurchase.Parameters.AddWithValue("@Isdelete", "0");
                            cmdPurchase.Parameters.AddWithValue("@Type", "Bill");
                            cmdPurchase.Parameters.AddWithValue("@Managerapprovestatus", "0");
                            cmdPurchase.Parameters.AddWithValue("@Accountsapprove", "0");
                            cmdPurchase.Parameters.AddWithValue("@Warehouseapprove", "0");
                            cmdPurchase.Parameters.AddWithValue("@Warehouseid", formData["Warehouseid"] ?? "0"); // Default warehouse

                            if (purchaseId == 0)
                            {
                                // For insert, we need to get the ID back
                                var result = await cmdPurchase.ExecuteScalarAsync();
                                purchaseId = Convert.ToInt32(result);
                            }
                            else
                            {
                                await cmdPurchase.ExecuteNonQueryAsync();
                            }
                        }

                        // 2. Save Item Details
                        if (items != null)
                        {
                            int rowIndex = 1; // Track the sequential row number (1-based)
                            foreach (var item in items)
                            {
                                var itemId = item.ContainsKey("Itemid") ? item["Itemid"].ToString() : null;
                                if (string.IsNullOrEmpty(itemId)) continue;

                                // Insert Bill Detail
                                // Pass rowIndex to identify this row sequentially (1, 2, 3...)
                                await InsertOrUpdateBillDetail(connection, transaction, purchaseId, userId, item, rowIndex);
                                
                                rowIndex++; // Increment for next item

                                // Update Product Variant (Sp_Productvariants Query 31)
                                using (var cmdVar = new SqlCommand("Sp_Productvariants", connection, transaction))
                                {
                                    cmdVar.CommandType = CommandType.StoredProcedure;
                                    cmdVar.Parameters.AddWithValue("@Id", itemId);
                                    cmdVar.Parameters.AddWithValue("@Description", item["Description"] ?? DBNull.Value);
                                    cmdVar.Parameters.AddWithValue("@Query", 31);
                                    await cmdVar.ExecuteNonQueryAsync();
                                }

                                // Update COGS (Sp_Purchasecogs)
                                using (var cmdCogs = new SqlCommand("Sp_Purchasecogs", connection, transaction))
                                {
                                    cmdCogs.CommandType = CommandType.StoredProcedure;
                                    cmdCogs.Parameters.AddWithValue("@Id", DBNull.Value);
                                    cmdCogs.Parameters.AddWithValue("@Purchaseid", purchaseId);
                                    cmdCogs.Parameters.AddWithValue("@Itemid", itemId);
                                    cmdCogs.Parameters.AddWithValue("@Purchasedate", DateTime.Now);
                                    cmdCogs.Parameters.AddWithValue("@Initial_Qty", item["Qty"]);
                                    cmdCogs.Parameters.AddWithValue("@Actual_Qty", item["Qty"]);
                                    cmdCogs.Parameters.AddWithValue("@Unitcost", item["Amount"]);
                                    cmdCogs.Parameters.AddWithValue("@Type", "Bill");
                                    cmdCogs.Parameters.AddWithValue("@Status", "Active");
                                    cmdCogs.Parameters.AddWithValue("@Isdelete", "0");
                                    cmdCogs.Parameters.AddWithValue("@Query", 1);
                                    await cmdCogs.ExecuteNonQueryAsync();
                                }

                                // Inventory Update (Sp_Inventory)
                                // Fetch ProductID from Variant first
                                string productId = await GetProductIdFromVariant(connection, transaction, itemId);

                                using (var cmdInv = new SqlCommand("Sp_Inventory", connection, transaction))
                                {
                                    cmdInv.CommandType = CommandType.StoredProcedure;
                                    cmdInv.Parameters.AddWithValue("@Id", DBNull.Value);
                                    cmdInv.Parameters.AddWithValue("@Productid", productId);
                                    cmdInv.Parameters.AddWithValue("@Inventory_type", "1");
                                    cmdInv.Parameters.AddWithValue("@Inventory_date", Convert.ToDateTime(formData["Bill_date"] ?? DateTime.Now));
                                    cmdInv.Parameters.AddWithValue("@Productvariantsid", itemId);
                                    cmdInv.Parameters.AddWithValue("@Total_qty", item["Qty"]);
                                    cmdInv.Parameters.AddWithValue("@Billid", purchaseId);
                                    cmdInv.Parameters.AddWithValue("@Warehouse_status", "1");
                                    cmdInv.Parameters.AddWithValue("@Isdelete", "0");
                                    cmdInv.Parameters.AddWithValue("@Status", "Intransit");
                                    cmdInv.Parameters.AddWithValue("@Warehouseid", formData["Warehouseid"] ?? "0");
                                    cmdInv.Parameters.AddWithValue("@Query", 1);
                                    await cmdInv.ExecuteNonQueryAsync();
                                }
                                
                                // Serial number saving is handled inside InsertOrUpdateBillDetail
                                
                                // TODO: Call su.stockupdationsingleitem if needed (likely a stored proc or internal method)
                            }
                        }

                        // 3. Save Categories
                        if (categories != null)
                        {
                            foreach (var cat in categories)
                            {
                                if (!cat.ContainsKey("Categoryid")) continue;
                                using (var cmdCat = new SqlCommand("Sp_Purchasecategorydetails", connection, transaction))
                                {
                                    cmdCat.CommandType = CommandType.StoredProcedure;
                                    cmdCat.Parameters.AddWithValue("@Billid", purchaseId);
                                    cmdCat.Parameters.AddWithValue("@Customerid", formData.ContainsKey("Userid") ? formData["Userid"] : userId);
                                    cmdCat.Parameters.AddWithValue("@Type", "Bill");
                                    cmdCat.Parameters.AddWithValue("@Categoryid", cat["Categoryid"]);
                                    cmdCat.Parameters.AddWithValue("@Description", cat["Description"] ?? DBNull.Value);
                                    cmdCat.Parameters.AddWithValue("@Amount", cat["Amount"] ?? 0);
                                    cmdCat.Parameters.AddWithValue("@Vatvalue", cat["Vatvalue"] ?? 0); // Check param name
                                    cmdCat.Parameters.AddWithValue("@Vatid", cat["Vatid"] ?? 0);
                                    cmdCat.Parameters.AddWithValue("@Total", cat["Total"] ?? 0);
                                    cmdCat.Parameters.AddWithValue("@Customer", DBNull.Value);
                                    cmdCat.Parameters.AddWithValue("@Isdelete", 0);
                                    cmdCat.Parameters.AddWithValue("@Query", 1);
                                    await cmdCat.ExecuteNonQueryAsync();
                                }
                            }
                        }

                        // 4. Save VAT Details & Transactions
                        decimal totalVatAmount = 0;
                        if (vats != null)
                        {
                            foreach (var vat in vats)
                            {
                                using (var cmdVat = new SqlCommand("Sp_Purchasevatdetails", connection, transaction))
                                {
                                    cmdVat.CommandType = CommandType.StoredProcedure;
                                    cmdVat.Parameters.AddWithValue("@Billid", purchaseId);
                                    cmdVat.Parameters.AddWithValue("@Customerid", userId);
                                    cmdVat.Parameters.AddWithValue("@Type", "Bill");
                                    cmdVat.Parameters.AddWithValue("@Vatid", vat["Id"]);
                                    cmdVat.Parameters.AddWithValue("@Price", vat["Vatprice"] ?? 0);
                                    cmdVat.Parameters.AddWithValue("@Vatamount", vat["Vatvalue"] ?? 0);
                                    cmdVat.Parameters.AddWithValue("@Isdelete", "0");
                                    cmdVat.Parameters.AddWithValue("@Id", DBNull.Value);
                                    cmdVat.Parameters.AddWithValue("@Query", 1);
                                    await cmdVat.ExecuteNonQueryAsync();
                                }

                                // VAT Transaction (Debit)
                                decimal vAmount = Convert.ToDecimal(vat["Vatvalue"] ?? 0);
                                totalVatAmount += vAmount;
                                await AddTransactionEntry(connection, transaction, purchaseId, userId, formData, 
                                    "Debit", "38", vat["Id"].ToString(), vAmount, "Bill");
                            }
                        }

                        // 5. Accounting Transactions (Header Level)
                        decimal grandTotal = Convert.ToDecimal(formData["Grand_Total"] ?? 0);
                        // decimal subTotal = Convert.ToDecimal(formData["Sub_total"] ?? 0); // Or calculate from GT - VAT
                        
                        // Debit Subtotal (Cost)
                        // Account ID logic from user: if catalogId == "2" use "35", else "50"
                        string debitAccountId = (catalogId == "2") ? "35" : "50";
                        decimal subTotalCalc = grandTotal - totalVatAmount; // Better to calc from GT - TotalVAT to ensure balance
                        
                        await AddTransactionEntry(connection, transaction, purchaseId, userId, formData, 
                            "Debit", debitAccountId, "0", subTotalCalc, "Bill");

                        // Credit Grand Total (Payable)
                        await AddTransactionEntry(connection, transaction, purchaseId, userId, formData, 
                            "Credit", "20", "0", grandTotal, "Bill");


                        // 6. Logging
                        using (var cmdLog = new SqlCommand("Sp_Supplierpurchaselog", connection, transaction))
                        {
                            cmdLog.CommandType = CommandType.StoredProcedure;
                            cmdLog.Parameters.AddWithValue("@Id", DBNull.Value);
                            cmdLog.Parameters.AddWithValue("@Supplierid", formData["Supplierid"] ?? DBNull.Value);
                            cmdLog.Parameters.AddWithValue("@Purchaseid", purchaseId);
                            cmdLog.Parameters.AddWithValue("@Approveuserid", DBNull.Value);
                            cmdLog.Parameters.AddWithValue("@Editreason", DBNull.Value);
                            cmdLog.Parameters.AddWithValue("@Comments", $"{billNo} - Added");
                            cmdLog.Parameters.AddWithValue("@Isdelete", 0);
                            cmdLog.Parameters.AddWithValue("@Status", "Active");
                            cmdLog.Parameters.AddWithValue("@Changeddate", DateTime.Now);
                            cmdLog.Parameters.AddWithValue("@Sentedto", "Accounts");
                            cmdLog.Parameters.AddWithValue("@Query", 1);
                            await cmdLog.ExecuteNonQueryAsync();
                        }

                        // 7. File Uploads
                        if (form.Files.Count > 0)
                        {
                            string uploadPath = Path.Combine(_environment.WebRootPath, "Content/images/Purchasebillattach");
                            if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

                            foreach (var file in form.Files)
                            {
                                if (file.Length > 0)
                                {
                                    string fileName = $"{Path.GetFileNameWithoutExtension(file.FileName)}_{DateTime.Now:yyyyMMdd_HHmmss}{Path.GetExtension(file.FileName)}";
                                    string filePath = Path.Combine(uploadPath, fileName);
                                    
                                    using (var stream = new FileStream(filePath, FileMode.Create))
                                    {
                                        await file.CopyToAsync(stream);
                                    }

                                    string dbPath = $"/Content/images/Purchasebillattach/{fileName}";
                                    
                                    using (var cmdAttach = new SqlCommand("Sp_Purchasebillattachments", connection, transaction))
                                    {
                                        cmdAttach.CommandType = CommandType.StoredProcedure;
                                        cmdAttach.Parameters.AddWithValue("@Id", DBNull.Value);
                                        cmdAttach.Parameters.AddWithValue("@Userid", userId);
                                        cmdAttach.Parameters.AddWithValue("@Purchase_id", purchaseId);
                                        cmdAttach.Parameters.AddWithValue("@attachment", dbPath);
                                        cmdAttach.Parameters.AddWithValue("@Isdelete", "0");
                                        cmdAttach.Parameters.AddWithValue("@Status", "Active");
                                        cmdAttach.Parameters.AddWithValue("@Query", 1);
                                        await cmdAttach.ExecuteNonQueryAsync();
                                    }
                                }
                            }
                        }

                        transaction.Commit();
                        message = "Saved successfully";
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        return BadRequest(new { message = $"Error: {ex.Message}" });
                    }
                }
            }

            return Ok(new { message, purchaseId, billNo = formData["Billno"]?.ToString() });
        }

        // --- Helpers ---

        private async Task InsertOrUpdateBillDetail(SqlConnection connection, SqlTransaction transaction, int billId, string userId, Dictionary<string, object> item, int rowIndex)
        {
            int detailId = 0;
            var rowId = item.ContainsKey("Id") ? item["Id"]?.ToString() : null;
            if (string.IsNullOrEmpty(rowId)) rowId = item.ContainsKey("id") ? item["id"]?.ToString() : null;

            using (var cmd = new SqlCommand("Sp_Purchasebilldetails", connection, transaction))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Id", ""); // Use emptyId for Query 1
                cmd.Parameters.AddWithValue("@Userid", userId);
                cmd.Parameters.AddWithValue("@Billid", billId);
                cmd.Parameters.AddWithValue("@Itemid", item["Itemid"]);
                cmd.Parameters.AddWithValue("@Description", item["Description"] ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Qty", item["Qty"] ?? 0);
                cmd.Parameters.AddWithValue("@Amount", item["Amount"] ?? 0);
                cmd.Parameters.AddWithValue("@Vat", item["Vat"] ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Vat_id", item["Vatid"] ?? 0);
                cmd.Parameters.AddWithValue("@Total", item["Total"] ?? 0);
                cmd.Parameters.AddWithValue("@Status", "Active");
                cmd.Parameters.AddWithValue("@Isdelete", "0");
                cmd.Parameters.AddWithValue("@Query", 1); // Always insert as new to ensure it's active and we get a fresh ID

                var result = await cmd.ExecuteScalarAsync();
                if (result != null && result != DBNull.Value)
                {
                    detailId = Convert.ToInt32(result);
                }

                if (detailId == 0)
                {
                    // Fallback: If SP doesn't return ID, fetch the latest ID for this bill/item
                    // This is crucial for linking Serial Numbers correctly
                    using (var cmdId = new SqlCommand("SELECT TOP 1 Id FROM Tbl_Purchasebilldetails WHERE Billid = @Billid AND Itemid = @Itemid AND Isdelete = 0 ORDER BY Id DESC", connection, transaction))
                    {
                        cmdId.Parameters.AddWithValue("@Billid", billId);
                        cmdId.Parameters.AddWithValue("@Itemid", item["Itemid"]);
                        var res = await cmdId.ExecuteScalarAsync();
                        if (res != null && res != DBNull.Value)
                        {
                            detailId = Convert.ToInt32(res);
                        }
                    }
                }
            }

            // Save Serial Numbers if present
            var serialsKey = item.Keys.FirstOrDefault(k => k.Equals("SerialNumbers", StringComparison.OrdinalIgnoreCase));
            if (serialsKey != null && item[serialsKey] != null) // Note: Removed detailId > 0 check as we use rowIndex now
            {
                var serialsObj = item[serialsKey];
                List<string> serials = null;
                try
                {
                    if (serialsObj is Newtonsoft.Json.Linq.JArray jArray)
                    {
                        serials = jArray.ToObject<List<string>>();
                    }
                    else if (serialsObj is string s && !string.IsNullOrWhiteSpace(s))
                    {
                        serials = Newtonsoft.Json.JsonConvert.DeserializeObject<List<string>>(s);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error parsing serial numbers: {ex.Message}");
                }

                if (serials != null && serials.Count > 0)
                {
                    foreach (var serial in serials)
                    {
                        if (string.IsNullOrWhiteSpace(serial)) continue;

                        using (var cmdSerial = new SqlCommand("Sp_Serialnoadd", connection, transaction))
                        {
                            cmdSerial.CommandType = CommandType.StoredProcedure;
                            cmdSerial.Parameters.AddWithValue("@Id", ""); // Match user snippet: cmd.Parameters.AddWithValue("@Id", "");
                            cmdSerial.Parameters.AddWithValue("@Purchaseid", billId);
                            cmdSerial.Parameters.AddWithValue("@Itemid", item["Itemid"]);
                            cmdSerial.Parameters.AddWithValue("@Serialno", serial.Trim());
                            cmdSerial.Parameters.AddWithValue("@Status", "Active");
                            cmdSerial.Parameters.AddWithValue("@Isdelete", "0");
                            // IMPORTANT: Use rowIndex (1, 2, 3...) as requested by user, NOT detailId
                            cmdSerial.Parameters.AddWithValue("@Rowpurchaseid", rowIndex);
                            cmdSerial.Parameters.AddWithValue("@Query", 1);
                            
                            await cmdSerial.ExecuteNonQueryAsync();
                        }
                    }
                }
            }
        }

        private async Task<string> GetProductIdFromVariant(SqlConnection connection, SqlTransaction transaction, string itemId)
        {
            // Sp_Productvariants Query 25
            using (var cmd = new SqlCommand("Sp_Productvariants", connection, transaction))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Id", itemId);
                cmd.Parameters.AddWithValue("@Query", 25);
                var result = await cmd.ExecuteScalarAsync();
                return result?.ToString() ?? "";
            }
        }

        private async Task AddTransactionEntry(SqlConnection connection, SqlTransaction transaction, int purchaseId, string userId, 
            Dictionary<string, object> formData, string transType, string caId, string vatId, decimal amount, string entryType)
        {
            if (amount == 0) return;

            decimal rate = Convert.ToDecimal(formData["Currencyvalue"] ?? 1);
            decimal conversionAmount = amount * rate;

            using (var cmd = new SqlCommand("Sp_Transaction", connection, transaction))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Id", DBNull.Value);
                cmd.Parameters.AddWithValue("@Purchase_salesid", purchaseId);
                cmd.Parameters.AddWithValue("@Supplier_customerid", formData["Supplierid"] ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Date", formData["Bill_date"] ?? DateTime.Now);
                cmd.Parameters.AddWithValue("@Description", "");
                cmd.Parameters.AddWithValue("@Type", "0"); // 0 for Bill
                cmd.Parameters.AddWithValue("@Transaction_type", transType);
                cmd.Parameters.AddWithValue("@Ca_id", caId);
                cmd.Parameters.AddWithValue("@Vat_id", vatId);
                cmd.Parameters.AddWithValue("@Entry_type", entryType);
                
                cmd.Parameters.AddWithValue("@Amount", amount);
                cmd.Parameters.AddWithValue("@Conversion_amount", conversionAmount);
                cmd.Parameters.AddWithValue("@Currency_rate", rate);
                cmd.Parameters.AddWithValue("@Currency", formData["Currencyid"] ?? DBNull.Value);

                cmd.Parameters.AddWithValue("@Isdelete", "0");
                cmd.Parameters.AddWithValue("@Status", "Active");
                cmd.Parameters.AddWithValue("@Query", 1);
                
                await cmd.ExecuteNonQueryAsync();
            }
        }

        [HttpGet("check-billno/{billNo}")]
        public async Task<IActionResult> CheckBillNo(string billNo)
        {
            try
            {
                using var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));
                await connection.OpenAsync();

                using var command = new SqlCommand("SELECT COUNT(1) FROM Tbl_Purchase WHERE Billno = @BillNo", connection);
                command.Parameters.AddWithValue("@BillNo", billNo);

                var count = (int)await command.ExecuteScalarAsync();

                return Ok(new { exists = count > 0 });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("last-purchase/{itemId}")]
        public async Task<IActionResult> GetLastPurchases(int itemId)
        {
            try
            {
                using var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));
                await connection.OpenAsync();

                using var command = new SqlCommand("Sp_Purchase_LastN_ByItemId", connection);
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@ItemId", itemId);
                command.Parameters.AddWithValue("@TopN", 5);

                using var reader = await command.ExecuteReaderAsync();
                DataTable dt = new DataTable();
                dt.Load(reader);

                var list = new List<Dictionary<string, object>>();
                foreach (DataRow row in dt.Rows)
                {
                    var dict = new Dictionary<string, object>();
                    foreach (DataColumn col in dt.Columns)
                    {
                        dict[col.ColumnName] = row[col];
                    }
                    list.Add(dict);
                }

                return Ok(new { success = true, Data = list });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("supplier-transactions/{supplierId}")]
        public async Task<IActionResult> GetSupplierTransactions(int supplierId, [FromQuery] string? catelogId = null)
        {
            var list = new List<Dictionary<string, object>>();
            try
            {
                using (var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("Sp_Purchase", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@Query", 3);
                        command.Parameters.AddWithValue("@Supplierid", supplierId);
                        command.Parameters.AddWithValue("@Catelogid", catelogId ?? (object)DBNull.Value);

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var dict = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    dict[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                }
                                list.Add(dict);
                            }
                        }
                    }
                }
                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] int query, [FromQuery] int? id = null, [FromQuery] string? catelogId = null, [FromQuery] string? searchTerm = null)
        {
            var list = new List<Dictionary<string, object>>();
            try
            {
                using (var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
                {
                    await connection.OpenAsync();
                    if (query == 2)
                    {
                        string topClause = "";
                        if (string.IsNullOrEmpty(searchTerm))
                        {
                            topClause = "TOP 50 "; 
                        }

                        // Use simple string concatenation to ensure no interpolation weirdness
                        string sql = "SELECT " + topClause + "p.*, s.Name as WarehouseName, sub.Supplierdisplayname, sub.Companyname " +
                                     "FROM Tbl_Purchase p " +
                                     "LEFT JOIN Tbl_Stocklocation s ON p.Warehouseid = s.Id " +
                                     "LEFT JOIN Tbl_Supplier sub ON p.Supplierid = sub.Id " +
                                     "WHERE (p.Isdelete = 0 OR p.Isdelete IS NULL OR p.Isdelete = '0' OR p.Isdelete = '')";

                        if (!string.IsNullOrEmpty(catelogId) && catelogId != "0" && catelogId != "null" && catelogId != "undefined")
                        {
                            sql += " AND p.Catelogid = @Catelogid";
                        }

                        if (!string.IsNullOrEmpty(searchTerm))
                        {
                            sql += " AND (p.Billno LIKE @SearchTerm OR sub.Supplierdisplayname LIKE @SearchTerm OR sub.Companyname LIKE @SearchTerm)";
                        }
                        
                        sql += " ORDER BY p.Id DESC";

                        using (var cmd = new SqlCommand(sql, connection))
                        {
                            if (!string.IsNullOrEmpty(catelogId) && catelogId != "0" && catelogId != "null" && catelogId != "undefined")
                                cmd.Parameters.AddWithValue("@Catelogid", catelogId);
                            
                            if (!string.IsNullOrEmpty(searchTerm))
                                cmd.Parameters.AddWithValue("@SearchTerm", "%" + searchTerm + "%");
                            
                            using (var reader = await cmd.ExecuteReaderAsync())
                            {
                                while (await reader.ReadAsync())
                                {
                                    var row = new Dictionary<string, object>();
                                    for (int i = 0; i < reader.FieldCount; i++)
                                    {
                                        row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                    }
                                    list.Add(row);
                                }
                            }
                        }
                        // Console.WriteLine($"[DEBUG] Purchase Search (Query 2) found {list.Count} bills.");
                    }
                    else
                    {
                        using (var command = new SqlCommand("Sp_Purchase", connection))
                        {
                            command.CommandType = CommandType.StoredProcedure;
                            command.Parameters.AddWithValue("@Query", query);
                            command.Parameters.AddWithValue("@Catelogid", catelogId ?? (object)DBNull.Value);
                            if (id.HasValue)
                                command.Parameters.AddWithValue("@Id", id.Value);
                            else
                                command.Parameters.AddWithValue("@Id", DBNull.Value);

                            using (var reader = await command.ExecuteReaderAsync())
                            {
                                while (await reader.ReadAsync())
                                {
                                    var dict = new Dictionary<string, object>();
                                    for (int i = 0; i < reader.FieldCount; i++)
                                    {
                                        dict[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                    }
                                    list.Add(dict);
                                }
                            }
                        }
                    }
                }
                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpPost("delete")]
        public async Task<IActionResult> Delete([FromQuery] string billno)
        {
            string id = "";
            string supplierId = "";
            decimal grandTotal = 0;
            string message = "";
            bool transactionCommitted = false;
            string invoiceNo = "";
            string input = billno;
            
            // Handle "Bill: 123" format or just "123"
            if (!string.IsNullOrEmpty(input))
            {
                string[] parts = input.Split(':');
                if (parts.Length > 1)
                    invoiceNo = parts[1].Trim();
                else
                    invoiceNo = input.Trim();
            }

            try
            {
                using (var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
                {
                    await connection.OpenAsync();
                    using (var transaction = connection.BeginTransaction())
                    {
                        try
                        {
                            // 1. Get Purchase ID from BillNo (Sp_Purchase Query 7)
                            using (var cmd = new SqlCommand("Sp_Purchase", connection, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Billno", invoiceNo);
                                cmd.Parameters.AddWithValue("@Query", 7);

                                using (var reader = await cmd.ExecuteReaderAsync())
                                {
                                    if (await reader.ReadAsync())
                                    {
                                        id = reader["Id"].ToString();
                                        supplierId = reader["Supplierid"].ToString();
                                        grandTotal = Convert.ToDecimal(reader["Grand_Total"]);
                                    }
                                }
                            }

                            if (string.IsNullOrEmpty(id))
                            {
                                return NotFound(new { success = false, message = "Bill not found" });
                            }

                            // 2. Soft Delete Purchase (Sp_Purchase Query 8)
                            using (var cmd = new SqlCommand("Sp_Purchase", connection, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Id", id);
                                cmd.Parameters.AddWithValue("@Isdelete", "1");
                                cmd.Parameters.AddWithValue("@Query", 8);
                                await cmd.ExecuteNonQueryAsync();
                            }

                            // 3. Delete Attachments (Sp_Purchasebillattachments Query 5)
                            using (var cmd = new SqlCommand("Sp_Purchasebillattachments", connection, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Purchase_id", id);
                                cmd.Parameters.AddWithValue("@Isdelete", "1");
                                cmd.Parameters.AddWithValue("@Query", 5);
                                await cmd.ExecuteNonQueryAsync();
                            }

                            // 4. Delete Bill Details (Sp_Purchasebilldetails Query 4)
                            using (var cmd = new SqlCommand("Sp_Purchasebilldetails", connection, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Billid", id);
                                cmd.Parameters.AddWithValue("@Isdelete", "1");
                                cmd.Parameters.AddWithValue("@Query", 4);
                                
                                // Pass dummy values for other params to avoid errors if defaults are missing
                                cmd.Parameters.AddWithValue("@Id", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Userid", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Itemid", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Description", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Qty", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Amount", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Vat", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Vat_id", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Total", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Status", DBNull.Value);

                                await cmd.ExecuteNonQueryAsync();
                            }

                            // 5. Delete Serial Numbers (Raw SQL per user request)
                            using (var cmd = new SqlCommand("DELETE FROM Tbl_Serialnoadd WHERE Purchaseid = @Purchaseid", connection, transaction))
                            {
                                cmd.CommandType = CommandType.Text;
                                cmd.Parameters.AddWithValue("@Purchaseid", id);
                                await cmd.ExecuteNonQueryAsync();
                            }

                            // 6. Delete Purchase COGS (Sp_Purchasecogs Query 2 per user request)
                            using (var cmd = new SqlCommand("Sp_Purchasecogs", connection, transaction))
                            {
                                
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Id", "");
                                cmd.Parameters.AddWithValue("@Purchaseid", id);
                                cmd.Parameters.AddWithValue("@Itemid", "");
                                cmd.Parameters.AddWithValue("@Purchasedate", "");
                                cmd.Parameters.AddWithValue("@Initial_Qty", "");
                                cmd.Parameters.AddWithValue("@Actual_Qty", "");
                                cmd.Parameters.AddWithValue("@Unitcost", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Type", "Bill");
                                cmd.Parameters.AddWithValue("@Status", "");
                                cmd.Parameters.AddWithValue("@Isdelete", "");
                                cmd.Parameters.AddWithValue("@Query", 2);
                                await cmd.ExecuteNonQueryAsync();

                            }

                            // 7. Delete VAT Details (Sp_Purchasevatdetails Query 4)
                            using (var cmd = new SqlCommand("Sp_Purchasevatdetails", connection, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Billid", id);
                                cmd.Parameters.AddWithValue("@Isdelete", "1");
                                cmd.Parameters.AddWithValue("@Query", 4);

                                cmd.Parameters.AddWithValue("@Id", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Customerid", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Type", "Purchase");
                                cmd.Parameters.AddWithValue("@Vatid", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Price", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Vatamount", DBNull.Value);

                                await cmd.ExecuteNonQueryAsync();
                            }

                            // 8. Delete Category Details (Sp_Purchasecategorydetails Query 4)
                            using (var cmd = new SqlCommand("Sp_Purchasecategorydetails", connection, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Billid", id);
                                cmd.Parameters.AddWithValue("@Isdelete", "1");
                                cmd.Parameters.AddWithValue("@Query", 4);

                                cmd.Parameters.AddWithValue("@Id", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Customerid", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Type", "Purchase");
                                cmd.Parameters.AddWithValue("@Categoryid", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Description", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Amount", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Vatvalue", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Vatid", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Total", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Customer", DBNull.Value);

                                await cmd.ExecuteNonQueryAsync();
                            }

                            // 9. Delete Transactions (Sp_Transaction Query 9)
                            using (var cmd = new SqlCommand("Sp_Transaction", connection, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Purchase_salesid", id);
                                cmd.Parameters.AddWithValue("@Entry_type", "Bill");
                                cmd.Parameters.AddWithValue("@Isdelete", "1");
                                cmd.Parameters.AddWithValue("@Query", 9);

                                cmd.Parameters.AddWithValue("@Supplier_customerid", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Date", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Description", "");
                                cmd.Parameters.AddWithValue("@Type", "");
                                cmd.Parameters.AddWithValue("@Transaction_type", "");
                                cmd.Parameters.AddWithValue("@Ca_id", "");
                                cmd.Parameters.AddWithValue("@Amount", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Conversion_amount", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Currency_rate", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Currency", "");
                                cmd.Parameters.AddWithValue("@Status", "");
                                cmd.Parameters.AddWithValue("@Id", DBNull.Value); // Ensure @Id is passed if needed

                                await cmd.ExecuteNonQueryAsync();
                            }

                            // 10. Delete Inventory (Sp_Inventory Query 11)
                            using (var cmd = new SqlCommand("Sp_Inventory", connection, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Billid", id);
                                cmd.Parameters.AddWithValue("@Inventory_type", 1);
                                cmd.Parameters.AddWithValue("@Isdelete", "1");
                                cmd.Parameters.AddWithValue("@Query", 11);
                                await cmd.ExecuteNonQueryAsync();
                            }

                            // 11. Log Deletion (Sp_Supplierpurchaselog Query 1)
                            using (var cmd = new SqlCommand("Sp_Supplierpurchaselog", connection, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Id", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Supplierid", supplierId);
                                cmd.Parameters.AddWithValue("@Purchaseid", id);
                                cmd.Parameters.AddWithValue("@Approveuserid", DBNull.Value);
                                cmd.Parameters.AddWithValue("@Editreason", "");
                                cmd.Parameters.AddWithValue("@Comments", $"{invoiceNo} - Deleted");
                                cmd.Parameters.AddWithValue("@Isdelete", 0); // Log entry itself is active
                                cmd.Parameters.AddWithValue("@Status", "Active");
                                cmd.Parameters.AddWithValue("@Changeddate", DateTime.Now);
                                cmd.Parameters.AddWithValue("@Sentedto", "Accounts");
                                cmd.Parameters.AddWithValue("@Query", 1);
                                await cmd.ExecuteNonQueryAsync();
                            }

                            transaction.Commit();
                            transactionCommitted = true;
                            message = "Deleted successfully";
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            throw; // Re-throw to outer catch
                        }
                    }

                    // Post-commit logic (Stock updates if needed)
                    if (transactionCommitted)
                    {
                        /*
                        // Logic to trigger stock update helper if available
                        using (var cmd = new SqlCommand("Sp_Purchasebilldetails", connection))
                        {
                            cmd.CommandType = CommandType.StoredProcedure;
                            cmd.Parameters.AddWithValue("@Billid", id);
                            cmd.Parameters.AddWithValue("@Isdelete", "1");
                            cmd.Parameters.AddWithValue("@Query", 7); // Select items

                            var dt = new DataTable();
                            using (var reader = await cmd.ExecuteReaderAsync())
                            {
                                dt.Load(reader);
                            }

                            foreach (DataRow row in dt.Rows)
                            {
                                // Call stock update helper here if implemented
                                // su.stockupdationsingleitem(row["Itemid"].ToString(), connection);
                            }
                        }
                        */
                    }
                }

                return Ok(new { success = true, message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("bill-details/{id}")]
        public async Task<IActionResult> GetBillDetails(int id)
        {
            try
            {
                using (var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
                {
                    await connection.OpenAsync();

                    // 1. Fetch Header
                    var header = new Dictionary<string, object>();
                    using (var cmd = new SqlCommand(@"
                        SELECT p.*, s.Name as WarehouseName 
                        FROM Tbl_Purchase p 
                        LEFT JOIN Tbl_Stocklocation s ON p.Warehouseid = s.Id 
                        WHERE p.Id = @Id", connection))
                    {
                        cmd.Parameters.AddWithValue("@Id", id);
                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    header[reader.GetName(i)] = reader.GetValue(i);
                                }
                            }
                            else
                            {
                                return NotFound(new { success = false, message = "Bill not found" });
                            }
                        }
                    }

                    // 2. Fetch Items
                    var items = new List<Dictionary<string, object>>();
                    string itemQuery = @"
                        SELECT d.*, v.Itemname, v.Productid as ProductCode, v.Serialized, vt.Vatvalue
                        FROM Tbl_Purchasebilldetails d 
                        LEFT JOIN Tbl_Productvariants v ON d.Itemid = v.Id 
                        LEFT JOIN Tbl_Vat vt ON d.Vat_id = vt.Id
                        WHERE d.Billid = @Id AND (d.Isdelete = 0 OR d.Isdelete = '0' OR d.Isdelete IS NULL)";
                    
                    using (var cmd = new SqlCommand(itemQuery, connection))
                    {
                        cmd.Parameters.AddWithValue("@Id", id);
                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var dict = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    dict[reader.GetName(i)] = reader.GetValue(i);
                                }
                                items.Add(dict);
                            }
                        }
                    }
                    
                    // 3. Fetch Categories
                    // 3. Fetch Categories
                    var categories = new List<Dictionary<string, object>>();
                    using (var cmd = new SqlCommand("SELECT * FROM Tbl_Purchasecategorydetails WHERE Billid = @Id AND (Isdelete = 0 OR Isdelete = '0' OR Isdelete IS NULL)", connection))
                    {
                        cmd.Parameters.AddWithValue("@Id", id);
                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var dict = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    dict[reader.GetName(i)] = reader.GetValue(i);
                                }
                                categories.Add(dict);
                            }
                        }
                    }
                    
                     // 4. Fetch Serial Numbers
                    var serials = new List<Dictionary<string, object>>();
                    using (var cmd = new SqlCommand("SELECT * FROM Tbl_Serialnoadd WHERE Purchaseid = @Id AND (Isdelete = 0 OR Isdelete = '0' OR Isdelete IS NULL)", connection))
                    {
                        cmd.Parameters.AddWithValue("@Id", id);
                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var dict = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    dict[reader.GetName(i)] = reader.GetValue(i);
                                }
                                serials.Add(dict);
                            }
                        }
                    }

                    // 5. Fetch Attachments
                    var attachments = new List<Dictionary<string, object>>();
                    using (var cmd = new SqlCommand("SELECT * FROM Tbl_purchasebillattachments WHERE Purchase_id = @Id AND (Isdelete = 0 OR Isdelete = '0' OR Isdelete IS NULL)", connection))
                    {
                        cmd.Parameters.AddWithValue("@Id", id);
                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var dict = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    dict[reader.GetName(i)] = reader.GetValue(i);
                                }
                                attachments.Add(dict);
                            }
                        }
                    }

                    return Ok(new { success = true, header, items, categories, serials, attachments });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpPost("check-serial-duplicates")]
        public async Task<IActionResult> CheckForDuplicateSerialNo([FromBody] List<string> serialNumbers)
        {
            var duplicateList = new List<object>();
            string message = "";

            try
            {
                using (var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
                {
                    await connection.OpenAsync();
                    
                    foreach (var serialNumber in serialNumbers)
                    {
                        if (string.IsNullOrWhiteSpace(serialNumber)) continue;

                        using (var cmd = new SqlCommand("Sp_Serialnoadd", connection))
                        {
                            cmd.CommandType = CommandType.StoredProcedure;
                            cmd.Parameters.AddWithValue("@Serialno", serialNumber);
                            cmd.Parameters.AddWithValue("@Id", DBNull.Value);
                            cmd.Parameters.AddWithValue("@Purchaseid", DBNull.Value);
                            cmd.Parameters.AddWithValue("@Itemid", DBNull.Value);
                            cmd.Parameters.AddWithValue("@Status", DBNull.Value);
                            cmd.Parameters.AddWithValue("@Isdelete", DBNull.Value);
                            cmd.Parameters.AddWithValue("@Rowpurchaseid", DBNull.Value);
                            cmd.Parameters.AddWithValue("@Query", 6);

                            using (var reader = await cmd.ExecuteReaderAsync())
                            {
                                while (reader.Read())
                                {
                                    duplicateList.Add(new 
                                    {
                                        Itemname = reader["Itemname"].ToString(),
                                        Serialno = reader["Serialno"].ToString()
                                    });
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                message = $"Error: {ex.Message}";
                return BadRequest(new { message, duplicates = duplicateList });
            }

            return Ok(new { message, duplicates = duplicateList });
        }

        [HttpPost("edit")]
        public async Task<IActionResult> EditPurchaseBill()
        {
            if (!Request.HasFormContentType)
            {
                return BadRequest(new { message = "Invalid content type. Expected form-data." });
            }

            var form = await Request.ReadFormAsync();
            var formDataJson = form["formData"].FirstOrDefault();
            var tableData1Json = form["tableData1"].FirstOrDefault();
            var tableDatavatJson = form["tableDatavat"].FirstOrDefault();
            var tableDatacategoryJson = form["tableDatacategory"].FirstOrDefault();

            if (string.IsNullOrEmpty(formDataJson))
            {
                return BadRequest(new { message = "Error: No form data received." });
            }

            var formData = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, object>>(formDataJson);
            
            var items = new List<Dictionary<string, object>>();
            if (!string.IsNullOrEmpty(tableData1Json))
            {
                items = Newtonsoft.Json.JsonConvert.DeserializeObject<List<Dictionary<string, object>>>(tableData1Json);
            }

            var vats = new List<Dictionary<string, object>>();
            if (!string.IsNullOrEmpty(tableDatavatJson))
            {
                vats = Newtonsoft.Json.JsonConvert.DeserializeObject<List<Dictionary<string, object>>>(tableDatavatJson);
            }

            var categories = new List<Dictionary<string, object>>();
            if (!string.IsNullOrEmpty(tableDatacategoryJson))
            {
                categories = Newtonsoft.Json.JsonConvert.DeserializeObject<List<Dictionary<string, object>>>(tableDatacategoryJson);
            }

            string connectionString = _configuration.GetConnectionString("DefaultConnection");
            string message = "";
            string userId = formData.ContainsKey("Userid") ? formData["Userid"].ToString() : "1";
            string catalogId = "2"; // Default or fetch from user context

            using (var connection = new SqlConnection(connectionString))
            {
                await connection.OpenAsync();
                using (var transaction = connection.BeginTransaction())
                {
                    try
                    {
                        var billId = formData["Id"];
                        
                        // 1. Check Status (Query 4)
                        using (var cmdCheck = new SqlCommand("Sp_Purchase", connection, transaction))
                        {
                            cmdCheck.CommandType = CommandType.StoredProcedure;
                            cmdCheck.Parameters.AddWithValue("@Id", billId);
                            cmdCheck.Parameters.AddWithValue("@Query", 4);

                            using (var reader = await cmdCheck.ExecuteReaderAsync())
                            {
                                if (await reader.ReadAsync())
                                {
                                    // Logic from snippet: status update if needed
                                    // string status = reader["Status"].ToString();
                                }
                            }
                        }

                        // 2. Update Purchase Header (Query 5)
                        using (var cmd2 = new SqlCommand("Sp_Purchase", connection, transaction))
                        {
                            cmd2.CommandType = CommandType.StoredProcedure;
                            cmd2.Parameters.AddWithValue("@Id", billId);
                            cmd2.Parameters.AddWithValue("@Userid", userId);
                            cmd2.Parameters.AddWithValue("@Supplierid", formData["Supplierid"] ?? DBNull.Value);
                            cmd2.Parameters.AddWithValue("@Mailing_address", formData["Mailing_address"] ?? DBNull.Value);
                            cmd2.Parameters.AddWithValue("@Purchase_location", formData["Purchase_location"] ?? DBNull.Value);
                            cmd2.Parameters.AddWithValue("@Terms", formData["Terms"] ?? DBNull.Value);
                            cmd2.Parameters.AddWithValue("@Bill_date", formData["Bill_date"] ?? DBNull.Value);
                            cmd2.Parameters.AddWithValue("@Due_date", formData["Due_date"] ?? DBNull.Value);
                            cmd2.Parameters.AddWithValue("@Billno", formData["Billno"] ?? DBNull.Value);
                            cmd2.Parameters.AddWithValue("@Amountsare", formData["Amountsare"] ?? DBNull.Value);
                            cmd2.Parameters.AddWithValue("@Memo", formData["Memo"] ?? DBNull.Value);
                            cmd2.Parameters.AddWithValue("@Sub_total", formData["Sub_total"] ?? 0);
                            cmd2.Parameters.AddWithValue("@Vat_Amount", formData["Vat_Amount"] ?? 0);
                            cmd2.Parameters.AddWithValue("@Grand_total", formData["Grand_Total"] ?? 0);

                            decimal gt = Convert.ToDecimal(formData["Grand_Total"] ?? 0);
                            decimal rate = Convert.ToDecimal(formData["Currencyvalue"] ?? 1);
                            decimal camount = gt * rate;
                            
                            cmd2.Parameters.AddWithValue("@Conversion_amount", camount);
                            cmd2.Parameters.AddWithValue("@Currency_rate", rate);
                            cmd2.Parameters.AddWithValue("@Currency", formData["Currencyid"] ?? DBNull.Value);

                            cmd2.Parameters.AddWithValue("@Status", "Active");
                            cmd2.Parameters.AddWithValue("@Type", "Bill");
                            cmd2.Parameters.AddWithValue("@Isdelete", "0");
                            cmd2.Parameters.AddWithValue("@Managerapprovestatus", "0");
                            cmd2.Parameters.AddWithValue("@Accountsapprove", "0");
                            cmd2.Parameters.AddWithValue("@Warehouseapprove", "0");
                            cmd2.Parameters.AddWithValue("@Warehouseid", formData["Warehouseid"] ?? DBNull.Value);
                            cmd2.Parameters.AddWithValue("@Query", 5);

                            await cmd2.ExecuteNonQueryAsync();
                        }

                        // 3. Reset Inventory (Query 16)
                        using (var command = new SqlCommand("Sp_Inventory", connection, transaction))
                        {
                            command.CommandType = CommandType.StoredProcedure;
                            command.Parameters.AddWithValue("@Id", "");
                            command.Parameters.AddWithValue("@Productid", "");
                            command.Parameters.AddWithValue("@Inventory_type", "1");
                            command.Parameters.AddWithValue("@Inventory_date", DateTime.Now);
                            command.Parameters.AddWithValue("@Productvariantsid", "");
                            command.Parameters.AddWithValue("@Total_qty", "");
                            command.Parameters.AddWithValue("@Billid", billId);
                            command.Parameters.AddWithValue("@Warehouse_status", "");
                            command.Parameters.AddWithValue("@Isdelete", "");
                            command.Parameters.AddWithValue("@Status", "");
                            command.Parameters.AddWithValue("@Warehouseid", "");
                            command.Parameters.AddWithValue("@Query", 16);

                            await command.ExecuteNonQueryAsync();
                        }

                        // 4. Reset COGS (Query 2)
                        using (var command11 = new SqlCommand("Sp_Purchasecogs", connection, transaction))
                        {
                            command11.CommandType = CommandType.StoredProcedure;
                            command11.Parameters.AddWithValue("@Id", "");
                            command11.Parameters.AddWithValue("@Purchaseid", billId);
                            command11.Parameters.AddWithValue("@Itemid", "");
                            command11.Parameters.AddWithValue("@Purchasedate", "");
                            command11.Parameters.AddWithValue("@Initial_Qty", "");
                            command11.Parameters.AddWithValue("@Actual_Qty", "");
                            command11.Parameters.AddWithValue("@Unitcost", DBNull.Value);
                            command11.Parameters.AddWithValue("@Type", "Bill");
                            command11.Parameters.AddWithValue("@Status", "");
                            command11.Parameters.AddWithValue("@Isdelete", "");
                            command11.Parameters.AddWithValue("@Query", 2);

                            await command11.ExecuteNonQueryAsync();
                        }

                        // 4.5 Clear Serial Numbers
                        using (var cmdSerialClear = new SqlCommand("UPDATE Tbl_Serialnoadd SET Isdelete = 1 WHERE Purchaseid = @BillId", connection, transaction))
                        {
                            cmdSerialClear.Parameters.AddWithValue("@BillId", billId);
                            await cmdSerialClear.ExecuteNonQueryAsync();
                        }

                        // 4.6 Clear Items
                        using (var cmdItemsClear = new SqlCommand("UPDATE Tbl_Purchasebilldetails SET Isdelete = 1 WHERE Billid = @BillId", connection, transaction))
                        {
                            cmdItemsClear.Parameters.AddWithValue("@BillId", billId);
                            await cmdItemsClear.ExecuteNonQueryAsync();
                        }


                        // 5. Process Items
                        if (items != null)
                        {
                            int rowIndex = 1;
                            foreach (var row in items)
                            {
                                await InsertOrUpdateBillDetail(connection, transaction, Convert.ToInt32(billId), userId, row, rowIndex++);

                                var itemId = row["Itemid"];
                                // COGS Insert (Query 1)
                                using (var command10 = new SqlCommand("Sp_Purchasecogs", connection, transaction))
                                {
                                    command10.CommandType = CommandType.StoredProcedure;
                                    command10.Parameters.AddWithValue("@Id", "");
                                    command10.Parameters.AddWithValue("@Purchaseid", billId);
                                    command10.Parameters.AddWithValue("@Itemid", itemId);
                                    command10.Parameters.AddWithValue("@Purchasedate", formData["Bill_date"] ?? DateTime.Now);
                                    command10.Parameters.AddWithValue("@Initial_Qty", row["Qty"]);
                                    command10.Parameters.AddWithValue("@Actual_Qty", row["Qty"]);
                                    command10.Parameters.AddWithValue("@Unitcost", row["Amount"]);
                                    command10.Parameters.AddWithValue("@Type", "Bill");
                                    command10.Parameters.AddWithValue("@Status", "Active");
                                    command10.Parameters.AddWithValue("@Isdelete", "0");
                                    command10.Parameters.AddWithValue("@Query", 1);

                                    await command10.ExecuteNonQueryAsync();
                                }

                                // Product Variant Update (Query 31)
                                using (var cmdsd = new SqlCommand("Sp_Productvariants", connection, transaction))
                                {
                                    cmdsd.CommandType = CommandType.StoredProcedure;
                                    cmdsd.Parameters.AddWithValue("@Id", itemId);
                                    cmdsd.Parameters.AddWithValue("@Description", row["Description"] ?? DBNull.Value);
                                    cmdsd.Parameters.AddWithValue("@Query", 31);
                                    await cmdsd.ExecuteNonQueryAsync();
                                }

                                // Get ProductID (Query 25)
                                string productid = "";
                                using (var cmd212 = new SqlCommand("Sp_Productvariants", connection, transaction))
                                {
                                    cmd212.CommandType = CommandType.StoredProcedure;
                                    cmd212.Parameters.AddWithValue("@Id", itemId);
                                    cmd212.Parameters.AddWithValue("@Query", 25);
                                    var res = await cmd212.ExecuteScalarAsync();
                                    productid = res?.ToString() ?? "";
                                }

                                // Inventory Insert (Query 1)
                                using (var command = new SqlCommand("Sp_Inventory", connection, transaction))
                                {
                                    command.CommandType = CommandType.StoredProcedure;
                                    command.Parameters.AddWithValue("@Id", "");
                                    command.Parameters.AddWithValue("@Productid", productid);
                                    command.Parameters.AddWithValue("@Inventory_type", "1");
                                    command.Parameters.AddWithValue("@Inventory_date", DateTime.Now);
                                    command.Parameters.AddWithValue("@Productvariantsid", itemId);
                                    command.Parameters.AddWithValue("@Total_qty", row["Qty"]);
                                    command.Parameters.AddWithValue("@Billid", billId);
                                    command.Parameters.AddWithValue("@Warehouse_status", "1");
                                    command.Parameters.AddWithValue("@Isdelete", "0");
                                    command.Parameters.AddWithValue("@Status", "Intransit");
                                    command.Parameters.AddWithValue("@Warehouseid", formData["Warehouseid"] ?? DBNull.Value);
                                    command.Parameters.AddWithValue("@Query", 1);
                                    await command.ExecuteNonQueryAsync();
                                }
                            }
                        }

                        // 6. Handle File Uploads (Partial Implementation - similar to SavePurchaseBill)
                        // ... reusing logic for file saving if needed, or simplified update
                        if (form.Files.Count > 0)
                        {
                            string uploadPath = Path.Combine(_environment.WebRootPath, "Content/images/Purchasebillattach");
                            if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

                            // Note: Request.Form["tableid"] logic omitted for brevity, assuming standard attach logic
                             foreach (var file in form.Files)
                            {
                                if (file.Length > 0)
                                {
                                    string fileName = $"{Path.GetFileNameWithoutExtension(file.FileName)}_{DateTime.Now:yyyyMMdd_HHmmss}{Path.GetExtension(file.FileName)}";
                                    string filePath = Path.Combine(uploadPath, fileName);
                                    using (var stream = new FileStream(filePath, FileMode.Create)) { await file.CopyToAsync(stream); }
                                    string dbPath = $"/Content/images/Purchasebillattach/{fileName}";

                                    using (var cmdAttach = new SqlCommand("Sp_Purchasebillattachments", connection, transaction))
                                    {
                                        cmdAttach.CommandType = CommandType.StoredProcedure;
                                        cmdAttach.Parameters.AddWithValue("@Id", ""); // New attachment
                                        cmdAttach.Parameters.AddWithValue("@Userid", userId);
                                        cmdAttach.Parameters.AddWithValue("@Purchase_id", billId);
                                        cmdAttach.Parameters.AddWithValue("@attachment", dbPath);
                                        cmdAttach.Parameters.AddWithValue("@Isdelete", "0");
                                        cmdAttach.Parameters.AddWithValue("@Status", "Active");
                                        cmdAttach.Parameters.AddWithValue("@Query", 1);
                                        await cmdAttach.ExecuteNonQueryAsync();
                                    }
                                }
                            }
                        }

                        // 7. Categories (Clear and Re-insert)
                        // Query 5 Delete
                        using (var cmd23 = new SqlCommand("Sp_Purchasecategorydetails", connection, transaction))
                        {
                            cmd23.CommandType = CommandType.StoredProcedure;
                            cmd23.Parameters.AddWithValue("@Billid", billId);
                            cmd23.Parameters.AddWithValue("@Customerid", "");
                            cmd23.Parameters.AddWithValue("@Type", "Bill");
                            cmd23.Parameters.AddWithValue("@Categoryid", "");
                            cmd23.Parameters.AddWithValue("@Description", "");
                            cmd23.Parameters.AddWithValue("@Amount", "");
                            cmd23.Parameters.AddWithValue("@Vatvalue", "");
                            cmd23.Parameters.AddWithValue("@Vatid", "");
                            cmd23.Parameters.AddWithValue("@Total", "");
                            cmd23.Parameters.AddWithValue("@Customer", "");
                            cmd23.Parameters.AddWithValue("@Isdelete", "");
                            cmd23.Parameters.AddWithValue("@Id", "");
                            cmd23.Parameters.AddWithValue("@Query", 5);
                            await cmd23.ExecuteNonQueryAsync();
                        }

                        if (categories != null)
                        {
                            foreach (var row in categories)
                            {
                                if (row.ContainsKey("Categoryid") && row["Categoryid"] != null)
                                {
                                    using (var cmd231 = new SqlCommand("Sp_Purchasecategorydetails", connection, transaction))
                                    {
                                        cmd231.CommandType = CommandType.StoredProcedure;
                                        cmd231.Parameters.AddWithValue("@Billid", billId);
                                        cmd231.Parameters.AddWithValue("@Customerid", userId);
                                        cmd231.Parameters.AddWithValue("@Type", "Bill");
                                        cmd231.Parameters.AddWithValue("@Categoryid", row["Categoryid"]);
                                        cmd231.Parameters.AddWithValue("@Description", row["Description"] ?? DBNull.Value);
                                        cmd231.Parameters.AddWithValue("@Amount", row["Amount"] ?? 0);
                                        cmd231.Parameters.AddWithValue("@Vatvalue", row["Vatvalue"] ?? 0);
                                        cmd231.Parameters.AddWithValue("@Vatid", row["Vatid"] ?? 0);
                                        cmd231.Parameters.AddWithValue("@Total", row["Total"] ?? 0);
                                        cmd231.Parameters.AddWithValue("@Customer", "");
                                        cmd231.Parameters.AddWithValue("@Isdelete", 0);
                                        cmd231.Parameters.AddWithValue("@Query", 1);
                                        await cmd231.ExecuteNonQueryAsync();
                                    }
                                }
                            }
                        }

                        // 8. Vat Details (Clear and Re-insert)
                        using (var cmd2312 = new SqlCommand("Sp_Purchasevatdetails", connection, transaction))
                        {
                            cmd2312.CommandType = CommandType.StoredProcedure;
                            cmd2312.Parameters.AddWithValue("@Billid", billId);
                            cmd2312.Parameters.AddWithValue("@Customerid", "");
                            cmd2312.Parameters.AddWithValue("@Type", "Bill");
                            cmd2312.Parameters.AddWithValue("@Vatid", "");
                            cmd2312.Parameters.AddWithValue("@Price", "");
                            cmd2312.Parameters.AddWithValue("@Vatamount", "");
                            cmd2312.Parameters.AddWithValue("@Isdelete", "");
                            cmd2312.Parameters.AddWithValue("@Id", "");
                            cmd2312.Parameters.AddWithValue("@Query", 5);
                            await cmd2312.ExecuteNonQueryAsync();
                        }

                        if (vats != null)
                        {
                            foreach (var row in vats)
                            {
                                using (var cmd231 = new SqlCommand("Sp_Purchasevatdetails", connection, transaction))
                                {
                                    cmd231.CommandType = CommandType.StoredProcedure;
                                    cmd231.Parameters.AddWithValue("@Billid", billId);
                                    cmd231.Parameters.AddWithValue("@Customerid", userId);
                                    cmd231.Parameters.AddWithValue("@Type", "Bill");
                                    cmd231.Parameters.AddWithValue("@Vatid", row["Id"]);
                                    cmd231.Parameters.AddWithValue("@Price", row["Vatprice"] ?? 0);
                                    cmd231.Parameters.AddWithValue("@Vatamount", row["Vatvalue"] ?? 0);
                                    cmd231.Parameters.AddWithValue("@Isdelete", "0");
                                    cmd231.Parameters.AddWithValue("@Id", "");
                                    cmd231.Parameters.AddWithValue("@Query", 1);
                                    await cmd231.ExecuteNonQueryAsync();
                                }
                            }
                        }

                        // 9. Transactions
                        using (var cmdt = new SqlCommand("Sp_Transaction", connection, transaction))
                        {
                            cmdt.CommandType = CommandType.StoredProcedure;
                            cmdt.Parameters.AddWithValue("@Id", "");
                            cmdt.Parameters.AddWithValue("@Purchase_salesid", billId);
                            cmdt.Parameters.AddWithValue("@Supplier_customerid", "");
                            cmdt.Parameters.AddWithValue("@Date", "");
                            cmdt.Parameters.AddWithValue("@Description", "");
                            cmdt.Parameters.AddWithValue("@Type", "");
                            cmdt.Parameters.AddWithValue("@Transaction_type", "");
                            cmdt.Parameters.AddWithValue("@Ca_id", "");
                            cmdt.Parameters.AddWithValue("@Vat_id", "");
                            cmdt.Parameters.AddWithValue("@Entry_type", "Bill");
                            cmdt.Parameters.AddWithValue("@Amount", DBNull.Value);
                            cmdt.Parameters.AddWithValue("@Conversion_amount", DBNull.Value);
                            cmdt.Parameters.AddWithValue("@Currency_rate", DBNull.Value);
                            cmdt.Parameters.AddWithValue("@Currency", "");
                            cmdt.Parameters.AddWithValue("@Isdelete", "");
                            cmdt.Parameters.AddWithValue("@Status", "");
                            cmdt.Parameters.AddWithValue("@Query", 15);
                            await cmdt.ExecuteNonQueryAsync();
                        }

                        // Helper for transaction entries
                        Func<string, string, decimal, decimal, string, Task> ExecuteTrans = async (caId, transType, amount, convAmount, vatId) =>
                        {
                            using (var cmd = new SqlCommand("Sp_Transaction", connection, transaction))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@Id", "");
                                cmd.Parameters.AddWithValue("@Purchase_salesid", billId);
                                cmd.Parameters.AddWithValue("@Supplier_customerid", formData["Supplierid"]);
                                cmd.Parameters.AddWithValue("@Date", formData["Bill_date"] ?? DateTime.Now);
                                cmd.Parameters.AddWithValue("@Description", "");
                                cmd.Parameters.AddWithValue("@Type", "0");
                                cmd.Parameters.AddWithValue("@Transaction_type", transType);
                                cmd.Parameters.AddWithValue("@Ca_id", caId);
                                cmd.Parameters.AddWithValue("@Vat_id", vatId ?? "0");
                                cmd.Parameters.AddWithValue("@Entry_type", "Bill");
                                cmd.Parameters.AddWithValue("@Amount", amount);
                                cmd.Parameters.AddWithValue("@Conversion_amount", convAmount);
                                cmd.Parameters.AddWithValue("@Currency_rate", formData["Currencyvalue"] ?? 1);
                                cmd.Parameters.AddWithValue("@Currency", formData["Currencyid"] ?? DBNull.Value);
                                cmd.Parameters.AddWithValue("@Isdelete", "0");
                                cmd.Parameters.AddWithValue("@Status", "Active");
                                cmd.Parameters.AddWithValue("@Query", 1);
                                await cmd.ExecuteNonQueryAsync();
                            }
                        };

                        decimal vatAmt = Convert.ToDecimal(formData["Vat_Amount"] ?? 0);
                        decimal convVat = vatAmt * Convert.ToDecimal(formData["Currencyvalue"] ?? 1);
                        await ExecuteTrans("38", "Debit", vatAmt, convVat, "0");

                        decimal grandTotal = Convert.ToDecimal(formData["Grand_Total"] ?? 0);
                        decimal subTotalVal = grandTotal - vatAmt;
                        decimal convSub = subTotalVal * Convert.ToDecimal(formData["Currencyvalue"] ?? 1);
                        string debitAcc = (catalogId == "2") ? "35" : "50";
                        
                        await ExecuteTrans(debitAcc, "Debit", subTotalVal, convSub, "0");

                        decimal convGT = grandTotal * Convert.ToDecimal(formData["Currencyvalue"] ?? 1);
                        await ExecuteTrans("20", "Credit", grandTotal, convGT, "0");

                        // 10. Log
                        using (var command = new SqlCommand("Sp_Supplierpurchaselog", connection, transaction))
                        {
                            command.CommandType = CommandType.StoredProcedure;
                            command.Parameters.AddWithValue("@Id", "");
                            command.Parameters.AddWithValue("@Supplierid", formData["Supplierid"]);
                            command.Parameters.AddWithValue("@Purchaseid", billId);
                            command.Parameters.AddWithValue("@Approveuserid", "");
                            command.Parameters.AddWithValue("@Editreason", "");
                            command.Parameters.AddWithValue("@Comments", $"{formData["Billno"]} - Updated");
                            command.Parameters.AddWithValue("@Isdelete", 0);
                            command.Parameters.AddWithValue("@Status", "Active");
                            command.Parameters.AddWithValue("@Changeddate", DateTime.Now);
                            command.Parameters.AddWithValue("@Sentedto", "Accounts");
                            command.Parameters.AddWithValue("@Query", 1);
                            await command.ExecuteNonQueryAsync();
                        }

                        transaction.Commit();
                        message = "Updated successfully";
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        message = $"Error: {ex.Message}";
                        return BadRequest(new { message });
                    }
                }
            }

            return Ok(new { message });
        }

        [HttpGet("approvals")]
        public async Task<IActionResult> GetPurchaseApprovals()
        {
            var list = new List<Dictionary<string, object>>();
            try
            {
                using (var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("Sp_Purchase", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@Warehouseapprove", "0");
                        command.Parameters.AddWithValue("@Accountsapprove", "0");
                        command.Parameters.AddWithValue("@Isdelete", "0");
                        command.Parameters.AddWithValue("@Query", 26);

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var dict = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    dict[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                }
                                list.Add(dict);
                            }
                        }
                    }
                }
                return Ok(new { success = true, data = list, count = list.Count });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
        
        public class ReceiveStockItemDto
        {
            public string purchaseDetailId { get; set; } = "";
            public string itemId { get; set; } = "";
            public string qty { get; set; } = "0";
            public string received_qty { get; set; } = "0";
            public string disputed_qty { get; set; } = "0";
            public string reason { get; set; } = "";
        }

        public class ReceiveStockDto
        {
            public string purchaseId { get; set; } = "0";
            public string warehouseId { get; set; } = "";
            public string supplierId { get; set; } = "";
            public string userId { get; set; } = "";
            public List<ReceiveStockItemDto> items { get; set; } = new List<ReceiveStockItemDto>();
        }

        [HttpPost("receive-stock")]
        public async Task<IActionResult> ReceiveStock([FromBody] ReceiveStockDto body)
        {
            try
            {
                if (body == null) return BadRequest(new { success = false, message = "Invalid request body" });

                int purchaseId = Convert.ToInt32(body.purchaseId);
                string warehouseId = body.warehouseId ?? "";
                string supplierId = body.supplierId ?? "";
                string userId = body.userId ?? "1";
                var items = body.items;

                if (items == null || items.Count == 0)
                {
                    return BadRequest(new { success = false, message = "No items provided in request" });
                }

                string connectionString = _configuration.GetConnectionString("DefaultConnection");

                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    using (var transaction = connection.BeginTransaction())
                    {
                        try
                        {
                            foreach (var item in items)
                            {
                                int insertedId = 0;
                                
                                // 1. Sp_Warehousestock Query 1
                                using (var command = new SqlCommand("Sp_Warehousestock", connection, transaction))
                                {
                                    command.CommandType = CommandType.StoredProcedure;
                                    command.Parameters.AddWithValue("@Id", "");
                                    command.Parameters.AddWithValue("@Warehouse_id", warehouseId);
                                    command.Parameters.AddWithValue("@Warehouse_userid", userId);
                                    command.Parameters.AddWithValue("@Purchaseid", purchaseId);
                                    command.Parameters.AddWithValue("@Supplierid", supplierId);
                                    command.Parameters.AddWithValue("@Purchasebillid", item.purchaseDetailId ?? "");
                                    command.Parameters.AddWithValue("@Itemid", item.itemId ?? "");
                                    command.Parameters.AddWithValue("@Qty", item.qty ?? "0");
                                    command.Parameters.AddWithValue("@Received_qty", item.received_qty ?? "0");
                                    command.Parameters.AddWithValue("@Disputed_qty", item.disputed_qty ?? "0");
                                    command.Parameters.AddWithValue("@Reason", item.reason ?? "");
                                    command.Parameters.AddWithValue("@Received_date", DateTime.Now);
                                    command.Parameters.AddWithValue("@Isdelete", "0");
                                    command.Parameters.AddWithValue("@Status", "Active");
                                    command.Parameters.AddWithValue("@Type", "0");
                                    command.Parameters.AddWithValue("@Query", 1);

                                    SqlParameter outputParam = new SqlParameter
                                    {
                                        ParameterName = "@InsertedId",
                                        SqlDbType = SqlDbType.Int,
                                        Direction = ParameterDirection.Output
                                    };
                                    command.Parameters.Add(outputParam);
                                    await command.ExecuteNonQueryAsync();
                                    insertedId = (int)outputParam.Value;
                                }

                                // 2. Sp_Warehouselog Query 1
                                using (var cmdLog = new SqlCommand("Sp_Warehouselog", connection, transaction))
                                {
                                    cmdLog.CommandType = CommandType.StoredProcedure;
                                    cmdLog.Parameters.AddWithValue("@Id", "");
                                    cmdLog.Parameters.AddWithValue("@Warehouse_qtyid", insertedId);
                                    cmdLog.Parameters.AddWithValue("@Purchaseid", purchaseId);
                                    cmdLog.Parameters.AddWithValue("@commentslog", $"Supplierid: {supplierId}, Purchaseid: {purchaseId} - Received");
                                    cmdLog.Parameters.AddWithValue("@Date", DateTime.Now);
                                    cmdLog.Parameters.AddWithValue("@Isdelete", '0');
                                    cmdLog.Parameters.AddWithValue("@Query", 1);
                                    await cmdLog.ExecuteNonQueryAsync();
                                }

                                // 3. Sp_Supplierpurchaselog Query 1
                                using (var command = new SqlCommand("Sp_Supplierpurchaselog", connection, transaction))
                                {
                                    command.CommandType = CommandType.StoredProcedure;
                                    command.Parameters.AddWithValue("@Id", "");
                                    command.Parameters.AddWithValue("@Supplierid", insertedId);
                                    command.Parameters.AddWithValue("@Purchaseid", purchaseId);
                                    command.Parameters.AddWithValue("@Approveuserid", "");
                                    command.Parameters.AddWithValue("@Editreason", "");
                                    command.Parameters.AddWithValue("@Comments", $"Supplierid: {supplierId}, Purchaseid: {purchaseId} - Received");
                                    command.Parameters.AddWithValue("@Isdelete", 0);
                                    command.Parameters.AddWithValue("@Status", "1");
                                    command.Parameters.AddWithValue("@Changeddate", DateTime.Now);
                                    command.Parameters.AddWithValue("@Type", "Approve/Reject");
                                    command.Parameters.AddWithValue("@Sentedto", "");
                                    command.Parameters.AddWithValue("@Query", 1);
                                    await command.ExecuteNonQueryAsync();
                                }
                            }

                            // 4. Update Sp_Purchase Query 21
                            using (var cmdP = new SqlCommand("Sp_Purchase", connection, transaction))
                            {
                                cmdP.CommandType = CommandType.StoredProcedure;
                                cmdP.Parameters.AddWithValue("@Id", purchaseId);
                                cmdP.Parameters.AddWithValue("@Warehouseapprove", "1");
                                cmdP.Parameters.AddWithValue("@Query", 21);
                                await cmdP.ExecuteNonQueryAsync();
                            }

                            transaction.Commit();
                            return Ok(new { success = true, message = "Stock received successfully" });
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            return BadRequest(new { success = false, message = $"Transaction Error: {ex.Message}" });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Server Error: {ex.Message}" });
            }
        }
        [HttpPost("approve")]
        public async Task<IActionResult> ApprovePurchaseBill([FromBody] System.Text.Json.JsonElement body)
        {
            try
            {
                string purchaseId = body.GetProperty("purchaseid").ToString();
                string supplierId = body.GetProperty("supplierid").ToString();
                string status = body.GetProperty("status").ToString();
                string comments = body.TryGetProperty("comments", out var comm) ? comm.ToString() : "";
                string userId = body.TryGetProperty("userid", out var uid) ? uid.ToString() : "1";

                using (var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
                {
                    await connection.OpenAsync();
                    
                    // 1. Log the approval action
                    using (var cmd4 = new SqlCommand("Sp_Supplierpurchaselog", connection))
                    {
                        cmd4.CommandType = CommandType.StoredProcedure;
                        cmd4.Parameters.AddWithValue("@Id", "");
                        cmd4.Parameters.AddWithValue("@Supplierid", supplierId);
                        cmd4.Parameters.AddWithValue("@Purchaseid", purchaseId);
                        cmd4.Parameters.AddWithValue("@Approveuserid", userId);
                        cmd4.Parameters.AddWithValue("@Editreason", "");
                        cmd4.Parameters.AddWithValue("@Isdelete", "0");
                        cmd4.Parameters.AddWithValue("@Changeddate", DateTime.Now);
                        cmd4.Parameters.AddWithValue("@Comments", comments);
                        cmd4.Parameters.AddWithValue("@Type", "Approve/Reject");
                        cmd4.Parameters.AddWithValue("@Status", status == "Approved" ? "1" : "2");
                        cmd4.Parameters.AddWithValue("@Sentedto", "");
                        cmd4.Parameters.AddWithValue("@Query", 1);
                        await cmd4.ExecuteNonQueryAsync();
                    }

                    // 2. Update Purchase table status
                    using (var cmd212 = new SqlCommand("Sp_Purchase", connection))
                    {
                        cmd212.CommandType = CommandType.StoredProcedure;
                        cmd212.Parameters.AddWithValue("@Id", purchaseId);
                        cmd212.Parameters.AddWithValue("@Accountsapprove", status == "Approved" ? "1" : "2");
                        cmd212.Parameters.AddWithValue("@Query", 19);
                        await cmd212.ExecuteNonQueryAsync();
                    }
                }
                return Ok(new { success = true, message = "Response successfully saved" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}


using System.Data;
using System.Globalization;
using Microsoft.Data.SqlClient;

namespace Api;

/// <summary>
/// Legacy MVC POST /Sales/savesalesquote — manager approve/reject with optional PDF (Draft → new quote no + file + inventory).
/// </summary>
public static class SalesQuoteApprovalSaveHandler
{
    private static string NowLegacy() => DateTime.Now.ToString("dd-MM-yyyy HH:mm:ss", CultureInfo.InvariantCulture);

    private static async Task<string?> LoadCustomerIdAsync(SqlConnection con, SqlTransaction? tx, string billId, CancellationToken ct)
    {
        await using var cmd21 = new SqlCommand("Sp_Salesquote", con, tx);
        cmd21.CommandType = CommandType.StoredProcedure;
        cmd21.Parameters.AddWithValue("@Id", billId);
        cmd21.Parameters.AddWithValue("@Userid", "");
        cmd21.Parameters.AddWithValue("@Salesquoteno", "");
        cmd21.Parameters.AddWithValue("@Customerid", "");
        cmd21.Parameters.AddWithValue("@Billdate", "");
        cmd21.Parameters.AddWithValue("@Duedate", "");
        cmd21.Parameters.AddWithValue("@Amountsare", "");
        cmd21.Parameters.AddWithValue("@Vatnumber", "");
        cmd21.Parameters.AddWithValue("@Billing_address", "");
        cmd21.Parameters.AddWithValue("@Sales_location", "");
        cmd21.Parameters.AddWithValue("@Sub_total", "");
        cmd21.Parameters.AddWithValue("@Vat", "");
        cmd21.Parameters.AddWithValue("@Vat_amount", "");
        cmd21.Parameters.AddWithValue("@Grand_total", "");
        cmd21.Parameters.AddWithValue("@Conversion_amount", DBNull.Value);
        cmd21.Parameters.AddWithValue("@Currency_rate", DBNull.Value);
        cmd21.Parameters.AddWithValue("@Currency", "");
        cmd21.Parameters.AddWithValue("@Terms", "");
        cmd21.Parameters.AddWithValue("@Query", 10);

        var dt = new DataTable();
        await using (var reader = await cmd21.ExecuteReaderAsync(ct))
        {
            dt.Load(reader);
        }

        if (dt.Rows.Count == 0) return null;
        var row = dt.Rows[0];
        foreach (var col in new[] { "Customerid", "customerid", "CustomerId" })
        {
            if (dt.Columns.Contains(col))
                return row[col]?.ToString();
        }
        return null;
    }

    private static async Task ExecSalesquoteQ11Async(SqlConnection con, SqlTransaction tx, string billId, string salesQuoteNo, string status, CancellationToken ct)
    {
        await using var cmd21 = new SqlCommand("Sp_Salesquote", con, tx);
        cmd21.CommandType = CommandType.StoredProcedure;
        cmd21.Parameters.AddWithValue("@Id", billId);
        cmd21.Parameters.AddWithValue("@Userid", "");
        cmd21.Parameters.AddWithValue("@Salesquoteno", salesQuoteNo);
        cmd21.Parameters.AddWithValue("@Customerid", "");
        cmd21.Parameters.AddWithValue("@Billdate", "");
        cmd21.Parameters.AddWithValue("@Duedate", "");
        cmd21.Parameters.AddWithValue("@Amountsare", "");
        cmd21.Parameters.AddWithValue("@Vatnumber", "");
        cmd21.Parameters.AddWithValue("@Billing_address", "");
        cmd21.Parameters.AddWithValue("@Sales_location", "");
        cmd21.Parameters.AddWithValue("@Sub_total", "");
        cmd21.Parameters.AddWithValue("@Vat", "");
        cmd21.Parameters.AddWithValue("@Vat_amount", "");
        cmd21.Parameters.AddWithValue("@Grand_total", "");
        cmd21.Parameters.AddWithValue("@Conversion_amount", DBNull.Value);
        cmd21.Parameters.AddWithValue("@Currency_rate", DBNull.Value);
        cmd21.Parameters.AddWithValue("@Currency", "");
        cmd21.Parameters.AddWithValue("@Terms", "");
        cmd21.Parameters.AddWithValue("@Status", status);
        cmd21.Parameters.AddWithValue("@Query", 11);
        await cmd21.ExecuteNonQueryAsync(ct);
    }

    private static async Task InsertSalesquoteLogAsync(SqlConnection con, SqlTransaction tx, string customerId, string billId, string approveUserId, string comments, string typeStatus, bool approved, CancellationToken ct)
    {
        await using var cmd21 = new SqlCommand("Sp_Salesquotelog", con, tx);
        cmd21.CommandType = CommandType.StoredProcedure;
        cmd21.Parameters.AddWithValue("@Id", "");
        cmd21.Parameters.AddWithValue("@Customerid", customerId);
        cmd21.Parameters.AddWithValue("@Salesquoteid", billId);
        cmd21.Parameters.AddWithValue("@Approveuserid", approveUserId);
        cmd21.Parameters.AddWithValue("@Editreason", "");
        cmd21.Parameters.AddWithValue("@Comments", comments ?? "");
        cmd21.Parameters.AddWithValue("@Isdelete", "0");
        cmd21.Parameters.AddWithValue("@Status", approved ? "1" : "2");
        cmd21.Parameters.AddWithValue("@Changeddate", NowLegacy());
        cmd21.Parameters.AddWithValue("@Type", typeStatus);
        cmd21.Parameters.AddWithValue("@Query", "1");
        await cmd21.ExecuteNonQueryAsync(ct);
    }

    private static async Task ProcessInventoryForApprovedAsync(SqlConnection con, SqlTransaction tx, string billId, string warehouseId, CancellationToken ct)
    {
        await using (var cmd21 = new SqlCommand("Sp_Salesquotedetails", con, tx))
        {
            cmd21.CommandType = CommandType.StoredProcedure;
            cmd21.Parameters.AddWithValue("@Id", "");
            cmd21.Parameters.AddWithValue("@Userid", "");
            cmd21.Parameters.AddWithValue("@Salesquoteid", billId);
            cmd21.Parameters.AddWithValue("@Itemid", "");
            cmd21.Parameters.AddWithValue("@Qty", "");
            cmd21.Parameters.AddWithValue("@Amount", "");
            cmd21.Parameters.AddWithValue("@Vat", "");
            cmd21.Parameters.AddWithValue("@Vat_id", "");
            cmd21.Parameters.AddWithValue("@Total", "");
            cmd21.Parameters.AddWithValue("@Status", "");
            cmd21.Parameters.AddWithValue("@Isdelete", "0");
            cmd21.Parameters.AddWithValue("@Query", 4);

            var dt = new DataTable();
            await using (var reader = await cmd21.ExecuteReaderAsync(ct))
            {
                dt.Load(reader);
            }

            foreach (DataRow row in dt.Rows)
            {
                var type = row["Type"]?.ToString() ?? "";
                if (string.Equals(type, "Set", StringComparison.OrdinalIgnoreCase))
                {
                    await using var command = new SqlCommand("Sp_setitems", con, tx);
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.AddWithValue("@Userid", "");
                    command.Parameters.AddWithValue("@Productid", "");
                    command.Parameters.AddWithValue("@Id", "");
                    command.Parameters.AddWithValue("@Productsetid", row["Itemid"]);
                    command.Parameters.AddWithValue("@Productvariantsid", "");
                    command.Parameters.AddWithValue("@Itemname", "");
                    command.Parameters.AddWithValue("@Qty", "");
                    command.Parameters.AddWithValue("@Isdelete", "");
                    command.Parameters.AddWithValue("@Status", "");
                    command.Parameters.AddWithValue("@Workstatus", "");
                    command.Parameters.AddWithValue("@Query", 8);

                    var dt2 = new DataTable();
                    using (var da2 = new SqlDataAdapter(command))
                    {
                        await Task.Run(() => da2.Fill(dt2), ct);
                    }

                    for (var i = 0; i < dt2.Rows.Count; i++)
                    {
                        var pid = "";
                        await using (var cmd212a = new SqlCommand("Sp_Productvariants", con, tx))
                        {
                            cmd212a.CommandType = CommandType.StoredProcedure;
                            cmd212a.Parameters.AddWithValue("@Id", dt2.Rows[i][0].ToString());
                            cmd212a.Parameters.AddWithValue("@Query", 25);
                            var scalar = await cmd212a.ExecuteScalarAsync(ct);
                            if (scalar != null) pid = scalar.ToString() ?? "";
                        }

                        var pieceQty = Convert.ToInt32(dt2.Rows[i][1].ToString() ?? "0", CultureInfo.InvariantCulture);
                        var lineQty = Convert.ToInt32(row["Qty"]?.ToString() ?? "0", CultureInfo.InvariantCulture);
                        var tqty = pieceQty * lineQty;

                        await using (var command2 = new SqlCommand("Sp_Inventory", con, tx))
                        {
                            command2.CommandType = CommandType.StoredProcedure;
                            command2.Parameters.AddWithValue("@Id", "");
                            command2.Parameters.AddWithValue("@Productid", pid);
                            command2.Parameters.AddWithValue("@Inventory_type", "4");
                            command2.Parameters.AddWithValue("@Inventory_date", NowLegacy());
                            command2.Parameters.AddWithValue("@Productvariantsid", dt2.Rows[i][0].ToString());
                            command2.Parameters.AddWithValue("@Total_qty", tqty);
                            command2.Parameters.AddWithValue("@Billid", billId);
                            command2.Parameters.AddWithValue("@Warehouse_status", "1");
                            command2.Parameters.AddWithValue("@Isdelete", "0");
                            command2.Parameters.AddWithValue("@Status", "Transit");
                            command2.Parameters.AddWithValue("@Warehouseid", warehouseId);
                            command2.Parameters.AddWithValue("@Query", 1);
                            await command2.ExecuteNonQueryAsync(ct);
                        }
                    }
                }
                else if (string.Equals(type, "Combo", StringComparison.OrdinalIgnoreCase))
                {
                    await using var command = new SqlCommand("Sp_Comboitems", con, tx);
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.AddWithValue("@Userid", "");
                    command.Parameters.AddWithValue("@Id", "");
                    command.Parameters.AddWithValue("@Productcomboid", row["Itemid"]);
                    command.Parameters.AddWithValue("@Productvariantsid", "");
                    command.Parameters.AddWithValue("@Qty", "");
                    command.Parameters.AddWithValue("@Isdelete", "");
                    command.Parameters.AddWithValue("@Status", "");
                    command.Parameters.AddWithValue("@Workstatus", "");
                    command.Parameters.AddWithValue("@Query", 2);

                    var dt2 = new DataTable();
                    using (var da2 = new SqlDataAdapter(command))
                    {
                        await Task.Run(() => da2.Fill(dt2), ct);
                    }

                    for (var i = 0; i < dt2.Rows.Count; i++)
                    {
                        var pid = "";
                        await using (var cmd212a = new SqlCommand("Sp_Productvariants", con, tx))
                        {
                            cmd212a.CommandType = CommandType.StoredProcedure;
                            cmd212a.Parameters.AddWithValue("@Id", dt2.Rows[i][0].ToString());
                            cmd212a.Parameters.AddWithValue("@Query", 25);
                            var scalar = await cmd212a.ExecuteScalarAsync(ct);
                            if (scalar != null) pid = scalar.ToString() ?? "";
                        }

                        var pieceQty = Convert.ToInt32(dt2.Rows[i][1].ToString() ?? "0", CultureInfo.InvariantCulture);
                        var lineQty = Convert.ToInt32(row["Qty"]?.ToString() ?? "0", CultureInfo.InvariantCulture);
                        var tqty = pieceQty * lineQty;

                        await using (var command2 = new SqlCommand("Sp_Inventory", con, tx))
                        {
                            command2.CommandType = CommandType.StoredProcedure;
                            command2.Parameters.AddWithValue("@Id", "");
                            command2.Parameters.AddWithValue("@Productid", pid);
                            command2.Parameters.AddWithValue("@Inventory_type", "4");
                            command2.Parameters.AddWithValue("@Inventory_date", NowLegacy());
                            command2.Parameters.AddWithValue("@Productvariantsid", dt2.Rows[i][0].ToString());
                            command2.Parameters.AddWithValue("@Total_qty", tqty);
                            command2.Parameters.AddWithValue("@Billid", billId);
                            command2.Parameters.AddWithValue("@Warehouse_status", "1");
                            command2.Parameters.AddWithValue("@Isdelete", "0");
                            command2.Parameters.AddWithValue("@Status", "Transit");
                            command2.Parameters.AddWithValue("@Warehouseid", warehouseId);
                            command2.Parameters.AddWithValue("@Query", 1);
                            await command2.ExecuteNonQueryAsync(ct);
                        }
                    }
                }
                else
                {
                    var productid = "";
                    await using (var cmd212 = new SqlCommand("Sp_Productvariants", con, tx))
                    {
                        cmd212.CommandType = CommandType.StoredProcedure;
                        cmd212.Parameters.AddWithValue("@Id", row["Itemid"]);
                        cmd212.Parameters.AddWithValue("@Query", 25);
                        var scalar = await cmd212.ExecuteScalarAsync(ct);
                        if (scalar != null) productid = scalar.ToString() ?? "";
                    }

                    var qtyVal = row["Qty"]?.ToString() ?? "0";

                    await using (var command = new SqlCommand("Sp_Inventory", con, tx))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@Id", "");
                        command.Parameters.AddWithValue("@Productid", productid);
                        command.Parameters.AddWithValue("@Inventory_type", "4");
                        command.Parameters.AddWithValue("@Inventory_date", NowLegacy());
                        command.Parameters.AddWithValue("@Productvariantsid", row["Itemid"]);
                        command.Parameters.AddWithValue("@Total_qty", qtyVal);
                        command.Parameters.AddWithValue("@Billid", billId);
                        command.Parameters.AddWithValue("@Warehouse_status", "1");
                        command.Parameters.AddWithValue("@Isdelete", "0");
                        command.Parameters.AddWithValue("@Status", "Transit");
                        command.Parameters.AddWithValue("@Warehouseid", warehouseId);
                        command.Parameters.AddWithValue("@Query", 1);
                        await command.ExecuteNonQueryAsync(ct);
                    }
                }
            }
        }
    }

    public static async Task<IResult> Handle(HttpContext context, SqlConnection connection, IWebHostEnvironment env)
    {
        try
        {
            var ct = context.RequestAborted;
            var json = await System.Text.Json.JsonSerializer.DeserializeAsync<System.Text.Json.JsonElement>(context.Request.Body, cancellationToken: ct);

            if (!json.TryGetProperty("quoteId", out var qEl) || !qEl.TryGetInt32(out var quoteId) || quoteId <= 0)
                return Results.Json(new { success = false, message = "Invalid quoteId" }, statusCode: 400);

            var status = json.TryGetProperty("status", out var sEl) ? (sEl.GetString() ?? "") : "";
            if (!status.Equals("Approved", StringComparison.OrdinalIgnoreCase) && !status.Equals("Rejected", StringComparison.OrdinalIgnoreCase))
                return Results.Json(new { success = false, message = "status must be Approved or Rejected" }, statusCode: 400);

            var comments = json.TryGetProperty("comments", out var cEl) ? (cEl.GetString() ?? "") : "";
            var userId = json.TryGetProperty("userid", out var uEl) ? (uEl.GetString() ?? "") : "";
            var pdfData = json.TryGetProperty("pdfData", out var pEl) ? (pEl.GetString() ?? "") : "";
            var invoiceId = json.TryGetProperty("invoiceId", out var iEl) ? (iEl.GetString() ?? "").Trim() : "";
            var invoiceno = json.TryGetProperty("invoiceno", out var inEl) ? (inEl.GetString() ?? "").Trim() : invoiceId;
            // Draft → first final number: run legacy inventory (Sp_Salesquotedetails Q4). Already-numbered quote: skip (legacy savepdf1 path).
            var allocateInventory = true;
            if (json.TryGetProperty("allocateInventory", out var invEl))
            {
                if (invEl.ValueKind == System.Text.Json.JsonValueKind.False)
                    allocateInventory = false;
                else if (invEl.ValueKind == System.Text.Json.JsonValueKind.True)
                    allocateInventory = true;
                else if (invEl.ValueKind == System.Text.Json.JsonValueKind.String &&
                         string.Equals(invEl.GetString(), "false", StringComparison.OrdinalIgnoreCase))
                    allocateInventory = false;
            }

            if (string.IsNullOrEmpty(invoiceId))
                return Results.Json(new { success = false, message = "invoiceId (sales quote number) is required" }, statusCode: 400);

            var billid = quoteId.ToString(CultureInfo.InvariantCulture);
            var approved = status.Equals("Approved", StringComparison.OrdinalIgnoreCase);

            await connection.OpenAsync(ct);

            var customerid = await LoadCustomerIdAsync(connection, null, billid, ct);
            if (string.IsNullOrEmpty(customerid))
                return Results.Json(new { success = false, message = "Could not load quote (customer)" }, statusCode: 400);

            if (!approved)
            {
                await using var tx = (SqlTransaction)await connection.BeginTransactionAsync(ct);
                try
                {
                    await InsertSalesquoteLogAsync(connection, tx, customerid, billid, userId, comments, status, false, ct);
                    await ExecSalesquoteQ11Async(connection, tx, billid, invoiceno, status, ct);

                    await using (var upd = new SqlCommand(
                                     "UPDATE Tbl_Salesquote SET Managerapprovestatus = @M WHERE Id = @Id", connection, tx))
                    {
                        upd.Parameters.AddWithValue("@M", "2");
                        upd.Parameters.AddWithValue("@Id", quoteId);
                        await upd.ExecuteNonQueryAsync(ct);
                    }

                    await tx.CommitAsync(ct);
                }
                catch
                {
                    await tx.RollbackAsync(ct);
                    throw;
                }

                return Results.Ok(new { success = true, message = "Rejected successfully" });
            }

            if (string.IsNullOrWhiteSpace(pdfData))
                return Results.Json(new { success = false, message = "No PDF data received." }, statusCode: 400);

            byte[] pdfBytes;
            try
            {
                pdfBytes = Convert.FromBase64String(pdfData.Trim());
            }
            catch
            {
                return Results.Json(new { success = false, message = "Invalid PDF base64 data" }, statusCode: 400);
            }

            var fileName = invoiceId + ".pdf";
            var directoryPath = Path.Combine(env.WebRootPath, "Content", "images", "Salesquote");
            Directory.CreateDirectory(directoryPath);
            var filePath = Path.Combine(directoryPath, fileName);
            if (File.Exists(filePath))
                File.Delete(filePath);
            await File.WriteAllBytesAsync(filePath, pdfBytes, ct);

            var relativePdf = "/Content/images/Salesquote/" + fileName;

            await using (var tx = (SqlTransaction)await connection.BeginTransactionAsync(ct))
            {
                try
                {
                    await using (var command = new SqlCommand("Sp_Invoicepdf", connection, tx))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@Id", "");
                        command.Parameters.AddWithValue("@Salespurchaseid", billid);
                        command.Parameters.AddWithValue("@Uniqueid", "");
                        command.Parameters.AddWithValue("@Pdf", "");
                        command.Parameters.AddWithValue("@Status", "");
                        command.Parameters.AddWithValue("@Isdelete", "0");
                        command.Parameters.AddWithValue("@Type", "Salesquote");
                        command.Parameters.AddWithValue("@Query", 7);
                        await command.ExecuteNonQueryAsync(ct);
                    }

                    await using (var command = new SqlCommand("Sp_Invoicepdf", connection, tx))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@Id", "");
                        command.Parameters.AddWithValue("@Salespurchaseid", billid);
                        command.Parameters.AddWithValue("@Uniqueid", "");
                        command.Parameters.AddWithValue("@Pdf", relativePdf);
                        command.Parameters.AddWithValue("@Status", "Active");
                        command.Parameters.AddWithValue("@Isdelete", "0");
                        command.Parameters.AddWithValue("@Type", "Salesquote");
                        command.Parameters.AddWithValue("@Query", 1);
                        await command.ExecuteNonQueryAsync(ct);
                    }

                    await InsertSalesquoteLogAsync(connection, tx, customerid, billid, userId, comments, status, true, ct);
                    await ExecSalesquoteQ11Async(connection, tx, billid, invoiceId, status, ct);

                    if (allocateInventory)
                    {
                        var wh = await DispatchWarehouseHelper.GetDispatchWarehouseIdAsync(connection, tx, ct);
                        await ProcessInventoryForApprovedAsync(connection, tx, billid, wh, ct);
                    }

                    await using (var upd = new SqlCommand(
                                     "UPDATE Tbl_Salesquote SET Managerapprovestatus = @M WHERE Id = @Id", connection, tx))
                    {
                        upd.Parameters.AddWithValue("@M", "1");
                        upd.Parameters.AddWithValue("@Id", quoteId);
                        await upd.ExecuteNonQueryAsync(ct);
                    }

                    await tx.CommitAsync(ct);
                }
                catch
                {
                    await tx.RollbackAsync(ct);
                    throw;
                }
            }

            return Results.Ok(new { success = true, message = "Saved successfully" });
        }
        catch (Exception ex)
        {
            Console.WriteLine("SalesQuoteApprovalSaveHandler: " + ex);
            return Results.Json(new { success = false, message = "Error: " + ex.Message });
        }
    }
}

using System.Data;
using System.Globalization;
using Microsoft.Data.SqlClient;

namespace Api;

/// <summary>
/// Legacy: GET updatepackingstatus (Sp_Salesquote Q15) + convert approved quote to sales invoice (Sp_Salesbill Q1 chain).
/// Data loaded from Tbl_Salesquote / Tbl_Salesquotedetails / Tbl_Purchasecategorydetails / Tbl_Purchasevatdetails.
/// </summary>
public static class SalesQuoteConvertToSalesHandler
{
    private static string NowLegacy() => DateTime.Now.ToString("dd-MM-yyyy HH:mm:ss", CultureInfo.InvariantCulture);

    private static string Col(DataRow row, params string[] names)
    {
        foreach (var name in names)
        {
            if (row.Table.Columns.Contains(name))
                return row[name]?.ToString() ?? "";
        }
        return "";
    }

    public static async Task ExecUpdatePackingStatusAsync(SqlConnection con, SqlTransaction tx, string quoteId, CancellationToken ct)
    {
        await using var cmd1 = new SqlCommand("Sp_Salesquote", con, tx);
        cmd1.CommandType = CommandType.StoredProcedure;
        cmd1.Parameters.AddWithValue("@Id", quoteId);
        cmd1.Parameters.AddWithValue("@Isdelete", "");
        cmd1.Parameters.AddWithValue("@Userid", "");
        cmd1.Parameters.AddWithValue("@Customerid", "");
        cmd1.Parameters.AddWithValue("@Billdate", "");
        cmd1.Parameters.AddWithValue("@Duedate", "");
        cmd1.Parameters.AddWithValue("@Salesquoteno", "");
        cmd1.Parameters.AddWithValue("@Amountsare", "");
        cmd1.Parameters.AddWithValue("@Vatnumber", "");
        cmd1.Parameters.AddWithValue("@Billing_address", "");
        cmd1.Parameters.AddWithValue("@Sales_location", "");
        cmd1.Parameters.AddWithValue("@Sub_total", "");
        cmd1.Parameters.AddWithValue("@Vat", "");
        cmd1.Parameters.AddWithValue("@Vat_amount", "");
        cmd1.Parameters.AddWithValue("@Grand_total", "");
        cmd1.Parameters.AddWithValue("@Conversion_amount", DBNull.Value);
        cmd1.Parameters.AddWithValue("@Currency_rate", DBNull.Value);
        cmd1.Parameters.AddWithValue("@Currency", "");
        cmd1.Parameters.AddWithValue("@Terms", "");
        cmd1.Parameters.AddWithValue("@Status", "");
        cmd1.Parameters.AddWithValue("@Packinglist_status", "0");
        cmd1.Parameters.AddWithValue("@Query", 15);
        await cmd1.ExecuteNonQueryAsync(ct);
    }

    /// <summary>GET only — Sp_Salesquote Q15 (legacy updatepackingstatus).</summary>
    public static async Task<IResult> HandleUpdatePackingStatus(HttpContext http, SqlConnection connection)
    {
        var id = (http.Request.Query["id"].FirstOrDefault() ?? "").Trim();
        if (string.IsNullOrEmpty(id))
            return Results.BadRequest(new { success = false, message = "id is required" });
        try
        {
            await connection.OpenAsync(http.RequestAborted);
            await using var tx = (SqlTransaction)await connection.BeginTransactionAsync(http.RequestAborted);
            try
            {
                await ExecUpdatePackingStatusAsync(connection, tx, id, http.RequestAborted);
                await tx.CommitAsync(http.RequestAborted);
            }
            catch
            {
                await tx.RollbackAsync(http.RequestAborted);
                throw;
            }

            return Results.Json(new { success = true });
        }
        catch (Exception ex)
        {
            Console.WriteLine("update-packing-status: " + ex);
            return Results.Json(new { success = false, message = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<DataRow?> LoadQuoteHeaderRowAsync(SqlConnection con, SqlTransaction tx, string quoteId, CancellationToken ct)
    {
        // Same placeholder set as GET /api/salesquote/details/{id} (Sp_Salesquote Q6).
        await using var cmd = new SqlCommand("Sp_Salesquote", con, tx)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Id", quoteId);
        cmd.Parameters.AddWithValue("@Query", 6);
        cmd.Parameters.AddWithValue("@Userid", "");
        cmd.Parameters.AddWithValue("@Customerid", "");
        cmd.Parameters.AddWithValue("@Billdate", "");
        cmd.Parameters.AddWithValue("@Duedate", "");
        cmd.Parameters.AddWithValue("@Salesquoteno", "");
        cmd.Parameters.AddWithValue("@Amountsare", "");
        cmd.Parameters.AddWithValue("@Vatnumber", "");
        cmd.Parameters.AddWithValue("@Billing_address", "");
        cmd.Parameters.AddWithValue("@Sales_location", "");
        cmd.Parameters.AddWithValue("@Sub_total", "");
        cmd.Parameters.AddWithValue("@Vat", "");
        cmd.Parameters.AddWithValue("@Vat_amount", "");
        cmd.Parameters.AddWithValue("@Grand_total", "");
        cmd.Parameters.AddWithValue("@Conversion_amount", DBNull.Value);
        cmd.Parameters.AddWithValue("@Currency_rate", DBNull.Value);
        cmd.Parameters.AddWithValue("@Currency", "");
        cmd.Parameters.AddWithValue("@Terms", "");

        var dt = new DataTable();
        await using (var reader = await cmd.ExecuteReaderAsync(ct))
        {
            dt.Load(reader);
        }

        return dt.Rows.Count > 0 ? dt.Rows[0] : null;
    }

    private static async Task<string?> GetCatalogIdForUserAsync(SqlConnection con, SqlTransaction tx, string userId, CancellationToken ct)
    {
        await using var cmd = new SqlCommand(
            "SELECT TOP 1 Catelogid FROM Tbl_Registration WHERE Userid = @U OR CAST(Id AS VARCHAR(50)) = @U",
            con, tx);
        cmd.Parameters.AddWithValue("@U", userId);
        var o = await cmd.ExecuteScalarAsync(ct);
        return o?.ToString();
    }

    private static async Task<bool> HasExistingSalesBillAsync(SqlConnection con, SqlTransaction tx, string quoteId, CancellationToken ct)
    {
        await using var cmd = new SqlCommand(
            """
            SELECT TOP 1 1 FROM Tbl_Salesbill
            WHERE Salesquoteid = @Q
              AND (Isdelete IS NULL OR Isdelete = '' OR Isdelete = '0' OR Isdelete = 0)
            """,
            con, tx);
        cmd.Parameters.AddWithValue("@Q", quoteId);
        var o = await cmd.ExecuteScalarAsync(ct);
        return o != null && o != DBNull.Value;
    }

    /// <summary>Used by quote→sales conversion and customer create bill save.</summary>
    public static async Task InsertInventoryForLineAsync(
        SqlConnection con,
        SqlTransaction tx,
        string warehouseId,
        string billId,
        string itemId,
        string qty,
        string lineType,
        CancellationToken ct)
    {
        var t = (lineType ?? "").Trim();
        var q = int.TryParse(qty?.Replace(",", ""), out var qn) ? qn : 0;
        if (q <= 0 || string.IsNullOrWhiteSpace(itemId)) return;

        if (string.Equals(t, "Set", StringComparison.OrdinalIgnoreCase))
        {
            await using (var command = new SqlCommand("Sp_setitems", con, tx))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@Userid", "");
                command.Parameters.AddWithValue("@Productid", "");
                command.Parameters.AddWithValue("@Id", "");
                command.Parameters.AddWithValue("@Productsetid", itemId);
                command.Parameters.AddWithValue("@Productvariantsid", "");
                command.Parameters.AddWithValue("@Itemname", "");
                command.Parameters.AddWithValue("@Qty", "");
                command.Parameters.AddWithValue("@Isdelete", "");
                command.Parameters.AddWithValue("@Status", "");
                command.Parameters.AddWithValue("@Workstatus", "");
                command.Parameters.AddWithValue("@Query", 8);
                var dt2 = new DataTable();
                await using (var r = await command.ExecuteReaderAsync(ct))
                {
                    dt2.Load(r);
                }

                for (var i = 0; i < dt2.Rows.Count; i++)
                {
                    var variantId = dt2.Rows[i][0]?.ToString() ?? "";
                    var pieceQty = int.TryParse(dt2.Rows[i][1]?.ToString(), out var pq) ? pq : 0;
                    var tqty = pieceQty * q;
                    var pid = "";
                    await using (var pv = new SqlCommand("Sp_Productvariants", con, tx))
                    {
                        pv.CommandType = CommandType.StoredProcedure;
                        pv.Parameters.AddWithValue("@Id", variantId);
                        pv.Parameters.AddWithValue("@Query", 25);
                        var s = await pv.ExecuteScalarAsync(ct);
                        pid = s?.ToString() ?? "";
                    }

                    await using var inv = new SqlCommand("Sp_Inventory", con, tx);
                    inv.CommandType = CommandType.StoredProcedure;
                    inv.Parameters.AddWithValue("@Id", "");
                    inv.Parameters.AddWithValue("@Productid", pid);
                    inv.Parameters.AddWithValue("@Inventory_type", "2");
                    inv.Parameters.AddWithValue("@Inventory_date", NowLegacy());
                    inv.Parameters.AddWithValue("@Productvariantsid", variantId);
                    inv.Parameters.AddWithValue("@Total_qty", tqty);
                    inv.Parameters.AddWithValue("@Billid", billId);
                    inv.Parameters.AddWithValue("@Warehouse_status", "1");
                    inv.Parameters.AddWithValue("@Isdelete", "0");
                    inv.Parameters.AddWithValue("@Status", "Transit");
                    inv.Parameters.AddWithValue("@Warehouseid", warehouseId);
                    inv.Parameters.AddWithValue("@Query", 1);
                    await inv.ExecuteNonQueryAsync(ct);
                }
            }

            return;
        }

        if (string.Equals(t, "Combo", StringComparison.OrdinalIgnoreCase))
        {
            await using (var command = new SqlCommand("Sp_Comboitems", con, tx))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@Userid", "");
                command.Parameters.AddWithValue("@Id", "");
                command.Parameters.AddWithValue("@Productcomboid", itemId);
                command.Parameters.AddWithValue("@Productvariantsid", "");
                command.Parameters.AddWithValue("@Qty", "");
                command.Parameters.AddWithValue("@Isdelete", "");
                command.Parameters.AddWithValue("@Status", "");
                command.Parameters.AddWithValue("@Workstatus", "");
                command.Parameters.AddWithValue("@Query", 2);
                var dt2 = new DataTable();
                await using (var r = await command.ExecuteReaderAsync(ct))
                {
                    dt2.Load(r);
                }

                for (var i = 0; i < dt2.Rows.Count; i++)
                {
                    var variantId = dt2.Rows[i][0]?.ToString() ?? "";
                    var pieceQty = int.TryParse(dt2.Rows[i][1]?.ToString(), out var pq) ? pq : 0;
                    var tqty = pieceQty * q;
                    var pid = "";
                    await using (var pv = new SqlCommand("Sp_Productvariants", con, tx))
                    {
                        pv.CommandType = CommandType.StoredProcedure;
                        pv.Parameters.AddWithValue("@Id", variantId);
                        pv.Parameters.AddWithValue("@Query", 25);
                        var s = await pv.ExecuteScalarAsync(ct);
                        pid = s?.ToString() ?? "";
                    }

                    await using var inv = new SqlCommand("Sp_Inventory", con, tx);
                    inv.CommandType = CommandType.StoredProcedure;
                    inv.Parameters.AddWithValue("@Id", "");
                    inv.Parameters.AddWithValue("@Productid", pid);
                    inv.Parameters.AddWithValue("@Inventory_type", "2");
                    inv.Parameters.AddWithValue("@Inventory_date", NowLegacy());
                    inv.Parameters.AddWithValue("@Productvariantsid", variantId);
                    inv.Parameters.AddWithValue("@Total_qty", tqty);
                    inv.Parameters.AddWithValue("@Billid", billId);
                    inv.Parameters.AddWithValue("@Warehouse_status", "1");
                    inv.Parameters.AddWithValue("@Isdelete", "0");
                    inv.Parameters.AddWithValue("@Status", "Transit");
                    inv.Parameters.AddWithValue("@Warehouseid", warehouseId);
                    inv.Parameters.AddWithValue("@Query", 1);
                    await inv.ExecuteNonQueryAsync(ct);
                }
            }

            return;
        }

        var productId = "";
        await using (var pv = new SqlCommand("Sp_Productvariants", con, tx))
        {
            pv.CommandType = CommandType.StoredProcedure;
            pv.Parameters.AddWithValue("@Id", itemId);
            pv.Parameters.AddWithValue("@Query", 25);
            var s = await pv.ExecuteScalarAsync(ct);
            productId = s?.ToString() ?? "";
        }

        await using (var command2 = new SqlCommand("Sp_Inventory", con, tx))
        {
            command2.CommandType = CommandType.StoredProcedure;
            command2.Parameters.AddWithValue("@Id", "");
            command2.Parameters.AddWithValue("@Productid", productId);
            command2.Parameters.AddWithValue("@Inventory_type", "2");
            command2.Parameters.AddWithValue("@Inventory_date", NowLegacy());
            command2.Parameters.AddWithValue("@Productvariantsid", itemId);
            command2.Parameters.AddWithValue("@Total_qty", q);
            command2.Parameters.AddWithValue("@Billid", billId);
            command2.Parameters.AddWithValue("@Warehouse_status", "1");
            command2.Parameters.AddWithValue("@Isdelete", "0");
            command2.Parameters.AddWithValue("@Status", "Transit");
            command2.Parameters.AddWithValue("@Warehouseid", warehouseId);
            command2.Parameters.AddWithValue("@Query", 1);
            await command2.ExecuteNonQueryAsync(ct);
        }
    }

    public static async Task<IResult> HandleConvert(HttpContext http, SqlConnection connection)
    {
        Dictionary<string, object?>? body;
        try
        {
            body = await http.Request.ReadFromJsonAsync<Dictionary<string, object?>>();
        }
        catch
        {
            return Results.BadRequest(new { success = false, message = "Invalid JSON body" });
        }

        body ??= new Dictionary<string, object?>();
        var quoteIdRaw = body.TryGetValue("quoteId", out var qo) ? qo?.ToString() : body.TryGetValue("id", out var io) ? io?.ToString() : null;
        var userId = (body.TryGetValue("userid", out var uo) ? uo?.ToString() : null) ?? "";

        var quoteId = (quoteIdRaw ?? "").Trim();
        userId = userId.Trim();
        if (string.IsNullOrEmpty(quoteId) || !int.TryParse(quoteId, out var qid) || qid <= 0)
            return Results.BadRequest(new { success = false, message = "quoteId is required" });
        if (string.IsNullOrEmpty(userId))
            return Results.BadRequest(new { success = false, message = "userid is required" });

        try
        {
            await connection.OpenAsync(http.RequestAborted);
            await using var tx = (SqlTransaction)await connection.BeginTransactionAsync(http.RequestAborted);
            try
            {
                var hdr = await LoadQuoteHeaderRowAsync(connection, tx, quoteId, http.RequestAborted);
                if (hdr == null)
                {
                    await tx.RollbackAsync(http.RequestAborted);
                    return Results.Json(new { success = false, message = "Quote not found" }, statusCode: 404);
                }

                var st = Col(hdr, "Status").Trim();
                if (!string.Equals(st, "Approved", StringComparison.OrdinalIgnoreCase))
                {
                    await tx.RollbackAsync(http.RequestAborted);
                    return Results.Json(new { success = false, message = "Only Approved quotes can be converted to sales." }, statusCode: 400);
                }

                if (await HasExistingSalesBillAsync(connection, tx, quoteId, http.RequestAborted))
                {
                    await tx.RollbackAsync(http.RequestAborted);
                    return Results.Json(new { success = false, message = "Sales invoice already exists for this quote." }, statusCode: 409);
                }

                await ExecUpdatePackingStatusAsync(connection, tx, quoteId, http.RequestAborted);

                var customerid = Col(hdr, "Customerid");
                var billdate = Col(hdr, "Billdate");
                var duedate = Col(hdr, "Duedate");
                var amountsare = Col(hdr, "Amountsare");
                var vatnumber = Col(hdr, "Vatnumber");
                var billing = Col(hdr, "Billing_address");
                var salesLoc = Col(hdr, "Sales_location");
                var subTotal = Col(hdr, "Sub_total");
                var vatPct = Col(hdr, "Vat");
                var vatAmt = Col(hdr, "Vat_amount", "Vat_Amount");
                var grand = Col(hdr, "Grand_total");
                var currencyRate = Col(hdr, "Currency_rate");
                var currencyId = Col(hdr, "Currency");
                var terms = Col(hdr, "Terms");
                var contact = Col(hdr, "Contact");
                var phoneno = Col(hdr, "Phoneno");
                var ship = Col(hdr, "Shipping_address");
                var remarks = Col(hdr, "Remarks");
                var salesperson = Col(hdr, "Salespersonname", "Salesperson");
                var discType = Col(hdr, "Discounttype");
                var discVal = Col(hdr, "Discountvalue");
                var discAmt = Col(hdr, "Discountamount");
                var wh = Col(hdr, "Warehouseid1", "Warehouseid");
                if (string.IsNullOrWhiteSpace(wh))
                    wh = await DispatchWarehouseHelper.GetDispatchWarehouseIdAsync(connection, tx, http.RequestAborted);

                var catelogId = await GetCatalogIdForUserAsync(connection, tx, userId, http.RequestAborted) ?? "";

                decimal.TryParse(grand.Replace(",", ""), NumberStyles.Any, CultureInfo.InvariantCulture, out var gtDec);
                decimal.TryParse(currencyRate.Replace(",", ""), NumberStyles.Any, CultureInfo.InvariantCulture, out var crDec);
                if (crDec == 0) crDec = 1;
                var convAmt = gtDec * crDec;

                string insertedId = "";
                await using (var cmd2 = new SqlCommand("Sp_Salesbill", connection, tx))
                {
                    cmd2.CommandType = CommandType.StoredProcedure;
                    cmd2.Parameters.AddWithValue("@Id", "");
                    cmd2.Parameters.AddWithValue("@Userid", userId);
                    cmd2.Parameters.AddWithValue("@Customerid", string.IsNullOrEmpty(customerid) ? DBNull.Value : customerid);
                    cmd2.Parameters.AddWithValue("@Billdate", string.IsNullOrEmpty(billdate) ? DBNull.Value : billdate);
                    cmd2.Parameters.AddWithValue("@Duedate", string.IsNullOrEmpty(duedate) ? DBNull.Value : duedate);
                    cmd2.Parameters.AddWithValue("@Billno", "Draft");
                    cmd2.Parameters.AddWithValue("@Amountsare", amountsare);
                    cmd2.Parameters.AddWithValue("@Vatnumber", string.IsNullOrWhiteSpace(vatnumber) ? DBNull.Value : vatnumber);
                    cmd2.Parameters.AddWithValue("@Billing_address", string.IsNullOrWhiteSpace(billing) ? DBNull.Value : billing);
                    cmd2.Parameters.AddWithValue("@Sales_location", string.IsNullOrWhiteSpace(salesLoc) ? DBNull.Value : salesLoc);
                    cmd2.Parameters.AddWithValue("@Sub_total", subTotal);
                    cmd2.Parameters.AddWithValue("@Vat", string.IsNullOrEmpty(vatPct) ? "" : vatPct);
                    cmd2.Parameters.AddWithValue("@Vat_amount", vatAmt);
                    cmd2.Parameters.AddWithValue("@Grand_total", grand);
                    cmd2.Parameters.AddWithValue("@Conversion_amount", convAmt);
                    cmd2.Parameters.AddWithValue("@Currency_rate", crDec);
                    cmd2.Parameters.AddWithValue("@Currency", string.IsNullOrWhiteSpace(currencyId) ? DBNull.Value : currencyId);
                    cmd2.Parameters.AddWithValue("@Managerapprovestatus", "0");
                    cmd2.Parameters.AddWithValue("@Status", "Draft");
                    cmd2.Parameters.AddWithValue("@Isdelete", "0");
                    cmd2.Parameters.AddWithValue("@Type", "Invoice");
                    cmd2.Parameters.AddWithValue("@Terms", string.IsNullOrWhiteSpace(terms) ? DBNull.Value : terms);
                    cmd2.Parameters.AddWithValue("@Contact", string.IsNullOrWhiteSpace(contact) ? DBNull.Value : contact);
                    cmd2.Parameters.AddWithValue("@Phoneno", string.IsNullOrWhiteSpace(phoneno) ? DBNull.Value : phoneno);
                    cmd2.Parameters.AddWithValue("@Shipping_address", string.IsNullOrWhiteSpace(ship) ? DBNull.Value : ship);
                    cmd2.Parameters.AddWithValue("@Remarks", string.IsNullOrWhiteSpace(remarks) ? DBNull.Value : remarks);
                    cmd2.Parameters.AddWithValue("@Salespersonname", string.IsNullOrWhiteSpace(salesperson) ? DBNull.Value : salesperson);
                    cmd2.Parameters.AddWithValue("@Discounttype", string.IsNullOrEmpty(discType) || discType == "0" ? "0" : discType);
                    cmd2.Parameters.AddWithValue("@Discountvalue", string.IsNullOrEmpty(discVal) ? "" : discVal);
                    cmd2.Parameters.AddWithValue("@Discountamount", string.IsNullOrEmpty(discAmt) ? "" : discAmt);
                    cmd2.Parameters.AddWithValue("@Newinvoiceno", "");
                    cmd2.Parameters.AddWithValue("@Newinvoicenocount", "");
                    cmd2.Parameters.AddWithValue("@Salesquoteid", quoteId);
                    cmd2.Parameters.AddWithValue("@Deliverstatus", "Awaiting Delivery");
                    cmd2.Parameters.AddWithValue("@Query", 1);

                    var dt1 = new DataTable();
                    await using (var reader = await cmd2.ExecuteReaderAsync(http.RequestAborted))
                    {
                        dt1.Load(reader);
                    }

                    if (dt1.Rows.Count > 0)
                        insertedId = dt1.Rows[0][0]?.ToString() ?? "";
                }

                if (string.IsNullOrEmpty(insertedId))
                    throw new InvalidOperationException("Sp_Salesbill did not return new bill id.");

                var lines = new DataTable();
                await using (var lineCmd = new SqlCommand(
                                 """
                                 SELECT sd.*,
                                        pv.Itemname AS VariantItemName,
                                        pv.Modelno AS VariantModelNo,
                                        pv.Short_description AS VariantDescription
                                 FROM Tbl_Salesquotedetails sd
                                 LEFT JOIN Tbl_Productvariants pv ON sd.Itemid = pv.Id
                                 WHERE sd.Salesquoteid = @Salesquoteid
                                   AND (sd.Isdelete IS NULL OR sd.Isdelete = '' OR sd.Isdelete = '0' OR sd.Isdelete = 0)
                                 """,
                                 connection, tx))
                {
                    lineCmd.Parameters.AddWithValue("@Salesquoteid", quoteId);
                    await using var lr = await lineCmd.ExecuteReaderAsync(http.RequestAborted);
                    lines.Load(lr);
                }

                foreach (DataRow row in lines.Rows)
                {
                    var itemId = Col(row, "Itemid");
                    if (string.IsNullOrWhiteSpace(itemId)) continue;

                    var lineType = Col(row, "Type");
                    if (string.IsNullOrWhiteSpace(lineType))
                        lineType = "Item";

                    await using (var cmd21 = new SqlCommand("Sp_Salesbilldetails", connection, tx))
                    {
                        cmd21.CommandType = CommandType.StoredProcedure;
                        cmd21.Parameters.AddWithValue("@Id", "");
                        cmd21.Parameters.AddWithValue("@Userid", userId);
                        cmd21.Parameters.AddWithValue("@Billid", insertedId);
                        cmd21.Parameters.AddWithValue("@Itemid", itemId);
                        cmd21.Parameters.AddWithValue("@Qty", Col(row, "Qty"));
                        cmd21.Parameters.AddWithValue("@Amount", Col(row, "Amount"));
                        cmd21.Parameters.AddWithValue("@Vat", Col(row, "Vat"));
                        cmd21.Parameters.AddWithValue("@Vat_id", Col(row, "Vat_id", "Vatid"));
                        cmd21.Parameters.AddWithValue("@Total", Col(row, "Total"));
                        cmd21.Parameters.AddWithValue("@Status", "Active");
                        cmd21.Parameters.AddWithValue("@Isdelete", "0");
                        cmd21.Parameters.AddWithValue("@Type", lineType);
                        cmd21.Parameters.AddWithValue("@Query", 1);
                        await cmd21.ExecuteNonQueryAsync(http.RequestAborted);
                    }

                    await InsertInventoryForLineAsync(
                        connection, tx, wh, insertedId, itemId, Col(row, "Qty"), lineType, http.RequestAborted);
                }

                await using (var catCmd = new SqlCommand(
                                 """
                                 SELECT Categoryid, Description, Amount, Vatvalue, Vatid, Total
                                 FROM Tbl_Purchasecategorydetails
                                 WHERE Billid = @Billid AND Type = 'Salesquote'
                                   AND (Isdelete IS NULL OR Isdelete = 0 OR Isdelete = '0')
                                 """,
                                 connection, tx))
                {
                    catCmd.Parameters.AddWithValue("@Billid", quoteId);
                    await using var cr = await catCmd.ExecuteReaderAsync(http.RequestAborted);
                    var cdt = new DataTable();
                    cdt.Load(cr);
                    foreach (DataRow row1 in cdt.Rows)
                    {
                        var catId = Col(row1, "Categoryid");
                        if (string.IsNullOrWhiteSpace(catId)) continue;

                        await using var cmd231 = new SqlCommand("Sp_Purchasecategorydetails", connection, tx);
                        cmd231.CommandType = CommandType.StoredProcedure;
                        cmd231.Parameters.AddWithValue("@Billid", insertedId);
                        cmd231.Parameters.AddWithValue("@Customerid", userId);
                        cmd231.Parameters.AddWithValue("@Type", "Invoice");
                        cmd231.Parameters.AddWithValue("@Categoryid", catId);
                        cmd231.Parameters.AddWithValue("@Description", Col(row1, "Description"));
                        cmd231.Parameters.AddWithValue("@Amount", Col(row1, "Amount"));
                        cmd231.Parameters.AddWithValue("@Vatvalue", Col(row1, "Vatvalue"));
                        cmd231.Parameters.AddWithValue("@Vatid", Col(row1, "Vatid"));
                        cmd231.Parameters.AddWithValue("@Total", Col(row1, "Total"));
                        cmd231.Parameters.AddWithValue("@Customer", "");
                        cmd231.Parameters.AddWithValue("@Isdelete", 0);
                        cmd231.Parameters.AddWithValue("@Id", "");
                        cmd231.Parameters.AddWithValue("@Query", 1);
                        await cmd231.ExecuteNonQueryAsync(http.RequestAborted);
                    }
                }

                await using var insTx = new SqlCommand("Sp_InsertTransaction", connection, tx)
                {
                    CommandType = CommandType.StoredProcedure
                };
                insTx.Parameters.AddWithValue("@SalesId", insertedId);
                insTx.Parameters.AddWithValue("@Catelogid", catelogId);
                await insTx.ExecuteNonQueryAsync(http.RequestAborted);

                await using (var vatCmd = new SqlCommand(
                                 """
                                 SELECT Vatid, Price, Vatamount
                                 FROM Tbl_Purchasevatdetails
                                 WHERE Billid = @Billid AND Type = 'Salesquote'
                                   AND (Isdelete IS NULL OR Isdelete = 0 OR Isdelete = '0')
                                 """,
                                 connection, tx))
                {
                    vatCmd.Parameters.AddWithValue("@Billid", quoteId);
                    await using var vr = await vatCmd.ExecuteReaderAsync(http.RequestAborted);
                    var vdt = new DataTable();
                    vdt.Load(vr);
                    foreach (DataRow row in vdt.Rows)
                    {
                        var vatIdForLine = Col(row, "Vatid", "vatid");
                        if (string.IsNullOrWhiteSpace(vatIdForLine)) continue;

                        await using var cmd231 = new SqlCommand("Sp_Purchasevatdetails", connection, tx);
                        cmd231.CommandType = CommandType.StoredProcedure;
                        cmd231.Parameters.AddWithValue("@Billid", insertedId);
                        cmd231.Parameters.AddWithValue("@Customerid", userId);
                        cmd231.Parameters.AddWithValue("@Type", "Invoice");
                        cmd231.Parameters.AddWithValue("@Vatid", vatIdForLine);
                        cmd231.Parameters.AddWithValue("@Price", Col(row, "Price"));
                        cmd231.Parameters.AddWithValue("@Vatamount", Col(row, "Vatamount"));
                        cmd231.Parameters.AddWithValue("@Isdelete", "0");
                        cmd231.Parameters.AddWithValue("@Id", "");
                        cmd231.Parameters.AddWithValue("@Query", 1);
                        await cmd231.ExecuteNonQueryAsync(http.RequestAborted);
                    }
                }

                await using (var pdf = new SqlCommand("Sp_Invoicepdf", connection, tx))
                {
                    pdf.CommandType = CommandType.StoredProcedure;
                    pdf.Parameters.AddWithValue("@Id", "");
                    pdf.Parameters.AddWithValue("@Salespurchaseid", insertedId);
                    pdf.Parameters.AddWithValue("@Uniqueid", "");
                    pdf.Parameters.AddWithValue("@Pdf", "null");
                    pdf.Parameters.AddWithValue("@Status", "Active");
                    pdf.Parameters.AddWithValue("@Isdelete", "0");
                    pdf.Parameters.AddWithValue("@Type", "Invoice");
                    pdf.Parameters.AddWithValue("@Query", 1);
                    await pdf.ExecuteNonQueryAsync(http.RequestAborted);
                }

                await using (var csl = new SqlCommand("Sp_Customersaleslog", connection, tx))
                {
                    csl.CommandType = CommandType.StoredProcedure;
                    csl.Parameters.AddWithValue("@Id", "");
                    csl.Parameters.AddWithValue("@Customerid", customerid);
                    csl.Parameters.AddWithValue("@Salesid", insertedId);
                    csl.Parameters.AddWithValue("@Approveuserid", "");
                    csl.Parameters.AddWithValue("@Editreason", "");
                    csl.Parameters.AddWithValue("@Comments", "Draft - Added");
                    csl.Parameters.AddWithValue("@Isdelete", 0);
                    csl.Parameters.AddWithValue("@Status", "Active");
                    csl.Parameters.AddWithValue("@Changeddate", NowLegacy());
                    csl.Parameters.AddWithValue("@Query", 1);
                    await csl.ExecuteNonQueryAsync(http.RequestAborted);
                }

                var message = "Saved successfully";
                await using (var diff = new SqlCommand("Sp_Transactiondifferencecheckwithinsales", connection, tx))
                {
                    diff.CommandType = CommandType.StoredProcedure;
                    diff.Parameters.AddWithValue("@Purchase_salesid", insertedId);
                    diff.Parameters.AddWithValue("@Entry_type", "Invoice");
                    var dtDiff = new DataTable();
                    await using (var dr = await diff.ExecuteReaderAsync(http.RequestAborted))
                    {
                        dtDiff.Load(dr);
                    }

                    if (dtDiff.Rows.Count > 0)
                    {
                        var diffObj = dtDiff.Rows[0]["Difference"];
                        var difference = Convert.IsDBNull(diffObj) ? 0 : Convert.ToInt32(diffObj, CultureInfo.InvariantCulture);
                        if (difference != 0)
                        {
                            await tx.RollbackAsync(http.RequestAborted);
                            return Results.Json(new { success = false, message = "There is a difference, transaction not committed" }, statusCode: 400);
                        }
                    }
                }

                await using (var updQ = new SqlCommand(
                                     "UPDATE Tbl_Salesquote SET Status = N'Converted' WHERE Id = @Id AND (Isdelete IS NULL OR Isdelete = '' OR Isdelete = '0' OR Isdelete = 0)",
                                     connection, tx))
                {
                    updQ.Parameters.AddWithValue("@Id", qid);
                    await updQ.ExecuteNonQueryAsync(http.RequestAborted);
                }

                await tx.CommitAsync(http.RequestAborted);
                return Results.Json(new { success = true, message, salesBillId = insertedId });
            }
            catch
            {
                await tx.RollbackAsync(http.RequestAborted);
                throw;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("convert-to-sales: " + ex);
            return Results.Json(new { success = false, message = ex.Message }, statusCode: 500);
        }
    }
}

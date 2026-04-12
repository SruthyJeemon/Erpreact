using System.Data;
using System.Globalization;
using System.Text.Json;
using Microsoft.Data.SqlClient;

namespace Api;

/// <summary>Legacy POST /Sales/Editsalesbilldetails — in-place update of draft sales invoice (same Id): Sp_Salesbill Q21/Q22 or Q5, lines Q3/Q1, inventory reset, category/VAT/transaction rebuild.</summary>
public static class SalesBillEditFromCustomerHandler
{
    private static string NowLegacy() => DateTime.Now.ToString("dd-MM-yyyy HH:mm:ss", CultureInfo.InvariantCulture);

    private static string GetProp(JsonElement obj, params string[] names)
    {
        foreach (var name in names)
        {
            if (obj.ValueKind != JsonValueKind.Object || !obj.TryGetProperty(name, out var p))
                continue;
            return p.ValueKind switch
            {
                JsonValueKind.String => p.GetString() ?? "",
                JsonValueKind.Number => p.GetRawText(),
                JsonValueKind.True => "true",
                JsonValueKind.False => "false",
                JsonValueKind.Null => "",
                _ => p.ToString()
            };
        }
        return "";
    }

    private static JsonElement? GetObj(JsonElement root, params string[] names)
    {
        foreach (var name in names)
        {
            if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty(name, out var el) &&
                el.ValueKind == JsonValueKind.Object)
                return el;
        }
        return null;
    }

    private static IEnumerable<JsonElement> GetArray(JsonElement root, params string[] names)
    {
        foreach (var name in names)
        {
            if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty(name, out var el) &&
                el.ValueKind == JsonValueKind.Array)
                return el.EnumerateArray();
        }
        return Array.Empty<JsonElement>();
    }

    private static string MapAmountsAre(string raw)
    {
        var v = (raw ?? "").Trim().ToLowerInvariant();
        if (v == "inclusive" || v.Contains("inclusive")) return "Inclusive";
        if (v == "outofscope" || v.Contains("out of scope")) return "Outofscope";
        if (v == "exclusive" || v.Contains("exclusive") || v == "exclusing") return "Exclusive";
        return string.IsNullOrEmpty(v) ? "Exclusive" : raw.Trim();
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

    private static void AddSpSalesbillParamsForQuery(SqlCommand cmd, int billId, int query)
    {
        cmd.Parameters.AddWithValue("@Id", billId);
        cmd.Parameters.AddWithValue("@Userid", "");
        cmd.Parameters.AddWithValue("@Customerid", "");
        cmd.Parameters.AddWithValue("@Billdate", "");
        cmd.Parameters.AddWithValue("@Duedate", "");
        cmd.Parameters.AddWithValue("@Billno", "");
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
        cmd.Parameters.AddWithValue("@Managerapprovestatus", DBNull.Value);
        cmd.Parameters.AddWithValue("@Status", "");
        cmd.Parameters.AddWithValue("@Isdelete", "");
        cmd.Parameters.AddWithValue("@Type", "");
        cmd.Parameters.AddWithValue("@Terms", "");
        cmd.Parameters.AddWithValue("@Catelogid", "");
        cmd.Parameters.AddWithValue("@Contact", "");
        cmd.Parameters.AddWithValue("@Phoneno", "");
        cmd.Parameters.AddWithValue("@Shipping_address", "");
        cmd.Parameters.AddWithValue("@Remarks", "");
        cmd.Parameters.AddWithValue("@Salespersonname", "");
        cmd.Parameters.AddWithValue("@Discounttype", "");
        cmd.Parameters.AddWithValue("@Discountvalue", "");
        cmd.Parameters.AddWithValue("@Discountamount", "");
        cmd.Parameters.AddWithValue("@fromdate", "");
        cmd.Parameters.AddWithValue("@todate", "");
        cmd.Parameters.AddWithValue("@Newinvoicenocount", 0);
        cmd.Parameters.AddWithValue("@Newinvoiceno", "");
        cmd.Parameters.AddWithValue("@Salesquoteid", "");
        cmd.Parameters.AddWithValue("@Deliverstatus", "");
        cmd.Parameters.AddWithValue("@Query", query);
    }

    public static async Task<IResult> Handle(HttpContext http, SqlConnection connection)
    {
        JsonDocument doc;
        try
        {
            await using var ms = new MemoryStream();
            await http.Request.Body.CopyToAsync(ms, http.RequestAborted);
            ms.Position = 0;
            doc = await JsonDocument.ParseAsync(ms, cancellationToken: http.RequestAborted);
        }
        catch
        {
            return Results.BadRequest(new { message = "Invalid JSON" });
        }

        using (doc)
        {
            var root = doc.RootElement;
            var userId = GetProp(root, "userid", "Userid").Trim();
            if (string.IsNullOrEmpty(userId))
                return Results.BadRequest(new { message = "userid is required" });

            var fdEl = GetObj(root, "formData", "formdata");
            if (fdEl == null)
                return Results.BadRequest(new { message = "formData is required" });

            var fd = fdEl.Value;
            var billIdStr = GetProp(fd, "Id", "id").Trim();
            if (string.IsNullOrEmpty(billIdStr) || !int.TryParse(billIdStr, NumberStyles.Integer, CultureInfo.InvariantCulture, out var billId) || billId <= 0)
                return Results.BadRequest(new { message = "formData.Id (sales bill id) is required for edit." });

            var customerid = GetProp(fd, "customerid", "Customerid").Trim();
            if (string.IsNullOrEmpty(customerid))
                return Results.BadRequest(new { message = "customerid is required" });

            var billdate = GetProp(fd, "Billdate", "billdate");
            var duedate = GetProp(fd, "Duedate", "duedate");
            var amountsare = MapAmountsAre(GetProp(fd, "Amountsare", "amountsare"));
            var vatnumber = GetProp(fd, "Vatnumber", "vatnumber");
            var billing = GetProp(fd, "Billing_address", "billing_address");
            var salesLoc = GetProp(fd, "Sales_location", "sales_location");
            var subTotal = GetProp(fd, "Sub_total", "sub_total");
            var vatPct = GetProp(fd, "Vat", "vat");
            var vatAmt = GetProp(fd, "Vat_amount", "vat_amount", "Vat_Amount");
            var grand = GetProp(fd, "Grand_total", "grand_total");
            var currencyRate = GetProp(fd, "Currencyvalue", "currencyvalue", "Currency_rate");
            var currencyId = GetProp(fd, "Currencyid", "currencyid", "Currency");
            var terms = GetProp(fd, "terms", "Terms");
            var contact = GetProp(fd, "Contact", "contact");
            var phoneno = GetProp(fd, "Phoneno", "phoneno", "Phone");
            var ship = GetProp(fd, "Shipping_address", "shipping_address");
            var remarks = GetProp(fd, "Remarks", "remarks");
            var salesperson = GetProp(fd, "Salespersonname", "salespersonname");
            var discType = GetProp(fd, "Discounttype", "discounttype");
            var discVal = GetProp(fd, "Discountvalue", "discountvalue");
            var discAmt = GetProp(fd, "Discountamount", "discountamount");
            var wh = GetProp(fd, "Warehouseid", "warehouseid");
            var salesquoteid = GetProp(fd, "Salesquoteid", "salesquoteid", "sqid", "Sqid");

            var deductionAmt = GetProp(fd, "Deduction_amt", "deduction_amt");
            var taxid = GetProp(fd, "Taxid", "taxid").Trim();
            var taxAmt = GetProp(fd, "Tax_amt", "tax_amt");
            var totalDeduction = GetProp(fd, "Total_deduction", "total_deduction");
            var taxType = GetProp(fd, "Tax_type", "tax_type");

            decimal.TryParse(grand.Replace(",", ""), NumberStyles.Any, CultureInfo.InvariantCulture, out var gtDec);
            decimal.TryParse(currencyRate.Replace(",", ""), NumberStyles.Any, CultureInfo.InvariantCulture, out var crDec);
            if (crDec == 0) crDec = 1;
            var convAmt = gtDec * crDec;

            try
            {
                await connection.OpenAsync(http.RequestAborted);
                await using var tx = (SqlTransaction)await connection.BeginTransactionAsync(http.RequestAborted);
                try
                {
                    var catelogId = await GetCatalogIdForUserAsync(connection, tx, userId, http.RequestAborted) ?? "";

                    // Own draft only, same customer
                    await using (var vcmd = new SqlCommand(
                                     """
                                     SELECT TOP 1 CAST(Customerid AS NVARCHAR(50)) AS Cid,
                                            LOWER(LTRIM(RTRIM(ISNULL(Status, N'')))) AS St
                                     FROM Tbl_Salesbill
                                     WHERE Id = @Id
                                       AND (
                                             Isdelete IS NULL
                                             OR LTRIM(RTRIM(CAST(Isdelete AS NVARCHAR(50)))) IN (N'', N'0')
                                             OR (TRY_CAST(Isdelete AS INT) IS NOT NULL AND TRY_CAST(Isdelete AS INT) = 0)
                                           )
                                     """,
                                     connection, tx))
                    {
                        vcmd.Parameters.AddWithValue("@Id", billId);
                        await using var vr = await vcmd.ExecuteReaderAsync(http.RequestAborted);
                        if (!await vr.ReadAsync())
                        {
                            await tx.RollbackAsync(http.RequestAborted);
                            return Results.Json(new { message = "Sales bill not found or already removed.", success = false }, statusCode: 404);
                        }

                        var dbCust = vr["Cid"]?.ToString()?.Trim() ?? "";
                        var st = vr["St"]?.ToString()?.Trim() ?? "";
                        if (!string.Equals(st, "draft", StringComparison.OrdinalIgnoreCase))
                        {
                            await tx.RollbackAsync(http.RequestAborted);
                            return Results.Json(new { message = "Only draft invoices can be updated in place.", success = false }, statusCode: 400);
                        }

                        if (!string.Equals(dbCust, customerid.Trim(), StringComparison.OrdinalIgnoreCase))
                        {
                            await tx.RollbackAsync(http.RequestAborted);
                            return Results.Json(new { message = "Bill does not belong to this customer.", success = false }, statusCode: 403);
                        }
                    }

                    if (!string.IsNullOrEmpty(taxid) && taxid != "0")
                    {
                        await using var checkCmd = new SqlCommand(
                            "SELECT COUNT(*) FROM Tbl_Deductioncommission WHERE Salesid = @Salesid AND Isdelete = 0 AND Type = @Type",
                            connection, tx);
                        checkCmd.Parameters.AddWithValue("@Salesid", billIdStr);
                        checkCmd.Parameters.AddWithValue("@Type", "Sales");
                        var countObj = await checkCmd.ExecuteScalarAsync(http.RequestAborted);
                        var count = Convert.ToInt32(countObj ?? 0, CultureInfo.InvariantCulture);

                        decimal taxAmount = 0;
                        decimal.TryParse(deductionAmt.Replace(",", ""), NumberStyles.Any, CultureInfo.InvariantCulture, out var dedDec);
                        decimal.TryParse(taxAmt.Replace(",", ""), NumberStyles.Any, CultureInfo.InvariantCulture, out var taxPctDec);
                        if (string.Equals(taxType, "Exclusive", StringComparison.OrdinalIgnoreCase))
                            taxAmount = dedDec * taxPctDec / 100;
                        else if (string.Equals(taxType, "Inclusive", StringComparison.OrdinalIgnoreCase) && taxPctDec > 0)
                            taxAmount = dedDec * taxPctDec / (100 + taxPctDec);

                        await using var cmd231 = new SqlCommand("Sp_Deductioncommission", connection, tx);
                        cmd231.CommandType = CommandType.StoredProcedure;
                        cmd231.Parameters.AddWithValue("@Id", 0);
                        cmd231.Parameters.AddWithValue("@Salesid", billIdStr);
                        cmd231.Parameters.AddWithValue("@Deduction_amt", dedDec);
                        cmd231.Parameters.AddWithValue("@Taxid", taxid);
                        cmd231.Parameters.AddWithValue("@Tax_amt", taxAmt);
                        cmd231.Parameters.AddWithValue("@Total_taxamount", taxAmount);
                        cmd231.Parameters.AddWithValue("@Total_deduction",
                            string.IsNullOrWhiteSpace(totalDeduction) ? DBNull.Value : totalDeduction.Replace(",", ""));
                        cmd231.Parameters.AddWithValue("@Isdelete", "0");
                        cmd231.Parameters.AddWithValue("@Type", "Sales");
                        cmd231.Parameters.AddWithValue("@Tax_type", string.IsNullOrWhiteSpace(taxType) ? DBNull.Value : taxType);
                        cmd231.Parameters.AddWithValue("@Query", count > 0 ? 3 : 1);
                        await cmd231.ExecuteNonQueryAsync(http.RequestAborted);
                    }

                    var storedBilldate = "";
                    await using (var cmd21 = new SqlCommand("Sp_Salesbill", connection, tx))
                    {
                        cmd21.CommandType = CommandType.StoredProcedure;
                        AddSpSalesbillParamsForQuery(cmd21, billId, 21);
                        var dt = new DataTable();
                        await using (var reader = await cmd21.ExecuteReaderAsync(http.RequestAborted))
                        {
                            dt.Load(reader);
                        }

                        if (dt.Rows.Count > 0 && dt.Columns.Contains("Billdate"))
                            storedBilldate = dt.Rows[0]["Billdate"]?.ToString() ?? "";
                    }

                    var formBd = (billdate ?? "").Trim();
                    var dbBd = (storedBilldate ?? "").Trim();
                    var useQuery22 = string.Equals(formBd, dbBd, StringComparison.Ordinal)
                                     || (formBd.Length >= 8 && dbBd.StartsWith(formBd, StringComparison.Ordinal))
                                     || (dbBd.Length >= 8 && formBd.StartsWith(dbBd, StringComparison.Ordinal));

                    await using (var hdr = new SqlCommand("Sp_Salesbill", connection, tx))
                    {
                        hdr.CommandType = CommandType.StoredProcedure;
                        hdr.Parameters.AddWithValue("@Id", billId);
                        hdr.Parameters.AddWithValue("@Userid", "");
                        hdr.Parameters.AddWithValue("@Customerid", customerid);
                        hdr.Parameters.AddWithValue("@Billdate", string.IsNullOrWhiteSpace(billdate) ? DBNull.Value : billdate);
                        hdr.Parameters.AddWithValue("@Duedate", string.IsNullOrWhiteSpace(duedate) ? DBNull.Value : duedate);
                        hdr.Parameters.AddWithValue("@Billno", "");
                        hdr.Parameters.AddWithValue("@Amountsare", amountsare);
                        hdr.Parameters.AddWithValue("@Vatnumber", string.IsNullOrWhiteSpace(vatnumber) ? DBNull.Value : vatnumber);
                        hdr.Parameters.AddWithValue("@Billing_address", string.IsNullOrWhiteSpace(billing) ? DBNull.Value : billing);
                        hdr.Parameters.AddWithValue("@Sales_location", string.IsNullOrWhiteSpace(salesLoc) ? DBNull.Value : salesLoc);
                        hdr.Parameters.AddWithValue("@Sub_total", subTotal);
                        hdr.Parameters.AddWithValue("@Vat", string.IsNullOrEmpty(vatPct) ? "" : vatPct);
                        hdr.Parameters.AddWithValue("@Vat_amount", vatAmt);
                        hdr.Parameters.AddWithValue("@Grand_total", grand);
                        hdr.Parameters.AddWithValue("@Conversion_amount", convAmt);
                        hdr.Parameters.AddWithValue("@Currency_rate", crDec);
                        hdr.Parameters.AddWithValue("@Currency", string.IsNullOrWhiteSpace(currencyId) ? DBNull.Value : currencyId);
                        hdr.Parameters.AddWithValue("@Terms", SalesBillPayloadSanitizer.TermsForSp(terms));
                        hdr.Parameters.AddWithValue("@Contact", string.IsNullOrWhiteSpace(contact) ? DBNull.Value : contact);
                        hdr.Parameters.AddWithValue("@Phoneno", string.IsNullOrWhiteSpace(phoneno) ? DBNull.Value : phoneno);
                        hdr.Parameters.AddWithValue("@Shipping_address", string.IsNullOrWhiteSpace(ship) ? DBNull.Value : ship);
                        hdr.Parameters.AddWithValue("@Remarks", string.IsNullOrWhiteSpace(remarks) ? DBNull.Value : remarks);
                        hdr.Parameters.AddWithValue("@Salespersonname", SalesBillPayloadSanitizer.SalespersonForSp(salesperson));
                        hdr.Parameters.AddWithValue("@Discounttype", string.IsNullOrEmpty(discType) || discType == "0" ? "0" : discType);
                        hdr.Parameters.AddWithValue("@Discountvalue", string.IsNullOrEmpty(discVal) ? "" : discVal);
                        hdr.Parameters.AddWithValue("@Discountamount", string.IsNullOrEmpty(discAmt) ? "" : discAmt);
                        hdr.Parameters.AddWithValue("@Newinvoiceno", "");
                        hdr.Parameters.AddWithValue("@Newinvoicenocount", "");
                        hdr.Parameters.AddWithValue("@Status", "Draft");
                        hdr.Parameters.AddWithValue("@Salesquoteid", string.IsNullOrWhiteSpace(salesquoteid) ? DBNull.Value : salesquoteid);
                        hdr.Parameters.AddWithValue("@Managerapprovestatus", DBNull.Value);
                        hdr.Parameters.AddWithValue("@Isdelete", "");
                        hdr.Parameters.AddWithValue("@Type", "");
                        hdr.Parameters.AddWithValue("@Catelogid", "");
                        hdr.Parameters.AddWithValue("@fromdate", "");
                        hdr.Parameters.AddWithValue("@todate", "");
                        hdr.Parameters.AddWithValue("@Deliverstatus", DBNull.Value);
                        hdr.Parameters.AddWithValue("@Query", useQuery22 ? 22 : 5);
                        await hdr.ExecuteNonQueryAsync(http.RequestAborted);
                    }

                    await using (var ser = new SqlCommand("Sp_Salesserialnoadd", connection, tx))
                    {
                        ser.CommandType = CommandType.StoredProcedure;
                        ser.Parameters.AddWithValue("@Id", 0);
                        ser.Parameters.AddWithValue("@Salesid", billIdStr);
                        ser.Parameters.AddWithValue("@Salesbillid", "");
                        ser.Parameters.AddWithValue("@Serialnoaddid", "");
                        ser.Parameters.AddWithValue("@Status", "");
                        ser.Parameters.AddWithValue("@Isdelete", "");
                        ser.Parameters.AddWithValue("@Query", 3);
                        ser.Parameters.AddWithValue("@Catelogid", DBNull.Value);
                        await ser.ExecuteNonQueryAsync(http.RequestAborted);
                    }

                    await using (var inv16 = new SqlCommand("Sp_Inventory", connection, tx))
                    {
                        inv16.CommandType = CommandType.StoredProcedure;
                        inv16.Parameters.AddWithValue("@Id", "");
                        inv16.Parameters.AddWithValue("@Productid", "");
                        inv16.Parameters.AddWithValue("@Inventory_type", "2");
                        inv16.Parameters.AddWithValue("@Inventory_date", NowLegacy());
                        inv16.Parameters.AddWithValue("@Productvariantsid", "");
                        inv16.Parameters.AddWithValue("@Total_qty", "");
                        inv16.Parameters.AddWithValue("@Billid", billIdStr);
                        inv16.Parameters.AddWithValue("@Warehouse_status", "");
                        inv16.Parameters.AddWithValue("@Isdelete", "");
                        inv16.Parameters.AddWithValue("@Status", "");
                        inv16.Parameters.AddWithValue("@Warehouseid", "");
                        inv16.Parameters.AddWithValue("@Query", 16);
                        await inv16.ExecuteNonQueryAsync(http.RequestAborted);
                    }

                    foreach (var row in GetArray(root, "tableData1", "tabledata1"))
                    {
                        if (row.ValueKind != JsonValueKind.Object) continue;
                        var itemId = GetProp(row, "Itemid", "itemid").Trim();
                        if (string.IsNullOrWhiteSpace(itemId) || itemId == " ") continue;

                        var itemName = GetProp(row, "Itemname", "itemname");
                        var type = "Item";
                        var m = System.Text.RegularExpressions.Regex.Match(itemName, @"\(([^)]+)\)\s*$");
                        if (m.Success)
                            type = m.Groups[1].Value.Trim();

                        var lineIdStr = GetProp(row, "Id", "id").Trim();
                        var hasLineId = int.TryParse(lineIdStr, NumberStyles.Integer, CultureInfo.InvariantCulture, out var lineId) && lineId > 0;

                        if (hasLineId)
                        {
                            await using (var cmd21 = new SqlCommand("Sp_Salesbilldetails", connection, tx))
                            {
                                cmd21.CommandType = CommandType.StoredProcedure;
                                cmd21.Parameters.AddWithValue("@Id", lineId);
                                cmd21.Parameters.AddWithValue("@Userid", userId);
                                cmd21.Parameters.AddWithValue("@Billid", billIdStr);
                                cmd21.Parameters.AddWithValue("@Itemid", itemId);
                                cmd21.Parameters.AddWithValue("@Qty", GetProp(row, "Qty", "qty"));
                                cmd21.Parameters.AddWithValue("@Amount", GetProp(row, "Amount", "amount"));
                                cmd21.Parameters.AddWithValue("@Vat", GetProp(row, "Vat", "vat"));
                                cmd21.Parameters.AddWithValue("@Vat_id", GetProp(row, "Vatid", "vatid"));
                                cmd21.Parameters.AddWithValue("@Total", GetProp(row, "Total", "total"));
                                cmd21.Parameters.AddWithValue("@Status", "Active");
                                cmd21.Parameters.AddWithValue("@Isdelete", "0");
                                cmd21.Parameters.AddWithValue("@Query", 3);
                                cmd21.Parameters.AddWithValue("@Type", type);
                                cmd21.Parameters.AddWithValue("@Customerid", DBNull.Value);
                                cmd21.Parameters.AddWithValue("@Billno", DBNull.Value);
                                await cmd21.ExecuteNonQueryAsync(http.RequestAborted);
                            }
                        }
                        else
                        {
                            await using (var cmd21 = new SqlCommand("Sp_Salesbilldetails", connection, tx))
                            {
                                cmd21.CommandType = CommandType.StoredProcedure;
                                cmd21.Parameters.AddWithValue("@Id", 0);
                                cmd21.Parameters.AddWithValue("@Userid", userId);
                                cmd21.Parameters.AddWithValue("@Billid", billIdStr);
                                cmd21.Parameters.AddWithValue("@Itemid", itemId);
                                cmd21.Parameters.AddWithValue("@Qty", GetProp(row, "Qty", "qty"));
                                cmd21.Parameters.AddWithValue("@Amount", GetProp(row, "Amount", "amount"));
                                cmd21.Parameters.AddWithValue("@Vat", GetProp(row, "Vat", "vat"));
                                cmd21.Parameters.AddWithValue("@Vat_id", GetProp(row, "Vatid", "vatid"));
                                cmd21.Parameters.AddWithValue("@Total", GetProp(row, "Total", "total"));
                                cmd21.Parameters.AddWithValue("@Status", "Active");
                                cmd21.Parameters.AddWithValue("@Isdelete", "0");
                                cmd21.Parameters.AddWithValue("@Type", type);
                                cmd21.Parameters.AddWithValue("@Query", 1);
                                cmd21.Parameters.AddWithValue("@Customerid", DBNull.Value);
                                cmd21.Parameters.AddWithValue("@Billno", DBNull.Value);
                                await cmd21.ExecuteNonQueryAsync(http.RequestAborted);
                            }
                        }

                        await SalesQuoteConvertToSalesHandler.InsertInventoryForLineAsync(
                            connection, tx, wh, billIdStr, itemId, GetProp(row, "Qty", "qty"), type, http.RequestAborted);
                    }

                    await using (var cmd23 = new SqlCommand("Sp_Purchasecategorydetails", connection, tx))
                    {
                        cmd23.CommandType = CommandType.StoredProcedure;
                        cmd23.Parameters.AddWithValue("@Billid", billIdStr);
                        cmd23.Parameters.AddWithValue("@Customerid", "");
                        cmd23.Parameters.AddWithValue("@Type", "Invoice");
                        cmd23.Parameters.AddWithValue("@Categoryid", "");
                        cmd23.Parameters.AddWithValue("@Description", "");
                        cmd23.Parameters.AddWithValue("@Amount", "");
                        cmd23.Parameters.AddWithValue("@Vatvalue", "");
                        cmd23.Parameters.AddWithValue("@Vatid", "");
                        cmd23.Parameters.AddWithValue("@Total", "");
                        cmd23.Parameters.AddWithValue("@Customer", "");
                        cmd23.Parameters.AddWithValue("@Isdelete", "");
                        cmd23.Parameters.AddWithValue("@Id", DBNull.Value);
                        cmd23.Parameters.AddWithValue("@Query", 5);
                        await cmd23.ExecuteNonQueryAsync(http.RequestAborted);
                    }

                    foreach (var row1 in GetArray(root, "tableDatacategory", "tabledatacategory"))
                    {
                        if (row1.ValueKind != JsonValueKind.Object) continue;
                        var catId = GetProp(row1, "Categoryid", "categoryid");
                        if (string.IsNullOrWhiteSpace(catId)) continue;

                        await using var cmd231 = new SqlCommand("Sp_Purchasecategorydetails", connection, tx);
                        cmd231.CommandType = CommandType.StoredProcedure;
                        cmd231.Parameters.AddWithValue("@Billid", billIdStr);
                        cmd231.Parameters.AddWithValue("@Customerid", userId);
                        cmd231.Parameters.AddWithValue("@Type", "Invoice");
                        cmd231.Parameters.AddWithValue("@Categoryid", catId);
                        cmd231.Parameters.AddWithValue("@Description", GetProp(row1, "Description", "description"));
                        cmd231.Parameters.AddWithValue("@Amount", GetProp(row1, "Amount", "amount"));
                        cmd231.Parameters.AddWithValue("@Vatvalue", GetProp(row1, "Vatvalue", "vatvalue"));
                        cmd231.Parameters.AddWithValue("@Vatid", GetProp(row1, "Vatid", "vatid"));
                        cmd231.Parameters.AddWithValue("@Total", GetProp(row1, "Total", "total"));
                        cmd231.Parameters.AddWithValue("@Customer", "");
                        cmd231.Parameters.AddWithValue("@Isdelete", 0);
                        cmd231.Parameters.AddWithValue("@Id", DBNull.Value);
                        cmd231.Parameters.AddWithValue("@Query", 1);
                        await cmd231.ExecuteNonQueryAsync(http.RequestAborted);
                    }

                    await using (var cmd2312 = new SqlCommand("Sp_Purchasevatdetails", connection, tx))
                    {
                        cmd2312.CommandType = CommandType.StoredProcedure;
                        cmd2312.Parameters.AddWithValue("@Billid", billIdStr);
                        cmd2312.Parameters.AddWithValue("@Customerid", "");
                        cmd2312.Parameters.AddWithValue("@Type", "Invoice");
                        cmd2312.Parameters.AddWithValue("@Vatid", "");
                        cmd2312.Parameters.AddWithValue("@Price", "");
                        cmd2312.Parameters.AddWithValue("@Vatamount", "");
                        cmd2312.Parameters.AddWithValue("@Isdelete", "");
                        cmd2312.Parameters.AddWithValue("@Id", 0);
                        cmd2312.Parameters.AddWithValue("@Query", 5);
                        await cmd2312.ExecuteNonQueryAsync(http.RequestAborted);
                    }

                    await using (var cmdt = new SqlCommand("Sp_Transaction", connection, tx))
                    {
                        cmdt.CommandType = CommandType.StoredProcedure;
                        cmdt.Parameters.AddWithValue("@Id", DBNull.Value);
                        cmdt.Parameters.AddWithValue("@Purchase_salesid", billIdStr);
                        cmdt.Parameters.AddWithValue("@Supplier_customerid", "");
                        cmdt.Parameters.AddWithValue("@Date", "");
                        cmdt.Parameters.AddWithValue("@Description", "");
                        cmdt.Parameters.AddWithValue("@Type", "");
                        cmdt.Parameters.AddWithValue("@Transaction_type", "");
                        cmdt.Parameters.AddWithValue("@Amount", DBNull.Value);
                        cmdt.Parameters.AddWithValue("@Conversion_amount", DBNull.Value);
                        cmdt.Parameters.AddWithValue("@Currency_rate", DBNull.Value);
                        cmdt.Parameters.AddWithValue("@Currency", "");
                        cmdt.Parameters.AddWithValue("@Isdelete", "");
                        cmdt.Parameters.AddWithValue("@Status", "");
                        cmdt.Parameters.AddWithValue("@Entry_type", "Invoice");
                        cmdt.Parameters.AddWithValue("@Ca_id", 0);
                        cmdt.Parameters.AddWithValue("@Vat_id", DBNull.Value);
                        cmdt.Parameters.AddWithValue("@Account_paytype", DBNull.Value);
                        cmdt.Parameters.AddWithValue("@Paymentid", DBNull.Value);
                        cmdt.Parameters.AddWithValue("@Usertypereturn", DBNull.Value);
                        cmdt.Parameters.AddWithValue("@Itemid", DBNull.Value);
                        cmdt.Parameters.AddWithValue("@Query", 15);
                        await cmdt.ExecuteNonQueryAsync(http.RequestAborted);
                    }

                    foreach (var vrow in GetArray(root, "tableDatavat", "tabledatavat"))
                    {
                        if (vrow.ValueKind != JsonValueKind.Object) continue;
                        var vid = GetProp(vrow, "Id", "id");
                        if (string.IsNullOrWhiteSpace(vid)) continue;

                        await using var cmd231 = new SqlCommand("Sp_Purchasevatdetails", connection, tx);
                        cmd231.CommandType = CommandType.StoredProcedure;
                        cmd231.Parameters.AddWithValue("@Billid", billIdStr);
                        cmd231.Parameters.AddWithValue("@Customerid", userId);
                        cmd231.Parameters.AddWithValue("@Type", "Invoice");
                        cmd231.Parameters.AddWithValue("@Vatid", vid);
                        cmd231.Parameters.AddWithValue("@Price", GetProp(vrow, "Vatprice", "vatprice"));
                        cmd231.Parameters.AddWithValue("@Vatamount", GetProp(vrow, "Vatvalue", "vatvalue"));
                        cmd231.Parameters.AddWithValue("@Isdelete", "0");
                        cmd231.Parameters.AddWithValue("@Id", 0);
                        cmd231.Parameters.AddWithValue("@Query", 1);
                        await cmd231.ExecuteNonQueryAsync(http.RequestAborted);
                    }

                    await using (var insTx = new SqlCommand("Sp_InsertTransaction", connection, tx)
                             {
                                 CommandType = CommandType.StoredProcedure
                             })
                    {
                        insTx.Parameters.AddWithValue("@SalesId", billIdStr);
                        insTx.Parameters.AddWithValue("@Catelogid", SalesBillPayloadSanitizer.CatalogIdIntForInsertTransaction(catelogId));
                        await insTx.ExecuteNonQueryAsync(http.RequestAborted);
                    }

                    await using (var csl = new SqlCommand("Sp_Customersaleslog", connection, tx))
                    {
                        csl.CommandType = CommandType.StoredProcedure;
                        csl.Parameters.AddWithValue("@Id", "");
                        csl.Parameters.AddWithValue("@Customerid", customerid);
                        csl.Parameters.AddWithValue("@Salesid", billIdStr);
                        csl.Parameters.AddWithValue("@Approveuserid", "");
                        csl.Parameters.AddWithValue("@Editreason", "");
                        csl.Parameters.AddWithValue("@Comments", "Updated");
                        csl.Parameters.AddWithValue("@Isdelete", 0);
                        csl.Parameters.AddWithValue("@Status", "Active");
                        csl.Parameters.AddWithValue("@Changeddate", NowLegacy());
                        csl.Parameters.AddWithValue("@Query", 1);
                        await csl.ExecuteNonQueryAsync(http.RequestAborted);
                    }

                    var message = "Updated successfully";
                    await using (var diff = new SqlCommand("Sp_Transactiondifferencecheckwithinsales", connection, tx))
                    {
                        diff.CommandType = CommandType.StoredProcedure;
                        diff.Parameters.AddWithValue("@Purchase_salesid", billIdStr);
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
                                return Results.Json(new { message = "There is a difference, transaction not committed", success = false });
                            }
                        }
                    }

                    await tx.CommitAsync(http.RequestAborted);
                    return Results.Json(new { message, success = true, salesBillId = billIdStr });
                }
                catch
                {
                    await tx.RollbackAsync(http.RequestAborted);
                    throw;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Editsalesbilldetails: " + ex);
                return Results.Json(new { message = $"Error: {ex.Message}", success = false }, statusCode: 500);
            }
        }
    }
}

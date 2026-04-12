using System.Data;
using System.Globalization;
using System.Text.Json;
using Microsoft.Data.SqlClient;

namespace Api;

/// <summary>Legacy POST /Sales/Savebilldetails — create draft sales invoice from customer bill screen.</summary>
public static class SalesBillSaveFromCustomerHandler
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
        // Store correct spelling in Tbl_Salesbill.Amountsare; still accept legacy typo from old rows/UI
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
            var replaceDraftBillId = GetProp(root, "replacedraftbillid", "replaceDraftBillId").Trim();
            var userId = GetProp(root, "userid", "Userid").Trim();
            if (string.IsNullOrEmpty(userId))
                return Results.BadRequest(new { message = "userid is required" });

            var fdEl = GetObj(root, "formData", "formdata");
            if (fdEl == null)
                return Results.BadRequest(new { message = "formData is required" });

            var fd = fdEl.Value;
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
            var salesquoteid = GetProp(fd, "Salesquoteid", "salesquoteid");

            var deductionAmt = GetProp(fd, "Deduction_amt", "deduction_amt");
            var taxid = GetProp(fd, "Taxid", "taxid");
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

                    string insertedId = "";
                    await using (var cmd2 = new SqlCommand("Sp_Salesbill", connection, tx))
                    {
                        cmd2.CommandType = CommandType.StoredProcedure;
                        cmd2.Parameters.AddWithValue("@Id", "");
                        cmd2.Parameters.AddWithValue("@Userid", userId);
                        cmd2.Parameters.AddWithValue("@Customerid", customerid);
                        cmd2.Parameters.AddWithValue("@Billdate", string.IsNullOrWhiteSpace(billdate) ? DBNull.Value : billdate);
                        cmd2.Parameters.AddWithValue("@Duedate", string.IsNullOrWhiteSpace(duedate) ? DBNull.Value : duedate);
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
                        cmd2.Parameters.AddWithValue("@Terms", SalesBillPayloadSanitizer.TermsForSp(terms));
                        cmd2.Parameters.AddWithValue("@Contact", string.IsNullOrWhiteSpace(contact) ? DBNull.Value : contact);
                        cmd2.Parameters.AddWithValue("@Phoneno", string.IsNullOrWhiteSpace(phoneno) ? DBNull.Value : phoneno);
                        cmd2.Parameters.AddWithValue("@Shipping_address", string.IsNullOrWhiteSpace(ship) ? DBNull.Value : ship);
                        cmd2.Parameters.AddWithValue("@Remarks", string.IsNullOrWhiteSpace(remarks) ? DBNull.Value : remarks);
                        cmd2.Parameters.AddWithValue("@Salespersonname", SalesBillPayloadSanitizer.SalespersonForSp(salesperson));
                        cmd2.Parameters.AddWithValue("@Discounttype", string.IsNullOrEmpty(discType) || discType == "0" ? "0" : discType);
                        cmd2.Parameters.AddWithValue("@Discountvalue", string.IsNullOrEmpty(discVal) ? "" : discVal);
                        cmd2.Parameters.AddWithValue("@Discountamount", string.IsNullOrEmpty(discAmt) ? "" : discAmt);
                        cmd2.Parameters.AddWithValue("@Newinvoiceno", "");
                        cmd2.Parameters.AddWithValue("@Newinvoicenocount", "");
                        cmd2.Parameters.AddWithValue("@Salesquoteid", string.IsNullOrWhiteSpace(salesquoteid) ? DBNull.Value : salesquoteid);
                        if (!string.IsNullOrWhiteSpace(salesquoteid))
                            cmd2.Parameters.AddWithValue("@Deliverstatus", "Awaiting Delivery");
                        else
                            cmd2.Parameters.AddWithValue("@Deliverstatus", DBNull.Value);
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

                    if (!string.IsNullOrWhiteSpace(taxid))
                    {
                        decimal taxAmount = 0;
                        decimal.TryParse(deductionAmt.Replace(",", ""), NumberStyles.Any, CultureInfo.InvariantCulture, out var dedDec);
                        decimal.TryParse(taxAmt.Replace(",", ""), NumberStyles.Any, CultureInfo.InvariantCulture, out var taxPctDec);
                        if (string.Equals(taxType, "Exclusive", StringComparison.OrdinalIgnoreCase))
                            taxAmount = dedDec * taxPctDec / 100;
                        else if (string.Equals(taxType, "Inclusive", StringComparison.OrdinalIgnoreCase) && taxPctDec > 0)
                            taxAmount = dedDec * taxPctDec / (100 + taxPctDec);

                        await using var cmd231 = new SqlCommand("Sp_Deductioncommission", connection, tx);
                        cmd231.CommandType = CommandType.StoredProcedure;
                        cmd231.Parameters.AddWithValue("@Id", "");
                        cmd231.Parameters.AddWithValue("@Salesid", insertedId);
                        cmd231.Parameters.AddWithValue("@Deduction_amt", deductionAmt);
                        cmd231.Parameters.AddWithValue("@Taxid", taxid);
                        cmd231.Parameters.AddWithValue("@Tax_amt", taxAmt);
                        cmd231.Parameters.AddWithValue("@Total_taxamount", taxAmount);
                        cmd231.Parameters.AddWithValue("@Total_deduction", string.IsNullOrWhiteSpace(totalDeduction) ? DBNull.Value : totalDeduction);
                        cmd231.Parameters.AddWithValue("@Isdelete", "0");
                        cmd231.Parameters.AddWithValue("@Type", "Sales");
                        cmd231.Parameters.AddWithValue("@Tax_type", string.IsNullOrWhiteSpace(taxType) ? DBNull.Value : taxType);
                        cmd231.Parameters.AddWithValue("@Query", 1);
                        await cmd231.ExecuteNonQueryAsync(http.RequestAborted);
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

                        await using (var cmd21 = new SqlCommand("Sp_Salesbilldetails", connection, tx))
                        {
                            cmd21.CommandType = CommandType.StoredProcedure;
                            cmd21.Parameters.AddWithValue("@Id", "");
                            cmd21.Parameters.AddWithValue("@Userid", userId);
                            cmd21.Parameters.AddWithValue("@Billid", insertedId);
                            cmd21.Parameters.AddWithValue("@Itemid", itemId);
                            cmd21.Parameters.AddWithValue("@Qty", GetProp(row, "Qty", "qty"));
                            cmd21.Parameters.AddWithValue("@Amount", GetProp(row, "Amount", "amount"));
                            // JSON: Vat = Tbl_Vat Id → column Vat; Vatid = rate % → column Vat_id (React customer bill)
                            cmd21.Parameters.AddWithValue("@Vat", GetProp(row, "Vat", "vat"));
                            cmd21.Parameters.AddWithValue("@Vat_id", GetProp(row, "Vatid", "vatid"));
                            cmd21.Parameters.AddWithValue("@Total", GetProp(row, "Total", "total"));
                            cmd21.Parameters.AddWithValue("@Status", "Active");
                            cmd21.Parameters.AddWithValue("@Isdelete", "0");
                            cmd21.Parameters.AddWithValue("@Type", type);
                            cmd21.Parameters.AddWithValue("@Query", 1);
                            await cmd21.ExecuteNonQueryAsync(http.RequestAborted);
                        }

                        await SalesQuoteConvertToSalesHandler.InsertInventoryForLineAsync(
                            connection, tx, wh, insertedId, itemId, GetProp(row, "Qty", "qty"), type, http.RequestAborted);
                    }

                    foreach (var row1 in GetArray(root, "tableDatacategory", "tabledatacategory"))
                    {
                        if (row1.ValueKind != JsonValueKind.Object) continue;
                        var catId = GetProp(row1, "Categoryid", "categoryid");
                        if (string.IsNullOrWhiteSpace(catId)) continue;

                        await using var cmd231 = new SqlCommand("Sp_Purchasecategorydetails", connection, tx);
                        cmd231.CommandType = CommandType.StoredProcedure;
                        cmd231.Parameters.AddWithValue("@Billid", insertedId);
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
                        cmd231.Parameters.AddWithValue("@Id", "");
                        cmd231.Parameters.AddWithValue("@Query", 1);
                        await cmd231.ExecuteNonQueryAsync(http.RequestAborted);
                    }

                    await using (var insTx = new SqlCommand("Sp_InsertTransaction", connection, tx)
                             {
                                 CommandType = CommandType.StoredProcedure
                             })
                    {
                        insTx.Parameters.AddWithValue("@SalesId", insertedId);
                        insTx.Parameters.AddWithValue("@Catelogid", SalesBillPayloadSanitizer.CatalogIdIntForInsertTransaction(catelogId));
                        await insTx.ExecuteNonQueryAsync(http.RequestAborted);
                    }

                    foreach (var vrow in GetArray(root, "tableDatavat", "tabledatavat"))
                    {
                        if (vrow.ValueKind != JsonValueKind.Object) continue;
                        var vid = GetProp(vrow, "Id", "id");
                        if (string.IsNullOrWhiteSpace(vid)) continue;

                        await using var cmd231 = new SqlCommand("Sp_Purchasevatdetails", connection, tx);
                        cmd231.CommandType = CommandType.StoredProcedure;
                        cmd231.Parameters.AddWithValue("@Billid", insertedId);
                        cmd231.Parameters.AddWithValue("@Customerid", userId);
                        cmd231.Parameters.AddWithValue("@Type", "Invoice");
                        cmd231.Parameters.AddWithValue("@Vatid", vid);
                        cmd231.Parameters.AddWithValue("@Price", GetProp(vrow, "Vatprice", "vatprice"));
                        cmd231.Parameters.AddWithValue("@Vatamount", GetProp(vrow, "Vatvalue", "vatvalue"));
                        cmd231.Parameters.AddWithValue("@Isdelete", "0");
                        cmd231.Parameters.AddWithValue("@Id", "");
                        cmd231.Parameters.AddWithValue("@Query", 1);
                        await cmd231.ExecuteNonQueryAsync(http.RequestAborted);
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
                                return Results.Json(new { message = "There is a difference, transaction not committed" });
                            }
                        }
                    }

                    if (!string.IsNullOrEmpty(replaceDraftBillId) &&
                        !string.Equals(replaceDraftBillId, insertedId, StringComparison.OrdinalIgnoreCase))
                    {
                        await using (var rep = new SqlCommand(
                            """
                            UPDATE Tbl_Salesbill
                            SET Isdelete = N'1'
                            WHERE Id = @OldId
                              AND LTRIM(RTRIM(ISNULL(CAST(Customerid AS NVARCHAR(50)), N''))) = LTRIM(RTRIM(@Cust))
                              AND LOWER(LTRIM(RTRIM(ISNULL(Status, N'')))) = N'draft'
                              AND (
                                    Isdelete IS NULL
                                    OR LTRIM(RTRIM(CAST(Isdelete AS NVARCHAR(50)))) IN (N'', N'0')
                                    OR (TRY_CAST(Isdelete AS INT) IS NOT NULL AND TRY_CAST(Isdelete AS INT) = 0)
                                  )
                            """,
                            connection, tx))
                        {
                            rep.Parameters.AddWithValue("@OldId", replaceDraftBillId);
                            rep.Parameters.AddWithValue("@Cust", customerid);
                            await rep.ExecuteNonQueryAsync(http.RequestAborted);
                        }
                    }

                    await tx.CommitAsync(http.RequestAborted);
                    return Results.Json(new { message, success = true, salesBillId = insertedId });
                }
                catch
                {
                    await tx.RollbackAsync(http.RequestAborted);
                    throw;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Savebilldetails: " + ex);
                return Results.Json(new { message = $"Error: {ex.Message}", success = false }, statusCode: 500);
            }
        }
    }
}

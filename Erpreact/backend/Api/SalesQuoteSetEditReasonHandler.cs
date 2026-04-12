using System.Data;
using System.Globalization;
using Microsoft.Data.SqlClient;

namespace Api;

/// <summary>Legacy GET /Sales/seteditreasonsalesquote — Sp_Salesquotelog Q4 + Sp_Salesquote Q7; non–Edit-request then runs delete chain (legacy deleteSalesquote core, no owner check).</summary>
public static class SalesQuoteSetEditReasonHandler
{
    private static string ApprovedDateLegacy() =>
        DateTime.Now.ToString("dd-MM-yyyy HH:mm:ss", CultureInfo.InvariantCulture);

    public static async Task<IResult> Handle(HttpContext http, SqlConnection connection)
    {
        var salesbillid = (http.Request.Query["salesbillid"].FirstOrDefault() ?? "").Trim();
        var logid = (http.Request.Query["logid"].FirstOrDefault() ?? "").Trim();
        var status = (http.Request.Query["status"].FirstOrDefault() ?? "").Trim();
        var comments = http.Request.Query["comments"].FirstOrDefault() ?? "";
        var requesttype = (http.Request.Query["requesttype"].FirstOrDefault() ?? "").Trim();
        var userid = (http.Request.Query["userid"].FirstOrDefault() ?? "").Trim();

        if (string.IsNullOrEmpty(salesbillid) || string.IsNullOrEmpty(logid) || string.IsNullOrEmpty(userid))
            return Results.BadRequest(new { success = false, msg = "Missing salesbillid, logid, or userid." });

        if (!string.Equals(status, "Approved", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(status, "Rejected", StringComparison.OrdinalIgnoreCase))
            return Results.BadRequest(new { success = false, msg = "Invalid status." });

        var approved = string.Equals(status, "Approved", StringComparison.OrdinalIgnoreCase);
        var isEditRequest = string.Equals(requesttype, "Editrequest", StringComparison.OrdinalIgnoreCase);
        var headerStatus = approved ? "Draft" : "Rejected";

        try
        {
            if (connection.State != ConnectionState.Open)
                await connection.OpenAsync(http.RequestAborted);

            await using (var tx = (SqlTransaction)await connection.BeginTransactionAsync(http.RequestAborted))
            {
                try
                {
                    await using (var cmd = new SqlCommand("Sp_Salesquotelog", connection, tx))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Approveuserid", userid);
                        cmd.Parameters.AddWithValue("@Status", approved ? "1" : "0");
                        cmd.Parameters.AddWithValue("@Comments", comments);
                        cmd.Parameters.AddWithValue("@Approveddate", ApprovedDateLegacy());
                        cmd.Parameters.AddWithValue("@Id", logid);
                        cmd.Parameters.AddWithValue("@Query", 4);
                        await cmd.ExecuteNonQueryAsync(http.RequestAborted);
                    }

                    // Q7 with empty @Salesquoteno overwrites an issued number with "Draft" — keep existing Salesquoteno.
                    var existingQuoteNo = await LoadExistingSalesQuoteNoAsync(connection, tx, salesbillid, http.RequestAborted);
                    await ExecSalesquoteQ7Async(connection, tx, salesbillid, headerStatus, existingQuoteNo, http.RequestAborted);
                    await tx.CommitAsync(http.RequestAborted);
                }
                catch
                {
                    await tx.RollbackAsync(http.RequestAborted);
                    throw;
                }
            }

            if (!isEditRequest)
            {
                var delErr = await ExecuteManagerDeleteQuoteAsync(connection, salesbillid, userid, http.RequestAborted);
                if (!string.IsNullOrEmpty(delErr))
                    return Results.Json(
                        new { success = false, msg = "Request was saved but quote delete failed: " + delErr },
                        statusCode: 500);
            }

            return Results.Ok(new { success = true, msg = "Sent successfully" });
        }
        catch (Exception ex)
        {
            Console.WriteLine("seteditreasonsalesquote: " + ex);
            return Results.Json(new { success = false, msg = "Error: " + ex.Message }, statusCode: 500);
        }
    }

    private static async Task<string> LoadExistingSalesQuoteNoAsync(
        SqlConnection con,
        SqlTransaction tx,
        string salesbillid,
        CancellationToken ct)
    {
        if (!int.TryParse(salesbillid, out var quoteId) || quoteId <= 0)
            return "";

        await using var sel = new SqlCommand(
            """
            SELECT Salesquoteno FROM Tbl_Salesquote
            WHERE Id = @Id AND (Isdelete IS NULL OR Isdelete = '0' OR Isdelete = 0)
            """,
            con,
            tx);
        sel.Parameters.AddWithValue("@Id", quoteId);
        var o = await sel.ExecuteScalarAsync(ct);
        return o?.ToString()?.Trim() ?? "";
    }

    private static async Task ExecSalesquoteQ7Async(
        SqlConnection con,
        SqlTransaction tx,
        string salesbillid,
        string headerStatus,
        string salesQuoteNoToKeep,
        CancellationToken ct)
    {
        await using var cmd1 = new SqlCommand("Sp_Salesquote", con, tx);
        cmd1.CommandType = CommandType.StoredProcedure;
        cmd1.Parameters.AddWithValue("@Id", salesbillid);
        cmd1.Parameters.AddWithValue("@Userid", "");
        cmd1.Parameters.AddWithValue("@Customerid", "");
        cmd1.Parameters.AddWithValue("@Billdate", "");
        cmd1.Parameters.AddWithValue("@Duedate", "");
        // Empty string tends to make Q7 reset the column to "Draft"; pass through existing value from DB.
        cmd1.Parameters.AddWithValue("@Salesquoteno", salesQuoteNoToKeep ?? "");
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
        cmd1.Parameters.AddWithValue("@Managerapprovestatus", "");
        cmd1.Parameters.AddWithValue("@Isdelete", "");
        cmd1.Parameters.AddWithValue("@Type", "");
        cmd1.Parameters.AddWithValue("@Terms", "");
        cmd1.Parameters.AddWithValue("@Status", headerStatus);
        cmd1.Parameters.AddWithValue("@Query", 7);
        await cmd1.ExecuteNonQueryAsync(ct);
    }

    /// <summary>Same SP sequence as /api/salesquote/soft-delete body, without owner/status guards (manager after delete-request approval).</summary>
    private static async Task<string?> ExecuteManagerDeleteQuoteAsync(
        SqlConnection connection,
        string billNo,
        string approveUserId,
        CancellationToken ct)
    {
        if (!int.TryParse(billNo, out var quoteId) || quoteId <= 0)
            return "Invalid sales quote id.";

        await using var tx = (SqlTransaction)await connection.BeginTransactionAsync(ct);
        try
        {
            string? customerid = null;
            await using (var sel = new SqlCommand(
                               "SELECT Customerid FROM Tbl_Salesquote WHERE Id=@Id AND (Isdelete IS NULL OR Isdelete = '0' OR Isdelete = 0)",
                               connection,
                               tx))
            {
                sel.Parameters.AddWithValue("@Id", quoteId);
                var o = await sel.ExecuteScalarAsync(ct);
                customerid = o?.ToString();
            }

            if (string.IsNullOrEmpty(customerid))
            {
                await tx.RollbackAsync(ct);
                return "Quote not found or already removed.";
            }

            var idString = quoteId.ToString();

            await using (var command = new SqlCommand("Sp_Salesquote", connection, tx))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@Query", 17);
                command.Parameters.AddWithValue("@Id", quoteId);
                command.Parameters.AddWithValue("@Isdelete", "1");
                command.Parameters.AddWithValue("@Userid", DBNull.Value);
                command.Parameters.AddWithValue("@Customerid", DBNull.Value);
                command.Parameters.AddWithValue("@Billdate", DBNull.Value);
                command.Parameters.AddWithValue("@Duedate", DBNull.Value);
                command.Parameters.AddWithValue("@Salesquoteno", DBNull.Value);
                command.Parameters.AddWithValue("@Amountsare", DBNull.Value);
                command.Parameters.AddWithValue("@Vatnumber", DBNull.Value);
                command.Parameters.AddWithValue("@Billing_address", DBNull.Value);
                command.Parameters.AddWithValue("@Sales_location", DBNull.Value);
                command.Parameters.AddWithValue("@Sub_total", DBNull.Value);
                command.Parameters.AddWithValue("@Vat", DBNull.Value);
                command.Parameters.AddWithValue("@Vat_amount", DBNull.Value);
                command.Parameters.AddWithValue("@Grand_total", DBNull.Value);
                command.Parameters.AddWithValue("@Conversion_amount", 1);
                command.Parameters.AddWithValue("@Currency_rate", 1);
                command.Parameters.AddWithValue("@Currency", DBNull.Value);
                command.Parameters.AddWithValue("@Terms", DBNull.Value);
                await command.ExecuteNonQueryAsync(ct);
            }

            await using (var del = new SqlCommand("Sp_Salesquotedetails", connection, tx))
            {
                del.CommandType = CommandType.StoredProcedure;
                del.Parameters.AddWithValue("@Id", "");
                del.Parameters.AddWithValue("@Userid", "");
                del.Parameters.AddWithValue("@Salesquoteid", idString);
                del.Parameters.AddWithValue("@Itemid", "");
                del.Parameters.AddWithValue("@Qty", "");
                del.Parameters.AddWithValue("@Amount", "");
                del.Parameters.AddWithValue("@Vat", "");
                del.Parameters.AddWithValue("@Vat_id", "");
                del.Parameters.AddWithValue("@Total", "");
                del.Parameters.AddWithValue("@Status", "");
                del.Parameters.AddWithValue("@Isdelete", "1");
                del.Parameters.AddWithValue("@Type", "");
                del.Parameters.AddWithValue("@Query", 6);
                await del.ExecuteNonQueryAsync(ct);
            }

            await using (var log = new SqlCommand("Sp_Salesquotelog", connection, tx))
            {
                log.CommandType = CommandType.StoredProcedure;
                log.Parameters.AddWithValue("@Id", DBNull.Value);
                log.Parameters.AddWithValue("@Customerid", customerid);
                log.Parameters.AddWithValue("@Salesquoteid", idString);
                log.Parameters.AddWithValue("@Approveuserid", approveUserId);
                log.Parameters.AddWithValue("@Editreason", "");
                log.Parameters.AddWithValue("@Comments", "Deleted");
                log.Parameters.AddWithValue("@Isdelete", "1");
                log.Parameters.AddWithValue("@Status", "Active");
                log.Parameters.AddWithValue("@Changeddate", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture));
                log.Parameters.AddWithValue("@Type", "Delete");
                log.Parameters.AddWithValue("@Userid", approveUserId);
                log.Parameters.AddWithValue("@Catelogid", DBNull.Value);
                log.Parameters.AddWithValue("@Approveddate", DBNull.Value);
                log.Parameters.AddWithValue("@Query", 1);
                await log.ExecuteNonQueryAsync(ct);
            }

            await using (var inv = new SqlCommand("Sp_Inventory", connection, tx))
            {
                inv.CommandType = CommandType.StoredProcedure;
                inv.Parameters.AddWithValue("@Billid", idString);
                inv.Parameters.AddWithValue("@Inventory_type", "4");
                inv.Parameters.AddWithValue("@Isdelete", "1");
                inv.Parameters.AddWithValue("@Query", 11);
                await inv.ExecuteNonQueryAsync(ct);
            }

            await using (var v = new SqlCommand("Sp_Purchasevatdetails", connection, tx))
            {
                v.CommandType = CommandType.StoredProcedure;
                v.Parameters.AddWithValue("@Id", 0);
                v.Parameters.AddWithValue("@Billid", idString);
                v.Parameters.AddWithValue("@Customerid", "");
                v.Parameters.AddWithValue("@Type", "Salesquote");
                v.Parameters.AddWithValue("@Vatid", "");
                v.Parameters.AddWithValue("@Price", "");
                v.Parameters.AddWithValue("@Vatamount", "");
                v.Parameters.AddWithValue("@Isdelete", "1");
                v.Parameters.AddWithValue("@Query", 4);
                await v.ExecuteNonQueryAsync(ct);
            }

            await using (var c = new SqlCommand("Sp_Purchasecategorydetails", connection, tx))
            {
                c.CommandType = CommandType.StoredProcedure;
                c.Parameters.AddWithValue("@Id", "");
                c.Parameters.AddWithValue("@Billid", idString);
                c.Parameters.AddWithValue("@Customerid", "");
                c.Parameters.AddWithValue("@Type", "Salesquote");
                c.Parameters.AddWithValue("@Categoryid", "");
                c.Parameters.AddWithValue("@Description", "");
                c.Parameters.AddWithValue("@Amount", "");
                c.Parameters.AddWithValue("@Vatvalue", "");
                c.Parameters.AddWithValue("@Vatid", "");
                c.Parameters.AddWithValue("@Total", "");
                c.Parameters.AddWithValue("@Customer", "");
                c.Parameters.AddWithValue("@Isdelete", "1");
                c.Parameters.AddWithValue("@Query", 4);
                await c.ExecuteNonQueryAsync(ct);
            }

            await tx.CommitAsync(ct);
            return null;
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync(ct);
            return ex.Message;
        }
    }
}

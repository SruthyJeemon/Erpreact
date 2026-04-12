using System.Data;
using System.Globalization;
using Microsoft.Data.SqlClient;

namespace Api;

/// <summary>
/// Legacy-style manager decision on Tbl_Customersaleslog (edit/delete requests for sales bills).
/// Sp_Customersaleslog @Query = 4 + Sp_Salesbill @Query = 18 (status) and/or @Query = 7 (soft delete draft).
/// </summary>
public static class SalesBillSetEditReasonHandler
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

        if (!int.TryParse(salesbillid, out var billIdInt) || billIdInt <= 0)
            return Results.BadRequest(new { success = false, msg = "Invalid sales bill id." });

        var approved = string.Equals(status, "Approved", StringComparison.OrdinalIgnoreCase);
        var isEditRequest = string.Equals(requesttype, "Editrequest", StringComparison.OrdinalIgnoreCase);

        try
        {
            if (connection.State != ConnectionState.Open)
                await connection.OpenAsync(http.RequestAborted);

            await using (var tx = (SqlTransaction)await connection.BeginTransactionAsync(http.RequestAborted))
            {
                try
                {
                    await using (var cmd = new SqlCommand("Sp_Customersaleslog", connection, tx))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", logid);
                        cmd.Parameters.AddWithValue("@Customerid", "");
                        cmd.Parameters.AddWithValue("@Salesid", "");
                        cmd.Parameters.AddWithValue("@Approveuserid", userid);
                        cmd.Parameters.AddWithValue("@Editreason", "");
                        cmd.Parameters.AddWithValue("@Comments", comments);
                        cmd.Parameters.AddWithValue("@Isdelete", "");
                        cmd.Parameters.AddWithValue("@Status", approved ? "1" : "0");
                        cmd.Parameters.AddWithValue("@Changeddate", ApprovedDateLegacy());
                        cmd.Parameters.AddWithValue("@Type", "");
                        cmd.Parameters.AddWithValue("@Userid", "");
                        cmd.Parameters.AddWithValue("@Catelogid", "");
                        cmd.Parameters.AddWithValue("@Approveddate", ApprovedDateLegacy());
                        cmd.Parameters.AddWithValue("@Query", 4);
                        await cmd.ExecuteNonQueryAsync(http.RequestAborted);
                    }

                    if (isEditRequest)
                    {
                        var billStatus = approved ? "Draft" : "Rejected";
                        await ExecSpSalesbillQ18Async(connection, tx, billIdInt, billStatus, http.RequestAborted);
                    }
                    else
                    {
                        if (approved)
                            await ExecSpSalesbillQ7Async(connection, tx, billIdInt, "1", http.RequestAborted);
                        else
                            await ExecSpSalesbillQ18Async(connection, tx, billIdInt, "Draft", http.RequestAborted);
                    }

                    await tx.CommitAsync(http.RequestAborted);
                }
                catch
                {
                    await tx.RollbackAsync(http.RequestAborted);
                    throw;
                }
            }

            return Results.Ok(new { success = true, msg = "Sent successfully" });
        }
        catch (Exception ex)
        {
            Console.WriteLine("seteditreasonsalesbill: " + ex);
            return Results.Json(new { success = false, msg = "Error: " + ex.Message }, statusCode: 500);
        }
    }

    private static async Task ExecSpSalesbillQ18Async(
        SqlConnection con,
        SqlTransaction tx,
        int billId,
        string billStatus,
        CancellationToken ct)
    {
        await using var cmd = new SqlCommand("Sp_Salesbill", con, tx);
        cmd.CommandType = CommandType.StoredProcedure;
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
        cmd.Parameters.AddWithValue("@Status", billStatus);
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
        cmd.Parameters.AddWithValue("@Query", 18);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    private static async Task ExecSpSalesbillQ7Async(
        SqlConnection con,
        SqlTransaction tx,
        int billId,
        string isdelete,
        CancellationToken ct)
    {
        await using var cmd = new SqlCommand("Sp_Salesbill", con, tx);
        cmd.CommandType = CommandType.StoredProcedure;
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
        cmd.Parameters.AddWithValue("@Isdelete", isdelete);
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
        cmd.Parameters.AddWithValue("@Query", 7);
        await cmd.ExecuteNonQueryAsync(ct);
    }
}

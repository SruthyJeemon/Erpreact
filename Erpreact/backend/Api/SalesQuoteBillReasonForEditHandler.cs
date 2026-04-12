using System.Data;
using System.Globalization;
using Microsoft.Data.SqlClient;

namespace Api;

/// <summary>Legacy GET /Sales/Salesbillreasonforeditsalesquote — Sp_Salesquotelog Q1 + Sp_Salesquote Q7.</summary>
public static class SalesQuoteBillReasonForEditHandler
{
    public static async Task<string> ExecuteAsync(
        SqlConnection connection,
        CancellationToken ct,
        string reasonforedit,
        string customerid,
        string salesid,
        string requesttype)
    {
        if (string.IsNullOrEmpty(salesid))
            return "Error: salesid is required";

        var msg = "";
        try
        {
            if (connection.State != ConnectionState.Open)
                await connection.OpenAsync(ct);

            await using (var cmd = new SqlCommand("Sp_Salesquotelog", connection))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Id", "");
                cmd.Parameters.AddWithValue("@Customerid", customerid);
                cmd.Parameters.AddWithValue("@Salesquoteid", salesid);
                cmd.Parameters.AddWithValue("@Approveuserid", "");
                cmd.Parameters.AddWithValue("@Editreason", reasonforedit);
                cmd.Parameters.AddWithValue("@Comments", "");
                cmd.Parameters.AddWithValue("@Isdelete", "0");
                cmd.Parameters.AddWithValue("@Status", "0");
                cmd.Parameters.AddWithValue("@Changeddate", DateTime.Now.ToString("dd-MM-yyyy HH:mm:ss", CultureInfo.InvariantCulture));
                cmd.Parameters.AddWithValue("@Type", requesttype);
                cmd.Parameters.AddWithValue("@Query", 1);
                await cmd.ExecuteNonQueryAsync(ct);
            }

            msg = string.Equals(requesttype, "Editrequest", StringComparison.OrdinalIgnoreCase)
                ? "Edit request sent"
                : "Delete request sent";

            await using (var cmd1 = new SqlCommand("Sp_Salesquote", connection))
            {
                cmd1.CommandType = CommandType.StoredProcedure;
                cmd1.Parameters.AddWithValue("@Id", salesid);
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
                cmd1.Parameters.AddWithValue("@Status", msg);
                cmd1.Parameters.AddWithValue("@Query", 7);
                await cmd1.ExecuteNonQueryAsync(ct);
            }
        }
        catch (Exception ex)
        {
            msg = "Error: " + ex.Message;
        }

        return msg;
    }

    public static async Task<IResult> Handle(HttpContext http, SqlConnection connection)
    {
        var reasonforedit = (http.Request.Query["reasonforedit"].FirstOrDefault() ?? "").Trim();
        var customerid = (http.Request.Query["customerid"].FirstOrDefault() ?? "").Trim();
        var salesid = (http.Request.Query["salesid"].FirstOrDefault() ?? "").Trim();
        var requesttype = (http.Request.Query["requesttype"].FirstOrDefault() ?? "Editrequest").Trim();

        var msg = await ExecuteAsync(connection, http.RequestAborted, reasonforedit, customerid, salesid, requesttype);
        return Results.Json(new { msg });
    }
}

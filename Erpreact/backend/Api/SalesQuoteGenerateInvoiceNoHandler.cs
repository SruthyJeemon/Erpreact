using System.Data;
using System.Globalization;
using Microsoft.Data.SqlClient;

namespace Api;

/// <summary>Legacy GET /Sales/getinvoicenogeneratesalesquote — Sp_Newinvoicenogeneratesalesquote.</summary>
public static class SalesQuoteGenerateInvoiceNoHandler
{
    private static string? ReadCell(DataRow row, params string[] names)
    {
        foreach (var n in names)
        {
            foreach (DataColumn c in row.Table.Columns)
            {
                if (string.Equals(c.ColumnName, n, StringComparison.OrdinalIgnoreCase))
                    return row[c.ColumnName] == DBNull.Value ? null : row[c.ColumnName]?.ToString();
            }
        }
        return null;
    }

    public static async Task<IResult> Handle(HttpContext http, SqlConnection connection)
    {
        var raw = (http.Request.Query["billDate"].FirstOrDefault()
                   ?? http.Request.Query["Billdate"].FirstOrDefault()
                   ?? "").Trim();
        if (string.IsNullOrEmpty(raw))
            return Results.Json(new { error = "billDate is required" });

        string formattedBilldate;
        if (DateTime.TryParseExact(raw, "dd-MM-yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var d1))
            formattedBilldate = d1.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        else if (DateTime.TryParseExact(raw, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var d2))
            formattedBilldate = d2.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        else if (DateTime.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.None, out var d3))
            formattedBilldate = d3.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        else
            return Results.Json(new { error = "Invalid date format. Use yyyy-MM-dd or dd-MM-yyyy." });

        try
        {
            await connection.OpenAsync(http.RequestAborted);
            await using var cmd2 = new SqlCommand("Sp_Newinvoicenogeneratesalesquote", connection)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd2.Parameters.AddWithValue("@Billdate", formattedBilldate);

            var dt = new DataTable();
            await using (var reader = await cmd2.ExecuteReaderAsync(http.RequestAborted))
            {
                dt.Load(reader);
            }

            if (dt.Rows.Count == 0)
                return Results.Json(new { error = "No data returned from the stored procedure" });

            var row0 = dt.Rows[0];
            var invoiceno = ReadCell(row0, "GeneratedNewInvoiceNo", "generatednewinvoiceno") ?? "";
            var invoicecount = ReadCell(row0, "GeneratedNewInvoiceCount", "generatednewinvoicecount") ?? "";
            if (string.IsNullOrEmpty(invoiceno))
                return Results.Json(new { Invoiceno = "", Invoicecount = invoicecount, error = "Empty invoice number" });

            // Include PascalCase keys for older jQuery clients; ASP.NET still camelCases by default for JSON.
            return Results.Json(new { Invoiceno = invoiceno, Invoicecount = invoicecount });
        }
        catch (Exception ex)
        {
            Console.WriteLine("SalesQuoteGenerateInvoiceNoHandler: " + ex);
            return Results.Json(new { error = ex.Message });
        }
    }
}

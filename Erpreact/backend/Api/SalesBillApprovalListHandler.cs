using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;

namespace Api;

/// <summary>
/// Legacy GET /Sales/Getsalesbillapprovaldetails — Sp_Salesbill @Query = 20; List2 equivalent to Sp_Customersaleslog @Query = 3 plus log Type as requesttype.
/// List1: Active bills in catalog. List2: pending edit/delete requests (other users’ bills in catalog).
/// </summary>
public static class SalesBillApprovalListHandler
{
    private static string Rdr(SqlDataReader r, params string[] names)
    {
        foreach (var col in names)
        {
            try
            {
                var ord = r.GetOrdinal(col);
                if (r.IsDBNull(ord)) return "";
                return r.GetValue(ord)?.ToString() ?? "";
            }
            catch (Exception) { }
        }
        return "";
    }

    public static async Task<IResult> Handle(HttpContext http, SqlConnection connection)
    {
        var list1 = new List<object>();
        var list2 = new List<object>();
        var userid = (http.Request.Query["userid"].FirstOrDefault() ?? "").Trim();
        var catelogId = http.Request.Query["catelogId"].FirstOrDefault()
                        ?? http.Request.Query["catalogId"].FirstOrDefault();

        if (string.IsNullOrEmpty(userid))
            return Results.Ok(new
            {
                List1 = list1,
                List2 = list2,
                salesbillapprovalcount = 0,
                salesbillrequestcount = 0
            });

        try
        {
            await connection.OpenAsync();

            string? resolvedCatalog = string.IsNullOrWhiteSpace(catelogId) ? null : catelogId.Trim();
            if (string.IsNullOrEmpty(resolvedCatalog))
            {
                await using (var catCmd = new SqlCommand(
                                 "SELECT TOP 1 Catelogid FROM Tbl_Registration WHERE Userid = @Userid OR CAST(Id AS VARCHAR(50)) = @Userid",
                                 connection))
                {
                    catCmd.Parameters.AddWithValue("@Userid", userid);
                    var o = await catCmd.ExecuteScalarAsync();
                    resolvedCatalog = o?.ToString();
                }
            }

            if (string.IsNullOrEmpty(resolvedCatalog))
                resolvedCatalog = "";

            // MVC Getsalesbillapprovaldetails: Q20 with Session Userid, Status = Active, Isdelete = 0
            await using (var cmd = new SqlCommand("Sp_Salesbill", connection))
            {
                cmd.CommandType = System.Data.CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Id", 0);
                cmd.Parameters.AddWithValue("@Userid", userid);
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
                cmd.Parameters.AddWithValue("@Status", "Active");
                cmd.Parameters.AddWithValue("@Isdelete", 0);
                cmd.Parameters.AddWithValue("@Type", "");
                cmd.Parameters.AddWithValue("@Terms", "");
                cmd.Parameters.AddWithValue("@Catelogid", resolvedCatalog);
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
                cmd.Parameters.AddWithValue("@Query", 20);

                await using var reader = await cmd.ExecuteReaderAsync(http.RequestAborted);
                while (await reader.ReadAsync(http.RequestAborted))
                {
                    list1.Add(new
                    {
                        Id = Rdr(reader, "Id"),
                        Username = Rdr(reader, "Username"),
                        Billdate = Rdr(reader, "Billdate"),
                        Type = Rdr(reader, "Type"),
                        Billno = Rdr(reader, "Billno"),
                        Customername = Rdr(reader, "Customername"),
                        Grand_total = Rdr(reader, "Grand_Total", "Grand_total"),
                        Currencyvalue = Rdr(reader, "Currencyname", "Currencyvalue"),
                        Managerapprovestatus = "0",
                        billstatus = "Active"
                    });
                }
            }

            // Same result as Sp_Customersaleslog @Query = 3; SQL adds l.Type as requesttype (SP does not return it).
            const string sqlList2 = """
                SELECT
                    p.Id,
                    r.Firstname AS Username,
                    p.Billdate,
                    p.Type,
                    p.Billno,
                    s.Customerdisplayname AS Customername,
                    p.Grand_Total,
                    c.Currency AS Currencyname,
                    COALESCE(l.Editresaon, N'') AS Editreason,
                    CAST(s.Id AS VARCHAR(50)) AS Customerid,
                    CAST(l.Id AS VARCHAR(50)) AS logid,
                    COALESCE(l.Type, N'') AS requesttype
                FROM Tbl_Salesbill p
                INNER JOIN Tbl_Customer s ON s.Id = p.Customerid
                INNER JOIN Tbl_Registration r ON r.Userid = p.Userid
                INNER JOIN Tbl_Currency c ON c.Id = p.Currency
                INNER JOIN Tbl_Customersaleslog l ON l.Salesid = p.Id
                WHERE l.Type IN (SELECT LTRIM(RTRIM(value)) FROM dbo.SplitString(@TypeCsv, ','))
                  AND p.Status IN (SELECT LTRIM(RTRIM(value)) FROM dbo.SplitString(@StatusCsv, ','))
                  AND LTRIM(RTRIM(ISNULL(l.Approveuserid, N''))) = N''
                  AND p.Userid <> @ScopeUserid
                  AND r.Catelogid IN (SELECT value FROM dbo.SplitString(@Catelogid, ','))
                ORDER BY l.Id DESC
                """;

            await using (var cmd2 = new SqlCommand(sqlList2, connection))
            {
                cmd2.Parameters.AddWithValue("@TypeCsv", "Editrequest,Deleterequest");
                cmd2.Parameters.AddWithValue("@StatusCsv", "Edit request sent,Delete request sent");
                cmd2.Parameters.AddWithValue("@ScopeUserid", userid);
                cmd2.Parameters.AddWithValue("@Catelogid", resolvedCatalog ?? "");

                await using var r2 = await cmd2.ExecuteReaderAsync(http.RequestAborted);
                while (await r2.ReadAsync(http.RequestAborted))
                {
                    list2.Add(new
                    {
                        Id = Rdr(r2, "Id"),
                        Username = Rdr(r2, "Username"),
                        Billdate = Rdr(r2, "Billdate"),
                        Type = Rdr(r2, "Type"),
                        Billno = Rdr(r2, "Billno"),
                        Customername = Rdr(r2, "Customername"),
                        Grand_total = Rdr(r2, "Grand_Total", "Grand_total"),
                        Currencyvalue = Rdr(r2, "Currencyname", "Currencyvalue"),
                        Editreason = Rdr(r2, "Editreason"),
                        customerid = Rdr(r2, "Customerid"),
                        logid = Rdr(r2, "logid", "Logid"),
                        requesttype = Rdr(r2, "requesttype", "Requesttype")
                    });
                }
            }

            return Results.Ok(new
            {
                List1 = list1,
                List2 = list2,
                salesbillapprovalcount = list1.Count,
                salesbillrequestcount = list2.Count
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine("salesbill/approval-pending-list: " + ex.Message);
            return Results.Ok(new
            {
                List1 = list1,
                List2 = list2,
                salesbillapprovalcount = 0,
                salesbillrequestcount = 0,
                error = ex.Message
            });
        }
    }
}

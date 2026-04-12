using System.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;

namespace Api;

/// <summary>
/// Legacy MVC GET /Sales/Getsalesbillapprovaldetailsquote — Sp_Salesquote Q9 + Sp_Salesquotelog Q3.
/// </summary>
public static class SalesQuoteApprovalDetailsHandler
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

    /// <summary>
    /// Older React API wrote edit/delete requests with Type = "Salesquote" and Comments = "… request sent";
    /// Sp_Salesquotelog Q3 only returns Type Editrequest/Deleterequest — merge these rows so managers still see them.
    /// </summary>
    private static async Task AppendLegacyPortalEditDeleteRowsAsync(
        SqlConnection connection,
        List<object> list2,
        HashSet<string> seenLogIds,
        string catelogId,
        CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                CAST(q.Id AS VARCHAR(50)) AS Id,
                COALESCE(
                    NULLIF(LTRIM(RTRIM(CAST(reg.Firstname AS NVARCHAR(200)))), N''),
                    CAST(q.Userid AS NVARCHAR(100))
                ) AS Username,
                CONVERT(VARCHAR(30), q.Billdate, 23) AS Billdate,
                COALESCE(CAST(q.Type AS NVARCHAR(100)), N'Quote') AS Type,
                COALESCE(CAST(q.Salesquoteno AS NVARCHAR(200)), N'') AS Salesquoteno,
                COALESCE(c.Customerdisplayname, N'') AS Customername,
                COALESCE(CAST(q.Grand_total AS NVARCHAR(50)), N'') AS Grand_total,
                CAST(N'' AS NVARCHAR(50)) AS Currencyname,
                COALESCE(CAST(l.Editresaon AS NVARCHAR(MAX)), N'') AS Editreason,
                CASE
                    WHEN l.Comments LIKE N'%Delete%' THEN N'Deleterequest'
                    ELSE N'Editrequest'
                END AS requesttype,
                COALESCE(CAST(q.Customerid AS NVARCHAR(50)), N'') AS Customerid,
                CAST(l.Id AS VARCHAR(50)) AS logid
            FROM Tbl_Salesquotelog l
            INNER JOIN Tbl_Salesquote q ON q.Id = TRY_CONVERT(
                INT,
                NULLIF(LTRIM(RTRIM(CAST(l.Salesquoteid AS VARCHAR(50)))), '')
            )
            LEFT JOIN Tbl_Customer c ON c.Id = q.Customerid
            OUTER APPLY (
                SELECT TOP 1 Firstname
                FROM Tbl_Registration r
                WHERE (r.Userid = q.Userid OR CAST(r.Id AS VARCHAR(50)) = CAST(q.Userid AS VARCHAR(50)))
            ) reg
            WHERE l.Type = N'Salesquote'
              AND (
                  (l.Comments = N'Delete request sent' AND q.Status = N'Delete request sent')
                  OR (l.Comments = N'Edit request sent' AND q.Status = N'Edit request sent')
              )
              AND (q.Isdelete IS NULL OR q.Isdelete = N'' OR q.Isdelete = N'0' OR q.Isdelete = 0)
              AND (
                  @Catelogid = N''
                  OR EXISTS (
                      SELECT 1
                      FROM Tbl_Registration r2
                      WHERE (r2.Userid = q.Userid OR CAST(r2.Id AS VARCHAR(50)) = CAST(q.Userid AS VARCHAR(50)))
                        AND CAST(r2.Catelogid AS NVARCHAR(100)) = @Catelogid
                  )
              )
            """;

        try
        {
            await using var cmd = new SqlCommand(sql, connection);
            cmd.Parameters.AddWithValue("@Catelogid", catelogId ?? "");

            await using var rx = await cmd.ExecuteReaderAsync(ct);
            while (await rx.ReadAsync(ct))
            {
                var logid = Rdr(rx, "logid", "Logid");
                if (string.IsNullOrEmpty(logid) || seenLogIds.Contains(logid))
                    continue;
                seenLogIds.Add(logid);
                list2.Add(new
                {
                    Id = Rdr(rx, "Id"),
                    Username = Rdr(rx, "Username"),
                    Billdate = Rdr(rx, "Billdate"),
                    Type = Rdr(rx, "Type"),
                    Billno = Rdr(rx, "Salesquoteno"),
                    Customername = Rdr(rx, "Customername"),
                    Grand_total = Rdr(rx, "Grand_Total", "Grand_total"),
                    Currencyvalue = Rdr(rx, "Currencyname", "Currencyvalue"),
                    Editreason = Rdr(rx, "Editresaon", "Editreason"),
                    requesttype = Rdr(rx, "requesttype", "Requesttype"),
                    customerid = Rdr(rx, "Customerid"),
                    logid
                });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("approval-details-quote legacy edit/delete merge: " + ex.Message);
        }
    }

    public static async Task<IResult> Handle(HttpContext http, SqlConnection connection)
    {
        var list1 = new List<object>();
        var list2 = new List<object>();
        var salesbillapprovalcount = 0;
        var salesbillrequestcount = 0;

        var userid = (http.Request.Query["userid"].FirstOrDefault() ?? "").Trim();
        var catelogId = http.Request.Query["catelogId"].FirstOrDefault()
                        ?? http.Request.Query["catalogId"].FirstOrDefault();

        if (string.IsNullOrEmpty(userid))
            return Results.Ok(new { List1 = list1, List2 = list2, salesbillapprovalcount, salesbillrequestcount });

        try
        {
            await connection.OpenAsync();

            string? resolvedCatalog = string.IsNullOrWhiteSpace(catelogId) ? null : catelogId.Trim();
            if (string.IsNullOrEmpty(resolvedCatalog))
            {
                using (var catCmd = new SqlCommand(
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

            // Q9 / Q3: scope by catalog (Catelogid), not quote-owner Userid. Passing the manager's login as @Userid
            // makes many SPs return only rows where Salesquote.Userid = manager → empty approvals for staff quotes.
            const string useridOpenForCatalogScope = "";

            using (var cmd21 = new SqlCommand("Sp_Salesquote", connection))
            {
                cmd21.CommandType = CommandType.StoredProcedure;
                cmd21.Parameters.AddWithValue("@Id", 0);
                cmd21.Parameters.AddWithValue("@Userid", useridOpenForCatalogScope);
                cmd21.Parameters.AddWithValue("@Customerid", "");
                cmd21.Parameters.AddWithValue("@Billdate", "");
                cmd21.Parameters.AddWithValue("@Duedate", "");
                cmd21.Parameters.AddWithValue("@Salesquoteno", "");
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
                cmd21.Parameters.AddWithValue("@Managerapprovestatus", DBNull.Value);
                cmd21.Parameters.AddWithValue("@Status", "Active");
                cmd21.Parameters.AddWithValue("@Isdelete", 0);
                cmd21.Parameters.AddWithValue("@Type", "");
                cmd21.Parameters.AddWithValue("@Terms", "");
                cmd21.Parameters.AddWithValue("@Catelogid", resolvedCatalog);
                cmd21.Parameters.AddWithValue("@Contact", "");
                cmd21.Parameters.AddWithValue("@Phoneno", "");
                cmd21.Parameters.AddWithValue("@Shipping_address", "");
                cmd21.Parameters.AddWithValue("@Remarks", "");
                cmd21.Parameters.AddWithValue("@Salespersonname", "");
                cmd21.Parameters.AddWithValue("@Discounttype", "");
                cmd21.Parameters.AddWithValue("@Discountvalue", "");
                cmd21.Parameters.AddWithValue("@Discountamount", "");
                cmd21.Parameters.AddWithValue("@fromdate", "");
                cmd21.Parameters.AddWithValue("@todate", "");
                cmd21.Parameters.AddWithValue("@Packinglist_status", "");
                cmd21.Parameters.AddWithValue("@Query", 9);

                using var reader = await cmd21.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    list1.Add(new
                    {
                        Id = Rdr(reader, "Id"),
                        Username = Rdr(reader, "Username"),
                        Billdate = Rdr(reader, "Billdate"),
                        Type = Rdr(reader, "Type"),
                        Billno = Rdr(reader, "Salesquoteno"),
                        Customername = Rdr(reader, "Customername"),
                        Grand_total = Rdr(reader, "Grand_Total", "Grand_total"),
                        Currencyvalue = Rdr(reader, "Currencyname", "Currencyvalue"),
                        Managerapprovestatus = Rdr(reader, "Managerapprovestatus", "Managerapprovestatus")
                    });
                }
            }

            salesbillapprovalcount = list1.Count;

            using (var cmd4 = new SqlCommand("Sp_Salesquotelog", connection))
            {
                cmd4.CommandType = CommandType.StoredProcedure;
                cmd4.Parameters.AddWithValue("@Id", DBNull.Value);
                cmd4.Parameters.AddWithValue("@Customerid", "");
                cmd4.Parameters.AddWithValue("@Salesquoteid", "");
                cmd4.Parameters.AddWithValue("@Approveuserid", "");
                cmd4.Parameters.AddWithValue("@Editreason", "");
                cmd4.Parameters.AddWithValue("@Comments", "");
                cmd4.Parameters.AddWithValue("@Isdelete", "");
                cmd4.Parameters.AddWithValue("@Status", "Edit request sent,Delete request sent");
                cmd4.Parameters.AddWithValue("@Changeddate", "");
                cmd4.Parameters.AddWithValue("@Type", "Editrequest,Deleterequest");
                cmd4.Parameters.AddWithValue("@Userid", useridOpenForCatalogScope);
                cmd4.Parameters.AddWithValue("@Catelogid", resolvedCatalog);
                cmd4.Parameters.AddWithValue("@Approveddate", DBNull.Value);
                cmd4.Parameters.AddWithValue("@Query", 3);

                var seenLogIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                using var reader = await cmd4.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var lid = Rdr(reader, "logid", "Logid");
                    if (!string.IsNullOrEmpty(lid))
                        seenLogIds.Add(lid);
                    list2.Add(new
                    {
                        Id = Rdr(reader, "Id"),
                        Username = Rdr(reader, "Username"),
                        Billdate = Rdr(reader, "Billdate"),
                        Type = Rdr(reader, "Type"),
                        Billno = Rdr(reader, "Salesquoteno"),
                        Customername = Rdr(reader, "Customername"),
                        Grand_total = Rdr(reader, "Grand_Total", "Grand_total"),
                        Currencyvalue = Rdr(reader, "Currencyname", "Currencyvalue"),
                        Editreason = Rdr(reader, "Editresaon", "Editreason"),
                        requesttype = Rdr(reader, "requesttype", "Requesttype"),
                        customerid = Rdr(reader, "Customerid"),
                        logid = lid
                    });
                }

                await AppendLegacyPortalEditDeleteRowsAsync(connection, list2, seenLogIds, resolvedCatalog ?? "", http.RequestAborted);
            }

            salesbillrequestcount = list2.Count;

            return Results.Ok(new { List1 = list1, List2 = list2, salesbillapprovalcount, salesbillrequestcount });
        }
        catch (Exception ex)
        {
            Console.WriteLine("approval-details-quote: " + ex.Message);
            return Results.Ok(new { List1 = list1, List2 = list2, salesbillapprovalcount = 0, salesbillrequestcount = 0, error = ex.Message });
        }
    }
}

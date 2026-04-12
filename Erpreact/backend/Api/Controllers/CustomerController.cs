using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Globalization;
using System.Linq;
using QRCoder;

namespace api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomerController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;

        public CustomerController(IConfiguration configuration, IWebHostEnvironment environment)
        {
            _configuration = configuration;
            _environment = environment;
        }

        // GET: api/customer/salespeople
        [HttpGet("salespeople")]
        public IActionResult GetSalespeople()
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                List<Dictionary<string, object>> salespeople = new List<Dictionary<string, object>>();

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    // Query Tbl_Salesperson based on the columns provided by the user
                    string sql = "SELECT * FROM Tbl_Salesperson WHERE Isdelete = 0 AND Status = 'Active'";
                    using (SqlCommand cmd = new SqlCommand(sql, conn))
                    {
                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                Dictionary<string, object> person = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    person[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                }
                                salespeople.Add(person);
                            }
                        }
                    }
                }

                return Ok(new { success = true, data = salespeople });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
        // GET: api/customer/{id}/attachments
        [HttpGet("{id:int}/attachments")]
        public IActionResult GetAttachments(int id)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                List<Dictionary<string, object>> list = new List<Dictionary<string, object>>();

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    string sql = "SELECT * FROM Tbl_Customerattachment WHERE Customerid = @Cid AND Isdelete = 0";
                    using (SqlCommand cmd = new SqlCommand(sql, conn))
                    {
                        cmd.Parameters.AddWithValue("@Cid", id);
                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                var row = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                }
                                list.Add(row);
                            }
                        }
                    }
                }
                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET: api/customer/documents
        [HttpGet("documents")]
        public IActionResult GetCustomerDocuments()
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                List<Dictionary<string, object>> documents = new List<Dictionary<string, object>>();

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    string sql = "SELECT Id, Documentname FROM Tbl_Customerdocument WHERE Isdelete = 0";
                    using (SqlCommand cmd = new SqlCommand(sql, conn))
                    {
                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                documents.Add(new Dictionary<string, object>
                                {
                                    { "Id", reader.GetInt32(0) },
                                    { "Name", reader.GetString(1) }
                                });
                            }
                        }
                    }
                }

                return Ok(new { success = true, data = documents });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET: api/customer
        [HttpGet]
        public IActionResult GetAllCustomers([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string search = "")
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                List<Dictionary<string, object>> customers = new List<Dictionary<string, object>>();
                int totalCount = 0;

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    
                    // Base WHERE clause
                    string whereClause = "WHERE c.Isdelete = 0";
                    if (!string.IsNullOrEmpty(search))
                    {
                        whereClause += " AND (c.Customerdisplayname LIKE @Search OR c.Companyname LIKE @Search OR c.Email LIKE @Search OR c.Phonenumber LIKE @Search OR c.Mobilenumber LIKE @Search)";
                    }

                    // Get total count
                    string countSql = $@"SELECT COUNT(*) 
                                       FROM Tbl_Customer c 
                                       LEFT JOIN Tbl_Registration r ON c.Userid = r.Userid 
                                       {whereClause}";
                    using (SqlCommand countCmd = new SqlCommand(countSql, conn))
                    {
                        if (!string.IsNullOrEmpty(search))
                            countCmd.Parameters.AddWithValue("@Search", "%" + search + "%");
                        totalCount = (int)countCmd.ExecuteScalar();
                    }

                    // Get paginated data
                    string sql = $@"SELECT c.*, r.Firstname as Username 
                                 FROM Tbl_Customer c 
                                 LEFT JOIN Tbl_Registration r ON c.Userid = r.Userid 
                                 {whereClause}
                                 ORDER BY c.Id DESC
                                 OFFSET @Offset ROWS
                                 FETCH NEXT @PageSize ROWS ONLY";
                    
                    using (SqlCommand cmd = new SqlCommand(sql, conn))
                    {
                        cmd.Parameters.AddWithValue("@Offset", (page - 1) * pageSize);
                        cmd.Parameters.AddWithValue("@PageSize", pageSize);
                        if (!string.IsNullOrEmpty(search))
                            cmd.Parameters.AddWithValue("@Search", "%" + search + "%");

                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                Dictionary<string, object> customer = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    customer[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                }
                                customers.Add(customer);
                            }
                        }
                    }
                }

                return Ok(new { success = true, data = customers, totalCount = totalCount });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET: api/customer/{id}/salesbills — Tbl_Salesbill rows for customer (Isdelete = 0). Optional ?search= matches Billno / Newinvoiceno / Id (any date, not limited to recent 30).
        [HttpGet("{id:int}/salesbills")]
        public IActionResult GetCustomerSalesbills(int id, [FromQuery] string? search = null)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                var rows = new List<Dictionary<string, object>>();
                string custKey = id.ToString(CultureInfo.InvariantCulture);
                var searchTrim = string.IsNullOrWhiteSpace(search) ? null : search.Trim();
                var useSearch = !string.IsNullOrEmpty(searchTrim);

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    var selectList = @"
                        SELECT " + (useSearch ? "TOP (100) " : "") + @"
                            s.Id,
                            s.Billno,
                            s.Newinvoiceno,
                            s.Billdate,
                            s.Duedate,
                            s.Type,
                            s.Status,
                            s.Grand_total,
                            s.Conversion_amount,
                            ISNULL(NULLIF(LTRIM(RTRIM(custCu.CustCurCode)), N''),
                                ISNULL(NULLIF(LTRIM(RTRIM(cu.CurCode)), N''), LTRIM(RTRIM(ISNULL(CAST(s.Currency AS NVARCHAR(50)), N''))))) AS Currency,
                            s.Userid,
                            r.Firstname,
                            r.Lastname
                        FROM Tbl_Salesbill s
                        OUTER APPLY (
                            SELECT TOP 1 LTRIM(RTRIM(ISNULL(tc.Currency, N''))) AS CurCode
                            FROM Tbl_Currency tc
                            WHERE TRY_CAST(LTRIM(RTRIM(ISNULL(CAST(s.Currency AS NVARCHAR(50)), N''))) AS INT) IS NOT NULL
                              AND tc.Id = TRY_CAST(LTRIM(RTRIM(ISNULL(CAST(s.Currency AS NVARCHAR(50)), N''))) AS INT)
                        ) cu
                        OUTER APPLY (
                            SELECT TOP 1
                                ISNULL(NULLIF(LTRIM(RTRIM(tcCust.CurCode)), N''),
                                    LTRIM(RTRIM(ISNULL(CAST(cs.Currency AS NVARCHAR(50)), N'')))) AS CustCurCode
                            FROM Tbl_Customer cs
                            OUTER APPLY (
                                SELECT TOP 1 LTRIM(RTRIM(ISNULL(tc2.Currency, N''))) AS CurCode
                                FROM Tbl_Currency tc2
                                WHERE TRY_CAST(LTRIM(RTRIM(ISNULL(CAST(cs.Currency AS NVARCHAR(50)), N''))) AS INT) IS NOT NULL
                                  AND tc2.Id = TRY_CAST(LTRIM(RTRIM(ISNULL(CAST(cs.Currency AS NVARCHAR(50)), N''))) AS INT)
                            ) tcCust
                            WHERE LTRIM(RTRIM(ISNULL(CAST(s.Customerid AS NVARCHAR(50)), N''))) = LTRIM(RTRIM(CAST(cs.Id AS NVARCHAR(50))))
                              AND (cs.Isdelete IS NULL OR LTRIM(RTRIM(CAST(cs.Isdelete AS NVARCHAR(50)))) IN (N'', N'0') OR (TRY_CAST(cs.Isdelete AS INT) IS NOT NULL AND TRY_CAST(cs.Isdelete AS INT) = 0))
                        ) custCu
                        OUTER APPLY (
                            SELECT TOP 1 reg.Firstname, reg.Lastname
                            FROM Tbl_Registration reg
                            WHERE reg.Userid = s.Userid
                        ) r
                        WHERE LTRIM(RTRIM(ISNULL(CAST(s.Customerid AS NVARCHAR(50)), N''))) = @CustId
                          AND (
                                s.Isdelete IS NULL
                                OR LTRIM(RTRIM(CAST(s.Isdelete AS NVARCHAR(50)))) = N'0'
                                OR (TRY_CAST(s.Isdelete AS INT) IS NOT NULL AND TRY_CAST(s.Isdelete AS INT) = 0)
                              )";

                    string sql;
                    if (!useSearch)
                    {
                        sql = selectList + @"
                        ORDER BY s.Id DESC";
                    }
                    else
                    {
                        var idClause = int.TryParse(searchTrim, NumberStyles.Integer, CultureInfo.InvariantCulture, out _)
                            ? " OR s.Id = @BillId "
                            : "";
                        sql = selectList + @"
                          AND (
                                s.Billno LIKE @InvLike ESCAPE '\'
                                OR s.Newinvoiceno LIKE @InvLike ESCAPE '\'
                                " + idClause + @"
                              )
                        ORDER BY s.Id DESC";
                    }

                    using (SqlCommand cmd = new SqlCommand(sql, conn))
                    {
                        cmd.Parameters.AddWithValue("@CustId", custKey);
                        if (useSearch)
                        {
                            var likePattern = "%" + EscapeSqlLikePattern(searchTrim!) + "%";
                            cmd.Parameters.AddWithValue("@InvLike", likePattern);
                            if (int.TryParse(searchTrim, NumberStyles.Integer, CultureInfo.InvariantCulture, out var billId))
                                cmd.Parameters.AddWithValue("@BillId", billId);
                        }

                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                var row = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                }
                                rows.Add(row);
                            }
                        }
                    }
                }

                return Ok(new { success = true, data = rows });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>Escape %, _, [ for SQL LIKE; uses ESCAPE '\' in queries.</summary>
        private static string EscapeSqlLikePattern(string input)
        {
            if (string.IsNullOrEmpty(input)) return input;
            return input
                .Replace("\\", "\\\\")
                .Replace("%", "\\%")
                .Replace("_", "\\_")
                .Replace("[", "\\[");
        }

        /// <summary>
        /// Same columns as Sp_Salesbill Q4 but joins use TRY_CAST on the first segment when Terms or Salespersonname
        /// were saved as comma-separated lists (avoids "Conversion failed ... '9,4,10,6' to int" on read).
        /// </summary>
        private static Dictionary<string, object?>? TryReadSalesBillHeaderRelaxed(SqlConnection conn, int billId)
        {
            const string sql = """
                SELECT s.*,
                    p.Paymentterms AS Termsname,
                    ts.Salesperson,
                    tc.Warehouseid AS Warehouseid1
                FROM Tbl_Salesbill s
                LEFT JOIN Tbl_Paymentterms p ON p.Id = TRY_CAST(
                    CASE
                        WHEN NULLIF(LTRIM(RTRIM(ISNULL(CAST(s.Terms AS NVARCHAR(200)), N''))), N'') IS NULL THEN NULL
                        WHEN CHARINDEX(N',', LTRIM(RTRIM(CAST(s.Terms AS NVARCHAR(200))))) > 0
                            THEN LEFT(LTRIM(RTRIM(CAST(s.Terms AS NVARCHAR(200)))), CHARINDEX(N',', LTRIM(RTRIM(CAST(s.Terms AS NVARCHAR(200))))) - 1)
                        ELSE LTRIM(RTRIM(CAST(s.Terms AS NVARCHAR(200))))
                    END AS INT)
                LEFT JOIN Tbl_Salesperson ts ON ts.Id = TRY_CAST(
                    CASE
                        WHEN NULLIF(LTRIM(RTRIM(ISNULL(CAST(s.Salespersonname AS NVARCHAR(200)), N''))), N'') IS NULL THEN NULL
                        WHEN CHARINDEX(N',', LTRIM(RTRIM(CAST(s.Salespersonname AS NVARCHAR(200))))) > 0
                            THEN LEFT(LTRIM(RTRIM(CAST(s.Salespersonname AS NVARCHAR(200)))), CHARINDEX(N',', LTRIM(RTRIM(CAST(s.Salespersonname AS NVARCHAR(200))))) - 1)
                        ELSE LTRIM(RTRIM(CAST(s.Salespersonname AS NVARCHAR(200))))
                    END AS INT)
                LEFT JOIN Tbl_Customer tc ON tc.Id = s.Customerid
                WHERE s.Id = @Id
                """;

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@Id", billId);
            using var reader = cmd.ExecuteReader();
            if (!reader.Read())
                return null;
            return ReadCurrentRowAsDictionary(reader);
        }

        /// <summary>GET: api/customer/salesbill/{billId} — same data path as legacy Getcustomerbillsdetails: Sp_Salesbill @Query=4 + Sp_Salesbilldetails @Query=2.</summary>
        [HttpGet("salesbill/{billId:int}")]
        public IActionResult GetSalesBillDetail(int billId)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                Dictionary<string, object?>? header = null;

                using (var conn = new SqlConnection(connectionString))
                {
                    conn.Open();

                    try
                    {
                        using (var cmd = new SqlCommand("Sp_Salesbill", conn))
                        {
                            cmd.CommandType = CommandType.StoredProcedure;
                            AddSpSalesbillParametersForRead(cmd, billId, query: 4);
                            using var reader = cmd.ExecuteReader();
                            if (reader.Read())
                            {
                                header = ReadCurrentRowAsDictionary(reader);
                            }
                        }
                    }
                    catch (SqlException)
                    {
                        header = TryReadSalesBillHeaderRelaxed(conn, billId);
                    }

                    if (header == null || header.Count == 0)
                        return NotFound(new { success = false, message = "Sales bill not found." });

                    EnrichSalesBillHeaderCustomerAndCurrency(conn, header);

                    var lines = new List<Dictionary<string, object?>>();
                    using (var cmd2 = new SqlCommand("Sp_Salesbilldetails", conn))
                    {
                        cmd2.CommandType = CommandType.StoredProcedure;
                        AddSpSalesbilldetailsParametersForBillLines(cmd2, billId);
                        using var reader = cmd2.ExecuteReader();
                        while (reader.Read())
                        {
                            lines.Add(ReadCurrentRowAsDictionary(reader));
                        }
                    }

                    var qrCodeDataUrl = TryBuildInvoiceQrDataUrl(conn, billId);
                    var deductionCommission = TryReadDeductionCommissionForSalesBill(conn, billId);
                    return Ok(new { success = true, data = new { header, lines, qrCodeDataUrl, deductionCommission } });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>Customer bill commission / other charges (Tbl_Deductioncommission, Type = Sales).</summary>
        private static Dictionary<string, object?>? TryReadDeductionCommissionForSalesBill(SqlConnection conn, int billId)
        {
            const string sql = @"
                SELECT TOP 1
                    Deduction_amt,
                    Taxid,
                    Tax_amt,
                    Total_deduction,
                    Tax_type
                FROM Tbl_Deductioncommission
                WHERE LTRIM(RTRIM(CAST(Salesid AS NVARCHAR(50)))) = LTRIM(RTRIM(@Sid))
                  AND LTRIM(RTRIM(ISNULL(Type, N''))) = N'Sales'
                  AND (
                        Isdelete IS NULL
                        OR LTRIM(RTRIM(CAST(Isdelete AS NVARCHAR(50)))) IN (N'', N'0')
                        OR (TRY_CAST(Isdelete AS INT) IS NOT NULL AND TRY_CAST(Isdelete AS INT) = 0)
                      )
                ORDER BY Id DESC";

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@Sid", billId.ToString(CultureInfo.InvariantCulture));
            using var r = cmd.ExecuteReader();
            if (!r.Read())
                return null;

            var d = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            if (!r.IsDBNull(0))
                d["Deduction_amt"] = r.GetValue(0);
            if (!r.IsDBNull(1))
                d["Taxid"] = r.GetValue(1)?.ToString()?.Trim();
            if (!r.IsDBNull(2))
                d["Tax_amt"] = r.GetValue(2)?.ToString()?.Trim();
            if (!r.IsDBNull(3))
                d["Total_deduction"] = r.GetValue(3);
            if (!r.IsDBNull(4))
                d["Tax_type"] = r.GetValue(4)?.ToString()?.Trim();
            return d.Count > 0 ? d : null;
        }

        /// <summary>Soft-delete draft sales invoice only (Isdelete = 1). POSTed/finalized bills are rejected.</summary>
        [HttpDelete("salesbill/{billId:int}")]
        public IActionResult SoftDeleteCustomerSalesBill(int billId)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using var conn = new SqlConnection(connectionString);
                conn.Open();
                const string sql = @"
                    UPDATE Tbl_Salesbill
                    SET Isdelete = N'1'
                    WHERE Id = @Id
                      AND LOWER(LTRIM(RTRIM(ISNULL(Status, N'')))) = N'draft'
                      AND (
                            Isdelete IS NULL
                            OR LTRIM(RTRIM(CAST(Isdelete AS NVARCHAR(50)))) IN (N'', N'0')
                            OR (TRY_CAST(Isdelete AS INT) IS NOT NULL AND TRY_CAST(Isdelete AS INT) = 0)
                          )";
                using var cmd = new SqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@Id", billId);
                var n = cmd.ExecuteNonQuery();
                if (n == 0)
                    return BadRequest(new { success = false, message = "Invoice not found, not a draft, or already deleted." });
                return Ok(new { success = true, message = "Draft invoice deleted." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>Legacy GET /Sales/getstatussalesbill + owner id — Sp_Salesbill @Query=19 (status, billno) + Tbl_Salesbill.Userid. Optional period lock hook returns lockMessage when implemented.</summary>
        [HttpGet("salesbill/{billId:int}/edit-precheck")]
        public IActionResult GetSalesBillEditPrecheck(int billId)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using var conn = new SqlConnection(connectionString);
                conn.Open();

                string billUserid = "";
                using (var cmdUser = new SqlCommand(
                    "SELECT TOP 1 LTRIM(RTRIM(ISNULL(CAST(Userid AS NVARCHAR(100)), N''))) FROM Tbl_Salesbill WHERE Id = @Id",
                    conn))
                {
                    cmdUser.Parameters.AddWithValue("@Id", billId);
                    var o = cmdUser.ExecuteScalar();
                    billUserid = o?.ToString()?.Trim() ?? "";
                }

                var status = "";
                var billno = "";
                using (var cmd = new SqlCommand("Sp_Salesbill", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    AddSpSalesbillParametersForRead(cmd, billId, query: 19);
                    using var reader = cmd.ExecuteReader();
                    if (reader.Read())
                    {
                        if (reader.FieldCount > 0 && !reader.IsDBNull(0))
                            status = reader.GetValue(0)?.ToString()?.Trim() ?? "";
                        if (reader.FieldCount > 1 && !reader.IsDBNull(1))
                            billno = reader.GetValue(1)?.ToString()?.Trim() ?? "";
                    }
                }

                // Legacy transactionlockcheck(salesDate) — extend here if a period-lock SP is wired (empty = allowed).
                var lockMessage = "";

                return Ok(new { success = true, status, billno, billUserid, lockMessage });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>Legacy GET /Sales/getrcmdetails — RCM row for customer (Documentname = 1).</summary>
        [HttpGet("{id:int}/rma-attachment")]
        public IActionResult GetCustomerRmaAttachment(int id)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using var conn = new SqlConnection(connectionString);
                conn.Open();
                using var cmd = new SqlCommand(
                    "SELECT TOP 1 Attachment FROM Tbl_Customerattachment WHERE Customerid = @Customerid AND Documentname = @Documentname AND (Isdelete IS NULL OR LTRIM(RTRIM(CAST(Isdelete AS NVARCHAR(50)))) IN (N'', N'0') OR (TRY_CAST(Isdelete AS INT) IS NOT NULL AND TRY_CAST(Isdelete AS INT) = 0))",
                    conn);
                cmd.Parameters.AddWithValue("@Customerid", id.ToString(CultureInfo.InvariantCulture));
                cmd.Parameters.AddWithValue("@Documentname", 1);
                var o = cmd.ExecuteScalar();
                var rma = o == null || o == DBNull.Value ? "" : o.ToString()?.Trim() ?? "";
                return Ok(new { success = true, rma });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>Legacy Getcustomerbillsdetails → Sp_Invoicepdf @Query=6 + verify URL QR (same as MVC).</summary>
        private static string? TryBuildInvoiceQrDataUrl(SqlConnection conn, int billId)
        {
            try
            {
                var billKey = billId.ToString(CultureInfo.InvariantCulture);
                using var cmd = new SqlCommand("Sp_Invoicepdf", conn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Id", 0);
                cmd.Parameters.AddWithValue("@Salespurchaseid", billKey);
                cmd.Parameters.AddWithValue("@Uniqueid", "");
                cmd.Parameters.AddWithValue("@Pdf", "");
                cmd.Parameters.AddWithValue("@Status", "");
                cmd.Parameters.AddWithValue("@Isdelete", "0");
                cmd.Parameters.AddWithValue("@Type", "Invoice");
                cmd.Parameters.AddWithValue("@Query", 6);

                using var reader = cmd.ExecuteReader();
                if (!reader.Read())
                    return null;

                var uid = reader["Uniqueid"]?.ToString()?.Trim();
                if (string.IsNullOrEmpty(uid))
                    return null;

                var typ = reader["Type"]?.ToString()?.Trim();
                if (string.IsNullOrEmpty(typ))
                    typ = "Invoice";

                var url = "https://asasgt.com/invoiceverify?uid=" + Uri.EscapeDataString(uid) + "&type=" + Uri.EscapeDataString(typ);
                using var gen = new QRCodeGenerator();
                var data = gen.CreateQrCode(url, QRCodeGenerator.ECCLevel.Q);
                var png = new PngByteQRCode(data);
                var bytes = png.GetGraphic(20);
                return "data:image/png;base64," + Convert.ToBase64String(bytes);
            }
            catch
            {
                return null;
            }
        }

        /// <summary>Parameter set aligned with legacy MVC Getcustomerbillsdetails → Sp_Salesbill (e.g. Q4 bill header).</summary>
        private static void AddSpSalesbillParametersForRead(SqlCommand cmd, int billId, int query)
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

        /// <summary>Legacy Getcustomerbillsdetails → Sp_Salesbilldetails @Query=2 (item/set/combo lines).</summary>
        private static void AddSpSalesbilldetailsParametersForBillLines(SqlCommand cmd, int billId)
        {
            cmd.Parameters.AddWithValue("@Id", 0);
            cmd.Parameters.AddWithValue("@Userid", "");
            cmd.Parameters.AddWithValue("@Billid", billId.ToString(CultureInfo.InvariantCulture));
            cmd.Parameters.AddWithValue("@Itemid", "");
            cmd.Parameters.AddWithValue("@Qty", "");
            cmd.Parameters.AddWithValue("@Amount", "");
            cmd.Parameters.AddWithValue("@Vat", "");
            cmd.Parameters.AddWithValue("@Vat_id", "");
            cmd.Parameters.AddWithValue("@Total", "");
            cmd.Parameters.AddWithValue("@Status", "");
            cmd.Parameters.AddWithValue("@Isdelete", "");
            cmd.Parameters.AddWithValue("@Query", 2);
            cmd.Parameters.AddWithValue("@Type", DBNull.Value);
            cmd.Parameters.AddWithValue("@Customerid", DBNull.Value);
            cmd.Parameters.AddWithValue("@Billno", DBNull.Value);
        }

        private static Dictionary<string, object?> ReadCurrentRowAsDictionary(SqlDataReader reader)
        {
            var row = new Dictionary<string, object?>();
            for (int i = 0; i < reader.FieldCount; i++)
                row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
            return row;
        }

        /// <summary>Resolve Tbl_Currency.Currency code from a bill/customer field that may be Id or literal code.</summary>
        private static string? ResolveCurrencyDisplayCode(SqlConnection conn, string? rawKey)
        {
            if (string.IsNullOrWhiteSpace(rawKey)) return null;
            var key = rawKey.Trim();
            using var cmd = new SqlCommand(
                "SELECT TOP 1 Currency FROM Tbl_Currency WHERE LTRIM(RTRIM(CAST(Id AS NVARCHAR(50)))) = LTRIM(RTRIM(@Cid))",
                conn);
            cmd.Parameters.AddWithValue("@Cid", key);
            var o = cmd.ExecuteScalar();
            if (o != null && o != DBNull.Value)
            {
                var s = o.ToString()?.Trim();
                if (!string.IsNullOrEmpty(s)) return s;
            }
            return key;
        }

        /// <summary>Sp_Salesbill Q4 does not return customer display name; add names + currency code for the React mapper.</summary>
        private static void EnrichSalesBillHeaderCustomerAndCurrency(SqlConnection conn, Dictionary<string, object?> header)
        {
            static string? DictStr(Dictionary<string, object?> d, string key)
            {
                foreach (var kv in d)
                {
                    if (string.Equals(kv.Key, key, StringComparison.OrdinalIgnoreCase))
                        return kv.Value?.ToString()?.Trim();
                }
                return null;
            }

            string? customerCurrencyRaw = null;

            var custKey = DictStr(header, "Customerid");
            if (!string.IsNullOrEmpty(custKey) && int.TryParse(custKey, NumberStyles.Integer, CultureInfo.InvariantCulture, out var cid))
            {
                static bool HeaderStringBlank(Dictionary<string, object?> h, string key)
                {
                    foreach (var kv in h)
                    {
                        if (!string.Equals(kv.Key, key, StringComparison.OrdinalIgnoreCase))
                            continue;
                        var s = kv.Value?.ToString()?.Trim();
                        return string.IsNullOrEmpty(s) || string.Equals(s, "NULL", StringComparison.OrdinalIgnoreCase);
                    }
                    return true;
                }

                static void SetHeaderIfBlank(Dictionary<string, object?> h, string key, string? value)
                {
                    if (string.IsNullOrWhiteSpace(value) || string.Equals(value.Trim(), "NULL", StringComparison.OrdinalIgnoreCase))
                        return;
                    if (!HeaderStringBlank(h, key))
                        return;
                    h[key] = value.Trim();
                }

                using var cmd = new SqlCommand(
                    """
                    SELECT TOP 1
                        Customerdisplayname, Companyname, Currency,
                        Email, Phonenumber, Firstname, Lastname,
                        Streetaddress1, Streetaddress2, City, Province, Country
                    FROM Tbl_Customer
                    WHERE Id = @Id
                      AND (Isdelete IS NULL OR LTRIM(RTRIM(CAST(Isdelete AS NVARCHAR(50)))) IN (N'', N'0')
                           OR (TRY_CAST(Isdelete AS INT) IS NOT NULL AND TRY_CAST(Isdelete AS INT) = 0))
                    """,
                    conn);
                cmd.Parameters.AddWithValue("@Id", cid);
                using var r = cmd.ExecuteReader();
                if (r.Read())
                {
                    if (!header.ContainsKey("Customerdisplayname") || header["Customerdisplayname"] == null)
                        header["Customerdisplayname"] = r.IsDBNull(0) ? null : r.GetValue(0);
                    if (!header.ContainsKey("Companyname") || header["Companyname"] == null)
                        header["Companyname"] = r.IsDBNull(1) ? null : r.GetValue(1);
                    if (!r.IsDBNull(2))
                        customerCurrencyRaw = r.GetValue(2)?.ToString()?.Trim();

                    var email = r.IsDBNull(3) ? null : r.GetValue(3)?.ToString()?.Trim();
                    var phone = r.IsDBNull(4) ? null : r.GetValue(4)?.ToString()?.Trim();
                    var fn = r.IsDBNull(5) ? "" : r.GetValue(5)?.ToString()?.Trim() ?? "";
                    var ln = r.IsDBNull(6) ? "" : r.GetValue(6)?.ToString()?.Trim() ?? "";
                    var sa1 = r.IsDBNull(7) ? null : r.GetValue(7)?.ToString()?.Trim();
                    var sa2 = r.IsDBNull(8) ? null : r.GetValue(8)?.ToString()?.Trim();
                    var city = r.IsDBNull(9) ? null : r.GetValue(9)?.ToString()?.Trim();
                    var prov = r.IsDBNull(10) ? null : r.GetValue(10)?.ToString()?.Trim();
                    var country = r.IsDBNull(11) ? null : r.GetValue(11)?.ToString()?.Trim();

                    SetHeaderIfBlank(header, "Email", email);
                    SetHeaderIfBlank(header, "Phoneno", phone);
                    var contact = $"{fn} {ln}".Trim();
                    SetHeaderIfBlank(header, "Contact", string.IsNullOrEmpty(contact) ? null : contact);

                    if (HeaderStringBlank(header, "Billing_address"))
                    {
                        var parts = new List<string>();
                        void AddPart(string? p)
                        {
                            if (string.IsNullOrWhiteSpace(p) || string.Equals(p.Trim(), "NULL", StringComparison.OrdinalIgnoreCase))
                                return;
                            parts.Add(p.Trim());
                        }
                        AddPart(sa1);
                        AddPart(sa2);
                        AddPart(city);
                        AddPart(prov);
                        AddPart(country);
                        if (parts.Count > 0)
                            header["Billing_address"] = string.Join(", ", parts);
                    }
                }
            }

            var curKey = DictStr(header, "Currency");
            var billCode = ResolveCurrencyDisplayCode(conn, curKey);
            if (!string.IsNullOrEmpty(billCode))
                header["CurrencyCode"] = billCode;

            var custCode = ResolveCurrencyDisplayCode(conn, customerCurrencyRaw);
            if (!string.IsNullOrEmpty(custCode))
                header["CurrencyCode"] = custCode;
        }

        // GET: api/customer/{id}
        [HttpGet("{id:int}")]
        public IActionResult GetCustomerById(int id)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                Dictionary<string, object> customer = null;

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    using (SqlCommand cmd = new SqlCommand("Sp_Customer", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", id);
                        cmd.Parameters.AddWithValue("@Query", 4); // SELECT logic
                        // Need to provide dummy values for other params if SP expects them, 
                        // but usually @Id and @Query are enough if SP handles nulls. 
                        // Based on user provided SP, it filters by Isdelete=0 implicitly in some blocks?
                        // Actually the user SP Query=4 logic is:
                        /*
                        SELECT * 
                        FROM Tbl_Customer
                        INNER JOIN Tbl_Registration
                            ON Tbl_Registration.Userid = Tbl_Customer.Userid 
                            AND (Tbl_Customer.Isshared = 1 OR Tbl_Registration.Catelogid IN (SELECT value FROM dbo.SplitString('1,2', ',')))
                        WHERE Tbl_Customer.Isdelete = 0
                            AND (Tbl_Customer.Isshared = 1 OR Tbl_Registration.Catelogid IN (SELECT value FROM dbo.SplitString(@Catelogid, ',')))
                        */
                        // It seems Query 4 requires @Catelogid. 
                        // Let's use flexible SELECT for ID lookup if possible, or pass catalogid.
                        // Since I am generic here, I'll try to just select by ID directly with SQL if SP is restrictive, 
                        // OR assuming @Catelogid is optional/handled. The SP provided shows it uses @Catelogid in Query=4.
                        // I might need a specific 'GetById' query in SP or use direct SQL here for simplicity/safety like fetching All.
                        
                        // For safety, let's use direct SQL to get by ID to avoid SP complexity with CatalogId for now
                    }
                    
                    // Direct SQL for single item
                    string sql = "SELECT * FROM Tbl_Customer WHERE Id = @Id AND Isdelete = 0";
                    using (SqlCommand cmd = new SqlCommand(sql, conn))
                    {
                        cmd.Parameters.AddWithValue("@Id", id);
                         using (SqlDataReader reader = cmd.ExecuteReader())
                         {
                             if (reader.Read())
                             {
                                 customer = new Dictionary<string, object>();
                                 for (int i = 0; i < reader.FieldCount; i++)
                                 {
                                     customer[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                 }
                             }
                         }
                    }
                }

                if (customer != null)
                {
                    return Ok(new { success = true, data = customer });
                }
                else
                {
                    return NotFound(new { success = false, message = "Customer not found" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET: api/customer/by-catalog/{catelogid}
        [HttpGet("by-catalog/{catelogid}")]
        public IActionResult GetCustomersByCatalog(string catelogid, [FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string search = "")
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                List<Dictionary<string, object>> customers = new List<Dictionary<string, object>>();
                int totalCount = 0;

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    
                    // Base WHERE clause - Supports multiple CatelogIds via SplitString if provided
                    string whereClause = "WHERE c.Isdelete = 0 AND (c.Isshared = 1 OR r.Catelogid IN (SELECT value FROM dbo.SplitString(@Catelogid, ',')))";
                    if (!string.IsNullOrEmpty(search))
                    {
                        whereClause += " AND (c.Customerdisplayname LIKE @Search OR c.Companyname LIKE @Search OR c.Email LIKE @Search OR c.Phonenumber LIKE @Search OR c.Mobilenumber LIKE @Search)";
                    }

                    // Get total count
                    string countSql = $@"SELECT COUNT(*) 
                                       FROM Tbl_Customer c 
                                       LEFT JOIN Tbl_Registration r ON c.Userid = r.Userid 
                                       {whereClause}";
                    using (SqlCommand countCmd = new SqlCommand(countSql, conn))
                    {
                        countCmd.Parameters.AddWithValue("@Catelogid", catelogid);
                        if (!string.IsNullOrEmpty(search))
                            countCmd.Parameters.AddWithValue("@Search", "%" + search + "%");
                        totalCount = (int)countCmd.ExecuteScalar();
                    }

                    // Get paginated data
                    string sql = $@"SELECT c.*, r.Firstname as Username 
                                 FROM Tbl_Customer c 
                                 LEFT JOIN Tbl_Registration r ON c.Userid = r.Userid 
                                 {whereClause}
                                 ORDER BY c.Id DESC
                                 OFFSET @Offset ROWS
                                 FETCH NEXT @PageSize ROWS ONLY";
                    
                    using (SqlCommand cmd = new SqlCommand(sql, conn))
                    {
                        cmd.Parameters.AddWithValue("@Catelogid", catelogid);
                        cmd.Parameters.AddWithValue("@Offset", (page - 1) * pageSize);
                        cmd.Parameters.AddWithValue("@PageSize", pageSize);
                        if (!string.IsNullOrEmpty(search))
                            cmd.Parameters.AddWithValue("@Search", "%" + search + "%");

                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                Dictionary<string, object> customer = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    customer[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                }
                                customers.Add(customer);
                            }
                        }
                    }
                }

                return Ok(new { success = true, data = customers, totalCount = totalCount });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: api/customer
        [HttpPost]
        public async Task<IActionResult> CreateCustomer()
        {
            if (!Request.HasFormContentType)
            {
                return BadRequest(new { success = false, message = "Form-data expected" });
            }

            var form = await Request.ReadFormAsync();
            var modelJson = form["model"].FirstOrDefault();
            if (string.IsNullOrEmpty(modelJson))
                return BadRequest(new { success = false, message = "No model data found" });

            var model = Newtonsoft.Json.JsonConvert.DeserializeObject<CustomerModel>(modelJson);
            
            string connectionString = _configuration.GetConnectionString("DefaultConnection");
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                using (SqlTransaction transaction = conn.BeginTransaction())
                {
                    try
                    {
                        int insertedId = 0;
                        using (SqlCommand cmd = new SqlCommand("Sp_Customer", conn, transaction))
                        {
                            cmd.CommandType = CommandType.StoredProcedure;
                            cmd.Parameters.AddWithValue("@Query", 1); // INSERT
                            AddCustomerParameters(cmd, model);
                            SqlParameter outputParam = new SqlParameter("@InsertedId", SqlDbType.Int) { Direction = ParameterDirection.Output };
                            cmd.Parameters.Add(outputParam);
                            cmd.ExecuteNonQuery();
                            insertedId = outputParam.Value != DBNull.Value ? (int)outputParam.Value : 0;
                        }

                        // Handle Attachments
                        await SaveAttachments(conn, transaction, insertedId, form, model);

                        transaction.Commit();
                        return Ok(new { success = true, message = "Customer created successfully", id = insertedId });
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        return StatusCode(500, new { success = false, message = ex.Message });
                    }
                }
            }
        }

        // PUT: api/customer/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCustomer(int id)
        {
            if (!Request.HasFormContentType)
            {
                return BadRequest(new { success = false, message = "Form-data expected" });
            }

            var form = await Request.ReadFormAsync();
            var modelJson = form["model"].FirstOrDefault();
            if (string.IsNullOrEmpty(modelJson))
                return BadRequest(new { success = false, message = "No model data found" });

            var model = Newtonsoft.Json.JsonConvert.DeserializeObject<CustomerModel>(modelJson);

            string connectionString = _configuration.GetConnectionString("DefaultConnection");
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                using (SqlTransaction transaction = conn.BeginTransaction())
                {
                    try
                    {
                        using (SqlCommand cmd = new SqlCommand("Sp_Customer", conn, transaction))
                        {
                            cmd.CommandType = CommandType.StoredProcedure;
                            cmd.Parameters.AddWithValue("@Query", 2); // UPDATE
                            cmd.Parameters.AddWithValue("@Id", id);
                            AddCustomerParameters(cmd, model);
                            SqlParameter outputParam = new SqlParameter("@InsertedId", SqlDbType.Int) { Direction = ParameterDirection.Output };
                            cmd.Parameters.Add(outputParam);
                            cmd.ExecuteNonQuery();
                        }

                        // Handle Attachments
                        await SaveAttachments(conn, transaction, id, form, model);

                        transaction.Commit();
                        return Ok(new { success = true, message = "Customer updated successfully" });
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        return StatusCode(500, new { success = false, message = ex.Message });
                    }
                }
            }
        }

        // DELETE: api/customer/{id}
        [HttpDelete("{id}")]
        public IActionResult DeleteCustomer(int id)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    using (SqlCommand cmd = new SqlCommand("Sp_Customer", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Id", id);
                        cmd.Parameters.AddWithValue("@Isdelete", "1");
                        cmd.Parameters.AddWithValue("@Query", 3); // DELETE
                        
                        // Add required OUTPUT param to avoid error
                        SqlParameter outputParam = new SqlParameter("@InsertedId", SqlDbType.Int)
                        {
                            Direction = ParameterDirection.Output
                        };
                        cmd.Parameters.Add(outputParam);

                        cmd.ExecuteNonQuery();
                    }
                }

                return Ok(new { success = true, message = "Customer deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        private async Task SaveAttachments(SqlConnection conn, SqlTransaction trans, int customerId, IFormCollection form, CustomerModel model)
        {
            var attachmentRowsJson = form["attachments"].FirstOrDefault();
            if (string.IsNullOrEmpty(attachmentRowsJson)) return;

            var rows = Newtonsoft.Json.JsonConvert.DeserializeObject<List<dynamic>>(attachmentRowsJson);
            if (rows == null) return;

            // Delete existing attachments for this customer to avoid duplicates 
            // (Standard approach for simple nested collections)
            string deleteSql = "DELETE FROM Tbl_Customerattachment WHERE Customerid = @Cid";
            using (SqlCommand delCmd = new SqlCommand(deleteSql, conn, trans))
            {
                delCmd.Parameters.AddWithValue("@Cid", customerId);
                delCmd.ExecuteNonQuery();
            }

            string uploadPath = Path.Combine(_environment.WebRootPath, "Content", "images", "Salesbillattach");
            if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

            foreach (var row in rows)
            {
                string rowId = row.id.ToString();
                string fileName = row.file?.ToString();
                string dbPath = "";

                // Check if a new file was uploaded for this row
                var file = form.Files.GetFile($"file_{rowId}");
                if (file != null && file.Length > 0)
                {
                    string uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
                    string filePath = Path.Combine(uploadPath, uniqueFileName);
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }
                    dbPath = $"/Content/images/Salesbillattach/{uniqueFileName}";
                }
                else
                {
                    // Existing file path string (don't prefix with API_URL here, keep as relative path for DB)
                    dbPath = fileName ?? "";
                }
                
                if (string.IsNullOrEmpty(dbPath) && string.IsNullOrEmpty(row.document?.ToString())) continue;

                // Insert into Tbl_Customerattachment
                string sql = @"INSERT INTO Tbl_Customerattachment (Customerid, Documentname, Attachment, Expirydate, Isdelete)
                               VALUES (@Cid, @Doc, @Att, @Exp, 0)";
                
                using (SqlCommand cmd = new SqlCommand(sql, conn, trans))
                {
                    cmd.Parameters.AddWithValue("@Cid", customerId);
                    cmd.Parameters.AddWithValue("@Doc", row.document?.ToString() ?? "");
                    cmd.Parameters.AddWithValue("@Att", dbPath);
                    cmd.Parameters.AddWithValue("@Exp", string.IsNullOrEmpty(row.expiryDate?.ToString()) ? (object)DBNull.Value : row.expiryDate.ToString());
                    cmd.ExecuteNonQuery();
                }
            }
        }

        private void AddCustomerParameters(SqlCommand cmd, CustomerModel model)
        {
            cmd.Parameters.AddWithValue("@Userid", model.userid ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Currency", model.currency ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Title", model.title ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Firstname", model.firstname ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Middlename", model.middlename ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Lastname", model.lastname ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Suffix", model.suffix ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Customerdisplayname", model.customerdisplayname ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Companyname", model.companyname ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Email", model.email ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Phonenumber", model.phonenumber ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Mobilenumber", model.mobilenumber ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Fax", model.fax ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Other", model.other ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Website", model.website ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Streetaddress1", model.streetaddress1 ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Streetaddress2", model.streetaddress2 ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@City", model.city ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Province", model.province ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Postalcode", model.postalcode ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Country", model.country ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Notes", model.notes ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Attachments", model.attachments ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Paymentmethod", model.paymentmethod ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Terms", model.terms ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Deliveryoption", model.deliveryoption ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Language", model.language ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Taxes", model.taxes ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Chartofaccountsid", model.chartofaccountsid ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Openingbalance", model.openingbalance ?? 0);
            cmd.Parameters.AddWithValue("@Asof", model.asof ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Isdelete", "0");
            cmd.Parameters.AddWithValue("@Status", model.status ?? "Active");
            cmd.Parameters.AddWithValue("@Warehouseid", model.warehouseid ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Isshared", model.isshared ?? 1); // Default to 1 (shared) or 0? user SP implies "Isshared" logic.
            cmd.Parameters.AddWithValue("@Customer_category", model.customer_category ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Iscommission", model.iscommission ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Expenseaccount", model.expenseaccount ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Isreturncharges", model.isreturncharges ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Expenseaccountreturncharges", model.expenseaccountreturncharges ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Packinglist_enabled", model.packinglist_enabled ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Salespersonid", model.salespersonid ?? (object)DBNull.Value);
            // Catelogid not in Insert/Update part of SP provided by user, only in Select? 
            // Wait, query 1 insert does not list @Catelogid in the INSERT statement provided in user prompt.
            // "VALUES (..., @Packinglist_enabled, @Salespersonid)"
            // So we don't pass Catelogid to Insert/Update.
        }

        [HttpGet("chartofaccountscategory")]
        public IActionResult GetChartOfAccountsCategory()
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                List<Dictionary<string, object>> accounts = new List<Dictionary<string, object>>();

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    using (SqlCommand cmd = new SqlCommand("Sp_Chartofaccounts", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@Query", 7);
                        cmd.Parameters.AddWithValue("@Isdelete", "0");
                        cmd.Parameters.AddWithValue("@Status", "Active");
                        
                        // Add other required params with empty values to avoid SP errors if not null-handled
                        cmd.Parameters.AddWithValue("@Id", "");
                        cmd.Parameters.AddWithValue("@Account_typeid", "");
                        cmd.Parameters.AddWithValue("@Detail_typeid", "");
                        cmd.Parameters.AddWithValue("@Name", "");
                        cmd.Parameters.AddWithValue("@Description", "");
                        cmd.Parameters.AddWithValue("@Currency", "");
                        cmd.Parameters.AddWithValue("@Is_subaccount", "");
                        cmd.Parameters.AddWithValue("@Subnameid", "");
                        cmd.Parameters.AddWithValue("@Vatcode", "");
                        cmd.Parameters.AddWithValue("@Balance", "");
                        cmd.Parameters.AddWithValue("@Asof", "");
                        cmd.Parameters.AddWithValue("@Type", "");
                        cmd.Parameters.AddWithValue("@Acc_type", "");

                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                accounts.Add(new Dictionary<string, object>
                                {
                                    { "Id", reader["Id"] },
                                    { "Name", reader["Name"] },
                                    { "Accounttype", reader["Accounttype"] }
                                });
                            }
                        }
                    }
                }

                return Ok(new { success = true, data = accounts });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>Batch opening balances for customer-view sidebar (same logic as GetOpeningbalance).</summary>
        [HttpPost("opening-balances")]
        public IActionResult PostOpeningBalances([FromQuery] string? userid, [FromBody] OpeningBalancesRequest? body)
        {
            if (string.IsNullOrWhiteSpace(userid))
                return BadRequest(new { success = false, message = "userid is required" });

            var rawIds = body?.CustomerIds;
            if (rawIds == null || rawIds.Length == 0)
                return Ok(new { success = true, balances = new Dictionary<string, object>() });

            const int maxIds = 2000;
            if (rawIds.Length > maxIds)
                return BadRequest(new { success = false, message = $"At most {maxIds} customer ids per request" });

            try
            {
                var cs = _configuration.GetConnectionString("DefaultConnection");
                using var con = new SqlConnection(cs);
                con.Open();
                using var tx = con.BeginTransaction();

                var catelogId = ResolveCatelogId(con, tx, userid.Trim());
                var decPlaces = ResolveDecimalPlaces(con, tx, userid.Trim());

                var balances = new Dictionary<string, object>();
                foreach (var cid in rawIds.Distinct())
                {
                    if (cid <= 0) continue;
                    var (sum, currency) = ComputeOpeningBalance(con, tx, cid, catelogId, decPlaces);
                    balances[cid.ToString(CultureInfo.InvariantCulture)] = new { sum, currency };
                }

                tx.Commit();
                return Ok(new { success = true, balances });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>Legacy GetOpeningbalance — Sp_Salesbill @Query=8 (same as acc.customerbalance).</summary>
        [HttpGet("GetOpeningbalance")]
        public IActionResult GetOpeningbalance([FromQuery] string? customerid, [FromQuery] string? userid)
        {
            if (string.IsNullOrWhiteSpace(customerid) || !int.TryParse(customerid.Trim(), out var cid))
                return BadRequest(new { message = "customerid is required" });
            if (string.IsNullOrWhiteSpace(userid))
                return BadRequest(new { message = "userid is required" });

            try
            {
                var cs = _configuration.GetConnectionString("DefaultConnection");
                using var con = new SqlConnection(cs);
                con.Open();
                using var tx = con.BeginTransaction();

                var catelogId = ResolveCatelogId(con, tx, userid.Trim());
                var decPlaces = ResolveDecimalPlaces(con, tx, userid.Trim());
                var (sum, currency) = ComputeOpeningBalance(con, tx, cid, catelogId, decPlaces);

                tx.Commit();
                return Ok(new { sum, currency });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>Legacy GetCustomeroverdue — Sp_Salesbill @Query=11 (same as acc.totalCustomerOverdue; row [0]=currency, [1]=totalbills, [2]=overdue).</summary>
        [HttpGet("GetCustomeroverdue")]
        public IActionResult GetCustomeroverdue([FromQuery] string? customerid, [FromQuery] string? userid)
        {
            if (string.IsNullOrWhiteSpace(customerid) || !int.TryParse(customerid.Trim(), out var cid))
                return BadRequest(new { message = "customerid is required" });
            if (string.IsNullOrWhiteSpace(userid))
                return BadRequest(new { message = "userid is required" });

            try
            {
                var cs = _configuration.GetConnectionString("DefaultConnection");
                using var con = new SqlConnection(cs);
                con.Open();
                using var tx = con.BeginTransaction();

                var catelogId = ResolveCatelogId(con, tx, userid.Trim());
                var decPlaces = ResolveDecimalPlaces(con, tx, userid.Trim());

                var customeridStr = cid.ToString(CultureInfo.InvariantCulture);
                // Legacy passed @Id=customerid and @Customerid=""; Sp_Salesbill in DB filters on @Customerid — pass customer id there so Q11 returns data.
                // Q11 can throw (e.g. Duedate varchar vs GETDATE(), SplitString(@Catelogid), bad Grand_total) — do not fail the whole customer view.
                DataTable dt;
                try
                {
                    dt = ExecuteSpSalesbillBalance(con, tx, customeridStr, catelogId, query: 11, idInt: cid, customeridParam: customeridStr);
                }
                catch (SqlException)
                {
                    dt = new DataTable();
                }

                string currency;
                string sum;

                if (dt.Rows.Count > 0 && TryReadOverdueRow(dt.Rows[0], out var overdueRaw, out var curRaw))
                {
                    currency = curRaw ?? "";
                    var totalcustomeroverdue = overdueRaw ?? "";
                    if (!string.IsNullOrWhiteSpace(totalcustomeroverdue))
                    {
                        var normalized = totalcustomeroverdue.Replace(",", "", StringComparison.Ordinal).Trim();
                        if (decimal.TryParse(normalized, NumberStyles.Any, CultureInfo.InvariantCulture, out var overdueDec))
                            sum = overdueDec.ToString("N" + decPlaces, CultureInfo.InvariantCulture);
                        else
                            sum = totalcustomeroverdue;
                    }
                    else
                        sum = (0m).ToString("N" + decPlaces, CultureInfo.InvariantCulture);
                }
                else
                {
                    currency = "";
                    sum = "";
                }

                if (string.IsNullOrWhiteSpace(currency))
                {
                    using var curCmd = new SqlCommand("SELECT TOP 1 Currency FROM Tbl_Customer WHERE Id = @Id", con, tx);
                    curCmd.Parameters.AddWithValue("@Id", cid);
                    var c = curCmd.ExecuteScalar();
                    currency = c?.ToString() ?? "AED";
                }

                if (string.IsNullOrWhiteSpace(sum))
                    sum = (0m).ToString("N" + decPlaces, CultureInfo.InvariantCulture);

                tx.Commit();
                return Ok(new { sum, currency });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        private static (string sum, string currency) ComputeOpeningBalance(
            SqlConnection con,
            SqlTransaction tx,
            int cid,
            string catelogId,
            int decPlaces)
        {
            var inv = CultureInfo.InvariantCulture;
            var customeridStr = cid.ToString(inv);
            using var dt = ExecuteSpSalesbillBalance(con, tx, customeridStr, catelogId, query: 8, idInt: 0, customeridParam: customeridStr);

            decimal balance = 0m;
            string currency = "";

            if (dt.Rows.Count > 0)
            {
                foreach (DataRow row in dt.Rows)
                {
                    var amtObj = row.Table.Columns.Contains("Amount") ? row["Amount"] : null;
                    if (amtObj != null && amtObj != DBNull.Value)
                        balance += Convert.ToDecimal(amtObj, inv);
                }
                currency = dt.Rows[0].Table.Columns.Contains("Currency")
                    ? dt.Rows[0]["Currency"]?.ToString() ?? ""
                    : "";
            }

            if (string.IsNullOrWhiteSpace(currency))
            {
                using var curCmd = new SqlCommand("SELECT TOP 1 Currency FROM Tbl_Customer WHERE Id = @Id", con, tx);
                curCmd.Parameters.AddWithValue("@Id", cid);
                var c = curCmd.ExecuteScalar();
                currency = c?.ToString() ?? "AED";
            }

            var sum = balance.ToString("N" + decPlaces, inv);
            return (sum, currency);
        }

        /// <summary>Sp_Salesbill with parameter set aligned to legacy MVC customerbalance / totalCustomerOverdue calls.</summary>
        /// <summary>
        /// Sp_Salesbill @Query=11 returns: Currency, TotalBillCount, Amount (outstanding), Amount1, Amount2, Customerid — names vary; read safely.
        /// </summary>
        private static bool TryReadOverdueRow(DataRow row, out string? overdueAmount, out string? currencyCode)
        {
            overdueAmount = null;
            currencyCode = null;
            if (row == null || row.Table.Columns.Count == 0)
                return false;

            static string? Cell(DataRow r, params string[] names)
            {
                foreach (DataColumn col in r.Table.Columns)
                {
                    foreach (var n in names)
                    {
                        if (!string.Equals(col.ColumnName, n, StringComparison.OrdinalIgnoreCase))
                            continue;
                        var v = r[col];
                        if (v == null || v == DBNull.Value)
                            continue;
                        var s = v.ToString()?.Trim();
                        if (!string.IsNullOrEmpty(s))
                            return s;
                    }
                }
                return null;
            }

            currencyCode = Cell(row, "Currency", "currency");
            overdueAmount = Cell(row, "Amount", "amount");
            if (string.IsNullOrEmpty(overdueAmount) && row.Table.Columns.Count > 2)
                overdueAmount = row[2]?.ToString()?.Trim();
            if (string.IsNullOrEmpty(currencyCode) && row.Table.Columns.Count > 0)
                currencyCode = row[0]?.ToString()?.Trim();

            return !string.IsNullOrEmpty(overdueAmount) || !string.IsNullOrEmpty(currencyCode);
        }

        private static DataTable ExecuteSpSalesbillBalance(
            SqlConnection con,
            SqlTransaction tx,
            string customeridStr,
            string catelogId,
            int query,
            int idInt,
            string customeridParam)
        {
            using var cmd = new SqlCommand("Sp_Salesbill", con, tx)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@Id", idInt);
            cmd.Parameters.AddWithValue("@Userid", "");
            cmd.Parameters.AddWithValue("@Customerid", customeridParam);
            cmd.Parameters.AddWithValue("@Billdate", "");
            cmd.Parameters.AddWithValue("@Duedate", "");
            cmd.Parameters.AddWithValue("@Billno", "");
            cmd.Parameters.AddWithValue("@Amountsare", "");
            cmd.Parameters.AddWithValue("@Vatnumber", DBNull.Value);
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
            cmd.Parameters.AddWithValue("@Status", DBNull.Value);
            cmd.Parameters.AddWithValue("@Isdelete", DBNull.Value);
            cmd.Parameters.AddWithValue("@Type", DBNull.Value);
            cmd.Parameters.AddWithValue("@Terms", "");
            // Sp_Salesbill Q8/Q11 use SplitString(@Catelogid,','); null/empty can error in some DB versions — use default catalog.
            cmd.Parameters.AddWithValue("@Catelogid", string.IsNullOrWhiteSpace(catelogId) ? "1" : catelogId.Trim());
            cmd.Parameters.AddWithValue("@Contact", DBNull.Value);
            cmd.Parameters.AddWithValue("@Phoneno", DBNull.Value);
            cmd.Parameters.AddWithValue("@Shipping_address", DBNull.Value);
            cmd.Parameters.AddWithValue("@Remarks", DBNull.Value);
            cmd.Parameters.AddWithValue("@Salespersonname", DBNull.Value);
            cmd.Parameters.AddWithValue("@Discounttype", DBNull.Value);
            cmd.Parameters.AddWithValue("@Discountvalue", DBNull.Value);
            cmd.Parameters.AddWithValue("@Discountamount", DBNull.Value);
            cmd.Parameters.AddWithValue("@fromdate", DBNull.Value);
            cmd.Parameters.AddWithValue("@todate", DBNull.Value);
            cmd.Parameters.AddWithValue("@Newinvoicenocount", 0);
            cmd.Parameters.AddWithValue("@Newinvoiceno", DBNull.Value);
            cmd.Parameters.AddWithValue("@Salesquoteid", DBNull.Value);
            cmd.Parameters.AddWithValue("@Deliverstatus", DBNull.Value);
            cmd.Parameters.AddWithValue("@Query", query);

            var dt = new DataTable();
            using var da = new SqlDataAdapter(cmd);
            da.Fill(dt);
            return dt;
        }

        private static string ResolveCatelogId(SqlConnection con, SqlTransaction tx, string userid)
        {
            using var cmd = new SqlCommand(
                "SELECT TOP 1 Catelogid FROM Tbl_Registration WHERE Userid = @U OR CAST(Id AS VARCHAR(50)) = @U",
                con, tx);
            cmd.Parameters.AddWithValue("@U", userid);
            var o = cmd.ExecuteScalar();
            return o?.ToString() ?? "1";
        }

        private static int ResolveDecimalPlaces(SqlConnection con, SqlTransaction tx, string userid)
        {
            try
            {
                using var cmd = new SqlCommand(
                    "SELECT TOP 1 Decimalcount FROM Tbl_Registration WHERE Userid = @U OR CAST(Id AS VARCHAR(50)) = @U",
                    con, tx);
                cmd.Parameters.AddWithValue("@U", userid);
                var o = cmd.ExecuteScalar();
                if (o != null && o != DBNull.Value && int.TryParse(o.ToString(), out var n) && n >= 0 && n <= 8)
                    return n;
            }
            catch
            {
                // Tbl_Registration may not have Decimalcount in older schemas
            }
            return 2;
        }
    }

    public class OpeningBalancesRequest
    {
        public int[]? CustomerIds { get; set; }
    }

    public class CustomerModel
    {
        public int? id { get; set; }
        public string? userid { get; set; }
        public string? currency { get; set; }
        public string? title { get; set; }
        public string? firstname { get; set; }
        public string? middlename { get; set; }
        public string? lastname { get; set; }
        public string? suffix { get; set; }
        public string? customerdisplayname { get; set; }
        public string? companyname { get; set; }
        public string? email { get; set; }
        public string? phonenumber { get; set; }
        public string? mobilenumber { get; set; }
        public string? fax { get; set; }
        public string? other { get; set; }
        public string? website { get; set; }
        public string? streetaddress1 { get; set; }
        public string? streetaddress2 { get; set; }
        public string? city { get; set; }
        public string? province { get; set; }
        public string? postalcode { get; set; }
        public string? country { get; set; }
        public string? notes { get; set; }
        public string? attachments { get; set; }
        public string? paymentmethod { get; set; }
        public string? terms { get; set; }
        public string? deliveryoption { get; set; }
        public string? language { get; set; }
        public string? taxes { get; set; }
        public string? chartofaccountsid { get; set; }
        public decimal? openingbalance { get; set; }
        public string? asof { get; set; }
        public string? isdelete { get; set; }
        public string? status { get; set; }
        public string? warehouseid { get; set; }
        public int? isshared { get; set; }
        public string? customer_category { get; set; }
        public string? iscommission { get; set; }
        public string? expenseaccount { get; set; }
        public string? isreturncharges { get; set; }
        public string? expenseaccountreturncharges { get; set; }
        public string? packinglist_enabled { get; set; }
        public int? salespersonid { get; set; }
        public string? catelogid { get; set; } // For passing in catalog id if needed, though mostly for filtering
    }
}

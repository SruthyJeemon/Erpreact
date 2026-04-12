using Microsoft.Data.SqlClient;
using System.Data;

namespace Api;

/// <summary>
/// Shared logic for packing-list entry lines: Sp_Salesquotedetails Q8 + Sp_Inventory Q14 + Sp_Lockstock Q5.
/// </summary>
public static class PackingQuoteDetailsHelper
{
    public static async Task<(List<Dictionary<string, object?>> List, string Message)> LoadAsync(
        IConfiguration configuration,
        string? billid,
        CancellationToken cancellationToken = default)
    {
        var sales = new List<Dictionary<string, object?>>();
        var msg = "";

        if (string.IsNullOrWhiteSpace(billid))
            return (sales, "Bill ID is required");

        billid = billid.Trim();

        static string Cell(DataRow row, string col)
        {
            if (!row.Table.Columns.Contains(col)) return "";
            return row.IsNull(col) ? "" : row[col]?.ToString() ?? "";
        }

        try
        {
            var cs = configuration.GetConnectionString("DefaultConnection");
            if (string.IsNullOrWhiteSpace(cs))
                return (sales, "DefaultConnection is not configured");

            await using var con = new SqlConnection(cs);
            await con.OpenAsync(cancellationToken);

            using (var cmd = new SqlCommand("Sp_Salesquotedetails", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Id", "");
                cmd.Parameters.AddWithValue("@Userid", "");
                cmd.Parameters.AddWithValue("@Salesquoteid", billid);
                cmd.Parameters.AddWithValue("@Itemid", "");
                cmd.Parameters.AddWithValue("@Qty", "");
                cmd.Parameters.AddWithValue("@Amount", "");
                cmd.Parameters.AddWithValue("@Vat", "");
                cmd.Parameters.AddWithValue("@Vat_id", "");
                cmd.Parameters.AddWithValue("@Total", "");
                cmd.Parameters.AddWithValue("@Status", "");
                cmd.Parameters.AddWithValue("@Isdelete", "");
                cmd.Parameters.AddWithValue("@Query", 8);

                using var da = new SqlDataAdapter(cmd);
                var dt = new DataTable();
                da.Fill(dt);

                foreach (DataRow row in dt.Rows)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    var itemid = Cell(row, "Itemid");
                    var totalQty = "";
                    var lockstatus = "";

                    using (var cmdInv = new SqlCommand("Sp_Inventory", con))
                    {
                        cmdInv.CommandType = CommandType.StoredProcedure;
                        cmdInv.Parameters.AddWithValue("@Productvariantsid", itemid);
                        cmdInv.Parameters.AddWithValue("@Warehouse_status", "1");
                        cmdInv.Parameters.AddWithValue("@Isdelete", "0");
                        cmdInv.Parameters.AddWithValue("@Status", "Transit");
                        cmdInv.Parameters.AddWithValue("@Warehouseid", "1");
                        cmdInv.Parameters.AddWithValue("@Query", 14);
                        using var daInv = new SqlDataAdapter(cmdInv);
                        var dtInv = new DataTable();
                        daInv.Fill(dtInv);
                        if (dtInv.Rows.Count > 0 && dtInv.Columns.Contains("TotalQty"))
                            totalQty = dtInv.Rows[0]["TotalQty"]?.ToString() ?? "";
                    }

                    using (var cmdL = new SqlCommand("Sp_Lockstock", con))
                    {
                        cmdL.CommandType = CommandType.StoredProcedure;
                        cmdL.Parameters.AddWithValue("@Id", DBNull.Value);
                        cmdL.Parameters.AddWithValue("@Catelogid", DBNull.Value);
                        cmdL.Parameters.AddWithValue("@Lockstatus", DBNull.Value);
                        cmdL.Parameters.AddWithValue("@Isdelete", DBNull.Value);
                        cmdL.Parameters.AddWithValue("@Userid", DBNull.Value);
                        cmdL.Parameters.AddWithValue("@Lockdate", DBNull.Value);
                        cmdL.Parameters.AddWithValue("@Itemid", itemid);
                        cmdL.Parameters.AddWithValue("@Query", 5);
                        using var daL = new SqlDataAdapter(cmdL);
                        var dtL = new DataTable();
                        daL.Fill(dtL);
                        if (dtL.Rows.Count > 0 && dtL.Columns.Contains("Lockstatus"))
                            lockstatus = dtL.Rows[0]["Lockstatus"]?.ToString() ?? "";
                    }

                    sales.Add(new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["Id"] = Cell(row, "Id"),
                        ["Itemid"] = itemid,
                        ["Itemname"] = Cell(row, "Itemname"),
                        ["allvalues"] = Cell(row, "allvalues"),
                        ["Qty"] = Cell(row, "Qty"),
                        ["Amount"] = Cell(row, "Amount"),
                        ["Vat"] = Cell(row, "Vat"),
                        ["Vatid"] = Cell(row, "Vat_id"),
                        ["Total"] = Cell(row, "Total"),
                        ["Status"] = Cell(row, "Status"),
                        ["Modelno"] = Cell(row, "Modelno"),
                        ["Batchno"] = Cell(row, "Batchno"),
                        ["Type"] = Cell(row, "Type"),
                        ["Serialized"] = Cell(row, "Serialized"),
                        ["Serialno"] = Cell(row, "SerialNumbers"),
                        ["Description"] = Cell(row, "Shortdescription"),
                        ["DeliveredQty"] = Cell(row, "DeliveredQty"),
                        ["Totalqty"] = totalQty,
                        ["Lockstatus"] = lockstatus
                    });
                }
            }
        }
        catch (Exception ex)
        {
            msg = ex.Message;
            Console.WriteLine("PackingQuoteDetailsHelper: " + ex.Message);
        }

        return (sales, msg);
    }
}

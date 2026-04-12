using System.Data;
using Microsoft.Data.SqlClient;

namespace Api;

/// <summary>Legacy Finddispatchwarehouse / POST Sales/getdispatchwarehouseid.</summary>
public static class DispatchWarehouseHelper
{
    /// <summary>Sp_Stocklocation @Isdispatch=1, @Query=9 — first row Id (same as legacy Finddispatchwarehouse).</summary>
    public static async Task<string> GetDispatchWarehouseIdAsync(SqlConnection con, SqlTransaction? tx, CancellationToken ct = default)
    {
        try
        {
            await using var cmd = new SqlCommand("Sp_Stocklocation", con, tx)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@Isdispatch", "1");
            cmd.Parameters.AddWithValue("@Query", 9);

            var dt = new DataTable();
            await using (var reader = await cmd.ExecuteReaderAsync(ct))
            {
                dt.Load(reader);
            }

            if (dt.Rows.Count > 0)
            {
                foreach (var col in new[] { "Id", "id", "ID" })
                {
                    if (dt.Columns.Contains(col))
                    {
                        var v = dt.Rows[0][col]?.ToString();
                        if (!string.IsNullOrWhiteSpace(v))
                            return v!;
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Finddispatchwarehouse (Sp_Stocklocation Q9): {ex.Message}");
        }

        return "1";
    }

    /// <summary>Legacy [HttpPost] getdispatchwarehouseid → Json { dispatchid }.</summary>
    public static async Task<IResult> HandleGetDispatchWarehouseId(SqlConnection connection, CancellationToken ct)
    {
        try
        {
            if (connection.State != ConnectionState.Open)
                await connection.OpenAsync(ct);

            var dispatchid = await GetDispatchWarehouseIdAsync(connection, null, ct);
            return Results.Json(new { dispatchid });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"getdispatchwarehouseid: {ex.Message}");
            return Results.Json(new { dispatchid = "", error = ex.Message });
        }
    }
}

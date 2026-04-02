namespace Api.Models;

public class StockLocationResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<StockLocationData>? StockLocations { get; set; }
    public List<StockLocationData>? Data { get; set; } // Alternative property name for compatibility
}

public class StockLocationData
{
    public int Id { get; set; }
    public string? Warehouseid { get; set; }
    public string? Name { get; set; }
    public string? Type { get; set; }
    public string? Parentstockid { get; set; }
    public string? Locationaddress { get; set; }
    public string? Isdefault { get; set; }
    public string? Isdelete { get; set; }
    public string? Status { get; set; }
    public string? Isdispatch { get; set; }
}

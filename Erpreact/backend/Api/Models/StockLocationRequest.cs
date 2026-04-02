namespace Api.Models;

public class StockLocationRequest
{
    public int? Id { get; set; }
    public string? Warehouseid { get; set; }
    public string? Name { get; set; }
    public string? Type { get; set; }
    public string? Parentstockid { get; set; }
    public string? Locationaddress { get; set; }
    public string? Isdefault { get; set; }
    public string? Isdelete { get; set; }
    public string? Status { get; set; }
    public string? Isdispatch { get; set; }
    public int? FromId { get; set; }
    public int? ToId { get; set; }
    public int Query { get; set; } // 1=Insert, 2=Update, 3=SelectAll
}

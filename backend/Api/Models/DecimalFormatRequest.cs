namespace Api.Models;

public class DecimalFormatRequest
{
    public int? Id { get; set; }
    public string? Decimalformat { get; set; }
    public int? Decimalcount { get; set; }
    public string? Isdelete { get; set; }
    public string? Status { get; set; }
    public int Query { get; set; } // 1=Insert, 2=Update, 3=UpdateIsdelete, 4=SelectAll
}

namespace Api.Models;

public class BillFormatRequest
{
    public int? Id { get; set; }
    public string? Type { get; set; }
    public string? Format { get; set; }
    public string? Isdelete { get; set; }
    public string? Status { get; set; }
    public int Query { get; set; } // 1=Insert, 2=Update, 3=UpdateIsdelete, 4=SelectAll, 5=SelectByType
}

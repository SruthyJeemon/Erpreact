namespace Api.Models;

public class StockCheckRequest
{
    public int? Id { get; set; }
    public int? Catelogid { get; set; }
    public int? Status { get; set; }
    public int? Isdelete { get; set; }
    public int Query { get; set; } // 1=Insert, 2=Update, 3=Select All Active, 4=Delete, 5=Select Status by Catelogid
}

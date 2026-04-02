namespace Api.Models;

public class SalesReturnRequest
{
    public int? Id { get; set; }
    public string? Condition { get; set; }
    public string? Parentcondition { get; set; }
    public string? Isdelete { get; set; }
    public DateTime? Enterdate { get; set; }
    public int Query { get; set; } // 1=Insert, 2=Update, 3=Soft Delete, 4=Select All
}

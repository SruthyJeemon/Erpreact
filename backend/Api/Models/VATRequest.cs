namespace Api.Models;

public class VATRequest
{
    public int? Id { get; set; }
    public string? Vatname { get; set; }
    public string? Vatvalue { get; set; }
    public string? Aliasname { get; set; }
    public string? Description { get; set; }
    public string? Isdelete { get; set; }
    public string? Status { get; set; }
    public int Query { get; set; } // 1=Insert, 2=Update, 3=Select, 4=SelectByVatname
}

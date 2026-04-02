namespace Api.Models;

public class CatalogRequest
{
    public int? Id { get; set; }
    public string Catelogname { get; set; } = string.Empty;
    public int Isdelete { get; set; } = 0;
    public string Status { get; set; } = string.Empty;
    public int Query { get; set; } // 1=Insert, 2=Update, 3=SelectAll, 4=Delete
}

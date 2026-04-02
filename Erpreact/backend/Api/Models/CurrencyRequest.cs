namespace Api.Models;

public class CurrencyRequest
{
    public int? Id { get; set; }
    public string? Currency { get; set; }
    public string? Rate { get; set; }
    public int? Isdefault { get; set; }
    public string? Isdelete { get; set; }
    public string? Status { get; set; }
    public int Query { get; set; } // 1=Insert, 2=SelectActive, 3=Update, 4=SoftDelete, 5=SelectSpecific
}

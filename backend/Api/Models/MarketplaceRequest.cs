namespace Api.Models;

public class MarketplaceRequest
{
    public int? Id { get; set; }
    public string Marketplace { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int Query { get; set; } // 1=Insert, 2=Update, 3=SelectAll, 4=Delete, 5=Search
}
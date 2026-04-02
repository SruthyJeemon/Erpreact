namespace Api.Models;

public class MarketplaceResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<MarketplaceData>? Marketplaces { get; set; }
}

public class MarketplaceData
{
    public int Id { get; set; }
    public string Marketplace { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}
namespace Api.Models;

public class ProductVariantSearchRequest
{
    public string? CatelogId { get; set; }
    public string? ItemName { get; set; }
}

public class ProductVariantSearchResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<ProductVariantSearchResult>? List1 { get; set; }
}

public class ProductVariantSearchResult
{
    public int id { get; set; }
    public string? Itemname { get; set; }
    public string? allvalues { get; set; }
    public string? Type { get; set; }
}

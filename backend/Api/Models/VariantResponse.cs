namespace Api.Models;

public class VariantResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<VariantData>? Variants { get; set; }
    public List<string>? VariantNames { get; set; }
    public List<VariantTypeData>? VariantTypes { get; set; }
}

public class VariantData
{
    public int Id { get; set; }
    public string? Varinatname { get; set; }
    public string? Varianttype { get; set; }
    public string? Variantvalues { get; set; }
    public string? Status { get; set; }
}

public class VariantTypeData
{
    public string? Varianttype { get; set; }
    public string? Variantvalues { get; set; }
}

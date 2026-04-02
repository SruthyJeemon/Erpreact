namespace Api.Models;

public class VariantRequest
{
    public int? Id { get; set; }
    public string? Varinatname { get; set; } // Note: Keeping original typo from database
    public string? Varianttype { get; set; }
    public string? Variantvalues { get; set; }
    public string? Status { get; set; }
    public int Query { get; set; } = 3; // Default to Select All
}

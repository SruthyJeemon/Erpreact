namespace Api.Models;

public class CurrencyResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<CurrencyData>? Currencies { get; set; }
    public List<CurrencyData>? Data { get; set; } // Alternative property name for compatibility
    public CurrencyData? Currency { get; set; } // For Query = 5 (Select Specific)
}

public class CurrencyData
{
    public int Id { get; set; }
    public string? Currency { get; set; }
    public string? Rate { get; set; }
    public int? Isdefault { get; set; }
    public string? Isdelete { get; set; }
    public string? Status { get; set; }
}

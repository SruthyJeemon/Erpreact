namespace Api.Models;

public class DecimalFormatResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<DecimalFormatData>? DecimalFormats { get; set; }
    public List<DecimalFormatData>? Data { get; set; } // Alternative property name for compatibility
}

public class DecimalFormatData
{
    public int Id { get; set; }
    public string? Decimalformat { get; set; }
    public int? Decimalcount { get; set; }
    public string? Isdelete { get; set; }
    public string? Status { get; set; }
}

namespace Api.Models;

public class BillFormatResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<BillFormatData>? BillFormats { get; set; }
    public List<BillFormatData>? Data { get; set; } // Alternative property name for compatibility
    public string? Format { get; set; } // For Query = 5 (Select Format by Type)
}

public class BillFormatData
{
    public int Id { get; set; }
    public string? Type { get; set; }
    public string? Format { get; set; }
    public string? Isdelete { get; set; }
    public string? Status { get; set; }
}

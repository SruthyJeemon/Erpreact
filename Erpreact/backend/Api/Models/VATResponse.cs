namespace Api.Models;

public class VATResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<VATData>? Vats { get; set; }
    public List<VATData>? Data { get; set; } // Alternative property name for compatibility
    public string? Aliasname { get; set; } // For Query = 4 (Select Aliasname by Vatname)
}

public class VATData
{
    public int Id { get; set; }
    public string? Vatname { get; set; }
    public string? Vatvalue { get; set; }
    public string? Aliasname { get; set; }
    public string? Description { get; set; }
    public string? Isdelete { get; set; }
    public string? Status { get; set; }
}

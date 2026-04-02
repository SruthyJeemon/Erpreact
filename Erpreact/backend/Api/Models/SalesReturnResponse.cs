namespace Api.Models;

public class SalesReturnResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<SalesReturnData>? SalesReturns { get; set; }
    public List<SalesReturnData>? Data { get; set; } // Alternative property name for compatibility
}

public class SalesReturnData
{
    public int Id { get; set; }
    public string? Condition { get; set; }
    public string? Parentcondition { get; set; }
    public string? Parentconditionname { get; set; }
    public string? Isdelete { get; set; }
    public DateTime? Enterdate { get; set; }
}

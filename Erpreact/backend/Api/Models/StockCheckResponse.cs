namespace Api.Models;

public class StockCheckResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<StockCheckData>? StockChecks { get; set; }
    public List<StockCheckData>? Data { get; set; } // Alternative property name for compatibility
    public int? Status { get; set; } // For Query = 5 (Select Status by Catelogid)
}

public class StockCheckData
{
    public int Id { get; set; }
    public int? Catelogid { get; set; }
    public int? Status { get; set; }
    public int? Isdelete { get; set; }
}

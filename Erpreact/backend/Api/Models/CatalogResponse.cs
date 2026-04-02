namespace Api.Models;

public class CatalogResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<CatalogData>? Catalogs { get; set; }
    public List<CatalogData>? Data { get; set; } // Alternative property name for compatibility
}

public class CatalogData
{
    public int Id { get; set; }
    public string Catelogname { get; set; } = string.Empty;
    public int Isdelete { get; set; }
    public string Status { get; set; } = string.Empty;
}
